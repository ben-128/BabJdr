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
      const config = window.ContentTypes['objet'];
      const allObjects = objectData.objets || [];
      const filterSettings = objectData.filterSettings || {};
      const visibleTags = filterSettings.visibleTags || config.filterConfig.defaultVisibleTags;
      
      // CRITICAL: Ensure window.OBJETS.filterSettings is properly initialized with the same visibleTags
      // This fixes the sync issue between visual state and data state in standalone mode
      if (!window.OBJETS.filterSettings) {
        window.OBJETS.filterSettings = { 
          visibleTags: [...visibleTags],
          displayedFilterButtons: [...config.filterConfig.availableTags]
        };
      }
      
      // Ensure displayedFilterButtons is always initialized
      if (!window.OBJETS.filterSettings.displayedFilterButtons) {
        window.OBJETS.filterSettings.displayedFilterButtons = [...config.filterConfig.availableTags];
      }
      
      // Filtrer les objets selon les tags visibles, sauf si une recherche par ID est active
      const filteredObjects = window.activeIdSearch 
        ? allObjects // Afficher tous les objets quand une recherche par ID est active
        : visibleTags.length === 0 
          ? [] // Si aucun tag n'est visible, ne rien afficher
          : allObjects.filter(obj => {
              // Vérifier que l'objet a les tags requis pour être visible
              if (!obj.tags) return false;
              
              // L'objet doit avoir au moins un tag visible
              const hasVisibleTag = obj.tags.some(tag => visibleTags.includes(tag));
              if (!hasVisibleTag) return false;
              
              // CONDITION OBLIGATOIRE : L'objet doit avoir le tag "Départ" pour être visible
              // SAUF si mode MJ activé, dev mode activé, ou recherche par ID active
              const isMJMode = window.JdrApp?.state?.isMJ || false;
              const isDevMode = window.JdrApp?.utils?.isDevMode?.() || false;
              const bypassDepartRequirement = isMJMode || isDevMode || window.activeIdSearch;
              
              if (!bypassDepartRequirement) {
                const hasDepartTag = obj.tags.includes('Départ');
                if (!hasDepartTag) return false;
              }
              
              return true;
            });
      
      return `
        <article class="" data-page="objets">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2>📦 Objets</h2>
              ${this.buildIllustration('page:objets')}
            </div>
            
            ${this.buildObjectsCategoryDescription()}
            
            ${this.buildIdSearchFilter()}
            ${this.buildTagFilters(visibleTags, filterSettings.displayedFilterButtons || config.filterConfig.availableTags)}
            
            <div style="display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;">
              ${this.buildAddButton('objet', 'objets')}
              ${this.buildFilterManagerButton()}
              ${this.buildTagsManagerButton()}
            </div>
            
            <div class="grid cols-2" id="objets-container">
              ${filteredObjects.map((item, index) => 
                CardBuilder.create('objet', item, 'objets', index).build()
              ).join('')}
            </div>
            
            ${filteredObjects.length === 0 && !window.activeIdSearch ? '<p style="text-align: center; color: #666; margin: 2rem 0;">Aucun objet ne correspond aux filtres sélectionnés.</p>' : ''}
          </section>
        </article>
      `;
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
      const visibleTags = window.MONSTRES_FILTER_STATE?.visibleTags || config.filterConfig.defaultVisibleTags;
      
      // Filter monsters according to visible tags (AND mode)
      const filteredMonsters = visibleTags.length === 0 
        ? [] // If no tags are visible, show nothing
        : allMonsters.filter(monster => {
            // Check that the monster has the required tags to be visible
            if (!monster.tags) return false;
            
            // In AND mode: monster must have ALL visible tags
            const hasAllVisibleTags = visibleTags.every(tag => monster.tags.includes(tag));
            if (!hasAllVisibleTags) return false;
            
            return true;
          });
      
      return `
        <article class="" data-page="monstres">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2>🐲 Monstres</h2>
              ${instance.buildIllustration('page:monstres')}
            </div>
            
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

      // Enhanced dev mode check to prevent image buttons from appearing incorrectly
      // STRICT CHECK: In standalone mode, NEVER show image buttons
      const isStandalone = window.STANDALONE_VERSION === true;
      
      let shouldShowImageButtons = false;
      
      // If standalone, immediately set to false - no image buttons ever
      if (isStandalone) {
        shouldShowImageButtons = false;
      } else {
        // Only for non-standalone: check dev mode conditions
        const isDevModeActive = JdrApp.utils.isDevMode();
        const hasDevClass = document.body.classList.contains('dev-on');
        const editorDevMode = window.JdrApp?.modules?.editor?.isDevMode === true;
        
        // Only show image buttons if ALL conditions confirm we're in dev mode
        shouldShowImageButtons = isDevModeActive && (hasDevClass || editorDevMode);
      }

      if (shouldShowImageButtons) {
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

    buildIdSearchFilter() {
      const isIdSearchActive = window.activeIdSearch || false;
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
                id="clear-id-search" 
                class="btn small" 
                style="background: var(--bronze); color: white; padding: 0.2rem 0.4rem; white-space: nowrap; font-size: 0.9em; display: flex; align-items: center; height: 2rem; justify-content: center;"
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

    buildObjectsCategoryDescription() {
      // Initialize description if it doesn't exist  
      if (!window.OBJETS.description) {
        window.OBJETS.description = "Équipements, armes, armures et objets divers que peuvent posséder les personnages.";
      }
      
      return `
        <div class="objects-category-description" style="margin: 1rem 0; padding: 1rem; background: var(--card); border-radius: 8px; border-left: 4px solid var(--bronze);">
          <div class="editable-section" data-section-type="objet-category-description">
            <p class="lead editable editable-paragraph" data-edit-type="generic" data-edit-section="description">${window.OBJETS.description}</p>
            ${this.buildEditButton('section')}
          </div>
        </div>
      `;
    }

    buildMonstersCategoryDescription() {
      // Create a description object for monsters if it doesn't exist
      if (!window.MONSTRES_PAGE_DESC) {
        window.MONSTRES_PAGE_DESC = {
          description: "Créatures, ennemis et adversaires que peuvent affronter les héros dans leurs aventures."
        };
      }
      
      return `
        <div class="monsters-category-description" style="margin: 1rem 0; padding: 1rem; background: var(--card); border-radius: 8px; border-left: 4px solid var(--bronze);">
          <div class="editable-section" data-section-type="monster-category-description">
            <p class="lead editable editable-paragraph" data-edit-type="generic" data-edit-section="description">${window.MONSTRES_PAGE_DESC.description}</p>
            ${this.buildEditButton('section')}
          </div>
        </div>
      `;
    }

    buildTagFilters(visibleTags, availableTags, context = 'objet') {
      const isIdSearchActive = window.activeIdSearch || false;
      const containerOpacity = isIdSearchActive ? '0.4' : '1';
      const containerFilter = isIdSearchActive ? 'grayscale(1)' : 'none';
      const pointerEvents = isIdSearchActive ? 'none' : 'auto';
      
      // Créer des chips pour tous les tags disponibles avec indicateur actif/inactif
      const allFilterChips = availableTags.map(tag => {
        const isActive = visibleTags.includes(tag);
        const bgColor = isActive ? '#16a34a' : '#6b7280'; // Vert pour actif, gris pour inactif
        const textColor = 'white';
        const opacity = isActive ? '1' : '0.6';
        
        return `<span class="filter-chip ${isActive ? 'active' : 'inactive'}" 
                      data-tag="${tag}" 
                      style="background: ${bgColor}; color: ${textColor}; opacity: ${opacity}; 
                             padding: 6px 12px; border-radius: 20px; font-size: 0.9em; font-weight: 500;
                             cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent;
                             ${isActive ? 'box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);' : ''}"
                      title="${isActive ? 'Actif - Cliquer pour désactiver' : 'Inactif - Cliquer pour activer'}">
                  ${isActive ? '✓ ' : ''}${tag}
                </span>`;
      }).join('');
      
      // Only show "Tous" and "Aucun" buttons for objects, not for monsters or tables de trésors
      const showSelectAllButtons = context !== 'monster' && context !== 'tableTresor';
      
      return `
        <div class="objects-tag-display" style="margin: 1rem 0; padding: 1rem; background: var(--card); border: 2px solid var(--rule); border-radius: 12px; opacity: ${containerOpacity}; filter: ${containerFilter}; pointer-events: ${pointerEvents}; transition: all 0.3s ease;">
          ${showSelectAllButtons ? `
            <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem;">
              <button 
                id="select-all-tags" 
                class="btn small" 
                style="background: #3b82f6; color: white; padding: 4px 8px; font-size: 0.8em; border-radius: 12px;"
                title="Activer tous les tags"
              >
                ✓ Tous
              </button>
              <button 
                id="select-no-tags" 
                class="btn small" 
                style="background: #6b7280; color: white; padding: 4px 8px; font-size: 0.8em; border-radius: 12px;"
                title="Désactiver tous les tags"
              >
                ✗ Aucun
              </button>
            </div>
          ` : ''}
          <div class="filter-chips" style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
            ${allFilterChips}
          </div>
        </div>
      `;
    }
    
    buildFilterManagerButton() {
      // Only show in dev mode
      if (!this.shouldShowEditButtons) {
        return '';
      }
      return `<button class="filter-manager-btn btn" type="button" style="background: var(--bronze); color: white;">⚙️ Gérer les filtres</button>`;
    }

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

    buildFilterManagerButton() {
      // ALWAYS generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="filter-manager-btn btn" type="button" style="background: #16a34a; color: white; border: 2px solid #15803d;">🔧 Gérer les filtres</button>`;
    }
    
    buildTagsManagerButton() {
      // ALWAYS generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="tags-manager-btn btn" type="button" style="background: #dc2626; color: white; border: 2px solid #b91c1c;">🏷️ Gérer les tags</button>`;
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
      
      // Priority: Use saved metadata tags if available, then config, then fallback
      let availableTags = config.filterConfig.availableTags;
      if (window.TABLES_TRESORS?._metadata?.availableTags) {
        availableTags = window.TABLES_TRESORS._metadata.availableTags;
        console.log('🏷️ Using saved availableTags from metadata:', availableTags);
      }
      
      // Utiliser le state du filtre s'il existe, sinon les tags par défaut
      const visibleTags = window.TABLES_TRESORS_FILTER_STATE?.visibleTags || config.filterConfig.defaultVisibleTags;
      
      console.log('🔍 Filtrage tables de trésors:', {
        allTables: allTables.length,
        visibleTags: visibleTags,
        tablesWithTags: allTables.map(t => ({ nom: t.nom, tags: t.tags }))
      });
      
      // Filter tables according to visible tags
      const filterMode = config.filterMode || 'OR';
      const filteredTables = visibleTags.length === 0 
        ? allTables // If no tags are visible, show all tables
        : allTables.filter(table => {
            // Check that the table has tags
            if (!table.tags || table.tags.length === 0) return false;
            
            if (filterMode === 'AND') {
              // In AND mode: table must have ALL visible tags
              return visibleTags.every(tag => table.tags.includes(tag));
            } else {
              // In OR mode: table must have AT LEAST ONE visible tag
              return visibleTags.some(tag => table.tags.includes(tag));
            }
          });
          
      console.log('🔍 Résultats filtrage:', {
        filteredTables: filteredTables.length,
        tableNames: filteredTables.map(t => t.nom)
      });
      
      return `
        <article class="" data-page="tables-tresors">
          <section>
            <header class="page-header">
              <h1 class="page-title" style="display: flex; align-items: center; gap: 0.5rem;">
                💎 Tables de trésors
              </h1>
            </header>
            
            ${this.buildTableTresorsCategoryDescription()}
            
            ${this.buildTagFilters(visibleTags, availableTags, 'tableTresor')}
            
            <div data-dev-only style="display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;">
              <button class="tableTresor-add btn" data-category-name="tables" type="button" style="background: var(--accent); color: white;">
                ➕ Ajouter une table de trésor
              </button>
              <button class="manage-tags-btn btn" data-content-type="tableTresor" type="button" style="background: #dc2626; color: white; border: 2px solid #b91c1c;">
                🏷️ Gérer les tags
              </button>
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
                    ? (this.shouldShowEditButtons ? 'Utilisez le bouton "Ajouter une table de trésor" ci-dessus pour créer votre première table.' : 'Le Maître de jeu peut créer des tables de trésors en mode développement.')
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
    
    buildTableTresorsCategoryDescription() {
      // Create a description object for treasure tables if it doesn't exist
      if (!window.TABLES_TRESORS_PAGE_DESC) {
        window.TABLES_TRESORS_PAGE_DESC = {
          description: "Tables de butin permettant de générer aléatoirement des récompenses selon les fourchettes définies. Lancez un dé 20 et consultez la table correspondante pour déterminer l'objet obtenu."
        };
      }
      
      return `
        <div class="tables-tresors-category-description" style="margin: 1rem 0; padding: 1rem; background: var(--card); border-radius: 8px; border-left: 4px solid var(--bronze);">
          <div class="editable-section" data-section-type="table-tresor-category-description">
            <p class="lead editable editable-paragraph" data-edit-type="generic" data-edit-section="description">${window.TABLES_TRESORS_PAGE_DESC.description}</p>
            ${this.buildEditButton('section')}
          </div>
        </div>
      `;
    }

    sanitizeId(str) {
      return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
  }

  window.PageBuilder = PageBuilder.getInstance();

})();