-- Create jobs table
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    target_ip VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('RUNNING', 'STOPPED')),
    created_at TIMESTAMP NOT NULL
);

-- Create indexes for jobs
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Create job_executions table
CREATE TABLE job_executions (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL,
    target_ip VARCHAR(255) NOT NULL,
    execution_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    telemetry JSONB,
    CONSTRAINT fk_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Create indexes for job_executions
CREATE INDEX idx_job_executions_job_id ON job_executions(job_id);
CREATE INDEX idx_job_executions_execution_time ON job_executions(execution_time DESC);
CREATE INDEX idx_job_executions_composite ON job_executions(job_id, execution_time DESC);
CREATE INDEX idx_telemetry_gin ON job_executions USING gin (telemetry);
