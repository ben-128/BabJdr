// ============================================================================
// JDR-BAB APPLICATION - EDITOR MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // EDITOR MODULE
  // ========================================
  JdrApp.modules.editor = {
    editedData: {},
    modifiedElements: new Map(), // Track what was actually modified
    isDevMode: false, // Always false by default, no localStorage read

    init() {
      
      // Set up dev mode toggle
      JdrApp.utils.events.register('click', '#devToggle', () => this.toggleDevMode());
      
      // Set up editable element handlers
      this.setupEditableHandlers();
      
      // Set up creation handlers for new elements
      this.setupCreationHandlers();
      
      // Set up image upload handlers
      this.setupImageHandlers();
      
      // Initialize dev mode state - enable automatically in development
      this.updateDevModeState();
    },

    toggleDevMode() {
      // In standalone version, prevent dev mode toggle
      if (window.STANDALONE_VERSION) {
        console.log('Dev mode disabled in standalone version');
        return;
      }
      
      this.isDevMode = !this.isDevMode;
      document.body.classList.toggle('dev-on', this.isDevMode);
      document.body.classList.toggle('dev-off', !this.isDevMode);
      
      // Note: No localStorage save - dev mode resets on page reload
      this.updateDevModeState();
    },

    updateDevModeState() {
      if (window.STANDALONE_VERSION) {
        document.body.className = 'dev-off';
        this.forceHideAllEditButtons();
        return;
      }
      
      // Apply correct body classes
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
      
      // Show/hide edit buttons based on dev mode state
      if (this.isDevMode) {
        this.forceShowAllEditButtons();
      } else {
        this.forceHideAllEditButtons();
      }
    },
    
    forceHideAllEditButtons() {
      // Only hide buttons if dev mode is actually OFF
      if (this.isDevMode || window.STANDALONE_VERSION === false) {
        return; // Don't hide buttons in dev mode ON
      }
      
      // Aggressively hide ALL edit buttons using JavaScript when dev mode is OFF
      const editButtonSelectors = [
        '.edit-btn',
        '.edit-title-btn', 
        '.edit-paragraph-btn',
        '.edit-list-btn',
        '.edit-field-btn',
        '.edit-effect-btn',
        '.edit-stats-btn',
        '.edit-section-btn',
        'button[class*="edit"]',
        'button[title*="✏️"]',
        'button[title*="diter"]',
        'button[title*="Edit"]',
        '.spell-add',
        '.don-add',
        '.spell-delete',
        '.don-delete',
        '.don-move-up',
        '.don-move-down',
        '.section-delete',
        '.remove-section-btn',
        '.add-paragraph-btn',
        '.add-subclass-btn',
        '.delete-subclass-btn',
        'button[data-category-name]',
        'button[data-spell-name]',
        'button[data-don-name]',
        'button[data-section-name]',
        'button[data-section-type]',
        '.illus .up',
        '.illus .rm',
        '.illus label',
        '.illus input[type="file"]'
      ];
      
      editButtonSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            element.setAttribute('aria-hidden', 'true');
          });
        } catch (error) {
          console.warn(`⚠️ Error hiding elements for selector ${selector}:`, error);
        }
      });
    },
    
    forceShowAllEditButtons() {
      // Show edit buttons when dev mode is ON
      const editButtonSelectors = [
        '.edit-btn',
        '.edit-title-btn', 
        '.edit-paragraph-btn',
        '.edit-list-btn',
        '.edit-field-btn',
        '.edit-effect-btn',
        '.edit-stats-btn',
        '.edit-section-btn',
        'button[class*="edit"]',
        'button[title*="✏️"]',
        'button[title*="diter"]',
        'button[title*="Edit"]',
        '.spell-add',
        '.don-add',
        '.spell-delete',
        '.don-delete',
        '.don-move-up',
        '.don-move-down',
        '.section-delete',
        '.remove-section-btn',
        '.add-paragraph-btn',
        '.add-subclass-btn',
        '.delete-subclass-btn',
        'button[data-category-name]',
        'button[data-spell-name]',
        'button[data-don-name]',
        'button[data-section-name]',
        'button[data-section-type]',
        '.illus .up',
        '.illus .rm',
        '.illus label',
        '.illus input[type="file"]'
      ];
      
      editButtonSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            element.style.display = '';
            element.style.visibility = '';
            element.style.opacity = '';
            element.style.pointerEvents = '';
            element.removeAttribute('aria-hidden');
          });
        } catch (error) {
          console.warn(`⚠️ Error showing elements for selector ${selector}:`, error);
        }
      });
    },

    setupEditableHandlers() {
      // Edit button click
      JdrApp.utils.events.register('click', '.edit-btn', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDevMode) {
          console.log('⚠️ Dev mode is OFF, editing disabled');
          return;
        }
        
        // Find the parent editable section
        const editableSection = e.target.closest('.editable-section');
        if (editableSection) {
          this.makeEditableSection(editableSection);
          return;
        }
        
        // Fallback: Find the parent list item (legacy support)
        const listItem = e.target.closest('.editable-item');
        if (listItem) {
          this.makeEditableItem(listItem);
          return;
        }
        
        console.warn('⚠️ No editable element found for button:', e.target);
      });

      // Completely disable any double-click editing by blocking ALL events on .editable elements
      JdrApp.utils.events.register('dblclick', '.editable', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });

      JdrApp.utils.events.register('click', '.editable', (e) => {
        // Only allow clicks for keyboard navigation, no editing triggers
      });

      // Click outside to save
      JdrApp.utils.events.register('click', 'body', (e) => {
        if (!e.target.closest('.editable') && !e.target.matches('.editable') && !e.target.matches('.edit-btn')) {
          this.saveAllEdits();
        }
      });

      // Enter to save, Escape to save and exit
      JdrApp.utils.events.register('keydown', '.editable', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
          // Find the parent editable section or item
          const editableContainer = e.target.closest('.editable-section, .editable-item') || e.target;
          this.saveEdit(editableContainer);
        } else if (e.key === 'Escape') {
            e.preventDefault();
          // Find the parent editable section or item
          const editableContainer = e.target.closest('.editable-section, .editable-item') || e.target;
          this.saveEdit(editableContainer);
        }
      });
    },

    // Find the best editable target element
    findEditableTarget(clickedElement) {
      // If the clicked element itself has edit attributes, use it
      if (clickedElement.dataset.editType && clickedElement.dataset.editSection !== undefined) {
        return clickedElement;
      }
      
      // Otherwise, look for the closest parent with edit attributes
      let current = clickedElement;
      while (current && current !== document.body) {
        if (current.classList && current.classList.contains('editable') && 
            current.dataset.editType && current.dataset.editSection !== undefined) {
          console.log('🔍 Found parent editable:', current.tagName, current.dataset.editType, current.dataset.editSection);
          return current;
        }
        current = current.parentElement;
      }
      
      // Fallback: return the original clicked element if it's at least .editable
      if (clickedElement.classList && clickedElement.classList.contains('editable')) {
        console.log('⚠️ Using fallback editable element');
        return clickedElement;
      }
      
      console.warn('⚠️ No suitable editable element found');
      return null;
    },

    makeEditableSection(section) {
      
      if (section.dataset.editing === 'true') {
        console.log('⚠️ Section already being edited');
        return;
      }
      
      // Find the editable element inside the section
      const editableElement = section.querySelector('.editable');
      if (!editableElement) {
        console.error('❌ No .editable element found in section');
        return;
      }
      
      // STRICT VALIDATION: Ensure editableElement has required data attributes
      if (!editableElement.dataset.editType || !editableElement.dataset.editSection) {
        console.error('❌ Editable element missing required data attributes:', {
          editType: editableElement.dataset.editType,
          editSection: editableElement.dataset.editSection,
          element: editableElement
        });
        return;
      }
      
      // Store original content on the section itself (which has the data attributes)
      section.dataset.originalContent = editableElement.innerHTML;
      section.dataset.editing = 'true';
      
      
      // Show HTML source for editing
      const htmlSource = editableElement.innerHTML;
      editableElement.textContent = htmlSource; // Show HTML as text
      
      // Make the editable element editable
      editableElement.contentEditable = true;
      editableElement.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
      editableElement.style.border = '1px dashed var(--bronze)';
      editableElement.style.borderRadius = '4px';
      editableElement.style.padding = '4px';
      editableElement.style.fontFamily = 'monospace'; // Monospace font for HTML editing
      editableElement.style.whiteSpace = 'pre-wrap'; // Preserve whitespace
      editableElement.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(editableElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },

    makeEditableItem(listItem) {
      console.log('🔍 makeEditableItem called on:', listItem);
      
      if (listItem.dataset.editing === 'true') {
        console.log('⚠️ Element already being edited');
        return;
      }
      
      // Find the content div inside the list item
      const contentDiv = listItem.querySelector('.editable-content');
      if (!contentDiv) {
        console.error('❌ No .editable-content found in list item');
        return;
      }
      
      // Store original content on the list item itself (which has the data attributes)
      listItem.dataset.originalContent = contentDiv.innerHTML;
      listItem.dataset.editing = 'true';
      
      console.log('🔍 List item made editable:', {
        editType: listItem.dataset.editType,
        editSection: listItem.dataset.editSection,
        editIndex: listItem.dataset.editIndex,
        originalContent: listItem.dataset.originalContent.substring(0, 100) + '...'
      });
      
      // Make the content div editable
      contentDiv.contentEditable = true;
      contentDiv.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
      contentDiv.style.border = '1px dashed var(--bronze)';
      contentDiv.style.borderRadius = '4px';
      contentDiv.style.padding = '4px';
      contentDiv.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(contentDiv);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },

    makeEditable(element) {
      console.log('🔍 makeEditable called on:', element, 'isDevMode:', this.isDevMode);
      
      if (element.dataset.editing === 'true') {
        console.log('⚠️ Element already being edited');
        return;
      }
      
      // Store original content
      element.dataset.originalContent = element.innerHTML;
      element.dataset.editing = 'true';
      
      console.log('🔍 Element made editable:', {
        editType: element.dataset.editType,
        editSection: element.dataset.editSection,
        originalContent: element.dataset.originalContent.substring(0, 100) + '...'
      });
      
      // Make contenteditable
      element.contentEditable = true;
      element.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
      element.style.border = '1px dashed var(--bronze)';
      element.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },

    saveEdit(element) {
      // For editable sections, get the edit type from the .editable element inside
      let editType = element.dataset.editType;
      let editSection = element.dataset.editSection;
      
      // For list items, get content from the .editable-content div
      let newContent;
      if (element.classList.contains('editable-item')) {
        const contentDiv = element.querySelector('.editable-content');
        newContent = contentDiv ? contentDiv.innerHTML.trim() : element.innerHTML.trim();
      } else if (element.classList.contains('editable-section')) {
        // For editable sections, get content from the .editable element inside
        const editableElement = element.querySelector('.editable');
        if (editableElement) {
          // Get the text content (HTML source) and use it as the new HTML
          newContent = editableElement.textContent.trim();
          editType = editableElement.dataset.editType;
          editSection = editableElement.dataset.editSection;
        } else {
          newContent = element.innerHTML.trim();
        }
      } else {
        newContent = element.innerHTML.trim();
      }
      
      const originalContent = element.dataset.originalContent;
      
      // Normalize HTML content to ensure consistency
      newContent = this.normalizeHTMLContent(newContent);
      
      
      if (newContent !== originalContent) {
        
        // Store edit in editedData
        this.storeEdit(element, newContent);
        
        // Track this element as modified (only if editType is valid)
        if (editType && typeof editType === 'string') {
          const elementId = this.getElementId(element);
          
          this.modifiedElements.set(elementId, {
            element: element,
            content: newContent,
            editType: editType,
            timestamp: Date.now()
          });
          
        } else {
          console.warn('⚠️ Skipping element with invalid editType:', editType, 'for element:', element);
        }
        
        // For editable sections, update the visual content immediately
        if (element.classList.contains('editable-section')) {
          const editableElement = element.querySelector('.editable');
          if (editableElement) {
            // Update the visible content with the new HTML
            editableElement.innerHTML = newContent;
          }
        } else if (element.classList.contains('editable-item')) {
          const contentDiv = element.querySelector('.editable-content');
          if (contentDiv) {
            // Update the visible content for list items
            contentDiv.innerHTML = newContent;
          }
        } else {
          // For direct editable elements, the content is already updated
        }
        
        // Apply element coloring if needed
        this.applyElementColoring(element);
        
        // IMMEDIATELY save changes to localStorage to persist edits
        this.saveChangesToStorage();
      } else {
        console.log('⚠️ No content change detected');
      }
      
      // Reset editing state
      this.resetEditingState(element);
    },

    cancelEdit(element) {
      console.log('🔍 cancelEdit called on:', element);
      
      // Restore original content
      if (element.classList.contains('editable-section')) {
        const editableElement = element.querySelector('.editable');
        if (editableElement && element.dataset.originalContent) {
          editableElement.innerHTML = element.dataset.originalContent;
        }
      } else if (element.classList.contains('editable-item')) {
        const contentDiv = element.querySelector('.editable-content');
        if (contentDiv && element.dataset.originalContent) {
          contentDiv.innerHTML = element.dataset.originalContent;
        }
      } else {
        if (element.dataset.originalContent) {
          element.innerHTML = element.dataset.originalContent;
        }
      }
      
      this.resetEditingState(element);
    },

    resetEditingState(element) {
      // For list items, reset the .editable-content div
      if (element.classList.contains('editable-item')) {
        const contentDiv = element.querySelector('.editable-content');
        if (contentDiv) {
          contentDiv.contentEditable = false;
          contentDiv.style.backgroundColor = '';
          contentDiv.style.border = '';
          contentDiv.style.borderRadius = '';
          contentDiv.style.padding = '';
          // Note: We don't restore original content here - the new content should stay
        }
      } else if (element.classList.contains('editable-section')) {
        // For editable sections, reset the .editable element inside
        const editableElement = element.querySelector('.editable');
        if (editableElement) {
          editableElement.contentEditable = false;
          editableElement.style.backgroundColor = '';
          editableElement.style.border = '';
          editableElement.style.borderRadius = '';
          editableElement.style.padding = '';
          editableElement.style.fontFamily = ''; // Reset font
          editableElement.style.whiteSpace = ''; // Reset whitespace
          
          // Note: We don't restore original content here - the updated content should stay
          // The content has already been updated in the saveEdit method
        }
      } else {
        element.contentEditable = false;
        element.style.backgroundColor = '';
        element.style.border = '';
        // Note: We don't restore original content here - the new content should stay
      }
      
      element.dataset.editing = 'false';
      delete element.dataset.originalContent;
    },

    saveAllEdits() {
      // Save both old-style editable elements and new-style editable sections
      JdrApp.utils.dom.$$('.editable[data-editing="true"], .editable-section[data-editing="true"], .editable-item[data-editing="true"]').forEach(element => {
        // STRICT VALIDATION: Only save elements with proper data attributes
        if (this.hasValidEditData(element)) {
          this.saveEdit(element);
        } else {
          console.warn('⚠️ Skipping save for element without valid edit data:', element);
          this.resetEditingState(element);
        }
      });
    },
    
    hasValidEditData(element) {
      // For editable sections, check the .editable element inside
      if (element.classList.contains('editable-section')) {
        const editableElement = element.querySelector('.editable');
        return editableElement && editableElement.dataset.editType && editableElement.dataset.editSection;
      }
      
      // For editable items and direct editable elements
      return element.dataset.editType && (element.dataset.editSection || element.dataset.editSpell || element.dataset.editDon || element.dataset.editClass);
    },

    storeEdit(element, content) {
      // Find the actual editable element that has the data attributes
      let editableElement = element;
      let editType = element.dataset.editType;
      
      // If this is an editable section, get the data from the .editable element inside
      if (element.classList.contains('editable-section')) {
        const innerEditable = element.querySelector('.editable');
        if (innerEditable && innerEditable.dataset.editType) {
          editableElement = innerEditable;
          editType = innerEditable.dataset.editType;
        }
      }
      
      // Validate editType before proceeding
      if (!editType || typeof editType !== 'string') {
        console.error('❌ Cannot store edit - invalid editType:', editType, 'for element:', element);
        return;
      }
      
      // Update data directly in global structures based on element attributes
      this.updateGlobalData(editableElement, content, editType);
    },

    getEditKey(element) {
      // Generate a unique key based on element data attributes
      const editType = element.dataset.editType;
      
      if (element.dataset.editSpell) {
        return element.dataset.editSpell;
      } else if (element.dataset.editDon) {
        return element.dataset.editDon;
      } else if (element.dataset.editClass) {
        return element.dataset.editClass;
      } else if (element.dataset.editCategory) {
        return element.dataset.editCategory;
      } else if (element.dataset.editSection) {
        return element.dataset.editSection;
      }
      
      return 'default';
    },

    getElementId(element) {
      // Find the actual editable element that has the data attributes
      let editableElement = element;
      
      // If this is an editable section, get the data from the .editable element inside
      if (element.classList.contains('editable-section')) {
        const innerEditable = element.querySelector('.editable');
        if (innerEditable && innerEditable.dataset.editType) {
          editableElement = innerEditable;
        }
      }
      
      // Create a unique ID for tracking modifications
      const editType = editableElement.dataset.editType;
      const editSpell = editableElement.dataset.editSpell;
      const editDon = editableElement.dataset.editDon;
      const editClass = editableElement.dataset.editClass;
      const editSubclass = editableElement.dataset.editSubclass;
      const editCategory = editableElement.dataset.editCategory;
      const editSection = editableElement.dataset.editSection;
      
      if (editSpell) return `spell:${editSpell}:${editType}`;
      if (editDon) return `don:${editDon}:${editType}`;
      if (editClass && editSubclass) return `subclass:${editClass}:${editSubclass}:${editType}`;
      if (editClass) return `class:${editClass}:${editType}`;
      if (editCategory) return `category:${editCategory}:${editType}`;
      if (editSection) return `section:${editSection}:${editType}`;
      
      // Fallback: use element position in DOM
      const allEditables = Array.from(document.querySelectorAll('.editable'));
      const index = allEditables.indexOf(editableElement);
      return `element:${index}:${editType}`;
    },



    updateStaticPageData(element, content) {
      const editSection = element.dataset.editSection;
      
      if (!window.STATIC_PAGES) return false;
      
      const article = element.closest('article[data-static-page="true"]');
      if (!article) return false;
      
      const pageId = article.dataset.page;
      const pageData = window.STATIC_PAGES[pageId];
      
      if (!pageData || !pageData.sections) return false;
      
      return this.updateSectionContent(pageData.sections, editSection, content, element);
    },

    updateStaticPageDataByEditType(element, content) {
      const editType = element.dataset.editType;
      
      if (!window.STATIC_PAGES) return false;
      
      const article = element.closest('article[data-static-page="true"]');
      if (!article) return false;
      
      const pageId = article.dataset.page;
      const pageData = window.STATIC_PAGES[pageId];
      
      if (!pageData || !pageData.sections) return false;
      
      return this.updateSectionContentByEditType(pageData.sections, editType, content, element);
    },

    updateSectionContentByEditType(sections, editType, content, element) {
      const editSection = element.dataset.editSection;
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        // Handle card content with ordered lists
        if (section.type === 'card' && section.content) {
          if (section.content.type === 'ordered_list' && section.content.editType === editSection) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const listItems = tempDiv.querySelectorAll('li');
            section.content.items = Array.from(listItems).map(li => li.innerHTML);
            return true;
          }
          
          if (section.content.type === 'list' && section.content.editType === editSection) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const listItems = tempDiv.querySelectorAll('li');
            section.content.items = Array.from(listItems).map(li => li.innerHTML);
            return true;
          }
        }
        
        // Handle grid content
        if (section.type === 'grid' && section.content) {
          for (let j = 0; j < section.content.length; j++) {
            const gridItem = section.content[j];
            if (gridItem.content && Array.isArray(gridItem.content)) {
              const result = this.updateSectionContentByEditType([{content: gridItem.content}], editType, content, element);
              if (result) return true;
            }
          }
        }
      }
      
      return false;
    },

    updateSectionContent(sections, editSection, content, element) {
      console.log('🔍 updateSectionContent called:', {
        sectionsCount: sections.length,
        editSection,
        contentPreview: content.substring(0, 50) + '...'
      });
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        console.log(`🔍 Checking section ${i}:`, {
          type: section.type,
          sectionType: section.sectionType,
          hasContent: !!section.content,
          contentType: section.content ? section.content.type : null
        });
        
        // Check if this is the section we're looking for
        if (section.type === 'intro' && editSection === 'intro') {
          console.log('✅ Found intro section match');
          section.content = content;
          return true;
        }
        
        // Handle card content
        if (section.type === 'card' && section.content) {
          // Check if this is a card title edit
          if (editSection.endsWith('-title') && section.sectionType) {
            const sectionId = editSection.replace('-title', '');
            console.log('🔍 Checking card title:', {editSection, sectionId, sectionType: section.sectionType});
            if (section.sectionType === sectionId) {
              console.log('✅ Found card title match');
              section.title = content;
              return true;
            }
          }
          
          if (section.content.type === 'ordered_list' && section.content.editType === editSection) {
            console.log('✅ Found ordered list match');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const listItems = tempDiv.querySelectorAll('li');
            section.content.items = Array.from(listItems).map(li => li.innerHTML);
            return true;
          }
          
          // Handle array content in cards
          if (Array.isArray(section.content)) {
            console.log('🔍 Checking array content in card:', section.content.length, 'items');
            for (let j = 0; j < section.content.length; j++) {
              const contentItem = section.content[j];
              console.log(`🔍 Content item ${j}:`, {
                editSection: contentItem.editSection,
                targetEditSection: editSection
              });
              if (contentItem.editSection === editSection) {
                console.log('✅ Found array content match');
                contentItem.content = content;
                return true;
              }
            }
          }
        }
        
        // Handle grid content
        if (section.type === 'grid' && section.content) {
          console.log('🔍 Checking grid content:', section.content.length, 'items');
          for (let j = 0; j < section.content.length; j++) {
            const gridItem = section.content[j];
            if (gridItem.content && Array.isArray(gridItem.content)) {
              const result = this.updateSectionContent([{content: gridItem.content}], editSection, content, element);
              if (result) return true;
            }
          }
        }
      }
      
      return false;
    },

    applyElementColoring(element) {
      // Apply element coloring with delay
      setTimeout(() => {
        this.colorizeElements(element);
      }, 500);
    },

    colorizeElements(container = document) {
      const elementMap = {
        'Feu': { color: '#ff6b35', weight: 'bold' },
        'Air': { color: '#87ceeb', weight: 'bold' },
        'Eau': { color: '#4682b4', weight: 'bold' },
        'Terre': { color: '#8b7355', weight: 'bold' },
        'Divin': { color: '#ffd700', weight: 'bold' },
        'Maléfique': { color: '#8b008b', weight: 'bold' }
      };

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      textNodes.forEach(textNode => {
        let content = textNode.textContent;
        let hasChanges = false;

        Object.entries(elementMap).forEach(([element, style]) => {
          const regex = new RegExp(`\\b${element}\\b`, 'g');
          if (regex.test(content)) {
            content = content.replace(regex, `<span style="color: ${style.color}; font-weight: ${style.weight};">${element}</span>`);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          const wrapper = document.createElement('span');
          wrapper.innerHTML = content;
          textNode.parentNode.replaceChild(wrapper, textNode);
        }
      });
    },

    setupCreationHandlers() {
      // Add new subclass
      JdrApp.utils.events.register('click', '.add-subclass-btn', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDevMode) {
          return;
        }
        
        this.addNewSubclass(e.target);
      });

      // Delete subclass
      JdrApp.utils.events.register('click', '.delete-subclass-btn', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.isDevMode) {
          return;
        }
        
        this.deleteSubclass(e.target);
      });
    },

    addNewSubclass(button) {
      // Find the parent class article
      const article = button.closest('article');
      if (!article) return;
      
      // Try to get class name from article attributes or from URL
      let className = article.dataset.class;
      if (!className) {
        const currentHash = window.location.hash;
        const match = currentHash.match(/#\/([^\/]+)/);
        if (match) {
          className = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }
      
      if (!className || !window.CLASSES) return;
      
      const classe = window.CLASSES.find(c => c.nom === className);
      if (!classe) return;
      
      // Create new subclass with default values including proper labels
      const newSubclass = {
        nom: "Nouvelle sous-classe",
        base: {
          Force: 3,
          Agilité: 3,
          Endurance: 3,
          Intelligence: 3,
          Volonté: 3,
          Chance: 3
        },
        progression: "<strong>📈 Progression par niveau:</strong> +1 Force 💪, +1 Agilité 🏃",
        capacites: [
          "<em>Capacité unique</em>: Description de la capacité spéciale de cette sous-classe."
        ]
      };
      
      // Add to the class
      if (!classe.sousClasses) {
        classe.sousClasses = [];
      }
      classe.sousClasses.push(newSubclass);
      
      // Save immediately
      this.saveChangesToStorage();
      
      // Refresh the current page to show the new subclass
      window.location.reload();
    },

    deleteSubclass(button) {
      const className = button.dataset.className;
      const subclassName = button.dataset.subclassName;
      
      if (!className || !subclassName) {
        console.error('❌ Missing class or subclass name');
        return;
      }

      // Confirm deletion
      if (!confirm(`Êtes-vous sûr de vouloir supprimer la sous-classe "${subclassName}" ?`)) {
        return;
      }

      if (!window.CLASSES) {
        console.error('❌ No CLASSES data');
        return;
      }

      const classe = window.CLASSES.find(c => c.nom === className);
      if (!classe || !classe.sousClasses) {
        console.error('❌ Class or subclasses not found');
        return;
      }

      // Find and remove the subclass
      const subclassIndex = classe.sousClasses.findIndex(sc => sc.nom === subclassName);
      if (subclassIndex === -1) {
        console.error('❌ Subclass not found');
        return;
      }

      classe.sousClasses.splice(subclassIndex, 1);

      // Save immediately
      this.saveChangesToStorage();

      // Refresh the current page
      window.location.reload();
    },

    setupImageHandlers() {
      // Image upload
      JdrApp.utils.events.register('change', '.illus input[type="file"]', (e) => {
        this.handleImageUpload(e);
      });

      // Image removal
      JdrApp.utils.events.register('click', '.illus .rm', (e) => {
        this.handleImageRemoval(e);
      });

      // Image enlargement
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

        // Set image source and display
        img.src = e.target.result;
        img.style.display = 'block';
        if (rmButton) rmButton.style.display = 'block';

        // Save to images module if available
        if (JdrApp.modules.images && JdrApp.modules.images.setImageUrl) {
          JdrApp.modules.images.setImageUrl(illusKey, e.target.result);
          console.log(`💾 Image saved for key: ${illusKey}`);
        } else {
          // Fallback: save to localStorage with quota management
          try {
            localStorage.setItem(`illustration:${illusKey}`, e.target.result);
            console.log(`💾 Image saved to localStorage for key: ${illusKey}`);
          } catch (error) {
            if (error.name === 'QuotaExceededError') {
              console.warn('⚠️ localStorage quota exceeded. Clearing old images...');
              this.clearOldImages();
              
              // Try again after clearing
              try {
                localStorage.setItem(`illustration:${illusKey}`, e.target.result);
                console.log(`💾 Image saved after cleanup for key: ${illusKey}`);
              } catch (secondError) {
                console.error('❌ Still not enough space after cleanup');
                alert('Espace de stockage insuffisant. Veuillez supprimer quelques images pour continuer.');
                // Reset image display
                img.src = '';
                img.style.display = 'none';
                if (rmButton) rmButton.style.display = 'none';
                return;
              }
            } else {
              console.error('❌ Error saving image:', error);
              throw error;
            }
          }
        }
      };
      
      reader.onerror = (e) => {
        console.error('❌ Error reading file:', e);
        alert('Erreur lors de la lecture du fichier image');
      };
      
      reader.readAsDataURL(file);
    },

    handleImageRemoval(event) {
      const illus = event.target.closest('.illus');
      const img = illus.querySelector('img');
      const rmButton = illus.querySelector('.rm');
      const illusKey = illus.dataset.illusKey;

      // Remove image display
      img.src = '';
      img.style.display = 'none';
      if (rmButton) rmButton.style.display = 'none';

      // Remove from images module if available
      if (JdrApp.modules.images && JdrApp.modules.images.removeImage) {
        JdrApp.modules.images.removeImage(illusKey);
        console.log(`🗑️ Image removed for key: ${illusKey}`);
      } else {
        // Fallback: remove from localStorage
        localStorage.removeItem(`illustration:${illusKey}`);
        console.log(`🗑️ Image removed from localStorage for key: ${illusKey}`);
      }
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
      
      // Click to close
      backdrop.onclick = () => {
        JdrApp.utils.dom.$$('img.enlarged').forEach(img => {
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

    // Clear old images from localStorage to free space
    clearOldImages() {
      const illustrationKeys = [];
      
      // Find all illustration keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('illustration:')) {
          illustrationKeys.push(key);
        }
      }
      
      // Sort by key (oldest first, roughly)
      illustrationKeys.sort();
      
      // Remove the oldest half
      const toRemove = Math.ceil(illustrationKeys.length / 2);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(illustrationKeys[i]);
        console.log(`🗑️ Removed old image: ${illustrationKeys[i]}`);
      }
      
      console.log(`🧹 Cleared ${toRemove} old images from localStorage`);
    },

    forceCollectAllEdits() {
      this.saveAllEdits();
      
      // All data is already updated in global structures during editing
      // No need to process modifiedElements again since updateGlobalData
      // is called immediately when each edit is saved
      
      return this.editedData;
    },

    // Ultra-simple generic method - just save text as-is
    updateGlobalData(element, content, editType) {
      try {
        // Find the target in global data and update it directly with the raw content
        this.updateDataByPath(element, content);
      } catch (error) {
        // Silently handle errors
      }
    },

    // Ultra-simple method to save any text content to the right place
    updateDataByPath(element, content) {
      const editType = element.dataset.editType;
      
      // SPELLS
      if (element.dataset.editSpell) {
        let property = editType.replace('spell-', '');
        this.saveToSpell(element.dataset.editSpell, property, content);
        return;
      }
      
      // DONS
      if (element.dataset.editDon) {
        this.saveToDon(element.dataset.editDon, editType.replace('don-', ''), content);
        return;
      }
      
      // CLASSES/SUBCLASSES
      if (element.dataset.editSection && (element.dataset.editSection.includes('-') || editType.startsWith('subclass-'))) {
        this.saveToSubclass(element.dataset.editSection, editType, content);
        return;
      }
      
      if (element.dataset.editClass) {
        this.saveToClass(element.dataset.editClass, editType, content);
        return;
      }
      
      // STATIC PAGES
      this.updateStaticPageDataByEditType(element, content);
    },

    // Simple save methods - just store text as-is
    saveToSpell(spellName, property, content) {
      if (!window.SORTS) return;
      
      for (const category of window.SORTS) {
        const spell = category.sorts.find(s => s.nom === spellName);
        if (spell) {
          const propertyMap = {
            'name': 'nom', 
            'description': 'description', 
            'prerequis': 'prerequis',
            'portee': 'portee', 
            'mana': 'coutMana', 
            'temps-incantation': 'tempsIncantation',
            'duree': 'duree',
            'resistance': 'resistance', 
            'effect-normal': 'effetNormal',
            'effect-critical': 'effetCritique', 
            'effect-failure': 'effetEchec'
          };
          const targetProperty = propertyMap[property] || property;
          spell[targetProperty] = content;
          return true;
        }
      }
      
      return false;
    },

    saveToDon(donName, property, content) {
      if (!window.DONS) return;
      for (const category of window.DONS) {
        const don = category.dons.find(d => d.nom === donName);
        if (don) {
          const propertyMap = { 'name': 'nom', 'description': 'description', 'prerequis': 'prerequis', 'cout': 'cout' };
          don[propertyMap[property] || property] = content;
          break;
        }
      }
    },

    saveToClass(className, editType, content) {
      if (!window.CLASSES) return;
      const classe = window.CLASSES.find(c => c.nom === className);
      if (!classe) return;
      
      if (editType === 'resume') {
        classe.resume = content;
      } else if (editType === 'capacites') {
        classe.capacites = this.parseListContent(content);
      }
    },

    saveToSubclass(editSection, editType, content) {
      if (!editSection || !window.CLASSES) return;
      
      const parts = editSection.split('-');
      if (parts.length < 2) return;
      
      const className = parts[0];
      const subClassName = parts.slice(1).join('-');
      
      const classe = window.CLASSES.find(c => c.nom === className);
      if (!classe || !classe.sousClasses) return;
      
      const sousClasse = classe.sousClasses.find(sc => sc.nom === subClassName);
      if (!sousClasse) return;
      
      if (editType === 'subclass-progression') {
        sousClasse.progression = content;
      } else if (editType === 'subclass-capacites') {
        sousClasse.capacites = this.parseListContent(content);
      } else if (editType === 'subclass-stats') {
        sousClasse.base = this.parseStatsContent(content);
      }
    },

    // Helper methods for parsing content (only when needed)
    parseListContent(content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const listItems = tempDiv.querySelectorAll('li');
      return Array.from(listItems).map(li => li.innerHTML);
    },

    parseStatsContent(content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const chips = tempDiv.querySelectorAll('.chip');
      const stats = {};
      
      chips.forEach(chip => {
        const text = chip.textContent.trim();
        const match = text.match(/(.+?):\s*(.+)/);
        if (match) {
          const statName = match[1].replace(/^[^\w]+/, '').trim(); // Remove emoji
          const statValue = match[2].trim();
          stats[statName] = statValue;
        }
      });
      
      return stats;
    },

    // Update individual list item in static pages
    updateListItem(element, content) {
      const editSection = element.dataset.editSection;
      const editIndex = parseInt(element.dataset.editIndex);
      
      console.log('🔍 updateListItem:', {editSection, editIndex, content: content.substring(0, 50) + '...'});
      
      if (!window.STATIC_PAGES) {
        console.error('❌ window.STATIC_PAGES not found');
        return false;
      }
      
      const article = element.closest('article[data-static-page="true"]');
      if (!article) {
        console.error('❌ No static page article found');
        return false;
      }
      
      const pageId = article.dataset.page;
      const pageData = window.STATIC_PAGES[pageId];
      
      if (!pageData || !pageData.sections) {
        console.error('❌ No page data or sections found');
        return false;
      }
      
      // Find the list in the page data
      for (let i = 0; i < pageData.sections.length; i++) {
        const section = pageData.sections[i];
        
        if (section.type === 'card' && section.content) {
          if (section.content.type === 'ordered_list' && section.content.editType === editSection) {
            console.log('✅ Found ordered list, updating item', editIndex);
            section.content.items[editIndex] = content;
            return true;
          }
          
          if (section.content.type === 'list' && section.content.editType === editSection) {
            console.log('✅ Found unordered list, updating item', editIndex);
            section.content.items[editIndex] = content;
            return true;
          }
        }
      }
      
      console.warn('⚠️ List not found for editSection:', editSection);
      return false;
    },

    // Normalize HTML content to ensure consistency across browsers and editing
    normalizeHTMLContent(html) {
      // Create a temporary div to parse and normalize the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Remove any contenteditable artifacts
      this.removeContentEditableArtifacts(tempDiv);
      
      // Normalize whitespace and formatting
      let normalized = tempDiv.innerHTML;
      
      // Preserve important HTML entities and structure
      normalized = this.preserveHTMLStructure(normalized);
      
      return normalized.trim();
    },

    // Remove contenteditable artifacts that browsers might add
    removeContentEditableArtifacts(container) {
      // Remove any empty text nodes or unnecessary spans
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_ALL,
        null,
        false
      );

      const nodesToRemove = [];
      let node;
      
      while (node = walker.nextNode()) {
        // Remove empty text nodes with only whitespace
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === '') {
          // But preserve intentional &nbsp; and single spaces in specific contexts
          if (node.textContent !== '\u00a0' && node.parentNode.tagName !== 'SPAN') {
            nodesToRemove.push(node);
          }
        }
        
        // Remove empty spans without attributes or with only style="font-weight: normal" etc.
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
          if (!node.hasAttributes() && node.textContent.trim() === '') {
            nodesToRemove.push(node);
          }
        }
        
        // Remove Firefox/Chrome artifacts like <div><br></div>
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV') {
          if (node.innerHTML === '<br>' || node.innerHTML === '<br/>') {
            // Replace with just <br>
            const br = document.createElement('br');
            node.parentNode.replaceChild(br, node);
          }
        }
      }
      
      // Remove identified nodes
      nodesToRemove.forEach(node => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    },

    // Preserve important HTML structure and entities
    preserveHTMLStructure(html) {
      // Ensure consistent formatting for common patterns
      
      // Normalize <br> tags (some browsers use <br/>, others <br>)
      html = html.replace(/<br\s*\/?>/gi, '<br>');
      
      // Preserve color styling (ensure it's properly formatted)
      html = html.replace(/style\s*=\s*["']([^"']*color\s*:\s*[^;"']+[^"']*)["']/gi, (match, styleContent) => {
        // Clean up the style content
        const cleanStyle = styleContent.trim().replace(/\s+/g, ' ');
        return `style="${cleanStyle}"`;
      });
      
      // Preserve &nbsp; entities
      html = html.replace(/\u00a0/g, '&nbsp;');
      
      // Ensure consistent quote usage in attributes
      html = html.replace(/(\w+)\s*=\s*'([^']*)'/g, '$1="$2"');
      
      return html;
    },

    // Save changes to localStorage immediately when edits are made
    saveChangesToStorage() {
      try {
        // Save only edited data overlay (not full data)
        localStorage.setItem('jdr-bab-edits', JSON.stringify(this.editedData));
        
        // Save timestamp of last modification
        localStorage.setItem('jdr-bab-last-modified', Date.now().toString());
        
        
      } catch (error) {
        console.error('❌ Failed to save changes to localStorage:', error);
      }
    }
  };

})();