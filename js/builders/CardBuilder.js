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
      this.shouldShowEditButtons = !window.STANDALONE_VERSION;
    }

    static create(type, data, categoryName = null) {
      return new CardBuilder(type, data, categoryName);
    }

    build() {
      switch (this.type) {
        case 'spell':
          return this.buildSpellCard();
        case 'don':
          return this.buildDonCard();
        case 'subclass':
          return this.buildSubclassCard();
        default:
          return this.buildGenericCard();
      }
    }

    buildSpellCard() {
      return `
        <div class="card editable-section" data-section-type="spell" data-spell-name="${this.data.nom}" data-category-name="${this.categoryName}">
          ${this.buildEditableTitle(this.data.nom, 'spell-name')}
          ${this.buildIllustration(`sort:${this.categoryName}:${this.data.nom}`, this.data.nom)}
          ${this.buildEditableField(this.data.description, 'spell-description', 'Description')}
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
          ${this.buildStatsSection()}
          ${this.buildEditableField(this.data.progression, 'subclass-progression', 'Progression')}
          ${this.buildEditableList(this.data.capacites, 'subclass-capacites', 'Capacités')}
          ${this.buildDeleteButton('subclass')}
        </div>
      `;
    }

    buildEditableTitle(content, editType, centerAlign = true) {
      const style = centerAlign ? 'margin: 0 0 1rem 0; text-align: center;' : '';
      return `
        <div class="editable-section" data-section-type="html">
          <h4 style="${style}" class="editable editable-title" data-edit-type="html" data-edit-section="${this.data.nom}">${content}</h4>
          ${this.buildEditButton('title')}
        </div>
      `;
    }

    buildEditableField(content, editType, label, options = {}) {
      const style = options.style ? `style="${options.style}"` : '';
      const className = options.className || 'editable-field';
      
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable ${className}" data-edit-type="html" data-edit-section="${this.data.nom}" ${style}>
            ${content}
          </div>
          ${this.buildEditButton('field')}
        </div>
      `;
    }

    buildEditableEffect(content, editType, label) {
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable editable-effect" data-edit-type="html" data-edit-section="${this.data.nom}" style="margin: 1rem 0;">
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
        console.warn('Found array format for capacites, converting to HTML:', items);
        if (Array.isArray(items)) {
          listHTML = '<ul>' + items.map(item => '<li>' + item + '</li>').join('') + '</ul>';
        } else {
          listHTML = '<ul><li>Aucune capacité définie</li></ul>';
        }
      }
      
      return `
        <h5>${label}</h5>
        <div class="editable-section" data-section-type="html">
          <div class="editable" data-edit-type="html" data-edit-section="${this.data.nom}">
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
      
      return `
        <div class="editable-section" data-section-type="html">
          <div class="editable editable-stats" data-edit-type="html" data-edit-section="${this.data.nom}">
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
      if (['spell', 'class', 'subclass', 'don'].includes(styleType)) {
        containerClasses += ` illus-${styleType}`;
      }

      if (window.STANDALONE_VERSION) {
        return `
          <div class="${containerClasses}" data-illus-key="${illusKey}" data-style-type="${styleType}" data-bound="1">
            <img alt="Illustration ${altText}" class="thumb" style="${imageStyle}"${imageUrl ? ` src="${imageUrl}"` : ''}>
          </div>
        `;
      }
      
      return `
        <div class="${containerClasses}" data-illus-key="${illusKey}" data-style-type="${styleType}" data-bound="1">
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
        field: 'Éditer ce champ',
        effect: 'Éditer cet effet',
        list: 'Éditer cette liste',
        stats: 'Éditer les statistiques'
      };

      return `<button class="edit-btn edit-${type}-btn" title="${titles[type] || 'Éditer'}">✏️</button>`;
    }

    buildDeleteButton(type) {
      if (!this.shouldShowEditButtons) return '';

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
        }
      };

      const buttonConfig = config[type];
      if (!buttonConfig) return '';

      return `<button class="${buttonConfig.class}" ${buttonConfig.attrs} type="button" style="${buttonConfig.style}">${buttonConfig.text}</button>`;
    }

    buildMoveButtons(type, index, totalItems) {
      if (!this.shouldShowEditButtons) return '';

      return `
        <div style="display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap;">
          ${this.buildDeleteButton(type)}
          <button class="${type}-move-up btn small" data-category-name="${this.categoryName}" data-${type}-name="${this.data.nom}" data-${type}-index="${index}" style="background: var(--bronze); color: white;" ${index === 0 ? 'disabled' : ''}>⬆️ Haut</button>
          <button class="${type}-move-down btn small" data-category-name="${this.categoryName}" data-${type}-name="${this.data.nom}" data-${type}-index="${index}" style="background: var(--bronze); color: white;" ${index === totalItems - 1 ? 'disabled' : ''}>⬇️ Bas</button>
        </div>
      `;
    }

    getCategoryData() {
      return window.ContentFactory.getEntity(this.type)?.findCategory(this.categoryName);
    }
  }

  window.CardBuilder = CardBuilder;

})();