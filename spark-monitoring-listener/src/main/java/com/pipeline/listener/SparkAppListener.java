package com.pipeline.listener;

import com.pipeline.http.MonitoringServiceClient;
import com.pipeline.model.JobStaus;
import com.pipeline.model.Status;
import org.apache.spark.SparkConf;
import org.apache.spark.scheduler.*;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

public class SparkAppListener extends SparkListener {
    private static final Logger logger = Logger.getLogger(SparkAppListener.class.getName());
    private final MonitoringServiceClient monitoringClient;
    private final ConcurrentHashMap<String, String> appToJobIdMap = new ConcurrentHashMap<>();
    private boolean applicationFailed = false;
    private String errorMessage = null;

    public SparkAppListener(SparkConf conf) {
        String backendUrl = conf.get("spark.monitoring.backend.url", "http://localhost:8080");
        this.monitoringClient = new MonitoringServiceClient(backendUrl);
        System.out.println("SparkJobListener initialized. Backend URL: " + backendUrl);
    }

    public void onApplicationStart(SparkListenerApplicationStart applicationStart) {
        var appName = applicationStart.appName();
        var appId = applicationStart.appId().getOrElse(() -> UUID.randomUUID().toString());
        
        monitoringClient.createJobAsync(new JobStaus(appName, appId))
            .thenRun(() -> {
                logger.info("Application monitoring started: " + appName + " (App ID: " + appId + ")");
            })
            .exceptionally(throwable -> {
                logger.severe("Error starting application monitoring for " + appName + ": " + throwable.getMessage());
                return null;
            });
    }

    public void onJobEnd(SparkListenerJobEnd jobEnd) {
        if (jobEnd.jobResult() instanceof JobFailed) {
            applicationFailed = true;
            Exception reason = ((JobFailed) jobEnd.jobResult()).exception();
            errorMessage = reason.getMessage();
        }
    }

    public void onApplicationEnd(SparkListenerApplicationEnd applicationEnd) {
        appToJobIdMap.forEach((appName, appId) -> {
            var jobStatus = applicationFailed ? new JobStaus(appName, appId, Status.FAILED, errorMessage) : new JobStaus(appName, appId, Status.SUCCESS);
            monitoringClient.updateJobAsync(jobStatus)
                .thenRun(() -> {
                    logger.info("Application monitoring completed: " + appName + " (App ID: " + appId + ")");
                    appToJobIdMap.remove(appName);
                })
                .exceptionally(throwable -> {
                    logger.severe("Error completing application monitoring for " + appName + ": " + throwable.getMessage());
                    return null;
                });
        });
    }
}
