import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create a new monitoring job
 * @param {string} targetIp - Target server IP address
 * @param {string} cronExpression - CRON expression for scheduling
 * @returns {Promise} Job details including jobId
 */
export const createJob = async (targetIp, cronExpression) => {
  try {
    const response = await apiClient.post('/jobs', {
      targetIp,
      cronExpression,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

/**
 * Get job status and metrics
 * @param {string} jobId - Job ID
 * @returns {Promise} Job status and execution data
 */
export const getJobStatus = async (jobId) => {
  try {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job status:', error);
    throw error;
  }
};

/**
 * Get all jobs
 * @param {string} status - Optional status filter (RUNNING, STOPPED)
 * @returns {Promise} Array of jobs
 */
export const getAllJobs = async (status = null) => {
  try {
    let url = '/jobs';
    if (status) {
      url += `?status=${status}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

/**
 * Update and restart a job
 * @param {string} jobId - Job ID
 * @param {string} targetIp - New target server IP address
 * @param {string} cronExpression - New CRON expression for scheduling
 * @returns {Promise} Updated job details
 */
export const updateJob = async (jobId, targetIp, cronExpression) => {
  try {
    const response = await apiClient.patch(`/jobs/${jobId}`, {
      targetIp,
      cronExpression,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};

/**
 * Stop/Delete a job
 * @param {string} jobId - Job ID
 * @returns {Promise} Success response
 */
export const deleteJob = async (jobId) => {
  try {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

export default apiClient;
