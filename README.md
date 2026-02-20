# Job Monitoring System

A flexible monitoring platform designed to track any type of long-running job or process. While it includes a Spark listener, the system is fully accessible via a REST API, allowing integration with any language or framework.

## System Architecture

- **monitoring-service**: Spring Boot REST API with PostgreSQL storage. Supports dynamic filtering and pagination.
- **monitoring-ui**: Modern React dashboard for real-time visualization and history tracking.
- **spark-monitoring-listener**: (Optional) For specialized Spark integration.

---

## 🚀 Quick Start with Docker

The easiest way to run the entire stack (Database, Backend, and UI) is using Docker Compose.

### Prerequisites
- Docker and Docker Compose installed.

### Steps
1. Clone the repository.
2. Run the start command:
   ```bash
   docker-compose up --build
   ```
3. Access the Dashboard at: [http://localhost](http://localhost)
4. The Backend API is available at: [http://localhost:8080](http://localhost:8080)

---

## 🛠️ Integration Guide (Generic Usage)

You can track any job by making HTTP calls to the backend.

### 1. Start a Job
When your process begins, send a `POST` request:
```bash
curl -X POST http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"jobName": "MyDataCleanup", "runId": "RUN-101"}'
```

### 2. Update Job Status
When the process finishes (Success or Failure), send a `PUT` request:
```bash
# Mark as SUCCESS
curl -X PUT http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"jobName": "MyDataCleanup", "runId": "RUN-101", "status": "SUCCESS"}'

# Mark as FAILED with error details
curl -X PUT http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"jobName": "MyDataCleanup", "runId": "RUN-101", "status": "FAILED", "errorMessage": "Out of memory"}'
```

---

## 🏗️ Local Development Setup

If you prefer to run services individually without Docker:

### 1. Backend
```bash
cd monitoring-service
# Define DB_URL, DB_USERNAME, DB_PASSWORD env vars
./gradlew bootRun
```

### 2. UI
```bash
cd monitoring-ui
npm install
npm run dev
```

### 3. Spark Listener
```bash
cd spark-monitoring-listener
./gradlew build
# Included in Spark via --jars and --conf spark.extraListeners
```

---

## 📊 Features
- **Platform Agnostic**: Works with any app that can send HTTP requests.
- **Real-time Status**: Tracking for `RUNNING`, `SUCCESS`, and `FAILED` states.
- **Advanced Filtering**: Search by name, status, or precise datetime ranges.
- **Scalable UI**: Paged results and server-side filtering for large job histories.
- **Error Visibility**: Direct access to failure logs in the history table.
