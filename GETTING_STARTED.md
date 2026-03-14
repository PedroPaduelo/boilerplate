# 🚀 Getting Started — Começo Rápido

Guia passo a passo para ter o boilerplate rodando em **5 minutos**.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker](https://www.docker.com/) e Docker Compose
- [Git](https://git-scm.com/)

---

## 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/boilerplate.git
cd boilerplate
```

---

## 2. Copie as variáveis de ambiente

```bash
cp .env.example .env
```

> **IMPORTANTE**: Edite o `.env` se quiser alterar portas ou senhas. Para desenvolvimento, os padrões funcionam.

---

## 3. Instale as dependências

```bash
make install
```

Isso instala pacotes do backend e frontend.

---

## 4. Suba os serviços (PostgreSQL + Redis + OpenSearch)

```bash
make services-up
```

Verifique se estão saudáveis:

```bash
docker compose ps
```

Todos devem mostrar `Status: running`.

---

## 5. Configure o banco de dados

```bash
make db-migrate   # aplica migrations
make db-seed      # cria usuários iniciais
```

---

## 6. Inicie o desenvolvimento

```bash
make dev
```

Isso roda **backend** (porta 4001) e **frontend** (porta 5173) simultaneamente.

---

## 7. Acesse

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| API Docs (Swagger) | http://localhost:4000/docs |
| Queues (Bull Board) | http://localhost:4000/queues |
| Health Check | http://localhost:4000/health |
| Prisma Studio | `make db-studio` → http://localhost:5555 |

---

## 👤 Usuários de Teste

| Email | Senha | Role |
|-------|-------|------|
| admin@boilerplate.com | admin123 | ADMIN |
| user@boilerplate.com | user123 | USER |

---

## Comandos Úteis

```bash
make dev-backend      # só backend
make dev-frontend     # só frontend
make db-reset         # CUIDADO: reseta o banco
make db-studio        # abre Prisma Studio
make test             # roda todos os testes
make lint             # verifica código
make services-down    # para os containers
```

---

## 📚 Documentação Completa

- `README.md` — visão geral
- `ARCHITECTURE.md` — arquitetura técnica detalhada
- `CONTRIBUTING.md` — como contribuir
- `docs/` — documentação interativa HTML

Para servir a documentação local:

```bash
cd docs
npx serve . -p 3001
```

Acesse: http://localhost:3001

---

## 🔧 Solução de Problemas

### Backend não sobe (porta em uso)
Mude a porta em `.env`:
```env
PORT=4002
```

### Docker não sobe
Verifique logs:
```bash
docker compose logs -f postgres
docker compose logs -f redis
```

### Erro de conexão DB
Certifique-se de que o PostgreSQL está rodando e `DATABASE_URL` está correta.

### Fala no seed
Rode manualmente:
```bash
cd backend-boilerplate
npx prisma db seed
```

---

## 🎉 Próximos Passos

1. Leia `ARCHITECTURE.md` para entender a arquitetura
2. Explore `docs/guides/` para detalhes por módulo
3. Veja `CONTRIBUTING.md` antes de fazer mudanças
4. Use `make` para automatizar tarefas

---

**Divirta-se construindo!** 🚀
