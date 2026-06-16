export type UserRole = 'admin' | 'user' | 'editor';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  page?: number;
  limit?: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
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
  role: UserRole;
  status: UserStatus;
}

export interface UpdateUserInput extends Partial<CreateUserInput> {
  id: string;
}
