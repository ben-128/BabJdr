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

    async init() {
      await this.loadImageData();
      this.initImageHandlers();
      this.initLazyLoading();

      // Auto-load images after data is ready and DOM is rendered
      // Uses a small delay to ensure pages are rendered first
      setTimeout(() => {
        this.autoLoadImages();
      }, 100);

      // Auto-sync monster images on startup to ensure consistency
      setTimeout(() => {
        this.ensureMonsterImageMappings();
      }, 1000);
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
        console.log(`Retrying image load (${nextRetry}/${this.imageLoadConfig.maxRetries}):`, url);

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
      const illusElements = document.querySelectorAll('[data-illus-key]');
      let loadedCount = 0;

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

        // Compress and upload image
        const compressedFile = await JdrApp.utils.compressImage(file, 800, 0.8);
        const imageUrl = await JdrApp.utils.uploadToImageBB(compressedFile);
        
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