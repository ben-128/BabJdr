// ============================================================================
// FORESIA BUILD SYSTEM - MODULAR TO STANDALONE
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Increments version in Service Worker
 */
function incrementServiceWorkerVersion() {
  // Increment version in config/sw.js (which will be copied to root later)
  const swPath = path.resolve(__dirname, '..', 'config', 'sw.js');
  if (!fs.existsSync(swPath)) {
    console.warn('⚠️  Service Worker not found at', swPath);
    return;
  }

  let swContent = fs.readFileSync(swPath, 'utf-8');

  // Extract current version number from CACHE_NAME
  const cacheNameMatch = swContent.match(/const CACHE_NAME = 'jdr-bab-v(\d+)\.(\d+)\.(\d+)'/);

  if (!cacheNameMatch) {
    console.warn('⚠️  Could not find version in Service Worker');
    return;
  }

  const major = parseInt(cacheNameMatch[1]);
  const minor = parseInt(cacheNameMatch[2]);
  const patch = parseInt(cacheNameMatch[3]);
  const newPatch = patch + 1;

  // Replace all three version strings
  swContent = swContent.replace(
    /const CACHE_NAME = 'jdr-bab-v\d+\.\d+\.\d+'/,
    `const CACHE_NAME = 'jdr-bab-v${major}.${minor}.${newPatch}'`
  );
  swContent = swContent.replace(
    /const STATIC_CACHE_NAME = 'jdr-bab-static-v\d+\.\d+\.\d+'/,
    `const STATIC_CACHE_NAME = 'jdr-bab-static-v${major}.${minor}.${newPatch}'`
  );
  swContent = swContent.replace(
    /const RUNTIME_CACHE_NAME = 'jdr-bab-runtime-v\d+\.\d+\.\d+'/,
    `const RUNTIME_CACHE_NAME = 'jdr-bab-runtime-v${major}.${minor}.${newPatch}'`
  );

  fs.writeFileSync(swPath, swContent, 'utf-8');
  console.log(`✅ Service Worker version incremented: v${major}.${minor}.${patch} → v${major}.${minor}.${newPatch}`);
  return `v${major}.${minor}.${newPatch}`;
}

/**
 * Generates a hash for cache busting
 */
function generateCacheBustHash() {
  return Date.now().toString(36);
}

/**
 * Updates index.html with cache busting parameters
 */
function updateIndexCacheBusting() {
  const indexPath = path.resolve(__dirname, '..', 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️  index.html not found');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');
  const hash = generateCacheBustHash();

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

/**
 * Builds a standalone version from modular files
 * Combines CSS, JS, and JSON into a single HTML file
 */
function buildStandalone(options = {}) {
  console.log('🔨 Building standalone version from modular files...');

  // Increment Service Worker version first (unless disabled)
  let appVersion = 'v?';
  if (options.noVersionBump !== true) {
    appVersion = incrementServiceWorkerVersion() || 'v?';
    // Update cache busting in index.html
    updateIndexCacheBusting();
  } else {
    console.log('⚠️  Version increment skipped (--no-version-bump)');
    // Read current version without bumping
    const swContent = fs.readFileSync(path.resolve(__dirname, '..', 'config', 'sw.js'), 'utf-8');
    const m = swContent.match(/const CACHE_NAME = 'jdr-bab-(v[\d.]+)'/);
    if (m) appVersion = m[1];
  }
  
  const rootDir = path.resolve(__dirname, '..');
  const outputDir = path.join(rootDir, 'build');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('📁 Created output directory');
  }
  
  console.log('📖 Creating 100% modular build...');
  
  // Create complete HTML structure from scratch
  let htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<meta name="referrer" content="no-referrer-when-downgrade">
<title>Foresia — Livret de règles</title>
<meta content="Livret web multipages des règles Foresia, thème parchemin, illustrations par catégorie/classe/sous‑classe, export HTML autonome." name="description">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&amp;family=Source+Serif+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&amp;display=swap" rel="stylesheet">
<!-- PWA Configuration - Manifest embedded as JSON and injected dynamically -->
<script>
// Embed manifest for PWA functionality
window.MANIFEST_DATA = ${fs.readFileSync(path.join(rootDir, 'config', 'manifest.json'), 'utf8')};
</script>
<meta name="theme-color" content="#8b4513">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Foresia">
<meta name="application-name" content="Foresia">
<meta name="msapplication-TileColor" content="#8b4513">

<!-- Favicon (embedded PNG) -->
<link rel="icon" type="image/png" href="data:image/png;base64,${fs.readFileSync(path.join(rootDir, 'favicon.png')).toString('base64')}">
</head>
<body class="dev-off">

<div class="shell">
  <button aria-controls="sidebar" aria-expanded="false" aria-label="Ouvrir le sommaire" class="menu-toggle" id="menuToggle" style="display:none">☰ Sommaire</button>
  <div class="backdrop" hidden="" id="backdrop"></div>
  
  <main class="page">
    <aside class="sidebar" id="sidebar">
      <div class="panel">
        <div class="tools">
          <!-- Dev mode disabled in standalone version -->
        </div>
        <div class="toc" id="toc">
          <!-- Table of contents will be generated by JavaScript -->
        </div>
        <div class="sidebar-version-footer">
          <span class="app-version-label">Foresia ${appVersion}</span>
          <button class="btn-force-update" id="forceUpdateBtn" title="Vider le cache et recharger la dernière version">↻ Mettre à jour</button>
        </div>
      </div>
    </aside>
    
    <div id="views">
      <!-- Main content will be generated by JavaScript -->
      <div id="app-loading">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 2rem;">
          <h1 style="font-family: 'Cinzel', serif; font-size: 3rem; color: var(--accent-ink, #8b4513); margin: 0;">Foresia</h1>
          <p style="font-size: 1.2rem; color: var(--text, #4a4a4a); margin: 0;">Chargement...</p>
        </div>
      </div>
    </div>
  </main>
  
  <footer></footer>
</div>

</body>
</html>`;
  
  // Read all CSS files
  const cssFiles = [
    'css/theme.css',
    'css/utilities.css',
    'css/layout.css',
    'css/components.css',
    'css/animations.css',  // 3D animation styles
    'css/editor.css',
    'css/scroll-optimizations.css',
    'css/visual-enhancements.css'
  ];
  
  let allCSS = '';
  cssFiles.forEach(cssFile => {
    const cssPath = path.join(rootDir, cssFile);
    if (fs.existsSync(cssPath)) {
      allCSS += fs.readFileSync(cssPath, 'utf-8') + '\n';
      console.log(`✓ Loaded ${cssFile}`);
    }
  });
  
  // Read all JS files from current working directory (not for replacement, just for standalone build)
  // IMPORTANT: This is for building standalone version only - does NOT modify source files
  const jsFiles = [
    // Core framework files first - JdrApp namespace must be very first
    'js/core.js',                // Core JdrApp namespace - MUST BE FIRST
    'js/config/constants.js',     // Constants
    'js/config/contentTypes.js',  // Configuration 
    'js/core/EventBus.js',        // Event system
    'js/core/BaseEntity.js',      // Entity base class
    'js/factories/ContentFactory.js', // Factory pattern
    'js/builders/CardBuilder.js',  // Card builder
    'js/builders/PageBuilder.js',  // Page builder
    'js/utils.js',               // Utilities
    'js/utils/device-detection.js', // Device detection utilities
    
    // Feature modules
    'js/modules/images.js',       // Image module
    'js/storage.js',              // Storage functions
    
    // Features modules (AVANT renderer pour être disponibles au rendu)
    'js/features/SpellFilter.js', // Spell filter feature
    'js/features/TablesTresorsManager.js', // Tables de trésors manager
    'js/features/FavorisManager.js', // Favoris manager - AVANT renderer
    'js/features/FavorisRenderer.js', // Favoris renderer - AVANT renderer
    'js/features/AnimationEnhancer.js', // 3D animation effects
    'js/features/ScrollOptimizer.js', // Scroll performance optimizations
    'js/features/CharacterCreator.js', // Character creator
    'js/features/CharacterCreatorUI.js', // Character creator UI
    'js/features/DynamicCentering.js', // Dynamic centering system
    
    // Modules qui dépendent des features
    'js/router.js',               // Router module
    'js/renderer.js',             // Renderer module - APRÈS les features
    'js/core/UnifiedEditor.js',   // Unified editor
    'js/editor.js',               // Editor module
    
    // UI utilities (before main UI module)
    'js/ui/UIUtilities.js',       // UI utilities - AVANT ui.js
    'js/ui/BaseModal.js',         // Modal base class - AVANT ui.js
    'js/ui/UICore.js',            // UI core initialization - AVANT ui.js
    'js/ui/EventHandlers.js',     // Event delegation - AVANT ui.js
    'js/ui/ContentManager.js',    // Content CRUD operations - AVANT ui.js
    'js/ui/TagsManager.js',       // Tags management - AVANT ui.js
    'js/ui/SearchManager.js',     // Search functionality - AVANT ui.js
    'js/ui/ModalManager.js',      // Specialized modals - AVANT ui.js
    'js/ui/ResponsiveManager.js', // Responsive design - AVANT ui.js
    'js/ui/PageManager.js',       // Page management - AVANT ui.js
    'js/ui/GMObjectFilters.js',   // Filter modules - AVANT ui.js
    'js/ui/MonsterFilters.js',    // Monster filters - AVANT ui.js  
    'js/ui/TableTresorFilters.js', // Treasure filters - AVANT ui.js
    
    'js/ui.js',                   // UI module - en dernier
    'js/libs/jspdf-loader.js'     // External library loaders - last
  ];
  
  let allJS = '';
  jsFiles.forEach(jsFile => {
    const jsPath = path.join(rootDir, jsFile);
    if (fs.existsSync(jsPath)) {
      allJS += fs.readFileSync(jsPath, 'utf-8') + '\n';
      console.log(`✓ Loaded ${jsFile}`);
    }
  });
  
  // Read all JSON data files
  const dataFiles = [
    'sorts.json', 'classes.json', 'competences-tests.json',
    'creation.json', 'dons.json', 'objets.json', 'elements.json', 'etats.json',
    'images.json', 'static-pages-config.json', 'stats.json', 'toc-structure.json',
    'monstres.json', 'npcs.json', 'tables-tresors.json', 'collections.json', 'monstres-page-desc.json', 'tables-tresors-page-desc.json', 'custom-page-descriptions.json',
    'combat.json', 'gestion-des-ressources.json', 'histoire.json', 'dieux.json', 'geographie.json', 'campagne.json', 'favoris.json', 'voyage.json', 'traumas.json', 'metiers.json', 'peuple.json'
  ];
  
  let dataObject = {};
  dataFiles.forEach(dataFile => {
    const dataPath = path.join(rootDir, 'data', dataFile);
    if (fs.existsSync(dataPath)) {
      try {
        const key = dataFile.replace('.json', '').replace(/-/g, '_');
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const jsonData = JSON.parse(rawData);
        dataObject[key] = jsonData;
        console.log(`✓ Loaded ${dataFile} (key: ${key})`);
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${dataFile}:`, error.message);
        // Create default structure if JSON is malformed
        const key = dataFile.replace('.json', '').replace(/-/g, '_');
        dataObject[key] = {
          page: key.replace('_', '-'),
          title: key.replace('_', ' '),
          sections: [
            {
              type: 'intro',
              content: 'Cette page est en cours de développement.'
            }
          ]
        };
      }
    } else {
      console.warn(`⚠️  File not found: ${dataFile}`);
    }
  });
  
  // No need to remove anything since we're building from scratch
  
  // Add timestamp
  const timestamp = new Date().toISOString();
  htmlContent = htmlContent.replace(
    '<title>',
    `<!-- Generated on ${timestamp} by JdrBab Build System -->\n<title>`
  );
  
  // Inject CSS
  htmlContent = htmlContent.replace(
    '</head>',
    `<style>\n${allCSS}</style>\n</head>`
  );
  
  // Inject data and JavaScript - create complete standalone app
  const dataScript = `
    // Ensure window object exists
    window = window || {};
    
    // Global data from modular files
    window.SORTS = ${JSON.stringify(dataObject.sorts || {}, null, 2)};
    window.CLASSES = ${JSON.stringify(dataObject.classes || {}, null, 2)};
    window.DONS = ${JSON.stringify(dataObject.dons || {}, null, 2)};
    window.OBJETS = ${JSON.stringify(dataObject.objets || {}, null, 2)};
    window.MONSTRES = ${JSON.stringify(dataObject.monstres || [], null, 2)};
    window.NPCS = ${JSON.stringify(dataObject.npcs || [], null, 2)};
    window.TABLES_TRESORS = ${JSON.stringify(dataObject.tables_tresors || { tables: [] }, null, 2)};
    window.COLLECTIONS = ${JSON.stringify(dataObject.collections || { collections: [] }, null, 2)};
    window.IMAGES = ${JSON.stringify(dataObject.images || {}, null, 2)};
    
    // Page descriptions
    window.MONSTRES_PAGE_DESC = ${JSON.stringify(dataObject.monstres_page_desc || {
      description: "Créatures, ennemis et adversaires que peuvent affronter les héros dans leurs aventures."
    }, null, 2)};
    window.TABLES_TRESORS_PAGE_DESC = ${JSON.stringify(dataObject.tables_tresors_page_desc || {
      description: "Tables de butin permettant de générer aléatoirement des récompenses selon les fourchettes définies. Lancez un dé 20 et consultez la table correspondante pour déterminer l'objet obtenu."
    }, null, 2)};
    
    // Custom page descriptions for collections and other dynamic pages
    window.CUSTOM_PAGE_DESCRIPTIONS = ${JSON.stringify(dataObject.custom_page_descriptions || {
      'collections-objets': 'Recherchez et explorez des collections d\'objets organisées par thème'
    }, null, 2)};
    
    // TOC Structure for advanced navigation
    window.TOC_STRUCTURE = ${JSON.stringify(dataObject.toc_structure || {}, null, 2)};
    
    // Build STATIC_PAGES dynamically from all loaded page data
    window.STATIC_PAGES = {
      'creation': ${JSON.stringify(dataObject.creation || {}, null, 2)},
      'elements': ${JSON.stringify(dataObject.elements || {}, null, 2)},
      'stats': ${JSON.stringify(dataObject.stats || {}, null, 2)},
      'competences-tests': ${JSON.stringify(dataObject.competences_tests || {}, null, 2)},
      'etats': ${JSON.stringify(dataObject.etats || {}, null, 2)},
      'combat': ${JSON.stringify(dataObject.combat || {}, null, 2)},
      'gestion-des-ressources': ${JSON.stringify(dataObject.gestion_des_ressources || {}, null, 2)},
      'histoire': ${JSON.stringify(dataObject.histoire || {}, null, 2)},
      'dieux': ${JSON.stringify(dataObject.dieux || {}, null, 2)},
      'geographie': ${JSON.stringify(dataObject.geographie || {}, null, 2)},
      'campagne': ${JSON.stringify(dataObject.campagne || {}, null, 2)},
      'voyage': ${JSON.stringify(dataObject.voyage || {}, null, 2)},
      'traumas': ${JSON.stringify(dataObject.traumas || {}, null, 2)},
      'metiers': ${JSON.stringify(dataObject.metiers || {}, null, 2)},
      'peuple': ${JSON.stringify(dataObject.peuple || {}, null, 2)}
    };
    
    // Static pages configuration
    window.STATIC_PAGES_CONFIG = ${JSON.stringify(dataObject.static_pages_config || {}, null, 2)};

    // Mark as standalone version for renderer with build timestamp
    window.STANDALONE_VERSION = true;
    window.BUILD_VERSION = '${new Date().toISOString()}';

    // Version check - clear old data if version changed
    (function() {
      var storedVersion = localStorage.getItem('foresia-build-version');
      if (storedVersion !== window.BUILD_VERSION) {
        // New version detected - clear cached data but preserve user preferences
        var keysToPreserve = ['jdr-bab-favoris', 'jdr-bab-filter-settings'];
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && (key.startsWith('jdr-bab') || key.startsWith('foresia')) && keysToPreserve.indexOf(key) === -1) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(function(key) { localStorage.removeItem(key); });
        localStorage.setItem('foresia-build-version', window.BUILD_VERSION);
        console.log('New version detected, cache cleared:', window.BUILD_VERSION);
      }
    })();

    // Initialize app when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      // Ensure dev mode is off
      document.body.className = 'dev-off';

      // Initialize in standalone mode with embedded data

      // Wait a bit to ensure all modules are loaded
      setTimeout(function() {
        // Initialize JdrApp if it exists
        if (window.JdrApp && window.JdrApp.init) {
          window.JdrApp.init();
        } else {
          console.error('JdrApp not found!', window.JdrApp);
        }
      }, 100);
    });
  `;
  
  // Add PWA Service Worker (embedded) with base64 icons
  const swContent = fs.readFileSync(path.join(rootDir, 'config', 'sw.js'), 'utf-8');
  
  // Pre-calculate base64 icons for file:// protocol
  const icon144Base64 = fs.readFileSync(path.join(rootDir, 'assets', 'pwa', 'icon-144x144.png')).toString('base64');
  const icon192Base64 = fs.readFileSync(path.join(rootDir, 'assets', 'pwa', 'icon-192x192.png')).toString('base64');
  const icon512Base64 = fs.readFileSync(path.join(rootDir, 'assets', 'pwa', 'icon-512x512.png')).toString('base64');
  
  const pwaSW = `
<!-- PWA Service Worker (Embedded) -->
<script>
// Create dynamic manifest for PWA - Protocol-aware
if (window.MANIFEST_DATA) {
  let manifest = JSON.parse(JSON.stringify(window.MANIFEST_DATA));
  
  // Only modify manifest for file:// protocol
  if (window.location.protocol === 'file:') {
    manifest.start_url = window.location.href;
    manifest.scope = window.location.href;
    
    // Create a simple SVG icon that works with file:// protocol
    const simpleIcon = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#f4f0e6" rx="16"/><rect x="24" y="30" width="96" height="84" fill="#fff" stroke="#8b4513" stroke-width="2" rx="4"/><line x1="36" y1="50" x2="108" y2="50" stroke="#8b4513" stroke-width="2"/><line x1="36" y1="70" x2="108" y2="70" stroke="#8b4513" stroke-width="2"/><line x1="36" y1="90" x2="90" y2="90" stroke="#8b4513" stroke-width="2"/><circle cx="120" cy="24" r="4" fill="#d4af37"/></svg>');
    
    manifest.icons = [
      {
        "src": simpleIcon,
        "sizes": "144x144",
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": simpleIcon,
        "sizes": "192x192", 
        "type": "image/svg+xml",
        "purpose": "any"
      },
      {
        "src": simpleIcon,
        "sizes": "512x512",
        "type": "image/svg+xml", 
        "purpose": "any"
      }
    ];
    
    // Remove problematic elements for file:// 
    manifest.shortcuts = [];
    delete manifest.screenshots;
    console.log('📱 PWA manifest adapted for file:// protocol');
  } else {
    // For HTTPS - convert relative icon paths to absolute URLs
    // Blob URLs have no base path, so relative paths don't resolve
    const baseUrl = window.location.href.replace(/\\/[^\\/]*$/, '/'); // Get directory URL

    // Convert icon paths to absolute URLs
    manifest.icons = manifest.icons.map(icon => ({
      ...icon,
      src: new URL(icon.src, baseUrl).href
    }));

    // Also fix shortcuts icons if present
    if (manifest.shortcuts) {
      manifest.shortcuts = manifest.shortcuts.map(shortcut => ({
        ...shortcut,
        icons: shortcut.icons ? shortcut.icons.map(icon => ({
          ...icon,
          src: new URL(icon.src, baseUrl).href
        })) : []
      }));
    }

    // Fix start_url and scope for GitHub Pages subpath
    manifest.start_url = window.location.href;
    manifest.scope = baseUrl;

    console.log('📱 PWA manifest with absolute URLs for HTTPS:', manifest.icons[0]?.src);
  }

  // Create manifest blob and URL
  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(manifestBlob);
  
  // Inject manifest link dynamically
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = manifestUrl;
  document.head.appendChild(manifestLink);
  
  console.log('📱 PWA manifest injected');
}

// Service Worker only works on HTTPS or localhost
const canUseServiceWorker = 'serviceWorker' in navigator && 
  (window.location.protocol === 'https:' || 
   window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');

if (canUseServiceWorker) {
  // Service Worker Registration - use relative path for GitHub Pages compatibility
  const swUrl = '../sw.js';

  // Progressive Web App - Service Worker Registration
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' })
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, notify user
                if (window.JdrApp && JdrApp.modules && JdrApp.modules.ui) {
                  JdrApp.modules.ui.showNotification('🔄 Nouvelle version disponible ! Rechargez la page.', 'info');
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });

    // Auto-reload when the new SW takes control (after skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });

  // Listen for app install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or notification
    if (window.JdrApp && JdrApp.modules && JdrApp.modules.ui) {
      JdrApp.modules.ui.showNotification('📱 Installer JDR-BAB sur votre appareil ?', 'info');
    }
  });

  // Track install success
  window.addEventListener('appinstalled', (e) => {
    console.log('✅ PWA was installed successfully');
    if (window.JdrApp && JdrApp.modules && JdrApp.modules.ui) {
      JdrApp.modules.ui.showNotification('✅ JDR-BAB installé avec succès !', 'success');
    }
    deferredPrompt = null;
  });
} else {
  console.log('⚠️ Service Worker not available (requires HTTPS)');
  console.log('💡 For full PWA features, serve via HTTPS server');
}

// PWA Display Mode Detection
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  console.log('📱 Running as PWA');
  document.body.classList.add('pwa-mode');
}

// Basic PWA install prompt for non-HTTPS environments
if (!canUseServiceWorker && window.MANIFEST_DATA) {
  console.log('💡 Limited PWA support without Service Worker');
  console.log('📱 Try: Add to Home Screen (mobile) or Install App (desktop)');
}

// Force update button
document.getElementById('forceUpdateBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('forceUpdateBtn');
  if (btn) { btn.textContent = '⏳ Mise à jour...'; btn.disabled = true; }
  try {
    // Clear all caches
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch(e) { console.warn('Force update error:', e); }
  window.location.reload(true);
});
</script>`;

  htmlContent = htmlContent.replace(
    '</body>',
    `<script>\n${dataScript}\n${allJS}\n\n// Initialize main app when DOM is ready\nif (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', () => {\n    if (window.JdrApp && typeof JdrApp.init === 'function') {\n      JdrApp.init();\n    }\n  });\n} else {\n  if (window.JdrApp && typeof JdrApp.init === 'function') {\n    JdrApp.init();\n  }\n}\n</script>\n\n${pwaSW}\n</body>`
  );
  
  // Remove any external script tags that might have been added somehow
  htmlContent = htmlContent.replace(/<script src="[^"]*"><\/script>\s*/g, '');
  
  console.log('🔒 Dev mode disabled in standalone version');
  
  // Replace all local image paths with GitHub raw URLs for standalone mode
  const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/ben-128/BabJdr/master/';
  // Match data/images/... paths up to a quote, escaped quote, or whitespace
  // [^\\"'`\\s] excludes backslash so we don't capture the \ in escaped quotes like \"
  htmlContent = htmlContent.replace(
    /data\/images\/[^"'`\s\\]+/g,
    (match) => {
      // Encode each path segment after data/images/ to handle accents, spaces, apostrophes
      const segments = match.split('/');
      // First two segments are 'data' and 'images' - don't encode those
      const encoded = segments.map((s, i) => i < 2 ? s : encodeURIComponent(s)).join('/');
      return GITHUB_RAW_BASE + encoded;
    }
  );
  console.log('🌐 Local image paths converted to GitHub raw URLs for standalone');

  // Write to output
  const outputPath = path.join(outputDir, 'Foresia.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf-8');
  
  // Also copy landing page as index.html for GitHub Pages
  const landingPath = path.join(rootDir, 'landing.html');
  if (fs.existsSync(landingPath)) {
    const githubIndexPath = path.join(rootDir, 'github-index.html');
    fs.copyFileSync(landingPath, githubIndexPath);
    console.log('📄 GitHub Pages landing page copied to github-index.html');
  }

  // Copy Service Worker to root for standalone PWA support
  const swSourcePath = path.join(rootDir, 'config', 'sw.js');
  const swDestPath = path.join(rootDir, 'sw.js');
  if (fs.existsSync(swSourcePath)) {
    fs.copyFileSync(swSourcePath, swDestPath);
    console.log('🔧 Service Worker copied to root for PWA support');
  }
  
  const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
  
  console.log('✅ Build completed successfully!');
  console.log(`📄 Output: ${outputPath}`);
  console.log(`📊 Size: ${sizeKB} KB`);
  console.log('🎯 File is ready for distribution');
}

// Run build
if (require.main === module) {
  // Check for command line arguments
  const args = process.argv.slice(2);
  const options = {
    noVersionBump: args.includes('--no-version-bump')
  };
  buildStandalone(options);
}

module.exports = buildStandalone;