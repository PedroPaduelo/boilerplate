import { AxiosError } from 'axios';

interface ApiErrorBody {
  message?: string;
  errors?: Array<{ message: string }>;
}

/**
 * Extrai uma mensagem de erro legível da resposta da API.
 * O back retorna `{ message }` para erros de domínio e
 * `{ message, errors: [{ message, path }] }` para erros de validação Zod.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Algo deu errado. Tente novamente.',
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (data?.errors?.length) {
      return data.errors.map((e) => e.message).join(', ');
    }
    if (data?.message) {
      return data.message;
    }
  }
  return fallback;
}
