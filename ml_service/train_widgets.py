"""Train the widget suggester model.

Run from the ml_service directory:
    python train_widgets.py
"""
import os
import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

TRAINING_DATA = [
    # journal
    ("write in my journal", "journal"),
    ("I want to reflect on my day", "journal"),
    ("take some notes", "journal"),
    ("start a diary entry", "journal"),
    ("write down my thoughts", "journal"),
    ("morning pages", "journal"),
    ("evening reflection", "journal"),
    ("document my progress", "journal"),
    ("personal writing", "journal"),
    ("daily log", "journal"),

    # email
    ("check my inbox", "email"),
    ("read my emails", "email"),
    ("I have new messages", "email"),
    ("send an email", "email"),
    ("gmail inbox", "email"),
    ("email actions to complete", "email"),
    ("reply to a message", "email"),
    ("unread mail", "email"),
    ("email notifications", "email"),
    ("manage my inbox", "email"),

    # recovery
    ("track my sobriety", "recovery"),
    ("how many days sober am I", "recovery"),
    ("I want to quit smoking", "recovery"),
    ("addiction recovery tracking", "recovery"),
    ("stay clean today", "recovery"),
    ("my streak counter", "recovery"),
    ("I'm trying to quit drinking", "recovery"),
    ("monitor my recovery progress", "recovery"),
    ("days since I quit", "recovery"),
    ("sobriety tracker", "recovery"),

    # pomodoro
    ("start a focus timer", "pomodoro"),
    ("I want to do deep work", "pomodoro"),
    ("set a 25 minute timer", "pomodoro"),
    ("pomodoro session", "pomodoro"),
    ("help me focus on work", "pomodoro"),
    ("work without distractions", "pomodoro"),
    ("time blocking", "pomodoro"),
    ("study timer", "pomodoro"),
    ("focus mode", "pomodoro"),
    ("work session timer", "pomodoro"),

    # todo
    ("add a task", "todo"),
    ("I need to remember something", "todo"),
    ("create a to-do list", "todo"),
    ("check off a task", "todo"),
    ("things I need to do today", "todo"),
    ("my task list", "todo"),
    ("set a reminder", "todo"),
    ("manage my work items", "todo"),
    ("get things done", "todo"),
    ("pending tasks", "todo"),

    # weather
    ("what is the weather today", "weather"),
    ("will it rain tomorrow", "weather"),
    ("check the forecast", "weather"),
    ("temperature outside", "weather"),
    ("weather in my city", "weather"),
    ("do I need an umbrella", "weather"),
    ("is it going to snow", "weather"),
    ("weather conditions", "weather"),

    # converter
    ("convert units", "converter"),
    ("how many feet in a meter", "converter"),
    ("convert miles to kilometers", "converter"),
    ("unit conversion", "converter"),
    ("how many ounces in a cup", "converter"),
    ("measurement conversion", "converter"),
    ("celsius to fahrenheit", "converter"),
    ("convert lengths", "converter"),
    ("metric to imperial", "converter"),

    # chess
    ("play a game of chess", "chess"),
    ("practice chess openings", "chess"),
    ("analyze my chess game", "chess"),
    ("chess strategy help", "chess"),
    ("improve at chess", "chess"),
    ("chess puzzle", "chess"),
    ("chess position analysis", "chess"),
    ("play chess online", "chess"),
    ("chess training", "chess"),

    # worldclock
    ("what time is it in Tokyo", "worldclock"),
    ("timezone converter", "worldclock"),
    ("current time in London", "worldclock"),
    ("world clock", "worldclock"),
    ("time difference between cities", "worldclock"),
    ("check time in New York", "worldclock"),
    ("international time zones", "worldclock"),
    ("time in another country", "worldclock"),

    # currency
    ("convert dollars to euros", "currency"),
    ("exchange rate today", "currency"),
    ("how much is a dollar in pounds", "currency"),
    ("currency converter", "currency"),
    ("foreign exchange rates", "currency"),
    ("convert money to another currency", "currency"),
    ("what is the euro rate", "currency"),
    ("international currency", "currency"),

    # mood
    ("log my mood", "mood"),
    ("how am I feeling today", "mood"),
    ("track my emotions", "mood"),
    ("mood journal", "mood"),
    ("emotional check-in", "mood"),
    ("record how I feel", "mood"),
    ("mood tracker", "mood"),
    ("feelings log", "mood"),
    ("emotional wellbeing", "mood"),

    # habit
    ("build a new habit", "habit"),
    ("track my daily habits", "habit"),
    ("habit streak", "habit"),
    ("daily routine tracker", "habit"),
    ("consistency tracker", "habit"),
    ("monitor my habits", "habit"),
    ("habit challenge", "habit"),
    ("routine building", "habit"),
    ("keep a habit streak going", "habit"),

    # scratchpad
    ("quick note", "scratchpad"),
    ("temporary note", "scratchpad"),
    ("jot something down", "scratchpad"),
    ("scratch pad", "scratchpad"),
    ("clipboard note", "scratchpad"),
    ("quick memo", "scratchpad"),
    ("I just need to write something fast", "scratchpad"),
    ("draft text", "scratchpad"),

    # countdown
    ("countdown to my birthday", "countdown"),
    ("days until Christmas", "countdown"),
    ("how many days until my event", "countdown"),
    ("event countdown", "countdown"),
    ("deadline counter", "countdown"),
    ("days remaining until", "countdown"),
    ("time until my trip", "countdown"),
    ("count down to launch", "countdown"),

    # calendar
    ("what meetings do I have today", "calendar"),
    ("view my calendar", "calendar"),
    ("upcoming events this week", "calendar"),
    ("schedule for today", "calendar"),
    ("check my appointments", "calendar"),
    ("Google Calendar events", "calendar"),
    ("what's on my schedule", "calendar"),
    ("calendar overview", "calendar"),
    ("my agenda", "calendar"),
]

texts = [t for t, _ in TRAINING_DATA]
labels = [l for _, l in TRAINING_DATA]

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=10000, sublinear_tf=True)),
    ("clf", LogisticRegression(C=5, max_iter=1000, solver="lbfgs", multi_class="multinomial")),
])

pipeline.fit(texts, labels)

os.makedirs("models", exist_ok=True)
joblib.dump(pipeline, "models/widget_suggester.pkl")
print(f"Trained on {len(texts)} examples across {len(set(labels))} widget types.")
print("Saved → models/widget_suggester.pkl")
