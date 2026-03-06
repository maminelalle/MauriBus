# 🚌 MauriBus Tracking System

Plateforme complète de gestion et géolocalisation des bus à Nouakchott.

## 📋 Architecture du Projet

```
MauriBus_Try/
├── backend/                    # Django REST API
│   ├── mauribus_project/
│   │   ├── core/              # App principale
│   │   │   ├── models/        # BD models
│   │   │   ├── views/         # ViewSets
│   │   │   ├── serializers/   # DRF Serializers
│   │   │   └── middleware/    # Auth, Logs
│   │   ├── manage.py
│   │   ├── requirements.txt
│   │   └── settings.py
│   └── .env
│
├── admin-frontend/             # React Manager Dashboard
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   ├── pages/            # Pages principales
│   │   ├── context/          # Auth Context
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # API calls, helpers
│   │   └── styles/           # Tailwind, custom CSS
│   ├── package.json
│   └── .env.local
│
├── driver-mobile/              # React Native - Chauffeurs
├── citizen-mobile/             # React Native - Citoyens
└── docs/                       # Documentation
```

## 🔥 Démarrage Ultra-Rapide (Avec Données de Test)

### ⚡ 3 Commandes qui vous mettent en ligne en 5 minutes:

**Terminal 1 - Backend:**
```bash
cd backend/mauribus_project
python manage.py migrate
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd admin-frontend
npm run dev
```

**Navigateur:**
```
http://localhost:5173/login
```

### 🔐 Identifiants Test:
- **Matricule**: `ADMN-001`
- **Mot de passe**: `SecurePass123!`

### 📊 Données Créées Automatiquement:
- ✅ 5 Admins (ADMN-001 à ADMN-005)
- ✅ 5 Chauffeurs (DRV-0001 à DRV-0005)
- ✅ 5 Bus (BUS-001 à BUS-005)
- ✅ 5 Lignes + 25 Arrêts
- ✅ 5 Trajets, Paiements, Signalements
- ✅ 15 Positions GPS en temps réel

---

## 📚 Documentation Complète

| Document | Contenu |
|----------|---------|
| **ACCES_RAPIDE.md** | START HERE - URLs, credentials, troubleshooting |
| **QUICK_START_TEST.md** | Guide détaillé de démarrage |
| **TEST_PLAN.md** | Plan de test exhaustif (13 catégories) |
| **PostmanCollection_MauriBus.json** | Collection Postman prête à importer |

---

## 🔥 Démarrage Setup Complet

### Backend
```bash
cd backend/mauribus_project
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Manager
```bash
cd admin-frontend
npm install
npm run dev
```

## 🎯 Fonctionnalités Complètes

✅ Dashboard en temps réel
✅ Gestion des chauffeurs (CRUD)
✅ Gestion des bus et lignes
✅ Suivi GPS en temps réel
✅ Gestion des paiements
✅ Statistiques et rapports
✅ Système d'alertes
✅ Authentification JWT

## 🔐 Sécurité

- Mots de passe hashés (bcrypt)
- JWT pour l'authentification
- HTTPS obligatoire
- Logs d'activité complets
- Protection contre le spoofing GPS
- Role-based access control (RBAC)

---
Created with ❤️ for Nouakchott
