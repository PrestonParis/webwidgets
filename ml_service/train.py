import joblib
import os
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Training data — expand this with your own examples
training_data = [
    ("amazon@amazon.com order confirmation", "shopping"),
    ("shipping@ups.com your package is on the way", "shopping"),
    ("noreply@github.com pull request merged", "work"),
    ("calendar@google.com meeting tomorrow", "work"),
    ("newsletter@medium.com top stories this week", "newsletters"),
    ("offers@doordash.com 50% off your next order", "promotions"),
    ("security@google.com new sign in detected", "important"),
    ("bank@chase.com your statement is ready", "finance"),
    ("noreply@linkedin.com you have new connections", "social"),
    ("friend@gmail.com hey are you free this weekend", "personal"),
]

texts = [t for t, _ in training_data]
labels = [l for _, l in training_data]

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("clf", LogisticRegression(max_iter=1000))
])

pipeline.fit(texts, labels)

os.makedirs("models", exist_ok=True)
joblib.dump(pipeline, "models/email_classifier.pkl")
print("Model trained and saved.")