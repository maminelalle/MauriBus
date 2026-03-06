"""
Custom JWT Authentication for DRF - Compatible avec nos tokens custom
"""
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from core.models import Admin, Driver, CitizenUser


class MauribusJWTAuthentication(BaseAuthentication):
    """
    Authentification JWT custom pour MauriBus.
    Valide les tokens générés par login_view (format: admin_id).
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            admin_id = payload.get('admin_id')
            if not admin_id:
                return None

            admin = Admin.objects.get(id=admin_id)

            if not admin.is_active or admin.statut != 'ACTIF':
                raise AuthenticationFailed('Compte désactivé ou suspendu')

            return (admin, token)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expiré, veuillez vous reconnecter')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token invalide')
        except Admin.DoesNotExist:
            raise AuthenticationFailed('Administrateur introuvable')

    def authenticate_header(self, request):
        return 'Bearer'


class DriverJWTAuthentication(BaseAuthentication):
    """
    Authentification JWT custom pour les chauffeurs MauriBus.
    Valide les tokens générés par driver_login_view (format: driver_id).
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            driver_id = payload.get('driver_id')
            if not driver_id:
                return None

            driver = Driver.objects.get(id=driver_id)

            if driver.statut == 'SUSPENDU':
                raise AuthenticationFailed('Compte suspendu')

            return (driver, token)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expiré, veuillez vous reconnecter')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token invalide')
        except Driver.DoesNotExist:
            raise AuthenticationFailed('Chauffeur introuvable')

    def authenticate_header(self, request):
        return 'Bearer'


class CitizenJWTAuthentication(BaseAuthentication):
    """
    Authentification JWT custom pour les citoyens MauriBus.
    Valide les tokens générés par citizen_login (format: citizen_id).
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            citizen_id = payload.get('citizen_id')
            if not citizen_id:
                return None

            citizen = CitizenUser.objects.get(id=citizen_id)

            if citizen.statut == 'SUSPENDU':
                raise AuthenticationFailed('Compte suspendu')

            return (citizen, token)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expiré, veuillez vous reconnecter')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token invalide')
        except CitizenUser.DoesNotExist:
            raise AuthenticationFailed('Citoyen introuvable')

    def authenticate_header(self, request):
        return 'Bearer'
