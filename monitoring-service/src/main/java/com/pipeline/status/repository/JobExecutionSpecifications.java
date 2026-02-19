package com.pipeline.status.repository;

import com.pipeline.status.model.JobExecution;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;

public class JobExecutionSpecifications {

    public static Specification<JobExecution> withFilters(
            String jobName,
            String runId,
            JobExecution.Status status,
            LocalDateTime startTimeFrom,
            LocalDateTime startTimeTo,
            LocalDateTime endTimeFrom,
            LocalDateTime endTimeTo) {

        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (jobName != null && !jobName.trim().isEmpty()) {
                predicate = cb.and(predicate,
                        cb.like(cb.lower(root.get("jobName")), "%" + jobName.toLowerCase() + "%"));
            }

            if (runId != null && !runId.trim().isEmpty()) {
                predicate = cb.and(predicate, cb.equal(root.get("runId"), runId));
            }

            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }

            if (startTimeFrom != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("startTime"), startTimeFrom));
            }

            if (startTimeTo != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("startTime"), startTimeTo));
            }

            if (endTimeFrom != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("endTime"), endTimeFrom));
            }

            if (endTimeTo != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("endTime"), endTimeTo));
            }

            return predicate;
        };
    }
}
