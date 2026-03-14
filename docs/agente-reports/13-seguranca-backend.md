# Relatório de Segurança Backend

Data: 2026-03-14

## 1) auth.ts (JWT verification)

### O que faz
- Middleware Fastify plugin (`fastify-plugin`) que adiciona hooks em `preHandler`.
- Estende `FastifyRequest` com métodos auxiliares:
  - `getCurrentUserId(): Promise<string>`
  - `getCurrentUserRole(): Promise<string>`
- Usa `request.jwtVerify<{ sub: string }>()` e `request.jwtVerify<{ sub: string; role?: string }>()` para verificar o token JWT no cabeçalho `Authorization: Bearer`.
- Em caso de falha, lança `UnauthorizedError('Invalid or expired token')`.

### Observações de segurança
- Verificação de assinatura e validade do token é feita pela plugin `@fastify/jwt` no request.
- Método `getCurrentUserRole` devolve `USER` quando `role` ausente.
- O middleware registra as funções no request, mas não impede rotas sem `auth` de serem chamadas.

### Pontos de melhoria potenciais
- Validar explicitamente `alg` ou `aud`/`iss` claims (não está presente).
- Definir tempo de expiração de token no login (`expiresIn: '1h'` já existe no route de login).
- Considerar verificação de token revogado/blacklist (não implementado).

## 2) auth-socket.ts (WebSocket auth)

### O que faz
- Função `authenticate(socket, next)` para Socket.IO.
- Lê token de `socket.handshake.auth.token`.
- Se ausente, chama `next(new Error('Authentication token required'))`.
- Verifica token com `jwt.verify(token, env.JWT_SECRET)` usando `jsonwebtoken`.
- Armazena `decoded.sub` em `(socket as any).user_id`.
- Em caso de erro, chama `next(new Error('Invalid or expired token'))`.

### Observações de segurança
- Usa secret central `env.JWT_SECRET`.
- Não verifica `exp` explicitamente porque `jwt.verify` lida com isso.
- Token é recebido via handshake auth, o que é adequado para Socket.IO (evita query strings ineguras).

### Pontos de melhoria
- Adicionar validação de payload `sub` e possivelmente `role` para garantir formato esperado.
- Considerar uso de token em `Authorization` no handshake para consistência com HTTP.
- Validar origem de socket (já feito no setupSocketIO CORS restringido).

## 3) Validações Zod

### Onde está usado
- `fastify-type-provider-zod` para inputs e respostas (`body`, `params`, `response` etc.).
- Rotas principais: `/auth/login`, `/users`, `/users/:id`, `/search/*` etc.
- Schema de ambiente (`src/lib/env.ts`) também usa Zod para validação de variáveis de ambiente.

### Exemplo de validação relevante
- Login: `email` deve ser email válido, `password` mínimo 6.
- Criação de usuário: `name` mínimo 1, `email` email válido, `password` mínimo 6, `role` enum `['ADMIN', 'USER']`.
- Atualização de usuário: campos opcionais com validação de formato.

### Observações de segurança
- Validação de payload forte em rotas user/auth.
- Redução de risco de schema poisoning e injeção porque as rotas definem tipos claros.

### Gaps
- Não há validação de sanitização adicional (ex.: HTML/JS em strings) — mas Zod valida tipo e limites.
- Em alguns endpoints, `response` schema está definido para documentação e validação; em outros, pode faltar.

## 4) Error handler

### Implementação
- `errorHandler` em `src/http/error-handler.ts` configurado no app com `app.setErrorHandler(errorHandler)`.
- Reconhece:
  - Erros Fastify/Zod de validação (`hasZodFastifySchemaValidationErrors`) → 400 com lista de erros.
  - `ZodError` → 422 com `fromZodError`.
  - `BadRequestError` → 400.
  - `UnauthorizedError` → 401.
  - `ForbiddenError` → 403.
  - `NotFoundError` → 404.
- Para erros não tratados:
  - Em dev, log completo incluindo stack.
  - Em produção, log minimalista com timestamp/nome/mensagem.
  - Retorna 500 genérico com `Internal server error`.

### Observações de segurança
- Evita vazamento de dados sensíveis em produção.
- Tratamento de erros de validação é claro e consistente.

### Recomendações
- Implementar ID de correlação de requisição (request-id) para rastreio em logs.
- Assegurar que nenhum stack trace excedente chegue ao cliente em produção.

## 5) Rate limiting, CORS, Helmet

### Rate limiting
- Registrado globalmente com `fastifyRateLimit`:
  - `max: 100`, `timeWindow: '1 minute'`.
  - Usa Redis se disponível (`redisAvailable ? app.redis : undefined`).
  - `keyGenerator` retorna `request.ip`.

### CORS
- `fastifyCors` config:
  - `origin` restrito por `env.CORS_ORIGINS` ou lista local em dev.
  - `credentials: true`.
  - `methods` explicitados.
- Setup de Socket.IO também aplica CORS com mesma origem.

### Helmet
- `fastifyHelmet` configurado com CSP e outros headers:
  - `defaultSrc 'self'`.
  - `styleSrc 'self' 'unsafe-inline'`.
  - `scriptSrc 'self'`.
  - `imgSrc 'self' data: https:`.
  - HSTS com 1 ano, includeSubDomains, preload.
  - Frameguard deny.
  - DNS prefetch disable.

### Observações de segurança
- Boa base de hardening de headers.
- Rate limit global ajuda mitigação de ataques bruteforce.
- CORS restrito garante que origens não autorizadas são bloqueadas.

### Pontos de melhoria
- `keyGenerator` poderia usar user ID quando autenticado para evitar abuso por IP atrás de proxy.
- CSP pode ser mais restrito dependendo de recursos externos.
- Avaliar proteção contra HTTP parameter pollution e checagem de `X-Forwarded-For` quando rodando atrás de proxy.

## 6) Upload security

### Configuração de upload
- Fastify Multipart registrado com limites:
  - `fileSize: env.MAX_FILE_SIZE` (100MB por padrão).
  - `files: 5`, `fields: 50`.
- `fastifyStatic` serve arquivos de `uploadDir` (configurado via `env.UPLOAD_DIR` ou `./uploads`) com prefixo `/uploads/`.

### Observações de segurança
- Limite de tamanho e contagem de arquivos mitigam DoS por envio massivo.
- Uploads servidos estático em diretório controlado.

### Riscos e melhorias
- Não há validação de tipo MIME/nome de arquivo no código mostrado (uso geral de `fastify-multipart` sem `onFile` validação). Se houver endpoints que processam upload, eles precisam verificar tipo e extensão.
- Servir upload estático pode expor arquivos de usuário; considerar controle de acesso ou rename para arquivos não executáveis.
- Proteção adicional: `app.register(fastifyStatic, { serve: false })` e entregar via rota autenticada se necessário.
- Evitar upload path traversal com nome de arquivo gerenciado.

## 7) Conclusão final

A implementação atual já cobre várias camadas de segurança:
- Autenticação JWT nos HTTP endpoints e no Socket.IO.
- Validação de entrada forte com Zod.
- Manipulação de erros com classes customizadas e respostas padronizadas.
- Hardening de headers com Helmet, CORS restrito e rate limiting.
- Uploads com limites de tamanho e quantidade.

Recomendações prioritárias para produção:
1. Verificar e rotacionar `JWT_SECRET` forte e configurar `expiresIn`/refresh tokens.
2. Adicionar verificação de token revogado para sessões críticas (logout, bloqueio).
3. Garantir que rotas de upload validem MIME e extensões.
4. Adicionar monitoramento/alertas em erros 401/429/500 para detecção de ataques.
5. Revisar CSP para recursos de frontend reais.

---

Arquivos analisados:
- `/backend-boilerplate/src/middlewares/auth.ts`
- `/backend-boilerplate/src/middlewares/auth-socket.ts`
- `/backend-boilerplate/src/server.ts`
- `/backend-boilerplate/src/http/error-handler.ts`
- `/backend-boilerplate/src/http/routes/auth/authenticate.ts`
- `/backend-boilerplate/src/http/routes/user/create-user.ts`
- `/backend-boilerplate/src/socket.ts`
- `/backend-boilerplate/src/lib/env.ts`
