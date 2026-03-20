from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # For testing purposes
from .services import EmailCategorizer
from .models import EmailCategory

@api_view(['POST'])
# @permission_classes([IsAuthenticated])
@permission_classes([AllowAny])  # Temporarily allow all for testing
def categorize_email(request) -> Response:
    """Categorize a single email"""
    categorizer = EmailCategorizer()

    sender = request.data.get('sender')
    subject = request.data.get('subject')
    email_id = request.data.get('email_id')
    
    # 1. Safety Check: If there's no ID, we can't save to the DB
    if not email_id:
        category = categorizer.categorize_email(sender, subject)
        return Response({'category': category, 'warning': 'No email_id provided'})
    
    category = categorizer.categorize_email(sender, subject)
    
    # Store the prediction
    EmailCategory.objects.update_or_create(
        user=request.user,
        email_id=email_id,
        defaults={'sender': sender, 'subject': subject, 'category': category}
    )
    
    return Response({'category': category})

@api_view(['POST'])
#@permission_classes([IsAuthenticated])
@permission_classes([AllowAny])  # Temporarily allow all for testing
def manual_categorize(request) -> Response:
    """User manually categorizes an email"""
    categorizer = EmailCategorizer()
    email_id = request.data.get('email_id')
    category = request.data.get('category')
    sender = request.data.get('sender')
    subject = request.data.get('subject')
    
    # Save manual categorization
    EmailCategory.objects.update_or_create(
        user=request.user,
        email_id=email_id,
        defaults={
            'sender': sender,
            'subject': subject,
            'category': category,
            'manually_categorized': True
        }
    )
    
    # Retrain model with new data
    categorizer.train_model(user=request.user)
    
    return Response({'status': 'categorized', 'category': category})