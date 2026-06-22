import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from './env';
import { useAuthStore } from '@/features/auth/store';

export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Caminhos onde um 401 NÃO deve forçar redirect para /login (evita loop). */
const PUBLIC_PATH_PREFIXES = ['/login', '/register', '/public/'];

function isOnPublicPath(): boolean {
  if (typeof window === 'undefined') return true;
  const path = window.location.pathname;
  return PUBLIC_PATH_PREFIXES.some((p) => path === p || path.startsWith(p));
}

/**
 * Interceptor de REQUEST: anexa o JWT do store de auth (fonte única de verdade).
 * Exportado para teste unitário (sem precisar de um servidor real).
 */
export function attachAuthToken(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

/**
 * Interceptor de RESPONSE (erro): em 401 (token expirado/inválido) faz logout e,
 * salvo se já estivermos numa rota pública, redireciona para /login.
 *
 * Não há endpoint de refresh no backend (sessão é JWT stateless) — a estratégia
 * de "expiração tratada" é: limpar o estado de auth e mandar reautenticar. Se um
 * refresh for adicionado no futuro, este é o ponto de extensão.
 */
export function handleResponseError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined' && !isOnPublicPath()) {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
}

apiClient.interceptors.request.use(attachAuthToken);
apiClient.interceptors.response.use((response) => response, handleResponseError);
