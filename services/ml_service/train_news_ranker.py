"""Train news relevance ranker: GradientBoostingRegressor with TF-IDF + category features."""
import json
import joblib
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_PATH = Path(__file__).parent / "data" / "news_relevance_training.json"
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

with open(DATA_PATH) as f:
    raw = json.load(f)

texts = [f"{r['title']} {r['description']}" for r in raw]
categories = [r["category"] for r in raw]
user_topic_counts = [len(r.get("user_topics", [])) for r in raw]
category_match = [1 if r["category"] in r.get("user_topics", []) else 0 for r in raw]

import pandas as pd
X = pd.DataFrame({"text": texts, "category": categories, "topic_count": user_topic_counts, "cat_match": category_match})
y = np.array([r["relevance_score"] for r in raw])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

preprocessor = ColumnTransformer([
    ("text", TfidfVectorizer(ngram_range=(1, 2), max_features=8000, sublinear_tf=True, min_df=2), "text"),
    ("cat", OneHotEncoder(handle_unknown="ignore"), ["category"]),
    ("numeric", "passthrough", ["topic_count", "cat_match"]),
])

pipeline = Pipeline([
    ("prep", preprocessor),
    ("model", GradientBoostingRegressor(random_state=42)),
])

param_grid = {
    "model__n_estimators": [100, 200, 300],
    "model__max_depth": [3, 4, 5],
    "model__learning_rate": [0.05, 0.1, 0.15],
    "model__subsample": [0.8, 0.9, 1.0],
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
print(f"Best params: {search.best_params_}")

out_path = MODELS_DIR / "news_ranker_v1.pkl"
joblib.dump(best, out_path)
meta = {
    "version": 1, "model_name": "news_ranker",
    "rmse": round(rmse, 4), "mae": round(mae, 4), "r2": round(r2, 4),
    "cv_rmse_mean": round(float(cv_rmse.mean()), 4), "cv_rmse_std": round(float(cv_rmse.std()), 4),
    "dataset_size": len(y), "trained_at": datetime.now(timezone.utc).isoformat(),
    "model_path": str(out_path), "best_params": search.best_params_,
}
with open(MODELS_DIR / "news_ranker_v1_metadata.json", "w") as f:
    json.dump(meta, f, indent=2)
print(f"Saved: {out_path}")
