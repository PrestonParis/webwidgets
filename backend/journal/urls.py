from django.urls import path
from . import views

urlpatterns = [
    # Add your journal paths here
    path('', views.EntryListCreateView.as_view(), name='journal-home')
]