import json
import os
from pathlib import Path
from collections import Counter
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from training_utils import train_and_save_model, tune_threshold

DATA_PATH = os.path.join(os.path.dirname(__file__), "training", "actions.json")


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

    models_dir = Path(os.path.join(os.path.dirname(__file__), "models"))
    metadata, eval_results = train_and_save_model(
        pipeline=pipeline,
        texts=texts,
        labels=labels,
        model_name="action_extractor",
        models_dir=models_dir,
        test_size=0.2,
        random_state=42,
    )

    # Tune threshold for action extraction
    print("\n🔍 Tuning confidence threshold...")
    output_dir = models_dir / "evaluations" / "action_extractor"
    threshold_results = tune_threshold(
        pipeline=pipeline,
        X_val=texts[:50],  # Use subset for threshold tuning
        y_val=labels[:50],
        class_names=sorted(set(labels)),
        output_dir=output_dir,
    )
    print(f"   Optimal threshold: {threshold_results['optimal_threshold']:.3f}")
    print(f"   Optimal F1: {threshold_results['optimal_f1']:.3f}")


if __name__ == "__main__":
    main()
