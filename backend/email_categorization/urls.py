
from django.urls import include, path
from . import views

urlpatterns = [
    path('predict/', views.categorize_email, name='predict_category'),
    path('manual/', views.manual_categorize, name='manual_categorize'),
    path('auth/', include('rest_framework_social_oauth2.urls', namespace='social')),
]