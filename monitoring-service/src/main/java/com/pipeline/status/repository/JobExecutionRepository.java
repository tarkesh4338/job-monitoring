package com.pipeline.status.repository;

import com.pipeline.status.model.JobExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobExecutionRepository
        extends JpaRepository<JobExecution, Long>, JpaSpecificationExecutor<JobExecution> {
    List<JobExecution> findByJobName(String jobName);

    Optional<JobExecution> findByRunId(String runId);

    Optional<JobExecution> findByJobNameAndRunId(String jobName, String runId);

    long countByStatus(JobExecution.Status status);
}
