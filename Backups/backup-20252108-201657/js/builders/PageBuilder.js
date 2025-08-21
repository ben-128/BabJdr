// ============================================================================
// JDR-BAB APPLICATION - PAGE BUILDER
// ============================================================================

(() => {
  "use strict";

  class PageBuilder {
    constructor() {
      // Will use unified dev mode check
    }

    // Simple unified dev mode check
    get shouldShowEditButtons() {
      return JdrApp.utils.isDevMode();
    }

    static getInstance() {
      if (!PageBuilder.instance) {
        PageBuilder.instance = new PageBuilder();
      }
      return PageBuilder.instance;
    }

    buildCategoryPage(type, category) {
      const config = window.ContentTypes[type];
      
      // Gestion spéciale pour les objets (page unique avec filtres)
      if (type === 'objet' && config.pageType === 'single') {
        return this.buildSingleObjectPage(category);
      }
      
      const pageId = `${config.container}-${this.sanitizeId(category.nom)}`;
      const itemsProperty = this.getItemsProperty(type);
      
      // Get items and sort them for spells
      let items = category[itemsProperty] || [];
      if (type === 'spell') {
        items = this.sortSpellsByLevel([...items]);
      }

      return `
        <article class="" data-page="${pageId}">
          <section>
            ${this.buildCategoryHeader(category, type)}
            ${type === 'spell' ? this.buildSpellLevelFilter() : ''}
            <div style="display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;">
              ${this.buildAddButton(type, category.nom)}
              ${this.buildDeleteCategoryButton(type, category.nom)}
            </div>
            <div class="grid cols-2" id="${config.container}-container-${this.sanitizeId(category.nom)}">
              ${items.map((item, index) => 
                CardBuilder.create(type, item, category.nom).build()
              ).join('')}
            </div>
          </section>
        </article>
      `;
    }
    
    buildSingleObjectPage(objectData) {
      const config = window.ContentTypes['objet'];
      const allObjects = objectData.objets || [];
      const filterSettings = objectData.filterSettings || {};
      const visibleTags = filterSettings.visibleTags || config.filterConfig.defaultVisibleTags;
      
      // Filtrer les objets selon les tags visibles
      const filteredObjects = allObjects.filter(obj => 
        obj.tags && obj.tags.some(tag => visibleTags.includes(tag))
      );
      
      return `
        <article class="" data-page="objets">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2>📦 Objets</h2>
              ${this.buildIllustration('page:objets')}
            </div>
            
            ${this.buildTagFilters(visibleTags, config.filterConfig.availableTags)}
            
            <div style="display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;">
              ${this.buildAddButton('objet', 'objets')}
              ${this.buildFilterManagerButton()}
            </div>
            
            <div class="grid cols-2" id="objets-container">
              ${filteredObjects.map((item, index) => 
                CardBuilder.create('objet', item, 'objets').build()
              ).join('')}
            </div>
            
            ${filteredObjects.length === 0 ? '<p style="text-align: center; color: #666; margin: 2rem 0;">Aucun objet ne correspond aux filtres sélectionnés.</p>' : ''}
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
        <div style="text-align:center;margin-bottom:2rem;">
          ${this.buildEditableTitle(category.nom, `${type}-category-name`)}
          ${this.buildIllustration(`${type}category:${category.nom}`)}
        </div>
        ${this.buildEditableSection(category.description, `${type}-category-description`, 'paragraph', category.nom)}
      `;
    }

    buildClassHeader(classData) {
      return `
        <div style="text-align:center;margin-bottom:2rem;">
          ${this.buildEditableTitle(classData.nom, 'class-name', classData.nom)}
          ${this.buildIllustration(`class:${classData.nom}`)}
        </div>
      `;
    }

    buildStaticPageHeader(pageData) {
      return `
        <div style="text-align:center;margin-bottom:2rem;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <h2 class="editable editable-title" data-edit-type="generic" data-edit-section="page-title">${pageData.title}</h2>
            ${this.buildEditButton('title')}
          </div>
          ${this.buildIllustration(`page:${pageData.page}`)}
        </div>
      `;
    }

    buildEditableTitle(content, editType, editSection = null) {
      return `
        <div style="display:inline-flex;align-items:center;gap:8px;justify-content:center;">
          <h2 class="editable editable-title" data-edit-type="generic" data-edit-section="${editSection || content}">${content}</h2>
          ${this.buildEditButton('title')}
        </div>
      `;
    }

    buildEditableSection(content, editType, sectionType, editSection) {
      const className = sectionType === 'paragraph' ? 'lead editable editable-paragraph' : 'editable editable-field';
      
      return `
        <div class="editable-section" data-section-type="${editType}">
          <p class="${className}" data-edit-type="generic" data-edit-section="${editSection}">${content}</p>
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
          <div class="editable" data-edit-type="generic" data-edit-section="${editSection}">
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
            return this.buildGridSection(section, sectionIndex);
          default:
            return `<div><!-- Unknown section type: ${section.type} --></div>`;
        }
      }).join('');
    }

    buildIntroSection(section, sectionIndex) {
      return `
        <div class="editable-section" data-section-type="intro" data-section-index="${sectionIndex}">
          <p class="editable editable-intro" data-edit-type="generic" data-edit-section="intro">${section.content}</p>
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
            <h3 class="editable editable-card-title" data-edit-type="generic" data-edit-section="${cardData.id}-title">${cardData.title}</h3>
            ${this.buildEditButton('title')}
            ${this.buildRemoveSectionButton(cardData.sectionType)}
          </div>
        `;
      } else {
        cardHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="generic" data-edit-section="${cardData.id}-title">${cardData.title}</h3>
            ${this.buildEditButton('title')}
          </div>
        `;
      }

      // Handle different content formats
      let htmlContent = '';
      let editSection = cardData.id || 'card-' + sectionIndex;
      
      if (typeof cardData.content === 'string') {
        // Direct HTML string
        htmlContent = cardData.content;
      } else if (typeof cardData.content === 'object' && cardData.content?.content) {
        // Object with nested content property
        htmlContent = cardData.content.content;
        if (cardData.content.editSection) {
          editSection = cardData.content.editSection;
        }
      } else {
        htmlContent = cardData.content || '';
      }
      
      cardHTML += `
        <div style="position:relative;">
          <div class="editable" data-edit-type="generic" data-edit-section="${editSection}">${htmlContent}</div>
          ${this.buildEditButton('section')}
        </div>
      `;

      if (cardData.deletable && cardData.sectionName) {
        // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
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
            <p class="editable editable-paragraph" data-edit-type="generic" data-edit-section="${item.editSection}">${item.content}</p>
            ${this.buildEditButton('paragraph')}
          </div>
        `;
        const addBtn = this.buildAddParagraphButton(item.editSection);
        return content + addBtn;
      }
      return `<div>${item.content}</div>`;
    }

    buildGridSection(gridSection, sectionIndex) {
      const items = gridSection.content || gridSection.items || [];
      if (!Array.isArray(items)) {
        return '<div><!-- Grid items is not an array --></div>';
      }

      const cols = gridSection.cols || 2;
      let gridHTML = `<div class="grid" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 1rem;">`;
      
      items.forEach((item, itemIndex) => {
        gridHTML += this.buildCardSection(item, `${sectionIndex}-${itemIndex}`);
      });
      
      gridHTML += '</div>';
      return gridHTML;
    }

    buildComplexContent(content) {
      // Generic HTML content - no special processing
      return content || '';
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

      if (JdrApp.utils.isDevMode()) {
        return `
          <div class="illus" data-illus-key="${illusKey}" data-bound="1">
            <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
            <label class="up">📷 Ajouter<input accept="image/*" hidden="" type="file"></label>
            <button class="rm" type="button" style="${removeStyle}">🗑 Retirer</button>
          </div>
        `;
      }
      
      return `
        <div class="illus" data-illus-key="${illusKey}" data-bound="1">
          <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
        </div>
      `;
    }

    buildEditButton(type) {
      const titles = {
        title: 'Éditer le titre',
        paragraph: 'Éditer ce paragraphe',
        field: 'Éditer ce champ',
        list: 'Éditer cette liste',
        section: 'Éditer cette section'
      };

      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="edit-btn edit-${type}-btn" title="${titles[type] || 'Éditer'}">✏️</button>`;
    }

    buildAddButton(type, categoryName) {
      const config = window.ContentTypes[type];
      const icon = config?.icons?.add || '➕';
      
      // ALWAYS generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="${type}-add btn" data-category-name="${categoryName}" type="button" style="background: var(--accent); color: white;">${icon} Ajouter un ${type === 'spell' ? 'sort' : type === 'don' ? 'don' : 'élément'}</button>`;
    }

    buildDeleteCategoryButton(type, categoryName) {
      const config = window.ContentTypes[type];
      const deleteIcon = config?.icons?.delete || '🗑️';
      
      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="${type}-category-delete btn" data-category-name="${categoryName}" data-category-type="${type}" type="button" style="background: #dc2626; color: white;">${deleteIcon} Supprimer catégorie</button>`;
    }

    buildAddSubclassButton() {
      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<div class="add-subclass-btn">➕ Ajouter une sous-classe</div>`;
    }

    buildAddSectionButton() {
      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<div class="add-paragraph-btn" data-target="section">➕ Ajouter une nouvelle section</div>`;
    }

    buildAddParagraphButton(target) {
      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<div class="add-paragraph-btn" data-target="${target}">➕ Ajouter un paragraphe</div>`;
    }

    buildRemoveSectionButton(sectionType) {
      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="remove-section-btn" data-section-type="${sectionType}" type="button" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">🗑 Supprimer section</button>`;
    }

    getItemsProperty(type) {
      switch (type) {
        case 'spell': return 'sorts';
        case 'don': return 'dons';
        case 'objet': return 'objets';
        case 'class': return 'sousClasses';
        default: return 'items';
      }
    }

    // Extract level number from prerequis text
    extractLevelFromPrerequisite(prerequis) {
      if (!prerequis) return 0;
      const match = prerequis.match(/Niveau (\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    }

    // Sort spells by level (prerequisite level)
    sortSpellsByLevel(spells) {
      return spells.sort((a, b) => {
        const levelA = this.extractLevelFromPrerequisite(a.prerequis);
        const levelB = this.extractLevelFromPrerequisite(b.prerequis);
        return levelA - levelB;
      });
    }

    // Build spell level filter UI
    buildSpellLevelFilter() {
      return `
        <div class="spell-level-filter" style="margin: 1rem 0; padding: 1rem; background: var(--card); border: 2px solid var(--rule); border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <label style="font-weight: 600; color: var(--accent-ink);">
              🎯 Filtrer par niveau maximum :
            </label>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input 
                type="number" 
                id="spell-level-filter" 
                min="0" 
                max="20" 
                value="20"
                style="width: 80px; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 6px; text-align: center; font-weight: 600;"
              >
              <button 
                id="reset-spell-filter" 
                class="btn small" 
                style="background: var(--bronze); color: white; padding: 0.5rem 1rem;"
                title="Réinitialiser le filtre"
              >
                🔄 Tout afficher
              </button>
            </div>
          </div>
        </div>
      `;
    }

    buildTagFilters(visibleTags, availableTags) {
      const filterChips = visibleTags.map(tag => 
        `<span class="filter-chip active" data-tag="${tag}">${tag}</span>`
      ).join('');
      
      return `
        <div class="tag-filters" style="margin: 1rem 0; padding: 1rem; background: var(--card); border: 2px solid var(--rule); border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <label style="font-weight: 600; color: var(--accent-ink);">
              🏷️ Filtres actifs :
            </label>
            <div class="filter-chips" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${filterChips}
            </div>
          </div>
        </div>
      `;
    }
    
    buildFilterManagerButton() {
      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="filter-manager-btn btn" type="button" style="background: var(--bronze); color: white;">⚙️ Gérer les filtres</button>`;
    }

    sanitizeId(str) {
      return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
  }

  window.PageBuilder = PageBuilder.getInstance();

})();