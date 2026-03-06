from django.contrib import admin
from core.models import (
    Admin, Driver, Bus, Line, Stop, Trip, GPSPosition,
    Payment, PaymentAlert, Report, SystemAlert
)


@admin.register(Admin)
class AdminAdmin(admin.ModelAdmin):
    list_display = ('matricule', 'nom', 'prenom', 'role', 'statut', 'date_creation')
    list_filter = ('role', 'statut', 'date_creation')
    search_fields = ('matricule', 'email', 'nom', 'prenom')
    readonly_fields = ('matricule', 'date_creation', 'derniere_connexion')
    fieldsets = (
        ('Informations', {
            'fields': ('matricule', 'nom', 'prenom', 'email', 'telephone', 'nni')
        }),
        ('Sécurité', {
            'fields': ('role', 'statut', 'password')
        }),
        ('Metadata', {
            'fields': ('date_creation', 'derniere_connexion'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('matricule', 'nom', 'prenom', 'telephone', 'statut', 'is_online')
    list_filter = ('statut', 'is_online', 'date_embauche')
    search_fields = ('matricule', 'email', 'nom', 'prenom')
    readonly_fields = ('matricule', 'date_creation', 'date_embauche')


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('numero_bus', 'plaque', 'statut', 'capacite', 'places_disponibles')
    list_filter = ('statut', 'date_creation')
    search_fields = ('numero_bus', 'plaque', 'numero_bankily')
    readonly_fields = ('date_creation',)


@admin.register(Line)
class LineAdmin(admin.ModelAdmin):
    list_display = ('code', 'nom', 'statut', 'frequence_minutes')
    list_filter = ('statut', 'date_creation')
    search_fields = ('code', 'nom')


@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ('nom', 'ligne', 'ordre', 'latitude', 'longitude')
    list_filter = ('ligne',)
    search_fields = ('nom', 'adresse')


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('id', 'statut', 'date_debut', 'date_fin', 'nombre_passagers')
    list_filter = ('statut', 'date_debut')
    readonly_fields = ('id', 'date_debut')


@admin.register(GPSPosition)
class GPSPositionAdmin(admin.ModelAdmin):
    list_display = ('id', 'latitude', 'longitude', 'vitesse_kmh', 'timestamp')
    list_filter = ('timestamp', 'is_valide')
    readonly_fields = ('timestamp',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('code_unique', 'montant', 'type_paiement', 'statut', 'date_creation')
    list_filter = ('statut', 'type_paiement', 'date_creation')
    search_fields = ('code_unique', 'reference_bankily')
    readonly_fields = ('code_unique', 'date_creation')


@admin.register(PaymentAlert)
class PaymentAlertAdmin(admin.ModelAdmin):
    list_display = ('type_alerte', 'description', 'date_creation', 'resolue')
    list_filter = ('type_alerte', 'resolue', 'date_creation')


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('titre', 'type_signalement', 'priorite', 'statut', 'date_creation')
    list_filter = ('type_signalement', 'priorite', 'statut', 'date_creation')
    search_fields = ('titre', 'description')
    readonly_fields = ('date_creation',)


@admin.register(SystemAlert)
class SystemAlertAdmin(admin.ModelAdmin):
    list_display = ('type_alerte', 'description', 'est_actif', 'date_creation')
    list_filter = ('type_alerte', 'est_actif', 'date_creation')
