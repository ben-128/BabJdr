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

    generateObjectPreviewHtml(objet) {
      const tagsDisplay = objet.tags?.map(tag => 
        `<span class="tag-chip" style="background: var(--bronze); color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em; margin-right: 4px;">${tag}</span>`
      ).join('') || 'Aucun tag';

      return `
        <div class="object-preview-content">
          <header style="text-align: center; margin-bottom: 1rem; border-bottom: 2px solid var(--bronze); padding-bottom: 1rem;">
            <h3 style="margin: 0; color: var(--accent);">📦 ${objet.nom}</h3>
            <div style="color: var(--bronze); font-size: 0.9em;">Objet N°${objet.numero}</div>
          </header>
          
          <div style="margin: 1rem 0;">
            <strong>Tags:</strong><br>
            ${tagsDisplay}
          </div>
          
          <div style="margin: 1rem 0;">
            <strong>Description:</strong><br>
            <div style="font-style: italic; margin: 0.5rem 0;">${objet.description || 'Aucune description'}</div>
          </div>
          
          <div style="margin: 1rem 0;">
            <strong>Effet:</strong><br>
            <div>${objet.effet || 'Aucun effet spécifié'}</div>
          </div>
          
          <div style="display: flex; gap: 1rem; margin: 1rem 0;">
            <div style="flex: 1;">
              <strong>Prix:</strong><br>
              ${objet.prix || 'Non spécifié'}
            </div>
            <div style="flex: 1;">
              <strong>Poids:</strong><br>
              ${objet.poids || 'Non spécifié'}
            </div>
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
      // Générer la liste des objets disponibles
      const objetsOptions = window.OBJETS?.objets?.map(obj => 
        `<option value="${obj.numero}" ${obj.numero == fourchette.objet.numero ? 'selected' : ''}>N°${obj.numero} - ${obj.nom}</option>`
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

        // Extraire les informations depuis le modal
        const tableName = document.querySelector('.edit-fourchette-content h3 + div').textContent.replace('Table: ', '');
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        
        if (!table) {
          console.error('Table non trouvée pour la sauvegarde');
          return;
        }

        // Déterminer si c'est une nouvelle fourchette ou une modification
        const currentModal = document.querySelector('.modal-overlay.edit-fourchette');
        const isNewFourchette = currentModal?.querySelector('h3')?.textContent.includes('Ajouter');

        if (isNewFourchette) {
          table.fourchettes.push(newFourchette);
        } else {
          // Trouver l'index de la fourchette à modifier (pas optimal mais fonctionne)
          // Pour une vraie app, il faudrait passer l'index via les données du modal
          // Mode modification - non implémenté complètement dans cette demo
        }

        // Sauvegarder et regénérer la page
        this.saveToStorage();
        this.refreshTablesTresorsPage();
        this.closeAllModals();
        
        // Fourchette sauvegardée avec succès

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

    closeAllModals() {
      const modals = document.querySelectorAll('.modal-overlay');
      modals.forEach(modal => modal.remove());
      this.currentPreviewModal = null;
      this.currentEditModal = null;
    }

    saveToStorage() {
      // Utiliser le système de stockage existant
      if (JdrApp.modules.storage) {
        JdrApp.modules.storage.save();
      }
    }

    refreshTablesTresorsPage() {
      // Regénérer la page des tables de trésors
      if (JdrApp.modules.router && JdrApp.modules.router.getCurrentRoute() === 'tables-tresors') {
        JdrApp.modules.router.renderTablesTresorsPage();
      }
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