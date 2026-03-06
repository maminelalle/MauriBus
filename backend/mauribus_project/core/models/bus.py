"""
Bus Model - Gestion des Bus
"""
from django.db import models
import uuid

class Bus(models.Model):
    STATUS_CHOICES = [
        ('ACTIF', 'Actif'),
        ('MAINTENANCE', 'En Maintenance'),
        ('REPOSE', 'Au Repos'),
        ('INACTIF', 'Inactif'),
        ('HORS_SERVICE', 'Hors Service'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_bus = models.CharField(max_length=50, unique=True)
    plaque = models.CharField(max_length=20, unique=True)
    numero_bankily = models.CharField(max_length=50, unique=True, null=True, blank=True)
    capacite = models.IntegerField(default=30)
    places_disponibles = models.IntegerField(default=30)
    description = models.TextField(blank=True, default='')
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIF')
    marque = models.CharField(max_length=100, null=True, blank=True)
    modele = models.CharField(max_length=100, null=True, blank=True)
    annee_fabrication = models.IntegerField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_derniere_maintenance = models.DateField(null=True, blank=True)
    est_plein = models.BooleanField(default=False)
    
    chauffeur = models.OneToOneField(
        'Driver', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='bus_assigne'
    )
    lignes = models.ManyToManyField(
        'Line', blank=True,
        related_name='buses'
    )
    
    class Meta:
        ordering = ['numero_bus']
        verbose_name = 'Bus'
        verbose_name_plural = 'Bus'
    
    def __str__(self):
        return f"{self.numero_bus} - {self.plaque}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.places_disponibles = self.capacite
        self.est_plein = self.places_disponibles <= 0
        super().save(*args, **kwargs)

    def update_places(self, places_utilisees):
        """Met à jour les places disponibles"""
        self.places_disponibles = self.capacite - places_utilisees
        self.est_plein = self.places_disponibles <= 0
        self.save()
