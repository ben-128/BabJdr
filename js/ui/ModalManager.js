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
      // Check if modal exists AND has content (not just an empty shell from static HTML)
      if (!modal || !modal.querySelector('.modal-content')) {
        if (modal) modal.remove(); // Remove empty shell
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
            let styleString = `color: ${elementConfig.color}; font-weight: ${elementConfig.weight || 'bold'};`;

            // Add background styles if defined (for Nuit, Divin, etc.)
            if (elementConfig.background) {
              styleString += ` background: ${elementConfig.background};`;
            }
            if (elementConfig.padding) {
              styleString += ` padding: ${elementConfig.padding};`;
            }
            if (elementConfig.borderRadius) {
              styleString += ` border-radius: ${elementConfig.borderRadius};`;
            }

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
      // Check if modal exists AND has content (not just an empty shell from static HTML)
      if (!modal || !modal.querySelector('.modal-content')) {
        if (modal) modal.remove(); // Remove empty shell
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
        { name: 'Force', icon: '<img src="https://i.ibb.co/23cGYFvZ/stat-Force.png" alt="Force" style="width: 48px; height: 48px; vertical-align: middle;">', description: 'Améliore les dégâts physiques' },
        { name: 'Endurance', icon: '<img src="https://i.ibb.co/67ZW01Q7/stat-Endurance.png" alt="Endurance" style="width: 48px; height: 48px; vertical-align: middle;">', description: 'Détermine les points de vie maximum' },
        { name: 'Agilité', icon: '<img src="https://i.ibb.co/Ng9TzjZL/stat-Agilit.png" alt="Agilité" style="width: 48px; height: 48px; vertical-align: middle;">', description: 'Améliore esquive, critique et initiative' },
        { name: 'Intelligence', icon: '<img src="https://i.ibb.co/9mcP0Y0Y/stat-Intelligence.png" alt="Intelligence" style="width: 48px; height: 48px; vertical-align: middle;">', description: 'Augmente la puissance des sorts' },
        { name: 'Volonté', icon: '<img src="https://i.ibb.co/B2BCGP6T/stat-Volont.png" alt="Volonté" style="width: 48px; height: 48px; vertical-align: middle;">', description: 'Détermine le mana maximum' },
        { name: 'Chance', icon: '<img src="https://i.ibb.co/HfthhzSF/stat-Chance.png" alt="Chance" style="width: 48px; height: 48px; vertical-align: middle;">', description: 'Améliore la fortune et les critiques' },
        { name: 'Initiative', icon: '⚡', description: 'Ordre des tours de combat' },
        { name: 'Fortune', icon: '🍀', description: 'Améliore les événements de chance' },
        { name: 'Vie', icon: '❤️', description: 'Points de vie actuels' },
        { name: 'Mana', icon: '🔵', description: 'Points de mana actuels' },
        { name: 'Armure', icon: '🛡️', description: 'Protection physique' },
        { name: 'Esquive', icon: '🏃', description: 'Éviter les attaques' },
        { name: 'Critique', icon: '⚡', description: 'Chances de coup critique' }
      ];

      // Store icons in a map for retrieval on click
      const iconsMap = {};
      statsIcons.forEach(stat => { iconsMap[stat.name] = stat.icon; });

      const statsHTML = statsIcons.map(stat => `
        <div class="stat-icon-item" data-stat-name="${stat.name}">
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
          const statName = statItem.dataset.statName;
          const statIcon = iconsMap[statName];

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
      // Check if modal exists AND has content (not just an empty shell from static HTML)
      if (!modal || !modal.querySelector('.modal-content')) {
        if (modal) modal.remove(); // Remove empty shell
        modal = this.createEtatsModal();
        document.body.appendChild(modal);
      } else if (!modal.dataset.eventsAttached) {
        // Modal exists from static HTML, attach event listeners
        this.attachEtatsModalEvents(modal);
      }

      BaseModal.openModal('etatsModal');
    },

    /**
     * Attach click events to etats modal
     */
    attachEtatsModalEvents(modal) {
      modal.dataset.eventsAttached = 'true';
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
      
      // Use CardBuilder for proper spell rendering with the actual category name
      const tempBuilder = CardBuilder.create('spell', foundSpell, actualCategoryName);
      tempBuilder.isPreview = true; // Force preview mode manually
      const spellCard = tempBuilder.build();
      
      // Create and show preview
      const preview = document.createElement('div');
      preview.className = 'spell-preview-tooltip';

      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'preview-close-btn';
      closeBtn.innerHTML = '&times;';
      closeBtn.title = 'Fermer';
      closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
      `;

      // Create card container
      const cardContainer = document.createElement('div');
      cardContainer.innerHTML = spellCard;

      // Add a style element to the document head (not to the preview) to avoid visible CSS
      let existingStyle = document.querySelector('#spell-preview-styles');
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'spell-preview-styles';
        style.textContent = `
          .spell-preview-tooltip .editable-field,
          .spell-preview-tooltip .editable-effect {
            display: block !important;
            margin: 0.5rem 0 !important;
            line-height: 1.4 !important;
            white-space: normal !important;
            word-wrap: break-word !important;
          }
          .spell-preview-tooltip img {
            max-width: 200px !important;
            height: auto !important;
            display: block !important;
            margin: 0.5rem auto !important;
          }
          .spell-preview-tooltip hr {
            margin: 1rem 0 !important;
            border: none !important;
            border-top: 1px solid var(--rule) !important;
          }
          .spell-preview-tooltip .element-icon {
            width: 20px !important;
            height: 20px !important;
          }
          .spell-preview-tooltip .element-badge {
            font-size: 0.85em !important;
            padding: 3px 10px !important;
          }
        `;
        document.head.appendChild(style);
      }

      // Add elements to preview
      preview.appendChild(closeBtn);
      preview.appendChild(cardContainer);

      // Force load lazy images in preview (they won't be observed by IntersectionObserver)
      setTimeout(() => {
        const images = preview.querySelectorAll('img.lazy-load[data-src]');
        images.forEach(img => {
          const dataSrc = img.getAttribute('data-src');
          if (dataSrc) {
            img.src = dataSrc;
            img.removeAttribute('data-src');
            img.classList.remove('lazy-load');
            img.style.display = 'block';
            img.style.maxWidth = '200px';
            img.style.height = 'auto';
            img.style.margin = '0.5rem auto';
          }
        });
      }, 50);
      
      // Style the preview container
      preview.style.cssText = `
        position: absolute;
        z-index: 2147483647;
        max-width: 450px;
        max-height: 600px;
        overflow-y: auto;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        border-radius: 8px;
        pointer-events: auto;
        background: var(--paper);
        border: 1px solid var(--rule);
        font-family: inherit;
        color: var(--text);
      `;
      
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
      
      // Add click handler for the close button
      closeBtn.addEventListener('click', () => {
        removePreview();
      });
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

      // Debug: Check what we're getting
      console.log('Monster card type:', typeof monsterCard);
      console.log('Monster card first 200 chars:', monsterCard.substring(0, 200));
      console.log('Contains < character:', monsterCard.includes('<'));
      console.log('Contains &lt;:', monsterCard.includes('&lt;'));

      // Add minimal styles for the preview tooltip - always recreate to get latest styles
      const existingStyle = document.getElementById('monster-preview-styles');
      if (existingStyle) existingStyle.remove();
      const styleElement = document.createElement('style');
      styleElement.id = 'monster-preview-styles';
        styleElement.textContent = `
          .monster-preview-tooltip {
            background: var(--paper) !important;
            position: fixed !important;
            z-index: 2147483647 !important;
            max-width: 450px !important;
            max-height: 700px !important;
            overflow-y: auto !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
            border-radius: 12px !important;
            border: 2px solid var(--rule) !important;
            padding: 1rem !important;
          }
          .monster-preview-tooltip .preview-close-btn {
            position: absolute !important;
            top: 5px !important;
            right: 5px !important;
            background: #dc2626 !important;
            color: white !important;
            border: 3px solid #ffffff !important;
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            cursor: pointer !important;
            font-size: 24px !important;
            font-weight: bold !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 1 !important;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.6) !important;
            transition: all 0.2s ease !important;
          }
          .monster-preview-tooltip .preview-close-btn:hover {
            background: #b91c1c !important;
            transform: scale(1.1) !important;
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.8) !important;
          }
          /* Force image to display above title with proper spacing */
          .monster-preview-tooltip .card h4 {
            clear: both !important;
            display: block !important;
            width: 100% !important;
            margin-bottom: 1rem !important;
          }
          .monster-preview-tooltip .card .illus {
            display: block !important;
            clear: both !important;
            width: 100% !important;
            text-align: center !important;
            margin: 0 auto 1.5rem !important;
          }
          .monster-preview-tooltip .card .illus img {
            display: block !important;
            margin: 0 auto !important;
          }
          /* Add spacing between sections */
          .monster-preview-tooltip .card > div:not(:first-child) {
            margin-top: 1rem !important;
          }
          .monster-preview-tooltip .card hr {
            margin: 1.5rem 0 !important;
          }
          /* Add spacing after tags/element section */
          .monster-preview-tooltip .card > div[style*="display: flex"] {
            margin-bottom: 1.5rem !important;
          }
          /* Add extra spacing after elemental armors section */
          .monster-preview-tooltip .card .monster-elemental-grid {
            margin-bottom: 2rem !important;
          }
          .monster-preview-tooltip .card div:has(.monster-elemental-grid) {
            margin-bottom: 2.5rem !important;
          }
          /* Target the div containing "Armures Élémentaires" text */
          .monster-preview-tooltip .card > div > strong:first-child {
            display: block !important;
            margin-bottom: 0.5rem !important;
          }
          /* Add spacing to the parent div that contains the elemental armors */
          .monster-preview-tooltip .card > div:has(strong:first-child) {
            margin-bottom: 2.5rem !important;
          }
          /* Increase margin of hr that comes after elemental armors */
          .monster-preview-tooltip .card .monster-elemental-grid + hr,
          .monster-preview-tooltip .card > div:has(.monster-elemental-grid) + hr {
            margin-top: 2rem !important;
            margin-bottom: 1.5rem !important;
          }
          /* Reduce element icons size in monster preview */
          .monster-preview-tooltip .element-icon {
            width: 30px !important;
            height: 30px !important;
          }
          /* Monster main element badge */
          .monster-preview-tooltip .monster-element-display img,
          .monster-preview-tooltip .element-badge img {
            width: 30px !important;
            height: 30px !important;
          }
          /* Armures élémentaires grid icons */
          .monster-preview-tooltip .monster-elemental-grid img {
            width: 30px !important;
            height: 30px !important;
          }
        `;
      document.head.appendChild(styleElement);

      // Create and show preview
      const preview = document.createElement('div');
      preview.className = 'monster-preview-tooltip';

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'preview-close-btn';
      closeBtn.title = 'Fermer';
      closeBtn.textContent = '×';
      preview.appendChild(closeBtn);

      // Decode HTML entities before using
      const decodeHTML = (html) => {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = html;
        return textarea.value;
      };

      // Decode the monster card HTML
      const decodedCard = decodeHTML(monsterCard);
      console.log('Decoded card first 200 chars:', decodedCard.substring(0, 200));

      // Add monster card - DIRECTLY set innerHTML with decoded HTML
      const cardContainer = document.createElement('div');
      cardContainer.innerHTML = decodedCard;

      console.log('Card container children:', cardContainer.children.length);
      console.log('Card container HTML preview:', cardContainer.innerHTML.substring(0, 100));

      // Move all children from card container to preview
      while (cardContainer.firstChild) {
        preview.appendChild(cardContainer.firstChild);
      }

      // Load lazy images BEFORE adding to document to avoid flicker
      const lazyImages = preview.querySelectorAll('img.lazy-load, img.thumb, img[data-src]');
      console.log('🖼️ Found lazy images in monster preview:', lazyImages.length);

      lazyImages.forEach(img => {
        const optimizedSrc = img.getAttribute('data-src') || img.src;
        console.log('  - Image optimized src:', optimizedSrc);

        if (optimizedSrc && optimizedSrc !== 'data:image/svg+xml' && !optimizedSrc.includes('svg+xml')) {
          img.src = optimizedSrc;
          img.style.display = 'inline-block';
          img.classList.remove('lazy-load');

          // Get original URL from image store using illus-key
          const illusKey = img.closest('[data-illus-key]')?.dataset.illusKey;
          let originalUrl = optimizedSrc;

          if (illusKey && window.JdrApp?.modules?.images?.getImageUrl) {
            const rawUrl = window.JdrApp.modules.images.getImageUrl(illusKey);
            if (rawUrl) {
              originalUrl = rawUrl;
              console.log('  - Found original URL from illus-key:', originalUrl);
            }
          }

          // Add click-to-enlarge functionality
          img.style.cursor = 'pointer';
          img.setAttribute('data-click-action', 'enlarge');
          img.removeAttribute('title'); // Remove title to avoid native tooltip

          // Use capture phase to intercept before any other handlers
          img.addEventListener('click', (e) => {
            console.log('🖱️ Image clicked in preview, opening modal with original URL:', originalUrl);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.showImageModal(originalUrl);
            return false;
          }, true);
        }
      });

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

      // Add to document - images already loaded
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
     * Show NPC preview tooltip
     */
    showNPCPreview(npcName, triggerElement, event) {
      if (!npcName) return;

      // Only remove existing NPC previews, not other types
      const existingPreview = document.querySelector('.npc-preview-tooltip');
      if (existingPreview) {
        existingPreview.remove();
      }

      // Find the NPC in the data
      let foundNPC = null;
      if (window.NPCS) {
        foundNPC = window.NPCS.find(n => n.nom === npcName);
      }

      if (!foundNPC) {
        this.showEtatPreview(npcName, 'NPC non trouvé', triggerElement);
        return;
      }

      // Use CardBuilder to create a full NPC card in preview mode
      const npcCard = CardBuilder.create('npc', foundNPC, 'preview').build();

      // Add minimal styles for the preview tooltip
      if (!document.getElementById('npc-preview-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'npc-preview-styles';
        styleElement.textContent = `
          .npc-preview-tooltip {
            background: var(--paper) !important;
            position: fixed !important;
            z-index: 2147483647 !important;
            max-width: 450px !important;
            max-height: 600px !important;
            overflow-y: auto !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
            border-radius: 12px !important;
            border: 2px solid var(--rule) !important;
            padding: 1rem !important;
          }
          .npc-preview-tooltip .preview-close-btn {
            position: absolute !important;
            top: 5px !important;
            right: 5px !important;
            background: #0891b2 !important;
            color: white !important;
            border: 3px solid #ffffff !important;
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            cursor: pointer !important;
            font-size: 24px !important;
            font-weight: bold !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 1 !important;
            box-shadow: 0 4px 12px rgba(8, 145, 178, 0.6) !important;
            transition: all 0.2s ease !important;
          }
          .npc-preview-tooltip .preview-close-btn:hover {
            background: #0e7490 !important;
            transform: scale(1.1) !important;
            box-shadow: 0 6px 16px rgba(8, 145, 178, 0.8) !important;
          }
          .npc-preview-tooltip .card h4 {
            clear: both !important;
            display: block !important;
            width: 100% !important;
            margin-bottom: 1rem !important;
          }
          .npc-preview-tooltip .card .illus {
            display: block !important;
            clear: both !important;
            width: 100% !important;
            text-align: center !important;
            margin: 0 auto 1.5rem !important;
          }
          .npc-preview-tooltip .card .illus img {
            display: block !important;
            margin: 0 auto !important;
          }
          .npc-preview-tooltip .card > div:not(:first-child) {
            margin-top: 1rem !important;
          }
          .npc-preview-tooltip .card hr {
            margin: 1.5rem 0 !important;
          }
        `;
        document.head.appendChild(styleElement);
      }

      // Create and show preview
      const preview = document.createElement('div');
      preview.className = 'npc-preview-tooltip';

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'preview-close-btn';
      closeBtn.title = 'Fermer';
      closeBtn.textContent = '×';
      preview.appendChild(closeBtn);

      // Decode HTML entities before using
      const decodeHTML = (html) => {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = html;
        return textarea.value;
      };

      // Decode the NPC card HTML
      const decodedCard = decodeHTML(npcCard);
      console.log('📋 Decoded NPC card HTML (first 500 chars):', decodedCard.substring(0, 500));

      // Add NPC card - DIRECTLY set innerHTML with decoded HTML
      const cardContainer = document.createElement('div');
      cardContainer.innerHTML = decodedCard;

      // Move all children from card container to preview
      while (cardContainer.firstChild) {
        preview.appendChild(cardContainer.firstChild);
      }

      // Load lazy images BEFORE adding to document to avoid flicker
      const allImages = preview.querySelectorAll('img');
      const lazyImages = preview.querySelectorAll('img.lazy-load, img.thumb, img[data-src]');
      console.log('🖼️ Total images in NPC preview:', allImages.length);
      console.log('🖼️ Lazy-load images in NPC preview:', lazyImages.length);

      allImages.forEach((img, idx) => {
        console.log(`  Image ${idx}:`, {
          classes: img.className,
          src: img.src,
          dataSrc: img.getAttribute('data-src'),
          style: img.style.cssText
        });
      });

      lazyImages.forEach(img => {
        const optimizedSrc = img.getAttribute('data-src') || img.src;
        console.log('  - Processing NPC Image optimized src:', optimizedSrc);

        if (optimizedSrc && optimizedSrc !== 'data:image/svg+xml' && !optimizedSrc.includes('svg+xml')) {
          img.src = optimizedSrc;
          img.style.display = 'inline-block';
          img.classList.remove('lazy-load');

          // Get original URL from image store using illus-key
          const illusKey = img.closest('[data-illus-key]')?.dataset.illusKey;
          let originalUrl = optimizedSrc;

          if (illusKey && window.JdrApp?.modules?.images?.getImageUrl) {
            const rawUrl = window.JdrApp.modules.images.getImageUrl(illusKey);
            if (rawUrl) {
              originalUrl = rawUrl;
              console.log('  - Found original URL from illus-key:', originalUrl);
            }
          }

          // Add click-to-enlarge functionality
          img.style.cursor = 'pointer';
          img.setAttribute('data-click-action', 'enlarge');
          img.removeAttribute('title'); // Remove title to avoid native tooltip

          // Use capture phase to intercept before any other handlers
          img.addEventListener('click', (e) => {
            console.log('🖱️ NPC Image clicked in preview, opening modal with original URL:', originalUrl);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.showImageModal(originalUrl);
            return false;
          }, true);
        }
      });

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

      // Add to document - images already loaded
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
     * Show enlarged image modal
     */
    showImageModal(imageUrl) {
      console.log('🖼️ showImageModal called with URL:', imageUrl);

      // Remove any existing image modal
      const existingModal = document.querySelector('.image-enlarge-modal');
      if (existingModal) {
        console.log('  - Removing existing modal');
        existingModal.remove();
      }

      // Create modal overlay
      const modal = document.createElement('div');
      modal.className = 'image-enlarge-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `;

      // Create image container
      const imgContainer = document.createElement('div');
      imgContainer.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        position: relative;
      `;

      // Create the image
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.cssText = `
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
        display: block;
      `;

      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #dc2626;
        color: white;
        border: 3px solid white;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 32px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        z-index: 1;
      `;

      imgContainer.appendChild(img);
      imgContainer.appendChild(closeBtn);
      modal.appendChild(imgContainer);
      document.body.appendChild(modal);

      // Close on click
      const closeModal = () => {
        modal.remove();
      };

      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target === closeBtn) {
          closeModal();
        }
      });

      closeBtn.addEventListener('click', closeModal);

      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
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

      // Add event listeners using shared function
      this.attachEtatsModalEvents(modal);

      return modal;
    },

    /**
     * Show spell links modal
     */
    showSpellLinksModal() {
      let modal = JdrApp.utils.dom.$('#spellLinksModal');
      // Check if modal exists AND has content (not just an empty shell from static HTML)
      if (!modal || !modal.querySelector('.modal-content')) {
        if (modal) modal.remove(); // Remove empty shell
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
      // Check if modal exists AND has content (not just an empty shell from static HTML)
      if (!modal || !modal.querySelector('.modal-content')) {
        if (modal) modal.remove(); // Remove empty shell
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
     * Show object links modal
     */
    showObjetLinksModal() {
      let modal = JdrApp.utils.dom.$('#objetLinksModal');
      // Check if modal exists AND has content (not just an empty shell from static HTML)
      if (!modal || !modal.querySelector('.modal-content')) {
        if (modal) modal.remove(); // Remove empty shell
        modal = this.createObjetLinksModal();
        document.body.appendChild(modal);
      }

      BaseModal.openModal('objetLinksModal');
    },

    /**
     * Create object links modal
     */
    createObjetLinksModal() {
      // Extract objects from data
      let objets = [];
      if (window.OBJETS?.objets && Array.isArray(window.OBJETS.objets)) {
        objets = window.OBJETS.objets.map(objet => ({
          name: objet.nom,
          image: objet.image || '',
          tags: objet.tags || [],
          description: objet.description || '',
          prix: objet.prix || ''
        }));
      }

      const objetsHTML = objets.map(objet => `
        <div class="objet-item" data-objet-name="${objet.name}">
          <div class="objet-info">
            <div class="objet-name" style="color: var(--accent); font-weight: bold;">${objet.name}</div>
            <span data-objet-meta style="font-size: 12px; margin-bottom: 6px; display: block; color: var(--bronze);">${objet.tags.join(', ')}</span>
            <div class="objet-description" style="font-size: 12px; color: var(--text);">${UIUtilities.stripHtml(objet.description).length > 60 ? UIUtilities.stripHtml(objet.description).substring(0, 60) + '...' : UIUtilities.stripHtml(objet.description)}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = BaseModal.createModal('objetLinksModal', '🎒 Liens d\'Objets', `
        <p>Cliquez sur un objet pour copier son lien HTML dans le presse-papiers :</p>
        <div style="margin: 15px 0;">
          <input type="text" id="objet-search-input" placeholder="🔍 Rechercher un objet..." style="width: 100%; padding: 8px 12px; border: 2px solid var(--rule); border-radius: 8px; font-size: 14px;">
        </div>
        <div class="objets-grid" id="objets-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin: 20px 0; max-height: 400px; overflow-y: auto;">
          ${objetsHTML}
        </div>
      `);

      // Add search functionality
      const searchInput = modal.querySelector('#objet-search-input');
      const objetsGrid = modal.querySelector('#objets-grid');
      const allObjetItems = objetsGrid.querySelectorAll('.objet-item');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();

          allObjetItems.forEach(item => {
            const objetName = item.dataset.objetName.toLowerCase();
            const objetText = item.textContent.toLowerCase();

            const matches = objetName.includes(searchTerm) ||
                          objetText.includes(searchTerm);

            item.style.display = matches ? '' : 'none';
          });
        });
      }

      // Add event listeners
      modal.addEventListener('click', (e) => {
        const objetItem = e.target.closest('.objet-item');
        if (objetItem) {
          const objetName = objetItem.dataset.objetName;

          // Create clickable object link
          const objetLink = `<span class="objet-link" data-objet="${objetName}" style="color: var(--accent); cursor: pointer; text-decoration: underline;">${objetName}</span>`;

          UIUtilities.copyToClipboard(objetLink);

          objetItem.classList.add('copied');

          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            BaseModal.closeModal(modal);
            objetItem.classList.remove('copied');
          }, 800);
        }
      });

      return modal;
    },

    /**
     * Show object preview tooltip
     */
    showObjetPreview(objetName, triggerElement, event) {
      if (!objetName) return;

      // Only remove existing object previews, not other types
      const existingPreview = document.querySelector('.objet-preview-tooltip');
      if (existingPreview) {
        existingPreview.remove();
      }

      // Find the object in the data
      const objet = window.OBJETS?.objets?.find(o => o.nom === objetName);
      if (!objet) {
        console.warn('Object not found:', objetName);
        return;
      }

      // Build object card HTML using CardBuilder if available
      let objetCard;
      if (window.CardBuilder) {
        const tempBuilder = new CardBuilder('objet', objet, 'preview', 0);
        tempBuilder.isPreview = true;
        objetCard = tempBuilder.build();
      } else {
        // Fallback simple card
        objetCard = `
          <div class="card" style="padding: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent);">${objet.nom}</h4>
            ${objet.image ? `<img src="${objet.image}" alt="${objet.nom}" style="max-width: 150px; display: block; margin: 0.5rem auto;">` : ''}
            <div style="font-style: italic; margin: 0.5rem 0;">${objet.description || ''}</div>
            <div style="margin: 0.5rem 0;">${objet.effet || ''}</div>
            <div style="display: flex; gap: 1rem; font-size: 0.9em;">
              <span>${objet.prix || ''}</span>
              <span>${objet.poids || ''}</span>
            </div>
          </div>
        `;
      }

      // Add styles for the preview tooltip
      const existingStyle = document.getElementById('objet-preview-styles');
      if (existingStyle) existingStyle.remove();
      const styleElement = document.createElement('style');
      styleElement.id = 'objet-preview-styles';
      styleElement.textContent = `
        .objet-preview-tooltip {
          background: var(--paper) !important;
          position: fixed !important;
          z-index: 2147483647 !important;
          max-width: 400px !important;
          max-height: 600px !important;
          overflow-y: auto !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
          border-radius: 12px !important;
          border: 2px solid var(--rule) !important;
          padding: 1rem !important;
        }
        .objet-preview-tooltip .preview-close-btn {
          position: absolute !important;
          top: 5px !important;
          right: 5px !important;
          background: #dc2626 !important;
          color: white !important;
          border: 2px solid white !important;
          border-radius: 50% !important;
          width: 32px !important;
          height: 32px !important;
          font-size: 20px !important;
          font-weight: bold !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 1 !important;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.6) !important;
        }
        .objet-preview-tooltip .preview-close-btn:hover {
          background: #b91c1c !important;
          transform: scale(1.1) !important;
        }
        .objet-preview-tooltip img {
          max-width: 200px !important;
          height: auto !important;
          display: block !important;
          margin: 0.5rem auto !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Create and show preview
      const preview = document.createElement('div');
      preview.className = 'objet-preview-tooltip';

      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'preview-close-btn';
      closeBtn.innerHTML = '&times;';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        removePreview();
      };
      preview.appendChild(closeBtn);

      // Add the card content
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = objetCard;
      preview.appendChild(contentDiv);

      document.body.appendChild(preview);

      // Position the preview
      const rect = triggerElement.getBoundingClientRect();
      const previewRect = preview.getBoundingClientRect();

      let left = rect.right + 10;
      let top = rect.top;

      // Adjust if goes off screen
      if (left + previewRect.width > window.innerWidth - 20) {
        left = rect.left - previewRect.width - 10;
      }
      if (top + previewRect.height > window.innerHeight - 20) {
        top = window.innerHeight - previewRect.height - 20;
      }
      if (top < 20) top = 20;
      if (left < 20) left = 20;

      preview.style.left = left + 'px';
      preview.style.top = top + 'px';

      // Cleanup function
      const removePreview = () => {
        preview.remove();
        document.removeEventListener('click', clickOutsideHandler);
        document.removeEventListener('keydown', escapeHandler);
      };

      // Close on click outside
      const clickOutsideHandler = (e) => {
        if (!preview.contains(e.target) && !triggerElement.contains(e.target)) {
          removePreview();
        }
      };

      // Close on Escape
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          removePreview();
        }
      };

      setTimeout(() => {
        document.addEventListener('click', clickOutsideHandler);
        document.addEventListener('keydown', escapeHandler);
      }, 100);
    },

    /**
     * Show page links modal
     */
    showPageLinksModal() {
      let modal = JdrApp.utils.dom.$('#pageLinksModal');
      // Check if modal exists AND has content (not just an empty shell from static HTML)
      if (!modal || !modal.querySelector('.modal-content')) {
        if (modal) modal.remove(); // Remove empty shell
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
    },

    /**
     * Show cartes du destin modal
     */
    showCartesDestinModal() {
      // Utiliser querySelector directement pour éviter les problèmes de NodeList
      let modal = document.querySelector('#cartesDestinModal');

      // Check if modal exists AND has content (not just an empty shell from static HTML)
      if (!modal || !modal.classList || !modal.querySelector('.modal-content')) {
        if (modal) modal.remove(); // Remove empty shell
        modal = this.createCartesDestinModal();
        if (!modal) {
          console.error('Impossible de créer le modal des cartes du destin');
          return;
        }
        document.body.appendChild(modal);
      }

      BaseModal.openModal(modal);
    },

    /**
     * Create cartes du destin modal
     */
    createCartesDestinModal() {
      // Récupérer les données depuis le JSON de la page création
      const creationData = window.STATIC_PAGES?.creation?.cartesDestin;

      if (!creationData) {
        console.error('Données des cartes du destin non trouvées');
        return null;
      }

      // Construire la liste des cartes
      const cartesListHTML = creationData.cartes
        .map(carte => `<li>${carte}</li>`)
        .join('\n          ');

      // Get image URL from images store if available
      const imageUrl = window.JdrApp?.modules?.images?.getImageUrl('other:CartesDestin') || 'data/images/Autre/CartesDestin.png';

      const cartesContent = `
        <div style="position: relative; min-height: 400px; border-radius: 12px; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(218, 165, 32, 0.1)); pointer-events: none;"></div>
          <div style="position: relative; z-index: 1; padding: 1.5rem;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <img src="${imageUrl}" alt="Cartes du Destin" style="max-width: 350px; width: 100%; height: auto; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); border: 3px solid rgba(218, 165, 32, 0.3);" onerror="this.style.display='none'">
            </div>
            <p style="margin-bottom: 1.5rem; font-size: 1.15em; text-align: center; font-weight: 500; color: var(--ink); line-height: 1.6;">${creationData.introduction}</p>
            <ol style="padding: 1.5rem 1.5rem 1.5rem 2.5rem; line-height: 2.2; font-size: 1.05em; background: rgba(40, 40, 70, 0.95); color: #e8e8e8; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid var(--ui-border, #c0c0d0); list-style-position: outside;">
              ${cartesListHTML}
            </ol>
          </div>
        </div>
      `;

      const modal = BaseModal.createModal('cartesDestinModal', creationData.titre, cartesContent);

      // Add custom styles for this modal
      if (!document.getElementById('cartes-destin-modal-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'cartes-destin-modal-styles';
        styleElement.textContent = `
          #cartesDestinModal .modal-content {
            max-width: 750px !important;
            max-height: 90vh !important;
            background: var(--paper) !important;
            border-radius: 16px !important;
            overflow: hidden;
            box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important;
            display: flex !important;
            flex-direction: column !important;
          }
          #cartesDestinModal .modal-header {
            background: linear-gradient(135deg, #8b4513, #daa520) !important;
            color: white !important;
            text-shadow: 0 2px 6px rgba(0,0,0,0.4) !important;
            padding: 1.5rem !important;
            border-radius: 16px 16px 0 0 !important;
            font-size: 1.3em;
            text-align: center;
          }
          #cartesDestinModal .modal-header h3 {
            margin: 0;
            font-weight: 700;
          }
          #cartesDestinModal .modal-body {
            padding: 0 !important;
            border-radius: 0 0 16px 16px !important;
            overflow-y: auto !important;
            flex: 1 !important;
          }
          #cartesDestinModal ol {
            list-style-position: outside;
            list-style-type: decimal;
          }
          #cartesDestinModal ol li {
            margin-bottom: 1rem;
            padding: 0.5rem 0.8rem;
            border-radius: 8px;
            transition: all 0.2s ease;
            position: relative;
          }
          #cartesDestinModal ol li:hover {
            background: rgba(218, 165, 32, 0.15);
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(139, 69, 19, 0.1);
          }
          #cartesDestinModal .modal-close {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #8b4513 !important;
            font-weight: bold;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: all 0.2s ease;
          }
          #cartesDestinModal .modal-close:hover {
            background: white !important;
            transform: rotate(90deg) scale(1.1);
          }
        `;
        document.head.appendChild(styleElement);
      }

      return modal;
    },

    /**
     * Show image insert modal
     */
    showImageInsertModal(insertCallback) {
      let modal = JdrApp.utils.dom.$('#imageInsertModal');
      if (modal) {
        modal.remove();
      }
      modal = this.createImageInsertModal(insertCallback);
      document.body.appendChild(modal);
      BaseModal.openModal('imageInsertModal');
    },

    /**
     * Create image insert modal
     */
    createImageInsertModal(insertCallback) {
      const modal = BaseModal.createModal('imageInsertModal', '📷 Insérer une Image', `
        <div style="padding: 10px 0;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600;">URL de l'image :</label>
            <input type="text" id="imageUrlInput" placeholder="https://exemple.com/image.png"
              style="width: 100%; padding: 8px 10px; border: 2px solid var(--rule); border-radius: 6px; font-size: 14px;">
          </div>

          <div style="text-align: center; margin: 12px 0; color: var(--paper-muted);">— ou —</div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600;">Uploader une image :</label>
            <div id="imageDropZone" style="border: 2px dashed var(--rule); border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s;">
              <div style="font-size: 2rem; margin-bottom: 8px;">📤</div>
              <p style="margin: 0; color: var(--paper-muted);">Cliquez ou glissez une image ici</p>
              <input type="file" id="imageFileInput" accept="image/*" style="display: none;">
            </div>
          </div>

          <div id="imagePreviewContainer" style="display: none; margin-bottom: 15px; text-align: center;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600;">Aperçu :</label>
            <img id="imagePreview" style="max-width: 100%; max-height: 200px; border-radius: 6px; border: 2px solid var(--rule);">
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600;">Taille (optionnel) :</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input type="number" id="imageWidth" placeholder="Largeur" style="flex: 1; padding: 8px; border: 2px solid var(--rule); border-radius: 6px;">
              <span>×</span>
              <input type="number" id="imageHeight" placeholder="Hauteur" style="flex: 1; padding: 8px; border: 2px solid var(--rule); border-radius: 6px;">
              <span style="color: var(--paper-muted);">px</span>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 600;">Style d'affichage :</label>
            <select id="imageStyle" style="width: 100%; padding: 8px; border: 2px solid var(--rule); border-radius: 6px;">
              <option value="block">Bloc (centré)</option>
              <option value="inline">En ligne avec le texte</option>
              <option value="float-left">Flottant à gauche</option>
              <option value="float-right">Flottant à droite</option>
            </select>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelImageInsert" class="btn" style="background: #6b7280; color: white; padding: 8px 16px;">Annuler</button>
            <button id="confirmImageInsert" class="btn" style="background: var(--accent); color: white; padding: 8px 16px;">✓ Insérer</button>
          </div>
        </div>
      `);

      const urlInput = modal.querySelector('#imageUrlInput');
      const fileInput = modal.querySelector('#imageFileInput');
      const dropZone = modal.querySelector('#imageDropZone');
      const previewContainer = modal.querySelector('#imagePreviewContainer');
      const previewImg = modal.querySelector('#imagePreview');
      const widthInput = modal.querySelector('#imageWidth');
      const heightInput = modal.querySelector('#imageHeight');
      const styleSelect = modal.querySelector('#imageStyle');
      const cancelBtn = modal.querySelector('#cancelImageInsert');
      const confirmBtn = modal.querySelector('#confirmImageInsert');

      let currentImageUrl = '';
      let isUploadedToImgbb = false; // Track if image was uploaded to imgbb

      // Show preview
      const showPreview = (url, wasUploaded = false) => {
        currentImageUrl = url;
        isUploadedToImgbb = wasUploaded;
        previewImg.src = url;
        previewContainer.style.display = 'block';
      };

      // URL input change
      urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          showPreview(url, false);
        } else {
          previewContainer.style.display = 'none';
          currentImageUrl = '';
          isUploadedToImgbb = false;
        }
      });

      // Drop zone click
      dropZone.addEventListener('click', () => fileInput.click());

      // Drag and drop
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent)';
        dropZone.style.background = 'rgba(var(--accent-rgb), 0.1)';
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--rule)';
        dropZone.style.background = 'transparent';
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--rule)';
        dropZone.style.background = 'transparent';

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          handleFile(file);
        }
      });

      // File input change
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          handleFile(file);
        }
      });

      // Handle file - upload to imgbb (never store base64)
      const handleFile = async (file) => {
        // Show loading state
        dropZone.innerHTML = '<p>⏳ Upload en cours...</p>';
        dropZone.style.pointerEvents = 'none';

        try {
          // Upload to imgbb with compression (max 500KB)
          const imageUrl = await JdrApp.utils.uploadToImageBB(file);
          showPreview(imageUrl, true);
          urlInput.value = '';

          if (JdrApp?.modules?.ui?.showNotification) {
            JdrApp.modules.ui.showNotification('✓ Image uploadée sur imgbb', 'success');
          }
        } catch (error) {
          console.error('[ModalManager] Image upload failed:', error);
          alert('Erreur upload: ' + error.message);
        } finally {
          // Restore drop zone
          dropZone.innerHTML = '<p>Glissez une image ici ou cliquez pour sélectionner</p>';
          dropZone.style.pointerEvents = 'auto';
        }
      };

      // Cancel button
      cancelBtn.addEventListener('click', () => {
        BaseModal.closeModal(modal);
      });

      // Confirm button
      confirmBtn.addEventListener('click', () => {
        if (!currentImageUrl) {
          alert('Veuillez entrer une URL ou sélectionner une image.');
          return;
        }

        const width = widthInput.value;
        const height = heightInput.value;
        const style = styleSelect.value;

        // Si c'est un fichier uploadé sur imgbb, utiliser le système de marqueur
        if (isUploadedToImgbb) {
          // Générer un ID unique
          const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

          // Stocker dans STATIC_PAGES.campagne.images
          if (!window.STATIC_PAGES) window.STATIC_PAGES = {};
          if (!window.STATIC_PAGES.campagne) window.STATIC_PAGES.campagne = {};
          if (!window.STATIC_PAGES.campagne.images) window.STATIC_PAGES.campagne.images = {};

          // Stocker l'URL imgbb (jamais de base64!)
          window.STATIC_PAGES.campagne.images[imageId] = {
            url: currentImageUrl,  // URL imgbb, pas base64
            width: width || null,
            height: height || null,
            style: style
          };

          // Sauvegarder dans le storage
          if (window.EventBus && window.Events) {
            window.EventBus.emit(window.Events.STORAGE_SAVE);
          }

          // Créer le marqueur court
          const imageMarker = `[img:${imageId}]`;

          // Insérer le marqueur
          if (insertCallback) {
            insertCallback(imageMarker);
          } else if (window.editorInsertTextAtCursor) {
            window.editorInsertTextAtCursor(imageMarker);
          }

          if (JdrApp?.modules?.ui?.showNotification) {
            JdrApp.modules.ui.showNotification('🖼️ Image insérée !', 'success');
          }
        } else {
          // URL externe - insérer directement le HTML
          let imgHtml = '<img src="' + currentImageUrl + '"';

          if (width) imgHtml += ' width="' + width + '"';
          if (height) imgHtml += ' height="' + height + '"';

          let styleAttr = '';
          switch (style) {
            case 'block':
              styleAttr = 'display: block; margin: 1rem auto; max-width: 100%; min-width: 200px;';
              break;
            case 'float-left':
              styleAttr = 'float: left; margin: 0 1rem 1rem 0; max-width: 50%; min-width: 150px;';
              break;
            case 'float-right':
              styleAttr = 'float: right; margin: 0 0 1rem 1rem; max-width: 50%; min-width: 150px;';
              break;
            case 'inline':
            default:
              styleAttr = 'vertical-align: middle; max-height: 150px;';
              break;
          }

          imgHtml += ' style="' + styleAttr + '"';
          imgHtml += ' alt="Image">';

          if (insertCallback) {
            insertCallback(imgHtml);
          } else if (window.editorInsertTextAtCursor) {
            window.editorInsertTextAtCursor(imgHtml);
          }
        }

        BaseModal.closeModal(modal);
      });

      return modal;
    },

    /**
     * Expand image markers [img:id] to actual HTML
     */
    expandImageMarkers(html) {
      if (!html || typeof html !== 'string') return html;

      return html.replace(/\[img:(img_[^\]]+)\]/g, (match, imageId) => {
        const imageData = window.STATIC_PAGES?.campagne?.images?.[imageId];

        if (!imageData) {
          console.warn('Image not found:', imageId);
          return match; // Retourner le marqueur tel quel si image non trouvée
        }

        // Support both 'url' (new imgbb URLs) and 'dataUrl' (legacy base64)
        const imageSrc = imageData.url || imageData.dataUrl;
        let imgHtml = '<img src="' + imageSrc + '"';

        if (imageData.width) imgHtml += ' width="' + imageData.width + '"';
        if (imageData.height) imgHtml += ' height="' + imageData.height + '"';

        let styleAttr = '';
        switch (imageData.style) {
          case 'block':
            styleAttr = 'display: block; margin: 1rem auto; max-width: 100%; min-width: 200px;';
            break;
          case 'float-left':
            styleAttr = 'float: left; margin: 0 1rem 1rem 0; max-width: 50%; min-width: 150px;';
            break;
          case 'float-right':
            styleAttr = 'float: right; margin: 0 0 1rem 1rem; max-width: 50%; min-width: 150px;';
            break;
          case 'inline':
          default:
            styleAttr = 'vertical-align: middle; max-height: 150px;';
            break;
        }

        imgHtml += ' style="' + styleAttr + '"';
        imgHtml += ' alt="Image">';

        return imgHtml;
      });
    }
  };

})();