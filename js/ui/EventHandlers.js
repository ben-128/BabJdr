// ============================================================================
// JDR-BAB APPLICATION - EVENT HANDLERS MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // EVENT HANDLERS - UI EVENT DELEGATION
  // ========================================
  window.EventHandlers = {

    /**
     * Setup content-related event handlers
     */
    setupContentHandlers() {
      // Generic content addition
      JdrApp.utils.events.register('click', '[class$="-add"]', (e) => {
        const type = UIUtilities.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        if (type && categoryName) {
          // Direct call to avoid delegation issues
          if (JdrApp.modules.ui && typeof JdrApp.modules.ui.addContent === 'function') {
            JdrApp.modules.ui.addContent(type, categoryName);
          } else if (window.ContentManager && typeof ContentManager.addContent === 'function') {
            ContentManager.addContent(type, categoryName);
          } else {
            console.warn('No addContent method available');
            // Retry after a short delay
            setTimeout(() => {
              if (JdrApp.modules.ui && typeof JdrApp.modules.ui.addContent === 'function') {
                JdrApp.modules.ui.addContent(type, categoryName);
              } else if (window.ContentManager && typeof ContentManager.addContent === 'function') {
                ContentManager.addContent(type, categoryName);
              }
            }, 100);
          }
        }
      });

      // Generic content deletion - using multiple specific selectors
      JdrApp.utils.events.register('click', '.spell-delete, .don-delete, .delete-subclass-btn, .objet-delete, .monster-delete, .tableTresor-delete', (e) => {
        const type = UIUtilities.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        // Handle different dataset attribute naming patterns
        const itemName = this.extractItemName(e.target, type);
        
        if (type && categoryName && itemName) {
          this.delegateToUI('deleteContent', type, categoryName, itemName);
        }
      });

      // Generic content movement
      JdrApp.utils.events.register('click', '[class*="-move-"]', (e) => {
        const type = UIUtilities.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        const itemName = this.extractItemName(e.target, type);
        const direction = e.target.className.includes('move-up') ? -1 : 1;
        
        if (type && categoryName && itemName) {
          this.delegateToUI('moveContent', type, categoryName, itemName, direction);
        }
      });

      // Filter manager button for objects
      JdrApp.utils.events.register('click', '.filter-manager-btn', () => {
        this.delegateToUI('showFilterManagementModal');
      });

      // Tags manager button for objects
      JdrApp.utils.events.register('click', '.tags-manager-btn', () => {
        this.delegateToUI('showTagsManagementModal');
      });

      // Filter chip toggle for objects - DISABLED (handled by core.js now)
      // JdrApp.utils.events.register('click', '.filter-chip', (e) => {
      //   e.preventDefault();
      //   e.stopPropagation();
      //   this.delegateToUI('toggleFilter', e.target);
      // });

      // Select all tags button
      JdrApp.utils.events.register('click', '#select-all-tags', () => {
        this.delegateToUI('selectAllTags');
      });

      // Select no tags button
      JdrApp.utils.events.register('click', '#select-no-tags', () => {
        this.delegateToUI('selectNoTags');
      });

      // Cartes du destin modal trigger
      JdrApp.utils.events.register('click', '[data-action="show-cartes-destin"]', (e) => {
        e.preventDefault();
        if (window.ModalManager && typeof ModalManager.showCartesDestinModal === 'function') {
          ModalManager.showCartesDestinModal();
        } else {
          console.error('ModalManager.showCartesDestinModal not available');
        }
      });

      // ID search functionality (only on Enter key or button click)
      JdrApp.utils.events.register('keydown', '#id-search-input', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.delegateToUI('performIdSearch', e.target.value);
        } else if (e.key === 'Escape') {
          e.target.value = '';
          this.delegateToUI('clearIdSearch');
        }
      });

      // Search object button click
      JdrApp.utils.events.register('click', '#search-object-btn', (e) => {
        e.preventDefault();
        const input = document.querySelector('#id-search-input');
        if (input) {
          this.delegateToUI('performIdSearch', input.value);
        }
      });

      JdrApp.utils.events.register('click', '#clear-id-search', () => {
        if (JdrApp.modules.ui && typeof JdrApp.modules.ui.clearIdSearch === 'function') {
          JdrApp.modules.ui.clearIdSearch();
        }
      });

      // Spell element change
      JdrApp.utils.events.register('change', '.spell-element-selector select', (e) => {
        this.delegateToUI('updateSpellElement', e.target);
      });

      // Paragraph addition
      JdrApp.utils.events.register('click', '.add-paragraph-btn', (e) => {
        const target = e.target.dataset.target;
        this.delegateToUI('addParagraph', target, e.target);
      });

      // Section deletion for static pages
      JdrApp.utils.events.register('click', '.section-delete', (e) => {
        const sectionName = e.target.dataset.sectionName;
        if (sectionName && confirm(`Supprimer la section "${sectionName}" ?`)) {
          this.delegateToUI('deleteSection', sectionName, e.target);
        }
      });

      // Dev toolbox category creation buttons
      JdrApp.utils.events.register('click', '#addSpellCategory', () => {
        this.delegateToUI('createNewCategory', 'spell');
      });

      JdrApp.utils.events.register('click', '#addDonCategory', () => {
        this.delegateToUI('createNewCategory', 'don');
      });

      // Category deletion buttons
      JdrApp.utils.events.register('click', '[class$="-category-delete"]', (e) => {
        const categoryName = e.target.dataset.categoryName;
        const categoryType = e.target.dataset.categoryType;
        
        if (categoryName && categoryType) {
          this.delegateToUI('deleteCategory', categoryType, categoryName);
        }
      });

      // Print button for states page
      JdrApp.utils.events.register('click', '#print-etats-btn', () => {
        // Build printable content from the état cards currently visible
        const activeArticle = document.querySelector('#views article[data-page="etats"]');
        if (!activeArticle) return;

        const cards = activeArticle.querySelectorAll('.card.editable-section');
        let cardsHtml = '';
        cards.forEach(card => {
          const title = card.querySelector('h3.editable-card-title');
          const content = card.querySelector('div[data-edit-type="generic"]:not(.editable-card-title)');
          if (title) {
            cardsHtml += `<div class="printable-state-item">
              <h3>${title.textContent}</h3>
              <p>${content ? content.innerHTML : ''}</p>
            </div>`;
          }
        });

        const printDiv = document.createElement('div');
        printDiv.className = 'printable-states';
        printDiv.innerHTML = `<h1>États</h1><div class="printable-states-grid">${cardsHtml}</div>`;
        document.body.appendChild(printDiv);

        window.print();

        printDiv.remove();
      });

      // Zero references toggle button
      JdrApp.utils.events.register('click', '.zero-references-toggle', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleZeroReferencesFilter();
      });

      // Object references counter - handled by TablesTresorsManager
    },

    /**
     * Setup tags management event handlers
     */
    setupTagsManagement() {
      // Tables de trésors - Edition des fourchettes
      JdrApp.utils.events.register('click', '.edit-fourchette-btn', (e) => {
        const tableName = e.target.dataset.tableName;
        const fourchetteIndex = parseInt(e.target.dataset.fourchetteIndex);
        
        if (tableName && fourchetteIndex >= 0) {
          this.delegateToUI('editFourchette', tableName, fourchetteIndex);
        }
      });

      // Tables de trésors - Suppression des fourchettes
      JdrApp.utils.events.register('click', '.delete-fourchette-btn', (e) => {
        const tableName = e.target.dataset.tableName;
        const fourchetteIndex = parseInt(e.target.dataset.fourchetteIndex);
        
        if (tableName && fourchetteIndex >= 0) {
          if (confirm('Êtes-vous sûr de vouloir supprimer cette fourchette ?')) {
            this.delegateToUI('deleteFourchette', tableName, fourchetteIndex);
          }
        }
      });

      // Tables de trésors - Déplacement des fourchettes vers le haut
      JdrApp.utils.events.register('click', '.move-fourchette-up-btn', (e) => {
        const tableName = e.target.dataset.tableName;
        const fourchetteIndex = parseInt(e.target.dataset.fourchetteIndex);
        
        if (tableName && fourchetteIndex > 0) {
          this.delegateToUI('moveFourchette', tableName, fourchetteIndex, fourchetteIndex - 1);
        }
      });

      // Tables de trésors - Déplacement des fourchettes vers le bas
      JdrApp.utils.events.register('click', '.move-fourchette-down-btn', (e) => {
        const tableName = e.target.dataset.tableName;
        const fourchetteIndex = parseInt(e.target.dataset.fourchetteIndex);
        
        if (tableName && fourchetteIndex >= 0) {
          this.delegateToUI('moveFourchette', tableName, fourchetteIndex, fourchetteIndex + 1);
        }
      });

      // Tables de trésors - Ajout de fourchettes (géré par TablesTresorsManager)
      // JdrApp.utils.events.register('click', '.table-tresor-add-fourchette', (e) => {
      //   const tableName = e.target.dataset.tableTresorName;
      //   
      //   if (tableName) {
      //     this.delegateToUI('addFourchette', tableName);
      //   }
      // });

      // Tables de trésors - Prévisualisation des objets (géré par TablesTresorsManager)
      // Cette gestion est déjà dans TablesTresorsManager, pas besoin de duplication
    },

    /**
     * Extract item name from element based on type
     */
    extractItemName(element, type) {
      if (type === 'spell') {
        return element.dataset.spellName;
      } else if (type === 'don') {
        return element.dataset.donName;
      } else if (type === 'objet') {
        return element.dataset.objetName;
      } else if (type === 'monster') {
        return element.dataset.monsterName;
      } else if (type === 'tableTresor') {
        return element.dataset.tableTresorName || element.dataset.tableTesorName;
      } else if (type === 'class') {
        return element.dataset.className || element.dataset.subclassName;
      } else {
        return element.dataset[`${type}Name`];
      }
    },

    /**
     * Delegate method calls to UI module
     */
    delegateToUI(methodName, ...args) {
      if (JdrApp.modules.ui && typeof JdrApp.modules.ui[methodName] === 'function') {
        return JdrApp.modules.ui[methodName](...args);
      } else if (methodName === 'showTagsManagementModal') {
        // Delegate to TagsManager for tags management
        if (window.TagsManager && typeof TagsManager.showTagsManagementModal === 'function') {
          return TagsManager.showTagsManagementModal(...args);
        } else {
          console.warn('TagsManager not available yet');
        }
      } else if (methodName === 'addParagraph') {
        // Delegate to PageManager for paragraph addition
        if (window.PageManager && typeof PageManager.addParagraph === 'function') {
          return PageManager.addParagraph(...args);
        } else {
          console.warn('PageManager not available yet');
        }
      } else if (methodName === 'deleteSection') {
        // Delegate to PageManager for section deletion
        if (window.PageManager && typeof PageManager.deleteSection === 'function') {
          return PageManager.deleteSection(...args);
        } else {
          console.warn('PageManager not available yet');
        }
      } else if (methodName === 'addContent') {
        // Multiple fallback approaches for addContent
        if (window.ContentManager && typeof ContentManager.addContent === 'function') {
          return ContentManager.addContent(...args);
        } else {
          // Debug what's available
          console.log('Available modules:', {
            ui: !!JdrApp.modules.ui,
            uiAddContent: !!(JdrApp.modules.ui && JdrApp.modules.ui.addContent),
            contentManager: !!window.ContentManager,
            contentManagerAdd: !!(window.ContentManager && ContentManager.addContent)
          });
          
          // Last resort: retry after delay
          setTimeout(() => {
            if (JdrApp.modules.ui && typeof JdrApp.modules.ui.addContent === 'function') {
              JdrApp.modules.ui.addContent(...args);
            } else if (window.ContentManager && typeof ContentManager.addContent === 'function') {
              ContentManager.addContent(...args);
            } else {
              console.error('Unable to add content - no available methods');
            }
          }, 100);
          return;
        }
      } else if (['addFourchette', 'editFourchette', 'deleteFourchette', 'moveFourchette'].includes(methodName)) {
        // Delegate to TablesTresorsManager for fourchette operations
        if (window.TablesTresorsManager && typeof window.TablesTresorsManager[methodName] === 'function') {
          return window.TablesTresorsManager[methodName](...args);
        } else {
          console.warn(`TablesTresorsManager method ${methodName} not available`);
        }
      } else if (['moveContent', 'deleteContent'].includes(methodName)) {
        // Delegate to ContentManager for content operations
        if (window.ContentManager && typeof window.ContentManager[methodName] === 'function') {
          return window.ContentManager[methodName](...args);
        } else {
          console.warn(`ContentManager method ${methodName} not available`);
        }
      } else {
        console.warn(`UI method ${methodName} not found or not available yet`);
      }
    },

    toggleZeroReferencesFilter() {
      // Toggle the filter state
      window.SHOW_ZERO_REFERENCES_ONLY = !window.SHOW_ZERO_REFERENCES_ONLY;

      // Regenerate the GM objects page to apply the new filter
      if (JdrApp.modules.router && typeof JdrApp.modules.router.renderGMObjectsPage === 'function') {
        JdrApp.modules.router.renderGMObjectsPage();
      } else {
        console.warn('Unable to refresh GM objects page');
      }
    }
  };

})();