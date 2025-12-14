package com.hasintha.modbus.master.dto;

import com.hasintha.modbus.master.Model.JobExecution;

import java.time.LocalDateTime;

public record JobExecutionDto(
        String executionId,
        LocalDateTime executionTime,
        String status,
        JobExecution.Telemetry telemetry
) {
//    public record TelemetryDto(
//            double cpu,
//            double ram,
//            double disk
//    ) {}
}