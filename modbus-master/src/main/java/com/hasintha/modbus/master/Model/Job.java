package com.hasintha.modbus.master.Model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "jobs")
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_ip", nullable = false)
    private String targetIp;

    @Column(name = "cron_expression", nullable = false)
    private String cronExpression;

    @Column(nullable = false, length = 50)
    private String status; // "RUNNING" or "STOPPED"

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}