"""
Report Models - Signalements et Incidents
"""
from django.db import models
from django.utils import timezone
import uuid

class Report(models.Model):
    STATUS_CHOICES = [
        ('NOUVEAU', 'Nouveau'),
        ('EN_COURS', 'En Cours'),
        ('RESOLU', 'Résolu'),
        ('REJETE', 'Rejeté'),
    ]
    
    PRIORITY_CHOICES = [
        ('BASSE', 'Basse'),
        ('NORMALE', 'Normale'),
        ('HAUTE', 'Haute'),
        ('CRITIQUE', 'Critique'),
    ]
    
    TYPE_CHOICES = [
        ('ACCIDENT', 'Accident'),
        ('PANNE_MECANIQUE', 'Panne Mécanique'),
        ('INCIDENT_ROUTE', 'Incident Route'),
        ('PLAINTE_PASSAGER', 'Plainte Passager'),
        ('PERTE_OBJET', 'Perte Objet'),
        ('AUTRE', 'Autre'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chauffeur = models.ForeignKey(
        'Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='signalements'
    )
    bus = models.ForeignKey(
        'Bus', on_delete=models.SET_NULL, null=True, blank=True, related_name='signalements'
    )

    type_signalement = models.CharField(max_length=30, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200)
    description = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOUVEAU')
    priorite = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='NORMALE')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    photo1 = models.ImageField(upload_to='reports/', null=True, blank=True)
    photo2 = models.ImageField(upload_to='reports/', null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_resolution = models.DateTimeField(null=True, blank=True)
    traite_par = models.CharField(max_length=100, blank=True)  # Matricule admin
    notes_resolution = models.TextField(blank=True)
    lu = models.BooleanField(default=False)
    reponse_admin = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-priorite', '-date_creation']
        indexes = [
            models.Index(fields=['statut', 'priorite']),
        ]
        verbose_name = 'Signalement'
        verbose_name_plural = 'Signalements'
    
    def __str__(self):
        return f"{self.type_signalement} - {self.titre} ({self.statut})"


class Notification(models.Model):
    """Messages envoyés par l'admin aux chauffeurs"""

    TYPE_CHOICES = [
        ('BROADCAST', 'Tous les chauffeurs'),
        ('INDIVIDUEL', 'Chauffeur spécifique'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre = models.CharField(max_length=200)
    message = models.TextField()
    type_notification = models.CharField(max_length=20, choices=TYPE_CHOICES, default='BROADCAST')
    destinataire = models.ForeignKey(
        'Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications'
    )
    envoye_par = models.CharField(max_length=100, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"{self.titre} ({self.type_notification})"


class SystemAlert(models.Model):
    """Alertes système automatiques"""
    
    ALERT_TYPE_CHOICES = [
        ('BUS_ARRETE_LONGTEMPS', 'Bus Arrêté Trop Longtemps'),
        ('VITESSE_EXCESSIVE', 'Vitesse Excessive'),
        ('GPS_PERDU', 'GPS Perdu'),
        ('CHAUFFEUR_INACTIF', 'Chauffeur Inactif'),
        ('MAINTENANCE_DUE', 'Maintenance Due'),
        ('ANOMALIE_PAIEMENT', 'Anomalie Paiement'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type_alerte = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES)
    bus = models.ForeignKey(
        'Bus', on_delete=models.SET_NULL, null=True, blank=True, related_name='system_alerts'
    )
    chauffeur = models.ForeignKey(
        'Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='system_alerts'
    )

    description = models.TextField()
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_resolution = models.DateTimeField(null=True, blank=True)
    notifie_admin = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Alerte Système'
        verbose_name_plural = 'Alertes Système'
