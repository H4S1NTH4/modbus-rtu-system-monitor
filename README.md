# Modbus RTU System Monitoring

A complete system monitoring solution using Modbus RTU over TCP protocol with Spring Boot backend, C++ Modbus slave, and React web interface.

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- MongoDB Atlas account (or use local MongoDB)

### Build and Run

```bash
# Clone the repository
cd /home/hasinthad/Projects/modbus-rtu-system-monitor

# Build all containers
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check service health
docker compose ps
```

### Access the Application

- **Web UI:** http://localhost
- **REST API:** http://localhost:8080/api
- **API Health Check:** http://localhost:8080/actuator/health
- **Modbus Slave:** localhost:5000

## 📦 Components

### 1. Modbus Master (Spring Boot Backend)
- **Port:** 8080
- **Technology:** Java 21, Spring Boot 3.5.8
- **Database:** MongoDB (Atlas or local)
- **Features:**
  - REST API for job scheduling
  - Modbus RTU protocol implementation
  - Job execution management
  - Health monitoring with Actuator

### 2. Modbus Slave (C++ CLI Tool)
- **Port:** 5000
- **Technology:** C++11, compiled with GCC
- **Features:**
  - Listens on TCP port 5000
  - Responds to Modbus RTU requests
  - Provides CPU, RAM, and Disk usage metrics
  - Command-line configurable slave address

### 3. Web UI (React Frontend)
- **Port:** 80 (via Nginx)
- **Technology:** React 19, Create React App
- **Features:**
  - Job scheduling interface
  - Real-time metrics visualization
  - Auto-polling for status updates
  - Interactive charts with Recharts

## 🗄️ Database Configuration

### Using MongoDB Atlas (Default)

The application is pre-configured to use MongoDB Atlas. Your credentials are in the `.env` file:

```bash
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

**Docker compose will start 3 containers:**
- modbus-master (Spring Boot)
- modbus-slave (C++)
- modbus-web-ui (React/Nginx)

### Using Local MongoDB (Optional)

For offline development or testing:

```bash
# Option 1: Use override file
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

# Option 2: Manually edit docker-compose.yml
# Uncomment the mongodb service and volumes sections
# Update .env: MONGO_URI=mongodb://mongodb:27017/modbus-monitor
```

**Docker compose will start 4 containers:**
- mongodb (MongoDB 7.0)
- modbus-master (Spring Boot)
- modbus-slave (C++)
- modbus-web-ui (React/Nginx)

## 🛠️ Manual Development Setup (Without Docker)

### Terminal 1: Start Modbus Slave

```bash
cd modbus-slave
g++ -o system_monitor main.cpp crc.cpp -pthread -std=c++11
./system_monitor --slave_address 1
```

### Terminal 2: Start Spring Boot Backend

```bash
cd modbus-master
./mvnw spring-boot:run
```

### Terminal 3: Start React Frontend

```bash
cd modbus-web-ui
npm install
npm start
```

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Schedule a new monitoring job |
| GET | `/api/jobs/{jobId}` | Get job details with paginated execution history |
| GET | `/api/jobs` | List all jobs (optional) |
| PATCH | `/api/jobs/{jobId}` | Update/restart a job |
| DELETE | `/api/jobs/{jobId}` | Stop a scheduled job |

### Example: Create a Job

```bash
curl -X POST http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "targetIp": "localhost",
    "cronExpression": "* * * * *"
  }'
```

### Example: Get Job Status (with Pagination)

```bash
# Default pagination (page=0, size=20)
curl http://localhost:8080/api/jobs/{jobId}

# Custom pagination
curl http://localhost:8080/api/jobs/{jobId}?page=0&size=10
```

## 🔧 Docker Commands

### Build & Deploy

```bash
# Build all images
docker compose build

# Build specific service
docker compose build modbus-master

# Start services in background
docker compose up -d

# Start with live logs
docker compose up

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

# Check service status
docker compose ps

# Check resource usage
docker stats

# Inspect network
docker network inspect modbus-network
```

### Troubleshooting

```bash
# Restart a service
docker compose restart modbus-master

# Shell into a container
docker exec -it modbus-master sh

# Test health endpoint
docker exec -it modbus-master wget -O- http://localhost:8080/actuator/health

# Check MongoDB connectivity
docker exec -it modbus-master env | grep MONGO_URI
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Network                         │
│                  (modbus-network)                        │
│                                                          │
│  ┌──────────────┐      ┌──────────────┐                │
│  │   Web UI     │─────>│ Modbus Master│──> MongoDB     │
│  │ (Nginx:80)   │      │ (Spring:8080)│    Atlas       │
│  └──────────────┘      └──────┬───────┘                │
│                               │                          │
│                               ↓                          │
│                        ┌──────────────┐                 │
│                        │ Modbus Slave │                 │
│                        │  (C++:5000)  │                 │
│                        └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑                ↑
     Port 80             Port 8080         Port 5000
```

## 📊 Modbus Register Mapping

The Modbus slave exposes system metrics through input registers:

| Register | Metric | Description |
|----------|--------|-------------|
| 0x04 | CPU Usage | Percentage (0.00–100.00) |
| 0x06 | RAM Usage | Percentage (0.00–100.00) |
| 0x08 | Disk Usage | Root partition usage (0.00–100.00) |

## 🔒 Security

- All Docker images run as non-root users
- Alpine-based images for minimal attack surface
- Health checks for automatic service recovery
- CORS configuration for API access
- MongoDB credentials in `.env` file
- **Important:** Add `.env` to `.gitignore` to avoid exposing credentials

## 📝 Environment Variables

Edit `.env` file to configure:

```bash
# MongoDB Configuration
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority

# Modbus Slave Configuration
SLAVE_ADDRESS=1
```

## 🧪 Testing

### Manual Testing

```bash
# Test API health
curl http://localhost:8080/actuator/health

# Test Modbus slave connection
nc -zv localhost 5000

# Test Web UI
curl -I http://localhost

# Test job creation and monitoring
# 1. Open Web UI: http://localhost
# 2. Create a job with target IP: modbus-slave-1 (or localhost for local testing)
# 3. Set CRON expression: * * * * * (every minute)
# 4. View job executions with metrics
```

### Python Test Client

```bash
cd modbus-slave
python3 test_slave.py
```

## 📦 Project Structure

```
modbus-rtu-system-monitor/
├── docker-compose.yml          # Main orchestration file
├── docker-compose.local.yml    # Local MongoDB override
├── .env                        # Environment variables
├── README.md                   # This file
├── DOCKER.md                   # Detailed Docker guide
│
├── modbus-master/              # Spring Boot Backend
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── pom.xml
│   └── src/
│
├── modbus-slave/               # C++ Modbus Slave
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── main.cpp
│   ├── crc.cpp
│   └── crc.h
│
└── modbus-web-ui/              # React Frontend
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf
    ├── docker-entrypoint.sh
    ├── package.json
    └── src/
```

## 🚢 Deployment

### Production Deployment

1. **Update environment variables** in `.env` for production
2. **Build production images:**
   ```bash
   docker compose build --no-cache
   ```
3. **Start services:**
   ```bash
   docker compose up -d
   ```
4. **Monitor logs:**
   ```bash
   docker compose logs -f
   ```

### Cloud Deployment

The Docker setup is compatible with:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Kubernetes (use Kompose to convert)

## 📚 Additional Documentation

- [API Documentation](API.md) - Complete REST API reference with examples
- [Docker Deployment Guide](DOCKER.md) - Detailed Docker instructions
- [Web UI Documentation](modbus-web-ui/README.md) - Frontend details
- [Assignment Document](Assignment%20-%20Hasintha%20Dilshan.pdf) - Original requirements

## 🐛 Troubleshooting

### Common Issues

**1. Port already in use:**
```bash
# Check what's using the port
sudo lsof -i :8080
# Kill the process or change the port in docker-compose.yml
```

**2. MongoDB connection failed:**
```bash
# Check if MongoDB Atlas URI is correct in .env
# Verify network connectivity to Atlas
# Check Spring Boot logs: docker compose logs modbus-master
```

**3. Web UI can't connect to API:**
```bash
# Check if modbus-master is healthy
docker compose ps
# Verify CORS settings in application.properties
# Check nginx proxy configuration in modbus-web-ui/nginx.conf
```

**4. Build failures:**
```bash
# Clean Docker cache and rebuild
docker compose down -v
docker system prune -a
docker compose build --no-cache
```

## 👨‍💻 Author

Hasintha Dilshan - Software Engineer

## 🎯 Assignment Compliance

✅ Modbus Master & REST APIs (Spring Boot)
✅ Modbus Slave (C/C++ CLI Tool)
✅ Web UI (React)
✅ docker-compose.yml orchestration
✅ Complete documentation
✅ MongoDB Atlas integration
✅ Health checks and monitoring
✅ Production-ready deployment
