"""Train task priority ranker: GradientBoostingRegressor with text + structured features."""
import json
import joblib
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, StackingRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA_PATH = Path(__file__).parent / "data" / "task_priority_training.json"
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

with open(DATA_PATH) as f:
    raw = json.load(f)

X = pd.DataFrame({
    "title": [r["title"] for r in raw],
    "category": [r["category"] for r in raw],
    "priority": [r["priority"] for r in raw],
    "days_until_due": [r["days_until_due"] for r in raw],
    "is_blocked": [int(r["is_blocked"]) for r in raw],
    "has_dependencies": [int(r["has_dependencies"]) for r in raw],
})
y = np.array([r["urgency_score"] for r in raw])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

preprocessor = ColumnTransformer([
    ("title_tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True), "title"),
    ("cat", OneHotEncoder(handle_unknown="ignore"), ["category", "priority"]),
    ("num", StandardScaler(), ["days_until_due", "is_blocked", "has_dependencies"]),
])

base_pipeline = Pipeline([("prep", preprocessor), ("model", GradientBoostingRegressor(random_state=42))])

param_grid = {
    "model__n_estimators": [100, 200, 300],
    "model__max_depth": [3, 4, 5],
    "model__learning_rate": [0.05, 0.1, 0.15],
    "model__subsample": [0.8, 0.9, 1.0],
}
search = RandomizedSearchCV(base_pipeline, param_grid, n_iter=20, cv=5,
                            scoring="neg_mean_squared_error", n_jobs=-1, random_state=42, verbose=1)
search.fit(X_train, y_train)
best = search.best_estimator_

y_pred = best.predict(X_test)
rmse = mean_squared_error(y_test, y_pred) ** 0.5
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
cv_scores = cross_val_score(best, X_train, y_train, cv=5, scoring="neg_mean_squared_error", n_jobs=-1)
cv_rmse = (-cv_scores) ** 0.5

print(f"RMSE: {rmse:.4f} | MAE: {mae:.4f} | R2: {r2:.4f}")
print(f"CV RMSE: {cv_rmse.mean():.4f} ± {cv_rmse.std():.4f}")

out_path = MODELS_DIR / "task_priority_v1.pkl"
joblib.dump(best, out_path)
meta = {
    "version": 1, "model_name": "task_priority",
    "rmse": round(rmse, 4), "mae": round(mae, 4), "r2": round(r2, 4),
    "cv_rmse_mean": round(float(cv_rmse.mean()), 4), "cv_rmse_std": round(float(cv_rmse.std()), 4),
    "dataset_size": len(y), "trained_at": datetime.now(timezone.utc).isoformat(),
    "model_path": str(out_path), "best_params": search.best_params_,
}
with open(MODELS_DIR / "task_priority_v1_metadata.json", "w") as f:
    json.dump(meta, f, indent=2)
print(f"Saved: {out_path}")
