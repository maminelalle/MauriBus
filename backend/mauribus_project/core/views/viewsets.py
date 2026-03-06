"""
DRF ViewSets for MauriBus API
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from core.models import Admin, Driver, Bus, Line, Trip, Payment, Report, Notification, SystemAlert
from core.serializers import (
    AdminSerializer, AdminCreateSerializer,
    DriverSerializer, DriverDetailSerializer,
    BusSerializer, BusDetailSerializer,
    LineSerializer, LineDetailSerializer,
    TripSerializer, TripDetailSerializer,
    PaymentSerializer, PaymentDetailSerializer,
    ReportSerializer, ReportDetailSerializer,
    NotificationSerializer,
    SystemAlertSerializer, GPSPositionSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminViewSet(viewsets.ModelViewSet):
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['matricule', 'nom', 'prenom', 'email']
    filterset_fields = ['role', 'statut']
    ordering_fields = ['date_creation', 'nom']
    ordering = ['-date_creation']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdminCreateSerializer
        return AdminSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if str(instance.id) == str(request.user.id):
            return Response(
                {'detail': 'Vous ne pouvez pas supprimer votre propre compte.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        admin = self.get_object()
        if str(admin.id) == str(request.user.id):
            return Response(
                {'detail': 'Vous ne pouvez pas suspendre votre propre compte.'},
                status=status.HTTP_403_FORBIDDEN
            )
        admin.statut = 'SUSPENDU'
        admin.save(update_fields=['statut'])
        return Response({'detail': 'Administrateur suspendu'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        admin = self.get_object()
        admin.statut = 'ACTIF'
        admin.save(update_fields=['statut'])
        return Response({'detail': 'Administrateur activé'})


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['matricule', 'nom', 'prenom', 'telephone']
    filterset_fields = ['statut', 'is_online']
    ordering_fields = ['date_embauche', 'nom']
    ordering = ['-date_embauche']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update', 'retrieve']:
            return DriverDetailSerializer
        return DriverSerializer

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        driver = self.get_object()
        driver.statut = 'SUSPENDU'
        driver.is_online = False
        driver.save(update_fields=['statut', 'is_online'])
        return Response({'detail': 'Chauffeur suspendu'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        driver = self.get_object()
        driver.statut = 'ACTIF'
        driver.save(update_fields=['statut'])
        return Response({'detail': 'Chauffeur activé'})


class BusViewSet(viewsets.ModelViewSet):
    queryset = Bus.objects.select_related('chauffeur').prefetch_related('lignes').all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero_bus', 'plaque', 'numero_bankily']
    filterset_fields = ['statut', 'marque']
    ordering = ['numero_bus']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update', 'retrieve']:
            return BusDetailSerializer
        return BusSerializer


class LineViewSet(viewsets.ModelViewSet):
    queryset = Line.objects.all()
    serializer_class = LineSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'nom']
    ordering = ['nom']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LineDetailSerializer
        return LineSerializer

    @action(detail=True, methods=['get'])
    def stops(self, request, pk=None):
        from core.serializers import StopSerializer
        line = self.get_object()
        stops = line.stops.all().order_by('ordre')
        serializer = StopSerializer(stops, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_bus(self, request, pk=None):
        line = self.get_object()
        bus_id = request.data.get('bus_id')
        try:
            bus = Bus.objects.get(id=bus_id)
            line.buses.add(bus)
            return Response({'detail': 'Bus assigné à la ligne'})
        except Bus.DoesNotExist:
            return Response({'detail': 'Bus introuvable'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def remove_bus(self, request, pk=None):
        line = self.get_object()
        bus_id = request.data.get('bus_id')
        try:
            bus = Bus.objects.get(id=bus_id)
            line.buses.remove(bus)
            return Response({'detail': 'Bus retiré de la ligne'})
        except Bus.DoesNotExist:
            return Response({'detail': 'Bus introuvable'}, status=status.HTTP_404_NOT_FOUND)


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.select_related('bus', 'driver', 'ligne').all()
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['statut', 'bus', 'driver', 'ligne']
    ordering = ['-date_debut']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TripDetailSerializer
        return TripSerializer

    @action(detail=True, methods=['get'])
    def positions(self, request, pk=None):
        trip = self.get_object()
        positions = trip.positions.filter(is_valide=True).order_by('-timestamp')[:100]
        serializer = GPSPositionSerializer(positions, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('chauffeur').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['statut', 'type_paiement', 'chauffeur']
    ordering = ['-date_creation']

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create']:
            return PaymentDetailSerializer
        return PaymentSerializer

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        payment = self.get_object()
        if payment.statut != 'EN_ATTENTE':
            return Response(
                {'detail': 'Seuls les paiements en attente peuvent être validés'},
                status=status.HTTP_400_BAD_REQUEST
            )
        payment.statut = 'VALIDE'
        payment.date_validation = timezone.now()
        payment.valide_par = request.user.matricule
        payment.save(update_fields=['statut', 'date_validation', 'valide_par'])
        return Response({'detail': 'Paiement validé', 'code_unique': payment.code_unique})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        payment = self.get_object()
        payment.statut = 'REFUSE'
        payment.notes = request.data.get('notes', '')
        payment.save(update_fields=['statut', 'notes'])
        return Response({'detail': 'Paiement refusé'})


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.select_related('chauffeur', 'bus').all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titre', 'description']
    filterset_fields = ['type_signalement', 'priorite', 'statut', 'chauffeur', 'bus']
    ordering = ['-date_creation']

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return ReportDetailSerializer
        return ReportSerializer

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        report = self.get_object()
        report.statut = 'RESOLU'
        report.date_resolution = timezone.now()
        report.traite_par = request.user.matricule
        report.notes_resolution = request.data.get('notes_resolution', '')
        report.save(update_fields=['statut', 'date_resolution', 'traite_par', 'notes_resolution'])
        return Response({'detail': 'Signalement résolu'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        report = self.get_object()
        report.statut = 'REJETE'
        report.traite_par = request.user.matricule
        report.save(update_fields=['statut', 'traite_par'])
        return Response({'detail': 'Signalement rejeté'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        report = self.get_object()
        report.lu = True
        report.save(update_fields=['lu'])
        return Response({'detail': 'Signalement marqué comme lu'})

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        report = self.get_object()
        reponse = request.data.get('reponse', '').strip()
        if not reponse:
            return Response({'detail': 'La réponse ne peut pas être vide.'}, status=status.HTTP_400_BAD_REQUEST)
        report.reponse_admin = reponse
        report.lu = True
        if report.statut == 'NOUVEAU':
            report.statut = 'EN_COURS'
        report.traite_par = request.user.matricule
        report.save(update_fields=['reponse_admin', 'lu', 'statut', 'traite_par'])
        return Response({'detail': 'Réponse envoyée'})


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related('destinataire').all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type_notification', 'destinataire']
    ordering = ['-date_creation']

    def perform_create(self, serializer):
        serializer.save(envoye_par=self.request.user.matricule)


class SystemAlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SystemAlert.objects.select_related('bus', 'chauffeur').filter(est_actif=True)
    serializer_class = SystemAlertSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type_alerte', 'bus']
    ordering = ['-date_creation']

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.est_actif = False
        alert.date_resolution = timezone.now()
        alert.save(update_fields=['est_actif', 'date_resolution'])
        return Response({'detail': 'Alerte résolue'})
