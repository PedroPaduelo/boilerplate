#!/bin/bash

# Script para configurar variáveis de ambiente
# Uso: ./scripts/setup-env.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Configurando variáveis de ambiente...${NC}"

# Verifica se existe .env na raiz
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado na raiz!${NC}"
    echo -e "${YELLOW}📝 Copie .env.example para .env e configure${NC}"
    exit 1
fi

# Copia .env para backend
if [ -f "backend-boilerplate/.env" ]; then
    cp .env backend-boilerplate/.env.local
    echo -e "${GREEN}✅ .env copiado para backend-boilerplate/.env.local${NC}"
else
    echo -e "${RED}❌ Diretório backend-boilerplate não encontrado${NC}"
fi

# Copia .env para frontend (como .env.local)
if [ -f "frontend-boilerplate/.env" ]; then
    # Extrai apenas variáveis do frontend
    grep "^VITE_" .env > frontend-boilerplate/.env.local 2>/dev/null || true
    echo -e "${GREEN}✅ Variáveis VITE copiadas para frontend-boilerplate/.env.local${NC}"
else
    echo -e "${RED}❌ Diretório frontend-boilerplate não encontrado${NC}"
fi

echo -e "${GREEN}✨ Configuração concluída!${NC}"
