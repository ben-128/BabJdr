// ============================================================================
// JDR-BAB APPLICATION - FAVORIS MANAGER
// ============================================================================

(() => {
  "use strict";

  /**
   * Gestionnaire des favoris pour sorts et objets
   * Permet d'ajouter/supprimer des éléments en favoris avec persistance locale
   */
  class FavorisManager {
    constructor() {
      this.favoris = this.loadFavoris();
      this.initializeEventListeners();
    }

    /**
     * Charge les favoris depuis le stockage local
     */
    loadFavoris() {
      try {
        const saved = localStorage.getItem(window.STORAGE_KEYS.FAVORIS);
        return saved ? JSON.parse(saved) : {
          sorts: [],
          objets: []
        };
      } catch (error) {
        console.warn('Erreur lors du chargement des favoris:', error);
        return {
          sorts: [],
          objets: []
        };
      }
    }

    /**
     * Sauvegarde les favoris dans le stockage local
     */
    saveFavoris() {
      try {
        localStorage.setItem(window.STORAGE_KEYS.FAVORIS, JSON.stringify(this.favoris));
        EventBus.emit(window.Events.FAVORIS_UPDATE, { favoris: this.favoris });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des favoris:', error);
      }
    }

    /**
     * Vérifie si un élément est en favoris
     * @param {string} type - 'sorts' ou 'objets'
     * @param {string} nom - Nom de l'élément
     * @returns {boolean}
     */
    isFavoris(type, nom) {
      return this.favoris[type] && this.favoris[type].includes(nom);
    }

    /**
     * Ajoute un élément aux favoris
     * @param {string} type - 'sorts' ou 'objets'
     * @param {string} nom - Nom de l'élément
     */
    addFavoris(type, nom) {
      if (!this.favoris[type]) {
        this.favoris[type] = [];
      }
      
      if (!this.favoris[type].includes(nom)) {
        this.favoris[type].push(nom);
        this.saveFavoris();
        
        EventBus.emit(window.Events.FAVORIS_ADD, { 
          type, 
          nom, 
          count: this.favoris[type].length 
        });
        
        this.showFeedback(`✨ ${nom} ajouté aux favoris`, 'success');
        return true;
      }
      return false;
    }

    /**
     * Supprime un élément des favoris
     * @param {string} type - 'sorts' ou 'objets'
     * @param {string} nom - Nom de l'élément
     */
    removeFavoris(type, nom) {
      if (this.favoris[type]) {
        const index = this.favoris[type].indexOf(nom);
        if (index > -1) {
          this.favoris[type].splice(index, 1);
          this.saveFavoris();
          
          EventBus.emit(window.Events.FAVORIS_REMOVE, { 
            type, 
            nom,
            count: this.favoris[type].length 
          });
          
          this.showFeedback(`🗑️ ${nom} retiré des favoris`, 'info');
          return true;
        }
      }
      return false;
    }

    /**
     * Bascule l'état favori d'un élément
     * @param {string} type - 'sorts' ou 'objets'
     * @param {string} nom - Nom de l'élément
     */
    toggleFavoris(type, nom) {
      if (this.isFavoris(type, nom)) {
        return this.removeFavoris(type, nom);
      } else {
        return this.addFavoris(type, nom);
      }
    }

    /**
     * Récupère tous les favoris d'un type
     * @param {string} type - 'sorts' ou 'objets'
     * @returns {Array}
     */
    getFavoris(type) {
      return this.favoris[type] || [];
    }

    /**
     * Récupère tous les favoris
     * @returns {Object}
     */
    getAllFavoris() {
      return { ...this.favoris };
    }

    /**
     * Compte le nombre de favoris d'un type
     * @param {string} type - 'sorts' ou 'objets'
     * @returns {number}
     */
    countFavoris(type) {
      return this.favoris[type] ? this.favoris[type].length : 0;
    }

    /**
     * Vide tous les favoris d'un type
     * @param {string} type - 'sorts' ou 'objets'
     */
    clearFavoris(type) {
      if (this.favoris[type]) {
        const count = this.favoris[type].length;
        this.favoris[type] = [];
        this.saveFavoris();
        this.showFeedback(`🗑️ ${count} favoris ${type} supprimés`, 'info');
      }
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initializeEventListeners() {
      // Écouter les clics sur les étoiles de favoris
      document.addEventListener('click', (event) => {
        const starBtn = event.target.closest('.favoris-star');
        if (starBtn) {
          event.preventDefault();
          event.stopPropagation();
          
          const type = starBtn.dataset.type;
          const nom = starBtn.dataset.nom;
          
          this.toggleFavoris(type, nom);
          this.updateStarDisplay(starBtn, type, nom);
        }
      });
    }

    /**
     * Met à jour l'affichage de l'étoile
     * @param {Element} starBtn - Bouton étoile
     * @param {string} type - Type de favori
     * @param {string} nom - Nom de l'élément
     */
    updateStarDisplay(starBtn, type, nom) {
      const isFav = this.isFavoris(type, nom);
      starBtn.innerHTML = isFav ? '⭐' : '☆';
      starBtn.classList.toggle('favoris-active', isFav);
      starBtn.title = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
    }

    /**
     * Affiche un feedback utilisateur
     * @param {string} message - Message à afficher
     * @param {string} type - Type de feedback (success, info, warning, error)
     */
    showFeedback(message, type = 'info') {
      // Utilise le système de notification existant si disponible
      if (window.JdrApp && window.JdrApp.ui && window.JdrApp.ui.showNotification) {
        window.JdrApp.ui.showNotification(message, type);
      } else {
        // Fallback simple
        
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `favoris-notification favoris-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--surface-color, #f0f0f0);
          color: var(--text-color, #333);
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 4px solid var(--accent-color, #d4af37);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          z-index: 10000;
          font-size: 14px;
          max-width: 300px;
          animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = 'slideOutRight 0.3s ease-in';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }, 3000);
      }
    }

    /**
     * Crée un bouton étoile pour les favoris
     * @param {string} type - 'sorts' ou 'objets'
     * @param {string} nom - Nom de l'élément
     * @returns {string} HTML du bouton étoile
     */
    createStarButton(type, nom, data = null) {
      const isFav = this.isFavoris(type, nom);
      
      return `
        <button class="favoris-star ${isFav ? 'favoris-active' : ''}" 
                data-type="${type}" 
                data-nom="${nom}" 
                title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
                aria-label="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
          ${isFav ? '⭐' : '☆'}
        </button>
      `;
    }
  }

  // ========================================
  // INITIALISATION GLOBALE
  // ========================================
  
  // Créer l'instance globale
  window.FavorisManager = new FavorisManager();
  
  // Exposer dans le namespace JdrApp si disponible
  if (window.JdrApp) {
    window.JdrApp.favoris = window.FavorisManager;
  }

})();