import z from 'zod';

/**
 * Shared password policy used across auth/user creation flows.
 *
 * Rules:
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 *
 * Keep this as the single source of truth so the policy stays consistent
 * between register and admin user management routes.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
