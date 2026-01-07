# Docker Deployment Guide

## Overview
This project is fully dockerized with support for both MongoDB Atlas (cloud) and local MongoDB.

## Quick Start (MongoDB Atlas - Default)

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

## Access Points
- **Web UI:** http://localhost
- **API:** http://localhost:8080/api
- **API Health:** http://localhost:8080/actuator/health
- **Modbus Slave:** localhost:5000

## MongoDB Configuration

### Option 1: MongoDB Atlas (Default - Recommended)

Your current setup uses MongoDB Atlas. The `.env` file contains your Atlas connection string.

**What runs:**
- ✅ modbus-master (Spring Boot)
- ✅ modbus-slave (C++)
- ✅ modbus-web-ui (React/Nginx)
- ❌ MongoDB (uses cloud Atlas)

**Total: 3 containers**

### Option 2: Local MongoDB (For Offline Development)

Use the override file to enable local MongoDB:

```bash
# Start with local MongoDB
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Or manually: Uncomment mongodb service in docker-compose.yml
# Then update .env:
MONGO_URI=mongodb://mongodb:27017/modbus-monitor
```

**What runs:**
- ✅ modbus-master (Spring Boot)
- ✅ modbus-slave (C++)
- ✅ modbus-web-ui (React/Nginx)
- ✅ MongoDB (local container)

**Total: 4 containers**

## Common Commands

### Build & Deploy
```bash
# Build specific service
docker compose build modbus-master

# Rebuild and start
docker compose up --build -d

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Monitoring
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f modbus-master

# Check resource usage
docker stats

# Inspect network
docker network inspect modbus-network
```

### Troubleshooting
```bash
# Check if services are healthy
docker compose ps

# Restart a service
docker compose restart modbus-master

# Shell into a container
docker exec -it modbus-master sh

# Test MongoDB connection from Spring Boot container
docker exec -it modbus-master wget -O- http://localhost:8080/actuator/health
```

## Environment Variables

Edit `.env` file to configure:

```bash
# MongoDB Atlas (default)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority

# Or Local MongoDB
MONGO_URI=mongodb://mongodb:27017/modbus-monitor

# Slave Configuration
SLAVE_ADDRESS=1
```

## Architecture

```
┌─────────────────── modbus-network ───────────────────┐
│                                                        │
│  ┌──────────────┐    ┌──────────────┐               │
│  │  Web UI      │───>│ Modbus Master│──> MongoDB    │
│  │  (nginx:80)  │    │  (Java:8080) │    Atlas      │
│  └──────────────┘    └──────┬───────┘               │
│                             │                         │
│                             ↓                         │
│                      ┌──────────────┐                │
│                      │ Modbus Slave │                │
│                      │  (C++:5000)  │                │
│                      └──────────────┘                │
└────────────────────────────────────────────────────────┘
```

## Security Notes

- All custom images run as non-root users
- Alpine-based images for minimal attack surface
- Health checks for automatic recovery
- MongoDB credentials in `.env` (add to .gitignore!)

## Assignment Compliance

✅ **docker-compose.yml** - Orchestrates all 3 application components
✅ **Dockerfiles** - Spring Boot, C++, React all containerized
✅ **Multi-stage builds** - Optimized image sizes
✅ **Health checks** - Automatic service monitoring
✅ **Networking** - Isolated Docker network
✅ **Volumes** - Optional MongoDB persistence

## Support

For issues, check:
1. `docker compose logs -f` - View all logs
2. `docker compose ps` - Check service health
3. `.env` file - Verify MongoDB URI
4. Health endpoints - http://localhost:8080/actuator/health
