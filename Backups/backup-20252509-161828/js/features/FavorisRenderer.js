// ============================================================================
// JDR-BAB APPLICATION - FAVORIS RENDERER
// ============================================================================

(() => {
  "use strict";

  /**
   * Gestionnaire de rendu pour la page des favoris
   * Met à jour l'affichage des favoris en temps réel
   */
  class FavorisRenderer {
    constructor() {
      this.isInitialized = false;
      this.initializeEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initializeEventListeners() {
      // Écouter les changements de favoris
      EventBus.on(window.Events.FAVORIS_UPDATE, (data) => {
        this.updateFavorisDisplay();
      });

      EventBus.on(window.Events.FAVORIS_ADD, (data) => {
        this.updateFavorisDisplay();
      });

      EventBus.on(window.Events.FAVORIS_REMOVE, (data) => {
        this.updateFavorisDisplay();
      });

      // Écouter les changements de page pour mettre à jour au besoin
      EventBus.on('router:page-changed', (data) => {
        if (data.page === 'favoris') {
          setTimeout(() => this.updateFavorisDisplay(), 100);
        }
      });
    }

    /**
     * Met à jour l'affichage complet des favoris
     */
    updateFavorisDisplay() {
      if (!window.FavorisManager) {
        console.warn('FavorisManager not available');
        return;
      }

      // Vérifier si nous sommes sur la page des favoris
      const favorisPage = document.querySelector('[data-page="favoris"]');
      if (!favorisPage) {
        return;
      }
      
      // Vérifier si la page est visible
      const isVisible = favorisPage.style.display !== 'none' && favorisPage.classList.contains('active');
      if (!isVisible) {
        // Essayer quand même de mettre à jour, peut-être que les styles CSS gèrent la visibilité
      }

      // Mettre à jour dans l'ordre : objets d'abord, puis sorts (même ordre que PageBuilder)
      this.updateObjetsDisplay();
      this.updateSortsDisplay();
    }

    /**
     * Met à jour l'affichage des sorts favoris
     */
    updateSortsDisplay() {
      const container = document.getElementById('favoris-sorts-container');
      const emptyState = document.getElementById('favoris-sorts-empty');
      const section = document.getElementById('favoris-sorts-section');
      
      if (!container || !emptyState) return;

      const favorisNames = window.FavorisManager.getFavoris('sorts');
      
      if (favorisNames.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      container.style.display = 'block';
      emptyState.style.display = 'none';

      // Récupérer les données des sorts favoris
      const favorisData = this.getSortsData(favorisNames);
      
      // Générer les cartes avec les images
      const cardsHtml = favorisData.map(sortData => {
        return CardBuilder.create('spell', sortData.sort, sortData.category).build();
      }).join('');

      container.innerHTML = cardsHtml;
      
      // Force responsive grid layout after content insertion
      this.ensureResponsiveGrid(container);

      // Déclencher le chargement des images après insertion du contenu
      if (JdrApp.modules.renderer?.autoLoadImages) {
        setTimeout(() => JdrApp.modules.renderer.autoLoadImages(), 50);
      }

      // S'assurer que la section n'est pas pliée si elle a du contenu
      if (section && favorisNames.length > 0) {
        section.classList.remove('collapsed');
      }
    }

    /**
     * Met à jour l'affichage des objets favoris
     */
    updateObjetsDisplay() {
      const container = document.getElementById('favoris-objets-container');
      const emptyState = document.getElementById('favoris-objets-empty');
      const section = document.getElementById('favoris-objets-section');
      
      if (!container || !emptyState) return;

      const favorisNames = window.FavorisManager.getFavoris('objets');
      
      if (favorisNames.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      container.style.display = 'block';
      emptyState.style.display = 'none';

      // Récupérer les données des objets favoris
      const favorisData = this.getObjetsData(favorisNames);
      
      // Générer les cartes avec les images
      const cardsHtml = favorisData.map(objetData => {
        return CardBuilder.create('objet', objetData, null).build();
      }).join('');

      container.innerHTML = cardsHtml;
      
      // Force responsive grid layout after content insertion
      this.ensureResponsiveGrid(container);

      // Déclencher le chargement des images après insertion du contenu
      if (JdrApp.modules.renderer?.autoLoadImages) {
        setTimeout(() => JdrApp.modules.renderer.autoLoadImages(), 50);
      }

      // S'assurer que la section n'est pas pliée si elle a du contenu
      if (section && favorisNames.length > 0) {
        section.classList.remove('collapsed');
      }
    }

    /**
     * Récupère les données des sorts favoris
     * @param {Array} favorisNames - Noms des sorts favoris
     * @returns {Array} Données des sorts avec leurs catégories
     */
    getSortsData(favorisNames) {
      const sortsData = [];
      
      if (!window.SORTS) return sortsData;

      // Parcourir toutes les catégories de sorts
      window.SORTS.forEach(category => {
        if (category.sorts) {
          category.sorts.forEach(sort => {
            if (favorisNames.includes(sort.nom)) {
              sortsData.push({
                sort: sort,
                category: category.nom
              });
            }
          });
        }
      });

      return sortsData;
    }

    /**
     * Récupère les données des objets favoris
     * @param {Array} favorisNames - Noms des objets favoris
     * @returns {Array} Données des objets
     */
    getObjetsData(favorisNames) {
      const objetsData = [];
      
      if (!window.OBJETS || !window.OBJETS.objets) return objetsData;

      // Parcourir tous les objets
      window.OBJETS.objets.forEach(objet => {
        if (favorisNames.includes(objet.nom)) {
          objetsData.push(objet);
        }
      });

      return objetsData;
    }

    /**
     * Force la mise à jour de l'affichage
     */
    forceUpdate() {
      this.updateFavorisDisplay();
    }

    /**
     * Initialise le renderer quand la DOM est prête
     */
    initialize() {
      if (this.isInitialized) return;
      
      // Attendre que tout soit chargé
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => this.updateFavorisDisplay(), 500);
        });
      } else {
        setTimeout(() => this.updateFavorisDisplay(), 100);
      }

      this.isInitialized = true;
    }

    /**
     * Assure que le container utilise un responsive grid layout
     */
    ensureResponsiveGrid(container) {
      if (!container) return;
      
      // Ajouter classes CSS pour le responsive grid
      container.classList.add('favoris-grid', 'collection-items');
      
      // Forcer le layout avec CSS inline si nécessaire
      container.style.display = 'grid';
      container.style.gap = '1.5rem';
      container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
      container.style.justifyContent = 'center';
      
      // Assurer que les cartes prennent toute la largeur
      const cards = container.querySelectorAll('.card');
      cards.forEach(card => {
        card.style.width = '100%';
        card.style.margin = '0';
        card.style.boxSizing = 'border-box';
      });
    }
  }

  // ========================================
  // INITIALISATION GLOBALE
  // ========================================
  
  // Créer l'instance globale
  window.FavorisRenderer = new FavorisRenderer();
  
  // Exposer dans le namespace JdrApp si disponible
  if (window.JdrApp) {
    window.JdrApp.favorisRenderer = window.FavorisRenderer;
  }

  // Initialiser automatiquement
  window.FavorisRenderer.initialize();

})();