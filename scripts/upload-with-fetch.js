/**
 * Upload images to imgbb using node-fetch with FormData
 * This might work better with rate limiting
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const fetch = require('node-fetch');
const FormData = require('form-data');

const API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';
const MAX_SIZE_KB = 500;
const DELAY_MS = 5000; // 5 seconds between uploads

// Images to upload with their local paths
const IMAGES_TO_UPLOAD = [
  { key: "images.objet:Baguette de d'accélération", file: 'Sorts/Enchanteur/Acceleration.png' },
  { key: "images.sort:Sorts de Prêtre:Guérison physique", file: 'Sorts/Pretre/PurifiPhysique.png' },
  { key: "images.sort:Sorts d'Enchanteur:Armure élémentaire Feu Terre Nuit", file: 'Sorts/Enchanteur/ArmureElémentaire1.png' },
  { key: "images.sort:Sorts d'Enchanteur:Armure élémentaire Eau Air Lumière", file: 'Sorts/Enchanteur/ArmureElémentaire2.png' },
  { key: "images.sort:PurifiPhysique", file: 'Sorts/Pretre/PurifiPhysique.png' },
  { key: "images.sort:ArmureElémentaire1", file: 'Sorts/Enchanteur/ArmureElémentaire1.png' },
  { key: "images.sort:ArmureElémentaire2", file: 'Sorts/Enchanteur/ArmureElémentaire2.png' },
  { key: "images.objet:Chitine de scarabée", file: 'Objets/Consumables/SpellCasting/Chitine.png' },
];

async function compressIfNeeded(filePath) {
  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;

  if (sizeKB <= MAX_SIZE_KB) {
    return fs.readFileSync(filePath);
  }

  console.log(`  Compressing from ${sizeKB.toFixed(0)}KB...`);

  let quality = 85;
  let buffer;

  while (quality >= 30) {
    buffer = await sharp(filePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();

    if (buffer.length / 1024 <= MAX_SIZE_KB) {
      console.log(`  Compressed to ${(buffer.length / 1024).toFixed(0)}KB (q=${quality})`);
      return buffer;
    }
    quality -= 10;
  }

  return buffer;
}

async function uploadToImgbb(buffer, name) {
  const formData = new FormData();
  formData.append('key', API_KEY);
  formData.append('image', buffer.toString('base64'));
  formData.append('name', name);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders()
  });

  const data = await response.json();

  if (data.success) {
    return data.data.url;
  } else {
    throw new Error(data.error?.message || JSON.stringify(data));
  }
}

function setAtPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const imagesDir = path.join(dataDir, 'images');

  console.log('Loading images.json...');
  const imagesJson = JSON.parse(fs.readFileSync(path.join(dataDir, 'images.json'), 'utf8'));

  const results = { success: [], failed: [] };

  for (let i = 0; i < IMAGES_TO_UPLOAD.length; i++) {
    const { key, file } = IMAGES_TO_UPLOAD[i];
    console.log(`\n[${i + 1}/${IMAGES_TO_UPLOAD.length}] ${key}`);

    const fullPath = path.join(imagesDir, file);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ✗ File not found: ${file}`);
      results.failed.push(key);
      continue;
    }

    try {
      const buffer = await compressIfNeeded(fullPath);
      console.log(`  Size: ${(buffer.length / 1024).toFixed(0)}KB`);

      // Wait before upload
      if (i > 0) {
        console.log(`  Waiting ${DELAY_MS / 1000}s...`);
        await sleep(DELAY_MS);
      }

      console.log(`  Uploading...`);
      const name = path.basename(file, path.extname(file));
      const url = await uploadToImgbb(buffer, name);
      console.log(`  ✓ ${url}`);

      setAtPath(imagesJson, key, url);
      results.success.push({ key, url });
    } catch (error) {
      console.log(`  ✗ ${error.message}`);
      results.failed.push(key);

      // If rate limited, wait longer
      if (error.message.includes('Rate limit')) {
        console.log('  Rate limited! Waiting 30s...');
        await sleep(30000);
      }
    }
  }

  // Save results
  console.log('\n' + '='.repeat(60));
  console.log(`Success: ${results.success.length}, Failed: ${results.failed.length}`);

  if (results.success.length > 0) {
    fs.writeFileSync(path.join(dataDir, 'images.json'), JSON.stringify(imagesJson, null, 2));
    console.log('Saved images.json');
  }

  console.log('\nSuccessful uploads:');
  results.success.forEach(r => console.log(`  ${r.key} -> ${r.url}`));

  if (results.failed.length > 0) {
    console.log('\nFailed:');
    results.failed.forEach(k => console.log(`  ${k}`));
  }
}

main().catch(console.error);
