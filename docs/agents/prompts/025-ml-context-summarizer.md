# 025 - ML: Context Graph Summarizer & Intent Classifier

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: High

## Objective

Build two tightly-coupled ML capabilities for the Context Diagram and AI Chat features:

1. **Context Summarizer** — given a user's context graph (widgets, integrations, recent actions), generate a concise natural-language summary usable as a system prompt prefix for AI chat
2. **Chat Intent Classifier** — classify user chat messages into intent buckets to route to the right action (widget operation, search, file action, calendar action, general Q&A)

## Context

- `features/context/` — context diagram feature
- `features/chatbot/` — AI chat feature
- `app/api/chat/` — chat API routes
- The chat system already calls Claude/GPT/Gemini. The intent classifier helps pre-route before sending to LLM.

## Required Implementation

### Part A: Context Summarizer (deterministic/template-based, no model file needed)

#### `ml_service/context_summarizer.py` (new module)

```python
def summarize_context(
    active_widgets: list[str],
    integrations: list[str],
    recent_actions: list[str],
    goals: list[str],
) -> str:
    """Returns a 2-3 sentence natural language summary for use as LLM system prompt context."""
```

Template approach — no trained model needed. Build a template engine that produces:

> "The user actively uses [widgets]. They have connected [integrations]. Recent focus: [actions]. Their stated goals are [goals]."

#### `ml_service/main.py` — add endpoint

```python
@app.post("/summarize-context")
async def summarize_context_endpoint(data: ContextSummaryRequest) -> ContextSummaryResponse:
```

#### `app/api/ml/summarize-context/route.ts`

- POST proxy
- Called from chat initialization to build system prompt prefix

### Part B: Chat Intent Classifier (trained model)

#### `ml_service/data/chat_intent_training.json`

Generate 400+ samples:

```json
[
  {
    "message": "Add a meeting with John tomorrow at 3pm",
    "intent": "calendar_action"
  },
  { "message": "What's the weather like?", "intent": "widget_query" },
  { "message": "Search my emails for the Netflix invoice", "intent": "search" },
  { "message": "Explain this code snippet", "intent": "general_qa" }
]
```

Intents: `widget_query`, `calendar_action`, `file_action`, `search`, `tracking_log`, `general_qa`, `settings_change`

#### `ml_service/train_chat_intent.py`

- Model: TF-IDF + `LinearSVC`
- Output: `models/chat_intent_v1.pkl` + metadata

#### `ml_service/schemas.py` — add schemas

```python
class ContextSummaryRequest(BaseModel):
    active_widgets: list[str]
    integrations: list[str]
    recent_actions: list[str] = []
    goals: list[str] = []

class ContextSummaryResponse(BaseModel):
    summary: str
    token_count: int  # approximate

class ChatIntentRequest(BaseModel):
    message: str

class ChatIntentResponse(BaseModel):
    intent: str
    confidence: float
    suggested_action: Optional[str] = None  # e.g. "open_calendar", "search_files"
```

#### `ml_service/main.py` — add endpoint

```python
@app.post("/classify-intent")
async def classify_chat_intent(data: ChatIntentRequest) -> ChatIntentResponse:
```

### Wire into Chat

- `app/api/chat/route.ts` (or equivalent):
  1. On each message, call `/api/ml/classify-intent` first
  2. If `intent` is `widget_query` or `calendar_action` with confidence > 0.7, attempt direct action before LLM call
  3. Always prepend context summary to system prompt (cache for session)

## Validation

- Intent classifier correctly identifies calendar vs search vs general_qa for 5 test inputs
- Context summary renders as a coherent sentence from 3+ active widgets
- Chat system prompt includes context summary prefix
- Direct actions fire correctly for high-confidence widget/calendar intents

## Completion Notes
