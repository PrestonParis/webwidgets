# 026 - ML: Finance Anomaly Detector

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: Medium

## Objective

Build a spending anomaly detector for the Finance feature. Given a user's transaction history, identify statistically unusual transactions (unexpected amounts, new merchants, unusual categories, duplicate charges) and surface them as alerts.

## Context

- `features/finance/` — finance feature with accounts, transactions, subscriptions, watchlist
- `features/finance/components/TransactionList.tsx` — renders transaction list
- `app/api/finance/` — finance API routes
- Anomaly detection should work on transaction data fetched from Plaid or mock data

## Required Implementation

### 1. `ml_service/finance_analytics.py` (new module, statistical approach)
```python
def detect_transaction_anomalies(
    transactions: list[dict],  # {amount, merchant, category, date}
    lookback_days: int = 90,
) -> list[AnomalyResult]:
    """
    Uses z-score on amount per category + IQR outlier detection.
    Flags: unusually large amounts, new merchants, rapid duplicates.
    """

def detect_subscription_changes(
    subscriptions: list[dict],
    current_month_transactions: list[dict],
) -> list[SubscriptionAlert]:
    """Detects price increases, billing date changes, new charges from subscription senders."""
```

No trained model file — purely statistical (`scipy.stats`, `numpy`, `pandas`).

### 2. `ml_service/schemas.py` — add schemas
```python
class TransactionItem(BaseModel):
    id: str
    amount: float
    merchant: str
    category: str
    date: str  # ISO date

class AnomalyResult(BaseModel):
    transaction_id: str
    type: Literal['unusual_amount', 'new_merchant', 'duplicate', 'category_spike']
    severity: Literal['low', 'medium', 'high']
    message: str
    z_score: Optional[float] = None

class FinanceAnomalyRequest(BaseModel):
    transactions: list[TransactionItem]
    lookback_days: int = 90

class FinanceAnomalyResponse(BaseModel):
    anomalies: list[AnomalyResult]
    summary: str  # e.g. "3 anomalies found: 1 high, 2 medium"
```

### 3. `ml_service/main.py` — add endpoint
```python
@app.post("/detect-finance-anomalies")
async def detect_finance_anomalies(data: FinanceAnomalyRequest) -> FinanceAnomalyResponse:
```

### 4. `app/api/ml/finance-anomalies/route.ts`
- POST proxy with auth check
- Called when finance page loads with transactions

### 5. Wire into Finance feature
- `features/finance/components/TransactionList.tsx` — add anomaly badge (⚠️ icon) to flagged transactions
- `features/finance/components/FinancePageContent.tsx` — add `AnomalyAlertBanner` at top of page when anomalies detected
- `features/finance/components/FinanceWidget.tsx` — show anomaly count badge if any high-severity alerts

### 6. `features/finance/components/AnomalyAlertBanner.tsx` (new)
- Collapsible banner listing high-severity anomalies
- Each item shows: transaction name, amount, reason, "Dismiss" action
- Persists dismissed IDs to localStorage

## Validation

- Z-score correctly flags a $500 charge in a category where average is $20
- New merchant flag fires for first-time merchant
- Banner appears on Finance page when anomalies exist
- Widget shows count badge when high-severity anomalies detected

## Completion Notes
