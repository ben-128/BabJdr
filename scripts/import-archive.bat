@echo off
title JDR-BAB - Import Archive
color 0C

echo.
echo ========================================
echo   JDR-BAB - IMPORT ARCHIVE ZIP
echo ========================================
echo.

:: Configuration - Modifiez ce chemin si nécessaire
set "DOWNLOAD_PATH=%USERPROFILE%\Downloads"
set "PROJECT_PATH=%~dp0.."

cd /d "%PROJECT_PATH%"

:: Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo [ERREUR] package.json non trouvé !
    echo Assurez-vous d'être dans le dossier du projet
    echo.
    set /p "temp=Appuyez sur Entree pour continuer..." <nul
    exit /b 1
)

echo [INFO] Chemin de téléchargement : %DOWNLOAD_PATH%
echo [INFO] Chemin du projet : %PROJECT_PATH%
echo.

:: Vérifier que le dossier de téléchargement existe
if not exist "%DOWNLOAD_PATH%" (
    echo [ERREUR] Le dossier de téléchargement n'existe pas !
    echo Vérifiez le chemin : %DOWNLOAD_PATH%
    echo.
    set /p "temp=Appuyez sur Entree pour continuer..." <nul
    exit /b 1
)

:: Trouver la dernière archive JdrBab-*.zip
echo [INFO] Recherche de la dernière archive JdrBab-*.zip...
set "LATEST_ARCHIVE="
set "LATEST_DATE="

for /f "delims=" %%F in ('dir "%DOWNLOAD_PATH%\JdrBab-*.zip" /b /o-d 2^>nul') do (
    if not defined LATEST_ARCHIVE (
        set "LATEST_ARCHIVE=%%F"
        goto :found
    )
)

:found
if not defined LATEST_ARCHIVE (
    echo [ERREUR] Aucune archive JdrBab-*.zip trouvée dans %DOWNLOAD_PATH%
    echo.
    set /p "temp=Appuyez sur Entree pour continuer..." <nul
    exit /b 1
)

set "ARCHIVE_FULL_PATH=%DOWNLOAD_PATH%\%LATEST_ARCHIVE%"
echo [OK] Archive trouvée : %LATEST_ARCHIVE%
echo [INFO] Chemin complet : %ARCHIVE_FULL_PATH%
echo.

:: Import automatique sans confirmation

:: Copier l'archive dans le projet
echo [INFO] Copie de l'archive dans le projet...
copy "%ARCHIVE_FULL_PATH%" "%PROJECT_PATH%temp-import.zip" >nul
if errorlevel 1 (
    echo [ERREUR] Échec de la copie de l'archive !
    set /p "temp=Appuyez sur Entree pour continuer..." <nul
    exit /b 1
)

:: Vérifier si PowerShell est disponible pour l'extraction
powershell -Command "Get-Command Expand-Archive" >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] PowerShell ou Expand-Archive non disponible !
    echo Veuillez extraire manuellement l'archive temp-import.zip
    set /p "temp=Appuyez sur Entree pour continuer..." <nul
    exit /b 1
)

:: Créer un dossier temporaire pour l'extraction
set "TEMP_EXTRACT=%PROJECT_PATH%temp-extract"
if exist "%TEMP_EXTRACT%" (
    echo [INFO] Suppression du dossier temporaire existant...
    rmdir /s /q "%TEMP_EXTRACT%"
)

mkdir "%TEMP_EXTRACT%"

:: Extraire l'archive avec PowerShell (suppression du bruit)
echo [INFO] Extraction de l'archive...
powershell -Command "Expand-Archive -Path '%PROJECT_PATH%temp-import.zip' -DestinationPath '%TEMP_EXTRACT%' -Force" >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Échec de l'extraction de l'archive !
    goto :cleanup
)

echo [OK] Archive extraite avec succès
echo.

:: Sauvegarder les fichiers actuels (optionnel)
echo [INFO] Sauvegarde des fichiers actuels...
:: Créer le dossier Backups s'il n'existe pas (dans le répertoire du projet)
if not exist "%PROJECT_PATH%\Backups" mkdir "%PROJECT_PATH%\Backups"
set "BACKUP_DIR=%PROJECT_PATH%\Backups\backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "BACKUP_DIR=%BACKUP_DIR: =0%"

:: Créer le dossier de sauvegarde avec permissions normales
mkdir "%BACKUP_DIR%" 2>nul

:: Copier les fichiers avec attributs normaux
if exist "data" (
    xcopy "data" "%BACKUP_DIR%\data\" /E /I /Q >nul 2>&1
    :: Retirer les attributs en lecture seule/système pour faciliter la suppression
    attrib -R -S -H "%BACKUP_DIR%\data\*.*" /S >nul 2>&1
)
if exist "css" (
    xcopy "css" "%BACKUP_DIR%\css\" /E /I /Q >nul 2>&1
    attrib -R -S -H "%BACKUP_DIR%\css\*.*" /S >nul 2>&1
)
if exist "js" (
    xcopy "js" "%BACKUP_DIR%\js\" /E /I /Q >nul 2>&1
    attrib -R -S -H "%BACKUP_DIR%\js\*.*" /S >nul 2>&1
)

:: Retirer les attributs du dossier principal de sauvegarde
attrib -R -S -H "%BACKUP_DIR%" >nul 2>&1

echo [OK] Sauvegarde créée dans : %BACKUP_DIR%
echo.

:: Copier les fichiers extraits
echo [INFO] Import des fichiers...

:: Copier les dossiers data, css, js
if exist "%TEMP_EXTRACT%\data" (
    echo [INFO] Import des données...
    xcopy "%TEMP_EXTRACT%\data" "data\" /E /I /Y /Q >nul
    if errorlevel 1 (
        echo [ATTENTION] Erreur lors de l'import des données
    ) else (
        echo [OK] Données importées
    )
)

if exist "%TEMP_EXTRACT%\css" (
    echo [INFO] Import des styles CSS...
    xcopy "%TEMP_EXTRACT%\css" "css\" /E /I /Y /Q >nul
    if errorlevel 1 (
        echo [ATTENTION] Erreur lors de l'import des CSS
    ) else (
        echo [OK] CSS importés
    )
)

if exist "%TEMP_EXTRACT%\js" (
    echo [INFO] Import des scripts JavaScript...
    xcopy "%TEMP_EXTRACT%\js" "js\" /E /I /Y /Q >nul
    if errorlevel 1 (
        echo [ATTENTION] Erreur lors de l'import des JS
    ) else (
        echo [OK] JavaScript importés
    )
)

:: Copier index.html si présent
if exist "%TEMP_EXTRACT%\index.html" (
    echo [INFO] Import de index.html...
    copy "%TEMP_EXTRACT%\index.html" "index.html" /Y >nul
    if errorlevel 1 (
        echo [ATTENTION] Erreur lors de l'import de index.html
    ) else (
        echo [OK] index.html importé
    )
)

:: Copier package.json si présent
if exist "%TEMP_EXTRACT%\package.json" (
    echo [INFO] Import de package.json...
    copy "%TEMP_EXTRACT%\package.json" "package.json" /Y >nul
    if errorlevel 1 (
        echo [ATTENTION] Erreur lors de l'import de package.json
    ) else (
        echo [OK] package.json importé
    )
)


:cleanup
echo.
echo [INFO] Nettoyage des fichiers temporaires...

:: Supprimer l'archive temporaire
if exist "%PROJECT_PATH%temp-import.zip" (
    del "%PROJECT_PATH%temp-import.zip" >nul 2>&1
)

:: Supprimer le dossier d'extraction temporaire
if exist "%TEMP_EXTRACT%" (
    rmdir /s /q "%TEMP_EXTRACT%" >nul 2>&1
)

:: Supprimer l'archive originale des téléchargements
if exist "%ARCHIVE_FULL_PATH%" (
    del "%ARCHIVE_FULL_PATH%" >nul 2>&1
    if errorlevel 1 (
        echo [ATTENTION] Impossible de supprimer l'archive originale
        echo Chemin : %ARCHIVE_FULL_PATH%
    ) else (
        echo [OK] Archive originale supprimée des téléchargements
    )
)

echo.
echo ========================================
echo   IMPORT TERMINÉ AVEC SUCCÈS !
echo ========================================
echo.
echo Les fichiers ont été importés et remplacent les anciens.
echo Une sauvegarde a été créée dans : %BACKUP_DIR%
echo.
echo [INFO] Les nouvelles sections sont maintenant disponibles !
echo Le localStorage est automatiquement vidé à chaque rechargement.
echo.
echo Vous pouvez maintenant lancer le projet avec :
echo   npm run dev
echo.

set /p "temp=Appuyez sur Entree pour continuer..." <nul