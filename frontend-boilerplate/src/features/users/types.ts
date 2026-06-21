export type UserRole = 'ADMIN' | 'USER';

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
