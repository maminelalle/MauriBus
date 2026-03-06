#!/bin/bash
set -e

echo "================================"
echo "🚀 INITIALISATION MAURIBUS"
echo "Database: SQLite (Simple et sans dépendances)"
echo "================================"
echo ""

# Aller au répertoire backend
cd "$(dirname "$0")/backend/mauribus_project"

echo "1️⃣  Installation des dépendances..."
pip install -r requirements.txt

echo ""
echo "2️⃣  Exécution des migrations..."
python manage.py migrate

echo ""
echo "3️⃣  Création des données de test..."
python manage.py shell < ../../load_test_data.py

echo ""
echo "================================"
echo "✅ INITIALISATION TERMINÉE!"
echo "================================"
echo ""
echo "Base de données: db.sqlite3 créée"
echo ""
echo "Prochaines étapes:"
echo "1. Terminal 1: cd backend/mauribus_project && python manage.py runserver"
echo "2. Terminal 2: cd admin-frontend && npm run dev"
echo "3. Ouvrez: http://localhost:5173/login"
echo ""
echo "Identifiants:"
echo "   Matricule: ADMN-001"
echo "   Mot de passe: SecurePass123!"
