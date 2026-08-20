import time
import uuid
import os

from fastapi import FastAPI, Request

from observability import setup_logging, setup_sentry, metrics
import model_store
from email_router import router as email_router
from ml_suite_router import router as ml_suite_router
from admin_router import router as admin_router

logger = setup_logging(level=os.getenv("LOG_LEVEL", "INFO"))
setup_sentry()

app = FastAPI()

widget_metadata = model_store.registry.get_model_metadata("widget_suggester")
if widget_metadata:
    logger.info(f"Widget suggester metadata: {widget_metadata}")

action_metadata = model_store.registry.get_model_metadata("action_extractor")
if action_metadata:
    logger.info(f"Action extractor metadata: {action_metadata}")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    is_error = response.status_code >= 400
    metrics.record_request(latency_ms=duration_ms, is_error=is_error)
    logger.info("request", extra={"request_id": request_id, "method": request.method, "path": request.url.path, "status": response.status_code, "duration_ms": duration_ms})
    response.headers["x-request-id"] = request_id
    return response


@app.on_event("shutdown")
async def shutdown_event():
    model_store.drift_monitor.flush()


app.include_router(email_router)
app.include_router(ml_suite_router)
app.include_router(admin_router)
