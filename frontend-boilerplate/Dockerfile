# syntax=docker/dockerfile:1.7

# ===== Stage 1: build =====
FROM node:22-alpine AS build

WORKDIR /app

# Cache deps separadamente pra aproveitar o cache do Docker
COPY package*.json ./
RUN npm ci

# Source + build (devDeps necessárias pro vite build)
COPY . .
RUN npm run build

# ===== Stage 2: serve =====
FROM nginx:alpine AS serve

# nginx.conf customizado com SPA fallback (try_files $uri /index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets do Vite build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
