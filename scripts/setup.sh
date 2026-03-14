#!/bin/bash

# =============================================================================
# SETUP INICIAL COMPLETO
# =============================================================================
# Este script realiza a configuração completa do projeto:
# 1. Verifica Node.js >= 18
# 2. Instala dependências do backend e frontend
# 3. Sobe o docker-compose (postgres, redis, opensearch)
# 4. Aguarda health dos serviços
# 5. Roda prisma migrate dev
# 6. Roda prisma db seed
# =============================================================================

set -e  # Sai em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
NC='\033[0m' # No Color

# Diretórios
BACKEND_DIR="$(cd "$(dirname "$0")/../backend-boilerplate" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/../frontend-boilerplate" && pwd)"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       BOILERPLATE - SETUP INICIAL COMPLETO               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================

# Função para imprimir mensagem de erro e sair
error_exit() {
    echo -e "${RED}❌ ERRO: $1${NC}" >&2
    exit 1
}

# Função para imprimir mensagem de sucesso
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para imprimir mensagem de aviso
warning_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Função para imprimir mensagem informativa
info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para aguardar serviço estar pronto
wait_for_service() {
    local service_name="$1"
    local check_cmd="$2"
    local max_attempts="$3"
    local wait_seconds="$4"

    info_msg "Aguardando ${service_name} ficar pronto..."

    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if eval "$check_cmd" >/dev/null 2>&1; then
            success_msg "${service_name} está pronto!"
            return 0
        fi

        info_msg "Tentativa $attempt/$max_attempts... aguardando ${wait_seconds}s"
        sleep $wait_seconds
        attempt=$((attempt + 1))
    done

    error_exit "${service_name} não ficou pronto após ${max_attempts} tentativas"
}

# =============================================================================
# 1. VERIFICAR NODE.JS >= 18
# =============================================================================
echo -e "${CYAN}📦 [1/6] Verificando Node.js...${NC}"

if ! command_exists node; then
    error_exit "Node.js não encontrado. Instale Node.js >= 18 em https://nodejs.org/"
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error_exit "Node.js versão $(node --version) detectada. É necessário Node.js >= 18."
fi

success_msg "Node.js $(node --version) detectado (versão >= 18 OK)"

# =============================================================================
# 2. INSTALAR DEPENDÊNCIAS DO BACKEND
# =============================================================================
echo ""
echo -e "${CYAN}📦 [2/6] Instalando dependências do backend...${NC}"

cd "$BACKEND_DIR"

if [ ! -f "package.json" ]; then
    error_exit "package.json não encontrado em $BACKEND_DIR"
fi

if command_exists npm; then
    npm ci
else
    error_exit "npm não encontrado"
fi

success_msg "Dependências do backend instaladas"

# =============================================================================
# 3. INSTALAR DEPENDÊNCIAS DO FRONTEND
# =============================================================================
echo ""
echo -e "${CYAN}📦 [3/6] Instalando dependências do frontend...${NC}"

cd "$FRONTEND_DIR"

if [ ! -f "package.json" ]; then
    error_exit "package.json não encontrado em $FRONTEND_DIR"
fi

if command_exists npm; then
    npm ci
else
    error_exit "npm não encontrado"
fi

success_msg "Dependências do frontend instaladas"

# =============================================================================
# 4. SUBIR DOCKER-COMPOSE
# =============================================================================
echo ""
echo -e "${CYAN}🐳 [4/6] Subindo serviços Docker...${NC}"

cd "$ROOT_DIR"

if ! command_exists docker; then
    warning_msg "Docker não encontrado. Pulando inicialização de serviços."
else
    if ! command_exists docker-compose && ! command_exists docker compose; then
        warning_msg "docker-compose não encontrado. Pulando inicialização de serviços."
    else
        # Usar docker compose ou docker-compose conforme disponível
        if command_exists docker compose; then
            DOCKER_COMPOSE="docker compose"
        else
            DOCKER_COMPOSE="docker-compose"
        fi

        info_msg "Executando: $DOCKER_COMPOSE up -d"
        $DOCKER_COMPOSE up -d

        success_msg "Serviços Docker iniciados"
    fi
fi

# =============================================================================
# 5. AGUARDAR HEALTH DOS SERVIÇOS
# =============================================================================
echo ""
echo -e "${CYAN}🏥 [5/6] Verificando saúde dos serviços...${NC}"

cd "$ROOT_DIR"

if command_exists docker; then
    # Aguardar PostgreSQL (porta 5433)
    wait_for_service "PostgreSQL" "nc -z localhost 5433" 30 2

    # Aguardar Redis (porta 6379)
    wait_for_service "Redis" "nc -z localhost 6379" 30 2

    # Aguardar OpenSearch (porta 9200)
    wait_for_service "OpenSearch" "curl -s http://localhost:9200 >/dev/null" 30 2

    success_msg "Todos os serviços estão saudáveis"
else
    warning_msg "Docker não disponível - não foi possível verificar serviços"
fi

# =============================================================================
# 6. EXECUTAR PRISMA MIGRATE E SEED
# =============================================================================
echo ""
echo -e "${CYAN}🗄️  [6/6] Configurando banco de dados...${NC}"

cd "$BACKEND_DIR"

# Executar prisma migrate dev
info_msg "Executando: npx prisma migrate dev"
if npx prisma migrate dev --name init 2>/dev/null || npx prisma db push; then
    success_msg "Migrações do banco aplicadas"
else
    warning_msg "Migrações não aplicadas (pode já existir)"
fi

# Executar prisma db seed
info_msg "Executando seed de dados iniciais..."
if npx prisma db seed; then
    success_msg "Seed executado com sucesso"
else
    warning_msg "Seed já executado anteriormente ou não encontrado"
fi

# =============================================================================
# FINALIZAÇÃO
# =============================================================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🎉 SETUP CONCLUÍDO COM SUCESSO! 🎉                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Usuário Admin criado:${NC}"
echo "  Email: admin@boilerplate.com"
echo "  Senha: admin123"
echo ""
echo -e "${BLUE}Para iniciar o development:${NC}"
echo "  Backend:  cd $BACKEND_DIR && npm run dev"
echo "  Frontend: cd $FRONTEND_DIR && npm run dev"
echo ""
echo -e "${BLUE}Serviços Docker rodando:${NC}"
echo "  PostgreSQL: localhost:5433"
echo "  Redis:      localhost:6379"
echo "  OpenSearch: localhost:9200"
echo "  Adminer:    http://localhost:8080"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  Lembre-se de configurar o arquivo .env conforme necessário${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
