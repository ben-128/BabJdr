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
      // Use direct event delegation on document to catch dynamically added elements
      document.addEventListener('input', (e) => {
        if (e.target && e.target.id === 'spell-level-filter') {
          this.filterSpellsByLevel(parseInt(e.target.value, 10));
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'reset-spell-filter') {
          e.preventDefault();
          this.resetFilter();
        }
      });

      // Setup when page changes (router events)
      if (window.EventBus && window.Events) {
        EventBus.on(Events.PAGE_RENDER, (payload) => {
          if (payload.type === 'category' && payload.categoryType === 'spell') {
            // Re-setup filter after page render
            setTimeout(() => this.initializeFilter(), 200);
          }
        });
      }

      // Also listen to hash changes for direct navigation
      window.addEventListener('hashchange', () => {
        setTimeout(() => this.initializeFilter(), 200);
      });
    },

    initializeFilter() {
      const filterInput = document.querySelector('#spell-level-filter');
      if (!filterInput) return;
      
      console.log('SpellFilter: Initializing filter with value', filterInput.value);
      
      // Set initial value and apply filter
      const initialValue = parseInt(filterInput.value, 10) || 20;
      this.filterSpellsByLevel(initialValue);
    },

    filterSpellsByLevel(maxLevel) {
      console.log('SpellFilter: Filtering spells with maxLevel', maxLevel);
      
      // Get current page from URL hash
      const currentHash = window.location.hash.replace('#/', '');
      
      if (!currentHash.startsWith('sorts-')) {
        console.log('SpellFilter: Not on a spells page, hash is', currentHash);
        return;
      }
      
      // Find all spell cards in the current page
      const spellCards = document.querySelectorAll('.card[data-spell-name]');
      console.log('SpellFilter: Found', spellCards.length, 'spell cards');
      
      if (spellCards.length === 0) return;

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
  function initializeSpellFilter() {
    console.log('SpellFilter: Initializing module...');
    
    if (window.JdrApp) {
      if (JdrApp.modules) {
        JdrApp.modules.spellFilter = SpellFilter;
      }
    }
    
    // Initialize the filter
    SpellFilter.init();
    
    // Try to initialize the filter after a delay to ensure DOM is ready
    setTimeout(() => {
      if (window.location.hash.includes('sorts-')) {
        SpellFilter.initializeFilter();
      }
    }, 500);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSpellFilter);
  } else {
    // DOM is already ready
    initializeSpellFilter();
  }

  window.SpellFilter = SpellFilter;

})();