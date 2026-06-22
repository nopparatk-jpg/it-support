import { describe, it, expect } from 'vitest';
import { buildPhotoUrl, extractFileId } from '@/lib/google-drive';

describe('buildPhotoUrl', () => {
  it('builds an embeddable thumbnail url', () => {
    expect(buildPhotoUrl('ABC123')).toBe(
      'https://drive.google.com/thumbnail?id=ABC123&sz=w1920',
    );
  });
});

describe('extractFileId', () => {
  it('extracts the id from a generated url', () => {
    expect(
      extractFileId('https://drive.google.com/thumbnail?id=ABC123&sz=w1920'),
    ).toBe('ABC123');
  });

  it('returns null when there is no id param', () => {
    expect(extractFileId('https://example.com/foo')).toBeNull();
  });
});
