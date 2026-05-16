import time
import uuid
import os
import re
from datetime import datetime, timedelta, timezone

import numpy as np
import joblib
from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Optional

from observability import setup_logging, setup_sentry

logger = setup_logging(level=os.getenv("LOG_LEVEL", "INFO"))
setup_sentry()

app = FastAPI()

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_PATH = os.path.join(MODELS_DIR, "email_classifier.pkl")
WIDGET_MODEL_PATH = os.path.join(MODELS_DIR, "widget_suggester.pkl")
ACTION_MODEL_PATH = os.path.join(MODELS_DIR, "action_extractor.pkl")

SUGGEST_AI_THRESHOLD = 0.35
ACTION_CONFIDENCE_THRESHOLD = 0.35

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

action_model = None
if os.path.exists(ACTION_MODEL_PATH):
    action_model = joblib.load(ACTION_MODEL_PATH)
    logger.info("Action extractor loaded", extra={"path": ACTION_MODEL_PATH})
else:
    logger.warning("Action extractor not found", extra={"path": ACTION_MODEL_PATH})


class EmailData(BaseModel):
    sender: str
    subject: str


class BatchEmailData(BaseModel):
    emails: list[dict]  # [{ id, sender, subject }]


class SuggestQuery(BaseModel):
    query: str
    top_k: int = 3


class ExtractEmailItem(BaseModel):
    id: str
    subject: str
    sender: str
    snippet: str
    date: Optional[str] = None
    body: Optional[str] = None


class ExtractRequest(BaseModel):
    emails: list[ExtractEmailItem]


# ---------------------------------------------------------------------------
# Utility helpers — date parsing, service name, duration arithmetic
# ---------------------------------------------------------------------------

_NAMED_DATE_RE = r"([A-Z][a-z]+\s+\d{1,2}(?:,\s*\d{4})?)"

# Structural patterns for extracting trial duration — NOT for classification
_TRIAL_DURATION_RE: list[tuple[re.Pattern, str]] = [
    (re.compile(r"(\d+)[- ]day(?:\s+free)?\s+trial", re.I), "days"),
    (re.compile(r"(\d+)[- ]week(?:\s+free)?\s+trial", re.I), "weeks"),
    (re.compile(r"(\d+)[- ]month(?:\s+free)?\s+trial", re.I), "months"),
    (re.compile(r"trial\s+(?:period\s+)?(?:of\s+)?(\d+)\s+days?", re.I), "days"),
    (re.compile(r"free\s+for\s+(\d+)\s+days?", re.I), "days"),
    (re.compile(r"expires?\s+in\s+(\d+)\s+days?", re.I), "days"),
]

# Structural pattern for extracting a payment amount
_AMOUNT_RE = re.compile(r"\$[\d,]+(?:\.\d{2})?")


def _parse_date(date_str: Optional[str]) -> datetime:
    if not date_str:
        return datetime.now(tz=timezone.utc)
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        try:
            return datetime.strptime(date_str[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            return datetime.now(tz=timezone.utc)


def _parse_named_date(date_str: str, reference: datetime) -> Optional[str]:
    """Convert 'May 15' or 'May 15, 2026' to ISO datetime string."""
    for fmt in ("%B %d, %Y", "%B %d"):
        try:
            parsed = datetime.strptime(date_str.strip(), fmt)
            if fmt == "%B %d":
                parsed = parsed.replace(year=reference.year)
                if parsed.date() < reference.date():
                    parsed = parsed.replace(year=reference.year + 1)
            return parsed.replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT00:00:00Z")
        except ValueError:
            continue
    return None


def _add_duration(base: datetime, n: int, unit: str) -> str:
    if unit == "days":
        result = base + timedelta(days=n)
    elif unit == "weeks":
        result = base + timedelta(weeks=n)
    else:
        result = base + timedelta(days=n * 30)
    return result.strftime("%Y-%m-%dT00:00:00Z")


def _service_name(sender: str, subject: str) -> str:
    m = re.search(r"<?\s*([\w.-]+)@([\w-]+)\.", sender)
    if m:
        domain = m.group(2).lower()
        if domain not in ("gmail", "yahoo", "hotmail", "outlook", "icloud", "googlemail"):
            return domain.capitalize()
    words = re.sub(r"[^a-zA-Z0-9 ]", "", subject).split()
    for skip in ("re", "fwd", "your", "the", "a", "an", "welcome", "to", "from"):
        words = [w for w in words if w.lower() != skip]
    return words[0].capitalize() if words else "Service"


def _find_date_in_text(text: str, reference: datetime) -> Optional[str]:
    """Scan text for a named date and return an ISO string."""
    scan_patterns = [
        re.compile(r"\bscheduled\s+for\s+" + _NAMED_DATE_RE, re.I),
        re.compile(r"\bbefore\s+" + _NAMED_DATE_RE, re.I),
        re.compile(r"\bdue\s+(?:by\s+|on\s+)?" + _NAMED_DATE_RE, re.I),
        re.compile(r"\bon\s+" + _NAMED_DATE_RE, re.I),
        re.compile(r"\bby\s+" + _NAMED_DATE_RE, re.I),
        re.compile(r"\bfor\s+" + _NAMED_DATE_RE, re.I),
    ]
    for pattern in scan_patterns:
        m = pattern.search(text)
        if m:
            result = _parse_named_date(m.group(1), reference)
            if result:
                return result
    return None


# ---------------------------------------------------------------------------
# ML action classifier
# ---------------------------------------------------------------------------

def classify_action(text: str) -> tuple[str, float]:
    if not action_model:
        return "ignore", 0.0
    pred = action_model.predict([text])[0]
    confidence = float(action_model.predict_proba([text]).max())
    return pred, confidence


# ---------------------------------------------------------------------------
# Per-type extraction helpers — structural data only, no intent classification
# ---------------------------------------------------------------------------

def extract_trial(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    received = _parse_date(email.date)
    service = _service_name(email.sender, email.subject)

    for pattern, unit in _TRIAL_DURATION_RE:
        m = pattern.search(text)
        if m:
            n = int(m.group(1))
            due = _add_duration(received, n, unit)
            return [
                {
                    "type": "deadline",
                    "title": f"{service} trial ends",
                    "description": f"{n}-{unit.rstrip('s')} trial — decide before it converts to paid",
                    "due_date": due,
                    "action_url": None,
                },
                {
                    "type": "event",
                    "title": f"Evaluate or cancel {service}",
                    "description": f"Trial ends {due[:10]}",
                    "due_date": due,
                    "action_url": None,
                },
            ]

    due = _find_date_in_text(text, received)
    return [
        {
            "type": "deadline",
            "title": f"{service} trial ends",
            "description": "Trial period ending — decide before it converts to paid",
            "due_date": due,
            "action_url": None,
        },
        {
            "type": "event",
            "title": f"Evaluate or cancel {service}",
            "description": "Trial ending soon" + (f" — {due[:10]}" if due else ""),
            "due_date": due,
            "action_url": None,
        },
    ]


def extract_payment(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    received = _parse_date(email.date)
    service = _service_name(email.sender, email.subject)

    due_date = _find_date_in_text(text, received)
    amount_m = _AMOUNT_RE.search(text)
    amount = amount_m.group(0) if amount_m else None
    due_label = due_date[:10] if due_date else None

    title = f"{service} payment due" + (f" {due_label}" if due_label else "")
    description = (f"{amount} — " if amount else "") + email.subject[:80]

    return [{
        "type": "deadline",
        "title": title,
        "description": description,
        "due_date": due_date,
        "action_url": None,
    }]


def extract_meeting(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    received = _parse_date(email.date)
    service = _service_name(email.sender, email.subject)
    due_date = _find_date_in_text(text, received)

    return [{
        "type": "event",
        "title": email.subject[:60],
        "description": f"From {service}",
        "due_date": due_date,
        "action_url": None,
    }]


def extract_verification(email: ExtractEmailItem) -> list[dict]:
    service = _service_name(email.sender, email.subject)
    url_m = re.search(r"https?://\S+", email.body or email.snippet)
    return [{
        "type": "action",
        "title": f"Verify {service} account",
        "description": email.subject[:80],
        "due_date": None,
        "action_url": url_m.group(0).rstrip(".,)>") if url_m else None,
    }]


def extract_reply(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    received = _parse_date(email.date)
    service = _service_name(email.sender, email.subject)
    due_date = _find_date_in_text(text, received)

    return [{
        "type": "action",
        "title": f"Reply to {service}",
        "description": email.subject[:80],
        "due_date": due_date,
        "action_url": None,
    }]


def extract_deadline(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    received = _parse_date(email.date)
    due_date = _find_date_in_text(text, received)

    return [{
        "type": "deadline",
        "title": email.subject[:60],
        "description": f"Due {due_date[:10]}" if due_date else email.snippet[:80],
        "due_date": due_date,
        "action_url": None,
    }]


# ---------------------------------------------------------------------------
# Main extractor — ML classification first, structural extraction second
# ---------------------------------------------------------------------------

def _extract_actions_for_email(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    action_type, confidence = classify_action(text)

    logger.debug(
        "action classified",
        extra={"type": action_type, "confidence": round(confidence, 3)},
    )

    if confidence < ACTION_CONFIDENCE_THRESHOLD:
        return []

    if action_type == "trial_end":
        return extract_trial(email)
    if action_type == "payment_due":
        return extract_payment(email)
    if action_type == "meeting":
        return extract_meeting(email)
    if action_type == "verification_needed":
        return extract_verification(email)
    if action_type == "reply_required":
        return extract_reply(email)
    if action_type == "deadline":
        return extract_deadline(email)

    return []


# ---------------------------------------------------------------------------
# HTTP middleware
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

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


@app.post("/extract-actions")
async def extract_actions(data: ExtractRequest):
    results = []
    for email in data.emails:
        actions = _extract_actions_for_email(email)
        if actions:
            results.append({"id": email.id, "actions": actions})
    return {"results": results}


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
