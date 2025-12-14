package com.hasintha.modbus.master.Exception;

public class JobNotFoundException extends RuntimeException {

    public JobNotFoundException(String jobId) {
        super("Job not found with ID: " + jobId);
    }

}
