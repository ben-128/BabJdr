// ============================================================================
// JDR-BAB APPLICATION - CONTENT MANAGER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // CONTENT MANAGER - CRUD OPERATIONS
  // ========================================
  window.ContentManager = {

    /**
     * Add new content item
     */
    addContent(type, categoryName) {
      const config = window.ContentTypes[type];
      if (!config) {
        UIUtilities.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Create new item with default values
      const defaultItem = ContentFactory.createDefaultItem(type);
      
      // Special handling for objects and monsters (add to single array)
      if (type === 'objet') {
        this.addObject(defaultItem);
      } else if (type === 'monster') {
        this.addMonster(defaultItem);
      } else {
        // Standard category-based addition
        this.addStandardContent(type, categoryName, defaultItem);
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      UIUtilities.showNotification(`${config.icons.add} Nouvel élément ajouté`, 'success');
    },

    /**
     * Add object to objects array
     */
    addObject(defaultItem) {
      if (!window.OBJETS.objets) {
        window.OBJETS.objets = [];
      }
      
      // Get next number
      const existingNumbers = window.OBJETS.objets.map(obj => obj.numero || 0);
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      defaultItem.numero = nextNumber;
      
      window.OBJETS.objets.push(defaultItem);
      UIUtilities.refreshObjectsPage();
    },

    /**
     * Add monster to monsters array
     */
    addMonster(defaultItem) {
      if (!window.MONSTRES) {
        window.MONSTRES = [];
      }
      
      window.MONSTRES.push(defaultItem);
      UIUtilities.refreshMonstersPage();
    },

    /**
     * Add content using standard category-based approach
     */
    addStandardContent(type, categoryName, defaultItem) {
      const success = ContentFactory.addItem(type, categoryName, defaultItem);
      if (success) {
        EventBus.emit(Events.CONTENT_ADD, {
          type: type,
          category: categoryName,
          item: defaultItem
        });
        
        // Try to add the new card directly to avoid full page refresh
        setTimeout(() => {
          this.addNewCardDirectly(type, categoryName, defaultItem);
        }, 100);
      }
    },

    /**
     * Delete content item
     */
    deleteContent(type, categoryName, itemName) {
      const config = window.ContentTypes[type];
      if (!config) {
        UIUtilities.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      if (!confirm(`Supprimer "${itemName}" ?`)) {
        return;
      }

      // Special handling for objects and monsters
      if (type === 'objet') {
        this.deleteObject(itemName);
      } else if (type === 'monster') {
        this.deleteMonster(itemName);
      } else {
        // Standard category-based deletion
        this.deleteStandardContent(type, categoryName, itemName);
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      UIUtilities.showNotification(`${config.icons.delete} "${itemName}" supprimé`, 'success');
    },

    /**
     * Delete object from objects array
     */
    deleteObject(itemName) {
      if (window.OBJETS?.objets) {
        const itemIndex = window.OBJETS.objets.findIndex(obj => obj.nom === itemName);
        if (itemIndex >= 0) {
          window.OBJETS.objets.splice(itemIndex, 1);
          UIUtilities.refreshObjectsPage();
        }
      }
    },

    /**
     * Delete monster from monsters array
     */
    deleteMonster(itemName) {
      if (window.MONSTRES) {
        const itemIndex = window.MONSTRES.findIndex(monster => monster.nom === itemName);
        if (itemIndex >= 0) {
          window.MONSTRES.splice(itemIndex, 1);
          UIUtilities.refreshMonstersPage();
        }
      }
    },

    /**
     * Delete content using standard category-based approach
     */
    deleteStandardContent(type, categoryName, itemName) {
      const success = ContentFactory.deleteItem(type, categoryName, itemName);
      if (success) {
        EventBus.emit(Events.CONTENT_DELETE, {
          type: type,
          category: categoryName,
          item: itemName
        });
        
        // Try to add the new card directly to avoid full page refresh
        setTimeout(() => {
          this.addNewCardDirectly(type, categoryName, defaultItem);
        }, 100);
      }
    },

    /**
     * Move content item
     */
    moveContent(type, categoryName, itemName, direction) {
      const config = window.ContentTypes[type];
      if (!config) {
        UIUtilities.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Special handling for objects
      if (type === 'objet') {
        this.moveObject(itemName, direction);
      } else {
        // Standard category-based movement
        this.moveStandardContent(type, categoryName, itemName, direction);
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      const directionText = direction > 0 ? 'descendu' : 'monté';
      UIUtilities.showNotification(`🔄 "${itemName}" ${directionText}`, 'success');
    },

    /**
     * Move object in objects array
     */
    moveObject(itemName, direction) {
      if (window.OBJETS?.objets) {
        const itemIndex = window.OBJETS.objets.findIndex(obj => obj.nom === itemName);
        if (itemIndex >= 0) {
          const newIndex = itemIndex + direction;
          if (newIndex >= 0 && newIndex < window.OBJETS.objets.length) {
            const item = window.OBJETS.objets.splice(itemIndex, 1)[0];
            window.OBJETS.objets.splice(newIndex, 0, item);
            UIUtilities.refreshObjectsPage();
          }
        }
      }
    },

    /**
     * Move content using standard category-based approach
     */
    moveStandardContent(type, categoryName, itemName, direction) {
      const success = ContentFactory.moveItem(type, categoryName, itemName, direction);
      if (success) {
        EventBus.emit(Events.CONTENT_MOVE, {
          type: type,
          category: categoryName,
          itemName: itemName,
          direction: direction
        });
        
        // Try to add the new card directly to avoid full page refresh
        setTimeout(() => {
          this.addNewCardDirectly(type, categoryName, defaultItem);
        }, 100);
      }
    },

    /**
     * Find the current category object by type and name
     */
    findCurrentCategory(type, categoryName) {
      if (type === 'don' && window.DONS) {
        return window.DONS.find(cat => cat.nom === categoryName);
      } else if (type === 'spell' && window.SORTS) {
        return window.SORTS.find(cat => cat.nom === categoryName);
      }
      return null;
    },

    /**
     * Add new card directly to DOM without full page refresh
     */
    addNewCardDirectly(type, categoryName, newItem) {
      try {
        // Find the container for this category using the correct ID pattern
        const config = window.ContentTypes[type];
        if (!config) {
          return false;
        }
        
        const sanitizedCategoryName = JdrApp.utils.data.sanitizeId(categoryName);
        const containerId = `${config.container}-container-${sanitizedCategoryName}`;
        const categoryContainer = document.getElementById(containerId);
        
        if (!categoryContainer) {
          return false;
        }

        // Create the new card HTML
        const cardIndex = categoryContainer.children.length; // Use actual DOM count
        const newCardHTML = window.CardBuilder?.create(type, newItem, categoryName, cardIndex)?.build();
        if (!newCardHTML) {
          return false;
        }

        // Add the card to the container
        categoryContainer.insertAdjacentHTML('beforeend', newCardHTML);
        
        // Load images for the new card
        if (JdrApp.modules.renderer?.autoLoadImages) {
          JdrApp.modules.renderer.autoLoadImages();
        }
        
        return true;
      } catch (error) {
        return false;
      }
    },

    /**
     * Get the next card index for a category
     */
    getNextCardIndex(type, categoryName) {
      if (type === 'don' && window.DONS) {
        const category = window.DONS.find(cat => cat.nom === categoryName);
        return category?.dons?.length || 0;
      } else if (type === 'spell' && window.SORTS) {
        const category = window.SORTS.find(cat => cat.nom === categoryName);
        return category?.sorts?.length || 0;
      }
      return 0;
    },

    /**
     * Handle content addition post-processing
     */
    handleContentAdd(type, category, item) {
      // Additional handling after content is added
      setTimeout(() => {
        if (JdrApp.modules.renderer?.autoLoadImages) {
          JdrApp.modules.renderer.autoLoadImages();
        }
      }, 100);
    },

    /**
     * Handle content deletion post-processing
     */
    handleContentDelete(type, category, item) {
      // Cleanup after content deletion
    },

    /**
     * Handle content movement post-processing
     */
    handleContentMove(type, category, itemName, direction) {
      // Additional handling after content is moved
    }
  };

})();