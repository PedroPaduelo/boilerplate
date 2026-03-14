#!/bin/bash

# =============================================================================
# BACKUP DO POSTGRESQL
# =============================================================================
# Realiza backup completo do banco de dados PostgreSQL:
# 1. Executa pg_dump do banco
# 2. Salva em backups/ com timestamp
# 3. Compressão gzip
# =============================================================================

set -e  # Sai em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
NC='\033[0m'

# Configurações do banco (valores padrão)
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-boilerplate}"

# Diretório do projeto
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"

# Timestamp para nome do arquivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${POSTGRES_DB}_${TIMESTAMP}.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              BACKUP DO BANCO DE DADOS POSTGRESQL          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# VERIFICAÇÕES PRÉVIAS
# =============================================================================

# Verifica se pg_dump está disponível
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ ERRO: pg_dump não encontrado${NC}"
    echo -e "${YELLOW}💡 Instale o cliente PostgreSQL:${NC}"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   macOS:         brew install postgresql"
    exit 1
fi

# Cria diretório de backups se não existir
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✅ Diretório de backups: $BACKUP_DIR${NC}"

# =============================================================================
# CRIA VARIÁVEL DE AMBIENTE TEMPORÁRIA (EVITA EXPOR SENHA NO TERMINAL)
# =============================================================================
export PGCLIENTENCODING=UTF8
export PGPASSWORD="$POSTGRES_PASSWORD"

# =============================================================================
# EXECUTA BACKUP
# =============================================================================
echo ""
echo -e "${CYAN}📦 Executando backup...${NC}"
echo "  Host:     $POSTGRES_HOST:$POSTGRES_PORT"
echo "  Banco:    $POSTGRES_DB"
echo "  Usuário:  $POSTGRES_USER"
echo "  Arquivo:  $BACKUP_FILE"

# Tenta executar o backup
if pg_dump -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --verbose \
    > "$BACKUP_PATH" 2>&1; then

    # Verifica se o arquivo foi criado e tem conteúdo
    if [ -s "$BACKUP_PATH" ]; then
        ORIGINAL_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)

        # Comprime com gzip
        echo ""
        echo -e "${CYAN}🗜️  Comprimindo com gzip...${NC}"
        gzip -f "$BACKUP_PATH"

        COMPRESSED_PATH="${BACKUP_PATH}.gz"
        COMPRESSED_SIZE=$(du -h "$COMPRESSED_PATH" | cut -f1)

        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║              ✅ BACKUP REALIZADO COM SUCESSO!             ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BLUE}📁 Arquivo compactado:${NC} $COMPRESSED_PATH"
        echo -e "${BLUE}📊 Tamanho compactado:${NC} $COMPRESSED_SIZE"
        echo ""

        # Lista últimos backups
        echo -e "${CYAN}📋 Últimos backups:${NC}"
        ls -lh "$BACKUP_DIR" | tail -5

    else
        echo -e "${RED}❌ ERRO: Arquivo de backup está vazio${NC}"
        rm -f "$BACKUP_PATH"
        exit 1
    fi

else
    echo -e "${RED}❌ ERRO: Falha ao executar pg_dump${NC}"
    echo "Verifique as credenciais e se o banco está acessível."
    rm -f "$BACKUP_PATH" 2>/dev/null || true
    exit 1
fi

# Limpa variável de ambiente
unset PGPASSWORD

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💡 Para restaurar o backup:${NC}"
echo "   gunzip -c backups/backup_${POSTGRES_DB}_${TIMESTAMP}.sql.gz | psql -h localhost -U postgres -d $POSTGRES_DB"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
