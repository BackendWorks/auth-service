# Multi-stage build for optimal image size
FROM node:lts-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat wget openssl
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./
COPY prisma ./prisma/

# Install dependencies
RUN yarn --frozen-lockfile --production=false

# Build the source code
FROM base AS builder
RUN apk add --no-cache wget openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build application
RUN yarn prisma:generate
RUN yarn proto:generate
RUN yarn build

# Production image, copy all the files and run the app
FROM base AS runner
RUN apk add --no-cache wget openssl
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/protos ./src/protos
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

# Copy node_modules from deps stage (production only)
COPY --from=deps /app/node_modules ./node_modules

# Change ownership to nestjs user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose ports for HTTP and gRPC
EXPOSE 9001 50051

CMD ["yarn", "start"]
