"""Pydantic schemas for type-safe ML outputs."""
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from datetime import datetime


class ExtractedAction(BaseModel):
    """Schema for extracted actions from emails."""
    
    type: Literal["deadline", "event", "action"] = Field(
        ...,
        description="Type of action: deadline (time-sensitive), event (calendar), or action (to-do)"
    )
    title: str = Field(..., min_length=1, max_length=200, description="Action title")
    description: str = Field(..., min_length=1, max_length=500, description="Action description")
    due_date: Optional[str] = Field(
        None,
        description="ISO 8601 datetime string for due date, if applicable"
    )
    action_url: Optional[str] = Field(
        None,
        description="URL to take action, if applicable"
    )
    
    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[str]) -> Optional[str]:
        """Validate that due_date is a valid ISO 8601 datetime string."""
        if v is None:
            return v
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
            return v
        except ValueError:
            raise ValueError(f"Invalid ISO 8601 datetime string: {v}")
    
    @field_validator("action_url")
    @classmethod
    def validate_action_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate that action_url is a valid URL if provided."""
        if v is None:
            return v
        if not v.startswith(("http://", "https://")):
            raise ValueError(f"Invalid URL: {v}")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "deadline",
                "title": "Netflix trial ends",
                "description": "30-day trial — decide before it converts to paid",
                "due_date": "2026-06-01T00:00:00Z",
                "action_url": None
            }
        }


class EmailClassification(BaseModel):
    """Schema for email classification results."""
    
    category: str = Field(..., description="Predicted category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    
    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        """Ensure confidence is between 0 and 1."""
        if not 0.0 <= v <= 1.0:
            raise ValueError(f"Confidence must be between 0 and 1, got {v}")
        return round(v, 4)
    
    class Config:
        json_schema_extra = {
            "example": {
                "category": "billing",
                "confidence": 0.8734
            }
        }


class WidgetSuggestion(BaseModel):
    """Schema for widget suggestions."""
    
    widget: str = Field(..., description="Widget type")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    
    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        """Ensure confidence is between 0 and 1."""
        if not 0.0 <= v <= 1.0:
            raise ValueError(f"Confidence must be between 0 and 1, got {v}")
        return round(v, 3)
    
    class Config:
        json_schema_extra = {
            "example": {
                "widget": "calendar",
                "confidence": 0.742
            }
        }


class WidgetSuggestionResponse(BaseModel):
    """Schema for widget suggestion API response."""
    
    suggestions: list[WidgetSuggestion] = Field(default_factory=list, description="List of widget suggestions")
    suggest_ai: bool = Field(..., description="Whether to suggest AI widget instead")
    
    class Config:
        json_schema_extra = {
            "example": {
                "suggestions": [
                    {"widget": "calendar", "confidence": 0.742},
                    {"widget": "todo", "confidence": 0.521},
                    {"widget": "pomodoro", "confidence": 0.318}
                ],
                "suggest_ai": False
            }
        }


class ActionClassification(BaseModel):
    """Schema for action classification results."""
    
    action_type: str = Field(..., description="Predicted action type")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    
    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        """Ensure confidence is between 0 and 1."""
        if not 0.0 <= v <= 1.0:
            raise ValueError(f"Confidence must be between 0 and 1, got {v}")
        return round(v, 4)
    
    class Config:
        json_schema_extra = {
            "example": {
                "action_type": "trial_end",
                "confidence": 0.8921
            }
        }


class ExtractedActionsResponse(BaseModel):
    """Schema for extracted actions API response."""
    
    id: str = Field(..., description="Email ID")
    actions: list[ExtractedAction] = Field(default_factory=list, description="List of extracted actions")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "email_123",
                "actions": [
                    {
                        "type": "deadline",
                        "title": "Netflix trial ends",
                        "description": "30-day trial — decide before it converts to paid",
                        "due_date": "2026-06-01T00:00:00Z",
                        "action_url": None
                    }
                ]
            }
        }


class BatchClassificationResult(BaseModel):
    """Schema for batch classification results."""

    id: str = Field(..., description="Email ID")
    category: str = Field(..., description="Predicted category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        """Ensure confidence is between 0 and 1."""
        if not 0.0 <= v <= 1.0:
            raise ValueError(f"Confidence must be between 0 and 1, got {v}")
        return round(v, 4)


# ---------------------------------------------------------------------------
# News Ranker (021)
# ---------------------------------------------------------------------------

class NewsRankItem(BaseModel):
    id: str
    title: str
    description: str
    category: str

class NewsRankRequest(BaseModel):
    items: list[NewsRankItem]
    user_topics: list[str] = Field(default_factory=list)

class RankedNewsItem(BaseModel):
    id: str
    relevance_score: float = Field(..., ge=0.0, le=1.0)

class NewsRankResponse(BaseModel):
    ranked: list[RankedNewsItem]


# ---------------------------------------------------------------------------
# Health Trend Detector (022)
# ---------------------------------------------------------------------------

class HealthTrendRequest(BaseModel):
    metric: str
    values: list[float]

class HealthTrendResponse(BaseModel):
    metric: str
    trend_direction: str
    trend_strength: float = Field(..., ge=0.0, le=1.0)
    slope: float
    r_value: float
    significant: bool


# ---------------------------------------------------------------------------
# Document Classifier (023)
# ---------------------------------------------------------------------------

class DocumentClassifyRequest(BaseModel):
    text: str
    filename: Optional[str] = None

class DocumentClassifyResponse(BaseModel):
    doc_type: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    alternatives: list[dict] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Task Priority Ranker (024)
# ---------------------------------------------------------------------------

class TaskRankItem(BaseModel):
    id: str
    title: str
    category: str = "engineering"
    priority: str = "medium"
    days_until_due: int = 7
    is_blocked: bool = False
    has_dependencies: bool = False

class TaskRankRequest(BaseModel):
    tasks: list[TaskRankItem]

class RankedTaskItem(BaseModel):
    id: str
    urgency_score: float = Field(..., ge=0.0, le=1.0)

class TaskRankResponse(BaseModel):
    ranked: list[RankedTaskItem]


# ---------------------------------------------------------------------------
# Context Summarizer + Chat Intent (025)
# ---------------------------------------------------------------------------

class ContextSummarizeRequest(BaseModel):
    widget_types: list[str]
    recent_queries: list[str] = Field(default_factory=list)
    user_name: Optional[str] = None

class ContextSummarizeResponse(BaseModel):
    summary: str
    topics: list[str]

class ChatIntentRequest(BaseModel):
    text: str

class ChatIntentResponse(BaseModel):
    intent: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    alternatives: list[dict] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Finance Anomaly Detector (026)
# ---------------------------------------------------------------------------

class FinanceTransactionItem(BaseModel):
    id: str
    merchant: str
    category: str
    amount: float

class FinanceAnomalyRequest(BaseModel):
    transactions: list[FinanceTransactionItem]

class AnomalousTransaction(BaseModel):
    id: str
    anomaly_score: float = Field(..., ge=0.0, le=1.0)
    is_anomaly: bool

class FinanceAnomalyResponse(BaseModel):
    anomalies: list[AnomalousTransaction]
    anomaly_count: int


# ---------------------------------------------------------------------------
# Command Center Ranker (027)
# ---------------------------------------------------------------------------

class CommandWorkstreamItem(BaseModel):
    id: str
    title: str
    domain: str = "engineering"
    status: str = "active"
    priority: str = "medium"
    progress: int = 0
    blockers: int = 0
    automations: int = 0
    confidence: float = 0.8
    due_hours: int = 168

class CommandRankRequest(BaseModel):
    workstreams: list[CommandWorkstreamItem]

class RankedCommandWorkstream(BaseModel):
    id: str
    attention_score: float = Field(..., ge=0.0, le=1.0)

class CommandRankResponse(BaseModel):
    ranked: list[RankedCommandWorkstream]


# ---------------------------------------------------------------------------
# Memory Card Generator (028)
# ---------------------------------------------------------------------------

class MemorySourceItem(BaseModel):
    id: str
    text: str
    source_type: str = "note"
    steps: list[str] = Field(default_factory=list)
    topic: Optional[str] = None

class GeneratedMemoryCard(BaseModel):
    type: str
    front: str
    back: str
    source: str
    difficulty: str
    quality: Optional[str] = None

class GenerateMemoryCardsRequest(BaseModel):
    items: list[MemorySourceItem]
    max_cards_per_item: int = 5

class GenerateMemoryCardsResponse(BaseModel):
    cards: list[GeneratedMemoryCard]
    total: int


# ---------------------------------------------------------------------------
# Accessibility Advisor (029)
# ---------------------------------------------------------------------------

class AccessibilityIssueItem(BaseModel):
    id: str
    description: str
    severity: str = "medium"
    surface: str = "page"
    interaction_frequency: int = 10
    status: str = "failing"

class AccessibilityRemediationRequest(BaseModel):
    issues: list[AccessibilityIssueItem]

class AccessibilityRemediation(BaseModel):
    id: str
    category: str
    priority_score: float = Field(..., ge=0.0, le=1.0)
    steps: list[str]
    notes: str

class AccessibilityRemediationResponse(BaseModel):
    remediations: list[AccessibilityRemediation]
    total: int


# ---------------------------------------------------------------------------
# Collaboration Handoff Risk (030)
# ---------------------------------------------------------------------------

class CollaborationHandoffItem(BaseModel):
    id: str
    title: str
    status: str = "pending"
    owner_online: bool = True
    priority: str = "medium"
    due_at: Optional[str] = None
    blocked: bool = False
    approval_count: int = 1
    automation_role: bool = False

class CollaborationWorkspaceItem(BaseModel):
    id: str
    name: str
    status: str = "active"
    active_members: int = 2
    pending_approvals: int = 0

class CollaborationRiskRequest(BaseModel):
    handoffs: list[CollaborationHandoffItem] = Field(default_factory=list)
    workspaces: list[CollaborationWorkspaceItem] = Field(default_factory=list)

class CollaborationRiskItem(BaseModel):
    id: str
    type: str
    title: str
    risk_score: float = Field(..., ge=0.0, le=1.0)
    reason: str

class CollaborationRiskResponse(BaseModel):
    risks: list[CollaborationRiskItem]
    high_risk_count: int


# ---------------------------------------------------------------------------
# Creative Canvas Understanding (031)
# ---------------------------------------------------------------------------

class CreativeLayerItem(BaseModel):
    id: str
    name: str
    type: str = "shape"
    visible: bool = True
    locked: bool = False
    x: float = 0
    y: float = 0
    width: float = 100
    height: float = 100
    fill_color: Optional[str] = None
    text_color: Optional[str] = None
    content: Optional[str] = None

class CreativeCanvasAnalyzeRequest(BaseModel):
    layers: list[CreativeLayerItem]
    canvas_width: float = 1920
    canvas_height: float = 1080

class CreativeCanvasIssue(BaseModel):
    layer_id: str
    type: str
    severity: str
    message: str

class CreativeCanvasAnalyzeResponse(BaseModel):
    issues: list[CreativeCanvasIssue]
    recommended_format: str
    ready: bool
    visible_layer_count: int
    total_layer_count: int
    export_blocked_count: int
