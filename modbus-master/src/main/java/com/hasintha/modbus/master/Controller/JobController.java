package com.hasintha.modbus.master.Controller;


import com.hasintha.modbus.master.Model.Job;
import com.hasintha.modbus.master.Model.JobExecution;
import com.hasintha.modbus.master.Model.JobStopResult;
import com.hasintha.modbus.master.Repository.JobExecutionRepository;
import com.hasintha.modbus.master.Repository.JobRepository;
import com.hasintha.modbus.master.Service.JobScheduler;
import com.hasintha.modbus.master.Service.JobService;
import com.hasintha.modbus.master.dto.JobResponseDto;
import com.hasintha.modbus.master.dto.PagedJobExecutionResponseDto;
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

    // Pagination constants
    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int DEFAULT_PAGE = 0;

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

    //this will no longer used
    @GetMapping("v0/{jobId}")
    public ResponseEntity<Map<String, Object>> getJob(@PathVariable Long jobId) {
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

    // 2. Get Job Details & History with Pagination
    /**
     * Get Job Details with Paginated Execution History
     *
     * @param jobId The job identifier
     * @param page Optional page number (default: 0, zero-based)
     * @param size Optional page size (default: 20, max: 100)
     * @return Paginated job execution response
     */
    @GetMapping("/{jobId}")
    public ResponseEntity<PagedJobExecutionResponseDto> getJobv1(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // Validation: Ensure page is non-negative
        if (page < 0) {
            page = DEFAULT_PAGE;
        }

        // Validation: Ensure size is within allowed range
        if (size <= 0) {
            size = DEFAULT_PAGE_SIZE;
        } else if (size > MAX_PAGE_SIZE) {
            size = MAX_PAGE_SIZE;
        }

        PagedJobExecutionResponseDto response = jobService.getJobDetailsWithPagination(
                jobId, page, size
        );

        return ResponseEntity.ok(response);
    }

    // 3. List All Jobs
    @GetMapping
    public List<Job> getAllJobs() {
        return jobService.getAllJobs();
    }

    // 4. Stop a Job
    @DeleteMapping("/{jobId}")
    public ResponseEntity<?> stopJob(@PathVariable Long jobId) {
        jobScheduler.stopJob(jobId);
        return ResponseEntity.ok().build();
    }

    // 5. Update a Job
    @PatchMapping("/{jobId}")
    public ResponseEntity<Job> updateJob(@PathVariable Long jobId, @RequestBody Map<String, String> payload) {
        String targetIp = payload.get("targetIp");
        String cronExpression = payload.get("cronExpression");

        Job updatedJob = jobService.updateJob(jobId, targetIp, cronExpression);
        return ResponseEntity.ok(updatedJob);
    }

}