/**
 * Script to compress images and re-upload to ImgBB
 * Usage: node scripts/compress-and-upload.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMGBB_API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';
const DATA_DIR = path.join(__dirname, '..', 'data', 'images');
const IMAGES_JSON_PATH = path.join(__dirname, '..', 'data', 'images.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'images-compressed');
const RESULTS_PATH = path.join(__dirname, '..', 'data', 'upload-results.json');

// Stats
let stats = {
  total: 0,
  compressed: 0,
  uploaded: 0,
  failed: 0,
  savedBytes: 0,
  originalBytes: 0
};

// Results storage
let results = {
  mappings: {},      // oldUrl -> newUrl
  deleteHashes: {},  // newUrl -> deleteHash
  errors: []
};

// Rate limiting for ImgBB
const DELAY_BETWEEN_UPLOADS = 1500; // 1.5 seconds

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get all image files recursively
function getAllImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllImages(filePath, fileList);
    } else if (/\.(png|jpg|jpeg|webp|gif)$/i.test(file)) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Compress image using sharp
async function compressImage(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const originalSize = fs.statSync(inputPath).size;

  let sharpInstance = sharp(inputPath);

  // Get metadata to preserve dimensions
  const metadata = await sharpInstance.metadata();

  // Apply compression based on format
  if (ext === '.png') {
    // PNG: Use lossy compression with palette for smaller size
    sharpInstance = sharpInstance.png({
      quality: 85,
      compressionLevel: 9,
      palette: true
    });
  } else if (ext === '.jpg' || ext === '.jpeg') {
    // JPEG: Optimize quality
    sharpInstance = sharpInstance.jpeg({
      quality: 82,
      mozjpeg: true
    });
  } else if (ext === '.webp') {
    sharpInstance = sharpInstance.webp({
      quality: 82
    });
  } else if (ext === '.gif') {
    // GIF: Just copy, sharp doesn't handle animated GIFs well
    fs.copyFileSync(inputPath, outputPath);
    return { originalSize, compressedSize: originalSize, saved: 0 };
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Save compressed image
  await sharpInstance.toFile(outputPath);

  const compressedSize = fs.statSync(outputPath).size;

  // If compressed is larger, use original
  if (compressedSize >= originalSize) {
    fs.copyFileSync(inputPath, outputPath);
    return { originalSize, compressedSize: originalSize, saved: 0 };
  }

  return {
    originalSize,
    compressedSize,
    saved: originalSize - compressedSize
  };
}

// Upload to ImgBB
async function uploadToImgBB(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Image = fileBuffer.toString('base64');
  const fileName = path.basename(filePath);

  const formData = new URLSearchParams();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Image);
  formData.append('name', fileName.replace(/\.[^.]+$/, '')); // Remove extension for name

  const response = await fetch(`https://api.imgbb.com/1/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Upload failed');
  }

  return {
    url: data.data.url,
    displayUrl: data.data.display_url,
    deleteUrl: data.data.delete_url
  };
}

// Find matching key in images.json for a local file
function findMatchingKey(localPath, imagesJson) {
  const fileName = path.basename(localPath, path.extname(localPath));
  const relativePath = path.relative(DATA_DIR, localPath);
  const parts = relativePath.split(path.sep);

  // Try to match based on folder structure
  const folder = parts[0]; // Monstres, Objets, etc.

  // Check each key in images.json
  for (const [key, url] of Object.entries(imagesJson.images)) {
    if (!url || typeof url !== 'string') continue;

    // Try to extract filename from URL
    const urlParts = url.split('/');
    const urlFileName = urlParts[urlParts.length - 1];

    // Decode and normalize for comparison
    const decodedUrlName = decodeURIComponent(urlFileName).replace(/\.[^.]+$/, '');
    const normalizedLocal = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedUrl = decodedUrlName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Check if names match (fuzzy)
    if (normalizedLocal.toLowerCase() === normalizedUrl.toLowerCase() ||
        normalizedLocal.replace(/[-_\s]/g, '').toLowerCase() === normalizedUrl.replace(/[-_\s]/g, '').toLowerCase()) {
      return { key, oldUrl: url };
    }
  }

  return null;
}

// Main processing function
async function processImages() {
  console.log('🖼️  Starting image compression and upload process...\n');

  // Load images.json
  let imagesJson = { images: {} };
  if (fs.existsSync(IMAGES_JSON_PATH)) {
    imagesJson = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, 'utf8'));
  }

  // Get all images
  let allImages = getAllImages(DATA_DIR);

  // In test mode, only process first few images
  if (TEST_MODE) {
    allImages = allImages.slice(0, MAX_TEST_IMAGES);
  }

  stats.total = allImages.length;

  console.log(`📁 Found ${allImages.length} images to process\n`);

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Process each image
  for (let i = 0; i < allImages.length; i++) {
    const imagePath = allImages[i];
    const relativePath = path.relative(DATA_DIR, imagePath);
    const outputPath = path.join(OUTPUT_DIR, relativePath);

    console.log(`[${i + 1}/${allImages.length}] Processing: ${relativePath}`);

    try {
      // 1. Compress
      const compressionResult = await compressImage(imagePath, outputPath);
      stats.compressed++;
      stats.originalBytes += compressionResult.originalSize;
      stats.savedBytes += compressionResult.saved;

      const savedPercent = compressionResult.originalSize > 0
        ? Math.round((compressionResult.saved / compressionResult.originalSize) * 100)
        : 0;

      console.log(`   ✓ Compressed: ${formatBytes(compressionResult.originalSize)} → ${formatBytes(compressionResult.compressedSize)} (-${savedPercent}%)`);

      // 2. Upload to ImgBB
      await sleep(DELAY_BETWEEN_UPLOADS);
      const uploadResult = await uploadToImgBB(outputPath);
      stats.uploaded++;

      console.log(`   ✓ Uploaded: ${uploadResult.displayUrl}`);

      // 3. Find matching key and update
      const match = findMatchingKey(imagePath, imagesJson);
      if (match) {
        results.mappings[match.oldUrl] = uploadResult.displayUrl;
        results.deleteHashes[uploadResult.displayUrl] = uploadResult.deleteUrl;

        // Update images.json
        imagesJson.images[match.key] = uploadResult.displayUrl;
        console.log(`   ✓ Updated key: ${match.key}`);
      } else {
        // Create new key based on path
        const newKey = `local:${relativePath.replace(/\\/g, '/').replace(/\.[^.]+$/, '')}`;
        imagesJson.images[newKey] = uploadResult.displayUrl;
        results.deleteHashes[uploadResult.displayUrl] = uploadResult.deleteUrl;
        console.log(`   ℹ Created new key: ${newKey}`);
      }

    } catch (error) {
      stats.failed++;
      results.errors.push({ file: relativePath, error: error.message });
      console.log(`   ✗ Error: ${error.message}`);
    }

    // Save progress periodically
    if (i % 10 === 0) {
      saveProgress(imagesJson);
    }
  }

  // Final save
  saveProgress(imagesJson);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total images:     ${stats.total}`);
  console.log(`Compressed:       ${stats.compressed}`);
  console.log(`Uploaded:         ${stats.uploaded}`);
  console.log(`Failed:           ${stats.failed}`);
  console.log(`Original size:    ${formatBytes(stats.originalBytes)}`);
  console.log(`Space saved:      ${formatBytes(stats.savedBytes)} (${Math.round((stats.savedBytes / stats.originalBytes) * 100)}%)`);
  console.log('='.repeat(60));

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(e => console.log(`   - ${e.file}: ${e.error}`));
  }
}

function saveProgress(imagesJson) {
  // Save updated images.json
  fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(imagesJson, null, 2), 'utf8');

  // Save results with delete hashes
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Parse command line args
const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');
const MAX_TEST_IMAGES = 3;

if (TEST_MODE) {
  console.log('🧪 TEST MODE: Only processing first 3 images\n');
}

// Run
processImages().catch(console.error);
