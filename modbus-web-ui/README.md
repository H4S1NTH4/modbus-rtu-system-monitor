# Modbus RTU System Monitoring - React Web UI

A modern React-based web interface for managing and monitoring Modbus RTU system metrics. This application allows users to schedule monitoring jobs, view real-time system metrics (CPU, RAM, Disk usage), and manage job executions.

## Features

- **Job Scheduling**: Create monitoring jobs with target IP address and CRON expressions
- **Real-time Metrics**: View CPU, RAM, and Disk usage metrics with visual charts
- **Job Management**: List, view, and manage all monitoring jobs
- **Auto-polling**: Automatic updates every 3 seconds (configurable)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Visual Analytics**: Interactive pie charts and bar charts for metrics visualization
- **Status Tracking**: Monitor job execution status with detailed history

## Prerequisites

- Node.js 14 or higher
- npm or yarn package manager
- Spring Boot backend running on `http://localhost:8080`

## Installation

1. Navigate to the project directory:
   ```bash
   cd modbus-web-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### Environment Variables

Create or update the `.env` file in the project root:

```env
REACT_APP_API_URL=http://localhost:8080/api
```

Change the `REACT_APP_API_URL` to match your backend server's address if different.

## Development

Start the development server:

```bash
npm start
```

The application will open at `http://localhost:3000` in your default browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm run eject` - Ejects from Create React App (irreversible)

## Project Structure

```
src/
├── components/
│   ├── JobScheduler.js      # Form for creating monitoring jobs
│   ├── JobStatus.js         # Job status and metrics display
│   └── MetricsDisplay.js    # Visual representation of metrics
├── services/
│   └── apiService.js        # REST API client
├── styles/
│   ├── App.css              # Main application styles
│   ├── JobScheduler.css     # JobScheduler component styles
│   ├── JobStatus.css        # JobStatus component styles
│   └── MetricsDisplay.css   # MetricsDisplay component styles
├── App.js                   # Main application component
└── index.js                 # Application entry point
```

## Usage

### Creating a Monitoring Job

1. Fill in the **Target Server IP Address** field (e.g., 192.168.1.100)
2. Enter a **CRON Expression** for scheduling or use one of the preset options:
   - Every minute: `* * * * *`
   - Every hour: `0 * * * *`
   - Daily at midnight: `0 0 * * *`
   - Every 6 hours: `0 */6 * * *`
   - Every weekday at 9 AM: `0 9 * * 1-5`
3. Click **Schedule Job** to create the job

### Viewing Job Status

- Click on any job in the **Monitoring Jobs** list to view its details
- The **Job Status** panel shows:
  - Current status (RUNNING, STOPPED, etc.)
  - Execution history
  - Latest metrics with visual charts
  - Error details if applicable

### Managing Jobs

- Use the **Load All Jobs** button to fetch and display all jobs from the backend
- Click **Stop Job** to delete/stop a scheduled job
- Enable **Auto-refresh** to continuously poll for updates

## API Endpoints

The UI communicates with the following REST endpoints:

- `POST /api/jobs` - Create a new monitoring job
- `GET /api/jobs/{jobId}` - Get job details and metrics
- `GET /api/jobs` - List all jobs (optional)
- `DELETE /api/jobs/{jobId}` - Stop a job (optional)

## Dependencies

### Main Dependencies

- **react** (18.x) - UI library
- **react-dom** (18.x) - React DOM renderer
- **axios** - HTTP client for API requests
- **recharts** - React chart library for data visualization

### Dev Dependencies

- **react-scripts** - Create React App build scripts
- **@testing-library/react** - Testing utilities

## Building for Production

Create an optimized production build:

```bash
npm run build
```

This creates a `build` folder with optimized and minified files ready for deployment.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Backend Connection Issues

If you see "Failed to fetch jobs" or similar API errors:

1. Ensure the Spring Boot backend is running on the configured URL
2. Check the `REACT_APP_API_URL` in the `.env` file
3. Verify CORS settings on the backend allow requests from the frontend

### Build Issues

Clear node modules and reinstall:

```bash
rm -rf node_modules
npm install
```

## Performance Considerations

- The UI auto-refreshes job status every 3 seconds (can be toggled)
- Large metric datasets are handled efficiently with React's re-render optimization
- Charts use Recharts library which is optimized for performance

## Security Notes

- Always use HTTPS in production
- Ensure proper authentication/authorization on the backend
- Sensitive data should be handled securely

## License

Part of the Modbus RTU System Monitoring assignment.

## Support

For issues or questions, refer to the main project documentation or contact the development team.
