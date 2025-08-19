// ============================================================================
// JDR-BAB APPLICATION - RENDERER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // CONTENT RENDERER MODULE
  // ========================================
  JdrApp.modules.renderer = {
    // Current search and filter state
    currentSearch: '',
    
    // Helper to check if we should render editing buttons
    shouldRenderEditButtons() {
      return !window.STANDALONE_VERSION;
    },
    
    init() {
      this.generateContent();
      this.autoLoadImages();
    },

    generateContent() {
      JdrApp.modules.router.generateTOC();
      this.generateArticles();
      this.generateDevToolbox();
      
      // Show/hide edit buttons based on dev mode state
      if (JdrApp.modules.editor) {
        setTimeout(() => {
          if (JdrApp.modules.editor.isDevMode) {
            JdrApp.modules.editor.forceShowAllEditButtons();
          } else {
            JdrApp.modules.editor.forceHideAllEditButtons();
          }
        }, 100);
      }
    },

    generateArticles() {
      const viewsContainer = document.querySelector('#views');
      if (!viewsContainer) return;

      let articlesHTML = '';
      articlesHTML += this.generateCreationPage();
      
      articlesHTML += this.generateElementsPage();
      articlesHTML += this.generateStatsPage();
      articlesHTML += this.generateCompetencesPage();
      articlesHTML += this.generateEtatsPage();

      if (window.CLASSES) {
        window.CLASSES.forEach(classe => {
          articlesHTML += this.generateClassPage(classe);
        });
      }

      if (window.SORTS) {
        window.SORTS.forEach(category => {
          articlesHTML += this.generateSortCategoryPage(category);
        });
      }

      if (window.DONS) {
        window.DONS.forEach(category => {
          articlesHTML += this.generateDonCategoryPage(category);
        });
      }

      viewsContainer.innerHTML = articlesHTML;
      setTimeout(() => this.autoLoadImages(), 100);
    },

    generateCreationPage() {
      return this.generateStaticPage('creation');
    },

    generateClassPage(classe) {
      const pageId = JdrApp.utils.data.sanitizeId(classe.nom);
      
      return `
        <article class="" data-page="${pageId}" data-page-title="${classe.nom}">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2 class="editable editable-title" data-edit-type="class-name" data-edit-section="${classe.nom}">${classe.nom}</h2>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-title-btn" title="Éditer le nom de la classe">✏️</button>' : ''}
              ${this.createIllustration(`class:${classe.nom}`)}
            </div>
            
            <div class="editable-section" data-section-type="class-resume">
              <p class="lead editable editable-paragraph" data-edit-type="class-resume" data-edit-section="${classe.nom}">${classe.resume}</p>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-paragraph-btn" title="Éditer la description de la classe">✏️</button>' : ''}
            </div>
            
            <h3>Capacités de classe</h3>
            <div class="editable-section editable-list-container" data-section-type="class-capacites">
              <ul class="editable editable-list" data-edit-type="class-capacites" data-edit-section="${classe.nom}">
                ${classe.capacites.map(cap => `<li>${cap}</li>`).join('')}
              </ul>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-list-btn" title="Éditer les capacités de classe">✏️</button>' : ''}
            </div>
            
            <h3>Sous-classes</h3>
            <div class="subclass-stack">
              ${classe.sousClasses.map(sousClasse => this.generateSubClassCard(classe.nom, sousClasse)).join('')}
            </div>
            ${this.shouldRenderEditButtons() ? '<div class="add-subclass-btn">➕ Ajouter une sous-classe</div>' : ''}
          </section>
        </article>
      `;
    },

    generateSubClassCard(className, sousClasse) {
      return `
        <div class="card editable-section" data-section-type="subclass" data-class-name="${className}" data-subclass-name="${sousClasse.nom}">
          <div class="editable-section" data-section-type="subclass-name">
            <h4 class="editable editable-title subclass-title" data-edit-type="subclass-name" data-edit-section="${className}-${sousClasse.nom}">${sousClasse.nom}</h4>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-title-btn" title="Éditer le nom de la sous-classe">✏️</button>' : ''}
          </div>
          
          ${this.createSubclassIllustrations(className, sousClasse.nom)}
          
          <div class="editable-section" data-section-type="subclass-stats">
            <div class="editable editable-stats" data-edit-type="subclass-stats" data-edit-section="${className}-${sousClasse.nom}">
              <div class="chips">
                ${Object.entries(sousClasse.base).map(([stat, value]) => {
                  const statIcons = {
                    'Force': '💪',
                    'Agilité': '🏃',
                    'Endurance': '🛡️',
                    'Intelligence': '🧠',
                    'Volonté': '⚡',
                    'Chance': '🍀'
                  };
                  const icon = statIcons[stat] || '⚡';
                  return `<span class="chip">${icon} ${stat}: <strong>${value}</strong></span>`;
                }).join('')}
              </div>
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-stats-btn" title="Éditer les statistiques de base">✏️</button>' : ''}
          </div>
          
          <div class="editable-section" data-section-type="subclass-progression">
            <div class="editable editable-field" data-edit-type="subclass-progression" data-edit-section="${className}-${sousClasse.nom}">
              ${sousClasse.progression}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-field-btn" title="Éditer la progression par niveau">✏️</button>' : ''}
          </div>
          
          <h5>Capacités</h5>
          <div class="editable-section editable-list-container" data-section-type="subclass-capacites">
            <ul class="editable editable-list" data-edit-type="subclass-capacites" data-edit-section="${className}-${sousClasse.nom}">
              ${sousClasse.capacites.map(cap => `<li>${cap}</li>`).join('')}
            </ul>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-list-btn" title="Éditer les capacités">✏️</button>' : ''}
          </div>
          
          ${this.shouldRenderEditButtons() ? '<button class="delete-subclass-btn" title="Supprimer cette sous-classe" data-class-name="' + className + '" data-subclass-name="' + sousClasse.nom + '">🗑️ Supprimer</button>' : ''}
        </div>
      `;
    },

    generateSortCategoryPage(category) {
      const pageId = `sorts-${JdrApp.utils.data.sanitizeId(category.nom)}`;
      
      return `
        <article class="" data-page="${pageId}">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2 class="editable editable-title" data-edit-type="spell-category-name" data-edit-section="${category.nom}">${category.nom}</h2>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-title-btn" title="Éditer le nom de la catégorie">✏️</button>' : ''}
              ${this.createIllustration(`spellcategory:${category.nom}`)}
            </div>
            
            <div class="editable-section" data-section-type="spell-category-description">
              <p class="lead editable editable-paragraph" data-edit-type="spell-category-description" data-edit-section="${category.nom}">${category.description}</p>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-paragraph-btn" title="Éditer la description de la catégorie">✏️</button>' : ''}
            </div>
            
            ${this.shouldRenderEditButtons() ? `<button class="spell-add" data-category-name="${category.nom}" type="button">➕ Ajouter un sort</button>` : ''}
            
            <div class="grid cols-2">
              ${category.sorts.map((sort, index) => this.generateSpellCard(category, sort, index)).join('')}
            </div>
          </section>
        </article>
      `;
    },

    generateSpellCard(category, sort, index) {
      return `
        <div class="card editable-section" data-section-type="spell" data-spell-name="${sort.nom}" data-category-name="${category.nom}">
          <div class="editable-section" data-section-type="spell-name">
            <h4 style="margin: 0 0 1rem 0; text-align: center;" class="editable editable-title" data-edit-type="spell-name" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}">${sort.nom}</h4>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-title-btn" title="Éditer le nom du sort">✏️</button>' : ''}
          </div>
          
          ${this.createIllustration(`sort:${category.nom}:${sort.nom}`, sort.nom)}
          
          <div class="editable-section" data-section-type="spell-description">
            <p class="muted editable editable-paragraph" data-edit-type="spell-description" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}" style="margin: 0 0 1rem 0; text-align: center;">${sort.description}</p>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-paragraph-btn" title="Éditer la description">✏️</button>' : ''}
          </div>
          
          <div class="editable-section" data-section-type="spell-prerequis">
            <div class="editable editable-field" data-edit-type="spell-prerequis" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}">
              ${sort.prerequis}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-field-btn" title="Éditer les prérequis">✏️</button>' : ''}
          </div>
          
          <div class="editable-section" data-section-type="spell-portee">
            <div class="editable editable-field" data-edit-type="spell-portee" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}">
              ${sort.portee}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-field-btn" title="Éditer la portée">✏️</button>' : ''}
          </div>
          
          <div class="editable-section" data-section-type="spell-mana">
            <div class="editable editable-field" data-edit-type="spell-mana" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}">
              ${sort.coutMana}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-field-btn" title="Éditer le coût mana">✏️</button>' : ''}
          </div>

          <div class="editable-section" data-section-type="spell-temps-incantation">
            <div class="editable editable-field" data-edit-type="spell-temps-incantation" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}">
              ${sort.tempsIncantation}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-field-btn" title="Éditer le temps d\'incantation">✏️</button>' : ''}
          </div>
          
          <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--rule);">
          
          <div class="editable-section" data-section-type="spell-resistance">
            <div class="editable editable-field" data-edit-type="spell-resistance" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}">
              ${sort.resistance}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-field-btn" title="Éditer la résistance">✏️</button>' : ''}
          </div>
          
          <div class="editable-section" data-section-type="spell-effect-normal">
            <div class="editable editable-effect" data-edit-type="spell-effect-normal" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}" style="margin: 1rem 0;">
              ${sort.effetNormal}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-effect-btn" title="Éditer l\'effet normal">✏️</button>' : ''}
          </div>
          
          <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--rule);">
          
          ${sort.effetCritique ? `
            <div class="editable-section" data-section-type="spell-effect-critical">
              <div class="editable editable-effect" data-edit-type="spell-effect-critical" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}" style="margin: 1rem 0;">
                ${sort.effetCritique}
              </div>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-effect-btn" title="Éditer l\'effet critique">✏️</button>' : ''}
            </div>
          ` : ''}
          
          ${sort.effetEchec ? `
            <div class="editable-section" data-section-type="spell-effect-failure">
              <div class="editable editable-effect" data-edit-type="spell-effect-failure" data-edit-spell="${sort.nom}" data-edit-section="${sort.nom}" style="margin: 1rem 0;">
                ${sort.effetEchec}
              </div>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-effect-btn" title="Éditer l\'effet d\'échec">✏️</button>' : ''}
            </div>
          ` : ''}
          
          ${this.shouldRenderEditButtons() ? `<button class="spell-delete btn small" data-category-name="${category.nom}" data-spell-name="${sort.nom}" type="button" style="background: #ff6b6b; color: white; margin-top: 8px;">🗑 Supprimer</button>` : ''}
        </div>
      `;
    },

    generateDonCategoryPage(category) {
      const pageId = `dons-${JdrApp.utils.data.sanitizeId(category.nom)}`;
      
      return `
        <article class="" data-page="${pageId}">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2 class="editable editable-title" data-edit-type="don-category-name" data-edit-section="${category.nom}">${category.nom}</h2>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-title-btn" title="Éditer le nom de la catégorie">✏️</button>' : ''}
              ${this.createIllustration(`doncategory:${category.nom}`)}
            </div>
            
            <div class="editable-section" data-section-type="don-category-description">
              <p class="lead editable editable-paragraph" data-edit-type="don-category-description" data-edit-section="${category.nom}">${category.description}</p>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-paragraph-btn" title="Éditer la description de la catégorie">✏️</button>' : ''}
            </div>
            
            ${this.shouldRenderEditButtons() ? `<button class="don-add" data-category-name="${category.nom}" type="button">➕ Ajouter un don</button>` : ''}
            
            <div class="grid cols-2">
              ${category.dons.map((don, index) => this.generateDonCard(category, don, index)).join('')}
            </div>
          </section>
        </article>
      `;
    },

    generateDonCard(category, don, index) {
      return `
        <div class="card editable-section" data-section-type="don" data-don-name="${don.nom}" data-category-name="${category.nom}">
          <div class="editable-section" data-section-type="don-name">
            <h4 style="margin: 0 0 1rem 0; text-align: center;" class="editable editable-title" data-edit-type="don-name" data-edit-section="${don.nom}">${don.nom}</h4>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-title-btn" title="Éditer le nom du don">✏️</button>' : ''}
          </div>
          
          ${this.createIllustration(`don:${don.nom}`, don.nom)}
          
          <div class="editable-section" data-section-type="don-description">
            <p class="editable editable-paragraph" data-edit-type="don-description" data-edit-section="${don.nom}">${don.description}</p>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-paragraph-btn" title="Éditer la description">✏️</button>' : ''}
          </div>
          
          <div class="editable-section" data-section-type="don-prerequis">
            <div class="editable editable-field" data-edit-type="don-prerequis" data-edit-section="${don.nom}">
              ${don.prerequis}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-field-btn" title="Éditer les prérequis">✏️</button>' : ''}
          </div>
          
          <div class="editable-section" data-section-type="don-cout">
            <div class="editable editable-field" data-edit-type="don-cout" data-edit-section="${don.nom}" style="color: var(--bronze); font-weight: 600;">
              ${don.cout}
            </div>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-field-btn" title="Éditer le coût">✏️</button>' : ''}
          </div>
          
          ${this.shouldRenderEditButtons() ? `
          <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
            <button class="don-delete btn small" data-category-name="${category.nom}" data-don-name="${don.nom}" style="background: #ff6b6b; color: white;">🗑 Supprimer</button>
            <button class="don-move-up btn small" data-category-name="${category.nom}" data-don-name="${don.nom}" data-don-index="${index}" style="background: var(--bronze); color: white;" ${index === 0 ? 'disabled' : ''}>⬆️ Haut</button>
            <button class="don-move-down btn small" data-category-name="${category.nom}" data-don-name="${don.nom}" data-don-index="${index}" style="background: var(--bronze); color: white;" ${index === category.dons.length - 1 ? 'disabled' : ''}>⬇️ Bas</button>
          </div>
          ` : ''}
        </div>
      `;
    },

    // Generic method to generate static pages from JSON data
    generateStaticPage(pageId) {
      if (!window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        console.warn(`Static page data not found for: ${pageId}`);
        return '';
      }

      const pageData = window.STATIC_PAGES[pageId];
      const isActive = pageId === 'creation' ? 'active' : '';
      
      return `
        <article class="${isActive}" data-page="${pageData.page}" data-static-page="true" data-page-title="${pageData.title}">
          <section>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h2 class="editable editable-title" data-edit-type="page-title" data-edit-section="${pageData.page}">${pageData.title}</h2>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-title-btn" title="Éditer le titre de la page">✏️</button>' : ''}
              ${this.createIllustration(`page:${pageData.page}`)}
            </div>
            ${this.renderSections(pageData.sections)}
            ${this.shouldRenderEditButtons() ? '<div class="add-paragraph-btn" data-target="section">➕ Ajouter une nouvelle section</div>' : ''}
          </section>
        </article>
      `;
    },

    // Helper method to render sections from JSON data
    renderSections(sections) {
      return sections.map((section, sectionIndex) => {
        switch (section.type) {
          case 'intro':
            return `
              <div class="editable-section" data-section-type="intro" data-section-index="${sectionIndex}">
                <p class="editable editable-intro" data-edit-type="intro" data-edit-section="intro">${section.content}</p>
                ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-section-btn" title="Éditer cette introduction">✏️</button>' : ''}
              </div>
              ${this.shouldRenderEditButtons() ? '<div class="add-paragraph-btn" data-target="intro">➕ Ajouter un paragraphe ici</div>' : ''}
            `;
          
          case 'card':
            return this.renderCard(section, sectionIndex);
          
          case 'grid':
            return this.renderGrid(section, sectionIndex);
          
          default:
            return `<div><!-- Unknown section type: ${section.type} --></div>`;
        }
      }).join('');
    },

    // Helper method to render a card section
    renderCard(cardData, sectionIndex) {
      let cardHTML = `<div class="card editable-section" data-section-type="card" data-section-index="${sectionIndex}">`;
      
      if (cardData.deletable && cardData.sectionType) {
        cardHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="card-title" data-edit-section="${cardData.sectionType}-title">${cardData.title}</h3>
            ${this.shouldRenderEditButtons() ? `<button class="edit-btn edit-title-btn" title="Éditer le titre">✏️</button>` : ''}
            ${this.shouldRenderEditButtons() ? `<button class="remove-section-btn" data-section-type="${cardData.sectionType}" type="button" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">🗑 Supprimer section</button>` : ''}
          </div>
        `;
      } else {
        cardHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="card-title" data-edit-section="card-${sectionIndex}">${cardData.title}</h3>
            ${this.shouldRenderEditButtons() ? `<button class="edit-btn edit-title-btn" title="Éditer le titre">✏️</button>` : ''}
          </div>
        `;
      }

      // Handle different content types
      if (Array.isArray(cardData.content)) {
        cardHTML += cardData.content.map(item => this.renderContentItem(item)).join('');
      } else if (typeof cardData.content === 'object') {
        cardHTML += this.renderComplexContent(cardData.content);
      } else {
        cardHTML += `<div>${cardData.content}</div>`;
      }

      if (cardData.deletable && cardData.sectionName && this.shouldRenderEditButtons()) {
        cardHTML += `
          <div style="margin-top: 1rem; text-align: center;">
            <button class="section-delete btn small" data-section-name="${cardData.sectionName}" type="button" style="background: #ff6b6b; color: white;">🗑 Supprimer section</button>
          </div>
        `;
      }
      
      cardHTML += `</div>`; // Close the card div!
      return cardHTML;
    },

    // Helper method to render content items
    renderContentItem(item) {
      if (item.type === 'paragraph') {
        const content = `
          <div class="editable-section" data-section-type="paragraph">
            <p class="editable editable-paragraph" data-edit-type="paragraph" data-edit-section="${item.editSection}">${item.content}</p>
            ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-paragraph-btn" title="Éditer ce paragraphe">✏️</button>' : ''}
          </div>
        `;
        const addBtn = this.shouldRenderEditButtons() ? `<div class="add-paragraph-btn" data-target="${item.editSection}">➕ Ajouter un paragraphe</div>` : '';
        return content + addBtn;
      }
      return `<div>${item.content}</div>`;
    },

    // Helper method to render complex content (lists, grids, etc.)
    renderComplexContent(content) {
      switch (content.type) {
        case 'ordered_list':
          return `
            <div class="editable-section editable-list-container" data-section-type="ordered_list">
              <ol class="editable editable-list" data-edit-type="ordered-list" data-edit-section="${content.editType}">
                ${content.items.map(item => `<li>${item}</li>`).join('')}
              </ol>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-list-btn" title="Éditer cette liste complète">✏️</button>' : ''}
            </div>
            ${this.shouldRenderEditButtons() ? '<div class="add-paragraph-btn" data-target="creation-steps">➕ Ajouter un paragraphe</div>' : ''}
          `;
        
        case 'list':
          return `
            <div class="editable-section editable-list-container" data-section-type="list">
              <ul class="editable editable-list" data-edit-type="list" data-edit-section="${content.editType}">
                ${content.items.map(item => `<li>${item}</li>`).join('')}
              </ul>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-list-btn" title="Éditer cette liste complète">✏️</button>' : ''}
            </div>
            ${this.shouldRenderEditButtons() ? `<div class="add-paragraph-btn" data-target="${content.editType}">➕ Ajouter un paragraphe</div>` : ''}
          `;
        
        case 'element_pairs':
          return this.renderElementPairs(content.pairs);
        
        case 'grid':
          return this.renderGrid(content);
        
        default:
          return `<div><!-- Unknown content type: ${content.type} --></div>`;
      }
    },

    // Helper method to render element pairs
    renderElementPairs(pairs) {
      return `
        <div class="pairs">
          ${pairs.map(pair => `
            <div class="cell">
              <svg aria-hidden="true" class="eico" viewBox="0 0 24 24">
                <circle cx="12" cy="12" fill="${pair.element1.color}" r="9"></circle>
              </svg>
              <span><span style="color: ${pair.element1.color}; font-weight: bold;${pair.element1.textShadow ? ` text-shadow: ${pair.element1.textShadow};` : ''}">${pair.element1.name}</span></span>
            </div>
            <div class="vs">⇆</div>
            <div class="cell right">
              <svg aria-hidden="true" class="eico" viewBox="0 0 24 24">
                <circle cx="12" cy="12" fill="${pair.element2.color}" r="9"></circle>
              </svg>
              <span><span style="color: ${pair.element2.color}; font-weight: bold;${pair.element2.textShadow ? ` text-shadow: ${pair.element2.textShadow};` : ''}">${pair.element2.name}</span></span>
            </div>
          `).join('')}
        </div>
      `;
    },

    // Helper method to render grids
    renderGrid(gridData) {
      return `
        <div class="grid cols-${gridData.cols}">
          ${gridData.content ? gridData.content.map(item => this.renderCard(item)).join('') : 
            gridData.items ? gridData.items.map(item => this.renderCard(item)).join('') : ''}
        </div>
      `;
    },

    generateElementsPage() {
      return this.generateStaticPage('elements');
    },

    generateStatsPage() {
      return this.generateStaticPage('stats');
    },

    generateCompetencesPage() {
      return this.generateStaticPage('competences-tests');
    },

    generateEtatsPage() {
      return this.generateStaticPage('etats');
    },


    generateDevToolbox() {
      const devToolbox = JdrApp.utils.dom.$('#devToolbox');
      if (!devToolbox) return;

      const toolboxHTML = `
        <!-- En-tête de la toolbox -->
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--rule);">
          <span style="font-size: 18px;">🛠</span>
          <strong style="color: var(--accent-ink); font-family: 'Cinzel', serif;">Outils de développement</strong>
        </div>
        
        <!-- Groupe : Édition et sauvegarde -->
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: var(--paper-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">✏️ Édition</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn small" id="saveAndExport" title="Sauvegarder et exporter tout en ZIP">💾 Export ZIP</button>
            <button class="btn small" id="forceReload" title="Recharger les données JSON (efface le cache)">🔄 Recharger JSON</button>
          </div>
        </div>
        
        <!-- Groupe : Création de contenu -->
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: var(--paper-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">📝 Création</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn small" id="addCategory" title="Créer une nouvelle catégorie/page">📄 Nouvelle page</button>
            <button class="btn small" id="addSpellCategory" title="Créer une nouvelle catégorie de sorts">🔮 Catégorie de sorts</button>
            <button class="btn small" id="addDonCategory" title="Créer une nouvelle catégorie de dons">🎖️ Catégorie de dons</button>
          </div>
        </div>
        
        <!-- Groupe : Ressources -->
        <div>
          <div style="font-size: 12px; color: var(--paper-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">🎭 Ressources</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn small" id="elementsBtn" title="Choisir un élément pour copier sa balise HTML colorée">🎨 Éléments</button>
            <button class="btn small" id="showIcons" title="Afficher la liste des icônes disponibles">🔥 Icônes</button>
          </div>
        </div>
      `;

      devToolbox.innerHTML = toolboxHTML;
    },

    // General image renderer with style options
    renderImage(illusKey, options = {}) {
      const {
        altText = '',
        styleType = 'default', // 'spell', 'class', 'subclass', 'don', 'default'
        size = 'medium', // 'small', 'medium', 'large'
        frame = true
      } = options;

      // Check if image is available in images module
      let imageUrl = '';
      let imageStyle = 'display: none;';
      let removeStyle = 'display: none;';
      
      if (JdrApp.modules.images && JdrApp.modules.images.getImageUrl) {
        imageUrl = JdrApp.modules.images.getImageUrl(illusKey);
        if (imageUrl) {
          imageUrl = JdrApp.modules.images.processImageUrl(imageUrl);
          imageStyle = 'display: inline-block;';
          removeStyle = 'display: inline-flex;';
        }
      }

      // Build CSS classes based on style type
      let containerClasses = 'illus';
      let imageClasses = 'thumb';
      
      if (frame && ['spell', 'class', 'subclass', 'don'].includes(styleType)) {
        containerClasses += ` illus-${styleType}`;
      }
      
      if (size !== 'medium') {
        containerClasses += ` illus-${size}`;
      }

      // In standalone version, don't render editing buttons
      if (window.STANDALONE_VERSION) {
        return `
          <div class="${containerClasses}" data-illus-key="${illusKey}" data-style-type="${styleType}" data-bound="1">
            <img alt="Illustration ${altText}" class="${imageClasses}" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
          </div>
        `;
      }
      
      return `
        <div class="${containerClasses}" data-illus-key="${illusKey}" data-style-type="${styleType}" data-bound="1">
          <img alt="Illustration ${altText}" class="${imageClasses}" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
          <label class="up">📷 Ajouter<input accept="image/*" hidden="" type="file"></label>
          <button class="rm" type="button" style="${removeStyle}">🗑 Retirer</button>
        </div>
      `;
    },

    // Simplified wrapper for backward compatibility
    createIllustration(illusKey, altText = '') {
      // Determine style type from illus key
      let styleType = 'default';
      if (illusKey.startsWith('spell:') || illusKey.startsWith('sort:')) styleType = 'spell';
      else if (illusKey.startsWith('class:')) styleType = 'class';
      else if (illusKey.startsWith('subclass:')) styleType = 'subclass';
      else if (illusKey.startsWith('don:')) styleType = 'don';
      
      return this.renderImage(illusKey, { altText, styleType });
    },

    createSubclassIllustrations(className, subclassName) {
      const illusKey1 = `subclass:${className}:${subclassName}:1`;
      const illusKey2 = `subclass:${className}:${subclassName}:2`;
      
      return `
        <div class="subclass-images">
          ${this.renderImage(illusKey1, { altText: `${subclassName} (Image 1)`, styleType: 'subclass' })}
          ${this.renderImage(illusKey2, { altText: `${subclassName} (Image 2)`, styleType: 'subclass' })}
        </div>
      `;
    },

    // Simplified dynamic rendering
    renderSortCategory(page) {
      const categoryId = page.replace('sorts-', '');
      const category = window.SORTS?.find(cat => 
        JdrApp.utils.data.sanitizeId(cat.nom) === categoryId
      );
      
      if (!category) {
        console.error('Category not found for:', categoryId);
        return;
      }
      
      const article = document.querySelector(`article[data-page="${page}"]`);
      if (!article) {
        console.error('Article not found for page:', page);
        return;
      }
      
      // Generate content directly
      const content = `
        <section>
          <header>
            <h1>${category.nom}</h1>
            <div class="hero-illus">
              ${this.createIllustration(`spellcategory:${category.nom}`)}
            </div>
            
            <div class="editable-section" data-section-type="spell-category-description">
              <p class="lead editable editable-paragraph" data-edit-type="spell-category-description" data-edit-section="${category.nom}">${category.description}</p>
              ${this.shouldRenderEditButtons() ? '<button class="edit-btn edit-paragraph-btn" title="Éditer la description de la catégorie">✏️</button>' : ''}
            </div>
            
            ${this.shouldRenderEditButtons() ? `<button class="spell-add" data-category-name="${category.nom}" type="button">➕ Ajouter un sort</button>` : ''}
          </header>
          
          <div class="grid cols-2">
            ${category.sorts.map((sort, index) => this.generateSpellCard(category, sort, index)).join('')}
          </div>
        </section>
      `;
      
      article.innerHTML = content;
    },

    renderDonCategory(page) {
      // Implementation for dynamic don category rendering
      console.log('Rendering don category:', page);
    },

    renderSingleClass(page) {
      // Implementation for dynamic class rendering
    },


    // Auto-load images for all illustration slots
    autoLoadImages() {
      // Use images module if available, otherwise fallback to simple method
      if (JdrApp.modules.images) {
        return JdrApp.modules.images.autoLoadImages();
      } else {
        // Fallback: simple localStorage-based loading
        return this.fallbackLoadImages();
      }
    },

    // No fallback needed - all images come from ImgBB via images module
    fallbackLoadImages() {
      return 0;
    }
  };

})();