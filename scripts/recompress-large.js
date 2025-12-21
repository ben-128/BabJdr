/**
 * Script to recompress images > 500KB and re-upload to ImgBB
 * Usage: node scripts/recompress-large.js [--test]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMGBB_API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';
const DATA_DIR = path.join(__dirname, '..', 'data', 'images');
const IMAGES_JSON_PATH = path.join(__dirname, '..', 'data', 'images.json');
const RESULTS_PATH = path.join(__dirname, '..', 'data', 'upload-results.json');

const MAX_SIZE_KB = 500;
const DELAY_BETWEEN_UPLOADS = 1500;

// Stats
let stats = {
  total: 0,
  recompressed: 0,
  uploaded: 0,
  failed: 0,
  skipped: 0
};

// Load existing results
let results = { mappings: {}, deleteHashes: {}, errors: [] };
if (fs.existsSync(RESULTS_PATH)) {
  results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Get images larger than MAX_SIZE_KB
function getLargeImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getLargeImages(filePath, fileList);
    } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
      const sizeKB = stat.size / 1024;
      if (sizeKB > MAX_SIZE_KB) {
        fileList.push({ path: filePath, size: stat.size });
      }
    }
  }

  return fileList;
}

// Aggressively compress image to target size
async function compressToTarget(inputPath, targetKB = 500) {
  const ext = path.extname(inputPath).toLowerCase();
  const originalSize = fs.statSync(inputPath).size;

  let sharpInstance = sharp(inputPath);
  const metadata = await sharpInstance.metadata();

  // Check for transparency in PNG
  let hasAlpha = metadata.hasAlpha;

  // Start with high quality, reduce if needed
  let quality = 85;
  let width = metadata.width;
  let height = metadata.height;
  let outputBuffer;
  let attempts = 0;
  const maxAttempts = 8;

  while (attempts < maxAttempts) {
    attempts++;

    sharpInstance = sharp(inputPath);

    // Resize if image is very large
    if (width > 1200 || height > 1200) {
      const ratio = Math.min(1200 / width, 1200 / height);
      width = Math.round(metadata.width * ratio);
      height = Math.round(metadata.height * ratio);
      sharpInstance = sharpInstance.resize(width, height, { fit: 'inside' });
    }

    // Choose format based on transparency
    if (hasAlpha && ext === '.png') {
      // PNG with transparency - use PNG with palette
      outputBuffer = await sharpInstance
        .png({
          quality: quality,
          compressionLevel: 9,
          palette: true,
          colors: Math.max(32, Math.round(256 * (quality / 100)))
        })
        .toBuffer();
    } else {
      // No transparency or JPEG - convert to JPEG
      outputBuffer = await sharpInstance
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({
          quality: quality,
          mozjpeg: true
        })
        .toBuffer();
    }

    const sizeKB = outputBuffer.length / 1024;

    if (sizeKB <= targetKB) {
      break;
    }

    // Reduce quality or size for next attempt
    if (quality > 50) {
      quality -= 10;
    } else if (width > 800) {
      // Reduce dimensions
      const ratio = 0.85;
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      quality = 75; // Reset quality for new size
    } else {
      // Can't reduce further, accept current
      break;
    }
  }

  return {
    buffer: outputBuffer,
    originalSize,
    compressedSize: outputBuffer.length,
    format: hasAlpha && ext === '.png' ? 'png' : 'jpeg'
  };
}

// Upload to ImgBB
async function uploadToImgBB(buffer, fileName) {
  const base64Image = buffer.toString('base64');

  const formData = new URLSearchParams();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Image);
  formData.append('name', fileName.replace(/\.[^.]+$/, ''));

  const response = await fetch('https://api.imgbb.com/1/upload', {
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

// Find key in images.json for a file
function findImageKey(localPath, imagesJson) {
  const fileName = path.basename(localPath, path.extname(localPath));
  const relativePath = path.relative(DATA_DIR, localPath).replace(/\\/g, '/');

  // Try various key formats
  const possibleKeys = [
    `local:${relativePath.replace(/\.[^.]+$/, '')}`,
    fileName,
    relativePath.replace(/\.[^.]+$/, '')
  ];

  for (const [key, url] of Object.entries(imagesJson.images)) {
    // Check if key matches
    if (possibleKeys.includes(key)) {
      return { key, oldUrl: url };
    }

    // Check if URL filename matches
    if (url && typeof url === 'string') {
      const urlFileName = decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, '');
      if (urlFileName.toLowerCase() === fileName.toLowerCase() ||
          urlFileName.replace(/[-_\s]/g, '').toLowerCase() === fileName.replace(/[-_\s]/g, '').toLowerCase()) {
        return { key, oldUrl: url };
      }
    }
  }

  return null;
}

async function processImages() {
  console.log('Starting recompression of large images...\n');

  // Load images.json
  let imagesJson = { images: {} };
  if (fs.existsSync(IMAGES_JSON_PATH)) {
    imagesJson = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, 'utf8'));
  }

  // Get large images
  let largeImages = getLargeImages(DATA_DIR);

  // Sort by size (largest first)
  largeImages.sort((a, b) => b.size - a.size);

  if (TEST_MODE) {
    largeImages = largeImages.slice(0, 5);
  }

  stats.total = largeImages.length;
  console.log(`Found ${largeImages.length} images > ${MAX_SIZE_KB}KB\n`);

  for (let i = 0; i < largeImages.length; i++) {
    const { path: imagePath, size } = largeImages[i];
    const relativePath = path.relative(DATA_DIR, imagePath);
    const fileName = path.basename(imagePath);

    console.log(`[${i + 1}/${largeImages.length}] ${relativePath} (${formatBytes(size)})`);

    try {
      // Compress
      const result = await compressToTarget(imagePath, MAX_SIZE_KB);
      stats.recompressed++;

      const savedPercent = Math.round((1 - result.compressedSize / result.originalSize) * 100);
      console.log(`   Compressed: ${formatBytes(result.originalSize)} -> ${formatBytes(result.compressedSize)} (-${savedPercent}%)`);

      // Upload
      await sleep(DELAY_BETWEEN_UPLOADS);
      const uploadResult = await uploadToImgBB(result.buffer, fileName);
      stats.uploaded++;
      console.log(`   Uploaded: ${uploadResult.displayUrl}`);

      // Update mappings
      const match = findImageKey(imagePath, imagesJson);
      if (match) {
        // Store old -> new mapping
        if (match.oldUrl !== uploadResult.displayUrl) {
          results.mappings[match.oldUrl] = uploadResult.displayUrl;
        }
        results.deleteHashes[uploadResult.displayUrl] = uploadResult.deleteUrl;

        // Update images.json
        imagesJson.images[match.key] = uploadResult.displayUrl;
        console.log(`   Updated: ${match.key}`);
      } else {
        // Create new key
        const newKey = `local:${relativePath.replace(/\\/g, '/').replace(/\.[^.]+$/, '')}`;
        imagesJson.images[newKey] = uploadResult.displayUrl;
        results.deleteHashes[uploadResult.displayUrl] = uploadResult.deleteUrl;
        console.log(`   New key: ${newKey}`);
      }

      // Save compressed image back to disk
      fs.writeFileSync(imagePath, result.buffer);

    } catch (error) {
      stats.failed++;
      results.errors.push({ file: relativePath, error: error.message });
      console.log(`   ERROR: ${error.message}`);
    }

    // Save progress every 10 images
    if (i % 10 === 0) {
      fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(imagesJson, null, 2), 'utf8');
      fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');
    }
  }

  // Final save
  fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(imagesJson, null, 2), 'utf8');
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total large images: ${stats.total}`);
  console.log(`Recompressed:       ${stats.recompressed}`);
  console.log(`Uploaded:           ${stats.uploaded}`);
  console.log(`Failed:             ${stats.failed}`);
  console.log('='.repeat(50));

  if (stats.failed > 0) {
    console.log('\nErrors:');
    results.errors.slice(-10).forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }

  console.log('\nDone! Run scripts/fix-html-urls.js to update index.html');
}

// Parse args
const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');

if (TEST_MODE) {
  console.log('TEST MODE: Processing only 5 images\n');
}

processImages().catch(console.error);
