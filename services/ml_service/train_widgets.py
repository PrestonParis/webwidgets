import json
import os
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from training_utils import train_and_save_model, tune_threshold

data_path = os.path.join(os.path.dirname(__file__), "data", "widget_suggester.json")

with open(data_path) as f:
    training_data = json.load(f)

texts = [d["text"] for d in training_data]
labels = [d["label"] for d in training_data]

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True)),
    ("clf", LogisticRegression(C=5, max_iter=1000, solver="lbfgs", multi_class="multinomial")),
])

models_dir = Path(os.path.join(os.path.dirname(__file__), "models"))
metadata, eval_results = train_and_save_model(
    pipeline=pipeline,
    texts=texts,
    labels=labels,
    model_name="widget_suggester",
    models_dir=models_dir,
    test_size=0.2,
    random_state=42,
)

# Tune threshold for widget suggestion
print("\n🔍 Tuning confidence threshold...")
output_dir = models_dir / "evaluations" / "widget_suggester"
threshold_results = tune_threshold(
    pipeline=pipeline,
    X_val=texts[:50],  # Use subset for threshold tuning
    y_val=labels[:50],
    class_names=sorted(set(labels)),
    output_dir=output_dir,
)
print(f"   Optimal threshold: {threshold_results['optimal_threshold']:.3f}")
print(f"   Optimal F1: {threshold_results['optimal_f1']:.3f}")
