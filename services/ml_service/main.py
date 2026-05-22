import time
import uuid
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, Request
from pydantic import BaseModel

import pandas as pd
from scipy import stats as scipy_stats

from observability import setup_logging, setup_sentry, metrics
from schemas import (
    EmailClassification,
    WidgetSuggestionResponse,
    ExtractedActionsResponse,
    ExtractedAction,
    NewsRankRequest, NewsRankResponse, RankedNewsItem,
    HealthTrendRequest, HealthTrendResponse,
    DocumentClassifyRequest, DocumentClassifyResponse,
    TaskRankRequest, TaskRankResponse, RankedTaskItem,
    ContextSummarizeRequest, ContextSummarizeResponse,
    ChatIntentRequest, ChatIntentResponse,
    FinanceAnomalyRequest, FinanceAnomalyResponse, AnomalousTransaction,
    CommandRankRequest, CommandRankResponse, RankedCommandWorkstream,
    GenerateMemoryCardsRequest, GenerateMemoryCardsResponse,
    AccessibilityRemediationRequest, AccessibilityRemediationResponse, AccessibilityRemediation,
    CollaborationRiskRequest, CollaborationRiskResponse, CollaborationRiskItem,
    CreativeCanvasAnalyzeRequest, CreativeCanvasAnalyzeResponse, CreativeCanvasIssue,
)
from model_registry import ModelRegistry
from drift_monitor import DriftMonitor
from memory_card_generator import generate_cards, generate_drill_cards
from accessibility_advisor import advise as advise_accessibility
from collaboration_risk import detect_risks as detect_collaboration_risks
from creative_canvas_analyzer import analyze as analyze_canvas

logger = setup_logging(level=os.getenv("LOG_LEVEL", "INFO"))
setup_sentry()

app = FastAPI()

MODELS_DIR = Path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "models"))
LOGS_DIR = Path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs"))

# Initialize model registry
registry = ModelRegistry(MODELS_DIR)

# Initialize drift monitor
drift_monitor = DriftMonitor(LOGS_DIR)

# Load models with versioning support
model = registry.load_model("email_classifier")
widget_model = registry.load_model("widget_suggester")
action_model = registry.load_model("action_extractor")

# ML suite models (021-027)
news_ranker_model = registry.load_model("news_ranker")
health_trend_model = registry.load_model("health_trend")
document_classifier_model = registry.load_model("document_classifier")
task_priority_model = registry.load_model("task_priority")
chat_intent_model = registry.load_model("chat_intent")
finance_anomaly_model = registry.load_model("finance_anomaly")
command_center_ranker_model = registry.load_model("command_center_ranker")
memory_card_quality_model = registry.load_model("memory_card_quality")

# Load thresholds from metadata or use defaults
SUGGEST_AI_THRESHOLD = 0.35
ACTION_CONFIDENCE_THRESHOLD = 0.35

widget_metadata = registry.get_model_metadata("widget_suggester")
if widget_metadata:
    logger.info(f"Widget suggester metadata: {widget_metadata}")

action_metadata = registry.get_model_metadata("action_extractor")
if action_metadata:
    logger.info(f"Action extractor metadata: {action_metadata}")


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
    is_error = response.status_code >= 400
    
    # Collect metrics
    metrics.record_request(
        latency_ms=duration_ms,
        is_error=is_error,
    )
    
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

def classify(sender: str, subject: str) -> EmailClassification:
    if not model:
        return EmailClassification(category="other", confidence=0.0)
    text = f"{sender} {subject}"
    prediction = model.predict([text])[0]
    confidence = float(model.predict_proba([text]).max())
    
    # Log prediction for drift monitoring
    drift_monitor.log_prediction(
        model="email_classifier",
        prediction=prediction,
        confidence=confidence,
        input_text=text,
        metadata={"sender": sender, "subject": subject}
    )
    
    category = prediction if confidence > 0.6 else "other"
    return EmailClassification(category=category, confidence=confidence)


@app.post("/predict")
async def predict_category(data: EmailData):
    return classify(data.sender, data.subject)


@app.post("/predict/batch")
async def predict_batch(data: BatchEmailData):
    start = time.perf_counter()
    
    if not model:
        results = [
            {"id": email["id"], "category": "other", "confidence": 0.0}
            for email in data.emails
        ]
        return results
    
    # Batch inference optimization
    texts = [f"{email['sender']} {email['subject']}" for email in data.emails]
    predictions = model.predict(texts)
    confidences = model.predict_proba(texts).max(axis=1)
    
    results = []
    for email, pred, conf in zip(data.emails, predictions, confidences):
        category = pred if conf > 0.6 else "other"
        
        # Log prediction for drift monitoring
        drift_monitor.log_prediction(
            model="email_classifier",
            prediction=pred,
            confidence=float(conf),
            input_text=texts[len(results)],
            metadata={"sender": email["sender"], "subject": email["subject"]}
        )
        
        results.append({
            "id": email["id"],
            "category": category,
            "confidence": float(conf)
        })
    
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.debug(
        "batch classification complete",
        extra={
            "count": len(results),
            "duration_ms": duration_ms,
            "throughput": round(len(results) / (duration_ms / 1000), 2)
        },
    )
    return results


@app.post("/extract-actions")
async def extract_actions(data: ExtractRequest):
    results = []
    for email in data.emails:
        raw_actions = _extract_actions_for_email(email)
        if raw_actions:
            # Validate actions with schema
            validated_actions = []
            for action_dict in raw_actions:
                try:
                    validated_action = ExtractedAction(**action_dict)
                    validated_actions.append(validated_action)
                except Exception as e:
                    logger.warning(f"Invalid action schema: {e}", extra={"action": action_dict})
            
            if validated_actions:
                results.append({
                    "id": email.id,
                    "actions": [action.model_dump() for action in validated_actions]
                })
    return {"results": results}


@app.post("/suggest")
async def suggest_widgets(data: SuggestQuery):
    if not widget_model or not data.query.strip():
        logger.debug("Widget suggest skipped — no model or empty query")
        return WidgetSuggestionResponse(suggestions=[], suggest_ai=True)

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

    # Log prediction for drift monitoring
    drift_monitor.log_prediction(
        model="widget_suggester",
        prediction=ranked[0][0] if ranked else "unknown",
        confidence=max_confidence,
        input_text=query,
        metadata={"top_k": data.top_k}
    )

    from schemas import WidgetSuggestion
    suggestions = [
        WidgetSuggestion(widget=widget, confidence=round(conf, 3))
        for widget, conf in top
        if conf > 0.05
    ]

    result = WidgetSuggestionResponse(
        suggestions=suggestions,
        suggest_ai=max_confidence < SUGGEST_AI_THRESHOLD,
    )

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.debug(
        "widget suggestion complete",
        extra={
            "query_length": len(query),
            "top_widget": ranked[0][0] if ranked else None,
            "max_confidence": round(max_confidence, 3),
            "suggest_ai": result.suggest_ai,
            "duration_ms": duration_ms,
        },
    )
    return result


# ---------------------------------------------------------------------------
# ML Suite Endpoints (021-031)
# ---------------------------------------------------------------------------

@app.post("/rank-news")
async def rank_news(data: NewsRankRequest) -> NewsRankResponse:
    if news_ranker_model is None or not data.items:
        return NewsRankResponse(ranked=[RankedNewsItem(id=item.id, relevance_score=0.5) for item in data.items])
    try:
        topic_count = len(data.user_topics)
        rows = pd.DataFrame({
            "text": [f"{i.title} {i.description}" for i in data.items],
            "category": [i.category for i in data.items],
            "topic_count": [topic_count] * len(data.items),
            "cat_match": [1 if i.category in data.user_topics else 0 for i in data.items],
        })
        scores = news_ranker_model.predict(rows)
        ranked = sorted(
            [RankedNewsItem(id=item.id, relevance_score=float(min(1.0, max(0.0, s)))) for item, s in zip(data.items, scores)],
            key=lambda r: r.relevance_score, reverse=True,
        )
        return NewsRankResponse(ranked=ranked)
    except Exception as exc:
        logger.error(f"[rank-news] {exc}")
        return NewsRankResponse(ranked=[RankedNewsItem(id=item.id, relevance_score=0.5) for item in data.items])


@app.post("/analyze-trends")
async def analyze_trends(data: HealthTrendRequest) -> HealthTrendResponse:
    values = data.values
    if len(values) < 3:
        return HealthTrendResponse(metric=data.metric, trend_direction="stable", trend_strength=0.0,
                                    slope=0.0, r_value=0.0, significant=False)
    try:
        slope, _, r_value, p_value, _ = scipy_stats.linregress(range(len(values)), values)
        significant = p_value < 0.05
        direction = "up" if slope > 0.01 else ("down" if slope < -0.01 else "stable")
        if health_trend_model is not None:
            cv = float(np.std(values) / (abs(float(np.mean(values))) or 1))
            row = pd.DataFrame([{"slope": slope, "r_value": abs(r_value), "p_value": p_value,
                                  "std": float(np.std(values)), "cv": cv, "n_days": len(values), "metric": data.metric}])
            strength = float(min(1.0, max(0.0, health_trend_model.predict(row)[0])))
        else:
            strength = min(1.0, abs(float(r_value)))
        return HealthTrendResponse(metric=data.metric, trend_direction=direction, trend_strength=round(strength, 4),
                                    slope=round(float(slope), 6), r_value=round(float(abs(r_value)), 4), significant=significant)
    except Exception as exc:
        logger.error(f"[analyze-trends] {exc}")
        return HealthTrendResponse(metric=data.metric, trend_direction="stable", trend_strength=0.0,
                                    slope=0.0, r_value=0.0, significant=False)


@app.post("/classify-document")
async def classify_document(data: DocumentClassifyRequest) -> DocumentClassifyResponse:
    if document_classifier_model is None:
        return DocumentClassifyResponse(doc_type="unknown", confidence=0.0)
    try:
        proba = document_classifier_model.predict_proba([data.text])[0]
        classes = document_classifier_model.classes_
        top_idx = int(np.argmax(proba))
        alternatives = [{"doc_type": str(classes[i]), "confidence": round(float(proba[i]), 4)}
                        for i in np.argsort(proba)[::-1][1:3]]
        return DocumentClassifyResponse(doc_type=str(classes[top_idx]),
                                         confidence=round(float(proba[top_idx]), 4),
                                         alternatives=alternatives)
    except Exception as exc:
        logger.error(f"[classify-document] {exc}")
        return DocumentClassifyResponse(doc_type="unknown", confidence=0.0)


@app.post("/rank-tasks")
async def rank_tasks(data: TaskRankRequest) -> TaskRankResponse:
    if task_priority_model is None or not data.tasks:
        return TaskRankResponse(ranked=[RankedTaskItem(id=t.id, urgency_score=0.5) for t in data.tasks])
    try:
        rows = pd.DataFrame({
            "title": [t.title for t in data.tasks],
            "category": [t.category for t in data.tasks],
            "priority": [t.priority for t in data.tasks],
            "days_until_due": [t.days_until_due for t in data.tasks],
            "is_blocked": [int(t.is_blocked) for t in data.tasks],
            "has_dependencies": [int(t.has_dependencies) for t in data.tasks],
        })
        scores = task_priority_model.predict(rows)
        ranked = sorted(
            [RankedTaskItem(id=t.id, urgency_score=float(min(1.0, max(0.0, s)))) for t, s in zip(data.tasks, scores)],
            key=lambda r: r.urgency_score, reverse=True,
        )
        return TaskRankResponse(ranked=ranked)
    except Exception as exc:
        logger.error(f"[rank-tasks] {exc}")
        return TaskRankResponse(ranked=[RankedTaskItem(id=t.id, urgency_score=0.5) for t in data.tasks])


@app.post("/summarize-context")
async def summarize_context(data: ContextSummarizeRequest) -> ContextSummarizeResponse:
    name = data.user_name or "you"
    topics = list(set(data.widget_types[:6]))
    topic_str = ", ".join(topics) if topics else "your workspace"
    summary = f"Context for {name}: active widgets include {topic_str}."
    if data.recent_queries:
        summary += f" Recent focus: {data.recent_queries[0]}."
    return ContextSummarizeResponse(summary=summary, topics=topics)


@app.post("/classify-intent")
async def classify_intent(data: ChatIntentRequest) -> ChatIntentResponse:
    if chat_intent_model is None:
        return ChatIntentResponse(intent="help", confidence=0.5)
    try:
        proba = chat_intent_model.predict_proba([data.text])[0]
        classes = chat_intent_model.classes_
        top_idx = int(np.argmax(proba))
        alternatives = [{"intent": str(classes[i]), "confidence": round(float(proba[i]), 4)}
                        for i in np.argsort(proba)[::-1][1:3]]
        return ChatIntentResponse(intent=str(classes[top_idx]),
                                   confidence=round(float(proba[top_idx]), 4),
                                   alternatives=alternatives)
    except Exception as exc:
        logger.error(f"[classify-intent] {exc}")
        return ChatIntentResponse(intent="help", confidence=0.5)


@app.post("/detect-finance-anomalies")
async def detect_finance_anomalies(data: FinanceAnomalyRequest) -> FinanceAnomalyResponse:
    if finance_anomaly_model is None or not data.transactions:
        return FinanceAnomalyResponse(anomalies=[], anomaly_count=0)
    try:
        rows = pd.DataFrame({
            "merchant": [t.merchant for t in data.transactions],
            "category": [t.category for t in data.transactions],
            "amount": [t.amount for t in data.transactions],
        })
        scores = finance_anomaly_model.predict(rows)
        results = []
        for txn, score in zip(data.transactions, scores):
            s = float(min(1.0, max(0.0, score)))
            results.append(AnomalousTransaction(id=txn.id, anomaly_score=round(s, 4), is_anomaly=s > 0.6))
        return FinanceAnomalyResponse(anomalies=results, anomaly_count=sum(1 for r in results if r.is_anomaly))
    except Exception as exc:
        logger.error(f"[detect-finance-anomalies] {exc}")
        return FinanceAnomalyResponse(anomalies=[], anomaly_count=0)


@app.post("/rank-command-workstreams")
async def rank_command_workstreams(data: CommandRankRequest) -> CommandRankResponse:
    if command_center_ranker_model is None or not data.workstreams:
        return CommandRankResponse(ranked=[RankedCommandWorkstream(id=w.id, attention_score=0.5) for w in data.workstreams])
    try:
        rows = pd.DataFrame({
            "title": [w.title for w in data.workstreams],
            "domain": [w.domain for w in data.workstreams],
            "status": [w.status for w in data.workstreams],
            "priority": [w.priority for w in data.workstreams],
            "progress": [w.progress for w in data.workstreams],
            "blockers": [w.blockers for w in data.workstreams],
            "automations": [w.automations for w in data.workstreams],
            "confidence": [w.confidence for w in data.workstreams],
            "due_hours": [w.due_hours for w in data.workstreams],
        })
        scores = command_center_ranker_model.predict(rows)
        ranked = sorted(
            [RankedCommandWorkstream(id=w.id, attention_score=float(min(1.0, max(0.0, s)))) for w, s in zip(data.workstreams, scores)],
            key=lambda r: r.attention_score, reverse=True,
        )
        return CommandRankResponse(ranked=ranked)
    except Exception as exc:
        logger.error(f"[rank-command-workstreams] {exc}")
        return CommandRankResponse(ranked=[RankedCommandWorkstream(id=w.id, attention_score=0.5) for w in data.workstreams])


@app.post("/generate-memory-cards")
async def generate_memory_cards(data: GenerateMemoryCardsRequest) -> GenerateMemoryCardsResponse:
    all_cards = []
    for item in data.items:
        if item.steps and item.topic:
            cards = generate_drill_cards(item.steps, item.topic)
        else:
            cards = generate_cards(item.text, item.source_type, data.max_cards_per_item)
        for card in cards[:data.max_cards_per_item]:
            quality = None
            if memory_card_quality_model is not None:
                try:
                    text = f"{card['front']} [SEP] {card['back']}"
                    quality = str(memory_card_quality_model.predict([text])[0])
                except Exception:
                    pass
            all_cards.append({**card, "quality": quality})
    from schemas import GeneratedMemoryCard
    return GenerateMemoryCardsResponse(
        cards=[GeneratedMemoryCard(**c) for c in all_cards],
        total=len(all_cards),
    )


@app.post("/advise-accessibility")
async def advise_accessibility_endpoint(data: AccessibilityRemediationRequest) -> AccessibilityRemediationResponse:
    if not data.issues:
        return AccessibilityRemediationResponse(remediations=[], total=0)
    try:
        raw_issues = [i.model_dump() for i in data.issues]
        results = advise_accessibility(raw_issues)
        remediations = [AccessibilityRemediation(**r) for r in results]
        return AccessibilityRemediationResponse(remediations=remediations, total=len(remediations))
    except Exception as exc:
        logger.error(f"[advise-accessibility] {exc}")
        return AccessibilityRemediationResponse(remediations=[], total=0)


@app.post("/detect-collaboration-risk")
async def detect_collaboration_risk(data: CollaborationRiskRequest) -> CollaborationRiskResponse:
    try:
        handoffs = [h.model_dump() for h in data.handoffs]
        workspaces = [w.model_dump() for w in data.workspaces]
        results = detect_collaboration_risks(handoffs, workspaces)
        risk_items = [CollaborationRiskItem(**r) for r in results]
        high_risk = sum(1 for r in risk_items if r.risk_score >= 0.6)
        return CollaborationRiskResponse(risks=risk_items, high_risk_count=high_risk)
    except Exception as exc:
        logger.error(f"[detect-collaboration-risk] {exc}")
        return CollaborationRiskResponse(risks=[], high_risk_count=0)


@app.post("/analyze-creative-canvas")
async def analyze_creative_canvas(data: CreativeCanvasAnalyzeRequest) -> CreativeCanvasAnalyzeResponse:
    try:
        layers = [l.model_dump() for l in data.layers]
        result = analyze_canvas(layers, data.canvas_width, data.canvas_height)
        issues = [CreativeCanvasIssue(**i) for i in result["issues"]]
        return CreativeCanvasAnalyzeResponse(
            issues=issues,
            recommended_format=result["recommended_format"],
            ready=result["ready"],
            visible_layer_count=result["visible_layer_count"],
            total_layer_count=result["total_layer_count"],
            export_blocked_count=result["export_blocked_count"],
        )
    except Exception as exc:
        logger.error(f"[analyze-creative-canvas] {exc}")
        return CreativeCanvasAnalyzeResponse(issues=[], recommended_format="png", ready=False,
                                              visible_layer_count=0, total_layer_count=len(data.layers), export_blocked_count=0)


# ---------------------------------------------------------------------------
# Drift Monitoring Endpoints
# ---------------------------------------------------------------------------

@app.get("/drift/{model}")
async def get_drift_analysis(model: str, window_hours: int = 24):
    """Get drift analysis for a specific model."""
    return drift_monitor.analyze_drift(model, window_hours)


@app.get("/feedback/{model}")
async def get_feedback_analysis(model: str, window_hours: int = 168):
    """Get feedback analysis for a specific model."""
    return drift_monitor.analyze_feedback(model, window_hours)


@app.post("/feedback")
async def submit_feedback(
    model: str,
    prediction: str,
    correct_label: str,
    input_text: str,
    user_correction: Optional[str] = None,
    metadata: Optional[dict] = None
):
    """Submit user feedback for a prediction."""
    drift_monitor.log_feedback(
        model=model,
        prediction=prediction,
        correct_label=correct_label,
        input_text=input_text,
        user_correction=user_correction,
        metadata=metadata
    )
    return {"status": "recorded"}


@app.post("/export-retraining/{model}")
async def export_retraining_data(model: str):
    """Export feedback data for retraining."""
    output_path = drift_monitor.export_retraining_data(model)
    return {"status": "exported", "path": str(output_path)}


# ---------------------------------------------------------------------------
# Model Management Endpoints
# ---------------------------------------------------------------------------

@app.get("/models")
async def list_models():
    """List all available models and their versions."""
    return registry.list_models()


@app.get("/models/{model_name}")
async def get_model_info(model_name: str):
    """Get detailed information about a specific model."""
    return registry.get_model_info(model_name)


@app.post("/models/{model_name}/reload")
async def reload_model(model_name: str, version: Optional[int] = None):
    """Force reload a model (hot reload)."""
    reloaded_model = registry.reload_model(model_name, version)
    if reloaded_model:
        # Update global model references
        if model_name == "email_classifier":
            global model
            model = reloaded_model
        elif model_name == "widget_suggester":
            global widget_model
            widget_model = reloaded_model
        elif model_name == "action_extractor":
            global action_model
            action_model = reloaded_model
        return {"status": "reloaded", "model": model_name, "version": version}
    return {"status": "failed", "model": model_name, "version": version}


@app.on_event("shutdown")
async def shutdown_event():
    """Flush drift monitoring logs on shutdown."""
    drift_monitor.flush()


# ---------------------------------------------------------------------------
# Metrics Endpoint
# ---------------------------------------------------------------------------

@app.get("/metrics")
async def get_metrics():
    """Get current observability metrics."""
    return metrics.get_metrics()

