"""Tests for drift monitor."""
import pytest
from pathlib import Path
from datetime import datetime, timezone
from drift_monitor import DriftMonitor


@pytest.fixture
def temp_log_dir(tmp_path):
    """Create a temporary logs directory."""
    log_dir = tmp_path / "logs"
    log_dir.mkdir()
    return log_dir


@pytest.fixture
def drift_monitor(temp_log_dir):
    """Create a DriftMonitor instance."""
    return DriftMonitor(temp_log_dir)


def test_drift_monitor_initialization(temp_log_dir):
    """Test DriftMonitor initialization."""
    monitor = DriftMonitor(temp_log_dir)
    assert monitor.log_dir == temp_log_dir
    assert monitor._prediction_log == []
    assert monitor._feedback_log == []


def test_log_prediction(drift_monitor):
    """Test logging a prediction."""
    drift_monitor.log_prediction(
        model="widget_suggester",
        prediction="calendar",
        confidence=0.75,
        input_text="schedule meeting",
        metadata={"user_id": "123"}
    )
    assert len(drift_monitor._prediction_log) == 1
    assert drift_monitor._prediction_log[0]["model"] == "widget_suggester"
    assert drift_monitor._prediction_log[0]["prediction"] == "calendar"
    assert drift_monitor._prediction_log[0]["confidence"] == 0.75


def test_log_feedback(drift_monitor):
    """Test logging user feedback."""
    drift_monitor.log_feedback(
        model="widget_suggester",
        prediction="calendar",
        correct_label="todo",
        input_text="schedule meeting",
        user_correction=None,
        metadata={"user_id": "123"}
    )
    assert len(drift_monitor._feedback_log) == 1
    assert drift_monitor._feedback_log[0]["model"] == "widget_suggester"
    assert drift_monitor._feedback_log[0]["prediction"] == "calendar"
    assert drift_monitor._feedback_log[0]["correct_label"] == "todo"
    assert drift_monitor._feedback_log[0]["disagreement"] is True


def test_flush_predictions(drift_monitor, temp_log_dir):
    """Test flushing predictions to disk."""
    drift_monitor.log_prediction(
        model="widget_suggester",
        prediction="calendar",
        confidence=0.75,
        input_text="schedule meeting"
    )
    drift_monitor._flush_predictions()
    
    # Check that log file was created
    log_files = list(temp_log_dir.glob("predictions_*.jsonl"))
    assert len(log_files) == 1
    assert drift_monitor._prediction_log == []


def test_flush_feedback(drift_monitor, temp_log_dir):
    """Test flushing feedback to disk."""
    drift_monitor.log_feedback(
        model="widget_suggester",
        prediction="calendar",
        correct_label="todo",
        input_text="schedule meeting"
    )
    drift_monitor._flush_feedback()
    
    # Check that log file was created
    log_files = list(temp_log_dir.glob("feedback_*.jsonl"))
    assert len(log_files) == 1
    assert drift_monitor._feedback_log == []


def test_analyze_drift_no_data(drift_monitor):
    """Test drift analysis with no data."""
    result = drift_monitor.analyze_drift("widget_suggester")
    assert "error" in result
    assert "No recent predictions found" in result["error"]


def test_analyze_feedback_no_data(drift_monitor):
    """Test feedback analysis with no data."""
    result = drift_monitor.analyze_feedback("widget_suggester")
    assert "error" in result
    assert "No recent feedback found" in result["error"]


def test_export_retraining_data(drift_monitor, temp_log_dir):
    """Test exporting retraining data."""
    # Add some feedback
    drift_monitor.log_feedback(
        model="widget_suggester",
        prediction="calendar",
        correct_label="todo",
        input_text="schedule meeting"
    )
    drift_monitor._flush_feedback()
    
    # Export
    output_path = drift_monitor.export_retraining_data("widget_suggester")
    
    assert output_path.exists()
    
    # Verify content
    import json
    with open(output_path) as f:
        data = json.load(f)
    assert len(data) == 1
    assert data[0]["label"] == "todo"


def test_flush(drift_monitor, temp_log_dir):
    """Test flushing all logs."""
    drift_monitor.log_prediction(
        model="widget_suggester",
        prediction="calendar",
        confidence=0.75,
        input_text="schedule meeting"
    )
    drift_monitor.log_feedback(
        model="widget_suggester",
        prediction="calendar",
        correct_label="todo",
        input_text="schedule meeting"
    )
    
    drift_monitor.flush()
    
    assert drift_monitor._prediction_log == []
    assert drift_monitor._feedback_log == []
    
    # Check files were created
    assert len(list(temp_log_dir.glob("predictions_*.jsonl"))) == 1
    assert len(list(temp_log_dir.glob("feedback_*.jsonl"))) == 1


def test_confidence_rounding(drift_monitor):
    """Test that confidence is rounded to 4 decimal places."""
    drift_monitor.log_prediction(
        model="widget_suggester",
        prediction="calendar",
        confidence=0.756789,
        input_text="schedule meeting"
    )
    assert drift_monitor._prediction_log[0]["confidence"] == 0.7568


def test_input_text_truncation(drift_monitor):
    """Test that input text is truncated for storage."""
    long_text = "x" * 1000
    drift_monitor.log_prediction(
        model="widget_suggester",
        prediction="calendar",
        confidence=0.75,
        input_text=long_text
    )
    assert len(drift_monitor._prediction_log[0]["input_text"]) == 500
