"""
Driver Model - Chauffeurs
"""
from django.db import models
from django.utils import timezone
import uuid

class Driver(models.Model):
    STATUS_CHOICES = [
        ('ACTIF', 'Actif'),
        ('SUSPENDU', 'Suspendu'),
        ('CONGE', 'En Congé'),
        ('INACTIF', 'Inactif'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    matricule = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, unique=True)
    nni = models.CharField(max_length=30, unique=True)
    photo = models.ImageField(upload_to='drivers/', null=True, blank=True)
    adresse = models.TextField(blank=True, default='')
    numero_permis = models.CharField(max_length=50, unique=True, null=True, blank=True)
    date_expiration_permis = models.DateField(null=True, blank=True)
    password = models.CharField(max_length=255)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIF')
    date_embauche = models.DateField(auto_now_add=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)
    push_token = models.CharField(max_length=255, blank=True, null=True)
    
    # Relations - to be added after Bus and Line models
    # bus_assigne = models.OneToOneField('Bus', on_delete=models.SET_NULL, null=True, blank=True)
    # ligne_actuelle = models.ForeignKey('Line', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-date_embauche']
        verbose_name = 'Chauffeur'
        verbose_name_plural = 'Chauffeurs'
    
    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return f"{self.matricule} - {self.prenom} {self.nom}"
    
    @classmethod
    def generate_matricule(cls):
        prefix = 'DRV'
        last_driver = cls.objects.all().order_by('-date_creation').first()
        if last_driver and last_driver.matricule.startswith(prefix):
            num = int(last_driver.matricule.split('-')[1]) + 1
        else:
            num = 1
        return f"{prefix}-{num:04d}"
