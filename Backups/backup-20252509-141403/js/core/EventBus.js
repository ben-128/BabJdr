// ============================================================================
// JDR-BAB APPLICATION - EVENT BUS
// ============================================================================

(() => {
  "use strict";

  class EventBus {
    constructor() {
      this.listeners = new Map();
    }

    static getInstance() {
      if (!EventBus.instance) {
        EventBus.instance = new EventBus();
      }
      return EventBus.instance;
    }

    on(eventType, callback) {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }
      this.listeners.get(eventType).push(callback);
      return () => this.off(eventType, callback);
    }

    off(eventType, callback) {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }

    emit(eventType, payload = {}) {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(payload);
          } catch (error) {
            console.error(`Error in event callback for ${eventType}:`, error);
          }
        });
      }
    }

    once(eventType, callback) {
      const unsubscribe = this.on(eventType, (payload) => {
        callback(payload);
        unsubscribe();
      });
      return unsubscribe;
    }
  }

  window.EventBus = EventBus.getInstance();

  window.Events = {
    CONTENT_ADD: 'content:add',
    CONTENT_DELETE: 'content:delete',
    CONTENT_UPDATE: 'content:update',
    CONTENT_MOVE: 'content:move',
    PAGE_RENDER: 'page:render',
    EDITOR_TOGGLE: 'editor:toggle',
    IMAGE_UPLOAD: 'image:upload',
    IMAGE_DELETE: 'image:delete',
    STORAGE_SAVE: 'storage:save',
    SEARCH_PERFORM: 'search:perform',
    MODAL_OPEN: 'modal:open',
    MODAL_CLOSE: 'modal:close',
    NOTIFICATION_SHOW: 'notification:show'
  };

})();