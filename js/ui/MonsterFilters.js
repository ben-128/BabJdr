// ============================================================================
// JDR-BAB APPLICATION - MONSTER FILTERS MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // MONSTER FILTERS - SEPARATE FILTER SYSTEM FOR MONSTERS PAGE
  // ========================================
  window.MonsterFilters = {
    _initialized: false,

    /**
     * Initialize monster filters
     */
    init() {
      if (this._initialized) {
        return;
      }
      this.initializeFilterState();
      this.setupEventListeners();
      this._initialized = true;
    },

    /**
     * Initialize the filter state if it doesn't exist
     */
    initializeFilterState() {
      if (!window.MONSTRES_FILTER_STATE) {
        const config = window.ContentTypes?.monster;
        const defaultTags = config?.filterConfig?.defaultVisibleTags || ['Forêt'];
        window.MONSTRES_FILTER_STATE = {
          visibleTags: [...defaultTags]
        };
      }
    },

    /**
     * Setup event listeners for monster filters
     */
    setupEventListeners() {
      // Monster filter chips
      document.addEventListener('click', (e) => {
        if (e.target.matches('.monster-filter-chip')) {
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
      
      // Ensure filter state exists (should already be initialized)
      this.initializeFilterState();

      const visibleTags = window.MONSTRES_FILTER_STATE.visibleTags;
      const tagIndex = visibleTags.indexOf(tagName);
      let isNowActive;

      if (tagIndex === -1) {
        // Add tag
        visibleTags.push(tagName);
        isNowActive = true;
      } else {
        // Remove tag
        visibleTags.splice(tagIndex, 1);
        isNowActive = false;
      }


      // Show notification about filter change
      this.showFilterNotification(tagName, isNowActive, visibleTags.length);

      // Regenerate the monsters page with new filters
      this.regenerateMonstersPage();
    },

    /**
     * Update the visual state of a specific button immediately for better UX
     */
    updateButtonVisualState(tagName, isActive) {
      const button = document.querySelector(`[data-tag="${tagName}"]`);
      if (button) {
        const bgColor = isActive ? '#16a34a' : '#6b7280';
        const opacity = isActive ? '1' : '0.6';
        const prefix = isActive ? '✓ ' : '';
        const title = isActive ? 'Cliquez pour désactiver' : 'Cliquez pour activer';
        
        button.style.background = bgColor;
        button.style.opacity = opacity;
        button.textContent = `${prefix}${tagName}`;
        button.title = title;
      }
    },

    /**
     * Show a notification about filter changes
     */
    showFilterNotification(tagName, isActive, totalActiveTags) {
      const action = isActive ? 'activé' : 'désactivé';
      const message = totalActiveTags === 0 
        ? `❌ Filtre "${tagName}" ${action} - Aucun monstre visible` 
        : `🔄 Filtre "${tagName}" ${action} - ${totalActiveTags} filtre(s) actif(s)`;
      
      // Try to use the app's notification system if available
      if (JdrApp.modules.storage && JdrApp.modules.storage.showNotification) {
        JdrApp.modules.storage.showNotification(message, 'info');
      }
    },

    /**
     * Update the visual display of monster filter chips (legacy method)
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

      // Prevent multiple simultaneous regenerations
      if (this._regenerating) {
        return;
      }

      this._regenerating = true;
      
      // Force regeneration of the page using the router
      if (JdrApp.modules.router?.renderMonstersPage) {
        JdrApp.modules.router.renderMonstersPage();
        
        // Reset the regeneration flag immediately after DOM update
        this._regenerating = false;
        
        // Also force the router to show and activate the page
        if (JdrApp.modules.router?.show) {
          JdrApp.modules.router.show('monstres');
        }
        if (JdrApp.modules.router?.updateActiveStates) {
          JdrApp.modules.router.updateActiveStates('monstres');
        }
      } else {
        this._regenerating = false;
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