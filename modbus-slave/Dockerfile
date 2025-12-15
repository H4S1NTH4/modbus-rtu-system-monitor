# Stage 1: Build stage
FROM gcc:13.2.0 AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy source files
COPY main.cpp crc.cpp crc.h ./

# Compile the application with static linking for portability
RUN g++ -o system_monitor main.cpp crc.cpp \
    -pthread \
    -std=c++11 \
    -static-libgcc \
    -static-libstdc++ \
    -O2

# Stage 2: Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    libstdc++ \
    libgcc

# Create non-root user
RUN addgroup -S modbus && adduser -S modbus -G modbus

# Copy binary from builder
COPY --from=builder /app/system_monitor .

# Change ownership
RUN chown modbus:modbus system_monitor

# Switch to non-root user
USER modbus

# Expose Modbus TCP port
EXPOSE 5000

# Health check - check if port is listening
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD nc -z localhost 5000 || exit 1

# Default slave address (can be overridden)
ENV SLAVE_ADDRESS=1

# Run with slave address from environment
ENTRYPOINT ["sh", "-c", "./system_monitor --slave_address ${SLAVE_ADDRESS}"]
