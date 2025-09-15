// ============================================================================
// JDR-BAB APPLICATION - PAGE MANAGER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // PAGE MANAGER - STATIC PAGE MANAGEMENT
  // ========================================
  window.PageManager = {

    /**
     * Show section selection modal for new page creation
     */
    showSectionSelectionModal() {
      const modalId = 'sectionSelectionModal';
      
      // Remove existing modal
      BaseModal.destroyModal(modalId);

      const content = `
        <p>Sélectionnez le type de contenu à ajouter :</p>
        <div class="section-types" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 20px 0;">
          <button class="btn btn-primary section-type-btn" data-type="section">
            📄 Nouvelle Section
          </button>
          <button class="btn btn-secondary section-type-btn" data-type="paragraph">
            📝 Nouveau Paragraphe
          </button>
        </div>
      `;

      const modal = BaseModal.createModal(modalId, '➕ Nouveau Contenu', content);
      document.body.appendChild(modal);

      // Setup event handlers
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('section-type-btn')) {
          const type = e.target.dataset.type;
          BaseModal.closeModal(modal);
          BaseModal.destroyModal(modal);
          
          if (type === 'section') {
            this.createNewSection();
          } else if (type === 'paragraph') {
            this.createNewParagraph();
          }
        }
      });

      BaseModal.openModal(modalId);
    },

    /**
     * Create new section
     */
    createNewSection() {
      const sectionTitle = prompt('Titre de la nouvelle section :');
      if (!sectionTitle || !sectionTitle.trim()) return;

      const pageId = UIUtilities.getCurrentPageId();
      if (!pageId) {
        UIUtilities.showNotification('❌ Impossible de déterminer la page courante', 'error');
        return;
      }

      // Generate unique ID
      const sectionId = UIUtilities.generateUniqueId('section');
      
      // Create section data
      const newSection = {
        id: sectionId,
        type: 'card',
        title: sectionTitle.trim(),
        content: '<p>Contenu de la nouvelle section...</p>'
      };

      // Add to page data
      if (!window.STATIC_PAGES[pageId]) {
        window.STATIC_PAGES[pageId] = { sections: [] };
      }
      if (!window.STATIC_PAGES[pageId].sections) {
        window.STATIC_PAGES[pageId].sections = [];
      }

      window.STATIC_PAGES[pageId].sections.push(newSection);

      // Save and refresh
      this.savePageData();
      this.refreshCurrentPage();
      
      UIUtilities.showNotification('➕ Nouvelle section ajoutée et sauvegardée', 'success');
    },

    /**
     * Create new paragraph
     */
    createNewParagraph() {
      const paragraphContent = prompt('Contenu du nouveau paragraphe :');
      if (!paragraphContent || !paragraphContent.trim()) return;

      const pageId = UIUtilities.getCurrentPageId();
      if (!pageId) {
        UIUtilities.showNotification('❌ Impossible de déterminer la page courante', 'error');
        return;
      }

      // Generate unique ID
      const paragraphId = UIUtilities.generateUniqueId('paragraph');
      
      // Create paragraph data
      const newParagraph = {
        id: paragraphId,
        type: 'text',
        content: `<p>${paragraphContent.trim()}</p>`
      };

      // Add to page data
      if (!window.STATIC_PAGES[pageId]) {
        window.STATIC_PAGES[pageId] = { sections: [] };
      }
      if (!window.STATIC_PAGES[pageId].sections) {
        window.STATIC_PAGES[pageId].sections = [];
      }

      window.STATIC_PAGES[pageId].sections.push(newParagraph);

      // Save and refresh
      this.savePageData();
      this.refreshCurrentPage();
      
      UIUtilities.showNotification('➕ Paragraphe ajouté et sauvegardé', 'success');
    },

    /**
     * Add paragraph to existing target
     */
    addParagraph(target, button) {
      if (!target || !button) {
        UIUtilities.showNotification('❌ Target ou bouton manquant', 'error');
        return;
      }

      const paragraphContent = prompt('Contenu du nouveau paragraphe :');
      if (!paragraphContent || !paragraphContent.trim()) return;

      // Handle different types of additions based on target
      if (target === 'new-section') {
        this.createNewSection();
      } else {
        this.addParagraphToSection(target, button);
      }
    },

    /**
     * Add paragraph to specific section
     */
    addParagraphToSection(target, button) {
      const paragraphContent = prompt('Contenu du nouveau paragraphe :');
      if (!paragraphContent || !paragraphContent.trim()) return;

      // Generate unique ID
      const pageId = UIUtilities.getCurrentPageId();
      const paragraphId = UIUtilities.generateUniqueId('paragraph');
      
      // Create paragraph data
      const newParagraph = {
        id: paragraphId,
        type: 'text',
        content: `<p>${paragraphContent.trim()}</p>`
      };

      // Find target section and add paragraph
      if (window.STATIC_PAGES[pageId]?.sections) {
        const targetSection = window.STATIC_PAGES[pageId].sections.find(section => 
          section.id === target
        );
        
        if (targetSection) {
          if (!targetSection.paragraphs) {
            targetSection.paragraphs = [];
          }
          targetSection.paragraphs.push(newParagraph);
        } else {
          // Add as new section if target not found
          window.STATIC_PAGES[pageId].sections.push(newParagraph);
        }
      }

      // Save and refresh
      this.savePageData();
      this.refreshCurrentPage();
      
      UIUtilities.showNotification('➕ Paragraphe ajouté et sauvegardé', 'success');
    },

    /**
     * Delete section
     */
    deleteSection(sectionName, button) {
      if (!sectionName || !button) {
        UIUtilities.showNotification('❌ Section ou bouton manquant', 'error');
        return;
      }

      if (!confirm(`Supprimer la section "${sectionName}" ?`)) {
        return;
      }

      const pageId = UIUtilities.getCurrentPageId();
      if (!pageId || !window.STATIC_PAGES[pageId]?.sections) {
        UIUtilities.showNotification('❌ Page ou sections non trouvées', 'error');
        return;
      }

      // Find and remove the section
      const section = button.closest('.card');
      if (section) {
        // Extract the section ID from the editable elements
        const editableElements = section.querySelectorAll('[data-edit-type]');
        let sectionId = null;
        
        for (const element of editableElements) {
          const id = element.dataset.sectionId || element.id;
          if (id) {
            // Remove "-title" suffix if present to get base ID
            sectionId = id.replace(/-title$/, '');
            break;
          }
        }

        if (sectionId) {
          // Remove from data
          window.STATIC_PAGES[pageId].sections = window.STATIC_PAGES[pageId].sections.filter(
            s => s.id !== sectionId
          );

          // Save the deletion to JSON
          this.savePageData();

          // Recalculate all section indices after deletion
          this.recalculateSectionIndices(pageId);

          // Trigger persistent storage save
          UIUtilities.triggerDataSave();
          
          UIUtilities.showNotification(`🗑️ Section "${sectionName}" supprimée et mise à jour JSON`, 'success');
          
          // Refresh page
          this.refreshCurrentPage();
        }
      }
    },

    /**
     * Save page data
     */
    savePageData() {
      // Trigger storage save event
      UIUtilities.triggerDataSave();
    },

    /**
     * Refresh current page
     */
    refreshCurrentPage() {
      UIUtilities.forcePageRefresh();
    },

    /**
     * Count existing sections for unique ID generation
     */
    countExistingSections() {
      const pageId = UIUtilities.getCurrentPageId();
      if (!pageId || !window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        return 0;
      }
      const pageData = window.STATIC_PAGES[pageId];
      return pageData.sections ? pageData.sections.length : 0;
    },

    /**
     * Save new section to JSON data
     */
    saveNewSectionToJSON(sectionId, title, content) {
      const pageId = UIUtilities.getCurrentPageId();
      
      if (!pageId || !window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        return false;
      }
      
      const pageData = window.STATIC_PAGES[pageId];
      if (!pageData.sections) {
        pageData.sections = [];
      }
      
      // Create new section object
      const newSection = {
        id: sectionId,
        type: 'card',
        title: title,
        content: content
      };
      
      // Add to sections array
      pageData.sections.push(newSection);
      
      return true;
    },

    /**
     * Recalculate section indices after changes
     */
    recalculateSectionIndices(pageId) {
      if (!window.STATIC_PAGES[pageId]?.sections) {
        return false;
      }
      
      const sections = window.STATIC_PAGES[pageId].sections;
      
      // Update indices for all sections
      sections.forEach((section, index) => {
        if (section.id) {
          section.index = index;
        }
      });
      
      console.log(`Recalculated indices for ${sections.length} sections in page ${pageId}`);
      return true;
    },

    /**
     * Create new category for content types
     */
    createNewCategory(type) {
      const config = window.ContentTypes[type];
      if (!config) {
        UIUtilities.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Demander le nom de la catégorie
      const categoryName = prompt(`Nom de la nouvelle catégorie ${config.container} :`);
      if (!categoryName || !categoryName.trim()) {
        return;
      }

      const trimmedName = categoryName.trim();
      
      // Vérifier si la catégorie existe déjà
      const entity = ContentFactory.getEntity(type);
      if (entity && entity.findCategory(trimmedName)) {
        UIUtilities.showNotification(`❌ La catégorie "${trimmedName}" existe déjà`, 'error');
        return;
      }

      // Créer la nouvelle catégorie
      const success = ContentFactory.addCategory(type, {
        nom: trimmedName,
        [config.dataKey.toLowerCase()]: []
      });

      if (success) {
        // Sauvegarder les modifications
        EventBus.emit(Events.STORAGE_SAVE);

        // Rafraîchir ContentFactory
        ContentFactory.refreshData();

        // Rafraîchir le router TOC
        if (JdrApp.modules.router && JdrApp.modules.router.generateTOC) {
          JdrApp.modules.router.generateTOC();
        }

        // Naviguer vers la nouvelle catégorie
        const categoryRoute = `${config.container}-${JdrApp.utils.data.sanitizeId(trimmedName)}`;
        JdrApp.modules.router.navigate(categoryRoute);

        UIUtilities.showNotification(`${config.icons.category} Catégorie "${trimmedName}" créée avec succès!`, 'success');
      }
    },

    /**
     * Delete category
     */
    deleteCategory(type, categoryName) {
      const config = window.ContentTypes[type];
      if (!config) {
        UIUtilities.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      if (!confirm(`Supprimer la catégorie "${categoryName}" et tout son contenu ?`)) {
        return;
      }

      const success = ContentFactory.deleteCategory(type, categoryName);

      if (success) {
        // Sauvegarder les modifications
        EventBus.emit(Events.STORAGE_SAVE);

        // Rafraîchir ContentFactory
        ContentFactory.refreshData();

        // Rafraîchir le router TOC
        if (JdrApp.modules.router && JdrApp.modules.router.generateTOC) {
          JdrApp.modules.router.generateTOC();
        }

        // Naviguer vers la page principale du type
        JdrApp.modules.router.navigate(config.container);

        UIUtilities.showNotification(`${config.icons.delete} Catégorie "${categoryName}" supprimée`, 'success');
      }
    }
  };

})();