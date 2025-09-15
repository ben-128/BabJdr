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
      
      // Gestion spéciale pour les tables de trésors (page unique)
      if (type === 'tableTresor' && config.pageType === 'single') {
        return this.buildSingleTableTresorPage(category);
      }
      
      const pageId = `${config.container}-${this.sanitizeId(category.nom || 'unknown')}`;
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
                CardBuilder.create(type, item, category.nom, index).build()
              ).join('')}
            </div>
            ${this.buildGeneralDonsSection(type, category.nom)}
          </section>
        </article>
      `;
    }
    
    buildSingleObjectPage(objectData) {
      const allObjects = objectData.objets || [];
      
      // Objects page now only shows ID search - all objects hidden by default
      return `
        <article class="" data-page="objets">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2>📦 Objets</h2>
              ${this.buildIllustration('page:objets')}
            </div>
            
            ${this.buildPageDescription('objet')}
            
            ${this.buildIdSearchFilter()}
            
            <div class="grid cols-2" id="objets-container">
              ${allObjects.map((item, index) => {
                const cardHTML = CardBuilder.create('objet', item, 'objets', index).build();
                // Show only the searched object if ID search is active
                if (window.activeIdSearch && window.activeSearchId) {
                  if (item.numero === window.activeSearchId) {
                    return cardHTML; // Show this object
                  } else {
                    return cardHTML.replace('<div class="card', '<div class="card" style="display: none;"'); // Hide others
                  }
                } else {
                  // Hide all objects by default when no search is active
                  return cardHTML.replace('<div class="card', '<div class="card" style="display: none;"');
                }
              }).join('')}
            </div>
            
            ${!window.activeIdSearch ? '<p style="text-align: center; color: #666; margin: 2rem 0;">Utilisez la recherche par ID ci-dessus pour trouver un objet spécifique.</p>' : ''}
          </section>
        </article>
      `;
    }

    buildGameMasterObjectPage(objectData) {
      const config = window.ContentTypes['objet'];
      const allObjects = objectData.objets || [];
      const availableTags = config?.filterConfig?.availableTags || [];
      
      // Initialize active tags for GM page
      if (!window.ACTIVE_GM_OBJECT_TAGS) {
        window.ACTIVE_GM_OBJECT_TAGS = [];
      }
      const activeTags = window.ACTIVE_GM_OBJECT_TAGS;
      
      
      // Filter objects based on active tags
      const filteredObjects = activeTags.length === 0 
        ? allObjects // No tags active = show all objects
        : allObjects.filter(obj => {
            // AND logic - object must have ALL active tags
            if (!obj.tags || obj.tags.length === 0) {
              return false;
            }
            const hasAllTags = activeTags.every(activeTag => obj.tags.includes(activeTag));
            return hasAllTags;
          });
      
      const result = `
        <article class="" data-page="gestion-objets">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2>📦 Gestion des Objets</h2>
              ${this.buildIllustration('page:gestion-objets')}
            </div>
            
            
            ${this.buildGMTagFilters(activeTags, availableTags)}
            
            <div style="display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;">
              ${this.buildAddButton('objet', 'objets')}
              ${this.buildTagsManagerButton()}
            </div>
            
            <div class="collection-items" id="gestion-objets-container">
              ${(() => {
                try {
                  const cards = filteredObjects.map((item, index) => {
                    const card = CardBuilder.create('objet', item, 'objets', index).build();
                    return card;
                  }).join('');
                  return cards;
                } catch (error) {
                  return '<p style="color: red;">Erreur lors de la génération des cartes objets</p>';
                }
              })()}
            </div>
            
            ${filteredObjects.length === 0 ? '<p style="text-align: center; color: #666; margin: 2rem 0;">Aucun objet ne correspond aux filtres sélectionnés.</p>' : ''}
          </section>
        </article>
      `;
      
      return result;
    }

    buildSingleMonsterPage(monsterData) {
      let config = window.ContentTypes?.['monster'];
      const allMonsters = monsterData || [];
      const instance = PageBuilder.getInstance(); // Créer une instance pour accéder aux méthodes
      
      // Defensive check for config with fallback
      if (!config || !config.filterConfig) {
        console.warn('Monster config not loaded, using fallback defaults');
        console.log('ContentTypes available:', window.ContentTypes ? Object.keys(window.ContentTypes) : 'undefined');
        config = {
          filterConfig: {
            defaultVisibleTags: ['Forêt'],
            availableTags: ['Forêt', 'Boss', 'Minion', 'Volant', 'Aquatique', 'Terrestre']
          }
        };
      }
      
      // Utiliser le state du filtre s'il existe, sinon les tags par défaut
      // IMPORTANT: Empty array [] should be preserved, not fall back to defaults
      const visibleTags = window.MONSTRES_FILTER_STATE?.visibleTags !== undefined 
        ? window.MONSTRES_FILTER_STATE.visibleTags 
        : config.filterConfig.defaultVisibleTags;
        
      
      // Filter monsters according to visible tags (OR mode - more intuitive)
      const filteredMonsters = visibleTags.length === 0 
        ? [] // If no tags are visible, show nothing
        : allMonsters.filter(monster => {
            // Check that the monster has the required tags to be visible
            if (!monster.tags) {
              return false;
            }
            
            // In OR mode: monster must have at least ONE visible tag
            const hasAnyVisibleTag = visibleTags.some(tag => monster.tags.includes(tag));
            return hasAnyVisibleTag;
          });
      
      
      return `
        <article class="" data-page="monstres">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2>🐲 Monstres</h2>
              ${instance.buildIllustration('page:monstres')}
            </div>
            
            ${instance.buildPageDescription('monster')}
            
            ${instance.buildTagFilters(visibleTags, config.filterConfig.availableTags, 'monster')}
            
            <div style="display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;">
              ${instance.buildAddButton('monster', 'monstres')}
              ${instance.buildTagsManagerButton()}
            </div>
            
            <div class="grid cols-2" id="monstres-container">
              ${filteredMonsters.map((item, index) => 
                CardBuilder.create('monster', item, 'monstres', index).build()
              ).join('')}
            </div>
            
            ${filteredMonsters.length === 0 ? '<p style="text-align: center; color: #666; margin: 2rem 0;">Aucun monstre ne correspond aux filtres sélectionnés.</p>' : ''}
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
      
      // Defense against missing or malformed pageData
      if (!pageData || typeof pageData !== 'object') {
        console.warn('buildStaticPage: invalid pageData', pageData);
        return `<article class="${isActive}" data-page="${pageId}"><section><h2>Page non disponible</h2><p>Les données de cette page ne sont pas disponibles.</p></section></article>`;
      }
      
      const title = pageData.title || pageId;
      const page = pageData.page || pageId;
      
      // Special handling for favoris page
      if (pageId === 'favoris') {
        return this.buildFavorisPage(pageId, pageData);
      }
      
      // Special handling for campaign page
      if (pageId === 'campagne') {
        return this.buildCampaignPage(pageId, pageData);
      }
      
      return `
        <article class="${isActive}" data-page="${page}" data-static-page="true" data-page-title="${title}">
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
      
      // Don't show descriptions for spell categories
      const showDescription = type !== 'spell';
      
      return `
        <div style="text-align:center;margin-bottom:2rem;">
          ${this.buildEditableTitle(category.nom, `${type}-category-name`)}
          ${this.buildIllustration(`${type}category:${category.nom}`)}
        </div>
        ${showDescription ? this.buildEditableSection(category.description, `${type}-category-description`, 'paragraph', category.nom) : ''}
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
      const printButton = pageData.page === 'etats' ? this.buildPrintButton() : '';
      
      return `
        <div style="text-align:center;margin-bottom:2rem;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <h2 class="editable editable-title" data-edit-type="generic" data-edit-section="page-title">${pageData.title}</h2>
            ${this.buildEditButton('title')}
          </div>
          ${this.buildIllustration(`page:${pageData.page}`)}
          ${printButton}
        </div>
      `;
    }

    buildCompactCampaignHeader(pageData) {
      return `
        <div style="text-align:center;margin-bottom:0.5rem;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <h2 class="editable editable-title" data-edit-type="generic" data-edit-section="page-title">${pageData.title}</h2>
            ${this.buildEditButton('title')}
          </div>
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
      // Defense against undefined sections
      if (!sections || !Array.isArray(sections)) {
        console.warn('buildSections: sections is not an array', sections);
        return '';
      }
      
      return sections.map((section, sectionIndex) => {
        switch (section.type) {
          case 'intro':
            return this.buildIntroSection(section, sectionIndex);
          case 'card':
            return this.buildCardSection(section, sectionIndex);
          case 'grid':
            return this.buildGridSection(section, sectionIndex);
          case 'filters':
            return this.buildFiltersSection(section, sectionIndex);
          case 'monster-list':
            return this.buildMonsterListSection(section, sectionIndex);
          default:
            return `<div><!-- Unknown section type: ${section.type} --></div>`;
        }
      }).join('');
    }

    buildIntroSection(section, sectionIndex) {
      const editSection = `intro-${sectionIndex}`;
      return `
        <div class="editable-section" data-section-type="intro" data-section-index="${sectionIndex}">
          <p class="editable editable-intro" data-edit-type="generic" data-edit-section="${editSection}">${section.content}</p>
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

      // HYBRID APPROACH: Never generate buttons in standalone, always generate in dev mode
      const isStandalone = window.STANDALONE_VERSION === true;
      
      if (isStandalone) {
        // STANDALONE: Never generate image buttons at all
        return `
          <div class="illus" data-illus-key="${illusKey}" data-bound="1">
            <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
          </div>
        `;
      } else {
        // DEV MODE: Always generate buttons, let CSS handle visibility
        return `
          <div class="illus" data-illus-key="${illusKey}" data-bound="1">
            <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
            <label class="up">📷 Ajouter<input accept="image/*" hidden="" type="file"></label>
            <button class="rm" type="button" style="${removeStyle}">🗑 Retirer</button>
          </div>
        `;
      }
    }

    buildFiltersSection(section, sectionIndex) {
      const contentType = section.contentType || 'monster';
      
      // Ensure ContentTypes is loaded
      if (!window.ContentTypes) {
        console.warn('ContentTypes not loaded yet, skipping filters');
        return '';
      }
      
      let config = window.ContentTypes[contentType];
      const filterMode = section.filterMode || 'OR';
      
      // Fallback configuration for monster if not loaded
      if (!config && contentType === 'monster') {
        config = {
          filterConfig: {
            availableTags: ["Foret", "Animal", "Humanoid", "Dragon", "Faible", "Puissant", "Boss", "Feu", "Eau", "Terre", "Air", "Rapide", "Poison"],
            defaultVisibleTags: ["Foret", "Animal", "Humanoid"]
          }
        };
      }
      
      if (!config || !config.filterConfig) {
        return '';
      }
      
      const availableTags = config.filterConfig.availableTags || [];
      const defaultTags = config.filterConfig.defaultVisibleTags || [];
      
      return `
        <div class="filter-section" data-content-type="${contentType}" data-filter-mode="${filterMode}">
          <h3>🔍 Filtres (${filterMode === 'AND' ? 'ET' : 'OU'})</h3>
          <div class="filter-tags" data-default-tags='${JSON.stringify(defaultTags)}'>
            ${availableTags.map(tag => `
              <label class="filter-tag ${defaultTags.includes(tag) ? 'active' : ''}">
                <input type="checkbox" value="${tag}" ${defaultTags.includes(tag) ? 'checked' : ''}>
                <span>${tag}</span>
              </label>
            `).join('')}
          </div>
          ${this.buildDevModeButtons(contentType)}
        </div>
      `;
    }

    buildMonsterListSection(section, sectionIndex) {
      const contentType = section.contentType || 'monster';
      
      return `
        <div class="monster-list-section" data-content-type="${contentType}">
          <div class="monsters-grid" id="monsters-container">
            <!-- Les monstres seront générés par JavaScript -->
          </div>
        </div>
      `;
    }

    buildDevModeButtons(contentType) {
      // Ensure ContentTypes is loaded for proper button generation
      if (!window.ContentTypes) {
        return '';
      }
      
      // For monster type, generate buttons even if config is missing (they'll work with fallback)
      if (contentType !== 'monster' && !window.ContentTypes[contentType]) {
        return '';
      }
      
      // Use the same approach as modal buttons - conditional rendering based on dev mode
      const isDevMode = JdrApp.utils.isDevMode();
      const displayStyle = isDevMode ? 'block' : 'none';
      
      return `
        <div class="dev-mode-buttons" style="margin-top: 1rem; display: ${displayStyle};" data-dev-only="true">
          <button class="btn btn-small add-${contentType}-btn">➕ Ajouter ${contentType === 'monster' ? 'un monstre' : 'un élément'}</button>
          <button class="btn btn-small manage-tags-btn" data-content-type="${contentType}">🏷️ Gérer les tags</button>
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
      return `<button class="${type}-add btn" data-category-name="${categoryName}" type="button" style="background: var(--accent); color: white;">${icon} Ajouter un ${type === 'spell' ? 'sort' : type === 'don' ? 'don' : type === 'monster' ? 'monstre' : 'élément'}</button>`;
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
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
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
              <!-- Texte du filtre ajouté dynamiquement par SpellFilter.js -->
            </div>
          </div>
        </div>
      `;
    }

    buildIdSearchFilter() {
      const isIdSearchActive = window.activeIdSearch || false;
      const isDevMode = JdrApp.utils.isDevMode();
      const searchBorderColor = isIdSearchActive ? '#16a34a' : 'var(--rule)';
      const searchBoxShadow = isIdSearchActive ? 'box-shadow: 0 0 8px rgba(22, 163, 74, 0.3);' : '';
      const searchIndicator = isIdSearchActive ? '🎯 ' : '🔍 ';
      const buttonText = isIdSearchActive ? '🔄 Affichage normal' : '🔄 Tout afficher';
      const buttonTitle = isIdSearchActive ? 'Retourner à l\'affichage normal avec filtres' : 'Effacer la recherche et afficher tous les objets';
      
      return `
        <div class="id-search-filter" style="margin: 0.5rem 0; background: var(--card); border: 2px solid ${searchBorderColor}; border-radius: 12px; display: flex; flex-direction: column; ${searchBoxShadow}">
          <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; padding: 0.375rem; min-height: 2.5rem;">
            <label for="id-search-input" style="font-weight: 600; color: var(--accent-ink); white-space: nowrap; display: flex; align-items: center; height: 100%;">
              ${searchIndicator}Recherche par ID :
            </label>
            <div style="display: flex; align-items: center; gap: 0.5rem; height: 100%;">
              <input 
                type="number" 
                id="id-search-input" 
                min="1" 
                placeholder="Numéro d'objet (ex: 42)"
                style="padding: 0.2rem; border: 1px solid ${searchBorderColor}; border-radius: 6px; font-size: 0.95em; width: 150px; height: 2rem; display: flex; align-items: center;"
              >
              <button 
                id="search-object-btn" 
                class="btn small" 
                style="background: var(--primary-color); color: white; padding: 0.2rem 0.4rem; white-space: nowrap; font-size: 0.9em; display: flex; align-items: center; height: 2rem; justify-content: center;"
                title="Rechercher cet objet"
              >
                🔍 Chercher
              </button>
              <button 
                id="clear-id-search" 
                class="btn small" 
                style="background: var(--bronze); color: white; padding: 0.2rem 0.4rem; white-space: nowrap; font-size: 0.9em; display: ${!isDevMode ? 'none' : 'flex'}; align-items: center; height: 2rem; justify-content: center;"
                title="${buttonTitle}"
              >
                ${buttonText}
              </button>
            </div>
          </div>
          <div id="id-search-result" style="padding: 0 0.375rem 0.375rem; font-size: 0.85em; color: var(--paper-muted); min-height: 0.5em; line-height: 1.2; text-align: center;">
            <!-- Résultat de la recherche affiché ici -->
          </div>
        </div>
      `;
    }

    buildPageDescription(type) {
      const config = window.ContentTypes[type];
      
      if (!config || !config.pageDescription) {
        return '';
      }
      
      const pageDesc = config.pageDescription;
      
      // Obtenir la description de manière unifiée
      let description = '';
      
      if (pageDesc.dataSource === 'external') {
        // Utilisation d'un fichier externe via dataKey
        const dataObj = window[pageDesc.dataKey];
        if (!dataObj) {
          // Créer l'objet externe s'il n'existe pas
          window[pageDesc.dataKey] = { [pageDesc.storageKey]: pageDesc.defaultValue };
        }
        description = window[pageDesc.dataKey][pageDesc.storageKey] || pageDesc.defaultValue;
      } else {
        // Source de données intégrée dans le dataKey principal
        const mainDataKey = config.dataKey;
        const mainData = window[mainDataKey];
        
        if (!mainData) {
          console.warn(`Main data key ${mainDataKey} not found for type ${type}`);
          description = pageDesc.defaultValue;
        } else {
          // Initialiser la description si elle n'existe pas
          if (!mainData[pageDesc.storageKey]) {
            mainData[pageDesc.storageKey] = pageDesc.defaultValue;
          }
          description = mainData[pageDesc.storageKey];
        }
      }
      
      const cssClass = `${type}-category-description`;
      const sectionType = `${type}-category-description`;
      
      return `
        <div class="${cssClass}" style="margin: 1rem 0; padding: 1rem; background: var(--card); border-radius: 8px; border-left: 4px solid var(--bronze);">
          <div class="editable-section" data-section-type="${sectionType}">
            <p class="lead editable editable-paragraph" data-edit-type="generic" data-edit-section="${pageDesc.editSection}">${description}</p>
            ${this.buildEditButton('section')}
          </div>
        </div>
      `;
    }

    buildTagFilters(activeTags, availableTags, context = 'objet') {
      if (!availableTags || availableTags.length === 0) {
        return '';
      }
      

      const filterTitle = context === 'monster' ? '🎯 Filtrer les monstres par tags :' : 
                         context === 'tableTresor' ? '🎯 Filtrer les tables par tags :' : 
                         '🎯 Filtrer par tags :';

      return `
        <div class="tag-filters" style="margin: 1rem 0; padding: 1rem; background: var(--card); border: 2px solid var(--rule); border-radius: 12px;">
          <div style="margin-bottom: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-ink); font-size: 1em;">
              ${filterTitle}
            </h4>
            <p style="margin: 0; font-size: 0.85em; color: var(--paper-muted); font-style: italic;">
              Cliquez sur les tags pour filtrer le contenu
            </p>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${availableTags.map(tag => {
              const isActive = activeTags && activeTags.includes(tag);
              const bgColor = isActive ? '#16a34a' : '#6b7280';
              const opacity = isActive ? '1' : '0.6';
              const prefix = isActive ? '✓ ' : '';
              
              const chipClass = context === 'monster' ? 'monster-filter-chip' : 
                               context === 'tableTresor' ? 'tresor-filter-chip' : 
                               'filter-chip';
              
              return `
                <button 
                  class="${chipClass}" 
                  data-tag="${tag}"
                  style="
                    padding: 0.25rem 0.75rem;
                    border: none;
                    border-radius: 20px;
                    background: ${bgColor};
                    color: white;
                    opacity: ${opacity};
                    font-size: 0.85em;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  "
                  title="${isActive ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}"
                >
                  ${prefix}${tag}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    buildGMTagFilters(activeTags, availableTags) {
      if (!availableTags || availableTags.length === 0) {
        return '';
      }


      return `
        <div class="gm-tag-filters" style="margin: 1rem 0; padding: 1rem; background: var(--card); border: 2px solid var(--bronze); border-radius: 12px;">
          <div style="margin-bottom: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-ink); font-size: 1em;">
              🎯 Filtrer les objets par tags (Mode GM) :
            </h4>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${availableTags.map(tag => {
              const isActive = activeTags && activeTags.includes(tag);
              const bgColor = isActive ? '#16a34a' : '#6b7280';
              const opacity = isActive ? '1' : '0.6';
              const prefix = isActive ? '✓ ' : '';
              
              
              return `
                <button 
                  class="gm-filter-chip" 
                  data-tag="${tag}"
                  style="
                    padding: 0.25rem 0.75rem;
                    border: none;
                    border-radius: 20px;
                    background: ${bgColor};
                    color: white;
                    opacity: ${opacity};
                    font-size: 0.85em;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  "
                  title="${isActive ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}"
                >
                  ${prefix}${tag}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    
    // SUPPRIMÉ: buildFilterManagerButton - fonctionnalité retirée

    buildTagsManagerButton() {
      // Only show in dev mode - use direct utils check
      if (!JdrApp.utils.isDevMode()) {
        return '';
      }
      return `<button class="tags-manager-btn btn" type="button" style="background: #dc2626; color: white; border: 2px solid #b91c1c;">🏷️ Gérer les tags</button>`;
    }

    buildGeneralDonsSection(type, categoryName) {
      // Only add General Dons section for 'don' type pages, and not for the 'Generaux' category itself
      if (type !== 'don' || categoryName === 'Generaux') {
        return '';
      }

      // Find the "Generaux" category in the DONS data
      const generalCategory = window.DONS?.find(cat => cat.nom === 'Generaux');
      if (!generalCategory || !generalCategory.dons || generalCategory.dons.length === 0) {
        return '';
      }

      // Generate cards for all general dons
      const generalDonsCards = generalCategory.dons.map((don, index) => 
        CardBuilder.create('don', don, 'Generaux', index).build()
      ).join('');

      return `
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--rule);">
          <h3 style="color: var(--bronze); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            🎖️ Dons Généraux
          </h3>
          <p style="margin-bottom: 1.5rem; font-style: italic; color: var(--accent-ink); opacity: 0.8;">
            Ces dons sont accessibles à toutes les classes et peuvent compléter votre build.
          </p>
          <div class="grid cols-2">
            ${generalDonsCards}
          </div>
        </div>
      `;
    }

    // SUPPRIMÉ: buildFilterManagerButton - fonctionnalité retirée
    
    buildTagsManagerButton() {
      // ALWAYS generate the button - CSS will control visibility based on body.dev-on/dev-off  
      if (window.STANDALONE_VERSION) return '';
      
      return `<button class="tags-manager-btn btn" type="button" style="background: #dc2626; color: white; border: 2px solid #b91c1c;">🏷️ Gérer les tags</button>`;
    }

    buildPrintButton() {
      return `
        <div style="margin-top: 1rem;">
          <button id="print-etats-btn" class="print-button" type="button" title="Imprimer la liste des états">
            🖨️ Version imprimable
          </button>
        </div>
      `;
    }

    buildSingleTableTresorPage(tableData) {
      let config = window.ContentTypes?.['tableTresor'];
      const allTables = tableData.tables || [];
      const instance = PageBuilder.getInstance();
      
      // Defensive check for config with fallback
      if (!config || !config.filterConfig) {
        console.warn('TableTresor config not loaded, using fallback defaults');
        config = {
          filterConfig: {
            defaultVisibleTags: ['Commun'],
            availableTags: ['Faible', 'Commun', 'Rare', 'Épique', 'Légendaire', 'Boss', 'Humanoïde', 'Bête', 'Dragon', 'Mort-vivant', 'Élémentaire']
          }
        };
      }
      
      // Priority: Use saved metadata tags as single source of truth
      let availableTags = window.TABLES_TRESORS?._metadata?.availableTags || [];
      
      // Utiliser le state du filtre s'il existe, sinon les tags par défaut qui existent vraiment
      let defaultVisibleTags = config.filterConfig.defaultVisibleTags || [];
      // Filter defaultVisibleTags to only include tags that actually exist in metadata
      if (availableTags.length > 0) {
        defaultVisibleTags = defaultVisibleTags.filter(tag => availableTags.includes(tag));
      }
      const visibleTags = window.TABLES_TRESORS_FILTER_STATE?.visibleTags || defaultVisibleTags;
      
      
      // Filter tables according to visible tags
      const filterMode = config.filterMode || 'OR';
      const filteredTables = visibleTags.length === 0 
        ? allTables // If no tags are visible, show all tables
        : allTables.filter(table => {
            // Check that the table has tags when filtering is active
            if (!table.tags || table.tags.length === 0) return false;
            
            if (filterMode === 'AND') {
              // In AND mode: table must have ALL visible tags
              return visibleTags.every(tag => table.tags.includes(tag));
            } else {
              // In OR mode: table must have AT LEAST ONE visible tag
              return visibleTags.some(tag => table.tags.includes(tag));
            }
          });
          
      
      return `
        <article class="" data-page="tables-tresors">
          <section>
            <header class="page-header">
              <h1 class="page-title" style="display: flex; align-items: center; gap: 0.5rem;">
                💎 Tables de trésors
              </h1>
            </header>
            
            ${instance.buildPageDescription('tableTresor')}
            
            ${instance.buildTagFilters(visibleTags, availableTags, 'tableTresor')}
            
            <div data-dev-only class="dev-buttons-container">
              ${instance.buildAddButton('tableTresor', 'tables')}
              ${instance.buildTagsManagerButton()}
            </div>
            </div>
            
            <div class="grid cols-1" id="tables-tresors-container" style="gap: 1.5rem;">
              ${filteredTables.map((table, index) => 
                CardBuilder.create('tableTresor', table, 'tables', index).build()
              ).join('')}
            </div>
            
            ${filteredTables.length === 0 ? `
              <div style="text-align: center; padding: 2rem; background: var(--card); border-radius: 12px; margin: 1rem 0;">
                <p style="color: var(--accent-ink); font-size: 1.1em; margin-bottom: 1rem;">
                  💎 ${allTables.length === 0 ? 'Aucune table de trésor définie' : 'Aucune table ne correspond aux filtres sélectionnés'}
                </p>
                <p style="color: var(--paper-muted); font-style: italic;">
                  ${allTables.length === 0 
                    ? (instance.shouldShowEditButtons ? 'Utilisez le bouton "Ajouter une table de trésor" ci-dessus pour créer votre première table.' : 'Le Maître de jeu peut créer des tables de trésors en mode développement.')
                    : 'Modifiez vos filtres pour voir d\'autres tables de trésors.'
                  }
                </p>
              </div>
            ` : ''}
            
            <div style="margin-top: 1rem; padding: 1rem; background: var(--card); border-radius: 8px; border-left: 4px solid var(--bronze);">
              <p style="color: var(--accent-ink); margin: 0;">
                📊 Résultats: ${filteredTables.length} table${filteredTables.length !== 1 ? 's' : ''} affichée${filteredTables.length !== 1 ? 's' : ''} sur ${allTables.length} au total
              </p>
            </div>
          </section>
        </article>
      `;
    }

    buildCampaignPage(pageId, pageData) {
      const campaigns = pageData.subPages || {};
      const campaignList = Object.keys(campaigns);
      
      // Ensure JdrApp and state exist before accessing
      if (!window.JdrApp) {
        window.JdrApp = {};
      }
      if (!window.JdrApp.state) {
        window.JdrApp.state = {};
      }
      
      // Get current selections (default to first available or empty)
      const selectedCampaign = window.JdrApp.state.selectedCampaign || (campaignList.length > 0 ? campaignList[0] : null);
      const currentCampaign = selectedCampaign && campaigns[selectedCampaign] ? campaigns[selectedCampaign] : null;
      const subPageList = currentCampaign ? Object.keys(currentCampaign.subPages || {}) : [];
      const selectedSubPage = window.JdrApp.state.selectedSubPage || (subPageList.length > 0 ? subPageList[0] : null);
      const currentSubPage = selectedSubPage && currentCampaign?.subPages?.[selectedSubPage] ? currentCampaign.subPages[selectedSubPage] : null;
      
      // Auto-initialize state if it wasn't set by UI functions
      if (!window.JdrApp.state.selectedCampaign && selectedCampaign) {
        window.JdrApp.state.selectedCampaign = selectedCampaign;
      }
      if (!window.JdrApp.state.selectedSubPage && selectedSubPage) {
        window.JdrApp.state.selectedSubPage = selectedSubPage;
      }
      
      
      return `
        <article class="" data-page="${pageId}" data-static-page="true" data-page-title="${pageData.title}">
          <section>
            ${pageId === 'campagne' ? this.buildCompactCampaignHeader(pageData) : this.buildStaticPageHeader(pageData)}
            ${pageId === 'campagne' ? '' : this.buildSections(pageData.sections)}
            
            <div class="campaign-manager" style="margin-top: 0.5rem;">
              <!-- Campaign Management Controls -->
              <div class="campaign-controls" style="background: var(--card); border-radius: 12px; padding: 1rem; margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 0.5rem;">
                  <div class="dev-buttons" style="display: flex; gap: 8px;">
                    <button class="btn primary small dev-only" onclick="JdrApp.modules.ui.addCampaign()" style="display: none;">
                      ➕ Nouvelle Campagne
                    </button>
                  </div>
                </div>
                
                ${campaignList.length === 0 ? `
                  <div style="text-align: center; padding: 2rem;">
                    <p style="color: var(--accent-ink); font-size: 1.1em; margin-bottom: 1rem;">
                      📖 Aucune campagne créée
                    </p>
                    <p style="color: var(--paper-muted); font-style: italic;">
                      <span class="dev-only" style="display: none;">Utilisez le bouton "Nouvelle Campagne" ci-dessus pour créer votre première campagne.</span>
                      <span class="non-dev-only">Le Maître de jeu peut créer des campagnes en mode développement.</span>
                    </p>
                  </div>
                ` : `
                  <!-- Campaign Selector -->
                  <div class="campaign-selector" style="margin-bottom: 0.5rem; text-align: center;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-ink); text-align: center;">
                      📚 Campagne Active:
                    </label>
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <select id="campaignSelector" onchange="JdrApp.modules.ui.selectCampaign(this.value)" 
                              style="padding: 8px; border-radius: 6px; border: 2px solid var(--rule); background: var(--paper); font-family: inherit;">
                        ${campaignList.map(name => 
                          `<option value="${name}" ${name === selectedCampaign ? 'selected' : ''}>${name}</option>`
                        ).join('')}
                      </select>
                      <button class="btn danger small dev-only" onclick="JdrApp.modules.ui.deleteCampaign('${selectedCampaign}')" 
                              style="display: none;" ${!selectedCampaign ? 'disabled' : ''}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                `}
              </div>
              <!-- Campaign Content -->
              ${selectedCampaign && currentCampaign ? this.buildSelectedCampaignContent(selectedCampaign, currentCampaign, selectedSubPage, currentSubPage) : ''}
            </div>
            
            ${this.buildAddSectionButton()}
          </section>
        </article>
      `;
    }

    buildSelectedCampaignContent(campaignName, campaign, selectedSubPage, currentSubPage) {
      const subPageList = campaign.subPages ? Object.keys(campaign.subPages) : [];
      
      return `
        <div class="selected-campaign" style="background: var(--card); border-radius: 12px; padding: 1.5rem; border-left: 4px solid var(--bronze);">
          <!-- Campaign Header -->
          <div class="campaign-header" style="margin-bottom: 1.5rem; border-bottom: 2px solid var(--rule); padding-bottom: 1rem;">
            <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
              <h3 class="editable" data-edit-type="generic" data-edit-section="campaign-${campaignName}-name" 
                  style="margin: 0; color: var(--accent-ink); flex: 1;">
                ${campaignName}
              </h3>
              ${this.buildEditButton('title')}
            </div>
          </div>
          
          <!-- Sub-pages Section -->
          <div class="campaign-subpages">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <button class="btn primary small dev-only" onclick="JdrApp.modules.ui.addCampaignSubPage('${campaignName}')" style="display: none;">
                ➕ Nouvelle Sous-page
              </button>
            </div>
            
            ${subPageList.length === 0 ? `
              <div style="text-align: center; padding: 2rem; background: var(--paper-light); border-radius: 8px; margin-bottom: 1rem;">
                <p style="color: var(--paper-muted); font-style: italic;">
                  Aucune sous-page créée pour cette campagne.
                </p>
                <p class="dev-only" style="color: var(--paper-muted); font-size: 0.9em; display: none;">
                  Utilisez le bouton "Nouvelle Sous-page" pour commencer.
                </p>
              </div>
            ` : `
              <!-- Sub-page Selector -->
              <div class="subpage-selector" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-ink);">
                  📝 Sous-page Active:
                </label>
                <select id="subPageSelector" onchange="JdrApp.modules.ui.selectSubPage(this.value)" 
                        style="padding: 8px; border-radius: 6px; border: 2px solid var(--rule); background: var(--paper); font-family: inherit;">
                  ${subPageList.map(name => 
                    `<option value="${name}" ${name === selectedSubPage ? 'selected' : ''}>${name}</option>`
                  ).join('')}
                </select>
                <button class="btn danger small dev-only" onclick="JdrApp.modules.ui.deleteCampaignSubPage('${campaignName}', '${selectedSubPage}')" 
                        style="margin-left: 8px; display: none;" ${!selectedSubPage ? 'disabled' : ''}>
                  🗑️ Supprimer
                </button>
              </div>
              
              <!-- Sub-page Content -->
              ${selectedSubPage && currentSubPage ? this.buildSelectedSubPageContent(campaignName, selectedSubPage, currentSubPage) : ''}
            `}
          </div>
        </div>
      `;
    }

    buildSelectedSubPageContent(campaignName, subPageName, subPage) {
      return `
        <div class="selected-subpage" style="background: var(--paper-light); border-radius: 8px; padding: 1.5rem; border: 2px solid var(--rule);">
          <!-- Sub-page Header -->
          <div class="subpage-header" style="margin-bottom: 1rem; border-bottom: 1px solid var(--rule); padding-bottom: 0.75rem;">
            <div style="display: flex; align-items: center;">
              <h5 class="editable" data-edit-type="generic" data-edit-section="subpage-${campaignName}-${subPageName}-title" 
                  style="margin: 0; color: var(--accent-ink); font-size: 1.2em; flex: 1;">
                📄 ${subPage.title || subPageName}
              </h5>
              ${this.buildEditButton('title')}
            </div>
          </div>
          
          <!-- Sub-page Content -->
          <div style="display: flex; align-items: flex-start;">
            <div class="subpage-content editable" data-edit-type="generic" data-edit-section="subpage-${campaignName}-${subPageName}-content" 
                 style="line-height: 1.6; min-height: 200px; flex: 1;">
              ${subPage.content || '<p>Contenu de la sous-page...</p>'}
            </div>
            ${this.buildEditButton('section')}
          </div>
        </div>
      `;
    }

    buildEditButton(buttonType) {
      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="edit-btn" type="button" style="background: var(--accent); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px; margin-left: 8px;">✏️</button>`;
    }
    

    sanitizeId(str) {
      return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    /**
     * Construit la page spéciale des favoris
     * @param {string} pageId - ID de la page
     * @param {Object} pageData - Données de la page
     * @returns {string} HTML de la page favoris
     */
    buildFavorisPage(pageId, pageData) {
      const title = pageData.title || 'Favoris';
      
      return `
        <article class="" data-page="${pageId}" data-static-page="true" data-page-title="${title}">
          <section>
            ${this.buildStaticPageHeader(pageData)}
            
            <div class="favoris-section favoris-collapsible" id="favoris-objets-section">
              <div class="favoris-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <h2>📦 Objets favoris</h2>
                <span class="favoris-toggle">▼</span>
              </div>
              <div class="favoris-content">
                <div id="favoris-objets-container" class="favoris-grid">
                  <!-- Les objets favoris seront affichés ici dynamiquement -->
                </div>
                <div id="favoris-objets-empty" class="favoris-empty" style="display: none;">
                  <p>Aucun objet en favoris</p>
                  <p style="font-size: 0.9em;">Cliquez sur l'étoile ⭐ à côté d'un objet pour l'ajouter à vos favoris</p>
                </div>
              </div>
            </div>

            <div class="favoris-section favoris-collapsible" id="favoris-sorts-section">
              <div class="favoris-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <h2>🔮 Sorts favoris</h2>
                <span class="favoris-toggle">▼</span>
              </div>
              <div class="favoris-content">
                <div id="favoris-sorts-container" class="favoris-grid">
                  <!-- Les sorts favoris seront affichés ici dynamiquement -->
                </div>
                <div id="favoris-sorts-empty" class="favoris-empty" style="display: none;">
                  <p>Aucun sort en favoris</p>
                  <p style="font-size: 0.9em;">Cliquez sur l'étoile ⭐ à côté d'un sort pour l'ajouter à vos favoris</p>
                </div>
              </div>
            </div>
          </section>
        </article>
      `;
    }
  }

  window.PageBuilder = PageBuilder.getInstance();

})();