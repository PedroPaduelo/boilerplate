export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
