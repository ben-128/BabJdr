// ============================================================================
// JDR-BAB APPLICATION - ROUTER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // ROUTING SYSTEM
  // ========================================
  JdrApp.modules.router = {
    currentRoute: '',
    
    init() {
      
      // Set up route change listeners
      JdrApp.utils.events.onHashChange(() => this.parseRoute());
      JdrApp.utils.events.onDOMReady(() => this.parseRoute());
      
      // Listen for dev mode changes to refresh objects page
      if (window.EventBus && window.Events) {
        EventBus.on(Events.EDITOR_TOGGLE, (payload) => {
          const currentHash = window.location.hash;
          console.log('🔄 Router: Dev mode changed to:', payload.enabled, 'Current page:', currentHash);
          
          // Refresh objects page specifically when dev mode changes
          if (currentHash === '#/objets') {
            setTimeout(() => {
              console.log('🗺️ Router: Force refreshing objects page after dev mode change');
              // Force a complete refresh by setting the flag
              this._forceObjectsRefresh = true;
              this.renderObjectsPage();
            }, 150);
          }
        });
      }
    },
    
    parseRoute() {
      const hash = location.hash.replace('#/', '');
      const page = hash || 'creation';
      const exists = JdrApp.utils.dom.$(`article[data-page="${page}"]`);
      
      
      this.currentRoute = page;
      
      // Handle dynamic category routing
      // Fix: check if exists is falsy OR empty NodeList
      const shouldUseRouter = !exists || (exists.length === 0);
      
      if (shouldUseRouter) {
        if (this.handleDynamicRoute(page)) {
          return; // Route was handled dynamically
        }
      }
      
      this.show(exists ? page : 'creation');
    },

    handleDynamicRoute(page) {
      // Handle sorts-* routes
      if (page.startsWith('sorts-')) {
        return this.renderDynamicCategory('sorts', 'spell', page);
      }
      
      // Handle dons-* routes  
      if (page.startsWith('dons-')) {
        return this.renderDynamicCategory('dons', 'don', page);
      }
      
      // Handle single objets page (objects now use unified page with tag filtering)
      if (page === 'objets') {
        return this.renderObjectsPage();
      }
      
      // Handle collections-objets page
      if (page === 'collections-objets') {
        return this.renderCollectionsObjectsPage();
      }
      
      // Handle single monstres page (monsters now use unified page with tag filtering)
      if (page === 'monstres') {
        return this.renderMonstersPage();
      }
      
      // Handle single tables-tresors page  
      if (page === 'tables-tresors') {
        return this.renderTablesTresorsPage();
      }
      
      return false; // Route not handled
    },

    renderDynamicCategory(prefix, type, page) {
      const categoryId = page.replace(`${prefix}-`, '');
      const dataKey = prefix.toUpperCase();
      const dataSource = window[dataKey];
      
      if (!dataSource) return false;
      
      const category = dataSource.find(cat => 
        JdrApp.utils.data.sanitizeId(cat.nom) === categoryId
      );
      
      if (category) {
        // Render the category page dynamically
        JdrApp.modules.renderer.renderCategoryPage(type, category);
        
        // Update active states
        this.updateActiveStates(page);
        
        return true;
      }
      
      return false;
    },

    updateActiveStates(page) {
      // Remove active class from all articles and links
      document.querySelectorAll('article').forEach(a => a.classList.remove('active'));
      document.querySelectorAll('.toc a').forEach(a => a.classList.remove('active'));
      
      // Set active link in TOC
      const activeLink = document.querySelector(`a[href="#/${page}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
        
        // Expand parent category if needed
        const category = activeLink.closest('.toc-category');
        if (category) {
          category.classList.remove('collapsed');
        }
      }
    },
    
    show(page) {
      document.querySelectorAll('article').forEach(a => a.classList.remove('active'));
      const target = document.querySelector(`article[data-page="${page}"]`);
      if (target) {
        target.classList.add('active');
      }
      
      document.querySelectorAll('.toc a').forEach(a => a.classList.remove('active'));
      const activeLink = document.querySelector(`a[href="#/${page}"]`);
      if (activeLink) activeLink.classList.add('active');

      
      // Ensure edit buttons state is properly applied after navigation
      if (!window.STANDALONE_VERSION && JdrApp.modules.editor) {
        setTimeout(() => {
          if (JdrApp.modules.editor.isDevMode) {
            JdrApp.modules.editor.forceShowAllEditButtons();
          } else {
            JdrApp.modules.editor.forceHideAllEditButtons();
          }
        }, 50);
      }
    },
    
    navigate(route) {
      location.hash = `#/${route}`;
      // Force parseRoute() in case hashchange event doesn't fire
      setTimeout(() => {
        this.parseRoute();
      }, 10);
    },
    
    getCurrentRoute() {
      return this.currentRoute;
    },
    
    // Generate table of contents based on hierarchical structure
    generateTOC() {
      const tocContainer = document.querySelector('#toc');
      if (!tocContainer) return;

      if (!window.TOC_STRUCTURE) {
        console.warn('TOC_STRUCTURE not loaded, falling back to basic TOC');
        this.generateBasicTOC();
        return;
      }

      const tocHTML = `
        <h4>Sommaire</h4>
        ${window.TOC_STRUCTURE.sections
          .filter(section => !section.requiresMJ || window.JdrApp.state.isMJ)
          .map(section => this.generateTOCSection(section)).join('')}
        <div class="mj-toggle-container" style="margin: 1rem 0; text-align: center; border-top: 2px solid var(--rule); padding-top: 1rem;">
          <button id="mjToggleBtn" class="btn-base btn-small" style="background: var(--bronze); color: white; border-color: var(--bronze); position: relative;">
            🎭 Maître de jeu
            <span id="mjStatusIndicator" style="position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; border-radius: 50%; background: #dc2626; border: 2px solid white; display: none;"></span>
          </button>
        </div>
      `;
      
      tocContainer.innerHTML = tocHTML;
      
      // Attacher les événements directement aux éléments après création
      this.attachFoldoutEvents();
      
      // Initialiser les hauteurs dynamiques pour toutes les sections ouvertes
      this.initializeDynamicHeights();
      
      // Ajouter l'event listener pour le bouton MJ
      this.setupMJToggle();
    },

    initializeDynamicHeights() {
      // Calculer et appliquer les hauteurs dynamiques pour toutes les sections non-collapsées
      document.querySelectorAll('.toc-section:not(.collapsed) .toc-section-content').forEach(content => {
        const childCount = content.querySelectorAll('a, .toc-category').length;
        const itemHeight = 50; // Hauteur approximative par élément
        const baseHeight = 100; // Hauteur de base pour le padding
        const dynamicHeight = Math.max(500, (childCount * itemHeight) + baseHeight);
        
        content.style.maxHeight = `${dynamicHeight}px`;
      });
    },

    setupMJToggle() {
      const mjBtn = document.getElementById('mjToggleBtn');
      if (!mjBtn) return;

      // Initialize visual state based on current MJ status
      this.updateMJButtonVisual();

      const handleMJToggle = () => {
        if (window.JdrApp.state.isMJ) {
          // Déjà en mode MJ, désactiver
          window.JdrApp.state.isMJ = false;
          this.updateMJButtonVisual();
          this.generateTOC(); // Régénérer le TOC pour cacher les sections MJ
          
          // Refresh objects display if currently on objects page
          this.refreshObjectsPageIfActive();
        } else {
          // Demander confirmation avant d'activer le mode MJ
          this.showMJConfirmation(() => {
            window.JdrApp.state.isMJ = true;
            this.updateMJButtonVisual();
            this.generateTOC(); // Régénérer le TOC pour afficher les sections MJ
            
            // Refresh objects display if currently on objects page
            this.refreshObjectsPageIfActive();
          });
        }
      };

      // Ajouter support tactile pour mobile
      mjBtn.addEventListener('click', handleMJToggle);
      mjBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleMJToggle();
      });
    },

    attachFoldoutEvents() {
      // Attacher les événements directement aux headers de section
      document.querySelectorAll('.toc-section-header').forEach(header => {
        header.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const section = header.closest('.toc-section');
          if (section) {
            const wasCollapsed = section.classList.contains('collapsed');
            section.classList.toggle('collapsed');
            const isCollapsed = section.classList.contains('collapsed');
            
            const toggle = section.querySelector('.toc-section-toggle');
            if (toggle) {
              toggle.textContent = isCollapsed ? '▶' : '▼';
            }
            
            const content = section.querySelector('.toc-section-content');
            if (content) {
              // Force les styles directement en JavaScript pour compatibilité standalone
              if (isCollapsed) {
                content.style.maxHeight = '0px';
                content.style.opacity = '0';
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
                content.style.overflow = 'hidden';
              } else {
                // Calculer dynamiquement la hauteur nécessaire en fonction du contenu
                const childCount = content.querySelectorAll('a, .toc-category').length;
                const itemHeight = 50; // Hauteur approximative par élément (incluant padding et marge)
                const baseHeight = 100; // Hauteur de base pour le padding
                const dynamicHeight = Math.max(500, (childCount * itemHeight) + baseHeight);
                
                content.style.maxHeight = `${dynamicHeight}px`;
                content.style.opacity = '1';
                content.style.paddingTop = '';
                content.style.paddingBottom = '';
                content.style.overflow = 'visible';
              }
            }
          }
        });
      });

      // Attacher les événements aux liens de catégorie
      document.querySelectorAll('.toc-category > a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const category = link.closest('.toc-category');
          if (category) {
            category.classList.toggle('collapsed');
          }
        });
      });

      // Attacher les événements aux liens de navigation normaux
      document.querySelectorAll('.toc a:not(.toc-category > a)').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const route = link.getAttribute('data-route');
          if (route) {
            // Special handling for objects page - force refresh when navigating to it
            if (route === 'objets') {
              // Set a flag to force refresh objects page after navigation
              JdrApp.modules.router._forceObjectsRefresh = true;
            }
            JdrApp.modules.router.navigate(route);
          }
        });
      });
    },

    updateMJButtonVisual() {
      const mjBtn = document.getElementById('mjToggleBtn');
      const mjIndicator = document.getElementById('mjStatusIndicator');
      
      if (!mjBtn) return;
      
      if (window.JdrApp.state.isMJ) {
        // Mode MJ activé - bouton doré avec indicateur vert
        mjBtn.style.background = 'var(--gold)';
        mjBtn.style.borderColor = 'var(--gold)';
        mjBtn.innerHTML = '🎭 Mode MJ activé <span id="mjStatusIndicator" style="position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; border-radius: 50%; background: #16a34a; border: 2px solid white; display: inline-block;"></span>';
      } else {
        // Mode normal - bouton bronze sans indicateur
        mjBtn.style.background = 'var(--bronze)';
        mjBtn.style.borderColor = 'var(--bronze)';
        mjBtn.innerHTML = '🎭 Maître de jeu <span id="mjStatusIndicator" style="position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; border-radius: 50%; background: #dc2626; border: 2px solid white; display: none;"></span>';
      }
    },

    showMJConfirmation(onConfirm) {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      modal.innerHTML = `
        <div style="
          background: var(--card);
          border: 3px solid var(--bronze);
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          margin: 1rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        ">
          <h3 style="color: var(--bronze); margin-top: 0;">⚠️ Mode Maître de jeu</h3>
          <p style="margin: 1.5rem 0; line-height: 1.6;">
            Êtes-vous sûr de vouloir activer le mode Maître de jeu?<br><br>
            <strong style="color: var(--bronze);">Si vous êtes juste un joueur, vous risquez d'être spoilé!</strong>
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
            <button id="mjConfirmYes" class="btn-base" style="background: var(--bronze); color: white; border-color: var(--bronze);">
              Oui, je suis MJ
            </button>
            <button id="mjConfirmNo" class="btn-base" style="background: var(--rule); color: var(--accent-ink); border-color: var(--rule);">
              Non, annuler
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelector('#mjConfirmYes').addEventListener('click', () => {
        document.body.removeChild(modal);
        onConfirm();
      });
      
      modal.querySelector('#mjConfirmNo').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Fermer en cliquant sur le fond
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    },

    generateTOCSection(section) {
      const sectionClass = section.collapsed ? 'toc-section collapsed' : 'toc-section';
      const toggleIcon = section.collapsed ? '▶' : '▼';
      
      return `
        <div class="${sectionClass}" data-section="${section.id}">
          <div class="toc-section-header">
            <span class="toc-section-title">${section.title}</span>
            <span class="toc-section-toggle">${toggleIcon}</span>
          </div>
          <div class="toc-section-content">
            ${section.items.map(item => this.generateTOCItem(item)).join('')}
          </div>
        </div>
      `;
    },

    generateTOCItem(item) {
      if (item.type === 'page') {
        return `<a data-route="${item.id}" href="#/${item.id}" class="">${item.icon} ${item.title}</a>`;
      } else if (item.type === 'category') {
        return this.generateTOCCategory(item);
      }
      return '';
    },

    generateTOCCategory(item) {
      const dataSource = window[item.items]; // CLASSES, SORTS, DONS
      if (!dataSource) return '';

      if (item.id === 'classes') {
        return `
          <div class="toc-category">
            <a data-route="classes" href="#/classes" class="">${item.icon} ${item.title}</a>
            <div class="toc-sub">
              ${dataSource.map(classe => 
                `<a data-route="${JdrApp.utils.data.sanitizeId(classe.nom)}" href="#/${JdrApp.utils.data.sanitizeId(classe.nom)}" class="">${this.getClassIcon(classe.nom)} ${classe.nom}</a>`
              ).join('')}
            </div>
          </div>
        `;
      } else if (item.id === 'sorts') {
        return `
          <div class="toc-category">
            <a data-route="sorts" href="#/sorts">${item.icon} ${item.title}</a>
            <div class="toc-sub">
              ${dataSource.map(category => 
                `<a data-route="sorts-${JdrApp.utils.data.sanitizeId(category.nom)}" href="#/sorts-${JdrApp.utils.data.sanitizeId(category.nom)}" class="">${this.getSortCategoryIcon(category.nom)} ${category.nom}</a>`
              ).join('')}
            </div>
          </div>
        `;
      } else if (item.id === 'dons') {
        return `
          <div class="toc-category">
            <a data-route="dons" href="#/dons" class="">${item.icon} ${item.title}</a>
            <div class="toc-sub">
              ${dataSource.map(category => 
                `<a data-route="dons-${JdrApp.utils.data.sanitizeId(category.nom)}" href="#/dons-${JdrApp.utils.data.sanitizeId(category.nom)}" class="">${this.getDonCategoryIcon(category.nom)} ${category.nom}</a>`
              ).join('')}
            </div>
          </div>
        `;
      }

      return '';
    },

    generateBasicTOC() {
      const tocContainer = document.querySelector('#toc');
      if (!tocContainer) return;

      const tocHTML = `
        <h4>Sommaire</h4>
        <a class="" data-route="creation" href="#/creation">🧙‍♂️ Création d'un personnage</a>
        
        <div class="toc-category">
          <a data-route="classes" href="#/classes" class="">⚔️ Classes</a>
          <div class="toc-sub">
            ${window.CLASSES ? window.CLASSES.map(classe => 
              `<a data-route="${JdrApp.utils.data.sanitizeId(classe.nom)}" href="#/${JdrApp.utils.data.sanitizeId(classe.nom)}" class="">${this.getClassIcon(classe.nom)} ${classe.nom}</a>`
            ).join('') : ''}
          </div>
        </div>
        
        <div class="toc-category">
          <a data-route="sorts" href="#/sorts">🔮 Sorts</a>
          <div class="toc-sub">
            ${window.SORTS ? window.SORTS.map(category => 
              `<a data-route="sorts-${JdrApp.utils.data.sanitizeId(category.nom)}" href="#/sorts-${JdrApp.utils.data.sanitizeId(category.nom)}" class="">${this.getSortCategoryIcon(category.nom)} ${category.nom}</a>`
            ).join('') : ''}
          </div>
        </div>
        
        <div class="toc-category">
          <a data-route="dons" href="#/dons" class="">🎖️ Dons</a>
          <div class="toc-sub">
            ${window.DONS ? window.DONS.map(category => 
              `<a data-route="dons-${JdrApp.utils.data.sanitizeId(category.nom)}" href="#/dons-${JdrApp.utils.data.sanitizeId(category.nom)}" class="">${this.getDonCategoryIcon(category.nom)} ${category.nom}</a>`
            ).join('') : ''}
          </div>
        </div>
        
        <a data-route="objets" href="#/objets" class="">📦 Objets</a>
        
        <a data-route="elements" href="#/elements" class="">🌟 Éléments</a>
        <a data-route="stats" href="#/stats" class="">📊 Statistiques</a>
        <a data-route="competences-tests" href="#/competences-tests" class="">🎯 Compétences & Tests</a>
        <a data-route="etats" href="#/etats" class="">⚡ Etats</a>
      `;
      
      tocContainer.innerHTML = tocHTML;
    },
    
    renderObjectsPage() {
      if (!window.OBJETS) return false;
      
      // Ensure the page is shown as active first
      this.show('objets');
      
      // Force complete regeneration if coming from navigation or MJ mode change
      const shouldForceRefresh = this._forceObjectsRefresh || false;
      this._forceObjectsRefresh = false; // Reset the flag
      
      // Force complete regeneration of the objects page content
      // This ensures that objects filtered out by MJ restrictions are now properly generated in the DOM
      setTimeout(() => {
        if (JdrApp.modules.renderer && JdrApp.modules.renderer.regenerateCurrentPage) {
          JdrApp.modules.renderer.regenerateCurrentPage();
        }
      }, shouldForceRefresh ? 100 : 50); // Slightly longer delay when forced refresh
      
      return true;
    },


    // Helper method to refresh objects page if currently active
    refreshObjectsPageIfActive() {
      const currentHash = window.location.hash;
      if (currentHash === '#/objets' || currentHash === '#objets') {
        setTimeout(() => {
          // Force full page regeneration to ensure objects filtered by MJ mode are now visible
          // This calls renderObjectsPage() which will regenerate the entire page with current filters
          this.renderObjectsPage();
        }, 150); // Slightly longer delay to ensure MJ state is updated
      }
    },
    
    getClassIcon(className) {
      const icons = {
        'Guerrier': '🗡️',
        'Mage': '🔮',
        'Prêtre': '⛪',
        'Rôdeur': '🏃',
        'Enchanteur': '✨'
      };
      return icons[className] || '⚔️';
    },
    
    getSortCategoryIcon(categoryName) {
      const icons = {
        'Sorts de Mage': '🔮',
        'Sorts de Prêtre': '⛪',
        'Sorts d\'Enchanteur': '✨',
        'Sorts de Monstres': '💀'
      };
      return icons[categoryName] || '🔮';
    },
    
    getDonCategoryIcon(categoryName) {
      const icons = {
        'Guerrier': '🗡️',
        'Mage': '🔮',
        'Pretre': '⛪',  // Sans accent comme dans les données
        'Prêtre': '⛪',  // Avec accent au cas où
        'Rôdeur': '🏃',
        'Enchanteur': '✨',
        'Généraux': '🎖️',
        'Generaux': '🎖️'  // Sans accent comme dans les données
      };
      return icons[categoryName] || '🎖️';
    },

    getMonstreCategoryIcon(categoryName) {
      const icons = {
        'Forêt': '🌲',
        'Foret': '🌲',  // Sans accent
        'Donjon': '🏰',
        'Dragons': '🐉',
        'Mort-vivants': '💀',
        'Démons': '👹',
        'Demons': '👹',  // Sans accent
        'Animaux': '🦁',
        'Humanoïdes': '🧌',
        'Humanoïdes': '🧌'  // Sans accent
      };
      return icons[categoryName] || '👹';
    },
    
    getObjetCategoryIcon(categoryName) {
      const icons = {
        'Armes': '⚔️',
        'Armures': '🛡️',
        'Potions': '🧪',
        'Herbes Magiques': '🌿',
        'Objets Magiques': '✨',
        'Accessoires': '💍',
        'Consommables': '🍞',
        'Composants': '🔮',
        'Outils': '🔨'
      };
      return icons[categoryName] || '📦';
    },

    renderObjectsPage() {
      // Use PageBuilder to generate the objets page dynamically
      JdrApp.modules.renderer.renderUnifiedContentPage('objet', window.OBJETS || []);
      this.updateActiveStates('objets');
      this.show('objets'); // Activer la page
      return true;
    },

    renderMonstersPage() {
      // Use PageBuilder to generate the monstres page dynamically
      JdrApp.modules.renderer.renderUnifiedContentPage('monster', window.MONSTRES || []);
      this.updateActiveStates('monstres');
      this.show('monstres'); // Activer la page
      return true;
    },
    
    renderTablesTresorsPage() {
      // Use PageBuilder to generate the tables-tresors page dynamically
      JdrApp.modules.renderer.renderUnifiedContentPage('tableTresor', window.TABLES_TRESORS || { tables: [] });
      this.updateActiveStates('tables-tresors');
      this.show('tables-tresors'); // Activer la page
      return true;
    },

    renderCollectionsObjectsPage() {
      // Safety check - if collections data is not available, try to wait a bit
      if (!window.COLLECTIONS || !window.COLLECTIONS.collections || window.COLLECTIONS.collections.length === 0) {
        setTimeout(() => this.renderCollectionsObjectsPage(), 100);
        return false;
      }
      
      // Create or find the page element
      let pageElement = document.getElementById('collections-objets');
      
      // If the page doesn't exist, create it
      if (!pageElement) {
        // console.log('📄 Creating new page element...');
        pageElement = document.createElement('article');
        pageElement.id = 'collections-objets';
        pageElement.setAttribute('data-page', 'collections-objets');
        pageElement.className = 'page';
        
        // Insert it into the views container
        const viewsContainer = document.querySelector('#views');
        // console.log('📦 Views container found:', !!viewsContainer);
        
        if (viewsContainer) {
          viewsContainer.appendChild(pageElement);
          // console.log('📄 Page element added to views');
        } else {
          console.error('Views container not found');
          return false;
        }
      }
      
      // Create the collections page content
      const collectionsContent = `
        <div class="page-header">
          <h1>📚 Collections d'Objets</h1>
          <div class="editable-section" data-section-type="pageDescription">
            <p class="editable" data-edit-type="generic" data-edit-section="description" data-item-identifier="collections-objets" data-page-type="collections">${this.getCollectionsDescription()}</p>
            <button class="edit-btn" data-edit-type="collections-description" style="display: none;">✏️ Modifier</button>
          </div>
        </div>
        
        <div class="collections-search">
          <div class="search-container">
            <input 
              type="text" 
              id="collection-search-input" 
              placeholder="Tapez le nom d'une collection..." 
              class="search-input"
            />
            <button id="collection-search-btn" class="search-button">🔍 Rechercher</button>
          </div>
        </div>
        
        <div id="collection-results" class="collection-results" style="display: none;">
          <div id="collection-header" class="collection-header"></div>
          <div id="tag-filters" class="tag-filters"></div>
          <div id="collection-items" class="collection-items"></div>
        </div>
        
        <div id="available-collections" class="available-collections" style="display: none;">
          <h2>Collections disponibles</h2>
          <div class="collections-grid">
            <!-- Collections will be generated dynamically -->
          </div>
        </div>
      `;
      
      // Insert content into the page
      pageElement.innerHTML = collectionsContent;
      this.setupCollectionsEventListeners();
      
      // Show collections grid in dev mode, auto-fill search in normal mode
      const availableCollections = document.getElementById('available-collections');
      const searchInput = document.getElementById('collection-search-input');
      const isDevMode = this.isDevModeActive();
      
      // console.log('🔧 Collections page debug:', {
      //   isDevMode,
      //   availableCollections: !!availableCollections,
      //   bodyClass: document.body.className
      // });
      
      // Generate collections dynamically
      this.generateCollectionsGrid();
      
      if (availableCollections) {
        if (isDevMode) {
          // console.log('📋 Showing collections in dev mode');
          availableCollections.style.display = 'block';
          // In dev mode, show all collections without needing search
          // But keep the search functional for filtering
        } else {
          // console.log('🔒 Hiding collections in normal mode');
          availableCollections.style.display = 'none';
          // In normal mode, collections are hidden - user must search manually
        }
      } else {
        console.error('❌ available-collections element not found');
      }
      
      // Setup dev mode change listener
      this.setupDevModeListener();
      
      // Show and activate page after content is inserted
      this.show('collections-objets');
      this.updateActiveStates('collections-objets');
      
      // Ensure the page is visible regardless of dev mode
      if (pageElement) {
        pageElement.classList.add('active');
      }
      
      return true;
    },

    setupCollectionsEventListeners() {
      // console.log('Setting up collections event listeners...');
      const searchInput = document.getElementById('collection-search-input');
      const searchBtn = document.getElementById('collection-search-btn');
      const collectionCards = document.querySelectorAll('.collection-card');
      
      // console.log('Found elements:', {
      //   searchInput: !!searchInput,
      //   searchBtn: !!searchBtn,
      //   collectionCards: collectionCards.length
      // });
      
      // Search functionality
      const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          this.displayCollection(searchTerm);
        }
      };
      
      searchBtn.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          performSearch();
        }
      });
      
      // Collection card clicks
      collectionCards.forEach(card => {
        card.addEventListener('click', () => {
          const collection = card.getAttribute('data-collection');
          searchInput.value = collection;
          this.displayCollection(collection);
        });
      });
    },

    displayCollection(collectionName) {
      if (!window.OBJETS || !window.OBJETS.objets || !window.COLLECTIONS || !window.COLLECTIONS.collections) return;
      
      // Find the collection by name or ID
      const collection = window.COLLECTIONS.collections.find(coll => 
        coll.id === collectionName || 
        coll.nom.toLowerCase() === collectionName.toLowerCase()
      );
      
      if (!collection) {
        this.showCollectionNotFound(collectionName);
        return;
      }
      
      // Filter objects by collection (using object numbers/IDs defined in collection)
      const filteredObjects = window.OBJETS.objets.filter(obj => {
        return collection.objets && collection.objets.includes(obj.numero);
      });
      
      const resultsContainer = document.getElementById('collection-results');
      const headerContainer = document.getElementById('collection-header');
      const itemsContainer = document.getElementById('collection-items');
      const tagFiltersContainer = document.getElementById('tag-filters');
      const availableCollections = document.getElementById('available-collections');
      
      // Hide available collections and show results
      if (availableCollections) {
        availableCollections.style.display = 'none';
      }
      if (resultsContainer) {
        resultsContainer.style.display = 'block';
      }
      
      const isDevMode = JdrApp.utils.isDevMode();
      
      // Update header with collection info
      if (headerContainer) {
        headerContainer.innerHTML = `
          ${isDevMode ? `
            <div class="collection-navigation" style="margin-bottom: 1rem;">
              <button class="btn small back-to-collections-btn" style="background: #6B7280;">← Retour aux collections</button>
            </div>
          ` : ''}
          <h2>${collection.icon} ${collection.nom}</h2>
          <p class="collection-description">${collection.description}</p>
          <p>${filteredObjects.length} objet(s) dans cette collection</p>
          ${isDevMode ? `
            <div class="collection-dev-actions" style="margin-top: 1rem;">
              <button class="btn small add-object-btn" data-collection="${collection.id}">➕ Ajouter un objet à cette collection</button>
              <button class="btn small remove-object-btn" data-collection="${collection.id}">➖ Retirer un objet de cette collection</button>
            </div>
          ` : ''}
        `;
      }
      
      // Get all unique tags from filtered objects for additional filtering
      const allTags = [...new Set(filteredObjects.flatMap(obj => obj.tags || []))];
      
      // Create tag filters if objects have multiple tags
      if (allTags.length > 1 && tagFiltersContainer) {
        tagFiltersContainer.innerHTML = `
          <h3>Filtrer par tag:</h3>
          <div class="tag-buttons">
            <button class="tag-filter-btn active" data-tag="all">Tous</button>
            ${allTags.map(tag => `
              <button class="tag-filter-btn" data-tag="${tag}">${tag}</button>
            `).join('')}
          </div>
        `;
      } else if (tagFiltersContainer) {
        tagFiltersContainer.innerHTML = '';
      }
      
      // Display objects
      this.renderCollectionItems(filteredObjects);
      
      // Setup add/remove object button listeners if in dev mode
      if (isDevMode) {
        const addObjectBtn = document.querySelector('.add-object-btn');
        if (addObjectBtn) {
          addObjectBtn.addEventListener('click', () => {
            const collection = addObjectBtn.getAttribute('data-collection');
            this.addObjectToCollection(collection);
          });
        }
        
        const removeObjectBtn = document.querySelector('.remove-object-btn');
        if (removeObjectBtn) {
          removeObjectBtn.addEventListener('click', () => {
            const collection = removeObjectBtn.getAttribute('data-collection');
            this.removeObjectFromCollection(collection);
          });
        }

        const backToCollectionsBtn = document.querySelector('.back-to-collections-btn');
        if (backToCollectionsBtn) {
          backToCollectionsBtn.addEventListener('click', () => {
            this.showCollectionsGrid();
          });
        }
      }
      
      // Tag filter event listeners
      document.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          // Update active state
          document.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          const selectedTag = btn.getAttribute('data-tag');
          let itemsToShow = filteredObjects;
          
          if (selectedTag !== 'all') {
            itemsToShow = filteredObjects.filter(obj => 
              obj.tags && obj.tags.includes(selectedTag)
            );
          }
          
          this.renderCollectionItems(itemsToShow);
        });
      });
    },

    showCollectionNotFound(collectionName) {
      const resultsContainer = document.getElementById('collection-results');
      const headerContainer = document.getElementById('collection-header');
      const itemsContainer = document.getElementById('collection-items');
      const tagFiltersContainer = document.getElementById('tag-filters');
      const availableCollections = document.getElementById('available-collections');
      
      // Show error message for non-existent collection
      if (availableCollections) {
        availableCollections.style.display = 'none';
      }
      if (resultsContainer) {
        resultsContainer.style.display = 'block';
      }
      
      if (headerContainer) {
        const isDevMode = this.isDevModeActive();
        headerContainer.innerHTML = `
          <div class="collection-error">
            <h2>❌ Collection introuvable</h2>
            <p>Aucune collection nommée "<strong>${collectionName}</strong>" n'a été trouvée.</p>
            ${isDevMode ? 
              `<p>Les collections disponibles sont listées ci-dessous.</p>` : 
              `<p>Vérifiez l'orthographe ou contactez un administrateur pour connaître les collections disponibles.</p>`
            }
          </div>
        `;
      }
      
      if (itemsContainer) {
        itemsContainer.innerHTML = '';
      }
      if (tagFiltersContainer) {
        tagFiltersContainer.innerHTML = '';
      }
      
      // Clear search input after delay and show available collections only in dev mode
      setTimeout(() => {
        document.getElementById('collection-search-input').value = '';
        
        // Only show collections grid in dev mode
        const isDevMode = this.isDevModeActive();
        if (availableCollections) {
          availableCollections.style.display = isDevMode ? 'block' : 'none';
        }
        if (resultsContainer) {
          resultsContainer.style.display = 'none';
        }
      }, 3000);
    },

    renderCollectionItems(items) {
      const itemsContainer = document.getElementById('collection-items');
      
      // Multiple ways to detect dev mode for robustness
      const isDevMode = (
        (JdrApp && JdrApp.utils && JdrApp.utils.isDevMode && JdrApp.utils.isDevMode()) ||
        document.body.classList.contains('dev-on') ||
        (JdrApp.modules && JdrApp.modules.editor && JdrApp.modules.editor.isDevMode)
      );
      
      
      // Check if CardBuilder is available
      if (!window.CardBuilder) {
        console.error('CardBuilder not available, falling back to simple display');
        const itemsHTML = items.map(item => `
          <div class="card" data-object-numero="${item.numero}">
            <h4>${item.nom}</h4>
            <p><strong>N°${item.numero}</strong></p>
            <p>${item.description}</p>
            <hr>
            <p>${item.effet}</p>
            <div style="display: flex; justify-content: space-between;">
              <span>${item.prix}</span>
              <span>${item.poids}</span>
            </div>
            ${isDevMode ? `
              <div class="dev-controls" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ccc;">
                <button class="btn small edit-object-btn" data-numero="${item.numero}">✏️ Éditer</button>
                <button class="btn small remove-from-collection-btn" data-numero="${item.numero}" style="background: #f59e0b;">➖ Retirer</button>
                <button class="btn small delete-object-btn" data-numero="${item.numero}" style="background: #ef4444;">🗑️ Supprimer</button>
              </div>
            ` : ''}
          </div>
        `).join('');
        itemsContainer.innerHTML = itemsHTML;
      } else {
        // Use the existing CardBuilder system to ensure consistent formatting and images
        const itemsHTML = items.map(item => {
          let cardHTML = window.CardBuilder.create('objet', item, 'objets').build();
          
          // Add dev controls if in dev mode
          if (isDevMode) {
            // Insert dev controls before the closing </article> tag
            cardHTML = cardHTML.replace('</article>', `
              <div class="dev-controls collection-dev-controls">
                <button class="btn small edit-object-btn" data-numero="${item.numero}">✏️ Éditer</button>
                <button class="btn small remove-from-collection-btn" data-numero="${item.numero}">➖ Retirer de cette collection</button>
                <button class="btn small delete-object-btn" data-numero="${item.numero}">🗑️ Supprimer définitivement</button>
              </div>
            </article>`);
          }
          
          return cardHTML;
        }).join('');
        
        itemsContainer.innerHTML = itemsHTML;
      }
      
      // Add event listeners for dev controls
      if (isDevMode) {
        this.setupCollectionEditControls();
      }
      
      // Auto-load images and manage dev mode buttons after rendering
      setTimeout(() => {
        if (JdrApp.modules.renderer && JdrApp.modules.renderer.autoLoadImages) {
          JdrApp.modules.renderer.autoLoadImages();
        }
        
        // Force apply dev mode classes to ensure CSS rules work
        this.ensureDevModeClasses();
      }, 100);
    },

    setupCollectionEditControls() {
      // Edit object buttons
      const editBtns = document.querySelectorAll('.edit-object-btn');
      const removeBtns = document.querySelectorAll('.remove-from-collection-btn');
      const deleteBtns = document.querySelectorAll('.delete-object-btn');
      
      // console.log('🎛️ Setting up object controls:', {
      //   editBtns: editBtns.length,
      //   removeBtns: removeBtns.length,
      //   deleteBtns: deleteBtns.length
      // });

      editBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const objectNumero = parseInt(btn.getAttribute('data-numero'));
          // console.log('✏️ Edit object clicked:', objectNumero);
          this.editCollectionObject(objectNumero);
        });
      });

      // Remove from collection buttons
      removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const objectNumero = parseInt(btn.getAttribute('data-numero'));
          // console.log('➖ Remove from collection clicked:', objectNumero);
          this.removeObjectFromCurrentCollection(objectNumero);
        });
      });

      // Delete object buttons
      deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const objectNumero = parseInt(btn.getAttribute('data-numero'));
          // console.log('🗑️ Delete object clicked:', objectNumero);
          this.deleteCollectionObject(objectNumero);
        });
      });
    },

    editCollectionObject(objectNumero) {
      // Find the object in the data (normalize comparison)
      const object = window.OBJETS.objets.find(obj => parseInt(obj.numero) === objectNumero);
      if (!object) {
        console.error('Object not found:', objectNumero);
        return;
      }

      // Navigate to the objects page and trigger edit for this specific object
      // This reuses the existing object editing functionality
      window.location.hash = '#/objets';
      
      // Wait for the page to load, then trigger edit
      setTimeout(() => {
        const objectCard = document.querySelector(`[data-numero="${objectNumero}"]`);
        if (objectCard) {
          // Trigger the existing edit functionality
          const editableElements = objectCard.querySelectorAll('.editable');
          if (editableElements.length > 0) {
            // Focus on the first editable element to start editing
            editableElements[0].click();
          }
        }
      }, 500);
    },

    removeObjectFromCurrentCollection(objectNumero) {
      // Find the object in the data (normalize comparison)
      const object = window.OBJETS.objets.find(obj => parseInt(obj.numero) === objectNumero);
      if (!object) {
        console.error('Object not found:', objectNumero);
        return;
      }

      // Determine which collection we're currently viewing
      const searchInput = document.getElementById('collection-search-input');
      const currentCollectionName = searchInput ? searchInput.value : null;
      
      if (!currentCollectionName) {
        alert('Impossible de déterminer la collection actuelle.');
        return;
      }

      // Find the current collection
      const collection = window.COLLECTIONS.collections.find(coll => 
        coll.nom === currentCollectionName || coll.id === currentCollectionName
      );
      
      if (!collection) {
        alert(`Collection "${currentCollectionName}" introuvable.`);
        return;
      }

      // Check if the object is in this collection (normalize comparison)
      const objNum = parseInt(objectNumero);
      const isInCollection = collection.objets.includes(objNum) || collection.objets.includes(objectNumero);
      if (!isInCollection) {
        alert(`L'objet "${object.nom}" n'est pas dans la collection "${collection.nom}".`);
        return;
      }

      // Confirm removal
      const confirmRemove = confirm(
        `Êtes-vous sûr de vouloir retirer l'objet "${object.nom}" de la collection "${collection.nom}"?\n\n` +
        `L'objet ne sera pas supprimé, seulement retiré de cette collection.`
      );
      if (!confirmRemove) return;

      // Remove the object from the collection (normalize comparison)
      let objectIndex = collection.objets.indexOf(objNum);
      if (objectIndex === -1) {
        objectIndex = collection.objets.indexOf(objectNumero);
      }
      if (objectIndex !== -1) {
        collection.objets.splice(objectIndex, 1);
        
        // Show notification
        if (JdrApp.modules.storage && JdrApp.modules.storage.showNotification) {
          JdrApp.modules.storage.showNotification(`➖ Objet "${object.nom}" retiré de la collection "${collection.nom}"`, 'success');
        }

        // Refresh the current collection view
        this.displayCollection(collection.id);
      }
    },

    deleteCollectionObject(objectNumero) {
      // Find the object in the data (normalize comparison)  
      const object = window.OBJETS.objets.find(obj => parseInt(obj.numero) === objectNumero);
      if (!object) {
        console.error('Object not found:', objectNumero);
        return;
      }

      // Confirm deletion
      const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer l'objet "${object.nom}" (N°${object.numero}) ?`);
      if (!confirmDelete) return;

      // Remove the object from the data (normalize comparison)
      const objectIndex = window.OBJETS.objets.findIndex(obj => parseInt(obj.numero) === objectNumero);
      if (objectIndex !== -1) {
        window.OBJETS.objets.splice(objectIndex, 1);
        
        // Show notification
        if (JdrApp.modules.storage && JdrApp.modules.storage.showNotification) {
          JdrApp.modules.storage.showNotification(`🗑️ Objet "${object.nom}" supprimé`, 'success');
        }

        // Refresh the current collection view
        const currentSearch = document.getElementById('collection-search-input').value;
        if (currentSearch) {
          this.displayCollection(currentSearch);
        }
      }
    },

    addObjectToCollection(collectionId) {
      // Find the collection
      const collection = window.COLLECTIONS.collections.find(coll => coll.id === collectionId);
      if (!collection) {
        alert('Collection introuvable.');
        return;
      }
      
      // Show a list of all available objects to choose from
      const allObjects = window.OBJETS.objets;
      if (allObjects.length === 0) {
        alert('Aucun objet disponible à ajouter.');
        return;
      }
      
      // Filter out objects already in this collection
      // Normalize number comparison to handle both string and number types
      const availableObjects = allObjects.filter(obj => {
        const objNum = parseInt(obj.numero);
        return !collection.objets.includes(objNum) && !collection.objets.includes(obj.numero);
      });
      
      if (availableObjects.length === 0) {
        alert('Tous les objets sont déjà dans cette collection.');
        return;
      }
      
      // Create a selection modal with dropdown
      this.showObjectSelectionModal(
        `Ajouter un objet à la collection "${collection.nom}"`,
        availableObjects,
        (selectedObject) => {
          // Add the object to the collection (normalize to number type)
          const objNum = parseInt(selectedObject.numero);
          collection.objets.push(objNum);
          
          // Show notification
          if (JdrApp.modules.storage && JdrApp.modules.storage.showNotification) {
            JdrApp.modules.storage.showNotification(`➕ Objet "${selectedObject.nom}" ajouté à la collection "${collection.nom}"`, 'success');
          }
          
          // Refresh the current collection view to show the added object
          this.displayCollection(collectionId);
          
          // Auto-scroll to the added object
          setTimeout(() => {
            const addedObjectCard = document.querySelector(`[data-numero="${selectedObject.numero}"]`);
            if (addedObjectCard) {
              addedObjectCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the added object briefly
              addedObjectCard.style.border = '3px solid #10B981';
              setTimeout(() => {
                addedObjectCard.style.border = '';
              }, 2000);
            }
          }, 500);
        }
      );
    },

    removeObjectFromCollection(collectionId) {
      // Find the collection
      const collection = window.COLLECTIONS.collections.find(coll => coll.id === collectionId);
      if (!collection) {
        alert('Collection introuvable.');
        return;
      }
      
      if (!collection.objets || collection.objets.length === 0) {
        alert('Cette collection est vide.');
        return;
      }
      
      // Get the objects in this collection
      const collectionObjects = window.OBJETS.objets.filter(obj => 
        collection.objets.includes(obj.numero)
      );
      
      // Create a selection modal with dropdown
      this.showObjectSelectionModal(
        `Retirer un objet de la collection "${collection.nom}"`,
        collectionObjects,
        (selectedObject) => {
          // Remove the object from the collection
          const objectIndex = collection.objets.indexOf(selectedObject.numero);
          if (objectIndex !== -1) {
            collection.objets.splice(objectIndex, 1);
            
            // Show notification
            if (JdrApp.modules.storage && JdrApp.modules.storage.showNotification) {
              JdrApp.modules.storage.showNotification(`➖ Objet "${selectedObject.nom}" retiré de la collection "${collection.nom}"`, 'success');
            }
            
            // Refresh the current collection view
            this.displayCollection(collectionId);
          }
        }
      );
    },

    showCollectionsGrid() {
      // Hide collection results and show collections grid only in dev mode
      const resultsContainer = document.getElementById('collection-results');
      const availableCollections = document.getElementById('available-collections');
      const searchInput = document.getElementById('collection-search-input');
      
      if (resultsContainer) {
        resultsContainer.style.display = 'none';
      }
      
      // Only show collections grid in dev mode
      const isDevMode = this.isDevModeActive();
      if (availableCollections) {
        availableCollections.style.display = isDevMode ? 'block' : 'none';
      }
      
      // Clear the search input
      if (searchInput) {
        searchInput.value = '';
      }
      
      // Refresh the collections grid to ensure it's up to date if in dev mode
      if (isDevMode) {
        this.generateCollectionsGrid();
      }
    },

    showObjectSelectionModal(title, objects, onSelectCallback) {
      // Remove any existing modal
      const existingModal = document.querySelector('#object-selection-modal');
      if (existingModal) {
        existingModal.remove();
      }

      // Create modal HTML
      const modal = document.createElement('dialog');
      modal.id = 'object-selection-modal';
      modal.style.cssText = `
        max-width: 500px;
        width: 90%;
        border: 3px solid #8B4513;
        border-radius: 12px;
        padding: 0;
        background: transparent !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
      `;

      const selectOptions = objects
        .map(obj => `<option value="${obj.numero}">N°${obj.numero} - ${obj.nom}</option>`)
        .join('');

      modal.innerHTML = `
        <div style="
          background: white; 
          border-radius: 12px; 
          padding: 1.5rem; 
          border: 3px solid #8B4513;
          font-family: inherit;
          font-size: 16px;
        ">
          <h2 style="
            color: #8B4513; 
            font-family: 'Cinzel', serif; 
            margin: 0 0 1rem 0; 
            text-align: center;
          ">${title}</h2>
          
          <div style="margin: 1rem 0;">
            <label for="object-select" style="
              display: block; 
              margin-bottom: 0.5rem; 
              color: #8B4513; 
              font-weight: bold;
            ">Sélectionnez un objet :</label>
            <select id="object-select" style="
              width: 100%; 
              padding: 0.5rem; 
              border: 2px solid #8B4513; 
              border-radius: 8px; 
              font-size: 16px;
              font-family: inherit;
            ">
              <option value="">-- Choisissez un objet --</option>
              ${selectOptions}
            </select>
          </div>
          
          <div style="
            display: flex; 
            gap: 1rem; 
            justify-content: center; 
            margin-top: 1.5rem;
          ">
            <button class="btn-confirm-selection" style="
              background: #10B981; 
              color: white; 
              border: none; 
              padding: 0.75rem 1.5rem; 
              border-radius: 8px; 
              cursor: pointer; 
              font-weight: bold;
            ">Confirmer</button>
            <button class="btn-cancel-selection" style="
              background: #6B7280; 
              color: white; 
              border: none; 
              padding: 0.75rem 1.5rem; 
              border-radius: 8px; 
              cursor: pointer; 
              font-weight: bold;
            ">Annuler</button>
          </div>
        </div>
      `;

      // Add to body and show
      document.body.appendChild(modal);
      modal.showModal();

      // Set up event handlers
      const select = modal.querySelector('#object-select');
      const confirmBtn = modal.querySelector('.btn-confirm-selection');
      const cancelBtn = modal.querySelector('.btn-cancel-selection');

      confirmBtn.addEventListener('click', () => {
        const selectedNumero = parseInt(select.value);
        if (selectedNumero) {
          const selectedObject = objects.find(obj => obj.numero === selectedNumero);
          if (selectedObject && onSelectCallback) {
            onSelectCallback(selectedObject);
          }
        } else {
          alert('Veuillez sélectionner un objet.');
          return;
        }
        modal.close();
        modal.remove();
      });

      cancelBtn.addEventListener('click', () => {
        modal.close();
        modal.remove();
      });

      // Handle ESC key
      modal.addEventListener('close', () => {
        modal.remove();
      });
    },

    ensureDevModeClasses() {
      // Ensure the body has the correct dev mode class
      const isDevMode = JdrApp && JdrApp.utils && JdrApp.utils.isDevMode ? JdrApp.utils.isDevMode() : false;
      
      if (isDevMode) {
        document.body.classList.remove('dev-off');
        document.body.classList.add('dev-on');
      } else {
        document.body.classList.remove('dev-on');
        document.body.classList.add('dev-off');
      }
      
      // Force hide image buttons on collections page if not in dev mode
      if (!isDevMode) {
        const collectionItems = document.getElementById('collection-items');
        if (collectionItems) {
          const imageButtons = collectionItems.querySelectorAll('.illus label.up, .illus button.rm');
          imageButtons.forEach(button => {
            button.style.setProperty('display', 'none', 'important');
          });
        }
      }
    },

    getCollectionsDescription() {
      return JdrApp.data.customPageDescriptions['collections-objets'] || 'Recherchez et explorez des collections d\'objets organisées par thème';
    },

    generateCollectionsGrid() {
      if (!window.COLLECTIONS || !window.COLLECTIONS.collections) {
        return;
      }
      
      // Use defined collections instead of extracting from tags
      const collections = window.COLLECTIONS.collections;
      
      // Collection icons are now defined in the collections data itself
      
      const isDevMode = this.isDevModeActive();
      const collectionsGrid = document.querySelector('.collections-grid');
      
      if (!collectionsGrid) return;
      
      // Generate HTML for each collection
      const collectionsHTML = collections
        .map((collection) => {
          const count = collection.objets ? collection.objets.length : 0;
          return `
            <div class="collection-card" data-collection="${collection.id}">
              <div class="collection-icon">${collection.icon}</div>
              <h3>${collection.nom}</h3>
              <p>${count} objet(s)</p>
              <p class="collection-description">${collection.description}</p>
              ${isDevMode ? `
                <div class="collection-dev-controls">
                  <button class="btn small edit-collection-btn" data-collection="${collection.id}" title="Modifier cette collection">✏️ Modifier</button>
                  <button class="btn small delete-collection-btn" data-collection="${collection.id}" title="Supprimer cette collection">🗑️ Supprimer</button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      
      // Add "create new collection" button in dev mode
      const devActions = isDevMode ? `
        <div class="collection-card new-collection-card">
          <div class="collection-icon">➕</div>
          <h3>Nouvelle Collection</h3>
          <p>Créer une collection</p>
          <button class="btn small create-collection-btn">➕ Créer</button>
        </div>
      ` : '';
      
      collectionsGrid.innerHTML = collectionsHTML + devActions;
      
      // console.log('📦 Collections grid generated:', {
      //   collectionsCount: collections.length,
      //   hasDevActions: !!devActions,
      //   gridContent: collectionsGrid.innerHTML.length + ' chars'
      // });
      
      // Setup event listeners for collections (always active)
      this.setupCollectionEventListeners();
      
      // Setup dev-specific controls only in dev mode
      if (isDevMode) {
        this.setupCollectionManagementControls();
      }
    },

    isDevModeActive() {
      // Multiple ways to detect dev mode for robustness
      return (
        (JdrApp && JdrApp.utils && JdrApp.utils.isDevMode && JdrApp.utils.isDevMode()) ||
        document.body.classList.contains('dev-on') ||
        (JdrApp.modules && JdrApp.modules.editor && JdrApp.modules.editor.isDevMode)
      );
    },

    setupCollectionEventListeners() {
      // Collection card click listeners (open collection for viewing/editing)
      const collectionCards = document.querySelectorAll('.collection-card:not(.new-collection-card)');
      
      collectionCards.forEach(card => {
        card.addEventListener('click', (e) => {
          // Don't trigger if clicking on control buttons
          if (e.target.closest('.collection-dev-controls')) {
            return;
          }
          
          const collectionId = card.getAttribute('data-collection');
          if (collectionId) {
            // Find collection to get its name
            const collection = window.COLLECTIONS.collections.find(coll => coll.id === collectionId);
            if (collection) {
              // Fill search input with collection name
              const searchInput = document.getElementById('collection-search-input');
              if (searchInput) {
                searchInput.value = collection.nom;
              }
              
              // Open the collection
              this.displayCollection(collectionId);
            }
          }
        });
      });
    },

    setupCollectionManagementControls() {
      // Create new collection button
      const createBtn = document.querySelector('.create-collection-btn');
      const editBtns = document.querySelectorAll('.edit-collection-btn');
      const deleteBtns = document.querySelectorAll('.delete-collection-btn');
      
      // console.log('🎛️ Setting up collection controls:', {
      //   createBtn: !!createBtn,
      //   editBtns: editBtns.length,
      //   deleteBtns: deleteBtns.length
      // });
      
      if (createBtn) {
        createBtn.addEventListener('click', () => {
          // console.log('➕ Create collection clicked');
          this.createNewCollection();
        });
      }

      // Edit collection buttons (rename)
      editBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const collectionName = btn.getAttribute('data-collection');
          // console.log('✏️ Edit collection clicked:', collectionName);
          this.renameCollection(collectionName);
        });
      });

      // Delete collection buttons
      deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const collectionName = btn.getAttribute('data-collection');
          // console.log('🗑️ Delete collection clicked:', collectionName);
          this.deleteCollection(collectionName);
        });
      });
    },

    createNewCollection() {
      const collectionName = prompt('Nom de la nouvelle collection:');
      if (!collectionName || !collectionName.trim()) return;
      
      const trimmedName = collectionName.trim();
      
      // Generate an ID from the name
      const collectionId = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Check if collection already exists
      const existingCollection = window.COLLECTIONS.collections.find(coll => 
        coll.id === collectionId || coll.nom.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (existingCollection) {
        alert(`La collection "${trimmedName}" existe déjà.`);
        return;
      }
      
      // Get collection description and icon
      const collectionDescription = prompt('Description de la collection:', 'Nouvelle collection d\'objets');
      const collectionIcon = prompt('Icône de la collection (emoji):', '📦');
      
      // Create new collection object
      const newCollection = {
        id: collectionId,
        nom: trimmedName,
        description: collectionDescription || 'Nouvelle collection d\'objets',
        icon: collectionIcon || '📦',
        objets: []
      };
      
      // Add to collections data
      window.COLLECTIONS.collections.push(newCollection);
      
      // Refresh the grid
      this.generateCollectionsGrid();
      
      if (JdrApp.modules.storage && JdrApp.modules.storage.showNotification) {
        JdrApp.modules.storage.showNotification(`✅ Collection "${trimmedName}" créée avec succès!`, 'success');
      }
    },

    renameCollection(collectionId) {
      // Find the collection by ID
      const collection = window.COLLECTIONS.collections.find(coll => coll.id === collectionId);
      if (!collection) {
        alert('Collection introuvable.');
        return;
      }
      
      const newName = prompt(`Nouveau nom pour la collection "${collection.nom}":`, collection.nom);
      if (!newName || !newName.trim() || newName.trim() === collection.nom) return;
      
      const trimmedNewName = newName.trim();
      
      // Check if new name already exists
      const existingCollection = window.COLLECTIONS.collections.find(coll => 
        coll.id !== collectionId && coll.nom.toLowerCase() === trimmedNewName.toLowerCase()
      );
      
      if (existingCollection) {
        alert(`La collection "${trimmedNewName}" existe déjà.`);
        return;
      }
      
      // Update collection name
      collection.nom = trimmedNewName;
      
      // Refresh the collections grid
      this.generateCollectionsGrid();
      
      if (JdrApp.modules.storage && JdrApp.modules.storage.showNotification) {
        JdrApp.modules.storage.showNotification(`✅ Collection renommée en "${trimmedNewName}"`, 'success');
      }
    },

    deleteCollection(collectionId) {
      // Find the collection by ID
      const collection = window.COLLECTIONS.collections.find(coll => coll.id === collectionId);
      if (!collection) {
        alert('Collection introuvable.');
        return;
      }
      
      const objectCount = collection.objets ? collection.objets.length : 0;
      
      const confirmDelete = confirm(
        `Êtes-vous sûr de vouloir supprimer la collection "${collection.nom}"?\n` +
        `Cette collection contient ${objectCount} objet(s).\n` +
        `Les objets ne seront pas supprimés, seulement la collection sera retirée.`
      );
      
      if (!confirmDelete) return;
      
      // Remove the collection from the collections array
      const collectionIndex = window.COLLECTIONS.collections.findIndex(coll => coll.id === collectionId);
      if (collectionIndex !== -1) {
        window.COLLECTIONS.collections.splice(collectionIndex, 1);
        
        // Refresh the collections grid
        this.generateCollectionsGrid();
        
        if (JdrApp.modules.storage && JdrApp.modules.storage.showNotification) {
          JdrApp.modules.storage.showNotification(`🗑️ Collection "${collection.nom}" supprimée`, 'success');
        }
      }
    },

    setupDevModeListener() {
      // Listen for dev mode changes via EventBus
      if (window.EventBus && window.Events) {
        EventBus.on(Events.EDITOR_TOGGLE, (payload) => {
          // console.log('🔄 Dev mode changed via EventBus:', payload.enabled);
          setTimeout(() => this.refreshCollectionsView(), 50);
        });
      }
      
      // Also listen for body class changes (fallback)
      if (window.MutationObserver) {
        if (this.devModeObserver) {
          this.devModeObserver.disconnect();
        }
        
        // Track the previous dev mode state to avoid loops
        let lastDevMode = this.isDevModeActive();
        
        this.devModeObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const currentDevMode = this.isDevModeActive();
              
              // Only refresh if dev mode actually changed
              if (currentDevMode !== lastDevMode) {
                // console.log('🔄 Body class changed, refreshing views - Dev mode:', currentDevMode);
                lastDevMode = currentDevMode;
                setTimeout(() => this.refreshCollectionsView(), 100);
              }
            }
          });
        });
        
        this.devModeObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
    },

    refreshCollectionsView() {
      const currentHash = window.location.hash;
      
      // Refresh collections page if we're on it
      if (currentHash === '#/collections-objets') {
        const availableCollections = document.getElementById('available-collections');
        const isDevMode = this.isDevModeActive();
        
        // console.log('🔄 Refreshing collections view - Dev mode:', isDevMode);
        
        // Regenerate the collections grid
        this.generateCollectionsGrid();
        
        // Update visibility
        if (availableCollections) {
          if (isDevMode) {
            // console.log('📋 Showing collections in dev mode');
            availableCollections.style.display = 'block';
          } else {
            // console.log('🔒 Hiding collections in normal mode');
            availableCollections.style.display = 'none';
          }
        }
      }
      
      // Also refresh objects page if we're on it (for filter visibility)
      if (currentHash === '#/objets') {
        console.log('🔄 Refreshing objects page due to dev mode change');
        setTimeout(() => {
          this.renderObjectsPage();
        }, 100); // Augmenter le délai pour être sûr que le dev mode est à jour
      }
    },

    updateCollectionsDescription(newDescription) {
      JdrApp.data.customPageDescriptions['collections-objets'] = newDescription;
      // Also update via ContentFactory for consistency
      if (window.ContentFactory) {
        ContentFactory.updatePageDescription('collections', newDescription);
      }
    }
  };

})();