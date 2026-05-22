"""Deterministic memory card generator from highlights, notes, lessons, and knowledge items."""
import re
from typing import Optional


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 10]


def _cloze_card(sentence: str, source: str) -> Optional[dict]:
    """Extract a fill-in-the-blank card from a sentence with a key term."""
    match = re.search(r'\b([A-Z][a-z]{3,}(?:\s[A-Z][a-z]{3,})?)\b', sentence)
    if not match:
        match = re.search(r'\b([a-z]{6,})\b', sentence)
    if not match:
        return None
    term = match.group(1)
    cloze_front = sentence.replace(term, f"[{term}]", 1)
    return {"type": "cloze", "front": cloze_front, "back": term, "source": source, "difficulty": _difficulty(sentence)}


def _qa_card(sentence: str, source: str) -> Optional[dict]:
    """Generate a Q/A card from a definition-style sentence."""
    definition_patterns = [
        r'(.+?) (?:is|are|refers to|means|denotes) (.+)',
        r'(.+?): (.+)',
        r'(?:The|A|An) (.+?) (?:is|are) (.+)',
    ]
    for pattern in definition_patterns:
        m = re.match(pattern, sentence, re.IGNORECASE)
        if m:
            term, definition = m.group(1).strip(), m.group(2).strip()
            if len(term) > 2 and len(definition) > 5:
                return {"type": "qa", "front": f"What is {term}?", "back": definition, "source": source, "difficulty": _difficulty(sentence)}
    return None


def _difficulty(text: str) -> str:
    words = text.split()
    entities = sum(1 for w in words if w[0].isupper()) if words else 0
    if len(words) > 25 or entities > 3:
        return "hard"
    if len(words) > 12 or entities > 1:
        return "medium"
    return "easy"


def generate_cards(source_text: str, source_type: str, max_cards: int = 10) -> list[dict]:
    """Generate spaced-repetition cards from source text."""
    if not source_text or len(source_text.strip()) < 15:
        return []

    sentences = _sentences(source_text)
    cards: list[dict] = []

    for sentence in sentences[:max_cards * 2]:
        if len(cards) >= max_cards:
            break
        qa = _qa_card(sentence, source_type)
        if qa:
            cards.append(qa)
            continue
        cloze = _cloze_card(sentence, source_type)
        if cloze:
            cards.append(cloze)

    return cards[:max_cards]


def generate_drill_cards(steps: list[str], topic: str) -> list[dict]:
    """Generate workflow drill cards from tutorial steps."""
    cards = []
    for i, step in enumerate(steps):
        if len(step.strip()) < 5:
            continue
        cards.append({
            "type": "drill",
            "front": f"Step {i + 1} of {topic}: What comes next?",
            "back": step.strip(),
            "source": "tutorial",
            "difficulty": "easy" if len(step) < 50 else "medium",
        })
    return cards
