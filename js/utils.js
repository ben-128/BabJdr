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
    
    // Use the editor's actual state instead of CSS classes for reliability
    if (JdrApp.modules && JdrApp.modules.editor) {
      return JdrApp.modules.editor.isDevMode;
    }
    
    // Fallback: check body class if editor not available yet
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
  
  // Compress image function - compresses before upload to ImgBB
  JdrApp.utils.compressImage = function(file, options = {}) {
    const {
      maxWidth = 1200,      // Max width (preserves aspect ratio)
      maxHeight = 1200,     // Max height (preserves aspect ratio)
      jpegQuality = 0.82,   // JPEG quality (0-1)
      pngQuality = 0.85,    // PNG quality approximation via resize
      maxSizeKB = 500       // Target max size in KB (will reduce quality if exceeded)
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = function() {
        // Calculate new dimensions (fit within maxWidth x maxHeight)
        let { width, height } = img;
        const originalWidth = width;
        const originalHeight = height;

        // Scale down if exceeds max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratioW = maxWidth / width;
          const ratioH = maxHeight / height;
          const ratio = Math.min(ratioW, ratioH);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Detect if image has transparency
        const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const isGIF = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

        // For GIF, don't process (could lose animation)
        if (isGIF) {
          resolve(file);
          return;
        }

        // Check for transparency in PNG
        let hasTransparency = false;
        if (isPNG) {
          // Draw image to check for transparency
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 3; i < data.length; i += 4) {
              if (data[i] < 255) {
                hasTransparency = true;
                break;
              }
            }
          } catch (e) {
            // Security error, assume no transparency
          }
        }

        // Choose output format
        let outputFormat, quality;
        if (isPNG && hasTransparency) {
          // Keep as PNG for transparency
          outputFormat = 'image/png';
          quality = undefined; // PNG doesn't use quality param
        } else {
          // Convert to JPEG for better compression
          outputFormat = 'image/jpeg';
          quality = jpegQuality;
          // Fill with white background for JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        // If PNG without transparency, redraw for JPEG
        if (!isPNG || !hasTransparency) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Compress with quality adjustment if needed
        const tryCompress = (currentQuality) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const sizeKB = blob.size / 1024;

            // If still too large and we can reduce quality, try again
            if (sizeKB > maxSizeKB && outputFormat === 'image/jpeg' && currentQuality > 0.5) {
              tryCompress(currentQuality - 0.1);
            } else {
              // Log compression results
              const originalSizeKB = file.size / 1024;
              const savings = ((1 - blob.size / file.size) * 100).toFixed(1);
              console.log(`[Compression] ${file.name}: ${originalSizeKB.toFixed(0)}KB → ${sizeKB.toFixed(0)}KB (${savings}% saved)`);

              // Return compressed blob with original filename
              const compressedFile = new File([blob], file.name, { type: outputFormat });
              resolve(compressedFile);
            }
          }, outputFormat, currentQuality);
        };

        tryCompress(quality);
      };

      img.onerror = (error) => {
        console.warn('[Compression] Failed to load image, using original:', error);
        resolve(file);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Upload to ImageBB function - automatically compresses before upload
  JdrApp.utils.uploadToImageBB = async function(file, options = {}) {
    const {
      skipCompression = false,  // Set to true to skip compression
      compressionOptions = {}   // Options for compressImage
    } = options;

    // ImageBB API key
    const API_KEY = '06a98f5c0c2dad952e6ab94b03040f36';

    try {
      // Compress image before upload (unless skipped)
      let fileToUpload = file;
      if (!skipCompression) {
        console.log(`[Upload] Compressing ${file.name} before upload...`);
        fileToUpload = await JdrApp.utils.compressImage(file, compressionOptions);
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', fileToUpload);

      // Upload to ImgBB
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        console.log(`[Upload] Success: ${data.data.url}`);
        return data.data.url;
      } else {
        throw new Error('Upload failed: ' + (data.error ? data.error.message : 'Unknown error'));
      }
    } catch (error) {
      console.error('[Upload] ImgBB upload failed:', error.message);
      // NEVER fallback to base64 - it bloats the JSON files and causes performance issues
      throw new Error('Image upload failed: ' + error.message + '. Please try again later.');
    }
  };

  // ========================================
  // PERFORMANCE OPTIMIZATION UTILITIES
  // ========================================
  
  // Minify HTML to reduce size (for performance optimization)
  JdrApp.utils.minifyHTML = function(html) {
    if (!html || typeof html !== 'string') return html;
    
    return html
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove extra whitespace between tags
      .replace(/>\s+</g, '><')
      // Remove whitespace at start and end of lines
      .replace(/^\s+|\s+$/gm, '')
      // Remove empty lines
      .replace(/\n\s*\n/g, '\n')
      // Trim the result
      .trim();
  };

  // Debounce function for performance
  JdrApp.utils.debounce = function(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  };

  // Throttle function for performance
  JdrApp.utils.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

})();