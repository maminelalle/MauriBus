"""
Admin extra views — Citizens, Wallet recharges, Driver payments, Live map
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.db import transaction as db_transaction
from core.models import (
    CitizenUser, WalletCitizen, WalletDriver, WalletTransaction,
    Driver, Bus, Trip, GPSPosition, Notification,
    AppWallet, AppTransaction, SystemAlert, DriverRating,
)


# ─── Citizens ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_citizens_list(request):
    """List all citizens with wallet balance."""
    citizens = CitizenUser.objects.all().order_by('-date_creation')
    data = []
    for c in citizens:
        wallet = getattr(c, 'wallet', None)
        data.append({
            'id': str(c.id),
            'telephone': c.telephone,
            'nom': c.nom,
            'prenom': c.prenom,
            'email': c.email or '',
            'nni': c.nni or '',
            'statut': c.statut,
            'wallet_balance': float(wallet.balance) if wallet else 0,
            'date_creation': c.date_creation,
            'derniere_connexion': c.derniere_connexion,
        })
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_citizen_suspend(request, pk):
    """Suspend a citizen account."""
    try:
        citizen = CitizenUser.objects.get(id=pk)
    except CitizenUser.DoesNotExist:
        return Response({'detail': 'Citoyen introuvable'}, status=404)
    citizen.statut = 'SUSPENDU'
    citizen.save()
    return Response({'detail': 'Compte suspendu'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_citizen_activate(request, pk):
    """Activate a citizen account."""
    try:
        citizen = CitizenUser.objects.get(id=pk)
    except CitizenUser.DoesNotExist:
        return Response({'detail': 'Citoyen introuvable'}, status=404)
    citizen.statut = 'ACTIF'
    citizen.save()
    return Response({'detail': 'Compte activé'})


# ─── Wallet Recharges ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_wallet_recharges_list(request):
    """List wallet recharge requests with filters."""
    statut_filter = request.query_params.get('statut', '')
    qs = WalletTransaction.objects.filter(
        type_transaction='RECHARGE'
    ).select_related('citoyen').order_by('-date_creation')

    if statut_filter:
        qs = qs.filter(statut=statut_filter)

    data = [{
        'id': str(t.id),
        'citoyen_id': str(t.citoyen.id),
        'citoyen_nom': f"{t.citoyen.prenom} {t.citoyen.nom}",
        'citoyen_telephone': t.citoyen.telephone,
        'montant': float(t.montant),
        'statut': t.statut,
        'reference_bankily': t.reference_bankily or '',
        'photo_bankily': t.photo_bankily or '',
        'date_creation': t.date_creation,
        'date_validation': t.date_validation,
        'valide_par': t.valide_par or '',
    } for t in qs]

    # Stats
    total_en_attente = qs.filter(statut='EN_ATTENTE').aggregate(s=Sum('montant'))['s'] or 0
    total_valide = qs.filter(statut='VALIDE').aggregate(s=Sum('montant'))['s'] or 0

    return Response({
        'transactions': data,
        'stats': {
            'en_attente': qs.filter(statut='EN_ATTENTE').count(),
            'valide': qs.filter(statut='VALIDE').count(),
            'refuse': qs.filter(statut='REFUSE').count(),
            'montant_en_attente': float(total_en_attente),
            'montant_valide': float(total_valide),
        }
    })


# ─── Driver Payments ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_driver_wallets_list(request):
    """List all driver wallets."""
    drivers = Driver.objects.filter(statut__in=['ACTIF', 'CONGE']).order_by('nom')
    data = []
    for d in drivers:
        wallet = getattr(d, 'wallet', None)
        data.append({
            'id': str(d.id),
            'matricule': d.matricule,
            'nom': f"{d.prenom} {d.nom}",
            'telephone': d.telephone,
            'is_online': d.is_online,
            'wallet_balance': float(wallet.balance) if wallet else 0,
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_driver_pay(request, pk):
    """Pay a driver — deduct from AppWallet, credit WalletDriver, record AppTransaction."""
    try:
        driver = Driver.objects.get(id=pk)
    except Driver.DoesNotExist:
        return Response({'detail': 'Chauffeur introuvable'}, status=404)

    montant = request.data.get('montant')
    description = request.data.get('description', 'Paiement chauffeur')

    if not montant or float(montant) <= 0:
        return Response({'detail': 'Montant invalide'}, status=400)

    montant = float(montant)
    admin = request.user
    admin_name = getattr(admin, 'matricule', 'Admin')

    with db_transaction.atomic():
        app_wallet = AppWallet.get()
        if float(app_wallet.balance) < montant:
            return Response({
                'detail': f'Solde insuffisant dans le wallet MauriBus ({float(app_wallet.balance):.0f} MRU disponible)'
            }, status=400)

        solde_avant = float(app_wallet.balance)
        app_wallet.balance = float(app_wallet.balance) - montant
        app_wallet.save()

        # Credit driver wallet
        driver_wallet, _ = WalletDriver.objects.get_or_create(chauffeur=driver)
        driver_wallet.balance = float(driver_wallet.balance) + montant
        driver_wallet.save()

        # Record the transaction
        AppTransaction.objects.create(
            type_transaction='PAIEMENT_CHAUFFEUR',
            montant=montant,
            description=description or f'Paiement à {driver.prenom} {driver.nom}',
            chauffeur=driver,
            effectue_par=admin_name,
            solde_avant=solde_avant,
            solde_apres=float(app_wallet.balance),
        )

    return Response({
        'detail': f'{montant:.0f} MRU envoyé au chauffeur {driver.prenom} {driver.nom}',
        'nouveau_solde_driver': float(driver_wallet.balance),
        'nouveau_solde_app': float(app_wallet.balance),
        'montant': montant,
    }, status=status.HTTP_201_CREATED)


# ─── Financial Stats ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_financial_stats(request):
    """Global financial statistics."""
    from core.models import Payment

    total_wallet_recharges = WalletTransaction.objects.filter(
        type_transaction='RECHARGE', statut='VALIDE'
    ).aggregate(s=Sum('montant'))['s'] or 0

    total_wallet_payments = WalletTransaction.objects.filter(
        type_transaction='PAIEMENT'
    ).aggregate(s=Sum('montant'))['s'] or 0

    pending_recharges_count = WalletTransaction.objects.filter(
        type_transaction='RECHARGE', statut='EN_ATTENTE'
    ).count()

    pending_recharges_amount = WalletTransaction.objects.filter(
        type_transaction='RECHARGE', statut='EN_ATTENTE'
    ).aggregate(s=Sum('montant'))['s'] or 0

    total_driver_wallets = WalletDriver.objects.aggregate(s=Sum('balance'))['s'] or 0
    total_citizen_wallets = WalletCitizen.objects.aggregate(s=Sum('balance'))['s'] or 0

    commission_mauribus = float(total_wallet_payments) * 0.15

    return Response({
        'total_recharges_valides': float(total_wallet_recharges),
        'total_paiements_trajets': float(total_wallet_payments),
        'commission_mauribus': round(commission_mauribus, 2),
        'total_wallets_citoyens': float(total_citizen_wallets),
        'total_wallets_chauffeurs': float(total_driver_wallets),
        'recharges_en_attente_count': pending_recharges_count,
        'recharges_en_attente_montant': float(pending_recharges_amount),
    })


# ─── Live Map Data ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_live_map(request):
    """Live bus + driver positions for admin dashboard map.
    Includes: ACTIF buses + buses assigned to online drivers.
    """
    from django.db.models import Q
    # Show active buses OR buses whose driver is online
    buses = Bus.objects.filter(
        Q(statut='ACTIF') | Q(chauffeur__is_online=True)
    ).distinct().prefetch_related(
        'lignes', 'positions'
    ).select_related('chauffeur')

    active_trips = Trip.objects.filter(
        statut='EN_COURS'
    ).select_related('driver', 'bus', 'ligne').prefetch_related('ligne__stops')

    trips_by_bus = {str(t.bus_id): t for t in active_trips if t.bus_id}
    trips_by_driver = {str(t.driver_id): t for t in active_trips if t.driver_id}

    data = []
    for b in buses:
        # Last GPS position — also check by driver's recent positions if no bus GPS
        last_gps = b.positions.order_by('-timestamp').first()

        # If no bus GPS, try to find recent GPS via active trip
        if not last_gps and b.chauffeur:
            from core.models import GPSPosition as GPS
            driver_trip = trips_by_driver.get(str(b.chauffeur.id))
            if driver_trip:
                last_gps = GPS.objects.filter(trajet=driver_trip).order_by('-timestamp').first()

        trip = trips_by_bus.get(str(b.id))
        if not trip and b.chauffeur:
            trip = trips_by_driver.get(str(b.chauffeur.id))

        # Build route from the line (show even without active trip)
        route_coords = []
        ligne_source = (trip.ligne if trip and trip.ligne else None) or (b.lignes.first())
        if ligne_source:
            route_coords = [
                {'latitude': float(s.latitude), 'longitude': float(s.longitude)}
                for s in ligne_source.stops.order_by('ordre')
                if s.latitude and s.longitude
            ]

        lignes = b.lignes.all()
        line_color = lignes[0].couleur_ligne if lignes else '#3B82F6'
        line_nom = lignes[0].nom if lignes else ''
        line_code = lignes[0].code if lignes else ''

        entry = {
            'id': str(b.id),
            'numero_bus': b.numero_bus,
            'plaque': b.plaque,
            'line_color': line_color,
            'line_nom': line_nom,
            'line_code': line_code,
            'chauffeur': f"{b.chauffeur.prenom} {b.chauffeur.nom}" if b.chauffeur else None,
            'chauffeur_id': str(b.chauffeur.id) if b.chauffeur else None,
            'is_online': b.chauffeur.is_online if b.chauffeur else False,
            'trip': None,
            'gps': None,
            'route_coords': route_coords,
        }

        if last_gps:
            entry['gps'] = {
                'latitude': float(last_gps.latitude),
                'longitude': float(last_gps.longitude),
                'vitesse_kmh': float(last_gps.vitesse_kmh or 0),
                'timestamp': last_gps.timestamp,
            }

        if trip:
            entry['trip'] = {
                'id': str(trip.id),
                'statut': trip.statut,
                'date_debut': trip.date_debut,
                'nombre_passagers': trip.nombre_passagers,
            }

        data.append(entry)

    return Response(data)


# ─── Notifications to Citizens ────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_send_notification(request):
    """Send notification to drivers, citizens, or all."""
    titre = request.data.get('titre', '').strip()
    message = request.data.get('message', '').strip()
    cible = request.data.get('cible', 'CHAUFFEURS')  # CHAUFFEURS | CITOYENS | TOUS | INDIVIDUEL_CHAUFFEUR
    destinataire_id = request.data.get('destinataire_id')

    if not titre or not message:
        return Response({'detail': 'Titre et message requis'}, status=400)

    admin = request.user
    envoye_par = getattr(admin, 'matricule', 'Admin')

    created = []

    if cible == 'INDIVIDUEL_CHAUFFEUR' and destinataire_id:
        try:
            driver = Driver.objects.get(id=destinataire_id)
            n = Notification.objects.create(
                titre=titre,
                message=message,
                type_notification='INDIVIDUEL',
                destinataire=driver,
                envoye_par=envoye_par,
            )
            created.append(str(n.id))
        except Driver.DoesNotExist:
            return Response({'detail': 'Chauffeur introuvable'}, status=404)

    elif cible in ('CHAUFFEURS', 'TOUS'):
        n = Notification.objects.create(
            titre=titre,
            message=message,
            type_notification='BROADCAST',
            envoye_par=envoye_par,
        )
        created.append(str(n.id))

    if cible in ('CITOYENS', 'TOUS'):
        # Store citizen notifications in WalletTransaction description — use Notification with type BROADCAST
        # For now, create a separate broadcast notification tagged CITOYEN
        n = Notification.objects.create(
            titre=titre,
            message=message,
            type_notification='BROADCAST',
            envoye_par=f"{envoye_par}_CITOYENS",
        )
        created.append(str(n.id))

    return Response({
        'detail': f'Notification envoyée ({len(created)} créée(s))',
        'ids': created,
    }, status=status.HTTP_201_CREATED)


# ─── MauriBus App Wallet ──────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_app_wallet(request):
    """Return AppWallet balance + recent transaction history + stats."""
    wallet = AppWallet.get()
    txs = AppTransaction.objects.all().select_related('chauffeur').order_by('-date_creation')[:50]

    total_commissions = AppTransaction.objects.filter(
        type_transaction='COMMISSION'
    ).aggregate(s=Sum('montant'))['s'] or 0

    total_paiements = AppTransaction.objects.filter(
        type_transaction='PAIEMENT_CHAUFFEUR'
    ).aggregate(s=Sum('montant'))['s'] or 0

    total_recharges = AppTransaction.objects.filter(
        type_transaction='RECHARGE_BANQUE'
    ).aggregate(s=Sum('montant'))['s'] or 0

    data = [{
        'id': str(t.id),
        'type_transaction': t.type_transaction,
        'montant': float(t.montant),
        'description': t.description,
        'chauffeur_nom': f"{t.chauffeur.prenom} {t.chauffeur.nom}" if t.chauffeur else None,
        'effectue_par': t.effectue_par,
        'solde_avant': float(t.solde_avant),
        'solde_apres': float(t.solde_apres),
        'date_creation': t.date_creation,
    } for t in txs]

    return Response({
        'balance': float(wallet.balance),
        'transactions': data,
        'stats': {
            'total_commissions': float(total_commissions),
            'total_paiements_chauffeurs': float(total_paiements),
            'total_recharges_banque': float(total_recharges),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_app_wallet_recharge(request):
    """Manually credit AppWallet (bank transfer / deposit)."""
    montant = request.data.get('montant')
    description = request.data.get('description', 'Recharge depuis compte bancaire')

    if not montant or float(montant) <= 0:
        return Response({'detail': 'Montant invalide'}, status=400)

    montant = float(montant)
    admin = request.user
    admin_name = getattr(admin, 'matricule', 'Admin')

    with db_transaction.atomic():
        wallet = AppWallet.get()
        solde_avant = float(wallet.balance)
        wallet.balance = float(wallet.balance) + montant
        wallet.save()

        AppTransaction.objects.create(
            type_transaction='RECHARGE_BANQUE',
            montant=montant,
            description=description,
            effectue_par=admin_name,
            solde_avant=solde_avant,
            solde_apres=float(wallet.balance),
        )

    return Response({
        'detail': f'{montant:.0f} MRU crédité dans le wallet MauriBus',
        'nouveau_solde': float(wallet.balance),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_driver_payments_history(request):
    """History of all payments made to drivers (from AppWallet)."""
    txs = AppTransaction.objects.filter(
        type_transaction='PAIEMENT_CHAUFFEUR'
    ).select_related('chauffeur').order_by('-date_creation')

    data = [{
        'id': str(t.id),
        'montant': float(t.montant),
        'description': t.description,
        'chauffeur_nom': f"{t.chauffeur.prenom} {t.chauffeur.nom}" if t.chauffeur else '—',
        'chauffeur_matricule': t.chauffeur.matricule if t.chauffeur else '—',
        'effectue_par': t.effectue_par,
        'date_creation': t.date_creation,
    } for t in txs]

    total = sum(t['montant'] for t in data)
    return Response({
        'transactions': data,
        'total': total,
        'count': len(data),
    })


# ─── SYSTEM ALERTS ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_system_alerts(request):
    """List system alerts with optional filter."""
    only_active = request.query_params.get('active', 'true').lower() == 'true'
    qs = SystemAlert.objects.select_related('bus', 'chauffeur').order_by('-date_creation')
    if only_active:
        qs = qs.filter(est_actif=True)
    qs = qs[:100]

    data = [{
        'id': str(a.id),
        'type_alerte': a.type_alerte,
        'description': a.description,
        'est_actif': a.est_actif,
        'date_creation': a.date_creation,
        'date_resolution': a.date_resolution,
        'bus': {'numero_bus': a.bus.numero_bus} if a.bus else None,
        'chauffeur': f"{a.chauffeur.prenom} {a.chauffeur.nom}" if a.chauffeur else None,
    } for a in qs]

    return Response({'alerts': data, 'count': len(data)})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_system_alert_resolve(request, pk):
    """Mark a system alert as resolved."""
    try:
        alert = SystemAlert.objects.get(id=pk)
    except SystemAlert.DoesNotExist:
        return Response({'detail': 'Alerte introuvable'}, status=404)

    alert.est_actif = False
    alert.date_resolution = timezone.now()
    alert.save(update_fields=['est_actif', 'date_resolution'])
    return Response({'detail': 'Alerte résolue'})


# ─── DRIVER RATINGS ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_driver_ratings(request):
    """List driver ratings, optionally filtered by driver."""
    driver_id = request.query_params.get('driver_id')
    qs = DriverRating.objects.select_related('citoyen', 'chauffeur', 'citizen_trip').order_by('-date_creation')
    if driver_id:
        qs = qs.filter(chauffeur_id=driver_id)
    qs = qs[:200]

    from django.db.models import Avg
    stats = qs.aggregate(avg=Avg('note'))

    data = [{
        'id': str(r.id),
        'note': r.note,
        'commentaire': r.commentaire,
        'date_creation': r.date_creation,
        'citoyen': f"{r.citoyen.prenom} {r.citoyen.nom}" if r.citoyen else '—',
        'chauffeur': {
            'id': str(r.chauffeur.id),
            'nom': f"{r.chauffeur.prenom} {r.chauffeur.nom}",
            'matricule': r.chauffeur.matricule,
        } if r.chauffeur else None,
    } for r in qs]

    return Response({'ratings': data, 'moyenne': round(stats['avg'] or 0, 2), 'count': len(data)})
