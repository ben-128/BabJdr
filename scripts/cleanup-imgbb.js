/**
 * Script to delete unused images from ImgBB
 * Uses delete URLs saved during upload
 *
 * Run with: node scripts/cleanup-imgbb.js
 *
 * Options:
 *   --dry-run    Show what would be deleted without actually deleting
 *   --force      Delete without confirmation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const IMAGES_JSON_PATH = path.join(__dirname, '..', 'data', 'images.json');
const DELETE_URLS_PATH = path.join(__dirname, '..', 'data', 'imgbb-delete-urls.json');

// Load images.json
function loadImagesJson() {
  try {
    const data = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, 'utf8'));
    return data.images || data;
  } catch (error) {
    console.error('Error loading images.json:', error.message);
    return {};
  }
}

// Load delete URLs
function loadDeleteUrls() {
  try {
    if (fs.existsSync(DELETE_URLS_PATH)) {
      return JSON.parse(fs.readFileSync(DELETE_URLS_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading delete URLs:', e.message);
  }
  return {};
}

// Save delete URLs
function saveDeleteUrls(deleteUrls) {
  fs.writeFileSync(DELETE_URLS_PATH, JSON.stringify(deleteUrls, null, 2), 'utf8');
}

// Delete image from ImgBB
async function deleteFromImgBB(deleteUrl) {
  return new Promise((resolve, reject) => {
    // ImgBB delete URL is just a GET request
    https.get(deleteUrl, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Ask user confirmation
async function askConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(message + ' (y/n): ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  console.log('=== ImgBB Cleanup Tool ===\n');

  // Load current data
  const images = loadImagesJson();
  const deleteUrls = loadDeleteUrls();

  console.log(`Images in use: ${Object.keys(images).length}`);
  console.log(`Delete URLs saved: ${Object.keys(deleteUrls).length}\n`);

  if (Object.keys(deleteUrls).length === 0) {
    console.log('No delete URLs found. Run upload-missing-images.js first to save delete URLs.');
    return;
  }

  // Find unused images (have delete URL but not in images.json)
  const unused = [];
  for (const [key, deleteUrl] of Object.entries(deleteUrls)) {
    if (!images[key]) {
      unused.push({ key, deleteUrl });
    }
  }

  if (unused.length === 0) {
    console.log('No unused images found. All saved delete URLs are still in use.');
    return;
  }

  console.log(`Found ${unused.length} unused images:\n`);
  unused.forEach(img => console.log(`  - ${img.key}`));

  if (dryRun) {
    console.log('\n[DRY RUN] No images were deleted.');
    return;
  }

  // Ask confirmation
  if (!force) {
    const confirmed = await askConfirmation(`\nDelete ${unused.length} images from ImgBB?`);
    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }
  }

  console.log('\nDeleting images...\n');

  let deleted = 0;
  let failed = 0;

  for (const img of unused) {
    try {
      process.stdout.write(`Deleting ${img.key}... `);
      await deleteFromImgBB(img.deleteUrl);
      delete deleteUrls[img.key]; // Remove from saved delete URLs
      console.log('OK');
      deleted++;
    } catch (error) {
      console.log(`FAILED: ${error.message}`);
      failed++;
    }
  }

  // Save updated delete URLs
  saveDeleteUrls(deleteUrls);

  console.log(`\n=== Done ===`);
  console.log(`Deleted: ${deleted}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
