package com.hasintha.modbus.master.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "job_executions")
public class JobExecution {

    @Id
    private  String id;

    private  String jobId;
    private String targetIp;
    private LocalDateTime executionTime;
    private String status;

    private Telemetry telemetry;

    @Data
    public static class Telemetry{
        private double cpu;
        private  double ram;
        private double disk;
    }


}
