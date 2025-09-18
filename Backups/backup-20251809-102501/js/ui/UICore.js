// ============================================================================
// JDR-BAB APPLICATION - UI CORE MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // UI CORE - INITIALIZATION AND MAIN SETUP
  // ========================================
  window.UICore = {
    _initialized: false,

    /**
     * Initialize UI system - called once at startup
     */
    init() {
      // Prevent multiple initialization to avoid duplicate event listeners
      if (this._initialized) {
        return;
      }
      
      this.setupEventListeners();
      this.setupSearch();
      this.setupModals();
      this.setupResponsive();
      this.setupNewPageHandler();
      this.initializeFilterModules();
      this._initialized = true;
    },

    /**
     * Setup main EventBus listeners
     */
    setupEventListeners() {
      // Content management via EventBus
      EventBus.on(Events.CONTENT_ADD, (payload) => {
        this.handleContentAdd(payload.type, payload.category, payload.item);
      });

      EventBus.on(Events.CONTENT_DELETE, (payload) => {
        this.handleContentDelete(payload.type, payload.category, payload.item);
      });

      EventBus.on(Events.CONTENT_MOVE, (payload) => {
        this.handleContentMove(payload.type, payload.category, payload.itemName, payload.direction);
      });

      // Delegate UI event handlers to specialized modules
      if (window.EventHandlers) {
        EventHandlers.setupContentHandlers();
        EventHandlers.setupTagsManagement();
      }
      
      // Initialize specialized filter modules
      if (window.GMObjectFilters && window.GMObjectFilters.init) {
        window.GMObjectFilters.init();
      }
      if (window.MonsterFilters && window.MonsterFilters.init) {
        window.MonsterFilters.init();
      }
      if (window.TableTresorFilters && window.TableTresorFilters.init) {
        window.TableTresorFilters.init();
      }
    },

    /**
     * Setup search functionality
     */
    setupSearch() {
      const searchInput = JdrApp.utils.dom.$('#search');
      const clearButton = JdrApp.utils.dom.$('#clear');
      
      if (searchInput) {
        // Only search on Enter key press
        JdrApp.utils.events.register('keydown', '#search', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length > 0) {
              this.performSearch(query);
            } else {
              this.clearMainSearchResults();
            }
          } else if (e.key === 'Escape') {
            this.clearMainSearchResults();
            e.target.value = '';
            e.target.blur();
          }
        });
      }
      
      if (clearButton) {
        JdrApp.utils.events.register('click', '#clear', () => {
          if (searchInput) {
            searchInput.value = '';
            this.clearMainSearchResults();
          }
        });
      }
    },

    /**
     * Setup modal system
     */
    setupModals() {
      // Utilise BaseModal pour la gestion générique des modales
      BaseModal.init();

      // Resource tools
      JdrApp.utils.events.register('click', '#elementsBtn', () => {
        this.showElementsModal();
      });

      JdrApp.utils.events.register('click', '#etatsBtn', () => {
        this.showEtatsModal();
      });

      JdrApp.utils.events.register('click', '#spellLinksBtn', () => {
        this.showSpellLinksModal();
      });

      JdrApp.utils.events.register('click', '#pageLinksBtn', () => {
        this.showPageLinksModal();
      });

      JdrApp.utils.events.register('click', '#monsterLinksBtn', () => {
        this.showMonsterLinksModal();
      });

      // Gestionnaire pour les liens de sorts dans le contenu
      JdrApp.utils.events.register('click', '.spell-link', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const spellName = e.target.dataset.spell;
        const categoryName = e.target.dataset.category;
        this.showSpellPreview(spellName, categoryName, e.target);
      });

      // Gestionnaire pour les liens d'états dans le contenu
      JdrApp.utils.events.register('click', '.etat-link', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const etatName = e.target.dataset.etat;
        
        // Récupérer dynamiquement la description depuis les données statiques
        let etatDescription = '';
        if (window.STATIC_PAGES?.etats?.sections) {
          const etatSection = window.STATIC_PAGES.etats.sections.find(section => 
            section.type === 'card' && section.title === etatName
          );
          if (etatSection) {
            // Convertir le HTML en texte propre
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = etatSection.content;
            tempDiv.innerHTML = tempDiv.innerHTML
              .replace(/<\/p>/gi, '\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/li>/gi, '\n')
              .replace(/<\/div>/gi, '\n');
            etatDescription = (tempDiv.textContent || tempDiv.innerText || etatSection.content)
              .replace(/\n\s*\n/g, '\n')
              .trim();
          }
        }
        
        this.showEtatPreview(etatName, etatDescription, e.target);
      });

      // Gestionnaire pour les liens de monstres dans le contenu
      JdrApp.utils.events.register('click', '.monster-link', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const monsterName = e.target.dataset.monster;
        this.showMonsterPreview(monsterName, e.target, e);
      });
    },

    /**
     * Setup responsive design
     */
    setupResponsive() {
      this.setupMobileNavigation();
      this.setupLegacyResponsive();
    },

    /**
     * Setup new page creation handler
     */
    setupNewPageHandler() {
      // Setup section selection modal for new page creation
      JdrApp.utils.events.register('click', '.new-page-button', (e) => {
        this.showSectionSelectionModal();
      });
    },

    /**
     * Content event handlers - delegated from EventBus
     */
    handleContentAdd(type, category, item) {
      // Additional handling after content is added
      setTimeout(() => {
        if (JdrApp.modules.renderer?.autoLoadImages) {
          JdrApp.modules.renderer.autoLoadImages();
        }
      }, 100);
    },

    handleContentDelete(type, category, item) {
      // Cleanup after content deletion
    },

    handleContentMove(type, category, itemName, direction) {
      // Additional handling after content is moved
    },

    /**
     * Delegate method calls to appropriate modules
     */
    performSearch(query) {
      if (window.SearchManager) {
        return SearchManager.performSearch(query);
      }
      // Fallback to ui.js method if SearchManager not available yet
      if (JdrApp.modules.ui?.performSearch) {
        return JdrApp.modules.ui.performSearch(query);
      }
    },

    clearMainSearchResults() {
      if (window.SearchManager) {
        return SearchManager.clearMainSearchResults();
      }
      // Fallback to ui.js method
      if (JdrApp.modules.ui?.clearMainSearchResults) {
        return JdrApp.modules.ui.clearMainSearchResults();
      }
    },

    // Modal methods - delegate to ModalManager
    showElementsModal() {
      if (window.ModalManager) {
        return ModalManager.showElementsModal();
      }
      if (JdrApp.modules.ui?.showElementsModal) {
        return JdrApp.modules.ui.showElementsModal();
      }
    },

    showEtatsModal() {
      if (window.ModalManager) {
        return ModalManager.showEtatsModal();
      }
      if (JdrApp.modules.ui?.showEtatsModal) {
        return JdrApp.modules.ui.showEtatsModal();
      }
    },

    showSpellLinksModal() {
      if (window.ModalManager) {
        return ModalManager.showSpellLinksModal();
      }
      if (JdrApp.modules.ui?.showSpellLinksModal) {
        return JdrApp.modules.ui.showSpellLinksModal();
      }
    },

    showPageLinksModal() {
      if (window.ModalManager) {
        return ModalManager.showPageLinksModal();
      }
      if (JdrApp.modules.ui?.showPageLinksModal) {
        return JdrApp.modules.ui.showPageLinksModal();
      }
    },

    showMonsterLinksModal() {
      if (window.ModalManager) {
        return ModalManager.showMonsterLinksModal();
      }
      if (JdrApp.modules.ui?.showMonsterLinksModal) {
        return JdrApp.modules.ui.showMonsterLinksModal();
      }
    },

    showSpellPreview(spellName, categoryName, triggerElement) {
      if (window.ModalManager?.showSpellPreview) {
        return ModalManager.showSpellPreview(spellName, categoryName, triggerElement);
      }
    },

    showEtatPreview(etatName, etatDescription, triggerElement) {
      if (window.ModalManager?.showEtatPreview) {
        return ModalManager.showEtatPreview(etatName, etatDescription, triggerElement);
      }
    },

    showMonsterPreview(monsterName, triggerElement, event) {
      if (window.ModalManager?.showMonsterPreview) {
        return ModalManager.showMonsterPreview(monsterName, triggerElement, event);
      }
    },

    setupMobileNavigation() {
      if (window.ResponsiveManager) {
        return ResponsiveManager.setupMobileNavigation();
      }
      if (JdrApp.modules.ui?.setupMobileNavigation) {
        return JdrApp.modules.ui.setupMobileNavigation();
      }
    },

    setupLegacyResponsive() {
      if (window.ResponsiveManager) {
        return ResponsiveManager.setupLegacyResponsive();
      }
      if (JdrApp.modules.ui?.setupLegacyResponsive) {
        return JdrApp.modules.ui.setupLegacyResponsive();
      }
    },

    showSectionSelectionModal() {
      if (window.PageManager) {
        return PageManager.showSectionSelectionModal();
      }
      if (JdrApp.modules.ui?.showSectionSelectionModal) {
        return JdrApp.modules.ui.showSectionSelectionModal();
      }
    },

    /**
     * Initialize all filter modules
     */
    initializeFilterModules() {
      // Initialize specialized filter modules
      if (window.MonsterFilters && MonsterFilters.init) {
        MonsterFilters.init();
      }
      
      if (window.GMObjectFilters && GMObjectFilters.init) {
        GMObjectFilters.init();
      }
      
      if (window.TableTresorFilters && TableTresorFilters.init) {
        TableTresorFilters.init();
      }
    }
  };

})();