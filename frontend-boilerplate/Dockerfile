# syntax=docker/dockerfile:1.7
#
# Build context deve ser a RAIZ do monorepo (não frontend-boilerplate/).
# EasyPanel: Build Context = root, Dockerfile Path = frontend-boilerplate/Dockerfile

# ===== Stage 1: build =====
FROM node:22-alpine AS build

WORKDIR /app

# Copia o contracts primeiro (dependência file: do package.json)
COPY shared/contracts/package.json ./shared/contracts/package.json
COPY shared/contracts/dist ./shared/contracts/dist
COPY shared/contracts/src ./shared/contracts/src
COPY shared/contracts/tsconfig.json ./shared/contracts/tsconfig.json

# Copia os arquivos do frontend para instalar deps e buildar
COPY frontend-boilerplate/package*.json ./frontend-boilerplate/
COPY frontend-boilerplate/tsconfig.json ./frontend-boilerplate/
COPY frontend-boilerplate/tsconfig.app.json ./frontend-boilerplate/tsconfig.app.json
COPY frontend-boilerplate/tsconfig.node.json ./frontend-boilerplate/tsconfig.node.json
COPY frontend-boilerplate/vite.config.ts ./frontend-boilerplate/
COPY frontend-boilerplate/nginx.conf ./frontend-boilerplate/
COPY frontend-boilerplate/index.html ./frontend-boilerplate/
COPY frontend-boilerplate/src ./frontend-boilerplate/src
COPY frontend-boilerplate/public ./frontend-boilerplate/public
COPY frontend-boilerplate/scripts ./frontend-boilerplate/scripts

WORKDIR /app/frontend-boilerplate

# Cache deps separadamente pra aproveitar o cache do Docker
RUN npm ci

# VITE_API_URL é injetado no BUILD do Vite (variável de build-time, não de runtime)
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

# Build (devDeps necessárias pro vite build)
RUN npm run build

# ===== Stage 2: serve =====
FROM nginx:alpine AS serve

# nginx.conf customizado com SPA fallback (try_files $uri /index.html)
COPY frontend-boilerplate/nginx.conf /etc/nginx/conf.d/default.conf

# Static assets do Vite build
COPY --from=build /app/frontend-boilerplate/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
