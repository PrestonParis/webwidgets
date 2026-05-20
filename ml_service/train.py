import json
import os
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from training_utils import train_and_save_model

data_path = os.path.join(os.path.dirname(__file__), "data", "email_classifier.json")

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
    model_name="email_classifier",
    models_dir=models_dir,
    test_size=0.2,
    random_state=42,
)
