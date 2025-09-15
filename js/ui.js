// ============================================================================
// JDR-BAB APPLICATION - UI MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // UI INTERACTIONS MODULE
  // ========================================
  JdrApp.modules.ui = {
    _initialized: false,
    
    init() {
      // Prevent multiple initialization to avoid duplicate event listeners
      if (this._initialized) {
        return;
      }
      
      // Use UICore for main initialization
      if (window.UICore) {
        UICore.init();
      } else {
        console.error('UICore not available - ensure ui/ modules are loaded');
        return;
      }
      
      this._initialized = true;
    },

    setupEventListeners() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupEventListeners();
      }
    },

    setupSearch() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupSearch();
      }
    },

    setupModals() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupModals();
      }
    },

    setupResponsive() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupResponsive();
      }
    },

    setupNewPageHandler() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupNewPageHandler();
      }
    },

    // Event handlers - delegate to modular components
    handleContentAdd(type, category, item) {
      if (window.ContentManager) {
        return ContentManager.handleContentAdd(type, category, item);
      }
    },

    handleContentDelete(type, category, item) {
      if (window.ContentManager) {
        return ContentManager.handleContentDelete(type, category, item);
      }
    },

    handleContentMove(type, category, itemName, direction) {
      if (window.ContentManager) {
        return ContentManager.handleContentMove(type, category, itemName, direction);
      }
    },

    // Search methods - delegate to SearchManager
    performSearch(query) {
      if (window.SearchManager) {
        return SearchManager.performSearch(query);
      }
    },

    clearMainSearchResults() {
      if (window.SearchManager) {
        return SearchManager.clearMainSearchResults();
      }
    },

    // Modal methods - delegate to ModalManager
    openModal(type, data = null) {
      if (window.ModalManager) {
        return ModalManager.openModal(type, data);
      }
    },

    closeModal() {
      if (window.ModalManager) {
        return ModalManager.closeModal();
      }
    },

    // Page management - delegate to PageManager
    showPage(pageId) {
      if (window.PageManager) {
        return PageManager.showPage(pageId);
      }
    },

    // Responsive methods - delegate to ResponsiveManager
    updateResponsiveLayout() {
      if (window.ResponsiveManager) {
        return ResponsiveManager.updateResponsiveLayout();
      }
    },

    // Tags methods - delegate to TagsManager
    updateTagsDisplay() {
      if (window.TagsManager) {
        return TagsManager.updateTagsDisplay();
      }
    },

    toggleTag(tagName, isActive) {
      if (window.TagsManager) {
        return TagsManager.toggleTag(tagName, isActive);
      }
    },

    // Event handling delegation
    setupDragAndDrop() {
      if (window.EventHandlers) {
        return EventHandlers.setupDragAndDrop();
      }
    },

    setupKeyboardShortcuts() {
      if (window.EventHandlers) {
        return EventHandlers.setupKeyboardShortcuts();
      }
    },

    // ID Search functionality (for objects page)
    performIdSearch(searchValue) {
      const searchId = searchValue.trim();
      const resultDiv = document.querySelector('#id-search-result');
      
      if (!searchId) {
        this.clearIdSearch();
        return;
      }

      const searchNumber = parseInt(searchId, 10);
      if (isNaN(searchNumber)) {
        if (resultDiv) {
          resultDiv.innerHTML = '❌ Veuillez saisir un numéro valide';
          resultDiv.style.color = '#dc2626';
        }
        return;
      }

      // Find object by number
      const allObjects = window.OBJETS?.objets || [];
      const foundObject = allObjects.find(obj => obj.numero === searchNumber);

      if (!foundObject) {
        if (resultDiv) {
          resultDiv.innerHTML = `❌ Aucun objet trouvé avec l'ID ${searchNumber}`;
          resultDiv.style.color = '#dc2626';
        }
        // Hide all objects
        this.hideAllObjects();
        return;
      }

      // Set global flag for ID search
      window.activeIdSearch = true;

      // Show success message
      if (resultDiv) {
        resultDiv.innerHTML = `✅ Objet trouvé : "${foundObject.nom}" (ID: ${searchNumber})`;
        resultDiv.style.color = '#16a34a';
      }

      // Show only the target object
      this.showOnlyObjectById(searchNumber);
    },

    clearIdSearch() {
      const input = document.querySelector('#id-search-input');
      const resultDiv = document.querySelector('#id-search-result');
      
      if (input) {
        input.value = '';
      }
      
      if (resultDiv) {
        resultDiv.innerHTML = '';
      }
      
      // Clear the global flag
      window.activeIdSearch = false;
      
      // Show all objects again
      this.showAllObjects();
    },

    hideAllObjects() {
      document.querySelectorAll('#objets-container .card, #gestion-objets-container .card').forEach(card => {
        card.style.display = 'none';
      });
    },

    showAllObjects() {
      document.querySelectorAll('#objets-container .card, #gestion-objets-container .card').forEach(card => {
        card.style.display = '';
      });
    },

    showOnlyObjectById(searchNumber) {
      this.hideAllObjects();
      
      // Show only the target object - check both containers
      const targetCard = document.querySelector(`[data-object-id="${searchNumber}"], [data-numero="${searchNumber}"]`);
      if (targetCard) {
        targetCard.style.display = '';
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      JdrApp.modules.ui.init();
    });
  } else {
    // DOM is already loaded
    JdrApp.modules.ui.init();
  }

})();