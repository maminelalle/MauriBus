@echo off
setlocal enabledelayedexpansion

echo ================================
echo 🚀 INITIALISATION MAURIBUS
echo Database: SQLite (Simple et sans dépendances)
echo ================================
echo.

REM Aller au répertoire backend
cd /d "%~dp0backend\mauribus_project"

echo 1. Installation des dépendances...
pip install -r requirements.txt

if errorlevel 1 (
    echo Erreur lors de l'installation!
    exit /b 1
)

echo.
echo 2. Exécution des migrations...
python manage.py migrate

if errorlevel 1 (
    echo Erreur pendant les migrations!
    exit /b 1
)

echo.
echo 3. Création des données de test...
python manage.py shell < ..\..\load_test_data.py

if errorlevel 1 (
    echo Erreur en chargeant les données de test!
    exit /b 1
)

echo.
echo ================================
echo ^>INITIALISATION COMPLETEE!
echo ================================
echo.
echo Base de données: db.sqlite3 créée
echo.
echo Prochaines étapes:
echo 1. Terminal 1: cd backend\mauribus_project ^&^& python manage.py runserver
echo 2. Terminal 2: cd admin-frontend ^&^& npm run dev
echo 3. Ouvrez: http://localhost:5173/login
echo.
echo Identifiants:
echo    Matricule: ADMN-001
echo    Mot de passe: SecurePass123!
echo.
pause
