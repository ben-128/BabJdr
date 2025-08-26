// ============================================================================
// JDR-BAB APPLICATION - CARD BUILDER
// ============================================================================

(() => {
  "use strict";

  class CardBuilder {
    constructor(type, data, categoryName = null, index = null) {
      this.type = type;
      this.data = data;
      this.categoryName = categoryName;
      this.index = index;
      this.config = window.ContentTypes[type];
    }

    static create(type, data, categoryName = null, index = null) {
      return new CardBuilder(type, data, categoryName, index);
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
        case 'monster':
          return this.buildMonsterCard();
        default:
          return this.buildGenericCard();
      }
    }

    buildSpellCard() {
      return `
        <div class="card editable-section" data-section-type="spell" data-spell-name="${this.data.nom}" data-spell-index="${this.index}" data-category-name="${this.categoryName}">
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
          ${this.buildDeleteButton('spell')}
        </div>
      `;
    }

    buildDonCard() {
      const index = this.index !== null ? this.index : (this.categoryName ? this.getCategoryData().dons?.indexOf(this.data) || 0 : 0);
      const totalItems = this.categoryName ? this.getCategoryData().dons?.length || 1 : 1;

      return `
        <div class="card editable-section" data-section-type="don" data-don-name="${this.data.nom}" data-don-index="${this.index}" data-category-name="${this.categoryName}">
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
          ${this.buildEditableField(this.data.description || 'Description de la sous-classe', 'subclass-description', 'Description', { style: 'text-align: center; color: inherit;' })}
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
        </div>
      `;
    }

    buildMonsterCard() {
      const allMonsters = window.MONSTRES || [];
      const index = allMonsters.indexOf(this.data) || 0;
      const totalItems = allMonsters.length;
      
      // Construire l'affichage des tags
      const tagsDisplay = this.data.tags && this.data.tags.length > 0 
        ? this.data.tags.map(tag => `<span class="tag-chip" style="background: var(--bronze); color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em; margin-right: 4px;">${tag}</span>`).join('')
        : '<span style="font-style: italic; color: #666;">Aucun tag</span>';

      return `
        <div class="card editable-section" data-section-type="monster" data-monster-name="${this.data.nom}">
          ${this.buildEditableTitle(this.data.nom, 'monster-name')}
          ${this.buildIllustration(`monster:${this.data.nom}`, this.data.nom)}
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 0.5rem 0; gap: 1rem;">
            <div style="flex: 1;">
              ${this.buildEditableTagsField(tagsDisplay, 'monster-tags', 'Tags')}
            </div>
            <div style="flex-shrink: 0;">
              ${this.buildMonsterElement()}
            </div>
          </div>
          
          <!-- Séparation avant les stats principales -->
          <hr style="margin: 1.5rem 0 1rem 0; border: none; border-top: 2px solid var(--bronze); opacity: 0.3;">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1rem 0; font-size: 0.9em;">
            <div>${this.buildEditableStatField('❤️ PV', this.data.pointsDeVie, 'monster-pointsdevie', 'Points de vie')}</div>
            <div>${this.buildEditableStatField('🛡️ Armure', this.data.armurePhysique, 'monster-armurephysique', 'Armure physique')}</div>
            <div>${this.buildEditableStatField('⚡ Critique', this.data.coupCritique, 'monster-coupcritique', 'Coup critique')}</div>
            <div>${this.buildEditableStatField('🏃 Esquive', this.data.esquive, 'monster-esquive', 'Esquive')}</div>
            <div>${this.buildEditableStatField('🔮 Crit. Sorts', this.data.coupCritiqueSorts, 'monster-coupcritiquesorts', 'Critique sorts')}</div>
            <div>${this.buildEditableStatField('🛡️ Rés. Alt.', this.data.resistanceAlterations, 'monster-resistancealterations', 'Résistance altérations')}</div>
          </div>

          <!-- Séparation après les stats principales -->
          <hr style="margin: 1rem 0 1.5rem 0; border: none; border-top: 2px solid var(--bronze); opacity: 0.3;">

          <div style="margin: 1rem 0;">
            <strong>🌟 Armures Élémentaires:</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.25rem; font-size: 0.8em; margin-top: 0.5rem;">
              <div>${this.buildEditableStatField(this.getElementIcon('Feu'), this.data.armureFeu, 'monster-armurefeu', 'Armure Feu')}</div>
              <div>${this.buildEditableStatField(this.getElementIcon('Eau'), this.data.armureEau, 'monster-armureeau', 'Armure Eau')}</div>
              <div>${this.buildEditableStatField(this.getElementIcon('Terre'), this.data.armureTerre, 'monster-armureterre', 'Armure Terre')}</div>
              <div>${this.buildEditableStatField(this.getElementIcon('Air'), this.data.armureAir, 'monster-armureair', 'Armure Air')}</div>
              <div>${this.buildEditableStatField(this.getElementIcon('Lumière'), this.data.armureLumiere, 'monster-armurelumiere', 'Armure Lumière')}</div>
              <div>${this.buildEditableStatField(this.getElementIcon('Nuit'), this.data.armureObscurite, 'monster-armureobscurite', 'Armure Obscurité')}</div>
              <div>${this.buildEditableStatField(this.getElementIcon('Divin'), this.data.armureDivin, 'monster-armuredivin', 'Armure Divin')}</div>
              <div>${this.buildEditableStatField(this.getElementIcon('Maléfique'), this.data.armureMalefique, 'monster-armuremalefique', 'Armure Maléfique')}</div>
            </div>
          </div>

          ${this.data.abilites ? `
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--rule);">
            ${this.buildEditableField(this.data.abilites, 'monster-abilites', 'Abilités', { style: 'margin-top: 0.5rem;' })}
          ` : ''}

          ${this.data.butin ? `
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--rule);">
            ${this.buildEditableField(this.data.butin, 'monster-butin', 'Butin', { style: 'margin-top: 0.5rem;' })}
          ` : ''}

          ${this.buildDeleteButton('monster')}
        </div>
      `;
    }

    buildEditableTitle(content, editType, centerAlign = true) {
      const style = centerAlign ? 'margin: 0 0 1rem 0; text-align: center;' : '';
      const spellTitleClass = this.type === 'spell' ? ' spell-title' : '';
      const subclassTitleClass = this.type === 'subclass' ? ' subclass-title' : '';
      const editTypeClass = editType ? ` ${editType}` : '';
      
      // Use the editType directly instead of creating compound identifier
      return `
        <div class="editable-section" data-section-type="html">
          <h4 style="${style}" class="editable editable-title${spellTitleClass}${subclassTitleClass}${editTypeClass}" data-edit-type="generic" data-edit-section="${editType}" data-item-identifier="${this.data.nom}">${content}</h4>
          ${this.buildEditButton('title')}
        </div>
      `;
    }

    buildEditableField(content, editType, label, options = {}) {
      const style = options.style ? `style="${options.style}"` : '';
      const className = options.className || 'editable-field';
      
      // Add the editType as a class for reliable detection
      const editTypeClass = editType ? ` ${editType}` : '';
      
      // Use the editType directly instead of creating compound identifier
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable ${className}${editTypeClass}" data-edit-type="generic" data-edit-section="${editType}" data-item-identifier="${this.data.nom}" ${style}>
            ${content}
          </div>
          ${this.buildEditButton('field')}
        </div>
      `;
    }

    buildEditableStatField(title, value, editType, label, options = {}) {
      const style = options.style ? `style="${options.style}"` : '';
      const className = options.className || 'editable-stat';
      
      // Display the value only as editable, but show title + value visually
      return `
        <div class="editable-section" data-section-type="html">
          <div style="display: flex; align-items: center;">
            <strong style="margin-right: 0.25rem;">${title}:</strong>
            <div class="editable ${className}" data-edit-type="generic" data-edit-section="${editType}" data-item-identifier="${this.data.nom}" ${style}>
              ${value}
            </div>
          </div>
          ${this.buildEditButton('field')}
        </div>
      `;
    }
    
    buildEditableTagsField(content, editType, label, options = {}) {
      const style = options.style ? `style="${options.style}"` : '';
      
      // Use the editType directly instead of creating compound identifier
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable editable-tags" data-edit-type="tags" data-edit-section="${editType}" data-item-identifier="${this.data.nom}" ${style}>
            ${content}
          </div>
          ${this.buildEditButton('field')}
        </div>
      `;
    }

    buildEditableEffect(content, editType, label) {
      const editTypeClass = editType ? ` ${editType}` : '';
      
      // Use the editType directly instead of creating compound identifier
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable editable-effect${editTypeClass}" data-edit-type="generic" data-edit-section="${editType}" data-item-identifier="${this.data.nom}" style="margin: 1rem 0;">
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
        if (Array.isArray(items)) {
          listHTML = '<ul>' + items.map(item => '<li>' + item + '</li>').join('') + '</ul>';
        } else {
          listHTML = '<ul><li>Aucune capacité définie</li></ul>';
        }
      }
      
      // Use the editType directly instead of creating compound identifier
      return `
        <h5>${label}</h5>
        <div class="editable-section" data-section-type="html">
          <div class="editable" data-edit-type="generic" data-edit-section="${editType}" data-item-identifier="${this.data.nom}">
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
      
      // Use subclass-stats directly
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable editable-stats" data-edit-type="generic" data-edit-section="subclass-stats" data-item-identifier="${this.data.nom}">
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
      if (['spell', 'class', 'subclass', 'don', 'objet', 'monster'].includes(styleType)) {
        containerClasses += ` illus-${styleType}`;
      }

      // ALWAYS generate editing controls - CSS will control visibility based on body.dev-on/dev-off
      return `
        <div class="${containerClasses}" data-illus-key="${illusKey}" data-style-type="${styleType}" data-bound="1">
          <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
          <label class="up">📷 Ajouter<input accept="image/*" hidden="" type="file"></label>
          <button class="rm" type="button" style="${removeStyle}">🗑 Retirer</button>
        </div>
      `;
    }

    buildSpellElement() {
      return `
        <div class="spell-element-section">
          <div class="spell-element-display" style="text-align: center; margin: 0.5rem 0;">
            <span class="element-badge" style="display: inline-block; padding: 4px 12px; background: var(--accent); color: white; border-radius: 16px; font-size: 0.9em; font-weight: 600;">
              ${this.getElementIcon(this.data.element)} ${this.data.element}
            </span>
          </div>
          <div class="spell-element-selector" style="text-align: center; margin: 0.5rem 0; display: none;">
            <label for="spell-element-${this.data.nom}" style="display: block; margin-bottom: 0.25rem; font-weight: 600;">Élément:</label>
            <select id="spell-element-${this.data.nom}" class="editable" data-edit-type="select" data-edit-section="spell-element" data-item-identifier="${this.data.nom}">
              <option value="Feu" ${this.data.element === 'Feu' ? 'selected' : ''}>${this.getElementIcon('Feu')} Feu</option>
              <option value="Eau" ${this.data.element === 'Eau' ? 'selected' : ''}>${this.getElementIcon('Eau')} Eau</option>
              <option value="Terre" ${this.data.element === 'Terre' ? 'selected' : ''}>${this.getElementIcon('Terre')} Terre</option>
              <option value="Air" ${this.data.element === 'Air' ? 'selected' : ''}>${this.getElementIcon('Air')} Air</option>
              <option value="Lumière" ${this.data.element === 'Lumière' ? 'selected' : ''}>${this.getElementIcon('Lumière')} Lumière</option>
              <option value="Nuit" ${this.data.element === 'Nuit' ? 'selected' : ''}>${this.getElementIcon('Nuit')} Nuit</option>
              <option value="Divin" ${this.data.element === 'Divin' ? 'selected' : ''}>${this.getElementIcon('Divin')} Divin</option>
              <option value="Maléfique" ${this.data.element === 'Maléfique' ? 'selected' : ''}>${this.getElementIcon('Maléfique')} Maléfique</option>
            </select>
          </div>
        </div>
      `;
    }

    buildMonsterElement() {
      const elementColor = this.getElementColor(this.data.element);
      
      return `
        <div class="monster-element-section">
          <div class="monster-element-display">
            <span class="element-badge" style="
              display: inline-flex; 
              align-items: center; 
              padding: 4px 8px; 
              background: rgba(${parseInt(elementColor.slice(1,3), 16)}, ${parseInt(elementColor.slice(3,5), 16)}, ${parseInt(elementColor.slice(5,7), 16)}, 0.1); 
              border-radius: 6px; 
              border: 1px solid ${elementColor};
              font-size: 0.8em;
              font-weight: 600;
            ">
              <span style="margin-right: 4px;">${this.getElementIcon(this.data.element)}</span>
              <span style="color: ${elementColor};">${this.data.element}</span>
            </span>
          </div>
          <div class="monster-element-selector" style="margin-top: 0.5rem; display: none;">
            <select class="editable" data-edit-type="select" data-edit-section="monster-element" data-item-identifier="${this.data.nom}" style="width: 100%; padding: 4px; border: 1px solid ${elementColor}; border-radius: 4px; font-size: 0.8em;">
              <option value="Feu" ${this.data.element === 'Feu' ? 'selected' : ''}>${this.getElementIcon('Feu')} Feu</option>
              <option value="Eau" ${this.data.element === 'Eau' ? 'selected' : ''}>${this.getElementIcon('Eau')} Eau</option>
              <option value="Terre" ${this.data.element === 'Terre' ? 'selected' : ''}>${this.getElementIcon('Terre')} Terre</option>
              <option value="Air" ${this.data.element === 'Air' ? 'selected' : ''}>${this.getElementIcon('Air')} Air</option>
              <option value="Lumière" ${this.data.element === 'Lumière' ? 'selected' : ''}>${this.getElementIcon('Lumière')} Lumière</option>
              <option value="Nuit" ${this.data.element === 'Nuit' ? 'selected' : ''}>${this.getElementIcon('Nuit')} Nuit</option>
              <option value="Divin" ${this.data.element === 'Divin' ? 'selected' : ''}>${this.getElementIcon('Divin')} Divin</option>
              <option value="Maléfique" ${this.data.element === 'Maléfique' ? 'selected' : ''}>${this.getElementIcon('Maléfique')} Maléfique</option>
            </select>
          </div>
        </div>
      `;
    }

    getElementIcon(element) {
      return window.ElementIcons?.[element] || '⚡';
    }

    getElementColor(element) {
      return window.ElementColors?.[element]?.color || '#666';
    }

    buildGenericCard() {
      return `
        <div class="card">
          <h4>${this.data.nom || 'Unknown'}</h4>
          <p>Generic card for type: ${this.type}</p>
        </div>
      `;
    }

    buildEditButton(buttonType) {
      return `<button class="edit-btn" type="button" title="✏️ Éditer" data-button-type="${buttonType}">✏️</button>`;
    }

    buildDeleteButton(type) {
      const config = this.config;
      const deleteIcon = config?.icons?.delete || '🗑️';
      
      return `
        <div class="delete-button-container" style="margin-top: 1rem; text-align: center;">
          <button class="${type}-delete btn" data-${type}-name="${this.data.nom}" ${this.categoryName ? `data-category-name="${this.categoryName}"` : ''} type="button" style="background: #dc2626; color: white; border: 2px solid #b91c1c;">
            ${deleteIcon} Supprimer ${type}
          </button>
        </div>
      `;
    }

    buildMoveButtons(type, index, totalItems) {
      if (totalItems <= 1) {
        return '';
      }

      return `
        <div class="move-buttons" style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
          <button class="${type}-move-up btn small" data-${type}-name="${this.data.nom}" data-category-name="${this.categoryName}" type="button" style="background: #3b82f6; color: white; padding: 4px 8px; font-size: 0.8em;" ${index === 0 ? 'disabled' : ''}>
            ↑ Haut
          </button>
          <button class="${type}-move-down btn small" data-${type}-name="${this.data.nom}" data-category-name="${this.categoryName}" type="button" style="background: #3b82f6; color: white; padding: 4px 8px; font-size: 0.8em;" ${index >= totalItems - 1 ? 'disabled' : ''}>
            ↓ Bas
          </button>
        </div>
      `;
    }

    getCategoryData() {
      if (this.type === 'don' && this.categoryName) {
        const categoryData = window.DONS.find(cat => cat.nom === this.categoryName);
        return categoryData || { dons: [] };
      }
      return { [this.type + 's']: [] };
    }
  }

  window.CardBuilder = CardBuilder;

})();