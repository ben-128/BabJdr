// ============================================================================
// JDR-BAB APPLICATION - CARD BUILDER
// ============================================================================

(() => {
  "use strict";

  class CardBuilder {
    constructor(type, data, categoryName = null) {
      this.type = type;
      this.data = data;
      this.categoryName = categoryName;
      this.config = window.ContentTypes[type];
    }

    static create(type, data, categoryName = null) {
      return new CardBuilder(type, data, categoryName);
    }

    // Simple unified dev mode check
    get shouldShowEditButtons() {
      return JdrApp.utils.isDevMode();
    }

    build() {
      switch (this.type) {
        case 'spell':
          return this.buildSpellCard();
        case 'don':
          return this.buildDonCard();
        case 'subclass':
          return this.buildSubclassCard();
        case 'objet':
          return this.buildObjetCard();
        default:
          return this.buildGenericCard();
      }
    }

    buildSpellCard() {
      return `
        <div class="card editable-section" data-section-type="spell" data-spell-name="${this.data.nom}" data-category-name="${this.categoryName}">
          ${this.buildEditableTitle(this.data.nom, 'spell-name')}
          ${this.buildSpellElement()}
          ${this.buildIllustration(`sort:${this.categoryName}:${this.data.nom}`, this.data.nom)}
          ${this.buildEditableField(this.data.description, 'spell-description', 'Description', { style: 'text-align: center; font-style: italic; margin: 1rem 0;' })}
          <hr style="margin: 1rem 0; border: none; border-top: 2px solid var(--bronze); opacity: 0.6;">
          ${this.buildEditableField(this.data.prerequis, 'spell-prerequis', 'Prérequis')}
          ${this.buildEditableField(this.data.portee, 'spell-portee', 'Portée')}
          ${this.buildEditableField(this.data.coutMana, 'spell-mana', 'Coût mana')}
          ${this.buildEditableField(this.data.tempsIncantation, 'spell-temps-incantation', 'Temps d\'incantation')}
          <hr style="margin: 0.5rem 0; border: none; border-top: 1px solid var(--rule);">
          ${this.buildEditableField(this.data.resistance, 'spell-resistance', 'Résistance')}
          ${this.buildEditableEffect(this.data.effetNormal, 'spell-effect-normal', 'Effet normal')}
          <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--rule);">
          ${this.data.effetCritique ? this.buildEditableEffect(this.data.effetCritique, 'spell-effect-critical', 'Effet critique') : ''}
          ${this.data.effetEchec ? this.buildEditableEffect(this.data.effetEchec, 'spell-effect-failure', 'Effet d\'échec') : ''}
          ${this.buildDeleteButton('spell')}
        </div>
      `;
    }

    buildDonCard() {
      const index = this.categoryName ? this.getCategoryData().dons?.indexOf(this.data) || 0 : 0;
      const totalItems = this.categoryName ? this.getCategoryData().dons?.length || 1 : 1;

      return `
        <div class="card editable-section" data-section-type="don" data-don-name="${this.data.nom}" data-category-name="${this.categoryName}">
          ${this.buildEditableTitle(this.data.nom, 'don-name')}
          ${this.buildIllustration(`don:${this.data.nom}`, this.data.nom)}
          ${this.buildEditableField(this.data.description, 'don-description', 'Description')}
          ${this.buildEditableField(this.data.prerequis, 'don-prerequis', 'Prérequis')}
          ${this.buildEditableField(this.data.cout, 'don-cout', 'Coût', { style: 'color: var(--bronze); font-weight: 600;' })}
          ${this.buildMoveButtons('don', index, totalItems)}
        </div>
      `;
    }

    buildSubclassCard() {
      return `
        <div class="card editable-section" data-section-type="subclass" data-class-name="${this.categoryName}" data-subclass-name="${this.data.nom}">
          ${this.buildEditableTitle(this.data.nom, 'subclass-name')}
          ${this.buildSubclassImages()}
          <div style="margin-bottom: 1rem;">
            ${this.buildStatsSection()}
          </div>
          ${this.buildEditableField(this.data.progression, 'subclass-progression', 'Progression')}
          <div class="rule" style="margin: 1.5rem auto; height: 2px; background: linear-gradient(90deg, transparent, var(--bronze), transparent); opacity: 0.6;"></div>
          ${this.buildEditableList(this.data.capacites, 'subclass-capacites', 'Capacités')}
          ${this.buildDeleteButton('subclass')}
        </div>
      `;
    }

    buildObjetCard() {
      // Pour les objets en page unique, l'index est basé sur tous les objets
      const allObjects = window.OBJETS?.objets || [];
      const index = allObjects.indexOf(this.data) || 0;
      const totalItems = allObjects.length;
      
      // Construire l'affichage des tags
      const tagsDisplay = this.data.tags && this.data.tags.length > 0 
        ? this.data.tags.map(tag => `<span class="tag-chip" style="background: var(--bronze); color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em; margin-right: 4px;">${tag}</span>`).join('')
        : '<span style="font-style: italic; color: #666;">Aucun tag</span>';

      return `
        <div class="card editable-section" data-section-type="objet" data-objet-name="${this.data.nom}" data-category-name="${this.categoryName}">
          ${this.buildEditableTitle(this.data.nom, 'objet-name')}
          ${this.buildIllustration(`objet:${this.data.nom}`, this.data.nom)}
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0; font-size: 0.9em; color: var(--bronze);">
            ${this.buildEditableField(`N°${this.data.numero}`, 'objet-numero', 'Numéro', { style: 'font-weight: bold;' })}
            <div style="flex: 1; text-align: right;">
              <div style="margin: 2px 0;">
                ${this.buildEditableTagsField(tagsDisplay, 'objet-tags', 'Tags')}
              </div>
            </div>
          </div>
          ${this.buildEditableField(this.data.description, 'objet-description', 'Description')}
          <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--rule);">
          ${this.buildEditableField(this.data.effet, 'objet-effet', 'Effet')}
          <div style="display: flex; justify-content: space-between; gap: 1rem; margin: 0.5rem 0;">
            <div style="flex: 1;">${this.buildEditableField(this.data.prix, 'objet-prix', 'Prix')}</div>
            <div style="flex: 1;">${this.buildEditableField(this.data.poids, 'objet-poids', 'Poids')}</div>
          </div>
          ${this.buildMoveButtons('objet', index, totalItems)}
        </div>
      `;
    }

    buildEditableTitle(content, editType, centerAlign = true) {
      const style = centerAlign ? 'margin: 0 0 1rem 0; text-align: center;' : '';
      const spellTitleClass = this.type === 'spell' ? ' spell-title' : '';
      
      // Create unique edit section identifier using editType
      const editSection = `${this.data.nom}-${editType}`;
      
      return `
        <div class="editable-section" data-section-type="html">
          <h4 style="${style}" class="editable editable-title${spellTitleClass}" data-edit-type="generic" data-edit-section="${editSection}">${content}</h4>
          ${this.buildEditButton('title')}
        </div>
      `;
    }

    buildEditableField(content, editType, label, options = {}) {
      const style = options.style ? `style="${options.style}"` : '';
      const className = options.className || 'editable-field';
      
      // Create unique edit section identifier using editType
      const editSection = `${this.data.nom}-${editType}`;
      
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable ${className}" data-edit-type="generic" data-edit-section="${editSection}" ${style}>
            ${content}
          </div>
          ${this.buildEditButton('field')}
        </div>
      `;
    }
    
    buildEditableTagsField(content, editType, label, options = {}) {
      const style = options.style ? `style="${options.style}"` : '';
      
      // Create unique edit section identifier using editType
      const editSection = `${this.data.nom}-${editType}`;
      
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable editable-tags" data-edit-type="tags" data-edit-section="${editSection}" ${style}>
            ${content}
          </div>
          ${this.buildEditButton('field')}
        </div>
      `;
    }

    buildEditableEffect(content, editType, label) {
      // Create unique edit section identifier using editType
      const editSection = `${this.data.nom}-${editType}`;
      
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable editable-effect" data-edit-type="generic" data-edit-section="${editSection}" style="margin: 1rem 0;">
            ${content}
          </div>
          ${this.buildEditButton('effect')}
        </div>
      `;
    }

    buildEditableList(items, editType, label) {
      // Everything should be HTML format only
      let listHTML;
      if (typeof items === 'string') {
        // HTML string format
        listHTML = items;
      } else {
        // Fallback if somehow still array format - convert once
// console.warn('Found array format for capacites, converting to HTML:', items);
        if (Array.isArray(items)) {
          listHTML = '<ul>' + items.map(item => '<li>' + item + '</li>').join('') + '</ul>';
        } else {
          listHTML = '<ul><li>Aucune capacité définie</li></ul>';
        }
      }
      
      // Create unique edit section identifier using editType
      const editSection = `${this.data.nom}-${editType}`;
      
      return `
        <h5>${label}</h5>
        <div class="editable-section" data-section-type="html">
          <div class="editable" data-edit-type="generic" data-edit-section="${editSection}">
            ${listHTML}
          </div>
          ${this.buildEditButton('list')}
        </div>
      `;
    }

    buildStatsSection() {
      // Stats are special - they remain as objects since they're structured data
      // But check if they were converted to HTML string by editing
      let statsHTML;
      
      if (typeof this.data.base === 'string') {
        // Already converted to HTML by editing
        statsHTML = this.data.base;
      } else if (typeof this.data.base === 'object') {
        // Original object format - convert to HTML
        statsHTML = '<div class="chips">' + 
          Object.entries(this.data.base).map(([stat, value]) => {
            const icon = window.StatIcons[stat] || '⚡';
            return '<span class="chip">' + icon + ' ' + stat + ': <strong>' + value + '</strong></span>';
          }).join('') + 
          '</div>';
      } else {
        statsHTML = '<div>Aucune statistique définie</div>';
      }
      
      // Create unique edit section identifier for stats
      const editSection = `${this.data.nom}-stats`;
      
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable editable-stats" data-edit-type="generic" data-edit-section="${editSection}">
            ${statsHTML}
          </div>
          ${this.buildEditButton('stats')}
        </div>
      `;
    }

    buildSubclassImages() {
      const illusKey1 = `subclass:${this.categoryName}:${this.data.nom}:1`;
      const illusKey2 = `subclass:${this.categoryName}:${this.data.nom}:2`;
      
      return `
        <div class="subclass-images">
          ${this.buildIllustration(illusKey1, `${this.data.nom} (Image 1)`, 'subclass')}
          ${this.buildIllustration(illusKey2, `${this.data.nom} (Image 2)`, 'subclass')}
        </div>
      `;
    }

    buildIllustration(illusKey, altText = '', styleType = 'default') {
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

      let containerClasses = 'illus';
      if (['spell', 'class', 'subclass', 'don', 'objet'].includes(styleType)) {
        containerClasses += ` illus-${styleType}`;
      }

      if (JdrApp.utils.isDevMode()) {
        return `
          <div class="${containerClasses}" data-illus-key="${illusKey}" data-style-type="${styleType}" data-bound="1">
            <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
            <label class="up">📷 Ajouter<input accept="image/*" hidden="" type="file"></label>
            <button class="rm" type="button" style="${removeStyle}">🗑 Retirer</button>
          </div>
        `;
      }
      
      return `
        <div class="${containerClasses}" data-illus-key="${illusKey}" data-style-type="${styleType}" data-bound="1">
          <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
        </div>
      `;
    }

    buildEditButton(type) {
      const titles = {
        title: 'Éditer le titre',
        field: 'Éditer ce champ',
        effect: 'Éditer cet effet',
        list: 'Éditer cette liste',
        stats: 'Éditer les statistiques'
      };

      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="edit-btn edit-${type}-btn" title="${titles[type] || 'Éditer'}">✏️</button>`;
    }

    buildDeleteButton(type) {
      const config = {
        spell: {
          class: 'spell-delete btn small',
          style: 'background: #ff6b6b; color: white; margin-top: 8px;',
          text: '🗑 Supprimer',
          attrs: `data-category-name="${this.categoryName}" data-spell-name="${this.data.nom}"`
        },
        don: {
          class: 'don-delete btn small',
          style: 'background: #ff6b6b; color: white;',
          text: '🗑 Supprimer',
          attrs: `data-category-name="${this.categoryName}" data-don-name="${this.data.nom}"`
        },
        subclass: {
          class: 'delete-subclass-btn',
          style: '',
          text: '🗑️ Supprimer',
          attrs: `data-class-name="${this.categoryName}" data-subclass-name="${this.data.nom}"`
        },
        objet: {
          class: 'objet-delete btn small',
          style: 'background: #ff6b6b; color: white;',
          text: '🗑 Supprimer',
          attrs: `data-category-name="${this.categoryName}" data-objet-name="${this.data.nom}"`
        }
      };

      const buttonConfig = config[type];
      if (!buttonConfig) return '';

      // Always generate the button - CSS will control visibility based on body.dev-on/dev-off
      return `<button class="${buttonConfig.class}" ${buttonConfig.attrs} type="button" style="${buttonConfig.style}">${buttonConfig.text}</button>`;
    }

    buildMoveButtons(type, index, totalItems) {
      // Always generate the buttons - CSS will control visibility based on body.dev-on/dev-off
      return `
        <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
          ${this.buildDeleteButton(type)}
          <button class="${type}-move-up btn small" data-category-name="${this.categoryName}" data-${type}-name="${this.data.nom}" data-${type}-index="${index}" style="background: var(--bronze); color: white;" ${index === 0 ? 'disabled' : ''}>⬆️ Haut</button>
          <button class="${type}-move-down btn small" data-category-name="${this.categoryName}" data-${type}-name="${this.data.nom}" data-${type}-index="${index}" style="background: var(--bronze); color: white;" ${index === totalItems - 1 ? 'disabled' : ''}>⬇️ Bas</button>
        </div>
      `;
    }

    buildSpellElement() {
      // Get the element (default to 'Feu' if not set)
      const element = this.data.element || 'Feu';
      const icon = window.ElementIcons ? window.ElementIcons[element] : '🔥';
      const colors = window.ElementColors ? window.ElementColors[element] : { color: '#ff6b35', weight: 'bold' };
      
      // Build style string
      let style = `color: ${colors.color}; font-weight: ${colors.weight};`;
      if (colors.background) style += ` background: ${colors.background};`;
      if (colors.padding) style += ` padding: ${colors.padding};`;
      if (colors.borderRadius) style += ` border-radius: ${colors.borderRadius};`;
      
      // Vérifier le mode dev au moment de la génération
      const isDevMode = JdrApp.utils.isDevMode();
      
      if (isDevMode) {
        // Mode développement : afficher le sélecteur
        const options = Object.keys(window.ElementIcons || {});
        const optionsHTML = options.map(elem => 
          `<option value="${elem}" ${elem === element ? 'selected' : ''}>${window.ElementIcons[elem]} ${elem}</option>`
        ).join('');
        
        return `
          <div style="text-align: center; margin: 0.5rem 0;">
            <div class="spell-element-selector" style="font-size: 1.1em;">
              <select data-spell-name="${this.data.nom}" data-category-name="${this.categoryName}" style="padding: 4px 8px; border: 1px solid var(--rule); border-radius: 6px; background: var(--card); font-size: 0.9em;">
                ${optionsHTML}
              </select>
            </div>
          </div>
        `;
      } else {
        // Mode normal : afficher seulement l'icône
        return `
          <div style="text-align: center; margin: 0.5rem 0;">
            <div class="spell-element-display" style="font-size: 1.1em;">
              <span style="${style}">${icon} ${element}</span>
            </div>
          </div>
        `;
      }
    }

    getCategoryData() {
      return window.ContentFactory.getEntity(this.type)?.findCategory(this.categoryName);
    }
  }

  window.CardBuilder = CardBuilder;

})();