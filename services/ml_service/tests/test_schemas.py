"""Tests for Pydantic schemas."""
import pytest
from datetime import datetime
from schemas import (
    ExtractedAction,
    EmailClassification,
    WidgetSuggestion,
    WidgetSuggestionResponse,
    ActionClassification,
)


def test_extracted_action_valid():
    """Test valid ExtractedAction creation."""
    action = ExtractedAction(
        type="deadline",
        title="Netflix trial ends",
        description="30-day trial — decide before it converts to paid",
        due_date="2026-06-01T00:00:00Z",
        action_url=None
    )
    assert action.type == "deadline"
    assert action.title == "Netflix trial ends"
    assert action.due_date == "2026-06-01T00:00:00Z"


def test_extracted_action_invalid_due_date():
    """Test ExtractedAction with invalid due date."""
    with pytest.raises(ValueError, match="Invalid ISO 8601 datetime string"):
        ExtractedAction(
            type="deadline",
            title="Netflix trial ends",
            description="30-day trial",
            due_date="invalid-date",
            action_url=None
        )


def test_extracted_action_invalid_url():
    """Test ExtractedAction with invalid URL."""
    with pytest.raises(ValueError, match="Invalid URL"):
        ExtractedAction(
            type="action",
            title="Verify account",
            description="Verify your account",
            due_date=None,
            action_url="not-a-url"
        )


def test_extracted_action_title_too_long():
    """Test ExtractedAction with title exceeding max length."""
    with pytest.raises(ValueError):
        ExtractedAction(
            type="deadline",
            title="x" * 201,  # Exceeds 200 char limit
            description="Test",
            due_date=None,
            action_url=None
        )


def test_email_classification_valid():
    """Test valid EmailClassification creation."""
    classification = EmailClassification(
        category="billing",
        confidence=0.8734
    )
    assert classification.category == "billing"
    assert classification.confidence == 0.8734


def test_email_classification_confidence_rounding():
    """Test that confidence is rounded to 4 decimal places."""
    classification = EmailClassification(
        category="billing",
        confidence=0.873456789
    )
    assert classification.confidence == 0.8735


def test_email_classification_confidence_out_of_range():
    """Test EmailClassification with confidence out of range."""
    with pytest.raises(ValueError, match="Confidence must be between 0 and 1"):
        EmailClassification(
            category="billing",
            confidence=1.5
        )


def test_widget_suggestion_valid():
    """Test valid WidgetSuggestion creation."""
    suggestion = WidgetSuggestion(
        widget="calendar",
        confidence=0.742
    )
    assert suggestion.widget == "calendar"
    assert suggestion.confidence == 0.742


def test_widget_suggestion_response_valid():
    """Test valid WidgetSuggestionResponse creation."""
    response = WidgetSuggestionResponse(
        suggestions=[
            WidgetSuggestion(widget="calendar", confidence=0.742),
            WidgetSuggestion(widget="todo", confidence=0.521),
        ],
        suggest_ai=False
    )
    assert len(response.suggestions) == 2
    assert response.suggest_ai is False


def test_action_classification_valid():
    """Test valid ActionClassification creation."""
    classification = ActionClassification(
        action_type="trial_end",
        confidence=0.8921
    )
    assert classification.action_type == "trial_end"
    assert classification.confidence == 0.8921


def test_all_action_types():
    """Test all valid action types."""
    for action_type in ["deadline", "event", "action"]:
        action = ExtractedAction(
            type=action_type,
            title="Test",
            description="Test description",
            due_date=None,
            action_url=None
        )
        assert action.type == action_type


def test_optional_fields():
    """Test that optional fields can be None."""
    action = ExtractedAction(
        type="action",
        title="Test",
        description="Test",
        due_date=None,
        action_url=None
    )
    assert action.due_date is None
    assert action.action_url is None
