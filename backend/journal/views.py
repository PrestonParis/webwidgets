from typing import Any
from api_auth.authentication import GoogleTokenAuthentication
from .serializers import EntrySerializers
from .models import Entry
from rest_framework import generics, permissions


class EntryListCreateView(generics.ListCreateAPIView):
    '''Serve the emails by most recent'''
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