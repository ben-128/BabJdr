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
      // Force reset any stuck elements FIRST
      this.forceResetAllEditingElements();
      
      const editableElement = element.classList.contains('editable-section') 
        ? element.querySelector('.editable') 
        : element;

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

      // Select element editing (for dropdowns like monster elements)
      if (editType === 'select') {
        return this.parseSelectEditContext(element, editSection);
      }

      // All legacy edit types have been migrated to 'generic'
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
        
        // Use class-based detection for spell sections to avoid index mismatches
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        
        // Detect the spell property from the element's classes or data attributes
        let spellEditSection = 'description'; // default fallback
        
        // Check for specific section classes to determine the property
        if (editableElement.classList.contains('spell-name') || editableElement.dataset.editSection === 'spell-name') {
          spellEditSection = 'nom';
        } else if (editableElement.classList.contains('spell-description') || editableElement.dataset.editSection === 'spell-description') {
          spellEditSection = 'description';
        } else if (editableElement.classList.contains('spell-prerequis') || editableElement.dataset.editSection === 'spell-prerequis') {
          spellEditSection = 'prerequis';
        } else if (editableElement.classList.contains('spell-portee') || editableElement.dataset.editSection === 'spell-portee') {
          spellEditSection = 'portee';
        } else if (editableElement.classList.contains('spell-mana') || editableElement.dataset.editSection === 'spell-mana') {
          spellEditSection = 'coutMana';
        } else if (editableElement.classList.contains('spell-temps-incantation') || editableElement.dataset.editSection === 'spell-temps-incantation') {
          spellEditSection = 'tempsIncantation';
        } else if (editableElement.classList.contains('spell-resistance') || editableElement.dataset.editSection === 'spell-resistance') {
          spellEditSection = 'resistance';
        } else if (editableElement.classList.contains('spell-effect-normal') || editableElement.dataset.editSection === 'spell-effect-normal') {
          spellEditSection = 'effetNormal';
        } else if (editableElement.classList.contains('spell-effect-critical') || editableElement.dataset.editSection === 'spell-effect-critical') {
          spellEditSection = 'effetCritique';
        }
        
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
        const objetName = objetCard.dataset.objetName;
        const categoryName = objetCard.dataset.categoryName;
        
        // Use data-edit-section detection for objet sections (more reliable than index)
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        
        // Get the edit section from data attribute and map it to property name
        let objetEditSection = 'description'; // default fallback
        
        if (editableElement?.dataset?.editSection) {
          const dataEditSection = editableElement.dataset.editSection;
          
          // Map data-edit-section to property name using editMapping
          const config = window.ContentTypes?.objet;
          objetEditSection = config?.editMapping?.[dataEditSection] || dataEditSection;
        }
        
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
      
      // Check if we're in a monster card
      const monsterCard = element.closest('.card[data-monster-name]');
      if (monsterCard) {
        const monsterName = monsterCard.dataset.monsterName;
        const categoryName = monsterCard.dataset.categoryName;
        
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        
        // Use data-item-identifier if available, otherwise fall back to monsterName
        const itemIdentifier = editableElement?.dataset?.itemIdentifier || monsterName;
        
        // Use editSection directly (new format: "monster-fieldName")
        const editSection = editableElement?.dataset?.editSection || 'abilites';
        
        return {
          contentType: 'monster',
          itemIdentifier: itemIdentifier,
          categoryName: categoryName || 'monstres',
          property: 'html',
          editType: 'html', 
          editSection: editSection,
          config: window.ContentTypes.monster,
          element: editableElement,
          container: element
        };
      }
      
      // Check if we're in a table-tresor card
      const tableTresorCard = element.closest('.card[data-table-tresor-name]');
      if (tableTresorCard) {
        const tableName = tableTresorCard.dataset.tableTresorName;
        const categoryName = tableTresorCard.dataset.categoryName;
        
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        
        // Use data-item-identifier if available, otherwise fall back to tableName
        const itemIdentifier = editableElement?.dataset?.itemIdentifier || tableName;
        
        // Use editSection directly (new format: "table-tresor-fieldName")
        const editSection = editableElement?.dataset?.editSection || 'description';
        
        return {
          contentType: 'tableTresor',
          itemIdentifier: itemIdentifier,
          categoryName: categoryName || 'tables',
          property: 'html',
          editType: 'html', 
          editSection: editSection,
          config: window.ContentTypes.tableTresor,
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
      
      // Check if we're editing a page description (unified system)
      const pageDescSection = element.closest('.editable-section[data-section-type*="-category-description"], .editable-section[data-section-type="pageDescription"]');
      if (pageDescSection) {
        const sectionType = pageDescSection.dataset.sectionType;
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const editSection = editableElement ? editableElement.dataset.editSection : '';
        
        let contentType;
        
        // Handle different types of page descriptions
        if (sectionType === 'pageDescription') {
          // For generic page descriptions, get the content type from the editable element
          const pageType = editableElement?.dataset?.pageType;
          contentType = pageType || 'collections'; // fallback to collections
        } else {
          // Extract content type from section type (e.g., "objet-category-description" -> "objet")
          contentType = sectionType.replace('-category-description', '');
        }
        
        // Use unified page description system via ContentFactory
        return {
          contentType: 'pageDescription',
          pageType: contentType, // The actual content type (spell, don, objet, collections, etc.)
          itemIdentifier: contentType,
          categoryName: null,
          property: 'description',
          editType: 'html',
          editSection: editSection,
          element: editableElement,
          container: element,
          applyEdit: (content) => {
            const success = ContentFactory.updatePageDescription(contentType, content);
            if (!success) {
              console.error(`❌ Failed to update page description for ${contentType}`);
            }
            return success;
          }
        };
      }
        
      // Check if we're editing a category description (spell/don category pages - fallback for old system)
      const categorySection = element.closest('.editable-section');
      if (categorySection && categorySection.dataset.sectionType && categorySection.dataset.sectionType.includes('category-description')) {
        const sectionType = categorySection.dataset.sectionType;
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const editSection = editableElement ? editableElement.dataset.editSection : '';
        
        // Extract content type from section type
        const contentType = sectionType.replace('-category-description', '');
        
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
      
      // Check if we're editing campaign or sub-page content (specific handling before static page fallback)
      const campaignArticle = element.closest('article[data-static-page="true"]');
      if (campaignArticle && campaignArticle.dataset.page === 'campagne') {
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const editSection = editableElement?.dataset?.editSection || '';
        
        // Handle campaign-specific edit sections
        if (editSection.startsWith('campaign-')) {
          // Parse campaign edit section: campaign-{campaignName}-{property}
          const parts = editSection.split('-');
          if (parts.length >= 3) {
            const campaignName = parts.slice(1, -1).join('-'); // Handle campaign names with hyphens
            const property = parts[parts.length - 1]; // last part is the property
            
            return {
              contentType: 'campaign',
              itemIdentifier: campaignName,
              categoryName: null,
              property: 'html',
              editType: 'html',
              editSection: property, // 'name' or 'description'
              config: window.ContentTypes.campaign,
              element: editableElement,
              container: element,
              applyEdit: (content) => {
                return this.updateCampaignData('campaign', campaignName, property, content);
              }
            };
          }
        } else if (editSection.startsWith('subpage-')) {
          // Parse sub-page edit section: subpage-{campaignName}-{subPageName}-{property}
          const parts = editSection.split('-');
          if (parts.length >= 4) {
            const campaignName = parts[1];
            const subPageName = parts.slice(2, -1).join('-'); // Handle sub-page names with hyphens
            const property = parts[parts.length - 1]; // last part is the property
            
            return {
              contentType: 'campaignSubPage',
              itemIdentifier: `${campaignName}:${subPageName}`,
              categoryName: campaignName,
              property: 'html',
              editType: 'html',
              editSection: property, // 'title' or 'content'
              config: window.ContentTypes.campaignSubPage,
              element: editableElement,
              container: element,
              applyEdit: (content) => {
                return this.updateCampaignData('subpage', campaignName, property, content, subPageName);
              }
            };
          }
        }
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
      
      // Check if we're in a monster card
      const monsterCard = element.closest('.card[data-monster-name]');
      if (monsterCard) {
        const monsterName = monsterCard.dataset.monsterName;
        const categoryName = monsterCard.dataset.categoryName;
        
        return {
          contentType: 'monster',
          itemIdentifier: monsterName,
          categoryName: categoryName || 'monstres',
          property: 'tags',
          editType: 'tags',
          editSection: editSection,
          config: window.ContentTypes.monster,
          element: element.classList.contains('editable') ? element : element.querySelector('.editable'),
          container: element
        };
      }
      
      return null;
    }

    parseSelectEditContext(element, editSection) {
      // Check if we're in a monster card
      const monsterCard = element.closest('.card[data-monster-name]');
      if (monsterCard) {
        const monsterName = monsterCard.dataset.monsterName;
        const categoryName = monsterCard.dataset.categoryName;
        
        return {
          contentType: 'monster',
          itemIdentifier: monsterName,
          categoryName: categoryName || 'monstres',
          property: 'element',
          editType: 'select',
          editSection: editSection,
          config: window.ContentTypes.monster,
          element: element,
          container: element.closest('.monster-element-section')
        };
      }
      
      // Check if we're in a spell card
      const spellCard = element.closest('.card[data-spell-name]');
      if (spellCard) {
        const spellName = spellCard.dataset.spellName;
        const spellIndex = spellCard.dataset.spellIndex;
        const categoryName = spellCard.dataset.categoryName;
        
        return {
          contentType: 'spell',
          itemIdentifier: spellName,
          itemIndex: spellIndex,
          categoryName: categoryName,
          property: 'element',
          editType: 'select',
          editSection: editSection,
          config: window.ContentTypes.spell,
          element: element,
          container: element.closest('.spell-element-section')
        };
      }
      
      return null;
    }

    makeElementEditable(editableElement, container) {
      const originalHtml = editableElement.innerHTML;
      container.dataset.originalContent = originalHtml;
      container.dataset.editing = 'true';

      // Decode any encoded HTML before showing for editing
      const decodedHtml = this.decodeHtmlEntities(originalHtml);
      editableElement.innerHTML = decodedHtml;
      editableElement.contentEditable = true;
      editableElement.style.cssText += `
        background-color: rgba(255, 255, 0, 0.1);
        border: 1px dashed var(--bronze);
        border-radius: 4px;
        padding: 4px;
        font-family: monospace;
        white-space: pre-wrap;
      `;

      // Add editing controls toolbar
      this.addEditingControls(container, editableElement);

      editableElement.focus();

      const range = document.createRange();
      range.selectNodeContents(editableElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    makeTagsEditable(editableElement, container) {
      
      const originalHtml = editableElement.innerHTML;
      container.dataset.originalContent = originalHtml;
      container.dataset.editing = 'true';

      // Get current tags from the object
      const objetName = this.currentEditSession.itemIdentifier;
      
      const objet = window.OBJETS?.objets?.find(obj => obj.nom === objetName);
      
      const currentTags = objet?.tags || [];
      const availableTags = window.ContentTypes.objet.filterConfig.availableTags;

      // Create and show modal instead of inline editor
      this.showTagsModal(objetName, currentTags, availableTags);
    }

    showTagsModal(objetName, currentTags, availableTags) {
      // Remove any existing tags modal
      const existingModal = document.querySelector('#tagsEditModal');
      if (existingModal) {
        existingModal.remove();
      }

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
      document.body.appendChild(modal);

      // Use showModal() for proper top-level display
      try {
        modal.showModal();
      } catch (error) {
        console.error('Error calling showModal():', error);
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

      // Update data based on content type
      const itemName = this.currentEditSession.itemIdentifier;
      let targetItem = null;
      
      if (this.currentEditSession.contentType === 'objet') {
        // Update the object data
        targetItem = window.OBJETS?.objets?.find(obj => obj.nom === itemName);
      } else if (this.currentEditSession.contentType === 'monster') {
        // Update the monster data
        targetItem = window.MONSTRES?.find(monster => monster.nom === itemName);
      } else if (this.currentEditSession.contentType === 'tableTresor') {
        // Update the table tresor data
        targetItem = window.TABLES_TRESORS?.tables?.find(table => table.nom === itemName);
      }
      
      if (targetItem) {
        targetItem.tags = selectedTags;
        
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
      // Get the edited HTML content from innerHTML (user edited the rendered content)
      const newContent = session.element.innerHTML.trim();
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
          case 'monster':
            return this.updateMonsterData(session, content);
          case 'category':
            return this.updateCategoryData(session, content);
          case 'subclass':
            return this.updateSubclassData(session, content);
          case 'class':
            return this.updateClassData(session, content);
          case 'staticPage':
            return this.updateStaticPageData(session, content);
          case 'tableTresor':
            return this.updateTableTresorData(session, content);
          case 'pageDescription':
            return this.updatePageDescriptionData(session, content);
          case 'campaign':
            return session.applyEdit(content);
          case 'campaignSubPage':
            return session.applyEdit(content);
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
      
      // Use editMapping if available, otherwise use editSection directly
      const config = session.config || window.ContentTypes.spell;
      const propertyName = config.editMapping?.[session.editSection] || session.editSection;
      
      // If we're updating the name, we need to update the container's data-spell-name attribute
      if (propertyName === 'nom') {
        const oldName = spell.nom;
        spell[propertyName] = content;
        
        // Update the data-spell-name attribute on the card container
        const spellCard = session.container.closest('.card[data-spell-name]');
        if (spellCard && spellCard.dataset.spellName === oldName) {
          spellCard.dataset.spellName = content;
        }
      } else {
        spell[propertyName] = content;
      }
      
      return true;
    }

    // Update don data
    updateDonData(session, content) {
      const category = window.DONS?.find(cat => cat.nom === session.categoryName);
      if (!category) return false;
      
      const don = category.dons?.find(d => d.nom === session.itemIdentifier);
      if (!don) return false;
      
      // Use editMapping if available, otherwise use editSection directly
      const config = session.config || window.ContentTypes.don;
      const propertyName = config.editMapping?.[session.editSection] || session.editSection;
      
      // If we're updating the name, we need to update the container's data-don-name attribute
      if (propertyName === 'nom') {
        const oldName = don.nom;
        don[propertyName] = content;
        
        // Update the data-don-name attribute on the card container
        const donCard = session.container.closest('.card[data-don-name]');
        if (donCard && donCard.dataset.donName === oldName) {
          donCard.dataset.donName = content;
        }
      } else {
        don[propertyName] = content;
      }
      
      return true;
    }

    // Update objet data
    updateObjetData(session, content) {
      const objet = window.OBJETS?.objets?.find(o => o.nom === session.itemIdentifier);
      if (!objet) return false;
      
      // Use editMapping if available, otherwise use editSection directly
      const config = session.config || window.ContentTypes.objet;
      const propertyName = config.editMapping?.[session.editSection] || session.editSection;
      
      
      // If we're updating the name, we need to update the container's data-objet-name attribute
      if (propertyName === 'nom') {
        const oldName = objet.nom;
        objet[propertyName] = content;
        
        // Update the data-objet-name attribute on the card container
        const objetCard = session.container.closest('.card[data-objet-name]');
        if (objetCard && objetCard.dataset.objetName === oldName) {
          objetCard.dataset.objetName = content;
        }
      } else {
        objet[propertyName] = content;
      }
      
      return true;
    }

    // Update monster data
    updateMonsterData(session, content) {
      const monster = window.MONSTRES?.find(m => m.nom === session.itemIdentifier);
      if (!monster) {
        console.error('Monster not found:', session.itemIdentifier, 'Available monsters:', window.MONSTRES?.map(m => m.nom));
        return false;
      }
      
      // Use editMapping if available, otherwise use editSection directly
      const config = session.config || window.ContentTypes.monster;
      const propertyName = config.editMapping?.[session.editSection] || session.editSection;
      
      // Backup current value for rollback capability
      const originalValue = monster[propertyName];
      
      try {
        // If we're updating the name, we need to update the container's data-monster-name attribute
        if (propertyName === 'nom') {
          const oldName = monster.nom;
          monster[propertyName] = content;
          
          // Update the data-monster-name attribute on the card container
          const monsterCard = session.container.closest('.card[data-monster-name]');
          if (monsterCard && monsterCard.dataset.monsterName === oldName) {
            monsterCard.dataset.monsterName = content;
          }
        } else {
          // Update the monster property
          monster[propertyName] = content;
        }
        
        // Force synchronization using ContentFactory to prevent data reversion
        const contentFactory = window.ContentFactory?.getInstance ? window.ContentFactory.getInstance() : null;
        if (contentFactory && contentFactory.updateItem) {
          // Use ContentFactory to ensure proper data synchronization
          contentFactory.updateItem('monster', null, monster.nom, propertyName, content);
        }
        
        // Additional safety: ensure image mapping is maintained
        if (propertyName === 'image' && JdrApp.modules.images) {
          const imageKey = `monster:${monster.nom}`;
          JdrApp.modules.images.setImage(imageKey, content);
        }
        
        // Create backup for crash recovery
        this.createMonsterBackup(monster);
        
        return true;
        
      } catch (error) {
        // Rollback on error
        console.error('❌ Error updating monster, rolling back:', error);
        monster[propertyName] = originalValue;
        return false;
      }
    }

    // Update table tresor data
    updateTableTresorData(session, content) {
      const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === session.itemIdentifier);
      if (!table) {
        console.error('Table tresor not found:', session.itemIdentifier, 'Available tables:', window.TABLES_TRESORS?.tables?.map(t => t.nom));
        return false;
      }
      
      // Use editMapping if available, otherwise use editSection directly
      const config = session.config || window.ContentTypes.tableTresor;
      const propertyName = config.editMapping?.[session.editSection] || session.editSection;
      
      // Backup current value for rollback capability
      const originalValue = table[propertyName];
      
      try {
        // If we're updating the name, we need to update the container's data-table-tresor-name attribute
        if (propertyName === 'nom') {
          const oldName = table.nom;
          table[propertyName] = content;
          
          // Update the data-table-tresor-name attribute on the card container
          const tableTresorCard = session.container.closest('.card[data-table-tresor-name]');
          if (tableTresorCard && tableTresorCard.dataset.tableTresorName === oldName) {
            tableTresorCard.dataset.tableTresorName = content;
            
            // Also update the button that uses the table name
            const addFourchetteBtn = tableTresorCard.querySelector('.table-tresor-add-fourchette');
            if (addFourchetteBtn && addFourchetteBtn.dataset.tableTresorName === oldName) {
              addFourchetteBtn.dataset.tableTresorName = content;
            }
          }
          
          // If we're updating the name, we need to update the session itemIdentifier
          // to prevent future saves from failing with the old name
          if (this.currentEditSession && this.currentEditSession.itemIdentifier === originalValue) {
            this.currentEditSession.itemIdentifier = content;
          }
        } else {
          // Update the table property
          table[propertyName] = content;
        }
        
        // Force synchronization using ContentFactory to prevent data reversion
        const contentFactory = window.ContentFactory?.getInstance ? window.ContentFactory.getInstance() : null;
        if (contentFactory && contentFactory.updateItem) {
          // Use ContentFactory to ensure proper data synchronization
          contentFactory.updateItem('tableTresor', 'tables', table.nom, propertyName, content);
        }
        
        return true;
        
      } catch (error) {
        // Rollback on error
        console.error('❌ Error updating table tresor, rolling back:', error);
        table[propertyName] = originalValue;
        return false;
      }
    }

    // Update page description data (unified system)
    updatePageDescriptionData(session, content) {
      // Use the ContentFactory method that already handles the configuration
      const success = ContentFactory.updatePageDescription(session.pageType, content);
      
      if (success) {
        return true;
      } else {
        console.error(`❌ Failed to update page description for ${session.pageType}`);
        return false;
      }
    }

    // Update category data (generic for all category types)
    updateCategoryData(session, content) {
      // Handle different category types generically
      if (session.categoryType === 'don') {
        const category = window.DONS?.find(cat => cat.nom === session.categoryName);
        if (category && session.editSection === 'description') {
          category.description = content;
          return true;
        }
      } else if (session.categoryType === 'spell') {
        const category = window.SORTS?.find(cat => cat.nom === session.categoryName);
        if (category && session.editSection === 'description') {
          category.description = content;
          return true;
        }
      }
      
      // Simple fallback - if we're editing description and nothing else matched, 
      // and we have OBJETS, assume it's the objects category
      if (session.editSection === 'description' && window.OBJETS) {
        window.OBJETS.description = content;
        return true;
      }
      
      return false;
    }

    // Update subclass data
    updateSubclassData(session, content) {
      const classe = window.CLASSES?.find(c => c.nom === session.categoryName);
      if (!classe) return false;
      
      const subclass = classe.sousClasses?.find(sc => sc.nom === session.itemIdentifier);
      if (!subclass) return false;
      
      // Use editMapping if available, otherwise use editSection directly
      const config = session.config || window.ContentTypes.subclass;
      const propertyName = config.editMapping?.[session.editSection] || session.editSection;
      
      // If we're updating the name, we need to update the container's data-subclass-name attribute
      if (propertyName === 'nom') {
        const oldName = subclass.nom;
        subclass[propertyName] = content;
        
        // Update the data-subclass-name attribute on the card container
        const subclassCard = session.container.closest('.card[data-subclass-name]');
        if (subclassCard && subclassCard.dataset.subclassName === oldName) {
          subclassCard.dataset.subclassName = content;
        }
      } else {
        subclass[propertyName] = content;
      }
      
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
      const pageKey = session.itemIdentifier;
      const pageData = window.STATIC_PAGES?.[pageKey];
      
      if (!pageData) return false;
      
      // Handle page title
      if (session.editSection === 'page-title') {
        pageData.title = content;
        return true;
      }
      
      // Handle campaign data (special case for campaign page)
      if (pageKey === 'campagne') {
        return this.updateCampaignData(pageData, session, content);
      }
      
      // Handle sections
      return this.updateStaticPageSection(pageData, session, content);
    }

    // Update specific section in static page data
    updateStaticPageSection(pageData, session, content) {
      if (!pageData.sections) return false;
      
      const sections = pageData.sections;
      
      // Find section by ID or type
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        // Direct ID match
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
        
        // Handle intro sections
        if (section.type === 'intro' && session.editSection.includes('intro')) {
          section.content = content;
          return true;
        }
        
        // Handle card sections
        if (section.type === 'card' && section.id === session.editSection) {
          section.content = content;
          return true;
        }
      }
      
      // If no existing section found, check if we need to create one for intro
      if (session.editSection === 'intro' || session.editSection.includes('intro')) {
        const introSection = sections.find(s => s.type === 'intro');
        if (introSection) {
          introSection.content = content;
          return true;
        }
      }
      
      return false;
    }

    // Update campaign and sub-page data
    updateCampaignData(pageData, session, content) {
      const editSection = session.editSection;
      
      // Initialize subPages if not exists
      if (!pageData.subPages) {
        pageData.subPages = {};
      }
      
      // Parse edit section: campaign-{campaignName}-{field} or subpage-{campaignName}-{subPageName}-{field}
      if (editSection.startsWith('campaign-')) {
        // Format: campaign-{campaignName}-{field}
        const parts = editSection.split('-');
        if (parts.length >= 3) {
          const campaignName = parts.slice(1, -1).join('-'); // Handle campaign names with dashes
          const field = parts[parts.length - 1];
          
          if (!pageData.subPages[campaignName]) {
            pageData.subPages[campaignName] = {
              name: campaignName,
              description: 'Description de la campagne',
              subPages: {}
            };
          }
          
          if (field === 'name') {
            // If renaming campaign, we need to move the entire campaign data
            if (campaignName !== content && !pageData.subPages[content]) {
              pageData.subPages[content] = pageData.subPages[campaignName];
              pageData.subPages[content].name = content;
              delete pageData.subPages[campaignName];
            }
          } else if (field === 'description') {
            pageData.subPages[campaignName].description = content;
          }
          
          return true;
        }
      } else if (editSection.startsWith('subpage-')) {
        // Format: subpage-{campaignName}-{subPageName}-{field}
        const parts = editSection.split('-');
        if (parts.length >= 4) {
          const campaignName = parts[1];
          const subPageName = parts.slice(2, -1).join('-'); // Handle sub-page names with dashes
          const field = parts[parts.length - 1];
          
          if (!pageData.subPages[campaignName]) {
            return false; // Campaign doesn't exist
          }
          
          if (!pageData.subPages[campaignName].subPages) {
            pageData.subPages[campaignName].subPages = {};
          }
          
          if (!pageData.subPages[campaignName].subPages[subPageName]) {
            pageData.subPages[campaignName].subPages[subPageName] = {
              title: subPageName,
              content: '<p>Contenu de la sous-page...</p>'
            };
          }
          
          if (field === 'title') {
            // If renaming sub-page, we need to move the entire sub-page data
            if (subPageName !== content && !pageData.subPages[campaignName].subPages[content]) {
              pageData.subPages[campaignName].subPages[content] = pageData.subPages[campaignName].subPages[subPageName];
              pageData.subPages[campaignName].subPages[content].title = content;
              delete pageData.subPages[campaignName].subPages[subPageName];
            }
          } else if (field === 'content') {
            pageData.subPages[campaignName].subPages[subPageName].content = content;
          }
          
          return true;
        }
      }
      
      return false;
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
            // Category descriptions can be in SORTS, DONS, or OBJETS
            if (session.categoryType === 'don') {
              jsonCategory = 'DONS';
            } else if (session.categoryType === 'spell') {
              jsonCategory = 'SORTS';
            } else {
              // Default to OBJETS for other category descriptions
              jsonCategory = 'OBJETS';
            }
            break;
          case 'objet':
            jsonCategory = 'OBJETS';
            break;
          case 'monster':
            jsonCategory = 'MONSTRES';
            break;
          case 'staticPage':
          case 'generic':
            jsonCategory = 'STATIC_PAGES';
            break;
          default:
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
      } else if (session.contentType === 'monster') {
        // Find monster directly in the array
        targetObject = jsonData?.find(monster => monster.nom === session.itemIdentifier);
      } else if (session.contentType === 'tableTresor') {
        // Find table tresor directly in the array
        targetObject = jsonData?.tables?.find(table => table.nom === session.itemIdentifier);
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
        console.error('Page data or sections not found for:', session.itemIdentifier);
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

      console.error('Section not found for editSection:', session.editSection);
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
      // Simplified cleanup to prevent stack overflow
      editableElement.style.background = '';
      editableElement.style.border = '';
      editableElement.style.padding = '';
      editableElement.style.fontFamily = '';
      editableElement.style.whiteSpace = '';
      
      // Reset both container and editable element attributes
      container.dataset.editing = 'false';
      delete container.dataset.originalContent;
      
      // Also reset on the editable element itself in case it's the same
      if (editableElement !== container) {
        editableElement.dataset.editing = 'false';
        delete editableElement.dataset.originalContent;
      }
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
      // SIMPLIFIED VERSION to prevent infinite loops
      // Just return the trimmed HTML without complex transformations
      if (!html || typeof html !== 'string') {
        return '';
      }
      
      // Basic cleanup only - avoid complex regex chains that can loop
      let cleaned = html.trim();
      
      // Only safe, non-recursive replacements
      cleaned = cleaned.replace(/&quot;/g, '"');
      cleaned = cleaned.replace(/&#39;/g, "'");
      cleaned = cleaned.replace(/<br\s*\/?>/gi, '<br>');
      
      return cleaned;
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
      
      // Check if we're in a monster card
      const monsterCard = element.closest('.card[data-monster-name]');
      if (monsterCard) {
        const monsterName = monsterCard.dataset.monsterName;
        const categoryName = monsterCard.dataset.categoryName;
        
        const editableElement = element.classList.contains('editable-tags') ? element : element.querySelector('.editable-tags');
        
        // Use data-item-identifier if available, otherwise fall back to monsterName
        const itemIdentifier = editableElement?.dataset?.itemIdentifier || monsterName;
        
        return {
          contentType: 'monster',
          itemIdentifier: itemIdentifier,
          categoryName: categoryName || 'monstres',
          property: 'tags',
          editType: 'tags',
          editSection: 'tags',
          config: window.ContentTypes.monster,
          element: editableElement,
          container: element
        };
      }
      
      // Check if we're in a table de trésor card
      const tableTresorCard = element.closest('.card[data-table-tresor-name]');
      if (tableTresorCard) {
        const tableTresorName = tableTresorCard.dataset.tableTresorName;
        const categoryName = tableTresorCard.dataset.categoryName || 'tables';
        
        const editableElement = element.classList.contains('editable-tags') ? element : element.querySelector('.editable-tags');
        
        // Use data-item-identifier if available, otherwise fall back to tableTresorName
        const itemIdentifier = editableElement?.dataset?.itemIdentifier || tableTresorName;
        
        return {
          contentType: 'tableTresor',
          itemIdentifier: itemIdentifier,
          categoryName: categoryName,
          property: 'tags',
          editType: 'tags',
          editSection: 'tags',
          config: window.ContentTypes.tableTresor,
          element: editableElement,
          container: element
        };
      }
      
      return null;
    }

    // Force reset of all elements that might be stuck in editing mode
    forceResetAllEditingElements() {
      // Reset any elements with contenteditable=true
      const editableElements = document.querySelectorAll('[contenteditable="true"]');
      editableElements.forEach(element => {
        element.contentEditable = false;
        element.style.background = '';
        element.style.border = '';
        element.style.padding = '';
        element.style.borderRadius = '';
        element.style.fontFamily = '';
        element.style.whiteSpace = '';
      });
      
      // Reset any containers with data-editing=true
      const editingContainers = document.querySelectorAll('[data-editing="true"]');
      editingContainers.forEach(container => {
        container.dataset.editing = 'false';
        delete container.dataset.originalContent;
      });
      
      // Clear any current edit session
      this.currentEditSession = null;
    }

    // Main entry point for starting edit
    startEdit(element) {
      // Force reset of any stuck editing elements first
      this.forceResetAllEditingElements();
      
      // Cancel any existing edit first
      if (this.currentEditSession) {
        this.saveCurrentEdit();
      }

      const context = this.parseEditContext(element);
      if (!context) {
        return false;
      }

      // Handle tags editing differently - show modal instead of inline editing
      if (context.editType === 'tags') {
        this.startTagsEdit(context);
        return true;
      }

      // Handle select editing differently - show dropdown instead of inline editing
      if (context.editType === 'select') {
        this.startSelectEdit(context);
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
      
      // Decode any encoded HTML before showing for editing
      const decodedHtml = this.decodeHtmlEntities(originalContent);
      element.innerHTML = decodedHtml;
      
      // Always use modal editing for consistency
      // Force modal editing for all content types to ensure uniform behavior
      this.showHTMLEditModal(element, decodedHtml);

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
        
        // Note: Storage save is handled elsewhere to prevent loops
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

    // Show modal for editing HTML content
    showHTMLEditModal(element, htmlContent) {
      // Store the current edit session for later use
      const editSession = this.currentEditSession;
      
      const modal = document.createElement('dialog');
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 0;
        border: none;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 80vw;
        max-height: 80vh;
        z-index: 1000000 !important;
        background: transparent;
      `;

      // Créer un backdrop manuel
      const backdrop = document.createElement('div');
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999999 !important;
        backdrop-filter: blur(4px);
      `;

      modal.innerHTML = `
        <div style="background: var(--paper); border-radius: 12px; padding: 1.5rem; border: 2px solid var(--rule); max-height: 80vh; overflow-y: auto; display: flex; flex-direction: column;">
          <h3 style="margin: 0 0 1rem 0; color: var(--accent-ink); flex-shrink: 0;">Édition du contenu</h3>
          
          <div style="margin-bottom: 1rem; flex-shrink: 0;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Aperçu du rendu:</label>
            <div id="preview" style="border: 1px solid var(--rule); padding: 1rem; border-radius: 6px; background: var(--card); min-height: 60px; max-height: 150px; overflow-y: auto;">
              ${htmlContent}
            </div>
          </div>
          
          <div style="margin-bottom: 1rem; flex: 1; min-height: 0; display: flex; flex-direction: column;">
            <label for="htmlEditor" style="display: block; margin-bottom: 0.5rem; font-weight: 600; flex-shrink: 0;">Code HTML:</label>
            <textarea 
              id="htmlEditor" 
              style="width: 100%; flex: 1; min-height: 200px; padding: 1rem; border: 1px solid var(--rule); border-radius: 6px; font-family: monospace; font-size: 14px; resize: vertical;"
              placeholder="Entrez le HTML ici..."
            >${htmlContent}</textarea>
          </div>
          
          <div style="margin-bottom: 1rem; flex-shrink: 0;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
              <button id="editorElementsBtn" class="btn" style="background: #059669; color: white; font-size: 12px;">🔥 Éléments</button>
              <button id="editorStatsBtn" class="btn" style="background: #ea580c; color: white; font-size: 12px;">📊 Stats</button>
              <button id="editorEtatsBtn" class="btn" style="background: #7c2d12; color: white; font-size: 12px;">⚡ États</button>
              <button id="editorSpellLinksBtn" class="btn" style="background: #6b21a8; color: white; font-size: 12px;">🔗 Liens Sorts</button>
              <button id="editorPageLinksBtn" class="btn" style="background: #1d4ed8; color: white; font-size: 12px;">🔗 Liens Pages</button>
              <button id="editorMonsterLinksBtn" class="btn" style="background: #dc2626; color: white; font-size: 12px;">🐲 Liens Monstres</button>
              <button id="editorTreasureTablesBtn" class="btn" style="background: #b45309; color: white; font-size: 12px;">🎲 Tables Trésors</button>
            </div>
            <div style="font-size: 12px; color: var(--paper-muted); line-height: 1.4;">
              💡 <strong>Astuce:</strong> Utilisez ces boutons pour insérer rapidement des éléments, états, liens vers les sorts, les pages, les monstres et les tables de trésors dans votre contenu HTML.
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: flex-end; flex-shrink: 0;">
            <button id="cancelEdit" class="btn" style="background: #6b7280; color: white;">Annuler</button>
            <button id="saveEdit" class="btn" style="background: var(--accent); color: white;">💾 Sauvegarder</button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);
      modal.show();

      const textarea = modal.querySelector('#htmlEditor');
      const preview = modal.querySelector('#preview');
      const saveBtn = modal.querySelector('#saveEdit');
      const cancelBtn = modal.querySelector('#cancelEdit');
      const elementsBtn = modal.querySelector('#editorElementsBtn');
      const statsBtn = modal.querySelector('#editorStatsBtn');
      const etatsBtn = modal.querySelector('#editorEtatsBtn');
      const spellLinksBtn = modal.querySelector('#editorSpellLinksBtn');
      const pageLinksBtn = modal.querySelector('#editorPageLinksBtn');
      const monsterLinksBtn = modal.querySelector('#editorMonsterLinksBtn');
      const treasureTablesBtn = modal.querySelector('#editorTreasureTablesBtn');

      // Helper function to insert text at cursor position in textarea
      const insertTextAtCursor = (text) => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = textarea.value;
        
        textarea.value = currentValue.substring(0, start) + text + currentValue.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
        
        // Update preview
        try {
          preview.innerHTML = textarea.value;
        } catch (e) {
          preview.textContent = 'Aperçu invalide: ' + e.message;
        }
      };

      // Store the insertTextAtCursor function globally so modals can access it
      window.editorInsertTextAtCursor = insertTextAtCursor;

      // Toolbox buttons handlers
      if (elementsBtn) {
        elementsBtn.addEventListener('click', () => {
          if (JdrApp.modules.ui?.showElementsModal) {
            JdrApp.modules.ui.showElementsModal();
          }
        });
      }

      if (statsBtn) {
        statsBtn.addEventListener('click', () => {
          if (ModalManager?.showStatsIconsModal) {
            ModalManager.showStatsIconsModal();
          }
        });
      }

      if (etatsBtn) {
        etatsBtn.addEventListener('click', () => {
          if (JdrApp.modules.ui?.showEtatsModal) {
            JdrApp.modules.ui.showEtatsModal();
          }
        });
      }

      if (spellLinksBtn) {
        spellLinksBtn.addEventListener('click', () => {
          if (JdrApp.modules.ui?.showSpellLinksModal) {
            JdrApp.modules.ui.showSpellLinksModal();
          }
        });
      }

      if (pageLinksBtn) {
        pageLinksBtn.addEventListener('click', () => {
          if (JdrApp.modules.ui?.showPageLinksModal) {
            JdrApp.modules.ui.showPageLinksModal();
          }
        });
      }

      if (monsterLinksBtn) {
        monsterLinksBtn.addEventListener('click', () => {
          if (JdrApp.modules.ui?.showMonsterLinksModal) {
            JdrApp.modules.ui.showMonsterLinksModal();
          }
        });
      }

      // Live preview update with debounce to prevent performance issues
      let previewUpdateTimeout;
      textarea.addEventListener('input', () => {
        clearTimeout(previewUpdateTimeout);
        previewUpdateTimeout = setTimeout(() => {
          try {
            preview.innerHTML = textarea.value;
          } catch (e) {
            preview.textContent = 'Aperçu invalide: ' + e.message;
          }
        }, 300); // 300ms debounce
      });

      // Save handler
      saveBtn.addEventListener('click', () => {
        const newContent = textarea.value.trim();
        const normalizedContent = this.normalizeHTMLContent(newContent);
        
        // Update the element content
        element.innerHTML = normalizedContent;
        
        // Update in data structure using stored session
        const success = this.updateContentInDataStructure(editSession, normalizedContent);
        
        if (success) {
          EventBus.emit(Events.STORAGE_SAVE);
          if (JdrApp.modules.ui?.showNotification) {
            JdrApp.modules.ui.showNotification('💾 Modification sauvegardée', 'success');
          }
        }
        
        // Clean up
        this.resetEditingState(editSession.container);
        this.currentEditSession = null;
        window.editorInsertTextAtCursor = null;
        modal.close();
        modal.remove();
        backdrop.remove();
      });

      // Cancel handler
      cancelBtn.addEventListener('click', () => {
        this.resetEditingState(editSession.container);
        this.currentEditSession = null;
        window.editorInsertTextAtCursor = null;
        modal.close();
        modal.remove();
        backdrop.remove();
      });

      // Close on backdrop click
      backdrop.addEventListener('click', () => {
        this.resetEditingState(editSession.container);
        this.currentEditSession = null;
        window.editorInsertTextAtCursor = null;
        modal.close();
        modal.remove();
        backdrop.remove();
      });

      // Treasure tables button handler
      if (treasureTablesBtn) {
        treasureTablesBtn.addEventListener('click', () => {
          this.showTreasureTablesModal(insertTextAtCursor);
        });
      }

      // Focus textarea
      textarea.focus();
      textarea.select();
    }

    // Handle select editing by toggling display/selector visibility
    startSelectEdit(context) {
      const element = context.element;
      const container = context.container;

      // Store the current edit session
      this.currentEditSession = {
        ...context,
        originalContent: element.value // For select, we store the value, not innerHTML
      };

      // Find the display and selector sections
      const sectionContainer = element.closest('.monster-element-section, .spell-element-section');
      if (!sectionContainer) {
        return false;
      }

      const displaySection = sectionContainer.querySelector('.monster-element-display, .spell-element-display');
      const selectorSection = sectionContainer.querySelector('.monster-element-selector, .spell-element-selector');
      
      if (!displaySection || !selectorSection) {
        return false;
      }

      // Toggle visibility
      displaySection.style.display = 'none';
      selectorSection.style.display = 'block';

      // Set up change listener for the select element
      const selectElement = selectorSection.querySelector('select');
      if (selectElement) {
        selectElement.focus();
        
        // Add event listener for changes
        const changeHandler = () => {
          this.saveSelectEdit(selectElement);
          selectElement.removeEventListener('change', changeHandler);
          selectElement.removeEventListener('blur', blurHandler);
        };

        const blurHandler = () => {
          this.cancelSelectEdit(sectionContainer);
          selectElement.removeEventListener('change', changeHandler);
          selectElement.removeEventListener('blur', blurHandler);
        };

        selectElement.addEventListener('change', changeHandler);
        selectElement.addEventListener('blur', blurHandler);
      }

      return true;
    }

    // Save select edit
    saveSelectEdit(selectElement) {
      if (!this.currentEditSession) return false;

      const newValue = selectElement.value;
      const session = this.currentEditSession;

      // Update the data structure
      const success = this.updateContentInDataStructure(session, newValue);

      if (success) {
        // Update the display immediately
        this.updateElementDisplay(session, newValue);
        
        // Emit storage save event
        EventBus.emit(Events.STORAGE_SAVE);
        
        // Show success notification
        if (JdrApp.modules.ui?.showNotification) {
          JdrApp.modules.ui.showNotification('💾 Élément mis à jour', 'success');
        }
      }

      // Hide selector and show display
      this.resetSelectEdit();
      this.currentEditSession = null;
      return success;
    }

    // Cancel select edit
    cancelSelectEdit(sectionContainer) {
      this.resetSelectEdit();
      this.currentEditSession = null;
    }

    // Reset select edit UI state
    resetSelectEdit() {
      if (!this.currentEditSession) return;

      const element = this.currentEditSession.element;
      const sectionContainer = element.closest('.monster-element-section, .spell-element-section');
      if (!sectionContainer) return;

      const displaySection = sectionContainer.querySelector('.monster-element-display, .spell-element-display');
      const selectorSection = sectionContainer.querySelector('.monster-element-selector, .spell-element-selector');
      
      if (displaySection && selectorSection) {
        displaySection.style.display = 'block';
        selectorSection.style.display = 'none';
      }
    }

    // Update element display after selection change
    updateElementDisplay(session, newValue) {
      const element = session.element;
      const sectionContainer = element.closest('.monster-element-section, .spell-element-section');
      if (!sectionContainer) return;

      const displaySection = sectionContainer.querySelector('.monster-element-display, .spell-element-display');
      const badge = displaySection?.querySelector('.element-badge');
      
      if (badge) {
        // Get element icon and color
        const icon = window.ElementIcons?.[newValue] || '⚡';
        const color = window.ElementColors?.[newValue]?.color || '#666';
        
        // Update the badge content and style
        if (session.contentType === 'monster') {
          // For monsters, we need to update the complete badge styling
          const iconSpan = badge.querySelector('span:first-child');
          const textSpan = badge.querySelector('span:last-child');
          if (iconSpan && textSpan) {
            iconSpan.textContent = icon;
            textSpan.textContent = newValue;
            textSpan.style.color = color;
            
            // Update the complete badge background and border
            const hexColor = color;
            const rgbMatch = hexColor.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
            if (rgbMatch) {
              const r = parseInt(rgbMatch[1], 16);
              const g = parseInt(rgbMatch[2], 16);
              const b = parseInt(rgbMatch[3], 16);
              badge.style.background = `rgba(${r}, ${g}, ${b}, 0.1)`;
              badge.style.border = `1px solid ${hexColor}`;
            }
          }
        } else if (session.contentType === 'spell') {
          // Update spell badge
          badge.innerHTML = `${icon} ${newValue}`;
        }
      }
    }

    // Handle tags editing by showing modal
    startTagsEdit(context) {
      // For tags, we don't do inline editing, we show a modal
      this.showTagsModal(context);
    }

    // Show tags editing modal
    showTagsModal(context) {
      // Find the target item (object or monster)
      let targetItem = null;
      let availableTags = [];
      
      if (context.contentType === 'objet') {
        const allObjects = window.OBJETS?.objets || [];
        targetItem = allObjects.find(o => o.nom === context.itemIdentifier);
        availableTags = window.ContentTypes.objet.filterConfig.availableTags || [];
      } else if (context.contentType === 'monster') {
        const allMonsters = window.MONSTRES || [];
        targetItem = allMonsters.find(m => m.nom === context.itemIdentifier);
        availableTags = window.ContentTypes.monster.filterConfig.availableTags || [];
      } else if (context.contentType === 'tableTresor') {
        const allTables = window.TABLES_TRESORS?.tables || [];
        targetItem = allTables.find(t => t.nom === context.itemIdentifier);
        // Use metadata as primary source, fallback to ContentTypes config
        availableTags = window.TABLES_TRESORS?._metadata?.availableTags || 
                       window.ContentTypes.tableTresor?.filterConfig?.availableTags || [];
      }
      
      if (!targetItem) {
        console.error('Item not found for tags editing:', context.itemIdentifier, 'Type:', context.contentType);
        return;
      }

      const itemTags = targetItem.tags || [];

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
        const isSelected = itemTags.includes(tag);
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
          <h3 style="margin: 0 0 1rem 0; color: var(--accent-ink);">Édition des tags - ${targetItem.nom}</h3>
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
          this.saveTagsFromModal(modal, targetItem, context);
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

      // Update tags for the target item (works for both objects and monsters)
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

    // Create backup of monster data for recovery
    createMonsterBackup(monster) {
      try {
        if (!window.MonsterBackups) {
          window.MonsterBackups = new Map();
        }
        
        // Keep only last MAX_MONSTER_BACKUPS backups per monster
        const backupKey = monster.nom;
        const currentBackups = window.MonsterBackups.get(backupKey) || [];
        
        const backup = {
          timestamp: Date.now(),
          data: JSON.parse(JSON.stringify(monster)) // Deep copy
        };
        
        currentBackups.push(backup);
        const maxBackups = window.DEFAULT_VALUES?.MAX_MONSTER_BACKUPS || 10;
        if (currentBackups.length > maxBackups) {
          currentBackups.shift(); // Remove oldest
        }
        
        window.MonsterBackups.set(backupKey, currentBackups);
        
      } catch (error) {
        // Ignore backup failures - not critical
      }
    }

    // Recover monster from backup
    recoverMonsterFromBackup(monsterName, backupIndex = 0) {
      try {
        if (!window.MonsterBackups || !window.MonsterBackups.has(monsterName)) {
          console.error('No backup found for monster:', monsterName);
          return false;
        }
        
        const backups = window.MonsterBackups.get(monsterName);
        const backup = backups[backups.length - 1 - backupIndex]; // Get latest by default
        
        if (!backup) {
          console.error('Backup index out of range for monster:', monsterName);
          return false;
        }
        
        // Find monster in current data
        const monster = window.MONSTRES?.find(m => m.nom === monsterName);
        if (!monster) {
          console.error('Monster not found in current data:', monsterName);
          return false;
        }
        
        // Restore data
        Object.assign(monster, backup.data);
        
        // Force sync
        const contentFactory = window.ContentFactory?.getInstance ? window.ContentFactory.getInstance() : null;
        if (contentFactory && contentFactory.refreshData) {
          contentFactory.refreshData();
        }
        
        return true;
        
      } catch (error) {
        console.error('Failed to recover monster from backup:', error);
        return false;
      }
    }

    // Global validation and repair of monster data
    validateAndRepairMonsterData() {
      if (!window.MONSTRES || !Array.isArray(window.MONSTRES)) {
        return 0;
      }
      
      let repairCount = 0;
      const contentTypes = window.ContentTypes?.monster;
      
      window.MONSTRES.forEach((monster, index) => {
        // Ensure required properties exist
        if (!monster.nom) {
          monster.nom = `Monstre ${index + 1}`;
          repairCount++;
        }
        
        // Validate numeric properties
        if (contentTypes && contentTypes.fields) {
          Object.entries(contentTypes.fields).forEach(([fieldName, fieldConfig]) => {
            if (fieldConfig.type === 'number') {
              if (typeof monster[fieldName] !== 'number' || isNaN(monster[fieldName])) {
                const defaultValue = contentTypes.defaultValues?.[fieldName] || 0;
                monster[fieldName] = defaultValue;
                repairCount++;
              }
            }
          });
        }
        
        // Ensure image path exists and is valid
        if (!monster.image || typeof monster.image !== 'string') {
          monster.image = `data/images/Monstres/foret/Monstre_Forêt_${monster.nom.replace(/[^a-zA-Z0-9]/g, '')}.png`;
          repairCount++;
        }
        
        // Validate image mapping exists
        if (JdrApp.modules.images) {
          const imageKey = `monster:${monster.nom}`;
          if (!JdrApp.modules.images.getImageUrl(imageKey)) {
            JdrApp.modules.images.setImage(imageKey, monster.image);
          }
        }
      });
      
      if (repairCount > 0) {
        // Save repaired data
        if (JdrApp.modules.storage && JdrApp.modules.storage.saveChanges) {
          JdrApp.modules.storage.saveChanges(true);
        }
      }
      
      return repairCount;
    }
    
    // Update static page data method
    updateStaticPageData(session, content) {
      try {
        const pageId = session.itemIdentifier;
        const editSection = session.editSection;
        
        // Get the static page data
        const staticPageData = window.STATIC_PAGES?.[pageId];
        if (!staticPageData) {
          console.error('Static page not found:', pageId);
          return false;
        }
        
        // Handle different edit section formats
        if (editSection.startsWith('intro-')) {
          // Editing intro section
          const sectionIndex = parseInt(editSection.split('-')[1]);
          if (staticPageData.sections && staticPageData.sections[sectionIndex] && staticPageData.sections[sectionIndex].type === 'intro') {
            staticPageData.sections[sectionIndex].content = content;
          }
        } else if (editSection === 'page-title') {
          // Editing page title
          staticPageData.title = content;
        } else if (editSection.endsWith('-title')) {
          // Editing card title (e.g., "dieux-new-2-1756899335313-title")
          const cardId = editSection.slice(0, -6); // Remove "-title"
          const cardSection = staticPageData.sections?.find(s => s.id === cardId);
          if (cardSection) {
            cardSection.title = content;
          }
        } else {
          // Editing card content (e.g., "dieux-new-2-1756899335313")
          const cardSection = staticPageData.sections?.find(s => s.id === editSection);
          if (cardSection) {
            cardSection.content = content;
          } else {
            console.warn('Unhandled static page edit section:', editSection);
            return false;
          }
        }
        
        return true;
        
      } catch (error) {
        console.error('Failed to update static page data:', error);
        return false;
      }
    }

    // Campaign and sub-page data update method
    updateCampaignData(type, campaignName, property, content, subPageName = null) {
      try {
        // Get the campaign data from the static pages
        const campagneData = window.STATIC_PAGES?.campagne;
        if (!campagneData || !campagneData.subPages) {
          return false;
        }
        
        if (type === 'campaign') {
          // Update campaign property (name or description)
          if (!campagneData.subPages[campaignName]) {
            return false;
          }
          
          if (property === 'name') {
            // Renaming a campaign requires more complex handling
            // For now, just update the description property
            return false;
          } else if (property === 'description') {
            campagneData.subPages[campaignName].description = content;
          }
        } else if (type === 'subpage') {
          // Update sub-page property (title or content)
          if (!campagneData.subPages[campaignName] || !campagneData.subPages[campaignName].subPages || !subPageName) {
            return false;
          }
          
          const subPage = campagneData.subPages[campaignName].subPages[subPageName];
          if (!subPage) {
            return false;
          }
          
          if (property === 'title') {
            subPage.title = content;
          } else if (property === 'content') {
            subPage.content = content;
          }
        }
        
        // Data updated in memory only - will be saved during export
        // No automatic save to prevent infinite loops
        
        return true;
        
      } catch (error) {
        console.error('Failed to update campaign data:', error);
        return false;
      }
    }

    addEditingControls(container, editableElement) {
      // Remove any existing editing controls
      const existingControls = container.querySelector('.editing-controls');
      if (existingControls) {
        existingControls.remove();
      }

      // Create editing controls toolbar
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'editing-controls';
      controlsDiv.style.cssText = `
        position: absolute;
        top: -40px;
        right: 0;
        background: var(--paper);
        border: 1px solid var(--bronze);
        border-radius: 6px;
        padding: 4px;
        display: flex;
        gap: 4px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;

      // Get available treasure tables for the dropdown
      const availableTables = window.TABLES_TRESORS?.tables || [];
      let treasureControls = '';
      
      if (availableTables.length > 0) {
        const tableOptions = availableTables.map(table => 
          `<option value="${table.nom}">${table.nom}</option>`
        ).join('');

        treasureControls = `
          <div class="treasure-table-controls" style="display: flex; align-items: center; gap: 2px; border-right: 1px solid var(--rule); padding-right: 4px; margin-right: 4px;">
            <select class="treasure-table-select" style="font-size: 11px; padding: 2px; border: 1px solid var(--rule); border-radius: 3px;">
              <option value="">Choisir table</option>
              ${tableOptions}
            </select>
            <button type="button" class="copy-treasure-link-btn btn" style="
              background: var(--bronze); 
              color: white; 
              border: none; 
              padding: 2px 6px; 
              border-radius: 3px; 
              cursor: pointer; 
              font-size: 10px;
              white-space: nowrap;
            " title="Copier le lien HTML de la table sélectionnée">
              📋 Table
            </button>
          </div>
        `;
      }

      controlsDiv.innerHTML = `
        ${treasureControls}
        <button type="button" class="save-edit-btn btn" style="
          background: var(--accent); 
          color: white; 
          border: none; 
          padding: 2px 6px; 
          border-radius: 3px; 
          cursor: pointer; 
          font-size: 11px;
        ">
          ✓ Sauver
        </button>
        <button type="button" class="cancel-edit-btn btn" style="
          background: #666; 
          color: white; 
          border: none; 
          padding: 2px 6px; 
          border-radius: 3px; 
          cursor: pointer; 
          font-size: 11px;
        ">
          ✕ Annuler
        </button>
      `;

      // Position the container relatively for absolute positioning of controls
      container.style.position = 'relative';
      container.appendChild(controlsDiv);

      // Set up event listeners
      this.setupEditingControlsListeners(controlsDiv, container, editableElement);
    }

    setupEditingControlsListeners(controlsDiv, container, editableElement) {
      // Save button
      const saveBtn = controlsDiv.querySelector('.save-edit-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          // Get current content
          const newContent = editableElement.innerHTML.trim();
          const normalizedContent = this.normalizeHTMLContent(newContent);
          
          // Update in data structure using current session
          if (this.currentEditSession) {
            const success = this.updateContentInDataStructure(this.currentEditSession, normalizedContent);
            
            if (success) {
              EventBus.emit(Events.STORAGE_SAVE);
              if (JdrApp.modules.ui?.showNotification) {
                JdrApp.modules.ui.showNotification('💾 Modification sauvegardée', 'success');
              }
            }
            
            // Reset editing state
            this.resetEditingState(container);
            this.currentEditSession = null;
          }
          
          this.removeEditingControls(container);
        });
      }

      // Cancel button  
      const cancelBtn = controlsDiv.querySelector('.cancel-edit-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          // Reset editing state without saving
          this.resetEditingState(container);
          if (this.currentEditSession) {
            this.currentEditSession = null;
          }
          this.removeEditingControls(container);
        });
      }

      // Copy treasure table link button
      const copyBtn = controlsDiv.querySelector('.copy-treasure-link-btn');
      const tableSelect = controlsDiv.querySelector('.treasure-table-select');
      
      if (copyBtn && tableSelect) {
        copyBtn.addEventListener('click', () => {
          const selectedTable = tableSelect.value;
          if (selectedTable && window.TablesTresorsManager) {
            const htmlLink = window.TablesTresorsManager.generateTreasureTableHtmlLink(selectedTable);
            
            // Insert the link at cursor position
            if (editableElement.contentEditable === 'true') {
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const linkNode = document.createTextNode(htmlLink);
                range.insertNode(linkNode);
                
                // Move cursor after the inserted text
                range.setStartAfter(linkNode);
                range.setEndAfter(linkNode);
                selection.removeAllRanges();
                selection.addRange(range);
              } else {
                // Fallback: append at the end
                editableElement.innerHTML += htmlLink;
              }
              
              // Show notification
              if (window.TablesTresorsManager.showNotification) {
                window.TablesTresorsManager.showNotification('✓ Lien de table inséré!', 'success');
              }
            }
          }
        });
      }

      // Also handle Enter and Escape keys on the editable element
      editableElement.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          // Reset editing state without saving
          this.resetEditingState(container);
          if (this.currentEditSession) {
            this.currentEditSession = null;
          }
          this.removeEditingControls(container);
        } else if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          // Save with Ctrl+Enter
          const newContent = editableElement.innerHTML.trim();
          const normalizedContent = this.normalizeHTMLContent(newContent);
          
          if (this.currentEditSession) {
            const success = this.updateContentInDataStructure(this.currentEditSession, normalizedContent);
            
            if (success) {
              EventBus.emit(Events.STORAGE_SAVE);
              if (JdrApp.modules.ui?.showNotification) {
                JdrApp.modules.ui.showNotification('💾 Modification sauvegardée', 'success');
              }
            }
            
            this.resetEditingState(container);
            this.currentEditSession = null;
          }
          
          this.removeEditingControls(container);
        }
      });
    }

    removeEditingControls(container) {
      const controls = container.querySelector('.editing-controls');
      if (controls) {
        controls.remove();
      }
    }

    // Show treasure tables selection modal
    showTreasureTablesModal(insertTextAtCursor) {
      const availableTables = window.TABLES_TRESORS?.tables || [];
      
      if (availableTables.length === 0) {
        if (JdrApp.modules.ui?.showNotification) {
          JdrApp.modules.ui.showNotification('❌ Aucune table de trésor disponible', 'error');
        }
        return;
      }

      // Create modal
      const modal = document.createElement('dialog');
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 0;
        border: none;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        z-index: 1000001 !important;
        background: transparent;
      `;

      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000000 !important;
        backdrop-filter: blur(4px);
      `;

      const tableOptions = availableTables.map(table => 
        `<option value="${table.nom}">${table.nom}${table.tags ? ` (${table.tags.join(', ')})` : ''}</option>`
      ).join('');

      modal.innerHTML = `
        <div style="background: var(--paper); border-radius: 12px; padding: 1.5rem; border: 2px solid var(--rule);">
          <h3 style="margin: 0 0 1rem 0; color: var(--accent-ink);">🎲 Insérer un lien de table de trésor</h3>
          
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Choisir une table:</label>
            <select id="treasureTableSelect" style="width: 100%; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 6px; font-size: 14px;">
              <option value="">-- Sélectionner une table --</option>
              ${tableOptions}
            </select>
          </div>

          <div style="margin-bottom: 1rem;">
            <div id="tablePreview" style="border: 1px solid var(--rule); padding: 1rem; border-radius: 6px; background: var(--card); min-height: 50px; font-size: 12px; color: var(--paper-muted);">
              Sélectionnez une table pour voir l'aperçu
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="cancelTreasureModal" class="btn" style="background: #6b7280; color: white;">Annuler</button>
            <button id="insertTreasureLink" class="btn" style="background: var(--accent); color: white;" disabled>🎲 Insérer le lien</button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);
      modal.show();

      // Get elements
      const select = modal.querySelector('#treasureTableSelect');
      const preview = modal.querySelector('#tablePreview');
      const insertBtn = modal.querySelector('#insertTreasureLink');
      const cancelBtn = modal.querySelector('#cancelTreasureModal');

      // Handle table selection
      select.addEventListener('change', () => {
        const selectedTableName = select.value;
        if (selectedTableName) {
          insertBtn.disabled = false;
          
          const selectedTable = availableTables.find(t => t.nom === selectedTableName);
          if (selectedTable && window.TablesTresorsManager) {
            const previewHtml = window.TablesTresorsManager.generateTablePreviewHtml(selectedTable);
            preview.innerHTML = previewHtml;
          }
        } else {
          insertBtn.disabled = true;
          preview.innerHTML = 'Sélectionnez une table pour voir l\'aperçu';
        }
      });

      // Handle insert
      insertBtn.addEventListener('click', () => {
        const selectedTableName = select.value;
        if (selectedTableName && window.TablesTresorsManager) {
          const htmlLink = window.TablesTresorsManager.generateTreasureTableHtmlLink(selectedTableName);
          insertTextAtCursor(htmlLink);
          
          if (JdrApp.modules.ui?.showNotification) {
            JdrApp.modules.ui.showNotification('✓ Lien de table inséré!', 'success');
          }
        }
        
        modal.close();
        modal.remove();
        backdrop.remove();
      });

      // Handle cancel
      cancelBtn.addEventListener('click', () => {
        modal.close();
        modal.remove();
        backdrop.remove();
      });

      // Handle backdrop click
      backdrop.addEventListener('click', () => {
        modal.close();
        modal.remove();
        backdrop.remove();
      });

      // Focus select
      select.focus();
    }
  }

  window.UnifiedEditor = UnifiedEditor.getInstance();

})();