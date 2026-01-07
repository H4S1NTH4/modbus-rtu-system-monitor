package com.hasintha.modbus.master.Model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "job_executions")
public class JobExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "target_ip", nullable = false)
    private String targetIp;

    @Column(name = "execution_time", nullable = false)
    private LocalDateTime executionTime;

    @Column(nullable = false, length = 50)
    private String status;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Telemetry telemetry;

    @Data
    public static class Telemetry{
        private double cpu;
        private double ram;
        private double disk;
    }
}
