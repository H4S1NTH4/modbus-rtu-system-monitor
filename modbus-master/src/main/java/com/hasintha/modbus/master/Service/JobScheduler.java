package com.hasintha.modbus.master.Service;

import com.hasintha.modbus.master.Model.Job;
import com.hasintha.modbus.master.Model.JobExecution;
import com.hasintha.modbus.master.Repository.JobRepository;
import com.hasintha.modbus.master.Repository.JobExecutionRepository;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
public class JobScheduler {

    private final ThreadPoolTaskScheduler taskScheduler;
    private final ModbusService modbusService;
    private final JobRepository jobRepository;
    private final JobExecutionRepository executionRepository;

    // Map to hold active tasks so we can cancel them later (for DELETE /jobs/{id})
    private final Map<String, ScheduledFuture<?>> activeTasks = new ConcurrentHashMap<>();

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
    public void stopJob(String jobId) {
        // Cancel the scheduled thread
        if (activeTasks.containsKey(jobId)) {
            activeTasks.get(jobId).cancel(false);
            activeTasks.remove(jobId);
        }
        // Update DB status
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus("STOPPED");
            jobRepository.save(job);
        });
    }
}