"""Drift monitoring and feedback loop for ML predictions."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
from collections import defaultdict, Counter
import logging
import numpy as np

logger = logging.getLogger("ml_service")


class DriftMonitor:
    """Monitor prediction drift and collect feedback for retraining."""
    
    def __init__(self, log_dir: Path):
        self.log_dir = log_dir
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self._prediction_log: List[Dict[str, Any]] = []
        self._feedback_log: List[Dict[str, Any]] = []
        self._session_start = datetime.now(timezone.utc).isoformat()
    
    def log_prediction(
        self,
        model: str,
        prediction: str,
        confidence: float,
        input_text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log a prediction for drift monitoring.
        
        Args:
            model: Model name (e.g., "widget_suggester")
            prediction: Predicted class/label
            confidence: Model confidence score
            input_text: Input text that was classified
            metadata: Additional metadata (email ID, user ID, etc.)
        """
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model": model,
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "input_text": input_text[:500],  # Truncate for storage
            "metadata": metadata or {},
        }
        self._prediction_log.append(entry)
        
        # Flush to disk periodically (every 100 predictions)
        if len(self._prediction_log) % 100 == 0:
            self._flush_predictions()
    
    def log_feedback(
        self,
        model: str,
        prediction: str,
        correct_label: str,
        input_text: str,
        user_correction: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log user feedback for retraining.
        
        Args:
            model: Model name
            prediction: Original prediction
            correct_label: Correct label (from user feedback)
            input_text: Input text
            user_correction: User's correction if different from correct_label
            metadata: Additional metadata
        """
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model": model,
            "prediction": prediction,
            "correct_label": correct_label,
            "user_correction": user_correction,
            "input_text": input_text[:500],
            "metadata": metadata or {},
            "disagreement": prediction != correct_label,
        }
        self._feedback_log.append(entry)
        self._flush_feedback()
    
    def _flush_predictions(self) -> None:
        """Flush prediction log to disk."""
        if not self._prediction_log:
            return
        
        log_file = self.log_dir / f"predictions_{datetime.now(timezone.utc).strftime('%Y%m%d')}.jsonl"
        with open(log_file, "a") as f:
            for entry in self._prediction_log:
                f.write(json.dumps(entry) + "\n")
        self._prediction_log.clear()
    
    def _flush_feedback(self) -> None:
        """Flush feedback log to disk."""
        if not self._feedback_log:
            return
        
        log_file = self.log_dir / f"feedback_{datetime.now(timezone.utc).strftime('%Y%m%d')}.jsonl"
        with open(log_file, "a") as f:
            for entry in self._feedback_log:
                f.write(json.dumps(entry) + "\n")
        self._feedback_log.clear()
    
    def analyze_drift(
        self,
        model: str,
        window_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Analyze prediction drift over a time window.
        
        Args:
            model: Model name to analyze
            window_hours: Time window in hours
        
        Returns:
            Drift analysis results
        """
        # Load recent predictions
        cutoff = datetime.now(timezone.utc).timestamp() - (window_hours * 3600)
        recent_predictions = []
        
        for log_file in sorted(self.log_dir.glob("predictions_*.jsonl")):
            with open(log_file) as f:
                for line in f:
                    entry = json.loads(line)
                    if entry["model"] == model:
                        entry_time = datetime.fromisoformat(entry["timestamp"]).timestamp()
                        if entry_time >= cutoff:
                            recent_predictions.append(entry)
        
        if not recent_predictions:
            return {"error": "No recent predictions found"}
        
        # Analyze prediction distribution
        predictions = [p["prediction"] for p in recent_predictions]
        confidences = [p["confidence"] for p in recent_predictions]
        
        prediction_dist = Counter(predictions)
        confidence_stats = {
            "mean": float(np.mean(confidences)),
            "median": float(np.median(confidences)),
            "std": float(np.std(confidences)),
            "min": float(np.min(confidences)),
            "max": float(np.max(confidences)),
            "p5": float(np.percentile(confidences, 5)),
            "p25": float(np.percentile(confidences, 25)),
            "p75": float(np.percentile(confidences, 75)),
            "p95": float(np.percentile(confidences, 95)),
        }
        
        # Low confidence rate (predictions below 0.5)
        low_conf_rate = sum(1 for c in confidences if c < 0.5) / len(confidences)
        
        # "Other" growth (if applicable)
        other_rate = prediction_dist.get("other", 0) / len(predictions)
        
        return {
            "model": model,
            "window_hours": window_hours,
            "total_predictions": len(recent_predictions),
            "prediction_distribution": dict(prediction_dist),
            "confidence_stats": confidence_stats,
            "low_confidence_rate": round(low_conf_rate, 4),
            "other_rate": round(other_rate, 4),
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }
    
    def analyze_feedback(
        self,
        model: str,
        window_hours: int = 168  # 1 week
    ) -> Dict[str, Any]:
        """
        Analyze user feedback over a time window.
        
        Args:
            model: Model name to analyze
            window_hours: Time window in hours
        
        Returns:
            Feedback analysis results
        """
        cutoff = datetime.now(timezone.utc).timestamp() - (window_hours * 3600)
        recent_feedback = []
        
        for log_file in sorted(self.log_dir.glob("feedback_*.jsonl")):
            with open(log_file) as f:
                for line in f:
                    entry = json.loads(line)
                    if entry["model"] == model:
                        entry_time = datetime.fromisoformat(entry["timestamp"]).timestamp()
                        if entry_time >= cutoff:
                            recent_feedback.append(entry)
        
        if not recent_feedback:
            return {"error": "No recent feedback found"}
        
        # Calculate disagreement rate
        disagreements = sum(1 for f in recent_feedback if f["disagreement"])
        disagreement_rate = disagreements / len(recent_feedback)
        
        # Most common misclassifications
        misclassifications = defaultdict(int)
        for f in recent_feedback:
            if f["disagreement"]:
                key = f"{f['prediction']} -> {f['correct_label']}"
                misclassifications[key] += 1
        
        return {
            "model": model,
            "window_hours": window_hours,
            "total_feedback": len(recent_feedback),
            "disagreement_rate": round(disagreement_rate, 4),
            "common_misclassifications": dict(sorted(misclassifications.items(), key=lambda x: x[1], reverse=True)[:10]),
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }
    
    def export_retraining_data(
        self,
        model: str,
        output_path: Optional[Path] = None
    ) -> Path:
        """
        Export feedback data for retraining.
        
        Args:
            model: Model name
            output_path: Output path for retraining data
        
        Returns:
            Path to exported data
        """
        if output_path is None:
            output_path = self.log_dir / f"retraining_{model}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.json"
        
        retraining_data = []
        for log_file in sorted(self.log_dir.glob("feedback_*.jsonl")):
            with open(log_file) as f:
                for line in f:
                    entry = json.loads(line)
                    if entry["model"] == model:
                        retraining_data.append({
                            "text": entry["input_text"],
                            "label": entry["correct_label"],
                            "original_prediction": entry["prediction"],
                            "timestamp": entry["timestamp"],
                        })
        
        with open(output_path, "w") as f:
            json.dump(retraining_data, f, indent=2)
        
        logger.info(f"Exported {len(retraining_data)} retraining examples to {output_path}")
        return output_path
    
    def flush(self) -> None:
        """Flush all pending logs to disk."""
        self._flush_predictions()
        self._flush_feedback()
