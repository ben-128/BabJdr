/**
 * Script to upload all local images to ImgBB and update images.json
 * Run with: node scripts/upload-missing-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const IMGBB_API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';
const IMAGES_JSON_PATH = path.join(__dirname, '..', 'data', 'images.json');
const DELETE_URLS_PATH = path.join(__dirname, '..', 'data', 'imgbb-delete-urls.json');
const LOCAL_IMAGES_DIR = path.join(__dirname, '..', 'data', 'images');

// Rate limiting
const DELAY_BETWEEN_UPLOADS = 1000; // 1 second between uploads

// Load current images.json
function loadImagesJson() {
  try {
    const data = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, 'utf8'));
    return data.images || data;
  } catch (error) {
    console.error('Error loading images.json:', error.message);
    return {};
  }
}

// Save images.json
function saveImagesJson(images) {
  const data = {
    images: images,
    meta: {
      total_images: Object.keys(images).length,
      last_updated: new Date().toISOString().slice(0, 10),
      note: "Auto-synced from local images"
    }
  };
  fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\nSaved images.json with ${Object.keys(images).length} entries`);
}

// Convert folder path to image key
function pathToImageKey(relativePath) {
  // relativePath example: Dons/rodeur/Adrenaline.png
  const parts = relativePath.replace(/\\/g, '/').split('/');
  const filename = path.basename(parts[parts.length - 1], path.extname(parts[parts.length - 1]));

  const folder = parts[0].toLowerCase();

  switch (folder) {
    case 'dons':
      // don:NomDuDon
      return `don:${filename}`;

    case 'sorts':
      // sort:NomDuSort
      return `sort:${filename}`;

    case 'classes':
      // For subclasses: subclass:ClassName:SubclassName:1 or :2
      // This is complex, will need manual mapping
      if (parts.length >= 3) {
        const className = parts[1];
        const match = filename.match(/^(.+?)(?:_(\d))?$/);
        if (match) {
          const subclassName = match[1];
          const num = match[2] || '1';
          return `subclass:${className}:${subclassName}:${num}`;
        }
      }
      return `class:${filename}`;

    case 'monstres':
      return `monster:${filename}`;

    case 'objets':
      return `objet:${filename}`;

    case 'npc':
      return `npc:${filename}`;

    case 'elements':
      return `element:${filename}`;

    case 'autre':
      if (parts.length >= 2) {
        const subFolder = parts[1].toLowerCase();
        if (subFolder === 'elements') return `element:${filename}`;
        if (subFolder === 'stats') return `stat:${filename}`;
      }
      return `other:${filename}`;

    case 'campagne':
      return `campagne:${filename}`;

    default:
      return `local:${relativePath.replace(/\\/g, '/').replace(/\.[^.]+$/, '')}`;
  }
}

// Load delete URLs file
function loadDeleteUrls() {
  try {
    if (fs.existsSync(DELETE_URLS_PATH)) {
      return JSON.parse(fs.readFileSync(DELETE_URLS_PATH, 'utf8'));
    }
  } catch (e) {}
  return {};
}

// Save delete URLs file
function saveDeleteUrls(deleteUrls) {
  fs.writeFileSync(DELETE_URLS_PATH, JSON.stringify(deleteUrls, null, 2), 'utf8');
}

// Upload image to ImgBB - returns {url, deleteUrl}
async function uploadToImgBB(filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    const postData = `key=${IMGBB_API_KEY}&image=${encodeURIComponent(base64Data)}`;

    const options = {
      hostname: 'api.imgbb.com',
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
            resolve({
              url: result.data.url,
              deleteUrl: result.data.delete_url
            });
          } else {
            reject(new Error(result.error?.message || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid response: ' + data.substring(0, 100)));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Scan directory recursively for images
function scanImages(dir, basePath = '') {
  const images = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      images.push(...scanImages(fullPath, relativePath));
    } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(entry.name)) {
      images.push({
        fullPath,
        relativePath,
        key: pathToImageKey(relativePath),
        size: fs.statSync(fullPath).size
      });
    }
  }

  return images;
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  console.log('=== Upload Missing Images to ImgBB ===\n');

  // Load current mappings
  const images = loadImagesJson();
  console.log(`Current images.json has ${Object.keys(images).length} entries\n`);

  // Scan local images
  console.log('Scanning local images directory...');
  const localImages = scanImages(LOCAL_IMAGES_DIR);
  console.log(`Found ${localImages.length} local images\n`);

  // Find missing images
  const missing = localImages.filter(img => !images[img.key]);
  const existing = localImages.filter(img => images[img.key]);

  console.log(`Already in images.json: ${existing.length}`);
  console.log(`Missing (need upload): ${missing.length}\n`);

  if (missing.length === 0) {
    console.log('All images are already mapped!');
    return;
  }

  // Show what will be uploaded
  console.log('Images to upload:');
  missing.forEach(img => {
    const sizeKB = (img.size / 1024).toFixed(0);
    console.log(`  ${img.key} (${sizeKB}KB) <- ${img.relativePath}`);
  });

  console.log('\nStarting uploads...\n');

  // Load existing delete URLs
  const deleteUrls = loadDeleteUrls();

  let uploaded = 0;
  let failed = 0;

  for (const img of missing) {
    try {
      process.stdout.write(`Uploading ${img.key}... `);
      const result = await uploadToImgBB(img.fullPath);
      images[img.key] = result.url;
      deleteUrls[img.key] = result.deleteUrl; // Save delete URL for future cleanup
      console.log(`OK (${result.url.substring(0, 50)}...)`);
      uploaded++;

      // Save periodically
      if (uploaded % 5 === 0) {
        saveImagesJson(images);
        saveDeleteUrls(deleteUrls);
      }

      await sleep(DELAY_BETWEEN_UPLOADS);
    } catch (error) {
      console.log(`FAILED: ${error.message}`);
      failed++;
    }
  }

  // Final save
  saveImagesJson(images);
  saveDeleteUrls(deleteUrls);
  console.log(`\nDelete URLs saved to: ${DELETE_URLS_PATH}`);

  console.log(`\n=== Done ===`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total in images.json: ${Object.keys(images).length}`);
}

main().catch(console.error);
