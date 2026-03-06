from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from core.models import (
    Admin, Driver, Bus, Line, Stop, Trip, GPSPosition,
    Payment, PaymentAlert, Report, Notification, SystemAlert
)


class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = [
            'id', 'matricule', 'nom', 'prenom', 'email',
            'telephone', 'nni', 'role', 'statut', 'photo',
            'date_creation', 'derniere_connexion'
        ]
        read_only_fields = ['id', 'matricule', 'date_creation']


class AdminCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Admin
        fields = ['id', 'matricule', 'nom', 'prenom', 'email',
                  'telephone', 'nni', 'role', 'statut', 'password']
        read_only_fields = ['id', 'matricule']

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['matricule'] = Admin.generate_matricule()
        validated_data['password'] = make_password(password)
        return Admin.objects.create(**validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            validated_data['password'] = make_password(password)
        return super().update(instance, validated_data)


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = [
            'id', 'matricule', 'nom', 'prenom', 'email',
            'telephone', 'statut', 'date_embauche',
            'is_online', 'derniere_connexion'
        ]
        read_only_fields = ['id', 'matricule', 'date_embauche']


class DriverDetailSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, required=False)

    class Meta:
        model = Driver
        fields = [
            'id', 'matricule', 'nom', 'prenom', 'email',
            'telephone', 'nni', 'photo', 'adresse',
            'numero_permis', 'date_expiration_permis',
            'statut', 'date_embauche', 'is_online',
            'derniere_connexion', 'password'
        ]
        read_only_fields = ['id', 'matricule', 'date_embauche']

    def create(self, validated_data):
        password = validated_data.pop('password', 'mauribus123')
        validated_data['matricule'] = Driver.generate_matricule()
        validated_data['password'] = make_password(password)
        return Driver.objects.create(**validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            validated_data['password'] = make_password(password)
        return super().update(instance, validated_data)


class BusSerializer(serializers.ModelSerializer):
    chauffeur_nom = serializers.SerializerMethodField(read_only=True)
    lignes_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Bus
        fields = [
            'id', 'numero_bus', 'plaque', 'numero_bankily',
            'capacite', 'places_disponibles', 'statut',
            'est_plein', 'marque', 'modele', 'chauffeur',
            'lignes', 'chauffeur_nom', 'lignes_info'
        ]
        read_only_fields = ['id', 'places_disponibles', 'est_plein', 'lignes']

    def get_chauffeur_nom(self, obj):
        return f"{obj.chauffeur.prenom} {obj.chauffeur.nom}" if obj.chauffeur else None

    def get_lignes_info(self, obj):
        return [
            {'id': str(l.id), 'code': l.code, 'nom': l.nom, 'couleur': l.couleur_ligne}
            for l in obj.lignes.all()
        ]


class BusDetailSerializer(BusSerializer):
    class Meta(BusSerializer.Meta):
        fields = BusSerializer.Meta.fields + [
            'description', 'annee_fabrication',
            'date_derniere_maintenance', 'date_creation'
        ]


class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = [
            'id', 'nom', 'adresse', 'latitude', 'longitude',
            'ordre', 'temps_arrivee_estimee', 'distance_precedent_km'
        ]
        read_only_fields = ['id']


class LineSerializer(serializers.ModelSerializer):
    nombre_bus = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Line
        fields = [
            'id', 'nom', 'code', 'heure_depart', 'heure_fin',
            'frequence_minutes', 'statut', 'couleur_ligne',
            'terminus_depart', 'terminus_arrivee', 'tarif_base',
            'nombre_bus'
        ]
        read_only_fields = ['id']

    def get_nombre_bus(self, obj):
        return obj.buses.filter(statut='ACTIF').count()


class LineDetailSerializer(LineSerializer):
    stops = StopSerializer(many=True, read_only=True)

    class Meta(LineSerializer.Meta):
        fields = LineSerializer.Meta.fields + [
            'description', 'distance_totale_km', 'stops', 'date_creation'
        ]


class TripSerializer(serializers.ModelSerializer):
    bus_numero = serializers.SerializerMethodField(read_only=True)
    driver_nom = serializers.SerializerMethodField(read_only=True)
    ligne_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'bus', 'driver', 'ligne', 'statut',
            'date_planifiee', 'date_debut', 'date_fin', 'nombre_passagers',
            'revenus', 'distance_reelle_km',
            'bus_numero', 'driver_nom', 'ligne_nom'
        ]
        read_only_fields = ['id', 'date_debut']

    def get_bus_numero(self, obj):
        return obj.bus.numero_bus if obj.bus else None

    def get_driver_nom(self, obj):
        return f"{obj.driver.prenom} {obj.driver.nom}" if obj.driver else None

    def get_ligne_nom(self, obj):
        return obj.ligne.nom if obj.ligne else None


class TripDetailSerializer(TripSerializer):
    class Meta(TripSerializer.Meta):
        fields = TripSerializer.Meta.fields + [
            'heure_arrivee_estimee', 'duree_reelle_secondes', 'incidents', 'notes'
        ]


class GPSPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GPSPosition
        fields = [
            'id', 'bus', 'trajet', 'latitude', 'longitude',
            'vitesse_kmh', 'direction_degres', 'timestamp', 'is_valide'
        ]
        read_only_fields = ['id', 'timestamp']


class PaymentSerializer(serializers.ModelSerializer):
    chauffeur_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'chauffeur', 'montant', 'type_paiement', 'statut',
            'code_unique', 'date_creation', 'date_validation', 'chauffeur_nom'
        ]
        read_only_fields = ['id', 'code_unique', 'date_creation']

    def get_chauffeur_nom(self, obj):
        return f"{obj.chauffeur.prenom} {obj.chauffeur.nom}" if obj.chauffeur else None


class PaymentDetailSerializer(PaymentSerializer):
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + [
            'photo_capture', 'reference_bankily', 'valide_par', 'notes', 'trajet'
        ]


class PaymentAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAlert
        fields = ['id', 'paiement', 'type_alerte', 'description', 'date_creation', 'resolue']
        read_only_fields = ['id', 'date_creation']


class ReportSerializer(serializers.ModelSerializer):
    chauffeur_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'chauffeur', 'bus', 'type_signalement', 'titre',
            'statut', 'priorite', 'date_creation', 'date_resolution',
            'chauffeur_nom', 'lu', 'reponse_admin'
        ]
        read_only_fields = ['id', 'date_creation']

    def get_chauffeur_nom(self, obj):
        return f"{obj.chauffeur.prenom} {obj.chauffeur.nom}" if obj.chauffeur else None


class ReportDetailSerializer(ReportSerializer):
    class Meta(ReportSerializer.Meta):
        fields = ReportSerializer.Meta.fields + [
            'description', 'latitude', 'longitude',
            'photo1', 'photo2', 'traite_par', 'notes_resolution'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    destinataire_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'titre', 'message', 'type_notification',
            'destinataire', 'envoye_par', 'date_creation', 'destinataire_nom'
        ]
        read_only_fields = ['id', 'date_creation']

    def get_destinataire_nom(self, obj):
        if obj.destinataire:
            return f"{obj.destinataire.prenom} {obj.destinataire.nom}"
        return None


class SystemAlertSerializer(serializers.ModelSerializer):
    bus_numero = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SystemAlert
        fields = [
            'id', 'type_alerte', 'description', 'bus', 'chauffeur',
            'est_actif', 'date_creation', 'notifie_admin', 'bus_numero'
        ]
        read_only_fields = ['id', 'date_creation']

    def get_bus_numero(self, obj):
        return obj.bus.numero_bus if obj.bus else None
