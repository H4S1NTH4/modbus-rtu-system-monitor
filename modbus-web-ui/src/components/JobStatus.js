import React, { useState, useEffect } from 'react';
import { getJobStatusPaginated, deleteJob, updateJob } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import MetricsDisplay from './MetricsDisplay';
import EditJobModal from './EditJobModal';
import ConfirmDialog from './ConfirmDialog';
import '../styles/JobStatus.css';

const JobStatus = ({ jobId, onJobDeleted }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActionConfirm, setShowActionConfirm] = useState(false);
  const [actionType, setActionType] = useState(null); // 'stop' or 'start'
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [paginationData, setPaginationData] = useState(null);
  const { showToast } = useToast();

  // Reset to first page when jobId changes
  useEffect(() => {
    setCurrentPage(0);
  }, [jobId]);

  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        setError(null);
        const jobData = await getJobStatusPaginated(jobId, currentPage, pageSize);
        setJob(jobData);
        // Extract pagination data from response
        if (jobData.pagination) {
          setPaginationData(jobData.pagination);
        }
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
  }, [jobId, currentPage, pageSize, polling]);

  const handleStopClick = () => {
    setActionType('stop');
    setShowActionConfirm(true);
  };

  const handleStartClick = () => {
    setActionType('start');
    setShowActionConfirm(true);
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    try {
      if (actionType === 'stop') {
        await deleteJob(jobId);
        showToast('Job stopped successfully', 'success');
        if (onJobDeleted) {
          onJobDeleted();
        }
      } else if (actionType === 'start') {
        const updatedJob = await updateJob(jobId, job.targetIp, job.cronExpression);
        setJob(updatedJob);
        showToast('Job restarted successfully', 'success');
      }
      setShowActionConfirm(false);
      setActionType(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        (actionType === 'stop' ? 'Failed to stop job' : 'Failed to restart job');
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSuccess = (updatedJob) => {
    setJob(updatedJob);
    setShowEditModal(false);
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
          <h3>Job Details</h3>
          <div
            className="status-badge"
            style={{ backgroundColor: statusColor }}
          >
            {getStatusIcon(job.status)} {job.status}
          </div>
        </div>

        <div className="job-actions">
          <button
            className="edit-btn"
            onClick={() => setShowEditModal(true)}
            disabled={actionLoading || job.status === 'STOPPED'}
            title={job.status === 'STOPPED' ? 'Cannot edit stopped job' : 'Edit job parameters'}
          >
            ✎ Edit
          </button>
          {job.status === 'STOPPED' ? (
            <button
              className="start-btn"
              onClick={handleStartClick}
              disabled={actionLoading}
              title="Restart job"
            >
              {actionLoading ? 'Starting...' : '▶ Start'}
            </button>
          ) : (
            <button
              className="delete-btn"
              onClick={handleStopClick}
              disabled={actionLoading}
              title="Stop job"
            >
              {actionLoading ? 'Stopping...' : '⏹ Stop'}
            </button>
          )}
        </div>
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
          <span className="detail-value">{paginationData?.totalElements || job.executions?.length || 0}</span>
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

      {job.executions && job.executions.length > 0 && (
        <div className="execution-history">
          <h4>Execution History</h4>
          <div className="execution-list">
            {job.executions.map((execution, index) => {
              const displayIndex = currentPage * pageSize + index + 1;
              return (
                <div
                  key={index}
                  className="execution-item"
                  style={{ borderLeftColor: getStatusColor(execution.status) }}
                >
                  <span className="execution-index">#{displayIndex}</span>
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
              );
            })}
          </div>

          {paginationData && paginationData.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={paginationData.first}
                title="Previous page"
              >
                ← Previous
              </button>

              <div className="pagination-info">
                Page {currentPage + 1} of {paginationData.totalPages}
              </div>

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(paginationData.totalPages - 1, currentPage + 1))}
                disabled={paginationData.last}
                title="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      <EditJobModal
        isOpen={showEditModal}
        job={job}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdateSuccess}
      />

      <ConfirmDialog
        isOpen={showActionConfirm}
        title={actionType === 'stop' ? 'Stop Job' : 'Start Job'}
        message={
          actionType === 'stop'
            ? 'Are you sure you want to stop this monitoring job? This action will terminate the scheduled task.'
            : 'Are you sure you want to restart this job? It will resume the scheduled monitoring.'
        }
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setShowActionConfirm(false);
          setActionType(null);
        }}
        confirmText={actionType === 'stop' ? 'Stop Job' : 'Start Job'}
        cancelText="Cancel"
        danger={actionType === 'stop'}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default JobStatus;
