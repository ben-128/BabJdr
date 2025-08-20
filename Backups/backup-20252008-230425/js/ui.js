// ============================================================================
// JDR-BAB APPLICATION - UI MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // UI INTERACTIONS MODULE
  // ========================================
  JdrApp.modules.ui = {
    
    init() {
      this.setupEventListeners();
      this.setupSearch();
      this.setupModals();
      this.setupResponsive();
    },

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

      // UI event handlers
      this.setupContentHandlers();
    },

    setupContentHandlers() {
      // Generic content addition
      JdrApp.utils.events.register('click', '[class$="-add"]', (e) => {
        const type = this.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        if (type && categoryName) {
          this.addContent(type, categoryName);
        }
      });

      // Generic content deletion
      JdrApp.utils.events.register('click', '[class$="-delete"]', (e) => {
        console.log('🗑️ Delete button clicked!');
        console.log('Button className:', e.target.className);
        console.log('Button dataset:', e.target.dataset);
        
        const type = this.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        console.log('Extracted type:', type);
        console.log('Category name:', categoryName);
        
        // Handle different dataset attribute naming patterns
        let itemName;
        if (type === 'spell') {
          itemName = e.target.dataset.spellName;
        } else if (type === 'don') {
          itemName = e.target.dataset.donName;
        } else if (type === 'class') {
          itemName = e.target.dataset.className || e.target.dataset.subclassName;
        } else {
          itemName = e.target.dataset[`${type}Name`];
        }
        
        console.log('Item name:', itemName);
        console.log('All conditions met:', !!(type && categoryName && itemName));
        
        if (type && categoryName && itemName) {
          console.log('Calling deleteContent with:', { type, categoryName, itemName });
          this.deleteContent(type, categoryName, itemName);
        } else {
          console.warn('Missing delete data:', { type, categoryName, itemName });
        }
      });

      // Generic content movement
      JdrApp.utils.events.register('click', '[class*="-move-"]', (e) => {
        const type = this.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        // Handle different dataset attribute naming patterns
        let itemName;
        if (type === 'spell') {
          itemName = e.target.dataset.spellName;
        } else if (type === 'don') {
          itemName = e.target.dataset.donName;
        } else if (type === 'class') {
          itemName = e.target.dataset.className || e.target.dataset.subclassName;
        } else {
          itemName = e.target.dataset[`${type}Name`];
        }
        
        const direction = e.target.className.includes('move-up') ? -1 : 1;
        
        if (type && categoryName && itemName) {
          this.moveContent(type, categoryName, itemName, direction);
        }
      });

      // Paragraph addition
      JdrApp.utils.events.register('click', '.add-paragraph-btn', (e) => {
        const target = e.target.dataset.target;
        this.addParagraph(target, e.target);
      });

      // Section deletion for static pages
      JdrApp.utils.events.register('click', '.section-delete', (e) => {
        const sectionName = e.target.dataset.sectionName;
        if (sectionName && confirm(`Supprimer la section "${sectionName}" ?`)) {
          this.deleteSection(sectionName, e.target);
        }
      });
    },

    extractTypeFromClass(className) {
      if (className.includes('spell')) return 'spell';
      if (className.includes('don')) return 'don';
      if (className.includes('class')) return 'class';
      return null;
    },

    addContent(type, categoryName) {
      const config = window.ContentTypes[type];
      if (!config) return;

      const defaultItem = ContentFactory.createDefaultItem(type);
      const success = ContentFactory.addItem(type, categoryName, defaultItem);
      
      if (success) {
        EventBus.emit(Events.PAGE_RENDER, {
          type: 'category',
          categoryType: type,
          category: ContentFactory.getEntity(type).findCategory(categoryName)
        });
        
        this.showNotification(`${config.icons.item} Nouvel élément ajouté`);
      }
    },

    deleteContent(type, categoryName, itemName) {
      if (!confirm(`Supprimer "${itemName}" ?`)) return;

      const success = ContentFactory.deleteItem(type, categoryName, itemName);
      
      if (success) {
        EventBus.emit(Events.PAGE_RENDER, {
          type: 'category',
          categoryType: type,
          category: ContentFactory.getEntity(type).findCategory(categoryName)
        });
        
        this.showNotification('🗑 Élément supprimé');
      }
    },

    moveContent(type, categoryName, itemName, direction) {
      const success = ContentFactory.moveItem(type, categoryName, itemName, direction);
      
      if (success) {
        EventBus.emit(Events.PAGE_RENDER, {
          type: 'category',
          categoryType: type,
          category: ContentFactory.getEntity(type).findCategory(categoryName)
        });
        
        const directionText = direction > 0 ? 'descendu' : 'monté';
        this.showNotification(`🔄 Élément ${directionText}`);
      }
    },

    addParagraph(target, button) {
      // Handle different types of additions based on target
      if (target === 'section') {
        this.addNewSection(button);
      } else {
        this.addParagraphToSection(target, button);
      }
    },

    addNewSection(button) {
      // Generate a unique but readable ID
      const pageId = this.getCurrentPageId();
      const sectionCount = this.countExistingSections();
      const sectionId = `${pageId}-new-${sectionCount + 1}-${Date.now()}`;
      
      const newSection = document.createElement('div');
      newSection.className = 'card editable-section';
      newSection.dataset.sectionType = 'card';
      newSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="generic" data-edit-section="${sectionId}-title">Nouvelle section</h3>
            <button class="edit-btn edit-title-btn" title="Éditer le titre">✏️</button>
          </div>
        </div>
        <div style="position:relative;">
          <div class="editable" data-edit-type="generic" data-edit-section="${sectionId}">
            <p>Contenu de la nouvelle section.</p>
          </div>
          <button class="edit-btn edit-section-btn" title="Éditer cette section">✏️</button>
        </div>
        <div style="margin-top: 1rem; text-align: center;">
          <button class="section-delete btn small" data-section-name="Nouvelle section" type="button" style="background: #ff6b6b; color: white;">🗑 Supprimer section</button>
        </div>
      `;
      
      button.parentNode.insertBefore(newSection, button);
      
      // Immediately save the new section to JSON
      this.saveNewSectionToJSON(sectionId, "Nouvelle section", "<p>Contenu de la nouvelle section.</p>");
      
      // No need to recalculate indices - unique IDs prevent conflicts
      // this.recalculateSectionIndices();
      
      // Trigger persistent storage save
      this.triggerDataSave();
      
      this.showNotification('➕ Nouvelle section ajoutée et sauvegardée');
    },

    addParagraphToSection(target, button) {
      // Generate a unique but readable ID
      const pageId = this.getCurrentPageId();
      const sectionCount = this.countExistingSections();
      const paragraphId = `${pageId}-para-${sectionCount + 1}-${Date.now()}`;
      
      const container = document.createElement('div');
      container.className = 'editable-paragraph card';
      container.dataset.sectionType = 'card';
      container.style.position = 'relative';
      container.style.marginTop = '1rem';
      
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="generic" data-edit-section="${paragraphId}-title">Nouveau paragraphe</h3>
            <button class="edit-btn edit-title-btn" title="Éditer le titre">✏️</button>
          </div>
        </div>
        <div style="position:relative;">
          <div class="editable" data-edit-type="generic" data-edit-section="${paragraphId}">
            <p>Contenu du nouveau paragraphe.</p>
          </div>
          <button class="edit-btn edit-section-btn" title="Éditer cette section">✏️</button>
        </div>
        <div style="margin-top: 1rem; text-align: center;">
          <button class="section-delete btn small" data-section-name="Nouveau paragraphe" type="button" style="background: #ff6b6b; color: white;">🗑 Supprimer section</button>
        </div>
      `;
      
      button.parentNode.insertBefore(container, button);
      
      // Immediately save the new paragraph as a section to JSON
      this.saveNewSectionToJSON(paragraphId, "Nouveau paragraphe", "<p>Contenu du nouveau paragraphe.</p>");
      
      // No need to recalculate indices - unique IDs prevent conflicts
      // this.recalculateSectionIndices();
      
      // Trigger persistent storage save
      this.triggerDataSave();
      
      this.showNotification('➕ Paragraphe ajouté et sauvegardé');
    },

    deleteSection(sectionName, button) {
      // Find and remove the section
      const section = button.closest('.card');
      if (section) {
        // Extract the section ID from the editable elements
        const editableElement = section.querySelector('[data-edit-section]');
        let sectionId = null;
        if (editableElement) {
          sectionId = editableElement.dataset.editSection;
          // Remove "-title" suffix if present to get base ID
          if (sectionId.endsWith('-title')) {
            sectionId = sectionId.replace('-title', '');
          }
        }
        
        section.remove();
        
        // Save the deletion to JSON
        if (sectionId) {
          this.deleteSectionFromJSON(sectionId);
        }
        
        // Recalculate all section indices after deletion
        this.recalculateSectionIndices();
        
        // Trigger persistent storage save
        this.triggerDataSave();
        
        this.showNotification(`🗑️ Section "${sectionName}" supprimée et mise à jour JSON`);
      }
    },

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

    setupSearch() {
      const searchInput = JdrApp.utils.dom.$('#search');
      const clearButton = JdrApp.utils.dom.$('#clear');
      let searchTimeout;
      
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

      // Remove click outside handler since we're not using dropdown anymore
      // JdrApp.utils.events.register('click', 'body', (e) => {
      //   if (!e.target.closest('.searchbar') && !e.target.closest('#search-results')) {
      //     this.hideSearchResults();
      //   }
      // });

      // Remove EventBus listener that may cause issues
      // EventBus.on(Events.SEARCH_PERFORM, (payload) => {
      //   this.performSearch(payload.query);
      // });
    },

    performSearch(query) {
      const normalizedQuery = query.toLowerCase().trim();
      
      if (!normalizedQuery) {
        this.showAllContent();
        this.clearMainSearchResults();
        return;
      }

      // Search without minimum character limit since user has to press Enter
      const results = this.searchInData(normalizedQuery);
      this.displaySearchResultsInMain(results, normalizedQuery);
      
      // Keep existing TOC search for compatibility
      this.searchInTOC(normalizedQuery);
    },

    searchInData(query) {
      const results = [];
      
      // Search in SORTS
      if (window.SORTS) {
        window.SORTS.forEach(category => {
          if (category.sorts) {
            category.sorts.forEach(sort => {
              if (this.matchesSearch(sort, query)) {
                const url = `#/sorts-${JdrApp.utils.data.sanitizeId(category.nom)}`;
                
                results.push({
                  type: 'spell',
                  category: category.nom,
                  item: sort,
                  url: url,
                  summary: this.generateSpellSummary(sort)
                });
              }
            });
          }
        });
      }

      // Search in DONS
      if (window.DONS) {
        window.DONS.forEach(category => {
          if (category.dons) {
            category.dons.forEach(don => {
              if (this.matchesSearch(don, query)) {
                results.push({
                  type: 'don',
                  category: category.nom,
                  item: don,
                  url: `#/dons-${JdrApp.utils.data.sanitizeId(category.nom)}`,
                  summary: this.generateDonSummary(don)
                });
              }
            });
          }
        });
      }

      // Search in CLASSES
      if (window.CLASSES) {
        window.CLASSES.forEach(classe => {
          if (this.matchesSearch(classe, query)) {
            results.push({
              type: 'class',
              category: null,
              item: classe,
              url: `#/${JdrApp.utils.data.sanitizeId(classe.nom)}`,
              summary: this.generateClassSummary(classe)
            });
          }
          
          // Search in subclasses
          if (classe.sousClasses) {
            classe.sousClasses.forEach(sousClasse => {
              if (this.matchesSearch(sousClasse, query)) {
                results.push({
                  type: 'subclass',
                  category: classe.nom,
                  item: sousClasse,
                  url: `#/${JdrApp.utils.data.sanitizeId(classe.nom)}`,
                  summary: this.generateSubclassSummary(sousClasse, classe.nom)
                });
              }
            });
          }
        });
      }

      // Search in static pages
      this.searchInStaticPages(query, results);
      
      return results.slice(0, 10); // Limit to 10 results
    },

    searchInStaticPages(query, results) {
      // Search in static pages data
      if (window.STATIC_PAGES) {
        Object.keys(window.STATIC_PAGES).forEach(pageId => {
          const pageData = window.STATIC_PAGES[pageId];
          if (this.matchesStaticPage(pageData, query)) {
            results.push({
              type: 'staticPage',
              category: null,
              item: pageData,
              url: `#/${pageId}`,
              summary: this.generateStaticPageSummary(pageData)
            });
          }
        });
      }

      // Also search in static page config if available
      if (window.STATIC_PAGE_CONFIG?.pages) {
        window.STATIC_PAGE_CONFIG.pages.forEach(pageConfig => {
          if (pageConfig.active && this.matchesPageConfig(pageConfig, query)) {
            // Only add if we haven't already found this page
            const alreadyExists = results.some(r => 
              r.type === 'staticPage' && r.url === `#/${pageConfig.id}`
            );
            
            if (!alreadyExists) {
              results.push({
                type: 'staticPage',
                category: null,
                item: { 
                  title: pageConfig.title, 
                  page: pageConfig.id,
                  description: `Page sur ${pageConfig.title.toLowerCase()}`
                },
                url: `#/${pageConfig.id}`,
                summary: this.generatePageConfigSummary(pageConfig)
              });
            }
          }
        });
      }
    },

    matchesStaticPage(pageData, query) {
      const searchText = [
        pageData.title || '',
        pageData.page || '',
        this.extractStaticPageContent(pageData.sections || [])
      ].join(' ').toLowerCase();
      
      return searchText.includes(query);
    },

    matchesPageConfig(pageConfig, query) {
      const searchText = [
        pageConfig.title || '',
        pageConfig.id || ''
      ].join(' ').toLowerCase();
      
      return searchText.includes(query);
    },

    extractStaticPageContent(sections) {
      return sections.map(section => {
        let content = '';
        if (section.content) {
          if (typeof section.content === 'string') {
            content += section.content;
          } else if (section.content.content) {
            // New HTML format: extract text from HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = section.content.content;
            content += tempDiv.textContent || tempDiv.innerText || '';
          } else if (section.content.items && Array.isArray(section.content.items)) {
            // Legacy format
            content += section.content.items.join(' ');
          }
        }
        return content;
      }).join(' ');
    },

    matchesSearch(item, query) {
      const searchText = [
        item.nom || '',
        item.description || '',
        item.prerequis || '',
        item.resume || '',
        Array.isArray(item.capacites) ? item.capacites.join(' ') : ''
      ].join(' ').toLowerCase();
      
      return searchText.includes(query);
    },

    generateSpellSummary(spell) {
      // Strip HTML tags from fields to avoid breaking template
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `🔮 ${stripHtml(spell.nom)} - ${stripHtml(spell.prerequis || 'Aucun prérequis')} | ${stripHtml(spell.coutMana || 'Coût inconnu')}`;
    },

    generateDonSummary(don) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `🏆 ${stripHtml(don.nom)} - ${stripHtml(don.prerequis || 'Aucun prérequis')} | ${stripHtml(don.cout || 'Coût inconnu')}`;
    },

    generateClassSummary(classe) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `⚔️ ${stripHtml(classe.nom)} - ${stripHtml(classe.resume || 'Classe de combat')}`;
    },

    generateSubclassSummary(sousClasse, parentClass) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `⚡ ${stripHtml(sousClasse.nom)} (${stripHtml(parentClass)}) - Sous-classe spécialisée`;
    },

    generateStaticPageSummary(pageData) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `📄 ${stripHtml(pageData.title)} - ${stripHtml(pageData.description || 'Page d\'information du jeu')}`;
    },

    generatePageConfigSummary(pageConfig) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `📄 ${stripHtml(pageConfig.title)} - Guide et informations sur ${stripHtml(pageConfig.title.toLowerCase())}`;
    },

    slugify(text) {
      return text.toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    },

    showAllContent() {
      JdrApp.utils.dom.$$('article, .toc a').forEach(el => {
        el.style.display = '';
      });
    },

    displaySearchResultsInMain(results, query) {
      const main = document.querySelector('main');
      if (!main) return;

      // Create search results page content
      const searchPageHTML = this.generateSearchResultsPage(results, query);
      
      // Replace main content with search results
      main.innerHTML = searchPageHTML;
      
      // Quick debug to see card dimensions
      setTimeout(() => {
        const cards = main.querySelectorAll('.search-result-card');
        console.log('Cards found:', cards.length);
        cards.forEach((card, i) => {
          console.log(`Card ${i+1} dimensions:`, {
            height: card.offsetHeight,
            width: card.offsetWidth,
            display: getComputedStyle(card).display,
            visibility: getComputedStyle(card).visibility
          });
        });
      }, 100);
      
      // Setup click handlers for results
      this.setupMainSearchHandlers();
      
      // Also setup direct handlers as fallback
      this.setupDirectHandlers();
    },

    generateSearchResultsPage(results, query) {
      if (results.length === 0) {
        return `
          <div class="search-page">
            <div class="search-page-header">
              <h1>🔍 Recherche: "${query}"</h1>
              <p class="search-no-results">Aucun résultat trouvé</p>
              <button class="btn small" onclick="JdrApp.modules.ui.clearMainSearchResults()">
                ← Retour au sommaire
              </button>
            </div>
          </div>
        `;
      }
      
      let resultsHTML = '';
      
      try {
        resultsHTML = results.map((result, index) => {
          const itemName = result.item.nom || result.item.title || 'Sans nom';
          
          
          // Generate preview safely
          let preview;
          try {
            preview = this.generatePreview(result.item, result.type);
          } catch (previewError) {
            console.error('Preview error:', previewError);
            preview = '<div class="preview-field">Erreur dans l\'aperçu</div>';
          }
          
          // Escape potentially problematic text
          const escapeAttr = (text) => {
            if (!text) return '';
            return String(text).replace(/"/g, '&quot;');
          };
          
          const escapeText = (text) => {
            if (!text) return '';
            return String(text)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          };

          const cardHTML = `
            <article class="search-result-card" data-url="${result.url}">
              <div class="search-result-header">
                <h3>${this.getTypeIcon(result.type)} ${itemName}</h3>
                <div class="search-result-type">${this.getTypeName(result.type)}</div>
              </div>
              <div class="search-result-content">
                <div class="search-result-summary">${escapeText(result.summary || 'Pas de résumé')}</div>
                ${result.category ? `<div class="search-result-category">📂 Catégorie: ${escapeText(result.category)}</div>` : ''}
                <div class="search-result-preview">
                  ${preview}
                </div>
              </div>
              <div class="search-result-footer">
                <button class="btn small search-result-btn" data-url="${result.url}">
                  Voir la page →
                </button>
              </div>
            </article>
          `;
          
          return cardHTML;
        }).join('');
      } catch (error) {
        console.error('Error generating results HTML:', error);
        resultsHTML = '<div class="error">Erreur lors de la génération des résultats</div>';
      }

      const finalHTML = `
        <div class="search-page">
          <div class="search-page-header">
            <h1>🔍 Recherche: "${query}"</h1>
            <p class="search-results-count">${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}</p>
            <button class="btn small" onclick="JdrApp.modules.ui.clearMainSearchResults()">
              ← Retour au sommaire
            </button>
          </div>
          <div class="search-results-grid">
            ${resultsHTML}
          </div>
        </div>
      `;
      
      return finalHTML;
    },

    getTypeIcon(type) {
      const icons = {
        'spell': '🔮',
        'don': '🏆', 
        'class': '⚔️',
        'subclass': '⚡',
        'staticPage': '📄'
      };
      return icons[type] || '📄';
    },

    getTypeName(type) {
      const names = {
        'spell': 'Sort',
        'don': 'Don',
        'class': 'Classe',
        'subclass': 'Sous-classe',
        'staticPage': 'Page'
      };
      return names[type] || 'Contenu';
    },

    generatePreview(item, type) {
      // Strip all HTML and clean text completely
      const cleanText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&[^;]+;/g, ' ') // Remove HTML entities
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .substring(0, 100); // Limit length
      };

      switch (type) {
        case 'spell':
          const desc = cleanText(item.description || 'Non spécifiée');
          const portee = cleanText(item.portee || 'Non spécifiée');
          return `<div class="preview-field">Description: ${desc}</div><div class="preview-field">Portée: ${portee}</div>`;
          
        case 'don':
          const donDesc = cleanText(item.description || 'Non spécifiée');
          return `<div class="preview-field">Description: ${donDesc}</div>`;
          
        case 'class':
          const resume = cleanText(item.resume || 'Non spécifié');
          return `<div class="preview-field">Résumé: ${resume}</div>`;
          
        case 'subclass':
          const progression = cleanText(item.progression || 'Non spécifiée');
          return `<div class="preview-field">Progression: ${progression}</div>`;
          
        case 'staticPage':
          const content = this.extractStaticPageContent(item.sections || []);
          const preview = cleanText(content || 'Page d\'information');
          return `<div class="preview-field">Contenu: ${preview}</div>`;
          
        default:
          return '<div class="preview-field">Aperçu non disponible</div>';
      }
    },

    setupMainSearchHandlers() {
      // Handle click on entire card
      JdrApp.utils.events.register('click', '.search-result-card', (e) => {
        console.log('Card clicked, currentTarget:', e.currentTarget);
        if (e.target.closest('.search-result-btn')) return; // Let button handle it
        
        const url = e.currentTarget ? e.currentTarget.dataset.url : null;
        console.log('Card URL:', url);
        
        if (url && url !== '#test') {
          console.log('Navigating to:', url);
          window.location.hash = url;
          // Force page reload to trigger router
          window.location.reload();
        } else {
          console.warn('No valid URL found on card');
        }
      });

      // Handle button clicks
      JdrApp.utils.events.register('click', '.search-result-btn', (e) => {
        console.log('Button clicked, target:', e.target);
        e.stopPropagation();
        
        const url = e.target ? e.target.dataset.url : null;
        console.log('Button URL:', url);
        
        if (url && url !== '#test') {
          console.log('Navigating to:', url);
          window.location.hash = url;
          // Force page reload to trigger router
          window.location.reload();
        } else {
          console.warn('No valid URL found on button');
        }
      });
    },

    setupDirectHandlers() {
      // Direct event listeners on the elements themselves
      setTimeout(() => {
        const cards = document.querySelectorAll('.search-result-card');
        const buttons = document.querySelectorAll('.search-result-btn');
        
        console.log('Setting up direct handlers for', cards.length, 'cards and', buttons.length, 'buttons');
        
        cards.forEach((card, index) => {
          const url = card.dataset.url;
          console.log(`Card ${index + 1} URL:`, url);
          
          card.addEventListener('click', (e) => {
            if (e.target.closest('.search-result-btn')) return;
            console.log('Direct card click, URL:', url);
            if (url && url !== '#test') {
              window.location.hash = url;
              window.location.reload();
            }
          });
        });
        
        buttons.forEach((button, index) => {
          const url = button.dataset.url;
          console.log(`Button ${index + 1} URL:`, url);
          
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Direct button click, URL:', url);
            if (url && url !== '#test') {
              window.location.hash = url;
              window.location.reload();
            }
          });
        });
      }, 200);
    },

    clearMainSearchResults() {
      // Reload the current page or go back to homepage
      if (window.location.hash && window.location.hash !== '#/') {
        window.location.reload();
      } else {
        window.location.hash = '#/creation';
      }
    },

    searchInTOC(query) {
      JdrApp.utils.dom.$$('.toc a').forEach(link => {
        const text = link.textContent.toLowerCase();
        const isMatch = text.includes(query);
        link.style.display = isMatch ? '' : 'none';
        
        if (isMatch) {
          const category = link.closest('.toc-category');
          if (category) {
            category.classList.remove('collapsed');
          }
        }
      });
    },

    searchInContent(query) {
      JdrApp.utils.dom.$$('article').forEach(article => {
        const text = article.textContent.toLowerCase();
        const isMatch = text.includes(query);
        
        if (isMatch) {
          this.highlightSearchTerms(article, query);
        }
      });
    },

    highlightSearchTerms(container, query) {
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(query)) {
          textNodes.push(node);
        }
      }

      textNodes.forEach(textNode => {
        const regex = new RegExp(`(${query})`, 'gi');
        const content = textNode.textContent;
        
        if (regex.test(content)) {
          const highlightedContent = content.replace(regex, '<mark>$1</mark>');
          const wrapper = document.createElement('span');
          wrapper.innerHTML = highlightedContent;
          textNode.parentNode.replaceChild(wrapper, textNode);
        }
      });
    },

    setupModals() {
      JdrApp.utils.events.register('click', '.modal-overlay, .modal-close', (e) => {
        const modal = e.target.closest('.modal') || document.querySelector('.modal.visible');
        if (modal) {
          this.closeModal(modal);
        }
      });

      JdrApp.utils.events.register('click', '.modal-content', (e) => {
        e.stopPropagation();
      });

      JdrApp.utils.events.register('keydown', 'body', (e) => {
        if (e.key === 'Escape') {
          const openModal = document.querySelector('.modal.visible');
          if (openModal) {
            this.closeModal(openModal);
          }
        }
      });

      // Resource tools
      JdrApp.utils.events.register('click', '#elementsBtn', () => {
        this.showElementsModal();
      });


      EventBus.on(Events.MODAL_OPEN, (payload) => {
        this.openModal(payload.modalId);
      });

      EventBus.on(Events.MODAL_CLOSE, (payload) => {
        const modal = payload.modal || document.querySelector('.modal.visible');
        if (modal) {
          this.closeModal(modal);
        }
      });
    },

    openModal(modalId) {
      const modal = JdrApp.utils.dom.$(`#${modalId}`);
      if (modal) {
        modal.classList.add('visible');
        modal.style.display = 'flex';
        
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
          firstInput.focus();
        }
      }
    },

    closeModal(modal) {
      if (modal) {
        modal.classList.remove('visible');
        modal.style.display = 'none';
        
        const form = modal.querySelector('form');
        if (form) {
          form.reset();
        }
      }
    },

    showElementsModal() {
      let modal = JdrApp.utils.dom.$('#elementsModal');
      if (!modal) {
        modal = this.createElementsModal();
        document.body.appendChild(modal);
      }
      
      this.openModal('elementsModal');
    },

    createElementsModal() {
      const elements = Object.entries(window.ElementColors).map(([name, config]) => ({
        name,
        color: config.color,
        icon: this.getElementIcon(name)
      }));

      const elementsHTML = elements.map(element => `
        <div class="element-item" data-element="${element.name}" data-color="${element.color}">
          <div class="element-icon" style="background: ${element.color};">${element.icon}</div>
          <div class="element-name">${element.name}</div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = JdrApp.utils.dom.create('div', 'modal elements-modal', `
        <div class="modal-content elements-modal-content">
          <h3>🎨 Éléments</h3>
          <p>Cliquez sur un élément pour copier sa balise HTML colorée.</p>
          <div class="elements-list">
            ${elementsHTML}
          </div>
          <button class="modal-close btn">Fermer</button>
        </div>
      `, { id: 'elementsModal' });

      modal.addEventListener('click', (e) => {
        const elementItem = e.target.closest('.element-item');
        if (elementItem) {
          const elementName = elementItem.dataset.element;
          
          // Get the full style configuration from ElementColors
          const style = window.ElementColors[elementName];
          if (style) {
            // Build the complete style string
            let styleString = `color: ${style.color}; font-weight: ${style.weight || 'bold'};`;
            if (style.background) styleString += ` background: ${style.background};`;
            if (style.padding) styleString += ` padding: ${style.padding};`;
            if (style.borderRadius) styleString += ` border-radius: ${style.borderRadius};`;
            
            const html = `<span style="${styleString}">${elementName}</span>`;
            this.copyToClipboard(html);
          } else {
            // Fallback for elements not found
            const html = `<span style="color: ${elementItem.dataset.color}; font-weight: bold;">${elementName}</span>`;
            this.copyToClipboard(html);
          }
          
          elementItem.classList.add('copied');
          setTimeout(() => {
            elementItem.classList.remove('copied');
          }, 1000);
        }
      });

      return modal;
    },

    getElementIcon(elementName) {
      const icons = {
        'Feu': '🔥',
        'Air': '💨',
        'Eau': '💧',
        'Terre': '🌍',
        'Divin': '✨',
        'Lumière': '☀️',
        'Maléfique': '💀'
      };
      return icons[elementName] || '⚡';
    },


    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('📋 Copié dans le presse-papiers', 'success');
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        this.showNotification('📋 Copié dans le presse-papiers', 'success');
      });
    },

    setupResponsive() {
      JdrApp.utils.events.register('click', '#menuToggle', () => {
        const sidebar = JdrApp.utils.dom.$('#sidebar');
        const backdrop = JdrApp.utils.dom.$('#backdrop');
        
        if (sidebar && backdrop) {
          sidebar.classList.toggle('mobile-open');
          backdrop.hidden = !sidebar.classList.contains('mobile-open');
        }
      });

      JdrApp.utils.events.register('click', '#backdrop', () => {
        const sidebar = JdrApp.utils.dom.$('#sidebar');
        const backdrop = JdrApp.utils.dom.$('#backdrop');
        
        if (sidebar && backdrop) {
          sidebar.classList.remove('mobile-open');
          backdrop.hidden = true;
        }
      });
    },

    showNotification(message, type = 'info') {
      EventBus.emit(Events.NOTIFICATION_SHOW, { message, type });
      
      // Fallback notification if storage module is not available
      if (!JdrApp.modules.storage?.showNotification) {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 500;
          z-index: 10000;
          animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      } else {
        JdrApp.modules.storage.showNotification(message, type);
      }
    },

    // Get current page ID from DOM
    getCurrentPageId() {
      // Find the currently visible article (not hidden)
      const articles = document.querySelectorAll('article[data-static-page="true"]');
      let visibleArticle = null;
      
      for (const article of articles) {
        const style = window.getComputedStyle(article);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          visibleArticle = article;
          break;
        }
      }
      
      // Fallback: find by active class or current hash
      if (!visibleArticle) {
        const hash = window.location.hash.replace('#/', '');
        if (hash) {
          visibleArticle = document.querySelector(`article[data-page="${hash}"]`);
        }
      }
      
      // Last fallback: any visible article
      if (!visibleArticle) {
        visibleArticle = document.querySelector('article[data-static-page="true"]:not([style*="display: none"])');
      }
      
      const pageId = visibleArticle ? visibleArticle.dataset.page : null;
      console.log('🔍 DEBUG getCurrentPageId: Found visible article:', !!visibleArticle);
      console.log('🔍 DEBUG getCurrentPageId: Page ID:', pageId);
      if (visibleArticle) {
        console.log('🔍 DEBUG getCurrentPageId: Article attributes:', {
          'data-static-page': visibleArticle.dataset.staticPage,
          'data-page': visibleArticle.dataset.page,
          'data-page-title': visibleArticle.dataset.pageTitle
        });
      }
      return pageId;
    },

    // Count existing sections for unique ID generation
    countExistingSections() {
      const pageId = this.getCurrentPageId();
      if (!pageId || !window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        return 0;
      }
      const pageData = window.STATIC_PAGES[pageId];
      return pageData.sections ? pageData.sections.length : 0;
    },

    // Save new section to JSON data
    saveNewSectionToJSON(sectionId, title, content) {
      const pageId = this.getCurrentPageId();
      console.log('🔍 DEBUG SAVE: getCurrentPageId() returned:', pageId);
      console.log('🔍 DEBUG SAVE: Available pages in STATIC_PAGES:', Object.keys(window.STATIC_PAGES || {}));
      
      if (!pageId || !window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        console.warn('Cannot save new section - page not found:', pageId);
        console.warn('window.STATIC_PAGES exists:', !!window.STATIC_PAGES);
        console.warn('pageId exists in STATIC_PAGES:', pageId && window.STATIC_PAGES && !!window.STATIC_PAGES[pageId]);
        return false;
      }

      const pageData = window.STATIC_PAGES[pageId];
      
      // Create new section object
      const newSection = {
        type: "card",
        id: sectionId,
        title: title,
        content: content,
        deletable: true,
        sectionName: title
      };

      // Add to sections array
      if (!pageData.sections) {
        pageData.sections = [];
      }
      
      pageData.sections.push(newSection);
      
      return true;
    },

    // Delete section from JSON data
    deleteSectionFromJSON(sectionId) {
      const pageId = this.getCurrentPageId();
      if (!pageId || !window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        console.warn('Cannot delete section - page not found:', pageId);
        return false;
      }

      const pageData = window.STATIC_PAGES[pageId];
      if (!pageData.sections) {
        console.warn('No sections found in page data');
        return false;
      }

      console.log(`🗑️ SUPPRESSION JSON: Tentative de suppression "${sectionId}" de ${pageId}.json`);
      console.log('📊 État JSON avant suppression:', {
        pageId,
        totalSections: pageData.sections.length,
        sectionIds: pageData.sections.map(s => s.id)
      });

      // Remove section by ID
      const initialLength = pageData.sections.length;
      pageData.sections = pageData.sections.filter(section => section.id !== sectionId);
      
      // Check if section was found and removed
      const removed = pageData.sections.length < initialLength;
      if (removed) {
        console.log(`✅ SUPPRESSION JSON: Section "${sectionId}" supprimée de ${pageId}.json`);
        console.log('📊 État JSON après suppression:', {
          pageId,
          totalSections: pageData.sections.length,
          sectionIds: pageData.sections.map(s => s.id)
        });
        return true;
      } else {
        // Try to find in nested grid content
        for (let section of pageData.sections) {
          if (section.type === 'grid' && section.content) {
            const gridInitialLength = section.content.length;
            section.content = section.content.filter(item => item.id !== sectionId);
            if (section.content.length < gridInitialLength) {
              console.log(`✅ SUPPRESSION JSON: Section "${sectionId}" supprimée de grille dans ${pageId}.json`);
              return true;
            }
          }
        }
        
        console.error(`❌ ERREUR: Section "${sectionId}" introuvable pour suppression`);
        console.log('🔍 Sections disponibles:', pageData.sections.map(s => ({id: s.id, title: s.title})));
        return false;
      }
    },

    // Recalculate all section indices in the current page to prevent conflicts
    recalculateSectionIndices() {
      // Disable index recalculation for now - it causes ID mismatches
      // The current approach of using timestamp-based unique IDs is more stable
      console.log('Index recalculation disabled - using stable unique IDs');
      return true;
    },

    // OLD VERSION - kept for reference but disabled
    _recalculateSectionIndicesOld() {
      const pageId = this.getCurrentPageId();
      if (!pageId) {
        console.warn('Cannot recalculate indices - no current page');
        return false;
      }

      // Update DOM data-edit-section attributes to match JSON structure
      const article = document.querySelector('article[data-static-page="true"]');
      if (!article) {
        console.warn('No static page article found');
        return false;
      }

      // Get the JSON data for this page
      const pageData = window.STATIC_PAGES?.[pageId];
      if (!pageData?.sections) {
        console.warn('No page data found for recalculation');
        return false;
      }

      // Build a mapping of DOM sections to JSON sections
      const sections = article.querySelectorAll('.editable-section, .card');
      let sectionIndex = 0;

      sections.forEach((domSection, domIndex) => {
        // Skip sections that don't have editable content
        const editableElements = domSection.querySelectorAll('[data-edit-section]');
        if (editableElements.length === 0) return;

        // Find corresponding JSON section
        let jsonSection = null;
        let jsonIndex = sectionIndex;

        // Try to match by existing ID first
        const firstEditable = editableElements[0];
        let currentId = firstEditable.dataset.editSection;
        if (currentId.endsWith('-title')) {
          currentId = currentId.replace('-title', '');
        }

        // Look for matching JSON section
        for (let i = 0; i < pageData.sections.length; i++) {
          const section = pageData.sections[i];
          if (section.id === currentId || section.type === 'intro') {
            jsonSection = section;
            jsonIndex = i;
            break;
          }
        }

        // If no match found, assign next available index
        if (!jsonSection && sectionIndex < pageData.sections.length) {
          jsonSection = pageData.sections[sectionIndex];
          jsonIndex = sectionIndex;
        }

        if (jsonSection) {
          // Update DOM attributes to match JSON structure
          editableElements.forEach(editable => {
            const currentEditSection = editable.dataset.editSection;
            
            // Determine the new ID based on JSON section
            let newEditSection;
            if (currentEditSection.endsWith('-title')) {
              newEditSection = `${jsonSection.id}-title`;
            } else {
              newEditSection = jsonSection.id;
            }

            // Update the data attribute
            editable.dataset.editSection = newEditSection;
            
            console.log(`Updated section ${domIndex}: ${currentEditSection} → ${newEditSection}`);
          });

          sectionIndex++;
        }
      });

      // Also update section indices in JSON to ensure consistency
      pageData.sections.forEach((section, index) => {
        // Ensure each section has a proper ID
        if (!section.id || section.id.startsWith('section-')) {
          // Generate a stable ID based on title or position
          const baseId = section.title ? 
            section.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') :
            `section-${index}`;
          section.id = baseId;
        }
      });

      console.log(`Recalculated indices for ${sectionIndex} sections in page ${pageId}`);
      return true;
    },

    // Trigger data save to localStorage/persistent storage
    triggerDataSave() {
      // Data is already saved in window.STATIC_PAGES in memory
    }
  };

})();