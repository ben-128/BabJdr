@echo off
setlocal enabledelayedexpansion
title JDR-BAB - Build Standalone
color 0A

echo.
echo ========================================
echo   JDR-BAB - BUILD STANDALONE
echo ========================================
echo.

cd /d "%~dp0.."

:: Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo [ERREUR] package.json non trouvé !
    echo Assurez-vous d'être dans le dossier du projet
    echo.
    pause
    exit /b 1
)

echo [INFO] Génération de la version standalone...
echo.

:: Lancer le build (suppression du bruit npm)
call npm run build >nul 2>&1

if errorlevel 1 (
    echo.
    echo [ERREUR] Échec du build !
    echo.
) else (
    echo.
    echo ========================================
    echo   BUILD TERMINÉ AVEC SUCCÈS !
    echo ========================================
    echo.
    
    :: Vérifier que le fichier a été créé
    if exist "build-output\JdrBab.html" (
        echo [OK] Fichier généré : build-output\JdrBab.html
        
        :: Afficher la taille du fichier
        for %%A in ("build-output\JdrBab.html") do (
            set /a sizeKB=%%~zA/1024
        )
        
        echo [INFO] Taille du fichier : !sizeKB! KB
        echo.
        echo ========================================
        echo   CHEMIN COMPLET DU FICHIER :
        echo ========================================
        echo %CD%\build-output\JdrBab.html
        echo ========================================
        echo.
        echo Le fichier JdrBab.html est prêt à être partagé !
        echo Il contient toutes les données et fonctionne sans serveur.
        echo.
        
        :: Proposer d'ouvrir le fichier
        choice /c ON /n /m "Ouvrir le fichier maintenant ? [O]ui / [N]on "
        if !errorlevel! == 1 (
            echo [INFO] Ouverture du fichier...
            start "" "%CD%\build-output\JdrBab.html"
        )
    ) else (
        echo [ERREUR] Le fichier JdrBab.html n'a pas été trouvé dans build-output\
        echo Chemin attendu : %CD%\build-output\JdrBab.html
    )
)

echo.
echo Appuyez sur une touche pour retourner au menu...
pause
exit /b 0