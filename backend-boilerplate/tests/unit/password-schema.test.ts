import { passwordSchema } from '@/lib/validators/password';

describe('passwordSchema', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Ab1');
    expect(result.success).toBe(false);
  });

  it('rejects passwords with no letters', () => {
    const result = passwordSchema.safeParse('12345678');
    expect(result.success).toBe(false);
  });

  it('rejects passwords with no numbers', () => {
    const result = passwordSchema.safeParse('abcdefgh');
    expect(result.success).toBe(false);
  });

  it('accepts a strong password (>= 8 chars, with letter and number)', () => {
    const result = passwordSchema.safeParse('Strong123');
    expect(result.success).toBe(true);
  });
});
