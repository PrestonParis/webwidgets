"""Shared training utilities for proper ML evaluation, versioning, and metadata."""
import json
import os
import hashlib
import joblib
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
    accuracy_score,
)
import matplotlib.pyplot as plt
import seaborn as sns


class ModelMetadata:
    """Metadata for versioned model artifacts."""
    
    def __init__(
        self,
        version: int,
        model_name: str,
        accuracy: float,
        f1_macro: float,
        dataset_hash: str,
        dataset_size: int,
        num_classes: int,
        class_distribution: Dict[str, int],
        trained_at: str,
        model_path: str,
        metadata_path: str,
    ):
        self.version = version
        self.model_name = model_name
        self.accuracy = accuracy
        self.f1_macro = f1_macro
        self.dataset_hash = dataset_hash
        self.dataset_size = dataset_size
        self.num_classes = num_classes
        self.class_distribution = class_distribution
        self.trained_at = trained_at
        self.model_path = model_path
        self.metadata_path = metadata_path
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "version": self.version,
            "model_name": self.model_name,
            "accuracy": self.accuracy,
            "f1_macro": self.f1_macro,
            "dataset_hash": self.dataset_hash,
            "dataset_size": self.dataset_size,
            "num_classes": self.num_classes,
            "class_distribution": self.class_distribution,
            "trained_at": self.trained_at,
            "model_path": self.model_path,
        }
    
    def save(self) -> None:
        """Save metadata to JSON file."""
        with open(self.metadata_path, "w") as f:
            json.dump(self.to_dict(), f, indent=2)


def compute_dataset_hash(data: list) -> str:
    """Compute a hash of the training data for reproducibility tracking."""
    data_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(data_str.encode()).hexdigest()[:16]


def get_next_version(models_dir: Path, model_name: str) -> int:
    """Get the next version number for a model."""
    existing_models = list(models_dir.glob(f"{model_name}_v*.pkl"))
    if not existing_models:
        return 1
    versions = []
    for model_path in existing_models:
        try:
            version_str = model_path.stem.split("_v")[1]
            versions.append(int(version_str))
        except (IndexError, ValueError):
            continue
    return max(versions) + 1 if versions else 1


def evaluate_model(
    pipeline,
    X_test: list,
    y_test: list,
    class_names: list,
    output_dir: Path,
) -> Dict[str, Any]:
    """
    Comprehensive model evaluation with classification report, confusion matrix,
    per-class metrics, and confidence histograms.
    """
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)
    
    # Basic metrics
    accuracy = accuracy_score(y_test, y_pred)
    
    # Per-class precision, recall, f1
    precision, recall, f1, support = precision_recall_fscore_support(
        y_test, y_pred, average=None, zero_division=0
    )
    
    # Macro averages
    f1_macro = float(np.mean(f1))
    
    # Classification report
    report = classification_report(y_test, y_pred, target_names=class_names, zero_division=0)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred, labels=class_names)
    
    # Save confusion matrix visualization
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=class_names, yticklabels=class_names)
    plt.title("Confusion Matrix")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    cm_path = output_dir / "confusion_matrix.png"
    plt.savefig(cm_path, dpi=150, bbox_inches="tight")
    plt.close()
    
    # Confidence histograms
    max_confidences = np.max(y_proba, axis=1)
    plt.figure(figsize=(10, 6))
    plt.hist(max_confidences, bins=50, edgecolor="black", alpha=0.7)
    plt.xlabel("Max Confidence")
    plt.ylabel("Frequency")
    plt.title("Distribution of Prediction Confidences")
    plt.axvline(x=0.5, color="red", linestyle="--", label="0.5 threshold")
    plt.legend()
    plt.tight_layout()
    conf_path = output_dir / "confidence_histogram.png"
    plt.savefig(conf_path, dpi=150, bbox_inches="tight")
    plt.close()
    
    # Per-class confidence distributions
    plt.figure(figsize=(12, 8))
    for i, class_name in enumerate(class_names):
        class_mask = np.array(y_test) == class_name
        if np.any(class_mask):
            class_confidences = y_proba[class_mask, i]
            plt.hist(class_confidences, bins=30, alpha=0.5, label=class_name)
    plt.xlabel("Confidence for True Class")
    plt.ylabel("Frequency")
    plt.title("Per-Class Confidence Distributions")
    plt.legend()
    plt.tight_layout()
    per_class_conf_path = output_dir / "per_class_confidence.png"
    plt.savefig(per_class_conf_path, dpi=150, bbox_inches="tight")
    plt.close()
    
    return {
        "accuracy": float(accuracy),
        "f1_macro": f1_macro,
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "per_class_metrics": {
            class_names[i]: {
                "precision": float(precision[i]),
                "recall": float(recall[i]),
                "f1": float(f1[i]),
                "support": int(support[i]),
            }
            for i in range(len(class_names))
        },
        "confusion_matrix_path": str(cm_path),
        "confidence_histogram_path": str(conf_path),
        "per_class_confidence_path": str(per_class_conf_path),
    }


def train_and_save_model(
    pipeline,
    texts: list,
    labels: list,
    model_name: str,
    models_dir: Path,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[ModelMetadata, Dict[str, Any]]:
    """
    Train a model with proper evaluation, versioning, and metadata.
    
    Returns:
        Tuple of (ModelMetadata, evaluation_results)
    """
    # Create output directories
    models_dir.mkdir(parents=True, exist_ok=True)
    output_dir = models_dir / "evaluations" / model_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Compute dataset hash
    dataset_hash = compute_dataset_hash(list(zip(texts, labels)))
    
    # Get class information
    class_names = sorted(set(labels))
    class_distribution = {label: labels.count(label) for label in class_names}
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=test_size, random_state=random_state, stratify=labels
    )
    
    # Train on training set
    pipeline.fit(X_train, y_train)
    
    # Evaluate on test set
    eval_results = evaluate_model(pipeline, X_test, y_test, class_names, output_dir)
    
    # Get next version
    version = get_next_version(models_dir, model_name)
    
    # Save versioned model
    model_filename = f"{model_name}_v{version}.pkl"
    model_path = models_dir / model_filename
    joblib.dump(pipeline, model_path)
    
    # Create and save metadata
    trained_at = datetime.now(timezone.utc).isoformat()
    metadata_filename = f"{model_name}_v{version}_metadata.json"
    metadata_path = models_dir / metadata_filename
    
    metadata = ModelMetadata(
        version=version,
        model_name=model_name,
        accuracy=eval_results["accuracy"],
        f1_macro=eval_results["f1_macro"],
        dataset_hash=dataset_hash,
        dataset_size=len(texts),
        num_classes=len(class_names),
        class_distribution=class_distribution,
        trained_at=trained_at,
        model_path=str(model_path),
        metadata_path=str(metadata_path),
    )
    metadata.save()
    
    # Save evaluation report
    eval_report_path = output_dir / f"evaluation_report_v{version}.txt"
    with open(eval_report_path, "w") as f:
        f.write(f"Model: {model_name} v{version}\n")
        f.write(f"Trained at: {trained_at}\n")
        f.write(f"Dataset size: {len(texts)}\n")
        f.write(f"Dataset hash: {dataset_hash}\n")
        f.write(f"Test accuracy: {eval_results['accuracy']:.4f}\n")
        f.write(f"Macro F1: {eval_results['f1_macro']:.4f}\n")
        f.write(f"\nClass distribution:\n")
        for label, count in class_distribution.items():
            f.write(f"  {label}: {count}\n")
        f.write(f"\nClassification Report:\n")
        f.write(eval_results["classification_report"])
    
    # Refresh stable alias/artifact for backwards compatibility.
    latest_path = models_dir / f"{model_name}.pkl"
    if latest_path.exists():
        latest_path.unlink()
    shutil.copy2(model_path, latest_path)
    
    print(f"✅ Trained {model_name} v{version}")
    print(f"   Accuracy: {eval_results['accuracy']:.4f}")
    print(f"   Macro F1: {eval_results['f1_macro']:.4f}")
    print(f"   Saved to: {model_path}")
    print(f"   Evaluation: {output_dir}")
    
    return metadata, eval_results


def tune_threshold(
    pipeline,
    X_val: list,
    y_val: list,
    class_names: list,
    output_dir: Path,
    target_class: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Empirically tune classification threshold using validation curves.
    
    Plots precision vs threshold, recall vs threshold, and F1 vs threshold.
    Returns optimal threshold based on F1 score.
    """
    y_proba = pipeline.predict_proba(X_val)
    
    # If target_class is specified, focus on that class
    if target_class and target_class in class_names:
        class_idx = class_names.index(target_class)
        y_proba_binary = y_proba[:, class_idx]
        y_val_binary = np.array([1 if y == target_class else 0 for y in y_val])
    else:
        # Use max confidence across all classes
        y_proba_binary = np.max(y_proba, axis=1)
        y_val_binary = np.array([
            1 if y == pipeline.predict([x])[0] else 0
            for x, y in zip(X_val, y_val)
        ])
    
    thresholds = np.linspace(0.1, 0.9, 81)
    precisions = []
    recalls = []
    f1_scores = []
    
    for threshold in thresholds:
        y_pred_binary = (y_proba_binary >= threshold).astype(int)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_val_binary, y_pred_binary, average='binary', zero_division=0
        )
        precisions.append(precision)
        recalls.append(recall)
        f1_scores.append(f1)
    
    # Find optimal threshold (max F1)
    optimal_idx = np.argmax(f1_scores)
    optimal_threshold = thresholds[optimal_idx]
    
    # Plot validation curves
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    
    axes[0].plot(thresholds, precisions, 'b-', label='Precision')
    axes[0].axvline(x=optimal_threshold, color='r', linestyle='--', label=f'Optimal: {optimal_threshold:.2f}')
    axes[0].set_xlabel('Threshold')
    axes[0].set_ylabel('Precision')
    axes[0].set_title('Precision vs Threshold')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    axes[1].plot(thresholds, recalls, 'g-', label='Recall')
    axes[1].axvline(x=optimal_threshold, color='r', linestyle='--', label=f'Optimal: {optimal_threshold:.2f}')
    axes[1].set_xlabel('Threshold')
    axes[1].set_ylabel('Recall')
    axes[1].set_title('Recall vs Threshold')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    
    axes[2].plot(thresholds, f1_scores, 'purple', label='F1 Score')
    axes[2].axvline(x=optimal_threshold, color='r', linestyle='--', label=f'Optimal: {optimal_threshold:.2f}')
    axes[2].set_xlabel('Threshold')
    axes[2].set_ylabel('F1 Score')
    axes[2].set_title('F1 vs Threshold')
    axes[2].legend()
    axes[2].grid(True, alpha=0.3)
    
    plt.tight_layout()
    threshold_plot_path = output_dir / "threshold_tuning.png"
    plt.savefig(threshold_plot_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    return {
        "optimal_threshold": float(optimal_threshold),
        "optimal_f1": float(f1_scores[optimal_idx]),
        "optimal_precision": float(precisions[optimal_idx]),
        "optimal_recall": float(recalls[optimal_idx]),
        "threshold_plot_path": str(threshold_plot_path),
        "thresholds": thresholds.tolist(),
        "precisions": precisions,
        "recalls": recalls,
        "f1_scores": f1_scores,
    }
