/**
 * Cliente HTTP DEDICADO da rota de impressão (T-J).
 *
 * Diferente do `apiClient` global (que lê o JWT do store de auth e faz
 * logout/redirect em 401), este cliente:
 *  - usa o TOKEN DE SERVIÇO recebido por query string como `Authorization`;
 *  - NÃO instala o interceptor de 401 (a página de impressão é headless e não
 *    deve redirecionar para `/login`).
 *
 * Mesma ideia do `publicClient` do módulo `share`.
 */
import axios, { type AxiosInstance } from 'axios';
import { env } from '@/shared/lib/env';

export function createPrintClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: env.API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}
