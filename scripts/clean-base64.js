/**
 * Script to remove base64 images from JSON files
 * They will need to be re-uploaded via the UI when imgbb rate limit resets
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function cleanBase64(obj, path = '', stats = { removed: 0, paths: [] }) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === 'string' && value.startsWith('data:image')) {
      const sizeKB = Math.round(value.length * 0.75 / 1024);
      console.log(`  Removing: ${currentPath} (${sizeKB}KB)`);
      obj[key] = ''; // Set to empty string
      stats.removed++;
      stats.paths.push(currentPath);
    } else if (typeof value === 'object' && value !== null) {
      cleanBase64(value, currentPath, stats);
    }
  }
  return stats;
}

// Clean images.json
console.log('\n=== Cleaning images.json ===');
const imagesPath = path.join(dataDir, 'images.json');
const imagesData = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
const imagesStats = cleanBase64(imagesData);

const imagesOrigSize = fs.statSync(imagesPath).size;
fs.writeFileSync(imagesPath, JSON.stringify(imagesData, null, 2));
const imagesNewSize = fs.statSync(imagesPath).size;

console.log(`\nRemoved ${imagesStats.removed} base64 images`);
console.log(`Size: ${(imagesOrigSize / 1024).toFixed(0)}KB → ${(imagesNewSize / 1024).toFixed(0)}KB`);

// Clean campagne.json
console.log('\n=== Cleaning campagne.json ===');
const campagnePath = path.join(dataDir, 'campagne.json');
const campagneData = JSON.parse(fs.readFileSync(campagnePath, 'utf8'));
const campagneStats = cleanBase64(campagneData);

const campagneOrigSize = fs.statSync(campagnePath).size;
fs.writeFileSync(campagnePath, JSON.stringify(campagneData, null, 2));
const campagneNewSize = fs.statSync(campagnePath).size;

console.log(`\nRemoved ${campagneStats.removed} base64 images`);
console.log(`Size: ${(campagneOrigSize / 1024).toFixed(0)}KB → ${(campagneNewSize / 1024).toFixed(0)}KB`);

console.log('\n=== Summary ===');
console.log(`Total base64 removed: ${imagesStats.removed + campagneStats.removed}`);
console.log('\nPaths that were cleaned:');
[...imagesStats.paths, ...campagneStats.paths].forEach(p => console.log(`  - ${p}`));
console.log('\nNote: These images will show as broken until re-uploaded via the UI when imgbb is available.');
