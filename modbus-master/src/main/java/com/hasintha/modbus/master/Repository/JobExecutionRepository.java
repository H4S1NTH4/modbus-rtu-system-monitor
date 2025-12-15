package com.hasintha.modbus.master.Repository;

import com.hasintha.modbus.master.Model.JobExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobExecutionRepository extends MongoRepository<JobExecution, String> {

    // Custom query: Find all executions for a specific Job ID, sorted by newest first
    // This is what the UI will call to draw the chart.
    List<JobExecution> findByJobIdOrderByExecutionTimeDesc(String jobId);

    // Paginated query: Find executions for a specific Job ID with pagination support
    Page<JobExecution> findByJobIdOrderByExecutionTimeDesc(String jobId, Pageable pageable);
}
