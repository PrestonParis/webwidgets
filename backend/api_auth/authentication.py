# gmail authentication

import requests
from django.contrib.auth.models import User
from rest_framework import authentication, exceptions

class GoogleTokenAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer'):
            return None
        
        token = auth_header.split(' ')[1]
    
        # Verify token with Google
        response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?access_token={token}')

        if response.status_code != 200:
            raise exceptions.AuthenticationFailed('Invalid Google Token')
        
        data = response.json()
        email = data.get('email')

        # Find/Create in Django DB
        user, created = User.objects.get_or_create(email=email, defaults={'username': email})

        return (user, None)