"""Train health trend detector: scipy linregress + GradientBoosting for trend strength."""
import json
import joblib
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

DATA_PATH = Path(__file__).parent / "data" / "health_trend_training.json"
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

with open(DATA_PATH) as f:
    raw = json.load(f)

def extract_features(r):
    vals = r["values"]
    n = len(vals)
    if n < 2:
        return {"slope": 0.0, "r_value": 0.0, "p_value": 1.0, "std": 0.0, "cv": 0.0, "n_days": n, "metric": r["metric"]}
    slope, _, r_value, p_value, _ = stats.linregress(range(n), vals)
    std = float(np.std(vals))
    mean_v = float(np.mean(vals)) or 1.0
    return {"slope": round(slope, 4), "r_value": round(abs(r_value), 4), "p_value": round(p_value, 4),
            "std": round(std, 4), "cv": round(std / abs(mean_v), 4), "n_days": n, "metric": r["metric"]}

rows = [extract_features(r) for r in raw]
X = pd.DataFrame(rows)
y = np.array([r["trend_strength"] for r in raw])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

preprocessor = ColumnTransformer([
    ("metric_enc", OneHotEncoder(handle_unknown="ignore"), ["metric"]),
    ("num", StandardScaler(), ["slope", "r_value", "p_value", "std", "cv", "n_days"]),
])

pipeline = Pipeline([("prep", preprocessor), ("model", GradientBoostingRegressor(random_state=42))])
param_grid = {
    "model__n_estimators": [100, 200, 300],
    "model__max_depth": [3, 4, 5],
    "model__learning_rate": [0.05, 0.1, 0.15],
}
search = RandomizedSearchCV(pipeline, param_grid, n_iter=20, cv=5,
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

out_path = MODELS_DIR / "health_trend_v1.pkl"
joblib.dump(best, out_path)
meta = {
    "version": 1, "model_name": "health_trend",
    "rmse": round(rmse, 4), "mae": round(mae, 4), "r2": round(r2, 4),
    "cv_rmse_mean": round(float(cv_rmse.mean()), 4), "cv_rmse_std": round(float(cv_rmse.std()), 4),
    "dataset_size": len(y), "trained_at": datetime.now(timezone.utc).isoformat(),
    "model_path": str(out_path), "best_params": search.best_params_,
}
with open(MODELS_DIR / "health_trend_v1_metadata.json", "w") as f:
    json.dump(meta, f, indent=2)
print(f"Saved: {out_path}")
