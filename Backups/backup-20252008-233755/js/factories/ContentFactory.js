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