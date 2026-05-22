# Go Worker Service

A high-throughput background worker service for WebWidgets, built with Go.

## Purpose

This service handles infrastructure work that should not block Next.js page loads:
- Analytics/event ingestion
- Async cache writes (future)
- Event normalization
- Future: connector sync jobs
- Future: dashboard snapshot precomputation

## Architecture

- **Next.js** remains the product shell/API facade
- **Python** remains ML
- **Go** handles background infrastructure work

## Running Locally

### Prerequisites
- Go 1.21+
- Docker (optional, for containerized execution)

### Direct execution

```bash
cd go_services/worker
go mod download
go run cmd/worker/main.go
```

### With Docker

```bash
docker build -t webwidgets-worker .
docker run -p 8081:8081 -e WORKER_LOG_LEVEL=debug webwidgets-worker
```

### With Docker Compose

From the repository root:

```bash
docker-compose up go_worker
```

## Environment Variables

- `WORKER_PORT` - Port to listen on (default: 8081)
- `WORKER_LOG_LEVEL` - Log level: debug, info, warn, error (default: info)
- `WORKER_VERSION` - Service version (default: dev)
- `WORKER_QUEUE_SIZE` - Internal queue size (default: 1000)

## API Endpoints

### Health Check
```
GET /healthz
```
Returns service health status and uptime.

### Readiness Check
```
GET /readyz
```
Returns whether the service is ready to accept traffic.

### Event Ingestion
```
POST /v1/events/ingest
Content-Type: application/json

{
  "events": [
    {
      "type": "widget_added",
      "user_id": "user-123",
      "source": "dashboard",
      "timestamp": "2024-01-01T00:00:00Z",
      "metadata": {
        "widget_type": "finance",
        "widget_id": "widget-456"
      }
    }
  ]
}
```

Response:
```json
{
  "accepted": 1,
  "rejected": 0
}
```

## Limits

- Max batch size: 100 events
- Max event metadata size: 10KB
- Max event type length: 100 characters

## Integration with Next.js

The Go worker is optional. Next.js will:
1. Check if `GO_WORKER_ENABLED` is set
2. If enabled, forward analytics events to Go worker
3. If disabled or Go worker is unavailable, fall back to existing Supabase writes

## Development

### Project Structure

```
go_services/worker/
├── cmd/
│   └── worker/
│       └── main.go          # Entry point
├── internal/
│   ├── config/              # Configuration
│   ├── events/              # Event ingestion logic
│   ├── health/              # Health checks
│   ├── logger/              # Structured logging
│   └── server/              # HTTP server
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```

### Adding New Endpoints

1. Create a new package in `internal/`
2. Add the handler to the HTTP mux in `internal/server/server.go`
3. Update this README with the new endpoint documentation

## Future Work

- [ ] Add durable queue (Redis/BullMQ integration)
- [ ] Add cache write worker endpoint
- [ ] Add snapshot precompute job endpoint
- [ ] Add metrics endpoint
- [ ] Add OpenTelemetry tracing
- [ ] Add connector sync job foundation
