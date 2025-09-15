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
        if (e.target.matches('.filter-chip') && window.location.hash === '#/monstres') {
          e.preventDefault();
          e.stopPropagation();
          this.toggleMonsterTag(e.target.dataset.tag);
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

      // Update visual state of filter chips
      this.updateMonsterFilterChipsDisplay();

      // Regenerate the monsters page with new filters
      this.regenerateMonstersPage();
    },

    /**
     * Update the visual display of monster filter chips
     */
    updateMonsterFilterChipsDisplay() {
      const visibleTags = window.MONSTRES_FILTER_STATE?.visibleTags || [];
      
      document.querySelectorAll('.filter-chip[data-tag]').forEach(chip => {
        const tag = chip.dataset.tag;
        const isActive = visibleTags.includes(tag);
        
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
     * Regenerate the monsters page
     */
    regenerateMonstersPage() {
      // Check if we're on the monsters page
      if (window.location.hash !== '#/monstres') {
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
      
      this.updateMonsterFilterChipsDisplay();
      this.regenerateMonstersPage();
    },

    /**
     * Get currently visible monster tags
     */
    getVisibleMonsterTags() {
      return window.MONSTRES_FILTER_STATE?.visibleTags || [];
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      MonsterFilters.init();
    });
  } else {
    MonsterFilters.init();
  }

})();