"""
Citizen-specific API views (public + CitizenJWTAuthentication)
"""
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from django.db import transaction as db_transaction
from django.conf import settings
import jwt

from core.authentication import CitizenJWTAuthentication
from core.models import CitizenUser, WalletCitizen, WalletDriver, WalletTransaction, CitizenTrip, DriverRating
from core.models import Line, Stop, Bus, Trip, GPSPosition, Notification, AppWallet, AppTransaction


# ─── AUTH ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def citizen_register(request):
    """Register a new citizen, auto-create wallet."""
    telephone = request.data.get('telephone', '').strip()
    nom = request.data.get('nom', '').strip()
    prenom = request.data.get('prenom', '').strip()
    password = request.data.get('password', '')
    email = request.data.get('email', '').strip() or None
    nni = request.data.get('nni', '').strip() or None

    if not telephone or not nom or not prenom or not password:
        return Response({'detail': 'telephone, nom, prenom et password sont requis'}, status=400)

    if CitizenUser.objects.filter(telephone=telephone).exists():
        return Response({'detail': 'Ce numéro de téléphone est déjà utilisé'}, status=400)

    if email and CitizenUser.objects.filter(email=email).exists():
        return Response({'detail': 'Cet email est déjà utilisé'}, status=400)

    citizen = CitizenUser.objects.create(
        telephone=telephone,
        nom=nom,
        prenom=prenom,
        email=email,
        nni=nni,
        password=make_password(password),
    )
    WalletCitizen.objects.create(citoyen=citizen)

    return Response({
        'detail': 'Compte créé avec succès',
        'telephone': citizen.telephone,
        'nom': citizen.nom,
        'prenom': citizen.prenom,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def citizen_login(request):
    """Login citizen, return JWT + wallet balance."""
    telephone = request.data.get('telephone', '').strip()
    password = request.data.get('password', '')

    try:
        citizen = CitizenUser.objects.get(telephone=telephone)
    except CitizenUser.DoesNotExist:
        return Response({'detail': 'Identifiants invalides'}, status=401)

    if not check_password(password, citizen.password):
        return Response({'detail': 'Identifiants invalides'}, status=401)

    if citizen.statut == 'SUSPENDU':
        return Response({'detail': 'Compte suspendu, contactez l\'administration'}, status=403)

    citizen.derniere_connexion = timezone.now()
    citizen.save(update_fields=['derniere_connexion'])

    payload = {
        'citizen_id': str(citizen.id),
        'telephone': citizen.telephone,
        'exp': datetime.utcnow() + timedelta(days=30),
        'iat': datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    wallet, _ = WalletCitizen.objects.get_or_create(citoyen=citizen)

    return Response({
        'access': token,
        'citizen': {
            'id': str(citizen.id),
            'telephone': citizen.telephone,
            'nom': citizen.nom,
            'prenom': citizen.prenom,
            'email': citizen.email,
            'nni': citizen.nni,
            'statut': citizen.statut,
            'wallet_balance': str(wallet.balance),
        }
    })


@api_view(['POST'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_logout(request):
    return Response({'detail': 'Déconnecté avec succès'})


# ─── PROFILE ─────────────────────────────────────────────────────────────────

@api_view(['GET', 'PATCH'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_profile(request):
    citizen = request.user
    if request.method == 'GET':
        wallet, _ = WalletCitizen.objects.get_or_create(citoyen=citizen)
        return Response({
            'id': str(citizen.id),
            'telephone': citizen.telephone,
            'nom': citizen.nom,
            'prenom': citizen.prenom,
            'email': citizen.email,
            'nni': citizen.nni,
            'statut': citizen.statut,
            'wallet_balance': str(wallet.balance),
            'date_creation': citizen.date_creation,
        })

    # PATCH
    for field in ['nom', 'prenom', 'email']:
        if field in request.data:
            setattr(citizen, field, request.data[field])
    if 'password' in request.data and request.data['password']:
        citizen.password = make_password(request.data['password'])
    citizen.save()
    return Response({'detail': 'Profil mis à jour'})


# ─── WALLET ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_wallet_balance(request):
    """Return wallet balance + recent transactions."""
    citizen = request.user
    wallet, _ = WalletCitizen.objects.get_or_create(citoyen=citizen)
    transactions = WalletTransaction.objects.filter(citoyen=citizen).order_by('-date_creation')[:20]

    tx_data = [{
        'id': str(t.id),
        'montant': str(t.montant),
        'type_transaction': t.type_transaction,
        'statut': t.statut,
        'description': t.description,
        'date_creation': t.date_creation,
    } for t in transactions]

    return Response({
        'balance': str(wallet.balance),
        'transactions': tx_data,
    })


@api_view(['POST'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_wallet_recharge(request):
    """Request wallet recharge (upload Bankily screenshot)."""
    citizen = request.user
    montant = request.data.get('montant')
    reference = request.data.get('reference_bankily', '')

    if not montant:
        return Response({'detail': 'Montant requis'}, status=400)

    try:
        montant = float(montant)
        if montant <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({'detail': 'Montant invalide'}, status=400)

    tx = WalletTransaction.objects.create(
        citoyen=citizen,
        montant=montant,
        type_transaction='RECHARGE',
        statut='EN_ATTENTE',
        description=f'Recharge Bankily {montant} MRU',
        reference_bankily=reference,
    )

    if 'photo_bankily' in request.FILES:
        tx.photo_bankily = request.FILES['photo_bankily']
        tx.save()

    return Response({
        'detail': 'Demande de recharge envoyée. En attente de validation admin.',
        'transaction_id': str(tx.id),
        'montant': str(tx.montant),
        'statut': tx.statut,
    }, status=201)


@api_view(['POST'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_wallet_pay(request):
    """Citizen pays for a trip using wallet."""
    citizen = request.user
    ligne_id = request.data.get('ligne_id')
    bus_id = request.data.get('bus_id')
    montant = request.data.get('montant')

    if not montant or not ligne_id:
        return Response({'detail': 'ligne_id et montant requis'}, status=400)

    try:
        montant = float(montant)
    except (ValueError, TypeError):
        return Response({'detail': 'Montant invalide'}, status=400)

    wallet, _ = WalletCitizen.objects.get_or_create(citoyen=citizen)

    if float(wallet.balance) < montant:
        return Response({'detail': 'Solde insuffisant. Rechargez votre wallet.'}, status=400)

    with db_transaction.atomic():
        wallet.balance = float(wallet.balance) - montant
        wallet.save()

        WalletTransaction.objects.create(
            citoyen=citizen,
            montant=montant,
            type_transaction='PAIEMENT',
            statut='VALIDE',
            description=f'Paiement trajet ligne',
        )

        ct = CitizenTrip.objects.create(
            citoyen=citizen,
            ligne_id=ligne_id,
            bus_id=bus_id if bus_id else None,
            montant_paye=montant,
            methode_paiement='WALLET',
        )

        # 15% commission → AppWallet MauriBus
        COMMISSION_RATE = 0.15
        commission_app = round(montant * COMMISSION_RATE, 2)
        app_wallet = AppWallet.get()
        solde_avant_app = float(app_wallet.balance)
        app_wallet.balance = float(app_wallet.balance) + commission_app
        app_wallet.save()
        AppTransaction.objects.create(
            type_transaction='COMMISSION',
            montant=commission_app,
            description=f'Commission 15% trajet citoyen {citizen.telephone}',
            solde_avant=solde_avant_app,
            solde_apres=float(app_wallet.balance),
        )

        # 85% to driver wallet if bus has driver
        if bus_id:
            try:
                bus = Bus.objects.get(id=bus_id)
                driver = getattr(bus, 'chauffeur', None)
                if driver:
                    dw, _ = WalletDriver.objects.get_or_create(chauffeur=driver)
                    driver_part = round(montant * 0.85, 2)
                    dw.balance = float(dw.balance) + driver_part
                    dw.save()
            except Bus.DoesNotExist:
                pass

    return Response({
        'detail': 'Paiement effectué avec succès',
        'ticket_id': str(ct.id),
        'ticket_code': str(ct.ticket_code),
        'nouveau_solde': str(wallet.balance),
        'montant_paye': montant,
        'ligne': {
            'id': str(ct.ligne.id),
            'code': ct.ligne.code,
            'nom': ct.ligne.nom,
            'terminus_depart': ct.ligne.terminus_depart,
            'terminus_arrivee': ct.ligne.terminus_arrivee,
            'couleur': ct.ligne.couleur_ligne,
        } if ct.ligne else None,
    })


@api_view(['GET'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_wallet_transactions(request):
    """Full transaction history."""
    citizen = request.user
    transactions = WalletTransaction.objects.filter(citoyen=citizen).order_by('-date_creation')[:50]

    data = [{
        'id': str(t.id),
        'montant': str(t.montant),
        'type_transaction': t.type_transaction,
        'statut': t.statut,
        'description': t.description,
        'reference_bankily': t.reference_bankily,
        'date_creation': t.date_creation,
    } for t in transactions]

    return Response(data)


# ─── HISTORY ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_trip_history(request):
    """Citizen's trip payment history."""
    citizen = request.user
    trips = CitizenTrip.objects.filter(citoyen=citizen).select_related('ligne', 'bus').order_by('-date_paiement')[:50]

    data = [{
        'id': str(t.id),
        'montant_paye': str(t.montant_paye),
        'statut': t.statut,
        'methode_paiement': t.methode_paiement,
        'date_paiement': t.date_paiement,
        'ligne': {
            'id': str(t.ligne.id),
            'code': t.ligne.code,
            'nom': t.ligne.nom,
            'couleur': t.ligne.couleur_ligne,
            'terminus_depart': t.ligne.terminus_depart,
            'terminus_arrivee': t.ligne.terminus_arrivee,
        } if t.ligne else None,
        'bus': {
            'id': str(t.bus.id),
            'numero_bus': t.bus.numero_bus,
        } if t.bus else None,
    } for t in trips]

    return Response(data)


# ─── PUBLIC ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def citizen_lines_list(request):
    """All active lines with stops."""
    lines = Line.objects.filter(statut='ACTIVE').prefetch_related('stops').order_by('code')

    data = [{
        'id': str(l.id),
        'code': l.code,
        'nom': l.nom,
        'terminus_depart': l.terminus_depart,
        'terminus_arrivee': l.terminus_arrivee,
        'tarif_base': str(l.tarif_base),
        'frequence_minutes': l.frequence_minutes,
        'distance_totale_km': l.distance_totale_km,
        'couleur': l.couleur_ligne,
        'heure_depart': str(l.heure_depart) if l.heure_depart else None,
        'heure_fin': str(l.heure_fin) if l.heure_fin else None,
        'stops': [{
            'id': str(s.id),
            'nom': s.nom,
            'ordre': s.ordre,
            'latitude': s.latitude,
            'longitude': s.longitude,
            'temps_arrivee_estimee': s.temps_arrivee_estimee,
        } for s in l.stops.order_by('ordre')],
    } for l in lines]

    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def citizen_buses_live(request):
    """Active buses with their last GPS position."""
    buses = Bus.objects.filter(statut='ACTIF').select_related('chauffeur').prefetch_related('lignes')

    data = []
    for b in buses:
        last_gps = GPSPosition.objects.filter(bus=b).order_by('-timestamp').first()
        data.append({
            'id': str(b.id),
            'numero_bus': b.numero_bus,
            'capacite': b.capacite,
            'places_disponibles': b.places_disponibles,
            'est_plein': b.est_plein,
            'lignes': [{
                'id': str(l.id),
                'code': l.code,
                'nom': l.nom,
                'couleur': l.couleur_ligne,
                'terminus_depart': l.terminus_depart,
                'terminus_arrivee': l.terminus_arrivee,
            } for l in b.lignes.all()],
            'gps': {
                'latitude': last_gps.latitude,
                'longitude': last_gps.longitude,
                'vitesse_kmh': last_gps.vitesse_kmh,
                'timestamp': last_gps.timestamp,
            } if last_gps else None,
            'chauffeur_nom': f"{b.chauffeur.prenom} {b.chauffeur.nom}" if b.chauffeur else None,
        })

    return Response(data)


@api_view(['GET'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_notifications(request):
    """Broadcast notifications for citizens."""
    notifications = Notification.objects.filter(
        type_notification='BROADCAST'
    ).order_by('-date_creation')[:30]

    data = [{
        'id': str(n.id),
        'titre': n.titre,
        'message': n.message,
        'envoye_par': n.envoye_par,
        'date_creation': n.date_creation,
    } for n in notifications]

    return Response(data)


# ─── ACTIVE TRIP TRACKING ─────────────────────────────────────────────────────

@api_view(['GET'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_active_trip(request):
    """
    Returns real-time info for the citizen's active paid trip.
    Finds a CitizenTrip with statut=PAYE that has an associated Trip currently EN_COURS,
    or falls back to any EN_COURS trip on the citizen's paid ligne.
    Returns bus GPS, stops, and trip info for live tracking.
    """
    citizen = request.user

    # 1. Find citizen's paid trips with a linked EN_COURS trajet
    paid = CitizenTrip.objects.filter(
        citoyen=citizen, statut='PAYE'
    ).select_related('trajet', 'trajet__bus', 'trajet__ligne', 'ligne', 'bus').order_by('-date_paiement')

    active_ct = None
    for ct in paid:
        if ct.trajet and ct.trajet.statut == 'EN_COURS':
            active_ct = ct
            break

    # 2. Fallback: find any EN_COURS trip on a paid ligne
    if not active_ct:
        paid_ligne_ids = paid.values_list('ligne_id', flat=True).distinct()
        running_trip = Trip.objects.filter(
            statut='EN_COURS', ligne_id__in=paid_ligne_ids
        ).select_related('bus', 'driver', 'ligne').first()

        if running_trip:
            # Find the CitizenTrip for that ligne
            active_ct_qs = paid.filter(ligne=running_trip.ligne).first()
            if active_ct_qs:
                active_ct = active_ct_qs
                active_ct._running_trip = running_trip
            else:
                trip = running_trip
                bus = trip.bus
                last_gps = GPSPosition.objects.filter(bus=bus).order_by('-timestamp').first() if bus else None
                stops = []
                if trip.ligne:
                    stops = [{'nom': s.nom, 'latitude': float(s.latitude), 'longitude': float(s.longitude), 'ordre': s.ordre}
                             for s in trip.ligne.stops.order_by('ordre') if s.latitude and s.longitude]
                return Response({
                    'active': True,
                    'ticket_id': None,
                    'ligne': {'code': trip.ligne.code, 'nom': trip.ligne.nom, 'couleur': trip.ligne.couleur_ligne} if trip.ligne else None,
                    'bus': {'numero_bus': bus.numero_bus, 'capacite': bus.capacite} if bus else None,
                    'chauffeur': f"{trip.driver.prenom} {trip.driver.nom}" if trip.driver else None,
                    'trip': {'id': str(trip.id), 'statut': trip.statut, 'date_debut': trip.date_debut, 'nombre_passagers': trip.nombre_passagers},
                    'gps': {'latitude': last_gps.latitude, 'longitude': last_gps.longitude, 'vitesse_kmh': last_gps.vitesse_kmh, 'timestamp': last_gps.timestamp} if last_gps else None,
                    'stops': stops,
                })

    if not active_ct:
        return Response({'active': False, 'message': 'Aucun trajet actif trouvé'})

    # Resolve running trip
    trip = getattr(active_ct, '_running_trip', None) or active_ct.trajet
    bus = trip.bus if trip else (active_ct.bus)
    last_gps = GPSPosition.objects.filter(bus=bus).order_by('-timestamp').first() if bus else None
    ligne = trip.ligne if trip else active_ct.ligne
    stops = []
    if ligne:
        stops = [{'nom': s.nom, 'latitude': float(s.latitude), 'longitude': float(s.longitude), 'ordre': s.ordre}
                 for s in ligne.stops.order_by('ordre') if s.latitude and s.longitude]

    return Response({
        'active': True,
        'ticket_id': str(active_ct.id),
        'montant_paye': str(active_ct.montant_paye),
        'methode_paiement': active_ct.methode_paiement,
        'ligne': {'code': ligne.code, 'nom': ligne.nom, 'couleur': ligne.couleur_ligne, 'terminus_depart': ligne.terminus_depart, 'terminus_arrivee': ligne.terminus_arrivee} if ligne else None,
        'bus': {'numero_bus': bus.numero_bus, 'capacite': bus.capacite} if bus else None,
        'chauffeur': f"{trip.driver.prenom} {trip.driver.nom}" if trip and trip.driver else None,
        'trip': {'id': str(trip.id), 'statut': trip.statut, 'date_debut': trip.date_debut, 'nombre_passagers': trip.nombre_passagers} if trip else None,
        'gps': {'latitude': last_gps.latitude, 'longitude': last_gps.longitude, 'vitesse_kmh': last_gps.vitesse_kmh, 'timestamp': last_gps.timestamp} if last_gps else None,
        'stops': stops,
    })


# ─── TICKET ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_get_ticket(request, ticket_id):
    """Return ticket data for QR code display."""
    citizen = request.user
    try:
        ct = CitizenTrip.objects.select_related('ligne', 'bus').get(id=ticket_id, citoyen=citizen)
    except CitizenTrip.DoesNotExist:
        return Response({'detail': 'Ticket introuvable'}, status=404)

    # Check if already rated
    has_rated = DriverRating.objects.filter(citizen_trip=ct).exists()

    return Response({
        'id': str(ct.id),
        'ticket_code': str(ct.ticket_code),
        'statut': ct.statut,
        'montant_paye': str(ct.montant_paye),
        'methode_paiement': ct.methode_paiement,
        'date_paiement': ct.date_paiement,
        'date_utilisation': ct.date_utilisation,
        'has_rated': has_rated,
        'ligne': {
            'id': str(ct.ligne.id),
            'code': ct.ligne.code,
            'nom': ct.ligne.nom,
            'terminus_depart': ct.ligne.terminus_depart,
            'terminus_arrivee': ct.ligne.terminus_arrivee,
            'couleur': ct.ligne.couleur_ligne,
        } if ct.ligne else None,
        'bus': {
            'id': str(ct.bus.id),
            'numero_bus': ct.bus.numero_bus,
            'chauffeur_id': str(ct.bus.chauffeur.id) if ct.bus.chauffeur else None,
            'chauffeur_nom': f"{ct.bus.chauffeur.prenom} {ct.bus.chauffeur.nom}" if ct.bus.chauffeur else None,
        } if ct.bus else None,
    })


@api_view(['POST'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_rate_driver(request):
    """Citizen rates a driver after a trip."""
    citizen = request.user
    ticket_id = request.data.get('ticket_id')
    chauffeur_id = request.data.get('chauffeur_id')
    note = request.data.get('note', 5)
    commentaire = request.data.get('commentaire', '')

    try:
        note = int(note)
        if note < 1 or note > 5:
            raise ValueError
    except (ValueError, TypeError):
        return Response({'detail': 'Note invalide (1-5)'}, status=400)

    ct = None
    if ticket_id:
        try:
            ct = CitizenTrip.objects.get(id=ticket_id, citoyen=citizen)
            # Check for duplicate
            if DriverRating.objects.filter(citizen_trip=ct).exists():
                return Response({'detail': 'Vous avez déjà noté ce trajet'}, status=400)
            if not chauffeur_id and ct.bus and ct.bus.chauffeur:
                chauffeur_id = str(ct.bus.chauffeur.id)
        except CitizenTrip.DoesNotExist:
            return Response({'detail': 'Ticket introuvable'}, status=404)

    if not chauffeur_id:
        return Response({'detail': 'chauffeur_id requis'}, status=400)

    from core.models import Driver
    try:
        chauffeur = Driver.objects.get(id=chauffeur_id)
    except Driver.DoesNotExist:
        return Response({'detail': 'Chauffeur introuvable'}, status=404)

    rating = DriverRating.objects.create(
        citoyen=citizen,
        chauffeur=chauffeur,
        citizen_trip=ct,
        note=note,
        commentaire=commentaire,
    )
    return Response({'detail': 'Avis envoyé, merci !', 'rating_id': str(rating.id)}, status=201)


@api_view(['POST'])
@authentication_classes([CitizenJWTAuthentication])
@permission_classes([IsAuthenticated])
def citizen_register_push_token(request):
    """Save Expo push notification token for the citizen."""
    token = request.data.get('token', '').strip()
    if not token:
        return Response({'detail': 'token requis'}, status=400)
    citizen = request.user
    citizen.push_token = token
    citizen.save(update_fields=['push_token'])
    return Response({'detail': 'Token enregistré'})


# ─── ADMIN — Validate recharge ────────────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_validate_recharge(request, pk):
    """Admin validates or refuses a wallet recharge request."""
    try:
        tx = WalletTransaction.objects.get(id=pk, type_transaction='RECHARGE')
    except WalletTransaction.DoesNotExist:
        return Response({'detail': 'Transaction introuvable'}, status=404)

    action = request.data.get('action')  # 'VALIDE' or 'REFUSE'
    if action not in ['VALIDE', 'REFUSE']:
        return Response({'detail': 'action doit être VALIDE ou REFUSE'}, status=400)

    with db_transaction.atomic():
        tx.statut = action
        tx.date_validation = timezone.now()
        tx.valide_par = request.user.matricule if (request.user and hasattr(request.user, 'matricule')) else ''
        # Use update_fields to avoid re-saving ImageField (photo_bankily) which can cause issues
        tx.save(update_fields=['statut', 'date_validation', 'valide_par'])

        if action == 'VALIDE':
            from decimal import Decimal
            wallet, _ = WalletCitizen.objects.get_or_create(citoyen=tx.citoyen)
            wallet.balance = wallet.balance + Decimal(str(tx.montant))
            wallet.save(update_fields=['balance', 'date_mise_a_jour'])

    return Response({
        'detail': f'Recharge validée avec succès — {float(tx.montant):.0f} MRU crédités',
        'nouveau_solde': str(WalletCitizen.objects.get(citoyen=tx.citoyen).balance),
    })
