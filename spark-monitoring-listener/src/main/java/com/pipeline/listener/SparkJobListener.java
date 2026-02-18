package com.pipeline.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.spark.SparkConf;
import org.apache.spark.scheduler.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class SparkJobListener extends SparkListener {

    private final String backendUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    // Map spark execution ID (Integer) to backend ID (Long)
    private final Map<Integer, Long> activeJobs = new ConcurrentHashMap<>();

    public SparkJobListener(SparkConf conf) {
        this.backendUrl = conf.get("spark.monitoring.backend.url", "http://localhost:8080");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
        System.out.println("SparkJobListener initialized. Backend URL: " + backendUrl);
    }

    @Override
    public void onJobStart(SparkListenerJobStart jobStart) {
        try {
            int sparkJobId = jobStart.jobId();
            // Use job group ID as runId if available, else fallback to job ID
            String runId = jobStart.properties().getProperty("spark.jobGroup.id", "unknown-run-" + sparkJobId);
            String jobName = jobStart.properties().getProperty("spark.job.description", "spark-job-" + sparkJobId);

            Map<String, Object> payload = new HashMap<>();
            payload.put("jobName", jobName);
            payload.put("runId", runId);
            payload.put("status", "RUNNING");

            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(backendUrl + "/api/jobs"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                // Parse response to get the backend ID
                Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
                Long backendId = ((Number) responseMap.get("id")).longValue();
                activeJobs.put(sparkJobId, backendId);
                System.out.println("Job started reported: " + jobName + " (Backend ID: " + backendId + ")");
            } else {
                System.err.println("Failed to report job start. Status: " + response.statusCode());
            }

        } catch (Exception e) {
            System.err.println("Error reporting job start: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void onJobEnd(SparkListenerJobEnd jobEnd) {
        try {
            int sparkJobId = jobEnd.jobId();
            Long backendId = activeJobs.remove(sparkJobId);

            if (backendId != null) {
                String resultInfo = jobEnd.jobResult().toString();
                String status = resultInfo.contains("JobSucceeded") ? "SUCCESS" : "FAILED";

                Map<String, Object> payload = new HashMap<>();
                payload.put("status", status);

                if ("FAILED".equals(status) && jobEnd.jobResult() instanceof JobFailed) {
                    payload.put("errorMessage", ((JobFailed) jobEnd.jobResult()).exception().getMessage());
                } else if ("FAILED".equals(status)) {
                    payload.put("errorMessage", "Job Failed: " + resultInfo);
                }

                String json = objectMapper.writeValueAsString(payload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(backendUrl + "/api/jobs/" + backendId))
                        .header("Content-Type", "application/json")
                        .PUT(HttpRequest.BodyPublishers.ofString(json))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                System.out.println("Job end reported for ID " + backendId + ". Status: " + status + ". Response: "
                        + response.statusCode());
            }

        } catch (Exception e) {
            System.err.println("Error reporting job end: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
