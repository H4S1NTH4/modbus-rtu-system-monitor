package com.hasintha.modbus.master.dto;

import java.util.List;

public record JobResponseDto (
        String jobId,
        String status,
        List<JobExecutionDto> executions
) {}
