package com.hasintha.modbus.master.Controller;


import com.hasintha.modbus.master.Model.Job;
import com.hasintha.modbus.master.Model.JobExecution;
import com.hasintha.modbus.master.Model.JobStopResult;
import com.hasintha.modbus.master.Repository.JobExecutionRepository;
import com.hasintha.modbus.master.Repository.JobRepository;
import com.hasintha.modbus.master.Service.JobScheduler;
import com.hasintha.modbus.master.Service.JobService;
import com.hasintha.modbus.master.dto.JobResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
    private final JobService jobService;



    public JobController(JobScheduler jobScheduler, JobExecutionRepository executionRepository, JobRepository jobRepository, JobService jobService) {
        this.jobScheduler = jobScheduler;
        this.jobRepository = jobRepository;
        this.executionRepository = executionRepository;
        this.jobService = jobService;
    }

    // 1. Schedule a new job
    @PostMapping
    public ResponseEntity<Job> createJob(@RequestBody Map<String, String> payload) {
        String ip = payload.get("targetIp");
        String cron = payload.get("cronExpression");
        Job job = jobScheduler.scheduleNewJob(ip, cron);
        return ResponseEntity.ok(job);
    }

    @GetMapping("v0/{jobId}")
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

    // 2. Get Job Details & History
    @GetMapping("/{jobId}")
    public ResponseEntity<JobResponseDto> getJobv1(@PathVariable String jobId){
        return ResponseEntity.ok(jobService.getJobDetails(jobId));
    }

    // 3. List All Jobs
    @GetMapping
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    // 4. Stop a Job
    @DeleteMapping("/{jobId}")
    public ResponseEntity<?> stopJob(@PathVariable String jobId) {
        jobScheduler.stopJob(jobId);
        return ResponseEntity.ok().build();
    }

    // 5. Update a Job
    @PatchMapping("/{jobId}")
    public ResponseEntity<Job> updateJob(@PathVariable String jobId, @RequestBody Map<String, String> payload) {
        String targetIp = payload.get("targetIp");
        String cronExpression = payload.get("cronExpression");

        Job updatedJob = jobService.updateJob(jobId, targetIp, cronExpression);
        return ResponseEntity.ok(updatedJob);
    }

}