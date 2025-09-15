// ============================================================================
// JDR-BAB APPLICATION - CORE MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // MAIN APPLICATION NAMESPACE
  // ========================================
  window.JdrApp = {
    // Core data
    data: {
      SORTS: null,
      CLASSES: null,
      DONS: null,
      OBJETS: null,
      MONSTRES: null,
      STATIC_PAGES: {},
      editedData: {},
      customPageDescriptions: {
        'collections-objets': 'Recherchez et explorez des collections d\'objets organisées par thème'
      }
    },
    
    // Application state
    state: {
      isMJ: false // Boolean pour contrôler l'accès MJ
    },
    
    // Core modules
    modules: {
      router: {},
      renderer: {},
      editor: {},
      storage: {},
      images: {}
    },
    
    // Utilities
    utils: {
      dom: {},
      events: {},
      data: {}
    },

    // Initialization
    async init() {
      try {
        this.updateLoadingProgress(10);
        await this.loadData();
        
        this.updateLoadingProgress(40);
        await this.loadContent();
        
        this.updateLoadingProgress(70);
        this.initializeModules();
        
        this.updateLoadingProgress(90);
        
        // Execute data validation after all modules are loaded
        setTimeout(() => {
          this.validateDataIntegrity();
          this.updateLoadingProgress(100);
          this.hideLoadingScreen();
        }, 500);
        
        // Auto-enable MJ mode with additional delay to ensure router is ready
        setTimeout(() => {
          this.autoEnableMJModeInDevelopment();
        }, 800);
      } catch (error) {
        this.hideLoadingScreen();
        // Silent error handling for initialization
      }
    },

    // Update loading progress
    updateLoadingProgress(percentage) {
      const progressBar = document.querySelector('.loading-bar');
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }
    },

    // Hide loading screen with animation
    hideLoadingScreen() {
      const loadingScreen = document.getElementById('app-loading');
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          if (loadingScreen.parentNode) {
            loadingScreen.parentNode.removeChild(loadingScreen);
          }
        }, 500);
      }
    },

    async loadData() {
      try {
        // Check if we're in standalone mode (data already injected)
        if (window.SORTS && window.CLASSES && window.DONS && window.OBJETS && window.STATIC_PAGES) {
          const sorts = window.SORTS;
          const classes = window.CLASSES;
          const dons = window.DONS;
          const objets = window.OBJETS;
          let monstres = window.MONSTRES || [];
          let tablesTresors = window.TABLES_TRESORS || { tables: [] };
          let collections = window.COLLECTIONS || { collections: [] };
          
          // Safety check - if MONSTRES is not an array, it might be page config
          if (!Array.isArray(monstres)) {
            this.clearCorruptedMonsterData();
            monstres = [];
          }
          
          const staticPagesData = window.STATIC_PAGES;
          const staticPagesConfig = window.STATIC_PAGES_CONFIG || {};
          
          // Ensure custom page descriptions are available in standalone mode
          // In standalone mode, CUSTOM_PAGE_DESCRIPTIONS might be injected, sync with JdrApp.data
          if (window.CUSTOM_PAGE_DESCRIPTIONS) {
            this.data.customPageDescriptions = { ...this.data.customPageDescriptions, ...window.CUSTOM_PAGE_DESCRIPTIONS };
          } else {
            window.CUSTOM_PAGE_DESCRIPTIONS = { ...this.data.customPageDescriptions };
          }
          
          this.data.SORTS = sorts;
          this.data.CLASSES = classes;
          this.data.DONS = dons;
          this.data.OBJETS = objets;
          this.data.MONSTRES = monstres;
          this.data.TABLES_TRESORS = tablesTresors;
          this.data.COLLECTIONS = collections;
          this.data.STATIC_PAGES = staticPagesData;
          this.data.STATIC_PAGES_CONFIG = staticPagesConfig;
          
          window.SORTS = sorts;
          window.CLASSES = classes;
          window.DONS = dons;
          window.OBJETS = objets;
          window.MONSTRES = monstres;
          window.TABLES_TRESORS = tablesTresors;
          window.COLLECTIONS = collections;
          window.STATIC_PAGES = staticPagesData;
          window.STATIC_PAGES_CONFIG = staticPagesConfig;
          
          // Load stored edits AFTER setting up the data structure
          this.loadStoredEditsEarly();
          
          // Initialize default filters for objects
          this.initializeDefaultFilters();
          return;
        }
        
        // Development mode - fetch files
        const [sorts, classes, dons, objets, monstres, tablesTresors, collections, staticPagesConfig, tocStructure, audioConfig] = await Promise.all([
          fetch('data/sorts.json').then(r => r.json()),
          fetch('data/classes.json').then(r => r.json()),
          fetch('data/dons.json').then(r => r.json()),
          fetch('data/objets.json').then(r => r.json()),
          fetch('data/monstres.json').then(r => r.json()),
          fetch('data/tables-tresors.json').then(r => r.json()),
          fetch('data/collections.json').then(r => r.json()),
          fetch('data/static-pages-config.json').then(r => r.json()),
          fetch('data/toc-structure.json').then(r => r.json()),
          fetch('data/audio-config.json').then(r => r.json()).catch(() => null)
        ]);

        // Load page descriptions (optional, with fallbacks)
        try {
          window.MONSTRES_PAGE_DESC = await fetch('data/monstres-page-desc.json').then(r => r.json());
        } catch (error) {
          // Fallback if file doesn't exist
          window.MONSTRES_PAGE_DESC = {
            description: "Créatures, ennemis et adversaires que peuvent affronter les héros dans leurs aventures."
          };
        }

        try {
          window.TABLES_TRESORS_PAGE_DESC = await fetch('data/tables-tresors-page-desc.json').then(r => r.json());
        } catch (error) {
          // Fallback if file doesn't exist
          window.TABLES_TRESORS_PAGE_DESC = {
            description: "Tables de butin permettant de générer aléatoirement des récompenses selon les fourchettes définies. Lancez un dé 20 et consultez la table correspondante pour déterminer l'objet obtenu."
          };
        }

        // Load custom page descriptions (collections, etc.)
        try {
          const customDescriptions = await fetch('data/custom-page-descriptions.json').then(r => r.json());
          this.data.customPageDescriptions = { ...this.data.customPageDescriptions, ...customDescriptions };
          // Make it available globally for ContentFactory (keep in sync)
          window.CUSTOM_PAGE_DESCRIPTIONS = { ...this.data.customPageDescriptions };
        } catch (error) {
          // Keep default values if file doesn't exist
          window.CUSTOM_PAGE_DESCRIPTIONS = { ...this.data.customPageDescriptions };
        }

        const staticPagesData = {};
        const activePages = staticPagesConfig.pages.filter(page => page.active);
        
        for (const pageConfig of activePages) {
          try {
            const pageData = await fetch(`data/${pageConfig.file}`).then(r => r.json());
            staticPagesData[pageConfig.id] = pageData;
          } catch (error) {
            // Silent handling for missing static pages
          }
        }

        this.data.SORTS = sorts;
        this.data.CLASSES = classes;
        this.data.DONS = dons;
        this.data.OBJETS = objets;
        this.data.MONSTRES = monstres;
        this.data.TABLES_TRESORS = tablesTresors;
        this.data.COLLECTIONS = collections;
        this.data.STATIC_PAGES = staticPagesData;
        this.data.STATIC_PAGES_CONFIG = staticPagesConfig;
        this.data.AUDIO_CONFIG = audioConfig;
        this.data.TOC_STRUCTURE = tocStructure;

        window.SORTS = sorts;
        window.CLASSES = classes;
        window.DONS = dons;
        window.OBJETS = objets;
        window.MONSTRES = monstres;
        window.TABLES_TRESORS = tablesTresors;
        window.COLLECTIONS = collections;
        window.STATIC_PAGES = this.data.STATIC_PAGES;
        window.STATIC_PAGES_CONFIG = this.data.STATIC_PAGES_CONFIG;
        window.TOC_STRUCTURE = this.data.TOC_STRUCTURE;
        window.AUDIO_CONFIG = audioConfig;
        
        // Load stored edits in development mode (after data is loaded)
        this.loadStoredEditsEarly();
        
        // Initialize default filters for objects
        this.initializeDefaultFilters();
      } catch (error) {
        throw error;
      }
    },

    async loadContent() {
      try {
        // Check if we're in standalone mode (already has HTML structure)
        const viewsDiv = document.getElementById('views');
        const loadingDiv = document.getElementById('app-loading');
        
        if (viewsDiv) {
          // Standalone mode - HTML structure already exists
          if (loadingDiv) {
            loadingDiv.innerHTML = '<!-- Content will be generated by renderer -->';
          }
        } else if (loadingDiv) {
          // Development mode - need to inject HTML structure
          const contentHTML = await this.getContentHTML();
          loadingDiv.outerHTML = contentHTML;
        }
      } catch (error) {
        throw error;
      }
    },

    async getContentHTML() {
      // This would ideally load from a separate HTML file
      // For now, we'll return the content structure
      return `
        <div class="shell">
          <button aria-controls="sidebar" aria-expanded="false" aria-label="Ouvrir le sommaire" class="menu-toggle" id="menuToggle" style="display:none">☰ Sommaire</button>
          <div class="backdrop" hidden="" id="backdrop"></div>
          <main class="page">
            <aside class="sidebar" id="sidebar">
              <div class="panel">
                <div class="tools">
                  <button class="btn small" id="devToggle" title="Activer/désactiver le mode développeur">🛠 Dev Mode: OFF</button>
                </div>
                <div class="dev-toolbox" id="devToolbox" style="display: none;">
                  <!-- Dev toolbox content will be injected here -->
                </div>
                <div class="toc" id="toc">
                  <div class="toc-search">
                    <input autocomplete="off" id="search" placeholder="Rechercher une règle, une classe…">
                    <button class="btn-clear" id="clear" title="Effacer">✖</button>
                  </div>
                  <!-- Table of contents will be injected here -->
                </div>
              </div>
            </aside>
            <div id="views">
              <!-- Dynamic content will be injected here -->
            </div>
          </main>
          <footer></footer>
        </div>
      `;
    },

    // Load stored edits early in the loading process (before rendering)
    loadStoredEditsEarly() {
      // Ne plus charger automatiquement le localStorage
      // Laisser les JSON files être la source de vérité
    },

    initializeModules() {
      if (this.utils.events && this.utils.events.init) this.utils.events.init();
      if (this.utils.dom && this.utils.dom.init) this.utils.dom.init();
      if (this.modules.images && this.modules.images.init) this.modules.images.init();
      if (this.modules.audio && this.modules.audio.init) this.modules.audio.init();
      if (this.modules.renderer && this.modules.renderer.init) this.modules.renderer.init();
      if (this.modules.router && this.modules.router.init) this.modules.router.init();
      if (this.modules.editor && this.modules.editor.init) this.modules.editor.init();
      if (this.modules.storage && this.modules.storage.init) this.modules.storage.init();
      if (this.modules.ui && this.modules.ui.init) this.modules.ui.init();
      
      // Initialize performance optimizations after all modules are loaded
      if (window.ScrollOptimizer && window.ScrollOptimizer.init) {
        window.ScrollOptimizer.init();
      }
      
      // Filter event handlers are now handled by specialized modules
    },

    // Filter event handlers removed - now handled by specialized modules

    // updateGMObjectsDisplay removed - now handled by GMObjectFilters module

    // Force reload JSON data (clear localStorage cache)
    forceReloadData() {
      // Effacer seulement les éditions temporaires
      localStorage.removeItem('jdr-bab-edits');
      localStorage.removeItem('jdr-bab-last-modified');
      window.location.reload();
    },

    // Clear corrupted localStorage data specifically for monsters
    clearCorruptedMonsterData() {
      const edits = JSON.parse(localStorage.getItem('jdr-bab-edits') || '{}');
      
      // Remove any MONSTRES data that might be corrupted
      if (edits.MONSTRES) {
        delete edits.MONSTRES;
        localStorage.setItem('jdr-bab-edits', JSON.stringify(edits));
      }
      
      // Also clear any other monster-related storage
      if (edits.monster) {
        delete edits.monster;
        localStorage.setItem('jdr-bab-edits', JSON.stringify(edits));
      }
    },

    // Public method to manually clear storage via console
    clearMonsterStorage() {
      this.clearCorruptedMonsterData();
      this.forceReloadData();
    },

    // initializeDefaultFilters removed - now handled by specialized filter modules

    // Validate data integrity on application startup
    validateDataIntegrity() {
      try {
        // Validate monster data if available
        if (window.MONSTRES && Array.isArray(window.MONSTRES) && JdrApp.modules.images) {
          // Force sync monster images and paths
          JdrApp.modules.images.forceSyncMonsterImages();
        }
        
        // Validate UnifiedEditor if available
        if (JdrApp.modules.editor && JdrApp.modules.editor.validateAndRepairMonsterData) {
          JdrApp.modules.editor.validateAndRepairMonsterData();
        }
        
      } catch (error) {
        // Silent error handling for data validation
      }
    },

    autoEnableMJModeInDevelopment() {
      try {
        // Better detection: Check if we're in standalone mode
        // Standalone mode sets window.STANDALONE_VERSION = true in the build
        const isStandalone = window.STANDALONE_VERSION === true;
        
        
        if (!isStandalone) {
          
          // Enable MJ mode (not dev mode!) automatically in development
          if (!this.state.isMJ) {
            this.state.isMJ = true;
            
            // Update MJ button visual if available and regenerate TOC
            if (JdrApp.modules.router && JdrApp.modules.router.updateMJButtonVisual) {
              JdrApp.modules.router.updateMJButtonVisual();
              JdrApp.modules.router.generateTOC();
              
              // Refresh current page if it's tables-tresors to show edit buttons
              const currentHash = window.location.hash;
              if (currentHash === '#/tables-tresors') {
                setTimeout(() => {
                  if (JdrApp.modules.router && JdrApp.modules.router.renderTablesTresorsPage) {
                    JdrApp.modules.router.renderTablesTresorsPage();
                  }
                }, 200);
              }
              
            } else {
              // Router not ready yet, retry
              setTimeout(() => this.autoEnableMJModeInDevelopment(), 1000);
              return;
            }
            
          }
        }
      } catch (error) {
        // Retry once more after error
        setTimeout(() => this.autoEnableMJModeInDevelopment(), 2000);
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.JdrApp.init());
  } else {
    window.JdrApp.init();
  }

})();