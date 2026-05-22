# 023 - ML: Document Classifier

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: Medium

## Objective

Build a document type classifier for the Files and Reading features. When a user uploads a file or opens a document, the model should classify it (contract, invoice, report, scripture, code, recipe, etc.) and surface the appropriate viewer/action suggestions.

## Context

- `features/uploads/components/FilesWidget.tsx` — files widget
- `features/reading/components/ReadingWorkspacePage.tsx` — reading workspace
- `app/files/page.tsx` — files page
- `app/api/uploads/` — file upload API
- The classifier works on filename + extracted text snippet (first 500 chars)

## Required Implementation

### 1. `ml_service/data/document_classifier_training.json`
Generate at least 400 synthetic samples:
```json
[
  { "filename": "Q4_contract_signed.pdf", "snippet": "This Agreement is entered into...", "label": "contract" },
  { "filename": "invoice_2026_03.pdf", "snippet": "Invoice #1234 Amount Due: $...", "label": "invoice" }
]
```
Labels: `contract`, `invoice`, `report`, `scripture`, `code`, `recipe`, `research`, `presentation`, `resume`, `personal`, `other`

### 2. `ml_service/train_document_classifier.py`
- Features: TF-IDF on `filename + snippet` (combined)
- Model: `LinearSVC` (fast, good on sparse text features)
- Follow `training_utils.py` evaluation pattern
- Output: `models/document_classifier_v1.pkl` + metadata

### 3. `ml_service/schemas.py` — add schemas
```python
class DocumentClassifyRequest(BaseModel):
    filename: str
    snippet: str  # first ~500 chars of extracted text

class DocumentClassifyResponse(BaseModel):
    label: str
    confidence: float
    suggested_viewer: Literal['pdf', 'text', 'code', 'spreadsheet', 'image', 'scripture']
    suggested_actions: list[str]  # e.g. ["Sign & send", "Extract line items"]
```

### 4. `ml_service/main.py` — add endpoint
```python
@app.post("/classify-document")
async def classify_document(data: DocumentClassifyRequest) -> DocumentClassifyResponse:
```

### 5. `app/api/ml/classify-document/route.ts`
- POST proxy
- Called from file upload flow after file is stored in S3

### 6. Wire into upload flow
- `app/api/uploads/route.ts` (or equivalent) — after successful upload, call `/api/ml/classify-document`
- Store `document_type` and `suggested_viewer` as metadata in the file record
- `features/uploads/components/FilesWidget.tsx` — show document type badge on each file

## Validation

- Classifier correctly identifies contract vs invoice vs scripture for 3 test samples
- Badge appears on uploaded files in the widget
- Graceful degradation when ML_SERVICE_URL is not set (badge hidden, viewer defaults to generic)

## Completion Notes
