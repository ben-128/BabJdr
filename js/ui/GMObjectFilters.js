// ============================================================================
// JDR-BAB APPLICATION - GM OBJECT FILTERS MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // GM OBJECT FILTERS - SEPARATE FILTER SYSTEM FOR GM OBJECT PAGE
  // ========================================
  window.GMObjectFilters = {

    /**
     * Initialize GM object filters
     */
    init() {
      this.setupEventListeners();
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

      // Update visual state of filter chips
      this.updateGMFilterChipsDisplay();

      // Regenerate the GM objects page with new filters
      this.regenerateGMObjectsPage();
    },

    /**
     * Update the visual display of GM filter chips
     */
    updateGMFilterChipsDisplay() {
      const activeTags = window.ACTIVE_GM_OBJECT_TAGS || [];
      
      document.querySelectorAll('.gm-filter-chip').forEach(chip => {
        const tag = chip.dataset.tag;
        const isActive = activeTags.includes(tag);
        
        if (isActive) {
          chip.style.background = '#16a34a';
          chip.style.opacity = '1';
          chip.textContent = `✓ ${tag}`;
        } else {
          chip.style.background = '#6b7280';
          chip.style.opacity = '0.6';
          chip.textContent = tag;
        }
      });
    },

    /**
     * Regenerate the GM objects page
     */
    regenerateGMObjectsPage() {
      // Check if we're on the GM objects page
      if (window.location.hash !== '#/gestion-objets') {
        return;
      }

      // Force regeneration of the page
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
    },

    /**
     * Clear all GM object filters
     */
    clearAllGMObjectFilters() {
      window.ACTIVE_GM_OBJECT_TAGS = [];
      this.updateGMFilterChipsDisplay();
      this.regenerateGMObjectsPage();
    },

    /**
     * Get currently active GM object tags
     */
    getActiveGMObjectTags() {
      return window.ACTIVE_GM_OBJECT_TAGS || [];
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      GMObjectFilters.init();
    });
  } else {
    GMObjectFilters.init();
  }

})();