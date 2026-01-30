// ============================================================================
// CACHE BUSTING UPDATER - Adds version hashes to CSS/JS references
// ============================================================================

const fs = require('fs');
const path = require('path');

/**
 * Generates a cache busting hash based on current timestamp
 */
function generateHash() {
  return Date.now().toString(36);
}

/**
 * Updates index.html with cache busting parameters
 */
function updateCacheBusting() {
  const indexPath = path.resolve(__dirname, '..', 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');
  const hash = generateHash();

  // Update CSS links - remove old hash and add new one
  html = html.replace(
    /href="(css\/[^"]+\.css)(\?v=[^"]+)?"/g,
    `href="$1?v=${hash}"`
  );

  // Update JS script src - remove old hash and add new one
  html = html.replace(
    /src="(js\/[^"]+\.js)(\?v=[^"]+)?"/g,
    `src="$1?v=${hash}"`
  );

  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log(`✅ Cache busting hash updated: v=${hash}`);
}

// Run if called directly
if (require.main === module) {
  updateCacheBusting();
}

module.exports = updateCacheBusting;
