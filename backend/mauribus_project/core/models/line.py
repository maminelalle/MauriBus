"""
Line Model - Lignes de Bus
"""
from django.db import models
from django.utils import timezone
import uuid

class Line(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SUSPENDUE', 'Suspendue'),
        ('MAINTENANCE', 'En Maintenance'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, default='')
    heure_depart = models.TimeField(null=True, blank=True)
    heure_fin = models.TimeField(null=True, blank=True)
    frequence_minutes = models.IntegerField(default=15)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    couleur_ligne = models.CharField(max_length=7, default='#3B82F6')
    distance_totale_km = models.FloatField(default=0)
    terminus_depart = models.CharField(max_length=200, blank=True, default='')
    terminus_arrivee = models.CharField(max_length=200, blank=True, default='')
    tarif_base = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['nom']
        verbose_name = 'Ligne'
        verbose_name_plural = 'Lignes'
    
    def __str__(self):
        return f"{self.code} - {self.nom}"


class Stop(models.Model):
    """Arrêts d'une ligne"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ligne = models.ForeignKey(Line, on_delete=models.CASCADE, related_name='stops')
    nom = models.CharField(max_length=100)
    adresse = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    ordre = models.IntegerField()  # Ordre dans la ligne
    temps_arrivee_estimee = models.DurationField()  # Du départ
    distance_precedent_km = models.FloatField(default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['ligne', 'ordre']
        unique_together = ['ligne', 'nom']
        verbose_name = 'Arrêt'
        verbose_name_plural = 'Arrêts'
    
    def __str__(self):
        return f"{self.ligne.code} - {self.nom}"
