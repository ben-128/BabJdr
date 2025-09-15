// ============================================================================
// JDR-BAB APPLICATION - TABLE TRESOR FILTERS MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // TABLE TRESOR FILTERS - SEPARATE FILTER SYSTEM FOR TABLES TRESOR PAGE
  // ========================================
  window.TableTresorFilters = {
    _initialized: false,

    /**
     * Initialize table tresor filters
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
      if (!window.TABLES_TRESORS_FILTER_STATE) {
        const config = window.ContentTypes?.tableTresor;
        const defaultTags = config?.filterConfig?.defaultVisibleTags || [];
        window.TABLES_TRESORS_FILTER_STATE = {
          visibleTags: [...defaultTags]
        };
      }
    },

    /**
     * Setup event listeners for table tresor filters
     */
    setupEventListeners() {
      // Table tresor filter chips
      document.addEventListener('click', (e) => {
        if (e.target.matches('.tresor-filter-chip')) {
          e.preventDefault();
          e.stopPropagation();
          this.toggleTableTresorTag(e.target.dataset.tag);
        }
      });
    },

    /**
     * Toggle a table tresor tag filter
     */
    toggleTableTresorTag(tagName) {
      
      // Ensure filter state exists (should already be initialized)
      this.initializeFilterState();

      const visibleTags = window.TABLES_TRESORS_FILTER_STATE.visibleTags;
      const tagIndex = visibleTags.indexOf(tagName);

      if (tagIndex === -1) {
        // Add tag
        visibleTags.push(tagName);
      } else {
        // Remove tag
        visibleTags.splice(tagIndex, 1);
      }

      // Regenerate the tables tresor page with new filters
      this.regenerateTablesTresorPage();
    },

    /**
     * Update the visual display of table tresor filter chips
     */
    updateTableTresorFilterChipsDisplay() {
      const visibleTags = window.TABLES_TRESORS_FILTER_STATE?.visibleTags || [];
      
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
     * Regenerate the tables tresor page
     */
    regenerateTablesTresorPage() {
      // Check if we're on the tables tresor page
      const currentPage = window.location.hash.replace('#/', '') || 'creation';
      if (currentPage !== 'tables-tresors') {
        return;
      }

      // Force regeneration of the page using the router (like MonsterFilters)
      if (JdrApp.modules.router?.renderTablesTresorsPage) {
        JdrApp.modules.router.renderTablesTresorsPage();
      } else if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
    },

    /**
     * Clear all table tresor filters
     */
    clearAllTableTresorFilters() {
      const config = window.ContentTypes?.tableTresor;
      const defaultTags = config?.filterConfig?.defaultVisibleTags || [];
      
      window.TABLES_TRESORS_FILTER_STATE = {
        visibleTags: [...defaultTags]
      };
      
      this.updateTableTresorFilterChipsDisplay();
      this.regenerateTablesTresorPage();
    },

    /**
     * Get currently visible table tresor tags
     */
    getVisibleTableTresorTags() {
      return window.TABLES_TRESORS_FILTER_STATE?.visibleTags || [];
    }
  };

  // Module is now initialized by UICore

})();