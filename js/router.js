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
    },
    
    parseRoute() {
      const hash = location.hash.replace('#/', '');
      const page = hash || 'creation';
      const exists = JdrApp.utils.dom.$(`article[data-page="${page}"]`);
      
      this.currentRoute = page;
      
      // Handle dynamic category routing
      if (!exists) {
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
      if (target) target.classList.add('active');
      
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
          <button id="mjToggleBtn" class="btn-base btn-small" style="background: var(--bronze); color: white; border-color: var(--bronze);">
            🎭 Maître de jeu
          </button>
        </div>
      `;
      
      tocContainer.innerHTML = tocHTML;
      
      // Attacher les événements directement aux éléments après création
      this.attachFoldoutEvents();
      
      // Ajouter l'event listener pour le bouton MJ
      this.setupMJToggle();
    },

    setupMJToggle() {
      const mjBtn = document.getElementById('mjToggleBtn');
      if (!mjBtn) return;

      const handleMJToggle = () => {
        if (window.JdrApp.state.isMJ) {
          // Déjà en mode MJ, désactiver
          window.JdrApp.state.isMJ = false;
          mjBtn.style.background = 'var(--bronze)';
          mjBtn.innerHTML = '🎭 Maître de jeu';
          this.generateTOC(); // Régénérer le TOC pour cacher les sections MJ
        } else {
          // Demander confirmation avant d'activer le mode MJ
          this.showMJConfirmation(() => {
            window.JdrApp.state.isMJ = true;
            mjBtn.style.background = 'var(--gold)';
            mjBtn.innerHTML = '🎭 Mode MJ activé';
            this.generateTOC(); // Régénérer le TOC pour afficher les sections MJ
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
                content.style.maxHeight = '500px';
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
            JdrApp.modules.router.navigate(route);
          }
        });
      });
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
      } else if (item.id === 'monstres') {
        return `
          <div class="toc-category">
            <a data-route="monstres" href="#/monstres" class="">${item.icon} ${item.title}</a>
            <div class="toc-sub">
              ${dataSource && dataSource.length > 0 ? dataSource.map(category => 
                `<a data-route="monstres-${JdrApp.utils.data.sanitizeId(category.nom)}" href="#/monstres-${JdrApp.utils.data.sanitizeId(category.nom)}" class="">${this.getMonstreCategoryIcon(category.nom)} ${category.nom}</a>`
              ).join('') : '<span style="font-style: italic; color: #666; padding-left: 20px;">Aucun monstre défini</span>'}
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
      
      // Use PageBuilder to create the single objects page
      const pageHTML = window.PageBuilder.buildSingleObjectPage(window.OBJETS);
      
      // Update main content
      const mainContent = document.querySelector('#content');
      if (mainContent) {
        mainContent.innerHTML = pageHTML;
      }
      
      // Update active states
      this.updateActiveStates('objets');
      
      return true;
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
    }
  };

})();