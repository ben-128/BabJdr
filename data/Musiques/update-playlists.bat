@echo off
title Mise a jour des playlists - BabJDR

echo.
echo ========================================================
echo  MISE A JOUR DES PLAYLISTS - BabJDR
echo ========================================================
echo.

REM Verifier si Node.js est disponible
node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js n'est pas installe ou pas dans le PATH
    echo.
    echo Veuillez installer Node.js depuis: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Scanning des fichiers musiques...
echo.

REM Executer le script de scan
node update-playlists.js

echo.
echo ========================================================
echo  SCAN TERMINE !
echo ========================================================
echo.
echo ETAPES SUIVANTES:
echo.
echo 1. Copiez la structure "const folderStructure = {...}" ci-dessus
echo 2. Ouvrez le fichier: js\modules\audio.js  
echo 3. Remplacez la structure ligne ~60-68 dans generatePlaylistsFromFolders()
echo 4. Sauvegardez et rechargez la page audio
echo.
echo ========================================================

echo.
pause