/**
 * Papéis do sistema — alinhados ao enum `UserRole` do Prisma e à matriz RBAC
 * (`@/shared/lib/rbac`). O seed cria usuários nos 5 papéis; mapear só ADMIN/USER
 * fazia a tela `/users` quebrar ao renderizar ANALYST/CREATOR/VIEWER
 * (issue cmqpbl53v00etpi0i0cv5spwm).
 */
export type UserRole = 'ADMIN' | 'ANALYST' | 'CREATOR' | 'VIEWER' | 'USER';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}
