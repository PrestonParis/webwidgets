# 021 - ML: News Relevance Ranker

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: High

## Objective

Build a personalized news ranking model for the News Intel widget/page. Currently all news items are shown in raw feed order. This model should re-rank items by estimated relevance to the user's interests derived from their widget usage, tracking data, and search history.

## Context

- `features/news/` — current feed uses RSS + NewsAPI with no personalization
- `app/api/search/suggest/route.ts` — pattern to follow for ML API proxy
- `ml_service/main.py` — FastAPI app; add new endpoint `/rank-news`
- `ml_service/schemas.py` — add `NewsRankRequest`, `NewsRankResponse` schemas

## Current ML Architecture

The ML service has three models:

1. `email_classifier` (TF-IDF + LogisticRegression) → `/predict`
2. `widget_suggester` (TF-IDF + LogisticRegression) → `/suggest`
3. `action_extractor` (ML + structural regex) → `/extract-actions`

Follow the same training pipeline pattern in `train.py` and `training_utils.py`.

## Required Implementation

### 1. `ml_service/train_news_ranker.py`

- Training data: `data/news_relevance_training.json` — array of `{ title, description, category, user_topics: string[], relevance_score: 0-1 }`
- Features: TF-IDF on `title + description`, one-hot encode `category`
- Model: `GradientBoostingRegressor` or `Ridge` for relevance score prediction
- Output: `models/news_ranker_v1.pkl` + metadata JSON
- Include threshold tuning from `training_utils.py`

### 2. `ml_service/main.py` — add endpoint

```python
@app.post("/rank-news")
async def rank_news(data: NewsRankRequest) -> NewsRankResponse:
    # Score each item, return sorted by predicted relevance
```

### 3. `ml_service/schemas.py` — add schemas

```python
class NewsRankItem(BaseModel):
    id: str
    title: str
    description: str
    category: str

class NewsRankRequest(BaseModel):
    items: list[NewsRankItem]
    user_topics: list[str]  # derived from widget types user has active

class RankedNewsItem(BaseModel):
    id: str
    relevance_score: float

class NewsRankResponse(BaseModel):
    ranked: list[RankedNewsItem]
```

### 4. `app/api/ml/rank-news/route.ts`

- POST proxy to `ML_SERVICE_URL/rank-news`
- Called from `features/news/hooks/useNewsFeed.ts` before displaying items
- Graceful fallback: if ML unavailable, return items in original order

### 5. `features/news/hooks/useNewsFeed.ts`

- After fetching items, POST to `/api/ml/rank-news` with current items + user's active widget types as topics
- Sort items by returned `relevance_score` descending

## Training Data

Generate `ml_service/data/news_relevance_training.json` with at least 500 synthetic samples spanning categories: `technology`, `finance`, `health`, `sports`, `politics`, `science`, `entertainment`.

## Validation

- Model RMSE < 0.2 on held-out validation set
- Fallback triggers cleanly when ML_SERVICE_URL is unset
- News feed shows visibly different ordering when user has specific widget types active

## Completion Notes
