// ============================================================================
// JDR-BAB APPLICATION - IMAGES MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // IMAGES MANAGEMENT MODULE
  // ========================================
  JdrApp.modules.images = {
    // Store for preloaded images
    imageStore: {},

    // Flag to indicate data is loaded
    dataLoaded: false,

    // ========================================
    // BACKGROUND PRELOADER SYSTEM
    // ========================================
    backgroundPreloader: {
      queue: [],              // URLs waiting to be loaded (low priority)
      priorityQueue: [],      // URLs to load first (visible on current page)
      loading: new Set(),     // Currently loading URLs
      loaded: new Set(),      // Already loaded/cached URLs
      failed: new Set(),      // Failed URLs (to avoid retry loops)
      isRunning: false,
      isPaused: false,
      concurrentLoads: 4,     // Number of concurrent background loads (was 2)
      priorityConcurrent: 6,  // More concurrent loads for priority images (was 4)
      idleDelay: 20,          // Delay between loads when idle (ms) - faster (was 50)
      activeDelay: 100,       // Delay when user is active (was 200)
      totalImages: 0,
      loadedCount: 0
    },

    async init() {
      await this.loadImageData();
      this.initImageHandlers();
      this.initLazyLoading();
      this.initBackgroundPreloader();

      // Auto-load images after data is ready and DOM is rendered
      // Uses a small delay to ensure pages are rendered first
      setTimeout(() => {
        this.autoLoadImages();
      }, 100);

      // Auto-sync monster images on startup to ensure consistency
      setTimeout(() => {
        this.ensureMonsterImageMappings();
      }, 1000);

      // Start background preloading after initial page load (faster start)
      setTimeout(() => {
        this.startBackgroundPreloading();
      }, 500);
    },

    // Configuration for image loading
    imageLoadConfig: {
      timeout: 15000,      // 15 seconds timeout
      maxRetries: 2,       // Retry up to 2 times for temporary errors
      retryDelay: 2000     // Wait 2 seconds between retries
    },

    // Initialize lazy loading with Intersection Observer
    initLazyLoading() {
      if ('IntersectionObserver' in window) {
        // Improved loading margins for better perceived performance
        // Load images 300px before they enter viewport (was 50px)
        this.lazyImageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const dataSrc = img.getAttribute('data-src');
              if (dataSrc) {
                this.loadImageWithRetry(img, dataSrc);
              }
              observer.unobserve(img);
            }
          });
        }, {
          rootMargin: '300px 0px', // Start loading 300px before image comes into view (optimized)
          threshold: 0.01
        });
      } else {
        // Fallback for browsers without IntersectionObserver
        this.initFallbackLazyLoading();
      }
    },

    // Load image with timeout and retry mechanism
    loadImageWithRetry(img, url, retryCount = 0) {
      img.removeAttribute('data-src');
      img.classList.remove('lazy-load');
      img.classList.add('lazy-loading');

      // Store original URL for retry
      if (!img.dataset.originalSrc) {
        img.dataset.originalSrc = url;
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (img.classList.contains('lazy-loading')) {
          console.warn(`Image timeout after ${this.imageLoadConfig.timeout}ms:`, url);
          this.handleImageLoadFailure(img, url, retryCount, 'timeout');
        }
      }, this.imageLoadConfig.timeout);

      // Success handler
      const onLoad = () => {
        clearTimeout(timeoutId);
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
        delete img.dataset.retryCount;

        // Mark as loaded in background preloader to avoid duplicate work
        if (this.backgroundPreloader) {
          this.backgroundPreloader.loaded.add(url);
        }

        // Remove flag to force re-attachment of click events now that image is loaded
        img.removeAttribute('data-events-attached');

        // S'assurer que les événements d'agrandissement sont attachés
        if (JdrApp.modules.editor && JdrApp.modules.editor.attachImageEvents) {
          JdrApp.modules.editor.attachImageEvents();
        }
      };

      // Error handler
      const onError = () => {
        clearTimeout(timeoutId);
        this.handleImageLoadFailure(img, url, retryCount, 'error');
      };

      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });

      // Start loading
      img.src = url;
    },

    // Handle image load failure with retry logic
    handleImageLoadFailure(img, url, retryCount, reason) {
      img.classList.remove('lazy-loading');

      // Si l'image utilise weserv.nl et échoue, réessayer avec l'URL originale
      if (url.includes('images.weserv.nl')) {
        console.warn('weserv.nl proxy failed, trying original URL:', url);
        const originalUrl = this.extractOriginalUrl(url);
        if (originalUrl && originalUrl !== url) {
          this.loadImageWithRetry(img, originalUrl, 0);
          return;
        }
      }

      // Retry logic for temporary failures
      if (retryCount < this.imageLoadConfig.maxRetries) {
        const nextRetry = retryCount + 1;

        setTimeout(() => {
          img.classList.add('lazy-loading');
          this.loadImageWithRetry(img, img.dataset.originalSrc || url, nextRetry);
        }, this.imageLoadConfig.retryDelay);
        return;
      }

      // Final failure - show error state
      console.warn(`Failed to load image after ${this.imageLoadConfig.maxRetries} retries (${reason}):`, url);
      img.classList.add('lazy-error');
      this.showImageErrorPlaceholder(img);
    },

    // Show a visible error placeholder for failed images
    showImageErrorPlaceholder(img) {
      const container = img.closest('.illus');
      if (!container) return;

      // Check if placeholder already exists
      if (container.querySelector('.image-error-placeholder')) return;

      // Create error placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'image-error-placeholder';
      placeholder.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 2px dashed #ef4444;
                    border-radius: 8px; color: #ef4444; text-align: center; min-height: 100px;">
          <span style="font-size: 2em; margin-bottom: 0.5rem;">🖼️❌</span>
          <span style="font-size: 0.85em; font-weight: 500;">Image indisponible</span>
          <button class="retry-image-btn" style="margin-top: 0.5rem; padding: 4px 12px;
                  background: #ef4444; color: white; border: none; border-radius: 4px;
                  cursor: pointer; font-size: 0.8em;">🔄 Réessayer</button>
        </div>
      `;

      // Add retry button functionality
      const retryBtn = placeholder.querySelector('.retry-image-btn');
      retryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        placeholder.remove();
        img.classList.remove('lazy-error');
        const originalUrl = img.dataset.originalSrc || img.src;
        this.loadImageWithRetry(img, originalUrl, 0);
      });

      // Hide the broken image and show placeholder
      img.style.display = 'none';
      container.appendChild(placeholder);
    },

    // Fallback lazy loading for older browsers
    initFallbackLazyLoading() {
      const lazyLoad = () => {
        const lazyImages = document.querySelectorAll('img.lazy-load[data-src]');
        lazyImages.forEach(img => {
          const rect = img.getBoundingClientRect();
          if (rect.top < window.innerHeight + 50 && rect.bottom > -50) {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              // Use the same retry mechanism as IntersectionObserver
              this.loadImageWithRetry(img, dataSrc);
            }
          }
        });
      };

      // Use throttled scroll events for better performance
      const throttledLazyLoad = JdrApp.utils.throttle(lazyLoad, 100);
      const debouncedLazyLoad = JdrApp.utils.debounce(lazyLoad, 250);

      window.addEventListener('scroll', throttledLazyLoad, { passive: true });
      window.addEventListener('resize', debouncedLazyLoad, { passive: true });
      lazyLoad(); // Initial check
    },

    // Load image data from JSON file or embedded data
    async loadImageData() {
      try {
        if (window.IMAGES) {
          this.imageStore = window.IMAGES.images || window.IMAGES || {};
          this.dataLoaded = true;
          return;
        }

        const response = await fetch('./data/images.json');
        if (response.ok) {
          const data = await response.json();
          this.imageStore = data.images || {};
        } else {
          this.imageStore = {};
        }
      } catch (error) {
        this.imageStore = {};
      }
      this.dataLoaded = true;
    },

    // Get image URL for a given key
    getImageUrl(illusKey) {
      return this.imageStore[illusKey] || null;
    },

    // Apply image to an illustration element
    applyImage(illusElement, imageUrl) {
      if (!illusElement || !imageUrl) return;

      const img = illusElement.querySelector('img.thumb');
      if (!img) return;

      // Set image source and make it visible
      img.src = this.processImageUrl(imageUrl);
      img.style.display = 'inline-block';
      img.style.opacity = '1'; // Reset opacity after upload
      
      // Show remove button if it exists and dev mode is on
      const removeBtn = illusElement.querySelector('.rm');
      if (removeBtn) {
        const isDevMode = document.body.classList.contains('dev-on');
        removeBtn.style.display = isDevMode ? 'inline-flex' : 'none';
      }

    },

    // Process image URL to handle proxying for mobile compatibility
    processImageUrl(originalUrl) {
      // Disabled weserv.nl proxy for faster loading - load directly from i.ibb.co
      // The proxy was adding latency. ImgBB is fast enough on its own.
      // if (originalUrl.includes('i.ibb.co') && !originalUrl.includes('images.weserv.nl')) {
      //   const format = this.supportsWebP() ? 'webp' : 'jpeg';
      //   const quality = this.getOptimalQuality();
      //   return `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&we&output=${format}&q=${quality}&w=400&h=300&fit=inside`;
      // }

      // For local monster paths, encode only the filename to handle French characters properly
      if (originalUrl.startsWith('data/images/Monstres/')) {
        const pathParts = originalUrl.split('/');
        const filename = pathParts[pathParts.length - 1];
        const pathWithoutFilename = pathParts.slice(0, -1).join('/');
        return `${pathWithoutFilename}/${encodeURIComponent(filename)}`;
      }

      return originalUrl;
    },

    // Extract original URL from weserv.nl proxy URL
    extractOriginalUrl(weservUrl) {
      try {
        if (!weservUrl.includes('images.weserv.nl')) {
          return weservUrl;
        }

        // Parse the URL to extract the 'url' parameter
        const urlObj = new URL(weservUrl);
        const originalUrl = urlObj.searchParams.get('url');

        if (originalUrl) {
          return decodeURIComponent(originalUrl);
        }

        return null;
      } catch (error) {
        console.error('Error extracting original URL from weserv:', error);
        return null;
      }
    },

    // Detect WebP support
    supportsWebP() {
      if (this._webpSupport !== undefined) return this._webpSupport;
      
      try {
        this._webpSupport = document.createElement('canvas')
          .toDataURL('image/webp', 0.5)
          .indexOf('data:image/webp') === 0;
      } catch (err) {
        this._webpSupport = false;
      }
      
      return this._webpSupport;
    },

    // Get optimal quality based on connection speed
    getOptimalQuality() {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.effectiveType === '4g') return 85;
        if (connection.effectiveType === '3g') return 75;
        if (connection.effectiveType === '2g') return 65;
        return 60; // slow-2g
      }
      return 80; // Default quality
    },

    autoLoadImages() {
      let loadedCount = 0;
      const bp = this.backgroundPreloader;

      // 1. Handle elements with data-illus-key
      const illusElements = document.querySelectorAll('[data-illus-key]');
      illusElements.forEach(illusElement => {
        const illusKey = illusElement.dataset.illusKey;
        const imageUrl = this.getImageUrl(illusKey);

        if (imageUrl) {
          const img = illusElement.querySelector('img');
          if (img) {
            const processedUrl = this.processImageUrl(imageUrl);

            // Make image visible (it may have been hidden during initial render)
            img.style.display = 'inline-block';

            // Remove events-attached flag to allow re-attachment after image loads
            img.removeAttribute('data-events-attached');

            // Check if image needs loading (still has placeholder or no real src)
            const needsLoading = !img.src ||
                                 img.src.includes('data:image/svg+xml') ||
                                 img.classList.contains('lazy-load');

            if (needsLoading) {
              // Load immediately instead of waiting for intersection
              this.loadImageWithRetry(img, processedUrl);
            }
            loadedCount++;
          }
        }
      });

      // 2. Handle lazy-load images with data-src on visible page - load all immediately
      const visibleArticle = document.querySelector('article.active, article[style*="display: block"]');
      if (visibleArticle) {
        const lazyImages = visibleArticle.querySelectorAll('img.lazy-load[data-src]');
        lazyImages.forEach(img => {
          const dataSrc = img.getAttribute('data-src');
          if (dataSrc) {
            const processedUrl = this.processImageUrl(dataSrc);
            // Load immediately - browser cache will handle preloaded images
            this.loadImageWithRetry(img, processedUrl);
            loadedCount++;
          }
        });
      }

      return loadedCount;
    },

    // Initialize image upload handlers
    initImageHandlers() {
      // Delegate image upload handling
      document.addEventListener('change', (event) => {
        if (event.target.matches('.illus input[type="file"]')) {
          this.handleImageUpload(event.target);
        }
      });

      // Delegate image removal handling  
      document.addEventListener('click', (event) => {
        if (event.target.matches('.illus .rm')) {
          this.handleImageRemoval(event.target);
        }
      });
    },

    // Handle image upload
    async handleImageUpload(fileInput) {
      const file = fileInput.files[0];
      if (!file) return;

      const illusElement = fileInput.closest('.illus');
      if (!illusElement) return;

      const illusKey = illusElement.dataset.illusKey;
      
      try {
        // Show loading state
        const img = illusElement.querySelector('img.thumb');
        if (img) {
          img.style.opacity = '0.5';
        }

        // Upload image (auto-compressed before upload)
        const imageUrl = await JdrApp.utils.uploadToImageBB(file);
        
        // Apply the uploaded image
        this.applyImage(illusElement, imageUrl);
        
        // Update local store
        this.imageStore[illusKey] = imageUrl;
        
        // Auto-sync to prevent loss of image assignments
        this.autoSyncImages();
        
        
      } catch (error) {
        // Reset loading state
        const img = illusElement.querySelector('img.thumb');
        if (img) {
          img.style.opacity = '1';
        }
        
        alert('Erreur lors du téléchargement de l\'image. Veuillez réessayer.');
      }
      
      // Clear file input
      fileInput.value = '';
    },

    // Handle image removal
    handleImageRemoval(removeBtn) {
      const illusElement = removeBtn.closest('.illus');
      if (!illusElement) return;

      const illusKey = illusElement.dataset.illusKey;
      const img = illusElement.querySelector('img.thumb');
      
      if (img) {
        img.src = '';
        img.style.display = 'none';
      }
      
      removeBtn.style.display = 'none';
      
      // Remove from store
      delete this.imageStore[illusKey];
      
      // Auto-sync to update persistent storage
      this.autoSyncImages();
    },

    // Manually add/update an image
    setImage(illusKey, imageUrl) {
      this.imageStore[illusKey] = imageUrl;
      
      // Apply to any existing elements with this key
      const illusElements = document.querySelectorAll(`[data-illus-key="${illusKey}"]`);
      illusElements.forEach(element => {
        this.applyImage(element, imageUrl);
      });
      
      // Auto-sync to prevent loss
      this.autoSyncImages();
    },

    // Get all current images for export
    getAllImages() {
      return { ...this.imageStore };
    },

    // Import images from external data
    importImages(imageData) {
      if (typeof imageData === 'object' && imageData !== null) {
        Object.assign(this.imageStore, imageData);
        this.autoLoadImages();
      }
    },

    // ========================================
    // BACKGROUND PRELOADER METHODS
    // ========================================

    // Initialize the background preloader system
    initBackgroundPreloader() {
      const bp = this.backgroundPreloader;

      // Listen to navigation events to reprioritize
      window.addEventListener('hashchange', () => {
        this.onNavigationChange();
      });

      // Listen for visibility changes to pause/resume
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          bp.isPaused = true;
        } else {
          bp.isPaused = false;
          this.processPreloadQueue();
        }
      });

      // Detect user activity to adjust loading speed
      let activityTimeout;
      const markActive = () => {
        bp.isUserActive = true;
        clearTimeout(activityTimeout);
        activityTimeout = setTimeout(() => {
          bp.isUserActive = false;
        }, 3000);
      };

      window.addEventListener('scroll', markActive, { passive: true });
      window.addEventListener('mousemove', markActive, { passive: true });
      window.addEventListener('keydown', markActive, { passive: true });
    },

    // Start background preloading of all images
    startBackgroundPreloading() {
      const bp = this.backgroundPreloader;
      if (bp.isRunning) return;

      // Collect all unique image URLs from the store
      const allUrls = this.collectAllImageUrls();

      // Filter out already loaded/loading/failed URLs
      bp.queue = allUrls.filter(url =>
        !bp.loaded.has(url) &&
        !bp.loading.has(url) &&
        !bp.failed.has(url)
      );

      bp.totalImages = allUrls.length;
      bp.isRunning = true;

      // Prioritize images on the current visible page first
      this.prioritizeVisibleImages();

      // Start processing
      this.processPreloadQueue();
    },

    // Collect all image URLs from the imageStore
    collectAllImageUrls() {
      const urls = new Set();

      // Helper to check if URL is external (http/https)
      const isExternalUrl = (url) => url && (url.startsWith('http://') || url.startsWith('https://'));

      // Get all URLs from imageStore (only external URLs)
      Object.values(this.imageStore).forEach(url => {
        if (url && typeof url === 'string' && isExternalUrl(url)) {
          urls.add(this.processImageUrl(url));
        }
      });

      // Also collect from monster data if available (only external URLs)
      if (window.MONSTRES && Array.isArray(window.MONSTRES)) {
        window.MONSTRES.forEach(monster => {
          if (monster.image && monster.image.trim() && isExternalUrl(monster.image)) {
            urls.add(this.processImageUrl(monster.image));
          }
        });
      }

      // Also collect from object data if available (only external URLs)
      if (window.OBJETS && Array.isArray(window.OBJETS.objets)) {
        window.OBJETS.objets.forEach(objet => {
          if (objet.image && objet.image.trim() && isExternalUrl(objet.image)) {
            urls.add(this.processImageUrl(objet.image));
          }
        });
      }

      return Array.from(urls);
    },

    // Prioritize images that should be visible on the current page
    prioritizeVisibleImages() {
      const bp = this.backgroundPreloader;

      // Find visible article/page
      const visibleArticle = document.querySelector('article.active, article[style*="display: block"]');
      if (!visibleArticle) return;

      // Find all image elements that need loading in this view
      const visibleImages = visibleArticle.querySelectorAll('[data-illus-key], img[data-src], img.lazy-load');
      const priorityUrls = [];

      visibleImages.forEach(el => {
        let url = null;

        if (el.dataset.illusKey) {
          url = this.getImageUrl(el.dataset.illusKey);
        } else if (el.dataset.src) {
          url = el.dataset.src;
        }

        if (url) {
          const processedUrl = this.processImageUrl(url);
          if (!bp.loaded.has(processedUrl) && !bp.loading.has(processedUrl)) {
            priorityUrls.push(processedUrl);
          }
        }
      });

      // Move priority URLs to front of queue
      if (priorityUrls.length > 0) {
        // Remove from main queue
        bp.queue = bp.queue.filter(url => !priorityUrls.includes(url));
        // Add to priority queue
        bp.priorityQueue = [...new Set([...priorityUrls, ...bp.priorityQueue])];
      }
    },

    // Called when user navigates to reprioritize
    onNavigationChange() {
      const bp = this.backgroundPreloader;

      // Small delay to let the DOM update
      setTimeout(() => {
        this.prioritizeVisibleImages();

        // If preloader is paused or stopped, restart processing
        if (bp.isRunning && (bp.queue.length > 0 || bp.priorityQueue.length > 0)) {
          this.processPreloadQueue();
        }
      }, 100);
    },

    // Process the preload queue
    processPreloadQueue() {
      const bp = this.backgroundPreloader;

      // Don't process if paused, stopped, or page is hidden
      if (!bp.isRunning || bp.isPaused || document.hidden) return;

      // Check if we have capacity for more loads
      const maxConcurrent = bp.priorityQueue.length > 0 ? bp.priorityConcurrent : bp.concurrentLoads;
      const availableSlots = maxConcurrent - bp.loading.size;

      if (availableSlots <= 0) return;

      // Get next URLs to load (priority first, then regular queue)
      const urlsToLoad = [];

      // First from priority queue
      while (urlsToLoad.length < availableSlots && bp.priorityQueue.length > 0) {
        const url = bp.priorityQueue.shift();
        if (!bp.loaded.has(url) && !bp.loading.has(url) && !bp.failed.has(url)) {
          urlsToLoad.push(url);
        }
      }

      // Then from regular queue
      while (urlsToLoad.length < availableSlots && bp.queue.length > 0) {
        const url = bp.queue.shift();
        if (!bp.loaded.has(url) && !bp.loading.has(url) && !bp.failed.has(url)) {
          urlsToLoad.push(url);
        }
      }

      // Load each URL
      urlsToLoad.forEach(url => {
        this.preloadSingleImage(url);
      });

      // Schedule next batch if there's more to load
      if (bp.queue.length > 0 || bp.priorityQueue.length > 0) {
        const delay = bp.isUserActive ? bp.activeDelay : bp.idleDelay;

        // Use requestIdleCallback if available for better performance
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            setTimeout(() => this.processPreloadQueue(), delay);
          }, { timeout: 1000 });
        } else {
          setTimeout(() => this.processPreloadQueue(), delay);
        }
      }
    },

    // Preload a single image in the background
    preloadSingleImage(url) {
      const bp = this.backgroundPreloader;

      if (bp.loaded.has(url) || bp.loading.has(url)) return;

      bp.loading.add(url);

      const img = new Image();
      img.decoding = 'async';

      const cleanup = () => {
        bp.loading.delete(url);
        // Continue processing queue
        this.processPreloadQueue();
      };

      img.onload = () => {
        bp.loaded.add(url);
        bp.loadedCount++;
        cleanup();

      };

      img.onerror = () => {
        bp.failed.add(url);
        cleanup();
      };

      // Start loading
      img.src = url;
    },

    // Get preloader status for debugging
    getPreloaderStatus() {
      const bp = this.backgroundPreloader;
      return {
        isRunning: bp.isRunning,
        isPaused: bp.isPaused,
        totalImages: bp.totalImages,
        loaded: bp.loadedCount,
        queued: bp.queue.length,
        priority: bp.priorityQueue.length,
        loading: bp.loading.size,
        failed: bp.failed.size,
        percent: bp.totalImages > 0 ? Math.round((bp.loadedCount / bp.totalImages) * 100) : 0
      };
    },

    // Force preload specific images immediately (for navigation)
    forcePreloadImages(urls) {
      const bp = this.backgroundPreloader;

      urls.forEach(url => {
        const processedUrl = this.processImageUrl(url);
        if (!bp.loaded.has(processedUrl) && !bp.loading.has(processedUrl)) {
          // Add to front of priority queue
          bp.priorityQueue.unshift(processedUrl);
        }
      });

      // Trigger immediate processing
      this.processPreloadQueue();
    },

    // Auto-sync images to prevent data loss
    autoSyncImages() {
      // Ensure we have monster image mappings for all existing monsters
      this.ensureMonsterImageMappings();
      
      // Ensure we have object image mappings for all existing objects
      this.ensureObjectImageMappings();
      
      // Trigger auto-save if available
      if (JdrApp.modules.storage && JdrApp.modules.storage.saveChanges) {
        JdrApp.modules.storage.saveChanges(true); // Silent save
      }
    },

    // Ensure all monsters have image mappings in images.json structure
    ensureMonsterImageMappings() {
      if (!window.MONSTRES || !Array.isArray(window.MONSTRES)) {
        return;
      }

      let hasUpdates = false;

      window.MONSTRES.forEach(monster => {
        const imageKey = `monster:${monster.nom}`;
        
        // If monster has no image mapping in store, create one
        if (!this.imageStore[imageKey]) {
          // Check if monster has a valid image path
          if (monster.image && monster.image.trim()) {
            this.imageStore[imageKey] = monster.image;
            hasUpdates = true;
          }
        }
        
        // Also validate that the image file exists
        this.validateMonsterImagePath(monster);
      });

      if (hasUpdates) {
      }
    },

    // Validate and fix monster image paths
    validateMonsterImagePath(monster) {
      // DISABLED: This function was causing issues by "correcting" paths that were already correct
      // The monster.image field in monstres.json is now the source of truth
      return false;
    },

    // Force synchronization of all monster data
    forceSyncMonsterImages() {
      
      let syncCount = 0;
      
      if (window.MONSTRES && Array.isArray(window.MONSTRES)) {
        window.MONSTRES.forEach(monster => {
          const corrected = this.validateMonsterImagePath(monster);
          if (corrected) {
            syncCount++;
          }
        });
      }
      
      this.ensureMonsterImageMappings();
      
      
      // Save changes
      if (JdrApp.modules.storage && JdrApp.modules.storage.saveChanges) {
        JdrApp.modules.storage.saveChanges(true);
      }
      
      return syncCount;
    },

    // Ensure all objects have image mappings in images.json structure
    ensureObjectImageMappings() {
      if (!window.OBJETS || !Array.isArray(window.OBJETS.objets)) {
        return;
      }

      let hasUpdates = false;

      window.OBJETS.objets.forEach(objet => {
        const imageKey = `objet:${objet.nom}`;
        
        // If object has no image mapping in store, create one
        if (!this.imageStore[imageKey]) {
          // Check if object has a valid image path
          if (objet.image && objet.image.trim()) {
            this.imageStore[imageKey] = objet.image;
            hasUpdates = true;
          }
        } else {
          // If imageStore has an image but objet.image is empty, sync it back
          if (this.imageStore[imageKey] && (!objet.image || !objet.image.trim())) {
            objet.image = this.imageStore[imageKey];
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        // Auto-save objects data if it changed
        if (JdrApp.modules.storage && JdrApp.modules.storage.saveChanges) {
          JdrApp.modules.storage.saveChanges(true);
        }
      }
    }
  };

})();