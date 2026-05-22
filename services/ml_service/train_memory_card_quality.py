"""Train memory card quality classifier: TF-IDF + LinearSVC with calibration."""
import json
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from training_utils import train_and_save_model

DATA_PATH = Path(__file__).parent / "data" / "memory_card_quality.json"
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

with open(DATA_PATH) as f:
    raw = json.load(f)

texts = [f"{r['front']} [SEP] {r['back']}" for r in raw]
labels = [r["quality"] for r in raw]

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True, min_df=1)),
    ("clf", LogisticRegression(C=5, max_iter=1000, solver="lbfgs", multi_class="multinomial", random_state=42)),
])

metadata, eval_results = train_and_save_model(
    pipeline=pipeline,
    texts=texts,
    labels=labels,
    model_name="memory_card_quality",
    models_dir=MODELS_DIR,
    test_size=0.2,
    random_state=42,
)
print(f"Accuracy: {eval_results.get('accuracy', 'N/A')}")
print(f"F1 macro: {eval_results.get('f1_macro', 'N/A')}")
print(f"Saved: {metadata.model_path}")
