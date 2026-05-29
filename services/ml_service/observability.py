"""Structured logging and error aggregation for the ML service."""
import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional
from collections import deque
import time


class JsonFormatter(logging.Formatter):
    """Emit one JSON object per log line — machine-parseable in production."""

    SERVICE = "ml-service"
    ENV = os.getenv("ENVIRONMENT", "development")

    def format(self, record: logging.LogRecord) -> str:
        entry: dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "service": self.SERVICE,
            "env": self.ENV,
            "message": record.getMessage(),
        }

        if record.exc_info:
            entry["error"] = self.formatException(record.exc_info)

        # Forward any extra fields added via logger.info("…", extra={…})
        standard_keys = logging.LogRecord.__dict__.keys() | {
            "args", "created", "exc_info", "exc_text", "filename", "funcName",
            "levelname", "levelno", "lineno", "message", "module", "msecs",
            "msg", "name", "pathname", "process", "processName", "relativeCreated",
            "stack_info", "taskName", "thread", "threadName",
        }
        for key, val in record.__dict__.items():
            if key not in standard_keys and not key.startswith("_"):
                entry[key] = val

        return json.dumps(entry)


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configure root logger with JSON output and return the service logger."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers = [handler]

    return logging.getLogger("ml_service")


def setup_sentry() -> None:
    """Initialize Sentry SDK if SENTRY_DSN is present."""
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment=os.getenv("ENVIRONMENT", "development"),
            traces_sample_rate=0.1,
            integrations=[
                FastApiIntegration(),
                LoggingIntegration(
                    level=logging.WARNING,
                    event_level=logging.ERROR,
                ),
            ],
        )
    except ImportError:
        logging.getLogger("ml_service").warning(
            "sentry-sdk not installed — Sentry disabled"
        )


class MetricsCollector:
    """Collect and aggregate observability metrics for the ML service."""
    
    def __init__(self, window_size: int = 1000):
        """
        Initialize metrics collector.
        
        Args:
            window_size: Number of recent samples to keep for percentile calculations
        """
        self.window_size = window_size
        self.latencies: deque = deque(maxlen=window_size)
        self.confidences: deque = deque(maxlen=window_size)
        self.error_count: int = 0
        self.total_requests: int = 0
        self.batch_sizes: deque = deque(maxlen=window_size)
        self.model_predictions: Dict[str, int] = {}
    
    def record_request(self, latency_ms: float, confidence: Optional[float] = None, batch_size: int = 1, model: Optional[str] = None, is_error: bool = False) -> None:
        """
        Record a request with its metrics.
        
        Args:
            latency_ms: Request latency in milliseconds
            confidence: Model confidence score (if applicable)
            batch_size: Number of items in batch (for batch endpoints)
            model: Model name used for prediction
            is_error: Whether the request resulted in an error
        """
        self.latencies.append(latency_ms)
        self.total_requests += 1
        
        if is_error:
            self.error_count += 1
        
        if confidence is not None:
            self.confidences.append(confidence)
        
        if batch_size > 1:
            self.batch_sizes.append(batch_size)
        
        if model:
            self.model_predictions[model] = self.model_predictions.get(model, 0) + 1
    
    def get_metrics(self) -> Dict[str, any]:
        """
        Get current metrics summary.
        
        Returns:
            Dictionary containing aggregated metrics
        """
        if not self.latencies:
            return {
                "status": "no_data",
                "message": "No metrics collected yet"
            }
        
        latencies_list = list(self.latencies)
        p95_latency = self._percentile(latencies_list, 95)
        p99_latency = self._percentile(latencies_list, 99)
        avg_latency = sum(latencies_list) / len(latencies_list)
        
        metrics = {
            "total_requests": self.total_requests,
            "error_count": self.error_count,
            "error_rate": self.error_count / self.total_requests if self.total_requests > 0 else 0,
            "latency_ms": {
                "avg": round(avg_latency, 2),
                "p50": round(self._percentile(latencies_list, 50), 2),
                "p95": round(p95_latency, 2),
                "p99": round(p99_latency, 2),
                "min": round(min(latencies_list), 2),
                "max": round(max(latencies_list), 2),
            },
            "throughput": {
                "requests_per_second": self._calculate_throughput(),
            },
        }
        
        if self.confidences:
            confidences_list = list(self.confidences)
            metrics["confidence"] = {
                "avg": round(sum(confidences_list) / len(confidences_list), 4),
                "min": round(min(confidences_list), 4),
                "max": round(max(confidences_list), 4),
                "p5": round(self._percentile(confidences_list, 5), 4),
                "p25": round(self._percentile(confidences_list, 25), 4),
                "p75": round(self._percentile(confidences_list, 75), 4),
                "p95": round(self._percentile(confidences_list, 95), 4),
            }
        
        if self.batch_sizes:
            batch_sizes_list = list(self.batch_sizes)
            metrics["batch"] = {
                "avg_size": round(sum(batch_sizes_list) / len(batch_sizes_list), 2),
                "max_size": max(batch_sizes_list),
                "total_batches": len(batch_sizes_list),
            }
        
        if self.model_predictions:
            metrics["model_usage"] = self.model_predictions
        
        return metrics
    
    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calculate percentile of a list of values."""
        if not data:
            return 0.0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        index = min(index, len(sorted_data) - 1)
        return sorted_data[index]
    
    def _calculate_throughput(self) -> float:
        """Calculate requests per second based on recent latency."""
        if not self.latencies:
            return 0.0
        # Simple approximation: 1 / average latency in seconds
        avg_latency_seconds = sum(self.latencies) / len(self.latencies) / 1000
        return round(1 / avg_latency_seconds, 2) if avg_latency_seconds > 0 else 0.0
    
    def reset(self) -> None:
        """Reset all metrics."""
        self.latencies.clear()
        self.confidences.clear()
        self.batch_sizes.clear()
        self.error_count = 0
        self.total_requests = 0
        self.model_predictions.clear()


# Global metrics collector instance
metrics = MetricsCollector()
