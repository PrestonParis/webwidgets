from rest_framework import serializers
from .models import Entry

class EntrySerializers(serializers.ModelSerializer):
    class Meta:
        model = Entry
        fields = ['id', 'title', 'content', 'created_at']