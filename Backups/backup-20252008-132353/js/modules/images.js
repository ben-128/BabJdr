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
      
    },

    // Manually add/update an image
    setImage(illusKey, imageUrl) {
      this.imageStore[illusKey] = imageUrl;
      
      // Apply to any existing elements with this key
      const illusElements = document.querySelectorAll(`[data-illus-key="${illusKey}"]`);
      illusElements.forEach(element => {
        this.applyImage(element, imageUrl);
      });
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
    }
  };

})();