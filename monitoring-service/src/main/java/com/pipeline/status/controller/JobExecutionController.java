package com.pipeline.status.controller;

import com.pipeline.status.model.JobExecution;
import com.pipeline.status.repository.JobExecutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    public ResponseEntity<JobExecution> startJob(@RequestBody JobExecution execution) {
        log.info("Starting execution for job: {}", execution.getJobName());
        execution.setStartTime(LocalDateTime.now());
        execution.setStatus(JobExecution.Status.RUNNING);
        JobExecution saved = repository.save(execution);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobExecution> updateJob(@PathVariable Long id, @RequestBody JobExecution executionUpdates) {
        log.info("Updating job execution id: {}", id);
        return repository.findById(id)
                .map(existing -> {
                    if (executionUpdates.getStatus() != null) {
                        existing.setStatus(executionUpdates.getStatus());
                    }
                    if (executionUpdates.getEndTime() != null) {
                        existing.setEndTime(executionUpdates.getEndTime());
                    } else if (executionUpdates.getStatus() == JobExecution.Status.SUCCESS || executionUpdates.getStatus() == JobExecution.Status.FAILED) {
                         existing.setEndTime(LocalDateTime.now());
                    }
                    
                    if (executionUpdates.getErrorMessage() != null) {
                        existing.setErrorMessage(executionUpdates.getErrorMessage());
                    }
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<JobExecution> getAllJobs() {
        return repository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<JobExecution> getJob(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
