package com.hasintha.modbus.master.Service;

import com.hasintha.modbus.master.Exception.JobNotFoundException;
import com.hasintha.modbus.master.Model.Job;
import com.hasintha.modbus.master.Model.JobExecution;
import com.hasintha.modbus.master.Repository.JobExecutionRepository;
import com.hasintha.modbus.master.Repository.JobRepository;
import com.hasintha.modbus.master.dto.JobExecutionDto;
import com.hasintha.modbus.master.dto.JobResponseDto;
import com.hasintha.modbus.master.dto.PagedJobExecutionResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final JobExecutionRepository jobExecutionRepository;
    private final JobScheduler jobScheduler;

    public JobService(JobRepository jobRepository, JobExecutionRepository jobExecutionRepository, JobScheduler jobScheduler){
        this.jobRepository = jobRepository;
        this.jobExecutionRepository = jobExecutionRepository;
        this.jobScheduler = jobScheduler;
    }

    public List<Job> getAllJobs(){
        return jobRepository.findAll();
    }

    public JobResponseDto getJobDetails(String jobId){
        // Get Job Metadata
        Job job = jobRepository.findById(jobId).orElseThrow( () -> new JobNotFoundException(jobId));

        // Get Execution History
        List<JobExecution> history = jobExecutionRepository.findByJobIdOrderByExecutionTimeDesc(jobId);

        // Convert list of history entities to a list of history DTOs
        List<JobExecutionDto> executionDtos = history.stream()
                .map(exec -> new JobExecutionDto(
                        exec.getId(),
                        exec.getExecutionTime(),
                        exec.getStatus(),
                        exec.getTelemetry()
                ))
                .toList();

        //return main DTO
        return new JobResponseDto(job.getId(),job.getStatus(),job.getCreatedAt(),executionDtos);
    }

    /**
     * Retrieves job details with paginated execution history.
     *
     * @param jobId The job identifier
     * @param page Zero-based page number (must be >= 0)
     * @param size Page size (must be > 0)
     * @return PagedJobExecutionResponseDto with job metadata and paginated executions
     * @throws JobNotFoundException if job doesn't exist
     */
    public PagedJobExecutionResponseDto getJobDetailsWithPagination(String jobId, int page, int size) {
        // 1. Fetch job metadata (throws JobNotFoundException if not found)
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException(jobId));

        // 2. Create Pageable object for pagination
        // Sort by executionTime descending (newest first) is already in method name
        Pageable pageable = PageRequest.of(page, size);

        // 3. Fetch paginated execution history
        Page<JobExecution> executionPage = jobExecutionRepository
                .findByJobIdOrderByExecutionTimeDesc(jobId, pageable);

        // 4. Convert Page<JobExecution> to List<JobExecutionDto>
        List<JobExecutionDto> executionDtos = executionPage.getContent().stream()
                .map(exec -> new JobExecutionDto(
                        exec.getId(),
                        exec.getExecutionTime(),
                        exec.getStatus(),
                        exec.getTelemetry()
                ))
                .toList();

        // 5. Build pagination metadata
        PagedJobExecutionResponseDto.PaginationMetadata paginationMetadata =
                new PagedJobExecutionResponseDto.PaginationMetadata(
                        executionPage.getNumber(),          // currentPage (0-based)
                        executionPage.getSize(),            // pageSize
                        executionPage.getTotalElements(),   // totalElements
                        executionPage.getTotalPages(),      // totalPages
                        executionPage.isFirst(),            // first
                        executionPage.isLast()              // last
                );

        // 6. Return complete DTO
        return new PagedJobExecutionResponseDto(
                job.getId(),
                job.getStatus(),
                job.getCreatedAt(),
                job.getCronExpression(),
                executionDtos,
                paginationMetadata
        );
    }

    public Job updateJob(String jobId, String targetIp, String cronExpression) {
        // Delegate to JobScheduler to handle the update properly (stop/start job)
        return jobScheduler.updateJob(jobId, targetIp, cronExpression);
    }
}
