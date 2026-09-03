# Multi-stage production Dockerfile for AR Analytics
FROM node:20-alpine AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build artifacts and dependencies
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

# Create storage directory for local database
RUN mkdir -p .data && chown -R nextjs:nodejs .data

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
