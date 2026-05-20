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
