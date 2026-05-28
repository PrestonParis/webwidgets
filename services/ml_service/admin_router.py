"""Routes: drift monitoring, model management, metrics."""
from typing import Optional
from fastapi import APIRouter

import model_store
from observability import metrics

router = APIRouter()


@router.get("/drift/{model_name}")
async def get_drift_analysis(model_name: str, window_hours: int = 24):
    return model_store.drift_monitor.analyze_drift(model_name, window_hours)


@router.get("/feedback/{model_name}")
async def get_feedback_analysis(model_name: str, window_hours: int = 168):
    return model_store.drift_monitor.analyze_feedback(model_name, window_hours)


@router.post("/feedback")
async def submit_feedback(
    model_name: str,
    prediction: str,
    correct_label: str,
    input_text: str,
    user_correction: Optional[str] = None,
    metadata: Optional[dict] = None,
):
    model_store.drift_monitor.log_feedback(model=model_name, prediction=prediction, correct_label=correct_label, input_text=input_text, user_correction=user_correction, metadata=metadata)
    return {"status": "recorded"}


@router.post("/export-retraining/{model_name}")
async def export_retraining_data(model_name: str):
    output_path = model_store.drift_monitor.export_retraining_data(model_name)
    return {"status": "exported", "path": str(output_path)}


@router.get("/models")
async def list_models():
    return model_store.registry.list_models()


@router.get("/models/{model_name}")
async def get_model_info(model_name: str):
    return model_store.registry.get_model_info(model_name)


@router.post("/models/{model_name}/reload")
async def reload_model(model_name: str, version: Optional[int] = None):
    reloaded = model_store.registry.reload_model(model_name, version)
    if not reloaded:
        return {"status": "failed", "model": model_name, "version": version}
    if model_name == "email_classifier":
        model_store.model = reloaded
    elif model_name == "widget_suggester":
        model_store.widget_model = reloaded
    elif model_name == "action_extractor":
        model_store.action_model = reloaded
    return {"status": "reloaded", "model": model_name, "version": version}


@router.get("/metrics")
async def get_metrics():
    return metrics.get_metrics()
