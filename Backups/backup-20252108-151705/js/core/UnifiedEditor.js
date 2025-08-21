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
      const editableElement = element.classList.contains('editable-section') 
        ? element.querySelector('.editable') 
        : element;

      if (!editableElement) return null;

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
        const categoryName = spellCard.dataset.categoryName;
        
        // Use index-based detection for spell sections
        const allEditables = Array.from(spellCard.querySelectorAll('.editable'));
        const editableElement = element.classList.contains('editable') ? element : element.querySelector('.editable');
        const currentIndex = allEditables.indexOf(editableElement);
        
        // Map index to spell property based on CardBuilder order
        // 0=nom, 1=description, 2=prerequis, 3=portee, 4=coutMana, 5=tempsIncantation, 6=resistance, 7=effetNormal, 8=effetCritique, 9=effetEchec
        const spellSections = ['nom', 'description', 'prerequis', 'portee', 'coutMana', 'tempsIncantation', 'resistance', 'effetNormal', 'effetCritique', 'effetEchec'];
        const spellEditSection = spellSections[currentIndex] || 'description';
        
        return {
          contentType: 'spell',
          itemIdentifier: spellName,
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
          categoryName: categoryName,
          property: 'html',
          editType: 'html',
          editSection: donEditSection,
          config: window.ContentTypes.don,
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
            // UPDATED ORDER: Index 0 = nom (title), Index 1 = base (stats), Index 2 = progression, Index 3+ = capacites
            if (element.closest('.stats-grid') || currentIndex === 1) {
              subclassEditSection = 'base';
            } else if (currentIndex === 0) {
              subclassEditSection = 'nom';
            } else if (currentIndex === 2) {
              subclassEditSection = 'progression';  
            } else if (currentIndex >= 3) {
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



    // Start editing session
    startEdit(element) {
      const context = this.parseEditContext(element);
      if (!context) return false;

      if (this.currentEditSession) {
        this.saveCurrentEdit();
      }

      this.currentEditSession = {
        ...context,
        originalContent: context.element.innerHTML,
        startTime: Date.now()
      };

      this.makeElementEditable(context.element, context.container);
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
            targetObject = category[itemsKey]?.find(item => item.nom === session.itemIdentifier);
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
  }

  window.UnifiedEditor = UnifiedEditor.getInstance();

})();