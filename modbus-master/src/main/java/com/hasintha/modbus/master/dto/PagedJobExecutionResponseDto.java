package com.hasintha.modbus.master.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for paginated job execution results.
 * Contains job metadata, paginated executions, and pagination metadata.
 */
public record PagedJobExecutionResponseDto(
    // Job metadata
    String jobId,
    String status,
    LocalDateTime createdAt,

    // Paginated execution data
    List<JobExecutionDto> executions,

    // Pagination metadata
    PaginationMetadata pagination
) {
    /**
     * Nested record for pagination metadata
     */
    public record PaginationMetadata(
        int currentPage,      // Zero-based page number
        int pageSize,         // Number of items per page
        long totalElements,   // Total number of executions across all pages
        int totalPages,       // Total number of pages
        boolean first,        // Is this the first page?
        boolean last          // Is this the last page?
    ) {}
}
