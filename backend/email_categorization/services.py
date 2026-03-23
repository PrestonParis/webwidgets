import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from .models import EmailCategory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

class EmailCategorizer:
    MODEL_PATH = os.path.join(MODELS_DIR, 'email_classifier.pkl')
    VECTORIZER_PATH = os.path.join(MODELS_DIR, 'tfidf_vectorizer.pkl')
    
    def __init__(self) -> None:
        self.model = None
        self.load_or_train_model()
    
    def load_or_train_model(self) -> None:
        """Load existing model or train a new one"""
        if os.path.exists(self.MODEL_PATH):
            self.model = joblib.load(self.MODEL_PATH)
        else:
            self.train_model()
    
    def train_model(self, user=None) -> bool:
        """Train the model on user's manually categorized emails"""
        training_data = EmailCategory.objects.filter(manually_categorized=True)
        if user:
            training_data = training_data.filter(user=user)
        
        if training_data.count() < 10:  # Need minimum training data
            return False
        
        # Prepare training data
        texts = [f"{email.sender} {email.subject}" for email in training_data]
        labels = [email.category for email in training_data]
        
        # Create and train pipeline
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=1000, stop_words='english')),
            ('classifier', MultinomialNB())
        ])
        self.model.fit(texts, labels)
        
        # Save model
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump(self.model, self.MODEL_PATH)
        return True
    
    def categorize_email(self, sender: str, subject: str) -> str:
        """Predict category for an email"""
        if not self.model:
            return 'other'
        
        text = f"{sender} {subject}"
        prediction = self.model.predict([text])[0]
        confidence = self.model.predict_proba([text]).max()
        
        # Only return prediction if confidence is above threshold
        if confidence > 0.6:
            return prediction
        return 'other'