/**
 * Script to clean images.json - replace old URLs with new ones
 */

const fs = require('fs');
const path = require('path');

const IMAGES_JSON_PATH = path.join(__dirname, '..', 'data', 'images.json');
const RESULTS_PATH = path.join(__dirname, '..', 'data', 'upload-results.json');

// Load files
const imagesJson = JSON.parse(fs.readFileSync(IMAGES_JSON_PATH, 'utf8'));
const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));

// Create reverse mapping: old URL -> new URL
const oldToNew = results.mappings;

// Get all new URLs (values from mappings)
const newUrls = new Set(Object.values(oldToNew));

// Also add URLs that map to themselves (already new)
Object.entries(oldToNew).forEach(([old, newUrl]) => {
  if (old === newUrl) {
    newUrls.add(newUrl);
  }
});

// Get delete hashes URLs (these are definitely new)
Object.keys(results.deleteHashes).forEach(url => newUrls.add(url));

console.log(`Found ${Object.keys(oldToNew).length} URL mappings`);
console.log(`Found ${newUrls.size} new URLs`);

// Clean images.json
const cleanedImages = {};
let replaced = 0;
let kept = 0;
let removed = 0;

for (const [key, url] of Object.entries(imagesJson.images)) {
  if (!url || typeof url !== 'string') {
    removed++;
    continue;
  }

  // Check if this URL needs to be replaced
  if (oldToNew[url] && oldToNew[url] !== url) {
    // Replace with new URL
    cleanedImages[key] = oldToNew[url];
    replaced++;
  } else if (newUrls.has(url)) {
    // Already a new URL, keep it
    cleanedImages[key] = url;
    kept++;
  } else if (url.includes('i.ibb.co')) {
    // Old ImgBB URL not in our mappings - remove it
    console.log(`Removing old URL for key: ${key}`);
    removed++;
  } else {
    // Local path or other URL - keep it
    cleanedImages[key] = url;
    kept++;
  }
}

// Remove duplicate entries (same URL, different keys)
// Keep the most specific key (longer key usually means more specific)
const urlToKeys = {};
for (const [key, url] of Object.entries(cleanedImages)) {
  if (!urlToKeys[url]) {
    urlToKeys[url] = [];
  }
  urlToKeys[url].push(key);
}

const finalImages = {};
let duplicatesRemoved = 0;

for (const [url, keys] of Object.entries(urlToKeys)) {
  if (keys.length === 1) {
    finalImages[keys[0]] = url;
  } else {
    // Multiple keys for same URL - keep the most relevant one
    // Prefer keys without "local:" prefix, then prefer longer/more specific keys
    const sorted = keys.sort((a, b) => {
      // Prefer non-local keys
      const aLocal = a.startsWith('local:');
      const bLocal = b.startsWith('local:');
      if (aLocal !== bLocal) return aLocal ? 1 : -1;

      // Then prefer longer keys (more specific)
      return b.length - a.length;
    });

    finalImages[sorted[0]] = url;
    duplicatesRemoved += keys.length - 1;

    if (keys.length > 1) {
      console.log(`Keeping "${sorted[0]}", removing duplicates: ${sorted.slice(1).join(', ')}`);
    }
  }
}

// Save cleaned images.json
const output = { images: finalImages };
fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(output, null, 2), 'utf8');

console.log('\n=== SUMMARY ===');
console.log(`Replaced old URLs: ${replaced}`);
console.log(`Kept valid URLs: ${kept}`);
console.log(`Removed old/invalid: ${removed}`);
console.log(`Removed duplicates: ${duplicatesRemoved}`);
console.log(`Final entries: ${Object.keys(finalImages).length}`);
console.log('\nimages.json cleaned successfully!');
