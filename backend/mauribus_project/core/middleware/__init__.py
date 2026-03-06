"""
Custom Middleware - JWT Auth and Logging
"""
import logging
import jwt
from django.conf import settings
from django.http import JsonResponse
from core.models import Admin

logger = logging.getLogger(__name__)


class JWTAuthenticationMiddleware:
    """
    Middleware to authenticate requests using JWT tokens
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Exclude auth endpoints
        if request.path.startswith('/api/v1/login') or request.path.startswith('/admin'):
            return self.get_response(request)
        
        # Get token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                admin_id = payload.get('admin_id')
                
                if admin_id:
                    try:
                        admin = Admin.objects.get(id=admin_id)
                        request.user = admin
                        request.admin = admin
                    except Admin.DoesNotExist:
                        pass
            except jwt.ExpiredSignatureError:
                if '/api/' in request.path:
                    return JsonResponse({'detail': 'Token expiré'}, status=401)
            except jwt.InvalidTokenError:
                if '/api/' in request.path:
                    return JsonResponse({'detail': 'Token invalide'}, status=401)
        
        response = self.get_response(request)
        return response


class LoggingMiddleware:
    """
    Middleware pour logger les actions importantes
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log la requête
        logger.info(f"{request.method} {request.path} - {request.META.get('REMOTE_ADDR')}")
        
        response = self.get_response(request)
        
        # Log les actions sensibles
        if request.method in ['POST', 'PATCH', 'DELETE']:
            logger.warning(
                f"Action {request.method} on {request.path} - "
                f"User: {getattr(request.user, 'matricule', 'Anonymous')} - "
                f"Status: {response.status_code}"
            )
        
        return response
