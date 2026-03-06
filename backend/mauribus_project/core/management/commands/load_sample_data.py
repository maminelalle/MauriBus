"""
Management command to load sample data into the database
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta, date
import random


class Command(BaseCommand):
    help = 'Load sample data: lines, drivers, buses, payments, reports, admins'

    def handle(self, *args, **options):
        from core.models import Admin, Driver, Bus, Line, Trip, Payment, Report, SystemAlert

        self.stdout.write('Chargement des donnees exemple...')

        # ── 1. Lines ──────────────────────────────────────────────────────────
        lines_data = [
            {'nom': 'Ligne Capitale - Cinquieme', 'code': 'L1', 'couleur_ligne': '#3B82F6',
             'terminus_depart': 'Capitale', 'terminus_arrivee': '5eme Arrondissement',
             'tarif_base': 50, 'statut': 'ACTIVE'},
            {'nom': 'Ligne Tevragh Zeina - Ksar', 'code': 'L2', 'couleur_ligne': '#10B981',
             'terminus_depart': 'Tevragh Zeina', 'terminus_arrivee': 'Ksar',
             'tarif_base': 60, 'statut': 'ACTIVE'},
            {'nom': 'Ligne Sebkha - Arafat', 'code': 'L3', 'couleur_ligne': '#F59E0B',
             'terminus_depart': 'Sebkha', 'terminus_arrivee': 'Arafat',
             'tarif_base': 70, 'statut': 'ACTIVE'},
            {'nom': 'Ligne Dar Naim - Teyarett', 'code': 'L4', 'couleur_ligne': '#EF4444',
             'terminus_depart': 'Dar Naim', 'terminus_arrivee': 'Teyarett',
             'tarif_base': 55, 'statut': 'ACTIVE'},
            {'nom': 'Ligne El Mina - Riyadh', 'code': 'L5', 'couleur_ligne': '#8B5CF6',
             'terminus_depart': 'El Mina', 'terminus_arrivee': 'Riyadh',
             'tarif_base': 65, 'statut': 'ACTIVE'},
        ]
        lines = []
        for data in lines_data:
            obj, created = Line.objects.get_or_create(code=data['code'], defaults=data)
            lines.append(obj)
            if created:
                self.stdout.write(f'  Ligne creee: {obj.code}')

        # ── 2. Drivers ────────────────────────────────────────────────────────
        drivers_data = [
            {'prenom': 'Mohamed', 'nom': 'Ould Ahmed', 'email': 'driver1@mauribus.mr',
             'telephone': '22000001', 'nni': '1234567890001'},
            {'prenom': 'Abdallahi', 'nom': 'Ould Salem', 'email': 'driver2@mauribus.mr',
             'telephone': '22000002', 'nni': '1234567890002'},
            {'prenom': 'Cheikh', 'nom': 'Ould Brahim', 'email': 'driver3@mauribus.mr',
             'telephone': '22000003', 'nni': '1234567890003'},
            {'prenom': 'Sidi', 'nom': 'Ould Mokhtar', 'email': 'driver4@mauribus.mr',
             'telephone': '22000004', 'nni': '1234567890004'},
            {'prenom': 'Yahya', 'nom': 'Ould Vall', 'email': 'driver5@mauribus.mr',
             'telephone': '22000005', 'nni': '1234567890005'},
        ]
        drivers = []
        for i, data in enumerate(drivers_data):
            if Driver.objects.filter(email=data['email']).exists():
                drivers.append(Driver.objects.get(email=data['email']))
                continue
            num = Driver.objects.count() + 1
            driver = Driver.objects.create(
                matricule=f'DRV-{num:04d}',
                password=make_password('Driver@2024'),
                is_online=(i < 3),
                statut='ACTIF',
                **data
            )
            drivers.append(driver)
            self.stdout.write(f'  Chauffeur cree: {driver.matricule}')

        # ── 3. Buses ─────────────────────────────────────────────────────────
        buses_data = [
            {'numero_bus': 'BUS-001', 'plaque': 'NKT-001-A', 'marque': 'Mercedes',
             'modele': 'Sprinter', 'capacite': 35, 'statut': 'ACTIF'},
            {'numero_bus': 'BUS-002', 'plaque': 'NKT-002-A', 'marque': 'Toyota',
             'modele': 'Coaster', 'capacite': 30, 'statut': 'ACTIF'},
            {'numero_bus': 'BUS-003', 'plaque': 'NKT-003-A', 'marque': 'Isuzu',
             'modele': 'NQR', 'capacite': 40, 'statut': 'ACTIF'},
            {'numero_bus': 'BUS-004', 'plaque': 'NKT-004-A', 'marque': 'Mercedes',
             'modele': 'Citaro', 'capacite': 50, 'statut': 'MAINTENANCE'},
            {'numero_bus': 'BUS-005', 'plaque': 'NKT-005-A', 'marque': 'Toyota',
             'modele': 'Hiace', 'capacite': 15, 'statut': 'ACTIF'},
        ]
        buses = []
        for i, data in enumerate(buses_data):
            if Bus.objects.filter(numero_bus=data['numero_bus']).exists():
                buses.append(Bus.objects.get(numero_bus=data['numero_bus']))
                continue
            cap = data['capacite']
            bus = Bus.objects.create(
                places_disponibles=cap,
                chauffeur=drivers[i] if i < len(drivers) else None,
                **data
            )
            if i < len(lines):
                bus.lignes.add(lines[i])
            buses.append(bus)
            self.stdout.write(f'  Bus cree: {bus.numero_bus}')

        # ── 4. Secondary Admin ───────────────────────────────────────────────
        if not Admin.objects.filter(email='moderateur@mauribus.mr').exists():
            num = Admin.objects.count() + 1
            Admin.objects.create(
                matricule=f'ADMN-{num:03d}',
                nom='Diallo',
                prenom='Aminata',
                email='moderateur@mauribus.mr',
                telephone='22100001',
                nni='9876543210001',
                role='MODERATOR',
                statut='ACTIF',
                password=make_password('Modo@2024'),
                is_active=True,
                is_staff=True,
            )
            self.stdout.write('  Admin secondaire cree: ADMN-002 / moderateur@mauribus.mr')

        # ── 5. Trips ─────────────────────────────────────────────────────────
        if Trip.objects.count() == 0:
            for i, bus in enumerate(buses[:3]):
                Trip.objects.create(
                    bus=bus,
                    driver=drivers[i],
                    ligne=lines[i],
                    statut='EN_COURS',
                    nombre_passagers=random.randint(10, 30),
                    revenus=random.randint(500, 2000),
                )
            for i in range(4):
                day = timezone.now() - timedelta(days=i + 1)
                Trip.objects.create(
                    bus=buses[0],
                    driver=drivers[0],
                    ligne=lines[0],
                    statut='COMPLETEE',
                    date_fin=day,
                    nombre_passagers=random.randint(15, 35),
                    revenus=random.randint(750, 1750),
                )
            self.stdout.write('  Trajets crees')

        # ── 6. Payments ──────────────────────────────────────────────────────
        if Payment.objects.count() == 0:
            types = ['BANKILY', 'ESPECES', 'CARTE']
            statuts = ['EN_ATTENTE', 'EN_ATTENTE', 'VALIDE', 'VALIDE', 'REFUSE']
            for i, driver in enumerate(drivers):
                Payment.objects.create(
                    chauffeur=driver,
                    montant=random.randint(500, 5000),
                    type_paiement=types[i % len(types)],
                    statut=statuts[i % len(statuts)],
                    date_validation=timezone.now() if statuts[i % len(statuts)] == 'VALIDE' else None,
                )
            self.stdout.write('  Paiements crees')

        # ── 7. Reports ───────────────────────────────────────────────────────
        if Report.objects.count() == 0:
            reports_data = [
                {'type_signalement': 'PANNE_MECANIQUE', 'titre': 'Panne moteur sur la L1',
                 'description': 'Le bus BUS-001 a une panne moteur au niveau de Tevragh Zeina.',
                 'priorite': 'HAUTE', 'statut': 'NOUVEAU', 'chauffeur': drivers[0], 'bus': buses[0]},
                {'type_signalement': 'INCIDENT_ROUTE', 'titre': 'Embouteillage important L2',
                 'description': 'Embouteillage au rond-point de Ksar, retard de 30 min.',
                 'priorite': 'NORMALE', 'statut': 'EN_COURS', 'chauffeur': drivers[1], 'bus': buses[1]},
                {'type_signalement': 'PLAINTE_PASSAGER', 'titre': 'Passager agressif',
                 'description': 'Un passager a ete agressif envers d autres passagers.',
                 'priorite': 'HAUTE', 'statut': 'NOUVEAU', 'chauffeur': drivers[2], 'bus': buses[2]},
                {'type_signalement': 'ACCIDENT', 'titre': 'Accrochage mineur',
                 'description': 'Accrochage avec une moto, degats legers.',
                 'priorite': 'CRITIQUE', 'statut': 'RESOLU', 'chauffeur': drivers[3], 'bus': buses[3]},
                {'type_signalement': 'AUTRE', 'titre': 'Signalement test',
                 'description': 'Signalement de test pour la demonstration.',
                 'priorite': 'BASSE', 'statut': 'NOUVEAU', 'chauffeur': drivers[4], 'bus': buses[4]},
            ]
            for data in reports_data:
                Report.objects.create(**data)
            self.stdout.write('  Signalements crees')

        # ── 8. System Alerts ─────────────────────────────────────────────────
        if SystemAlert.objects.count() == 0:
            SystemAlert.objects.create(
                type_alerte='BUS_ARRETE_LONGTEMPS',
                bus=buses[3],
                description='BUS-004 arrete depuis plus de 30 minutes sans signalement.',
                est_actif=True,
            )
            SystemAlert.objects.create(
                type_alerte='MAINTENANCE_DUE',
                bus=buses[0],
                description='BUS-001 depasse le kilome trage de maintenance recommande.',
                est_actif=True,
            )
            self.stdout.write('  Alertes systeme creees')

        self.stdout.write(self.style.SUCCESS('\nDonnees exemple chargees avec succes!'))
        self.stdout.write(f'  Lignes: {Line.objects.count()}')
        self.stdout.write(f'  Chauffeurs: {Driver.objects.count()}')
        self.stdout.write(f'  Bus: {Bus.objects.count()}')
        self.stdout.write(f'  Trajets: {Trip.objects.count()}')
        self.stdout.write(f'  Paiements: {Payment.objects.count()}')
        self.stdout.write(f'  Signalements: {Report.objects.count()}')
        self.stdout.write(f'  Admins: {Admin.objects.count()}')
