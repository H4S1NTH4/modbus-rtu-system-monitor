package com.hasintha.modbus.master.Service;

import com.hasintha.modbus.master.Exception.JobNotFoundException;
import com.hasintha.modbus.master.Model.Job;
import com.hasintha.modbus.master.Model.JobExecution;
import com.hasintha.modbus.master.Repository.JobExecutionRepository;
import com.hasintha.modbus.master.Repository.JobRepository;
import com.hasintha.modbus.master.dto.JobExecutionDto;
import com.hasintha.modbus.master.dto.JobResponseDto;
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
        return new JobResponseDto(job.getId(),job.getStatus(),executionDtos);
    }

    public Job updateJob(String jobId, String targetIp, String cronExpression) {
        // Delegate to JobScheduler to handle the update properly (stop/start job)
        return jobScheduler.updateJob(jobId, targetIp, cronExpression);
    }
}
