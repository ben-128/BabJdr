// ============================================================================
// JDR-BAB APPLICATION - SCROLL OPTIMIZER
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // SCROLL PERFORMANCE OPTIMIZER MODULE
  // ========================================
  window.ScrollOptimizer = {
    _initialized: false,
    _observers: new Map(),
    _virtualizationEnabled: false,
    _visibleCards: new Set(),
    _scrollTimeout: null,
    _lastScrollTime: 0,

    init() {
      if (this._initialized) return;
      
      this.setupScrollOptimizations();
      this.initializeVirtualization();
      this.optimizeExistingContent();
      
      this._initialized = true;
      console.log('🚀 ScrollOptimizer initialized');
    },

    // Configure scroll event optimizations
    setupScrollOptimizations() {
      // Debounced scroll handler for expensive operations
      const debouncedScrollHandler = this.debounce(() => {
        this.updateVisibleCards();
        this.triggerLazyLoading();
      }, 100);

      // Throttled scroll handler for smooth operations
      const throttledScrollHandler = this.throttle(() => {
        this.handleSmoothScrollEffects();
      }, 16); // ~60fps

      // Add passive scroll listeners
      window.addEventListener('scroll', throttledScrollHandler, { passive: true });
      window.addEventListener('scroll', debouncedScrollHandler, { passive: true });
      
      // Optimize resize events
      window.addEventListener('resize', this.debounce(() => {
        this.recalculateViewport();
        this.updateVisibleCards();
      }, 250), { passive: true });
    },

    // Initialize virtual scrolling for long lists
    initializeVirtualization() {
      // Enable for pages with many cards (>20)
      this.observePageChanges();
    },

    // Observe page changes to apply optimizations
    observePageChanges() {
      if (!('MutationObserver' in window)) return;

      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.optimizeNewContent(node);
              }
            });
          }
        });
      });

      observer.observe(document.getElementById('views') || document.body, {
        childList: true,
        subtree: true
      });

      this._observers.set('pageChanges', observer);
    },

    // Optimize newly added content
    optimizeNewContent(element) {
      // Only optimize content in active articles
      const activeArticle = element.closest('article.active') || element.querySelector('article.active');
      if (!activeArticle && !element.matches('article.active')) {
        return; // Skip optimization for inactive articles
      }
      
      // Skip optimization for collections pages and filtered content
      const targetElement = activeArticle || element;
      if (targetElement.id === 'collections-objets' || 
          targetElement.querySelector('#collection-results') ||
          targetElement.querySelector('.objects-tag-display')) {
        return; // Skip collections and filtered object pages
      }
      
      const cards = targetElement.querySelectorAll('.card:not([style*="display: none"]), .spell-card:not([style*="display: none"]), .item-card:not([style*="display: none"])');
      const subclassSections = targetElement.querySelectorAll('.editable-section[data-section-type="subclass"]');
      
      // Removed console.log for better performance
      
      // Special handling for class pages with subclass sections
      if (subclassSections.length > 5) {
        this.optimizeClassPage(targetElement, subclassSections);
      } else if (cards.length > 15) {
        this.enableVirtualization(targetElement, cards);
      } else {
        this.applyBasicOptimizations(cards);
      }
    },

    // Optimize class pages with many subclasses
    optimizeClassPage(container, subclassSections) {
      // Removed console.log for better performance
      
      // Use progressive loading for subclasses
      subclassSections.forEach((section, index) => {
        if (index > 3) { // Keep first 4 visible
          this.deferSubclassRendering(section, index);
        } else {
          this.optimizeSubclassSection(section);
        }
      });
      
      // Add scroll-triggered loading for deferred sections
      this.setupProgressiveLoading(container, subclassSections);
    },

    // Defer rendering of subclass sections
    deferSubclassRendering(section, index) {
      section.style.cssText = `
        content-visibility: auto;
        contain-intrinsic-size: 0 400px;
        contain: layout style paint;
        opacity: 0.8;
        transform: translateZ(0);
      `;
      
      // Add loading indicator for deferred sections
      section.setAttribute('data-loading-state', 'deferred');
      section.setAttribute('data-section-index', index);
    },

    // Optimize individual subclass sections
    optimizeSubclassSection(section) {
      // Optimize images within subclass
      const images = section.querySelectorAll('img');
      images.forEach(img => {
        this.optimizeImage(img);
      });
      
      // Optimize large text content
      const textElements = section.querySelectorAll('[data-edit-type="generic"]');
      textElements.forEach(element => {
        if (element.textContent.length > 500) {
          element.style.contain = 'layout style';
        }
      });
    },

    // Setup progressive loading for class pages
    setupProgressiveLoading(container, sections) {
      if (!('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const section = entry.target;
            const loadingState = section.getAttribute('data-loading-state');
            
            if (loadingState === 'deferred') {
              this.fullyLoadSubclassSection(section);
              observer.unobserve(section);
            }
          }
        });
      }, {
        rootMargin: '100px 0px', // Start loading 100px before visible
        threshold: 0.1
      });

      // Observe deferred sections
      sections.forEach(section => {
        if (section.getAttribute('data-loading-state') === 'deferred') {
          observer.observe(section);
        }
      });

      this._observers.set('classPageLoader', observer);
    },

    // Fully load a deferred subclass section
    fullyLoadSubclassSection(section) {
      // Remove deferral styles
      section.style.cssText = `
        opacity: 1;
        transform: none;
        transition: opacity 0.3s ease;
      `;
      
      section.setAttribute('data-loading-state', 'loaded');
      
      // Optimize the newly loaded content
      this.optimizeSubclassSection(section);
      
      // Ensure images are loaded
      if (JdrApp.modules.images) {
        JdrApp.modules.images.autoLoadImages();
      }
    },

    // Optimize individual images
    optimizeImage(img) {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      
      // Add size hints for layout stability
      if (!img.style.aspectRatio && img.width && img.height) {
        img.style.aspectRatio = `${img.width} / ${img.height}`;
      }
    },

    // Enable virtual scrolling for large lists
    enableVirtualization(container, cards) {
      this._virtualizationEnabled = true;
      
      // Create viewport container
      const viewport = document.createElement('div');
      viewport.className = 'virtualized-viewport';
      viewport.style.cssText = `
        height: 70vh;
        overflow-y: auto;
        position: relative;
      `;

      // Create content container
      const content = document.createElement('div');
      content.className = 'virtualized-content';
      content.style.position = 'relative';

      // Calculate total height and item height
      const itemHeight = this.calculateItemHeight(cards[0]);
      const totalHeight = cards.length * itemHeight;
      content.style.height = `${totalHeight}px`;

      // Set up virtual scrolling
      this.setupVirtualScroll(viewport, content, Array.from(cards), itemHeight);

      // Replace original content
      const parent = container.parentNode;
      parent.insertBefore(viewport, container);
      viewport.appendChild(content);
      container.style.display = 'none';
    },

    // Setup virtual scrolling mechanics
    setupVirtualScroll(viewport, content, items, itemHeight) {
      const visibleCount = Math.ceil(viewport.clientHeight / itemHeight) + 2; // Buffer
      let startIndex = 0;

      const updateVisibleItems = () => {
        const scrollTop = viewport.scrollTop;
        const newStartIndex = Math.floor(scrollTop / itemHeight);
        
        if (newStartIndex === startIndex) return;
        
        startIndex = Math.max(0, newStartIndex);
        const endIndex = Math.min(items.length, startIndex + visibleCount);

        // Clear existing content
        content.innerHTML = '';

        // Render visible items
        for (let i = startIndex; i < endIndex; i++) {
          const item = items[i].cloneNode(true);
          item.style.cssText = `
            position: absolute;
            top: ${i * itemHeight}px;
            width: 100%;
            box-sizing: border-box;
          `;
          content.appendChild(item);
        }

        // Re-initialize lazy loading for new items
        if (JdrApp.modules.images) {
          JdrApp.modules.images.autoLoadImages();
        }
      };

      // Throttled scroll handler for virtual scrolling
      const throttledUpdate = this.throttle(updateVisibleItems, 16);
      viewport.addEventListener('scroll', throttledUpdate, { passive: true });
      
      // Initial render
      updateVisibleItems();
    },

    // Apply basic optimizations to smaller lists
    applyBasicOptimizations(cards) {
      cards.forEach((card, index) => {
        // Special handling for spell cards (more complex)
        if (card.classList.contains('spell-card')) {
          this.optimizeSpellCard(card, index);
        } else {
          // Defer non-critical rendering for other card types
          if (index > 10) {
            this.deferCardRendering(card);
          }
        }
        
        // Optimize images in all cards
        this.optimizeCardImages(card);
      });
    },

    // Optimize spell cards specifically (they're more complex)
    optimizeSpellCard(card, index) {
      // Spell cards are complex, so use more aggressive optimization
      if (index > 6) { // Show only first 7 spell cards immediately
        this.deferSpellCardRendering(card);
      } else {
        this.optimizeVisibleSpellCard(card);
      }
    },

    // Defer rendering for spell cards with intersection observer
    deferSpellCardRendering(card) {
      card.style.cssText = `
        content-visibility: auto;
        contain-intrinsic-size: 0 450px; /* Taller for spell cards */
        contain: layout style;
        opacity: 0.7;
        transform: translateZ(0);
      `;
      
      card.setAttribute('data-loading-state', 'deferred-spell');
      
      // Set up intersection observer for this specific card
      this.observeSpellCard(card);
    },

    // Optimize visible spell cards
    optimizeVisibleSpellCard(card) {
      // Optimize complex HTML structure in spell cards
      const editableFields = card.querySelectorAll('[data-edit-type="generic"]');
      editableFields.forEach(field => {
        if (field.innerHTML.length > 200) {
          field.style.contain = 'layout style';
        }
      });
      
      // Optimize hr elements (lots of them in spell cards)
      const hrs = card.querySelectorAll('hr');
      hrs.forEach(hr => {
        hr.style.contain = 'layout paint';
      });
    },

    // Observe spell cards for lazy loading
    observeSpellCard(card) {
      if (!('IntersectionObserver' in window)) {
        // Fallback: load immediately on older browsers
        this.loadSpellCard(card);
        return;
      }

      if (!this._spellCardObserver) {
        this._spellCardObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadSpellCard(entry.target);
              this._spellCardObserver.unobserve(entry.target);
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.1
        });
        
        this._observers.set('spellCards', this._spellCardObserver);
      }

      this._spellCardObserver.observe(card);
    },

    // Load a deferred spell card
    loadSpellCard(card) {
      card.style.cssText = `
        opacity: 1;
        transform: none;
        transition: opacity 0.2s ease;
      `;
      
      card.setAttribute('data-loading-state', 'loaded');
      this.optimizeVisibleSpellCard(card);
    },

    // Defer rendering of cards outside initial viewport
    deferCardRendering(card) {
      card.style.cssText = `
        content-visibility: auto;
        contain-intrinsic-size: 0 300px;
      `;
    },

    // Optimize images within cards
    optimizeCardImages(card) {
      const images = card.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
        
        // Add decode hint for better performance
        if (!img.hasAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
      });
    },

    // Update visible cards tracking
    updateVisibleCards() {
      const cards = document.querySelectorAll('.card, .spell-card, .item-card');
      const viewport = {
        top: window.scrollY,
        bottom: window.scrollY + window.innerHeight
      };

      this._visibleCards.clear();

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const absoluteBottom = absoluteTop + rect.height;

        if (absoluteBottom > viewport.top - 100 && absoluteTop < viewport.bottom + 100) {
          this._visibleCards.add(index);
          
          // Prioritize visible cards for interactions
          card.style.transform = 'translateZ(0)'; // Force GPU layer
        } else {
          // Deprioritize invisible cards
          card.style.transform = '';
        }
      });
    },

    // Handle smooth scroll effects
    handleSmoothScrollEffects() {
      this._lastScrollTime = Date.now();
      
      // Disable heavy animations during scroll
      document.body.classList.add('scrolling');
      
      clearTimeout(this._scrollTimeout);
      this._scrollTimeout = setTimeout(() => {
        document.body.classList.remove('scrolling');
      }, 150);
    },

    // Trigger lazy loading for visible area
    triggerLazyLoading() {
      if (JdrApp.modules.images && JdrApp.modules.images.autoLoadImages) {
        JdrApp.modules.images.autoLoadImages();
      }
    },

    // Recalculate viewport dimensions
    recalculateViewport() {
      // Update any cached viewport dimensions
      this._viewportHeight = window.innerHeight;
      this._viewportWidth = window.innerWidth;
    },

    // Calculate item height for virtualization
    calculateItemHeight(sampleItem) {
      if (!sampleItem) return 200; // Default height
      
      const rect = sampleItem.getBoundingClientRect();
      return rect.height || 200;
    },

    // Optimize existing content on page
    optimizeExistingContent() {
      const existingCards = document.querySelectorAll('.card, .spell-card, .item-card');
      
      if (existingCards.length > 0) {
        this.optimizeNewContent(document.getElementById('views') || document.body);
      }
    },

    // Utility: Debounce function
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Utility: Throttle function
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      }
    },

    // Clean up optimizations
    cleanup() {
      this._observers.forEach(observer => observer.disconnect());
      this._observers.clear();
      
      clearTimeout(this._scrollTimeout);
      
      this._initialized = false;
    }
  };

})();