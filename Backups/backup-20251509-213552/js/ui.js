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

      // Set global flag for ID search BEFORE any regeneration
      window.activeIdSearch = true;
      window.activeSearchId = searchNumber;

      // Show success message
      if (resultDiv) {
        resultDiv.innerHTML = `✅ Objet trouvé : "${foundObject.nom}" (ID: ${searchNumber})`;
        resultDiv.style.color = '#16a34a';
      }

      // Force regenerate page first, then show the object
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
      
      // After regeneration, show only the target object
      setTimeout(() => {
        this.showOnlyObjectById(searchNumber);
      }, 100);
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
      
      // Clear the global flags
      window.activeIdSearch = false;
      window.activeSearchId = null;
      
      // Regenerate page to show all objects hidden again
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
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
    },

    // Campaign management functions
    selectCampaign(campaignName) {
      if (!campaignName) return;
      
      // Initialize state if needed
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }
      
      window.JdrApp.state.selectedCampaign = campaignName;
      
      // Clear sub-page selection when changing campaign and set to first available
      const campaignData = window.CAMPAGNE?.subPages?.[campaignName];
      if (campaignData?.subPages) {
        const subPageList = Object.keys(campaignData.subPages);
        window.JdrApp.state.selectedSubPage = subPageList.length > 0 ? subPageList[0] : null;
      } else {
        window.JdrApp.state.selectedSubPage = null;
      }
      
      // Regenerate the page to reflect the new selection
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
    },

    selectSubPage(subPageName) {
      if (!subPageName) return;
      
      // Initialize state if needed
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }
      
      window.JdrApp.state.selectedSubPage = subPageName;
      
      // Small delay to ensure state is set before regeneration
      setTimeout(() => {
        if (JdrApp.modules.renderer?.regenerateCurrentPage) {
          JdrApp.modules.renderer.regenerateCurrentPage();
        }
      }, 10);
    },

    // Campaign management functions
    addCampaignSubPage(campaignName) {
      if (!campaignName) return;
      
      const subPageName = prompt('Nom de la nouvelle sous-page :');
      if (!subPageName || !subPageName.trim()) {
        return;
      }
      
      const trimmedName = subPageName.trim();
      
      // Initialize state if needed
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }
      
      // Get campaign data
      const campaignData = window.CAMPAGNE || window.STATIC_PAGES?.campagne;
      if (!campaignData?.subPages?.[campaignName]) {
        alert('Erreur : Campagne non trouvée');
        return;
      }
      
      // Check if sub-page already exists
      if (campaignData.subPages[campaignName].subPages?.[trimmedName]) {
        alert(`La sous-page "${trimmedName}" existe déjà`);
        return;
      }
      
      // Initialize subPages if it doesn't exist
      if (!campaignData.subPages[campaignName].subPages) {
        campaignData.subPages[campaignName].subPages = {};
      }
      
      // Add new sub-page
      campaignData.subPages[campaignName].subPages[trimmedName] = {
        title: trimmedName,
        content: '<p>Contenu de la nouvelle sous-page...</p>'
      };
      
      // Update state to select the new sub-page
      window.JdrApp.state.selectedCampaign = campaignName;
      window.JdrApp.state.selectedSubPage = trimmedName;
      
      // Save and regenerate
      this.saveCampaignData();
      this.regenerateCampaignPage();
      
      alert(`Sous-page "${trimmedName}" créée avec succès !`);
    },

    deleteCampaignSubPage(campaignName, subPageName) {
      if (!campaignName || !subPageName) return;
      
      if (!confirm(`Supprimer la sous-page "${subPageName}" ?`)) {
        return;
      }
      
      // Get campaign data
      const campaignData = window.CAMPAGNE || window.STATIC_PAGES?.campagne;
      if (!campaignData?.subPages?.[campaignName]?.subPages?.[subPageName]) {
        alert('Erreur : Sous-page non trouvée');
        return;
      }
      
      // Delete the sub-page
      delete campaignData.subPages[campaignName].subPages[subPageName];
      
      // Update state to select first available sub-page or null
      const remainingSubPages = Object.keys(campaignData.subPages[campaignName].subPages || {});
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }
      
      window.JdrApp.state.selectedCampaign = campaignName;
      window.JdrApp.state.selectedSubPage = remainingSubPages.length > 0 ? remainingSubPages[0] : null;
      
      // Save and regenerate
      this.saveCampaignData();
      this.regenerateCampaignPage();
      
      alert(`Sous-page "${subPageName}" supprimée`);
    },

    saveCampaignData() {
      // Trigger storage save if available
      if (window.EventBus && window.Events) {
        window.EventBus.emit(window.Events.STORAGE_SAVE);
      }
    },

    regenerateCampaignPage() {
      // Use the renderer's regenerateCurrentPage function
      setTimeout(() => {
        if (JdrApp.modules.renderer?.regenerateCurrentPage) {
          JdrApp.modules.renderer.regenerateCurrentPage();
        }
      }, 100);
    },

    // Modal functions - delegate to UICore/ModalManager
    showElementsModal() {
      if (window.UICore) {
        return UICore.showElementsModal();
      }
    },

    showEtatsModal() {
      if (window.UICore) {
        return UICore.showEtatsModal();
      }
    },

    showSpellLinksModal() {
      if (window.UICore) {
        return UICore.showSpellLinksModal();
      }
    },

    showMonsterLinksModal() {
      if (window.UICore) {
        return UICore.showMonsterLinksModal();
      }
    },

    showPageLinksModal() {
      if (window.UICore) {
        return UICore.showPageLinksModal();
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