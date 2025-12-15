# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY public ./public
COPY src ./src

# Build argument for API URL
ARG REACT_APP_API_URL=http://localhost:8080/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build the application
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:1.25-alpine

WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy built app from builder
COPY --from=builder /app/build .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add environment variable substitution script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Use custom entrypoint for runtime env substitution
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
