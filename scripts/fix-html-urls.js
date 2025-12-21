/**
 * Replace old ImgBB URLs with new compressed ones in HTML files
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, '..', 'index.html');
const RESULTS_PATH = path.join(__dirname, '..', 'data', 'upload-results.json');

// Load mappings
const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
const mappings = results.mappings;

// Filter to only old->new mappings (exclude same URL mappings)
const replacements = {};
for (const [oldUrl, newUrl] of Object.entries(mappings)) {
  if (oldUrl !== newUrl && oldUrl.includes('i.ibb.co') && newUrl.includes('i.ibb.co')) {
    replacements[oldUrl] = newUrl;
  }
}

console.log(`Found ${Object.keys(replacements).length} URL replacements to apply\n`);

// Read HTML
let html = fs.readFileSync(HTML_FILE, 'utf8');
const originalLength = html.length;

// Replace each old URL with new URL
let replacedCount = 0;
for (const [oldUrl, newUrl] of Object.entries(replacements)) {
  const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = html.match(regex);
  if (matches) {
    replacedCount += matches.length;
    html = html.replace(regex, newUrl);
    console.log(`Replaced ${matches.length}x: ${oldUrl.split('/').pop()}`);
  }
}

// Save updated HTML
fs.writeFileSync(HTML_FILE, html, 'utf8');

console.log(`\n=== SUMMARY ===`);
console.log(`Total replacements: ${replacedCount}`);
console.log(`File size: ${originalLength} → ${html.length} bytes`);
console.log(`\nindex.html updated successfully!`);
