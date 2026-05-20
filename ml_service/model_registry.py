"""Model registry for versioned model loading and hot reload."""
import json
import os
import joblib
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger("ml_service")


class ModelRegistry:
    """Registry for managing versioned model artifacts."""
    
    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self._loaded_models: Dict[str, Any] = {}
        self._model_metadata: Dict[str, Dict[str, Any]] = {}
    
    def load_model(
        self,
        model_name: str,
        version: Optional[int] = None,
        force_reload: bool = False
    ) -> Optional[Any]:
        """
        Load a model by name and version.
        
        Args:
            model_name: Name of the model (e.g., "email_classifier")
            version: Specific version to load, or None for latest
            force_reload: Force reload even if already loaded
        
        Returns:
            Loaded model or None if not found
        """
        cache_key = f"{model_name}_v{version}" if version else model_name
        
        if not force_reload and cache_key in self._loaded_models:
            logger.debug(f"Using cached model: {cache_key}")
            return self._loaded_models[cache_key]
        
        # Determine model path
        if version:
            model_path = self.models_dir / f"{model_name}_v{version}.pkl"
        else:
            # Try symlink first, then find latest version
            symlink_path = self.models_dir / f"{model_name}.pkl"
            if symlink_path.exists() and symlink_path.is_symlink():
                model_path = self.models_dir / symlink_path.resolve().name
            else:
                model_path = self._find_latest_model(model_name)
        
        if not model_path or not model_path.exists():
            logger.warning(f"Model not found: {model_name} (version: {version})")
            return None
        
        # Load model
        try:
            model = joblib.load(model_path)
            self._loaded_models[cache_key] = model
            logger.info(f"Loaded model: {model_path.name}")
            
            # Load metadata if available
            metadata_path = model_path.with_name(f"{model_path.stem}_metadata.json")
            if metadata_path.exists():
                with open(metadata_path) as f:
                    self._model_metadata[cache_key] = json.load(f)
            
            return model
        except Exception as e:
            logger.error(f"Failed to load model {model_path}: {e}")
            return None
    
    def _find_latest_model(self, model_name: str) -> Optional[Path]:
        """Find the latest version of a model."""
        model_files = list(self.models_dir.glob(f"{model_name}_v*.pkl"))
        if not model_files:
            return None
        
        # Extract version numbers and find max
        versions = []
        for model_file in model_files:
            try:
                version_str = model_file.stem.split("_v")[1]
                versions.append((int(version_str), model_file))
            except (IndexError, ValueError):
                continue
        
        if not versions:
            return None
        
        latest_version, latest_file = max(versions, key=lambda x: x[0])
        return latest_file
    
    def get_model_metadata(self, model_name: str, version: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Get metadata for a loaded model."""
        cache_key = f"{model_name}_v{version}" if version else model_name
        return self._model_metadata.get(cache_key)
    
    def reload_model(self, model_name: str, version: Optional[int] = None) -> Optional[Any]:
        """Force reload a model."""
        return self.load_model(model_name, version, force_reload=True)
    
    def list_models(self) -> Dict[str, list]:
        """List all available models and their versions."""
        models = {}
        for model_file in self.models_dir.glob("*_v*.pkl"):
            try:
                base_name = "_v".join(model_file.stem.split("_v")[:-1])
                version_str = model_file.stem.split("_v")[-1]
                version = int(version_str)
                
                if base_name not in models:
                    models[base_name] = []
                models[base_name].append(version)
            except (IndexError, ValueError):
                continue
        
        # Sort versions
        for model_name in models:
            models[model_name].sort(reverse=True)
        
        return models
    
    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get detailed information about a model."""
        versions = self.list_models().get(model_name, [])
        if not versions:
            return {"error": "Model not found"}
        
        latest_version = versions[0]
        metadata = self.get_model_metadata(model_name, latest_version)
        
        return {
            "model_name": model_name,
            "latest_version": latest_version,
            "all_versions": versions,
            "metadata": metadata,
        }
