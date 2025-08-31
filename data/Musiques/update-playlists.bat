@echo off
title Mise a jour des playlists - BabJDR

echo.
echo ========================================================
echo  MISE A JOUR DES PLAYLISTS - BabJDR
echo ========================================================
echo.

node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe
    echo.
    pause
    exit /b 1
)

echo Scanning et mise a jour automatique...
echo.

node update-playlists.js

echo.
echo ========================================================
echo  TERMINE ! Rechargez la page audio dans votre navigateur
echo ========================================================
echo.
pause