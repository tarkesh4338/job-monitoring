ALTER TABLE job_executions ADD CONSTRAINT unique_job_run UNIQUE (job_name, run_id);
