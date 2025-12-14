package com.hasintha.modbus.master.Exception;

public class JobAlreadyStoppedException extends RuntimeException{

    public JobAlreadyStoppedException(String jobId){
        super("Job with ID:" +jobId+ " is already stopped");
    }
}
