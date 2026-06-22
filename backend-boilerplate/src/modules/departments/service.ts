/**
 * Regra de negócio do módulo `departments` (T-B1).
 *
 * CRUD de departamentos + gestão de membership (user × department). Erros de
 * domínio (slug duplicado, não encontrado, membership duplicada) são lançados
 * como erros HTTP (`@/http/routes/_errors`) e mapeados pelo error-handler.
 */
import { Prisma, type Department } from '@prisma/client';
import { BadRequestError, NotFoundError } from '@/http/routes/_errors';
import { prisma } from '@/lib/prisma';
import type { CreateDepartmentInput, UpdateDepartmentInput } from './schema';

const withCount = { _count: { select: { memberships: true } } } as const;

export interface ListDepartmentsParams {
  search?: string;
  page: number;
  pageSize: number;
}

export async function listDepartments({ search, page, pageSize }: ListDepartmentsParams) {
  const where: Prisma.DepartmentWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      include: withCount,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
    }),
    prisma.department.count({ where }),
  ]);

  return { departments, total };
}

export async function getDepartmentDetail(id: string) {
  const dep = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: { select: { memberships: true } },
      memberships: {
        include: { user: { select: { id: true, email: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!dep) throw new NotFoundError('Department not found');
  return dep;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  try {
    return await prisma.department.create({
      data: { name: input.name, slug: input.slug },
      include: withCount,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new BadRequestError(`A department with slug "${input.slug}" already exists`);
    }
    throw err;
  }
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput
): Promise<Department> {
  await ensureDepartmentExists(id);

  const data: Prisma.DepartmentUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;

  try {
    return await prisma.department.update({ where: { id }, data, include: withCount });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new BadRequestError(`A department with slug "${input.slug}" already exists`);
    }
    throw err;
  }
}

export async function deleteDepartment(id: string): Promise<void> {
  await ensureDepartmentExists(id);
  // memberships têm onDelete: Cascade no schema → removidas automaticamente.
  await prisma.department.delete({ where: { id } });
}

export async function listMembers(departmentId: string) {
  await ensureDepartmentExists(departmentId);
  return prisma.departmentMembership.findMany({
    where: { departmentId },
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addMember(departmentId: string, userId: string) {
  await ensureDepartmentExists(departmentId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  try {
    return await prisma.departmentMembership.create({
      data: { departmentId, userId },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new BadRequestError('User is already a member of this department');
    }
    throw err;
  }
}

export async function removeMember(departmentId: string, userId: string): Promise<void> {
  await ensureDepartmentExists(departmentId);
  const membership = await prisma.departmentMembership.findUnique({
    where: { userId_departmentId: { userId, departmentId } },
  });
  if (!membership) throw new NotFoundError('Membership not found');
  await prisma.departmentMembership.delete({ where: { id: membership.id } });
}

async function ensureDepartmentExists(id: string): Promise<void> {
  const dep = await prisma.department.findUnique({ where: { id }, select: { id: true } });
  if (!dep) throw new NotFoundError('Department not found');
}
