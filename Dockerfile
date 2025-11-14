# Multi-stage build for MCP Server

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Configure pnpm to ignore scripts
RUN pnpm config set ignore-scripts true

# Install dependencies (scripts will be ignored)
RUN pnpm install --frozen-lockfile

# Copy only necessary files for MCP server (skip frontend)
COPY .env* ./
COPY tsconfig.json ./
COPY src/mcp ./src/mcp
COPY src/lib ./src/lib
COPY src/types ./src/types
COPY scripts ./scripts

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install pnpm in runtime image
RUN npm install -g pnpm

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/.env* ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose MCP port
EXPOSE 4400

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4400/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start MCP HTTP server (tsx respects tsconfig.json paths)
CMD ["./node_modules/.bin/tsx", "--tsconfig", "tsconfig.json", "src/mcp/server-http.ts"]
