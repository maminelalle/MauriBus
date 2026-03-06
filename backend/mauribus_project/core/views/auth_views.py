"""
Authentication Views for MauriBus API
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from core.models import Admin, Driver
import jwt
from datetime import datetime, timedelta
from django.conf import settings


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint - Accepts matricule and password
    Returns admin data and JWT access token
    """
    matricule = request.data.get('matricule')
    password = request.data.get('password')

    if not matricule or not password:
        return Response(
            {'detail': 'Matricule et mot de passe requis'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        admin = Admin.objects.get(matricule=matricule)
    except Admin.DoesNotExist:
        return Response(
            {'detail': 'Identifiants invalides'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if admin.statut == 'SUSPENDU':
        return Response(
            {'detail': 'Compte suspendu. Contactez le super administrateur.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check password
    if not check_password(password, admin.password):
        return Response(
            {'detail': 'Identifiants invalides'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Update last login
    admin.derniere_connexion = timezone.now()
    admin.save(update_fields=['derniere_connexion'])

    # Generate JWT token - UUID must be converted to string
    payload = {
        'admin_id': str(admin.id),
        'matricule': admin.matricule,
        'role': admin.role,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    return Response({
        'access': token,
        'admin': {
            'id': str(admin.id),
            'matricule': admin.matricule,
            'nom': admin.nom,
            'prenom': admin.prenom,
            'email': admin.email,
            'role': admin.role,
            'statut': admin.statut,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def logout_view(request):
    """
    Logout endpoint (client-side token removal)
    """
    return Response({'detail': 'Déconnexion réussie'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def driver_login_view(request):
    """
    Login endpoint for drivers - Accepts matricule and password
    """
    matricule = request.data.get('matricule')
    password = request.data.get('password')

    if not matricule or not password:
        return Response({'detail': 'Matricule et mot de passe requis'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        driver = Driver.objects.get(matricule=matricule)
    except Driver.DoesNotExist:
        return Response({'detail': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)

    if driver.statut == 'SUSPENDU':
        return Response({'detail': 'Compte suspendu. Contactez votre administrateur.'}, status=status.HTTP_403_FORBIDDEN)

    if not check_password(password, driver.password):
        return Response({'detail': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)

    # Update last login + online status
    driver.derniere_connexion = timezone.now()
    driver.is_online = True
    driver.save(update_fields=['derniere_connexion', 'is_online'])

    payload = {
        'driver_id': str(driver.id),
        'matricule': driver.matricule,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    # Get assigned bus — try reverse accessor first, then explicit query (more reliable)
    bus = None
    try:
        bus = driver.bus_assigne
    except Exception:
        pass
    if bus is None:
        from core.models import Bus as BusModel
        bus = BusModel.objects.filter(chauffeur=driver).prefetch_related('lignes').first()

    bus_info = None
    if bus:
        bus_info = {
            'id': str(bus.id),
            'numero_bus': bus.numero_bus,
            'plaque': bus.plaque,
            'marque': bus.marque,
            'modele': bus.modele,
            'capacite': bus.capacite,
            'lignes': [{'id': str(l.id), 'code': l.code, 'nom': l.nom, 'couleur': l.couleur_ligne}
                       for l in bus.lignes.all()],
        }

    return Response({
        'access': token,
        'driver': {
            'id': str(driver.id),
            'matricule': driver.matricule,
            'nom': driver.nom,
            'prenom': driver.prenom,
            'email': driver.email,
            'telephone': driver.telephone,
            'statut': driver.statut,
            'is_online': driver.is_online,
            'bus': bus_info,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def driver_logout_view(request):
    """Mark driver as offline"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            driver = Driver.objects.get(id=payload.get('driver_id'))
            driver.is_online = False
            driver.save(update_fields=['is_online'])
        except Exception:
            pass
    return Response({'detail': 'Déconnexion réussie'}, status=status.HTTP_200_OK)
