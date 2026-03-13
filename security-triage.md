# Relatório de Triagem de Segurança

**Data da Auditoria:** 2026-03-11
**Projeto:** Backend + Frontend Boilerplate
**Tipo:** Auditoria de Segurança Completa (SAST + SCA + Config)

---

## Resumo Executivo

| Severidade | Quantidade |
|------------|------------|
| **Critical** | 2 |
| **High** | 9 |
| **Medium** | 6 |
| **Low** | 2 |
| **Total** | 19 |

---

## 1. Vulnerabilidades de Dependências (SCA)

### Backend (npm audit)

| # | Vulnerabilidade | Severidade | Dependência | CVE | Descrição |
|---|----------------|------------|-------------|-----|------------|
| 1 | Axios DoS via __proto__ | **High** | axios >=1.0.0 <=1.13.4 | GHSA-43fc-jf86-j433 | Vulnerabilidade DoS via chave __proto__ em mergeConfig |
| 2 | Fastify Content-Type Bypass | **High** | fastify <=5.7.2 | GHSA-jx2c-rxcm-jvmq | Caractere tab no Content-Type permite bypass de validação |
| 3 | Fastify DoS Memória | Low | fastify <=5.7.2 | GHSA-mrq3-vjjr-p77c | Alocação de memória ilimitada em sendWebStream |
| 4 | minimatch ReDoS | **High** | minimatch 5.0.0-5.1.7, 10.0.0-10.2.2 | GHSA-7r86-cg39-jmmj | ReDoS via segmentação GLOBSTAR não adjacente |
| 5 | @isaacs/brace-expansion DoS | **High** | <=5.0.0 | GHSA-7h2j-956f-4vf2 | Consumo irrestrito de recursos |
| 6 | rollup Arbitrary File Write | **High** | 4.0.0-4.58.0 | GHSA-mw96-cpmx-2vgc | Arbitrary File Write via Path Traversal |
| 7 | ajv ReDoS | Medium | >=7.0.0-alpha.0 <8.18.0 | GHSA-2g4f-4pwh-qvx6 | ReDoS ao usar opção $data |
| 8 | lodash Prototype Pollution | Medium | 4.0.0-4.17.21 | GHSA-xxjr-mmjv-4gpg | Prototype Pollution em _.unset e _.omit |
| 9 | bn.js Infinite Loop | Moderate | <4.12.3 | GHSA-378v-28hj-76wf | Loop infinito em bn.js |

### Frontend (npm audit)

| # | Vulnerabilidade | Severidade | Dependência | CVE | Descrição |
|---|----------------|------------|-------------|-----|------------|
| 10 | Axios DoS | **High** | axios >=1.0.0 <=1.13.4 | GHSA-43fc-jf86-j433 | Mesma vulnerabilidade do backend |
| 11 | minimatch ReDoS | **High** | <3.1.3, 9.0.0-9.0.6 | GHSA-7r86-cg39-jmmj | ReDoS via pattern matching |
| 12 | ajv ReDoS | Medium | <6.14.0 | GHSA-2g4f-4pwh-qvx6 | ReDoS via $data option |
| 13 | markdown-it ReDoS | Moderate | 13.0.0-14.1.0 | GHSA-38c4-r59v-3vqw | Regular Expression DoS |

---

## 2. Vulnerabilidades de Código (SAST) e Configuração

### A01 - Broken Access Control (IDOR)

| # | Vulnerabilidade | Severidade | Arquivo | Linha | Descrição |
|---|----------------|------------|---------|-------|------------|
| 14 | IDOR - Qualquer usuário pode alterar outro | **Critical** | `backend-boilerplate/src/http/routes/user/update-user.ts` | 44-86 | Usuário pode alterar dados de qualquer ID sem verificar se é o próprio |
| 15 | IDOR - Qualquer usuário pode excluir outro | **Critical** | `backend-boilerplate/src/http/routes/user/delete-user.ts` | 28-44 | Usuário pode excluir qualquer conta sem autorização |
| 16 | IDOR - Qualquer usuário pode ver dados de outro | **High** | `backend-boilerplate/src/http/routes/user/get-user.ts` | 38-58 | Endpoint não verifica se o solicitante é o próprio usuário |

### A02 - Cryptographic Failures

| # | Vulnerabilidade | Severidade | Arquivo | Linha | Descrição |
|---|----------------|------------|---------|-------|------------|
| 17 | Hardcoded Secrets (pré-existente) | **Critical** | `.env` | - | Secrets hardcoded no .env |

### A05 - Security Misconfiguration

| # | Vulnerabilidade | Severidade | Arquivo | Linha | Descrição |
|---|----------------|------------|---------|-------|------------|
| 18 | CORS permitir_origens | **High** | `backend-boilerplate/src/server.ts` | 95-98 | `origin: true` permite qualquer origem |
| 19 | Socket.IO CORS aberto | **High** | `backend-boilerplate/src/socket.ts` | 12-15 | `origin: '*'` permite conexões de qualquer origem |
| 20 | Swagger exposto em produção | Medium | `backend-boilerplate/src/server.ts` | 122-146 | Documentação API disponível publicamente |
| 21 | Sem rate limiting | Medium | `backend-boilerplate/src/server.ts` | - | Nenhum limite de requisições |
| 22 | Sem helmet headers | Low | `backend-boilerplate/src/server.ts` | - | Headers de segurança ausentes |
| 23 | pageSize sem limite | Medium | `list-users.ts` | 20-21 | Pode causar DoS com valores grandes |

---

## 3. Análise de Autenticação e Autorização

### JWT
- **Expiração:** 7 dias (`expiresIn: '7d'`) - **ACEITÁVEL** para aplicação web
- **Algoritmo:** HS256 (via @fastify/jwt) - seguro para aplicações monolito
- **Validação:** Implementada corretamente no middleware auth

### Problemas Identificados
1. **Ausência de verificação de propriedade (IDOR)** - Usuários podem manipular endpoints de outros usuários
2. **Qualquer usuário pode criar admin** - `create-user.ts` linha 25 permite role ADMIN
3. **Nenhum rate limiting** - Vulnerável a brute force

---

## 4. Recomendações Priorizadas

### PRIORIDADE CRÍTICA (Corrigir Imediatamente)

| # | Ação | Arquivo | Comando |
|---|------|---------|---------|
| 1 | Corrigir IDOR em update-user.ts | `update-user.ts` | Adicionar verificação: `if (currentUserId !== userId && !isAdmin) throw new ForbiddenError()` |
| 2 | Corrigir IDOR em delete-user.ts | `delete-user.ts` | Mesmo tratamento |
| 3 | Atualizar axios | Ambos | `npm update axios@>=1.13.5` |
| 4 | Remover secrets do .env | `.env` | Usar variáveis de ambiente reais em produção |

### PRIORIDADE ALTA

| # | Ação | Comando |
|---|------|---------|
| 5 | Configurar CORS corretamente | `origin: ['https://seudominio.com']` em server.ts e socket.ts |
| 6 | Corrigir minimatch | `npm update` |
| 7 | Corrigir rollup | `npm install rollup@>=4.59.0` |
| 8 | Adicionar rate limiting | `npm install @fastify/rate-limit` |

### PRIORIDADE MÉDIA

| # | Ação |
|---|------|
| 9 | Desabilitar Swagger em produção: `if (process.env.NODE_ENV !== 'production')` |
| 10 | Adicionar helmet: `npm install @fastify/helmet` |
| 11 | Limitar pageSize: `z.coerce.number().min(1).max(100).default(10)` |

---

## 5. Resumo de Riscos por OWASP Top 10

| Categoria OWASP | Status | Qtd |
|-----------------|--------|-----|
| A01 - Broken Access Control | **CRÍTICO** | 5 |
| A02 - Cryptographic Failures | **ALTO** | 1 |
| A03 - Injection | ✅ PROTEGIDO | 0 |
| A04 - Insecure Design | **ALTO** | 2 |
| A05 - Security Misconfig | **MÉDIO** | 4 |
| A06 - Vulnerable Components | **CRÍTICO** | 13 |
| A07 - Auth Failures | **ALTO** | 1 |
| A08 - Data Integrity | ✅ OK | 0 |
| A09 - Logging | **BAIXO** | 1 |
| A10 - SSRF | ✅ PROTEGIDO | 0 |

---

## 6. Comandos para Correção

```bash
# Backend - Atualizar dependências
cd backend-boilerplate
npm install axios@latest minimatch@latest rollup@latest

# Backend - Adicionar rate limiting
npm install @fastify/rate-limit @fastify/helmet

# Frontend - Atualizar dependências
cd ../frontend-boilerplate
npm install axios@latest
```

---

**Gerado por:** Serendipd Security Scanner
**Versão:** 2.0 - Análise Completa
**Data:** 2026-03-11
