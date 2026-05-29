# 024 - ML: Task Priority Ranker

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: Medium

## Objective

Build a task priority ranking model for the Todo widget. Given a list of tasks with their text, creation date, due date (if any), and completion history, rank them by predicted urgency/importance. Surface "Focus on this next" suggestions.

## Context

- `features/todo/` — Todo feature with tasks and habits
- `features/todo/components/TodoWidget.tsx` — widget rendered on dashboard
- `app/todo/` — full Todo page

## Required Implementation

### 1. `ml_service/data/task_priority_training.json`
Generate at least 300 synthetic samples:
```json
[
  {
    "title": "Submit tax return",
    "has_due_date": true,
    "days_until_due": 2,
    "days_since_created": 30,
    "has_url": false,
    "word_count": 3,
    "priority_score": 0.95
  }
]
```
Features to encode:
- `title` TF-IDF (urgency keywords: deadline, asap, today, urgent, overdue)
- `has_due_date` (boolean)
- `days_until_due` (normalized, -1 if none)
- `days_since_created` (normalized)
- `word_count`

### 2. `ml_service/train_task_ranker.py`
- Model: `RandomForestRegressor` (handles mixed features well)
- Feature pipeline: `ColumnTransformer` with TF-IDF + numeric scaler
- Follow `training_utils.py` evaluation pattern
- RMSE target < 0.15 on validation set

### 3. `ml_service/schemas.py` — add schemas
```python
class TaskRankItem(BaseModel):
    id: str
    title: str
    has_due_date: bool
    days_until_due: Optional[float] = None
    days_since_created: float

class TaskRankRequest(BaseModel):
    tasks: list[TaskRankItem]

class RankedTask(BaseModel):
    id: str
    priority_score: float

class TaskRankResponse(BaseModel):
    ranked: list[RankedTask]  # sorted by priority_score desc
```

### 4. `ml_service/main.py` — add endpoint
```python
@app.post("/rank-tasks")
async def rank_tasks(data: TaskRankRequest) -> TaskRankResponse:
```

### 5. `app/api/ml/rank-tasks/route.ts`
- POST proxy with auth check

### 6. Wire into Todo widget
- `features/todo/hooks/useTodo.ts` (or equivalent) — after loading tasks, POST to `/api/ml/rank-tasks`
- Sort tasks by returned `priority_score` when user hasn't manually reordered
- Show a subtle "AI sorted" chip when ML ordering is active
- Add toggle to disable ML ordering (per user preference in widget settings)

## Validation

- Tasks with "deadline today" score higher than "someday" tasks
- Widget shows tasks in ML-ranked order by default
- Toggle disables ML ordering and restores manual order
- Graceful fallback when ML unavailable

## Completion Notes
