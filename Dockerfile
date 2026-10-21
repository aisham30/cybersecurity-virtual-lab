# ============================================================
# Dockerfile for VLab — Cybersecurity Attack Simulation Lab
# ============================================================
# Multi-stage build for optimized production image
# Stage 1: Install dependencies
# Stage 2: Create lean production image
# ============================================================

# ---------- Stage 1: Install dependencies ----------
FROM node:18-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy only package files first (Docker layer caching optimization)
COPY package.json package-lock.json ./

# Install only production dependencies (skip devDependencies like Electron)
RUN npm ci --omit=dev --ignore-scripts

# ---------- Stage 2: Production image ----------
FROM node:18-alpine AS production

# Add metadata labels
LABEL maintainer="Srushti"
LABEL description="VLab Cybersecurity Attack Simulation Learning Platform"
LABEL version="1.0.0"

# Create a non-root user for security
RUN addgroup -g 1001 -S vlabgroup && \
    adduser -S vlabuser -u 1001 -G vlabgroup

# Set working directory
WORKDIR /app

# Copy production node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source files
COPY package.json ./
COPY server.js ./
COPY app/renderer/ ./app/renderer/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Switch to non-root user
USER vlabuser

# Health check to verify the container is running properly
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "server.js"]
