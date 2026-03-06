"""
Driver-specific API views (authenticated via DriverJWTAuthentication)
"""
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from core.authentication import DriverJWTAuthentication
from core.models import Trip, GPSPosition, Report, Notification, Bus, CitizenTrip, TripCurrentStop, Stop


@api_view(['POST'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_trip_create(request):
    """Driver starts a new trip (EN_COURS), or starts a planned trip by id."""
    driver = request.user
    bus_id = request.data.get('bus_id')
    ligne_id = request.data.get('ligne_id')
    trip_id = request.data.get('trip_id')  # optional: start a planned trip

    # Auto-close any existing EN_COURS trip for this driver
    Trip.objects.filter(driver=driver, statut='EN_COURS').update(
        statut='COMPLETEE', date_fin=timezone.now()
    )

    # If trip_id provided, start that planned trip
    if trip_id:
        try:
            trip = Trip.objects.get(id=trip_id, driver=driver, statut='PLANIFIEE')
            trip.statut = 'EN_COURS'
            trip.save(update_fields=['statut'])
            return Response({
                'id': str(trip.id),
                'statut': trip.statut,
                'date_debut': trip.date_debut,
                'date_planifiee': trip.date_planifiee,
                'ligne': {'id': str(trip.ligne.id), 'code': trip.ligne.code, 'nom': trip.ligne.nom, 'couleur': trip.ligne.couleur_ligne} if trip.ligne else None,
            }, status=status.HTTP_200_OK)
        except Trip.DoesNotExist:
            return Response({'detail': 'Trajet planifié introuvable'}, status=status.HTTP_404_NOT_FOUND)

    bus = None
    if bus_id:
        try:
            bus = Bus.objects.get(id=bus_id)
        except Bus.DoesNotExist:
            pass

    trip = Trip.objects.create(
        driver=driver,
        bus=bus,
        ligne_id=ligne_id,
        statut='EN_COURS',
    )

    return Response({
        'id': str(trip.id),
        'statut': trip.statut,
        'date_debut': trip.date_debut,
        'date_planifiee': trip.date_planifiee,
        'ligne': {'id': str(trip.ligne.id), 'code': trip.ligne.code, 'nom': trip.ligne.nom, 'couleur': trip.ligne.couleur_ligne} if trip.ligne else None,
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_trip_update(request, pk):
    """Driver updates a trip (pause, resume, end)"""
    driver = request.user
    try:
        trip = Trip.objects.get(id=pk, driver=driver)
    except Trip.DoesNotExist:
        return Response({'detail': 'Trajet introuvable'}, status=status.HTTP_404_NOT_FOUND)

    new_statut = request.data.get('statut')
    if new_statut:
        trip.statut = new_statut
        if new_statut == 'COMPLETEE':
            trip.date_fin = timezone.now()
            if trip.date_debut:
                delta = trip.date_fin - trip.date_debut
                trip.duree_reelle_secondes = int(delta.total_seconds())

    if 'nombre_passagers' in request.data:
        trip.nombre_passagers = request.data['nombre_passagers']
    if 'revenus' in request.data:
        trip.revenus = request.data['revenus']
    if 'distance_reelle_km' in request.data:
        trip.distance_reelle_km = request.data['distance_reelle_km']
    if 'notes' in request.data:
        trip.notes = request.data['notes']

    trip.save()

    return Response({
        'id': str(trip.id),
        'statut': trip.statut,
        'date_debut': trip.date_debut,
        'date_fin': trip.date_fin,
        'duree_reelle_secondes': trip.duree_reelle_secondes,
    })


@api_view(['POST'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_gps_post(request):
    """Driver posts current GPS position. Auto-detects bus from driver if bus_id not provided."""
    driver = request.user
    lat = request.data.get('latitude')
    lon = request.data.get('longitude')

    if lat is None or lon is None:
        return Response({'detail': 'latitude et longitude requis'}, status=status.HTTP_400_BAD_REQUEST)

    trajet_id = request.data.get('trajet_id')
    bus_id = request.data.get('bus_id')

    # Auto-detect bus from driver if not provided
    if not bus_id:
        try:
            bus_id = str(driver.bus_assigne.id)
        except Exception:
            bus_id = None

    # Auto-detect active trip if not provided
    if not trajet_id:
        active_trip = Trip.objects.filter(driver=driver, statut='EN_COURS').first()
        if active_trip:
            trajet_id = str(active_trip.id)

    # Mark driver as online
    driver.is_online = True
    driver.save(update_fields=['is_online'])

    GPSPosition.objects.create(
        latitude=lat,
        longitude=lon,
        altitude=request.data.get('altitude'),
        vitesse_kmh=request.data.get('vitesse_kmh', 0),
        direction_degres=request.data.get('direction_degres'),
        precision=request.data.get('precision'),
        trajet_id=trajet_id,
        bus_id=bus_id,
    )

    return Response({'detail': 'Position enregistrée', 'bus_id': bus_id}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_report_create(request):
    """Driver creates an incident report"""
    driver = request.user

    titre = request.data.get('titre', '').strip()
    description = request.data.get('description', '').strip()
    type_signalement = request.data.get('type_signalement', 'AUTRE')
    priorite = request.data.get('priorite', 'NORMALE')
    bus_id = request.data.get('bus_id')

    if not titre or not description:
        return Response({'detail': 'Titre et description requis'}, status=status.HTTP_400_BAD_REQUEST)

    report = Report.objects.create(
        chauffeur=driver,
        bus_id=bus_id,
        titre=titre,
        description=description,
        type_signalement=type_signalement,
        priorite=priorite,
        statut='NOUVEAU',
    )

    return Response({
        'id': str(report.id),
        'titre': report.titre,
        'statut': report.statut,
        'date_creation': report.date_creation,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_notifications_list(request):
    """Driver fetches broadcast notifications (and individual ones sent to them)"""
    driver = request.user
    from django.db.models import Q
    notifications = Notification.objects.filter(
        Q(type_notification='BROADCAST') | Q(destinataire=driver)
    ).order_by('-date_creation')[:50]

    data = [{
        'id': str(n.id),
        'titre': n.titre,
        'message': n.message,
        'type_notification': n.type_notification,
        'envoye_par': n.envoye_par,
        'date_creation': n.date_creation,
    } for n in notifications]

    return Response(data)


@api_view(['GET'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_trips_list(request):
    """
    Driver fetches their own trips.
    Returns:
      - Active/planned trips for next 14 days
      - History for past 30 days
    Excludes COMPLETEE/ANNULEE trips older than 30 days.
    """
    from datetime import timedelta
    from django.db.models import Q
    driver = request.user
    cutoff = timezone.now() - timedelta(days=30)

    trips = Trip.objects.filter(
        driver=driver
    ).filter(
        Q(statut__in=['EN_COURS', 'PAUSE', 'PLANIFIEE']) |
        Q(statut__in=['COMPLETEE', 'ANNULEE'], date_debut__gte=cutoff)
    ).select_related('ligne', 'bus').order_by('-date_debut')[:100]

    data = [{
        'id': str(t.id),
        'statut': t.statut,
        'date_debut': t.date_debut,
        'date_planifiee': t.date_planifiee,
        'date_fin': t.date_fin,
        'nombre_passagers': t.nombre_passagers,
        'revenus': str(t.revenus),
        'distance_reelle_km': t.distance_reelle_km,
        'duree_reelle_secondes': t.duree_reelle_secondes,
        'ligne': {
            'id': str(t.ligne.id),
            'code': t.ligne.code,
            'nom': t.ligne.nom,
            'couleur': t.ligne.couleur_ligne,
        } if t.ligne else None,
        'bus': {
            'id': str(t.bus.id),
            'numero_bus': t.bus.numero_bus,
        } if t.bus else None,
    } for t in trips]

    return Response(data)


@api_view(['GET'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_payments_list(request):
    """Driver fetches their own payments"""
    from core.models import Payment
    driver = request.user
    payments = Payment.objects.filter(chauffeur=driver).order_by('-date_creation')[:100]

    data = [{
        'id': str(p.id),
        'montant': str(p.montant),
        'statut': p.statut,
        'type_paiement': p.type_paiement,
        'date_creation': p.date_creation,
        'code_unique': p.code_unique,
    } for p in payments]

    return Response(data)


# ─── TICKET VALIDATION ────────────────────────────────────────────────────────

@api_view(['POST'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_validate_ticket(request):
    """Driver scans and validates a citizen's QR ticket."""
    driver = request.user
    ticket_code = request.data.get('ticket_code', '').strip()
    if not ticket_code:
        return Response({'detail': 'ticket_code requis'}, status=400)

    try:
        ct = CitizenTrip.objects.select_related('citoyen', 'ligne', 'bus').get(ticket_code=ticket_code)
    except CitizenTrip.DoesNotExist:
        return Response({'valid': False, 'detail': 'Ticket introuvable ou invalide'}, status=404)

    if ct.statut == 'ANNULE':
        return Response({'valid': False, 'detail': 'Ticket annulé'}, status=400)
    if ct.statut == 'UTILISE':
        return Response({
            'valid': False,
            'detail': f'Ticket déjà utilisé le {ct.date_utilisation.strftime("%d/%m/%Y %H:%M") if ct.date_utilisation else "—"}',
        }, status=400)

    ct.statut = 'UTILISE'
    ct.date_utilisation = timezone.now()
    current_trip = Trip.objects.filter(driver=driver, statut='EN_COURS').first()
    if current_trip and not ct.trajet:
        ct.trajet = current_trip
    ct.save()

    return Response({
        'valid': True,
        'detail': 'Ticket validé avec succès',
        'citoyen': f"{ct.citoyen.prenom} {ct.citoyen.nom}",
        'montant': str(ct.montant_paye),
        'ligne': ct.ligne.nom if ct.ligne else None,
        'methode': ct.methode_paiement,
        'date_paiement': ct.date_paiement,
    })


# ─── STOP PROGRESSION ─────────────────────────────────────────────────────────

@api_view(['GET'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_trip_stops(request, pk):
    """Get all stops for a trip with current position."""
    driver = request.user
    try:
        trip = Trip.objects.get(id=pk, driver=driver)
    except Trip.DoesNotExist:
        return Response({'detail': 'Trajet introuvable'}, status=404)

    stops = []
    if trip.ligne:
        stops = [{
            'id': str(s.id),
            'nom': s.nom,
            'ordre': s.ordre,
            'latitude': float(s.latitude) if s.latitude else None,
            'longitude': float(s.longitude) if s.longitude else None,
        } for s in trip.ligne.stops.order_by('ordre')]

    current_index = 0
    try:
        cs = trip.current_stop
        current_index = cs.stop_index
    except TripCurrentStop.DoesNotExist:
        pass

    return Response({
        'trip_id': str(trip.id),
        'stops': stops,
        'current_index': current_index,
        'total_stops': len(stops),
    })


@api_view(['POST'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_next_stop(request, pk):
    """Driver marks arrival at next stop."""
    driver = request.user
    try:
        trip = Trip.objects.select_related('ligne').get(id=pk, driver=driver, statut='EN_COURS')
    except Trip.DoesNotExist:
        return Response({'detail': 'Trajet actif introuvable'}, status=404)

    stops = list(trip.ligne.stops.order_by('ordre')) if trip.ligne else []
    if not stops:
        return Response({'detail': 'Aucun arrêt sur cette ligne'}, status=400)

    cs, _ = TripCurrentStop.objects.get_or_create(trajet=trip)
    next_index = cs.stop_index + 1

    if next_index >= len(stops):
        return Response({'detail': 'Dernier arrêt atteint', 'current_index': cs.stop_index, 'is_last': True})

    cs.stop_index = next_index
    cs.stop = stops[next_index]
    cs.save()

    return Response({
        'current_index': next_index,
        'total_stops': len(stops),
        'current_stop': {'nom': stops[next_index].nom, 'ordre': stops[next_index].ordre},
        'is_last': next_index >= len(stops) - 1,
    })


# ─── PUSH TOKENS ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@authentication_classes([DriverJWTAuthentication])
@permission_classes([IsAuthenticated])
def driver_register_push_token(request):
    """Save Expo push notification token for the driver."""
    token = request.data.get('token', '').strip()
    if not token:
        return Response({'detail': 'token requis'}, status=400)
    driver = request.user
    driver.push_token = token
    driver.save(update_fields=['push_token'])
    return Response({'detail': 'Token enregistré'})
