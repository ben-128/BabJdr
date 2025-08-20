// ============================================================================
// JDR-BAB APPLICATION - PAGE BUILDER
// ============================================================================

(() => {
  "use strict";

  class PageBuilder {
    constructor() {
      this.shouldShowEditButtons = !window.STANDALONE_VERSION;
    }

    static getInstance() {
      if (!PageBuilder.instance) {
        PageBuilder.instance = new PageBuilder();
      }
      return PageBuilder.instance;
    }

    buildCategoryPage(type, category) {
      const config = window.ContentTypes[type];
      const pageId = `${config.container}-${this.sanitizeId(category.nom)}`;
      const itemsProperty = this.getItemsProperty(type);

      return `
        <article class="" data-page="${pageId}">
          <section>
            ${this.buildCategoryHeader(category, type)}
            ${this.buildAddButton(type, category.nom)}
            <div class="grid cols-2">
              ${category[itemsProperty] ? category[itemsProperty].map((item, index) => 
                CardBuilder.create(type, item, category.nom).build()
              ).join('') : ''}
            </div>
          </section>
        </article>
      `;
    }

    buildClassPage(classData) {
      const pageId = this.sanitizeId(classData.nom);
      
      return `
        <article class="" data-page="${pageId}" data-page-title="${classData.nom}">
          <section>
            ${this.buildClassHeader(classData)}
            ${this.buildEditableSection(classData.resume, 'class-resume', 'paragraph', classData.nom)}
            <h3>Capacités de classe</h3>
            ${this.buildSimpleEditableContent(classData.capacites, 'class-capacites', classData.nom)}
            <h3>Sous-classes</h3>
            <div class="subclass-stack">
              ${classData.sousClasses ? classData.sousClasses.map(sousClasse => 
                CardBuilder.create('subclass', sousClasse, classData.nom).build()
              ).join('') : ''}
            </div>
            ${this.buildAddSubclassButton()}
          </section>
        </article>
      `;
    }

    buildStaticPage(pageId, pageData) {
      const isActive = pageId === 'creation' ? 'active' : '';
      
      return `
        <article class="${isActive}" data-page="${pageData.page}" data-static-page="true" data-page-title="${pageData.title}">
          <section>
            ${this.buildStaticPageHeader(pageData)}
            ${this.buildSections(pageData.sections)}
            ${this.buildAddSectionButton()}
          </section>
        </article>
      `;
    }

    buildCategoryHeader(category, type) {
      const config = window.ContentTypes[type];
      
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          ${this.buildEditableTitle(category.nom, `${type}-category-name`)}
          ${this.buildIllustration(`${type}category:${category.nom}`)}
        </div>
        ${this.buildEditableSection(category.description, `${type}-category-description`, 'paragraph', category.nom)}
      `;
    }

    buildClassHeader(classData) {
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          ${this.buildEditableTitle(classData.nom, 'class-name', classData.nom)}
          ${this.buildIllustration(`class:${classData.nom}`)}
        </div>
      `;
    }

    buildStaticPageHeader(pageData) {
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          ${this.buildEditableTitle(pageData.title, 'page-title', pageData.page)}
          ${this.buildIllustration(`page:${pageData.page}`)}
        </div>
      `;
    }

    buildEditableTitle(content, editType, editSection = null) {
      return `
        <h2 class="editable editable-title" data-edit-type="${editType}" data-edit-section="${editSection || content}">${content}</h2>
        ${this.buildEditButton('title')}
      `;
    }

    buildEditableSection(content, editType, sectionType, editSection) {
      const className = sectionType === 'paragraph' ? 'lead editable editable-paragraph' : 'editable editable-field';
      
      return `
        <div class="editable-section" data-section-type="${editType}">
          <p class="${className}" data-edit-type="${editType}" data-edit-section="${editSection}">${content}</p>
          ${this.buildEditButton(sectionType)}
        </div>
      `;
    }


    buildSimpleEditableContent(content, editType, editSection) {
      // Everything should be HTML format only
      let htmlContent;
      if (typeof content === 'string') {
        htmlContent = content || '';
      } else {
        // Fallback if somehow still array format - convert once and warn
        console.warn('Found array format in buildSimpleEditableContent, converting to HTML:', content);
        if (Array.isArray(content)) {
          htmlContent = '<ul>' + content.map(item => '<li>' + item + '</li>').join('') + '</ul>';
        } else {
          htmlContent = '';
        }
      }
      
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable" data-edit-type="html" data-edit-section="${editSection}">
            ${htmlContent}
          </div>
          ${this.buildEditButton('section')}
        </div>
      `;
    }

    buildSections(sections) {
      return sections.map((section, sectionIndex) => {
        switch (section.type) {
          case 'intro':
            return this.buildIntroSection(section, sectionIndex);
          case 'card':
            return this.buildCardSection(section, sectionIndex);
          case 'grid':
            // Grid is now just HTML content
            return this.buildComplexContent(section);
          default:
            return `<div><!-- Unknown section type: ${section.type} --></div>`;
        }
      }).join('');
    }

    buildIntroSection(section, sectionIndex) {
      return `
        <div class="editable-section" data-section-type="intro" data-section-index="${sectionIndex}">
          <p class="editable editable-intro" data-edit-type="intro" data-edit-section="intro">${section.content}</p>
          ${this.buildEditButton('section')}
        </div>
        ${this.buildAddParagraphButton('intro')}
      `;
    }

    buildCardSection(cardData, sectionIndex) {
      let cardHTML = `<div class="card editable-section" data-section-type="card" data-section-index="${sectionIndex}">`;
      
      if (cardData.deletable && cardData.sectionType) {
        cardHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="card-title" data-edit-section="${cardData.sectionType}-title">${cardData.title}</h3>
            ${this.buildEditButton('title')}
            ${this.buildRemoveSectionButton(cardData.sectionType)}
          </div>
        `;
      } else {
        cardHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="card-title" data-edit-section="card-${sectionIndex}">${cardData.title}</h3>
            ${this.buildEditButton('title')}
          </div>
        `;
      }

      // Everything should be HTML string format only
      if (typeof cardData.content === 'string') {
        cardHTML += `<div>${cardData.content}</div>`;
      } else if (typeof cardData.content === 'object' && cardData.content.content) {
        // Object with content property (like {type: "html", content: "..."})
        cardHTML += this.buildComplexContent(cardData.content);
      } else {
        // Fallback for legacy formats - warn and convert
        console.warn('Found non-string content in card, converting:', cardData.content);
        if (Array.isArray(cardData.content)) {
          cardHTML += cardData.content.map(item => this.buildContentItem(item)).join('');
        } else {
          cardHTML += `<div>${cardData.content || ''}</div>`;
        }
      }

      if (cardData.deletable && cardData.sectionName && this.shouldShowEditButtons) {
        cardHTML += `
          <div style="margin-top: 1rem; text-align: center;">
            <button class="section-delete btn small" data-section-name="${cardData.sectionName}" type="button" style="background: #ff6b6b; color: white;">🗑 Supprimer section</button>
          </div>
        `;
      }
      
      cardHTML += `</div>`;
      return cardHTML;
    }


    buildContentItem(item) {
      if (item.type === 'paragraph') {
        const content = `
          <div class="editable-section" data-section-type="paragraph">
            <p class="editable editable-paragraph" data-edit-type="paragraph" data-edit-section="${item.editSection}">${item.content}</p>
            ${this.buildEditButton('paragraph')}
          </div>
        `;
        const addBtn = this.buildAddParagraphButton(item.editSection);
        return content + addBtn;
      }
      return `<div>${item.content}</div>`;
    }

    buildComplexContent(content) {
      // Everything is just HTML now - content should already be HTML
      const editType = content.editType || 'content';
      const htmlContent = content.content || '';
      
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable" data-edit-type="html" data-edit-section="${editType}">
            ${htmlContent}
          </div>
          ${this.buildEditButton('section')}
        </div>
      `;
    }


    buildIllustration(illusKey, altText = '') {
      let imageUrl = '';
      let imageStyle = 'display: none;';
      let removeStyle = 'display: none;';
      
      if (window.JdrApp?.modules?.images?.getImageUrl) {
        imageUrl = window.JdrApp.modules.images.getImageUrl(illusKey);
        if (imageUrl) {
          imageUrl = window.JdrApp.modules.images.processImageUrl(imageUrl);
          imageStyle = 'display: inline-block;';
          removeStyle = 'display: inline-flex;';
        }
      }

      if (window.STANDALONE_VERSION) {
        return `
          <div class="illus" data-illus-key="${illusKey}" data-bound="1">
            <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
          </div>
        `;
      }
      
      return `
        <div class="illus" data-illus-key="${illusKey}" data-bound="1">
          <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
          <label class="up">📷 Ajouter<input accept="image/*" hidden="" type="file"></label>
          <button class="rm" type="button" style="${removeStyle}">🗑 Retirer</button>
        </div>
      `;
    }

    buildEditButton(type) {
      if (!this.shouldShowEditButtons) return '';
      
      const titles = {
        title: 'Éditer le titre',
        paragraph: 'Éditer ce paragraphe',
        field: 'Éditer ce champ',
        list: 'Éditer cette liste',
        section: 'Éditer cette section'
      };

      return `<button class="edit-btn edit-${type}-btn" title="${titles[type] || 'Éditer'}">✏️</button>`;
    }

    buildAddButton(type, categoryName) {
      if (!this.shouldShowEditButtons) return '';
      
      const config = window.ContentTypes[type];
      const icon = config?.icons?.add || '➕';
      
      return `<button class="${type}-add" data-category-name="${categoryName}" type="button">${icon} Ajouter un ${type === 'spell' ? 'sort' : type === 'don' ? 'don' : 'élément'}</button>`;
    }

    buildAddSubclassButton() {
      if (!this.shouldShowEditButtons) return '';
      return `<div class="add-subclass-btn">➕ Ajouter une sous-classe</div>`;
    }

    buildAddSectionButton() {
      if (!this.shouldShowEditButtons) return '';
      return `<div class="add-paragraph-btn" data-target="section">➕ Ajouter une nouvelle section</div>`;
    }

    buildAddParagraphButton(target) {
      if (!this.shouldShowEditButtons) return '';
      return `<div class="add-paragraph-btn" data-target="${target}">➕ Ajouter un paragraphe</div>`;
    }

    buildRemoveSectionButton(sectionType) {
      if (!this.shouldShowEditButtons) return '';
      return `<button class="remove-section-btn" data-section-type="${sectionType}" type="button" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">🗑 Supprimer section</button>`;
    }

    getItemsProperty(type) {
      switch (type) {
        case 'spell': return 'sorts';
        case 'don': return 'dons';
        case 'class': return 'sousClasses';
        default: return 'items';
      }
    }

    sanitizeId(str) {
      return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
  }

  window.PageBuilder = PageBuilder.getInstance();

})();