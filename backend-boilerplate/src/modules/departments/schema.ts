/**
 * Schemas Zod (v3) e serialização do módulo `departments` (T-B1).
 *
 * Os contratos compartilhados (@dashboards/contracts) não definem DTO de
 * Department/Membership — schemas de request/response são locais ao módulo
 * (mesma decisão da Fase 0 adotada por `connections`).
 */
import type { Department, DepartmentMembership, User } from '@prisma/client';
import { z } from 'zod';

/** slug: minúsculas, números e hífens (kebab-case). */
const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case (a-z, 0-9, -)');

export const departmentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  memberCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const memberResponseSchema = z.object({
  membershipId: z.string(),
  userId: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: z.string(),
  addedAt: z.date(),
});

export const createDepartmentBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema,
});

export const updateDepartmentBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    slug: slugSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'at least one field must be provided',
  });

export const addMemberBodySchema = z.object({
  userId: z.string().min(1),
});

export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const listDepartmentsResponseSchema = z.object({
  departments: z.array(departmentResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const departmentDetailResponseSchema = departmentResponseSchema.extend({
  members: z.array(memberResponseSchema),
});

export const listMembersResponseSchema = z.object({
  members: z.array(memberResponseSchema),
});

export const idParamSchema = z.object({ id: z.string().min(1) });
export const memberParamSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentBodySchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentBodySchema>;

/** Department + contagem de membros (via `_count`). */
type DepartmentWithCount = Department & { _count?: { memberships: number } };

export function serializeDepartment(dep: DepartmentWithCount) {
  return {
    id: dep.id,
    name: dep.name,
    slug: dep.slug,
    memberCount: dep._count?.memberships ?? 0,
    createdAt: dep.createdAt,
    updatedAt: dep.updatedAt,
  };
}

/** Membership + dados do usuário (via include). */
type MembershipWithUser = DepartmentMembership & {
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
};

export function serializeMember(m: MembershipWithUser) {
  return {
    membershipId: m.id,
    userId: m.user.id,
    email: m.user.email,
    name: m.user.name,
    role: m.user.role,
    addedAt: m.createdAt,
  };
}
