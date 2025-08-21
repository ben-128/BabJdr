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
      
      // Set up TOC click handlers
      JdrApp.utils.events.register('click', '.toc a', (e) => {
        e.preventDefault();
        const route = e.target.getAttribute('data-route');
        if (route) {
          this.navigate(route);
        }
      });

      // Set up category collapse/expand
      JdrApp.utils.events.register('click', '.toc-category > a', (e) => {
        e.preventDefault();
        const category = e.target.closest('.toc-category');
        if (category) {
          category.classList.toggle('collapsed');
        }
      });
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
      
      // Apply dev mode state after page change
      setTimeout(() => {
        if (JdrApp.modules.editor) {
          if (JdrApp.modules.editor.isDevMode) {
            JdrApp.modules.editor.forceShowAllEditButtons();
          } else {
            JdrApp.modules.editor.forceHideAllEditButtons();
          }
        }
      }, 100);
    },
    
    navigate(route) {
      location.hash = `#/${route}`;
    },
    
    getCurrentRoute() {
      return this.currentRoute;
    },
    
    // Generate table of contents based on data
    generateTOC() {
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
        'Prêtre': '⛪',
        'Rôdeur': '🏃',
        'Enchanteur': '✨',
        'Généraux': '🎖️'
      };
      return icons[categoryName] || '🎖️';
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