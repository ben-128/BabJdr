// ============================================================================
// JDR-BAB APPLICATION - MODAL MANAGER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // MODAL MANAGER - SPECIALIZED MODALS
  // ========================================
  window.ModalManager = {

    /**
     * Show elements modal for dev tools
     */
    showElementsModal() {
      let modal = JdrApp.utils.dom.$('#elementsModal');
      if (!modal) {
        modal = this.createElementsModal();
        document.body.appendChild(modal);
      }
      
      BaseModal.openModal('elementsModal');
    },

    /**
     * Create elements selection modal
     */
    createElementsModal() {
      const elements = Object.entries(window.ElementColors).map(([name, config]) => ({
        name,
        color: config.color,
        icon: UIUtilities.getElementIcon(name)
      }));

      const elementsHTML = elements.map(element => `
        <div class="element-item" data-element="${element.name}" data-color="${element.color}">
          <div class="element-icon" style="background: ${element.color};">${element.icon}</div>
          <div class="element-name">${element.name}</div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = BaseModal.createModal('elementsModal', '⚡ Éléments', `
        <p>Cliquez sur un élément pour copier son code HTML stylé dans le presse-papiers :</p>
        <div class="elements-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 20px 0;">
          ${elementsHTML}
        </div>
      `);

      // Add event listeners
      modal.addEventListener('click', (e) => {
        const elementItem = e.target.closest('.element-item');
        if (elementItem) {
          const elementName = elementItem.dataset.element;
          const elementColor = elementItem.dataset.color;
          
          // Get element configuration
          const elementConfig = window.ElementColors[elementName];
          if (elementConfig) {
            const styleString = `color: ${elementConfig.color}; font-weight: ${elementConfig.weight || 'bold'};`;
            
            const html = `<span style="${styleString}">${elementName}</span>`;
            UIUtilities.copyToClipboard(html);
          } else {
            // Fallback for elements not found
            const html = `<span style="color: ${elementColor}; font-weight: bold;">${elementName}</span>`;
            UIUtilities.copyToClipboard(html);
          }
          
          elementItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            BaseModal.closeModal(modal);
            elementItem.classList.remove('copied');
          }, 800);
        }
      });

      return modal;
    },

    /**
     * Show states modal
     */
    showEtatsModal() {
      let modal = JdrApp.utils.dom.$('#etatsModal');
      if (!modal) {
        modal = this.createEtatsModal();
        document.body.appendChild(modal);
      }
      
      BaseModal.openModal('etatsModal');
    },

    /**
     * Create states modal
     */
    createEtatsModal() {
      // Extract states from static pages
      let etats = [];
      if (window.STATIC_PAGES?.etats?.sections) {
        etats = window.STATIC_PAGES.etats.sections.filter(section => 
          section.type === 'card' && section.title
        );
      }

      const etatsHTML = etats.map(etat => `
        <div class="etat-item" data-etat-name="${etat.title}">
          <div class="etat-name">${etat.title}</div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = BaseModal.createModal('etatsModal', '🎭 États', `
        <p>Cliquez sur un état pour copier son lien HTML dans le presse-papiers :</p>
        <div class="etats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin: 20px 0;">
          ${etatsHTML}
        </div>
      `);

      // Add event listeners
      modal.addEventListener('click', (e) => {
        const etatItem = e.target.closest('.etat-item');
        if (etatItem) {
          const etatName = etatItem.dataset.etatName;
          
          // Create clickable link
          const etatLink = `<span class="etat-link" data-etat="${etatName}" style="color: var(--accent); cursor: pointer; text-decoration: underline;">${etatName}</span>`;
          
          // Toujours copier dans le presse-papiers
          UIUtilities.copyToClipboard(etatLink);
          
          etatItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            BaseModal.closeModal(modal);
            etatItem.classList.remove('copied');
          }, 800);
        }
      });

      return modal;
    },

    /**
     * Show spell links modal
     */
    showSpellLinksModal() {
      let modal = JdrApp.utils.dom.$('#spellLinksModal');
      if (!modal) {
        modal = this.createSpellLinksModal();
        document.body.appendChild(modal);
      }
      
      BaseModal.openModal('spellLinksModal');
    },

    /**
     * Create spell links modal
     */
    createSpellLinksModal() {
      // Extract spells from data
      let spells = [];
      if (window.SORTS && Array.isArray(window.SORTS)) {
        window.SORTS.forEach(category => {
          if (category.sorts && Array.isArray(category.sorts)) {
            category.sorts.forEach(spell => {
              spells.push({
                name: spell.nom,
                category: category.nom,
                element: spell.element || 'Neutre',
                description: spell.description || ''
              });
            });
          }
        });
      }

      const spellsHTML = spells.map(spell => `
        <div class="spell-item" data-spell-name="${spell.name}" data-spell-category="${spell.category}">
          <div class="spell-info">
            <div class="spell-name" style="color: ${UIUtilities.getElementColor(spell.element)}; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${spell.name}</div>
            <span data-spell-meta style="color: ${UIUtilities.getElementColor(spell.element)} !important; font-size: 12px; margin-bottom: 6px; display: block;">${UIUtilities.getElementIcon(spell.element)} ${spell.element} • ${spell.category}</span>
            <div class="spell-description">${spell.description.length > 80 ? spell.description.substring(0, 80) + '...' : spell.description}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = BaseModal.createModal('spellLinksModal', '🔮 Liens de Sorts', `
        <p>Cliquez sur un sort pour copier son lien HTML dans le presse-papiers :</p>
        <div class="spells-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin: 20px 0; max-height: 400px; overflow-y: auto;">
          ${spellsHTML}
        </div>
      `);

      // Add event listeners
      modal.addEventListener('click', (e) => {
        const spellItem = e.target.closest('.spell-item');
        if (spellItem) {
          const spellName = spellItem.dataset.spellName;
          const spellCategory = spellItem.dataset.spellCategory;
          
          // Create clickable spell link
          const spellLink = `<span class="spell-link" data-spell="${spellName}" data-category="${spellCategory}" style="color: var(--accent); cursor: pointer; text-decoration: underline;">${spellName}</span>`;
          
          UIUtilities.copyToClipboard(spellLink);
          
          spellItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            BaseModal.closeModal(modal);
            spellItem.classList.remove('copied');
          }, 800);
        }
      });

      return modal;
    },

    /**
     * Show monster links modal
     */
    showMonsterLinksModal() {
      let modal = JdrApp.utils.dom.$('#monsterLinksModal');
      if (!modal) {
        modal = this.createMonsterLinksModal();
        document.body.appendChild(modal);
      }
      
      BaseModal.openModal('monsterLinksModal');
    },

    /**
     * Create monster links modal
     */
    createMonsterLinksModal() {
      // Extract monsters from data
      let monsters = [];
      if (window.MONSTRES && Array.isArray(window.MONSTRES)) {
        monsters = window.MONSTRES.map(monster => ({
          name: monster.nom,
          element: monster.element || 'Neutre',
          pointsDeVie: monster.pointsDeVie || '?',
          tags: monster.tags || [],
          description: monster.description || ''
        }));
      }

      const monstersHTML = monsters.map(monster => `
        <div class="monster-item" data-monster-name="${monster.name}">
          <div class="monster-info">
            <div class="monster-name" style="color: ${UIUtilities.getElementColor(monster.element)}; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${monster.name}</div>
            <span data-monster-meta style="color: ${UIUtilities.getElementColor(monster.element)} !important; font-size: 12px; margin-bottom: 6px; display: block;">${UIUtilities.getElementIcon(monster.element)} ${monster.element} • ${monster.pointsDeVie} PV • ${monster.tags.join(', ')}</span>
            <div class="monster-description">${UIUtilities.stripHtml(monster.description).length > 80 ? UIUtilities.stripHtml(monster.description).substring(0, 80) + '...' : UIUtilities.stripHtml(monster.description)}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = BaseModal.createModal('monsterLinksModal', '👹 Liens de Monstres', `
        <p>Cliquez sur un monstre pour copier son lien HTML dans le presse-papiers :</p>
        <div class="monsters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin: 20px 0; max-height: 400px; overflow-y: auto;">
          ${monstersHTML}
        </div>
      `);

      // Add event listeners
      modal.addEventListener('click', (e) => {
        const monsterItem = e.target.closest('.monster-item');
        if (monsterItem) {
          const monsterName = monsterItem.dataset.monsterName;
          
          // Create clickable monster link
          const monsterLink = `<span class="monster-link" data-monster="${monsterName}" style="color: var(--accent); cursor: pointer; text-decoration: underline;">${monsterName}</span>`;
          
          UIUtilities.copyToClipboard(monsterLink);
          
          monsterItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            BaseModal.closeModal(modal);
            monsterItem.classList.remove('copied');
          }, 800);
        }
      });

      return modal;
    },

    /**
     * Show page links modal
     */
    showPageLinksModal() {
      // Simple implementation - delegate to ui.js for now
      if (JdrApp.modules.ui?.showPageLinksModal) {
        return JdrApp.modules.ui.showPageLinksModal();
      }
    }
  };

})();