package com.hasintha.modbus.master.Model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "jobs")
public class Job {
    @Id
    private String id;

    private String targetIp;
    private String cronExpression;
    private String status; // "RUNNING" or "STOPPED"
    private LocalDateTime createdAt;
}