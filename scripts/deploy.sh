#!/bin/bash

# =============================================================================
# DEPLOY PARA PRODUÇÃO
# =============================================================================
# Processo de deploy:
# 1. Verifica Node.js
# 2. Build do backend
# 3. Build do frontend
# 4. Copia arquivos para pasta dist/
# 5. Mensagens finais
# =============================================================================

set -e  # Sai em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
BOLD='\033[1m'
NC='\033[0m'

# Diretórios
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend-boilerplate"
FRONTEND_DIR="$ROOT_DIR/frontend-boilerplate"
DIST_DIR="$ROOT_DIR/dist"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           DEPLOY PARA PRODUÇÃO                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================

error_exit() {
    echo -e "${RED}❌ ERRO: $1${NC}" >&2
    exit 1
}

success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# =============================================================================
# 1. VERIFICAR NODE.JS
# =============================================================================
echo -e "${CYAN}📦 [1/4] Verificando Node.js...${NC}"

if ! command_exists node; then
    error_exit "Node.js não encontrado. Instale Node.js para deploy."
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
success_msg "Node.js $(node --version) detectado"

# =============================================================================
# 2. BUILD DO BACKEND
# =============================================================================
echo ""
echo -e "${CYAN}📦 [2/4] Build do backend...${NC}"

cd "$BACKEND_DIR"

if [ ! -f "package.json" ]; then
    error_exit "package.json não encontrado em $BACKEND_DIR"
fi

# Limpa builds anteriores
if [ -d "dist" ]; then
    info_msg "Limpando dist/ anterior..."
    rm -rf dist
fi

# Executa build
info_msg "Executando: npm run build"
if npm run build; then
    success_msg "Backend buildado com sucesso"
else
    error_exit "Build do backend falhou"
fi

# Verifica se dist/ foi criado
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    error_exit "Pasta dist/ do backend está vazia ou não existe"
fi

success_msg "Backend compilado: $BACKEND_DIR/dist"

# =============================================================================
# 3. BUILD DO FRONTEND
# =============================================================================
echo ""
echo -e "${CYAN}📦 [3/4] Build do frontend...${NC}"

cd "$FRONTEND_DIR"

if [ ! -f "package.json" ]; then
    error_exit "package.json não encontrado em $FRONTEND_DIR"
fi

# Limpa builds anteriores
if [ -d "dist" ]; then
    info_msg "Limpando dist/ anterior..."
    rm -rf dist
fi

# Executa build
info_msg "Executando: npm run build"
if npm run build; then
    success_msg "Frontend buildado com sucesso"
else
    error_exit "Build do frontend falhou"
fi

# Verifica se dist/ foi criado
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    error_exit "Pasta dist/ do frontend está vazia ou não existe"
fi

success_msg "Frontend compilado: $FRONTEND_DIR/dist"

# =============================================================================
# 4. PREPARAR PASTA DIST COM AMBOS OS ARTEFATOS
# =============================================================================
echo ""
echo -e "${CYAN}📦 [4/4] Preparando pasta dist/ final...${NC}"

# Cria dist/ na raiz se não existir
mkdir -p "$DIST_DIR"

# Copia artefatos do backend
info_msg "Copiando backend..."
rm -rf "$DIST_DIR/backend" "$DIST_DIR/server.js" "$DIST_DIR/dist" 2>/dev/null || true
cp -r "$BACKEND_DIR/dist" "$DIST_DIR/backend"
cp -r "$BACKEND_DIR/prisma" "$DIST_DIR/backend/prisma"
cp "$BACKEND_DIR/package.json" "$DIST_DIR/backend/package.json"
if [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$DIST_DIR/backend/.env.example"
fi

# Copia artefatos do frontend
info_msg "Copiando frontend..."
rm -rf "$DIST_DIR/frontend" "$DIST_DIR/public" 2>/dev/null || true
cp -r "$FRONTEND_DIR/dist" "$DIST_DIR/frontend"
cp "$FRONTEND_DIR/package.json" "$DIST_DIR/frontend/package.json"
if [ -f "$FRONTEND_DIR/nginx.conf" ]; then
    cp "$FRONTEND_DIR/nginx.conf" "$DIST_DIR/nginx.conf"
fi

echo ""
echo "  Backend:   $DIST_DIR/backend/dist"
echo "  Frontend:  $DIST_DIR/frontend"
echo ""

# Cria arquivo de manifest do deploy
cat > "$DIST_DIR/deploy-info.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backend": {
    "nodeVersion": "$(node --version)",
    "buildDir": "backend/dist"
  },
  "frontend": {
    "buildDir": "frontend"
  }
}
EOF

success_msg "Artifatos organizados em: $DIST_DIR"

# =============================================================================
# FINALIZAÇÃO
# =============================================================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           🎉 DEPLOY CONCLUÍDO COM SUCESSO! 🎉             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📦 Artefatos de produção prontos:${NC}"
echo "  📁 $DIST_DIR"
echo ""
echo -e "${BLUE}📂 Estrutura:${NC}"
echo "  dist/"
echo "  ├── backend/"
echo "  │   ├── dist/      (arquivos Node.js compilados)"
echo "  │   ├── prisma/    (schema.prisma para deploy)"
echo "  │   └── package.json"
echo "  ├── frontend/      (arquivos estáticos React/Vite)"
echo "  ├── nginx.conf     (opcional, se existir)"
echo "  └── deploy-info.json"
echo ""
echo -e "${YELLOW}📋 Próximos passos para produção:${NC}"
echo "  1. Transfira a pasta dist/ para o servidor"
echo "  2. No servidor: npm ci --only=production em backend/"
echo "  3. Configure variáveis de ambiente (.env)"
echo "  4. Execute: npx prisma migrate deploy"
echo "  5. Inicie: npm start no backend/"
echo "  6. Configure nginx/servidor web para servir frontend/"
echo ""
echo -e "${CYAN}━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Backend (Fastify + Prisma)${NC}"
echo "  npm ci --only=production"
echo "  npx prisma generate && npx prisma migrate deploy"
echo "  npm start"
echo ""
echo -e "${BOLD}Frontend (React + Vite)${NC}"
echo "  Servir estáticos via nginx, Vercel, Netlify, etc."
echo -e "${CYAN}━ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
