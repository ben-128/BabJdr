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
          this.delegateToUI('addContent', type, categoryName);
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

      JdrApp.utils.events.register('click', '#search-object-btn', () => {
        const input = document.querySelector('#id-search-input');
        if (input) {
          this.delegateToUI('performIdSearch', input.value);
        }
      });

      JdrApp.utils.events.register('click', '#clear-id-search', () => {
        this.delegateToUI('clearIdSearch');
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
      JdrApp.utils.events.register('click', '#print-states', () => {
        window.print();
      });
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

      // Tables de trésors - Ajout de fourchettes
      JdrApp.utils.events.register('click', '.table-tresor-add-fourchette', (e) => {
        const tableName = e.target.dataset.tableTresorName;
        
        if (tableName) {
          this.delegateToUI('addFourchette', tableName);
        }
      });

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
        return element.dataset.tableTresorName;
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
      } else {
        console.warn(`UI method ${methodName} not found or not available yet`);
      }
    }
  };

})();