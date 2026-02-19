package com.pipeline.http;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipeline.model.JobStaus;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Logger;

public class MonitoringServiceClient {
    private static final Logger logger = Logger.getLogger(MonitoringServiceClient.class.getName());
    private final String backendUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public MonitoringServiceClient(String backendUrl) {
        this.backendUrl = backendUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public MonitoringServiceClient() {
        this("http://localhost:8080");
    }

    public void createJob(JobStaus jobStatus) {
        try {
            String payload = objectMapper.writeValueAsString(jobStatus);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(backendUrl + "/api/jobs"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                logger.info("Monitoring API response after create : " + response.body());
            } else {
                logger.warning("Failed to create job monitoring for " + jobStatus.jobName() + ". Status: " + response.statusCode() + ", Body: " + response.body());
            }
        } catch (Exception e) {
            logger.warning("Error creating job monitoring for " + jobStatus.jobName() + ": " + e.getMessage());
        }
    }

    public void updateJob(JobStaus jobStatus) {
        try {
            String json = objectMapper.writeValueAsString(jobStatus);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(backendUrl + "/api/jobs"))
                    .header("Content-Type", "application/json")
                    .PUT(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                logger.warning("Failed to update job " + jobStatus.jobName() + ". Status: " + response.statusCode() + ", Body: " + response.body());
            }
        } catch (Exception e) {
            logger.warning("Error updating job " + jobStatus.jobName() + ": " + e.getMessage());
        }
    }

    public CompletableFuture<Void> createJobAsync(JobStaus jobStatus) {
        return CompletableFuture.runAsync(() -> createJob(jobStatus));
    }

    public CompletableFuture<Void> updateJobAsync(JobStaus jobStatus) {
        return CompletableFuture.runAsync(() -> updateJob(jobStatus));
    }
}
