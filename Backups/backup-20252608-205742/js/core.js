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
      editedData: {}
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
        await this.loadData();
        await this.loadContent();
        this.initializeModules();
        
        // Execute data validation after all modules are loaded
        setTimeout(() => {
          this.validateDataIntegrity();
        }, 500);
      } catch (error) {
        console.error('Failed to initialize JdrApp:', error);
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
          
          // Safety check - if MONSTRES is not an array, it might be page config
          if (!Array.isArray(monstres)) {
            console.warn('window.MONSTRES is not an array, clearing corrupted data:', monstres);
            this.clearCorruptedMonsterData();
            monstres = [];
          }
          
          const staticPagesData = window.STATIC_PAGES;
          const staticPagesConfig = window.STATIC_PAGES_CONFIG || {};
          
          this.data.SORTS = sorts;
          this.data.CLASSES = classes;
          this.data.DONS = dons;
          this.data.OBJETS = objets;
          this.data.MONSTRES = monstres;
          this.data.STATIC_PAGES = staticPagesData;
          this.data.STATIC_PAGES_CONFIG = staticPagesConfig;
          
          window.SORTS = sorts;
          window.CLASSES = classes;
          window.DONS = dons;
          window.OBJETS = objets;
          window.MONSTRES = monstres;
          window.STATIC_PAGES = staticPagesData;
          window.STATIC_PAGES_CONFIG = staticPagesConfig;
          
          // Load stored edits AFTER setting up the data structure
          this.loadStoredEditsEarly();
          
          // Initialize default filters for objects
          this.initializeDefaultFilters();
          return;
        }
        
        // Development mode - fetch files
        const [sorts, classes, dons, objets, monstres, staticPagesConfig, tocStructure] = await Promise.all([
          fetch('data/sorts.json').then(r => r.json()),
          fetch('data/classes.json').then(r => r.json()),
          fetch('data/dons.json').then(r => r.json()),
          fetch('data/objets.json').then(r => r.json()),
          fetch('data/monstres.json').then(r => r.json()),
          fetch('data/static-pages-config.json').then(r => r.json()),
          fetch('data/toc-structure.json').then(r => r.json())
        ]);

        const staticPagesData = {};
        const activePages = staticPagesConfig.pages.filter(page => page.active);
        
        for (const pageConfig of activePages) {
          try {
            const pageData = await fetch(`data/${pageConfig.file}`).then(r => r.json());
            staticPagesData[pageConfig.id] = pageData;
          } catch (error) {
            console.warn(`Failed to load static page ${pageConfig.id}:`, error);
          }
        }

        this.data.SORTS = sorts;
        this.data.CLASSES = classes;
        this.data.DONS = dons;
        this.data.OBJETS = objets;
        this.data.MONSTRES = monstres;
        this.data.STATIC_PAGES = staticPagesData;
        this.data.STATIC_PAGES_CONFIG = staticPagesConfig;
        this.data.TOC_STRUCTURE = tocStructure;

        window.SORTS = sorts;
        window.CLASSES = classes;
        window.DONS = dons;
        window.OBJETS = objets;
        window.MONSTRES = monstres;
        window.STATIC_PAGES = this.data.STATIC_PAGES;
        window.STATIC_PAGES_CONFIG = this.data.STATIC_PAGES_CONFIG;
        window.TOC_STRUCTURE = this.data.TOC_STRUCTURE;
        
        // Load stored edits in development mode (after data is loaded)
        this.loadStoredEditsEarly();
        
        // Initialize default filters for objects
        this.initializeDefaultFilters();
      } catch (error) {
        console.error('Failed to load data:', error);
        throw error;
      }
    },

    async loadContent() {
      try {
        const viewsDiv = document.getElementById('views');
        if (viewsDiv) {
          const loadingDiv = document.getElementById('app-loading');
          if (loadingDiv) {
            loadingDiv.innerHTML = '<!-- Content will be generated by renderer -->';
          }
        } else {
          const contentHTML = await this.getContentHTML();
          const loadingDiv = document.getElementById('app-loading');
          if (loadingDiv) {
            loadingDiv.outerHTML = contentHTML;
          }
        }
      } catch (error) {
        console.error('Failed to load content:', error);
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
                <div class="searchbar">
                  <input autocomplete="off" id="search" placeholder="Rechercher une règle, une classe…">
                  <button class="btn" id="clear" title="Effacer">✖</button>
                </div>
                <div class="tools">
                  <button class="btn small" id="devToggle" title="Activer/désactiver le mode développeur">🛠 Dev Mode: OFF</button>
                </div>
                <div class="dev-toolbox" id="devToolbox" style="display: none;">
                  <!-- Dev toolbox content will be injected here -->
                </div>
                <div class="toc" id="toc">
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
      if (this.utils.events.init) this.utils.events.init();
      if (this.utils.dom.init) this.utils.dom.init();
      if (this.modules.images.init) this.modules.images.init();
      if (this.modules.renderer.init) this.modules.renderer.init();
      if (this.modules.router.init) this.modules.router.init();
      if (this.modules.editor.init) this.modules.editor.init();
      if (this.modules.storage.init) this.modules.storage.init();
      if (this.modules.ui.init) this.modules.ui.init();
    },

    // Force reload JSON data (clear localStorage cache)
    forceReloadData() {
      // Effacer seulement les éditions temporaires
      localStorage.removeItem('jdr-bab-edits');
      localStorage.removeItem('jdr-bab-last-modified');
      window.location.reload();
    },

    // Clear corrupted localStorage data specifically for monsters
    clearCorruptedMonsterData() {
      console.log('Clearing corrupted monster data from localStorage');
      const edits = JSON.parse(localStorage.getItem('jdr-bab-edits') || '{}');
      
      // Remove any MONSTRES data that might be corrupted
      if (edits.MONSTRES) {
        delete edits.MONSTRES;
        localStorage.setItem('jdr-bab-edits', JSON.stringify(edits));
        console.log('Removed corrupted MONSTRES from localStorage');
      }
      
      // Also clear any other monster-related storage
      if (edits.monster) {
        delete edits.monster;
        localStorage.setItem('jdr-bab-edits', JSON.stringify(edits));
        console.log('Removed corrupted monster data from localStorage');
      }
    },

    // Public method to manually clear storage via console
    clearMonsterStorage() {
      this.clearCorruptedMonsterData();
      this.forceReloadData();
    },

    // Initialize default filters for objects on page load
    initializeDefaultFilters() {
      try {
        // Only initialize if OBJETS exists and ContentTypes is available
        if (window.OBJETS && window.ContentTypes?.objet?.filterConfig) {
          const defaultTags = window.ContentTypes.objet.filterConfig.defaultVisibleTags || [];
          
          // Initialize filterSettings only if it doesn't exist or is empty
          if (!window.OBJETS.filterSettings || !window.OBJETS.filterSettings.visibleTags) {
            window.OBJETS.filterSettings = {
              visibleTags: [...defaultTags], // Active filters (defaults only)
              displayedFilterButtons: [...defaultTags] // Displayed filter buttons (defaults initially)
            };
          }
          
          // Ensure displayedFilterButtons exists even if visibleTags already existed
          if (!window.OBJETS.filterSettings.displayedFilterButtons) {
            window.OBJETS.filterSettings.displayedFilterButtons = [...defaultTags];
          }
          
        }
      } catch (error) {
        console.error('Error initializing default filters:', error);
      }
    },

    // Validate data integrity on application startup
    validateDataIntegrity() {
      // console.log('🔍 Validating data integrity on startup...');
      
      try {
        // Validate monster data if available
        if (window.MONSTRES && Array.isArray(window.MONSTRES) && JdrApp.modules.images) {
          // Force sync monster images and paths
          const correctedCount = JdrApp.modules.images.forceSyncMonsterImages();
          
          if (correctedCount > 0) {
            // console.log(`✅ Startup validation: ${correctedCount} monster image paths corrected`);
          }
        }
        
        // Validate UnifiedEditor if available
        if (JdrApp.modules.editor && JdrApp.modules.editor.validateAndRepairMonsterData) {
          JdrApp.modules.editor.validateAndRepairMonsterData();
        }
        
        // console.log('✅ Data integrity validation completed');
        
      } catch (error) {
        console.error('❌ Error during data integrity validation:', error);
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