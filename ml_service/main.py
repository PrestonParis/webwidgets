from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import os
from sklearn.pipeline import Pipeline

app = FastAPI()

# Configuration
MODELS_DIR = "models"
MODEL_PATH = os.path.join(MODELS_DIR, 'email_classifier.pkl')

class EmailData(BaseModel):
    sender: str
    subject: str

# Load the model once when the service starts
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)

@app.post("/predict")
async def predict_category(data: EmailData):
    if not model:
        return {"category": "other", "confidence": 0.0}
    
    text = f"{data.sender} {data.subject}"
    prediction = model.predict([text])[0]
    # Max probability across all classes
    confidence = model.predict_proba([text]).max()
    
    return {
        "category": prediction if confidence > 0.6 else "other",
        "confidence": float(confidence)
    }