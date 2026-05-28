"""Date-parsing utilities, service-name extraction, and per-type action extractors."""
import re
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import model_store
from request_models import ExtractEmailItem

logger = logging.getLogger(__name__)

_NAMED_DATE_RE = r"([A-Z][a-z]+\s+\d{1,2}(?:,\s*\d{4})?)"

_TRIAL_DURATION_RE: list[tuple[re.Pattern, str]] = [
    (re.compile(r"(\d+)[- ]day(?:\s+free)?\s+trial", re.I), "days"),
    (re.compile(r"(\d+)[- ]week(?:\s+free)?\s+trial", re.I), "weeks"),
    (re.compile(r"(\d+)[- ]month(?:\s+free)?\s+trial", re.I), "months"),
    (re.compile(r"trial\s+(?:period\s+)?(?:of\s+)?(\d+)\s+days?", re.I), "days"),
    (re.compile(r"free\s+for\s+(\d+)\s+days?", re.I), "days"),
    (re.compile(r"expires?\s+in\s+(\d+)\s+days?", re.I), "days"),
]

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


def classify_action(text: str) -> tuple[str, float]:
    if not model_store.action_model:
        return "ignore", 0.0
    pred = model_store.action_model.predict([text])[0]
    confidence = float(model_store.action_model.predict_proba([text]).max())
    return pred, confidence


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
                {"type": "deadline", "title": f"{service} trial ends", "description": f"{n}-{unit.rstrip('s')} trial — decide before it converts to paid", "due_date": due, "action_url": None},
                {"type": "event", "title": f"Evaluate or cancel {service}", "description": f"Trial ends {due[:10]}", "due_date": due, "action_url": None},
            ]
    due = _find_date_in_text(text, received)
    return [
        {"type": "deadline", "title": f"{service} trial ends", "description": "Trial period ending — decide before it converts to paid", "due_date": due, "action_url": None},
        {"type": "event", "title": f"Evaluate or cancel {service}", "description": "Trial ending soon" + (f" — {due[:10]}" if due else ""), "due_date": due, "action_url": None},
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
    return [{"type": "deadline", "title": title, "description": description, "due_date": due_date, "action_url": None}]


def extract_meeting(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    received = _parse_date(email.date)
    service = _service_name(email.sender, email.subject)
    due_date = _find_date_in_text(text, received)
    return [{"type": "event", "title": email.subject[:60], "description": f"From {service}", "due_date": due_date, "action_url": None}]


def extract_verification(email: ExtractEmailItem) -> list[dict]:
    service = _service_name(email.sender, email.subject)
    url_m = re.search(r"https?://\S+", email.body or email.snippet)
    return [{"type": "action", "title": f"Verify {service} account", "description": email.subject[:80], "due_date": None, "action_url": url_m.group(0).rstrip(".,)>") if url_m else None}]


def extract_reply(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    received = _parse_date(email.date)
    service = _service_name(email.sender, email.subject)
    due_date = _find_date_in_text(text, received)
    return [{"type": "action", "title": f"Reply to {service}", "description": email.subject[:80], "due_date": due_date, "action_url": None}]


def extract_deadline(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    received = _parse_date(email.date)
    due_date = _find_date_in_text(text, received)
    return [{"type": "deadline", "title": email.subject[:60], "description": f"Due {due_date[:10]}" if due_date else email.snippet[:80], "due_date": due_date, "action_url": None}]


def extract_actions_for_email(email: ExtractEmailItem) -> list[dict]:
    text = f"{email.subject} {email.body or email.snippet}"
    action_type, confidence = classify_action(text)
    logger.debug("action classified", extra={"type": action_type, "confidence": round(confidence, 3)})
    if confidence < model_store.ACTION_CONFIDENCE_THRESHOLD:
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
