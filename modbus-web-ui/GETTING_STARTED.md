# Getting Started with the React Web UI

Welcome to the Modbus RTU System Monitoring Web UI! This guide will help you get up and running quickly.

## 📋 What You've Got

A complete, production-ready React application for:
- Creating and managing monitoring jobs
- Viewing real-time system metrics (CPU, RAM, Disk)
- Visualizing data with interactive charts
- Scheduling jobs with CRON expressions
- Managing job execution and history

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd modbus-web-ui
npm install
```

### Step 2: Configure Backend (if not on localhost:8080)
Edit `.env`:
```env
REACT_APP_API_URL=http://your-backend-url:8080/api
```

### Step 3: Start the App
```bash
npm start
```

The app opens at `http://localhost:3000` automatically.

## 🎯 Using the App

### Create a Monitoring Job
1. **Fill in Target IP**: e.g., `192.168.1.100`
2. **Enter CRON Expression**: or click a preset
3. **Click Schedule Job**
4. Success message shows your job ID

### View Job Status
1. Click any job in the "Monitoring Jobs" list
2. See real-time status, execution history, and metrics
3. Enable "Auto-refresh" for live updates

### Understand the Metrics
- **Green** (0-60%): Good
- **Orange** (60-80%): Warning
- **Red** (80-100%): Critical

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Complete user guide |
| **QUICK_START.md** | Quick reference |
| **API_DOCUMENTATION.md** | API endpoints reference |
| **PROJECT_SUMMARY.md** | Technical architecture |
| **GETTING_STARTED.md** | This file |

## 🏗️ Project Structure

```
src/
├── components/
│   ├── JobScheduler.js    ← Create jobs here
│   ├── JobStatus.js       ← Monitor jobs here
│   └── MetricsDisplay.js  ← View charts here
├── services/
│   └── apiService.js      ← API communication
├── styles/
│   └── *.css              ← Component styles
├── App.js                 ← Main app
└── index.js               ← Entry point
```

## 🔧 Configuration

### Environment Variables
- `REACT_APP_API_URL` - Backend API base URL (default: `http://localhost:8080/api`)

### Polling Interval
- Default: 3 seconds
- Location: `src/components/JobStatus.js` line 14
- Change: Modify the interval in the `useEffect` hook

## 🚀 Available Commands

```bash
# Development
npm start          # Start dev server (port 3000)
npm test           # Run tests
npm run build      # Production build

# Troubleshooting
npm install        # Install dependencies
rm -rf node_modules && npm install  # Clean install
```

## ✨ Key Features

### Job Scheduling
- Target server IP input
- CRON expression scheduling
- Preset CRON quick selectors
- Input validation
- Real-time status updates

### Metrics Display
- Live CPU, RAM, Disk metrics
- Interactive pie chart
- Bar chart comparison
- Progress bars
- Color-coded status

### Job Management
- View all jobs
- Filter by status
- Real-time updates
- Execution history
- Delete/stop jobs

### User Experience
- Responsive design (mobile-friendly)
- Real-time polling
- Loading states
- Error messages
- Success notifications

## 🐛 Troubleshooting

### "Failed to fetch" Error
**Problem**: Can't connect to backend
**Solution**:
1. Check backend is running: `http://localhost:8080`
2. Verify `.env` has correct API URL
3. Enable CORS on backend

### Port 3000 Already in Use
**Problem**: Another app using port 3000
**Solution**:
```bash
PORT=3001 npm start
```

### CORS Error
**Problem**: Browser blocks API calls
**Solution**:
- Ensure backend CORS settings allow `http://localhost:3000`
- Add to backend: `Access-Control-Allow-Origin: http://localhost:3000`

### No Metrics Showing
**Problem**: Job runs but no metrics
**Solution**:
1. Verify Modbus slave is running
2. Check target IP is correct
3. Verify backend can reach target
4. Check job status for error details

## 🧪 Testing the App

### Test Scenario 1: Basic Job Creation
```
1. Enter IP: 192.168.1.100
2. Enter CRON: 0 0 * * * (daily)
3. Click "Schedule Job"
4. See success message with Job ID
```

### Test Scenario 2: View Metrics
```
1. Wait for job to execute (or create with * * * * * for every minute)
2. Click job in list
3. See metrics in charts
4. Enable auto-refresh
5. Watch metrics update live
```

### Test Scenario 3: Job Management
```
1. Create multiple jobs with different IPs
2. Click "Load All Jobs"
3. Click different jobs
4. Test "Stop Job" button
5. See job removed from list
```

## 📈 Performance Tips

- **Many Jobs**: The UI handles unlimited jobs efficiently
- **Large Updates**: Charts update smoothly with Recharts
- **Mobile**: Fully responsive on all devices
- **Polling**: Adjust interval if needed to reduce server load

## 🔐 Security Notes

### Development
- API URL is in environment variable
- No sensitive data in local storage
- Proper error handling

### Production
- Use HTTPS only
- Implement authentication
- Enable CORS securely
- Validate all inputs server-side
- Use environment variables for secrets

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| react | UI framework |
| axios | HTTP requests |
| recharts | Charts & visualization |
| react-scripts | Build tools |

## 🌐 Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## 📱 Responsive Breakpoints

- **Desktop**: Full layout (1024px+)
- **Tablet**: Adjusted grid (768px-1024px)
- **Mobile**: Single column (<768px)

## 🎨 Customization

### Change Colors
Edit `src/styles/App.css` and component CSS files

### Add Components
Create new file in `src/components/`

### Modify API
Edit `src/services/apiService.js`

### Change Polling Interval
Edit `src/components/JobStatus.js` line 14:
```javascript
const interval = setInterval(fetchJobStatus, 3000); // 3 seconds
```

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

Creates optimized `build/` folder.

### Serve Locally
```bash
npx serve -s build
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build"]
```

## 📞 Need Help?

1. **Setup Issues**: Check QUICK_START.md
2. **API Questions**: See API_DOCUMENTATION.md
3. **Architecture**: Read PROJECT_SUMMARY.md
4. **Features**: Check README.md

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Axios Guide](https://axios-http.com)
- [Recharts Examples](https://recharts.org)
- [CRON Reference](https://crontab.guru/)

## ✅ Next Steps

1. ✅ Run `npm start`
2. ✅ Create first monitoring job
3. ✅ View metrics and charts
4. ✅ Test auto-refresh
5. ✅ Try different CRON expressions
6. ✅ Create multiple jobs
7. ✅ Test job deletion
8. ✅ Review the code
9. ✅ Customize as needed
10. ✅ Deploy to production

## 🎯 Common Tasks

### Change Backend URL
1. Edit `.env` file
2. Change `REACT_APP_API_URL` value
3. Restart dev server: `npm start`

### Debug API Issues
1. Open browser DevTools (F12)
2. Go to Network tab
3. Create a job
4. Check API request/response
5. Look for CORS or 404 errors

### Test with Different IP
1. Update target IP in form
2. Create new job
3. Check if job executes
4. View metrics

### Modify Auto-refresh
1. Open `src/components/JobStatus.js`
2. Find `setInterval(fetchJobStatus, 3000)`
3. Change 3000 to desired milliseconds
4. Save and app reloads

## 🏁 You're Ready!

Everything is set up and ready to use. Start with:

```bash
npm start
```

Then visit `http://localhost:3000` and create your first monitoring job!

Happy monitoring! 🎉
