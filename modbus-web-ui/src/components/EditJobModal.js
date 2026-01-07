import React, { useState, useEffect } from 'react';
import { updateJob } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import CronBuilder from './CronBuilder';
import '../styles/EditJobModal.css';

const EditJobModal = ({ isOpen, job, onClose, onUpdate }) => {
  const [targetIp, setTargetIp] = useState('');
  const [cronExpression, setCronExpression] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && job) {
      setTargetIp(job.targetIp || '');
      setCronExpression(job.cronExpression || '0 0 * * *');
      setError(null);
    }
  }, [isOpen, job?.jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(targetIp)) {
      setError('Please enter a valid IP address');
      setLoading(false);
      return;
    }

    if (!cronExpression.trim()) {
      setError('Please enter a CRON expression');
      setLoading(false);
      return;
    }

    try {
      const updatedJob = await updateJob(job.jobId, targetIp, cronExpression);
      showToast('Job updated and restarted successfully', 'success');
      if (onUpdate) {
        onUpdate(updatedJob);
      }
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update job';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="edit-modal-backdrop" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>Edit Job</h3>
          <button
            className="edit-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-modal-content">
            <div className="form-group">
              <label htmlFor="edit-ip">Target Server IP Address</label>
              <input
                type="text"
                id="edit-ip"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                placeholder="e.g., 192.168.1.100"
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

            {error && <div className="alert alert-error">{error}</div>}
          </div>

          <div className="edit-modal-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobModal;
