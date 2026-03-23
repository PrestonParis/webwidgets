from django.contrib import admin
from .models import EmailCategory

@admin.register(EmailCategory)
class EmailCategoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_id', 'sender', 'subject', 'category', 'manually_categorized', 'created_at')
    list_filter = ('category', 'manually_categorized')
    search_fields = ('sender', 'subject')