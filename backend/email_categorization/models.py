from django.db import models
from django.contrib.auth.models import User

class EmailCategory(models.Model):
    '''Model to store categorized emails for each user
    Used to train using scikit-learn and predict categories for new emails'''
    CATEGORY_CHOICES = [
        ('work', 'Work'),
        ('personal', 'Personal'),
        ('promotions', 'Promotions'),
        ('notifications', 'Notifications'),
        ('social', 'Social'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email_id = models.CharField(max_length=255)
    sender = models.CharField(max_length=255)
    subject = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    manually_categorized = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'email_id')
        verbose_name = "Email Category"
        verbose_name_plural = "Email Categories"