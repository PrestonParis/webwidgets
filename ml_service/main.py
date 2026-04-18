from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os

app = FastAPI()

MODELS_DIR = "models"
MODEL_PATH = os.path.join(MODELS_DIR, 'email_classifier.pkl')

class EmailData(BaseModel):
    sender: str
    subject: str

class BatchEmailData(BaseModel):
    emails: list[dict]  # [{ id, sender, subject }]

model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)

def classify(sender: str, subject: str) -> dict:
    """Shared logic for single and batch prediction."""
    if not model:
        return {"category": "other", "confidence": 0.0}
    text = f"{sender} {subject}"
    prediction = model.predict([text])[0]
    confidence = float(model.predict_proba([text]).max())
    return {
        "category": prediction if confidence > 0.6 else "other",
        "confidence": confidence
    }

@app.post("/predict")
async def predict_category(data: EmailData):
    return classify(data.sender, data.subject)

@app.post("/predict/batch")
async def predict_batch(data: BatchEmailData):
    return [
        {"id": email["id"], **classify(email["sender"], email["subject"])}
        for email in data.emails
    ]