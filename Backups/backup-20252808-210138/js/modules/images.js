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
    
    async init() {
      await this.loadImageData();
      this.initImageHandlers();
      
      // Auto-sync monster images on startup to ensure consistency
      setTimeout(() => {
        this.ensureMonsterImageMappings();
      }, 1000);
    },

    // Load image data from JSON file or embedded data
    async loadImageData() {
      try {
        if (window.IMAGES) {
          this.imageStore = window.IMAGES.images || window.IMAGES || {};
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
      
      // Show remove button if it exists
      const removeBtn = illusElement.querySelector('.rm');
      if (removeBtn) {
        removeBtn.style.display = 'inline-flex';
      }

    },

    // Process image URL to handle proxying for mobile compatibility
    processImageUrl(originalUrl) {
      // If it's an i.ibb.co URL, use proxy for better mobile compatibility
      if (originalUrl.includes('i.ibb.co') && !originalUrl.includes('images.weserv.nl')) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}`;
      }
      
      // For local monster paths, encode only the filename to handle French characters properly
      if (originalUrl.startsWith('data/images/Monstres/')) {
        const pathParts = originalUrl.split('/');
        const filename = pathParts[pathParts.length - 1];
        const pathWithoutFilename = pathParts.slice(0, -1).join('/');
        return `${pathWithoutFilename}/${encodeURIComponent(filename)}`;
      }
      
      return originalUrl;
    },

    autoLoadImages() {
      const illusElements = document.querySelectorAll('[data-illus-key]');
      let loadedCount = 0;

      illusElements.forEach(illusElement => {
        const illusKey = illusElement.dataset.illusKey;
        const imageUrl = this.getImageUrl(illusKey);
        
        if (imageUrl) {
          this.applyImage(illusElement, imageUrl);
          loadedCount++;
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
            console.log(`📷 Auto-synced image for monster: ${monster.nom}`);
          }
        }
        
        // Also validate that the image file exists
        this.validateMonsterImagePath(monster);
      });

      if (hasUpdates) {
        console.log('✅ Auto-synced monster image mappings');
      }
    },

    // Validate and fix monster image paths
    validateMonsterImagePath(monster) {
      if (!monster.image || !monster.nom) {
        return false;
      }

      // Extract filename from current path
      const currentPath = monster.image;
      const filename = currentPath.split('/').pop();
      
      // Check if path follows correct format
      const expectedPattern = /^data\/images\/Monstres\/foret\/Monstre_Forêt_\w+\.png$/;
      
      if (!expectedPattern.test(currentPath)) {
        // Try to fix common issues
        let correctedPath = null;
        
        // Map common filename patterns to correct paths
        const filenameMap = {
          'araignee-geante.png': 'Monstre_Forêt_Araignée.png',
          'crabe-des-bois.png': 'Monstre_Forêt_Crab.png',  
          'groink.png': 'Monstre_Forêt_Groink.png',
          'groink-chaman.png': 'Monstre_Forêt_Groink_Chaman.png',
          'guepe-geante.png': 'Monstre_Forêt_GuepeGeante.png',
          'ours-des-bois.png': 'Monstre_Forêt_Ours.png'
        };

        if (filenameMap[filename]) {
          correctedPath = `data/images/Monstres/foret/${filenameMap[filename]}`;
        } else if (!filename.startsWith('Monstre_Forêt_')) {
          // Try to construct path from monster name
          const safeName = monster.nom.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ_]/g, '');
          correctedPath = `data/images/Monstres/foret/Monstre_Forêt_${safeName}.png`;
        }

        if (correctedPath && correctedPath !== currentPath) {
          console.log(`🔧 Auto-correcting image path for ${monster.nom}:`);
          console.log(`   From: ${currentPath}`);
          console.log(`   To: ${correctedPath}`);
          
          // Update monster data
          monster.image = correctedPath;
          
          // Update image mapping
          const imageKey = `monster:${monster.nom}`;
          this.imageStore[imageKey] = correctedPath;
          
          return true;
        }
      }
      
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
    }
  };

})();