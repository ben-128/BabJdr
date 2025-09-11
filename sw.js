// ============================================================================
// JDR-BAB PWA SERVICE WORKER
// ============================================================================

const CACHE_NAME = 'jdr-bab-v1.0.0';
const STATIC_CACHE_NAME = 'jdr-bab-static-v1.0.0';
const RUNTIME_CACHE_NAME = 'jdr-bab-runtime-v1.0.0';

// Files to cache immediately (critical resources)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/build/JdrBab.html', // Standalone version
  '/manifest.json',
  
  // CSS Files
  '/css/theme.css',
  '/css/utilities.css',
  '/css/components.css',
  '/css/layout.css',
  '/css/editor.css',
  '/css/scroll-optimizations.css',
  
  // Core JavaScript files
  '/js/config/constants.js',
  '/js/config/contentTypes.js',
  '/js/core/EventBus.js',
  '/js/core/BaseEntity.js',
  '/js/core/UnifiedEditor.js',
  '/js/factories/ContentFactory.js',
  '/js/builders/CardBuilder.js',
  '/js/builders/PageBuilder.js',
  '/js/core.js',
  '/js/utils.js',
  '/js/utils/device-detection.js',
  '/js/modules/images.js',
  '/js/modules/audio.js',
  '/js/storage.js',
  '/js/router.js',
  '/js/renderer.js',
  '/js/editor.js',
  '/js/ui.js',
  
  // Features
  '/js/features/SpellFilter.js',
  '/js/features/TablesTresorsManager.js',
  '/js/features/FavorisManager.js',
  '/js/features/FavorisRenderer.js',
  '/js/features/ScrollOptimizer.js',
  '/js/features/DynamicCentering.js',
  '/js/libs/jspdf-loader.js',
  
  // Data files (JSON)
  '/data/sorts.json',
  '/data/classes.json',
  '/data/dons.json',
  '/data/objets.json',
  '/data/monstres.json',
  '/data/tables-tresors.json',
  '/data/elements.json',
  '/data/etats.json',
  '/data/stats.json',
  '/data/images.json',
  '/data/toc-structure.json',
  '/data/static-pages-config.json',
  '/data/collections.json',
  '/data/creation.json',
  '/data/competences-tests.json',
  '/data/combat.json',
  '/data/gestion-des-ressources.json',
  '/data/histoire.json',
  '/data/dieux.json',
  '/data/geographie.json',
  '/data/campagne.json',
  '/data/favoris.json',
  '/data/custom-page-descriptions.json',
  '/data/monstres-page-desc.json',
  '/data/tables-tresors-page-desc.json'
];

// Assets that can be cached on demand (images, audio, etc.)
const RUNTIME_CACHE_PATTERNS = [
  /\/data\/images\/.*/,
  /\/data\/Musiques\/.*/,
  /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/,
  /\.(?:mp3|wav|ogg|m4a)$/,
  /https:\/\/fonts\.googleapis\.com/,
  /https:\/\/fonts\.gstatic\.com/,
  /https:\/\/i\.ibb\.co/
];

// ============================================================================
// INSTALLATION EVENT
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Static assets cached');
        return self.skipWaiting(); // Force immediate activation
      })
      .catch((error) => {
        console.error('❌ Service Worker: Cache installation failed:', error);
      })
  );
});

// ============================================================================
// ACTIVATION EVENT
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients immediately
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ Service Worker: Activated and ready');
    })
  );
});

// ============================================================================
// FETCH EVENT - NETWORK STRATEGIES
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request.url)) {
    // Static assets: Cache First strategy
    event.respondWith(cacheFirstStrategy(request));
  } else if (isRuntimeCacheable(request.url)) {
    // Runtime assets (images, fonts): Network First with cache fallback
    event.respondWith(networkFirstStrategy(request));
  } else if (isHTMLRequest(request)) {
    // HTML pages: Network First with offline fallback
    event.respondWith(htmlNetworkFirstStrategy(request));
  } else {
    // Everything else: Network only
    event.respondWith(fetch(request));
  }
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

// Cache First - for static assets that rarely change
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('⚠️ Cache First failed for:', request.url);
    throw error;
  }
}

// Network First - for dynamic content with cache fallback
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, checking cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// HTML Network First - for navigation with offline page fallback
async function htmlNetworkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed for HTML, checking cache:', request.url);
    
    // Try to serve cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to main app page (SPA behavior)
    const appCache = await caches.match('/') || await caches.match('/index.html');
    if (appCache) {
      return appCache;
    }
    
    // Last resort - serve the standalone version
    const standaloneCache = await caches.match('/build/JdrBab.html');
    if (standaloneCache) {
      return standaloneCache;
    }
    
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.endsWith(asset) || url.includes(asset));
}

function isRuntimeCacheable(url) {
  return RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isHTMLRequest(request) {
  const url = new URL(request.url);
  return request.headers.get('accept')?.includes('text/html') ||
         url.pathname.endsWith('.html') ||
         url.pathname === '/';
}

// ============================================================================
// BACKGROUND SYNC AND OFFLINE SUPPORT
// ============================================================================

// Handle offline data updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_USER_DATA') {
    caches.open(RUNTIME_CACHE_NAME).then((cache) => {
      cache.put('user-data-' + Date.now(), new Response(JSON.stringify(event.data.data)));
    });
  }
});

// Cleanup old runtime cache entries (keep only last 50 entries)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    cleanupRuntimeCache();
  }
});

async function cleanupRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const keys = await cache.keys();
  if (keys.length > 50) {
    const oldKeys = keys.slice(0, keys.length - 50);
    await Promise.all(oldKeys.map(key => cache.delete(key)));
    console.log(`🧹 Cleaned up ${oldKeys.length} old cache entries`);
  }
}