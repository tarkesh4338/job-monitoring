package com.pipeline.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobStaus(String jobName, String runId, Status status, String errorMessage) {
    
    public JobStaus(String jobName, String runId) {
        this(jobName, runId, Status.RUNNING, null);
    }
    
    public JobStaus(String jobName, String runId, Status status) {
        this(jobName, runId, status, null);
    }

    public JobStaus(String jobName, String runId, String errorMessage) {
        this(jobName, runId, Status.FAILED, errorMessage);
    }
}
