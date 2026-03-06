"""
Script de création des données de test
Exécutez avec: python manage.py shell < load_test_data.py
"""
import os
import django
from datetime import datetime, time, timedelta
from django.contrib.auth.hashers import make_password
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Admin, Driver, Bus, Line, Stop, Trip, GPSPosition, Payment, Report, SystemAlert

print("🚀 Création des données de test...\n")

# ============= 1. CRÉER LES ADMINS =============
print("1️⃣  Créer les Admins...")

admins_data = [
    {
        'matricule': 'ADMN-001',
        'nom': 'Dupont',
        'prenom': 'Jean',
        'email': 'jean.dupont@mauribus.com',
        'telephone': '+22250123456',
        'nni': '123456789012345',
        'role': 'SUPER_ADMIN',
        'statut': 'ACTIF',
    },
    {
        'matricule': 'ADMN-002',
        'nom': 'Martin',
        'prenom': 'Sophie',
        'email': 'sophie.martin@mauribus.com',
        'telephone': '+22250234567',
        'nni': '234567890123456',
        'role': 'ADMIN',
        'statut': 'ACTIF',
    },
    {
        'matricule': 'ADMN-003',
        'nom': 'Leclerc',
        'prenom': 'Pierre',
        'email': 'pierre.leclerc@mauribus.com',
        'telephone': '+22250345678',
        'nni': '345678901234567',
        'role': 'MODERATOR',
        'statut': 'ACTIF',
    },
    {
        'matricule': 'ADMN-004',
        'nom': 'Robert',
        'prenom': 'Marie',
        'email': 'marie.robert@mauribus.com',
        'telephone': '+22250456789',
        'nni': '456789012345678',
        'role': 'ADMIN',
        'statut': 'ACTIF',
    },
    {
        'matricule': 'ADMN-005',
        'nom': 'Bernard',
        'prenom': 'Claude',
        'email': 'claude.bernard@mauribus.com',
        'telephone': '+22250567890',
        'nni': '567890123456789',
        'role': 'MODERATOR',
        'statut': 'ACTIF',
    },
]

admins = []
for admin_data in admins_data:
    admin_data['password'] = make_password('SecurePass123!')
    admin_data['is_staff'] = True
    admin_data['is_superuser'] = admin_data['role'] == 'SUPER_ADMIN'
    admin, created = Admin.objects.get_or_create(
        matricule=admin_data['matricule'],
        defaults=admin_data
    )
    if created:
        print(f"   ✅ {admin.matricule} - {admin.prenom} {admin.nom}")
    else:
        print(f"   ⚠️  {admin.matricule} existe déjà")
    admins.append(admin)

# ============= 2. CRÉER LES LIGNES =============
print("\n2️⃣  Créer les Lignes...")

lines_data = [
    {
        'code': 'L1',
        'nom': 'Ligne 1 - Teyarett',
        'description': 'Trajet principal Teyarett - Centre-ville',
        'heure_depart': time(6, 0),
        'heure_fin': time(22, 0),
        'frequence_minutes': 15,
        'statut': 'ACTIVE',
        'couleur_ligne': '#3B82F6',
        'distance_totale_km': 25.5,
    },
    {
        'code': 'L2',
        'nom': 'Ligne 2 - Ksar',
        'description': 'Circuit Ksar - Medina',
        'heure_depart': time(6, 30),
        'heure_fin': time(21, 0),
        'frequence_minutes': 20,
        'statut': 'ACTIVE',
        'couleur_ligne': '#10B981',
        'distance_totale_km': 18.3,
    },
    {
        'code': 'L3',
        'nom': 'Ligne 3 - Mina',
        'description': 'Ligne Mina - Sebkha',
        'heure_depart': time(7, 0),
        'heure_fin': time(20, 0),
        'frequence_minutes': 25,
        'statut': 'ACTIVE',
        'couleur_ligne': '#F59E0B',
        'distance_totale_km': 22.7,
    },
    {
        'code': 'L4',
        'nom': 'Ligne 4 - Riad',
        'description': 'Route Riad - Arafat',
        'heure_depart': time(6, 30),
        'heure_fin': time(21, 30),
        'frequence_minutes': 18,
        'statut': 'ACTIVE',
        'couleur_ligne': '#EF4444',
        'distance_totale_km': 31.2,
    },
    {
        'code': 'L5',
        'nom': 'Ligne 5 - Akreij',
        'description': 'Service Akreij - Port',
        'heure_depart': time(7, 0),
        'heure_fin': time(19, 0),
        'frequence_minutes': 30,
        'statut': 'ACTIVE',
        'couleur_ligne': '#8B5CF6',
        'distance_totale_km': 19.8,
    },
]

lines = []
for line_data in lines_data:
    line, created = Line.objects.get_or_create(
        code=line_data['code'],
        defaults=line_data
    )
    if created:
        print(f"   ✅ {line.code} - {line.nom}")
    else:
        print(f"   ⚠️  {line.code} existe déjà")
    lines.append(line)

# ============= 3. CRÉER LES ARRÊTS =============
print("\n3️⃣  Créer les Arrêts...")

stops_data = [
    # Ligne 1
    {'ligne': lines[0], 'nom': 'Centre Ville', 'adresse': 'Place Verte', 'latitude': 18.0735, 'longitude': -15.9582, 'ordre': 1},
    {'ligne': lines[0], 'nom': 'Gare Routière', 'adresse': 'Route 1', 'latitude': 18.0750, 'longitude': -15.9600, 'ordre': 2},
    {'ligne': lines[0], 'nom': 'Teyarett', 'adresse': 'Boulevard Teyarett', 'latitude': 18.0800, 'longitude': -15.9650, 'ordre': 3},
    {'ligne': lines[0], 'nom': 'Marché Central', 'adresse': 'Rue du Marché', 'latitude': 18.0850, 'longitude': -15.9700, 'ordre': 4},
    {'ligne': lines[0], 'nom': 'Terminal Nord', 'adresse': 'Avenue Nord', 'latitude': 18.0900, 'longitude': -15.9750, 'ordre': 5},
    # Ligne 2
    {'ligne': lines[1], 'nom': 'Ksar Centre', 'adresse': 'Place Ksar', 'latitude': 18.0600, 'longitude': -15.9500, 'ordre': 1},
    {'ligne': lines[1], 'nom': 'Medina', 'adresse': 'Rue Medina', 'latitude': 18.0650, 'longitude': -15.9550, 'ordre': 2},
    {'ligne': lines[1], 'nom': 'Douanes', 'adresse': 'Zone Douanes', 'latitude': 18.0700, 'longitude': -15.9600, 'ordre': 3},
    {'ligne': lines[1], 'nom': 'Port Autonome', 'adresse': 'Port Est', 'latitude': 18.0750, 'longitude': -15.9650, 'ordre': 4},
    {'ligne': lines[1], 'nom': 'Ksar Terminal', 'adresse': 'Terminal Ksar', 'latitude': 18.0800, 'longitude': -15.9700, 'ordre': 5},
    # Ligne 3
    {'ligne': lines[2], 'nom': 'Mina Sud', 'adresse': 'Avenue Mina', 'latitude': 18.0500, 'longitude': -15.9450, 'ordre': 1},
    {'ligne': lines[2], 'nom': 'Marché Mina', 'adresse': 'Marché Mina', 'latitude': 18.0550, 'longitude': -15.9500, 'ordre': 2},
    {'ligne': lines[2], 'nom': 'Sebkha', 'adresse': 'Route Sebkha', 'latitude': 18.0600, 'longitude': -15.9550, 'ordre': 3},
    {'ligne': lines[2], 'nom': 'Aéroport', 'adresse': 'Route Aéroport', 'latitude': 18.0650, 'longitude': -15.9600, 'ordre': 4},
    {'ligne': lines[2], 'nom': 'Mina Terminal', 'adresse': 'Terminal Mina', 'latitude': 18.0700, 'longitude': -15.9650, 'ordre': 5},
    # Ligne 4
    {'ligne': lines[3], 'nom': 'Riad Centre', 'adresse': 'Avenue Riad', 'latitude': 18.0400, 'longitude': -15.9400, 'ordre': 1},
    {'ligne': lines[3], 'nom': 'Arafat', 'adresse': 'Route Arafat', 'latitude': 18.0450, 'longitude': -15.9450, 'ordre': 2},
    {'ligne': lines[3], 'nom': 'Campus', 'adresse': 'Zone Campus', 'latitude': 18.0500, 'longitude': -15.9500, 'ordre': 3},
    {'ligne': lines[3], 'nom': 'Hôpital', 'adresse': 'Zone Hôpital', 'latitude': 18.0550, 'longitude': -15.9550, 'ordre': 4},
    {'ligne': lines[3], 'nom': 'Riad Terminal', 'adresse': 'Terminal Riad', 'latitude': 18.0600, 'longitude': -15.9600, 'ordre': 5},
    # Ligne 5
    {'ligne': lines[4], 'nom': 'Akreij Centre', 'adresse': 'Avenue Akreij', 'latitude': 18.0300, 'longitude': -15.9350, 'ordre': 1},
    {'ligne': lines[4], 'nom': 'Port Akreij', 'adresse': 'Port Akreij', 'latitude': 18.0350, 'longitude': -15.9400, 'ordre': 2},
    {'ligne': lines[4], 'nom': 'Zone Libre', 'adresse': 'Zone Libre', 'latitude': 18.0400, 'longitude': -15.9450, 'ordre': 3},
    {'ligne': lines[4], 'nom': 'Industrie', 'adresse': 'Zone Industrie', 'latitude': 18.0450, 'longitude': -15.9500, 'ordre': 4},
    {'ligne': lines[4], 'nom': 'Akreij Terminal', 'adresse': 'Terminal Akreij', 'latitude': 18.0500, 'longitude': -15.9550, 'ordre': 5},
]

stops_count = 0
for stop_data in stops_data:
    ligne = stop_data.pop('ligne')
    stop, created = Stop.objects.get_or_create(
        ligne=ligne,
        nom=stop_data['nom'],
        defaults=stop_data
    )
    if created:
        stops_count += 1

print(f"   ✅ {stops_count} arrêts créés")

# ============= 4. CRÉER LES BUS =============
print("\n4️⃣  Créer les Bus...")

buses_data = [
    {
        'numero_bus': 'BUS-001',
        'plaque': 'NKC-2024-001',
        'numero_bankily': '20000001001',
        'capacite': 45,
        'places_disponibles': 45,
        'marque': 'Mercedes',
        'annee_fabrication': 2023,
        'statut': 'ACTIF',
        'description': 'Bus standard climatisé',
    },
    {
        'numero_bus': 'BUS-002',
        'plaque': 'NKC-2024-002',
        'numero_bankily': '20000001002',
        'capacite': 50,
        'places_disponibles': 50,
        'marque': 'Volvo',
        'annee_fabrication': 2022,
        'statut': 'ACTIF',
        'description': 'Bus confortable classe A',
    },
    {
        'numero_bus': 'BUS-003',
        'plaque': 'NKC-2024-003',
        'numero_bankily': '20000001003',
        'capacite': 45,
        'places_disponibles': 28,
        'marque': 'Mercedes',
        'annee_fabrication': 2023,
        'statut': 'ACTIF',
        'description': 'Bus standard climatisé',
    },
    {
        'numero_bus': 'BUS-004',
        'plaque': 'NKC-2024-004',
        'numero_bankily': '20000001004',
        'capacite': 40,
        'places_disponibles': 0,
        'marque': 'Isuzu',
        'annee_fabrication': 2021,
        'statut': 'ACTIF',
        'description': 'Bus économique plein',
        'est_plein': True,
    },
    {
        'numero_bus': 'BUS-005',
        'plaque': 'NKC-2024-005',
        'numero_bankily': '20000001005',
        'capacite': 45,
        'places_disponibles': 45,
        'marque': 'Mercedes',
        'annee_fabrication': 2023,
        'statut': 'MAINTENANCE',
        'description': 'Bus en maintenance',
    },
]

buses = []
for bus_data in buses_data:
    bus, created = Bus.objects.get_or_create(
        numero_bus=bus_data['numero_bus'],
        defaults=bus_data
    )
    if created:
        print(f"   ✅ {bus.numero_bus} - {bus.marque}")
    else:
        print(f"   ⚠️  {bus.numero_bus} existe déjà")
    buses.append(bus)

# ============= 5. CRÉER LES CHAUFFEURS =============
print("\n5️⃣  Créer les Chauffeurs...")

drivers_data = [
    {
        'matricule': 'DRV-0001',
        'nom': 'Ali',
        'prenom': 'Mohamed',
        'email': 'ali.mohamed@mauribus.com',
        'telephone': '+22250100001',
        'nni': '100000000000001',
        'adresse': 'Avenue Teyarett, Nouakchott',
        'numero_permis': 'DL-2023-0001',
        'date_expiration_permis': (timezone.now() + timedelta(days=365*2)).date(),
        'statut': 'ACTIF',
        'is_online': True,
    },
    {
        'matricule': 'DRV-0002',
        'nom': 'Hassan',
        'prenom': 'Abdallah',
        'email': 'hassan.abdallah@mauribus.com',
        'telephone': '+22250100002',
        'nni': '100000000000002',
        'adresse': 'Rue Ksar, Nouakchott',
        'numero_permis': 'DL-2023-0002',
        'date_expiration_permis': (timezone.now() + timedelta(days=365*3)).date(),
        'statut': 'ACTIF',
        'is_online': True,
    },
    {
        'matricule': 'DRV-0003',
        'nom': 'Aminata',
        'prenom': 'Bah',
        'email': 'aminata.bah@mauribus.com',
        'telephone': '+22250100003',
        'nni': '100000000000003',
        'adresse': 'Boulevard Mina, Nouakchott',
        'numero_permis': 'DL-2023-0003',
        'date_expiration_permis': (timezone.now() + timedelta(days=365)).date(),
        'statut': 'ACTIF',
        'is_online': False,
    },
    {
        'matricule': 'DRV-0004',
        'nom': 'Omar',
        'prenom': 'Sow',
        'email': 'omar.sow@mauribus.com',
        'telephone': '+22250100004',
        'nni': '100000000000004',
        'adresse': 'Zone Riad, Nouakchott',
        'numero_permis': 'DL-2022-0004',
        'date_expiration_permis': (timezone.now() + timedelta(days=200)).date(),
        'statut': 'ACTIF',
        'is_online': True,
    },
    {
        'matricule': 'DRV-0005',
        'nom': 'Zahra',
        'prenom': 'Mint',
        'email': 'zahra.mint@mauribus.com',
        'telephone': '+22250100005',
        'nni': '100000000000005',
        'adresse': 'Akreij, Nouakchott',
        'numero_permis': 'DL-2023-0005',
        'date_expiration_permis': (timezone.now() + timedelta(days=365*2)).date(),
        'statut': 'SUSPENDU',
        'is_online': False,
    },
]

drivers = []
for driver_data in drivers_data:
    driver_data['password'] = make_password('DriverPass123!')
    driver, created = Driver.objects.get_or_create(
        matricule=driver_data['matricule'],
        defaults=driver_data
    )
    if created:
        print(f"   ✅ {driver.matricule} - {driver.prenom} {driver.nom}")
    else:
        print(f"   ⚠️  {driver.matricule} existe déjà")
    drivers.append(driver)

# ============= 6. CRÉER LES TRAJETS =============
print("\n6️⃣  Créer les Trajets...")

now = timezone.now()
trips_data = [
    {
        'statut': 'EN_COURS',
        'date_debut': now - timedelta(hours=2),
        'nombre_passagers': 32,
        'revenus': 5000,
        'distance_reelle_km': 12.5,
    },
    {
        'statut': 'EN_COURS',
        'date_debut': now - timedelta(hours=1),
        'nombre_passagers': 28,
        'revenus': 4500,
        'distance_reelle_km': 10.8,
    },
    {
        'statut': 'COMPLETEE',
        'date_debut': now - timedelta(hours=4),
        'date_fin': now - timedelta(hours=3, minutes=30),
        'nombre_passagers': 45,
        'revenus': 7500,
        'distance_reelle_km': 25.3,
    },
    {
        'statut': 'COMPLETEE',
        'date_debut': now - timedelta(hours=6),
        'date_fin': now - timedelta(hours=5, minutes=45),
        'nombre_passagers': 40,
        'revenus': 6500,
        'distance_reelle_km': 22.1,
    },
    {
        'statut': 'COMPLETEE',
        'date_debut': now - timedelta(hours=8),
        'date_fin': now - timedelta(hours=7, minutes=30),
        'nombre_passagers': 38,
        'revenus': 6200,
        'distance_reelle_km': 18.9,
    },
]

trips = []
trips_count = 0
for trip_data in trips_data:
    trip = Trip.objects.create(**trip_data)
    trips_count += 1
    trips.append(trip)

print(f"   ✅ {trips_count} trajets créés")

# ============= 7. CRÉER LES POSITIONS GPS =============
print("\n7️⃣  Créer les Positions GPS...")

gps_count = 0
for i in range(15):
    position = GPSPosition.objects.create(
        latitude=18.0735 + (i * 0.002),
        longitude=-15.9582 + (i * 0.003),
        vitesse_kmh=45.5 + (i % 10),
        direction_degres=180 + (i * 5),
        precision=5.0,
        is_valide=True
    )
    gps_count += 1

print(f"   ✅ {gps_count} positions GPS créées")

# ============= 8. CRÉER LES PAIEMENTS =============
print("\n8️⃣  Créer les Paiements...")

payments_data = [
    {'montant': 5000, 'type_paiement': 'BANKILY', 'statut': 'VALIDE'},
    {'montant': 3500, 'type_paiement': 'ESPECES', 'statut': 'VALIDE'},
    {'montant': 4250, 'type_paiement': 'BANKILY', 'statut': 'EN_ATTENTE'},
    {'montant': 6000, 'type_paiement': 'BANKILY', 'statut': 'VALIDE'},
    {'montant': 2800, 'type_paiement': 'ESPECES', 'statut': 'EN_ATTENTE'},
]

payments_count = 0
for payment_data in payments_data:
    payment = Payment.objects.create(**payment_data)
    payments_count += 1

print(f"   ✅ {payments_count} paiements créés")

# ============= 9. CRÉER LES SIGNALEMENTS =============
print("\n9️⃣  Créer les Signalements...")

reports_data = [
    {
        'type_signalement': 'ACCIDENT',
        'titre': 'Accident léger Ligne 1',
        'description': 'Collision mineure à l\'arrêt central',
        'priorite': 'HAUTE',
        'statut': 'EN_COURS',
        'latitude': 18.0735,
        'longitude': -15.9582,
    },
    {
        'type_signalement': 'PANNE_MECANIQUE',
        'titre': 'Problème climatisation Bus 3',
        'description': 'AC en panne depuis 30 minutes',
        'priorite': 'NORMALE',
        'statut': 'NOUVEAU',
        'latitude': 18.0750,
        'longitude': -15.9600,
    },
    {
        'type_signalement': 'PLAINTE_PASSAGER',
        'titre': 'Plainte chauffeur agressif',
        'description': 'Comportement inapproprié du chauffeur',
        'priorite': 'HAUTE',
        'statut': 'NOUVEAU',
        'latitude': 18.0700,
        'longitude': -15.9550,
    },
    {
        'type_signalement': 'INCIDENT_ROUTE',
        'titre': 'Embouteillage Teyarett',
        'description': 'Trafic intense, retard probable',
        'priorite': 'NORMALE',
        'statut': 'EN_COURS',
        'latitude': 18.0800,
        'longitude': -15.9650,
    },
    {
        'type_signalement': 'PERTE_OBJET',
        'titre': 'Objet perdu dans Bus 2',
        'description': 'Portefeuille trouvé dans le bus',
        'priorite': 'BASSE',
        'statut': 'NOUVEAU',
        'latitude': 18.0850,
        'longitude': -15.9700,
    },
]

reports_count = 0
for report_data in reports_data:
    report = Report.objects.create(**report_data)
    reports_count += 1

print(f"   ✅ {reports_count} signalements créés")

# ============= 10. CRÉER LES ALERTES SYSTÈME =============
print("\n🔟 Créer les Alertes Système...")

alerts_data = [
    {
        'type_alerte': 'BUS_ARRETE_LONGTEMPS',
        'description': 'Bus #1 arrêté depuis 15 minutes',
        'est_actif': True,
    },
    {
        'type_alerte': 'VITESSE_EXCESSIVE',
        'description': 'Bus #4 dépasse les limites de vitesse',
        'est_actif': True,
    },
    {
        'type_alerte': 'GPS_PERDU',
        'description': 'Signal GPS perdu pour Bus #5',
        'est_actif': True,
    },
    {
        'type_alerte': 'MAINTENANCE_DUE',
        'description': 'Bus #2 maintenance programmée',
        'est_actif': False,
    },
    {
        'type_alerte': 'CHAUFFEUR_INACTIF',
        'description': 'Chauffeur DRV-0005 inactif depuis 2 heures',
        'est_actif': True,
    },
]

alerts_count = 0
for alert_data in alerts_data:
    alert = SystemAlert.objects.create(**alert_data)
    alerts_count += 1

print(f"   ✅ {alerts_count} alertes système créées")

# ============= RÉSUMÉ =============
print("\n" + "="*60)
print("✨ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS!")
print("="*60)
print(f"\n📊 RÉSUMÉ:")
print(f"   ✅ Admins: {Admin.objects.count()}")
print(f"   ✅ Chauffeurs: {Driver.objects.count()}")
print(f"   ✅ Bus: {Bus.objects.count()}")
print(f"   ✅ Lignes: {Line.objects.count()}")
print(f"   ✅ Arrêts: {Stop.objects.count()}")
print(f"   ✅ Trajets: {Trip.objects.count()}")
print(f"   ✅ Positions GPS: {GPSPosition.objects.count()}")
print(f"   ✅ Paiements: {Payment.objects.count()}")
print(f"   ✅ Signalements: {Report.objects.count()}")
print(f"   ✅ Alertes: {SystemAlert.objects.count()}")

print("\n🔐 IDENTIFIANTS DE CONNEXION:")
print(f"   Matricule: ADMN-001")
print(f"   Mot de passe: SecurePass123!")
print(f"   Email: jean.dupont@mauribus.com")

print("\n🌐 URLs D'ACCÈS:")
print(f"   Django Admin: http://localhost:8000/admin")
print(f"   API Root: http://localhost:8000/api/v1/")
print(f"   API Docs: http://localhost:8000/api/docs")
print(f"   Frontend Login: http://localhost:5173/login")

print("\n" + "="*60)
