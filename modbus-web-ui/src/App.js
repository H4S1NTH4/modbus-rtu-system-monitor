import React, { useState } from 'react';
import './App.css';
import { ToastProvider, useToast } from './context/ToastContext';
import Toast from './components/Toast';
import JobScheduler from './components/JobScheduler';
import JobStatus from './components/JobStatus';
import { getAllJobs } from './services/apiService';

function AppContent() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const { showToast } = useToast();

  const handleJobCreated = (newJob) => {
    setJobs([...jobs, newJob]);
    setSelectedJobId(newJob.id);
  };

  const handleJobDeleted = () => {
    // Update the job status to STOPPED instead of removing it from the list
    setJobs(jobs.map((job) =>
      job.id === selectedJobId ? { ...job, status: 'STOPPED' } : job
    ));
    setSelectedJobId(null);
  };

  const handleLoadJobs = async () => {
    setLoadingJobs(true);
    try {
      const jobList = await getAllJobs();
      setJobs(Array.isArray(jobList) ? jobList : []);
      if (jobList && jobList.length > 0) {
        showToast(`Loaded ${jobList.length} job(s)`, 'success');
      } else {
        showToast('No jobs found', 'info');
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      showToast('Failed to load jobs. Make sure the backend is running.', 'error');
    } finally {
      setLoadingJobs(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>Modbus RTU System Monitoring</h1>
          <p className="subtitle">Real-time monitoring and scheduling of system metrics</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <div className="content-grid">
            <div className="section">
              <JobScheduler onJobCreated={handleJobCreated} />
            </div>

            {selectedJobId && (
              <div className="section">
                <JobStatus
                  jobId={selectedJobId}
                  onJobDeleted={handleJobDeleted}
                />
              </div>
            )}

            <div className="section">
              <div className="jobs-list-panel">
                <h2>Monitoring Jobs</h2>

                <button
                  className="load-jobs-btn"
                  onClick={handleLoadJobs}
                  disabled={loadingJobs}
                >
                  {loadingJobs ? 'Loading...' : 'Load All Jobs'}
                </button>

                {jobs.length > 0 ? (
                  <div className="jobs-list">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className={`job-list-item ${selectedJobId === job.id ? 'active' : ''}`}
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <div className="job-list-item-header">
                          <strong>{job.targetIp || 'Unknown IP'}</strong>
                          <span className={`status-badge-small status-${job.status.toLowerCase()}`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="job-list-item-details">
                          <small className="job-id">ID: {job.id.substring(0, 8)}...</small>
                          <small className="job-cron">CRON: {job.cronExpression || 'N/A'}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-jobs-message">
                    <p>No jobs loaded yet. Create a new job or click "Load All Jobs" to see existing jobs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Modbus RTU System Monitoring © 2024 | Assignment by Hasintha Dilshan</p>
      </footer>

      <Toast />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
