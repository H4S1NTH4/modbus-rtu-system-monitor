package com.hasintha.modbus.master.Service;

import com.hasintha.modbus.master.Exception.JobAlreadyStoppedException;
import com.hasintha.modbus.master.Exception.JobNotFoundException;
import com.hasintha.modbus.master.Model.Job;
import com.hasintha.modbus.master.Model.JobExecution;
import com.hasintha.modbus.master.Model.JobStopResult;
import com.hasintha.modbus.master.Repository.JobRepository;
import com.hasintha.modbus.master.Repository.JobExecutionRepository;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
public class JobScheduler {

    private final ThreadPoolTaskScheduler taskScheduler;
    private final ModbusService modbusService;
    private final JobRepository jobRepository;
    private final JobExecutionRepository executionRepository;

    // Map to hold active tasks so we can cancel them later (for DELETE /jobs/{id})
    private final Map<Long, ScheduledFuture<?>> activeTasks = new ConcurrentHashMap<>();

    public JobScheduler(ModbusService modbusService, JobRepository jobRepository, JobExecutionRepository executionRepository) {
        this.modbusService = modbusService;
        this.jobRepository = jobRepository;
        this.executionRepository = executionRepository;

        this.taskScheduler = new ThreadPoolTaskScheduler();
        this.taskScheduler.setPoolSize(5);
        this.taskScheduler.initialize();
    }

    /**
     * Creates a Job record and starts the scheduler.
     */
    public Job scheduleNewJob(String ip, String cron) {
        // 1. Save Job Definition
        Job job = new Job();
        job.setTargetIp(ip);
        job.setCronExpression(cron);
        job.setStatus("RUNNING");
        job.setCreatedAt(LocalDateTime.now());
        job = jobRepository.save(job);

        // 2. Start the Task
        startTask(job);

        return job;
    }

    private void startTask(Job job) {
        Runnable task = () -> executePoll(job);
        try {
            ScheduledFuture<?> future = taskScheduler.schedule(task, new CronTrigger(job.getCronExpression()));
            activeTasks.put(job.getId(), future);
        } catch (Exception e) {
            System.err.println("Invalid CRON expression: " + job.getCronExpression());
        }
    }

    //The actual logic that runs every X seconds
    private void executePoll(Job job) {
        JobExecution execution = new JobExecution();
        execution.setJobId(job.getId());
        execution.setTargetIp(job.getTargetIp());
        execution.setExecutionTime(LocalDateTime.now());

        try {
            // Read CPU (0x04)
            double cpu = modbusService.readRegister(job.getTargetIp(), 0x04);
            // Read RAM (0x06)
            double ram = modbusService.readRegister(job.getTargetIp(), 0x06);
            // Read Disk (0x08)
            double disk = modbusService.readRegister(job.getTargetIp(), 0x08);

            JobExecution.Telemetry t = new JobExecution.Telemetry();
            t.setCpu(cpu);
            t.setRam(ram);
            t.setDisk(disk);

            execution.setTelemetry(t);
            execution.setStatus("COMPLETED");

        } catch (java.net.SocketTimeoutException e) {
            execution.setStatus("ERROR_TIMEOUT");
        } catch (java.net.ConnectException e) {
            execution.setStatus("ERROR_TCP");
        } catch (Exception e) {
            execution.setStatus("ERROR_APP");
            e.printStackTrace();
        }

        executionRepository.save(execution);
        System.out.println("Job " + job.getId() + " executed. Status: " + execution.getStatus());
    }

    /**
     * Stops a job.
     */
    public void stopJob(Long jobId) {

        // Check if job exists in database
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new JobNotFoundException(jobId));

        // Job already stopped
        if (!activeTasks.containsKey(jobId)) {
            if(!Objects.equals(job.getStatus(), "STOPPED")) {
                job.setStatus("STOPPED");
                jobRepository.save(job);
            }
            throw new JobAlreadyStoppedException(jobId);
        }

//      Cancel the scheduled thread
        activeTasks.get(jobId).cancel(false);
        activeTasks.remove(jobId);
        //update DB status
        job.setStatus("STOPPED");
        jobRepository.save(job);
    }

    /**
     * Updates an existing job with new parameters or restarts a stopped job.
     * This method handles multiple scenarios:
     * - Updates parameters for running jobs and restarts them
     * - Updates parameters for stopped jobs and starts them
     * - Restarts stopped jobs without changing parameters
     */
    public Job updateJob(Long jobId, String newIp, String newCron) {
        // Find the existing job
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new JobNotFoundException(jobId));

        boolean hasChanges = false;

        // Update job parameters if provided
        if (newIp != null && !newIp.isEmpty()) {
            job.setTargetIp(newIp);
            hasChanges = true;
        }
        if (newCron != null && !newCron.isEmpty()) {
            job.setCronExpression(newCron);
            hasChanges = true;
        }

        // Determine if we need to reschedule the job
        boolean needsReschedule = false;

        // Check current job status in the system
        boolean isCurrentlyRunning = activeTasks.containsKey(jobId);

        // If job is currently running and has changes, stop and restart it
        if (isCurrentlyRunning && hasChanges) {
            stopJob(jobId);
            needsReschedule = true;
        }
        // If job is currently stopped and we need to restart it (either with changes or without changes)
        else if (!isCurrentlyRunning && ("STOPPED".equals(job.getStatus()) || hasChanges)) {
            needsReschedule = true;
        }
        // If job is running and no changes, just make sure status is set to RUNNING
        else if (isCurrentlyRunning && !hasChanges) {
            job.setStatus("RUNNING");
            job = jobRepository.save(job);
            return job;
        }

        // Update job status to RUNNING since we're going to schedule it (if needed)
        job.setStatus("RUNNING");

        // Save the updated job
        job = jobRepository.save(job);

        // Start the job if needed
        if (needsReschedule) {
            startTask(job);
        }

        return job;
    }

}