# Build stage
# Build context deve ser a RAIZ do monorepo (não backend-boilerplate/).
# EasyPanel: Build Context = root, Dockerfile Path = backend-boilerplate/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copia o contracts primeiro (dependência file: do package.json)
COPY shared/contracts/package.json ./shared/contracts/package.json
COPY shared/contracts/dist ./shared/contracts/dist
COPY shared/contracts/src ./shared/contracts/src
COPY shared/contracts/tsconfig.json ./shared/contracts/tsconfig.json

# 2. Copia os arquivos do backend
COPY backend-boilerplate/package*.json ./backend-boilerplate/
COPY backend-boilerplate/tsconfig.json ./backend-boilerplate/
COPY backend-boilerplate/tsup.config.ts ./backend-boilerplate/
COPY backend-boilerplate/tsconfig.catalog.json ./backend-boilerplate/
COPY backend-boilerplate/prisma ./backend-boilerplate/prisma
COPY backend-boilerplate/scripts ./backend-boilerplate/scripts
COPY backend-boilerplate/src ./backend-boilerplate/src

WORKDIR /app/backend-boilerplate

# Install all dependencies (including dev deps needed for the build)
# file:../shared/contracts resolve corretamente: ../ = /app/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Estrutura de diretórios igual ao monorepo para resolver file:../shared/contracts.
# WORKDIR = /app/backend-boilerplate, ../shared/contracts = /app/shared/contracts.
COPY shared/contracts/package.json ./shared/contracts/package.json
COPY shared/contracts/dist ./shared/contracts/dist

COPY backend-boilerplate/package*.json ./backend-boilerplate/
COPY backend-boilerplate/prisma ./backend-boilerplate/prisma

WORKDIR /app/backend-boilerplate

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client (runtime)
RUN npx prisma generate

# Copy built application from the builder
COPY --from=builder /app/backend-boilerplate/dist ./dist

# Create uploads directory owned by the non-root user
RUN mkdir -p /app/backend-boilerplate/uploads && chown -R node:node /app

# Drop root privileges — run as the unprivileged "node" user (ships with the base image)
USER node

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1));"

# Start the application
CMD ["node", "dist/server.js"]
