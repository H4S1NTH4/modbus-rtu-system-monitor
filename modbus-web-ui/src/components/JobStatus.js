import React, { useState, useEffect } from 'react';
import { getJobStatus, deleteJob } from '../services/apiService';
import MetricsDisplay from './MetricsDisplay';
import '../styles/JobStatus.css';

const JobStatus = ({ jobId, onJobDeleted }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        setError(null);
        const jobData = await getJobStatus(jobId);
        setJob(jobData);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Failed to fetch job status. The backend may not be running.'
        );
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJobStatus();

    // Poll for updates every 3 seconds if polling is enabled
    const interval = setInterval(fetchJobStatus, 3000);

    return () => clearInterval(interval);
  }, [jobId, polling]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to stop this job?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteJob(jobId);
      if (onJobDeleted) {
        onJobDeleted();
      }
    } catch (err) {
      setError('Failed to delete job');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING':
        return '#4caf50'; // Green
      case 'STOPPED':
      case 'COMPLETED':
        return '#2196f3'; // Blue
      case 'ERROR':
      case 'ERROR_TIMEOUT':
      case 'ERROR_TCP':
      case 'ERROR_APP':
      case 'ERROR_MODBUS':
        return '#d32f2f'; // Red
      case 'PENDING':
        return '#ff9800'; // Orange
      default:
        return '#757575'; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RUNNING':
        return '⏸';
      case 'STOPPED':
        return '⏹';
      case 'COMPLETED':
        return '✓';
      case 'PENDING':
        return '⏳';
      default:
        return '⚠';
    }
  };

  if (loading) {
    return (
      <div className="job-status loading">
        <p>Loading job status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-status error">
        <div className="alert alert-error">{error}</div>
        <button
          className="retry-btn"
          onClick={() => {
            setLoading(true);
            setError(null);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-status">
        <div className="alert alert-info">No job data available</div>
      </div>
    );
  }

  const latestExecution = job.executions && job.executions.length > 0
    ? job.executions[0]
    : null;

  const statusColor = getStatusColor(job.status);

  return (
    <div className="job-status">
      <div className="job-header">
        <div className="job-title">
          <h3>Job ID: {jobId}</h3>
          <div
            className="status-badge"
            style={{ backgroundColor: statusColor }}
          >
            {getStatusIcon(job.status)} {job.status}
          </div>
        </div>

        <button
          className="delete-btn"
          onClick={handleDelete}
          disabled={deleteLoading}
        >
          {deleteLoading ? 'Stopping...' : 'Stop Job'}
        </button>
      </div>

      <div className="job-details">
        <div className="detail-item">
          <span className="detail-label">Status:</span>
          <span className="detail-value">{job.status}</span>
        </div>
        {job.targetIp && (
          <div className="detail-item">
            <span className="detail-label">Target IP:</span>
            <span className="detail-value">{job.targetIp}</span>
          </div>
        )}
        {job.cronExpression && (
          <div className="detail-item">
            <span className="detail-label">CRON Schedule:</span>
            <span className="detail-value">{job.cronExpression}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Scheduled At:</span>
          <span className="detail-value">
            {new Date(job.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Total Executions:</span>
          <span className="detail-value">{job.executions?.length || 0}</span>
        </div>
      </div>

      <div className="polling-control">
        <label>
          <input
            type="checkbox"
            checked={polling}
            onChange={(e) => setPolling(e.target.checked)}
          />
          Auto-refresh (every 3 seconds)
        </label>
      </div>

      {latestExecution && (
        <div className="latest-execution">
          <h4>Latest Execution</h4>
          <div className="execution-status" style={{ borderColor: getStatusColor(latestExecution.status) }}>
            <div className="status-info">
              <div className="execution-status-badge" style={{ backgroundColor: getStatusColor(latestExecution.status) }}>
                {getStatusIcon(latestExecution.status)} {latestExecution.status}
              </div>
              <div className="execution-time">
                {new Date(latestExecution.executionTime).toLocaleString()}
              </div>
            </div>

            {latestExecution.status === 'COMPLETED' && latestExecution.telemetry && (
              <MetricsDisplay
                telemetry={latestExecution.telemetry}
                executionTime={latestExecution.executionTime}
              />
            )}

            {latestExecution.status !== 'COMPLETED' &&
              latestExecution.status !== 'PENDING' &&
              latestExecution.status.startsWith('ERROR') && (
                <div className="error-details">
                  <strong>Error Type:</strong> {latestExecution.status}
                </div>
              )}
          </div>
        </div>
      )}

      {job.executions && job.executions.length > 1 && (
        <div className="execution-history">
          <h4>Execution History</h4>
          <div className="execution-list">
            {job.executions.map((execution, index) => (
              <div
                key={index}
                className="execution-item"
                style={{ borderLeftColor: getStatusColor(execution.status) }}
              >
                <span className="execution-index">#{index + 1}</span>
                <span className="execution-status-text" style={{ color: getStatusColor(execution.status) }}>
                  {getStatusIcon(execution.status)} {execution.status}
                </span>
                <span className="execution-datetime">
                  {new Date(execution.executionTime).toLocaleString()}
                </span>
                {execution.telemetry && Object.keys(execution.telemetry).length > 0 && (
                  <span className="execution-metrics">
                    CPU: {execution.telemetry.cpu?.toFixed(1)}% | RAM: {execution.telemetry.ram?.toFixed(1)}% | Disk: {execution.telemetry.disk?.toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobStatus;
