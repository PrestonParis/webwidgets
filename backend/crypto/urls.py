from django.urls import path
from .views import avax_chart_data

urlpatterns = [
    path('api/avax-stats/', avax_chart_data, name='avax-stats')
]