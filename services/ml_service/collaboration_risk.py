"""Deterministic collaboration handoff risk scorer."""
from datetime import datetime, timezone


def _hours_until_due(due_at: str | None) -> float | None:
    if not due_at:
        return None
    try:
        due = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
        delta = (due - datetime.now(timezone.utc)).total_seconds() / 3600
        return delta
    except Exception:
        return None


def score_handoff(handoff: dict) -> float:
    """
    Score a handoff item for risk [0.0 = safe, 1.0 = critical].
    Fields: {id, title, status, owner_online, priority, due_at, blocked, approval_count, automation_role}
    """
    score = 0.0
    status = handoff.get("status", "pending")
    if status == "blocked":
        score += 0.35
    elif status == "stale":
        score += 0.25

    if not handoff.get("owner_online", True):
        score += 0.2

    priority = handoff.get("priority", "medium")
    priority_weights = {"critical": 0.3, "high": 0.2, "medium": 0.1, "low": 0.0}
    score += priority_weights.get(priority, 0.1)

    hours = _hours_until_due(handoff.get("due_at"))
    if hours is not None:
        if hours < 0:
            score += 0.3
        elif hours < 6:
            score += 0.25
        elif hours < 24:
            score += 0.15
        elif hours < 72:
            score += 0.05

    if handoff.get("blocked"):
        score += 0.1

    if handoff.get("automation_role") and handoff.get("approval_count", 1) == 0:
        score += 0.15

    return round(min(1.0, score), 4)


def score_workspace(workspace: dict) -> float:
    """Score a workspace for risk."""
    score = 0.0
    if workspace.get("status") == "blocked":
        score += 0.4
    if workspace.get("pending_approvals", 0) > 3:
        score += 0.2
    active_members = workspace.get("active_members", 1)
    if active_members == 0:
        score += 0.3
    elif active_members == 1:
        score += 0.1
    return round(min(1.0, score), 4)


def detect_risks(handoffs: list[dict], workspaces: list[dict]) -> list[dict]:
    """Return risk items sorted by score descending."""
    results = []
    for h in handoffs:
        s = score_handoff(h)
        if s > 0.1:
            results.append({"id": h.get("id", ""), "type": "handoff", "title": h.get("title", ""),
                             "risk_score": s, "reason": _handoff_reason(h, s)})
    for w in workspaces:
        s = score_workspace(w)
        if s > 0.1:
            results.append({"id": w.get("id", ""), "type": "workspace", "title": w.get("name", ""),
                             "risk_score": s, "reason": _workspace_reason(w, s)})
    return sorted(results, key=lambda r: r["risk_score"], reverse=True)


def _handoff_reason(h: dict, score: float) -> str:
    parts = []
    if h.get("status") in ("blocked", "stale"):
        parts.append(f"status: {h['status']}")
    if not h.get("owner_online", True):
        parts.append("owner offline")
    hours = _hours_until_due(h.get("due_at"))
    if hours is not None and hours < 24:
        parts.append(f"due in {max(0, int(hours))}h")
    return ", ".join(parts) if parts else "elevated risk"


def _workspace_reason(w: dict, score: float) -> str:
    parts = []
    if w.get("status") == "blocked":
        parts.append("workspace blocked")
    if w.get("active_members", 1) == 0:
        parts.append("no active members")
    if w.get("pending_approvals", 0) > 3:
        parts.append(f"{w['pending_approvals']} pending approvals")
    return ", ".join(parts) if parts else "elevated risk"
