// ============================================================================
// JDR-BAB APPLICATION - TABLES DE TRESORS MANAGER
// ============================================================================

(() => {
  "use strict";

  class TablesTresorsManager {
    constructor() {
      this.initialized = false;
      this.currentPreviewModal = null;
      this.currentEditModal = null;
      this.modalIsOpening = false;
    }

    static getInstance() {
      if (!TablesTresorsManager.instance) {
        TablesTresorsManager.instance = new TablesTresorsManager();
      }
      return TablesTresorsManager.instance;
    }

    init() {
      if (this.initialized) return;
      
      this.setupEventListeners();
      this.initialized = true;
      // TablesTresorsManager initialized
    }

    setupEventListeners() {
      // Preview d'objets
      document.addEventListener('click', (e) => {
        if (e.target.matches('.object-preview-link')) {
          e.preventDefault();
          e.stopPropagation();
          const numeroObjet = e.target.dataset.objectNumero;
          this.showObjectPreview(numeroObjet);
        }
      });

      // Édition de fourchette
      document.addEventListener('click', (e) => {
        if (e.target.matches('.edit-fourchette-btn')) {
          const tableName = e.target.dataset.tableName;
          const fourchetteIndex = parseInt(e.target.dataset.fourchetteIndex);
          this.showEditFourchetteModal(tableName, fourchetteIndex);
        }
      });

      // Suppression de fourchette
      document.addEventListener('click', (e) => {
        if (e.target.matches('.delete-fourchette-btn')) {
          const tableName = e.target.dataset.tableName;
          const fourchetteIndex = parseInt(e.target.dataset.fourchetteIndex);
          this.deleteFourchette(tableName, fourchetteIndex);
        }
      });

      // Ajout de nouvelle fourchette
      document.addEventListener('click', (e) => {
        if (e.target.matches('.table-tresor-add-fourchette')) {
          const tableName = e.target.dataset.tableTresorName;
          this.showEditFourchetteModal(tableName, -1); // -1 pour nouvelle fourchette
        }
      });

      // Fermer les modals en cliquant à l'extérieur
      document.addEventListener('click', (e) => {
        if (e.target.matches('.modal-overlay')) {
          this.closeAllModals();
        }
      });

      // Fermer avec la touche Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
      });

      // Preview de table de trésor via lien HTML
      document.addEventListener('click', (e) => {
        if (e.target.matches('.treasure-table-link')) {
          e.preventDefault();
          const tableName = e.target.dataset.tableName;
          this.showTablePreview(tableName);
        }
      });
    }

    showObjectPreview(numeroObjet) {
      try {
        // Trouver l'objet par son numéro
        const objet = window.OBJETS?.objets?.find(obj => obj.numero == numeroObjet);
        
        if (!objet) {
          console.error('Objet non trouvé:', numeroObjet);
          return;
        }

        const previewHtml = this.generateObjectPreviewHtml(objet);
        this.showModal(previewHtml, 'object-preview');
        
      } catch (error) {
        console.error('Erreur lors de l\'affichage de la preview:', error);
      }
    }

    showTablePreview(tableName) {
      try {
        // Trouver la table par son nom
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        
        if (!table) {
          console.error('Table non trouvée:', tableName);
          return;
        }

        const previewHtml = this.generateTablePreviewHtml(table);
        const modalContent = `
          <div class="table-preview-content">
            ${previewHtml}
            <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--rule);">
              <button class="btn" onclick="window.TablesTresorsManager.closeAllModals()" style="background: var(--accent); color: white;">
                ✓ Fermer
              </button>
              <button class="btn" onclick="window.TablesTresorsManager.goToTablesTresorsPage()" style="background: var(--bronze); color: white; margin-left: 0.5rem;">
                🔗 Aller à la page tables de trésors
              </button>
            </div>
          </div>
        `;
        
        this.showModal(modalContent, 'table-preview');
        
      } catch (error) {
        console.error('Erreur lors de l\'affichage de la preview de table:', error);
      }
    }

    generateObjectPreviewHtml(objet) {
      // Utiliser le CardBuilder pour générer la card d'objet standard
      const cardHtml = CardBuilder.create('objet', objet, 'preview').build();
      
      // Wrapper la card dans un conteneur de preview avec les boutons
      return `
        <div class="object-preview-content">
          <div style="margin-bottom: 1.5rem;">
            ${cardHtml}
          </div>
          
          <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--rule);">
            <button class="btn" onclick="window.TablesTresorsManager.closeAllModals()" style="background: var(--accent); color: white;">
              ✓ Fermer
            </button>
            <button class="btn" onclick="window.TablesTresorsManager.goToObject(${objet.numero})" style="background: var(--bronze); color: white; margin-left: 0.5rem;">
              🔗 Aller à la page objets
            </button>
          </div>
        </div>
      `;
    }

    showEditFourchetteModal(tableName, fourchetteIndex) {
      try {
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        if (!table) {
          console.error('Table non trouvée:', tableName);
          return;
        }

        const isNewFourchette = fourchetteIndex === -1;
        const fourchette = isNewFourchette ? { min: 1, max: 1, objet: { type: 'reference', numero: 1, nom: 'Choisir un objet' } } : table.fourchettes[fourchetteIndex];

        if (!isNewFourchette && !fourchette) {
          console.error('Fourchette non trouvée:', fourchetteIndex);
          return;
        }

        const editHtml = this.generateEditFourchetteHtml(tableName, fourchetteIndex, fourchette, isNewFourchette);
        this.showModal(editHtml, 'edit-fourchette');

      } catch (error) {
        console.error('Erreur lors de l\'affichage du modal d\'édition:', error);
      }
    }

    generateEditFourchetteHtml(tableName, fourchetteIndex, fourchette, isNewFourchette) {
      // Générer la liste des tags uniques
      const allTags = new Set();
      window.OBJETS?.objets?.forEach(obj => {
        obj.tags?.forEach(tag => allTags.add(tag));
      });
      const sortedTags = Array.from(allTags).sort();
      
      const tagOptions = ['<option value="">Tous les objets</option>']
        .concat(sortedTags.map(tag => `<option value="${tag}">${tag}</option>`))
        .join('');

      // Générer la liste des objets disponibles
      const objetsOptions = window.OBJETS?.objets?.map(obj => 
        `<option value="${obj.numero}" data-tags="${obj.tags?.join(',') || ''}" ${obj.numero == fourchette.objet.numero ? 'selected' : ''}>N°${obj.numero} - ${obj.nom}</option>`
      ).join('') || '<option value="1">Aucun objet disponible</option>';

      return `
        <div class="edit-fourchette-content">
          <header style="text-align: center; margin-bottom: 1rem; border-bottom: 2px solid var(--bronze); padding-bottom: 1rem;">
            <h3 style="margin: 0; color: var(--accent);">
              ${isNewFourchette ? '➕ Ajouter une fourchette' : '✏️ Éditer la fourchette'}
            </h3>
            <div style="color: var(--bronze); font-size: 0.9em;">Table: ${tableName}</div>
          </header>
          
          <form id="edit-fourchette-form">
            <input type="hidden" id="table-name" value="${tableName}">
            <input type="hidden" id="fourchette-index" value="${fourchetteIndex}">
            <input type="hidden" id="is-new-fourchette" value="${isNewFourchette}">
            <div style="margin: 1rem 0;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: var(--accent);">
                🎲 Fourchette de dé (1-20):
              </label>
              <div style="display: flex; gap: 1rem; align-items: center;">
                <div style="flex: 1;">
                  <label style="font-size: 0.9em; color: var(--paper-muted);">Minimum:</label>
                  <input 
                    type="number" 
                    id="fourchette-min" 
                    min="1" 
                    max="20" 
                    value="${fourchette.min}"
                    style="width: 100%; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 6px;"
                    required
                  >
                </div>
                <div style="padding: 1rem 0.5rem; color: var(--accent); font-weight: bold;">-</div>
                <div style="flex: 1;">
                  <label style="font-size: 0.9em; color: var(--paper-muted);">Maximum:</label>
                  <input 
                    type="number" 
                    id="fourchette-max" 
                    min="1" 
                    max="20" 
                    value="${fourchette.max}"
                    style="width: 100%; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 6px;"
                    required
                  >
                </div>
              </div>
            </div>
            
            <div style="margin: 1rem 0;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: var(--accent);">
                🏷️ Filtrer par tag:
              </label>
              <select 
                id="tag-filter" 
                style="width: 100%; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 6px; background: var(--paper-light);"
              >
                ${tagOptions}
              </select>
            </div>
            
            <div style="margin: 1rem 0;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: var(--accent);">
                📦 Objet associé:
              </label>
              <select 
                id="fourchette-objet" 
                style="width: 100%; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 6px;"
                required
              >
                ${objetsOptions}
              </select>
              <div style="margin-top: 0.5rem;">
                <button 
                  type="button" 
                  id="preview-selected-object" 
                  class="btn small" 
                  style="background: var(--bronze); color: white; font-size: 0.8em;"
                >
                  👁️ Aperçu de l'objet sélectionné
                </button>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--rule);">
              <button type="submit" class="btn" style="background: var(--accent); color: white;">
                ${isNewFourchette ? '➕ Ajouter' : '✓ Sauvegarder'}
              </button>
              <button type="button" onclick="window.TablesTresorsManager.closeAllModals()" class="btn" style="background: #6b7280; color: white; margin-left: 0.5rem;">
                ❌ Annuler
              </button>
            </div>
          </form>
        </div>
      `;
    }

    showModal(content, modalClass = '') {
      // Éviter l'ouverture de modals multiples rapidement
      if (this.modalIsOpening) {
        return;
      }
      
      this.modalIsOpening = true;
      this.closeAllModals(); // Fermer les modals existants

      const modalHtml = `
        <div class="modal-overlay ${modalClass}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;">
          <div class="modal-content" style="background: var(--paper); border-radius: 12px; padding: 2rem; max-width: 90vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 2px solid var(--rule);">
            ${content}
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // Setup form handler si c'est le modal d'édition
      if (modalClass === 'edit-fourchette') {
        this.setupEditFormHandlers();
      }
      
      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        this.modalIsOpening = false;
      }, 200);
    }

    setupEditFormHandlers() {
      const form = document.getElementById('edit-fourchette-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveFourchette();
      });

      // Preview de l'objet sélectionné
      const previewBtn = document.getElementById('preview-selected-object');
      if (previewBtn) {
        previewBtn.addEventListener('click', () => {
          const selectElement = document.getElementById('fourchette-objet');
          const selectedNumero = selectElement.value;
          this.showObjectPreview(selectedNumero);
        });
      }

      // Filtrage par tag
      const tagFilter = document.getElementById('tag-filter');
      const objectSelect = document.getElementById('fourchette-objet');
      
      if (tagFilter && objectSelect) {
        // Stocker toutes les options initiales
        const allOptions = Array.from(objectSelect.options);
        
        tagFilter.addEventListener('change', () => {
          const selectedTag = tagFilter.value;
          const currentSelectedValue = objectSelect.value;
          
          // Vider les options actuelles
          objectSelect.innerHTML = '';
          
          // Filtrer et réajouter les options
          const filteredOptions = allOptions.filter(option => {
            if (!selectedTag) return true; // Afficher tous si aucun tag sélectionné
            const optionTags = option.dataset.tags || '';
            return optionTags.split(',').includes(selectedTag);
          });
          
          // Réajouter les options filtrées
          filteredOptions.forEach(option => {
            objectSelect.appendChild(option.cloneNode(true));
          });
          
          // Restaurer la sélection si elle est toujours disponible
          const stillAvailable = filteredOptions.find(option => option.value === currentSelectedValue);
          if (stillAvailable) {
            objectSelect.value = currentSelectedValue;
          } else if (filteredOptions.length > 0) {
            objectSelect.selectedIndex = 0;
          }
        });
      }

      // Validation en temps réel
      const minInput = document.getElementById('fourchette-min');
      const maxInput = document.getElementById('fourchette-max');
      
      const validateRange = () => {
        const min = parseInt(minInput.value);
        const max = parseInt(maxInput.value);
        
        if (min > max) {
          maxInput.value = min;
        }
      };

      minInput.addEventListener('change', validateRange);
      maxInput.addEventListener('change', validateRange);
    }

    saveFourchette() {
      try {
        const form = document.getElementById('edit-fourchette-form');
        const formData = new FormData(form);
        
        const min = parseInt(document.getElementById('fourchette-min').value);
        const max = parseInt(document.getElementById('fourchette-max').value);
        const objetNumero = parseInt(document.getElementById('fourchette-objet').value);
        
        // Trouver l'objet sélectionné
        const objet = window.OBJETS?.objets?.find(obj => obj.numero === objetNumero);
        if (!objet) {
          alert('Objet sélectionné introuvable');
          return;
        }

        const newFourchette = {
          min: min,
          max: max,
          objet: {
            type: 'reference',
            numero: objet.numero,
            nom: objet.nom
          }
        };

        // Extraire les informations depuis les champs cachés du formulaire
        const tableName = document.getElementById('table-name').value;
        const fourchetteIndex = parseInt(document.getElementById('fourchette-index').value);
        const isNewFourchette = document.getElementById('is-new-fourchette').value === 'true';
        
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        
        if (!table) {
          console.error('Table non trouvée pour la sauvegarde');
          return;
        }

        if (isNewFourchette) {
          table.fourchettes.push(newFourchette);
        } else {
          // Mode modification - remplacer la fourchette existante
          if (fourchetteIndex >= 0 && fourchetteIndex < table.fourchettes.length) {
            table.fourchettes[fourchetteIndex] = newFourchette;
          } else {
            console.error('Index de fourchette invalide pour la modification:', fourchetteIndex);
            return;
          }
        }

        // Sauvegarder et regénérer la page
        this.saveToStorage();
        this.refreshTablesTresorsPage();
        this.closeAllModals();

      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde de la fourchette');
      }
    }

    deleteFourchette(tableName, fourchetteIndex) {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette fourchette ?')) {
        return;
      }

      try {
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        if (!table) {
          console.error('Table non trouvée:', tableName);
          return;
        }

        if (fourchetteIndex < 0 || fourchetteIndex >= table.fourchettes.length) {
          console.error('Index de fourchette invalide:', fourchetteIndex);
          return;
        }

        table.fourchettes.splice(fourchetteIndex, 1);
        
        this.saveToStorage();
        this.refreshTablesTresorsPage();
        
        // Fourchette supprimée avec succès

      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la fourchette');
      }
    }

    goToObject(numeroObjet) {
      this.closeAllModals();
      // Naviguer vers la page objets avec focus sur l'objet spécifique
      JdrApp.modules.router.navigate('objets');
      
      // Optionnel: highlight l'objet après navigation
      setTimeout(() => {
        const objectCard = document.querySelector(`[data-objet-name*="${numeroObjet}"]`);
        if (objectCard) {
          objectCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          objectCard.style.border = '3px solid var(--accent)';
          setTimeout(() => {
            objectCard.style.border = '';
          }, 2000);
        }
      }, 500);
    }

    goToTablesTresorsPage() {
      this.closeAllModals();
      // Naviguer vers la page tables de trésors
      if (JdrApp.modules.router && JdrApp.modules.router.navigate) {
        JdrApp.modules.router.navigate('tables-tresors');
      } else {
        // Fallback direct navigation
        window.location.hash = '#/tables-tresors';
      }
    }

    closeAllModals() {
      const modals = document.querySelectorAll('.modal-overlay');
      modals.forEach(modal => modal.remove());
      this.currentPreviewModal = null;
      this.currentEditModal = null;
    }

    saveToStorage() {
      // Les modifications sont déjà dans window.TABLES_TRESORS et seront incluses dans les exports
      // Émettre l'événement de mise à jour pour notifier les autres modules
      if (window.EventBus && window.Events) {
        EventBus.emit(Events.CONTENT_UPDATE, {
          type: 'tablesTresors',
          data: window.TABLES_TRESORS
        });
      }
    }

    refreshTablesTresorsPage() {
      // Regénérer la page des tables de trésors
      if (JdrApp.modules.router && JdrApp.modules.router.getCurrentRoute() === 'tables-tresors') {
        // Force complete page regeneration via router navigation
        JdrApp.modules.router.navigate('tables-tresors');
      }
    }

    // Generate HTML link with table preview
    generateTreasureTableHtmlLink(tableName) {
      try {
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        if (!table) {
          console.error('Table non trouvée:', tableName);
          return '';
        }

        // Generate table preview HTML
        const tableHtml = this.generateTablePreviewHtml(table);
        
        // Create a compact link with preview tooltip
        const htmlLink = `<span class="treasure-table-link" data-table-name="${tableName}" style="color: var(--accent); cursor: pointer; text-decoration: underline;" title="Cliquer pour voir la table des trésors">[Table: ${tableName}]</span>`;
        
        return htmlLink;

      } catch (error) {
        console.error('Erreur lors de la génération du lien HTML:', error);
        return `[Erreur: ${tableName}]`;
      }
    }

    generateTablePreviewHtml(table) {
      const fourchettesList = table.fourchettes.map(fourchette => {
        const range = fourchette.min === fourchette.max 
          ? `${fourchette.min}` 
          : `${fourchette.min}-${fourchette.max}`;
        
        return `
          <tr>
            <td style="text-align: center; font-weight: bold; color: var(--accent);">${range}</td>
            <td>
              <span class="object-preview-link" data-object-numero="${fourchette.objet.numero}" style="color: var(--accent); cursor: pointer; text-decoration: underline;" title="Cliquer pour voir la preview de l'objet">
                ${fourchette.objet.nom} (N°${fourchette.objet.numero})
              </span>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="treasure-table-preview" style="background: var(--paper); border: 2px solid var(--bronze); border-radius: 12px; padding: 1rem; max-width: 500px;">
          <h3 style="margin: 0 0 1rem 0; color: var(--accent); text-align: center;">🎲 ${table.nom}</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
            <thead>
              <tr style="background: var(--bronze); color: white;">
                <th style="padding: 8px; text-align: center; border: 1px solid var(--rule);">Dé (d20)</th>
                <th style="padding: 8px; text-align: left; border: 1px solid var(--rule);">Objet obtenu</th>
              </tr>
            </thead>
            <tbody>
              ${fourchettesList}
            </tbody>
          </table>
        </div>
      `;
    }

    // Copy HTML link to clipboard
    copyTreasureTableHtmlLink(tableName) {
      try {
        const htmlLink = this.generateTreasureTableHtmlLink(tableName);
        
        // Copy to clipboard using modern API
        navigator.clipboard.writeText(htmlLink).then(() => {
          this.showNotification('✓ Lien HTML copié dans le presse-papiers!', 'success');
        }).catch(err => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = htmlLink;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          this.showNotification('✓ Lien HTML copié dans le presse-papiers!', 'success');
        });

      } catch (error) {
        console.error('Erreur lors de la copie:', error);
        this.showNotification('❌ Erreur lors de la copie du lien', 'error');
      }
    }

    // Show notification
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1001;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => notification.remove(), 300);
        }
      }, 3000);
    }
  }

  // Exposer globalement pour les event handlers inline
  window.TablesTresorsManager = TablesTresorsManager.getInstance();

  // Auto-initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.TablesTresorsManager.init());
  } else {
    window.TablesTresorsManager.init();
  }

})();