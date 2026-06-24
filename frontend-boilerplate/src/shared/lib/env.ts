import { z } from 'zod';

/**
 * Validacao central das variaveis de ambiente (import.meta.env).
 *
 * - Em DEV (npm run dev), se `VITE_API_URL` estiver ausente, usamos o fallback
 *   local (`:4000`) e avisamos no console — conveniência pra subir o FE
 *   rápido sem `.env` configurado.
 * - Em PROD (build do Vite), o `Dockerfile` GARANTE via fail-fast que
 *   `VITE_API_URL` veio definida como Build Argument. Se por algum motivo
 *   chegar vazia ou inválida no bundle, a inicialização falha de forma
 *   EXPLÍCITA em vez de cair silenciosamente para o localhost do navegador
 *   do usuário (que era o bug crítico de deploy).
 */
const DEFAULT_API_URL = 'http://localhost:4000';

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL precisa ser uma URL valida').optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  const message =
    `Variaveis de ambiente invalidas:\n${issues}\n\n` +
    `Em dev: copie \`.env.example\` para \`.env\` e ajuste os valores.\n` +
    `Em deploy (Docker/EasyPanel): defina o Build Argument ` +
    `VITE_API_URL=https://<url-publica-do-backend>`;
  // Falha clara em vez de comportamento silencioso.
  throw new Error(message);
}

let apiUrl = parsed.data.VITE_API_URL;

if (!apiUrl) {
  if (import.meta.env.DEV) {
    console.warn(
      `[env] VITE_API_URL nao definida. Usando fallback ${DEFAULT_API_URL}. ` +
        'Crie um arquivo .env a partir de .env.example para customizar.',
    );
    apiUrl = DEFAULT_API_URL;
  } else {
    // Em PROD, ausência de VITE_API_URL é sempre um erro de configuração.
    // O Dockerfile já bloqueia isso no build; este guard é uma rede de
    // segurança para builds fora do Docker (ex.: CI/npm run build direto).
    throw new Error(
      'VITE_API_URL nao foi definida no build de producao. ' +
        'Defina a Build Argument no EasyPanel/Docker apontando para a URL ' +
        'publica do backend (HTTPS, sem trailing slash).',
    );
  }
}

export const env = {
  API_URL: apiUrl,
} as const;
