import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatDateTime } from './utils';

describe('cn', () => {
  it('merges class names, deduping Tailwind conflicts', () => {
    // twMerge should keep the last conflicting utility (p-4 wins over p-2).
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});

describe('formatDate', () => {
  it('formats a Date in pt-BR as DD/MM/YYYY', () => {
    expect(formatDate(new Date('2026-06-16T00:00:00Z'))).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('accepts an ISO string', () => {
    expect(formatDate('2026-01-05T00:00:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe('formatDateTime', () => {
  it('formats a Date in pt-BR with time', () => {
    expect(formatDateTime(new Date('2026-06-16T00:00:00Z'))).toMatch(
      /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/,
    );
  });
});
