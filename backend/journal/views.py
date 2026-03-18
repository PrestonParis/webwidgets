from multiprocessing import AuthenticationError
from typing import Any
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from .auth import GoogleTokenAuthentication
from .serializers import EntrySerializers
from .models import Entry
from rest_framework import generics, permissions


@method_decorator(csrf_exempt, name='dispatch')
class EntryListCreateView(generics.ListCreateAPIView):
    serializer_class = EntrySerializers
    # Tell this view to use Google auth
    authentication_classes = [GoogleTokenAuthentication]
    # Check User
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        return Entry.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer) -> Any:
        # Attached logged in user to current entry
        serializer.save(user=self.request.user)