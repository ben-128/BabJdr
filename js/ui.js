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
    }
  };

  // Auto-initialize when DOM is ready
  JdrApp.utils.dom.ready(() => {
    JdrApp.modules.ui.init();
  });

})();