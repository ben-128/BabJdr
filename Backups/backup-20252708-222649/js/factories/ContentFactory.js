// ============================================================================
// JDR-BAB APPLICATION - CONTENT FACTORY
// ============================================================================

(() => {
  "use strict";

  class ContentFactory {
    constructor() {
      this.entities = new Map();
      this.initialize();
    }

    static getInstance() {
      if (!ContentFactory.instance) {
        ContentFactory.instance = new ContentFactory();
      }
      return ContentFactory.instance;
    }

    initialize() {
      // Lazy initialization - only create entities when data is available
      if (window.SORTS) {
        this.entities.set('spell', new BaseEntity('spell', window.SORTS));
      }
      if (window.DONS) {
        this.entities.set('don', new BaseEntity('don', window.DONS));
      }
      if (window.CLASSES) {
        this.entities.set('class', new BaseEntity('class', window.CLASSES));
      }
      if (window.OBJETS) {
        this.entities.set('objet', new BaseEntity('objet', window.OBJETS));
      }
      if (window.MONSTRES) {
        this.entities.set('monster', new BaseEntity('monster', window.MONSTRES));
      }
      if (window.TABLES_TRESORS) {
        this.entities.set('tableTresor', new BaseEntity('tableTresor', window.TABLES_TRESORS));
      }
    }

    getEntity(type) {
      // Ensure entity exists, create if data is available but entity is missing
      if (!this.entities.has(type)) {
        this.initializeEntity(type);
      }
      return this.entities.get(type);
    }

    initializeEntity(type) {
      switch (type) {
        case 'spell':
          if (window.SORTS) {
            this.entities.set('spell', new BaseEntity('spell', window.SORTS));
          }
          break;
        case 'don':
          if (window.DONS) {
            this.entities.set('don', new BaseEntity('don', window.DONS));
          }
          break;
        case 'class':
          if (window.CLASSES) {
            this.entities.set('class', new BaseEntity('class', window.CLASSES));
          }
          break;
        case 'objet':
          if (window.OBJETS) {
            this.entities.set('objet', new BaseEntity('objet', window.OBJETS));
          }
          break;
        case 'monster':
          if (window.MONSTRES) {
            this.entities.set('monster', new BaseEntity('monster', window.MONSTRES));
          }
          break;
        case 'tableTresor':
          if (window.TABLES_TRESORS) {
            this.entities.set('tableTresor', new BaseEntity('tableTresor', window.TABLES_TRESORS));
          }
          break;
      }
    }

    getSpells() {
      return this.getEntity('spell');
    }

    getDons() {
      return this.getEntity('don');
    }

    getClasses() {
      return this.getEntity('class');
    }

    getObjets() {
      return this.getEntity('objet');
    }

    getMonsters() {
      return this.getEntity('monster');
    }

    getTablesTresors() {
      return this.getEntity('tableTresor');
    }

    findItem(type, itemName, categoryName = null) {
      const entity = this.getEntity(type);
      return entity ? entity.findItem(itemName, categoryName) : null;
    }

    addItem(type, categoryName, itemData) {
      const entity = this.getEntity(type);
      return entity ? entity.addItem(categoryName, itemData) : false;
    }

    deleteItem(type, categoryName, itemName) {
      const entity = this.getEntity(type);
      return entity ? entity.deleteItem(categoryName, itemName) : false;
    }

    updateItem(type, categoryName, itemName, property, value) {
      const entity = this.getEntity(type);
      return entity ? entity.updateItem(categoryName, itemName, property, value) : false;
    }

    moveItem(type, categoryName, itemName, direction) {
      const entity = this.getEntity(type);
      return entity ? entity.moveItem(categoryName, itemName, direction) : false;
    }

    searchAll(query) {
      const allResults = [];
      
      this.entities.forEach((entity, type) => {
        const results = entity.search(query);
        allResults.push(...results);
      });

      return allResults;
    }

    refreshData() {
      this.entities.clear();
      this.initialize();
    }

    // ============================================================================
    // UNIFIED PAGE DESCRIPTION SYSTEM
    // ============================================================================

    getPageDescription(type) {
      const config = window.ContentTypes[type];
      
      if (!config || !config.pageDescription) {
        return '';
      }
      
      const pageDesc = config.pageDescription;
      
      if (pageDesc.dataSource === 'external') {
        // Utilisation d'un fichier externe via dataKey
        const dataObj = window[pageDesc.dataKey];
        if (!dataObj) {
          // Créer l'objet externe s'il n'existe pas
          window[pageDesc.dataKey] = { [pageDesc.storageKey]: pageDesc.defaultValue };
          return pageDesc.defaultValue;
        }
        return dataObj[pageDesc.storageKey] || pageDesc.defaultValue;
      } else {
        // Source de données intégrée dans le dataKey principal
        const mainDataKey = config.dataKey;
        const mainData = window[mainDataKey];
        
        if (!mainData) {
          console.warn(`Main data key ${mainDataKey} not found for type ${type}`);
          return pageDesc.defaultValue;
        }
        
        // Initialiser la description si elle n'existe pas
        if (!mainData[pageDesc.storageKey]) {
          mainData[pageDesc.storageKey] = pageDesc.defaultValue;
        }
        
        return mainData[pageDesc.storageKey];
      }
    }

    updatePageDescription(type, newDescription) {
      console.log('🔍 DEBUG updatePageDescription:', { type, newDescription });
      console.log('🔍 window.ContentTypes available:', !!window.ContentTypes);
      console.log('🔍 Available types:', Object.keys(window.ContentTypes || {}));
      
      const config = window.ContentTypes[type];
      
      if (!config || !config.pageDescription) {
        console.warn(`No page description config found for type: ${type}`);
        console.log('🔍 Config for type:', config);
        console.log('🔍 Full ContentTypes:', window.ContentTypes);
        return false;
      }
      
      const pageDesc = config.pageDescription;
      
      try {
        if (pageDesc.dataSource === 'external') {
          // Mise à jour d'un fichier externe via dataKey
          const dataObj = window[pageDesc.dataKey];
          if (!dataObj) {
            window[pageDesc.dataKey] = {};
          }
          window[pageDesc.dataKey][pageDesc.storageKey] = newDescription;
          
          // Also update JdrApp.data.customPageDescriptions for consistency with router and storage
          if (!JdrApp.data.customPageDescriptions) {
            JdrApp.data.customPageDescriptions = {};
          }
          JdrApp.data.customPageDescriptions[pageDesc.storageKey] = newDescription;
        } else {
          // Mise à jour dans le dataKey principal
          const mainDataKey = config.dataKey;
          const mainData = window[mainDataKey];
          
          if (!mainData) {
            console.error(`Main data key ${mainDataKey} not found for type ${type}`);
            return false;
          }
          
          mainData[pageDesc.storageKey] = newDescription;
        }
        
        // Émettre un événement pour notifier le changement
        if (window.EventBus) {
          window.EventBus.emit('pageDescriptionUpdated', { type, description: newDescription });
        }
        
        return true;
      } catch (error) {
        console.error(`Error updating page description for ${type}:`, error);
        return false;
      }
    }

    getConfig(type) {
      return window.ContentTypes[type];
    }

    createDefaultItem(type, overrides = {}) {
      const config = this.getConfig(type);
      if (!config?.defaultValues) return {};

      return { ...config.defaultValues, ...overrides };
    }
  }

  window.ContentFactory = ContentFactory.getInstance();

})();