#!/usr/bin/env powershell

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 INITIALISATION MAURIBUS" -ForegroundColor Cyan
Write-Host "Database: SQLite (Simple et sans dépendances)" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Aller au répertoire backend
$backendPath = Join-Path (Split-Path $MyInvocation.MyCommand.Path) "backend\mauribus_project"
Set-Location $backendPath

Write-Host "1️⃣  Installation des dépendances..." -ForegroundColor Yellow
pip install -r requirements.txt
if (-not $?) {
    Write-Host "Erreur lors de l'installation des dépendances!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2️⃣  Exécution des migrations..." -ForegroundColor Yellow
python manage.py migrate

if (-not $?) {
    Write-Host "Erreur lors des migrations!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3️⃣  Création des données de test..." -ForegroundColor Yellow
$testDataScript = Join-Path (Split-Path $MyInvocation.MyCommand.Path) "load_test_data.py"
python manage.py shell < $testDataScript

if (-not $?) {
    Write-Host "Erreur en chargeant les données de test!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ INITIALISATION TERMINÉE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Base de données: db.sqlite3 créée" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Terminal 1: cd backend\mauribus_project ; python manage.py runserver"
Write-Host "2. Terminal 2: cd admin-frontend ; npm run dev"
Write-Host "3. Ouvrez: http://localhost:5173/login"
Write-Host ""
Write-Host "Identifiants:" -ForegroundColor Cyan
Write-Host "   Matricule: ADMN-001"
Write-Host "   Mot de passe: SecurePass123!"
