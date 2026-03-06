"""
CitizenUser, Wallet, Transaction, and AppWallet Models
"""
from django.db import models
from django.utils import timezone
import uuid


# ─── MauriBus App Wallet ──────────────────────────────────────────────────────

class AppWallet(models.Model):
    """Singleton wallet for MauriBus app earnings (commissions)."""
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Wallet App MauriBus'

    @classmethod
    def get(cls):
        """Return the singleton AppWallet, creating it if needed."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"AppWallet MauriBus — {self.balance} MRU"


class AppTransaction(models.Model):
    """Tracks all money movements in the MauriBus app wallet."""
    TYPE_CHOICES = [
        ('COMMISSION', 'Commission trajet'),
        ('PAIEMENT_CHAUFFEUR', 'Paiement chauffeur'),
        ('RECHARGE_BANQUE', 'Recharge depuis banque'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type_transaction = models.CharField(max_length=30, choices=TYPE_CHOICES)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    # For driver payments — which driver received the money
    chauffeur = models.ForeignKey(
        'Driver', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='app_payments'
    )
    effectue_par = models.CharField(max_length=100, blank=True)
    solde_avant = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    solde_apres = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Transaction App Wallet'

    def __str__(self):
        return f"{self.type_transaction} {self.montant} MRU"


class CitizenUser(models.Model):
    STATUS_CHOICES = [
        ('ACTIF', 'Actif'),
        ('SUSPENDU', 'Suspendu'),
        ('INACTIF', 'Inactif'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    telephone = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    nni = models.CharField(max_length=30, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    password = models.CharField(max_length=255)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIF')
    push_token = models.CharField(max_length=255, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Citoyen'
        verbose_name_plural = 'Citoyens'

    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return f"{self.telephone} - {self.prenom} {self.nom}"


class WalletCitizen(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    citoyen = models.OneToOneField(
        CitizenUser, on_delete=models.CASCADE, related_name='wallet'
    )
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Wallet Citoyen'

    def __str__(self):
        return f"Wallet {self.citoyen.telephone} — {self.balance} MRU"


class WalletDriver(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chauffeur = models.OneToOneField(
        'Driver', on_delete=models.CASCADE, related_name='wallet'
    )
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Wallet Chauffeur'

    def __str__(self):
        return f"Wallet {self.chauffeur.matricule} — {self.balance} MRU"


class WalletTransaction(models.Model):
    TYPE_CHOICES = [
        ('RECHARGE', 'Recharge'),
        ('PAIEMENT', 'Paiement trajet'),
        ('REMBOURSEMENT', 'Remboursement'),
    ]
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('VALIDE', 'Validé'),
        ('REFUSE', 'Refusé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    citoyen = models.ForeignKey(
        CitizenUser, on_delete=models.CASCADE, related_name='transactions'
    )
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    type_transaction = models.CharField(max_length=20, choices=TYPE_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')
    description = models.CharField(max_length=255, blank=True)
    reference_bankily = models.CharField(max_length=100, blank=True)
    photo_bankily = models.ImageField(upload_to='wallet/bankily/', null=True, blank=True)
    valide_par = models.CharField(max_length=100, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Transaction Wallet'

    def __str__(self):
        return f"{self.type_transaction} {self.montant} MRU — {self.statut}"


class CitizenTrip(models.Model):
    STATUT_CHOICES = [
        ('PAYE', 'Payé'),
        ('UTILISE', 'Utilisé'),
        ('ANNULE', 'Annulé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_code = models.UUIDField(default=uuid.uuid4, unique=True)
    citoyen = models.ForeignKey(
        CitizenUser, on_delete=models.CASCADE, related_name='trajets'
    )
    ligne = models.ForeignKey(
        'Line', on_delete=models.SET_NULL, null=True, blank=True
    )
    trajet = models.ForeignKey(
        'Trip', on_delete=models.SET_NULL, null=True, blank=True
    )
    bus = models.ForeignKey(
        'Bus', on_delete=models.SET_NULL, null=True, blank=True
    )
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='PAYE')
    methode_paiement = models.CharField(max_length=30, default='WALLET')
    date_paiement = models.DateTimeField(auto_now_add=True)
    date_utilisation = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_paiement']
        verbose_name = 'Trajet Citoyen'

    def __str__(self):
        return f"{self.citoyen.telephone} — {self.montant_paye} MRU"


class DriverRating(models.Model):
    """Citizen rates a driver after a trip (1–5 stars)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    citoyen = models.ForeignKey(
        CitizenUser, on_delete=models.CASCADE, related_name='ratings_donnees'
    )
    chauffeur = models.ForeignKey(
        'Driver', on_delete=models.CASCADE, related_name='ratings'
    )
    citizen_trip = models.OneToOneField(
        CitizenTrip, on_delete=models.CASCADE, related_name='rating', null=True, blank=True
    )
    note = models.IntegerField(default=5)   # 1 – 5
    commentaire = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Avis Chauffeur'
