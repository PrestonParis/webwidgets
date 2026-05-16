import json
import os
import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

data_path = os.path.join(os.path.dirname(__file__), "data", "action_detector.json")

with open(data_path) as f:
    training_data = json.load(f)

texts = [d["text"] for d in training_data]
labels = [d["label"] for d in training_data]

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 3), max_features=10000, sublinear_tf=True)),
    ("clf", LogisticRegression(C=5, max_iter=1000, solver="lbfgs", multi_class="multinomial")),
])

pipeline.fit(texts, labels)

os.makedirs("models", exist_ok=True)
joblib.dump(pipeline, "models/action_detector.pkl")
print(f"Trained on {len(texts)} examples across {len(set(labels))} action types.")
print("Saved → models/action_detector.pkl")
print("\nLabel distribution:")
for label in sorted(set(labels)):
    count = labels.count(label)
    print(f"  {label}: {count}")
