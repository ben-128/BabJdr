@echo off
title JDR-BAB - Menu Principal
color 0B

:menu
cls
echo.
echo ========================================
echo   JDR-BAB - MENU PRINCIPAL
echo ========================================
echo.
echo [1] Serveur de développement
echo [2] Build standalone
echo [3] Import archive
echo [4] Nettoyage sauvegardes
echo [5] Quitter
echo.
echo ========================================

choice /c 12345 /m "Choisissez une option [1-5]"

if errorlevel 5 goto :quit
if errorlevel 4 goto :clean
if errorlevel 3 goto :import
if errorlevel 2 goto :build
if errorlevel 1 goto :dev

:dev
echo.
echo [INFO] Lancement du serveur de développement...
call scripts\dev-server.bat
goto :menu

:build
echo.
echo [INFO] Lancement du build standalone...
call scripts\build.bat
goto :menu

:import
echo.
echo [INFO] Lancement de l'import d'archive...
call scripts\import-archive.bat
goto :menu

:clean
echo.
echo [INFO] Lancement du nettoyage des sauvegardes...
call scripts\clean-backups.bat
goto :menu

:quit
echo.
echo [INFO] Au revoir !
exit /b 0