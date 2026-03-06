"""
Trip & GPS Position Models
"""
from django.db import models
import uuid

class Trip(models.Model):
    STATUS_CHOICES = [
        ('PLANIFIEE', 'Planifiée'),
        ('EN_COURS', 'En Cours'),
        ('COMPLETEE', 'Complétée'),
        ('ANNULEE', 'Annulée'),
        ('PAUSE', 'En Pause'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bus = models.ForeignKey(
        'Bus', on_delete=models.SET_NULL, null=True, blank=True, related_name='trips'
    )
    driver = models.ForeignKey(
        'Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='trips'
    )
    ligne = models.ForeignKey(
        'Line', on_delete=models.SET_NULL, null=True, blank=True, related_name='trips'
    )

    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANIFIEE')
    date_planifiee = models.DateTimeField(null=True, blank=True)
    date_debut = models.DateTimeField(auto_now_add=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    heure_arrivee_estimee = models.DateTimeField(null=True, blank=True)
    revenus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nombre_passagers = models.IntegerField(default=0)
    incidents = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    distance_reelle_km = models.FloatField(default=0)
    duree_reelle_secondes = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-date_debut']
        verbose_name = 'Trajet'
        verbose_name_plural = 'Trajets'
    
    def __str__(self):
        return f"Trajet {self.id} - {self.statut}"
    
    def calculer_duree(self):
        if self.date_fin:
            delta = self.date_fin - self.date_debut
            self.duree_reelle_secondes = int(delta.total_seconds())
            self.save()


class GPSPosition(models.Model):
    """Position GPS en temps réel des bus"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bus = models.ForeignKey(
        'Bus', on_delete=models.CASCADE, null=True, blank=True, related_name='positions'
    )
    trajet = models.ForeignKey(
        'Trip', on_delete=models.SET_NULL, null=True, blank=True, related_name='positions'
    )

    latitude = models.FloatField()
    longitude = models.FloatField()
    altitude = models.FloatField(null=True, blank=True)
    vitesse_kmh = models.FloatField(default=0)
    direction_degres = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_valide = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['bus', 'timestamp']),
        ]
        verbose_name = 'Position GPS'
        verbose_name_plural = 'Positions GPS'
    
    def __str__(self):
        return f"GPS {self.latitude}, {self.longitude} @ {self.timestamp}"


class TripCurrentStop(models.Model):
    """Tracks driver's current stop position within an active trip."""
    trajet = models.OneToOneField(
        Trip, on_delete=models.CASCADE, related_name='current_stop'
    )
    stop = models.ForeignKey(
        'Stop', on_delete=models.SET_NULL, null=True, blank=True, related_name='current_trips'
    )
    stop_index = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Arrêt actuel'

    def __str__(self):
        return f"Trajet {self.trajet_id} — arrêt {self.stop_index}"
