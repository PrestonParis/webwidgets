# 032 - ML: Master Guidance for Prompts 021–031

Status: Reference
Assigned Agent: N/A
Stage: 2
Priority: Critical

## Purpose

This prompt is a coordination and quality standard reference for implementing prompts 021–031. Every agent working on ML features MUST read this document first. It defines the model architecture standards, accuracy techniques, training pipeline requirements, frontend integration patterns, and deployment requirements that apply uniformly across all eleven ML tasks.

---

## Execution Order

Implement in this sequence to maximize reuse:

1. **021** — News Ranker (establishes regression training pattern)
2. **024** — Task Priority Ranker (extends regression pattern)
3. **026** — Finance Anomaly Detector (statistical baseline pattern)
4. **022** — Health Trend Detector (statistical + regression hybrid)
5. **025** — Context Summarizer + Intent Classifier (NLP pipeline)
6. **023** — Document Classifier (classification pattern)
7. **027** — Command Center Ranker (feature-rich regression)
8. **028** — Memory Card Generator (deterministic + optional quality classifier)
9. **030** — Collaboration Handoff Risk (deterministic scoring + optional logistic)
10. **031** — Creative Canvas Understanding (deterministic + geometry analysis)
11. **029** — Accessibility Advisor (rule-based classifier)

---

## ML Architecture Standards

### Model Selection by Task Type

| Task Type | Preferred Model | Fallback |
|-----------|----------------|----------|
| Regression/scoring | `GradientBoostingRegressor` | `RandomForestRegressor`, `Ridge` |
| Binary classification | `GradientBoostingClassifier` | `LogisticRegression` |
| Multi-class classification | `RandomForestClassifier` + `LogisticRegression` ensemble | `LinearSVC` |
| Clustering/anomaly | `IsolationForest` + z-score | Statistical z-score only |
| Text classification | TF-IDF + `LinearSVC` or `LogisticRegression` | Keyword matching |
| Structured regression | `ColumnTransformer` + `GradientBoostingRegressor` | `RandomForestRegressor` |
| Deterministic rule-based | Python scoring function (no sklearn) | Hardcoded thresholds |

### Feature Engineering Requirements

Every model that processes text MUST use:
```python
TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=15000,
    sublinear_tf=True,
    strip_accents='unicode',
    analyzer='word',
    min_df=2,
)
```

Every model that processes structured numeric features MUST use:
```python
StandardScaler()  # for regression targets
# OR
RobustScaler()    # when outliers expected (finance, time data)
```

Every model using mixed text + numeric MUST use `ColumnTransformer`:
```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

preprocessor = ColumnTransformer([
    ('text_title', TfidfVectorizer(...), 'title_col'),
    ('text_desc', TfidfVectorizer(...), 'desc_col'),
    ('numeric', StandardScaler(), numeric_cols),
    ('onehot', OneHotEncoder(handle_unknown='ignore'), categorical_cols),
])

pipeline = Pipeline([
    ('prep', preprocessor),
    ('model', GradientBoostingRegressor(...)),
])
```

### Hyperparameter Tuning (required for all sklearn models)

Use `RandomizedSearchCV` with 5-fold CV:
```python
from sklearn.model_selection import RandomizedSearchCV

param_grid = {
    'model__n_estimators': [100, 200, 300, 500],
    'model__max_depth': [3, 4, 5, 6, None],
    'model__learning_rate': [0.01, 0.05, 0.1, 0.2],
    'model__subsample': [0.7, 0.8, 0.9, 1.0],
    'model__min_samples_leaf': [1, 2, 4],
}

search = RandomizedSearchCV(
    pipeline,
    param_grid,
    n_iter=30,
    cv=5,
    scoring='neg_mean_squared_error',  # or 'f1_macro' for classifiers
    n_jobs=-1,
    random_state=42,
    verbose=1,
)
search.fit(X_train, y_train)
best_pipeline = search.best_estimator_
```

### Cross-Validation Standards

All models must report:
- **Regression**: RMSE, MAE, R², 5-fold CV mean ± std
- **Classification**: Accuracy, F1-macro, Precision, Recall, confusion matrix, 5-fold CV mean ± std
- These metrics go into the model metadata JSON alongside the artifact.

### Ensemble Strategies

For regression tasks with score < target threshold after single model:
```python
from sklearn.ensemble import VotingRegressor, StackingRegressor

# Option A: simple ensemble
ensemble = VotingRegressor([
    ('gbr', GradientBoostingRegressor(...)),
    ('rfr', RandomForestRegressor(...)),
    ('ridge', Ridge()),
])

# Option B: stacking with meta-learner (preferred when data > 500 samples)
stacking = StackingRegressor(
    estimators=[
        ('gbr', GradientBoostingRegressor(...)),
        ('rfr', RandomForestRegressor(...)),
    ],
    final_estimator=Ridge(),
    cv=5,
)
```

---

## Training Data Standards

### Minimum Dataset Size

| Task | Min samples | Target samples |
|------|-------------|---------------|
| Regression rankers | 500 | 1000 |
| Classifiers | 400 | 800 |
| Deterministic scoring | N/A | N/A |

### Data Generation Guidelines

Synthetic data MUST be realistic:
- Use realistic distributions (not uniform) for numeric fields
- Include edge cases: empty strings, zero values, boundary conditions
- Ensure class balance within ±20% for classifiers
- For regression: cover the full score range [0.0, 1.0] with at least 10% of samples at the extremes

### File Format

All training data files: `ml_service/data/<model_name>_training.json`
Format: JSON array of objects. Each object must have all fields the model uses.

---

## Training Script Standards

Every `ml_service/train_<name>.py` MUST:

```python
import json
import os
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.model_selection import RandomizedSearchCV, cross_val_score
from training_utils import train_and_save_model

# 1. Load data
data_path = Path(__file__).parent / "data" / "<name>_training.json"
with open(data_path) as f:
    raw = json.load(f)

# 2. Build features/labels
# ... feature engineering ...

# 3. Build pipeline
pipeline = Pipeline([...])

# 4. Hyperparameter search
search = RandomizedSearchCV(pipeline, param_grid, n_iter=30, cv=5, ...)
search.fit(X_train, y_train)
best = search.best_estimator_

# 5. Save via registry
models_dir = Path(__file__).parent / "models"
metadata, eval_results = train_and_save_model(
    pipeline=best,
    texts=X,        # or feature array
    labels=y,
    model_name="<name>",
    models_dir=models_dir,
    test_size=0.2,
    random_state=42,
)

print(f"Best params: {search.best_params_}")
print(f"CV score: {search.best_score_:.4f}")
print(f"Saved: {metadata.model_path}")
```

For regression models that don't use `train_and_save_model` (which targets classifiers), save manually:
```python
import joblib, json
from datetime import datetime, timezone

out_path = models_dir / f"<name>_v1.pkl"
joblib.dump(best, out_path)
meta = {
    "version": 1,
    "model_name": "<name>",
    "rmse": rmse,
    "mae": mae,
    "r2": r2,
    "cv_rmse_mean": cv_mean,
    "cv_rmse_std": cv_std,
    "dataset_size": len(y),
    "trained_at": datetime.now(timezone.utc).isoformat(),
    "model_path": str(out_path),
    "best_params": search.best_params_,
}
with open(models_dir / f"<name>_v1_metadata.json", "w") as f:
    json.dump(meta, f, indent=2)
```

---

## ML Service API Standards

### Schema Location

All new schemas go in `ml_service/schemas.py`. Follow existing pattern with `BaseModel`, field validators, and `json_schema_extra` examples.

### Endpoint Pattern

```python
# In ml_service/main.py

# Load at startup (after existing model loads)
news_ranker = registry.load_model("news_ranker")  # returns None if not found

@app.post("/rank-news")
async def rank_news(data: NewsRankRequest) -> NewsRankResponse:
    if news_ranker is None:
        # Graceful fallback: return original order with neutral scores
        return NewsRankResponse(ranked=[
            RankedNewsItem(id=item.id, relevance_score=0.5)
            for item in data.items
        ])
    # ... actual inference ...
```

### Error Handling

Every endpoint MUST:
- Return the fallback response (not HTTP 500) when model is `None`
- Log inference errors with `logger.error(...)` and return fallback
- Validate input with Pydantic — malformed requests return HTTP 422 automatically

---

## Next.js API Proxy Standards

All proxy routes go in `app/api/ml/<endpoint-name>/route.ts`.

```typescript
// app/api/ml/rank-news/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

export async function POST(req: NextRequest) {
    if (!ML_SERVICE_URL) {
        return NextResponse.json({ error: 'ML service not configured' }, { status: 503 });
    }
    try {
        const body = await req.json();
        const res = await fetch(`${ML_SERVICE_URL}/rank-news`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`ML service error: ${res.status}`);
        return NextResponse.json(await res.json());
    } catch (err) {
        console.error('[ml/rank-news]', err);
        return NextResponse.json({ error: 'ML service unavailable' }, { status: 503 });
    }
}
```

---

## Frontend Integration Standards

### Hook Pattern

```typescript
// In feature hooks (e.g., useNewsFeed.ts)
const [aiRanked, setAiRanked] = useState(false);

useEffect(() => {
    if (!items.length) return;
    fetch('/api/ml/rank-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(i => ({ id: i.id, title: i.title, description: i.summary, category: i.category })), user_topics: activeWidgetTypes }),
    })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (!data?.ranked) return;  // fallback: keep original order
            const scoreMap = new Map(data.ranked.map((r: { id: string; relevance_score: number }) => [r.id, r.relevance_score]));
            setItems(prev => [...prev].sort((a, b) => (scoreMap.get(b.id) ?? 0.5) - (scoreMap.get(a.id) ?? 0.5)));
            setAiRanked(true);
        })
        .catch(() => {});  // silent fallback
}, [items.length]);
```

### Graceful Degradation Rules

1. **Never block render** — ML calls are always async and fire after first render
2. **Never throw** — all `.catch(() => {})` or `.catch(err => { logger.warn(...) })`
3. **Always show something** — show deterministic/original data while ML loads
4. **Indicate AI enhancement** — small badge or chip when ML result is applied (e.g., `AI sorted`, `ML ranked`)
5. **Respect timeout** — all fetch calls use `AbortSignal.timeout(5000)` or equivalent

---

## Quality Gates (all models must pass before marking Complete)

### Regression Models (021, 022, 024, 026, 027)
- [ ] RMSE < 0.2 on held-out 20% test split
- [ ] R² > 0.6 on test split
- [ ] 5-fold CV RMSE std < 0.05 (low variance)
- [ ] Edge case: empty input returns safe empty response
- [ ] Edge case: single item returns score 0.5 (neutral) or model prediction

### Classification Models (023, 025, 028)
- [ ] F1-macro > 0.75 on held-out 20% test split
- [ ] Accuracy > 0.78
- [ ] 5-fold CV F1 std < 0.05
- [ ] No class predicted < 5% of the time on balanced test set
- [ ] Confidence scores are calibrated (use `CalibratedClassifierCV` if needed)

### Deterministic/Rule-based (029, 030, 031)
- [ ] All documented scoring rules have unit tests in `ml_service/tests/`
- [ ] Empty input → empty response (not error)
- [ ] Maximum score case and minimum score case covered in tests

### All Models
- [ ] Model artifact saved at `ml_service/models/<name>_v1.pkl`
- [ ] Metadata JSON saved at `ml_service/models/<name>_v1_metadata.json`
- [ ] Endpoint returns fallback response (not 500) when model file missing
- [ ] Next.js proxy returns 503 + JSON error when ML_SERVICE_URL unset
- [ ] Frontend renders correctly when `/api/ml/...` returns 503

---

## Prompt-to-File Mapping

| Prompt | ML file | API route | Frontend |
|--------|---------|-----------|----------|
| 021 | `train_news_ranker.py` | `app/api/ml/rank-news/` | `features/news/hooks/useNewsFeed.ts` |
| 022 | `train_health_trend.py` | `app/api/ml/analyze-trends/` | `features/tracking/components/TrackingInsightsPanel.tsx` |
| 023 | `train_document_classifier.py` | `app/api/ml/classify-document/` | `features/uploads/` or `features/view/` |
| 024 | `train_task_priority.py` | `app/api/ml/rank-tasks/` | `features/todo/` |
| 025 | `train_context_summarizer.py` | `app/api/ml/summarize-context/` + `/classify-intent/` | `features/chatbot/` |
| 026 | `train_finance_anomaly.py` | `app/api/ml/detect-finance-anomalies/` | `features/finance/components/AnomalyAlertBanner.tsx` |
| 027 | `train_command_center_ranker.py` | `app/api/ml/rank-command-workstreams/` | `features/command-center/hooks/useCommandCenter.ts` |
| 028 | `memory_card_generator.py` + `train_memory_card_quality.py` | `app/api/ml/generate-memory-cards/` | `features/memorization/` |
| 029 | `accessibility_advisor.py` | `app/api/ml/advise-accessibility/` | `features/accessibility/hooks/useAccessibilityCenter.ts` |
| 030 | `collaboration_risk.py` | `app/api/ml/detect-collaboration-risk/` | `features/collaboration/` |
| 031 | `creative_canvas_analyzer.py` | `app/api/ml/analyze-creative-canvas/` | `features/creative/` |

---

## Completion Checklist

For the entire ML suite (021-031) to be considered complete:

- [ ] All 11 training scripts exist and run without error
- [ ] All 11 model artifacts are saved in `ml_service/models/`
- [ ] All 11 endpoints are registered in `ml_service/main.py`
- [ ] All 11 schemas are in `ml_service/schemas.py`
- [ ] All 11 Next.js proxy routes exist
- [ ] All 11 frontend integrations are wired with graceful fallback
- [ ] `ml_service/tests/` has at least one test per endpoint covering happy path + empty input
- [ ] `ml_service/requirements.txt` includes all dependencies used (scipy, imbalanced-learn if used)
- [ ] All models trained and `.pkl` files committed or documented in `.gitignore` with regeneration instructions
