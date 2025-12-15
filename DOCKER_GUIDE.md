# Docker Setup Guide

This guide explains how to run the Modbus RTU System Monitor using Docker Compose in different configurations.

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured with your MongoDB connection string

---

## Configuration Options

### Option 1: Cloud MongoDB (MongoDB Atlas) - Recommended for Development

**Setup:**
1. Create/update `.env` file:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/modbus-monitor?retryWrites=true&w=majority
   ```

2. Start all services:
   ```bash
   docker compose up -d
   ```

3. View logs:
   ```bash
   docker compose logs -f
   ```

4. Stop services:
   ```bash
   docker compose down
   ```

---

### Option 2: Local MongoDB (For Local Development)

**Setup:**
1. Start with local MongoDB override:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
   ```

2. View logs:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f
   ```

3. Stop services:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml down
   ```

4. Remove volumes (clean slate):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
   ```

---

## Running Individual Services

### Backend Only (Modbus Master)
```bash
docker compose up -d modbus-master
```

### Frontend Only (Web UI)
```bash
docker compose up -d modbus-web-ui
```

### Slave Only (System Monitor)
```bash
docker compose up -d modbus-slave
```

### Multiple Specific Services
```bash
docker compose up -d modbus-master modbus-web-ui
```

---

## Useful Commands

### View Running Containers
```bash
docker compose ps
```

### View Logs for Specific Service
```bash
docker compose logs -f modbus-master
docker compose logs -f modbus-web-ui
docker compose logs -f modbus-slave
```

### Restart a Service
```bash
docker compose restart modbus-master
```

### Rebuild and Start (After Code Changes)
```bash
docker compose up -d --build
```

### Rebuild Specific Service
```bash
docker compose up -d --build modbus-master
```

### Stop Without Removing Containers
```bash
docker compose stop
```

### Remove Everything (Containers, Networks)
```bash
docker compose down
```

### Remove Everything Including Volumes (Fresh Start)
```bash
docker compose down -v
```

---

## Service Access URLs

Once running, access the services at:

- **Web UI**: http://localhost:80
- **Backend API**: http://localhost:8080/api
- **Modbus Slave**: modbus-slave-1:5000 (within Docker network)
- **MongoDB** (if local): localhost:27017

---

## Health Checks

Check if services are healthy:
```bash
docker compose ps
```

Look for the "STATUS" column - should show "Up (healthy)" for each service.

---

## Troubleshooting

### Check Service Health
```bash
docker inspect modbus-master --format='{{.State.Health.Status}}'
```

### Enter a Running Container
```bash
docker exec -it modbus-master /bin/bash
docker exec -it modbus-web-ui /bin/sh
```

### View Network Configuration
```bash
docker network inspect modbus-network
```

### Check Environment Variables
```bash
docker compose config
```

---

## Development Workflow

### 1. Start Services
```bash
docker compose up -d
```

### 2. Make Code Changes

### 3. Rebuild Changed Service
```bash
docker compose up -d --build modbus-master  # if backend changed
docker compose up -d --build modbus-web-ui  # if frontend changed
```

### 4. View Logs
```bash
docker compose logs -f modbus-master
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start all services | `docker compose up -d` |
| Stop all services | `docker compose down` |
| View logs | `docker compose logs -f` |
| Rebuild all | `docker compose up -d --build` |
| Start with local MongoDB | `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d` |
| Check status | `docker compose ps` |
| Fresh start | `docker compose down -v && docker compose up -d` |
