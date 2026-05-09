import time
import uuid
import os

import numpy as np
import joblib
from fastapi import FastAPI, Request
from pydantic import BaseModel

from observability import setup_logging, setup_sentry

logger = setup_logging(level=os.getenv("LOG_LEVEL", "INFO"))
setup_sentry()

app = FastAPI()

MODELS_DIR = "models"
MODEL_PATH = os.path.join(MODELS_DIR, "email_classifier.pkl")
WIDGET_MODEL_PATH = os.path.join(MODELS_DIR, "widget_suggester.pkl")

SUGGEST_AI_THRESHOLD = 0.35

model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    logger.info("Email classifier loaded", extra={"path": MODEL_PATH})
else:
    logger.warning("Email classifier model not found", extra={"path": MODEL_PATH})

widget_model = None
if os.path.exists(WIDGET_MODEL_PATH):
    widget_model = joblib.load(WIDGET_MODEL_PATH)
    logger.info("Widget suggester loaded", extra={"path": WIDGET_MODEL_PATH})
else:
    logger.warning("Widget suggester model not found", extra={"path": WIDGET_MODEL_PATH})


class EmailData(BaseModel):
    sender: str
    subject: str


class BatchEmailData(BaseModel):
    emails: list[dict]  # [{ id, sender, subject }]


class SuggestQuery(BaseModel):
    query: str
    top_k: int = 3


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.perf_counter()

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
        },
    )

    response.headers["x-request-id"] = request_id
    return response


def classify(sender: str, subject: str) -> dict:
    if not model:
        return {"category": "other", "confidence": 0.0}
    text = f"{sender} {subject}"
    prediction = model.predict([text])[0]
    confidence = float(model.predict_proba([text]).max())
    return {
        "category": prediction if confidence > 0.6 else "other",
        "confidence": confidence,
    }


@app.post("/predict")
async def predict_category(data: EmailData):
    return classify(data.sender, data.subject)


@app.post("/predict/batch")
async def predict_batch(data: BatchEmailData):
    start = time.perf_counter()
    results = [
        {"id": email["id"], **classify(email["sender"], email["subject"])}
        for email in data.emails
    ]
    logger.debug(
        "batch classification complete",
        extra={
            "count": len(results),
            "duration_ms": round((time.perf_counter() - start) * 1000, 2),
        },
    )
    return results


@app.post("/suggest")
async def suggest_widgets(data: SuggestQuery):
    if not widget_model or not data.query.strip():
        logger.debug("Widget suggest skipped — no model or empty query")
        return {"suggestions": [], "suggest_ai": True}

    start = time.perf_counter()
    query = data.query.strip()
    proba = widget_model.predict_proba([query])[0]
    classes = widget_model.classes_

    ranked = sorted(
        zip(classes, proba.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )
    top = ranked[: data.top_k]
    max_confidence = float(np.max(proba))

    result = {
        "suggestions": [
            {"widget": widget, "confidence": round(conf, 3)}
            for widget, conf in top
            if conf > 0.05
        ],
        "suggest_ai": max_confidence < SUGGEST_AI_THRESHOLD,
    }

    logger.debug(
        "widget suggestion complete",
        extra={
            "query_length": len(query),
            "top_widget": ranked[0][0] if ranked else None,
            "max_confidence": round(max_confidence, 3),
            "suggest_ai": result["suggest_ai"],
            "duration_ms": round((time.perf_counter() - start) * 1000, 2),
        },
    )
    return result
