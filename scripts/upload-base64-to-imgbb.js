/**
 * Script to extract base64 images from JSON files, upload to imgbb, and update with URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { Buffer } = require('buffer');

const API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';
const MAX_SIZE_KB = 500;

// Upload base64 to imgbb
async function uploadToImgbb(base64Data, name) {
  return new Promise((resolve, reject) => {
    // Remove data:image/xxx;base64, prefix
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');

    const postData = `key=${API_KEY}&image=${encodeURIComponent(base64Clean)}&name=${encodeURIComponent(name)}`;

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
            reject(new Error(result.error?.message || 'Upload failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Find all base64 entries in an object
function findBase64Entries(obj, path = '') {
  const results = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof value === 'string' && value.startsWith('data:image')) {
      const sizeKB = Math.round(value.length * 0.75 / 1024);
      results.push({ path: currentPath, data: value, sizeKB });
    } else if (typeof value === 'object' && value !== null) {
      results.push(...findBase64Entries(value, currentPath));
    }
  }
  return results;
}

// Set value at path in object
function setAtPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

async function processFile(filePath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${path.basename(filePath)}`);
  console.log('='.repeat(60));

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const base64Entries = findBase64Entries(data);

  if (base64Entries.length === 0) {
    console.log('No base64 images found.');
    return;
  }

  console.log(`Found ${base64Entries.length} base64 images:\n`);

  let uploadedCount = 0;
  let failedCount = 0;

  for (const entry of base64Entries) {
    const name = entry.path.split('.').pop().replace(/[^a-zA-Z0-9]/g, '_');
    console.log(`[${uploadedCount + failedCount + 1}/${base64Entries.length}] ${entry.path}`);
    console.log(`  Size: ${entry.sizeKB}KB`);

    try {
      const url = await uploadToImgbb(entry.data, name);
      console.log(`  ✓ Uploaded: ${url}`);
      setAtPath(data, entry.path, url);
      uploadedCount++;

      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      failedCount++;
    }
  }

  // Save updated file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`\nSaved ${filePath}`);
  console.log(`Results: ${uploadedCount} uploaded, ${failedCount} failed`);
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'data');

  // Process images.json
  await processFile(path.join(dataDir, 'images.json'));

  // Process campagne.json
  await processFile(path.join(dataDir, 'campagne.json'));

  console.log('\n' + '='.repeat(60));
  console.log('All done!');
  console.log('='.repeat(60));
}

main().catch(console.error);
