// ============================================================================
// JDR-BAB APPLICATION - UNIFIED EDITOR SYSTEM
// ============================================================================

(() => {
  "use strict";

  class UnifiedEditor {
    constructor() {
      this.currentEditSession = null;
    }

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

      // Legacy support for old edit types
      const editSpell = editableElement.dataset.editSpell;
      const editDon = editableElement.dataset.editDon;
      
      // Determine content type and item identifier
      let contentType, itemIdentifier, categoryName;
      
      if (editSpell) {
        contentType = 'spell';
        itemIdentifier = editSpell;
        categoryName = this.findItemCategory('spell', editSpell);
      } else if (editDon) {
        contentType = 'don';
        itemIdentifier = editDon;
        categoryName = this.findItemCategory('don', editDon);
      } else if (editSection && editSection.includes('-')) {
        // Handle class/subclass items
        const parts = editSection.split('-');
        if (parts.length >= 2) {
          if (editType.startsWith('subclass-')) {
            contentType = 'subclass';
            itemIdentifier = parts.slice(1).join('-'); // subclass name
            categoryName = parts[0]; // class name (parent)
          } else if (editType.startsWith('class-')) {
            contentType = 'class';
            itemIdentifier = parts[0]; // class name
            categoryName = null;
          }
        }
      } else {
        // Static page content
        return this.parseStaticPageContext(element, editType, editSection);
      }

      const config = window.ContentTypes[contentType];
      if (!config) return null;

      const property = config.editMapping[editType];
      if (!property) return null;

      return {
        contentType,
        itemIdentifier,
        categoryName,
        property,
        editType,
        config,
        element: editableElement,
        container: element
      };
    }

    parseHtmlEditContext(element, editSection) {
      // Detect context automatically based on page structure
      
      // Check if we're in a static page
      const staticPageArticle = element.closest('article[data-static-page="true"]');
      if (staticPageArticle) {
        return {
          contentType: 'staticPage',
          itemIdentifier: staticPageArticle.dataset.page,
          categoryName: null,
          property: 'html',
          editType: 'html',
          editSection,
          config: window.ContentTypes.staticPage,
          element: element.classList.contains('editable-section') ? element.querySelector('.editable') : element,
          container: element
        };
      }
      
      // Check if we're in a class page
      const classArticle = element.closest('article[data-page-title]');
      if (classArticle) {
        const className = classArticle.dataset.pageTitle;
        
        // Check if we're editing a subclass (look for subclass card)
        const subclassCard = element.closest('.card[data-subclass-name]');
        if (subclassCard) {
          // Determine what part of the subclass we're editing
          let subclassEditSection = 'content';
          if (element.closest('.stats-grid')) {
            subclassEditSection = 'base';
          } else if (element.textContent.includes('Progression')) {
            subclassEditSection = 'progression';  
          } else if (element.closest('ul') || element.textContent.includes('Capacité')) {
            subclassEditSection = 'capacites';
          }
          
          console.log('Subclass edit detected:', {
            subclassName: subclassCard.dataset.subclassName,
            className: className,
            editSection: subclassEditSection
          });
          
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
        if (element.textContent.includes('Résumé') || element.closest('.class-resume')) {
          classEditSection = 'resume';
        } else if (element.closest('ul') || element.textContent.includes('Capacité')) {
          classEditSection = 'capacites';
        }
        
        console.log('Class edit detected:', {
          className: className,
          editSection: classEditSection
        });
        
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

    parseStaticPageContext(element, editType, editSection) {
      const article = element.closest('article[data-static-page="true"]');
      if (!article) return null;

      return {
        contentType: 'staticPage',
        itemIdentifier: article.dataset.page,
        categoryName: null,
        property: editType,
        editType,
        editSection,
        config: window.ContentTypes.staticPage,
        element: element.classList.contains('editable-section') ? element.querySelector('.editable') : element,
        container: element
      };
    }

    findItemCategory(contentType, itemName) {
      const entity = ContentFactory.getEntity(contentType);
      if (!entity) return null;

      const result = entity.findItem(itemName);
      return result ? result.category : null;
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
      container.dataset.originalContent = editableElement.innerHTML;
      container.dataset.editing = 'true';

      // Show HTML source for editing
      const htmlSource = editableElement.innerHTML;
      editableElement.textContent = htmlSource;
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

      if (normalizedContent !== session.originalContent) {
        const success = this.saveContent(session, normalizedContent);
        if (success) {
          // Convert back from text to rendered HTML
          session.element.innerHTML = normalizedContent;
          this.applyElementColoring(session.container);
          
          EventBus.emit(Events.CONTENT_UPDATE, {
            contentType: session.contentType,
            itemIdentifier: session.itemIdentifier,
            property: session.property,
            value: normalizedContent
          });
        }
      } else {
        // Even if no changes, restore HTML rendering
        session.element.innerHTML = session.originalContent;
      }

      this.resetEditingState(session.container);
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
          case 'staticPage':
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

      console.log('Saving to JSON:', {
        jsonCategory,
        contentType: session.contentType,
        itemIdentifier: session.itemIdentifier,
        categoryName: session.categoryName,
        editSection: session.editSection,
        content: content.substring(0, 50) + '...'
      });

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
      } else if (session.contentType === 'staticPage') {
        return this.saveStaticPageToJson(jsonData, session, content);
      }
      
      if (targetObject) {
        console.log('Found target object:', targetObject.nom);
        targetObject[session.editSection] = content;
        console.log('Saved content to section:', session.editSection);
        return true;
      } else {
        console.log('Target object not found');
        return false;
      }
    }


    saveStaticPageToJson(jsonData, session, content) {
      const pageData = jsonData[session.itemIdentifier];
      if (pageData?.sections) {
        // Find and update the specific section
        for (const section of pageData.sections) {
          if (section.type === 'intro' && session.editSection === 'intro') {
            section.content = content;
            return true;
          }
          
          if (section.type === 'card') {
            if (section.content && section.content.editType === session.editSection) {
              section.content = {
                type: 'html',
                editType: session.editSection,
                content: content
              };
              return true;
            }
          }
        }
      }
      return false;
    }

    // No special processing - everything is just HTML now
    processContentByType(content, fieldConfig) {
      return content;
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

    applyElementColoring(container) {
      setTimeout(() => {
        Object.entries(window.ElementColors).forEach(([element, style]) => {
          const regex = new RegExp(`\\b${element}\\b`, 'g');
          const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );

          const textNodes = [];
          let node;
          while (node = walker.nextNode()) {
            if (regex.test(node.textContent)) {
              textNodes.push(node);
            }
          }

          textNodes.forEach(textNode => {
            const content = textNode.textContent.replace(regex, 
              `<span style="color: ${style.color}; font-weight: ${style.weight};">${element}</span>`
            );
            if (content !== textNode.textContent) {
              const wrapper = document.createElement('span');
              wrapper.innerHTML = content;
              textNode.parentNode.replaceChild(wrapper, textNode);
            }
          });
        });
      }, 500);
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
      session.element.innerHTML = session.originalContent;
      this.resetEditingState(session.container);
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