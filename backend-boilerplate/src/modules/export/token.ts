/**
 * Token de SERVIÇO de curta duração (T-J) que autentica o navegador headless ao
 * abrir a rota `/print/dashboards/:id` do FE.
 *
 * É um JWT HS256 assinado com o MESMO `JWT_SECRET` da aplicação, então o
 * `request.jwtVerify()` do `@fastify/jwt` (usado pelo plugin `auth`) o aceita
 * normalmente nas rotas autenticadas (`GET /dashboards/:id`, `POST
 * /dashboards/:id/data`). Carrega `sub` (id do usuário que pediu o export) e
 * `role`, então a VISIBILIDADE/RBAC do dashboard é respeitada — o PDF vê só o
 * que o solicitante veria.
 *
 * NUNCA expõe credenciais longas: é emitido sob demanda, com expiração curta
 * (`EXPORT_TOKEN_TTL_SECONDS`, default 300s) e claim `purpose` para auditoria.
 */
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

export const EXPORT_TOKEN_PURPOSE = 'export-print';

export interface ServiceTokenClaims {
  sub: string;
  role: string;
  purpose: string;
  iat?: number;
  exp?: number;
}

/** Assina um token de serviço curto para o headless. */
export function signServiceToken(
  userId: string,
  role: string,
  ttlSeconds: number,
): string {
  return jwt.sign(
    { sub: userId, role, purpose: EXPORT_TOKEN_PURPOSE },
    env.JWT_SECRET,
    { expiresIn: ttlSeconds },
  );
}

/**
 * Verifica/decodifica um token de serviço (usado em teste e, opcionalmente, para
 * defesa em profundidade). Lança se inválido/expirado.
 */
export function verifyServiceToken(token: string): ServiceTokenClaims {
  return jwt.verify(token, env.JWT_SECRET) as ServiceTokenClaims;
}
