// ============================================================================
// PWA ICON GENERATOR
// ============================================================================

const fs = require('fs');
const path = require('path');

// Simple SVG icon template (medieval scroll/parchment theme)
function createIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#f4f0e6"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </radialGradient>
    <linearGradient id="shadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(139,69,19,0.3)"/>
      <stop offset="100%" stop-color="rgba(139,69,19,0.1)"/>
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#bg)" stroke="#8b4513" stroke-width="2"/>
  
  <!-- Scroll/Parchment design -->
  <rect x="${size/4}" y="${size/5}" width="${size/2}" height="${size*0.6}" rx="4" fill="#f4f0e6" stroke="#8b4513" stroke-width="1"/>
  <rect x="${size/4 + 4}" y="${size/5 + 4}" width="${size/2 - 8}" height="${size*0.6 - 8}" rx="2" fill="none" stroke="#d4af37" stroke-width="1"/>
  
  <!-- Medieval text lines -->
  <line x1="${size/3}" y1="${size/2.5}" x2="${size*0.67}" y2="${size/2.5}" stroke="#8b4513" stroke-width="2" opacity="0.7"/>
  <line x1="${size/3}" y1="${size/2}" x2="${size*0.67}" y2="${size/2}" stroke="#8b4513" stroke-width="2" opacity="0.7"/>
  <line x1="${size/3}" y1="${size*0.6}" x2="${size*0.6}" y2="${size*0.6}" stroke="#8b4513" stroke-width="2" opacity="0.7"/>
  
  <!-- Decorative corner -->
  <circle cx="${size*0.8}" cy="${size*0.2}" r="3" fill="#d4af37"/>
</svg>`;
}

// Icon sizes needed for PWA
const iconSizes = [16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 180, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating PWA icons...');

// Generate SVG versions for each size
iconSizes.forEach(size => {
  const svgContent = createIconSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✓ Generated icon-${size}x${size}.svg`);
});

// Create a simple PNG placeholder explanation
const readmePath = path.join(iconsDir, 'convert-to-png.md');
fs.writeFileSync(readmePath, `# Conversion vers PNG

Les icônes SVG ont été générées. Pour une PWA complète, convertissez-les en PNG :

## Option 1: Automatique (requiert Node.js + sharp)
\`\`\`bash
npm install sharp
node scripts/svg-to-png.js
\`\`\`

## Option 2: Manuel
1. Ouvrez chaque fichier SVG dans un éditeur (Inkscape, GIMP, etc.)
2. Exportez en PNG à la taille correspondante
3. Renommez : icon-72x72.svg → icon-72x72.png

## Option 3: Service en ligne
1. Uploadez les SVG sur https://convertio.co/svg-png/
2. Téléchargez les PNG
3. Placez-les dans le dossier icons/

Une fois les PNG créés, supprimez ce fichier.
`);

console.log('✅ PWA icons generated!');
console.log('📝 See icons/convert-to-png.md for PNG conversion instructions');