# Modbus RTU System Monitoring - API Documentation

This document describes the REST API endpoints that the React Web UI communicates with.

## Base URL

```
http://localhost:8080/api
```

Configure the base URL in the `.env` file:
```env
REACT_APP_API_URL=http://localhost:8080/api
```

## Authentication

Currently, the API does not require authentication.

## Endpoints

### 1. Create Monitoring Job

**Endpoint:** `POST /jobs`

**Description:** Creates a new monitoring job with a target IP and CRON schedule.

**Request Body:**
```json
{
  "targetIp": "192.168.1.100",
  "cronExpression": "0 0 * * *"
}
```

**Parameters:**
- `targetIp` (string, required): Target server IP address
- `cronExpression` (string, required): CRON expression for scheduling

**Response (201 Created):**
```json
{
  "jobId": "76221913-32ea-4e74-8289-0285677271ca",
  "targetIp": "192.168.1.100",
  "cronExpression": "0 0 * * *",
  "status": "RUNNING",
  "scheduledAt": 1763717292000
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid IP address or CRON expression",
  "timestamp": 1763717292000
}
```

**Example Using curl:**
```bash
curl -X POST http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "targetIp": "192.168.1.100",
    "cronExpression": "0 0 * * *"
  }'
```

**Example Using JavaScript (axios):**
```javascript
import axios from 'axios';

const createJob = async (targetIp, cronExpression) => {
  const response = await axios.post('/api/jobs', {
    targetIp,
    cronExpression
  });
  return response.data;
};
```

---

### 2. Get Job Status and Metrics

**Endpoint:** `GET /jobs/{jobId}`

**Description:** Retrieves the status and execution history of a specific job, including all metrics collected.

**Path Parameters:**
- `jobId` (string, required): Unique job identifier

**Response (200 OK):**
```json
{
  "jobId": "76221913-32ea-4e74-8289-0285677271ca",
  "status": "RUNNING",
  "targetIp": "192.168.1.100",
  "cronExpression": "0 0 * * *",
  "scheduledAt": 1763717292000,
  "executions": [
    {
      "exeAt": 1763717292000,
      "status": "COMPLETED",
      "telemetry": {
        "cpu": 45.5,
        "ram": 60.2,
        "disk": 70.8
      }
    },
    {
      "exeAt": 1763717392000,
      "status": "ERROR_TIMEOUT",
      "telemetry": {}
    }
  ]
}
```

**Response Fields:**
- `jobId` (string): Unique job identifier
- `status` (string): Current job status (RUNNING, STOPPED)
- `targetIp` (string): Target server IP address
- `cronExpression` (string): CRON schedule
- `scheduledAt` (number): Timestamp when job was created (milliseconds)
- `executions` (array): Array of execution records

**Execution Record Fields:**
- `exeAt` (number): Execution timestamp (milliseconds)
- `status` (string): Execution status
  - `PENDING`: Awaiting execution
  - `COMPLETED`: Successfully executed with metrics
  - `ERROR_TIMEOUT`: Request timed out
  - `ERROR_TCP`: TCP connection error
  - `ERROR_APP`: Application error
  - `ERROR_MODBUS`: Modbus protocol error
- `telemetry` (object): System metrics (only present on successful execution)
  - `cpu` (number): CPU usage percentage (0-100)
  - `ram` (number): RAM usage percentage (0-100)
  - `disk` (number): Disk usage percentage (0-100)

**Error Response (404 Not Found):**
```json
{
  "message": "Job not found",
  "jobId": "invalid-job-id"
}
```

**Example Using curl:**
```bash
curl http://localhost:8080/api/jobs/76221913-32ea-4e74-8289-0285677271ca
```

**Example Using JavaScript (axios):**
```javascript
const getJobStatus = async (jobId) => {
  const response = await axios.get(`/api/jobs/${jobId}`);
  return response.data;
};
```

---

### 3. List All Jobs (Optional)

**Endpoint:** `GET /jobs`

**Description:** Retrieves a list of all monitoring jobs, optionally filtered by status.

**Query Parameters:**
- `status` (string, optional): Filter by job status (RUNNING, STOPPED)

**Response (200 OK):**
```json
[
  {
    "jobId": "76221913-32ea-4e74-8289-0285677271ca",
    "status": "RUNNING",
    "targetIp": "192.168.1.100",
    "cronExpression": "0 0 * * *",
    "scheduledAt": 1763717292000
  },
  {
    "jobId": "87332024-43fb-5f85-9380-0396788382db",
    "status": "STOPPED",
    "targetIp": "192.168.1.101",
    "cronExpression": "0 */6 * * *",
    "scheduledAt": 1763717392000
  }
]
```

**Example Using curl:**
```bash
# Get all jobs
curl http://localhost:8080/api/jobs

# Get only running jobs
curl http://localhost:8080/api/jobs?status=RUNNING
```

**Example Using JavaScript (axios):**
```javascript
const getAllJobs = async (status = null) => {
  let url = '/api/jobs';
  if (status) {
    url += `?status=${status}`;
  }
  const response = await axios.get(url);
  return response.data;
};
```

---

### 4. Delete/Stop Job (Optional)

**Endpoint:** `DELETE /jobs/{jobId}`

**Description:** Stops a scheduled job and removes it from the system.

**Path Parameters:**
- `jobId` (string, required): Unique job identifier

**Response (200 OK):**
```json
{
  "message": "Job stopped successfully",
  "jobId": "76221913-32ea-4e74-8289-0285677271ca"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Job not found",
  "jobId": "invalid-job-id"
}
```

**Example Using curl:**
```bash
curl -X DELETE http://localhost:8080/api/jobs/76221913-32ea-4e74-8289-0285677271ca
```

**Example Using JavaScript (axios):**
```javascript
const deleteJob = async (jobId) => {
  const response = await axios.delete(`/api/jobs/${jobId}`);
  return response.data;
};
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200  | OK - Request successful |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid input |
| 404  | Not Found - Resource not found |
| 500  | Internal Server Error - Server error |

---

## CRON Expression Format

CRON expressions follow the standard format with 5 fields:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Examples

| Expression | Description |
|-----------|-------------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 */6 * * *` | Every 6 hours |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 0 1 * *` | First day of month at midnight |
| `30 2 * * 0` | Every Sunday at 2:30 AM |

---

## Error Handling

### Client-Side (JavaScript)

```javascript
import axios from 'axios';

try {
  const job = await createJob('192.168.1.100', '0 0 * * *');
  console.log('Job created:', job.jobId);
} catch (error) {
  if (error.response) {
    // Backend returned an error
    console.error('Error:', error.response.data.message);
    console.error('Status:', error.response.status);
  } else if (error.request) {
    // Request was made but no response
    console.error('No response from server');
  } else {
    // Error in request setup
    console.error('Error:', error.message);
  }
}
```

### Common Errors

**Invalid IP Address:**
```json
{
  "message": "Invalid IP address format",
  "status": 400
}
```

**Invalid CRON Expression:**
```json
{
  "message": "Invalid CRON expression",
  "status": 400
}
```

**Backend Not Running:**
```
Error: Network Error or ECONNREFUSED
```

Solution: Ensure Spring Boot backend is running on the configured URL.

---

## Rate Limiting

Currently, there are no rate limits on the API. In production, implement appropriate rate limiting strategies.

---

## CORS Configuration

The frontend is configured to communicate with `http://localhost:8080`. Ensure the backend has CORS enabled with the correct origin:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## WebSocket/Real-time Updates

Current implementation uses polling (every 3 seconds) for real-time updates. For production, consider implementing WebSocket for more efficient real-time communication.

---

