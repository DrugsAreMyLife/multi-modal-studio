# syntax=docker/dockerfile:1

# Multi-stage build for Next.js production image
# Stage 1: Builder (includes dev dependencies for build)
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
