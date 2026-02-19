package com.pipeline.app;

import com.pipeline.listener.SparkAppListener;
import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;

import java.util.Arrays;
import java.util.List;

public class TestSparkApp {

    public static void main(String[] args) throws InterruptedException {
        // Configure Spark
        SparkConf conf = new SparkConf()
                .setAppName("Test Monitoring Job")
                .setMaster("local[*]")
                // Register our listener
                .set("spark.extraListeners", SparkAppListener.class.getName())
                // Backend URL (assumes local backend is running)
                .set("spark.monitoring.backend.url", "http://localhost:8080");

        JavaSparkContext sc = new JavaSparkContext(conf);

        // Define a job description (will be used as jobName)
        sc.setJobDescription("Test Data Processing Job");
        sc.setJobGroup("run-12345", "Test Data Processing Job", false);

        System.out.println("Starting Spark Job...");

        // Simple job: Create numbers, double them, count
        List<Integer> data = Arrays.asList(1, 2, 3, 4, 5);
        JavaRDD<Integer> rdd = sc.parallelize(data);

        long count = rdd.map(i -> i * 2).count();

        System.out.println("Job finished with count: " + count);

        // Keep alive briefly to ensure HTTP requests complete (listener is async? no,
        // onJobEnd is sync in listener bus usually, but good to wait)
        Thread.sleep(2000);

        sc.close();
    }
}
