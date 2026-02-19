package com.pipeline.status.controller;

import com.pipeline.status.model.JobExecution;
import com.pipeline.status.repository.JobExecutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.pipeline.status.repository.JobExecutionSpecifications;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobExecutionController {

    private final JobExecutionRepository repository;

    @PostMapping
    public ResponseEntity<?> startJob(@RequestBody JobExecution execution) {
        ResponseEntity<String> validationResponse = validateJobRequest(execution);
        if (validationResponse != null) {
            return validationResponse;
        }

        log.info("Starting execution for job: {} (runId: {})", execution.getJobName(), execution.getRunId());
        execution.setStartTime(LocalDateTime.now());
        execution.setStatus(JobExecution.Status.RUNNING);
        try {
            JobExecution saved = repository.save(execution);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Failed to save job execution: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Possible duplicate or database error: " + e.getMessage());
        }
    }

    @PutMapping
    public ResponseEntity<?> updateJob(@RequestBody JobExecution executionUpdates) {
        ResponseEntity<String> validationResponse = validateJobRequest(executionUpdates);
        if (validationResponse != null) {
            return validationResponse;
        }

        String jobName = executionUpdates.getJobName();
        String runId = executionUpdates.getRunId();

        log.info("Updating job execution: {} (runId: {})", jobName, runId);
        return repository.findByJobNameAndRunId(jobName, runId)
                .map(existing -> {
                    if (executionUpdates.getStatus() != null) {
                        existing.setStatus(executionUpdates.getStatus());
                    }
                    if (executionUpdates.getEndTime() != null) {
                        existing.setEndTime(executionUpdates.getEndTime());
                    } else if (executionUpdates.getStatus() == JobExecution.Status.SUCCESS
                            || executionUpdates.getStatus() == JobExecution.Status.FAILED) {
                        existing.setEndTime(LocalDateTime.now());
                    }

                    if (executionUpdates.getErrorMessage() != null) {
                        existing.setErrorMessage(executionUpdates.getErrorMessage());
                    }
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private ResponseEntity<String> validateJobRequest(JobExecution execution) {
        if (execution.getJobName() == null || execution.getJobName().trim().isEmpty() ||
                execution.getRunId() == null || execution.getRunId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Both jobName and runId are mandatory");
        }
        return null;
    }

    @GetMapping
    public List<JobExecution> getAllJobs(
            @RequestParam(required = false) String jobName,
            @RequestParam(required = false) String runId,
            @RequestParam(required = false) JobExecution.Status status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTimeFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTimeTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTimeFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTimeTo) {

        return repository.findAll(
                JobExecutionSpecifications.withFilters(jobName, runId, status, startTimeFrom, startTimeTo, endTimeFrom,
                        endTimeTo),
                Sort.by(Sort.Direction.DESC, "id"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobExecution> getJob(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
