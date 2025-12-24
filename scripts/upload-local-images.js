/**
 * Script to upload local images to imgbb (compressed to <500KB) and update JSON files
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const https = require('https');

const API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';
const MAX_SIZE_KB = 500;
const UPLOAD_DELAY_MS = 2000; // 2 seconds between uploads to avoid rate limiting

// Mapping of base64 keys in JSON to local file paths
const IMAGE_MAPPING = {
  // images.json mappings
  'images.objet:Baguette de d\'accélération': 'Sorts/Enchanteur/Acceleration.png',
  'images.sort:Sorts de Prêtre:Guérison physique': 'Sorts/Pretre/PurifiPhysique.png',
  'images.sort:Sorts d\'Enchanteur:Armure élémentaire Feu Terre Nuit': 'Sorts/Enchanteur/ArmureElémentaire1.png',
  'images.sort:Sorts d\'Enchanteur:Armure élémentaire Eau Air Lumière': 'Sorts/Enchanteur/ArmureElémentaire2.png',
  'images.sort:PurifiPhysique': 'Sorts/Pretre/PurifiPhysique.png',
  'images.sort:ArmureElémentaire1': 'Sorts/Enchanteur/ArmureElémentaire1.png',
  'images.sort:ArmureElémentaire2': 'Sorts/Enchanteur/ArmureElémentaire2.png',
  'images.objet:Chitine de scarabée': 'Objets/Consumables/SpellCasting/Chitine.png',
};

// Compress image to under 500KB
async function compressImage(inputPath, maxSizeKB = MAX_SIZE_KB) {
  const originalSize = fs.statSync(inputPath).size / 1024;
  console.log(`  Original size: ${originalSize.toFixed(0)}KB`);

  if (originalSize <= maxSizeKB) {
    console.log(`  Already under ${maxSizeKB}KB, using original`);
    return fs.readFileSync(inputPath);
  }

  // Start with quality 85 and reduce until under size limit
  let quality = 85;
  let buffer;

  while (quality >= 30) {
    buffer = await sharp(inputPath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();

    const sizeKB = buffer.length / 1024;
    console.log(`  Compressed (q=${quality}): ${sizeKB.toFixed(0)}KB`);

    if (sizeKB <= maxSizeKB) {
      return buffer;
    }

    quality -= 10;
  }

  // Return last attempt even if over size
  return buffer;
}

// Upload buffer to imgbb
async function uploadToImgbb(buffer, name) {
  return new Promise((resolve, reject) => {
    const base64 = buffer.toString('base64');
    const postData = `key=${API_KEY}&image=${encodeURIComponent(base64)}&name=${encodeURIComponent(name)}`;

    const options = {
      hostname: 'api.imgbb.com',
      port: 443,
      path: '/1/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            resolve(result.data.url);
          } else {
            reject(new Error(result.error?.message || JSON.stringify(result)));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, Response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(postData);
    req.end();
  });
}

// Set value at nested path in object
function setAtPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      console.log(`  Warning: Path ${parts.slice(0, i + 1).join('.')} not found`);
      return false;
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
  return true;
}

// Find all base64 entries
function findBase64Entries(obj, path = '') {
  const results = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string' && value.startsWith('data:image')) {
      results.push({ path: currentPath, sizeKB: Math.round(value.length * 0.75 / 1024) });
    } else if (typeof value === 'object' && value !== null) {
      results.push(...findBase64Entries(value, currentPath));
    }
  }
  return results;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const imagesDir = path.join(dataDir, 'images');

  // Load JSON files
  console.log('Loading JSON files...');
  const imagesJson = JSON.parse(fs.readFileSync(path.join(dataDir, 'images.json'), 'utf8'));
  const campagneJson = JSON.parse(fs.readFileSync(path.join(dataDir, 'campagne.json'), 'utf8'));

  // Find base64 entries
  const imagesBase64 = findBase64Entries(imagesJson);
  const campagneBase64 = findBase64Entries(campagneJson);

  console.log(`\nFound ${imagesBase64.length} base64 in images.json`);
  console.log(`Found ${campagneBase64.length} base64 in campagne.json\n`);

  // Process images.json entries
  console.log('='.repeat(60));
  console.log('Processing images.json');
  console.log('='.repeat(60));

  let successCount = 0;
  let failCount = 0;

  for (const entry of imagesBase64) {
    console.log(`\n[${successCount + failCount + 1}/${imagesBase64.length}] ${entry.path}`);
    console.log(`  Base64 size: ${entry.sizeKB}KB`);

    const localPath = IMAGE_MAPPING[entry.path];
    if (!localPath) {
      console.log(`  ✗ No mapping found for this entry`);
      failCount++;
      continue;
    }

    const fullPath = path.join(imagesDir, localPath);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ✗ Local file not found: ${localPath}`);
      failCount++;
      continue;
    }

    try {
      console.log(`  Local file: ${localPath}`);
      const buffer = await compressImage(fullPath);
      console.log(`  Uploading to imgbb...`);

      await sleep(UPLOAD_DELAY_MS); // Rate limit delay

      const name = path.basename(localPath, path.extname(localPath));
      const url = await uploadToImgbb(buffer, name);
      console.log(`  ✓ Uploaded: ${url}`);

      setAtPath(imagesJson, entry.path, url);
      successCount++;
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      failCount++;
    }
  }

  // For campagne.json, we'll just remove the base64 schemas (they're map schemas, not real images)
  console.log('\n' + '='.repeat(60));
  console.log('Processing campagne.json');
  console.log('='.repeat(60));

  // The schema entries are SVG-like map schemas, we can remove them
  // The image entries with dataUrl need to be uploaded
  for (const entry of campagneBase64) {
    console.log(`\n${entry.path}`);
    console.log(`  Size: ${entry.sizeKB}KB`);

    if (entry.path.includes('schemas.schema_')) {
      console.log(`  Removing schema (map data, not needed in standalone)`);
      // Remove the entire schema by setting to empty string
      setAtPath(campagneJson, entry.path, '');
    } else if (entry.path.includes('.dataUrl')) {
      console.log(`  Campaign image - removing base64 (will be loaded from imgbb at runtime)`);
      // These are campaign images that were uploaded but stored as base64
      // We'll set to empty - they should already have an 'url' property with imgbb URL
      setAtPath(campagneJson, entry.path, '');
    }
  }

  // Save updated JSON files
  console.log('\n' + '='.repeat(60));
  console.log('Saving files...');
  fs.writeFileSync(path.join(dataDir, 'images.json'), JSON.stringify(imagesJson, null, 2));
  fs.writeFileSync(path.join(dataDir, 'campagne.json'), JSON.stringify(campagneJson, null, 2));

  console.log(`\nimages.json: ${successCount} uploaded, ${failCount} failed`);
  console.log('campagne.json: base64 entries removed');
  console.log('='.repeat(60));
}

main().catch(console.error);
