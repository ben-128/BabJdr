// ============================================================================
// JDR-BAB APPLICATION - MONSTER FILTERS MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // MONSTER FILTERS - SEPARATE FILTER SYSTEM FOR MONSTERS PAGE
  // ========================================
  window.MonsterFilters = {

    /**
     * Initialize monster filters
     */
    init() {
      this.setupEventListeners();
    },

    /**
     * Setup event listeners for monster filters
     */
    setupEventListeners() {
      // Monster filter chips
      document.addEventListener('click', (e) => {
        if (e.target.matches('.filter-chip')) {
          // Check if we're on the monsters page
          const currentPage = window.location.hash.replace('#/', '') || 'creation';
          if (currentPage === 'monstres') {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMonsterTag(e.target.dataset.tag);
          }
        }
      });
    },

    /**
     * Toggle a monster tag filter
     */
    toggleMonsterTag(tagName) {
      // Initialize filter state if not exists
      if (!window.MONSTRES_FILTER_STATE) {
        const config = window.ContentTypes?.monster;
        const defaultTags = config?.filterConfig?.defaultVisibleTags || ['Forêt'];
        window.MONSTRES_FILTER_STATE = {
          visibleTags: [...defaultTags]
        };
      }

      const visibleTags = window.MONSTRES_FILTER_STATE.visibleTags;
      const tagIndex = visibleTags.indexOf(tagName);

      if (tagIndex === -1) {
        // Add tag
        visibleTags.push(tagName);
      } else {
        // Remove tag
        visibleTags.splice(tagIndex, 1);
      }

      // Regenerate the monsters page with new filters
      this.regenerateMonstersPage();
    },

    /**
     * Update the visual display of monster filter chips
     */
    updateMonsterFilterChipsDisplay() {
      // This method is now not needed as the page regeneration will
      // handle the correct display state automatically via PageBuilder
    },

    /**
     * Regenerate the monsters page
     */
    regenerateMonstersPage() {
      // Check if we're on the monsters page
      const currentPage = window.location.hash.replace('#/', '') || 'creation';
      if (currentPage !== 'monstres') {
        return;
      }

      // Force regeneration of the page
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
    },

    /**
     * Clear all monster filters
     */
    clearAllMonsterFilters() {
      const config = window.ContentTypes?.monster;
      const defaultTags = config?.filterConfig?.defaultVisibleTags || ['Forêt'];
      
      window.MONSTRES_FILTER_STATE = {
        visibleTags: [...defaultTags]
      };
      
      this.regenerateMonstersPage();
    },

    /**
     * Get currently visible monster tags
     */
    getVisibleMonsterTags() {
      return window.MONSTRES_FILTER_STATE?.visibleTags || [];
    }
  };

  // Module is now initialized by UICore

})();