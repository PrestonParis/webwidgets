from django.urls import path
from .views import lyric_chart_data

urlpatterns = [
    path('lyrics/chart/', lyric_chart_data, name='lyrics-chart'),
]