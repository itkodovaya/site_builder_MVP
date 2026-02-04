# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies including devDependencies (for build)
RUN npm ci

COPY src ./src

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts and templates
COPY --from=builder /app/dist ./dist
# We need to copy templates explicitly if they aren't part of the TS build
COPY src/infrastructure/preview/templates ./dist/infrastructure/preview/templates

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
