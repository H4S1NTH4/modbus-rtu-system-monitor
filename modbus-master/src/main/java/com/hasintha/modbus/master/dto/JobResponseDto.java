package com.hasintha.modbus.master.dto;

import java.time.LocalDateTime;
import java.util.List;

public record JobResponseDto (
        String jobId,
        String status,
        LocalDateTime createdAt,
        List<JobExecutionDto> executions
) {}
