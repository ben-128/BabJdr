// ============================================================================
// JDR-BAB APPLICATION - UI MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // UI INTERACTIONS MODULE
  // ========================================
  JdrApp.modules.ui = {
    _initialized: false,
    
    init() {
      // Prevent multiple initialization to avoid duplicate event listeners
      if (this._initialized) {
        return;
      }
      
      // Use UICore for main initialization
      if (window.UICore) {
        UICore.init();
      } else {
        console.error('UICore not available - ensure ui/ modules are loaded');
        return;
      }
      
      this._initialized = true;
    },

    setupEventListeners() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupEventListeners();
      }
    },

    setupSearch() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupSearch();
      }
    },

    setupModals() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupModals();
      }
    },

    setupResponsive() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupResponsive();
      }
    },

    setupNewPageHandler() {
      // Delegate to UICore
      if (window.UICore) {
        return UICore.setupNewPageHandler();
      }
    },

    // Event handlers - delegate to modular components
    handleContentAdd(type, category, item) {
      if (window.ContentManager) {
        return ContentManager.handleContentAdd(type, category, item);
      }
    },

    handleContentDelete(type, category, item) {
      if (window.ContentManager) {
        return ContentManager.handleContentDelete(type, category, item);
      }
    },

    handleContentMove(type, category, itemName, direction) {
      if (window.ContentManager) {
        return ContentManager.handleContentMove(type, category, itemName, direction);
      }
    },

    // Search methods - delegate to SearchManager
    performSearch(query) {
      if (window.SearchManager) {
        return SearchManager.performSearch(query);
      }
    },

    clearMainSearchResults() {
      if (window.SearchManager) {
        return SearchManager.clearMainSearchResults();
      }
    },

    // Modal methods - delegate to ModalManager
    openModal(type, data = null) {
      if (window.ModalManager) {
        return ModalManager.openModal(type, data);
      }
    },

    closeModal() {
      if (window.ModalManager) {
        return ModalManager.closeModal();
      }
    },

    // Page management - delegate to PageManager
    showPage(pageId) {
      if (window.PageManager) {
        return PageManager.showPage(pageId);
      }
    },

    // Responsive methods - delegate to ResponsiveManager
    updateResponsiveLayout() {
      if (window.ResponsiveManager) {
        return ResponsiveManager.updateResponsiveLayout();
      }
    },

    // Tags methods - delegate to TagsManager
    updateTagsDisplay() {
      if (window.TagsManager) {
        return TagsManager.updateTagsDisplay();
      }
    },

    toggleTag(tagName, isActive) {
      if (window.TagsManager) {
        return TagsManager.toggleTag(tagName, isActive);
      }
    },

    // Event handling delegation
    setupDragAndDrop() {
      if (window.EventHandlers) {
        return EventHandlers.setupDragAndDrop();
      }
    },

    setupKeyboardShortcuts() {
      if (window.EventHandlers) {
        return EventHandlers.setupKeyboardShortcuts();
      }
    },

    // ID Search functionality (for objects page)
    performIdSearch(searchValue) {
      const searchId = searchValue.trim();
      const resultDiv = document.querySelector('#id-search-result');
      
      if (!searchId) {
        this.clearIdSearch();
        return;
      }

      const searchNumber = parseInt(searchId, 10);
      if (isNaN(searchNumber)) {
        if (resultDiv) {
          resultDiv.innerHTML = '❌ Veuillez saisir un numéro valide';
          resultDiv.style.color = '#dc2626';
        }
        return;
      }

      // Find object by number
      const allObjects = window.OBJETS?.objets || [];
      const foundObject = allObjects.find(obj => obj.numero === searchNumber);

      if (!foundObject) {
        if (resultDiv) {
          resultDiv.innerHTML = `❌ Aucun objet trouvé avec l'ID ${searchNumber}`;
          resultDiv.style.color = '#dc2626';
        }
        // Hide all objects
        this.hideAllObjects();
        return;
      }

      // Set global flag for ID search BEFORE any regeneration
      window.activeIdSearch = true;
      window.activeSearchId = searchNumber;

      // Show success message
      if (resultDiv) {
        resultDiv.innerHTML = `✅ Objet trouvé : "${foundObject.nom}" (ID: ${searchNumber})`;
        resultDiv.style.color = '#16a34a';
      }

      // Show the object immediately without regenerating the page
      this.showOnlyObjectById(searchNumber);
    },

    clearIdSearch() {
      const input = document.querySelector('#id-search-input');
      const resultDiv = document.querySelector('#id-search-result');
      
      if (input) {
        input.value = '';
      }
      
      if (resultDiv) {
        resultDiv.innerHTML = '';
      }
      
      // Clear the global flags
      window.activeIdSearch = false;
      window.activeSearchId = null;

      // Clear search result markers and show all objects
      this.showAllObjects();
    },

    hideAllObjects() {
      document.querySelectorAll('#objets-container .card, #gestion-objets-container .card').forEach(card => {
        if (!card.hasAttribute('data-search-result')) {
          card.style.display = 'none';
        }
      });
    },

    showAllObjects() {
      document.querySelectorAll('#objets-container .card, #gestion-objets-container .card').forEach(card => {
        card.style.display = '';
        card.removeAttribute('data-search-result');
      });
    },

    showOnlyObjectById(searchNumber) {
      this.hideAllObjects();

      // Show only the target object
      const selectors = [
        `[data-object-numero="${searchNumber}"]`,
        `[data-numero="${searchNumber}"]`,
        `.objet-card[data-numero="${searchNumber}"]`,
        `.card[data-numero="${searchNumber}"]`,
        `.card[data-object-numero="${searchNumber}"]`
      ];

      let targetCard = null;
      for (const selector of selectors) {
        targetCard = document.querySelector(selector);
        if (targetCard) break;
      }

      if (targetCard) {
        // Force display and ensure it stays visible
        targetCard.style.display = 'block';
        targetCard.style.visibility = 'visible';
        targetCard.style.opacity = '1';

        // Ensure parent containers are also visible
        let parent = targetCard.parentElement;
        while (parent && parent !== document.body) {
          if (parent.style.display === 'none') {
            parent.style.display = '';
          }
          parent = parent.parentElement;
        }

        // Add a marker to prevent it from being hidden again
        targetCard.setAttribute('data-search-result', 'true');

        // Scroll into view
        requestAnimationFrame(() => {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Double-check visibility after scroll
          setTimeout(() => {
            if (targetCard.style.display === 'none') {
              targetCard.style.display = 'block';
            }
          }, 500);
        });
      }
    },

    // Campaign management functions
    selectCampaign(campaignName) {
      if (!campaignName) return;

      console.log('📄 selectCampaign called with:', campaignName);

      // Initialize state if needed
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }

      console.log('📄 Current selectedCampaign:', window.JdrApp.state.selectedCampaign);

      // Check if we're already on this campaign
      if (window.JdrApp.state.selectedCampaign === campaignName) {
        console.log('📄 Already on this campaign, skipping regeneration and state reset');
        return; // No need to regenerate or reset subpage
      }

      window.JdrApp.state.selectedCampaign = campaignName;

      // Clear sub-page selection when changing campaign and set to first available
      const campaignData = window.CAMPAGNE?.subPages?.[campaignName];
      if (campaignData?.subPages) {
        const subPageList = Object.keys(campaignData.subPages);
        console.log('📄 Resetting selectedSubPage to first:', subPageList[0]);
        window.JdrApp.state.selectedSubPage = subPageList.length > 0 ? subPageList[0] : null;
      } else {
        window.JdrApp.state.selectedSubPage = null;
      }

      // Regenerate the page to reflect the new selection
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
    },

    selectSubPage(subPageName) {
      if (!subPageName) return;

      // Initialize state if needed
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }

      // If a regeneration is already pending, clear it
      const hadPendingRegeneration = !!this._subPageRegenerationTimeout;
      if (hadPendingRegeneration) {
        clearTimeout(this._subPageRegenerationTimeout);
        this._subPageRegenerationTimeout = null;
      }

      // Only skip if we're already on this subpage AND no regeneration was pending
      if (window.JdrApp.state.selectedSubPage === subPageName && !hadPendingRegeneration) {
        return;
      }

      window.JdrApp.state.selectedSubPage = subPageName;

      // Schedule regeneration with debouncing
      this._subPageRegenerationTimeout = setTimeout(() => {
        this._subPageRegenerationTimeout = null;

        if (JdrApp.modules.renderer?.regenerateCurrentPage) {
          JdrApp.modules.renderer.regenerateCurrentPage();
        } else {
          console.error('❌ regenerateCurrentPage not available!');
          // Fallback: force page reload
          if (JdrApp.modules.router?.handleRoute) {
            JdrApp.modules.router.handleRoute();
          }
        }
      }, 50);
    },

    // Campaign management functions
    addCampaignSubPage(campaignName) {
      if (!campaignName) return;
      
      const subPageName = prompt('Nom de la nouvelle sous-page :');
      if (!subPageName || !subPageName.trim()) {
        return;
      }
      
      const trimmedName = subPageName.trim();
      
      // Initialize state if needed
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }
      
      // Get campaign data
      const campaignData = window.CAMPAGNE || window.STATIC_PAGES?.campagne;
      if (!campaignData?.subPages?.[campaignName]) {
        alert('Erreur : Campagne non trouvée');
        return;
      }
      
      // Check if sub-page already exists
      if (campaignData.subPages[campaignName].subPages?.[trimmedName]) {
        alert(`La sous-page "${trimmedName}" existe déjà`);
        return;
      }
      
      // Initialize subPages if it doesn't exist
      if (!campaignData.subPages[campaignName].subPages) {
        campaignData.subPages[campaignName].subPages = {};
      }
      
      // Add new sub-page
      campaignData.subPages[campaignName].subPages[trimmedName] = {
        title: trimmedName,
        content: '<p>Contenu de la nouvelle sous-page...</p>'
      };
      
      // Update state to select the new sub-page
      window.JdrApp.state.selectedCampaign = campaignName;
      window.JdrApp.state.selectedSubPage = trimmedName;
      
      // Save and regenerate
      this.saveCampaignData();
      this.regenerateCampaignPage();
      
      alert(`Sous-page "${trimmedName}" créée avec succès !`);
    },

    deleteCampaignSubPage(campaignName, subPageName) {
      if (!campaignName || !subPageName) return;
      
      if (!confirm(`Supprimer la sous-page "${subPageName}" ?`)) {
        return;
      }
      
      // Get campaign data
      const campaignData = window.CAMPAGNE || window.STATIC_PAGES?.campagne;
      if (!campaignData?.subPages?.[campaignName]?.subPages?.[subPageName]) {
        alert('Erreur : Sous-page non trouvée');
        return;
      }
      
      // Delete the sub-page
      delete campaignData.subPages[campaignName].subPages[subPageName];
      
      // Update state to select first available sub-page or null
      const remainingSubPages = Object.keys(campaignData.subPages[campaignName].subPages || {});
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }
      
      window.JdrApp.state.selectedCampaign = campaignName;
      window.JdrApp.state.selectedSubPage = remainingSubPages.length > 0 ? remainingSubPages[0] : null;
      
      // Save and regenerate
      this.saveCampaignData();
      this.regenerateCampaignPage();
      
      alert(`Sous-page "${subPageName}" supprimée`);
    },

    saveCampaignData() {
      // Trigger storage save if available
      if (window.EventBus && window.Events) {
        window.EventBus.emit(window.Events.STORAGE_SAVE);
      }
    },

    regenerateCampaignPage() {
      // Use the renderer's regenerateCurrentPage function
      setTimeout(() => {
        if (JdrApp.modules.renderer?.regenerateCurrentPage) {
          JdrApp.modules.renderer.regenerateCurrentPage();
        }
      }, 100);
    },

    // Content management methods - delegate to ContentManager
    addContent(type, categoryName) {
      if (window.ContentManager) {
        return ContentManager.addContent(type, categoryName);
      }
    },

    // Modal methods - delegate to ModalManager
    showElementsModal() {
      if (window.ModalManager) {
        return ModalManager.showElementsModal();
      }
    },

    showStatsIconsModal() {
      if (window.ModalManager) {
        return ModalManager.showStatsIconsModal();
      }
    },

    showEtatsModal() {
      if (window.ModalManager) {
        return ModalManager.showEtatsModal();
      }
    },

    showSpellLinksModal() {
      if (window.ModalManager) {
        return ModalManager.showSpellLinksModal();
      }
    },

    showPageLinksModal() {
      if (window.ModalManager) {
        return ModalManager.showPageLinksModal();
      }
    },

    showMonsterLinksModal() {
      if (window.ModalManager) {
        return ModalManager.showMonsterLinksModal();
      }
    },

    showNotification(message, type = 'info') {
      // Simple notification for now
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      JdrApp.modules.ui.init();
    });
  } else {
    // DOM is already loaded
    JdrApp.modules.ui.init();
  }

})();

// ============================================================================
// CAMPAIGN SCHEMAS EDITOR
// ============================================================================

const CampaignSchemas = {
  canvas: null,
  ctx: null,
  isDrawing: false,
  currentTool: 'pen',
  currentColor: '#000000',
  lineWidth: 2,
  startX: 0,
  startY: 0,
  history: [],
  currentState: null,
  editingSchemaId: null,  // ID du schéma en cours d'édition (null si nouveau schéma)

  init() {
    this.canvas = document.getElementById('schemaCanvas');
    if (!this.canvas) {
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Event listeners
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseout', this.handleMouseUp.bind(this));

    // Color picker
    const colorPicker = document.getElementById('schemaColorPicker');
    if (colorPicker) {
      colorPicker.addEventListener('change', (e) => {
        this.currentColor = e.target.value;
      });
    }

    // Line width
    const lineWidth = document.getElementById('schemaLineWidth');
    if (lineWidth) {
      lineWidth.addEventListener('input', (e) => {
        this.lineWidth = e.target.value;
        document.getElementById('lineWidthDisplay').textContent = e.target.value + 'px';
      });
    }

    // Save initial state
    this.saveState();
  },

  // Obtenir la liste des schémas existants
  getSchemaList() {
    const schemas = window.STATIC_PAGES?.campagne?.schemas || {};
    return Object.keys(schemas).map(id => ({
      id: id,
      dataURL: schemas[id]
    }));
  },

  // Charger un schéma existant dans le canvas
  loadSchema(schemaId) {
    const schemas = window.STATIC_PAGES?.campagne?.schemas || {};
    const dataURL = schemas[schemaId];

    if (!dataURL) {
      console.error('Schéma non trouvé:', schemaId);
      return false;
    }

    // Charger l'image dans le canvas
    const img = new Image();
    img.onload = () => {
      // Effacer le canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Remplir avec du blanc
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      // Dessiner l'image
      this.ctx.drawImage(img, 0, 0);
      // Sauvegarder l'état
      this.history = [];
      this.saveState();
    };
    img.onerror = () => {
      console.error('Erreur lors du chargement de l\'image du schéma');
      alert('Erreur lors du chargement du schéma');
    };
    img.src = dataURL;

    return true;
  },

  openSchemaEditor(schemaId = null) {
    let modal = document.getElementById('schemaEditorModal');

    // Create modal if it doesn't exist
    if (!modal) {
      modal = this.createSchemaEditorModal();
    }

    if (modal) {
      modal.style.display = 'block';

      if (!this.canvas) {
        this.init();
      }

      // Si un schemaId est fourni, charger le schéma existant
      if (schemaId) {
        this.editingSchemaId = schemaId;
        this.loadSchema(schemaId);
        // Mettre à jour le titre
        const title = modal.querySelector('.modal-header h3');
        if (title) {
          title.textContent = '🎨 Édition de schéma';
        }
        // Mettre à jour le texte du bouton
        const saveBtn = modal.querySelector('.btn.primary');
        if (saveBtn) {
          saveBtn.textContent = '💾 Sauvegarder les modifications';
        }
      } else {
        // Nouveau schéma : canvas vierge
        this.editingSchemaId = null;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.history = [];
        this.saveState();
        // Restaurer le titre par défaut
        const title = modal.querySelector('.modal-header h3');
        if (title) {
          title.textContent = '🎨 Éditeur de schéma';
        }
        // Restaurer le texte du bouton par défaut
        const saveBtn = modal.querySelector('.btn.primary');
        if (saveBtn) {
          saveBtn.textContent = '💾 Insérer le schéma';
        }
      }

      this.setTool('pen');
      this.updateSchemaSelector();
    } else {
      console.error('Failed to create schema editor modal!');
    }
  },

  createSchemaEditorModal() {
    const modalHTML = `
<div id="schemaEditorModal" class="modal" style="display: none;">
  <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 9999;">
    <div class="modal-content" style="position: relative; max-width: 900px; margin: 2rem auto; background: var(--paper); border-radius: 12px; padding: 1.5rem; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2px solid var(--rule); padding-bottom: 1rem;">
        <h3 style="margin: 0;">🎨 Éditeur de schéma</h3>
        <button class="modal-close" onclick="CampaignSchemas.closeSchemaEditor()" type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; width: 30px; height: 30px;">✕</button>
      </div>

      <div class="modal-body">
        <!-- Section de sélection de schéma existant -->
        <div id="schemaSelector" style="margin-bottom: 1rem; padding: 0.75rem; background: var(--card); border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-weight: bold;">📋 Schémas existants:</label>
            <button onclick="CampaignSchemas.openSchemaEditor(null)" class="btn" style="padding: 0.25rem 0.5rem; border: 1px solid var(--rule); background: var(--paper); cursor: pointer; border-radius: 4px; font-size: 0.9rem;">➕ Nouveau schéma</button>
          </div>
          <div id="schemaList" style="display: flex; gap: 0.5rem; flex-wrap: wrap; max-height: 150px; overflow-y: auto;">
            <!-- Les schémas seront ajoutés ici dynamiquement -->
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; padding: 0.75rem; background: var(--card); border-radius: 8px;">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <label style="font-weight: bold; margin-right: 0.5rem;">Outil:</label>
            <button onclick="CampaignSchemas.setTool('pen')" class="tool-btn" data-tool="pen" style="padding: 0.5rem; border: 2px solid var(--rule); background: var(--paper); cursor: pointer; border-radius: 4px;">✏️ Crayon</button>
            <button onclick="CampaignSchemas.setTool('line')" class="tool-btn" data-tool="line" style="padding: 0.5rem; border: 2px solid var(--rule); background: var(--paper); cursor: pointer; border-radius: 4px;">📏 Ligne</button>
            <button onclick="CampaignSchemas.setTool('rect')" class="tool-btn" data-tool="rect" style="padding: 0.5rem; border: 2px solid var(--rule); background: var(--paper); cursor: pointer; border-radius: 4px;">⬜ Rectangle</button>
            <button onclick="CampaignSchemas.setTool('circle')" class="tool-btn" data-tool="circle" style="padding: 0.5rem; border: 2px solid var(--rule); background: var(--paper); cursor: pointer; border-radius: 4px;">⭕ Cercle</button>
            <button onclick="CampaignSchemas.setTool('text')" class="tool-btn" data-tool="text" style="padding: 0.5rem; border: 2px solid var(--rule); background: var(--paper); cursor: pointer; border-radius: 4px;">📝 Texte</button>
            <button onclick="CampaignSchemas.setTool('eraser')" class="tool-btn" data-tool="eraser" style="padding: 0.5rem; border: 2px solid var(--rule); background: var(--paper); cursor: pointer; border-radius: 4px;">🧹 Gomme</button>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center; margin-left: auto;">
            <label style="font-weight: bold;">Couleur:</label>
            <input type="color" id="schemaColorPicker" value="#000000" style="width: 50px; height: 35px; border: 2px solid var(--rule); cursor: pointer; border-radius: 4px;">

            <label style="font-weight: bold; margin-left: 1rem;">Épaisseur:</label>
            <input type="range" id="schemaLineWidth" min="1" max="10" value="2" style="width: 100px;">
            <span id="lineWidthDisplay" style="min-width: 30px;">2px</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <button onclick="CampaignSchemas.clearCanvas()" class="btn" style="background: #ef4444; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">🗑️ Effacer tout</button>
          <button onclick="CampaignSchemas.undo()" class="btn" style="background: var(--accent); color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">↶ Annuler</button>
        </div>

        <div style="border: 2px solid var(--rule); border-radius: 8px; overflow: hidden; background: white; margin-bottom: 1rem;">
          <canvas id="schemaCanvas" width="800" height="600" style="display: block; cursor: crosshair;"></canvas>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button onclick="CampaignSchemas.closeSchemaEditor()" class="btn" style="background: var(--rule); color: var(--text); padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Annuler</button>
          <button onclick="CampaignSchemas.saveSchema()" class="btn primary" style="background: var(--accent); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">💾 Insérer le schéma</button>
        </div>
      </div>
    </div>
  </div>
</div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    const modalElement = div.firstElementChild;
    document.body.appendChild(modalElement);

    // Empêcher la propagation des clics depuis le contenu de la modal
    const modalContent = modalElement.querySelector('.modal-content');
    if (modalContent) {
      modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Fermer la modal uniquement si on clique sur l'overlay (en dehors du contenu)
    const modalOverlay = modalElement.querySelector('.modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeSchemaEditor();
        }
      });
    }

    return modalElement;
  },

  closeSchemaEditor() {
    const modal = document.getElementById('schemaEditorModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Supprimer un schéma
  deleteSchema(schemaId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce schéma ? Cette action est irréversible.')) {
      return;
    }

    try {
      if (window.STATIC_PAGES?.campagne?.schemas?.[schemaId]) {
        delete window.STATIC_PAGES.campagne.schemas[schemaId];

        // Sauvegarder dans le storage
        if (window.EventBus && window.Events) {
          window.EventBus.emit(window.Events.STORAGE_SAVE);
        }

        // Mettre à jour l'affichage
        this.updateSchemaSelector();

        // Notification
        if (JdrApp?.modules?.ui?.showNotification) {
          JdrApp.modules.ui.showNotification('🗑️ Schéma supprimé', 'info');
        }
      }
    } catch (e) {
      console.error('Erreur lors de la suppression du schéma:', e);
      alert('Erreur lors de la suppression du schéma');
    }
  },

  // Mettre à jour l'affichage des schémas dans le sélecteur
  updateSchemaSelector() {
    const schemaList = document.getElementById('schemaList');
    if (!schemaList) return;

    const schemas = this.getSchemaList();

    if (schemas.length === 0) {
      schemaList.innerHTML = '<p style="color: var(--text-muted); font-style: italic; margin: 0;">Aucun schéma existant</p>';
      return;
    }

    schemaList.innerHTML = '';
    schemas.forEach(schema => {
      const schemaItem = document.createElement('div');
      schemaItem.style.cssText = 'position: relative; cursor: pointer; border: 2px solid var(--rule); border-radius: 4px; overflow: hidden; width: 120px; height: 90px;';

      // Mettre en évidence le schéma en cours d'édition
      if (this.editingSchemaId === schema.id) {
        schemaItem.style.borderColor = 'var(--accent)';
        schemaItem.style.boxShadow = '0 0 0 2px var(--accent)';
      }

      const img = document.createElement('img');
      img.src = schema.dataURL;
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
      img.title = 'Cliquer pour éditer ce schéma';

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; color: white; font-size: 2rem;';
      overlay.innerHTML = '✏️';

      // Bouton de suppression
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 1rem; z-index: 10;';
      deleteBtn.title = 'Supprimer ce schéma';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSchema(schema.id);
      });

      schemaItem.appendChild(img);
      schemaItem.appendChild(overlay);
      schemaItem.appendChild(deleteBtn);

      schemaItem.addEventListener('mouseenter', () => {
        overlay.style.display = 'flex';
      });
      schemaItem.addEventListener('mouseleave', () => {
        overlay.style.display = 'none';
      });

      schemaItem.addEventListener('click', () => {
        this.openSchemaEditor(schema.id);
      });

      schemaList.appendChild(schemaItem);
    });
  },

  setTool(tool) {
    this.currentTool = tool;
    // Update button styles
    document.querySelectorAll('.tool-btn').forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--accent)';
      } else {
        btn.style.background = 'var(--paper)';
        btn.style.color = 'var(--text)';
        btn.style.borderColor = 'var(--rule)';
      }
    });
  },

  handleMouseDown(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;

    if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
    } else if (this.currentTool === 'text') {
      this.addText();
    } else {
      // Save current canvas state for preview
      this.currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  handleMouseMove(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ctx.strokeStyle = this.currentTool === 'eraser' ? 'white' : this.currentColor;
    this.ctx.lineWidth = this.currentTool === 'eraser' ? this.lineWidth * 3 : this.lineWidth;

    if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    } else if (this.currentTool === 'line' || this.currentTool === 'rect' || this.currentTool === 'circle') {
      // Restore canvas state and draw preview
      if (this.currentState) {
        this.ctx.putImageData(this.currentState, 0, 0);
      }

      this.ctx.beginPath();
      if (this.currentTool === 'line') {
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      } else if (this.currentTool === 'rect') {
        this.ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
      } else if (this.currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      }
    }
  },

  handleMouseUp(e) {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveState();
    }
  },

  addText() {
    const text = prompt('Entrez le texte à ajouter:');
    if (text) {
      this.ctx.font = (this.lineWidth * 8) + 'px Arial';
      this.ctx.fillStyle = this.currentColor;
      this.ctx.fillText(text, this.startX, this.startY);
      this.saveState();
    }
    this.isDrawing = false;
  },

  clearCanvas() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le schéma ?')) {
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.saveState();
    }
  },

  saveState() {
    this.history.push(this.canvas.toDataURL());
    if (this.history.length > 20) {
      this.history.shift();
    }
  },

  undo() {
    if (this.history.length > 1) {
      this.history.pop();
      const img = new Image();
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);
      };
      img.src = this.history[this.history.length - 1];
    }
  },

  saveSchema() {
    const dataURL = this.canvas.toDataURL('image/png');

    // Utiliser l'ID existant si on édite un schéma, sinon générer un nouvel ID
    const schemaId = this.editingSchemaId || ('schema_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    const isEditing = this.editingSchemaId !== null;

    // Stocker l'image dans la structure de données campagne
    try {
      if (!window.STATIC_PAGES) {
        window.STATIC_PAGES = {};
      }
      if (!window.STATIC_PAGES.campagne) {
        window.STATIC_PAGES.campagne = {};
      }
      if (!window.STATIC_PAGES.campagne.schemas) {
        window.STATIC_PAGES.campagne.schemas = {};
      }

      window.STATIC_PAGES.campagne.schemas[schemaId] = dataURL;

      // Sauvegarder dans le storage
      if (window.EventBus && window.Events) {
        window.EventBus.emit(window.Events.STORAGE_SAVE);
      }
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du schéma:', e);
      alert('Erreur: le schéma est trop volumineux pour être sauvegardé.');
      return;
    }

    // Créer un marqueur court
    const schemaMarker = `[schema:${schemaId}]`;

    // Si on est en mode édition, ne pas insérer de marqueur, juste sauvegarder
    if (isEditing) {
      // Show notification
      if (JdrApp?.modules?.ui?.showNotification) {
        JdrApp.modules.ui.showNotification('🎨 Schéma mis à jour avec succès !', 'success');
      }

      // Réinitialiser l'ID d'édition
      this.editingSchemaId = null;
      this.closeSchemaEditor();
      return;
    }

    // Check if we're in the HTML editor modal (textarea mode)
    if (this.editorInsertFunction && typeof this.editorInsertFunction === 'function') {
      // Insert into the textarea using the editor's insert function
      this.editorInsertFunction('\n' + schemaMarker + '\n');

      // Show notification
      if (JdrApp?.modules?.ui?.showNotification) {
        JdrApp.modules.ui.showNotification('🎨 Schéma inséré dans l\'éditeur !', 'success');
      }
    } else {
      // Fallback: direct insertion into content (legacy mode) - utilise le HTML complet
      const editableElement = this.currentEditableElement || document.querySelector('.subpage-content.editable');

      if (editableElement) {
        const schemaHTML = `
<div class="campaign-schema" style="margin: 1.5rem 0; text-align: center; background: white; padding: 1rem; border-radius: 8px; border: 2px solid var(--rule);">
  <img src="${dataURL}" style="max-width: 100%; height: auto; border-radius: 4px;" alt="Schéma de campagne">
</div>`;

        // Insert at cursor position if in edit mode
        if (editableElement.contentEditable === 'true') {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            // Create a temporary div to parse the HTML
            const temp = document.createElement('div');
            temp.innerHTML = schemaHTML;
            const schemaNode = temp.firstElementChild;

            range.insertNode(schemaNode);

            // Move cursor after the inserted schema
            range.setStartAfter(schemaNode);
            range.setEndAfter(schemaNode);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // Fallback: append at the end
            editableElement.innerHTML += '<br>' + schemaHTML;
          }
        } else {
          // Not in edit mode: append at the end
          editableElement.innerHTML += '<br>' + schemaHTML;
        }

        // Show notification
        if (JdrApp?.modules?.ui?.showNotification) {
          JdrApp.modules.ui.showNotification('🎨 Schéma inséré avec succès !', 'success');
        }
      }
    }

    // Clear the stored references
    this.currentEditableElement = null;
    this.editorTextarea = null;
    this.editorInsertFunction = null;
    this.closeSchemaEditor();
  },

  // Fonction pour remplacer les marqueurs [schema:id] par les vraies images
  expandSchemaMarkers(html) {
    if (!html || typeof html !== 'string') return html;

    return html.replace(/\[schema:(schema_[^\]]+)\]/g, (match, schemaId) => {
      // Chercher d'abord dans la structure de données
      let dataURL = window.STATIC_PAGES?.campagne?.schemas?.[schemaId];

      // Fallback: chercher dans localStorage (pour migration)
      if (!dataURL) {
        dataURL = localStorage.getItem(schemaId);
        // Si trouvé dans localStorage, migrer vers la structure de données
        if (dataURL) {
          if (!window.STATIC_PAGES) window.STATIC_PAGES = {};
          if (!window.STATIC_PAGES.campagne) window.STATIC_PAGES.campagne = {};
          if (!window.STATIC_PAGES.campagne.schemas) window.STATIC_PAGES.campagne.schemas = {};
          window.STATIC_PAGES.campagne.schemas[schemaId] = dataURL;
          // Supprimer de localStorage pour éviter la duplication
          localStorage.removeItem(schemaId);
          // Sauvegarder
          if (window.EventBus && window.Events) {
            window.EventBus.emit(window.Events.STORAGE_SAVE);
          }
        }
      }

      if (dataURL) {
        return `
<div class="campaign-schema" style="margin: 1.5rem 0; text-align: center; background: white; padding: 1rem; border-radius: 8px; border: 2px solid var(--rule);">
  <img src="${dataURL}" style="max-width: 100%; height: auto; border-radius: 4px;" alt="Schéma de campagne">
</div>`;
      }
      return match; // Si l'image n'est pas trouvée, garder le marqueur
    });
  }
};

// Make it globally accessible immediately
window.CampaignSchemas = CampaignSchemas;

// Initialize when DOM is ready (for canvas setup)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    CampaignSchemas.init();
  });
} else {
  CampaignSchemas.init();
}