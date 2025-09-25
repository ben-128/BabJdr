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
     * Show stats icons modal
     */
    showStatsIconsModal() {
      let modal = JdrApp.utils.dom.$('#statsIconsModal');
      if (!modal) {
        modal = this.createStatsIconsModal();
        document.body.appendChild(modal);
      }

      BaseModal.openModal('statsIconsModal');
    },

    /**
     * Create stats icons modal
     */
    createStatsIconsModal() {
      const statsIcons = [
        { name: 'Force', icon: '💪', description: 'Améliore les dégâts physiques' },
        { name: 'Endurance', icon: '🛡️', description: 'Détermine les points de vie maximum' },
        { name: 'Agilité', icon: '🏃', description: 'Améliore esquive, critique et initiative' },
        { name: 'Intelligence', icon: '🧠', description: 'Augmente la puissance des sorts' },
        { name: 'Volonté', icon: '⚡', description: 'Détermine le mana maximum' },
        { name: 'Chance', icon: '🍀', description: 'Améliore la fortune et les critiques' },
        { name: 'Initiative', icon: '⚡', description: 'Ordre des tours de combat' },
        { name: 'Fortune', icon: '🍀', description: 'Améliore les événements de chance' },
        { name: 'Vie', icon: '❤️', description: 'Points de vie actuels' },
        { name: 'Mana', icon: '🔵', description: 'Points de mana actuels' },
        { name: 'Armure', icon: '🛡️', description: 'Protection physique' },
        { name: 'Esquive', icon: '🏃', description: 'Éviter les attaques' },
        { name: 'Critique', icon: '⚡', description: 'Chances de coup critique' }
      ];

      const statsHTML = statsIcons.map(stat => `
        <div class="stat-icon-item" data-stat-name="${stat.name}" data-stat-icon="${stat.icon}">
          <div class="stat-icon-display">${stat.icon}</div>
          <div class="stat-icon-info">
            <div class="stat-icon-name">${stat.name}</div>
            <div class="stat-icon-description">${stat.description}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = BaseModal.createModal('statsIconsModal', '📊 Icônes de Statistiques', `
        <p>Cliquez sur une statistique pour copier son icône dans le presse-papiers :</p>
        <div class="stats-icons-grid" style="display: grid; gap: 8px; margin: 20px 0; max-height: 400px; overflow-y: auto;">
          ${statsHTML}
        </div>
        <style>
          .stat-icon-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            background: var(--card-bg);
          }
          .stat-icon-item:hover {
            background: var(--hover-bg);
            border-color: var(--accent);
          }
          .stat-icon-display {
            font-size: 24px;
            min-width: 32px;
            text-align: center;
          }
          .stat-icon-info {
            flex: 1;
          }
          .stat-icon-name {
            font-weight: bold;
            color: var(--text-color);
            margin-bottom: 2px;
          }
          .stat-icon-description {
            font-size: 12px;
            color: var(--text-muted);
          }
          .copy-indicator {
            position: absolute;
            top: 50%;
            right: 12px;
            transform: translateY(-50%);
            background: var(--success);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .stat-icon-item.copied .copy-indicator {
            opacity: 1;
          }
        </style>
      `);

      // Add event listeners
      modal.addEventListener('click', (e) => {
        const statItem = e.target.closest('.stat-icon-item');
        if (statItem) {
          const statIcon = statItem.dataset.statIcon;

          // Copy just the icon to clipboard
          UIUtilities.copyToClipboard(statIcon);

          statItem.classList.add('copied');

          // Remove copied state after delay
          setTimeout(() => {
            statItem.classList.remove('copied');
          }, 1000);
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
     * Show state preview tooltip
     */
    showEtatPreview(etatName, etatDescription, triggerElement) {
      if (!etatName) return;
      
      // Remove any existing preview of the same type
      const existingPreview = document.querySelector('.etat-preview-tooltip');
      if (existingPreview) {
        existingPreview.remove();
      }
      
      // Create a simple tooltip-style preview
      const preview = document.createElement('div');
      preview.className = 'etat-preview-tooltip';
      preview.innerHTML = `
        <div class="etat-preview-header">
          <strong>${etatName}</strong>
        </div>
        <div class="etat-preview-content">
          ${etatDescription || 'Description non disponible'}
        </div>
      `;
      
      // Style the preview
      preview.style.cssText = `
        position: absolute;
        background: var(--paper);
        border: 2px solid var(--accent-ink);
        border-radius: 8px;
        padding: 12px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,1) !important;
        z-index: 2147483647;
        font-size: 14px;
        line-height: 1.4;
        color: var(--ink);
        pointer-events: none;
        opacity: 1 !important;
      `;
      
      // Force opacity on all child elements
      preview.addEventListener('mouseenter', () => {
        preview.style.opacity = '1';
        preview.style.boxShadow = '0 4px 12px rgba(0,0,0,1)';
      });
      preview.addEventListener('mouseleave', () => {
        preview.style.opacity = '1';
        preview.style.boxShadow = '0 4px 12px rgba(0,0,0,1)';
      });
      
      // Position near the trigger element
      const rect = triggerElement.getBoundingClientRect();
      preview.style.left = (rect.left + window.scrollX) + 'px';
      preview.style.top = (rect.bottom + window.scrollY + 5) + 'px';
      
      // Add to document
      document.body.appendChild(preview);
      
      // Remove on click outside or after delay
      const removePreview = () => {
        if (preview.parentNode) {
          preview.parentNode.removeChild(preview);
        }
        // Clean up event listener if it exists
        if (preview._clickHandler) {
          document.removeEventListener('click', preview._clickHandler);
        }
      };
      
      // Store reference to the listener function for états only
      const clickOutsideHandler = (e) => {
        // Check if the click is outside the preview and not on a link inside the preview
        if (!preview.contains(e.target) && e.target !== triggerElement) {
          removePreview();
          document.removeEventListener('click', clickOutsideHandler);
        }
      };
      
      // Add listener that will close on clicks outside (états only)
      document.addEventListener('click', clickOutsideHandler);
      
      // Store the handler on the preview element for cleanup
      preview._clickHandler = clickOutsideHandler;
    },

    /**
     * Show spell preview tooltip
     */
    showSpellPreview(spellName, categoryName, triggerElement) {
      if (!spellName) return;
      
      // Only remove existing spell previews, not other types
      const existingPreview = document.querySelector('.spell-preview-tooltip');
      if (existingPreview) {
        existingPreview.remove();
      }
      
      // Find the spell in the data
      let foundSpell = null;
      if (window.SORTS) {
        for (const category of window.SORTS) {
          const spell = category.sorts?.find(s => s.nom === spellName);
          if (spell) {
            foundSpell = spell;
            break;
          }
        }
      }
      
      if (!foundSpell) {
        this.showEtatPreview(spellName, 'Sort non trouvé', triggerElement);
        return;
      }
      
      // Find the actual category name for the spell
      let actualCategoryName = 'preview';
      if (window.SORTS) {
        for (const category of window.SORTS) {
          if (category.sorts?.find(s => s.nom === spellName)) {
            actualCategoryName = category.nom;
            break;
          }
        }
      }
      
      // Create a temporary CardBuilder that allows preview mode but with real category name
      const tempBuilder = CardBuilder.create('spell', foundSpell, actualCategoryName);
      tempBuilder.isPreview = true; // Force preview mode manually
      const spellCard = tempBuilder.build();
      
      // Create and show preview
      const preview = document.createElement('div');
      preview.className = 'spell-preview-tooltip';
      preview.innerHTML = `
        <style>
          .spell-preview-tooltip,
          .spell-preview-tooltip *,
          .spell-preview-tooltip *::before,
          .spell-preview-tooltip *::after {
            opacity: 1 !important;
            background-color: rgba(248, 246, 240, 1) !important;
          }
          .spell-preview-tooltip .card,
          .spell-preview-tooltip .card *,
          .spell-preview-tooltip div,
          .spell-preview-tooltip span,
          .spell-preview-tooltip p,
          .spell-preview-tooltip section,
          .spell-preview-tooltip article,
          .spell-preview-tooltip header,
          .spell-preview-tooltip footer {
            opacity: 1 !important;
            background-color: rgba(248, 246, 240, 1) !important;
            background: rgba(248, 246, 240, 1) !important;
          }
          .spell-preview-tooltip .card:hover {
            opacity: 1 !important;
            background: rgba(248, 246, 240, 1) !important;
            transform: none !important;
          }
          .preview-close-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #dc2626;
            color: black;
            border: 3px solid #ffffff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 24px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.6);
            transition: all 0.2s ease;
          }
          .preview-close-btn:hover {
            background: #b91c1c;
            color: black;
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.8);
          }
        </style>
        <button class="preview-close-btn" title="Fermer">&times;</button>
        ${spellCard}
      `;
      
      // Style the preview container
      preview.style.cssText = `
        position: absolute;
        z-index: 2147483647;
        max-width: 450px;
        max-height: 600px;
        overflow-y: auto;
        box-shadow: 0 8px 24px rgba(0,0,0,1) !important;
        border-radius: 12px;
        pointer-events: auto;
        opacity: 1 !important;
        background: rgb(248, 246, 240) !important;
        background-color: rgb(248, 246, 240) !important;
      `;
      
      // Force styles after element is added to DOM
      setTimeout(() => {
        preview.style.setProperty('opacity', '1', 'important');
        preview.style.setProperty('background', 'rgb(248, 246, 240)', 'important');
        preview.style.setProperty('background-color', 'rgb(248, 246, 240)', 'important');
        
        // Force background on all child elements
        const allElements = preview.querySelectorAll('*');
        allElements.forEach(el => {
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('background-color', 'rgb(248, 246, 240)', 'important');
          el.style.setProperty('background', 'rgb(248, 246, 240)', 'important');
          el.style.setProperty('display', 'initial', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
        });
      }, 10);
      
      // Position near the trigger element
      const rect = triggerElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate position to keep preview in viewport
      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY + 5;
      
      // Adjust horizontal position if too far right
      if (left + 450 > viewportWidth) {
        left = rect.right + window.scrollX - 450;
      }
      if (left < 10) {
        left = 10;
      }
      
      // Adjust vertical position if too far down
      if (top + 600 > viewportHeight + window.scrollY) {
        top = rect.top + window.scrollY - 605;
      }
      if (top < 10) {
        top = 10;
      }
      
      preview.style.left = left + 'px';
      preview.style.top = top + 'px';
      
      // Add to document
      document.body.appendChild(preview);
      
      // Remove on click outside or after delay
      const removePreview = () => {
        if (preview.parentNode) {
          preview.parentNode.removeChild(preview);
        }
      };
      
      // Add click handler for the close button only
      setTimeout(() => {
        const closeBtn = preview.querySelector('.preview-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            removePreview();
          });
        }
      }, 10);
    },

    /**
     * Show monster preview tooltip
     */
    showMonsterPreview(monsterName, triggerElement, event) {
      if (!monsterName) return;
      
      // Only remove existing monster previews, not other types
      const existingPreview = document.querySelector('.monster-preview-tooltip');
      if (existingPreview) {
        existingPreview.remove();
      }
      
      // Find the monster in the data
      let foundMonster = null;
      if (window.MONSTRES) {
        foundMonster = window.MONSTRES.find(m => m.nom === monsterName);
      }
      
      if (!foundMonster) {
        this.showEtatPreview(monsterName, 'Monstre non trouvé', triggerElement);
        return;
      }
      
      // Use CardBuilder to create a full monster card in preview mode
      const monsterCard = CardBuilder.create('monster', foundMonster, 'preview').build();
      
      // Create and show preview
      const preview = document.createElement('div');
      preview.className = 'monster-preview-tooltip';
      preview.innerHTML = `
        <style>
          .monster-preview-tooltip,
          .monster-preview-tooltip *,
          .monster-preview-tooltip *::before,
          .monster-preview-tooltip *::after {
            opacity: 1 !important;
            background-color: rgba(248, 246, 240, 1) !important;
          }
          .monster-preview-tooltip .card,
          .monster-preview-tooltip .card *,
          .monster-preview-tooltip div,
          .monster-preview-tooltip span,
          .monster-preview-tooltip p,
          .monster-preview-tooltip section,
          .monster-preview-tooltip article,
          .monster-preview-tooltip header,
          .monster-preview-tooltip footer {
            opacity: 1 !important;
            background-color: rgba(248, 246, 240, 1) !important;
            background: rgba(248, 246, 240, 1) !important;
          }
          .monster-preview-tooltip .card:hover {
            opacity: 1 !important;
            background: rgba(248, 246, 240, 1) !important;
            transform: none !important;
          }
          .preview-close-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #dc2626;
            color: black;
            border: 3px solid #ffffff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 24px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.6);
            transition: all 0.2s ease;
          }
          .preview-close-btn:hover {
            background: #b91c1c;
            color: black;
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.8);
          }
        </style>
        <button class="preview-close-btn" title="Fermer">&times;</button>
        ${monsterCard}
      `;
      
      // Style the preview container
      preview.style.cssText = `
        position: absolute;
        z-index: 2147483647;
        max-width: 450px;
        max-height: 700px;
        overflow-y: auto;
        box-shadow: 0 8px 24px rgba(0,0,0,1) !important;
        border-radius: 12px;
        pointer-events: auto;
        opacity: 1 !important;
        background: rgb(248, 246, 240) !important;
        background-color: rgb(248, 246, 240) !important;
      `;
      
      // Force styles after element is added to DOM
      setTimeout(() => {
        preview.style.setProperty('opacity', '1', 'important');
        preview.style.setProperty('background', 'rgb(248, 246, 240)', 'important');
        preview.style.setProperty('background-color', 'rgb(248, 246, 240)', 'important');
        
        // Force background on all child elements
        const allElements = preview.querySelectorAll('*');
        allElements.forEach(el => {
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('background-color', 'rgb(248, 246, 240)', 'important');
          el.style.setProperty('background', 'rgb(248, 246, 240)', 'important');
          el.style.setProperty('display', 'initial', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
        });
      }, 10);
      
      // Position near the trigger element
      const rect = triggerElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate position to keep preview in viewport
      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY + 5;
      
      // Adjust horizontal position if too far right
      if (left + 450 > viewportWidth) {
        left = rect.right + window.scrollX - 450;
      }
      if (left < 10) {
        left = 10;
      }
      
      // Adjust vertical position if too far down
      if (top + 700 > viewportHeight + window.scrollY) {
        top = rect.top + window.scrollY - 705;
      }
      if (top < 10) {
        top = 10;
      }
      
      preview.style.left = left + 'px';
      preview.style.top = top + 'px';
      
      // Add to document
      document.body.appendChild(preview);
      
      // Remove on click outside or after delay
      const removePreview = () => {
        if (preview.parentNode) {
          preview.parentNode.removeChild(preview);
        }
      };
      
      // Add click handler for the close button only
      setTimeout(() => {
        const closeBtn = preview.querySelector('.preview-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            removePreview();
          });
        }
      }, 10);
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
        <div style="margin: 15px 0;">
          <input type="text" id="spell-search-input" placeholder="🔍 Rechercher un sort..." style="width: 100%; padding: 8px 12px; border: 2px solid var(--rule); border-radius: 8px; font-size: 14px;">
        </div>
        <div class="spells-grid" id="spells-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin: 20px 0; max-height: 400px; overflow-y: auto;">
          ${spellsHTML}
        </div>
      `);

      // Add search functionality
      const searchInput = modal.querySelector('#spell-search-input');
      const spellsGrid = modal.querySelector('#spells-grid');
      const allSpellItems = spellsGrid.querySelectorAll('.spell-item');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          
          allSpellItems.forEach(item => {
            const spellName = item.dataset.spellName.toLowerCase();
            const spellCategory = item.dataset.spellCategory.toLowerCase();
            const spellText = item.textContent.toLowerCase();
            
            const matches = spellName.includes(searchTerm) || 
                          spellCategory.includes(searchTerm) || 
                          spellText.includes(searchTerm);
            
            item.style.display = matches ? '' : 'none';
          });
        });
      }

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
        <div style="margin: 15px 0;">
          <input type="text" id="monster-search-input" placeholder="🔍 Rechercher un monstre..." style="width: 100%; padding: 8px 12px; border: 2px solid var(--rule); border-radius: 8px; font-size: 14px;">
        </div>
        <div class="monsters-grid" id="monsters-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin: 20px 0; max-height: 400px; overflow-y: auto;">
          ${monstersHTML}
        </div>
      `);

      // Add search functionality
      const searchInput = modal.querySelector('#monster-search-input');
      const monstersGrid = modal.querySelector('#monsters-grid');
      const allMonsterItems = monstersGrid.querySelectorAll('.monster-item');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          
          allMonsterItems.forEach(item => {
            const monsterName = item.dataset.monsterName.toLowerCase();
            const monsterText = item.textContent.toLowerCase();
            
            const matches = monsterName.includes(searchTerm) || 
                          monsterText.includes(searchTerm);
            
            item.style.display = matches ? '' : 'none';
          });
        });
      }

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
      let modal = JdrApp.utils.dom.$('#pageLinksModal');
      if (!modal) {
        modal = this.createPageLinksModal();
        document.body.appendChild(modal);
      }
      
      BaseModal.openModal('pageLinksModal');
    },

    /**
     * Create page links modal
     */
    createPageLinksModal() {
      // Extract pages from TOC structure
      let pages = [];
      
      // Add direct pages
      if (window.TOC_STRUCTURE?.directPages) {
        window.TOC_STRUCTURE.directPages.forEach(page => {
          pages.push({
            id: page.id,
            title: page.title,
            icon: page.icon || '📄',
            section: 'Pages directes'
          });
        });
      }
      
      // Add section pages
      if (window.TOC_STRUCTURE?.sections) {
        window.TOC_STRUCTURE.sections.forEach(section => {
          if (section.items && Array.isArray(section.items)) {
            section.items.forEach(item => {
              if (item.type === 'page') {
                pages.push({
                  id: item.id,
                  title: item.title,
                  icon: item.icon || '📄',
                  section: section.title
                });
              }
            });
          }
        });
      }

      const pagesHTML = pages.map(page => `
        <div class="page-item" data-page-id="${page.id}">
          <div class="page-info">
            <div class="page-name">${page.icon} ${page.title}</div>
            <div class="page-section" style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${page.section}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = BaseModal.createModal('pageLinksModal', '📄 Liens de Pages', `
        <p>Cliquez sur une page pour copier son lien HTML dans le presse-papiers :</p>
        <div style="margin: 15px 0;">
          <input type="text" id="page-search-input" placeholder="🔍 Rechercher une page..." style="width: 100%; padding: 8px 12px; border: 2px solid var(--rule); border-radius: 8px; font-size: 14px;">
        </div>
        <div class="pages-grid" id="pages-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin: 20px 0; max-height: 400px; overflow-y: auto;">
          ${pagesHTML}
        </div>
      `);

      // Add search functionality
      const searchInput = modal.querySelector('#page-search-input');
      const pagesGrid = modal.querySelector('#pages-grid');
      const allPageItems = pagesGrid.querySelectorAll('.page-item');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          
          allPageItems.forEach(item => {
            const pageText = item.textContent.toLowerCase();
            const matches = pageText.includes(searchTerm);
            item.style.display = matches ? '' : 'none';
          });
        });
      }

      // Add event listeners
      modal.addEventListener('click', (e) => {
        const pageItem = e.target.closest('.page-item');
        if (pageItem) {
          const pageId = pageItem.dataset.pageId;
          const pageTitle = pageItem.querySelector('.page-name').textContent;
          
          // Create clickable page link
          const pageLink = `<a href="#/${pageId}" style="color: var(--accent); text-decoration: underline;">${pageTitle}</a>`;
          
          UIUtilities.copyToClipboard(pageLink);
          
          pageItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            BaseModal.closeModal(modal);
            pageItem.classList.remove('copied');
          }, 800);
        }
      });

      return modal;
    }
  };

})();