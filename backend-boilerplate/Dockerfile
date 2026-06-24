# Build stage
# ⚠️  BUILD CONTEXT deve ser a RAIZ do monorepo (não backend-boilerplate/).
#
# No EasyPanel:
#   Build Context  = /  (raiz do repositório)
#   Dockerfile     = backend-boilerplate/Dockerfile
#
FROM node:20-alpine AS builder

WORKDIR /app/backend-boilerplate

# Copia o contracts (dependência file:../shared/contracts)
COPY --link shared/contracts/package.json /app/shared/contracts/package.json
COPY --link shared/contracts/dist /app/shared/contracts/dist
COPY --link shared/contracts/src /app/shared/contracts/src
COPY --link shared/contracts/tsconfig.json /app/shared/contracts/tsconfig.json

# Copia os arquivos do backend
COPY --link backend-boilerplate/package*.json ./
COPY --link backend-boilerplate/tsconfig.json ./
COPY --link backend-boilerplate/tsup.config.ts ./
COPY --link backend-boilerplate/tsconfig.catalog.json ./
COPY --link backend-boilerplate/prisma ./prisma/
COPY --link backend-boilerplate/scripts ./scripts/
COPY --link backend-boilerplate/src ./src/

# Install all dependencies (file:../shared/contracts resolve: /app/shared/contracts)
# --ignore-scripts pula husky/prepare (não precisa no build Docker)
RUN npm ci --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

# ---------------------------------------------------------------------------
# Production stage
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app/backend-boilerplate

ENV NODE_ENV=production
ENV PORT=4000

# Copia contracts (file:../shared/contracts precisa resolver no npm ci)
COPY --link shared/contracts/package.json /app/shared/contracts/package.json
COPY --link shared/contracts/dist /app/shared/contracts/dist

# Copia package files do backend
COPY --link backend-boilerplate/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# O 'shared/contracts/dist/index.cjs' faz require('ajv') + 'ajv-formats', e
# o Node resolve a partir de /app/shared/contracts/. Como esse diretório NÃO tem
# node_modules próprio (é um pacote 'file:'), copiamos manualmente TODAS as deps
# transitivas do ajv para dentro de shared/contracts/node_modules/.
#
# IMPORTANTE: sempre que adicionar uma dep nova no schema do contracts que precise
# de imports em runtime (ajv, lodash, etc.), adicionar o nome neste loop.
RUN mkdir -p /app/shared/contracts/node_modules && \
    for pkg in ajv ajv-formats fast-deep-equal fast-uri json-schema-traverse require-from-string uri-js punycode; do \
      if [ -d "node_modules/$pkg" ]; then \
        cp -r "node_modules/$pkg" "/app/shared/contracts/node_modules/$pkg"; \
        echo "copied: $pkg"; \
      fi; \
    done

# Copy Prisma schema and migrations
COPY --link backend-boilerplate/prisma ./prisma/

# Generate Prisma client (runtime)
RUN npx prisma generate

# Copy built application from the builder
COPY --from=builder /app/backend-boilerplate/dist ./dist

# Create uploads directory
RUN mkdir -p ./uploads && chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1));"

CMD ["node", "dist/server.js"]
