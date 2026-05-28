"""Routes: email classification, widget suggestion, action extraction."""
import time
import logging

import numpy as np
from fastapi import APIRouter

import model_store
from request_models import EmailData, BatchEmailData, SuggestQuery, ExtractRequest
from email_utils import extract_actions_for_email
from schemas import (
    EmailClassification,
    WidgetSuggestion,
    WidgetSuggestionResponse,
    ExtractedAction,
    ExtractedActionsResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def classify(sender: str, subject: str) -> EmailClassification:
    if not model_store.model:
        return EmailClassification(category="other", confidence=0.0)
    text = f"{sender} {subject}"
    prediction = model_store.model.predict([text])[0]
    confidence = float(model_store.model.predict_proba([text]).max())
    model_store.drift_monitor.log_prediction(model="email_classifier", prediction=prediction, confidence=confidence, input_text=text, metadata={"sender": sender, "subject": subject})
    category = prediction if confidence > 0.6 else "other"
    return EmailClassification(category=category, confidence=confidence)


@router.post("/predict")
async def predict_category(data: EmailData):
    return classify(data.sender, data.subject)


@router.post("/predict/batch")
async def predict_batch(data: BatchEmailData):
    start = time.perf_counter()
    if not model_store.model:
        return [{"id": email["id"], "category": "other", "confidence": 0.0} for email in data.emails]
    texts = [f"{email['sender']} {email['subject']}" for email in data.emails]
    predictions = model_store.model.predict(texts)
    confidences = model_store.model.predict_proba(texts).max(axis=1)
    results = []
    for email, pred, conf in zip(data.emails, predictions, confidences):
        category = pred if conf > 0.6 else "other"
        model_store.drift_monitor.log_prediction(model="email_classifier", prediction=pred, confidence=float(conf), input_text=texts[len(results)], metadata={"sender": email["sender"], "subject": email["subject"]})
        results.append({"id": email["id"], "category": category, "confidence": float(conf)})
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.debug("batch classification complete", extra={"count": len(results), "duration_ms": duration_ms, "throughput": round(len(results) / (duration_ms / 1000), 2)})
    return results


@router.post("/suggest")
async def suggest_widgets(data: SuggestQuery):
    if not model_store.widget_model or not data.query.strip():
        logger.debug("Widget suggest skipped — no model or empty query")
        return WidgetSuggestionResponse(suggestions=[], suggest_ai=True)
    start = time.perf_counter()
    query = data.query.strip()
    proba = model_store.widget_model.predict_proba([query])[0]
    classes = model_store.widget_model.classes_
    ranked = sorted(zip(classes, proba.tolist()), key=lambda x: x[1], reverse=True)
    top = ranked[: data.top_k]
    max_confidence = float(np.max(proba))
    model_store.drift_monitor.log_prediction(model="widget_suggester", prediction=ranked[0][0] if ranked else "unknown", confidence=max_confidence, input_text=query, metadata={"top_k": data.top_k})
    suggestions = [WidgetSuggestion(widget=widget, confidence=round(conf, 3)) for widget, conf in top if conf > 0.05]
    result = WidgetSuggestionResponse(suggestions=suggestions, suggest_ai=max_confidence < model_store.SUGGEST_AI_THRESHOLD)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.debug("widget suggestion complete", extra={"query_length": len(query), "top_widget": ranked[0][0] if ranked else None, "max_confidence": round(max_confidence, 3), "suggest_ai": result.suggest_ai, "duration_ms": duration_ms})
    return result


@router.post("/extract-actions")
async def extract_actions(data: ExtractRequest):
    results = []
    for email in data.emails:
        raw_actions = extract_actions_for_email(email)
        if raw_actions:
            validated_actions = []
            for action_dict in raw_actions:
                try:
                    validated_actions.append(ExtractedAction(**action_dict))
                except Exception as e:
                    logger.warning(f"Invalid action schema: {e}", extra={"action": action_dict})
            if validated_actions:
                results.append({"id": email.id, "actions": [action.model_dump() for action in validated_actions]})
    return {"results": results}
