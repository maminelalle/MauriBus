# 🚌 MauriBus Tracking System

A complete platform for bus operations management and real-time geolocation in Nouakchott.

## 📋 Project Architecture

```text
MauriBus_Try/
├── backend/                    # Django REST API
│   ├── mauribus_project/
│   │   ├── core/              # Main app
│   │   │   ├── models/        # DB models
│   │   │   ├── views/         # ViewSets
│   │   │   ├── serializers/   # DRF serializers
│   │   │   └── middleware/    # Auth, logs
│   │   ├── manage.py
│   │   ├── requirements.txt
│   │   └── settings.py
│   └── .env
│
├── admin-frontend/             # React Manager Dashboard
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Main pages
│   │   ├── context/           # Auth context
│   │   ├─�� hooks/             # Custom hooks
│   │   ├── utils/             # API calls, helpers
│   │   └── styles/            # Tailwind + custom CSS
│   ├── package.json
│   └── .env.local
│
├── driver-mobile/              # React Native - Drivers
├── citizen-mobile/             # React Native - Citizens
└── docs/                       # Documentation
```

## 🖼️ Screenshots

Project UI screenshots are available in the `screenhot/` folder.

> Update the paths below to match your exact filenames.

- ![Admin dashboard](screenhot/1.png)
- ![Bus tracking map](screenhot/2.png)
- ![Driver app](screenhot/3.png)
- ![Citizen app](screenhot/4.png)

## 🔥 Ultra Quick Start (With Test Data)

### ⚡ 3 commands to get online in ~5 minutes

**Terminal 1 — Backend:**
```bash
cd backend/mauribus_project
python manage.py migrate
python manage.py runserver
```

**Terminal 2 — Frontend:**
```bash
cd admin-frontend
npm run dev
```

**Browser:**
```text
http://localhost:5173/login
```

### 🔐 Test credentials
- **ID (Matricule):** `ADMN-001`
- **Password:** `SecurePass123!`

### 📊 Automatically created test data
- ✅ 5 admins (ADMN-001 to ADMN-005)
- ✅ 5 drivers (DRV-0001 to DRV-0005)
- ✅ 5 buses (BUS-001 to BUS-005)
- ✅ 5 lines + 25 stops
- ✅ 5 trips, payments, reports
- ✅ 15 real-time GPS positions

---

## 📚 Full Documentation

| Document | Content |
|----------|---------|
| **ACCES_RAPIDE.md** | Start here — URLs, credentials, troubleshooting |
| **QUICK_START_TEST.md** | Detailed startup guide |
| **TEST_PLAN.md** | Complete test plan (13 categories) |
| **PostmanCollection_MauriBus.json** | Postman collection ready to import |

---

## 🧩 Full Setup

### Backend
```bash
cd backend/mauribus_project
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Manager Frontend
```bash
cd admin-frontend
npm install
npm run dev
```

## 🎯 Features

- ✅ Real-time dashboard
- ✅ Driver management (CRUD)
- ✅ Bus & line management
- ✅ Real-time GPS tracking
- ✅ Payments management
- ✅ Statistics & reports
- ✅ Alerting system
- ✅ JWT authentication

## 🔐 Security

- Hashed passwords (bcrypt)
- JWT authentication
- HTTPS required (production)
- Activity logs
- GPS spoofing protection
- Role-based access control (RBAC)

---

Created for Nouakchott
