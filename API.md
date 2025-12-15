# Modbus RTU System Monitoring API Documentation

## Overview

The Modbus RTU System Monitoring API provides RESTful endpoints for scheduling, managing, and monitoring Modbus RTU jobs that collect system metrics (CPU, RAM, Disk usage) from remote Modbus slaves.

**Version:** 1.0
**Base URL:** `http://localhost:8080/api`
**Protocol:** HTTP/HTTPS
**Content-Type:** `application/json`

## Authentication

Currently, the API does not require authentication. For production deployments, consider implementing:
- JWT tokens
- OAuth 2.0
- API keys

## API Endpoints

### 1. Create a Job

Schedule a new monitoring job to periodically collect system metrics from a Modbus slave.

**Endpoint:** `POST /api/jobs`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "targetIp": "string",        // IP address or hostname of Modbus slave
  "cronExpression": "string"   // CRON expression for scheduling
}
```

**CRON Expression Examples:**
- `* * * * *` - Every minute
- `0 * * * *` - Every hour
- `0 0 * * *` - Daily at midnight
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Every weekday at 9 AM

**Response:** `200 OK`
```json
{
  "id": "76221913-32ea-4e74-8289-0285677271ca",
  "targetIp": "192.168.1.100",
  "cronExpression": "* * * * *",
  "status": "RUNNING",
  "createdAt": "2025-12-15T10:30:00"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "targetIp": "localhost",
    "cronExpression": "* * * * *"
  }'
```

**Error Responses:**

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 400 | Invalid request body | `{"error": "Invalid CRON expression"}` |
| 500 | Internal server error | `{"error": "Failed to schedule job"}` |

---

### 2. Get Job Details with Pagination

Retrieve detailed information about a specific job, including its execution history with pagination support.

**Endpoint:** `GET /api/jobs/{jobId}`

**Path Parameters:**
- `jobId` (string, required) - Unique job identifier

**Query Parameters:**
- `page` (integer, optional, default: 0) - Zero-based page number
- `size` (integer, optional, default: 20, max: 100) - Number of executions per page

**Response:** `200 OK`
```json
{
  "jobId": "76221913-32ea-4e74-8289-0285677271ca",
  "status": "RUNNING",
  "executions": [
    {
      "executionId": "exec-123",
      "executionTime": "2025-12-15T10:31:00",
      "status": "COMPLETED",
      "telemetry": {
        "cpu": 45.50,
        "ram": 62.80,
        "disk": 78.50
      }
    },
    {
      "executionId": "exec-124",
      "executionTime": "2025-12-15T10:32:00",
      "status": "ERROR_TIMEOUT",
      "telemetry": null
    }
  ],
  "pagination": {
    "currentPage": 0,
    "pageSize": 20,
    "totalElements": 156,
    "totalPages": 8,
    "first": true,
    "last": false
  }
}
```

**Example Requests:**
```bash
# Default pagination (page 0, size 20)
curl http://localhost:8080/api/jobs/76221913-32ea-4e74-8289-0285677271ca

# Custom pagination
curl "http://localhost:8080/api/jobs/76221913-32ea-4e74-8289-0285677271ca?page=0&size=10"

# Get page 2
curl "http://localhost:8080/api/jobs/76221913-32ea-4e74-8289-0285677271ca?page=2&size=20"
```

**Execution Status Values:**
- `PENDING` - Execution is scheduled but not yet started
- `COMPLETED` - Execution finished successfully with telemetry data
- `ERROR_APP` - Application-level error
- `ERROR_TCP` - TCP connection error
- `ERROR_TIMEOUT` - Request timeout
- `ERROR_MODBUS` - Modbus protocol error

**Error Responses:**

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 404 | Job not found | `{"timestamp": "...", "status": 404, "error": "Not Found", "message": "Job not found with id: {jobId}"}` |
| 400 | Invalid pagination parameters | `{"error": "Page size must be between 1 and 100"}` |

---

### 3. List All Jobs

Retrieve a list of all monitoring jobs.

**Endpoint:** `GET /api/jobs`

**Query Parameters:**
- None (future enhancement could add filtering by status)

**Response:** `200 OK`
```json
[
  {
    "id": "76221913-32ea-4e74-8289-0285677271ca",
    "targetIp": "192.168.1.100",
    "cronExpression": "* * * * *",
    "status": "RUNNING",
    "createdAt": "2025-12-15T10:30:00"
  },
  {
    "id": "88331924-43fb-5e85-9396-1396788382db",
    "targetIp": "192.168.1.101",
    "cronExpression": "0 * * * *",
    "status": "STOPPED",
    "createdAt": "2025-12-15T09:00:00"
  }
]
```

**Example Request:**
```bash
curl http://localhost:8080/api/jobs
```

**Error Responses:**

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 500 | Internal server error | `{"error": "Failed to retrieve jobs"}` |

---

### 4. Update/Restart Job

Update an existing job's configuration (target IP and/or CRON expression) and restart it.

**Endpoint:** `PATCH /api/jobs/{jobId}`

**Path Parameters:**
- `jobId` (string, required) - Unique job identifier

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "targetIp": "string",        // New target IP (optional)
  "cronExpression": "string"   // New CRON expression (optional)
}
```

**Response:** `200 OK`
```json
{
  "id": "76221913-32ea-4e74-8289-0285677271ca",
  "targetIp": "192.168.1.102",
  "cronExpression": "0 * * * *",
  "status": "RUNNING",
  "createdAt": "2025-12-15T10:30:00"
}
```

**Example Request:**
```bash
curl -X PATCH http://localhost:8080/api/jobs/76221913-32ea-4e74-8289-0285677271ca \
  -H "Content-Type: application/json" \
  -d '{
    "targetIp": "192.168.1.102",
    "cronExpression": "0 * * * *"
  }'
```

**Behavior:**
1. Stops the current job if running
2. Updates the job configuration
3. Restarts the job with new settings
4. Preserves execution history

**Error Responses:**

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 404 | Job not found | `{"timestamp": "...", "status": 404, "error": "Not Found", "message": "Job not found with id: {jobId}"}` |
| 400 | Invalid request body | `{"error": "Invalid CRON expression"}` |
| 500 | Internal server error | `{"error": "Failed to update job"}` |

---

### 5. Stop/Delete Job

Stop a running job and optionally delete it from the system.

**Endpoint:** `DELETE /api/jobs/{jobId}`

**Path Parameters:**
- `jobId` (string, required) - Unique job identifier

**Response:** `200 OK`
```json
{
  "message": "Job stopped successfully"
}
```

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/api/jobs/76221913-32ea-4e74-8289-0285677271ca
```

**Behavior:**
1. Stops the scheduled job
2. Updates job status to "STOPPED"
3. Preserves job metadata and execution history

**Error Responses:**

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 404 | Job not found | `{"timestamp": "...", "status": 404, "error": "Not Found", "message": "Job not found with id: {jobId}"}` |
| 500 | Internal server error | `{"error": "Failed to stop job"}` |

---

## Data Models

### Job Object

Represents a scheduled monitoring job.

```json
{
  "id": "string",                // UUID - Unique job identifier
  "targetIp": "string",          // IP address or hostname of Modbus slave
  "cronExpression": "string",    // CRON scheduling expression
  "status": "string",            // Job status: "RUNNING" | "STOPPED"
  "createdAt": "string"          // ISO 8601 timestamp
}
```

### JobExecution Object

Represents a single execution of a job.

```json
{
  "executionId": "string",       // Unique execution identifier
  "executionTime": "string",     // ISO 8601 timestamp of execution
  "status": "string",            // Execution status (see values below)
  "telemetry": {                 // System metrics (null if execution failed)
    "cpu": "number",             // CPU usage percentage (0-100)
    "ram": "number",             // RAM usage percentage (0-100)
    "disk": "number"             // Disk usage percentage (0-100)
  }
}
```

**Execution Status Values:**
- `PENDING` - Scheduled but not executed
- `COMPLETED` - Successful execution with data
- `ERROR_APP` - Application error
- `ERROR_TCP` - Network/TCP error
- `ERROR_TIMEOUT` - Request timeout
- `ERROR_MODBUS` - Modbus protocol error

### Telemetry Object

System metrics collected from Modbus slave.

```json
{
  "cpu": 45.50,    // CPU usage percentage (0.00-100.00)
  "ram": 62.80,    // RAM usage percentage (0.00-100.00)
  "disk": 78.50    // Disk usage percentage (0.00-100.00)
}
```

### PaginationMetadata Object

Pagination information for paginated responses.

```json
{
  "currentPage": 0,         // Current page number (0-based)
  "pageSize": 20,           // Number of items per page
  "totalElements": 156,     // Total number of items across all pages
  "totalPages": 8,          // Total number of pages
  "first": true,            // Is this the first page?
  "last": false             // Is this the last page?
}
```

---

## Pagination

The API supports pagination for job execution history to efficiently handle large datasets.

### Parameters

- **page** (integer, optional, default: 0)
  - Zero-based page index
  - Must be >= 0
  - Invalid values are reset to 0

- **size** (integer, optional, default: 20, max: 100)
  - Number of items per page
  - Valid range: 1-100
  - Values > 100 are capped at 100
  - Values <= 0 are reset to default (20)

### Response Format

Paginated responses include:
1. **executions** - Array of execution objects for current page
2. **pagination** - Metadata about the pagination state

### Navigation

```bash
# First page
GET /api/jobs/{jobId}?page=0&size=20

# Next page
GET /api/jobs/{jobId}?page=1&size=20

# Last page (calculate: totalPages - 1)
GET /api/jobs/{jobId}?page=7&size=20

# Custom page size
GET /api/jobs/{jobId}?page=0&size=50
```

### Empty Results

When requesting a page beyond available data:
```json
{
  "jobId": "...",
  "status": "RUNNING",
  "executions": [],
  "pagination": {
    "currentPage": 999,
    "pageSize": 20,
    "totalElements": 156,
    "totalPages": 8,
    "first": false,
    "last": false
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow this consistent format:

```json
{
  "timestamp": "2025-12-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Job not found with id: 76221913-32ea-4e74-8289-0285677271ca",
  "path": "/api/jobs/76221913-32ea-4e74-8289-0285677271ca"
}
```

### HTTP Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (future enhancement) |
| 400 | Bad Request | Invalid request parameters or body |
| 404 | Not Found | Resource (job) not found |
| 500 | Internal Server Error | Server-side error |

### Common Error Scenarios

**1. Job Not Found (404)**
```json
{
  "timestamp": "2025-12-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Job not found with id: invalid-id"
}
```

**2. Invalid CRON Expression (400)**
```json
{
  "error": "Invalid CRON expression: must be in format '* * * * *'"
}
```

**3. Invalid Pagination Parameters (400)**
```json
{
  "error": "Page size must be between 1 and 100"
}
```

---

## Health Check

Monitor API health status.

**Endpoint:** `GET /actuator/health`

**Response:** `200 OK`
```json
{
  "status": "UP",
  "components": {
    "mongo": {
      "status": "UP",
      "details": {
        "version": "7.0.0"
      }
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

**Example Request:**
```bash
curl http://localhost:8080/actuator/health
```

---

## Rate Limiting

Currently, there are no rate limits. For production:
- Implement rate limiting per IP
- Recommended: 100 requests/minute per IP
- Consider API key-based rate limiting

---

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost`
- `http://localhost:80`

**Allowed Methods:**
- GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:**
- All headers (`*`)

For production, update CORS configuration in `application.properties`:
```properties
spring.web.cors.allowed-origins=https://yourdomain.com
```

---

## Examples

### Complete Workflow Example

```bash
# 1. Create a job
JOB_ID=$(curl -s -X POST http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "targetIp": "localhost",
    "cronExpression": "* * * * *"
  }' | jq -r '.id')

echo "Created job: $JOB_ID"

# 2. Wait for some executions (1-2 minutes)
sleep 120

# 3. Get job details with pagination
curl http://localhost:8080/api/jobs/$JOB_ID?page=0&size=5 | jq

# 4. List all jobs
curl http://localhost:8080/api/jobs | jq

# 5. Update the job
curl -X PATCH http://localhost:8080/api/jobs/$JOB_ID \
  -H "Content-Type: application/json" \
  -d '{
    "cronExpression": "0 * * * *"
  }' | jq

# 6. Stop the job
curl -X DELETE http://localhost:8080/api/jobs/$JOB_ID
```

### JavaScript (Fetch API) Example

```javascript
// Create a job
const createJob = async () => {
  const response = await fetch('http://localhost:8080/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetIp: 'localhost',
      cronExpression: '* * * * *'
    })
  });
  return await response.json();
};

// Get job with pagination
const getJob = async (jobId, page = 0, size = 20) => {
  const response = await fetch(
    `http://localhost:8080/api/jobs/${jobId}?page=${page}&size=${size}`
  );
  return await response.json();
};

// Update job
const updateJob = async (jobId, updates) => {
  const response = await fetch(`http://localhost:8080/api/jobs/${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });
  return await response.json();
};

// Usage
(async () => {
  const job = await createJob();
  console.log('Created:', job);

  // Wait for executions
  setTimeout(async () => {
    const details = await getJob(job.id, 0, 10);
    console.log('Job details:', details);
  }, 60000);
})();
```

### Python (requests) Example

```python
import requests
import time

BASE_URL = "http://localhost:8080/api"

# Create a job
def create_job(target_ip, cron_expression):
    response = requests.post(
        f"{BASE_URL}/jobs",
        json={
            "targetIp": target_ip,
            "cronExpression": cron_expression
        }
    )
    return response.json()

# Get job with pagination
def get_job(job_id, page=0, size=20):
    response = requests.get(
        f"{BASE_URL}/jobs/{job_id}",
        params={"page": page, "size": size}
    )
    return response.json()

# Update job
def update_job(job_id, updates):
    response = requests.patch(
        f"{BASE_URL}/jobs/{job_id}",
        json=updates
    )
    return response.json()

# Delete job
def delete_job(job_id):
    response = requests.delete(f"{BASE_URL}/jobs/{job_id}")
    return response.json()

# Usage
if __name__ == "__main__":
    # Create job
    job = create_job("localhost", "* * * * *")
    print(f"Created job: {job['id']}")

    # Wait for executions
    time.sleep(120)

    # Get details
    details = get_job(job['id'], page=0, size=10)
    print(f"Total executions: {details['pagination']['totalElements']}")

    # Update
    updated = update_job(job['id'], {"cronExpression": "0 * * * *"})
    print(f"Updated: {updated}")

    # Delete
    delete_job(job['id'])
    print("Job deleted")
```

---

## Modbus Protocol Details

### Connection Parameters
- **Port:** 5000 (configurable via Modbus slave)
- **Protocol:** Modbus RTU over TCP
- **Function Code:** 0x03 (Read Holding Registers) or 0x04 (Read Input Registers)
- **Byte Order:** Big-endian (network byte order)
- **Error Detection:** CRC-16

### Register Mapping

| Register Address | Metric | Data Type | Scale | Range |
|------------------|--------|-----------|-------|-------|
| 0x04 | CPU Usage | uint16 | ×100 | 0-10000 (0.00%-100.00%) |
| 0x06 | RAM Usage | uint16 | ×100 | 0-10000 (0.00%-100.00%) |
| 0x08 | Disk Usage | uint16 | ×100 | 0-10000 (0.00%-100.00%) |

**Example:**
- Raw value: 4550
- Actual value: 45.50%

---

## Versioning

**Current Version:** v1
**API Prefix:** `/api`

Future versions may use:
- `/api/v2` for breaking changes
- Query parameter: `?version=2`
- Header: `Accept: application/vnd.modbus.v2+json`

---

## Support & Contact

For API support:
- **Documentation:** [README.md](README.md)
- **Docker Guide:** [DOCKER.md](DOCKER.md)
- **Issues:** Report via GitHub issues

---

## Changelog

### Version 1.0 (2025-12-15)
- Initial API release
- Job CRUD operations
- Pagination support for execution history
- Health check endpoint
- Error handling standardization
