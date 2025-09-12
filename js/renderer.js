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
      // Delay content generation to ensure all configurations are loaded
      setTimeout(() => {
        this.generateContent();
        this.autoLoadImages();
      }, 10);
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

      // Use progressive rendering to avoid blocking the main thread
      this.progressiveRender([
        { fn: () => this.generateStaticPages(), name: 'static' },
        { fn: () => this.generateClassPages(), name: 'classes' },
        { fn: () => this.generateCategoryPages(), name: 'categories' },
        { fn: () => this.generateMonstersPage(), name: 'monsters' }
      ], viewsContainer);
    },

    // Progressive rendering to avoid blocking the UI thread
    async progressiveRender(renderFunctions, container) {
      container.innerHTML = ''; // Clear first
      
      for (let i = 0; i < renderFunctions.length; i++) {
        const { fn, name } = renderFunctions[i];
        
        // Use requestAnimationFrame to yield to browser between renders
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            try {
              const html = fn();
              if (html) {
                container.insertAdjacentHTML('beforeend', html);
              }
            } catch (error) {
              console.warn(`Error rendering ${name}:`, error);
            }
            resolve();
          });
        });
        
        // Yield every few operations to prevent blocking
        if (i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      // Post-render operations with improved batching
      requestAnimationFrame(() => {
        this.batchPostRenderOperations();
        
      });
    },

    // Batch post-render operations to reduce layout thrashing
    batchPostRenderOperations() {
      // Batch DOM reads first, then writes
      const hasDevMode = JdrApp.modules.editor && JdrApp.modules.editor.isDevMode;
      const hasEditor = JdrApp.modules.editor;
      const monstersContainer = document.getElementById('monsters-container');

      // Batch writes
      this.autoLoadImages();
      
      if (hasEditor) {
        this.applyDevModeToNewContent();
        
        if (hasEditor.attachImageEvents) {
          hasEditor.attachImageEvents();
        }
        
        if (hasDevMode) {
          setTimeout(() => hasEditor.createProxyButtons(), 50);
        }
        
        // Force image event attachment after a delay to catch lazy-loaded images
        setTimeout(() => {
          if (hasEditor.attachImageEvents) {
            hasEditor.attachImageEvents();
          }
        }, 1000);
      }
      
      if (monstersContainer) {
        setTimeout(() => this.populateMonstersPage(), 30);
      }

      // Setup object search functionality if we're on the objects page
      this.setupObjectSearchIfNeeded();
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

    generateMonstersPage() {
      if (!window.MONSTRES) return '';
      
      return PageBuilder.buildSingleMonsterPage(window.MONSTRES);
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
        // DON'T make it active immediately - let the show() method handle this
        
        const viewsContainer = document.querySelector('#views');
        if (viewsContainer) {
          viewsContainer.appendChild(article);
        } else {
          // Views container not found
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
          } else if (window.STANDALONE_VERSION) {
            // FORCE STANDALONE MODE: Ensure dev-off class and hide all dev buttons
            document.body.className = 'dev-off';
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
          } else if (window.STANDALONE_VERSION) {
            // FORCE STANDALONE MODE: Ensure dev-off class and hide all dev buttons
            document.body.className = 'dev-off';
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
          } else if (window.STANDALONE_VERSION) {
            // FORCE STANDALONE MODE: Ensure dev-off class and hide all dev buttons
            document.body.className = 'dev-off';
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
    },

    populateMonstersPage() {
      const monstersContainer = document.getElementById('monstres-container');
      if (!monstersContainer || !window.MONSTRES) return;

      // Clear existing content
      monstersContainer.innerHTML = '';

      // Generate monster cards directly
      const cardsHTML = window.MONSTRES.map((monster, index) => 
        CardBuilder.create('monster', monster, 'monstres', index).build()
      ).join('');
      
      monstersContainer.innerHTML = cardsHTML;

      // Apply dev mode styling and load images
      this.applyDevModeToNewContent();
      this.autoLoadImages();
    },

    renderUnifiedContentPage(contentType, data) {
      // This method dynamically creates a unified content page (like objets or monstres)
      // using the PageBuilder with the appropriate build method
      let content = '';
      let pageId = '';
      
      if (contentType === 'objet' && data) {
        content = PageBuilder.buildSingleObjectPage(data);
        pageId = 'objets';
      } else if (contentType === 'monster' && data) {
        content = PageBuilder.buildSingleMonsterPage(data);
        pageId = 'monstres';
      } else if (contentType === 'tableTresor' && data) {
        content = PageBuilder.buildSingleTableTresorPage(data);
        pageId = 'tables-tresors';
      }
      
      if (content && pageId) {
        // Find or create the specific article element in #views
        const viewsContainer = document.querySelector('#views');
        if (viewsContainer) {
          // Remove existing article for this page if it exists
          const existingArticle = document.querySelector(`article[data-page="${pageId}"]`);
          if (existingArticle) {
            existingArticle.remove();
          }
          
          // Add the new content to the views container
          viewsContainer.insertAdjacentHTML('beforeend', content);
          
          this.autoLoadImages();
          
          // Apply dev mode state with slight delay to ensure DOM is processed
          if (!window.STANDALONE_VERSION && JdrApp.modules.editor) {
            setTimeout(() => {
              if (JdrApp.modules.editor.isDevMode) {
                JdrApp.modules.editor.forceShowAllEditButtons();
              } else {
                JdrApp.modules.editor.forceHideAllEditButtons();
              }
            }, 10);
          }
          
          // Setup object search specifically for objects page
          if (contentType === 'objet') {
            setTimeout(() => {
              this.setupObjectSearchIfNeeded();
            }, 100);
          }
        }
      }
    },

    setupObjectSearchIfNeeded() {
      // Check if we're on the objects page and the search input exists
      const idSearchInput = document.getElementById('id-search-input');
      const clearSearchButton = document.getElementById('clear-id-search');
      
      if (!idSearchInput) return; // Not on objects page or search not available

      // Remove any existing event listeners to avoid duplicates
      const newSearchInput = idSearchInput.cloneNode(true);
      idSearchInput.parentNode.replaceChild(newSearchInput, idSearchInput);
      
      // Add multiple event listeners to catch Enter key
      newSearchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const searchId = e.target.value.trim();
          this.performIdSearch(searchId);
        }
      });
      
      newSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const searchId = e.target.value.trim();
          this.performIdSearch(searchId);
        }
      });
      
      newSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const searchId = e.target.value.trim();
          this.performIdSearch(searchId);
        }
      });

      // Setup search button
      const searchButton = document.getElementById('search-object-btn');
      if (searchButton) {
        const newSearchButton = searchButton.cloneNode(true);
        searchButton.parentNode.replaceChild(newSearchButton, searchButton);
        
        newSearchButton.addEventListener('click', () => {
          const searchId = newSearchInput.value.trim();
          this.performIdSearch(searchId);
        });
      }

      // Setup clear search button if it exists
      if (clearSearchButton) {
        const newClearButton = clearSearchButton.cloneNode(true);
        clearSearchButton.parentNode.replaceChild(newClearButton, clearSearchButton);
        
        newClearButton.addEventListener('click', () => {
          this.clearIdSearch();
        });
      }
    },

    performIdSearch(searchId) {
      const resultDiv = document.getElementById('id-search-result');
      const objectsContainer = document.getElementById('objets-container');
      
      if (!searchId || !objectsContainer) {
        if (resultDiv) resultDiv.textContent = '';
        return;
      }

      // Hide all objects first
      const allObjectCards = objectsContainer.querySelectorAll('.card');
      allObjectCards.forEach(card => {
        card.style.display = 'none';
      });

      // Find object by ID (search in data-object-numero attribute)
      const targetCard = objectsContainer.querySelector(`[data-object-numero="${searchId}"]`);
      
      if (targetCard) {
        // Show the found object and center it
        targetCard.style.display = 'block';
        
        // Add highlight effect
        targetCard.style.border = '3px solid #16a34a';
        targetCard.style.boxShadow = '0 0 15px rgba(22, 163, 74, 0.5)';
        
        // Center the object with mobile-optimized approach
        setTimeout(() => {
          // Mobile-specific centering that accounts for viewport and layout
          const isMobile = window.innerWidth <= 768;
          
          if (isMobile) {
            // Mobile centering - account for mobile layout specifics
            const rect = targetCard.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // Calculate center position accounting for mobile viewport
            const targetY = rect.top + scrollTop - (windowHeight / 2) + (rect.height / 2);
            const targetX = rect.left + scrollLeft - (windowWidth / 2) + (rect.width / 2);
            
            // Scroll to center both vertically and horizontally on mobile
            window.scrollTo({
              top: Math.max(0, targetY),
              left: Math.max(0, targetX),
              behavior: 'smooth'
            });
          } else {
            // Desktop centering - use scrollIntoView which works well on desktop
            targetCard.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center', 
              inline: 'center' 
            });
          }
          
          // Additional fallback for problematic browsers
          setTimeout(() => {
            const rect = targetCard.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = rect.top + scrollTop - (windowHeight / 2) + (rect.height / 2);
            
            window.scrollTo({
              top: Math.max(0, targetY),
              behavior: 'smooth'
            });
          }, 300);
        }, 100);

        // Update search result message
        if (resultDiv) {
          const objectName = targetCard.getAttribute('data-objet-name') || 'Objet';
          resultDiv.innerHTML = `<span style="color: #16a34a;">✅ Objet #${searchId} trouvé: ${objectName}</span>`;
        }
        
        // Mark search as active
        window.activeIdSearch = true;
      } else {
        // No object found
        if (resultDiv) {
          resultDiv.innerHTML = `<span style="color: #dc2626;">❌ Aucun objet trouvé avec l'ID #${searchId}</span>`;
        }
        
        // Show all objects if nothing found
        allObjectCards.forEach(card => {
          card.style.display = 'block';
        });
      }
    },

    clearIdSearch() {
      const idSearchInput = document.getElementById('id-search-input');
      const resultDiv = document.getElementById('id-search-result');
      const objectsContainer = document.getElementById('objets-container');
      
      // Clear search input
      if (idSearchInput) {
        idSearchInput.value = '';
      }
      
      // Clear result message
      if (resultDiv) {
        resultDiv.textContent = '';
      }
      
      // Show all objects and remove highlights
      if (objectsContainer) {
        const allObjectCards = objectsContainer.querySelectorAll('.card');
        allObjectCards.forEach(card => {
          card.style.display = 'block';
          // Remove highlight effects
          card.style.border = '';
          card.style.boxShadow = '';
        });
      }
      
      // Mark search as inactive
      window.activeIdSearch = false;
    }
  };

})();