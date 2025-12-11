# Quick Start Guide - React Web UI

Get the Modbus RTU System Monitoring web UI up and running in minutes.

## Prerequisites

- Node.js 14+ installed
- npm package manager
- Spring Boot backend running on `http://localhost:8080`
- Modbus slave running on target system

## Installation (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend URL (if needed)
Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:8080/api
```

### 3. Start Development Server
```bash
npm start
```

The app opens at `http://localhost:3000`

## Using the Application (2 minutes)

### Create Your First Monitoring Job

1. **Enter Target IP**
   - Example: `192.168.1.100`

2. **Select or Enter CRON Expression**
   - Click preset button or enter custom
   - Examples:
     - `0 0 * * *` (Daily at midnight)
     - `0 */6 * * *` (Every 6 hours)
     - `*/5 * * * *` (Every 5 minutes)

3. **Click "Schedule Job"**
   - Job ID appears in success message

4. **View Job Status**
   - Click job in the "Monitoring Jobs" list
   - See real-time metrics and execution history

## Common Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Clear and reinstall
rm -rf node_modules && npm install
```

## Project Structure at a Glance

```
src/
├── components/         # React components
│   ├── JobScheduler.js    # Create jobs
│   ├── JobStatus.js       # Monitor jobs
│   └── MetricsDisplay.js  # View metrics
├── services/
│   └── apiService.js      # API calls
├── styles/             # Component styles
├── App.js              # Main app
└── index.js            # Entry point
```

## Component Quick Reference

### JobScheduler
**Use**: Create new monitoring jobs
**Props**: `onJobCreated` callback
**Features**: Form validation, CRON presets

### JobStatus
**Use**: Monitor job execution and metrics
**Props**: `jobId`, `onJobDeleted` callback
**Features**: Auto-polling, execution history, metrics display

### MetricsDisplay
**Use**: Visualize system metrics
**Props**: `telemetry` object, `executionTime`
**Features**: Charts, progress bars, color coding

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs/{id}` | Get job details |
| GET | `/api/jobs` | List all jobs |
| DELETE | `/api/jobs/{id}` | Delete job |

## Troubleshooting

### "Failed to fetch" error
**Solution**: Check backend is running
```bash
# In another terminal
cd ../modbus-master
mvn spring-boot:run
```

### Port 3000 already in use
**Solution**: Use different port
```bash
PORT=3001 npm start
```

### CORS error
**Solution**: Verify backend CORS settings allow `http://localhost:3000`

## Development Tips

### Enable Auto-refresh
- Click checkbox in Job Status panel
- Updates every 3 seconds

### View Latest Metrics
- Scroll to execution history
- Click on any execution to see details

### Test with Different IPs
- Use different target IPs to test multiple slaves
- System handles unlimited jobs

### Monitor Multiple Jobs
- Load all jobs with "Load All Jobs" button
- Click any job to view details

## Production Deployment

### Build for Production
```bash
npm run build
```

### Serve with HTTP Server
```bash
# Install http-server globally
npm install -g http-server

# Serve from build folder
http-server build -p 8000
```

### Docker Deployment (Optional)
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build"]
```

Build and run:
```bash
docker build -t modbus-web-ui .
docker run -p 3000:3000 modbus-web-ui
```

## Performance Notes

- Polling interval: 3 seconds (adjustable)
- Supports unlimited jobs
- Charts render efficiently with Recharts
- Responsive on all devices

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Next Steps

1. ✅ Create first monitoring job
2. ✅ View metrics and charts
3. ✅ Test with multiple jobs
4. ✅ Integrate with your infrastructure
5. ✅ Deploy to production

## File Locations

| Task | File |
|------|------|
| Configure backend URL | `.env` |
| Adjust polling interval | `src/components/JobStatus.js:14` |
| Change styling | `src/styles/*.css` |
| Add new component | `src/components/` |
| Modify API calls | `src/services/apiService.js` |

## Documentation

- **README.md** - Full documentation
- **API_DOCUMENTATION.md** - API reference
- **PROJECT_SUMMARY.md** - Architecture overview
- **QUICK_START.md** - This file

## Need Help?

Check these first:
1. Is backend running? (`http://localhost:8080`)
2. Is `.env` configured correctly?
3. Are there browser console errors?
4. Did you run `npm install`?

## Key Features

✨ Create monitoring jobs with flexible CRON scheduling
📊 Real-time metrics visualization with charts
🔄 Auto-refresh every 3 seconds
📱 Responsive mobile-friendly design
⚡ Fast, efficient React UI
🎨 Beautiful modern interface

---

**Ready to monitor?** Run `npm start` and visit `http://localhost:3000`! 🚀
