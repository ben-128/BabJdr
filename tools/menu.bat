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

choice /c 12345 /n /m "Choisissez une option [1-5] "

if errorlevel 5 goto :quit
if errorlevel 4 goto :clean
if errorlevel 3 goto :import
if errorlevel 2 goto :build
if errorlevel 1 goto :dev

:dev
echo.
echo [INFO] Lancement du serveur de développement...
pushd "%~dp0\.."
call scripts\dev-server.bat
popd
pause
goto :menu

:build
echo.
echo [INFO] Lancement du build standalone...
pushd "%~dp0\.."
call scripts\build.bat
popd
pause
goto :menu

:import
echo.
echo [INFO] Lancement de l'import d'archive...
pushd "%~dp0\.."
call scripts\import-archive.bat
popd
pause
goto :menu

:clean
echo.
echo [INFO] Lancement du nettoyage des sauvegardes...
pushd "%~dp0\.."
call scripts\clean-backups.bat
popd
pause
goto :menu

:quit
echo.
echo [INFO] Au revoir !
exit /b 0