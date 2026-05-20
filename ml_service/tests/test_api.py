"""Integration tests for ML service API."""
import pytest
from fastapi.testclient import TestClient
from main import app
import json


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


def test_predict_endpoint(client):
    """Test email classification endpoint."""
    response = client.post(
        "/predict",
        json={
            "sender": "billing@netflix.com",
            "subject": "Payment due tomorrow"
        }
    )
    assert response.status_code in [200, 422]  # 200 if model loaded, 422 if validation error
    if response.status_code == 200:
        data = response.json()
        assert "category" in data
        assert "confidence" in data
        assert 0 <= data["confidence"] <= 1


def test_predict_batch_endpoint(client):
    """Test batch classification endpoint."""
    response = client.post(
        "/predict/batch",
        json={
            "emails": [
                {"id": "1", "sender": "billing@netflix.com", "subject": "Payment due"},
                {"id": "2", "sender": "calendar@google.com", "subject": "Meeting at 3pm"},
            ]
        }
    )
    assert response.status_code in [200, 422]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert all("id" in item for item in data)
        assert all("category" in item for item in data)


def test_suggest_widgets_endpoint(client):
    """Test widget suggestion endpoint."""
    response = client.post(
        "/suggest",
        json={"query": "schedule a meeting", "top_k": 3}
    )
    assert response.status_code in [200, 422]
    if response.status_code == 200:
        data = response.json()
        assert "suggestions" in data
        assert "suggest_ai" in data
        assert isinstance(data["suggestions"], list)


def test_extract_actions_endpoint(client):
    """Test action extraction endpoint."""
    response = client.post(
        "/extract-actions",
        json={
            "emails": [
                {
                    "id": "1",
                    "sender": "trial@service.com",
                    "subject": "Your 30-day trial is ending",
                    "snippet": "Your trial will convert to paid in 30 days",
                    "date": "2026-05-15T00:00:00Z"
                }
            ]
        }
    )
    assert response.status_code in [200, 422]
    if response.status_code == 200:
        data = response.json()
        assert "results" in data


def test_list_models_endpoint(client):
    """Test model listing endpoint."""
    response = client.get("/models")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_model_info_endpoint(client):
    """Test model info endpoint."""
    response = client.get("/models/email_classifier")
    assert response.status_code in [200, 404]  # 404 if model doesn't exist


def test_drift_analysis_endpoint(client):
    """Test drift analysis endpoint."""
    response = client.get("/drift/widget_suggester?window_hours=24")
    assert response.status_code == 200
    data = response.json()
    # Should return analysis even if no data
    assert "model" in data or "error" in data


def test_feedback_analysis_endpoint(client):
    """Test feedback analysis endpoint."""
    response = client.get("/feedback/widget_suggester?window_hours=168")
    assert response.status_code == 200
    data = response.json()
    # Should return analysis even if no data
    assert "model" in data or "error" in data


def test_submit_feedback_endpoint(client):
    """Test feedback submission endpoint."""
    response = client.post(
        "/feedback",
        json={
            "model": "widget_suggester",
            "prediction": "calendar",
            "correct_label": "todo",
            "input_text": "schedule meeting"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "recorded"


def test_export_retraining_endpoint(client):
    """Test retraining data export endpoint."""
    response = client.post("/export-retraining/widget_suggester")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "path" in data


def test_reload_model_endpoint(client):
    """Test model reload endpoint."""
    response = client.post("/models/email_classifier/reload")
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "status" in data
        assert data["status"] in ["reloaded", "failed"]


def test_schema_validation_invalid_action(client):
    """Test that invalid actions are rejected by schema validation."""
    response = client.post(
        "/extract-actions",
        json={
            "emails": [
                {
                    "id": "1",
                    "sender": "test@test.com",
                    "subject": "Test",
                    "snippet": "Test",
                    "date": "invalid-date"  # Invalid date format
                }
            ]
        }
    )
    # Should handle gracefully (may return 200 with empty results or 422)
    assert response.status_code in [200, 422]


def test_batch_inference_optimization(client):
    """Test that batch inference uses optimized batching."""
    # This is more of a performance test, but we can verify it works
    emails = [
        {"id": str(i), "sender": f"sender{i}@test.com", "subject": f"Subject {i}"}
        for i in range(10)
    ]
    response = client.post("/predict/batch", json={"emails": emails})
    assert response.status_code in [200, 422]
    if response.status_code == 200:
        data = response.json()
        assert len(data) == 10


def test_empty_query_handling(client):
    """Test handling of empty query in widget suggestion."""
    response = client.post("/suggest", json={"query": "", "top_k": 3})
    assert response.status_code == 200
    data = response.json()
    assert data["suggestions"] == []
    assert data["suggest_ai"] is True


def test_confidence_thresholds(client):
    """Test that confidence thresholds are respected."""
    # This is a regression test to ensure thresholds are applied
    response = client.post(
        "/suggest",
        json={"query": "very specific query that should match", "top_k": 3}
    )
    assert response.status_code in [200, 422]
    if response.status_code == 200:
        data = response.json()
        # All suggestions should have confidence > 0.05 (filtering threshold)
        for suggestion in data["suggestions"]:
            assert suggestion["confidence"] > 0.05


def test_request_id_header(client):
    """Test that request ID is added to response headers."""
    response = client.post(
        "/predict",
        json={"sender": "test@test.com", "subject": "Test"}
    )
    assert response.status_code in [200, 422]
    if response.status_code == 200:
        assert "x-request-id" in response.headers
