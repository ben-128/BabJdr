// ============================================================================
// JDR-BAB APPLICATION - RENDERER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // CONTENT RENDERER MODULE
  // ========================================
  JdrApp.modules.renderer = {
    currentSearch: '',
    
    init() {
      this.generateContent();
      this.autoLoadImages();
      this.setupEventListeners();
    },

    setupEventListeners() {
      EventBus.on(Events.PAGE_RENDER, (payload) => {
        if (payload.type === 'category') {
          this.renderCategoryPage(payload.categoryType, payload.category);
        }
      });

      EventBus.on(Events.CONTENT_ADD, () => {
        setTimeout(() => this.autoLoadImages(), 100);
      });
    },

    generateContent() {
      JdrApp.modules.router.generateTOC.call(JdrApp.modules.router);
      this.generateArticles();
      this.generateDevToolbox();
      
      if (JdrApp.modules.editor) {
        setTimeout(() => {
          if (JdrApp.modules.editor.isDevMode) {
            JdrApp.modules.editor.forceShowAllEditButtons();
          } else {
            JdrApp.modules.editor.forceHideAllEditButtons();
          }
        }, 100);
      }
    },

    generateArticles() {
      const viewsContainer = document.querySelector('#views');
      if (!viewsContainer) return;

      let articlesHTML = '';
      articlesHTML += this.generateStaticPages();
      articlesHTML += this.generateClassPages();
      articlesHTML += this.generateCategoryPages();

      viewsContainer.innerHTML = articlesHTML;
      setTimeout(() => {
        this.autoLoadImages();
        // Reapply dev mode state to new elements
        this.applyDevModeToNewContent();
        // Attach image events for standalone compatibility
        if (JdrApp.modules.editor && JdrApp.modules.editor.attachImageEvents) {
          JdrApp.modules.editor.attachImageEvents();
        }
        // Create proxy buttons for new content
        if (JdrApp.modules.editor && JdrApp.modules.editor.isDevMode) {
          setTimeout(() => JdrApp.modules.editor.createProxyButtons(), 100);
        }
      }, 100);
    },

    applyDevModeToNewContent() {
      if (JdrApp.modules.editor) {
        if (JdrApp.utils.isDevMode()) {
          JdrApp.modules.editor.forceShowAllEditButtons();
        } else {
          JdrApp.modules.editor.forceHideAllEditButtons();
        }
      }
    },


    generateStaticPages() {
      let html = '';
      if (window.STATIC_PAGES) {
        Object.entries(window.STATIC_PAGES).forEach(([pageId, pageData]) => {
          html += PageBuilder.buildStaticPage(pageId, pageData);
        });
      }
      return html;
    },

    populateMonstersPage() {
      const monstersContainer = document.getElementById('monsters-container');
      if (!monstersContainer) return;

      // Defensive check - ensure MONSTRES is an array
      if (!window.MONSTRES || !Array.isArray(window.MONSTRES)) {
        console.warn('window.MONSTRES is not an array:', window.MONSTRES);
        monstersContainer.innerHTML = '<p>Aucun monstre disponible. Vérifiez les données.</p>';
        return;
      }

      // Clear existing content
      monstersContainer.innerHTML = '';

      try {
        // Generate monster cards
        const monstersHTML = window.MONSTRES.map(monster => 
          CardBuilder.create('monster', monster).build()
        ).join('');

        monstersContainer.innerHTML = monstersHTML;

        // Apply dev mode styling
        this.applyDevModeToNewContent();
      } catch (error) {
        console.error('Error generating monster cards:', error);
        monstersContainer.innerHTML = '<p>Erreur lors du chargement des monstres.</p>';
      }
      this.autoLoadImages();
    },

    generateClassPages() {
      if (!window.CLASSES) return '';
      
      return window.CLASSES.map(classe => 
        PageBuilder.buildClassPage(classe)
      ).join('');
    },

    generateCategoryPages() {
      let html = '';
      
      if (window.SORTS) {
        html += window.SORTS.map(category => 
          PageBuilder.buildCategoryPage('spell', category)
        ).join('');
      }

      if (window.DONS) {
        html += window.DONS.map(category => 
          PageBuilder.buildCategoryPage('don', category)
        ).join('');
      }

      // Generate single objects page (different from category pages)
      if (window.OBJETS) {
        html += PageBuilder.buildSingleObjectPage(window.OBJETS);
      }

      return html;
    },

    renderCategoryPage(type, category) {
      const config = window.ContentTypes[type];
      
      // Handle special case for objects (single page, no category name)
      let pageId;
      if (type === 'objet') {
        pageId = 'objets'; // Objects use fixed page ID
      } else {
        pageId = `${config.container}-${JdrApp.utils.data.sanitizeId(category.nom)}`;
      }
      
      let article = document.querySelector(`article[data-page="${pageId}"]`);
      
      // Create article if it doesn't exist (for dynamically created categories)
      if (!article) {
        article = document.createElement('article');
        article.setAttribute('data-page', pageId);
        article.className = 'active'; // Make it active since we're showing it
        
        const viewsContainer = document.querySelector('#views');
        if (viewsContainer) {
          viewsContainer.appendChild(article);
        } else {
          console.warn('Views container not found');
          return;
        }
      }
      
      const newContent = PageBuilder.buildCategoryPage(type, category);
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(newContent, 'text/html');
      const newArticle = newDoc.querySelector('article');
      
      if (newArticle) {
        article.innerHTML = newArticle.innerHTML;
        
        // Make sure only this article is active
        document.querySelectorAll('article').forEach(a => a.classList.remove('active'));
        article.classList.add('active');
        
        // Plus simple et plus fiable
        this.autoLoadImages();
        
        // Attach image events for standalone compatibility
        if (JdrApp.modules.editor && JdrApp.modules.editor.attachImageEvents) {
          JdrApp.modules.editor.attachImageEvents();
        }
        
        // Ensure dev mode state is applied after content change
        setTimeout(() => {
          if (!window.STANDALONE_VERSION && JdrApp.modules.editor) {
            if (JdrApp.modules.editor.isDevMode) {
              JdrApp.modules.editor.forceShowAllEditButtons();
            } else {
              JdrApp.modules.editor.forceHideAllEditButtons();
            }
          }
        }, 50);
      }
    },

    renderSortCategory(page) {
      const categoryId = page.replace('sorts-', '');
      const category = window.SORTS?.find(cat => 
        JdrApp.utils.data.sanitizeId(cat.nom) === categoryId
      );
      
      if (category) {
        this.renderCategoryPage('spell', category);
      }
    },

    generateDevToolbox() {
      const devToolbox = JdrApp.utils.dom.$('#devToolbox');
      if (!devToolbox) return;

      const toolboxHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--rule);">
          <span style="font-size: 18px;">🛠</span>
          <strong style="color: var(--accent-ink); font-family: 'Cinzel', serif;">Outils de développement</strong>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: var(--paper-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">✏️ Édition</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn small" id="saveAndExport" title="Sauvegarder et exporter tout en ZIP">💾 Export ZIP</button>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: var(--paper-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">📝 Création</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn small" id="addCategory" title="Créer une nouvelle catégorie/page">📄 Nouvelle page</button>
            <button class="btn small" id="addSpellCategory" title="Créer une nouvelle catégorie de sorts">🔮 Catégorie de sorts</button>
            <button class="btn small" id="addDonCategory" title="Créer une nouvelle catégorie de dons">🎖️ Catégorie de dons</button>
          </div>
        </div>
        
        <div>
          <div style="font-size: 12px; color: var(--paper-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">🎭 Ressources</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn small" id="elementsBtn" title="Choisir un élément pour copier sa balise HTML colorée">🎨 Éléments</button>
            <button class="btn small" id="etatsBtn" title="Choisir un état pour copier sa balise HTML avec tooltip">⚡ États</button>
          </div>
        </div>
      `;

      devToolbox.innerHTML = toolboxHTML;
    },

    autoLoadImages() {
      if (JdrApp.modules.images) {
        return JdrApp.modules.images.autoLoadImages();
      }
      return 0;
    },

    regenerateCurrentPage() {
      // Find the currently active article
      const activeArticle = document.querySelector('article.active');
      if (!activeArticle) return;

      const pageId = activeArticle.dataset.page;
      if (!pageId) return;

      // Determine what type of page it is and regenerate only that page
      if (pageId.startsWith('sorts-')) {
        const categoryId = pageId.replace('sorts-', '');
        const category = window.SORTS?.find(cat => 
          JdrApp.utils.data.sanitizeId(cat.nom) === categoryId
        );
        if (category) {
          this.renderCategoryPage('spell', category);
        }
      } else if (pageId.startsWith('dons-')) {
        const categoryId = pageId.replace('dons-', '');
        const category = window.DONS?.find(cat => 
          JdrApp.utils.data.sanitizeId(cat.nom) === categoryId
        );
        if (category) {
          this.renderCategoryPage('don', category);
        }
      } else if (pageId === 'objets') {
        // Regenerate objects page using the generic approach
        const newHTML = this.generatePageContent(pageId);
        if (newHTML) {
          activeArticle.innerHTML = newHTML;
          this.autoLoadImages();
          
          // Apply dev mode state immediately
          if (!window.STANDALONE_VERSION && JdrApp.modules.editor) {
            if (JdrApp.modules.editor.isDevMode) {
              JdrApp.modules.editor.forceShowAllEditButtons();
            } else {
              JdrApp.modules.editor.forceHideAllEditButtons();
            }
          }
        }
      } else {
        // For class pages, static pages, etc. - regenerate the specific content
        const newHTML = this.generatePageContent(pageId);
        if (newHTML) {
          activeArticle.innerHTML = newHTML;
          this.autoLoadImages();
          
          // Apply dev mode state immediately
          if (!window.STANDALONE_VERSION && JdrApp.modules.editor) {
            if (JdrApp.modules.editor.isDevMode) {
              JdrApp.modules.editor.forceShowAllEditButtons();
            } else {
              JdrApp.modules.editor.forceHideAllEditButtons();
            }
          }
        }
      }
    },

    generatePageContent(pageId) {
      // Generate content for a specific page without affecting navigation
      if (window.CLASSES) {
        const classe = window.CLASSES.find(c => JdrApp.utils.data.sanitizeId(c.nom) === pageId);
        if (classe) {
          const content = PageBuilder.buildClassPage(classe);
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          const article = doc.querySelector('article');
          return article ? article.innerHTML : null;
        }
      }

      if (window.STATIC_PAGES && window.STATIC_PAGES[pageId]) {
        const content = PageBuilder.buildStaticPage(pageId, window.STATIC_PAGES[pageId]);
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const article = doc.querySelector('article');
        return article ? article.innerHTML : null;
      }

      // Handle objects page
      if (pageId === 'objets' && window.OBJETS) {
        const content = PageBuilder.buildSingleObjectPage(window.OBJETS);
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const article = doc.querySelector('article');
        return article ? article.innerHTML : null;
      }

      return null;
    }
  };

})();