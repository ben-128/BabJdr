// ============================================================================
// JDR-BAB APPLICATION - SPELL FILTER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // SPELL FILTER MODULE
  // ========================================
  const SpellFilter = {
    
    init() {
      this.setupEventListeners();
    },

    setupEventListeners() {
      // Setup event listeners with delegation to handle dynamically added elements
      JdrApp.utils.events.register('input', '#spell-level-filter', (e) => {
        this.filterSpellsByLevel(parseInt(e.target.value, 10));
      });

      JdrApp.utils.events.register('click', '#reset-spell-filter', (e) => {
        this.resetFilter();
      });

      // Setup when page changes (router events)
      EventBus.on(Events.PAGE_RENDER, (payload) => {
        if (payload.type === 'category' && payload.categoryType === 'spell') {
          // Re-setup filter after page render
          setTimeout(() => this.initializeFilter(), 100);
        }
      });
    },

    initializeFilter() {
      const filterInput = document.querySelector('#spell-level-filter');
      const resetButton = document.querySelector('#reset-spell-filter');
      
      if (filterInput && resetButton) {
        // Set initial value and apply filter
        const initialValue = parseInt(filterInput.value, 10);
        this.filterSpellsByLevel(initialValue);
      }
    },

    filterSpellsByLevel(maxLevel) {
      // Get current page from URL hash
      const currentHash = window.location.hash.replace('#/', '');
      
      if (!currentHash.startsWith('sorts-')) {
        return;
      }
      
      // Find the article for this specific page
      const currentArticle = document.querySelector(`article[data-page="${currentHash}"]`);
      if (!currentArticle) {
        return;
      }
      
      // Extract category ID from the hash
      const containerId = `spells-container-${currentHash.replace('sorts-', '')}`;
      const spellsContainer = document.querySelector(`#${containerId}`);
      if (!spellsContainer) return;

      const spellCards = spellsContainer.querySelectorAll('.card[data-spell-name]');
      let visibleCount = 0;

      spellCards.forEach((card) => {
        const spellName = card.dataset.spellName;
        const categoryName = card.dataset.categoryName;
        
        // Find the spell data to get its level
        const spellLevel = this.getSpellLevel(spellName, categoryName);
        
        if (spellLevel <= maxLevel) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Update filter display with count
      this.updateFilterDisplay(maxLevel, visibleCount, spellCards.length);
    },

    getSpellLevel(spellName, categoryName) {
      if (!window.SORTS) return 0;

      // Find the category
      const category = window.SORTS.find(cat => cat.nom === categoryName);
      if (!category || !category.sorts) return 0;

      // Find the spell
      const spell = category.sorts.find(sort => sort.nom === spellName);
      if (!spell || !spell.prerequis) return 0;

      // Extract level from prerequisite
      const match = spell.prerequis.match(/Niveau (\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    },

    updateFilterDisplay(maxLevel, visibleCount, totalCount) {
      const filterContainer = document.querySelector('.spell-level-filter');
      if (!filterContainer) return;

      // Remove existing count display
      let countDisplay = filterContainer.querySelector('.filter-count');
      if (countDisplay) {
        countDisplay.remove();
      }

      // Add new count display
      const countText = `📊 ${visibleCount}/${totalCount} sorts affichés (niveau ≤ ${maxLevel})`;
      countDisplay = document.createElement('div');
      countDisplay.className = 'filter-count';
      countDisplay.style.cssText = 'margin-top: 0.5rem; font-size: 0.9rem; color: var(--bronze); font-weight: 500;';
      countDisplay.textContent = countText;
      
      filterContainer.appendChild(countDisplay);
    },

    resetFilter() {
      const filterInput = document.querySelector('#spell-level-filter');
      if (filterInput) {
        filterInput.value = '20';
        this.filterSpellsByLevel(20);
      }
    }
  };

  // Initialize the spell filter when the app is ready
  if (window.JdrApp) {
    if (JdrApp.modules) {
      JdrApp.modules.spellFilter = SpellFilter;
    }
    
    // Initialize immediately if app is already loaded
    if (JdrApp.isInitialized) {
      SpellFilter.init();
    }
  }

  // Also initialize on DOM ready as fallback
  document.addEventListener('DOMContentLoaded', () => {
    SpellFilter.init();
  });

  window.SpellFilter = SpellFilter;

})();