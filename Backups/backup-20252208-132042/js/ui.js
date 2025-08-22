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
      this.setupNewPageHandler();
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

      // Generic content deletion - using multiple specific selectors
      JdrApp.utils.events.register('click', '.spell-delete, .don-delete, .delete-subclass-btn, .objet-delete', (e) => {
        const type = this.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        // Handle different dataset attribute naming patterns
        let itemName;
        if (type === 'spell') {
          itemName = e.target.dataset.spellName;
        } else if (type === 'don') {
          itemName = e.target.dataset.donName;
        } else if (type === 'objet') {
          itemName = e.target.dataset.objetName;
        } else if (type === 'class') {
          itemName = e.target.dataset.className || e.target.dataset.subclassName;
        } else {
          itemName = e.target.dataset[`${type}Name`];
        }
        
        if (type && categoryName && itemName) {
          this.deleteContent(type, categoryName, itemName);
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
        } else if (type === 'objet') {
          itemName = e.target.dataset.objetName;
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

      // Filter manager button for objects
      JdrApp.utils.events.register('click', '.filter-manager-btn', () => {
        this.showFilterManagementModal();
      });

      // Tags manager button for objects
      JdrApp.utils.events.register('click', '.tags-manager-btn', () => {
        this.showTagsManagementModal();
      });

      // Filter chip toggle for objects
      JdrApp.utils.events.register('click', '.filter-chip', (e) => {
        this.toggleFilter(e.target);
      });

      // ID search functionality
      JdrApp.utils.events.register('input', '#id-search-input', (e) => {
        this.performIdSearch(e.target.value);
      });

      JdrApp.utils.events.register('keydown', '#id-search-input', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performIdSearch(e.target.value);
        } else if (e.key === 'Escape') {
          e.target.value = '';
          this.clearIdSearch();
        }
      });

      JdrApp.utils.events.register('click', '#clear-id-search', () => {
        this.clearIdSearch();
      });

      // Spell element change
      JdrApp.utils.events.register('change', '.spell-element-selector select', (e) => {
        this.updateSpellElement(e.target);
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

      // Dev toolbox category creation buttons
      JdrApp.utils.events.register('click', '#addSpellCategory', () => {
        this.createNewCategory('spell');
      });

      JdrApp.utils.events.register('click', '#addDonCategory', () => {
        this.createNewCategory('don');
      });

      // Category deletion buttons
      JdrApp.utils.events.register('click', '[class$="-category-delete"]', (e) => {
        const categoryName = e.target.dataset.categoryName;
        const categoryType = e.target.dataset.categoryType;
        
        if (categoryName && categoryType) {
          this.deleteCategory(categoryType, categoryName);
        }
      });

      // Filter management for objects page
      JdrApp.utils.events.register('click', '.filter-manager-btn', (e) => {
        this.showFilterManagementModal();
      });

      // Filter chip toggling (if dev mode allows interactive filters)
      JdrApp.utils.events.register('click', '.filter-chip', (e) => {
        if (document.body.classList.contains('dev-on')) {
          this.toggleFilter(e.target);
        }
      });

      // Element selector for spells (dev mode)
      JdrApp.utils.events.register('change', '.spell-element-selector', (e) => {
        this.updateSpellElement(e.target);
      });
    },

    extractTypeFromClass(className) {
      if (className.includes('spell')) return 'spell';
      if (className.includes('don')) return 'don';
      if (className.includes('class')) return 'class';
      if (className.includes('objet')) return 'objet';
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

    // ========================================
    // CONTENT MANIPULATION METHODS 
    // ========================================
    
    addContent(type, categoryName) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Create new item with default values
      const defaultItem = ContentFactory.createDefaultItem(type);
      
      // Special handling for objects (add to single array)
      if (type === 'objet') {
        if (!window.OBJETS.objets) {
          window.OBJETS.objets = [];
        }
        
        // Get next number
        const existingNumbers = window.OBJETS.objets.map(obj => obj.numero || 0);
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        defaultItem.numero = nextNumber;
        
        window.OBJETS.objets.push(defaultItem);
        this.refreshObjectsPage();
      } else {
        // Standard category-based addition
        const success = ContentFactory.addItem(type, categoryName, defaultItem);
        if (success) {
          EventBus.emit(Events.CONTENT_ADD, {
            type: type,
            category: categoryName,
            item: defaultItem
          });
          
          EventBus.emit(Events.PAGE_RENDER, {
            type: 'category',
            categoryType: type,
            category: ContentFactory.getEntity(type).findCategory(categoryName)
          });
        }
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      this.showNotification(`${config.icons.add} Nouvel élément ajouté`, 'success');
    },

    deleteContent(type, categoryName, itemName) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      if (!confirm(`Supprimer "${itemName}" ?`)) {
        return;
      }

      // Special handling for objects
      if (type === 'objet') {
        if (window.OBJETS?.objets) {
          const itemIndex = window.OBJETS.objets.findIndex(obj => obj.nom === itemName);
          if (itemIndex >= 0) {
            window.OBJETS.objets.splice(itemIndex, 1);
            this.refreshObjectsPage();
          }
        }
      } else {
        // Standard category-based deletion
        const success = ContentFactory.deleteItem(type, categoryName, itemName);
        if (success) {
          EventBus.emit(Events.CONTENT_DELETE, {
            type: type,
            category: categoryName,
            item: itemName
          });
          
          EventBus.emit(Events.PAGE_RENDER, {
            type: 'category',
            categoryType: type,
            category: ContentFactory.getEntity(type).findCategory(categoryName)
          });
        }
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      this.showNotification(`${config.icons.delete} "${itemName}" supprimé`, 'success');
    },

    moveContent(type, categoryName, itemName, direction) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Special handling for objects
      if (type === 'objet') {
        if (window.OBJETS?.objets) {
          const itemIndex = window.OBJETS.objets.findIndex(obj => obj.nom === itemName);
          if (itemIndex >= 0) {
            const newIndex = itemIndex + direction;
            if (newIndex >= 0 && newIndex < window.OBJETS.objets.length) {
              const item = window.OBJETS.objets.splice(itemIndex, 1)[0];
              window.OBJETS.objets.splice(newIndex, 0, item);
              this.refreshObjectsPage();
            }
          }
        }
      } else {
        // Standard category-based movement
        const success = ContentFactory.moveItem(type, categoryName, itemName, direction);
        if (success) {
          EventBus.emit(Events.CONTENT_MOVE, {
            type: type,
            category: categoryName,
            itemName: itemName,
            direction: direction
          });
          
          EventBus.emit(Events.PAGE_RENDER, {
            type: 'category',
            categoryType: type,
            category: ContentFactory.getEntity(type).findCategory(categoryName)
          });
        }
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      const directionText = direction > 0 ? 'descendu' : 'monté';
      this.showNotification(`🔄 "${itemName}" ${directionText}`, 'success');
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
      // Fonction pour nettoyer le HTML et extraire le texte
      const stripHtml = (text) => {
        if (!text) return '';
        if (typeof text !== 'string') text = String(text);
        return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      };

      // Fonction pour traiter les listes/arrays
      const processArray = (arr) => {
        if (!arr) return '';
        if (Array.isArray(arr)) {
          return arr.map(item => stripHtml(item)).join(' ');
        }
        return stripHtml(arr);
      };

      // Collecter TOUS les champs textuels possibles
      const searchFields = [
        // Champs communs
        item.nom,
        item.description,
        item.prerequis,
        item.resume,
        
        // Champs spécifiques aux sorts
        item.element,
        item.portee,
        item.tempsIncantation,
        item.coutMana,
        item.resistance,
        item.effetNormal,
        item.effetCritique,
        
        // Champs spécifiques aux dons
        item.cout,
        
        // Champs spécifiques aux classes/sous-classes
        item.progression,
        processArray(item.capacites),
        
        // Champs spécifiques aux objets
        item.effet,
        item.prix,
        item.poids,
        item.tags ? item.tags.join(' ') : '',
        
        // Champs de statistiques (si c'est un objet)
        item.base ? Object.entries(item.base || {}).map(([key, value]) => `${key} ${value}`).join(' ') : '',
        
        // Autres champs possibles
        item.title,
        item.content,
        item.type
      ];

      // Joindre tous les champs et nettoyer
      const searchText = searchFields
        .filter(field => field !== null && field !== undefined)
        .map(field => stripHtml(field))
        .join(' ')
        .toLowerCase();
      
      // Chercher chaque mot de la requête
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      // Tous les mots doivent être trouvés (recherche ET logique)
      return queryWords.every(word => searchText.includes(word));
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

      JdrApp.utils.events.register('click', '#etatsBtn', () => {
        this.showEtatsModal();
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
        if (modal.tagName === 'DIALOG') {
          modal.showModal();
        } else {
          modal.classList.add('visible');
          modal.style.display = 'flex';
        }
        
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

    showEtatsModal() {
      // TOUJOURS recréer la modal pour avoir les données à jour
      let modal = JdrApp.utils.dom.$('#etatsModal');
      if (modal) {
        document.body.removeChild(modal);
      }
      
      modal = this.createEtatsModal();
      document.body.appendChild(modal);
      
      this.openModal('etatsModal');
    },

    createEtatsModal() {
      // Récupérer les données d'états depuis window.STATIC_PAGES.etats
      const etatsData = window.STATIC_PAGES?.etats;
      const etats = [];
      
      if (etatsData?.sections) {
        etatsData.sections.forEach(section => {
          if (section.type === 'card' && section.title && section.content) {
            // Convertir le HTML en texte en préservant les sauts de ligne
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = section.content;
            
            // Remplacer les balises de saut de ligne par des \n avant d'extraire le texte
            tempDiv.innerHTML = tempDiv.innerHTML
              .replace(/<\/p>/gi, '\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/li>/gi, '\n')
              .replace(/<\/div>/gi, '\n');
            
            const description = (tempDiv.textContent || tempDiv.innerText || section.content)
              .replace(/\n\s*\n/g, '\n') // Supprimer les doubles sauts de ligne
              .trim();
            
            etats.push({
              name: section.title,
              description: description
            });
          }
        });
      }

      const etatsHTML = etats.map(etat => `
        <div class="etat-item" data-etat-name="${etat.name}" data-etat-description="${etat.description}">
          <div class="etat-icon">⚡</div>
          <div class="etat-content">
            <div class="etat-name">${etat.name}</div>
            <div class="etat-description">${etat.description.length > 60 ? etat.description.substring(0, 60) + '...' : etat.description}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = JdrApp.utils.dom.create('div', 'modal etats-modal', `
        <div class="modal-content etats-modal-content">
          <h3>⚡ États</h3>
          <p>Cliquez sur un état pour copier sa balise HTML avec tooltip.</p>
          <div class="etats-list">
            ${etatsHTML || '<div style="text-align: center; color: #666; padding: 2rem;">Aucun état trouvé</div>'}
          </div>
          <button class="modal-close btn">Fermer</button>
        </div>
      `, { id: 'etatsModal' });

      modal.addEventListener('click', (e) => {
        const etatItem = e.target.closest('.etat-item');
        if (etatItem) {
          const etatName = etatItem.dataset.etatName;
          const etatDescription = etatItem.dataset.etatDescription;
          
          const html = `<span title="${etatDescription}">${etatName}</span>`;
          this.copyToClipboard(html);
          
          etatItem.classList.add('copied');
          setTimeout(() => {
            etatItem.classList.remove('copied');
          }, 1000);
        }
      });

      return modal;
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
      this.setupMobileNavigation();
      this.setupLegacyResponsive();
    },

    setupMobileNavigation() {
      // Create mobile navigation toggle button immediately and on resize
      this.createMobileNavToggle();
      
      // Handle mobile nav toggle with delegation
      document.addEventListener('click', (e) => {
        if (e.target.closest('.mobile-nav-toggle')) {
          e.preventDefault();
          this.toggleMobileNav();
        }
      });

      // Auto-close navigation when selecting a page
      document.addEventListener('click', (e) => {
        if (e.target.closest('.toc a') && window.innerWidth <= 980) {
          this.closeMobileNav();
        }
      });

      // Handle window resize
      window.addEventListener('resize', () => {
        if (window.innerWidth <= 980) {
          this.createMobileNavToggle();
        } else {
          this.closeMobileNav();
          const existingButton = document.querySelector('.mobile-nav-toggle');
          if (existingButton) {
            existingButton.remove();
          }
        }
      });
      
      // Also create on DOM content loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.createMobileNavToggle();
        });
      }
    },

    createMobileNavToggle() {
      // Only create if it doesn't exist and we're on mobile
      if (window.innerWidth <= 980 && !document.querySelector('.mobile-nav-toggle')) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-nav-toggle';
        toggleButton.innerHTML = `
          <span class="icon">📜</span>
          <span class="text">Menu</span>
        `;
        toggleButton.setAttribute('aria-label', 'Ouvrir/fermer le menu de navigation');
        toggleButton.setAttribute('title', 'Navigation');
        toggleButton.type = 'button';
        
        // Insert at the beginning of body
        if (document.body) {
          document.body.insertBefore(toggleButton, document.body.firstChild);
        }
      }
    },

    toggleMobileNav() {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.mobile-nav-toggle');
      
      if (sidebar && toggleButton) {
        const isOpen = sidebar.classList.contains('mobile-open');
        
        if (isOpen) {
          this.closeMobileNav();
        } else {
          this.openMobileNav();
        }
      }
    },

    openMobileNav() {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.mobile-nav-toggle');
      
      if (sidebar && toggleButton) {
        sidebar.classList.add('mobile-open');
        toggleButton.classList.add('open');
        
        const textSpan = toggleButton.querySelector('.text');
        if (textSpan) {
          textSpan.textContent = 'Fermer';
        }
        
        // Add event listener to close on outside click
        setTimeout(() => {
          document.addEventListener('click', this.handleOutsideClick);
        }, 100);
      }
    },

    closeMobileNav() {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.mobile-nav-toggle');
      
      if (sidebar && toggleButton) {
        sidebar.classList.remove('mobile-open');
        toggleButton.classList.remove('open');
        
        const textSpan = toggleButton.querySelector('.text');
        if (textSpan) {
          textSpan.textContent = 'Menu';
        }
        
        // Remove outside click listener
        document.removeEventListener('click', this.handleOutsideClick);
      }
    },

    handleOutsideClick: (e) => {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.mobile-nav-toggle');
      
      // Close if clicking outside sidebar and toggle button
      if (sidebar && toggleButton && 
          !sidebar.contains(e.target) && 
          !toggleButton.contains(e.target)) {
        JdrApp.modules.ui.closeMobileNav();
      }
    },

    setupLegacyResponsive() {
      // Keep existing responsive handlers for compatibility
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
    },

    createNewCategory(type) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Demander le nom de la catégorie
      const categoryName = prompt(`Nom de la nouvelle catégorie de ${config.container} :`);
      if (!categoryName || !categoryName.trim()) {
        return;
      }

      const trimmedName = categoryName.trim();

      // Vérifier que la catégorie n'existe pas déjà
      const entity = ContentFactory.getEntity(type);
      if (entity && entity.findCategory(trimmedName)) {
        this.showNotification(`❌ Une catégorie "${trimmedName}" existe déjà`, 'error');
        return;
      }

      // Demander la description et spoilAlert pour les objets
      let description = prompt(`Description de la catégorie "${trimmedName}" :`);
      if (!description) description = '';

      let spoilAlert = false;
      if (type === 'objet') {
        spoilAlert = confirm('Cette catégorie contient-elle des éléments de spoil ?');
      }

      // Créer la nouvelle catégorie
      const newCategory = {
        nom: trimmedName,
        description: description.trim(),
        [config.identifiers.category]: []
      };

      // Ajouter spoilAlert pour les objets
      if (type === 'objet') {
        newCategory.spoilAlert = spoilAlert;
      }

      // Ajouter à la structure de données
      const dataKey = config.dataKey;
      if (!window[dataKey]) {
        window[dataKey] = [];
      }

      window[dataKey].push(newCategory);

      // Rafraîchir ContentFactory
      ContentFactory.refreshData();

      // Rafraîchir le router TOC
      if (JdrApp.modules.router && JdrApp.modules.router.generateTOC) {
        JdrApp.modules.router.generateTOC();
      }

      // Naviguer vers la nouvelle catégorie
      const categoryRoute = `${config.container}-${JdrApp.utils.data.sanitizeId(trimmedName)}`;
      JdrApp.modules.router.navigate(categoryRoute);

      this.showNotification(`${config.icons.category} Catégorie "${trimmedName}" créée avec succès!`, 'success');
    },

    deleteCategory(type, categoryName) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Confirmation avec détails
      const entity = ContentFactory.getEntity(type);
      const category = entity?.findCategory(categoryName);
      
      if (!category) {
        this.showNotification(`❌ Catégorie "${categoryName}" introuvable`, 'error');
        return;
      }

      const itemsProperty = this.getItemsProperty(type);
      const itemCount = category[itemsProperty]?.length || 0;
      
      const confirmMessage = itemCount > 0 
        ? `Supprimer la catégorie "${categoryName}" et ses ${itemCount} éléments ?`
        : `Supprimer la catégorie vide "${categoryName}" ?`;
        
      if (!confirm(confirmMessage)) {
        return;
      }

      // Supprimer de la structure de données
      const dataKey = config.dataKey;
      if (window[dataKey]) {
        const categoryIndex = window[dataKey].findIndex(cat => cat.nom === categoryName);
        
        if (categoryIndex >= 0) {
          window[dataKey].splice(categoryIndex, 1);
          
          // Rafraîchir ContentFactory
          ContentFactory.refreshData();

          // Rafraîchir le router TOC
          if (JdrApp.modules.router && JdrApp.modules.router.generateTOC) {
            JdrApp.modules.router.generateTOC();
          }

          // Naviguer vers la page principale du type
          JdrApp.modules.router.navigate(config.container);

          this.showNotification(`${config.icons.delete} Catégorie "${categoryName}" supprimée`, 'success');
        } else {
          this.showNotification(`❌ Erreur lors de la suppression`, 'error');
        }
      }
    },

    getItemsProperty(type) {
      switch (type) {
        case 'spell': return 'sorts';
        case 'don': return 'dons';
        case 'objet': return 'objets';
        case 'class': return 'sousClasses';
        default: return 'items';
      }
    },

    // ==== FILTER MANAGEMENT METHODS ====

    showFilterManagementModal() {
      if (!window.OBJETS || !window.ContentTypes.objet) return;
      
      const config = window.ContentTypes.objet.filterConfig;
      const currentSettings = window.OBJETS.filterSettings || { visibleTags: config.defaultVisibleTags };
      
      // Remove existing modal if any
      const existingModal = document.querySelector('#filterModal');
      if (existingModal) {
        existingModal.remove();
      }
      
      const modal = this.createFilterModal();
      document.body.appendChild(modal);
      
      // Update modal content with current settings
      this.updateFilterModalContent(modal, config, currentSettings);
      
      // Use native dialog showModal for proper z-index
      modal.showModal();
    },

    createFilterModal() {
      const modal = document.createElement('dialog');
      modal.id = 'filterModal';
      modal.style.cssText = `
        max-width: 500px;
        width: 90%;
        padding: 0;
        border: none;
        border-radius: 12px;
        background: transparent;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      `;
      modal.innerHTML = `
        <div style="background: var(--paper); border-radius: 12px; padding: 1.5rem; border: 2px solid var(--rule);">
          <h3 style="margin: 0 0 1rem 0; color: var(--accent-ink);">Gestion des filtres d'objets</h3>
          <p style="margin: 0 0 1rem 0; color: var(--paper-muted);">Choisissez quels tags d'objets afficher sur la page :</p>
          <div id="filterCheckboxes" style="margin: 1rem 0;">
            <!-- Content will be populated by updateFilterModalContent -->
          </div>
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn" id="resetFiltersBtn" style="background: var(--bronze); color: white;">
              🔄 Réinitialiser
            </button>
            <button class="btn" id="saveFiltersBtn" style="background: var(--accent); color: white;">
              💾 Sauvegarder
            </button>
            <button class="btn modal-close" style="background: #666; color: white;">
              ❌ Annuler
            </button>
          </div>
        </div>
      `;

      // Add event listeners
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'saveFiltersBtn') {
          this.saveFilterSettings(modal);
        } else if (e.target.id === 'resetFiltersBtn') {
          this.resetFilterSettings(modal);
        } else if (e.target.classList.contains('modal-close')) {
          modal.close();
          modal.remove();
        } else if (e.target.classList.contains('move-tag-up')) {
          this.moveTagInModal(modal, e.target.dataset.tag, -1);
        } else if (e.target.classList.contains('move-tag-down')) {
          this.moveTagInModal(modal, e.target.dataset.tag, 1);
        }
      });

      // Handle dialog close events
      modal.addEventListener('cancel', () => {
        modal.close();
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.close();
          modal.remove();
        }
      });

      return modal;
    },

    updateFilterModalContent(modal, config, currentSettings) {
      const checkboxContainer = modal.querySelector('#filterCheckboxes');
      if (!checkboxContainer) return;

      const checkboxHTML = config.availableTags.map(tag => {
        const isVisible = currentSettings.visibleTags.includes(tag);
        const isDefault = config.defaultVisibleTags.includes(tag);
        
        return `
          <div class="tag-row" data-tag="${tag}" style="display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0; padding: 0.5rem; background: var(--card); border-radius: 8px;">
            <input 
              type="checkbox" 
              id="filter-${tag}" 
              value="${tag}" 
              ${isVisible ? 'checked' : ''}
              style="margin: 0;"
            >
            <label for="filter-${tag}" style="flex: 1; cursor: pointer; font-weight: 500;">
              <span class="tag-chip" style="margin-right: 0.5rem;">${tag}</span>
              ${tag}
            </label>
            <input 
              type="checkbox" 
              id="default-${tag}" 
              value="${tag}" 
              ${isDefault ? 'checked' : ''}
              style="margin: 0;"
              title="Filtre par défaut au chargement du site"
            >
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <button type="button" class="move-tag-up" data-tag="${tag}" style="background: var(--accent); color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 12px; cursor: pointer;" title="Monter dans l'ordre">↑</button>
              <button type="button" class="move-tag-down" data-tag="${tag}" style="background: var(--accent); color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 12px; cursor: pointer;" title="Descendre dans l'ordre">↓</button>
            </div>
          </div>
        `;
      }).join('');

      checkboxContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--rule);">
          <span style="font-weight: 600; color: var(--accent-ink);">Tag</span>
          <div style="display: flex; gap: 1rem; font-size: 0.9em; font-weight: 600; color: var(--accent-ink);">
            <span>Visible</span>
            <span>Défaut</span>
            <span>Ordre</span>
          </div>
        </div>
        <div id="sortable-tags-list">
          ${checkboxHTML}
        </div>
        <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid var(--rule); font-size: 0.85em; color: var(--paper-muted);">
          ℹ️ <strong>Visible</strong> : Tags affichés actuellement<br>
          🏠 <strong>Par défaut</strong> : Tags automatiquement activés au chargement du site<br>
          ↕️ <strong>Ordre</strong> : Utilisez les flèches pour réorganiser l'affichage
        </div>
      `;
    },

    saveFilterSettings(modal) {
      // Get visible tags (currently active)
      const visibleCheckboxes = modal.querySelectorAll('input[id^="filter-"]:checked');
      const visibleTags = Array.from(visibleCheckboxes).map(cb => cb.value);

      // Get default tags (active by default on site load)
      const defaultCheckboxes = modal.querySelectorAll('input[id^="default-"]:checked');
      const defaultTags = Array.from(defaultCheckboxes).map(cb => cb.value);

      if (visibleTags.length === 0) {
        this.showNotification('❌ Veuillez sélectionner au moins un tag visible', 'error');
        return;
      }

      if (defaultTags.length === 0) {
        this.showNotification('❌ Veuillez sélectionner au moins un tag par défaut', 'error');
        return;
      }

      // Update current visible tags in OBJETS
      if (!window.OBJETS.filterSettings) {
        window.OBJETS.filterSettings = {};
      }
      window.OBJETS.filterSettings.visibleTags = visibleTags;

      // Update default tags in ContentTypes configuration
      // Note: availableTags order has already been updated by moveTagInModal()
      if (window.ContentTypes.objet?.filterConfig) {
        window.ContentTypes.objet.filterConfig.defaultVisibleTags = defaultTags;
      }

      // Trigger page re-render
      this.refreshObjectsPage();
      
      // Save to storage (will include the updated order and defaultVisibleTags in export)
      EventBus.emit(Events.STORAGE_SAVE);
      
      // Close modal and show notification
      modal.close();
      modal.remove();
      this.showNotification(`🏷️ Filtres mis à jour : ${visibleTags.length} visible(s), ${defaultTags.length} par défaut`, 'success');
    },

    resetFilterSettings(modal) {
      const config = window.ContentTypes.objet.filterConfig;
      const defaultSettings = { visibleTags: config.defaultVisibleTags };
      
      this.updateFilterModalContent(modal, config, defaultSettings);
      this.showNotification('🔄 Filtres réinitialisés aux valeurs par défaut', 'info');
    },

    moveTagInModal(modal, tagName, direction) {
      // Get current configuration
      const config = window.ContentTypes.objet.filterConfig;
      const currentIndex = config.availableTags.indexOf(tagName);
      
      if (currentIndex === -1) return; // Tag not found
      
      const newIndex = currentIndex + direction;
      
      // Check bounds
      if (newIndex < 0 || newIndex >= config.availableTags.length) return;
      
      // Swap tags in the array
      const temp = config.availableTags[currentIndex];
      config.availableTags[currentIndex] = config.availableTags[newIndex];
      config.availableTags[newIndex] = temp;
      
      // Refresh the modal display
      const currentSettings = window.OBJETS?.filterSettings || { visibleTags: config.defaultVisibleTags };
      this.updateFilterModalContent(modal, config, currentSettings);
      
      this.showNotification(`📊 "${tagName}" ${direction > 0 ? 'descendu' : 'monté'} dans l'ordre`, 'info');
    },

    toggleFilter(chipElement) {
      const tag = chipElement.dataset.tag;
      if (!tag || !window.OBJETS) return;

      const currentSettings = window.OBJETS.filterSettings || { 
        visibleTags: window.ContentTypes.objet.filterConfig.defaultVisibleTags 
      };

      const isActive = chipElement.classList.contains('active');
      
      if (isActive) {
        // Remove from visible tags if not the last one
        if (currentSettings.visibleTags.length > 1) {
          currentSettings.visibleTags = currentSettings.visibleTags.filter(t => t !== tag);
          chipElement.classList.remove('active');
          this.showNotification(`🏷️ Tag "${tag}" masqué`, 'info');
        } else {
          this.showNotification('❌ Impossible de masquer le dernier tag actif', 'error');
          return;
        }
      } else {
        // Add to visible tags
        if (!currentSettings.visibleTags.includes(tag)) {
          currentSettings.visibleTags.push(tag);
          chipElement.classList.add('active');
          this.showNotification(`🏷️ Tag "${tag}" affiché`, 'info');
        }
      }

      // Update the data structure
      window.OBJETS.filterSettings = currentSettings;
      
      // Refresh the page
      this.refreshObjectsPage();
    },

    refreshObjectsPage() {
      // Check if we're currently on the objects page
      if (window.location.hash === '#/objets' || window.location.hash === '#/objet') {
        EventBus.emit(Events.PAGE_RENDER, {
          type: 'category',
          categoryType: 'objet',
          category: window.OBJETS
        });
      }
    },

    // ==== SPELL ELEMENT MANAGEMENT ====

    updateSpellElement(selectElement) {
      // Get the selected element
      const newElement = selectElement.value;
      const spellName = selectElement.dataset.spellName;
      const categoryName = selectElement.dataset.categoryName;

      if (!newElement || !spellName || !categoryName) {
        this.showNotification('❌ Erreur : données du sort manquantes', 'error');
        return;
      }

      // Find and update the spell data
      const spellEntity = ContentFactory.getEntity('spell');
      const category = spellEntity?.findCategory(categoryName);
      
      if (!category) {
        this.showNotification(`❌ Catégorie "${categoryName}" introuvable`, 'error');
        return;
      }

      const spell = category.sorts?.find(s => s.nom === spellName);
      if (!spell) {
        this.showNotification(`❌ Sort "${spellName}" introuvable`, 'error');
        return;
      }

      // Update the spell element
      spell.element = newElement;

      // Save the changes to storage
      EventBus.emit(Events.STORAGE_SAVE);

      // Update the visual display
      const spellCard = selectElement.closest('.card');
      if (spellCard) {
        const elementDisplay = spellCard.querySelector('.spell-element-selector').parentNode;
        if (elementDisplay) {
          // Find the icon and colors for the new element
          const icon = window.ElementIcons ? window.ElementIcons[newElement] : '🔥';
          const colors = window.ElementColors ? window.ElementColors[newElement] : { color: '#ff6b35', weight: 'bold' };
          
          // Build style string
          let style = `color: ${colors.color}; font-weight: ${colors.weight};`;
          if (colors.background) style += ` background: ${colors.background};`;
          if (colors.padding) style += ` padding: ${colors.padding};`;
          if (colors.borderRadius) style += ` border-radius: ${colors.borderRadius};`;
          
          // Update the dropdown options to reflect the selection
          const options = Object.keys(window.ElementIcons || {});
          const optionsHTML = options.map(elem => 
            `<option value="${elem}" ${elem === newElement ? 'selected' : ''}>${window.ElementIcons[elem]} ${elem}</option>`
          ).join('');
          
          selectElement.innerHTML = optionsHTML;
        }
      }

      // Trigger page re-render to update all spell displays
      EventBus.emit(Events.PAGE_RENDER, {
        type: 'category',
        categoryType: 'spell',
        category: category
      });

      // Show success notification
      const elementIcon = window.ElementIcons ? window.ElementIcons[newElement] : '🔥';
      this.showNotification(`${elementIcon} Élément du sort "${spellName}" mis à jour : ${newElement}`, 'success');
    },

    // ========================================
    // NEW PAGE CREATION WITH SECTION SELECTION
    // ========================================
    setupNewPageHandler() {
      // Set up event listener for "Nouvelle page" button
      document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'addCategory') {
          e.preventDefault();
          this.showSectionSelectionModal();
        }
      });
    },

    showSectionSelectionModal() {
      const modal = this.createSectionSelectionModal();
      document.body.appendChild(modal);
      this.openModal('sectionSelectionModal');
    },

    createSectionSelectionModal() {
      // Get available sections from TOC structure
      const sections = window.TOC_STRUCTURE?.sections || [
        { id: 'heros', title: '🦸 Héros', icon: '🦸' },
        { id: 'arsenal', title: '⚔️ Arsenal', icon: '⚔️' },
        { id: 'regles', title: '📚 Règles', icon: '📚' }
      ];

      // Filter sections based on MJ access if needed
      const availableSections = sections.filter(section => 
        !section.requiresMJ || window.JdrApp?.state?.isMJ
      );

      const sectionsHTML = availableSections.map(section => `
        <div class="section-option" data-section-id="${section.id}">
          <div class="section-icon">${section.icon}</div>
          <div class="section-info">
            <div class="section-title">${section.title}</div>
            <div class="section-description">${section.description || 'Section de contenu'}</div>
          </div>
        </div>
      `).join('');

      const modal = document.createElement('div');
      modal.className = 'modal section-selection-modal';
      modal.id = 'sectionSelectionModal';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <h3>📄 Nouvelle page</h3>
          <p>Dans quelle section souhaitez-vous créer la nouvelle page ?</p>
          
          <div class="sections-list">
            ${sectionsHTML}
          </div>
          
          <div class="page-details" style="display: none;">
            <div class="form-group">
              <label for="pageTitle">Titre de la page :</label>
              <input type="text" id="pageTitle" placeholder="Nom de la nouvelle page" required>
            </div>
            <div class="form-group">
              <label for="pageIcon">Icône (optionnel) :</label>
              <input type="text" id="pageIcon" placeholder="📄" maxlength="2">
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn modal-close">Annuler</button>
            <button type="button" class="btn btn-primary" id="createPageBtn" style="display: none;">Créer la page</button>
          </div>
        </div>
      `;

      // Set up event handlers
      this.setupSectionSelectionHandlers(modal);

      return modal;
    },

    setupSectionSelectionHandlers(modal) {
      let selectedSectionId = null;

      // Section selection
      modal.addEventListener('click', (e) => {
        const sectionOption = e.target.closest('.section-option');
        if (sectionOption) {
          // Remove previous selection
          modal.querySelectorAll('.section-option').forEach(opt => opt.classList.remove('selected'));
          
          // Select this section
          sectionOption.classList.add('selected');
          selectedSectionId = sectionOption.dataset.sectionId;
          
          // Show page details form
          const pageDetails = modal.querySelector('.page-details');
          const createBtn = modal.querySelector('#createPageBtn');
          pageDetails.style.display = 'block';
          createBtn.style.display = 'inline-block';
          
          // Focus on title input
          modal.querySelector('#pageTitle').focus();
        }
      });

      // Create page button
      modal.querySelector('#createPageBtn').addEventListener('click', () => {
        const titleInput = modal.querySelector('#pageTitle');
        const iconInput = modal.querySelector('#pageIcon');
        
        const pageTitle = titleInput.value.trim();
        const pageIcon = iconInput.value.trim() || '📄';
        
        if (!pageTitle) {
          this.showNotification('Veuillez saisir un titre pour la page', 'error');
          titleInput.focus();
          return;
        }

        if (!selectedSectionId) {
          this.showNotification('Veuillez sélectionner une section', 'error');
          return;
        }

        this.createNewPage(selectedSectionId, pageTitle, pageIcon);
        this.closeModal(modal);
      });

      // Handle Enter key in form
      modal.querySelector('#pageTitle').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && selectedSectionId) {
          modal.querySelector('#createPageBtn').click();
        }
      });
    },

    createNewPage(sectionId, pageTitle, pageIcon) {
      // Generate page ID from title
      const pageId = this.slugify(pageTitle);
      
      // Create new page object
      const newPage = {
        type: 'page',
        id: pageId,
        title: pageTitle,
        icon: pageIcon
      };

      // Add to TOC structure
      if (window.TOC_STRUCTURE) {
        const section = window.TOC_STRUCTURE.sections.find(s => s.id === sectionId);
        if (section) {
          section.items.push(newPage);
          
          // Create default page data
          const defaultPageData = {
            page: pageId,
            title: pageTitle,
            sections: [
              {
                type: 'intro',
                content: `Contenu de la page ${pageTitle}. Vous pouvez éditer ce texte en mode développement.`
              }
            ]
          };

          // Add to static pages
          if (!window.STATIC_PAGES) {
            window.STATIC_PAGES = {};
          }
          window.STATIC_PAGES[pageId] = defaultPageData;

          // Regenerate TOC to include new page
          if (JdrApp.modules.router) {
            JdrApp.modules.router.generateTOC();
          }

          // Navigate to new page
          window.location.hash = `#/${pageId}`;

          this.showNotification(`📄 Page "${pageTitle}" créée avec succès dans la section ${this.getSectionTitle(sectionId)}`, 'success');
        }
      }
    },

    getSectionTitle(sectionId) {
      if (window.TOC_STRUCTURE) {
        const section = window.TOC_STRUCTURE.sections.find(s => s.id === sectionId);
        return section ? section.title : sectionId;
      }
      return sectionId;
    },

    // ==== GLOBAL TAGS MANAGEMENT ====

    showTagsManagementModal() {
      if (!window.ContentTypes.objet?.filterConfig) {
        this.showNotification('❌ Configuration des tags non trouvée', 'error');
        return;
      }

      // Remove any existing modal
      const existingModal = document.querySelector('#tagsManagementModal');
      if (existingModal) {
        existingModal.remove();
      }

      const config = window.ContentTypes.objet.filterConfig;
      const modal = this.createTagsManagementModal(config);
      document.body.appendChild(modal);
      
      // Use native dialog showModal for proper z-index
      modal.showModal();
    },

    createTagsManagementModal(config) {
      const modal = document.createElement('dialog');
      modal.id = 'tagsManagementModal';
      modal.style.cssText = `
        max-width: 600px;
        width: 90%;
        padding: 0;
        border: none;
        border-radius: 12px;
        background: transparent;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      `;

      const tagsListHTML = config.availableTags.map((tag, index) => `
        <div class="tag-item" data-tag-index="${index}" data-tag-name="${tag}">
          <span class="tag-chip" style="background: var(--bronze); color: white; padding: 4px 8px; border-radius: 8px; margin-right: 0.5rem;">${tag}</span>
          <input type="text" value="${tag}" class="tag-input" style="flex: 1; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 4px; margin-right: 0.5rem;">
          <button type="button" class="btn small delete-tag-btn" data-tag-name="${tag}" style="background: #dc2626; color: white; padding: 0.25rem 0.5rem;">
            🗑️
          </button>
        </div>
      `).join('');

      modal.innerHTML = `
        <div style="background: var(--paper); border-radius: 12px; padding: 1.5rem; border: 2px solid var(--rule);">
          <h3 style="margin: 0 0 1rem 0; color: var(--accent-ink);">🏷️ Gestion des tags globaux</h3>
          <p style="margin: 0 0 1rem 0; color: var(--paper-muted);">Gérez la liste principale des tags disponibles pour les objets.</p>
          
          <div style="margin: 1rem 0;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-ink);">Tags existants :</h4>
            <div id="tagsManagementList" style="max-height: 300px; overflow-y: auto;">
              ${tagsListHTML}
            </div>
          </div>
          
          <div style="margin: 1rem 0; padding: 1rem; background: var(--card); border-radius: 8px;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-ink);">Ajouter un nouveau tag :</h4>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="text" id="newTagInput" placeholder="Nom du nouveau tag" style="flex: 1; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 4px;">
              <button type="button" id="addTagBtn" class="btn" style="background: var(--accent); color: white;">
                ➕ Ajouter
              </button>
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn modal-close" style="background: #666; color: white;">
              ❌ Annuler
            </button>
            <button type="button" id="saveTagsManagementBtn" class="btn" style="background: var(--accent); color: white;">
              💾 Sauvegarder
            </button>
          </div>
        </div>
      `;

      this.setupTagsManagementHandlers(modal, config);
      return modal;
    },

    setupTagsManagementHandlers(modal, config) {
      // Add new tag
      modal.querySelector('#addTagBtn').addEventListener('click', () => {
        const input = modal.querySelector('#newTagInput');
        const newTag = input.value.trim();
        
        if (!newTag) {
          this.showNotification('❌ Veuillez saisir un nom de tag', 'error');
          return;
        }
        
        if (config.availableTags.includes(newTag)) {
          this.showNotification(`❌ Le tag "${newTag}" existe déjà`, 'error');
          return;
        }
        
        // Add to temporary config (will be saved when user clicks save)
        config.availableTags.push(newTag);
        
        // Update the modal display
        this.refreshTagsManagementModal(modal, config);
        
        // Clear input
        input.value = '';
        this.showNotification(`➕ Tag "${newTag}" ajouté à la liste`, 'success');
      });

      // Handle Enter key in new tag input
      modal.querySelector('#newTagInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          modal.querySelector('#addTagBtn').click();
        }
      });

      // Delete tag
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-tag-btn')) {
          const tagName = e.target.dataset.tagName;
          
          if (config.availableTags.length <= 1) {
            this.showNotification('❌ Impossible de supprimer le dernier tag', 'error');
            return;
          }
          
          if (confirm(`Supprimer le tag "${tagName}" ?\nAttention: il sera retiré de tous les objets qui l'utilisent.`)) {
            // Remove from config
            config.availableTags = config.availableTags.filter(tag => tag !== tagName);
            
            // Remove from all objects that use this tag
            if (window.OBJETS?.objets) {
              window.OBJETS.objets.forEach(obj => {
                if (obj.tags && obj.tags.includes(tagName)) {
                  obj.tags = obj.tags.filter(tag => tag !== tagName);
                  // Ensure object has at least one tag if possible
                  if (obj.tags.length === 0 && config.availableTags.length > 0) {
                    obj.tags = [config.availableTags[0]];
                  }
                }
              });
            }
            
            // Update filter settings to remove deleted tag
            if (window.OBJETS?.filterSettings?.visibleTags) {
              window.OBJETS.filterSettings.visibleTags = window.OBJETS.filterSettings.visibleTags.filter(tag => tag !== tagName);
              // Ensure at least one visible tag remains
              if (window.OBJETS.filterSettings.visibleTags.length === 0 && config.availableTags.length > 0) {
                window.OBJETS.filterSettings.visibleTags = [config.availableTags[0]];
              }
            }
            
            // Update modal display
            this.refreshTagsManagementModal(modal, config);
            this.showNotification(`🗑️ Tag "${tagName}" supprimé`, 'success');
          }
        }
      });

      // Save all changes
      modal.querySelector('#saveTagsManagementBtn').addEventListener('click', () => {
        // Collect all tag renames
        const tagItems = modal.querySelectorAll('.tag-item');
        const renames = [];
        
        tagItems.forEach(item => {
          const originalName = item.dataset.tagName;
          const newName = item.querySelector('.tag-input').value.trim();
          
          if (newName && newName !== originalName) {
            renames.push({ old: originalName, new: newName });
          }
        });
        
        // Apply renames to config
        renames.forEach(rename => {
          const index = config.availableTags.indexOf(rename.old);
          if (index >= 0) {
            config.availableTags[index] = rename.new;
            
            // Update all objects that use this tag
            if (window.OBJETS?.objets) {
              window.OBJETS.objets.forEach(obj => {
                if (obj.tags && obj.tags.includes(rename.old)) {
                  const tagIndex = obj.tags.indexOf(rename.old);
                  obj.tags[tagIndex] = rename.new;
                }
              });
            }
            
            // Update filter settings
            if (window.OBJETS?.filterSettings?.visibleTags) {
              const visibleIndex = window.OBJETS.filterSettings.visibleTags.indexOf(rename.old);
              if (visibleIndex >= 0) {
                window.OBJETS.filterSettings.visibleTags[visibleIndex] = rename.new;
              }
            }
          }
        });
        
        // Save to storage
        EventBus.emit(Events.STORAGE_SAVE);
        
        // Refresh objects page if currently visible
        this.refreshObjectsPage();
        
        // Close modal
        modal.close();
        modal.remove();
        
        const changesCount = renames.length;
        if (changesCount > 0) {
          this.showNotification(`💾 ${changesCount} modification(s) sauvegardée(s)`, 'success');
        } else {
          this.showNotification('💾 Tags sauvegardés', 'success');
        }
      });

      // Close modal events
      modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.close();
        modal.remove();
      });

      modal.addEventListener('cancel', () => {
        modal.close();
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.close();
          modal.remove();
        }
      });
    },

    refreshTagsManagementModal(modal, config) {
      const container = modal.querySelector('#tagsManagementList');
      if (!container) return;

      const tagsListHTML = config.availableTags.map((tag, index) => `
        <div class="tag-item" data-tag-index="${index}" data-tag-name="${tag}">
          <span class="tag-chip" style="background: var(--bronze); color: white; padding: 4px 8px; border-radius: 8px; margin-right: 0.5rem;">${tag}</span>
          <input type="text" value="${tag}" class="tag-input" style="flex: 1; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 4px; margin-right: 0.5rem;">
          <button type="button" class="btn small delete-tag-btn" data-tag-name="${tag}" style="background: #dc2626; color: white; padding: 0.25rem 0.5rem;">
            🗑️
          </button>
        </div>
      `).join('');

      container.innerHTML = tagsListHTML;
    },

    // ==== ID SEARCH FUNCTIONALITY ====

    performIdSearch(searchValue) {
      const searchId = searchValue.trim();
      const resultDiv = document.querySelector('#id-search-result');
      
      if (!searchId) {
        this.clearIdSearch();
        return;
      }

      const searchNumber = parseInt(searchId, 10);
      if (isNaN(searchNumber)) {
        if (resultDiv) {
          resultDiv.innerHTML = '❌ Veuillez saisir un numéro valide';
          resultDiv.style.color = '#dc2626';
        }
        return;
      }

      // Find object by number
      const allObjects = window.OBJETS?.objets || [];
      const foundObject = allObjects.find(obj => obj.numero === searchNumber);

      if (!foundObject) {
        if (resultDiv) {
          resultDiv.innerHTML = `❌ Aucun objet trouvé avec l'ID ${searchNumber}`;
          resultDiv.style.color = '#dc2626';
        }
        // Hide all objects
        this.hideAllObjects();
        return;
      }

      // Show success message
      if (resultDiv) {
        resultDiv.innerHTML = `✅ Objet trouvé : "${foundObject.nom}" (ID: ${searchNumber})`;
        resultDiv.style.color = '#16a34a';
      }

      // Show only the found object
      this.showOnlyObjectById(searchNumber);
    },

    clearIdSearch() {
      const input = document.querySelector('#id-search-input');
      const resultDiv = document.querySelector('#id-search-result');
      
      if (input) {
        input.value = '';
      }
      
      if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.style.color = '';
      }

      // Show all objects according to current tag filters
      this.showAllObjectsWithTagFilters();
    },

    hideAllObjects() {
      const container = document.querySelector('#objets-container');
      if (container) {
        const allCards = container.querySelectorAll('.card');
        allCards.forEach(card => {
          card.style.display = 'none';
        });
      }
    },

    showOnlyObjectById(objectId) {
      const container = document.querySelector('#objets-container');
      if (!container) return;

      const allCards = container.querySelectorAll('.card');
      let foundCard = null;

      allCards.forEach(card => {
        const objetName = card.dataset.objetName;
        if (objetName) {
          // Find the object by name to get its number
          const obj = window.OBJETS?.objets?.find(o => o.nom === objetName);
          if (obj && obj.numero === objectId) {
            card.style.display = '';
            foundCard = card;
          } else {
            card.style.display = 'none';
          }
        }
      });

      // Scroll to the found card if it exists
      if (foundCard) {
        setTimeout(() => {
          foundCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Brief highlight effect
          foundCard.style.transition = 'all 0.3s ease';
          foundCard.style.boxShadow = '0 0 20px rgba(22, 163, 74, 0.5)';
          foundCard.style.transform = 'scale(1.02)';
          
          setTimeout(() => {
            foundCard.style.boxShadow = '';
            foundCard.style.transform = '';
          }, 1500);
        }, 100);
      }
    },

    showAllObjectsWithTagFilters() {
      // Restore normal tag filtering behavior
      const currentSettings = window.OBJETS?.filterSettings || { 
        visibleTags: window.ContentTypes.objet.filterConfig.defaultVisibleTags 
      };
      
      const container = document.querySelector('#objets-container');
      if (!container) return;

      const allCards = container.querySelectorAll('.card');
      allCards.forEach(card => {
        const objetName = card.dataset.objetName;
        if (objetName) {
          // Find the object and check if it has visible tags
          const obj = window.OBJETS?.objets?.find(o => o.nom === objetName);
          if (obj && obj.tags) {
            const hasVisibleTag = obj.tags.some(tag => currentSettings.visibleTags.includes(tag));
            card.style.display = hasVisibleTag ? '' : 'none';
          } else {
            card.style.display = 'none';
          }
        }
      });
    }
  };

})();