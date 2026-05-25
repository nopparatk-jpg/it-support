import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatDateTime, formatFileSize, formatCurrency } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2026-03-15');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });

  it('formats Date object', () => {
    const result = formatDate(new Date('2026-12-25'));
    expect(result).toContain('Dec');
    expect(result).toContain('25');
  });
});

describe('formatDateTime', () => {
  it('includes time', () => {
    const result = formatDateTime('2026-03-15T14:30:00Z');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('formatCurrency', () => {
  it('formats THB currency', () => {
    const result = formatCurrency(15000);
    expect(result).toContain('15,000');
    expect(result).toContain('THB');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});
