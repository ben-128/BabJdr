// ============================================================================
// JDR-BAB APPLICATION - BASE ENTITY
// ============================================================================

(() => {
  "use strict";

  class BaseEntity {
    constructor(type, dataArray) {
      this.type = type;
      this.data = dataArray || [];
      this.config = window.ContentTypes[type];
    }

    getAll() {
      return this.data;
    }

    findCategory(categoryName) {
      return this.data.find(category => category.nom === categoryName);
    }

    findItem(itemName, categoryName = null) {
      if (categoryName) {
        const category = this.findCategory(categoryName);
        if (!category || !category[this.getItemsProperty()]) return null;
        
        const item = category[this.getItemsProperty()].find(item => item.nom === itemName);
        return item ? { item, category: category.nom } : null;
      }

      for (const category of this.data) {
        if (!category[this.getItemsProperty()]) continue;
        const item = category[this.getItemsProperty()].find(item => item.nom === itemName);
        if (item) {
          return { item, category: category.nom };
        }
      }
      return null;
    }

    addItem(categoryName, itemData) {
      const category = this.findCategory(categoryName);
      if (!category) return false;

      const itemsProperty = this.getItemsProperty();
      if (!category[itemsProperty]) {
        category[itemsProperty] = [];
      }

      const defaultValues = this.config?.defaultValues || {};
      const newItem = { ...defaultValues, ...itemData };
      category[itemsProperty].push(newItem);

      EventBus.emit(Events.CONTENT_ADD, {
        type: this.type,
        category: categoryName,
        item: newItem
      });

      return newItem;
    }

    deleteItem(categoryName, itemName) {
      const category = this.findCategory(categoryName);
      if (!category) return false;

      const itemsProperty = this.getItemsProperty();
      const items = category[itemsProperty];
      if (!items) return false;

      const index = items.findIndex(item => item.nom === itemName);
      if (index === -1) return false;

      const deletedItem = items.splice(index, 1)[0];

      EventBus.emit(Events.CONTENT_DELETE, {
        type: this.type,
        category: categoryName,
        item: deletedItem
      });

      return true;
    }

    updateItem(categoryName, itemName, property, value) {
      const result = this.findItem(itemName, categoryName);
      if (!result) return false;

      const { item } = result;
      
      if (property === 'capacites' && Array.isArray(value)) {
        item[property] = value;
      } else if (property === 'base' && typeof value === 'object') {
        item[property] = { ...item[property], ...value };
      } else {
        item[property] = value;
      }

      EventBus.emit(Events.CONTENT_UPDATE, {
        type: this.type,
        category: categoryName,
        item: item,
        property: property,
        value: value
      });

      return true;
    }

    moveItem(categoryName, itemName, direction) {
      const category = this.findCategory(categoryName);
      if (!category) return false;

      const itemsProperty = this.getItemsProperty();
      const items = category[itemsProperty];
      if (!items) return false;

      const currentIndex = items.findIndex(item => item.nom === itemName);
      if (currentIndex === -1) return false;

      const newIndex = currentIndex + direction;
      if (newIndex < 0 || newIndex >= items.length) return false;

      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];

      EventBus.emit(Events.CONTENT_MOVE, {
        type: this.type,
        category: categoryName,
        itemName: itemName,
        direction: direction
      });

      return true;
    }

    getItemsProperty() {
      switch (this.type) {
        case 'spell': return 'sorts';
        case 'don': return 'dons';
        case 'class': return 'sousClasses';
        default: return 'items';
      }
    }

    search(query) {
      const results = [];
      const normalizedQuery = query.toLowerCase().trim();

      this.data.forEach(category => {
        const itemsProperty = this.getItemsProperty();
        if (!category[itemsProperty]) return;

        category[itemsProperty].forEach(item => {
          const searchableText = Object.values(item).join(' ').toLowerCase();
          if (searchableText.includes(normalizedQuery)) {
            results.push({
              item,
              category: category.nom,
              type: this.type
            });
          }
        });
      });

      return results;
    }
  }

  window.BaseEntity = BaseEntity;

})();