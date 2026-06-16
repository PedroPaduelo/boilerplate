import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '../api'
import { useAuthStore } from '../store'
import type { LoginInput, RegisterInput } from '../types'

export function useLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast.success('Login realizado com sucesso!')
      navigate('/users')
    },
    onError: () => {
      toast.error('Email ou senha invalidos')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast.success('Conta criada com sucesso!')
      navigate('/users')
    },
    onError: () => {
      toast.error('Erro ao criar conta')
    },
  })
}

export function useCurrentUser() {
  const { token, setUser } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authApi.getMe()
      setUser(user)
      return user
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}
