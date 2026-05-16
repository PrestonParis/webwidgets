import json
import os
import joblib
from collections import Counter

import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, StratifiedKFold

DATA_PATH = os.path.join(os.path.dirname(__file__), "training", "actions.json")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "action_extractor.pkl")


def main():
    with open(DATA_PATH) as f:
        data = json.load(f)

    texts = [d["text"] for d in data]
    labels = [d["label"] for d in data]

    dist = Counter(labels)
    print(f"Training on {len(texts)} examples across {len(dist)} classes:")
    for label, count in sorted(dist.items()):
        print(f"  {label}: {count}")

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=20000, sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=2000, C=1.0, solver="lbfgs", multi_class="multinomial")),
    ])

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(pipeline, texts, labels, cv=cv, scoring="accuracy")
    print(f"\nCross-validation accuracy: {np.mean(scores):.3f} ± {np.std(scores):.3f}")

    pipeline.fit(texts, labels)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nSaved → {MODEL_PATH}")


if __name__ == "__main__":
    main()
