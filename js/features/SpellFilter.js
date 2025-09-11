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
      
      // Set initial value and apply filter
      const initialValue = parseInt(filterInput.value, 10) || 20;
      this.filterSpellsByLevel(initialValue);
    },

    filterSpellsByLevel(maxLevel) {
      // Get current page from URL hash
      const currentHash = window.location.hash.replace('#/', '');
      
      if (!currentHash.startsWith('sorts-')) {
        return;
      }
      
      // Extract category name from hash - handle double sorts- prefix
      // URLs like 'sorts-sorts-de-mage' or 'sorts-mage' should both work
      let currentCategoryName = currentHash.replace('sorts-', '');
      if (currentCategoryName.startsWith('sorts-')) {
        // Handle double prefix case: 'sorts-sorts-de-mage' -> 'sorts-de-mage'
        currentCategoryName = currentCategoryName.replace('sorts-', '');
      }
      
      // Find all spell cards in the current page
      const spellCards = document.querySelectorAll('.card[data-spell-name]');
      
      if (spellCards.length === 0) return;

      let visibleCount = 0;
      let categoryTotalCount = 0;

      spellCards.forEach((card) => {
        const spellName = card.dataset.spellName;
        const categoryName = card.dataset.categoryName;
        
        // More flexible category matching
        const matches = this.categoryMatches(categoryName, currentCategoryName);
        
        if (matches) {
          categoryTotalCount++;
          
          // Find the spell data to get its level
          const spellLevel = this.getSpellLevel(spellName, categoryName);
          
          if (spellLevel <= maxLevel) {
            card.style.display = '';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        } else {
          // Hide cards from other categories completely
          card.style.display = 'none';
        }
      });
      
      // Update filter display with count (use category total instead of all spells)
      this.updateFilterDisplay(maxLevel, visibleCount, categoryTotalCount);
    },

    categoryMatches(categoryName, currentCategoryName) {
      if (!categoryName || !currentCategoryName) {
        return false;
      }
      
      const catLower = categoryName.toLowerCase();
      const currentLower = currentCategoryName.toLowerCase();
      
      
      
      // Normalize both strings: replace hyphens with spaces
      const normalizedCat = catLower.replace(/[-_]/g, ' ').trim();
      const normalizedCurrent = currentLower.replace(/[-_]/g, ' ').trim();
      
      // Direct match
      if (normalizedCat === normalizedCurrent) {
        return true;
      }
      
      // Handle all possible URL-to-category mappings (including malformed URLs):
      const categoryMappings = {
        'mage': 'sorts de mage',
        'sorts de mage': 'sorts de mage',
        'de mage': 'sorts de mage',            // After normalization (tirets → espaces)
        'pretre': 'sorts de prêtre', 
        'prêtre': 'sorts de prêtre',
        'pr tre': 'sorts de prêtre',           // Malformed: missing ê
        'sorts de pr tre': 'sorts de prêtre',  // Malformed: missing ê
        'de pr tre': 'sorts de prêtre',        // After normalization - FIXED!
        'de-pr-tre': 'sorts de prêtre',        // Direct URL version (tirets)
        'sorts de prêtre': 'sorts de prêtre',  // Full name
        'de prêtre': 'sorts de prêtre',        // After double prefix removal + normalization
        'enchanteur': "sorts d'enchanteur",
        'd enchanteur': "sorts d'enchanteur",  // Malformed: missing '
        'sorts d enchanteur': "sorts d'enchanteur", // Malformed: missing '
        'd enchanteur': "sorts d'enchanteur",  // After normalization - FIXED!
        'd-enchanteur': "sorts d'enchanteur", // Direct URL version (tirets)
        "sorts d'enchanteur": "sorts d'enchanteur", // Full name
        "d'enchanteur": "sorts d'enchanteur"   // After double prefix removal
      };
      
      // Direct mapping lookup (try both original and normalized versions)
      const mappingMatch = categoryMappings[currentLower] || categoryMappings[normalizedCurrent];
      if (mappingMatch && normalizedCat === mappingMatch.toLowerCase()) {
        return true;
      }
      
      // Reverse lookup - strip common prefixes from category
      const strippedCat = normalizedCat
        .replace(/^sorts de /, '')
        .replace(/^sorts d'/, '')
        .replace(/^sorts d /, '')    // Handle missing apostrophe
        .replace(/^sorts /, '');
        
      if (strippedCat === normalizedCurrent) {
        return true;
      }
      
      // Handle various character issues
      const normalizedStrippedCat = strippedCat
        .replace(/ê/g, 'e')     // ê -> e
        .replace(/'/g, '')      // Remove apostrophes
        .replace(/\s+/g, ' ')   // Normalize spaces
        .trim();
        
      const normalizedExtracted = normalizedCurrent
        .replace(/ê/g, 'e')     
        .replace(/'/g, '')      
        .replace(/\s+/g, ' ')   
        .trim();
        
      if (normalizedStrippedCat === normalizedExtracted) {
        return true;
      }
      
      // Additional fuzzy matches for common issues
      if ((strippedCat === 'prêtre' || strippedCat === 'pretre') && 
          (normalizedCurrent.includes('pr') && normalizedCurrent.includes('tre'))) {
        return true;
      }
      
      if (strippedCat === 'enchanteur' && 
          (normalizedCurrent.includes('enchanteur') || normalizedCurrent.includes('d enchanteur'))) {
        return true;
      }
      
      
      return false;
    },

    getSpellLevel(spellName, categoryName) {
      if (!window.SORTS) return 0;

      // Find the category using flexible matching
      let category = window.SORTS.find(cat => {
        const catLower = cat.nom.toLowerCase();
        const nameLower = categoryName.toLowerCase();
        
        return catLower === nameLower ||
               catLower === `sorts de ${nameLower}` ||
               catLower === `sorts d'${nameLower}` ||
               catLower.includes(nameLower);
      });
      
      if (!category || !category.sorts) return 0;

      // Find the spell
      const spell = category.sorts.find(sort => sort.nom === spellName);
      if (!spell || !spell.prerequis) return 0;

      // Extract level from prerequisite - handle HTML content
      const cleanPrerequisite = spell.prerequis.replace(/<[^>]*>/g, '');
      const match = cleanPrerequisite.match(/Niveau\s*(\d+)/i);
      
      return match ? parseInt(match[1], 10) : 0;
    },

    updateFilterDisplay(maxLevel, visibleCount, totalCount) {
      const activeArticle = document.querySelector('article.active');
      if (!activeArticle) return;
      
      const filterContainer = activeArticle.querySelector('.spell-level-filter');
      if (!filterContainer) return;
      
      // Chercher le container des contrôles (avec input et bouton)
      const controlsContainer = filterContainer.querySelector('div[style*="flex-wrap"]');
      if (!controlsContainer) return;
      
      // Supprimer les anciens textes
      const allOldTexts = filterContainer.querySelectorAll('.filter-result-text');
      allOldTexts.forEach(old => old.remove());
      
      // Créer le nouveau texte
      const resultText = document.createElement('span');
      resultText.className = 'filter-result-text';
      resultText.textContent = `📊 ${visibleCount}/${totalCount} sorts affichés (niveau ≤ ${maxLevel})`;
      resultText.style.cssText = `
        padding: 0.5rem 1rem !important;
        background-color: #e8f4f8 !important;
        color: #2c5aa0 !important;
        border: 1px solid #b3d9e8 !important;
        border-radius: 6px !important;
        font-size: 0.85rem !important;
        font-weight: 600 !important;
        white-space: nowrap !important;
        display: inline-block !important;
      `;
      
      // L'ajouter dans le container des contrôles
      controlsContainer.appendChild(resultText);
    },

    resetFilter() {
      const filterInput = document.querySelector('#spell-level-filter');
      if (filterInput) {
        filterInput.value = '20';
        this.filterSpellsByLevel(20);
      }
      
      // Clear the count display
      const countContainer = document.querySelector('#spell-filter-count');
      if (countContainer) {
        countContainer.textContent = '';
        countContainer.style.display = 'none';
      }
    }
  };

  // Initialize the spell filter when the app is ready
  function initializeSpellFilter() {
    
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