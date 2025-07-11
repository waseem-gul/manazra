# Multi-stage Dockerfile for Manazra

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ .

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ .

# Stage 3: Production Runtime
FROM node:18-alpine AS runtime

# Create app directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S manazra -u 1001

# Copy backend files
COPY --from=backend-builder --chown=manazra:nodejs /app/backend ./backend

# Copy built frontend files
COPY --from=frontend-builder --chown=manazra:nodejs /app/frontend/dist ./frontend/dist

# Copy root package.json
COPY --chown=manazra:nodejs package*.json ./

# Install production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Switch to non-root user
USER manazra

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/server.js"] 