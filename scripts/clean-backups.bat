@echo off
title JDR-BAB - Nettoyage des sauvegardes
color 0E

echo.
echo ========================================
echo   JDR-BAB - NETTOYAGE DES SAUVEGARDES
echo ========================================
echo.

set "PROJECT_PATH=%~dp0.."
cd /d "%PROJECT_PATH%"

:: Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo [ERREUR] package.json non trouvé !
    echo Assurez-vous d'être dans le dossier du projet
    echo.
    pause
    exit /b 1
)

echo [INFO] Recherche des dossiers de sauvegarde dans Backups...
echo.

:: Vérifier si le dossier Backups existe
if not exist "Backups" (
    echo [INFO] Aucun dossier Backups trouvé
    echo.
    pause
    exit /b 0
)

cd Backups

:: Compter les dossiers de sauvegarde
set "BACKUP_COUNT=0"
for /d %%D in (backup-*) do (
    set /a BACKUP_COUNT+=1
    echo [TROUVÉ] Backups\%%D
)

if %BACKUP_COUNT%==0 (
    echo [INFO] Aucun dossier de sauvegarde trouvé
    echo.
    pause
    exit /b 0
)

echo.
echo [INFO] %BACKUP_COUNT% dossier(s) de sauvegarde trouvé(s)
echo.

:: Demander confirmation
choice /c AONS /m "Action à effectuer ? [A]ll (tout supprimer) / [O]ld (garder le plus récent) / [N]on / [S]electif"

if errorlevel 4 goto :selective
if errorlevel 3 goto :cancel
if errorlevel 2 goto :keep_recent
if errorlevel 1 goto :delete_all

:delete_all
echo.
echo [INFO] Suppression de tous les dossiers de sauvegarde...
for /d %%D in (backup-*) do (
    echo [SUPPRESSION] %%D
    :: Retirer tous les attributs pour forcer la suppression
    attrib -R -S -H "%%D\*.*" /S >nul 2>&1
    attrib -R -S -H "%%D" >nul 2>&1
    rmdir /s /q "%%D" >nul 2>&1
    if exist "%%D" (
        echo [ERREUR] Impossible de supprimer %%D
    ) else (
        echo [OK] %%D supprimé
    )
)
goto :end

:keep_recent
echo.
echo [INFO] Conservation du dossier le plus récent, suppression des autres...
:: Trier par date et garder le plus récent
set "NEWEST="
for /f "delims=" %%D in ('dir backup-* /b /ad /o-d 2^>nul') do (
    if not defined NEWEST (
        set "NEWEST=%%D"
        echo [CONSERVÉ] %%D
    ) else (
        echo [SUPPRESSION] %%D
        attrib -R -S -H "%%D\*.*" /S >nul 2>&1
        attrib -R -S -H "%%D" >nul 2>&1
        rmdir /s /q "%%D" >nul 2>&1
        if exist "%%D" (
            echo [ERREUR] Impossible de supprimer %%D
        ) else (
            echo [OK] %%D supprimé
        )
    )
)
goto :end

:selective
echo.
echo [INFO] Mode sélectif - choisissez les dossiers à supprimer
echo.
for /d %%D in (backup-*) do (
    choice /c ON /m "Supprimer %%D ? [O]ui / [N]on"
    if !errorlevel! == 1 (
        echo [SUPPRESSION] %%D
        attrib -R -S -H "%%D\*.*" /S >nul 2>&1
        attrib -R -S -H "%%D" >nul 2>&1
        rmdir /s /q "%%D" >nul 2>&1
        if exist "%%D" (
            echo [ERREUR] Impossible de supprimer %%D
        ) else (
            echo [OK] %%D supprimé
        )
    ) else (
        echo [CONSERVÉ] %%D
    )
    echo.
)
goto :end

:cancel
echo.
echo [INFO] Nettoyage annulé par l'utilisateur
goto :end

:end
echo.
echo ========================================
echo   NETTOYAGE TERMINÉ
echo ========================================
echo.
pause
exit /b 0