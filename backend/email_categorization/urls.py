from django.urls import path
from . import views

urlpatterns = [
    path('predict/', views.categorize_email, name='predict_category'),
    path('manual/', views.manual_categorize, name='manual_categorize'),
]