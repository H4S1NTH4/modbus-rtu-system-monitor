import React, { useState } from 'react';
import { createJob } from '../services/apiService';
import '../styles/JobScheduler.css';

const JobScheduler = ({ onJobCreated }) => {
  const [targetIp, setTargetIp] = useState('');
  const [cronExpression, setCronExpression] = useState('0 0 * * *');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validate IP address
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(targetIp)) {
      setError('Please enter a valid IP address');
      setLoading(false);
      return;
    }

    // Validate CRON expression (basic validation)
    if (!cronExpression.trim()) {
      setError('Please enter a CRON expression');
      setLoading(false);
      return;
    }

    try {
      const job = await createJob(targetIp, cronExpression);
      setSuccess(`Job created successfully! Job ID: ${job.id}`);
      setTargetIp('');
      setCronExpression('0 0 * * *');

      if (onJobCreated) {
        onJobCreated(job);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create job. Please check your input and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const cronExamples = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Every weekday at 9 AM', value: '0 9 * * 1-5' },
  ];

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
          <label htmlFor="cronExpression">CRON Expression</label>
          <input
            type="text"
            id="cronExpression"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder="e.g., 0 0 * * *"
            required
            disabled={loading}
          />
          <small>Format: minute hour day month day-of-week</small>
        </div>

        <div className="cron-examples">
          <p>Quick presets:</p>
          <div className="preset-buttons">
            {cronExamples.map((example) => (
              <button
                key={example.value}
                type="button"
                className="preset-btn"
                onClick={() => setCronExpression(example.value)}
                disabled={loading}
                title={example.label}
              >
                {example.label}
              </button>
            ))}
          </div>
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
