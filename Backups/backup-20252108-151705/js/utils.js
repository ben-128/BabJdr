// ============================================================================
// JDR-BAB APPLICATION - UTILITIES MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // DEV MODE UTILITIES
  // ========================================
  JdrApp.utils.isDevMode = function() {
    // Simple check - if it's standalone, dev mode is always false
    if (window.STANDALONE_VERSION) return false;
    
    // Check body class which is set by the editor
    return document.body.classList.contains('dev-on');
  };

  // ========================================
  // CENTRALIZED EVENT MANAGEMENT
  // ========================================
  JdrApp.utils.events = {
    listeners: new Map(),
    
    // Centralized event registration
    register(type, selector, handler, options = {}) {
      const key = `${type}-${selector || 'window'}-${Date.now()}`;
      const wrapper = (e) => {
        if (!selector) {
          handler(e);
        } else {
          // Gérer les sélecteurs spéciaux comme [class$="-add"]
          if (this.matchesSelector(e.target, selector)) {
            handler(e);
          }
        }
      };
      
      if (selector) {
        document.addEventListener(type, wrapper, options);
      } else {
        window.addEventListener(type, wrapper, options);
      }
      
      this.listeners.set(key, { type, wrapper, options });
      return key;
    },

    // Helper pour matcher les sélecteurs complexes
    matchesSelector(element, selector) {
      // Gérer les sélecteurs d'attributs comme [class$="-add"]
      if (selector.startsWith('[class$="') && selector.endsWith('"]')) {
        const suffix = selector.slice(9, -2); // Extraire "-add" de '[class$="-add"]'
        return element.className && element.className.split(' ').some(cls => cls.endsWith(suffix));
      }
      
      // Gérer les sélecteurs d'attributs comme [class*="something"]
      if (selector.startsWith('[class*="') && selector.endsWith('"]')) {
        const substring = selector.slice(9, -2); // Extraire "something" 
        return element.className && element.className.includes(substring);
      }
      
      // Utiliser la méthode native pour les autres sélecteurs
      try {
        return element.matches(selector) || element.closest(selector);
      } catch (e) {
        // Fallback pour les sélecteurs invalides
        return false;
      }
    },
    
    // Delayed execution manager
    delayed: new Map(),
    timeout(key, fn, delay = 0) {
      if (this.delayed.has(key)) {
        clearTimeout(this.delayed.get(key));
      }
      const id = setTimeout(() => {
        fn();
        this.delayed.delete(key);
      }, delay);
      this.delayed.set(key, id);
    },
    
    // Common event handlers
    onDOMReady(fn) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
      } else {
        fn();
      }
    },
    
    onHashChange(fn) {
      window.addEventListener('hashchange', fn);
    },
    
    onRouteChange(fn) {
      this.onHashChange(() => this.timeout('route-change', fn, 0));
      this.onDOMReady(() => this.timeout('dom-ready-route', fn, 0));
    }
  };

  // ========================================
  // DOM UTILITIES LIBRARY
  // ========================================
  JdrApp.utils.dom = {
    // Common selectors
    $(selector) { return document.querySelector(selector); },
    $$(selector) { return document.querySelectorAll(selector); },
    
    // Element creation with common patterns
    create(tag, className = '', innerHTML = '', attributes = {}) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (innerHTML) el.innerHTML = innerHTML;
      Object.entries(attributes).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
      return el;
    },
    
    
    // Safe innerHTML replacement
    safeSetHTML(element, html) {
      if (element) {
        element.innerHTML = html;
      }
    },
    
    // Safe text content setting
    safeSetText(element, text) {
      if (element) {
        element.textContent = text;
      }
    },
    
    // Toggle class utility
    toggleClass(element, className, force = null) {
      if (element) {
        if (force !== null) {
          element.classList.toggle(className, force);
        } else {
          element.classList.toggle(className);
        }
      }
    },
    
    // Show/hide utilities
    show(element, display = 'block') {
      if (element) {
        element.style.display = display;
      }
    },
    
    hide(element) {
      if (element) {
        element.style.display = 'none';
      }
    }
  };

  // ========================================
  // DATA UTILITIES
  // ========================================
  JdrApp.utils.data = {
    // Find spell by name across all categories
    findSpell(name) {
      if (!window.SORTS) return null;
      
      for (const category of window.SORTS) {
        const spell = category.sorts.find(s => s.nom === name);
        if (spell) return { spell, category: category.nom };
      }
      return null;
    },
    
    // Find class by name
    findClass(name) {
      if (!window.CLASSES) return null;
      return window.CLASSES.find(c => c.nom === name);
    },
    
    // Find don by name across all categories
    findDon(name) {
      if (!window.DONS) return null;
      
      for (const category of window.DONS) {
        const don = category.dons.find(d => d.nom === name);
        if (don) return { don, category: category.nom };
      }
      return null;
    },
    
    // Get spell category by name
    getSpellCategory(categoryName) {
      if (!window.SORTS) return null;
      return window.SORTS.find(cat => cat.nom === categoryName);
    },
    
    // Get don category by name
    getDonCategory(categoryName) {
      if (!window.DONS) return null;
      return window.DONS.find(cat => cat.nom === categoryName);
    },
    
    // Deep clone object
    deepClone(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    
    // Sanitize string for use as identifier
    sanitizeId(str) {
      return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    },
    
    // Generate unique ID
    generateId(prefix = 'id') {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Escape HTML
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // ========================================
  // IMAGE UTILITIES
  // ========================================
  
  // Compress image function
  JdrApp.utils.compressImage = function(file, maxWidth = 800, quality = 0.85) {
    return new Promise((resolve, reject) => {
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = function() {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Detect if image has transparency (PNG)
        const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        
        if (isPNG) {
          // For PNG, don't compress at all to preserve quality
          resolve(file);
        } else {
          // For JPEG/other formats, use white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', quality);
        }
      };
      
      img.onerror = (error) => {
        reject(error);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload to ImageBB function
  JdrApp.utils.uploadToImageBB = function(file) {
    return new Promise((resolve, reject) => {
      // ImageBB API key
      const API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';
      
      const formData = new FormData();
      formData.append('image', file);
      
      fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: 'POST',
        body: formData
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        if (data.success) {
          resolve(data.data.url);
        } else {
          throw new Error('Upload failed: ' + (data.error ? data.error.message : 'Unknown error'));
        }
      })
      .catch(error => {
        // Fallback to local storage
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
  };

})();