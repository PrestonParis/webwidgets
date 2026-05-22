"""Rule-based accessibility remediation advisor."""
from typing import Literal

CATEGORY_KEYWORDS = {
    "vision": ["color", "contrast", "alt text", "image", "icon", "visual", "text size", "font", "brightness"],
    "keyboard": ["focus", "keyboard", "tab", "shortcut", "navigation", "enter", "escape", "arrow"],
    "motion": ["animation", "transition", "scroll", "flash", "flicker", "parallax", "rotate", "bounce"],
    "cognitive": ["label", "instruction", "form", "placeholder", "error message", "heading", "structure", "reading"],
    "audio": ["audio", "sound", "caption", "transcript", "video", "screen reader", "aria"],
}

SEVERITY_WEIGHTS = {"critical": 1.0, "high": 0.75, "medium": 0.5, "low": 0.25}
SURFACE_WEIGHTS = {"dashboard": 1.0, "page": 0.7, "modal": 0.6, "widget": 0.8}

REMEDIATION_TEMPLATES = {
    "vision": [
        "Ensure text-to-background contrast ratio meets WCAG AA (4.5:1 for body text, 3:1 for large text).",
        "Add descriptive alt attributes to all non-decorative images and icons.",
        "Do not rely on color alone to convey information; add text labels or patterns.",
    ],
    "keyboard": [
        "Add visible focus indicators with outline or ring styles for all interactive elements.",
        "Ensure all interactive elements are reachable via Tab key in logical order.",
        "Implement keyboard shortcuts for primary actions and document them.",
    ],
    "motion": [
        "Wrap animations in @media (prefers-reduced-motion: reduce) media query.",
        "Avoid content that flashes more than 3 times per second.",
        "Provide a control to pause, stop, or hide moving content.",
    ],
    "cognitive": [
        "Add clear, concise labels to all form inputs with associated <label> elements.",
        "Provide explicit error messages that describe what went wrong and how to fix it.",
        "Use consistent heading hierarchy (h1 → h2 → h3) to aid navigation.",
    ],
    "audio": [
        "Add captions to all video content with audio.",
        "Provide transcripts for audio-only content.",
        "Ensure screen reader compatibility with ARIA roles, states, and properties.",
    ],
}


def _classify_category(description: str) -> str:
    desc_lower = description.lower()
    scores = {cat: sum(1 for kw in kws if kw in desc_lower) for cat, kws in CATEGORY_KEYWORDS.items()}
    best = max(scores, key=lambda c: scores[c])
    return best if scores[best] > 0 else "cognitive"


def _priority_score(severity: str, surface: str, interaction_frequency: int) -> float:
    sev = SEVERITY_WEIGHTS.get(severity, 0.5)
    surf = SURFACE_WEIGHTS.get(surface, 0.5)
    freq = min(1.0, interaction_frequency / 100)
    return round(0.5 * sev + 0.3 * surf + 0.2 * freq, 4)


def advise(issues: list[dict]) -> list[dict]:
    """
    Score and generate remediation steps for accessibility issues.
    Each issue: {id, description, severity, surface, interaction_frequency, status}
    Returns list of {id, category, priority_score, steps, notes}
    """
    results = []
    for issue in issues:
        if not issue.get("description"):
            continue
        category = _classify_category(issue.get("description", ""))
        score = _priority_score(
            issue.get("severity", "medium"),
            issue.get("surface", "page"),
            issue.get("interaction_frequency", 10),
        )
        steps = REMEDIATION_TEMPLATES.get(category, REMEDIATION_TEMPLATES["cognitive"])[:2]
        notes = ""
        if category == "motion":
            notes = "Respect prefers-reduced-motion system preference."
        elif category == "keyboard" and issue.get("severity") == "critical":
            notes = "Critical keyboard block prevents users from using the feature at all."
        results.append({
            "id": issue.get("id", ""),
            "category": category,
            "priority_score": score,
            "steps": steps,
            "notes": notes,
        })
    return sorted(results, key=lambda r: r["priority_score"], reverse=True)
