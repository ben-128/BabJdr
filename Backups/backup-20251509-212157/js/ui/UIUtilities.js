// ============================================================================
// JDR-BAB APPLICATION - UI UTILITIES MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // UI UTILITIES - HELPER FUNCTIONS
  // ========================================
  window.UIUtilities = {
    /**
     * Remove HTML tags from text content
     */
    stripHtml(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html || '';
      return tmp.textContent || tmp.innerText || '';
    },

    /**
     * Get optimized color for element type
     */
    getElementColor(element) {
      // Couleurs optimisées pour la lisibilité sur fond clair et foncé
      const colorMap = {
        'Feu': '#e25822',        // Rouge-orange vif
        'Eau': '#2563eb',        // Bleu vif
        'Terre': '#92400e',      // Marron foncé
        'Air': '#059669',        // Vert émeraude
        'Lumière': '#d97706',    // Orange doré (au lieu du jaune pâle)
        'Nuit': '#6b21a8',       // Violet foncé (au lieu du noir)
        'Divin': '#7c2d12',      // Marron doré (au lieu du blanc)
        'Maléfique': '#7c3aed'   // Violet intense
      };
      
      return colorMap[element] || '#666666';
    },

    /**
     * Get icon for element type
     */
    getElementIcon(element) {
      const icons = window.ElementIcons || {};
      return icons[element] || '⚡';
    },

    /**
     * Copy text to clipboard with notification
     */
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

    /**
     * Show notification message
     */
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

    /**
     * Get current page ID from DOM
     */
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
      
      // Fallback: check if main content area exists and extract from URL or DOM
      if (!visibleArticle) {
        const hash = window.location.hash.substring(1);
        if (hash.startsWith('/')) {
          return hash.substring(1) || 'creation';
        }
        return 'creation';
      }
      
      return visibleArticle.id || 'creation';
    },

    /**
     * Force page refresh via router
     */
    forcePageRefresh() {
      // Trigger router to completely rebuild the page
      if (JdrApp.modules?.router?.handleRoute) {
        JdrApp.modules.router.handleRoute();
      } else {
        // Fallback: reload the page
        window.location.reload();
      }
    },

    /**
     * Trigger data save to localStorage/persistent storage
     */
    triggerDataSave() {
      EventBus.emit(Events.STORAGE_SAVE);
    },

    /**
     * Extract content type from CSS class name
     */
    extractTypeFromClass(className) {
      const matches = className.match(/(spell|don|objet|monster|tableTresor|class)-/);
      return matches ? matches[1] : null;
    },

    /**
     * Refresh specific page types
     */
    refreshObjectsPage() {
      if (window.location.hash === '#/objets') {
        this.forcePageRefresh();
      }
    },

    refreshMonstersPage() {
      if (window.location.hash === '#/monstres') {
        this.forcePageRefresh();
      }
    },

    refreshTablesPage() {
      if (window.location.hash === '#/tables-tresors') {
        this.forcePageRefresh();
      }
    },

    /**
     * Generate unique readable ID for new elements
     */
    generateUniqueId(prefix = 'element') {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `${prefix}-${timestamp}-${random}`;
    },

    /**
     * Slugify text for URL-safe IDs
     */
    slugify(text) {
      return text.toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ýÿ]/g, 'y')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  };

})();