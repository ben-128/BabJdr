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

    init() {
      this.setupEventListeners();
      this.setupEditableHandlers();
      this.setupCreationHandlers();
      this.setupImageHandlers();
      this.updateDevModeState();
    },

    setupEventListeners() {
      JdrApp.utils.events.register('click', '#devToggle', () => this.toggleDevMode());

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
      }
      
      if (this.isDevMode) {
        this.forceShowAllEditButtons();
      } else {
        this.forceHideAllEditButtons();
      }
      
      this.regenerateCurrentPage();
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
        '.illus .up', '.illus .rm', '.illus label', '.illus input[type="file"]'
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
        '.spell-add', '.don-add', '.objet-add',
        '.illus .up', '.illus .rm', '.illus label', '.illus input[type="file"]'
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

      JdrApp.utils.events.register('click', '.delete-subclass-btn', (e) => {
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
      
      console.log('Adding subclass to class:', className);
      
      if (!className || !window.CLASSES) {
        console.log('Missing className or CLASSES:', { className, hasClasses: !!window.CLASSES });
        return;
      }
      
      const classe = window.CLASSES.find(c => c.nom === className);
      if (!classe) {
        console.log('Class not found:', className);
        console.log('Available classes:', window.CLASSES.map(c => c.nom));
        return;
      }
      
      const config = window.ContentTypes.subclass;
      const newSubclass = { ...config.defaultValues };
      
      console.log('Creating new subclass:', newSubclass);
      
      if (!classe.sousClasses) classe.sousClasses = [];
      classe.sousClasses.push(newSubclass);
      
      console.log('Class after adding subclass:', classe);
      
      EventBus.emit(Events.CONTENT_ADD, {
        type: 'subclass',
        category: className,
        item: newSubclass
      });
      
      // Recharger juste le contenu de l'article au lieu de toute la page
      this.reloadClassPage(className);
    },

    deleteSubclass(button) {
      const className = button.dataset.className;
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
      // Fonction pour attacher les événements aux images existantes
      this.attachImageEvents();
      
      // Observer pour attacher les événements aux nouvelles images créées dynamiquement
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
          this.attachImageEvents();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
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

      // Attacher aux images pour agrandissement - toutes les images, pas seulement celles dans .illus
      document.querySelectorAll('img').forEach(img => {
        // Éviter les images dans les éditeurs ou les inputs
        if (!img.closest('.editor-content') && !img.hasAttribute('data-events-attached')) {
          // Ajouter support tactile pour mobile
          img.addEventListener('click', (e) => this.toggleImageEnlargement(e.target));
          img.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.toggleImageEnlargement(e.target);
          });
          img.setAttribute('data-events-attached', 'true');
          img.style.cursor = 'zoom-in';
        }
      });
    },

    handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const illus = event.target.closest('.illus');
        const img = illus.querySelector('img');
        const rmButton = illus.querySelector('.rm');
        const illusKey = illus.dataset.illusKey;

        img.src = e.target.result;
        img.style.display = 'block';
        if (rmButton) rmButton.style.display = 'block';

        if (JdrApp.modules.images?.setImageUrl) {
          JdrApp.modules.images.setImageUrl(illusKey, e.target.result);
        }

        EventBus.emit(Events.IMAGE_UPLOAD, { 
          illusKey, 
          src: e.target.result 
        });
      };
      
      reader.readAsDataURL(file);
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
      if (img.classList.contains('enlarged')) {
        this.closeEnlargedImage();
      } else {
        this.showEnlargedImage(img);
      }
    },

    showEnlargedImage(img) {
      // Fermer toute image déjà ouverte
      this.closeEnlargedImage();
      
      // Créer un conteneur modal complet
      const modal = document.createElement('div');
      modal.id = 'image-enlargement-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.8);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: zoom-out;
      `;
      
      // Créer une copie de l'image
      const enlargedImg = img.cloneNode(true);
      enlargedImg.style.cssText = `
        max-width: 90vw;
        max-height: 90vh;
        width: auto;
        height: auto;
        object-fit: contain;
        border: 3px solid var(--gold);
        border-radius: 8px;
        background: white;
        box-shadow: 0 20px 60px rgba(0,0,0,.8), 0 0 20px rgba(212,175,55,.3);
        cursor: zoom-out;
      `;
      
      modal.appendChild(enlargedImg);
      document.body.appendChild(modal);
      
      // Fermer au clic et au touch pour mobile
      modal.onclick = () => this.closeEnlargedImage();
      modal.addEventListener('touchend', (e) => {
        if (e.target === modal) {
          e.preventDefault();
          this.closeEnlargedImage();
        }
      });
      
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

    createImageBackdrop() {
      // Méthode obsolète - redirigée vers la nouvelle approche
      console.warn('createImageBackdrop is deprecated, use showEnlargedImage instead');
    },

    removeImageBackdrop() {
      // Méthode obsolète - redirigée vers la nouvelle approche
      this.closeEnlargedImage();
    },

    saveChangesToStorage() {
      try {
        localStorage.setItem('jdr-bab-edits', JSON.stringify(this.editedData));
        localStorage.setItem('jdr-bab-last-modified', Date.now().toString());
        EventBus.emit(Events.STORAGE_SAVE);
      } catch (error) {
        console.error('Failed to save changes:', error);
      }
    },

    forceCollectAllEdits() {
      UnifiedEditor.saveAllEdits();
      return this.editedData;
    },

    // Legacy methods for backward compatibility
    makeEditableSection(element) {
      return UnifiedEditor.startEdit(element);
    },

    saveAllEdits() {
      return UnifiedEditor.saveAllEdits();
    },

    regenerateCurrentPage() {
      // Force regeneration of only the current page content (not all pages)
      if (JdrApp.modules.renderer && JdrApp.modules.renderer.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
    }
  };

})();