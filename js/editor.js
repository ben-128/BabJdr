// ============================================================================
// JDR-BAB APPLICATION - EDITOR MODULE (REFACTORED)
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // EDITOR MODULE - Now uses UnifiedEditor
  // ========================================
  JdrApp.modules.editor = {
    editedData: {},
    isDevMode: false,
    _devToggleHandlerAttached: false,

    init() {
      this.setupEventListeners();
      this.setupEditableHandlers();
      this.setupCreationHandlers();
      this.setupImageHandlers();
      this.updateDevModeState();
    },

    setupEventListeners() {
      // Direct event listener instead of using the utils.events system
      // Only attach once to prevent double-firing
      if (!this._devToggleHandlerAttached) {
        document.addEventListener('click', (e) => {
          if (e.target.id === 'devToggle' || e.target.closest('#devToggle')) {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDevMode();
          }
        }, { capture: true });
        this._devToggleHandlerAttached = true;
      }

      EventBus.on(Events.EDITOR_TOGGLE, (payload) => {
        this.isDevMode = payload.enabled;
        this.updateDevModeState();
      });

      EventBus.on(Events.CONTENT_UPDATE, () => {
        this.saveChangesToStorage();
      });

    },

    toggleDevMode() {
      if (window.STANDALONE_VERSION) return;

      this.isDevMode = !this.isDevMode;
      EventBus.emit(Events.EDITOR_TOGGLE, { enabled: this.isDevMode });
    },

    updateDevModeState() {
      if (window.STANDALONE_VERSION) {
        document.body.className = 'dev-off';
        this.forceHideAllEditButtons();
        return;
      }
      
      document.body.classList.toggle('dev-on', this.isDevMode);
      document.body.classList.toggle('dev-off', !this.isDevMode);
      
      const devToggle = document.querySelector('#devToggle');
      const devToolbox = document.querySelector('#devToolbox');
      
      if (devToggle) {
        devToggle.textContent = `🛠 Dev Mode: ${this.isDevMode ? 'ON' : 'OFF'}`;
      }
      
      if (devToolbox) {
        devToolbox.style.display = this.isDevMode ? 'block' : 'none';
        
        // Initialize toolbox content if empty or only has comments
        if (this.isDevMode) {
          const trimmedContent = devToolbox.innerHTML.trim();
          if (trimmedContent === '' || trimmedContent === '<!-- Dev toolbox content will be injected here -->' || !devToolbox.querySelector('.dev-toolbox-content')) {
            this.initializeDevToolbox(devToolbox);
          }
        }
      }
      
      // Update dev-only containers visibility - same approach as modal buttons
      const devOnlyElements = document.querySelectorAll('[data-dev-only]');
      devOnlyElements.forEach(element => {
        element.style.display = this.isDevMode ? 'block' : 'none';
      });
      
      if (this.isDevMode) {
        this.forceShowAllEditButtons();
        
        // Add delete buttons to existing sections when dev mode is activated
        if (window.PageManager && typeof PageManager.addDeleteButtonsToExistingSections === 'function') {
          setTimeout(() => {
            PageManager.addDeleteButtonsToExistingSections();
          }, 100); // Small delay to ensure DOM is ready
        }
      } else {
        this.forceHideAllEditButtons();
      }

      // Regenerate monsters page if currently viewing it
      const currentPage = window.location.hash.replace('#/', '');
      if (currentPage === 'monstres' && JdrApp.modules.renderer && JdrApp.modules.renderer.populateMonstersPage) {
        setTimeout(() => {
          JdrApp.modules.renderer.populateMonstersPage();
        }, 100);
      }
    },

    forceHideAllEditButtons() {
      if (this.isDevMode) {
        return;
      }
      
      const selectors = [
        '.edit-btn', '[class$="-add"]', '[class$="-delete"]', '[class*="-move-"]',
        '.section-delete', '.remove-section-btn', '.add-paragraph-btn', 
        '.add-subclass-btn', '.delete-subclass-btn',
        '.spell-delete', '.don-delete', // Explicit delete buttons
        '.illus .up', '.illus .rm', '.illus label', '.illus input[type="file"]',
        '.tags-manager-btn', '.filter-manager-btn' // Tags and filter manager buttons
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.setAttribute('aria-hidden', 'true');
        });
      });
    },
    
    forceShowAllEditButtons() {
      if (!this.isDevMode) return;
      
      // Ensure body has the correct classes
      document.body.classList.add('dev-on');
      document.body.classList.remove('dev-off');
      
      // Force reset all CSS properties that might be causing 0x0 dimensions
      const selectors = [
        '.edit-btn', '[class$="-add"]', '[class$="-delete"]', '[class*="-move-"]',
        '.section-delete', '.remove-section-btn', '.add-paragraph-btn',
        '.add-subclass-btn', '.delete-subclass-btn',
        '.spell-delete', '.don-delete', '.objet-delete',
        '.spell-add', '.don-add', '.objet-add', '.npc-add', '.monster-add',
        '.illus .up', '.illus .rm', '.illus label', '.illus input[type="file"]',
        '.tags-manager-btn', '.filter-manager-btn' // Tags and filter manager buttons
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          // Force reset all dimension properties
          element.style.removeProperty('display');
          element.style.removeProperty('visibility');
          element.style.removeProperty('opacity');
          element.style.removeProperty('width');
          element.style.removeProperty('height');
          element.style.removeProperty('min-width');
          element.style.removeProperty('min-height');
          element.style.removeProperty('pointer-events');
          element.removeAttribute('aria-hidden');
          
          // Let CSS handle the styling
          element.style.display = '';
          element.style.visibility = '';
        });
      });
    },

    setupEditableHandlers() {
      // Unified edit button handler
      JdrApp.utils.events.register('click', '.edit-btn', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!this.isDevMode) return;

        // Prevent multiple edit sessions
        if (UnifiedEditor.currentEditSession) {
          console.warn('Another edit session is already active');
          return;
        }

        // Special handling for Google Doc button
        if (e.target.classList.contains('googledoc-btn')) {
          const campaignName = e.target.dataset.campaignName;
          const subPageName = e.target.dataset.subpageName;
          const editSection = e.target.dataset.editSection;

          if (!campaignName || !subPageName) {
            console.error('Missing campaign or subpage name for Google Doc button');
            return;
          }

          // Create a virtual editable element for Google Doc editing
          const virtualElement = document.createElement('div');
          virtualElement.classList.add('editable');
          virtualElement.dataset.editType = 'googledoc';
          virtualElement.dataset.editSection = editSection;

          // Parse the context and start editing
          const context = UnifiedEditor.parseEditContext(virtualElement);
          if (context) {
            UnifiedEditor.startGoogleDocEdit(context);
          } else {
            console.error('Failed to parse Google Doc edit context');
          }
          return;
        }

        // Find the editable element near the button
        let editableElement = e.target.previousElementSibling;

        // If not found as previous sibling, look in parent
        if (!editableElement || !editableElement.classList.contains('editable')) {
          const parent = e.target.parentElement;
          editableElement = parent.querySelector('.editable');
        }

        // Fallback: look for closest editable element
        if (!editableElement || !editableElement.classList.contains('editable')) {
          editableElement = e.target.closest('.editable-section')?.querySelector('.editable') ||
                           e.target.closest('.card')?.querySelector('.editable');
        }

        if (editableElement && editableElement.classList.contains('editable')) {
          UnifiedEditor.startEdit(editableElement);
        } else {
          console.warn('No editable element found for edit button');
        }
      });

      // Handle select element changes directly
      JdrApp.utils.events.register('change', '.editable[data-edit-type="select"]', (e) => {
        if (!this.isDevMode) return;
        
        const selectElement = e.target;
        const newValue = selectElement.value;
        
        // Parse context and save immediately
        const context = UnifiedEditor.parseEditContext(selectElement);
        if (context) {
          // Update the data structure
          const success = UnifiedEditor.updateContentInDataStructure(context, newValue);
          if (success) {
            // Update display
            UnifiedEditor.updateElementDisplay(context, newValue);
            
            // Save to storage
            EventBus.emit(Events.STORAGE_SAVE);
            
            // Show notification
            if (JdrApp.modules.ui?.showNotification) {
              JdrApp.modules.ui.showNotification('💾 Élément mis à jour', 'success');
            }
          }
        }
      });

      // Click outside to save
      JdrApp.utils.events.register('click', 'body', (e) => {
        if (!e.target.closest('.editable') && !e.target.matches('.edit-btn')) {
          UnifiedEditor.saveAllEdits();
        }
      });

      // Keyboard shortcuts
      JdrApp.utils.events.register('keydown', '.editable', (e) => {
        if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') {
          e.preventDefault();
          UnifiedEditor.saveCurrentEdit();
        }
      });

      // Prevent double-click editing (force button-only editing)
      JdrApp.utils.events.register('dblclick', '.editable', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    },

    setupCreationHandlers() {
      // Unified subclass management
      JdrApp.utils.events.register('click', '.add-subclass-btn', (e) => {
        if (!this.isDevMode) return;
        this.addNewSubclass(e.target);
      });

      JdrApp.utils.events.register('click', '.subclass-delete', (e) => {
        if (!this.isDevMode) return;
        this.deleteSubclass(e.target);
      });
    },

    addNewSubclass(button) {
      const article = button.closest('article');
      if (!article) return;
      
      let className = article.dataset.pageTitle;
      if (!className) {
        const hash = window.location.hash.match(/#\/([^\/]+)/);
        if (hash) {
          className = hash[1].charAt(0).toUpperCase() + hash[1].slice(1);
        }
      }
      
      
      if (!className || !window.CLASSES) {
        return;
      }
      
      const classe = window.CLASSES.find(c => c.nom === className);
      if (!classe) {
        return;
      }
      
      const config = window.ContentTypes.subclass;
      const newSubclass = { ...config.defaultValues };
      
      
      if (!classe.sousClasses) classe.sousClasses = [];
      classe.sousClasses.push(newSubclass);
      
      
      EventBus.emit(Events.CONTENT_ADD, {
        type: 'subclass',
        category: className,
        item: newSubclass
      });
      
      // Recharger juste le contenu de l'article au lieu de toute la page
      this.reloadClassPage(className);
    },

    deleteSubclass(button) {
      const className = button.dataset.categoryName;
      const subclassName = button.dataset.subclassName;
      
      if (!className || !subclassName) return;
      if (!confirm(`Êtes-vous sûr de vouloir supprimer la sous-classe "${subclassName}" ?`)) return;

      const classe = window.CLASSES?.find(c => c.nom === className);
      if (!classe?.sousClasses) return;

      const index = classe.sousClasses.findIndex(sc => sc.nom === subclassName);
      if (index === -1) return;

      const deletedSubclass = classe.sousClasses.splice(index, 1)[0];
      
      EventBus.emit(Events.CONTENT_DELETE, {
        type: 'subclass',
        category: className,
        item: deletedSubclass
      });
      
      // Recharger juste le contenu de l'article au lieu de toute la page  
      this.reloadClassPage(className);
    },

    reloadClassPage(className) {
      // Trouver l'article de la classe
      const article = document.querySelector(`article[data-page-title="${className}"]`);
      if (!article) return;

      // Régénérer le contenu de la classe
      const classe = window.CLASSES.find(c => c.nom === className);
      if (!classe) return;

      // Vérifier que PageBuilder existe
      if (!window.PageBuilder) {
        console.error('PageBuilder not available, falling back to page reload');
        window.location.reload();
        return;
      }

      // Utiliser PageBuilder pour régénérer le contenu
      const newContent = window.PageBuilder.buildClassPage(classe);
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(newContent, 'text/html');
      const newArticle = newDoc.querySelector('article');
      
      if (newArticle) {
        article.innerHTML = newArticle.innerHTML;
        
        // Réappliquer les images et l'état de dev mode
        setTimeout(() => {
          if (JdrApp.modules.renderer?.autoLoadImages) {
            JdrApp.modules.renderer.autoLoadImages();
          }
          // Apply dev mode state properly
          if (this.isDevMode) {
            this.forceShowAllEditButtons();
          } else {
            this.forceHideAllEditButtons();
          }
        }, 50);
      }
    },

    setupImageHandlers() {
      // Éviter double-attachement
      if (this._imageHandlersAttached) return;
      this._imageHandlersAttached = true;

      // Stocker les références des handlers pour pouvoir les supprimer plus tard
      this._imageClickHandler = (e) => {
        const img = e.target.closest('img');
        // Ignorer les images dans le modal d'agrandissement
        if (img && !img.closest('#image-enlargement-modal')) {
          e.stopImmediatePropagation();
          this.toggleImageEnlargement(img);
        }
      };

      this._imageTouchHandler = (e) => {
        const img = e.target.closest('img');
        // Ignorer les images dans le modal d'agrandissement
        if (img && !img.closest('#image-enlargement-modal')) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.toggleImageEnlargement(img);
        }
      };

      // Utiliser la délégation d'événements pour les clics sur images
      document.addEventListener('click', this._imageClickHandler, { capture: true });

      // Support tactile pour mobile
      document.addEventListener('touchend', this._imageTouchHandler, { passive: false, capture: true });

      // Attacher les handlers spécifiques (upload, suppression)
      this.attachImageEvents();

      // Observer pour les nouveaux éléments .illus avec throttling
      if (typeof MutationObserver !== 'undefined') {
        let timeoutId = null;
        this._mutationObserver = new MutationObserver(() => {
          // Throttle les appels pour éviter trop de traitement
          if (timeoutId) return;
          timeoutId = setTimeout(() => {
            this.attachImageEvents();
            timeoutId = null;
          }, 100);
        });
        this._mutationObserver.observe(document.body, { childList: true, subtree: true });
      }
    },

    // Méthode pour nettoyer les event listeners (à appeler lors du cleanup)
    cleanupImageHandlers() {
      if (this._imageClickHandler) {
        document.removeEventListener('click', this._imageClickHandler, { capture: true });
      }
      if (this._imageTouchHandler) {
        document.removeEventListener('touchend', this._imageTouchHandler, { passive: false, capture: true });
      }
      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
        this._mutationObserver = null;
      }
      this._imageHandlersAttached = false;
    },

    attachImageEvents() {
      // Attacher aux inputs de fichier
      document.querySelectorAll('.illus input[type="file"]').forEach(input => {
        if (!input.hasAttribute('data-events-attached')) {
          input.addEventListener('change', (e) => this.handleImageUpload(e));
          input.setAttribute('data-events-attached', 'true');
        }
      });

      // Attacher aux boutons de suppression
      document.querySelectorAll('.illus .rm').forEach(button => {
        if (!button.hasAttribute('data-events-attached')) {
          button.addEventListener('click', (e) => this.handleImageRemoval(e));
          button.setAttribute('data-events-attached', 'true');
        }
      });

      // Mettre le curseur zoom-in sur les images agrandissables
      document.querySelectorAll('img').forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
          if (this.isImageEnlargeable(img)) {
            img.style.cursor = 'zoom-in';
          }
        } else {
          img.addEventListener('load', () => {
            if (this.isImageEnlargeable(img)) {
              img.style.cursor = 'zoom-in';
            }
          }, { once: true });
        }
      });
    },

    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const illus = event.target.closest('.illus');
      if (!illus) {
        console.warn('[Editor] No .illus container found for image upload');
        return;
      }
      const img = illus.querySelector('img');
      const rmButton = illus.querySelector('.rm');
      const illusKey = illus.dataset.illusKey;

      // Show loading state
      img.style.display = 'block';
      img.style.opacity = '0.5';
      img.alt = 'Uploading...';

      try {
        // Upload to imgbb (never store base64)
        const imageUrl = await JdrApp.utils.uploadToImageBB(file);

        img.src = imageUrl;
        img.style.opacity = '1';
        if (rmButton) rmButton.style.display = 'block';

        if (JdrApp.modules.images?.setImageUrl) {
          JdrApp.modules.images.setImageUrl(illusKey, imageUrl);
        }

        EventBus.emit(Events.IMAGE_UPLOAD, {
          illusKey,
          src: imageUrl
        });
      } catch (error) {
        console.error('[Editor] Image upload failed:', error);
        img.style.display = 'none';
        img.style.opacity = '1';
        alert('Erreur upload image: ' + error.message);
      }
    },

    handleImageRemoval(event) {
      const illus = event.target.closest('.illus');
      const img = illus.querySelector('img');
      const rmButton = illus.querySelector('.rm');
      const illusKey = illus.dataset.illusKey;

      img.src = '';
      img.style.display = 'none';
      if (rmButton) rmButton.style.display = 'none';

      if (JdrApp.modules.images?.removeImage) {
        JdrApp.modules.images.removeImage(illusKey);
      }

      EventBus.emit(Events.IMAGE_DELETE, { illusKey });
    },

    toggleImageEnlargement(img) {
      // Si le modal existe déjà, le fermer
      const existingModal = document.getElementById('image-enlargement-modal');
      if (existingModal) {
        this.closeEnlargedImage();
        return;
      }

      const enlargeable = this.isImageEnlargeable(img);
      if (!enlargeable) {
        return;
      }

      this.showEnlargedImage(img);
    },

    // Vérifier si une image peut être agrandie
    isImageEnlargeable(img) {
      // Obtenir l'URL réelle (soit src, soit data-src pour lazy loading)
      const realSrc = img.getAttribute('data-src') || img.src;
      const dataSrc = img.getAttribute('data-src');

      // Ne pas agrandir si pas de source réelle
      if (!realSrc) {
        return false;
      }

      // Ne pas agrandir les placeholders SVG (sauf si data-src existe)
      if (img.src && img.src.startsWith('data:image/svg+xml') && !dataSrc) {
        return false;
      }

      // Ne pas agrandir les images trop petites (probablement des icônes)
      // Mais permettre si l'image a un data-src (lazy loading pas encore terminé)
      if (img.naturalWidth < 50 || img.naturalHeight < 50) {
        // Si l'image a un data-src, c'est peut-être juste pas encore chargée
        if (!dataSrc) {
          return false;
        }
      }

      return true;
    },

    showEnlargedImage(img) {
      // Créer un conteneur modal complet
      const modal = document.createElement('div');
      modal.id = 'image-enlargement-modal';
      // Utiliser setAttribute pour forcer les styles importants
      modal.setAttribute('style', `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0,0,0,0.8) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: zoom-out !important;
        isolation: isolate !important;
      `);
      
      // Créer une copie de l'image
      const enlargedImg = img.cloneNode(true);

      // Extraire l'URL originale pour le chargement haute résolution
      // Priorité au data-src (lazy loading) car src peut être un placeholder SVG
      let originalUrl = img.getAttribute('data-src') || img.src;

      // Ne pas utiliser les placeholders SVG
      if (originalUrl && originalUrl.startsWith('data:image/svg+xml')) {
        originalUrl = img.getAttribute('data-src') || '';
      }
      
      enlargedImg.removeAttribute('data-src');

      // Supprimer les classes de lazy loading qui pourraient interférer
      enlargedImg.classList.remove('lazy-load', 'lazy-loaded');

      // Style de base responsive - l'image s'adapte au viewport automatiquement
      const baseStyle = `
        display: block !important;
        max-width: 90vw !important;
        max-height: 90vh !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        border: 3px solid var(--gold) !important;
        border-radius: 8px !important;
        background: white !important;
        box-shadow: 0 20px 60px rgba(0,0,0,.8), 0 0 20px rgba(212,175,55,.3) !important;
        cursor: zoom-out !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        transition: none !important;
      `;
      enlargedImg.style.cssText = baseStyle;

      // Charger l'image haute résolution - recalcule automatiquement grâce à max-width/max-height
      enlargedImg.src = originalUrl;

      modal.appendChild(enlargedImg);
      document.body.appendChild(modal);

      // Fermer au clic et au touch pour mobile
      // Utiliser setTimeout pour éviter que le clic actuel ferme immédiatement le modal
      setTimeout(() => {
        modal.onclick = () => this.closeEnlargedImage();
        modal.addEventListener('touchend', (e) => {
          if (e.target === modal) {
            e.preventDefault();
            this.closeEnlargedImage();
          }
        });
      }, 10);
      
      // Fermer avec Échap
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeEnlargedImage();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      // Marquer l'image originale comme agrandie
      img.classList.add('enlarged');
    },

    closeEnlargedImage() {
      const modal = document.getElementById('image-enlargement-modal');
      if (modal) {
        modal.remove();
      }
      
      // Retirer la classe de toutes les images
      document.querySelectorAll('img.enlarged').forEach(img => {
        img.classList.remove('enlarged');
      });
      
      // Nettoyer les anciens backdrops
      const oldBackdrop = document.querySelector('.image-backdrop');
      if (oldBackdrop) {
        oldBackdrop.remove();
      }
    },


    saveChangesToStorage() {
      try {
        localStorage.setItem('jdr-bab-edits', JSON.stringify(this.editedData));
        localStorage.setItem('jdr-bab-last-modified', Date.now().toString());
        EventBus.emit(Events.STORAGE_SAVE);
      } catch (error) {
        // Failed to save changes
      }
    },

    forceCollectAllEdits() {
      // Collect page description edits before general edits
      this.collectPageDescriptionEdits();
      UnifiedEditor.saveAllEdits();
      return this.editedData;
    },

    collectPageDescriptionEdits() {
      // Check for edited table tresor page description
      const tablesTresorsDesc = document.querySelector('[data-section-type="table-tresor-category-description"] .editable');
      if (tablesTresorsDesc && tablesTresorsDesc.innerHTML) {
        const content = tablesTresorsDesc.innerHTML.trim();
        if (content && content !== "Tables de butin permettant de générer aléatoirement des récompenses selon les fourchettes définies. Lancez un dé 20 et consultez la table correspondante pour déterminer l'objet obtenu.") {
          if (!window.TABLES_TRESORS_PAGE_DESC) {
            window.TABLES_TRESORS_PAGE_DESC = {};
          }
          window.TABLES_TRESORS_PAGE_DESC.description = content;
        }
      }

      // Check for edited monster page description
      const monstersDesc = document.querySelector('[data-section-type="monster-category-description"] .editable');
      if (monstersDesc && monstersDesc.innerHTML) {
        const content = monstersDesc.innerHTML.trim();
        if (content && content !== "Créatures, ennemis et adversaires que peuvent affronter les héros dans leurs aventures.") {
          if (!window.MONSTRES_PAGE_DESC) {
            window.MONSTRES_PAGE_DESC = {};
          }
          window.MONSTRES_PAGE_DESC.description = content;
        }
      }
    },


    saveAllEdits() {
      return UnifiedEditor.saveAllEdits();
    },

    regenerateCurrentPage() {
      // Force regeneration of only the current page content (not all pages)
      if (JdrApp.modules.renderer && JdrApp.modules.renderer.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
    },

    initializeDevToolbox(devToolbox) {
      // Check if toolbox already has content and preserve it
      const existingContent = devToolbox.querySelector('.dev-toolbox-content');
      if (existingContent) {
        // Toolbox already initialized, don't override
        return;
      }

      // Store any existing content that might be there from other modules
      const existingHTML = devToolbox.innerHTML.trim();
      const hasExistingContent = existingHTML && 
        existingHTML !== '<!-- Dev toolbox content will be injected here -->' && 
        existingHTML !== '';

      // If there was existing content, preserve it without adding treasure tools
      if (hasExistingContent) {
        // Keep existing content as-is, don't add our tools
        return;
      } else {
        // Toolbox is empty, don't initialize anything for now
        // This keeps the toolbox clean as requested
        devToolbox.innerHTML = '<!-- Dev toolbox: tools removed as requested -->';
      }
    },

    setupDevToolboxEventListeners() {
      // No toolbox event listeners needed for now
      // Toolbox tools have been removed as requested
    }
  };

})();