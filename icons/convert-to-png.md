# Conversion vers PNG

Les icônes SVG ont été générées. Pour une PWA complète, convertissez-les en PNG :

## Option 1: Automatique (requiert Node.js + sharp)
```bash
npm install sharp
node scripts/svg-to-png.js
```

## Option 2: Manuel
1. Ouvrez chaque fichier SVG dans un éditeur (Inkscape, GIMP, etc.)
2. Exportez en PNG à la taille correspondante
3. Renommez : icon-72x72.svg → icon-72x72.png

## Option 3: Service en ligne
1. Uploadez les SVG sur https://convertio.co/svg-png/
2. Téléchargez les PNG
3. Placez-les dans le dossier icons/

Une fois les PNG créés, supprimez ce fichier.
