"""Tests for model registry."""
import pytest
import joblib
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from model_registry import ModelRegistry


@pytest.fixture
def temp_models_dir(tmp_path):
    """Create a temporary models directory."""
    models_dir = tmp_path / "models"
    models_dir.mkdir()
    return models_dir


@pytest.fixture
def sample_pipeline():
    """Create a sample ML pipeline for testing."""
    return Pipeline([
        ("tfidf", TfidfVectorizer(max_features=100)),
        ("clf", LogisticRegression(max_iter=100)),
    ])


@pytest.fixture
def sample_texts():
    """Sample texts for training."""
    return [
        "billing notification",
        "payment due",
        "trial ending",
        "meeting scheduled",
        "verify account",
    ]


@pytest.fixture
def sample_labels():
    """Sample labels for training."""
    return ["billing", "billing", "trial", "meeting", "verification"]


def test_model_registry_initialization(temp_models_dir):
    """Test ModelRegistry initialization."""
    registry = ModelRegistry(temp_models_dir)
    assert registry.models_dir == temp_models_dir
    assert registry._loaded_models == {}
    assert registry._model_metadata == {}


def test_load_model_not_found(temp_models_dir):
    """Test loading a model that doesn't exist."""
    registry = ModelRegistry(temp_models_dir)
    model = registry.load_model("nonexistent_model")
    assert model is None


def test_save_and_load_model(temp_models_dir, sample_pipeline, sample_texts, sample_labels):
    """Test saving and loading a model."""
    # Train and save a model
    sample_pipeline.fit(sample_texts, sample_labels)
    model_path = temp_models_dir / "test_model_v1.pkl"
    joblib.dump(sample_pipeline, model_path)
    
    # Create metadata
    metadata_path = temp_models_dir / "test_model_v1_metadata.json"
    import json
    with open(metadata_path, "w") as f:
        json.dump({
            "version": 1,
            "model_name": "test_model",
            "accuracy": 0.8,
            "f1_macro": 0.75,
        }, f)
    
    # Load the model
    registry = ModelRegistry(temp_models_dir)
    loaded_model = registry.load_model("test_model", version=1)
    
    assert loaded_model is not None
    assert "test_model_v1" in registry._loaded_models


def test_load_latest_model(temp_models_dir, sample_pipeline, sample_texts, sample_labels):
    """Test loading the latest version of a model."""
    # Train and save multiple versions
    for version in [1, 2, 3]:
        sample_pipeline.fit(sample_texts, sample_labels)
        model_path = temp_models_dir / f"test_model_v{version}.pkl"
        joblib.dump(sample_pipeline, model_path)
    
    registry = ModelRegistry(temp_models_dir)
    loaded_model = registry.load_model("test_model")
    
    assert loaded_model is not None


def test_list_models(temp_models_dir, sample_pipeline, sample_texts, sample_labels):
    """Test listing all available models."""
    # Save multiple models
    for model_name, version in [("model_a", 1), ("model_a", 2), ("model_b", 1)]:
        sample_pipeline.fit(sample_texts, sample_labels)
        model_path = temp_models_dir / f"{model_name}_v{version}.pkl"
        joblib.dump(sample_pipeline, model_path)
    
    registry = ModelRegistry(temp_models_dir)
    models = registry.list_models()
    
    assert "model_a" in models
    assert "model_b" in models
    assert models["model_a"] == [2, 1]  # Sorted descending
    assert models["model_b"] == [1]


def test_get_model_info(temp_models_dir, sample_pipeline, sample_texts, sample_labels):
    """Test getting model information."""
    # Save a model with metadata
    sample_pipeline.fit(sample_texts, sample_labels)
    model_path = temp_models_dir / "test_model_v1.pkl"
    joblib.dump(sample_pipeline, model_path)
    
    metadata_path = temp_models_dir / "test_model_v1_metadata.json"
    import json
    with open(metadata_path, "w") as f:
        json.dump({
            "version": 1,
            "model_name": "test_model",
            "accuracy": 0.85,
            "f1_macro": 0.82,
        }, f)
    
    registry = ModelRegistry(temp_models_dir)
    info = registry.get_model_info("test_model")
    
    assert info["model_name"] == "test_model"
    assert info["latest_version"] == 1
    assert info["metadata"]["accuracy"] == 0.85


def test_reload_model(temp_models_dir, sample_pipeline, sample_texts, sample_labels):
    """Test force reloading a model."""
    # Save a model
    sample_pipeline.fit(sample_texts, sample_labels)
    model_path = temp_models_dir / "test_model_v1.pkl"
    joblib.dump(sample_pipeline, model_path)
    
    registry = ModelRegistry(temp_models_dir)
    
    # Load once
    first_load = registry.load_model("test_model", version=1)
    
    # Force reload
    second_load = registry.reload_model("test_model", version=1)
    
    assert second_load is not None
    assert "test_model_v1" in registry._loaded_models


def test_get_model_metadata(temp_models_dir, sample_pipeline, sample_texts, sample_labels):
    """Test getting model metadata."""
    # Save a model with metadata
    sample_pipeline.fit(sample_texts, sample_labels)
    model_path = temp_models_dir / "test_model_v1.pkl"
    joblib.dump(sample_pipeline, model_path)
    
    metadata_path = temp_models_dir / "test_model_v1_metadata.json"
    import json
    with open(metadata_path, "w") as f:
        json.dump({
            "version": 1,
            "model_name": "test_model",
            "accuracy": 0.9,
        }, f)
    
    registry = ModelRegistry(temp_models_dir)
    registry.load_model("test_model", version=1)
    
    metadata = registry.get_model_metadata("test_model", version=1)
    assert metadata is not None
    assert metadata["accuracy"] == 0.9
