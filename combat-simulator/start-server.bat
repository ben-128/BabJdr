@echo off
echo Demarrage du serveur local pour le Simulateur de Combat...
echo.

:: Se deplacer vers le dossier parent (BabJdr) pour les chemins relatifs
cd /d "%~dp0.."

:: Essayer Python 3
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Serveur Python demarre sur http://localhost:8000/combat-simulator/
    echo Appuyez sur Ctrl+C pour arreter le serveur.
    echo.
    start http://localhost:8000/combat-simulator/
    python -m http.server 8000
    goto :end
)

:: Essayer Python (ancien)
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo Serveur Python demarre sur http://localhost:8000/combat-simulator/
    start http://localhost:8000/combat-simulator/
    py -m http.server 8000
    goto :end
)

:: Essayer Node.js avec npx
npx --version >nul 2>&1
if %errorlevel% == 0 (
    echo Serveur Node.js demarre sur http://localhost:8080/combat-simulator/
    start http://localhost:8080/combat-simulator/
    npx http-server -p 8080
    goto :end
)

:: Aucun serveur trouve
echo ERREUR: Aucun serveur trouve.
echo Installez Python (https://python.org) ou Node.js (https://nodejs.org)
pause

:end
