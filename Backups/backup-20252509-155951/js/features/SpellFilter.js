// ============================================================================
// JDR-BAB APPLICATION - SPELL FILTER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // SPELL FILTER MODULE
  // ========================================
  const SpellFilter = {
    // Cache for performance
    _cachedCards: null,
    _lastCategoryHash: null,
    _debugMode: false, // Disable debug logs for cleaner output
    _initialized: false, // Prevent multiple initializations
    _filteringInProgress: false, // Prevent concurrent filtering
    _removedCards: [], // Track removed cards for restoration
    _domObserver: null, // DOM mutation observer
    
    init() {
      if (this._initialized) {
        return;
      }
      this.addFilterCSS();
      this.setupEventListeners();
      this._initialized = true;
    },
    
    addFilterCSS() {
      // Add CSS rules for filtering if they don't exist
      const styleId = 'spell-filter-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Ultra-specific selectors for hiding filtered spells */
          .card.spell-filtered-hidden,
          .card[data-filtered="true"],
          article .card[data-filtered="true"],
          article.active .card[data-filtered="true"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -9999px !important;
          }
          
          /* Ensure visible cards are properly displayed */
          .card.spell-card:not(.spell-filtered-hidden):not([data-filtered="true"]) {
            display: block !important;
            position: relative !important;
            left: auto !important;
          }
        `;
        document.head.appendChild(style);
      }
    },

    setupEventListeners() {
      
      // Use throttled event delegation for better performance
      document.addEventListener('input', (e) => {
        if (e.target && (
          e.target.classList.contains('spell-level-filter-input') ||
          e.target.id === 'spell-level-filter' ||
          (e.target.type === 'number' && e.target.closest('.spell-level-filter'))
        )) {
          // Throttle filter calls for smoother performance
          this.throttledFilter(parseInt(e.target.value, 10));
        }
      });

      document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('reset-spell-filter')) {
          e.preventDefault();
          this.resetFilter();
        } else if (e.target && (e.target.id === 'reset-spell-filter' || e.target.textContent.includes('Tout afficher'))) {
          e.preventDefault();
          this.resetFilter();
        }
      });

      // Setup when page changes (router events)
      if (window.EventBus && window.Events) {
        EventBus.on(Events.PAGE_RENDER, (payload) => {
          if (this._filteringInProgress) return; // Prevent loops
          if (payload.type === 'category' && payload.categoryType === 'spell') {
            // Clear cache and re-setup filter after page render
            this.clearCache();
            // Don't auto-reset filter - preserve user's setting
            setTimeout(() => {
              this.initializeFilter();
            }, 300);
          }
        });
      } else {
      }

      // Listen to hash changes for direct navigation - but debounce it
      let hashChangeTimeout = null;
      window.addEventListener('hashchange', () => {
        // Clear any pending hash change handling
        if (hashChangeTimeout) {
          clearTimeout(hashChangeTimeout);
        }
        
        hashChangeTimeout = setTimeout(() => {
          this.clearCache();
          
          // Only process spell pages and avoid loops
          if (window.location.hash.includes('sorts-') && !this._filteringInProgress) {
            // Don't auto-reset filter - preserve user's setting
            setTimeout(() => {
              this.initializeFilter();
            }, 500);
          }
        }, 200); // Increased debounce time
      });
      
    },

    // Clear cache when changing pages
    clearCache() {
            this._cachedCards = null;
      this._lastCategoryHash = null;
      
      // IMPORTANT: Restore cards before clearing cache to avoid losing them
      if (this._removedCards && this._removedCards.length > 0) {
                this.restoreAllCards();
      }
    },

    // Throttled filter function for better performance
    throttledFilter: (function() {
      let timeout = null;
      return function(maxLevel) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.filterSpellsByLevel(maxLevel);
        }, 100); // 100ms throttle
      };
    })(),

    initializeFilter() {
      if (this._filteringInProgress) {
        return;
      }
      
      const activeArticle = document.querySelector('article.active');
      if (!activeArticle) {
        return;
      }
      
      // Simple approach: just find the filter input
      let filterInput = activeArticle.querySelector('.spell-level-filter-input') ||
                       activeArticle.querySelector('#spell-level-filter') ||
                       activeArticle.querySelector('input[type="number"]');
      
      if (!filterInput) {
        return;
      }
      
      // Get current value but don't auto-apply - let user control it
      const currentValue = parseInt(filterInput.value, 10) || 20;
      
      // Only apply filter if it's not the default AND user has cards to filter
      if (currentValue !== 20) {
        this.filterSpellsByLevel(currentValue);
      } else {
        // Ensure all cards are visible for default level 20
        this.restoreAllCards();
      }
    },

    filterSpellsByLevel(maxLevel) {
      if (this._filteringInProgress) {
        return;
      }
      
      this._filteringInProgress = true;
            // Get current page from URL hash
      const currentHash = window.location.hash.replace('#/', '');
            
      if (!currentHash.startsWith('sorts-')) {
                return;
      }
      
      // First, restore any cards that were removed from DOM
      this.restoreAllCards();
      
      // FORCE clear cache to get fresh DOM query
      this.clearCache();
      
      // Extract category name from hash - handle double sorts- prefix
      // URLs like 'sorts-sorts-de-mage' or 'sorts-mage' should both work
      let currentCategoryName = currentHash.replace('sorts-', '');
      if (currentCategoryName.startsWith('sorts-')) {
        // Handle double prefix case: 'sorts-sorts-de-mage' -> 'sorts-de-mage'
        currentCategoryName = currentCategoryName.replace('sorts-', '');
      }
      
      // ALWAYS get fresh DOM query - no cache for debugging
      const spellCards = document.querySelectorAll('.card[data-spell-name]');
            
      
      if (spellCards.length === 0) {
                return;
      }

      let visibleCount = 0;
      let categoryTotalCount = 0;
      
      spellCards.forEach((card, index) => {
        const spellName = card.dataset.spellName;
        const categoryName = card.dataset.categoryName;
        
                
        // More flexible category matching
        const matches = this.categoryMatches(categoryName, currentCategoryName);
                
        if (matches) {
          categoryTotalCount++;
          
          // Find the spell data to get its level
          const spellLevel = this.getSpellLevel(spellName, categoryName);
                    
          if (spellLevel <= maxLevel) {
            // Show the card by ensuring it's in the DOM and visible
            if (card._originalParent && !card.parentNode) {
              card._originalParent.appendChild(card);
            }
            card.style.display = '';
            card.style.visibility = '';
            card.classList.remove('spell-filtered-hidden');
            card.removeAttribute('data-filtered');
            card.hidden = false;
            visibleCount++;
                      } else {
            // Hide by removing from DOM temporarily and cache properly
            if (card.parentNode) {
              // Store detailed restoration info
              const cardData = {
                card: card,
                originalParent: card.parentNode,
                nextSibling: card.nextSibling,
                spellName: spellName,
                category: categoryName
              };
              
              // Initialize cache if needed
              if (!this._removedCards) this._removedCards = [];
              
              // Check if already cached to avoid duplicates
              const alreadyCached = this._removedCards.find(cached => cached.card === card);
              if (!alreadyCached) {
                this._removedCards.push(cardData);
              }
              
              // Also store on the card itself as backup
              card._originalParent = card.parentNode;
              card._nextSibling = card.nextSibling;
              
              card.parentNode.removeChild(card);
                          } else {
              // Fallback: hide with CSS but don't cache since it's already out of DOM
              card.style.display = 'none';
              card.style.visibility = 'hidden';
              card.classList.add('spell-filtered-hidden');
              card.setAttribute('data-filtered', 'true');
              card.hidden = true;
                          }
          }
        } else {
          // Cards from other categories should stay visible but not counted
          // Show the card but don't count it
          if (card._originalParent && !card.parentNode) {
            card._originalParent.appendChild(card);
          }
          card.style.display = '';
          card.style.visibility = '';
          card.classList.remove('spell-filtered-hidden');
          card.removeAttribute('data-filtered');
          card.hidden = false;
                  }
      });
      
            
      // Update filter display with count (use category total instead of all spells)
      this.updateFilterDisplay(maxLevel, visibleCount, categoryTotalCount);
      
      // Filtering complete
      this._filteringInProgress = false;
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

    // Removed monitoring to reduce logs and conflicts
    
    // Removed auto-reset to prevent unwanted resets
    
    // Simplified approach - removed complex reloading mechanisms
    
    restoreAllCards() {
            
      // Step 1: Restore cards from removal cache
      if (this._removedCards && this._removedCards.length > 0) {
                
        // Create a new array to avoid modifying while iterating
        const cardsToRestore = [...this._removedCards];
        this._removedCards = []; // Clear cache first
        
        cardsToRestore.forEach(cardData => {
          if (cardData.card && cardData.originalParent && !cardData.card.parentNode) {
            try {
              // Restore to original position
              if (cardData.nextSibling && cardData.nextSibling.parentNode === cardData.originalParent) {
                cardData.originalParent.insertBefore(cardData.card, cardData.nextSibling);
              } else {
                cardData.originalParent.appendChild(cardData.card);
              }
                          } catch (error) {
                          }
          }
        });
      }
      
      // Step 2: Get ALL cards and ensure they are visible  
      const allCards = document.querySelectorAll('.card[data-spell-name]');
            
      allCards.forEach(card => {
        // Restore any remaining cards using backup references
        if (card._originalParent && !card.parentNode) {
          try {
            if (card._nextSibling && card._nextSibling.parentNode === card._originalParent) {
              card._originalParent.insertBefore(card, card._nextSibling);
            } else {
              card._originalParent.appendChild(card);
            }
                      } catch (error) {
                      }
        }
        
        // Ensure all cards are visible and clean
        card.style.display = '';
        card.style.visibility = '';
        card.style.opacity = '';
        card.style.height = '';
        card.style.maxHeight = '';
        card.style.overflow = '';
        card.style.position = '';
        card.style.left = '';
        card.classList.remove('spell-filtered-hidden');
        card.removeAttribute('data-filtered');
        card.hidden = false;
        
        // Clean up backup references
        delete card._originalParent;
        delete card._nextSibling;
      });
      
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
            
      // First restore all cards
      this.restoreAllCards();
      
      // Reset filter input to 20
      const activeArticle = document.querySelector('article.active');
      if (activeArticle) {
        let filterInput = activeArticle.querySelector('.spell-level-filter-input') ||
                         activeArticle.querySelector('#spell-level-filter') ||
                         activeArticle.querySelector('input[type="number"]');
        if (filterInput) {
          filterInput.value = '20';
                  }
      }
      
      // Also try global search for filter inputs
      const allFilterInputs = document.querySelectorAll('.spell-level-filter-input, #spell-level-filter, input[type="number"][class*="spell"]');
      allFilterInputs.forEach(input => {
        if (input && input.closest('.spell-level-filter')) {
          input.value = '20';
                  }
      });
      
      // Update display to show all cards are visible
      const totalCards = document.querySelectorAll('.card[data-spell-name]').length;
      this.updateFilterDisplay(20, totalCards, totalCards);
      
          }
  };

  // Initialize the spell filter when the app is ready
  function initializeSpellFilter() {
    
    if (window.JdrApp) {
      if (JdrApp.modules) {
        JdrApp.modules.spellFilter = SpellFilter;
      }
    } else {
    }
    
    // Initialize the filter
    SpellFilter.init();
    
    // Try to initialize the filter after a delay to ensure DOM is ready
    setTimeout(() => {
      if (window.location.hash.includes('sorts-')) {
        SpellFilter.initializeFilter();
      } else {
      }
    }, 500);
    
    // Also try manual initialization on window load
    window.addEventListener('load', () => {
      if (window.location.hash.includes('sorts-')) {
        setTimeout(() => SpellFilter.initializeFilter(), 100);
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSpellFilter);
  } else {
    // DOM is already ready
    initializeSpellFilter();
  }

  // Make SpellFilter globally available
  window.SpellFilter = SpellFilter;
  
  // Additional manual trigger for testing
  window.testSpellFilter = function() {
    SpellFilter.initializeFilter();
  };
  
  // Test function to see current DOM state
  window.checkDOMState = function() {
    const cards = document.querySelectorAll('.card[data-spell-name]');
    cards.forEach((card, i) => {
      const isVisible = card.parentNode && getComputedStyle(card).display !== 'none';
    });
  };
  
  // Manual reset function for testing
  window.manualReset = function() {
    SpellFilter.resetFilter();
  };
  

})();