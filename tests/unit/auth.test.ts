import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock env before importing auth
vi.mock('@/lib/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-testing',
    MONGODB_URI: 'mongodb://localhost/test',
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock mongodb
vi.mock('@/lib/mongodb', () => ({
  connectDB: vi.fn(),
}));

// Mock User model
vi.mock('@/models/User', () => ({
  User: { findById: vi.fn() },
}));

import { hashPassword, verifyPassword, signToken, verifyToken } from '@/lib/auth';

describe('hashPassword / verifyPassword', () => {
  it('hashes and verifies correctly', async () => {
    const password = 'MyS3cureP@ss';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);

    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const valid = await verifyPassword('wrong-password', hash);
    expect(valid).toBe(false);
  });
});

describe('signToken / verifyToken', () => {
  it('creates and verifies JWT', () => {
    const payload = { userId: '123', email: 'test@test.com', role: 'admin' as const };
    const token = signToken(payload);

    expect(token).toBeTruthy();
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('123');
    expect(decoded.email).toBe('test@test.com');
    expect(decoded.role).toBe('admin');
  });

  it('throws on invalid token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow();
  });

  it('throws on expired token', () => {
    // Manually create an expired token
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign(
      { userId: '1', email: 'x@x.com', role: 'admin' },
      'test-secret-key-for-testing',
      { expiresIn: '-1s' },
    );
    expect(() => verifyToken(expired)).toThrow();
  });
});
