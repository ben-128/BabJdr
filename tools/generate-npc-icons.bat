@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Générateur d'Icônes de NPCs
echo ========================================
echo.
echo Ce script va:
echo   1. Créer des icônes (1.5cm x 3cm) pour chaque NPC
echo   2. Générer un PDF imprimable avec toutes les icônes
echo      - 2 copies par NPC
echo.
echo ----------------------------------------
echo.

cd /d "%~dp0.."
node scripts/npc-icons/generate-icons.js

echo.
echo ----------------------------------------
echo Appuyez sur une touche pour fermer...
pause >nul
