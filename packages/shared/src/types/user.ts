import { z } from 'zod';

export const UserRoleEnum = z.enum(['USER', 'ADMIN']);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(3).max(100),
  role: UserRoleEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type User = z.output<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.omit({ email: true });
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
