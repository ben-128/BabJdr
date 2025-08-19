@echo off
title JDR-BAB - Serveur Propre (Sans Live Reload)
color 0A

echo.
echo ========================================
echo   JDR-BAB - SERVEUR PROPRE
echo ========================================
echo.

cd /d "%~dp0"

:: Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo [ERREUR] package.json non trouvé !
    echo Assurez-vous d'être dans le dossier du projet
    echo.
    pause
    exit /b 1
)

echo [INFO] Démarrage du serveur HTTP propre...
echo [INFO] Aucun live reload - rechargement manuel nécessaire
echo.
echo ========================================
echo   SERVEUR EN COURS D'EXÉCUTION
echo ========================================
echo.
echo 🌐 URL : http://localhost:3000
echo 🛠️ Mode : Développement (SANS live reload)
echo 📝 Édition : Activée
echo 🧹 Console : Propre (pas de logs parasites)
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo ========================================
echo.

:: Lancer le serveur propre
call npm run dev-clean

echo.
echo [INFO] Serveur arrêté
pause