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

      // SIMPLIFIED: Get page ID directly from URL hash
      const currentUrl = window.location.hash;
      let pageId = 'creation'; // default
      
      // Extract page ID from URL hash
      if (currentUrl) {
        const hashPart = currentUrl.replace('#/', '').replace('#', '');
        if (hashPart) {
          pageId = hashPart;
        }
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

      // Save data without full page refresh
      this.savePageData();
      
      // Add section to DOM directly instead of full refresh
      this.addSectionToDOM(newSection, pageId);
      
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

      // Handle different types of additions based on target
      if (target === 'new-section') {
        this.createNewSection();
      } else {
        const sectionTitle = prompt('Titre de la nouvelle section :');
        if (!sectionTitle || !sectionTitle.trim()) return;
        
        this.addParagraphToSection(target, button, sectionTitle.trim());
      }
    },

    /**
     * Add section with title
     */
    addParagraphToSection(target, button, sectionTitle) {
      // Use provided title or ask for it if not provided
      if (!sectionTitle) {
        sectionTitle = prompt('Titre de la nouvelle section :');
        if (!sectionTitle || !sectionTitle.trim()) return;
      }

      // SIMPLIFIED: Get page ID directly from URL hash
      const currentUrl = window.location.hash;
      let correctedPageId = 'creation'; // default
      
      // Extract page ID from URL hash
      if (currentUrl) {
        const hashPart = currentUrl.replace('#/', '').replace('#', '');
        if (hashPart) {
          correctedPageId = hashPart;
        }
      }
      
      const sectionId = UIUtilities.generateUniqueId('section');
      
      // Create section data
      const newSection = {
        id: sectionId,
        type: 'card',
        title: sectionTitle.trim(),
        content: '<p>Contenu de la nouvelle section...</p>'
      };

      // Add to page data using corrected pageId
      if (!window.STATIC_PAGES[correctedPageId]) {
        window.STATIC_PAGES[correctedPageId] = { sections: [] };
      }
      if (!window.STATIC_PAGES[correctedPageId].sections) {
        window.STATIC_PAGES[correctedPageId].sections = [];
      }

      window.STATIC_PAGES[correctedPageId].sections.push(newSection);

      // Save data without full page refresh
      this.savePageData();
      
      // Add section to DOM directly instead of full refresh
      this.addSectionToDOM(newSection, correctedPageId);
      
      UIUtilities.showNotification('➕ Section ajoutée et sauvegardée', 'success');
    },

    /**
     * Add section to DOM without full page refresh
     */
    addSectionToDOM(sectionData, pageId) {
      // IMPORTANT: Verify we're on the correct page before adding to DOM
      const currentPageFromUrl = window.location.hash.replace('#/', '').replace('#', '') || 'creation';
      
      // Only add to DOM if we're on the correct page
      if (currentPageFromUrl !== pageId) {
        return; // Don't add to DOM if we're on a different page
      }
      
      // Try multiple selectors to find the CORRECT page's main content container
      let mainContent = null;
      
      // First, try to find the active page article with matching data-page attribute
      const targetArticle = document.querySelector(`article[data-static-page="true"][data-page="${pageId}"]`);
      
      if (targetArticle) {
        // Look for content container within the specific article
        mainContent = targetArticle.querySelector('.row') || 
                     targetArticle.querySelector('#main-content') || 
                     targetArticle.querySelector('section') || 
                     targetArticle.querySelector('main') ||
                     targetArticle;
      }
      
      // Fallback: try general selectors but verify they're in the right page
      if (!mainContent) {
        const candidates = [
          document.querySelector('#main-content .row'),
          document.querySelector('#main-content'),
          document.querySelector('.container-fluid'),
          document.querySelector('.row'),
          document.querySelector('main')
        ];
        
        for (const candidate of candidates) {
          if (candidate) {
            // Check if this candidate is within the correct page article
            const parentArticle = candidate.closest('article[data-static-page="true"]');
            if (parentArticle && parentArticle.getAttribute('data-page') === pageId) {
              mainContent = candidate;
              break;
            }
          }
        }
      }
      
      if (!mainContent) {
        return;
      }

      // Build the section HTML using PageBuilder
      if (window.PageBuilder) {
        const sectionIndex = window.STATIC_PAGES[pageId]?.sections?.length || 0;
        const sectionHTML = PageBuilder.buildCardSection(sectionData, sectionIndex);
        
        // Create a temporary div to hold the new section
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sectionHTML;
        
        // Find the add button to insert before it
        const addButton = mainContent.querySelector('.add-paragraph-btn[data-target="new-section"]');
        
        let insertedElement;
        if (addButton) {
          // Insert before the add button
          insertedElement = addButton.parentNode.insertBefore(tempDiv.firstElementChild, addButton);
        } else {
          // Add as last element
          insertedElement = mainContent.appendChild(tempDiv.firstElementChild);
        }

        
        // Force a reflow to ensure the element is rendered
        insertedElement.offsetHeight;
        
        // Add some basic styling to ensure visibility and dimensions
        insertedElement.style.display = 'block';
        insertedElement.style.visibility = 'visible';
        insertedElement.style.opacity = '1';
        insertedElement.style.minHeight = '100px';
        insertedElement.style.width = '100%';
        insertedElement.style.margin = '10px 0';
        insertedElement.style.padding = '15px';
        insertedElement.style.border = '1px solid #ddd';
        insertedElement.style.borderRadius = '8px';
        insertedElement.style.backgroundColor = '#f9f9f9';
        
        
        
        // SOLUTION: Forcer les dimensions du parent s'il a une taille nulle
        if (insertedElement.parentElement.offsetHeight === 0) {
          insertedElement.parentElement.style.minHeight = '200px';
          insertedElement.parentElement.style.width = '100%';
          insertedElement.parentElement.style.display = 'block';
          insertedElement.parentElement.style.visibility = 'visible';
          insertedElement.parentElement.style.overflow = 'visible';
          
          // Remonter la hiérarchie pour corriger tous les parents si nécessaire
          let currentParent = insertedElement.parentElement.parentElement;
          let depth = 0;
          while (currentParent && depth < 5) {
            if (currentParent.offsetHeight === 0) {
              currentParent.style.minHeight = '200px';
              currentParent.style.width = '100%';
              currentParent.style.display = 'block';
              currentParent.style.visibility = 'visible';
              currentParent.style.overflow = 'visible';
            }
            currentParent = currentParent.parentElement;
            depth++;
          }
        }
        
        // Essayer de rendre l'élément visible en position absolue pour test
        insertedElement.style.position = 'relative';
        insertedElement.style.zIndex = '9999';
        insertedElement.style.top = '0';
        insertedElement.style.left = '0';
        
        // Forcer le contenu interne à être visible aussi
        const innerElements = insertedElement.querySelectorAll('*');
        innerElements.forEach(el => {
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        });
        

        // Add delete button to the new section if in dev mode
        this.addDeleteButtonToSection(insertedElement, sectionData);

        // Re-initialize event handlers for the new section
        if (JdrApp.modules?.ui?.setupEditableContent) {
          JdrApp.modules.ui.setupEditableContent();
        }
      }
    },

    /**
     * Add delete button to a section element
     */
    addDeleteButtonToSection(sectionElement, sectionData) {
      // Check if we're in dev mode
      if (!document.body.classList.contains('dev-on')) {
        return; // Only add delete button in dev mode
      }
      
      // Check if delete button already exists
      if (sectionElement.querySelector('.section-delete')) {
        return; // Button already exists
      }
      
      // Create delete button div
      const deleteButtonDiv = document.createElement('div');
      deleteButtonDiv.style.marginTop = '1rem';
      deleteButtonDiv.style.textAlign = 'center';
      
      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'section-delete btn small';
      deleteButton.setAttribute('data-section-name', sectionData.title || sectionData.id);
      deleteButton.type = 'button';
      deleteButton.style.background = '#ff6b6b';
      deleteButton.style.color = 'white';
      deleteButton.innerHTML = '🗑 Supprimer section';
      
      deleteButtonDiv.appendChild(deleteButton);
      sectionElement.appendChild(deleteButtonDiv);
      
    },

    /**
     * Add delete buttons to all existing sections on current page
     */
    addDeleteButtonsToExistingSections() {
      // Check if we're in dev mode
      if (!document.body.classList.contains('dev-on')) {
        return;
      }
      
      // Find all section cards that don't have delete buttons (only in main content)
      const sections = document.querySelectorAll('#main-content .card.editable-section, main .card.editable-section');
      
      sections.forEach((section, index) => {
        // Check if delete button already exists
        if (section.querySelector('.section-delete')) {
          return; // Button already exists
        }
        
        // Try to get section title from the h3 element
        const titleElement = section.querySelector('h3.editable');
        const sectionTitle = titleElement ? titleElement.textContent.trim() : `Section ${index + 1}`;
        
        // Create mock section data for the button
        const sectionData = {
          title: sectionTitle,
          id: `existing-section-${index}`
        };
        
        this.addDeleteButtonToSection(section, sectionData);
      });
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
        
        // Try multiple methods to get section ID
        let sectionId = null;
        
        // Method 1: Check data-section-index attribute
        sectionId = section.getAttribute('data-section-index');
        if (sectionId !== null) {
          // Convert index to actual section data
          const sectionIndex = parseInt(sectionId);
          if (sectionIndex >= 0 && window.STATIC_PAGES[pageId].sections[sectionIndex]) {
            const sectionData = window.STATIC_PAGES[pageId].sections[sectionIndex];
            sectionId = sectionData.id;
          }
        }
        
        // Method 2: Extract from editable elements
        if (!sectionId) {
          const editableElements = section.querySelectorAll('[data-edit-type]');
          for (const element of editableElements) {
            const id = element.dataset.sectionId || element.id;
            if (id) {
              sectionId = id.replace(/-title$/, '');
              break;
            }
          }
        }
        
        // Method 3: Find by title match
        if (!sectionId) {
          const titleElement = section.querySelector('h3');
          const sectionTitle = titleElement ? titleElement.textContent.trim() : '';
          
          const matchingSection = window.STATIC_PAGES[pageId].sections.find(s => 
            s.title === sectionTitle || s.title === sectionName
          );
          if (matchingSection) {
            sectionId = matchingSection.id;
          }
        }

        if (sectionId) {
          // Remove from data
          window.STATIC_PAGES[pageId].sections = window.STATIC_PAGES[pageId].sections.filter(
            s => s.id !== sectionId
          );

          // Save the deletion to JSON
          this.savePageData();

          // Remove from DOM directly (no page refresh)
          section.remove();

          // Trigger persistent storage save
          UIUtilities.triggerDataSave();
          
          UIUtilities.showNotification(`🗑️ Section "${sectionName}" supprimée et sauvegardée`, 'success');
        } else {
          UIUtilities.showNotification('❌ Impossible de trouver l\'ID de la section', 'error');
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