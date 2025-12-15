import React, { useState } from 'react';
import { createJob } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import CronBuilder from './CronBuilder';
import '../styles/JobScheduler.css';

const JobScheduler = ({ onJobCreated }) => {
  const [targetIp, setTargetIp] = useState('');
  const [cronExpression, setCronExpression] = useState('0 0 0 * * *');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validate IP address
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(targetIp)) {
      const errorMsg = 'Please enter a valid IP address';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setLoading(false);
      return;
    }

    // Validate CRON expression (basic validation)
    if (!cronExpression.trim()) {
      const errorMsg = 'Please enter a CRON expression';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setLoading(false);
      return;
    }

    try {
      const job = await createJob(targetIp, cronExpression);
      const successMsg = `Job created successfully! Job ID: ${job.id}`;
      setSuccess(successMsg);
      setTargetIp('');
      setCronExpression('0 0 * * *');
      showToast(successMsg, 'success');

      if (onJobCreated) {
        onJobCreated(job);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create job. Please check your input and try again.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-scheduler">
      <h2>Schedule Monitoring Job</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="targetIp">Target Server IP Address</label>
          <input
            type="text"
            id="targetIp"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="e.g., 192.168.1.100"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <CronBuilder
            value={cronExpression}
            onChange={setCronExpression}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Creating Job...' : 'Schedule Job'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
    </div>
  );
};

export default JobScheduler;
