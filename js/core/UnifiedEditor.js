// ============================================================================
// JDR-BAB APPLICATION - UNIFIED EDITOR SYSTEM
// ============================================================================

(() => {
  "use strict";

  class UnifiedEditor {
    constructor() {
      this.currentEditSession = null;
    }

    /*
     * IMPORTANT: Content Restoration Best Practices
     * =============================================
     * ALWAYS use restoreElementContent() for any content that has been edited
     * NEVER directly assign to innerHTML in editing contexts
     * This prevents HTML tags from being displayed as visible text
     */

    static getInstance() {
      if (!UnifiedEditor.instance) {
        UnifiedEditor.instance = new UnifiedEditor();
      }
      return UnifiedEditor.instance;
    }

    // Parse edit context from DOM element
    parseEditContext(element) {
      console.log('🔧 DEBUG: parseEditContext called with:', element);
      const editableElement = element.classList.contains('editable-section') 
        ? element.querySelector('.editable') 
        : element;
      console.log('🔧 DEBUG: editableElement:', editableElement);

      if (!editableElement) {
        return null;
      }

      const editType = editableElement.dataset.editType;
      const editSection = editableElement.dataset.editSection;
      
      // For simplified HTML editing, everything is treated as HTML content
      if (editType === 'html') {
        return this.parseHtmlEditContext(element, editSection);
      }
      
      // Generic editing - use contextual detection, don't force type
      if (editType === 'generic') {
        // Use the full parsing logic and keep the detected contentType
        return this.parseHtmlEditContext(element, editSection);
      }

      // Tags editing for objects
      if (editType === 'tags') {
        return this.parseTagsEditContext(element, editSection);
      }

      // All legacy edit types have been migrated to 'generic'
      console.warn('Unexpected edit type in parseEditContext:', editType);
      return null;
    }

    parseHtmlEditContext(element, editSection) {
      // Detect context automatically based on page structure
      // Order matters: check most specific first (spells, dons, classes, then static pages)
      
      // Check if we're in a spell card first (most specific)
      const spellCard = element.closest('.card[data-spell-name]');
      if (spellCard) {
        const spellName = spellCard.dataset.spellName;
        const spellIndex = spellCard.dataset.spellIndex;
        const categoryName = spellCard.dataset.categoryName;
        
        // Use index-based detection for spell sections
        const allEditables = Array.from(spellCard.querySelectorAll('.editable'));
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const currentIndex = allEditables.indexOf(editableElement);
        
        // Map index to spell property based on CardBuilder order
        // 0=nom, 1=description, 2=prerequis, 3=portee, 4=coutMana, 5=tempsIncantation, 6=resistance, 7=effetNormal, 8=effetCritique
        const spellSections = ['nom', 'description', 'prerequis', 'portee', 'coutMana', 'tempsIncantation', 'resistance', 'effetNormal', 'effetCritique'];
        const spellEditSection = spellSections[currentIndex] || 'description';
        
        return {
          contentType: 'spell',
          itemIdentifier: spellName,
          itemIndex: spellIndex,
          categoryName: categoryName,
          property: 'html',
          editType: 'html',
          editSection: spellEditSection,
          config: window.ContentTypes.spell,
          element: editableElement,
          container: element
        };
      }
      
      // Check if we're in a don card
      const donCard = element.closest('.card[data-don-name]');
      if (donCard) {
        const donName = donCard.dataset.donName;
        const donIndex = donCard.dataset.donIndex;
        const categoryName = donCard.dataset.categoryName;
        
        // Use index-based detection for don sections
        const allEditables = Array.from(donCard.querySelectorAll('.editable'));
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const currentIndex = allEditables.indexOf(editableElement);
        
        // Map index to don property based on CardBuilder order
        // 0=nom, 1=description, 2=prerequis, 3=cout
        const donSections = ['nom', 'description', 'prerequis', 'cout'];
        const donEditSection = donSections[currentIndex] || 'description';
        
        return {
          contentType: 'don',
          itemIdentifier: donName,
          itemIndex: donIndex,
          categoryName: categoryName,
          property: 'html',
          editType: 'html',
          editSection: donEditSection,
          config: window.ContentTypes.don,
          element: editableElement,
          container: element
        };
      }
      
      // Check if we're in an objet card
      const objetCard = element.closest('.card[data-objet-name]');
      if (objetCard) {
        console.log('🔧 DEBUG: Found objet card:', objetCard);
        const objetName = objetCard.dataset.objetName;
        const categoryName = objetCard.dataset.categoryName;
        console.log('🔧 DEBUG: objet name:', objetName, 'category:', categoryName);
        
        // Use index-based detection for objet sections
        const allEditables = Array.from(objetCard.querySelectorAll('.editable'));
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const currentIndex = allEditables.indexOf(editableElement);
        
        // Map index to objet property based on CardBuilder order
        // 0=nom, 1=numero, 2=tags, 3=description, 4=effet, 5=prix, 6=poids
        const objetSections = ['nom', 'numero', 'tags', 'description', 'effet', 'prix', 'poids'];
        const objetEditSection = objetSections[currentIndex] || 'description';
        
        return {
          contentType: 'objet',
          itemIdentifier: objetName,
          categoryName: categoryName,
          property: 'html',
          editType: 'html',
          editSection: objetEditSection,
          config: window.ContentTypes.objet,
          element: editableElement,
          container: element
        };
      }
      
      // Check if we're in a class page (before static pages!)
      // IMPORTANT: Exclude static pages even if they have data-page-title
      const classArticle = element.closest('article[data-page-title]:not([data-static-page="true"])');
      if (classArticle) {
        const className = classArticle.dataset.pageTitle;
        
        // Check if we're editing a subclass (look for subclass card)
        const subclassCard = element.closest('.card[data-subclass-name]');
        if (subclassCard) {
          // Determine what part of the subclass we're editing
          let subclassEditSection = 'content';
          
          const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
          
          if (editableElement) {
            const parentSection = editableElement.closest('.editable-section');
            
            // Use index-based detection for subclasses
            const subclassCard = editableElement.closest('.card[data-subclass-name]');
            const allEditables = subclassCard ? Array.from(subclassCard.querySelectorAll('.editable')) : [];
            const currentIndex = allEditables.indexOf(editableElement);
            
            // Map index to property based on subclass structure  
            // UPDATED ORDER: Index 0 = nom (title), Index 1 = description, Index 2 = base (stats), Index 3 = progression, Index 4+ = capacites
            if (element.closest('.stats-grid') || currentIndex === 2) {
              subclassEditSection = 'base';
            } else if (currentIndex === 0) {
              subclassEditSection = 'nom';
            } else if (currentIndex === 1) {
              subclassEditSection = 'description';
            } else if (currentIndex === 3) {
              subclassEditSection = 'progression';  
            } else if (currentIndex >= 4) {
              subclassEditSection = 'capacites';
            }
          }
          
          return {
            contentType: 'subclass',
            itemIdentifier: subclassCard.dataset.subclassName,
            categoryName: className,
            property: 'html',
            editType: 'html',
            editSection: subclassEditSection,
            config: window.ContentTypes.subclass,
            element: element.classList.contains('editable-section') ? element.querySelector('.editable') : element,
            container: element
          };
        }
        
        // Otherwise it's a class - determine what part of the class we're editing
        let classEditSection = 'content';
        
        // More specific detection based on parent elements and content
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        
        if (editableElement) {
          const parentCard = editableElement.closest('.card');
          const parentSection = editableElement.closest('.editable-section');
          
          // Use index-based detection instead of content analysis
          const classArticle = editableElement.closest('article[data-page-title]');
          const allEditables = classArticle ? Array.from(classArticle.querySelectorAll('.editable')) : [];
          const currentIndex = allEditables.indexOf(editableElement);
          
          // Map index to property based on class structure
          // Index 0 = resume (first editable in class)
          // Index 1+ = capacites (subsequent editables are class capabilities)
          if (currentIndex === 0) {
            classEditSection = 'resume';
          } else if (currentIndex >= 1) {
            classEditSection = 'capacites';
          }
        }
        
        return {
          contentType: 'class',
          itemIdentifier: className,
          categoryName: null,
          property: 'html',
          editType: 'html',
          editSection: classEditSection,
          config: window.ContentTypes.class,
          element: element.classList.contains('editable-section') ? element.querySelector('.editable') : element,
          container: element
        };
      }
      
      // Check if we're editing a category description (spell/don category pages)
      const editableSection = element.closest('.editable-section[data-section-type*="-category-description"]');
      if (editableSection) {
        const sectionType = editableSection.dataset.sectionType;
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const editSection = editableElement ? editableElement.dataset.editSection : '';
        
        // Determine the category type (spell/don/etc) and category name
        let contentType = 'spell'; // default
        if (sectionType.includes('spell')) {
          contentType = 'spell';
        } else if (sectionType.includes('don')) {
          contentType = 'don';
        }
        
        return {
          contentType: 'category',
          itemIdentifier: editSection, // This is the category name
          categoryName: editSection,
          property: 'description',
          editType: 'html',
          editSection: 'description',
          categoryType: contentType,
          config: window.ContentTypes[contentType],
          element: editableElement,
          container: element
        };
      }
      
      // Check if we're in a static page (LAST, as fallback)
      // Now we include ALL static pages, regardless of data-page-title
      const staticPageArticle = element.closest('article[data-static-page="true"]');
      if (staticPageArticle) {
        const pageName = staticPageArticle.dataset.page;
        
        // Enhanced page detection with ID-based fallback
        let actualPageName = pageName;
        const elementEditSection = element.dataset?.editSection || 'none';
        
        // If the element's edit section contains a page prefix, use that instead
        if (elementEditSection !== 'none' && elementEditSection.includes('-')) {
          const possiblePageId = elementEditSection.split('-')[0];
          // Check if this matches a known static page
          if (window.STATIC_PAGES && window.STATIC_PAGES[possiblePageId]) {
            actualPageName = possiblePageId;
          }
        }
        
        // Use the corrected page name
        const finalPageName = actualPageName;
        
        // Use index-based detection for static page sections
        const allEditables = Array.from(staticPageArticle.querySelectorAll('.editable'));
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const currentIndex = allEditables.indexOf(editableElement);
        
        // For static pages, use the actual edit section from the element's data attribute
        const actualEditSection = elementEditSection !== 'none' ? elementEditSection : `section-${currentIndex}`;
        
        return {
          contentType: 'staticPage',
          itemIdentifier: finalPageName,  // Use corrected page name
          categoryName: null,
          property: 'html',
          editType: 'html',
          editSection: actualEditSection,  // Use actual edit section ID
          config: window.ContentTypes.staticPage,
          element: editableElement,
          container: element
        };
      }
      
      // Default fallback
      return {
        contentType: 'unknown',
        itemIdentifier: editSection || 'content',
        categoryName: null,
        property: 'html',
        editType: 'html',
        editSection,
        config: { fields: {} },
        element: element.classList.contains('editable-section') ? element.querySelector('.editable') : element,
        container: element
      };
    }

    parseTagsEditContext(element, editSection) {
      // Check if we're in an object card
      const objetCard = element.closest('.card[data-objet-name]');
      if (objetCard) {
        const objetName = objetCard.dataset.objetName;
        const categoryName = objetCard.dataset.categoryName;
        
        return {
          contentType: 'objet',
          itemIdentifier: objetName,
          categoryName: categoryName,
          property: 'tags',
          editType: 'tags',
          editSection: editSection,
          config: window.ContentTypes.objet,
          element: element.classList.contains('editable') ? element : element.querySelector('.editable'),
          container: element
        };
      }
      
      return null;
    }

    // Start editing session
    startEdit(element) {
      console.log('🔍 DEBUG: startEdit called with element:', element);
      const context = this.parseEditContext(element);
      console.log('🔍 DEBUG: parseEditContext returned:', context);
      if (!context) {
        console.log('🔍 DEBUG: No context found, aborting edit');
        return false;
      }

      if (this.currentEditSession) {
        this.saveCurrentEdit();
      }

      this.currentEditSession = {
        ...context,
        originalContent: context.element.innerHTML,
        startTime: Date.now()
      };

      // Special handling for tags editing
      if (context.editType === 'tags') {
        console.log('🔍 DEBUG: Detected tags editing, calling makeTagsEditable');
        this.makeTagsEditable(context.element, context.container);
      } else {
        console.log('🔍 DEBUG: Standard editing, calling makeElementEditable');
        this.makeElementEditable(context.element, context.container);
      }
      return true;
    }

    makeElementEditable(editableElement, container) {
      const originalHtml = editableElement.innerHTML;
      container.dataset.originalContent = originalHtml;
      container.dataset.editing = 'true';

      // Decode any encoded HTML before showing for editing
      const decodedHtml = this.decodeHtmlEntities(originalHtml);
      editableElement.textContent = decodedHtml;
      editableElement.contentEditable = true;
      editableElement.style.cssText += `
        background-color: rgba(255, 255, 0, 0.1);
        border: 1px dashed var(--bronze);
        border-radius: 4px;
        padding: 4px;
        font-family: monospace;
        white-space: pre-wrap;
      `;
      editableElement.focus();

      const range = document.createRange();
      range.selectNodeContents(editableElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    makeTagsEditable(editableElement, container) {
      console.log('🔍 DEBUG: makeTagsEditable called');
      console.log('🔍 DEBUG: editableElement:', editableElement);
      console.log('🔍 DEBUG: container:', container);
      console.log('🔍 DEBUG: currentEditSession:', this.currentEditSession);
      
      const originalHtml = editableElement.innerHTML;
      container.dataset.originalContent = originalHtml;
      container.dataset.editing = 'true';

      // Get current tags from the object
      const objetName = this.currentEditSession.itemIdentifier;
      console.log('🔍 DEBUG: objetName:', objetName);
      
      const objet = window.OBJETS?.objets?.find(obj => obj.nom === objetName);
      console.log('🔍 DEBUG: found objet:', objet);
      
      const currentTags = objet?.tags || [];
      const availableTags = window.ContentTypes.objet.filterConfig.availableTags;
      console.log('🔍 DEBUG: currentTags:', currentTags);
      console.log('🔍 DEBUG: availableTags:', availableTags);

      // Create and show modal instead of inline editor
      this.showTagsModal(objetName, currentTags, availableTags);
    }

    showTagsModal(objetName, currentTags, availableTags) {
      console.log('🔍 DEBUG: showTagsModal called for object:', objetName);
      console.log('🔍 DEBUG: currentTags:', currentTags);
      console.log('🔍 DEBUG: availableTags:', availableTags);
      
      // Remove any existing tags modal
      const existingModal = document.querySelector('#tagsEditModal');
      if (existingModal) {
        console.log('🔍 DEBUG: Removing existing modal');
        existingModal.remove();
      }

      // Log DOM structure before creating modal
      console.log('🔍 DEBUG: Current body children count:', document.body.children.length);
      console.log('🔍 DEBUG: Body z-index elements:', Array.from(document.body.children).map(el => ({
        tagName: el.tagName,
        className: el.className,
        zIndex: window.getComputedStyle(el).zIndex,
        position: window.getComputedStyle(el).position
      })));

      // Use native HTML5 dialog element for proper z-index handling
      const modal = document.createElement('dialog');
      modal.id = 'tagsEditModal';
      modal.style.cssText = `
        max-width: 500px !important;
        width: 90% !important;
        padding: 0 !important;
        border: none !important;
        border-radius: 12px !important;
        background: transparent !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
      `;
      
      console.log('🔍 DEBUG: Created dialog element:', modal);

      const checkboxesHTML = availableTags.map(tag => `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0; padding: 0.5rem; background: #f5f5f5; border-radius: 8px;">
          <input 
            type="checkbox" 
            id="modal-tag-${tag}" 
            value="${tag}" 
            ${currentTags.includes(tag) ? 'checked' : ''}
            style="margin: 0;"
          >
          <label for="modal-tag-${tag}" style="flex: 1; cursor: pointer; font-weight: 500;">
            <span style="background: #8B4513; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em; margin-right: 0.5rem;">${tag}</span>
            ${tag}
          </label>
        </div>
      `).join('');

      modal.innerHTML = `
        <div style="
          background: white; 
          border-radius: 12px; 
          padding: 1.5rem; 
          border: 3px solid #8B4513;
          font-family: inherit;
          font-size: 16px;
          color: #333;
        ">
          <h3 style="margin: 0 0 1rem 0; color: #8B4513; font-size: 1.2em;">🏷️ Éditer les tags de "${objetName}"</h3>
          <p style="margin: 0 0 1rem 0; color: #666; font-size: 0.9em;">Sélectionnez les tags à assigner à cet objet :</p>
          
          <div id="tagsCheckboxes" style="margin: 1rem 0;">
            ${checkboxesHTML}
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn-cancel-tags-modal" style="
              background: #666; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 6px; 
              cursor: pointer;
              font-weight: 500;
              font-size: 14px;
            ">
              ❌ Annuler
            </button>
            <button type="button" class="btn-save-tags-modal" style="
              background: #8B4513; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 6px; 
              cursor: pointer;
              font-weight: 500;
              font-size: 14px;
            ">
              💾 Sauvegarder
            </button>
          </div>
        </div>
      `;

      // Append to body and show modal using native dialog API
      console.log('🔍 DEBUG: Adding modal to body');
      document.body.appendChild(modal);
      
      console.log('🔍 DEBUG: Modal added to DOM, calling showModal()');
      console.log('🔍 DEBUG: Modal computed styles before showModal:', {
        display: window.getComputedStyle(modal).display,
        position: window.getComputedStyle(modal).position,
        zIndex: window.getComputedStyle(modal).zIndex,
        visibility: window.getComputedStyle(modal).visibility
      });
      
      // Use showModal() for proper top-level display
      try {
        modal.showModal();
        console.log('🔍 DEBUG: showModal() called successfully');
        
        console.log('🔍 DEBUG: Modal computed styles after showModal:', {
          display: window.getComputedStyle(modal).display,
          position: window.getComputedStyle(modal).position,
          zIndex: window.getComputedStyle(modal).zIndex,
          visibility: window.getComputedStyle(modal).visibility
        });
        
        console.log('🔍 DEBUG: Modal bounding rect:', modal.getBoundingClientRect());
        
        // Log all body children with their z-index after modal is shown
        console.log('🔍 DEBUG: All body children after modal shown:', Array.from(document.body.children).map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          zIndex: window.getComputedStyle(el).zIndex,
          position: window.getComputedStyle(el).position,
          display: window.getComputedStyle(el).display
        })));
        
      } catch (error) {
        console.error('🔍 DEBUG: Error calling showModal():', error);
      }

      // Set up event handlers
      modal.querySelector('.btn-save-tags-modal').addEventListener('click', () => {
        this.saveTagsFromModal(modal);
      });

      modal.querySelector('.btn-cancel-tags-modal').addEventListener('click', () => {
        this.cancelTagsModal(modal);
      });

      // Native dialog handles backdrop clicks and ESC automatically
      modal.addEventListener('cancel', (e) => {
        this.cancelTagsModal(modal);
      });

      // Close on backdrop click (for dialog elements)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.cancelTagsModal(modal);
        }
      });
    }

    saveTagsFromModal(modal) {
      if (!this.currentEditSession) return false;

      const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
      const selectedTags = Array.from(checkboxes).map(cb => cb.value);

      if (selectedTags.length === 0) {
        alert('Veuillez sélectionner au moins un tag');
        return false;
      }

      // Update the object data
      const objetName = this.currentEditSession.itemIdentifier;
      const objet = window.OBJETS?.objets?.find(obj => obj.nom === objetName);
      
      if (objet) {
        objet.tags = selectedTags;
        
        // Update the display
        const tagsDisplay = selectedTags.map(tag => 
          `<span class="tag-chip" style="background: var(--bronze); color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em; margin-right: 4px;">${tag}</span>`
        ).join('');
        
        // Restore the element and update its content
        this.resetEditingState(this.currentEditSession.container);
        this.restoreElementContent(this.currentEditSession, tagsDisplay);
        
        // Save to storage
        EventBus.emit(Events.STORAGE_SAVE);
        
        // Close modal and clear edit session
        modal.close();
        modal.remove();
        this.currentEditSession = null;
        
        // Show success notification
        JdrApp.modules.ui.showNotification(`🏷️ Tags mis à jour : ${selectedTags.join(', ')}`, 'success');
        
        return true;
      }
      
      return false;
    }

    cancelTagsModal(modal) {
      // Close modal without saving
      modal.close();
      modal.remove();
      
      // Cancel the edit session
      this.cancelCurrentEdit();
    }

    // Save current editing session
    saveCurrentEdit() {
      if (!this.currentEditSession) return false;

      const session = this.currentEditSession;
      // Get the edited HTML source from textContent (user edited the raw HTML)
      const newContent = session.element.textContent.trim();
      const normalizedContent = this.normalizeHTMLContent(newContent);

      // Reset editing state first to avoid interfering with content restoration
      this.resetEditingState(session.container);

      if (normalizedContent !== session.originalContent) {
        const success = this.saveContent(session, normalizedContent);
        if (success) {
          // Convert back from text to rendered HTML
          this.restoreElementContent(session, normalizedContent);
          
          EventBus.emit(Events.CONTENT_UPDATE, {
            contentType: session.contentType,
            itemIdentifier: session.itemIdentifier,
            property: session.property,
            value: normalizedContent
          });
        } else {
          // If save failed, restore original content
          this.restoreElementContent(session, session.originalContent);
        }
      } else {
        // Even if no changes, restore HTML rendering
        this.restoreElementContent(session, session.originalContent);
      }

      this.currentEditSession = null;
      return true;
    }

    // Update content in data structure - unified method for all content types
    updateContentInDataStructure(session, content) {
      try {
        switch (session.contentType) {
          case 'spell':
            return this.updateSpellData(session, content);
          case 'don':
            return this.updateDonData(session, content);
          case 'objet':
            return this.updateObjetData(session, content);
          case 'subclass':
            return this.updateSubclassData(session, content);
          case 'class':
            return this.updateClassData(session, content);
          case 'staticPage':
            return this.updateStaticPageData(session, content);
          default:
            console.error('Unknown content type for update:', session.contentType);
            return false;
        }
      } catch (error) {
        console.error('Error updating content:', error, session);
        return false;
      }
    }

    // Update spell data
    updateSpellData(session, content) {
      const category = window.SORTS?.find(cat => cat.nom === session.categoryName);
      if (!category) return false;
      
      const spell = category.sorts?.find(s => s.nom === session.itemIdentifier);
      if (!spell) return false;
      
      spell[session.editSection] = content;
      return true;
    }

    // Update don data
    updateDonData(session, content) {
      const category = window.DONS?.find(cat => cat.nom === session.categoryName);
      if (!category) return false;
      
      const don = category.dons?.find(d => d.nom === session.itemIdentifier);
      if (!don) return false;
      
      don[session.editSection] = content;
      return true;
    }

    // Update objet data
    updateObjetData(session, content) {
      const objet = window.OBJETS?.objets?.find(o => o.nom === session.itemIdentifier);
      if (!objet) return false;
      
      objet[session.editSection] = content;
      return true;
    }

    // Update subclass data
    updateSubclassData(session, content) {
      const classe = window.CLASSES?.find(c => c.nom === session.categoryName);
      if (!classe) return false;
      
      const subclass = classe.sousClasses?.find(sc => sc.nom === session.itemIdentifier);
      if (!subclass) return false;
      
      subclass[session.editSection] = content;
      return true;
    }

    // Update class data
    updateClassData(session, content) {
      const classe = window.CLASSES?.find(c => c.nom === session.itemIdentifier);
      if (!classe) return false;
      
      classe[session.editSection] = content;
      return true;
    }

    // Update static page data
    updateStaticPageData(session, content) {
      const pageKey = session.pageId;
      const pageData = window.STATIC_PAGES?.[pageKey];
      
      if (!pageData) return false;
      
      // Handle page title
      if (session.editSection === 'page-title') {
        pageData.title = content;
        return true;
      }
      
      // Handle sections
      return this.updateStaticPageSection(pageData, session, content);
    }

    // Save content using unified system
    saveContent(session, content) {
      try {
        // Determine which JSON category to save to
        let jsonCategory;
        
        switch (session.contentType) {
          case 'spell':
            jsonCategory = 'SORTS';
            break;
          case 'don':
            jsonCategory = 'DONS';
            break;
          case 'class':
            jsonCategory = 'CLASSES';
            break;
          case 'subclass':
            jsonCategory = 'CLASSES';  // Subclasses are stored within CLASSES
            break;
          case 'category':
            // Category descriptions can be in SORTS or DONS, determine from categoryType
            jsonCategory = session.categoryType === 'don' ? 'DONS' : 'SORTS';
            break;
          case 'objet':
            jsonCategory = 'OBJETS';
            break;
          case 'staticPage':
          case 'generic':
            jsonCategory = 'STATIC_PAGES';
            break;
          default:
            console.warn('Unknown content type:', session.contentType);
            return false;
        }
        
        return this.saveToJson(session, content, jsonCategory);
      } catch (error) {
        console.error('Save error:', error);
        return false;
      }
    }

    // Unified save method that takes a JSON category parameter
    saveToJson(session, content, jsonCategory) {
      const jsonData = window[jsonCategory];
      if (!jsonData) {
        console.error(`JSON category ${jsonCategory} not found`);
        return false;
      }


      // Generic save - find the target object and save the content
      let targetObject = null;
      
      if (session.contentType === 'spell' || session.contentType === 'don') {
        // Find in category -> items structure
        for (const category of jsonData) {
          if (category.nom === session.categoryName) {
            const itemsKey = session.contentType === 'spell' ? 'sorts' : 'dons';
            // Use index-based identification if available, fallback to name-based
            if (session.itemIndex !== undefined && session.itemIndex !== null) {
              const index = parseInt(session.itemIndex, 10);
              targetObject = category[itemsKey]?.[index];
            } else {
              targetObject = category[itemsKey]?.find(item => item.nom === session.itemIdentifier);
            }
            break;
          }
        }
      } else if (session.contentType === 'class') {
        // Find class directly
        targetObject = jsonData.find(c => c.nom === session.itemIdentifier);
      } else if (session.contentType === 'subclass') {
        // Find subclass within a class
        const parentClass = jsonData.find(c => c.nom === session.categoryName);
        if (parentClass?.sousClasses) {
          targetObject = parentClass.sousClasses.find(sc => sc.nom === session.itemIdentifier);
        }
      } else if (session.contentType === 'objet') {
        // Find object directly in the objets array
        targetObject = jsonData.objets?.find(obj => obj.nom === session.itemIdentifier);
      } else if (session.contentType === 'category') {
        // Find category by name and update its description
        targetObject = jsonData.find(category => category.nom === session.categoryName);
      } else if (session.contentType === 'staticPage' || session.contentType === 'generic') {
        return this.saveStaticPageToJson(jsonData, session, content);
      }
      
      if (targetObject) {
        targetObject[session.editSection] = content;
        return true;
      } else {
        return false;
      }
    }


    saveStaticPageToJson(jsonData, session, content) {
      const pageData = jsonData[session.itemIdentifier];
      if (!pageData?.sections) {
        console.warn('Page data or sections not found for:', session.itemIdentifier);
        return false;
      }


      // Generic search by section ID or special cases
      const updateSection = (sections) => {
        for (const section of sections) {
          // Direct ID match for content
          if (section.id === session.editSection) {
            section.content = content;
            return true;
          }
          
          // Handle title updates (ID + "-title")
          if (session.editSection.endsWith('-title')) {
            const sectionId = session.editSection.replace('-title', '');
            if (section.id === sectionId) {
              section.title = content;
              return true;
            }
          }
          
          // Handle page title
          if (session.editSection === 'page-title') {
            // Page title is stored in the page data, not sections
            // This will be handled at page level
            return false;
          }
          
          // Handle intro sections
          if (section.type === 'intro' && session.editSection === 'intro') {
            section.content = content;
            return true;
          }

          // Handle nested content arrays (for grid sections)
          if (section.content && Array.isArray(section.content)) {
            if (updateSection(section.content)) {
              return true;
            }
          }
        }
        return false;
      };

      // Special handling for page title
      if (session.editSection === 'page-title') {
        pageData.title = content;
        return true;
      }

      if (updateSection(pageData.sections)) {
        return true;
      }

      console.warn('Section not found for editSection:', session.editSection);
      return false;
    }

    // No special processing - everything is just HTML now
    processContentByType(content, fieldConfig) {
      return content;
    }

    // UNIFIED CONTENT RESTORATION - USE THIS FOR ALL CONTENT TYPES
    // This method ensures that HTML content is always properly rendered
    // and prevents HTML tags from being displayed as visible text
    restoreElementContent(session, content) {
      // IMPORTANT: Always use innerHTML to render HTML content properly
      // Never use textContent for edited content as it will show HTML tags
      session.element.innerHTML = content;
      
      // NOTE FOR DEVELOPERS: 
      // - For ANY new content type, use this method instead of direct innerHTML assignment
      // - This prevents the recurring issue of visible HTML tags after editing
      // - ALL content types (static pages, spells, classes, dons) go through this
    }

    resetEditingState(container) {
      const editableElement = container.querySelector('.editable') || container;
      
      // Standard editing cleanup (modal is handled separately)
      editableElement.contentEditable = false;
      editableElement.style.cssText = editableElement.style.cssText
        .replace(/background-color[^;]*;?/g, '')
        .replace(/border[^;]*;?/g, '')
        .replace(/padding[^;]*;?/g, '')
        .replace(/font-family[^;]*;?/g, '')
        .replace(/white-space[^;]*;?/g, '');
      
      container.dataset.editing = 'false';
      delete container.dataset.originalContent;
    }


    decodeHtmlEntities(html) {
      // Decode HTML entities step by step to prevent double-encoding
      let decoded = html
        .replace(/&amp;lt;/g, '<')  // &amp;lt; -> <
        .replace(/&amp;gt;/g, '>')  // &amp;gt; -> >
        .replace(/&lt;/g, '<')     // &lt; -> <
        .replace(/&gt;/g, '>')     // &gt; -> >
        .replace(/&quot;/g, '"')   // &quot; -> "
        .replace(/&#39;/g, "'")    // &#39; -> '
        .replace(/&amp;/g, '&');   // &amp; -> & (do this last)
      return decoded;
    }

    normalizeHTMLContent(html) {
      // First, unescape any already escaped HTML to prevent double-escaping
      let cleanHtml = html
        .replace(/&amp;lt;/g, '<')  // Handle double-escaped &amp;lt; -> &lt; -> <
        .replace(/&amp;gt;/g, '>')  // Handle double-escaped &amp;gt; -> &gt; -> >
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      // Create temp div to parse and clean the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanHtml;
      
      // Clean up any problematic div elements
      tempDiv.querySelectorAll('div').forEach(div => {
        if (div.innerHTML === '<br>' || div.innerHTML === '<br/>') {
          div.outerHTML = '<br>';
        }
      });
      
      // Return the cleaned HTML
      return tempDiv.innerHTML.trim()
        .replace(/<br\s*\/?>/gi, '<br>')
        .replace(/\u00a0/g, '&nbsp;')
        .replace(/(\w+)\s*=\s*'([^']*)'/g, '$1="$2"');
    }

    // Cancel current edit
    cancelCurrentEdit() {
      if (!this.currentEditSession) return false;

      const session = this.currentEditSession;
      // Reset editing state first to avoid interfering with content restoration
      this.resetEditingState(session.container);
      // Restore original content
      this.restoreElementContent(session, session.originalContent);
      this.currentEditSession = null;
      return true;
    }

    // Check if element is currently being edited
    isEditing(element) {
      return element.dataset.editing === 'true';
    }

    // Save all active edits
    saveAllEdits() {
      if (this.currentEditSession) {
        this.saveCurrentEdit();
      }

      // Handle any remaining editing elements
      document.querySelectorAll('[data-editing="true"]').forEach(element => {
        if (!this.isValidForEdit(element)) {
          this.resetEditingState(element);
        }
      });
    }

    isValidForEdit(element) {
      const context = this.parseEditContext(element);
      return context !== null;
    }

    // Handle tags editing context
    parseTagsEditContext(element, editSection) {
      // Check if we're in an objet card
      const objetCard = element.closest('.card[data-objet-name]');
      if (objetCard) {
        const objetName = objetCard.dataset.objetName;
        const categoryName = objetCard.dataset.categoryName;
        
        return {
          contentType: 'objet',
          itemIdentifier: objetName,
          categoryName: categoryName,
          property: 'tags',
          editType: 'tags',
          editSection: 'tags',
          config: window.ContentTypes.objet,
          element: element.classList.contains('editable-tags') ? element : element.querySelector('.editable-tags'),
          container: element
        };
      }
      
      return null;
    }

    // Main entry point for starting edit
    startEdit(element) {
      // Cancel any existing edit first
      if (this.currentEditSession) {
        this.saveCurrentEdit();
      }

      const context = this.parseEditContext(element);
      if (!context) {
        console.warn('Unable to parse edit context for element:', element);
        return false;
      }

      // Handle tags editing differently - show modal instead of inline editing
      if (context.editType === 'tags') {
        this.startTagsEdit(context);
        return true;
      }

      // Start normal inline editing
      return this.startInlineEdit(context);
    }

    // Start inline editing (for non-tags content)
    startInlineEdit(context) {
      const element = context.element;
      const container = context.container;

      // Store original content
      const originalContent = element.innerHTML;
      
      // Create edit session
      this.currentEditSession = {
        ...context,
        originalContent: originalContent
      };

      // Set up editing state
      container.dataset.editing = 'true';
      container.dataset.originalContent = originalContent;
      
      // Make element editable
      element.contentEditable = true;
      element.style.background = 'rgba(255, 255, 0, 0.1)';
      element.style.border = '2px solid var(--accent)';
      element.style.padding = '8px';
      element.style.borderRadius = '4px';
      element.style.fontFamily = 'inherit';
      element.style.whiteSpace = 'pre-wrap';
      
      // Focus and select all content
      element.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    }

    // Save current edit
    saveCurrentEdit() {
      if (!this.currentEditSession) return false;

      const session = this.currentEditSession;
      const element = session.element;
      const newContent = element.innerHTML.trim();
      
      // Normalize and clean HTML content
      const processedContent = this.normalizeHTMLContent(newContent);
      
      // Apply changes to data structure
      const success = this.updateContentInDataStructure(session, processedContent);
      
      if (success) {
        // Update display
        this.restoreElementContent(session, processedContent);
        
        // Emit storage save event
        EventBus.emit(Events.STORAGE_SAVE);
        
        // Show success notification
        if (JdrApp.modules.ui?.showNotification) {
          JdrApp.modules.ui.showNotification('💾 Modification sauvegardée', 'success');
        }
      } else {
        console.error('Failed to save edit:', session);
      }
      
      // Reset editing state
      this.resetEditingState(session.container);
      this.currentEditSession = null;
      
      return success;
    }

    // Handle tags editing by showing modal
    startTagsEdit(context) {
      // For tags, we don't do inline editing, we show a modal
      this.showTagsModal(context);
    }

    // Show tags editing modal
    showTagsModal(context) {
      // Find the object
      const allObjects = window.OBJETS?.objets || [];
      const obj = allObjects.find(o => o.nom === context.itemIdentifier);
      
      if (!obj) {
        console.error('Object not found for tags editing:', context.itemIdentifier);
        return;
      }

      // Get available tags
      const availableTags = window.ContentTypes.objet.filterConfig.availableTags || [];
      const objectTags = obj.tags || [];

      // Remove existing modal if any
      const existingModal = document.querySelector('#tagsEditModal');
      if (existingModal) {
        existingModal.remove();
      }

      // Create modal
      const modal = document.createElement('dialog');
      modal.id = 'tagsEditModal';
      modal.style.cssText = `
        max-width: 500px;
        width: 90%;
        padding: 0;
        border: none;
        border-radius: 12px;
        background: transparent;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      `;
      
      const tagsCheckboxes = availableTags.map(tag => {
        const isSelected = objectTags.includes(tag);
        return `
          <div style="display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0; padding: 0.5rem; background: var(--card); border-radius: 8px;">
            <input 
              type="checkbox" 
              id="tag-${tag}" 
              value="${tag}" 
              ${isSelected ? 'checked' : ''}
              style="margin: 0;"
            >
            <label for="tag-${tag}" style="flex: 1; cursor: pointer; font-weight: 500;">
              <span class="tag-chip" style="background: var(--bronze); color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em; margin-right: 0.5rem;">${tag}</span>
              ${tag}
            </label>
          </div>
        `;
      }).join('');

      modal.innerHTML = `
        <div style="background: var(--paper); border-radius: 12px; padding: 1.5rem; border: 2px solid var(--rule);">
          <h3 style="margin: 0 0 1rem 0; color: var(--accent-ink);">Édition des tags - ${obj.nom}</h3>
          <p style="margin: 0 0 1rem 0; color: var(--paper-muted);">Sélectionnez les tags pour cet objet :</p>
          <div id="tagsCheckboxes" style="margin: 1rem 0; max-height: 300px; overflow-y: auto;">
            ${tagsCheckboxes}
          </div>
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn" id="saveTagsBtn" style="background: var(--accent); color: white;">
              💾 Sauvegarder
            </button>
            <button class="btn modal-close" style="background: #666; color: white;">
              ❌ Annuler
            </button>
          </div>
        </div>
      `;

      // Add event listeners
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'saveTagsBtn') {
          this.saveTagsFromModal(modal, obj, context);
        } else if (e.target.classList.contains('modal-close')) {
          modal.close();
          modal.remove();
        }
      });

      // Handle dialog close events
      modal.addEventListener('cancel', () => {
        modal.close();
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.close();
          modal.remove();
        }
      });

      document.body.appendChild(modal);
      modal.showModal();
    }

    // Save tags from modal
    saveTagsFromModal(modal, obj, context) {
      // Get selected tags
      const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
      const selectedTags = Array.from(checkboxes).map(cb => cb.value);

      if (selectedTags.length === 0) {
        JdrApp.modules.ui.showNotification('❌ Veuillez sélectionner au moins un tag', 'error');
        return;
      }

      // Update object tags
      obj.tags = selectedTags;

      // Update the display immediately
      const tagDisplay = context.element;
      if (tagDisplay) {
        const tagsDisplayHTML = selectedTags.map(tag => 
          `<span class="tag-chip" style="background: var(--bronze); color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em; margin-right: 4px;">${tag}</span>`
        ).join('');
        tagDisplay.innerHTML = tagsDisplayHTML;
      }

      // Trigger save to storage
      EventBus.emit(Events.STORAGE_SAVE);
      
      // Close modal
      modal.close();
      modal.remove();
      
      JdrApp.modules.ui.showNotification(`💾 Tags sauvegardés pour "${obj.nom}"`, 'success');
    }
  }

  window.UnifiedEditor = UnifiedEditor.getInstance();

})();