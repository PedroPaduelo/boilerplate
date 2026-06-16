import { z } from 'zod'

/**
 * Validacao central das variaveis de ambiente (import.meta.env).
 *
 * - Se `VITE_API_URL` estiver ausente, usamos o fallback local (`:4000`) e
 *   avisamos claramente no console em dev.
 * - Se `VITE_API_URL` estiver presente porem invalida (ex.: string vazia ou
 *   nao-URL), a inicializacao falha de forma explicita.
 */
const DEFAULT_API_URL = 'http://localhost:4000'

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL precisa ser uma URL valida').optional(),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
  const message = `Variaveis de ambiente invalidas:\n${issues}\n\nCopie \`.env.example\` para \`.env\` e ajuste os valores.`
  // Falha clara em vez de comportamento silencioso.
  throw new Error(message)
}

let apiUrl = parsed.data.VITE_API_URL

if (!apiUrl) {
  if (import.meta.env.DEV) {
    console.warn(
      `[env] VITE_API_URL nao definida. Usando fallback ${DEFAULT_API_URL}. ` +
        'Crie um arquivo .env a partir de .env.example para customizar.'
    )
  }
  apiUrl = DEFAULT_API_URL
}

export const env = {
  API_URL: apiUrl,
} as const
