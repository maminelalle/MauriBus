# 📘 CAHIER DES CHARGES COMPLET
## Application de Gestion et Géolocalisation des Bus – Nouakchott

---

## 1️⃣ PRÉSENTATION DU PROJET

### Nom du Projet
**MauriBus Tracking System** (provisoire)

### Objectif Général
Créer une plateforme permettant :
- 📍 Suivi en temps réel des bus à Nouakchott
- 📱 Application mobile pour citoyens
- 📱 Application mobile pour chauffeurs
- 💻 Interface Web Admin
- 💳 Paiement via Bankily ou espèces
- 🚌 Gestion complète des trajets et affectations

---

## 2️⃣ ACTEURS DU SYSTÈME

1. **Administrateur** - Gestion complète du système
2. **Chauffeur** - Suivi des trajets et paiements
3. **Citoyen** - Suivi en temps réel
4. **Entreprise de transport** - Gestion de flotte

---

## 3️⃣ ARCHITECTURE TECHNIQUE RECOMMANDÉE

### 📱 Mobile
- React Native
- Expo

### 💻 Backend
- Django
- Django REST Framework
- WebSockets (Django Channels)

### 🗄 Base de données
- PostgreSQL (❌ Pas SQLite en production)

### ✅ Infrastructure
- Docker + Docker Compose pour développement
- Redis pour caching et WebSockets
- Nginx reverse proxy en production

---

## 4️⃣ STRUCTURE DES COMPTES ET AUTHENTIFICATION

### 🔐 ADMINISTRATEUR

**Connexion:**
- Matricule (format: ADMN-001)
- Mot de passe

**Création:**
- Seul un super-admin peut créer des admins

**Informations obligatoires:**
- Matricule (auto-généré)
- Nom
- Prénom
- Email
- Mot de passe (hashé - bcrypt)
- Numéro téléphone
- NNI
- Date création
- Statut (actif / suspendu)

**Rôles:**
- SUPER_ADMIN - Gère autres admins
- ADMIN - Gestion complète
- MODERATOR - Actions limitées

---

### 🚍 CHAUFFEUR

**Connexion:**
- Matricule (format: DRV-0001)
- Mot de passe

**Création:**
- Créé uniquement par Admin
- Chauffeur ne peut PAS créer son compte

**Informations obligatoires:**
- Matricule (auto-généré: DRV-0001, DRV-0002...)
- Nom
- Prénom
- Email
- Téléphone
- NNI
- Photo
- Adresse
- Permis de conduire (numéro + date expiration)
- Statut (actif/suspendu/congé)
- Bus assigné
- Date embauche

---

### 👤 CITOYEN

- Pas de compte obligatoire
- Accès public limité:
  - Voir les lignes
  - Voir les trajets
  - Voir les bus en temps réel
  
- Compte optionnel pour:
  - Abonnement entreprise
  - Carte mensuelle
  - Offres spéciales

---

## 5️⃣ GESTION DES BUS

Chaque bus doit contenir :
- ✅ Numéro bus unique
- ✅ Numéro Bankily
- ✅ Plaque
- ✅ Capacité
- ✅ Description
- ✅ Statut (actif / maintenance)
- ✅ Chauffeur assigné
- ✅ Ligne assignée
- ✅ Marque et année fabrication
- ✅ Date dernière maintenance
- ✅ État des places disponibles

---

## 6️⃣ GESTION DES LIGNES

Une ligne contient :
- ✅ Nom ligne
- ✅ Code unique (L1, L2, etc)
- ✅ Description
- ✅ Liste des arrêts (avec ordre et GPS)
- ✅ Heure départ
- ✅ Heure fin
- ✅ Fréquence (minutes)
- ✅ Carte GPS des points
- ✅ Distance totale
- ✅ Couleur affichage

---

## 7️⃣ FONCTIONNALITÉS DÉTAILLÉES

### 📱 APPLICATION CHAUFFEUR

**Écran principal:**
- Bus assigné
- Ligne assignée
- Bouton "Démarrer Trajet"

**Pendant trajet:**
- GPS actif
- Envoi position toutes les 3–5 secondes
- Boutons:
  - Pause
  - Accident
  - Problème mécanique
  - Fin trajet
  - Indiquer places disponibles

**Historique:**
- Trajets effectués
- Paiements reçus
- Statistiques personnelles

---

### 📱 APPLICATION CITOYEN

**Accueil:**
- Carte Nouakchott
- Bus en temps réel

**Cliquer sur bus:**
- Ligne
- Prochain arrêt
- Temps estimé (ETA)
- Numéro Bankily

**Paiement:**
- Paiement Bankily direct
- Upload capture écran
- Option espèces

---

### 💻 ADMIN WEB DASHBOARD

**Dashboard:**
- Nombre bus actifs
- Chauffeurs en ligne
- Trajets en cours
- Signalements
- Paiements
- Graphiques temps réel

**Gestion:**
- ✅ Créer/modifier chauffeur
- ✅ Créer/modifier admin
- ✅ Créer/modifier bus
- ✅ Créer/modifier ligne
- ✅ Affecter chauffeur ↔ bus
- ✅ Voir historique complet
- ✅ Validation paiements
- ✅ Résolution signalements

---

## 8️⃣ STRUCTURE BASE DE DONNÉES

Tables principales:
- ✅ Admin
- ✅ Driver (Chauffeur)
- ✅ Bus
- ✅ Line (Ligne)
- ✅ Stop (Arrêt)
- ✅ Trip (Trajet)
- ✅ GPSPosition (Positions temps réel)
- ✅ Payment (Paiements)
- ✅ PaymentAlert (Alertes paiement)
- ✅ Report (Signalements)
- ✅ SystemAlert (Alertes système)

---

## 9️⃣ SÉCURITÉ

- ✅ Mots de passe hashés (bcrypt)
- ✅ JWT pour mobile
- ✅ HTTPS obligatoire
- ✅ Protection GPS spoofing
- ✅ Journal d'activité complet (logs)
- ✅ CORS configuré
- ✅ Rate limiting
- ✅ Validation des données côté serveur

---

## ✅ FONCTIONNALITÉS AVANCÉES

### ✅ 1. Système d'alerte automatique
- Si bus s'arrête trop longtemps → notification admin
- Délai configurable (défaut: 5 minutes)

### ✅ 2. Historique GPS complet
- Pour vérifier trajets
- Résoudre plaintes
- Optimiser lignes

### ✅ 3. Système d'estimation d'arrivée (ETA)
- Calcul basé sur:
  - Position actuelle
  - Distance arrêt
  - Vitesse moyenne
  - Trafic (optionnel)

### ✅ 4. Mode hors connexion chauffeur
- Si internet coupe:
  - Sauvegarde positions locales
  - Envoie quand réseau revient
  - Notification au retour

### ✅ 5. Système de rôle "Super Admin"
- Gérer autres admins
- Modifier configuration système
- Accès logs complets

### ✅ 6. Tableau Statistique
- Bus le plus rentable
- Chauffeur le plus actif
- Ligne la plus utilisée
- Revenue par ligne/jour
- Taux incidents

### ✅ 7. Contrôle capacité bus
- Chauffeur peut indiquer:
  - Bus plein
  - Places disponibles (nombre exact)
- Citoyen voit statut en temps réel

### ✅ 8. Système anti-fraude paiement
- Code unique généré après paiement
- QR code validation (future)
- Log de validation admin
- Montant avec photo capture

### ✅ 9. Notifications Push
- Bus arrive bientôt
- Retard annoncé
- Accident signalé
- Ligne annulée
- Paiement validé

### ✅ 10. Version future (Phase 2)
- Carte mensuelle digitale
- Paiement intégré API Bankily
- Notation chauffeur (1-5 étoiles)
- Support multilingue (Arabe / Français)
- Mode sombre interface
- Export Excel rapports
- Analyse prédictive trafic

---

## 🎨 INTERFACE ADMIN - DESIGN SYSTEM

### Couleurs Principales
- 🔵 Bleu principal: #1E3A8A
- 🔹 Bleu clair: #3B82F6
- 🟢 Vert succès: #10B981
- 🟠 Orange alerte: #F59E0B
- 🔴 Rouge danger: #EF4444
- ⚪ Fond clair: #F8FAFC
- ⚫ Texte: #0F172A

### Style
- Interface claire et professionnelle
- Peu de couleurs mais bien utilisées
- Informations importantes visibles immédiatement
- Navigation simple à gauche
- Données au centre
- Actions à droite

### Pages Principales
1. **Login** - Formulaire centré, glass effect
2. **Dashboard** - Cartes statistiques, graphiques, alertes
3. **Chauffeurs** - Tableau, CRUD, historique
4. **Bus** - Gestion complète
5. **Lignes** - Création, géolocalisation
6. **Paiements** - Validation avec photo
7. **Signalements** - Gestion incidents
8. **Statistiques** - Rapports et graphiques
9. **Paramètres** - Configuration système

---

## 📋 STRUCTURE FICHIERS CRÉÉE

```
MauriBus_Try/
├── backend/
│   ├── mauribus_project/
│   │   ├── core/
│   │   │   ├── models/          #✅ CRÉÉ
│   │   │   ├── views/
│   │   │   ├── serializers/     #✅ CRÉÉ
│   │   │   └── middleware/
│   │   ├── config/
│   │   │   ├── settings.py      #✅ CRÉÉ
│   │   │   └── urls.py          #✅ CRÉÉ
│   │   └── requirements.txt     #✅ CRÉÉ
│   ├── .env                     #✅ CRÉÉ
│   └── README.md                #✅ CRÉÉ
│
├── admin-frontend/
│   ├── src/
│   │   ├── components/          #✅ CRÉÉ (Sidebar, Header)
│   │   ├── pages/              #✅ CRÉÉ (Login, Dashboard, Drivers)
│   │   ├── context/            #✅ CRÉÉ (Auth)
│   │   ├── utils/              #✅ CRÉÉ (API)
│   │   ├── styles/             #✅ CRÉÉ (globals.css)
│   │   ├── App.jsx             #✅ CRÉÉ
│   │   └── main.jsx            #✅ CRÉÉ
│   ├── index.html              #✅ CRÉÉ
│   ├── package.json            #✅ CRÉÉ
│   ├── vite.config.js          #✅ CRÉÉ
│   ├── tailwind.config.js      #✅ CRÉÉ
│   ├── postcss.config.js       #✅ CRÉÉ
│   ├── .env.local              #✅ CRÉÉ
│   └── README.md               #✅ CRÉÉ
│
├── driver-mobile/  (À créer - Phase 2)
├── citizen-mobile/ (À créer - Phase 2)
├── README.md                   #✅ CRÉÉ
└── docs/
```

---

## 🚀 PROCHAINES ÉTAPES

### Phase 1 (Actuellement)
✅ Structure de base créée
- [ ] ViewSets Django REST Framework
- [ ] Tests unitaires
- [ ] API endpoints complets
- [ ] Authentification JWT fully fonctionnelle
- [ ] Pages admin manquantes (Buses, Lines, Payments, Reports, Statistics)
- [ ] Intégration WebSockets temps réel

### Phase 2
- [ ] Application mobile chauffeur (React Native)
- [ ] Application mobile citoyen (React Native)
- [ ] Mode sombre
- [ ] Support multilingue
- [ ] Paiement Bankily intégré
- [ ] Notifications Push

### Phase 3
- [ ] Analytics avancées
- [ ] Machine Learning pour prédiction trafic
- [ ] Système de rating chauffeur
- [ ] Carte mensuelle digitale

---

## 📞 CONTACTS & SUPPORT

**Projet**: MauriBus Tracking System
**Ville**: Nouakchott, Mauritanie
**Année**: 2024

---

**Créé avec ❤️ pour Nouakchott**
