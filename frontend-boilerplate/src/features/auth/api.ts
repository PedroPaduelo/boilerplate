import { apiClient } from '@/shared/lib/api-client'
import type { AuthResponse, LoginInput, RegisterInput, User } from './types'

export const authApi = {
  login: async (input: LoginInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/sessions/password', input)
    return data
  },

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', input)
    return data
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/me')
    return data
  },
}
