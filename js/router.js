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
    _isInitialLoad: true,

    init() {
      // Add initial-load class to prevent TOC transition animation on first load
      document.documentElement.classList.add('initial-load');

      // Set up route change listeners
      JdrApp.utils.events.onHashChange(() => this.parseRoute());
      JdrApp.utils.events.onDOMReady(() => this.parseRoute());

      // Setup tag filter delegation for collections page (needed for static HTML)
      this.setupTagFilterDelegation();

      // Initialize collections grid for static HTML pages
      this.initCollectionsPageForStaticHTML();

      // Listen for dev mode changes to refresh objects page
      if (window.EventBus && window.Events) {
        EventBus.on(Events.EDITOR_TOGGLE, (payload) => {
          const currentHash = window.location.hash;
          // Refresh objects page specifically when dev mode changes
          if (currentHash === '#/objets') {
            setTimeout(() => {
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
          this._removeInitialLoadClass();
          return; // Route was handled dynamically
        }
      }

      this.show(exists ? page : 'creation');
      this._removeInitialLoadClass();
    },

    _removeInitialLoadClass() {
      // Remove initial-load class after first route to enable TOC transitions
      if (this._isInitialLoad) {
        this._isInitialLoad = false;
        // Wait 500ms to ensure all async initialization (renderer etc.) is complete
        setTimeout(() => {
          document.documentElement.classList.remove('initial-load');
        }, 500);
      }
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

      // Handle single npcs page
      if (page === 'npcs') {
        return this.renderNPCsPage();
      }

      // Handle single tables-tresors page
      if (page === 'tables-tresors') {
        return this.renderTablesTresorsPage();
      }
      
      // Handle favoris page
      if (page === 'favoris') {
        return this.renderFavorisPage();
      }
      
      // Handle GM objects page
      if (page === 'gestion-objets') {
        return this.renderGMObjectsPage();
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
      
      // Remove active class from all articles and hide them
      document.querySelectorAll('article').forEach(a => {
        a.classList.remove('active');
        a.style.display = 'none'; // Force hide all articles
      });
      
      // Remove active class from all TOC links
      document.querySelectorAll('.toc a').forEach(a => a.classList.remove('active'));
      
      // Show the current page article
      const currentArticle = document.querySelector(`article[data-page="${page}"]`);
      
      if (currentArticle) {
        currentArticle.classList.add('active');
        currentArticle.style.display = 'block'; // Force show current article - this overrides any inline display:none
        
        // Check if this is the gestion-objets page specifically
        if (page === 'gestion-objets') {
          
          // CRITICAL FIX: Hide all other object containers when on GM Objects page
          const favorisObjectsContainer = document.getElementById('favoris-objets-container');
          const favorisSortsContainer = document.getElementById('favoris-sorts-container');
          const regularObjectsContainer = document.getElementById('objets-container');
          
          if (favorisObjectsContainer) {
            favorisObjectsContainer.style.display = 'none';
          }
          
          if (favorisSortsContainer) {
            favorisSortsContainer.style.display = 'none';
          }
          
          if (regularObjectsContainer) {
            regularObjectsContainer.style.display = 'none';
          }
          
          // CRITICAL FIX: Hide the entire favoris article's section that contains object cards
          const favorisArticle = document.querySelector('article[data-page="favoris"]');
          if (favorisArticle) {
            const favorisSection = favorisArticle.querySelector('section');
            if (favorisSection && favorisSection.querySelectorAll('.objet-card').length > 0) {
              favorisSection.style.display = 'none';
            }
          }
          
          // EXTRA PROTECTION: Force hide any other potential object containers
          const allPotentialObjectContainers = document.querySelectorAll('#objets-container, [id*="objets"], [class*="objets"]:not(#gestion-objets-container)');
          allPotentialObjectContainers.forEach((container, index) => {
            if (container.id !== 'gestion-objets-container' && container.querySelectorAll('.objet-card').length > 0) {
              container.style.display = 'none';
            }
          });
          
          // NUCLEAR OPTION: Force hide every individual object card that's not in gestion-objets-container
          const allObjectCards = document.querySelectorAll('.objet-card');
          const gestionObjetsContainer = document.getElementById('gestion-objets-container');
          let hiddenCount = 0;
          
          allObjectCards.forEach((card, index) => {
            const isInGestionObjets = gestionObjetsContainer && gestionObjetsContainer.contains(card);
            if (!isInGestionObjets) {
              card.style.display = 'none';
              hiddenCount++;
            }
          });
          
          
          // CRITICAL: Set up mutation observer to track and PREVENT style changes
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                
                // FORCE IT BACK TO VISIBLE IF SOMETHING HIDES IT
                if (currentArticle.style.display === 'none') {
                  currentArticle.style.display = 'block';
                }
              }
            });
          });
          
          observer.observe(currentArticle, { 
            attributes: true, 
            attributeFilter: ['style'] 
          });
          
          // Clean up observer after 2 seconds
          setTimeout(() => {
            observer.disconnect();
            
            // DIAGNOSTIC: Check for duplicate content or multiple active articles
            const diagnosticId = Math.random().toString(36).substr(2, 9);
            const allActiveArticles = document.querySelectorAll('article.active');
            allActiveArticles.forEach((art, index) => {
            });
            
            const allContainers = document.querySelectorAll('#gestion-objets-container, .collection-items');
            allContainers.forEach((container, index) => {
              
              // DETAILED: Log each child to see what's in each container
              if (container.children.length > 0) {
                Array.from(container.children).forEach((child, childIndex) => {
                });
              }
            });
            
            // MORE SPECIFIC: Look for ANY visible grid containers
            const allGridContainers = document.querySelectorAll('[style*="display: grid"], .collection-items, .grid');
            allGridContainers.forEach((container, index) => {
              const computedDisplay = window.getComputedStyle(container).display;
              if (computedDisplay === 'grid' || computedDisplay === 'block') {
              }
            });
            
            // CHECK: Look for duplicate objet-card elements 
            const allObjectCards = document.querySelectorAll('.objet-card');
            
            // Group by parent container
            const cardsByContainer = {};
            allObjectCards.forEach(card => {
              const parentContainer = card.closest('.collection-items, .grid, #gestion-objets-container');
              const containerKey = parentContainer ? (parentContainer.id || parentContainer.className) : 'unknown';
              if (!cardsByContainer[containerKey]) cardsByContainer[containerKey] = [];
              cardsByContainer[containerKey].push(card);
            });
            
            Object.entries(cardsByContainer).forEach(([containerKey, cards]) => {
              
              // LOG the first few cards in each container to see what they are
              cards.slice(0, 3).forEach((card, cardIndex) => {
                const cardTitle = card.querySelector('h3, .object-title, [data-edit-type="titre"]')?.textContent?.trim() || 'No title';
                const cardNumber = card.querySelector('.object-id, [class*="numero"]')?.textContent?.trim() || 'No number';
                
                // SPECIAL: Log parent hierarchy for unknown cards
                if (containerKey === 'unknown') {
                  let parentChain = '';
                  let currentElement = card.parentElement;
                  let depth = 0;
                  while (currentElement && depth < 5) {
                    parentChain += `${currentElement.tagName}`;
                    if (currentElement.id) parentChain += `#${currentElement.id}`;
                    if (currentElement.className) parentChain += `.${currentElement.className.split(' ').join('.')}`;
                    parentChain += ' > ';
                    currentElement = currentElement.parentElement;
                    depth++;
                  }
                }
              });
            });
            
            // CRITICAL: Check for containers that might be visible but not properly tracked
            const allSections = document.querySelectorAll('section');
            allSections.forEach((section, index) => {
              const sectionDisplay = window.getComputedStyle(section).display;
              const hasObjectCards = section.querySelectorAll('.objet-card').length;
              const hasCollectionItems = section.querySelectorAll('.collection-items').length;
              if (sectionDisplay !== 'none' && (hasObjectCards > 0 || hasCollectionItems > 0)) {
              }
            });
            
            // EXTRA: Check if there are any articles that are accidentally visible
            const allArticles = document.querySelectorAll('article');
            allArticles.forEach((article, index) => {
              const articleDisplay = window.getComputedStyle(article).display;
              const hasObjectCards = article.querySelectorAll('.objet-card').length;
              if (articleDisplay !== 'none' && hasObjectCards > 0) {
              }
            });
          }, 2000);
        }
        
        // IMPORTANT: Reset the activeIdSearch state when navigating to Objects page
        if (page === 'objets') {
          window.activeIdSearch = false;
          
          // Clear any search results
          const resultDiv = document.getElementById('id-search-result');
          if (resultDiv) {
            resultDiv.textContent = '';
          }
          
          // Clear search input
          const searchInput = document.getElementById('id-search-input');
          if (searchInput) {
            searchInput.value = '';
          }
        }
      }
      
      // Set active link in TOC - try multiple selectors
      let activeLink = document.querySelector(`a[href="#/${page}"]`);
      if (!activeLink) {
        // Try alternative selector with data-route
        activeLink = document.querySelector(`a[data-route="${page}"]`);
      }

      if (activeLink) {
        activeLink.classList.add('active');

        // Expand parent category if needed
        const category = activeLink.closest('.toc-category');
        if (category) {
          category.classList.remove('collapsed');
        }

        // Always check for parent section (whether the link is in a category or directly in section)
        const parentSection = activeLink.closest('.toc-section');
        if (parentSection) {
          parentSection.classList.remove('collapsed');

          // Update the toggle icon
          const toggle = parentSection.querySelector('.toc-section-toggle');
          if (toggle) {
            toggle.textContent = '▼';
          }

          // Update dynamic height for the opened section
          const content = parentSection.querySelector('.toc-section-content');
          if (content) {
            const childCount = content.querySelectorAll('a, .toc-category').length;
            const itemHeight = 50;
            const baseHeight = 100;
            const dynamicHeight = Math.max(500, (childCount * itemHeight) + baseHeight);
            content.style.maxHeight = `${dynamicHeight}px`;
          }
        }
      }
      
      // Final state logging
      if (page === 'gestion-objets') {
        const finalArticle = document.querySelector(`article[data-page="${page}"]`);
        if (finalArticle) {
        }
      }
    },
    
    show(page) {
      
      // Hide all articles and remove active class
      document.querySelectorAll('article').forEach(a => {
        a.classList.remove('active');
        a.style.display = 'none';
      });
      
      // Show and activate the target page
      const target = document.querySelector(`article[data-page="${page}"]`);
      if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        
        // Reset ID search state when navigating to Objects page
        if (page === 'objets') {
          window.activeIdSearch = false;
          setTimeout(() => {
            const resultDiv = document.getElementById('id-search-result');
            if (resultDiv) {
              resultDiv.textContent = '';
            }
            const searchInput = document.getElementById('id-search-input');
            if (searchInput) {
              searchInput.value = '';
            }
          }, 100);
        }
      }
      
      // Update TOC active states using the complete function
      this.updateActiveStates(page);

      
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
        ${window.TOC_STRUCTURE.directPages ? 
          window.TOC_STRUCTURE.directPages.map(page => this.generateTOCItem(page)).join('') : 
          ''}
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

      // Appliquer les états actifs après génération de la TOC
      const currentHash = window.location.hash.replace('#/', '');
      const currentPage = currentHash || 'creation';
      setTimeout(() => {
        this.updateActiveStates(currentPage);
      }, 100);
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
      this.updateMJBodyClass();

      const handleMJToggle = () => {
        if (window.JdrApp.state.isMJ) {
          // Déjà en mode MJ, désactiver
          window.JdrApp.state.isMJ = false;
          this.updateMJButtonVisual();
          this.updateMJBodyClass();
          this.generateTOC();
        } else {
          // Demander confirmation avant d'activer le mode MJ
          this.showMJConfirmation(() => {
            window.JdrApp.state.isMJ = true;
            this.updateMJButtonVisual();
            this.updateMJBodyClass();
            this.generateTOC();
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

            // Scroll to top when manually navigating via TOC (with delay to ensure page is rendered)
            setTimeout(() => {
              // Scroll multiple possible containers to ensure it works
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              // Also scroll the main content containers
              const mainPage = document.querySelector('main.page');
              if (mainPage) mainPage.scrollTop = 0;
              const views = document.getElementById('views');
              if (views) views.scrollTop = 0;
            }, 50);

            // Auto-close sidebar on mobile/touch devices after navigation
            this.autoCloseMobileSidebar();
          }
        });
      });
    },

    /**
     * Auto-close sidebar on mobile/touch devices after navigation
     */
    autoCloseMobileSidebar() {
      // Check if device should show mobile toggle (touch device or mobile size)
      const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 || 
                           navigator.msMaxTouchPoints > 0 ||
                           window.matchMedia('(pointer: coarse)').matches;
      
      const isMobileSize = window.innerWidth <= window.UI_CONSTANTS?.BREAKPOINTS?.MOBILE;
      const shouldAutoClose = isTouchDevice || isMobileSize;
      
      if (shouldAutoClose) {
        const sidebar = document.querySelector('#sidebar');
        const menuToggle = document.querySelector('#menuToggle');
        const backdrop = document.querySelector('#backdrop');
        
        if (sidebar && sidebar.classList.contains('mobile-open')) {
          // Close mobile nav
          sidebar.classList.remove('mobile-open');
          if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
          if (backdrop) backdrop.style.display = 'none';
          document.body.style.overflow = '';
        }
      }
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

    updateMJBodyClass() {
      const body = document.body;
      if (window.JdrApp.state.isMJ) {
        body.classList.remove('mj-off');
        body.classList.add('mj-on');
      } else {
        body.classList.remove('mj-on');
        body.classList.add('mj-off');
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
      // All sections collapsed by default (as before)
      const sectionClass = 'toc-section collapsed';
      const toggleIcon = '▶';

      // Utilise l'icône du Guerrier pour la section Héros
      let sectionTitle = section.title;
      if (section.id === 'heros') {
        const heroIconUrl = this._getClassIconUrl('Guerrier');
        const heroIcon = `<img src="${heroIconUrl}" alt="Héros" class="toc-class-icon" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 4px; border-radius: 4px; object-fit: cover;">`;
        sectionTitle = `${heroIcon} Héros`;
      }

      return `
        <div class="${sectionClass}" data-section="${section.id}">
          <div class="toc-section-header">
            <span class="toc-section-title">${sectionTitle}</span>
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
          <div class="toc-category collapsed">
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
          <div class="toc-category collapsed">
            <a data-route="sorts" href="#/sorts">${item.icon} ${item.title}</a>
            <div class="toc-sub">
              ${dataSource.map(category =>
                `<a data-route="sorts-${JdrApp.utils.data.sanitizeId(category.nom)}" href="#/sorts-${JdrApp.utils.data.sanitizeId(category.nom)}" class="${category.nom === 'Sorts de Monstres' ? 'mj-only' : ''}">${this.getSortCategoryIcon(category.nom)} ${category.nom}</a>`
              ).join('')}
            </div>
          </div>
        `;
      } else if (item.id === 'dons') {
        return `
          <div class="toc-category collapsed">
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
        
        <div class="toc-category collapsed">
          <a data-route="classes" href="#/classes" class="">⚔️ Classes</a>
          <div class="toc-sub">
            ${window.CLASSES ? window.CLASSES.map(classe => 
              `<a data-route="${JdrApp.utils.data.sanitizeId(classe.nom)}" href="#/${JdrApp.utils.data.sanitizeId(classe.nom)}" class="">${this.getClassIcon(classe.nom)} ${classe.nom}</a>`
            ).join('') : ''}
          </div>
        </div>
        
        <div class="toc-category collapsed">
          <a data-route="sorts" href="#/sorts">🔮 Sorts</a>
          <div class="toc-sub">
            ${window.SORTS ? window.SORTS.map(category => 
              `<a data-route="sorts-${JdrApp.utils.data.sanitizeId(category.nom)}" href="#/sorts-${JdrApp.utils.data.sanitizeId(category.nom)}" class="">${this.getSortCategoryIcon(category.nom)} ${category.nom}</a>`
            ).join('') : ''}
          </div>
        </div>
        
        <div class="toc-category collapsed">
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
      if (currentHash === '#/objets' || currentHash === '#objets' || currentHash === '#/gestion-objets') {
        setTimeout(() => {
          this.renderObjectsPage();
        }, 150);
      }
    },
    
    // URLs imgbb pour les icônes de classes
    _classIconUrls: {
      'Guerrier': 'https://i.ibb.co/VYWv5yW6/Guerrier.png',
      'Mage': 'https://i.ibb.co/ZpGmbw9L/Mage.png',
      'Pretre': 'https://i.ibb.co/Q7v372rX/Pretre.png',
      'Rodeur': 'https://i.ibb.co/LDkJm2Fr/Rodeur.png',
      'Enchanteur': 'https://i.ibb.co/ZpwTCLGC/Enchanteur.png'
    },

    _getClassIconUrl(fileName) {
      return this._classIconUrls[fileName] || null;
    },

    getClassIcon(className) {
      const classToFile = {
        'Guerrier': 'Guerrier',
        'Mage': 'Mage',
        'Prêtre': 'Pretre',
        'Rôdeur': 'Rodeur',
        'Enchanteur': 'Enchanteur'
      };
      const file = classToFile[className];
      if (file) {
        const url = this._getClassIconUrl(file);
        if (url) {
          return `<img src="${url}" alt="${className}" class="toc-class-icon" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 4px; border-radius: 4px; object-fit: cover;">`;
        }
      }
      return '⚔️';
    },

    getSortCategoryIcon(categoryName) {
      const categoryToFile = {
        'Sorts de Mage': 'Mage',
        'Sorts de Prêtre': 'Pretre',
        'Sorts d\'Enchanteur': 'Enchanteur',
        'Sorts de Monstres': null
      };
      const file = categoryToFile[categoryName];
      if (file) {
        const url = this._getClassIconUrl(file);
        if (url) {
          return `<img src="${url}" alt="${categoryName}" class="toc-class-icon" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 4px; border-radius: 4px; object-fit: cover;">`;
        }
      }
      return '💀';
    },

    getDonCategoryIcon(categoryName) {
      // Dons Généraux gardent l'emoji
      if (categoryName === 'Généraux' || categoryName === 'Generaux') {
        return '🎖️';
      }
      const categoryToFile = {
        'Guerrier': 'Guerrier',
        'Mage': 'Mage',
        'Pretre': 'Pretre',
        'Prêtre': 'Pretre',
        'Rôdeur': 'Rodeur',
        'Enchanteur': 'Enchanteur'
      };
      const file = categoryToFile[categoryName];
      if (file) {
        const url = this._getClassIconUrl(file);
        if (url) {
          return `<img src="${url}" alt="${categoryName}" class="toc-class-icon" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 4px; border-radius: 4px; object-fit: cover;">`;
        }
      }
      return '🎖️';
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


    setupGMObjectSearch() {
      // Setup ID search for the GM objects page
      const idSearchInput = document.getElementById('id-search-input');
      if (idSearchInput) {
        // Remove existing listeners
        const newInput = idSearchInput.cloneNode(true);
        idSearchInput.parentNode.replaceChild(newInput, idSearchInput);
        
        newInput.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            const searchId = e.target.value.trim();
            if (JdrApp.modules.renderer && JdrApp.modules.renderer.performIdSearch) {
              JdrApp.modules.renderer.performIdSearch(searchId);
            }
          }
        });
      }
      
      // Setup clear button
      const clearButton = document.getElementById('clear-id-search');
      if (clearButton) {
        const newClearButton = clearButton.cloneNode(true);
        clearButton.parentNode.replaceChild(newClearButton, clearButton);
        
        newClearButton.addEventListener('click', () => {
          if (JdrApp.modules.renderer && JdrApp.modules.renderer.clearIdSearch) {
            JdrApp.modules.renderer.clearIdSearch();
          }
        });
      }
    },

    renderMonstersPage() {
      // Use PageBuilder to generate the monstres page dynamically
      JdrApp.modules.renderer.renderUnifiedContentPage('monster', window.MONSTRES || []);
      this.updateActiveStates('monstres');
      this.show('monstres'); // Activer la page
      return true;
    },

    renderNPCsPage() {
      // Use PageBuilder to generate the npcs page dynamically
      JdrApp.modules.renderer.renderUnifiedContentPage('npc', window.NPCS || []);
      this.updateActiveStates('npcs');
      this.show('npcs'); // Activer la page
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
        pageElement = document.createElement('article');
        pageElement.id = 'collections-objets';
        pageElement.setAttribute('data-page', 'collections-objets');
        pageElement.className = 'page';
        
        // Insert it into the views container
        const viewsContainer = document.querySelector('#views');
        
        if (viewsContainer) {
          viewsContainer.appendChild(pageElement);
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
              value="Départ"
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
      
      
      // Generate collections dynamically
      this.generateCollectionsGrid();
      
      if (availableCollections) {
        if (isDevMode) {
          availableCollections.style.display = 'block';
          // In dev mode, show all collections without needing search
          // But keep the search functional for filtering
        } else {
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

      // Store for use by tag filter event delegation
      this._currentCollectionObjects = filteredObjects;
      
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
      
      // Tag filter event listeners are now handled via event delegation in setupTagFilterDelegation
      this.setupTagFilterDelegation();
    },

    /**
     * Setup event delegation for tag filter buttons (called once)
     */
    setupTagFilterDelegation() {
      // Avoid setting up multiple times
      if (this._tagFilterDelegationSetup) return;
      this._tagFilterDelegationSetup = true;

      const router = this; // Capture reference for closure

      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.tag-filter-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        // Update active state
        document.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const selectedTag = btn.getAttribute('data-tag');

        // Get filtered objects - either from stored state or from current collection
        let filteredObjects = router._currentCollectionObjects;

        // If no stored objects, try to get from current collection (static HTML case)
        if (!filteredObjects || filteredObjects.length === 0) {
          const collectionHeader = document.querySelector('#collection-header h2');
          if (collectionHeader && window.COLLECTIONS && window.OBJETS) {
            const collectionName = collectionHeader.textContent.replace(/^[^\s]+\s*/, '').trim(); // Remove icon
            const collection = window.COLLECTIONS.collections.find(c =>
              c.nom.toLowerCase() === collectionName.toLowerCase()
            );
            if (collection && collection.objets) {
              filteredObjects = window.OBJETS.objets.filter(obj =>
                collection.objets.includes(obj.numero)
              );
              router._currentCollectionObjects = filteredObjects;
            }
          }
        }

        if (!filteredObjects) filteredObjects = [];

        let itemsToShow = filteredObjects;

        if (selectedTag !== 'all') {
          itemsToShow = filteredObjects.filter(obj =>
            obj.tags && obj.tags.includes(selectedTag)
          );
        }

        router.renderCollectionItems(itemsToShow);
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
          return window.CardBuilder.create('objet', item, 'objets').build();
        }).join('');
        
        itemsContainer.innerHTML = itemsHTML;
        
        // Add dev controls after DOM insertion if in dev mode
        if (isDevMode) {
          items.forEach(item => {
            const card = itemsContainer.querySelector(`.card[data-objet-name="${item.nom}"]`);
            if (card) {
              const devControls = document.createElement('div');
              devControls.className = 'dev-controls collection-dev-controls';
              devControls.style.cssText = 'margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;';
              devControls.innerHTML = `
                <button class="btn small edit-object-btn" data-numero="${item.numero}" style="margin: 2px;">✏️ Éditer</button>
                <button class="btn small remove-from-collection-btn" data-numero="${item.numero}" style="margin: 2px; background: #f59e0b;">➖ Retirer de cette collection</button>
                <button class="btn small delete-object-btn" data-numero="${item.numero}" style="margin: 2px; background: #ef4444;">🗑️ Supprimer définitivement</button>
              `;
              card.appendChild(devControls);
            }
          });
        }
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

    /**
     * Initialize collections page for static HTML (dev mode)
     * This handles the case where the page is pre-rendered and not dynamically generated
     */
    initCollectionsPageForStaticHTML() {
      const router = this;

      // Wait for data to be available, then initialize
      const initWhenReady = () => {
        if (!window.COLLECTIONS || !window.COLLECTIONS.collections) {
          setTimeout(initWhenReady, 100);
          return;
        }

        const availableCollections = document.getElementById('available-collections');
        const collectionResults = document.getElementById('collection-results');
        const searchInput = document.getElementById('collection-search-input');

        if (router.isDevModeActive()) {
          // In dev mode: show collections grid, hide pre-loaded results
          if (availableCollections) {
            availableCollections.style.display = 'block';
            router.generateCollectionsGrid();
          }
          if (collectionResults) {
            collectionResults.style.display = 'none';
          }
          if (searchInput) {
            searchInput.value = '';
          }
        }
      };

      // Run on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhenReady);
      } else {
        setTimeout(initWhenReady, 100);
      }

      // Listen for dev mode changes
      if (window.EventBus && window.Events) {
        EventBus.on(Events.EDITOR_TOGGLE, () => {
          const availableCollections = document.getElementById('available-collections');
          const collectionResults = document.getElementById('collection-results');
          const searchInput = document.getElementById('collection-search-input');

          if (router.isDevModeActive()) {
            // Switching to dev mode: show grid, hide results
            if (availableCollections) {
              availableCollections.style.display = 'block';
              router.generateCollectionsGrid();
            }
            if (collectionResults) {
              collectionResults.style.display = 'none';
            }
            if (searchInput) {
              searchInput.value = '';
            }
          } else {
            // Switching to normal mode: hide grid, show default collection
            if (availableCollections) {
              availableCollections.style.display = 'none';
            }
            if (searchInput) {
              searchInput.value = 'Départ';
            }
            router.displayCollection('Départ');
          }
        });
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
              availableCollections.style.display = 'block';
          } else {
              availableCollections.style.display = 'none';
          }
        }
      }
      
      // Also refresh objects page if we're on it (for filter visibility)
      if (currentHash === '#/objets') {
        setTimeout(() => {
          this.renderObjectsPage();
        }, 100);
      }
    },

    updateCollectionsDescription(newDescription) {
      JdrApp.data.customPageDescriptions['collections-objets'] = newDescription;
      // Also update via ContentFactory for consistency
      if (window.ContentFactory) {
        ContentFactory.updatePageDescription('collections', newDescription);
      }
    },


    renderFavorisPage() {
      // Use the unified PageBuilder to render the favoris page  
      const favorisData = window.FAVORIS || {
        page: 'favoris',
        title: '⭐ Favoris',
        static: true,
        sections: [
          {
            type: 'intro',
            content: 'Retrouvez ici vos sorts et objets préférés. Cliquez sur l\'étoile ⭐ à côté des éléments pour les ajouter à vos favoris.'
          }
        ]
      };
      
      // Generate the page HTML using PageBuilder directly
      const pageHtml = PageBuilder.buildStaticPage('favoris', favorisData);
      
      // Find or create the views container and insert the page
      const viewsContainer = document.querySelector('#views');
      if (viewsContainer) {
        // Remove existing favoris page if it exists
        const existingPage = document.querySelector('[data-page="favoris"]');
        if (existingPage) {
          existingPage.remove();
        }
        
        viewsContainer.insertAdjacentHTML('beforeend', pageHtml);
      }
      
      // Show and activate page first
      this.show('favoris');
      this.updateActiveStates('favoris');
      
      // Trigger favoris display update with multiple attempts
      if (window.FavorisRenderer) {
        setTimeout(() => window.FavorisRenderer.updateFavorisDisplay(), 100);
      }
      
      return true;
    },

    renderObjectsPage() {
      // Check if page already exists and force refresh is requested
      const existingPage = document.querySelector('[data-page="objets"]');
      const shouldRefresh = this._forceObjectsRefresh || !existingPage;
      
      if (!shouldRefresh && existingPage) {
        // Page exists and no refresh needed, just show it
        setTimeout(() => {
          this.setupObjectSearchFunctionality();
        }, 100);
        this.show('objets');
        this.updateActiveStates('objets');
        return true;
      }
      
      // Reset the force refresh flag
      this._forceObjectsRefresh = false;
      
      // Get objects data
      const objectsData = window.OBJETS || { objets: [] };
      
      // Use PageBuilder to generate the objects page
      if (!window.PageBuilder) {
        console.error('PageBuilder not available for objects page');
        return false;
      }
      
      // Generate page HTML using PageBuilder
      const pageHtml = PageBuilder.buildSingleObjectPage(objectsData);
      
      // Find or create the views container
      const viewsContainer = document.querySelector('#views');
      if (!viewsContainer) {
        console.error('Views container not found');
        return false;
      }
      
      // Remove existing objects page if it exists
      if (existingPage) {
        existingPage.remove();
      }
      
      // Insert the new page
      viewsContainer.insertAdjacentHTML('beforeend', pageHtml);
      
      // Setup object search functionality
      setTimeout(() => {
        this.setupObjectSearchFunctionality();
      }, 100);
      
      // Show and activate page
      this.show('objets');
      this.updateActiveStates('objets');
      
      return true;
    },

    refreshObjectsPageIfActive() {
      const currentHash = window.location.hash;
      if (currentHash === '#/objets' || currentHash === '#/gestion-objets') {
        setTimeout(() => {
          this._forceObjectsRefresh = true;
          if (this.renderObjectsPage) {
            this.renderObjectsPage();
          }
        }, 50);
      }
    },

    setupObjectSearchFunctionality() {
      // Setup ID search functionality
      const idSearchInput = document.getElementById('id-search-input');
      const clearButton = document.getElementById('clear-id-search');
      const resultDiv = document.getElementById('id-search-result');
      
      if (!idSearchInput) {
        return;
      }
      
      // Search function
      const performIdSearch = (searchValue) => {
        const objectsContainer = document.getElementById('objets-container');
        if (!objectsContainer) {
          return;
        }
        
        const allCards = objectsContainer.querySelectorAll('.card');
        let foundCard = null;
        
        if (!searchValue || searchValue.trim() === '') {
          // Show all cards when search is empty in dev mode, hide in normal mode
          const isDevMode = JdrApp.utils.isDevMode();
          allCards.forEach(card => {
            card.style.display = isDevMode ? 'block' : 'none';
          });
          window.activeIdSearch = false;
          if (resultDiv) {
            resultDiv.textContent = 'Entrez un numéro pour rechercher un objet spécifique';
          }
          return;
        }
        
        // Hide all cards first
        allCards.forEach(card => {
          card.style.display = 'none';
        });
        
        // Find and show matching card
        const searchNumber = parseInt(searchValue);
        if (!isNaN(searchNumber)) {
          allCards.forEach(card => {
            // Try multiple possible attribute names for the object number
            const cardNumero = card.getAttribute('data-numero') || 
                              card.getAttribute('data-object-numero') ||
                              card.getAttribute('data-objet-numero');
            
            if (cardNumero && parseInt(cardNumero) === searchNumber) {
              card.style.display = 'block';
              card.style.visibility = 'visible';
              foundCard = card;
              
              // Center the found object
              setTimeout(() => {
                card.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center', 
                  inline: 'center' 
                });
              }, 100);
            }
          });
        }
        
        window.activeIdSearch = true;
        
        // Update result text
        if (resultDiv) {
          if (foundCard) {
            const objectName = foundCard.querySelector('h4, .card-title')?.textContent || 'Objet trouvé';
            resultDiv.textContent = `✅ Objet trouvé: ${objectName}`;
            resultDiv.style.color = '#16a34a';
          } else {
            resultDiv.textContent = `❌ Aucun objet trouvé avec le numéro ${searchNumber}`;
            resultDiv.style.color = '#ef4444';
          }
        }
      };
      
      // Setup event listeners - Only search on Enter, not on input
      idSearchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          performIdSearch(e.target.value);
        }
      });
      
      if (clearButton) {
        clearButton.addEventListener('click', () => {
          idSearchInput.value = '';
          performIdSearch('');
        });
      }
      
      // Setup tag filter functionality if available
      this.setupObjectTagFilters();
    },

    setupObjectTagFilters() {
      const filterChips = document.querySelectorAll('.filter-chip');
      const objectsContainer = document.getElementById('objets-container');
      
      if (!objectsContainer || filterChips.length === 0) return;
      
      filterChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          const tag = e.target.getAttribute('data-tag');
          if (!tag) return;
          
          const isActive = e.target.classList.contains('active');
          
          // Toggle the tag in global state
          if (!window.ACTIVE_OBJECT_TAGS) {
            window.ACTIVE_OBJECT_TAGS = [];
          }
          
          if (isActive) {
            // Remove tag
            window.ACTIVE_OBJECT_TAGS = window.ACTIVE_OBJECT_TAGS.filter(t => t !== tag);
          } else {
            // Add tag
            window.ACTIVE_OBJECT_TAGS.push(tag);
          }
          
          // Refresh the objects page to apply filters
          this._forceObjectsRefresh = true;
          this.renderObjectsPage();
        });
      });
    },

    renderGMObjectsPage() {
      // CRITICAL FIX: Clean up any existing virtualization containers before regenerating
      const existingGMArticle = document.querySelector('article[data-page="gestion-objets"]');
      if (existingGMArticle && window.ScrollOptimizer && window.ScrollOptimizer.cleanupVirtualization) {
        window.ScrollOptimizer.cleanupVirtualization(existingGMArticle);
      }
      
      if (!window.OBJETS) {
        return false;
      }
      
      // Generate the GM objects page HTML
      const pageHTML = window.PageBuilder.buildGameMasterObjectPage(window.OBJETS);
      
      // Update only the specific article instead of wiping entire views container
      let gmObjectsArticle = document.querySelector('article[data-page="gestion-objets"]');
      
      if (!gmObjectsArticle) {
        // Create the article if it doesn't exist
        const viewsContainer = document.getElementById('views');
        if (viewsContainer) {
          viewsContainer.insertAdjacentHTML('beforeend', pageHTML);
          gmObjectsArticle = document.querySelector('article[data-page="gestion-objets"]');
        }
      } else {
        // Update existing article content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pageHTML;
        const newArticleContent = tempDiv.querySelector('article[data-page="gestion-objets"]');
        
        if (newArticleContent) {
          // Clear existing content and replace with new content
          gmObjectsArticle.innerHTML = '';
          
          requestAnimationFrame(() => {
            // Extract only the section content to avoid nesting issues
            const sectionContent = newArticleContent.querySelector('section');
            if (sectionContent) {
              gmObjectsArticle.innerHTML = sectionContent.outerHTML;
            } else {
              gmObjectsArticle.innerHTML = newArticleContent.innerHTML;
            }
          });
        }
      }
      
      if (gmObjectsArticle) {
        this.updateActiveStates('gestion-objets');
        this.setupGMObjectSearch();
        
        return true;
      }
      
      return false;
    },

    setupGMObjectSearch() {
      // Setup ID search for GM objects page
      const idSearchInput = document.getElementById('id-search-input');
      const searchButton = document.getElementById('search-object-btn');
      const clearButton = document.getElementById('clear-id-search');
      
      const performIdSearch = (searchId) => {
        const objectsContainer = document.getElementById('gestion-objets-container');
        if (!objectsContainer) return;
        
        const allCards = objectsContainer.querySelectorAll('.card');
        
        if (!searchId) {
          // Show all objects
          allCards.forEach(card => card.style.display = 'block');
          window.activeIdSearch = false;
          return;
        }
        
        // Hide all first
        allCards.forEach(card => card.style.display = 'none');
        
        // Find and show matching object
        const targetCard = Array.from(allCards).find(card => {
          const cardIdElement = card.querySelector('.object-id');
          return cardIdElement && cardIdElement.textContent.includes(`#${searchId}`);
        });
        
        if (targetCard) {
          targetCard.style.display = 'block';
          targetCard.style.gridColumn = '1 / -1';
          targetCard.style.justifySelf = 'center';
          window.activeIdSearch = true;
        } else {
          window.activeIdSearch = false;
        }
      };
      
      if (searchButton && idSearchInput) {
        searchButton.addEventListener('click', () => {
          const searchId = idSearchInput.value.trim();
          performIdSearch(searchId);
        });
        
        idSearchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const searchId = idSearchInput.value.trim();
            performIdSearch(searchId);
          }
        });
      }
      
      if (clearButton) {
        clearButton.addEventListener('click', () => {
          idSearchInput.value = '';
          performIdSearch('');
        });
      }
    },

    renderMonstersPage() {
      if (!window.MONSTRES) {
        console.error('MONSTRES data not loaded');
        return false;
      }
      
      // Generate the monsters page HTML
      const pageHTML = window.PageBuilder.buildSingleMonsterPage(window.MONSTRES);
      
      // Update only the specific article instead of wiping entire views container
      let monstersArticle = document.querySelector('article[data-page="monstres"]');
      if (!monstersArticle) {
        // Create the article if it doesn't exist
        const viewsContainer = document.getElementById('views');
        if (viewsContainer) {
          viewsContainer.insertAdjacentHTML('beforeend', pageHTML);
          monstersArticle = document.querySelector('article[data-page="monstres"]');
        }
      } else {
        // Completely replace the existing article element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pageHTML;
        const newArticleElement = tempDiv.querySelector('article[data-page="monstres"]');
        
        if (newArticleElement) {
          // Replace the entire article element, not just its innerHTML
          monstersArticle.parentNode.replaceChild(newArticleElement, monstersArticle);
          monstersArticle = newArticleElement; // Update the reference
        }
      }
      
      if (monstersArticle) {
        this.updateActiveStates('monstres');
        return true;
      }
      
      return false;
    },

    renderTablesTresorsPage() {
      if (!window.TABLES_TRESORS) {
        console.error('TABLES_TRESORS data not loaded');
        return false;
      }
      
      // Generate the tables page HTML
      const pageHTML = window.PageBuilder.buildSingleTableTresorPage(window.TABLES_TRESORS);
      
      // Update only the specific article instead of wiping entire views container
      let tablesArticle = document.querySelector('article[data-page="tables-tresors"]');
      if (!tablesArticle) {
        // Create the article if it doesn't exist
        const viewsContainer = document.getElementById('views');
        if (viewsContainer) {
          viewsContainer.insertAdjacentHTML('beforeend', pageHTML);
          tablesArticle = document.querySelector('article[data-page="tables-tresors"]');
        }
      } else {
        // Update existing article content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pageHTML;
        const newArticleContent = tempDiv.querySelector('article[data-page="tables-tresors"]');
        if (newArticleContent) {
          tablesArticle.innerHTML = newArticleContent.innerHTML;
        }
      }
      
      if (tablesArticle) {
        this.updateActiveStates('tables-tresors');
        return true;
      }
      
      return false;
    },


  
  };

})();
