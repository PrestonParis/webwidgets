from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import EmailCategorizer
from .models import EmailCategory
from django.contrib.auth.models import User

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def categorize_email(request) -> Response:
    """Categorize a single email"""
    sender = request.data.get('sender')
    subject = request.data.get('subject')
    email_id = request.data.get('email_id')
    user_email = request.data.get('user_email')
    
    # If email_id and user_email are provided, check if we already have a category for this email to avoid unnecessary categorization and also to ensure consistency in categorization for the same email
    if email_id and user_email:    
        try:
            user = User.objects.filter(email=user_email).first()
            if user:
                existing = EmailCategory.objects.filter(
                    user=user, 
                    email_id=email_id).first()
                if existing:
                    return Response({'category': existing.category})
        except Exception as e:
            pass # If any error occurs during this check, we will just proceed to categorize the email as normal
    
    categorizer = EmailCategorizer()
    category = categorizer.categorize_email(sender, subject)

    if not email_id or not user_email:
        return Response({'category': category, 'warning': 'No email_id provided'})
    
    # Use get_or_none pattern to avoid MultipleObjectsReturned error if email_id is not unique for some reason
    try: 
        user = User.objects.get(email=user_email)
        if not user:
            return Response({'category': category, 'warning': 'User not found'})
    except Exception as e:
        return Response({'category': category, 'warning': f'Error retrieving user: {str(e)}'})

    # Store the prediction
    EmailCategory.objects.update_or_create(
        user=user,
        email_id=email_id,
        defaults={'sender': sender, 'subject': subject, 'category': category}
    )
    
    return Response({'category': category})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_categorize(request) -> Response:
    """User manually categorizes an email"""
    categorizer = EmailCategorizer()
    email_id = request.data.get('email_id')
    category = request.data.get('category')
    sender = request.data.get('sender')
    subject = request.data.get('subject')
    user_email = request.data.get('user_email')
    
    print(f"DEBUG: email_id={email_id}, category={category}, user_email={user_email}")
    try: 
        user = User.objects.get(email=user_email)
    except User.DoesNotExist:
        return Response({'category': category, 'warning': 'User not found'})
    except User.MultipleObjectsReturned:
        user = User.objects.filter(email=user_email).first()
    
    print(f"DEBUG: user={user}")
    # Save manual categorization
    EmailCategory.objects.update_or_create(
        user=user,
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