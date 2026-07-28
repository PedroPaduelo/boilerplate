import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import type { LoginInput, RegisterInput } from '../types';

/**
 * Falha de submit NÃO vira toast: o formulário renderiza um `Banner` a partir de
 * `isError`/`error` da mutation. Toast é para confirmação transitória (sucesso),
 * não para erro que o usuário precisa reler enquanto corrige o campo.
 */
export function useLogin() {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success('Login realizado com sucesso!');
      navigate('/users');
    },
  });
}

export function useRegister() {
  const toast = useAppToast();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success('Conta criada com sucesso!');
      navigate('/users');
    },
  });
}
