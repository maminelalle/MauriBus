"""
Admin Model - Administrateurs du système
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password
from django.utils import timezone
import uuid

class AdminManager(BaseUserManager):
    def create_user(self, matricule, password=None, **extra_fields):
        if not matricule:
            raise ValueError('Matricule is required')
        user = self.model(matricule=matricule, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, matricule, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        return self.create_user(matricule, password, **extra_fields)

class Admin(AbstractBaseUser):
    ROLE_CHOICES = [
        ('SUPER_ADMIN', 'Super Administrateur'),
        ('ADMIN', 'Administrateur'),
        ('MODERATOR', 'Modérateur'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIF', 'Actif'),
        ('SUSPENDU', 'Suspendu'),
        ('INACTIF', 'Inactif'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    matricule = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20)
    nni = models.CharField(max_length=30, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ADMIN')
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIF')
    photo = models.ImageField(upload_to='admins/', null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    
    objects = AdminManager()
    
    USERNAME_FIELD = 'matricule'
    REQUIRED_FIELDS = ['email', 'nom', 'prenom']
    
    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Administrateur'
        verbose_name_plural = 'Administrateurs'
    
    def __str__(self):
        return f"{self.matricule} - {self.prenom} {self.nom}"
    
    @classmethod
    def generate_matricule(cls):
        prefix = 'ADMN'
        last_admin = cls.objects.all().order_by('-date_creation').first()
        if last_admin and last_admin.matricule.startswith(prefix):
            num = int(last_admin.matricule.split('-')[1]) + 1
        else:
            num = 1
        return f"{prefix}-{num:03d}"
