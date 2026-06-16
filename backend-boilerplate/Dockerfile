# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only the files needed to install dependencies and build
COPY package*.json ./
COPY tsconfig.json ./
COPY tsup.config.ts ./
COPY prisma ./prisma/
COPY src ./src/

# Install all dependencies (including dev deps needed for the build)
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

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma client (runtime)
RUN npx prisma generate

# Copy built application from the builder
COPY --from=builder /app/dist ./dist

# Create uploads directory owned by the non-root user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Drop root privileges — run as the unprivileged "node" user (ships with the base image)
USER node

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1));"

# Start the application
CMD ["node", "dist/server.js"]
