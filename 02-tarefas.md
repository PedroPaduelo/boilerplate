# 02-tarefas.md - Plano de Tarefas com Story Points e Dependências

## Visão Geral

| Métrica | Valor |
|---------|-------|
| **Total de Tarefas** | 12 |
| **Story Points Totais** | 55 |
| **Caminho Crítico** | FEAT-01 → FEAT-02 → FEAT-03 → FEAT-07 → TEST-01 |

---

## Tarefas

### FEAT-01: Docker Compose para Serviços Locais
| Atributo | Valor |
|----------|-------|
| **Descrição** | Criar docker-compose.yml com PostgreSQL e Redis locais |
| **Story Points** | 8 |
| **Prioridade** | P0 (Crítica) |
| **Arquivos** | `docker-compose.yml` (novo) |
| **Dependências** | - |

**Subtasks:**
- [ ] Configurar PostgreSQL 16 (porta 5432)
- [ ] Configurar Redis 7 (porta 6379)
- [ ] Adicionar volumes para persistência
- [ ] Configurar healthchecks
- [ ] Criar .env.docker.example
- [ ] Documentar comandos (docker-compose up -d)

**Critérios de Aceite:**
- `docker-compose up -d` sobe ambos os serviços
- `docker-compose ps` mostra serviços healthy
- Backend consegue conectar em ambos

---

### FEAT-02: Graceful Degradation para Redis
| Atributo | Valor |
|----------|-------|
| **Descrição** | Backend deve iniciar mesmo se Redis indisponível |
| **Story Points** | 5 |
| **Prioridade** | P0 (Crítica) |
| **Arquivos** | `src/server.ts`, `src/lib/redis/`, `src/services/jobs/worker/` |
| **Dependências** | - |

**Subtasks:**
- [ ] Wrappers de Redis com fallback (mock se offline)
- [ ] BullMQ Worker só inicia se Redis disponível
- [ ] Logger avisa quando Redis offline (modo degradado)
- [ ] Flag de feature para desabilitar caches

**Critérios de Aceite:**
- Backend sobe com Redis offline
- Aviso no startup: "⚠️ Redis offline - modo degradado"
- Rotas HTTP funcionam normalmente
- Worker só inicia se Redis conectado

---

### FEAT-03: Corrigir API URL no Frontend
| Atributo | Valor |
|----------|-------|
| **Descrição** | Alinhar porta da API entre frontend e backend |
| **Story Points** | 2 |
| **Prioridade** | P1 (Alta) |
| **Arquivos** | `frontend-boilerplate/src/shared/lib/api-client.ts` |
| **Dependências** | - |

**Subtasks:**
- [ ] Mudar `VITE_API_URL` de 8181 para 3333
- [ ] Atualizar .env.example
- [ ] Documentar porta padrão no README

**Critérios de Aceite:**
- Frontend aponta para porta 3333
- Login funciona em localhost

---

### FEAT-04: Configuração de Ambiente Unificada
| Atributo | Valor |
|----------|-------|
| **Descrição** | Centralizar configurações de ambiente em .env raiz |
| **Story Points** | 3 |
| **Prioridade** | P2 (Média) |
| **Arquivos** | `.env` (raiz), `docker-compose.yml` |
| **Dependências** | FEAT-01 |

**Subtasks:**
- [ ] Criar .env raiz com todas as vars
- [ ] Scripts para copiar vars para subdirs
- [ ] Atualizar .gitignore
- [ ] .env.example raiz completo

**Critérios de Aceite:**
- Um único .env controla tudo
- `npm run dev:backend` e `npm run dev:frontend` funcionam

---

### FEAT-05: Dashboard de Usuários
| Atributo | Valor |
|----------|-------|
| **Descrição** | Tabela de usuários com CRUD completo no frontend |
| **Story Points** | 8 |
| **Prioridade** | P2 (Média) |
| **Arquivos** | `frontend/src/features/users/` |
| **Dependências** | FEAT-02, FEAT-03 |

**Subtasks:**
- [ ] Página `/users` com tabela (shadcn Table)
- [ ] Busca e filtros (nome, email, role)
- [ ] Modal de criar/editar usuário
- [ ] Confirmação de delete (AlertDialog)
- [ ] Tratamento de erros com Sonner
- [ ] Loading states (Skeleton)

**Critérios de Aceite:**
- Listar todos os usuários
- Criar novo usuário
- Editar usuário existente
- Deletar usuário com confirmação
- Paginação se > 50 usuários

---

### FEAT-06: Monitoramento de Filas (Bull Board)
| Atributo | Valor |
|----------|-------|
| **Descrição** | Expor UI do Bull Board para monitorar filas |
| **Story Points** | 3 |
| **Prioridade** | P2 (Média) |
| **Arquivos** | `backend/src/server.ts`, `backend/src/routes/` |
| **Dependências** | FEAT-01 |

**Subtasks:**
- [ ] Configurar rota `/admin/queues`
- [ ] Adaptor para Fastify
- [ ] Proteger rota com JWT (role ADMIN only)
- [ ] Adicionar ao README

**Critérios de Aceite:**
- Acessível em `/admin/queues`
- Exibe fila `example-queue`
- Só admin acessa

---

### FEAT-07: Documentação de Setup (README)
| Atributo | Valor |
|----------|-------|
| **Descrição** | README completo com instruções de setup |
| **Story Points** | 3 |
| **Prioridade** | P1 (Alta) |
| **Arquivos** | `README.md` (novo) |
| **Dependências** | FEAT-01, FEAT-02, FEAT-03, FEAT-04 |

**Subtasks:**
- [ ] Pré-requisitos (Node, Docker)
- [ ] Setup inicial (docker-compose, npm install)
- [ ] Scripts de desenvolvimento
- [ ] Variáveis de ambiente
- [ ] Estrutura do projeto
- [ ] Comandos úteis

**Critérios de Aceite:**
- README claro e completo
- Dev novo consegue rodar o projeto

---

### REFACTOR-01: Tipos Compartilhados
| Atributo | Valor |
|----------|-------|
| **Descrição** | Extrair tipos TypeScript para pacote compartilhado |
| **Story Points** | 5 |
| **Prioridade** | P3 (Baixa) |
| **Arquivos** | `shared/` (novo), `backend/`, `frontend/` |
| **Dependências** | - |

**Subtasks:**
- [ ] Criar `packages/shared/` com tsconfig
- [ ] Mover tipos User, AuthResponse, etc.
- [ ] Configurar workspaces npm
- [ ] Atualizar imports em backend/frontend

**Critérios de Aceite:**
- Tipos importados de `@boilerplate/shared`
- Single source of truth para tipos

---

### REFACTOR-02: Tratamento de Erros Centralizado
| Atributo | Valor |
|----------|-------|
| **Descrição** | Padronizar tratamento de erros backend/frontend |
| **Story Points** | 3 |
| **Prioridade** | P3 (Baixa) |
| **Arquivos** | `backend/src/http/error-handler.ts`, `frontend/shared/lib/` |
| **Dependências** | - |

**Subtasks:**
- [ ] AppError no backend com códigos HTTP
- [ ] Interceptor Axios que traduz erros
- [ ] Toasts amigáveis no frontend
- [ ] Logging de erros no backend

**Critérios de Aceite:**
- Erros exibidos com mensagens claras
- Erros 500 mostram genérico para usuário
- Erros 401 redirecionam para login

---

### FIX-01: Porta Fixa do Backend (conflito 3333)
| Atributo | Valor |
|----------|-------|
| **Descrição** | Mover backend da porta 3333 para evitar conflitos |
| **Story Points** | 1 |
| **Prioridade** | P2 (Média) |
| **Arquivos** | `backend/.env`, `backend/Dockerfile` |
| **Dependências** | - |

**Subtasks:**
- [ ] Mudar porta padrão de 3333 para 4000
- [ ] Atualizar .env.example
- [ ] Atualizar Dockerfile EXPOSE
- [ ] Documentar nova porta

**Critérios de Aceite:**
- Backend sobe na porta 4000
- Sem conflitos com orquestrador

---

### FIX-02: CORS para Desenvolvimento
| Atributo | Valor |
|----------|-------|
| **Descrição** | Configurar CORS corretamente para frontend dev |
| **Story Points** | 2 |
| **Prioridade** | P1 (Alta) |
| **Arquivos** | `backend/src/server.ts` |
| **Dependências** | - |

**Subtasks:**
- [ ] Configurar @fastify/cors
- [ ] Permitir origin do Vite (porta 5173)
- [ ] Credentials suportado
- [ ] Variável de env para origins

**Critérios de Aceite:**
- Frontend consegue fazer requests
- Cookies funcionam se necessário

---

### TEST-01: Teste E2E do Fluxo de Autenticação
| Atributo | Valor |
|----------|-------|
| **Descrição** | Teste end-to-end do login → dashboard → logout |
| **Story Points** | 5 |
| **Prioridade** | P1 (Alta) |
| **Arquivos** | `tests/e2e/` (novo) |
| **Dependências** | FEAT-01, FEAT-02, FEAT-03, FEAT-07 |

**Subtasks:**
- [ ] Setup Playwright ou Cypress
- [ ] Teste de login com credenciais válidas
- [ ] Teste de login inválido
- [ ] Teste de acesso à rota protegida
- [ ] Teste de logout
- [ ] Teste de persistência de sessão

**Critérios de Aceite:**
- Todos os testes passam
- CI pode rodar os testes

---

## Dependências Visuais

```
FEAT-01 (Docker)
    ↓
FEAT-04 (Env Unificado)
    ↓
FEAT-06 (Bull Board)

FEAT-02 (Redis Graceful)
    ↓
FEAT-05 (Users Dashboard)
    ↓
TEST-01 (E2E Auth)

FEAT-03 (API URL)
    ↓
FEAT-05 (Users Dashboard)

FEAT-07 (README)
    ↓
TEST-01 (E2E Auth)

FIX-01 (Porta) ────→ FIX-02 (CORS)
                         ↓
                    FEAT-05 (Users Dashboard)

REFACTOR-01, REFACTOR-02 ── (paralelos, sem dependências)
```

---

## Roadmap de Execução

### Sprint 1 (Foundation) - 21 SP
- FEAT-01 (8) - Docker Compose
- FEAT-02 (5) - Graceful Redis
- FEAT-03 (2) - API URL
- FIX-01 (1) - Porta backend
- FIX-02 (2) - CORS
- FEAT-07 (3) - README

**Entrega:** Backend funcional localmente, documentado

### Sprint 2 (Features) - 19 SP
- FEAT-04 (3) - Env unificado
- FEAT-05 (8) - Dashboard usuários
- FEAT-06 (3) - Bull Board
- TEST-01 (5) - E2E Auth

**Entrega:** Frontend integrado, testes passando

### Sprint 3 (Refactor) - 8 SP
- REFACTOR-01 (5) - Tipos compartilhados
- REFACTOR-02 (3) - Erros centralizados

**Entrega:** Código mais limpo e manutenível

---

## Resumo

| Categoria | Tarefas | SP |
|-----------|---------|-----|
| FEAT (Features) | 7 | 32 |
| FIX (Bugfixes) | 2 | 3 |
| REFACTOR (Refatoração) | 2 | 8 |
| TEST (Testes) | 1 | 5 |
| **TOTAL** | **12** | **55** |

---

## Notas

- **Story Points** baseados em Fibonacci modificado (1, 2, 3, 5, 8, 13)
- **Tarefas P0** bloqueiam o funcionamento básico
- **Tarefas P1** são importantes mas não críticas
- **Tarefas P2/P3** podem ser adiadas para futuros sprints
