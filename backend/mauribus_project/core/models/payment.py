"""
Payment Models - Gestion des Paiements
"""
from django.db import models
from django.utils import timezone
import uuid
import secrets

class Payment(models.Model):
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En Attente'),
        ('VALIDE', 'Validé'),
        ('REFUSE', 'Refusé'),
        ('REMBOURSEMENT', 'Remboursement'),
    ]
    
    TYPE_CHOICES = [
        ('BANKILY', 'Paiement Bankily'),
        ('ESPECES', 'Espèces'),
        ('CARTE', 'Carte de Transport'),
        ('ABONNEMENT', 'Abonnement'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chauffeur = models.ForeignKey(
        'Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='paiements'
    )
    trajet = models.ForeignKey(
        'Trip', on_delete=models.SET_NULL, null=True, blank=True, related_name='paiements'
    )

    montant = models.DecimalField(max_digits=10, decimal_places=2)
    type_paiement = models.CharField(max_length=20, choices=TYPE_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    code_unique = models.CharField(max_length=50, unique=True)
    photo_capture = models.ImageField(upload_to='payments/bankily/', null=True, blank=True)
    reference_bankily = models.CharField(max_length=100, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    validé_par = models.CharField(max_length=100, blank=True)  # Matricule admin
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['code_unique']),
            models.Index(fields=['statut', 'date_creation']),
        ]
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
    
    def __str__(self):
        return f"{self.code_unique} - {self.montant} UM - {self.statut}"
    
    @classmethod
    def generate_code(cls):
        """Génère un code unique de paiement"""
        while True:
            code = f"PAY-{secrets.token_hex(6).upper()}"
            if not cls.objects.filter(code_unique=code).exists():
                return code
    
    def save(self, *args, **kwargs):
        if not self.code_unique:
            self.code_unique = self.generate_code()
        super().save(*args, **kwargs)


class PaymentAlert(models.Model):
    """Alertes sur les paiements"""
    
    ALERT_TYPE_CHOICES = [
        ('PAIEMENT_REFUSE', 'Paiement Refusé'),
        ('PAIEMENT_MANQUANT', 'Paiement Manquant'),
        ('FRAUDE_DETECTEE', 'Fraude Détectée'),
        ('VERIFICATION_REQUISE', 'Vérification Requise'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paiement = models.ForeignKey(
        'Payment', on_delete=models.CASCADE, null=True, blank=True, related_name='alertes'
    )
    type_alerte = models.CharField(max_length=30, choices=ALERT_TYPE_CHOICES)
    description = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    resolue = models.BooleanField(default=False)
    date_resolution = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Alerte Paiement'
        verbose_name_plural = 'Alertes Paiements'
