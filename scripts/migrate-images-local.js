#!/usr/bin/env node
/**
 * Migrate all ibb.co image URLs to local paths (data/images/...)
 *
 * Strategy: match ibb.co URLs to local files by filename (case-insensitive).
 * The ibb.co URL pattern is: https://i.ibb.co/XXXX/Filename.ext
 * Local files are in: data/images/Category/Subcategory/Filename.ext
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'data', 'images');

// ============================================
// Step 1: Build index of local image files
// ============================================
function buildLocalIndex() {
  const index = new Map(); // lowercase filename -> relative path(s)

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(entry.name)) {
        const relPath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
        const key = entry.name.toLowerCase();
        if (!index.has(key)) {
          index.set(key, []);
        }
        index.get(key).push(relPath);
      }
    }
  }

  walk(IMAGES_DIR);
  return index;
}

// ============================================
// Step 2: Extract filename from ibb.co URL
// ============================================
function getIbbFilename(url) {
  try {
    // URL pattern: https://i.ibb.co/XXXX/Filename.ext
    const urlPath = new URL(url).pathname;
    const parts = urlPath.split('/');
    const filename = parts[parts.length - 1];
    return decodeURIComponent(filename);
  } catch {
    return null;
  }
}

// ============================================
// Step 2b: Normalize a filename for fuzzy matching
// ============================================
function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|gif)$/i, '') // remove extension
    .replace(/[-_ ]/g, '')                       // remove separators
    .replace(/[éèêë]/g, 'e')                     // normalize accents
    .replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u')
    .replace(/[ôö]/g, 'o')
    .replace(/[îï]/g, 'i')
    .replace(/[ç]/g, 'c');
}

// Build a normalized index for fuzzy matching
function buildNormalizedIndex(localIndex) {
  const normIndex = new Map(); // normalized name -> local path
  for (const [key, paths] of localIndex) {
    const norm = normalize(key);
    if (!normIndex.has(norm)) {
      normIndex.set(norm, paths[0]);
    }
  }
  return normIndex;
}

// ============================================
// Step 3: Find all ibb.co URLs in a string and replace them
// ============================================
function replaceIbbUrls(content, localIndex, normIndex, stats) {
  const ibbRegex = /https?:\/\/i\.ibb\.co\/[A-Za-z0-9]+\/[A-Za-z0-9_.%éèêëàâäùûüôöîïç-]+\.(jpg|jpeg|png|webp|gif)/gi;

  return content.replace(ibbRegex, (match) => {
    const filename = getIbbFilename(match);
    if (!filename) {
      stats.failed.push({ url: match, reason: 'Could not parse URL' });
      return match;
    }

    // 1. Exact match by filename (case-insensitive)
    const key = filename.toLowerCase();
    const localPaths = localIndex.get(key);
    if (localPaths && localPaths.length > 0) {
      stats.replaced++;
      if (!stats.mappings[match]) stats.mappings[match] = localPaths[0];
      return localPaths[0];
    }

    // 2. Exact match ignoring extension
    const nameNoExt = key.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
    for (const [localKey, paths] of localIndex) {
      const localNoExt = localKey.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
      if (localNoExt === nameNoExt) {
        stats.replaced++;
        if (!stats.mappings[match]) stats.mappings[match] = paths[0];
        return paths[0];
      }
    }

    // 3. Normalized fuzzy match (ignore separators, accents, case, extension)
    const norm = normalize(filename);
    const fuzzyMatch = normIndex.get(norm);
    if (fuzzyMatch) {
      stats.replaced++;
      if (!stats.mappings[match]) stats.mappings[match] = fuzzyMatch;
      return fuzzyMatch;
    }

    // 4. Partial match - ibb name contains or is contained by local name
    for (const [localNorm, localPath] of normIndex) {
      if (localNorm.length > 3 && (norm.includes(localNorm) || localNorm.includes(norm))) {
        // Only accept if they're close in length (avoid false positives)
        const ratio = Math.min(norm.length, localNorm.length) / Math.max(norm.length, localNorm.length);
        if (ratio > 0.6) {
          stats.replaced++;
          stats.fuzzyMatches = (stats.fuzzyMatches || 0) + 1;
          if (!stats.mappings[match]) stats.mappings[match] = localPath;
          return localPath;
        }
      }
    }

    stats.notFound.push({ url: match, filename });
    return match;
  });
}

// ============================================
// Step 4: Process all relevant files
// ============================================
function main() {
  console.log('🔍 Building local image index...');
  const localIndex = buildLocalIndex();
  console.log(`   Found ${localIndex.size} unique filenames (${Array.from(localIndex.values()).reduce((s, v) => s + v.length, 0)} total files)`);

  const stats = {
    replaced: 0,
    notFound: [],
    failed: [],
    mappings: {},
    filesModified: []
  };

  // Files to process
  const filesToProcess = [
    // JSON data files
    ...fs.readdirSync(path.join(ROOT, 'data'))
      .filter(f => f.endsWith('.json') && f !== 'upload-results.json')
      .map(f => path.join('data', f)),
    // JS config files
    'js/config/contentTypes.js',
    'js/storage.js',
    // HTML files
    'index.html',
    'dev.html',
  ];

  console.log('🔗 Building normalized index for fuzzy matching...');
  const normIndex = buildNormalizedIndex(localIndex);
  console.log(`   ${normIndex.size} normalized entries`);

  console.log(`\n📝 Processing ${filesToProcess.length} files...`);

  for (const relFile of filesToProcess) {
    const filePath = path.join(ROOT, relFile);
    if (!fs.existsSync(filePath)) {
      console.log(`   ⏭️  Skipping ${relFile} (not found)`);
      continue;
    }

    const original = fs.readFileSync(filePath, 'utf-8');
    const beforeCount = stats.replaced;
    const modified = replaceIbbUrls(original, localIndex, normIndex, stats);
    const replacements = stats.replaced - beforeCount;

    if (replacements > 0) {
      fs.writeFileSync(filePath, modified, 'utf-8');
      console.log(`   ✅ ${relFile}: ${replacements} URLs replaced`);
      stats.filesModified.push(relFile);
    } else {
      const hasIbb = original.includes('i.ibb.co');
      if (hasIbb) {
        console.log(`   ⚠️  ${relFile}: contains ibb.co URLs but no matches found`);
      } else {
        console.log(`   ⏭️  ${relFile}: no ibb.co URLs`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ URLs replaced: ${stats.replaced}`);
  console.log(`📁 Files modified: ${stats.filesModified.length}`);
  console.log(`❌ URLs not matched: ${stats.notFound.length}`);

  if (stats.notFound.length > 0) {
    console.log('\n🔍 Unmatched URLs:');
    // Deduplicate
    const unique = [...new Set(stats.notFound.map(n => n.url))];
    unique.forEach(url => {
      const filename = getIbbFilename(url);
      console.log(`   ${filename} → ${url}`);
    });
  }

  // Save mapping for reference
  const mappingFile = path.join(ROOT, 'data', 'ibb-to-local-mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(stats.mappings, null, 2), 'utf-8');
  console.log(`\n💾 Mapping saved to data/ibb-to-local-mapping.json`);
}

main();
