"""
Statistics Views - Tableau de bord et statistiques
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from core.models import Bus, Driver, Trip, Payment, Report, SystemAlert, Line


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Statistiques principales du dashboard
    """
    now = timezone.now()
    today = now.date()

    active_buses = Bus.objects.filter(statut='ACTIF').count()
    online_drivers = Driver.objects.filter(is_online=True, statut='ACTIF').count()
    active_trips = Trip.objects.filter(statut='EN_COURS').count()
    pending_alerts = SystemAlert.objects.filter(est_actif=True).count()
    pending_payments = Payment.objects.filter(statut='EN_ATTENTE').count()
    new_reports = Report.objects.filter(statut='NOUVEAU').count()
    total_revenue_today = Payment.objects.filter(
        statut='VALIDE',
        date_validation__date=today
    ).aggregate(total=Sum('montant'))['total'] or 0

    # Trajets des 7 derniers jours
    daily_trips = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = Trip.objects.filter(date_debut__date=day).count()
        revenue = Payment.objects.filter(
            statut='VALIDE',
            date_validation__date=day
        ).aggregate(total=Sum('montant'))['total'] or 0
        daily_trips.append({
            'date': day.strftime('%d/%m'),
            'trips': count,
            'revenue': float(revenue),
        })

    return Response({
        'active_buses': active_buses,
        'online_drivers': online_drivers,
        'active_trips': active_trips,
        'pending_alerts': pending_alerts,
        'pending_payments': pending_payments,
        'new_reports': new_reports,
        'revenue_today': float(total_revenue_today),
        'daily_trips': daily_trips,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_stats(request):
    """
    Statistiques de revenus
    """
    period = request.query_params.get('period', '7d')
    today = timezone.now().date()

    if period == '30d':
        days = 30
    elif period == '90d':
        days = 90
    else:
        days = 7

    data = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        revenue = Payment.objects.filter(
            statut='VALIDE',
            date_validation__date=day
        ).aggregate(total=Sum('montant'))['total'] or 0
        data.append({
            'date': day.strftime('%d/%m'),
            'revenue': float(revenue),
        })

    total = Payment.objects.filter(
        statut='VALIDE',
        date_validation__date__gte=today - timedelta(days=days)
    ).aggregate(total=Sum('montant'))['total'] or 0

    return Response({'data': data, 'total': float(total)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def driver_stats(request):
    """
    Statistiques par chauffeur
    """
    drivers = Driver.objects.filter(statut='ACTIF').annotate(
        total_trips=Count('trips'),
        total_revenue=Sum('paiements__montant'),
    ).order_by('-total_trips')[:10]

    data = []
    for d in drivers:
        data.append({
            'matricule': d.matricule,
            'nom': f"{d.prenom} {d.nom}",
            'total_trips': d.total_trips,
            'total_revenue': float(d.total_revenue or 0),
            'is_online': d.is_online,
        })

    return Response({'drivers': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def line_stats(request):
    """
    Statistiques par ligne
    """
    lines = Line.objects.filter(statut='ACTIVE').annotate(
        total_trips=Count('trips'),
        nombre_bus=Count('buses'),
    ).order_by('-total_trips')

    data = []
    for line in lines:
        data.append({
            'id': str(line.id),
            'nom': line.nom,
            'code': line.code,
            'total_trips': line.total_trips,
            'nombre_bus': line.nombre_bus,
            'couleur': line.couleur_ligne,
        })

    return Response({'lines': data})
