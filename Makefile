# Makefile Profissional - Boilerplate Fullstack
# Backend: Fastify + Prisma + Redis + BullMQ + Socket.IO (porta 4001)
# Frontend: React + Vite + TailwindCSS (porta 5173)
# Servicos: PostgreSQL, Redis, OpenSearch (docker-compose.yml)

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Cores ANSI para output formatado
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
MAGENTA := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
BOLD := \033[1m
RESET := \033[0m

# Diretorios
BACKEND_DIR := backend-boilerplate
FRONTEND_DIR := frontend-boilerplate
ROOT_DIR := $(shell pwd)

# Verificacao de existencia
BACKEND_EXISTS := $(shell test -d "$(BACKEND_DIR)" && echo "yes" || echo "no")
FRONTEND_EXISTS := $(shell test -d "$(FRONTEND_DIR)" && echo "yes" || echo "no")
DOCKER_COMPOSE_EXISTS := $(shell test -f "docker-compose.yml" && echo "yes" || echo "no")

.ONESHELL:
.PHONY: help install dev dev-backend dev-frontend services-up services-down \
        db-migrate db-push db-seed db-studio db-reset \
        build build-backend build-frontend \
        test test-backend test-frontend lint lint-fix \
        clean clean-all start logs

## @help: show this help message
help:
	@echo "$(BOLD)$(CYAN)╔══════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(BOLD)$(CYAN)║         BOILERPLATE FULLSTACK - MAKE COMMANDS              ║$(RESET)"
	@echo "$(BOLD)$(CYAN)╚══════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(BOLD)$(GREEN)📦 Instalação:$(RESET)"
	@echo "  $(YELLOW)make install$(RESET)           Instala dependências do backend e frontend"
	@echo ""
	@echo "$(BOLD)$(GREEN)🚀 Desenvolvimento:$(RESET)"
	@echo "  $(YELLOW)make dev$(RESET)               Roda backend + frontend em paralelo"
	@echo "  $(YELLOW)make dev-backend$(RESET)       Roda apenas o backend (porta 4001)"
	@echo "  $(YELLOW)make dev-frontend$(RESET)      Roda apenas o frontend (porta 5173)"
	@echo "  $(YELLOW)make services-up$(RESET)       sobe PostgreSQL, Redis, OpenSearch"
	@echo "  $(YELLOW)make services-down$(RESET)     para PostgreSQL, Redis, OpenSearch"
	@echo ""
	@echo "$(BOLD)$(GREEN)🗄️  Banco de Dados (Prisma):$(RESET)"
	@echo "  $(YELLOW)make db-migrate$(RESET)        executa migracoes do banco"
	@echo "  $(YELLOW)make db-push$(RESET)           sincroniza schema com o banco"
	@echo "  $(YELLOW)make db-seed$(RESET)           popula banco com dados iniciais"
	@echo "  $(YELLOW)make db-studio$(RESET)         abre Prisma Studio (admin DB)"
	@echo "  $(YELLOW)make db-reset$(RESET)          ⚠️  DROP e recria o banco (CUIDADO!)"
	@echo ""
	@echo "$(BOLD)$(GREEN)🔨 Build:$(RESET)"
	@echo "  $(YELLOW)make build$(RESET)             build completo (backend + frontend)"
	@echo "  $(YELLOW)make build-backend$(RESET)     build apenas do backend"
	@echo "  $(YELLOW)make build-frontend$(RESET)    build apenas do frontend"
	@echo ""
	@echo "$(BOLD)$(GREEN)🧪 Testes & Lint:$(RESET)"
	@echo "  $(YELLOW)make test$(RESET)              roda todos os testes"
	@echo "  $(YELLOW)make test-backend$(RESET)      testes do backend"
	@echo "  $(YELLOW)make test-frontend$(RESET)     testes do frontend"
	@echo "  $(YELLOW)make lint$(RESET)              executa linter em todos"
	@echo "  $(YELLOW)make lint-fix$(RESET)          linter com auto-fix"
	@echo ""
	@echo "$(BOLD)$(GREEN)🧹 Limpeza:$(RESET)"
	@echo "  $(YELLOW)make clean$(RESET)             limpa dist, node_modules, uploads"
	@echo "  $(YELLOW)make clean-all$(RESET)         clean + docker volumes down"
	@echo ""
	@echo "$(BOLD)$(GREEN)🚢 Deploy & Operacoes:$(RESET)"
	@echo "  $(YELLOW)make start$(RESET)             inicia modo producao (backend + frontend preview)"
	@echo "  $(YELLOW)make logs$(RESET)              mostra logs do backend"

## @install: instala todas as dependências (backend + frontend)
install:
	@echo "$(BOLD)$(BLUE)⚙️  Instalando dependências...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	@echo "$(CYAN)📦 Backend: $(BACKEND_DIR)$(RESET)"
	cd "$(BACKEND_DIR)" && npm ci
endif
ifneq ($(FRONTEND_EXISTS),no)
	@echo "$(CYAN)📦 Frontend: $(FRONTEND_DIR)$(RESET)"
	cd "$(FRONTEND_DIR)" && npm ci
endif
	@echo "$(GREEN)✓ Instalação concluída!$(RESET)"

## @dev: roda backend e frontend em paralelo
dev: services-up
	@echo "$(BOLD)$(BLUE)🚀 Iniciando desenvolvimento completo...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
ifneq ($(FRONTEND_EXISTS),no)
	npx concurrently \
		--names "BACKEND,FRONTEND" \
		--prefix-colors "green.bold,cyan.bold" \
		--kill-others-on-fail \
		"cd $(BACKEND_DIR) && npm run dev" \
		"cd $(FRONTEND_DIR) && npm run dev"
else
	@echo "$(RED)❌ Frontend nao encontrado em: $(FRONTEND_DIR)$(RESET)"
	@exit 1
endif
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @dev-backend: roda apenas o backend
dev-backend:
	@echo "$(BOLD)$(BLUE)🔧 Iniciando backend (Fastify - porta 4001)...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	cd "$(BACKEND_DIR)" && npm run dev
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @dev-frontend: roda apenas o frontend
dev-frontend:
	@echo "$(BOLD)$(BLUE)💻 Iniciando frontend (React Vite - porta 5173)...$(RESET)"
ifneq ($(FRONTEND_EXISTS),no)
	cd "$(FRONTEND_DIR)" && npm run dev
else
	@echo "$(RED)❌ Frontend nao encontrado em: $(FRONTEND_DIR)$(RESET)"
	@exit 1
endif

## @services-up: sobe PostgreSQL, Redis e OpenSearch
services-up:
	@echo "$(BOLD)$(MAGENTA)🐳 Subindo serviços Docker (PostgreSQL, Redis, OpenSearch)...$(RESET)"
ifneq ($(DOCKER_COMPOSE_EXISTS),no)
	docker-compose up -d
	@echo "$(GREEN)✓ Servicos iniciados!$(RESET)"
	@echo "$(CYAN)📋 Servicos disponiveis:$(RESET)"
	@echo "   PostgreSQL: localhost:5433"
	@echo "   Redis:       localhost:6379"
	@echo "   OpenSearch:  localhost:9200"
	@echo "   Adminer:     http://localhost:8080"
else
	@echo "$(YELLOW)⚠️  docker-compose.yml nao encontrado na raiz$(RESET)"
endif

## @services-down: para os serviços Docker
services-down:
	@echo "$(BOLD)$(MAGENTA)🛑 Parando serviços Docker...$(RESET)"
ifneq ($(DOCKER_COMPOSE_EXISTS),no)
	docker-compose down
	@echo "$(GREEN)✓ Servicos parados!$(RESET)"
else
	@echo "$(YELLOW)⚠️  docker-compose.yml nao encontrado na raiz$(RESET)"
endif

## @db-migrate: executa migrações do Prisma
db-migrate:
	@echo "$(BOLD)$(BLUE)🗃️  Executando migracoes do banco...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	cd "$(BACKEND_DIR)" && npm run db:migrate
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @db-push: sincroniza schema com o banco
db-push:
	@echo "$(BOLD)$(BLUE)🔄 Sincronizando schema do banco...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	cd "$(BACKEND_DIR)" && npm run db:push
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @db-seed: popula banco com dados iniciais
db-seed:
	@echo "$(BOLD)$(BLUE)🌱 Populando banco de dados...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	cd "$(BACKEND_DIR)" && npm run db:seed
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @db-studio: abre Prisma Studio (admin do banco)
db-studio:
	@echo "$(BOLD)$(BLUE)📊 Abrindo Prisma Studio...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	cd "$(BACKEND_DIR)" && npm run db:studio
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @db-reset: DROP e recria banco (CUIDADO!)
db-reset:
	@echo "$(BOLD)$(RED)⚠️  ATENCAO: Isso ira DROPAR e recriar o banco de dados!$(RESET)"
	@echo "$(YELLOW)❓ Deseja continuar? (s/N) $(RESET)" && read ans && [ $${ans:-N} = s -o $${ans:-N} = S ]
ifneq ($(BACKEND_EXISTS),no)
	cd "$(BACKEND_DIR)" && npx prisma migrate reset --force
	@echo "$(GREEN)✓ Banco resetado!$(RESET)"
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @build: build completo (backend + frontend)
build:
	@echo "$(BOLD)$(BLUE)🔨 Iniciando build completo...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	@echo "$(CYAN)🔧 Backend: $(BACKEND_DIR)$(RESET)"
	cd "$(BACKEND_DIR)" && npm run build
else
	@echo "$(YELLOW)⚠️  Backend nao encontrado, pulando...$(RESET)"
endif
ifneq ($(FRONTEND_EXISTS),no)
	@echo "$(CYAN)💻 Frontend: $(FRONTEND_DIR)$(RESET)"
	cd "$(FRONTEND_DIR)" && npm run build
else
	@echo "$(YELLOW)⚠️  Frontend nao encontrado, pulando...$(RESET)"
endif
	@echo "$(GREEN)✓ Build concluído!$(RESET)"

## @build-backend: build apenas do backend
build-backend:
	@echo "$(BOLD)$(BLUE)🔧 Build do backend...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	cd "$(BACKEND_DIR)" && npm run build
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @build-frontend: build apenas do frontend
build-frontend:
	@echo "$(BOLD)$(BLUE)💻 Build do frontend...$(RESET)"
ifneq ($(FRONTEND_EXISTS),no)
	cd "$(FRONTEND_DIR)" && npm run build
else
	@echo "$(RED)❌ Frontend nao encontrado em: $(FRONTEND_DIR)$(RESET)"
	@exit 1
endif

## @test: roda todos os testes
test:
	@echo "$(BOLD)$(BLUE)🧪 Rodando todos os testes...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	@echo "$(CYAN)📋 Backend:$(RESET)"
	cd "$(BACKEND_DIR)" && npm test || true
else
	@echo "$(YELLOW)⚠️  Backend nao encontrado, pulando...$(RESET)"
endif
ifneq ($(FRONTEND_EXISTS),no)
	@echo "$(CYAN)📋 Frontend:$(RESET)"
	cd "$(FRONTEND_DIR)" && npm test || true
else
	@echo "$(YELLOW)⚠️  Frontend nao encontrado, pulando...$(RESET)"
endif
	@echo "$(GREEN)✓ Testes concluídos!$(RESET)"

## @test-backend: testes do backend
test-backend:
	@echo "$(BOLD)$(BLUE)🧪 Testes do backend...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	cd "$(BACKEND_DIR)" && npm test
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif

## @test-frontend: testes do frontend
test-frontend:
	@echo "$(BOLD)$(BLUE)🧪 Testes do frontend...$(RESET)"
ifneq ($(FRONTEND_EXISTS),no)
	cd "$(FRONTEND_DIR)" && npm test
else
	@echo "$(RED)❌ Frontend nao encontrado em: $(FRONTEND_DIR)$(RESET)"
	@exit 1
endif

## @lint: executa linter em todos
lint:
	@echo "$(BOLD)$(BLUE)🔍 Executando linter...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	@echo "$(CYAN)📋 Backend:$(RESET)"
	cd "$(BACKEND_DIR)" && npm run lint || true
else
	@echo "$(YELLOW)⚠️  Backend nao encontrado, pulando...$(RESET)"
endif
ifneq ($(FRONTEND_EXISTS),no)
	@echo "$(CYAN)📋 Frontend:$(RESET)"
	cd "$(FRONTEND_DIR)" && npm run lint || true
else
	@echo "$(YELLOW)⚠️  Frontend nao encontrado, pulando...$(RESET)"
endif
	@echo "$(GREEN)✓ Lint concluído!$(RESET)"

## @lint-fix: linter com auto-fix
lint-fix:
	@echo "$(BOLD)$(BLUE)🔧 Executando linter com auto-fix...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	@echo "$(CYAN)📋 Backend:$(RESET)"
	cd "$(BACKEND_DIR)" && npm run lint -- --fix || true
else
	@echo "$(YELLOW)⚠️  Backend nao encontrado, pulando...$(RESET)"
endif
ifneq ($(FRONTEND_EXISTS),no)
	@echo "$(CYAN)📋 Frontend:$(RESET)"
	cd "$(FRONTEND_DIR)" && npm run lint -- --fix || true
else
	@echo "$(YELLOW)⚠️  Frontend nao encontrado, pulando...$(RESET)"
endif
	@echo "$(GREEN)✓ Auto-fix concluído!$(RESET)"

## @clean: limpa dist, node_modules, uploads
clean:
	@echo "$(BOLD)$(YELLOW)🧹 Limpando arquivos de build e node_modules...$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	@echo "$(CYAN)📦 Backend:$(RESET)"
	cd "$(BACKEND_DIR)" && rm -rf dist node_modules uploads || true
endif
ifneq ($(FRONTEND_EXISTS),no)
	@echo "$(CYAN)💻 Frontend:$(RESET)"
	cd "$(FRONTEND_DIR)" && rm -rf dist node_modules || true
endif
	@rm -rf node_modules
	@echo "$(GREEN)✓ Limpeza concluída!$(RESET)"

## @clean-all: clean + docker volumes down
clean-all: clean
	@echo "$(BOLD)$(RED)🗑️  Parando e removendo volumes Docker...$(RESET)"
ifneq ($(DOCKER_COMPOSE_EXISTS),no)
	docker-compose down -v
	@echo "$(GREEN)✓ Volumes Docker removidos!$(RESET)"
else
	@echo "$(YELLOW)⚠️  docker-compose.yml nao encontrado na raiz$(RESET)"
endif

## @start: inicia modo produção (backend start + frontend preview)
start:
	@echo "$(BOLD)$(GREEN)🚢 Iniciando modo producao...$(RESET)"
	@echo "$(YELLOW)💡 Certifique-se de executar 'make build' antes!$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	@echo "$(CYAN)🔧 Backend:$(RESET)"
	cd "$(BACKEND_DIR)" && npm start &
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif
ifneq ($(FRONTEND_EXISTS),no)
	@echo "$(CYAN)💻 Frontend (preview):$(RESET)"
	cd "$(FRONTEND_DIR)" && npm run preview &
else
	@echo "$(YELLOW)⚠️  Frontend nao encontrado, pulando preview...$(RESET)"
endif
	@echo "$(GREEN)✓ Aplicacao em producao!$(RESET)"
	@echo "   Backend: http://localhost:4001"
	@echo "   Frontend: http://localhost:4173"

## @logs: mostra logs do backend
logs:
	@echo "$(BOLD)$(BLUE)📋 Logs do backend:$(RESET)"
ifneq ($(BACKEND_EXISTS),no)
	@echo "$(CYAN)📄 Arquivo: $(BACKEND_DIR)/server.log$(RESET)"
	@tail -f "$(BACKEND_DIR)/server.log" 2>/dev/null || echo "$(YELLOW)Aguardando logs...$(RESET)"
else
	@echo "$(RED)❌ Backend nao encontrado em: $(BACKEND_DIR)$(RESET)"
	@exit 1
endif
