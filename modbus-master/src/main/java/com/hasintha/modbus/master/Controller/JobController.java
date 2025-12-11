package com.hasintha.modbus.master.Controller;


import com.hasintha.modbus.master.Model.Job;
import com.hasintha.modbus.master.Model.JobExecution;
import com.hasintha.modbus.master.Repository.JobExecutionRepository;
import com.hasintha.modbus.master.Repository.JobRepository;
import com.hasintha.modbus.master.Service.JobScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobScheduler jobScheduler;
    private final JobRepository jobRepository;
    private final JobExecutionRepository executionRepository;

    public JobController(JobScheduler jobScheduler, JobRepository jobRepository, JobExecutionRepository executionRepository) {
        this.jobScheduler = jobScheduler;
        this.jobRepository = jobRepository;
        this.executionRepository = executionRepository;
    }

    // 1. Schedule a new job
    @PostMapping
    public ResponseEntity<Job> createJob(@RequestBody Map<String, String> payload) {
        String ip = payload.get("targetIp");
        String cron = payload.get("cronExpression");
        Job job = jobScheduler.scheduleNewJob(ip, cron);
        return ResponseEntity.ok(job);
    }
    // 2. Get Job Details & History
    @GetMapping("/{jobId}")
    public ResponseEntity<Map<String, Object>> getJob(@PathVariable String jobId) {
        Map<String, Object> response = new HashMap<>();

        // Get Job Metadata
        Job job = jobRepository.findById(jobId).orElse(null);
        if (job == null) return ResponseEntity.notFound().build();

        // Get Execution History
        List<JobExecution> history = executionRepository.findByJobIdOrderByExecutionTimeDesc(jobId);

        response.put("jobId", job.getId());
        response.put("status", job.getStatus());
        response.put("executions", history); // This matches the JSON structure in

        return ResponseEntity.ok(response);
    }

    // 3. List All Jobs
    @GetMapping
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    // 4. Stop a Job
    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> stopJob(@PathVariable String jobId) {
        jobScheduler.stopJob(jobId);
        return ResponseEntity.ok().build();
    }
}