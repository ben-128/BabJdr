// ============================================================================
// PWA PNG ICONS GENERATOR (Canvas-based)
// ============================================================================

const fs = require('fs');
const path = require('path');

// Check if we have canvas available
let Canvas;
try {
  // Try to use node-canvas if available
  const { createCanvas } = require('canvas');
  Canvas = createCanvas;
} catch (e) {
  console.log('📦 node-canvas not available, installing...');
  try {
    require('child_process').execSync('npm install canvas --save-dev', { stdio: 'inherit' });
    const { createCanvas } = require('canvas');
    Canvas = createCanvas;
  } catch (installError) {
    console.error('❌ Failed to install canvas. Using fallback method...');
    Canvas = null;
  }
}

// Simple PNG icon generator (fallback - creates base64 encoded PNG data)
function generateSimplePNG(size) {
  // Create a simple PNG data URL for a medieval-style icon
  // This is a fallback when Canvas is not available
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#f4f0e6"/>
        <stop offset="100%" stop-color="#d4af37"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${size}" height="${size}" fill="url(#bg)" rx="${size/8}"/>
    <rect x="${size/6}" y="${size/5}" width="${size*2/3}" height="${size*3/5}" fill="#f4f0e6" stroke="#8b4513" stroke-width="2" rx="3"/>
    <line x1="${size/3}" y1="${size/2.2}" x2="${size*2/3}" y2="${size/2.2}" stroke="#8b4513" stroke-width="2"/>
    <line x1="${size/3}" y1="${size/1.8}" x2="${size*2/3}" y2="${size/1.8}" stroke="#8b4513" stroke-width="2"/>
    <line x1="${size/3}" y1="${size/1.5}" x2="${size*0.6}" y2="${size/1.5}" stroke="#8b4513" stroke-width="2"/>
    <circle cx="${size*0.8}" cy="${size*0.25}" r="2" fill="#d4af37"/>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
}

// Canvas-based PNG generator (better quality)
function generateCanvasPNG(size) {
  if (!Canvas) {
    return generateSimplePNG(size);
  }
  
  const canvas = Canvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createRadialGradient(size/2, size*0.3, 0, size/2, size*0.3, size*0.7);
  gradient.addColorStop(0, '#f4f0e6');
  gradient.addColorStop(1, '#d4af37');
  
  // Draw background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Draw parchment
  ctx.fillStyle = '#f4f0e6';
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 2;
  ctx.fillRect(size/6, size/5, size*2/3, size*3/5);
  ctx.strokeRect(size/6, size/5, size*2/3, size*3/5);
  
  // Draw text lines
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 2;
  
  // Line 1
  ctx.beginPath();
  ctx.moveTo(size/3, size/2.2);
  ctx.lineTo(size*2/3, size/2.2);
  ctx.stroke();
  
  // Line 2
  ctx.beginPath();
  ctx.moveTo(size/3, size/1.8);
  ctx.lineTo(size*2/3, size/1.8);
  ctx.stroke();
  
  // Line 3
  ctx.beginPath();
  ctx.moveTo(size/3, size/1.5);
  ctx.lineTo(size*0.6, size/1.5);
  ctx.stroke();
  
  // Decorative dot
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(size*0.8, size*0.25, 2, 0, 2 * Math.PI);
  ctx.fill();
  
  return canvas.toBuffer('image/png');
}

// Icon sizes required for PWA
const iconSizes = [
  { size: 72, required: false },
  { size: 96, required: false },
  { size: 128, required: false },
  { size: 144, required: true },   // Minimum required
  { size: 152, required: false },
  { size: 192, required: true },   // Recommended
  { size: 384, required: false },
  { size: 512, required: true }    // Recommended
];

const iconsDir = path.join(__dirname, '..', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating PWA PNG icons...');

// Generate PNG icons
iconSizes.forEach(({ size, required }) => {
  try {
    const iconData = generateCanvasPNG(size);
    
    if (Canvas && Buffer.isBuffer(iconData)) {
      // Real PNG from canvas
      const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      fs.writeFileSync(pngPath, iconData);
      console.log(`✓ Generated icon-${size}x${size}.png${required ? ' (REQUIRED)' : ''}`);
    } else {
      // Fallback SVG
      const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
      const svgContent = iconData.replace('data:image/svg+xml;base64,', '');
      fs.writeFileSync(svgPath, Buffer.from(svgContent, 'base64').toString());
      console.log(`⚠️  Generated icon-${size}x${size}.svg (fallback)${required ? ' (REQUIRED)' : ''}`);
    }
    
  } catch (error) {
    console.error(`❌ Failed to generate ${size}x${size} icon:`, error.message);
  }
});

console.log('✅ PWA icons generation complete!');

if (!Canvas) {
  console.log('');
  console.log('💡 For better PNG icons, install canvas:');
  console.log('npm install canvas --save-dev');
  console.log('Then re-run: npm run icons-png');
}