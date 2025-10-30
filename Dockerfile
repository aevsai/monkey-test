# Stage 1: Build stage
FROM node:20-slim AS builder

# Set metadata
LABEL maintainer="MonkeyTest Contributors"
LABEL description="AI-powered browser testing with Browser Use"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.10.0

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript to JavaScript
RUN pnpm run build

# Stage 2: Production stage
FROM node:20-slim

# Set metadata
LABEL maintainer="MonkeyTest Contributors"
LABEL description="AI-powered browser testing with Browser Use"
LABEL version="1.0.0"

# Set working directory
WORKDIR /action

# Install pnpm
RUN npm install -g pnpm@9.10.0

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set the entrypoint
ENTRYPOINT ["node", "/action/dist/index.js"]
