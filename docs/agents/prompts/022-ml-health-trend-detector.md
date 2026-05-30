# 022 - ML: Health Trend Detector

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: High

## Objective

Build a time-series trend detection model for the Tracking feature. Given a user's recent sleep, workout, meal, mood, and supplement log entries, the model should detect positive/negative trends and surface actionable insights (e.g., "Your sleep quality is trending down over the last 7 days", "Workout consistency improved 40% this month").

## Context

- `features/tracking/` — tracking feature with sleep, workout, meal, mood, supplement log types
- `app/api/tracking/` — existing API routes for tracking data
- Current tracking data flows through Supabase; no ML analysis exists

## Required Implementation

### 1. `ml_service/train_health_trend.py`

- Training approach: **rule-based + statistical** (not pure ML) since trends require time-series math
- Uses `scipy.stats.linregress` for trend slope detection
- Uses `numpy` for rolling averages, standard deviation, z-score anomaly detection
- No model file needed — this is a deterministic analytics endpoint

### 2. `ml_service/health_analytics.py` (new module)

```python
def detect_trends(series: list[float], window: int = 7) -> TrendResult
def detect_anomalies(series: list[float], threshold: float = 2.0) -> list[int]
def compute_streak(bool_series: list[bool]) -> int
def compare_periods(current: list[float], previous: list[float]) -> PeriodComparison
```

### 3. `ml_service/schemas.py` — add schemas

```python
class TrackingDataPoint(BaseModel):
    date: str  # ISO date
    value: float
    metric: str  # 'sleep_hours', 'workout_duration', 'mood_score', etc.

class TrendAnalysisRequest(BaseModel):
    user_id: str
    entries: list[TrackingDataPoint]
    window_days: int = 7

class TrendInsight(BaseModel):
    metric: str
    direction: Literal['up', 'down', 'stable']
    magnitude: float  # percent change
    message: str
    severity: Literal['positive', 'neutral', 'warning']

class TrendAnalysisResponse(BaseModel):
    insights: list[TrendInsight]
    streaks: dict[str, int]  # metric -> current streak
```

### 4. `ml_service/main.py` — add endpoint

```python
@app.post("/analyze-trends")
async def analyze_trends(data: TrendAnalysisRequest) -> TrendAnalysisResponse:
```

### 5. `app/api/ml/analyze-trends/route.ts`

- POST proxy; called from tracking page after data loads
- Requires auth; passes user's recent 30 days of tracking entries

### 6. `features/tracking/components/TrackingInsightsPanel.tsx` (new component)

- Calls `/api/ml/analyze-trends` with the last 30 days of entries
- Renders insights as colored cards (green/yellow/red by severity)
- Add to `features/tracking/components/TrackingPage.tsx` below the log section
- Show skeleton while loading, empty state if no data

## Validation

- Trend detection fires correctly for monotonically increasing/decreasing mock series
- Panel renders with ≥1 insight for a user with 14+ days of any tracking data
- Endpoint returns gracefully when entries array is empty

## Completion Notes
