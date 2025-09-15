// ============================================================================
// JDR-BAB APPLICATION - GM OBJECT FILTERS MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // GM OBJECT FILTERS - SEPARATE FILTER SYSTEM FOR GM OBJECT PAGE
  // ========================================
  window.GMObjectFilters = {
    _initialized: false,

    /**
     * Initialize GM object filters
     */
    init() {
      if (this._initialized) {
        return;
      }
      this.setupEventListeners();
      this._initialized = true;
    },

    /**
     * Setup event listeners for GM object filters
     */
    setupEventListeners() {
      // GM filter chips
      document.addEventListener('click', (e) => {
        if (e.target.matches('.gm-filter-chip')) {
          e.preventDefault();
          e.stopPropagation();
          this.toggleGMObjectTag(e.target.dataset.tag);
        }
      });
    },

    /**
     * Toggle a GM object tag filter
     */
    toggleGMObjectTag(tagName) {
      
      if (!window.ACTIVE_GM_OBJECT_TAGS) {
        window.ACTIVE_GM_OBJECT_TAGS = [];
      }

      const activeTags = window.ACTIVE_GM_OBJECT_TAGS;
      const tagIndex = activeTags.indexOf(tagName);

      if (tagIndex === -1) {
        // Add tag
        activeTags.push(tagName);
      } else {
        // Remove tag
        activeTags.splice(tagIndex, 1);
      }
      
      // Regenerate the GM objects page with new filters
      this.regenerateGMObjectsPage(tagName);
    },

    /**
     * Update the visual display of GM filter chips
     */
    updateGMFilterChipsDisplay() {
      // This method is now not needed as the page regeneration will
      // handle the correct display state automatically via PageBuilder
    },

    /**
     * Regenerate the GM objects page
     */
    regenerateGMObjectsPage(clickedTag = null) {
      // Check if we're on the GM objects page
      const currentPage = window.location.hash.replace('#/', '') || 'creation';
      if (currentPage !== 'gestion-objets') {
        return;
      }

      // Prevent multiple simultaneous regenerations
      if (this._regenerating) {
        return;
      }

      this._regenerating = true;

      // Force regeneration of the page using the router
      if (JdrApp.modules.router?.renderGMObjectsPage) {
        JdrApp.modules.router.renderGMObjectsPage();
        
        // Reset the regeneration flag immediately after DOM update
        this._regenerating = false;
        
        // Reapply images after filtering
        setTimeout(() => {
          if (JdrApp.modules.renderer && JdrApp.modules.renderer.autoLoadImages) {
            JdrApp.modules.renderer.autoLoadImages();
          }
        }, 100);
      } else {
        this._regenerating = false;
      }
    },

    /**
     * Clear all GM object filters
     */
    clearAllGMObjectFilters() {
      window.ACTIVE_GM_OBJECT_TAGS = [];
      this.regenerateGMObjectsPage();
    },

    /**
     * Get currently active GM object tags
     */
    getActiveGMObjectTags() {
      return window.ACTIVE_GM_OBJECT_TAGS || [];
    }
  };

  // Module is now initialized by UICore

})();