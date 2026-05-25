import { describe, it, expect } from 'vitest';
import { ApiError, errorResponse } from '@/lib/api-utils';

describe('ApiError', () => {
  it('creates error with status and message', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('errorResponse', () => {
  it('returns correct status for ApiError', async () => {
    const res = errorResponse(new ApiError(400, 'Bad request'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Bad request');
  });

  it('returns 500 for unknown errors', async () => {
    const res = errorResponse(new Error('unexpected'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 for non-Error objects', async () => {
    const res = errorResponse('string error');
    expect(res.status).toBe(500);
  });
});
