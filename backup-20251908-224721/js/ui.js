// ============================================================================
// JDR-BAB APPLICATION - UI MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // UI INTERACTIONS MODULE
  // ========================================
  JdrApp.modules.ui = {
    
    init() {
      console.log('🎨 Initializing UI...');
      
      // Set up search functionality
      this.setupSearch();
      
      // Set up modal handlers
      this.setupModals();
      
      // Set up content creation handlers
      this.setupContentCreation();
      
      // Set up resource tools
      this.setupResourceTools();
      
      // Set up responsive handlers
      this.setupResponsive();
    },

    setupSearch() {
      const searchInput = JdrApp.utils.dom.$('#search');
      const clearButton = JdrApp.utils.dom.$('#clear');
      
      if (searchInput) {
        // Search as you type
        JdrApp.utils.events.register('input', '#search', (e) => {
          this.performSearch(e.target.value);
        });
        
        // Enter key
        JdrApp.utils.events.register('keydown', '#search', (e) => {
          if (e.key === 'Enter') {
            this.performSearch(e.target.value);
          }
        });
      }
      
      if (clearButton) {
        JdrApp.utils.events.register('click', '#clear', () => {
          if (searchInput) {
            searchInput.value = '';
            this.performSearch('');
          }
        });
      }
    },

    performSearch(query) {
      const normalizedQuery = query.toLowerCase().trim();
      
      if (!normalizedQuery) {
        // Show all content
        JdrApp.utils.dom.$$('article, .toc a').forEach(el => {
          el.style.display = '';
        });
        return;
      }

      // Search in TOC
      JdrApp.utils.dom.$$('.toc a').forEach(link => {
        const text = link.textContent.toLowerCase();
        const isMatch = text.includes(normalizedQuery);
        link.style.display = isMatch ? '' : 'none';
        
        // Expand parent category if child matches
        if (isMatch) {
          const category = link.closest('.toc-category');
          if (category) {
            category.classList.remove('collapsed');
          }
        }
      });

      // Search in article content
      JdrApp.utils.dom.$$('article').forEach(article => {
        const text = article.textContent.toLowerCase();
        const isMatch = text.includes(normalizedQuery);
        
        if (isMatch) {
          // Highlight search terms
          this.highlightSearchTerms(article, normalizedQuery);
        }
      });
    },

    highlightSearchTerms(container, query) {
      // Simple highlighting implementation
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(query)) {
          textNodes.push(node);
        }
      }

      textNodes.forEach(textNode => {
        const regex = new RegExp(`(${query})`, 'gi');
        const content = textNode.textContent;
        
        if (regex.test(content)) {
          const highlightedContent = content.replace(regex, '<mark>$1</mark>');
          const wrapper = document.createElement('span');
          wrapper.innerHTML = highlightedContent;
          textNode.parentNode.replaceChild(wrapper, textNode);
        }
      });
    },

    setupModals() {
      // Generic modal close handler
      JdrApp.utils.events.register('click', '.modal-overlay, .modal-close', (e) => {
        const modal = e.target.closest('.modal') || document.querySelector('.modal.visible');
        if (modal) {
          this.closeModal(modal);
        }
      });

      // Prevent modal close when clicking inside modal content
      JdrApp.utils.events.register('click', '.modal-content', (e) => {
        e.stopPropagation();
      });

      // Escape key to close modals
      JdrApp.utils.events.register('keydown', 'body', (e) => {
        if (e.key === 'Escape') {
          const openModal = document.querySelector('.modal.visible');
          if (openModal) {
            this.closeModal(openModal);
          }
        }
      });
    },

    openModal(modalId) {
      const modal = JdrApp.utils.dom.$(`#${modalId}`);
      if (modal) {
        modal.classList.add('visible');
        modal.style.display = 'flex';
        
        // Focus first input if available
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
          firstInput.focus();
        }
      }
    },

    closeModal(modal) {
      if (modal) {
        modal.classList.remove('visible');
        modal.style.display = 'none';
        
        // Clear form if present
        const form = modal.querySelector('form');
        if (form) {
          form.reset();
        }
      }
    },

    setupContentCreation() {
      // Add spell handlers
      JdrApp.utils.events.register('click', '.spell-add', (e) => {
        const categoryName = e.target.dataset.categoryName;
        this.addNewSpell(categoryName);
      });

      // Delete spell handlers
      JdrApp.utils.events.register('click', '.spell-delete', (e) => {
        const categoryName = e.target.dataset.categoryName;
        const spellName = e.target.dataset.spellName;
        this.deleteSpell(categoryName, spellName);
      });

      // Add don handlers
      JdrApp.utils.events.register('click', '.don-add', (e) => {
        const categoryName = e.target.dataset.categoryName;
        this.addNewDon(categoryName);
      });

      // Delete don handlers
      JdrApp.utils.events.register('click', '.don-delete', (e) => {
        const categoryName = e.target.dataset.categoryName;
        const donName = e.target.dataset.donName;
        this.deleteDon(categoryName, donName);
      });

      // Move don handlers
      JdrApp.utils.events.register('click', '.don-move-up', (e) => {
        const categoryName = e.target.dataset.categoryName;
        const donName = e.target.dataset.donName;
        const index = parseInt(e.target.dataset.donIndex);
        this.moveDon(categoryName, donName, index, -1);
      });

      JdrApp.utils.events.register('click', '.don-move-down', (e) => {
        const categoryName = e.target.dataset.categoryName;
        const donName = e.target.dataset.donName;
        const index = parseInt(e.target.dataset.donIndex);
        this.moveDon(categoryName, donName, index, 1);
      });

      // Add paragraph handlers
      JdrApp.utils.events.register('click', '.add-paragraph-btn', (e) => {
        const target = e.target.dataset.target;
        this.addParagraph(target, e.target);
      });
    },

    addNewSpell(categoryName) {
      const category = JdrApp.utils.data.getSpellCategory(categoryName);
      if (!category) return;

      const newSpell = {
        nom: "Nouveau Sort",
        description: "Lance une boule de Feu sur un adversaire.",
        categorie: categoryName,
        prerequis: "📋 <strong>Prérequis:</strong> Niveau 1",
        portee: "🎯 <strong>Portée:</strong> 20m",
        tempsIncantation: "⏰ <strong>Temps d'incantation:</strong> 1 tour",
        coutMana: "⚡ <strong>Coût mana:</strong> 3",
        resistance: "<strong>Sans effet si:</strong> Esquive.",
        effetNormal: "<strong>Effet:</strong> Inflige 5 dégats de <span style=\"color: #e25822; font-weight: bold;\">Feu</span> à la cible.<br>&nbsp;Tous les 5 points d'intelligence, augmente les dégats de 1.",
        effetCritique: "<strong>Coup Critique:&nbsp;</strong>&nbsp;Double les dégâts et enflamme la cible, infligeant 2 dégats de Feu au prochain tour du lanceur.",
        effetEchec: "<strong>Échec Critique:&nbsp;</strong>Le sort inflige ses dégats à un allié dans la trajectoire."
      };

      category.sorts.push(newSpell);
      
      // Re-render the category page
      JdrApp.modules.renderer.renderSortCategory(`sorts-${JdrApp.utils.data.sanitizeId(categoryName)}`);
      
      this.showNotification('🔮 Nouveau sort ajouté');
    },

    deleteSpell(categoryName, spellName) {
      if (!confirm(`Supprimer le sort "${spellName}" ?`)) return;

      const category = JdrApp.utils.data.getSpellCategory(categoryName);
      if (!category) return;

      const index = category.sorts.findIndex(s => s.nom === spellName);
      if (index !== -1) {
        category.sorts.splice(index, 1);
        
        // Re-render the category page
        JdrApp.modules.renderer.renderSortCategory(`sorts-${JdrApp.utils.data.sanitizeId(categoryName)}`);
        
        this.showNotification('🗑 Sort supprimé');
      }
    },

    addNewDon(categoryName) {
      const category = JdrApp.utils.data.getDonCategory(categoryName);
      if (!category) return;

      const newDon = {
        nom: "Nouveau Don",
        description: "Description du don.",
        prerequis: "Aucun prérequis",
        cout: "1 point de don"
      };

      category.dons.push(newDon);
      
      // Re-render the category page
      JdrApp.modules.renderer.renderDonCategory(`dons-${JdrApp.utils.data.sanitizeId(categoryName)}`);
      
      this.showNotification('🎖️ Nouveau don ajouté');
    },

    deleteDon(categoryName, donName) {
      if (!confirm(`Supprimer le don "${donName}" ?`)) return;

      const category = JdrApp.utils.data.getDonCategory(categoryName);
      if (!category) return;

      const index = category.dons.findIndex(d => d.nom === donName);
      if (index !== -1) {
        category.dons.splice(index, 1);
        
        // Re-render the category page
        JdrApp.modules.renderer.renderDonCategory(`dons-${JdrApp.utils.data.sanitizeId(categoryName)}`);
        
        this.showNotification('🗑 Don supprimé');
      }
    },

    moveDon(categoryName, donName, currentIndex, direction) {
      const category = JdrApp.utils.data.getDonCategory(categoryName);
      if (!category) return;

      const newIndex = currentIndex + direction;
      if (newIndex < 0 || newIndex >= category.dons.length) return;

      // Swap positions
      const temp = category.dons[currentIndex];
      category.dons[currentIndex] = category.dons[newIndex];
      category.dons[newIndex] = temp;
      
      // Re-render the category page
      JdrApp.modules.renderer.renderDonCategory(`dons-${JdrApp.utils.data.sanitizeId(categoryName)}`);
      
      this.showNotification(`🔄 Don ${direction > 0 ? 'descendu' : 'monté'}`);
    },

    addParagraph(target, button) {
      const newParagraph = JdrApp.utils.dom.create('p', 'editable', 'Nouveau paragraphe.', {
        'data-edit-type': 'custom',
        'data-edit-section': target
      });
      
      button.parentNode.insertBefore(newParagraph, button);
      
      // Make it immediately editable
      if (JdrApp.modules.editor.isDevMode) {
        JdrApp.modules.editor.makeEditable(newParagraph);
      }
    },

    setupResourceTools() {
      // Elements button
      JdrApp.utils.events.register('click', '#elementsBtn', () => {
        this.showElementsModal();
      });

      // Icons button
      JdrApp.utils.events.register('click', '#showIcons', () => {
        this.showIconsModal();
      });
    },

    showElementsModal() {
      // Create elements modal if it doesn't exist
      let modal = JdrApp.utils.dom.$('#elementsModal');
      if (!modal) {
        modal = this.createElementsModal();
        document.body.appendChild(modal);
      }
      
      this.openModal('elementsModal');
    },

    createElementsModal() {
      const elements = [
        { name: 'Feu', color: '#ff6b35', icon: '🔥' },
        { name: 'Air', color: '#87ceeb', icon: '💨' },
        { name: 'Eau', color: '#4682b4', icon: '💧' },
        { name: 'Terre', color: '#8b7355', icon: '🌍' },
        { name: 'Divin', color: '#ffd700', icon: '✨' },
        { name: 'Maléfique', color: '#8b008b', icon: '💀' }
      ];

      const elementsHTML = elements.map(element => `
        <div class="element-item" data-element="${element.name}" data-color="${element.color}">
          <div class="element-icon" style="background: ${element.color};">${element.icon}</div>
          <div class="element-name">${element.name}</div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = JdrApp.utils.dom.create('div', 'modal elements-modal', `
        <div class="modal-content elements-modal-content">
          <h3>🎨 Éléments</h3>
          <p>Cliquez sur un élément pour copier sa balise HTML colorée.</p>
          <div class="elements-list">
            ${elementsHTML}
          </div>
          <button class="modal-close btn">Fermer</button>
        </div>
      `, { id: 'elementsModal' });

      // Add click handlers for elements
      modal.addEventListener('click', (e) => {
        const elementItem = e.target.closest('.element-item');
        if (elementItem) {
          const elementName = elementItem.dataset.element;
          const color = elementItem.dataset.color;
          const html = `<span style="color: ${color}; font-weight: bold;">${elementName}</span>`;
          
          this.copyToClipboard(html);
          
          // Show copied indicator
          elementItem.classList.add('copied');
          setTimeout(() => {
            elementItem.classList.remove('copied');
          }, 1000);
        }
      });

      return modal;
    },

    showIconsModal() {
      this.showNotification('🔥 Fonctionnalité des icônes à implémenter', 'info');
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('📋 Copié dans le presse-papiers', 'success');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        this.showNotification('📋 Copié dans le presse-papiers', 'success');
      });
    },

    setupResponsive() {
      // Menu toggle for mobile
      JdrApp.utils.events.register('click', '#menuToggle', () => {
        const sidebar = JdrApp.utils.dom.$('#sidebar');
        const backdrop = JdrApp.utils.dom.$('#backdrop');
        
        if (sidebar && backdrop) {
          sidebar.classList.toggle('mobile-open');
          backdrop.hidden = !sidebar.classList.contains('mobile-open');
        }
      });

      // Close sidebar when clicking backdrop
      JdrApp.utils.events.register('click', '#backdrop', () => {
        const sidebar = JdrApp.utils.dom.$('#sidebar');
        const backdrop = JdrApp.utils.dom.$('#backdrop');
        
        if (sidebar && backdrop) {
          sidebar.classList.remove('mobile-open');
          backdrop.hidden = true;
        }
      });
    },

    showNotification(message, type = 'info') {
      // Reuse the storage module's notification system
      if (JdrApp.modules.storage.showNotification) {
        JdrApp.modules.storage.showNotification(message, type);
      } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
    }
  };

})();