"""Structured logging and error aggregation for the ML service."""
import json
import logging
import os
import sys
from datetime import datetime, timezone


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
