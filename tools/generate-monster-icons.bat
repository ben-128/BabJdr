@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Générateur d'Icônes de Monstres
echo ========================================
echo.
echo Ce script va:
echo   1. Créer des icônes (1cm x 2cm) pour chaque monstre
echo   2. Générer un PDF imprimable avec toutes les icônes
echo      - Monstres normaux: x5 copies
echo      - Boss: x1 copie
echo.
echo ----------------------------------------
echo.

cd /d "%~dp0.."
node scripts/monster-icons/generate-icons.js

echo.
echo ----------------------------------------
echo Appuyez sur une touche pour fermer...
pause >nul
