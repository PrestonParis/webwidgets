from django.urls import path
from .views import avax_chart_data, get_alpha_vantage_data

urlpatterns = [
    path('crypto/avax-stats/', avax_chart_data, name='avax-stats'),
    path('crypto/alpha-vantage/', get_alpha_vantage_data, name='alpha-vantage')
]