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
    },

    forceHideAllEditButtons() {
      if (this.isDevMode || window.STANDALONE_VERSION === false) return;
      
      const selectors = [
        '.edit-btn', '[class$="-add"]', '[class$="-delete"]', '[class*="-move-"]',
        '.section-delete', '.remove-section-btn', '.add-paragraph-btn', 
        '.add-subclass-btn', '.delete-subclass-btn',
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
      const selectors = [
        '.edit-btn', '[class$="-add"]', '[class$="-delete"]', '[class*="-move-"]',
        '.section-delete', '.remove-section-btn', '.add-paragraph-btn',
        '.add-subclass-btn', '.delete-subclass-btn',
        '.illus .up', '.illus .rm', '.illus label', '.illus input[type="file"]'
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          element.style.display = '';
          element.style.visibility = '';
          element.removeAttribute('aria-hidden');
        });
      });
    },

    setupEditableHandlers() {
      // Unified edit button handler
      JdrApp.utils.events.register('click', '.edit-btn', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDevMode) return;
        
        const editableSection = e.target.closest('.editable-section');
        if (editableSection && !UnifiedEditor.isEditing(editableSection)) {
          UnifiedEditor.startEdit(editableSection);
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
      
      if (!className || !window.CLASSES) return;
      
      const classe = window.CLASSES.find(c => c.nom === className);
      if (!classe) return;
      
      const config = window.ContentTypes.subclass;
      const newSubclass = { ...config.defaultValues };
      
      if (!classe.sousClasses) classe.sousClasses = [];
      classe.sousClasses.push(newSubclass);
      
      EventBus.emit(Events.CONTENT_ADD, {
        type: 'subclass',
        category: className,
        item: newSubclass
      });
      
      this.saveChangesToStorage();
      window.location.reload();
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
      
      this.saveChangesToStorage();
      window.location.reload();
    },

    setupImageHandlers() {
      JdrApp.utils.events.register('change', '.illus input[type="file"]', (e) => {
        this.handleImageUpload(e);
      });

      JdrApp.utils.events.register('click', '.illus .rm', (e) => {
        this.handleImageRemoval(e);
      });

      JdrApp.utils.events.register('click', '.illus img', (e) => {
        this.toggleImageEnlargement(e.target);
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
        img.classList.remove('enlarged');
        this.removeImageBackdrop();
      } else {
        img.classList.add('enlarged');
        this.createImageBackdrop();
      }
    },

    createImageBackdrop() {
      let backdrop = document.querySelector('.image-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'image-backdrop';
        document.body.appendChild(backdrop);
      }
      
      backdrop.classList.add('visible');
      backdrop.onclick = () => {
        document.querySelectorAll('img.enlarged').forEach(img => {
          img.classList.remove('enlarged');
        });
        this.removeImageBackdrop();
      };
    },

    removeImageBackdrop() {
      const backdrop = document.querySelector('.image-backdrop');
      if (backdrop) {
        backdrop.classList.remove('visible');
      }
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
    }
  };

})();