# syntax=docker/dockerfile:1.7
#
# ⚠️  BUILD CONTEXT deve ser a RAIZ do monorepo (não frontend-boilerplate/).
#
# No EasyPanel:
#   Build Context  = /  (raiz do repositório)
#   Dockerfile     = frontend-boilerplate/Dockerfile
#

# ===== Stage 1: build =====
FROM node:22-alpine AS build

WORKDIR /app/frontend-boilerplate

# Copia contracts (dependência file:../shared/contracts)
COPY --link shared/contracts/package.json /app/shared/contracts/package.json
COPY --link shared/contracts/dist /app/shared/contracts/dist
COPY --link shared/contracts/src /app/shared/contracts/src
COPY --link shared/contracts/tsconfig.json /app/shared/contracts/tsconfig.json

# Copia arquivos do frontend
COPY --link frontend-boilerplate/package*.json ./
COPY --link frontend-boilerplate/tsconfig.json ./
COPY --link frontend-boilerplate/tsconfig.app.json ./
COPY --link frontend-boilerplate/tsconfig.node.json ./
COPY --link frontend-boilerplate/vite.config.ts ./
COPY --link frontend-boilerplate/index.html ./
COPY --link frontend-boilerplate/src ./src/
COPY --link frontend-boilerplate/public ./public/

# VITE_API_URL é injetado no BUILD do Vite (build-time, não runtime).
# Default propositalmente VAZIO para forçar o EasyPanel/CI a definir a URL
# de produção explicitamente (Build Argument). Aceitar `http://localhost:4000`
# como default fazia o build produzir um dist que aponta para o localhost do
# navegador do usuário, quebrando login/chat/MCP/dashboards em deploy.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

# Instala dependências e builda (--ignore-scripts pula husky/prepare)
RUN npm ci --ignore-scripts

# Fail-fast: garante que o build não continue sem o VITE_API_URL definido.
# O Vite injeta a env em import.meta.env no bundle final; se ela estiver vazia,
# o dist servido vai chamar o próprio localhost do navegador (connection_refused).
RUN if [ -z "$VITE_API_URL" ]; then \
      echo "" >&2; \
      echo "============================================================" >&2; \
      echo "  ERRO DE BUILD: VITE_API_URL não foi definido." >&2; \
      echo "" >&2; \
      echo "  Defina o Build Argument VITE_API_URL apontando para a URL" >&2; \
      echo "  pública do backend (HTTPS, sem trailing slash)." >&2; \
      echo "" >&2; \
      echo "  No EasyPanel: Service -> Build -> Build arguments" >&2; \
      echo "    VITE_API_URL=https://boilerplate-be-cmqg5udk.cloud.serendiped.com" >&2; \
      echo "============================================================" >&2; \
      exit 1; \
    fi

RUN npm run build

# ===== Stage 2: serve =====
FROM nginx:alpine AS serve

COPY --link frontend-boilerplate/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend-boilerplate/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
