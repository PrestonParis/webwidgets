"""Global model registry and loaded model references.

All route modules import this module and access attributes at call time
(e.g. ``model_store.model``) so that hot-reload via the admin router
takes effect without restarting the process.
"""
import os
from pathlib import Path

from model_registry import ModelRegistry
from drift_monitor import DriftMonitor

MODELS_DIR = Path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "models"))
LOGS_DIR = Path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs"))

registry = ModelRegistry(MODELS_DIR)
drift_monitor = DriftMonitor(LOGS_DIR)

SUGGEST_AI_THRESHOLD = 0.35
ACTION_CONFIDENCE_THRESHOLD = 0.35

# Core models
model = registry.load_model("email_classifier")
widget_model = registry.load_model("widget_suggester")
action_model = registry.load_model("action_extractor")

# ML suite models
news_ranker_model = registry.load_model("news_ranker")
health_trend_model = registry.load_model("health_trend")
document_classifier_model = registry.load_model("document_classifier")
task_priority_model = registry.load_model("task_priority")
chat_intent_model = registry.load_model("chat_intent")
finance_anomaly_model = registry.load_model("finance_anomaly")
command_center_ranker_model = registry.load_model("command_center_ranker")
memory_card_quality_model = registry.load_model("memory_card_quality")
