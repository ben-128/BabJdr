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

      // Suppression de fourchette - Handled by EventHandlers.js

      // Ajout de nouvelle fourchette
      document.addEventListener('click', (e) => {
        if (e.target.matches('.table-tresor-add-fourchette')) {
          const tableName = e.target.dataset.tableTresorName;
          this.showEditFourchetteModal(tableName, -1); // -1 pour nouvelle fourchette
        }
      });

      // Fermer les modals en cliquant à l'extérieur - DÉSACTIVÉ
      // document.addEventListener('click', (e) => {
      //   if (e.target.matches('.modal-overlay')) {
      //     this.closeAllModals();
      //   }
      // });

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

        // Check if we're in fourchette editing mode by looking for the edit form
        const isInEditMode = document.getElementById('edit-fourchette-form') !== null;
        const previewHtml = this.generateObjectPreviewHtml(objet, isInEditMode);
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

    generateObjectPreviewHtml(objet, showSelectButton = false) {
      // Utiliser le CardBuilder pour générer la card d'objet standard
      const cardHtml = CardBuilder.create('objet', objet, 'preview').build();

      // Bouton sélectionner conditionnel
      const selectButtonHtml = showSelectButton ? `
        <button class="btn" onclick="window.TablesTresorsManager.selectObjectFromPreview(${objet.numero})" style="background: #059669; color: white; margin-left: 0.5rem;">
          ✅ Sélectionner
        </button>
      ` : '';

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
            ${selectButtonHtml}
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
        
        // Initialiser l'objet sélectionné avec l'objet existant
        this.selectedObjectId = fourchette.objet?.numero || null;

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
        `<option value="${obj.numero}" data-tags="${obj.tags?.join(',') || ''}" ${obj.numero == fourchette.objet?.numero ? 'selected' : ''}>N°${obj.numero} - ${obj.nom}</option>`
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
                    value="${fourchette.min || 1}"
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
                    value="${fourchette.max || 1}"
                    style="width: 100%; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 6px;"
                    required
                  >
                </div>
              </div>
            </div>
            
            <div style="margin: 1rem 0;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: var(--accent);">
                🏷️ Filtrer par tags:
              </label>
              <div id="tags-filter-container" style="border: 1px solid var(--rule); border-radius: 6px; padding: 0.5rem; background: var(--paper-light); max-height: 100px; overflow-y: auto;">
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  <button type="button" class="tag-filter-chip" data-tag="" style="background: var(--accent); color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; cursor: pointer;">Tous</button>
                  ${sortedTags.map(tag => 
                    `<button type="button" class="tag-filter-chip" data-tag="${tag}" style="background: var(--bronze); color: white; border: none; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; cursor: pointer;">${tag}</button>`
                  ).join('')}
                </div>
              </div>
              <div id="selected-tags" style="margin-top: 0.5rem; font-size: 0.8em; color: var(--paper-muted);">
                Filtres actifs: <span id="active-filters-display">Tous les objets</span>
              </div>
            </div>
            
            <div style="margin: 1rem 0;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: var(--accent);">
                🎲 Type de récompense:
              </label>
              
              <!-- Sélecteur de type de récompense -->
              <div id="reward-type-selector" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <button type="button" id="select-object-type" class="reward-type-btn" data-type="object" style="flex: 1; padding: 0.5rem; border: 2px solid var(--accent); border-radius: 6px; background: var(--accent); color: white; cursor: pointer;">
                  📦 Objet
                </button>
                <button type="button" id="select-eclats-type" class="reward-type-btn" data-type="eclats" style="flex: 1; padding: 0.5rem; border: 2px solid var(--bronze); border-radius: 6px; background: var(--paper); color: var(--bronze); cursor: pointer;">
                  💎 Eclats
                </button>
              </div>
              
              <!-- Section Objet (visible par défaut) -->
              <div id="object-selection-section">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <button 
                    type="button" 
                    id="open-object-selector" 
                    class="btn" 
                    style="background: var(--accent); color: white; flex: 1;"
                  >
                    🔍 Ouvrir le sélecteur d'objets
                  </button>
                  <button 
                    type="button" 
                    id="preview-selected-object" 
                    class="btn" 
                    style="background: var(--bronze); color: white;"
                  >
                    👁️ Aperçu
                  </button>
                </div>
                
                <div id="selected-object-display" style="border: 1px solid var(--rule); border-radius: 6px; padding: 0.5rem; background: var(--paper); min-height: 40px;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: bold;">N°${fourchette.objet?.numero || 1}</span>
                    <span>${fourchette.objet?.nom || 'Choisir un objet'}</span>
                  </div>
                </div>
                
                <!-- Aperçu des objets filtrés -->
                <div id="objects-preview" style="margin-top: 1rem; max-height: 200px; overflow-y: auto; border: 1px solid var(--rule); border-radius: 6px; background: var(--paper-light); display: none;">
                  <div id="objects-preview-content"></div>
                </div>
              </div>
              
              <!-- Section Eclats (cachée par défaut) -->
              <div id="eclats-selection-section" style="display: none;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: var(--bronze);">
                  💎 Nombre d'eclats:
                </label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <input 
                    type="number" 
                    id="eclats-amount" 
                    min="1" 
                    max="999"
                    value="${fourchette.objet?.type === 'eclats' ? (fourchette.objet.amount || 10) : 10}"
                    style="flex: 1; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 6px; text-align: center; font-weight: bold;"
                    placeholder="Nombre d'eclats"
                  >
                  <span style="color: var(--bronze); font-weight: bold;">eclats</span>
                </div>
                <div style="font-size: 0.8em; color: var(--paper-muted); margin-top: 0.5rem; font-style: italic;">
                  Entrez le nombre d'eclats que le joueur recevra (1-999)
                </div>
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
      
      // Reapply images in modal content
      setTimeout(() => {
        if (JdrApp.modules.renderer && JdrApp.modules.renderer.autoLoadImages) {
          JdrApp.modules.renderer.autoLoadImages();
        }
      }, 100);
      
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

      // Variables pour le système de filtrage
      this.selectedTags = [];
      this.selectedObjectId = null;
      this.allObjects = window.OBJETS?.objets || [];

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveFourchette();
      });

      // Gestion des filtres par tags
      this.setupTagFilters();

      // Gestion des types de récompense (objet/eclats)
      this.setupRewardTypeSelector();

      // Initialiser l'état correct du sélecteur de type selon la fourchette existante
      this.initializeRewardTypeState();

      // Bouton sélecteur d'objets avancé
      const objectSelectorBtn = document.getElementById('open-object-selector');
      if (objectSelectorBtn) {
        objectSelectorBtn.addEventListener('click', () => {
          this.showObjectSelectorModal();
        });
      }

      // Preview de l'objet sélectionné
      const previewBtn = document.getElementById('preview-selected-object');
      if (previewBtn) {
        previewBtn.addEventListener('click', () => {
          if (this.selectedObjectId) {
            this.showObjectPreview(this.selectedObjectId);
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

      // Initialiser l'affichage
      this.updateObjectsPreview();
    }

    setupTagFilters() {
      const tagChips = document.querySelectorAll('.tag-filter-chip');
      
      tagChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          const tag = chip.dataset.tag;
          
          if (tag === '') {
            // Bouton "Tous" - réinitialiser
            this.selectedTags = [];
            tagChips.forEach(c => {
              c.style.background = c.dataset.tag === '' ? 'var(--accent)' : 'var(--bronze)';
            });
          } else {
            // Toggle du tag
            const index = this.selectedTags.indexOf(tag);
            if (index > -1) {
              this.selectedTags.splice(index, 1);
              chip.style.background = 'var(--bronze)';
            } else {
              this.selectedTags.push(tag);
              chip.style.background = 'var(--accent)';
            }
            
            // Désactiver "Tous" si des tags sont sélectionnés
            const allBtn = document.querySelector('.tag-filter-chip[data-tag=""]');
            if (allBtn) {
              allBtn.style.background = this.selectedTags.length === 0 ? 'var(--accent)' : 'var(--bronze)';
            }
          }
          
          this.updateActiveFiltersDisplay();
          this.updateObjectsPreview();
        });
      });
    }

    setupRewardTypeSelector() {
      const objectBtn = document.getElementById('select-object-type');
      const eclatsBtn = document.getElementById('select-eclats-type');
      const objectSection = document.getElementById('object-selection-section');
      const eclatsSection = document.getElementById('eclats-selection-section');

      if (!objectBtn || !eclatsBtn || !objectSection || !eclatsSection) return;

      // Gestion du clic sur le bouton Objet
      objectBtn.addEventListener('click', () => {
        // Activer le bouton Objet
        objectBtn.style.background = 'var(--accent)';
        objectBtn.style.color = 'white';
        
        // Désactiver le bouton Eclats
        eclatsBtn.style.background = 'var(--paper)';
        eclatsBtn.style.color = 'var(--bronze)';
        
        // Afficher la section Objet, masquer Eclats
        objectSection.style.display = 'block';
        eclatsSection.style.display = 'none';
      });

      // Gestion du clic sur le bouton Eclats
      eclatsBtn.addEventListener('click', () => {
        // Activer le bouton Eclats
        eclatsBtn.style.background = 'var(--accent)';
        eclatsBtn.style.color = 'white';
        
        // Désactiver le bouton Objet
        objectBtn.style.background = 'var(--paper)';
        objectBtn.style.color = 'var(--bronze)';
        
        // Afficher la section Eclats, masquer Objet
        eclatsSection.style.display = 'block';
        objectSection.style.display = 'none';
      });
    }

    initializeRewardTypeState() {
      // Récupérer les informations de la fourchette actuelle
      const tableName = document.getElementById('table-name').value;
      const fourchetteIndex = parseInt(document.getElementById('fourchette-index').value);
      const isNewFourchette = document.getElementById('is-new-fourchette').value === 'true';

      if (isNewFourchette) {
        // Nouvelle fourchette - mode objet par défaut
        document.getElementById('select-object-type').click();
        return;
      }

      // Modifier une fourchette existante - vérifier son type
      const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
      if (!table || fourchetteIndex < 0 || fourchetteIndex >= table.fourchettes.length) {
        document.getElementById('select-object-type').click();
        return;
      }

      const fourchette = table.fourchettes[fourchetteIndex];
      
      if (fourchette.eclats !== undefined) {
        // Cette fourchette contient des eclats
        document.getElementById('select-eclats-type').click();
        
        // Pré-remplir le champ eclats
        const eclatsInput = document.getElementById('eclats-amount');
        if (eclatsInput) {
          eclatsInput.value = fourchette.eclats;
        }
      } else {
        // Cette fourchette contient un objet
        document.getElementById('select-object-type').click();
      }
    }

    updateActiveFiltersDisplay() {
      const display = document.getElementById('active-filters-display');
      if (display) {
        display.textContent = this.selectedTags.length === 0 
          ? 'Tous les objets' 
          : this.selectedTags.join(', ');
      }
    }

    updateObjectsPreview() {
      const preview = document.getElementById('objects-preview');
      const content = document.getElementById('objects-preview-content');
      
      if (!preview || !content) return;
      
      // Filtrer les objets
      const filteredObjects = this.allObjects.filter(obj => {
        if (this.selectedTags.length === 0) return true;
        return this.selectedTags.some(tag => obj.tags?.includes(tag));
      });
      
      if (filteredObjects.length === 0) {
        content.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--paper-muted);">Aucun objet ne correspond aux filtres sélectionnés</div>';
      } else {
        content.innerHTML = filteredObjects.map(obj => `
          <div class="object-preview-item" data-object-id="${obj.numero}" style="padding: 0.5rem; border-bottom: 1px solid var(--rule); cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>N°${obj.numero}</strong> - ${obj.nom}
              ${obj.tags ? `<div style="font-size: 0.7em; color: var(--paper-muted);">${obj.tags.join(', ')}</div>` : ''}
            </div>
            <button class="btn small select-object-btn" data-object-id="${obj.numero}" style="background: var(--accent); color: white; font-size: 0.7em;">Sélectionner</button>
          </div>
        `).join('');
      }
      
      preview.style.display = 'block';
      
      // Gérer les clics sur les objets
      content.querySelectorAll('.select-object-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const objectId = btn.dataset.objectId;
          this.selectObject(objectId);
        });
      });
      
      content.querySelectorAll('.object-preview-item').forEach(item => {
        item.addEventListener('click', () => {
          const objectId = item.dataset.objectId;
          this.showObjectPreview(objectId);
        });
      });
    }

    selectObject(objectId) {
      const obj = this.allObjects.find(o => o.numero == objectId);
      if (!obj) return;
      
      this.selectedObjectId = objectId;
      
      // Mettre à jour l'affichage de l'objet sélectionné
      const display = document.getElementById('selected-object-display');
      if (display) {
        display.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-weight: bold; color: var(--accent);">N°${obj.numero}</span>
            <span>${obj.nom}</span>
            ${obj.tags ? `<div style="font-size: 0.7em; color: var(--paper-muted); margin-left: auto;">${obj.tags.join(', ')}</div>` : ''}
          </div>
        `;
      }
    }

    selectObjectFromPreview(objectId) {
      // Select the object and close the preview modal
      this.selectObject(objectId);
      this.closeAllModals();

      // Hide the objects preview if it's open
      const preview = document.getElementById('objects-preview');
      if (preview) {
        preview.style.display = 'none';
      }
    }

    showObjectSelectorModal() {
      // Créer un modal similaire à la gestion des objets
      const filteredObjects = this.allObjects.filter(obj => {
        if (this.selectedTags.length === 0) return true;
        return this.selectedTags.some(tag => obj.tags?.includes(tag));
      });

      const objectsGrid = filteredObjects.map(obj => `
        <div class="object-selector-card" data-object-id="${obj.numero}" style="border: 1px solid var(--rule); border-radius: 8px; padding: 1rem; cursor: pointer; background: var(--paper); margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <h4 style="margin: 0; color: var(--accent);">N°${obj.numero} - ${obj.nom}</h4>
            <button class="select-and-close-btn" data-object-id="${obj.numero}" style="background: var(--accent); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">Sélectionner</button>
          </div>
          <div style="font-size: 0.9em; color: var(--paper-muted); margin-bottom: 0.5rem;">${obj.description || 'Aucune description'}</div>
          ${obj.tags ? `<div style="margin-bottom: 0.5rem;">${obj.tags.map(tag => `<span style="background: var(--bronze); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-right: 4px;">${tag}</span>`).join('')}</div>` : ''}
          <div style="font-size: 0.8em; color: var(--paper-muted);">Prix: ${obj.prix || 'N/A'} | Poids: ${obj.poids || 'N/A'}</div>
        </div>
      `).join('');

      const modalContent = `
        <div class="object-selector-modal">
          <header style="text-align: center; margin-bottom: 1rem; border-bottom: 2px solid var(--bronze); padding-bottom: 1rem;">
            <h3 style="margin: 0; color: var(--accent);">🔍 Sélecteur d'objets</h3>
            <div style="color: var(--bronze); font-size: 0.9em;">${filteredObjects.length} objet(s) disponible(s)</div>
          </header>
          
          <div style="max-height: 60vh; overflow-y: auto;">
            ${objectsGrid}
          </div>
          
          <div style="text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--rule);">
            <button type="button" onclick="window.TablesTresorsManager.closeAllModals()" class="btn" style="background: #6b7280; color: white;">
              ❌ Fermer
            </button>
          </div>
        </div>
      `;

      this.showModal(modalContent, 'object-selector');

      // Gérer les clics sur les boutons de sélection
      setTimeout(() => {
        document.querySelectorAll('.select-and-close-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const objectId = btn.dataset.objectId;
            this.selectObject(objectId);
            this.closeAllModals();
          });
        });

        document.querySelectorAll('.object-selector-card').forEach(card => {
          card.addEventListener('click', () => {
            const objectId = card.dataset.objectId;
            this.showObjectPreview(objectId);
          });
        });
      }, 100);
    }

    saveFourchette() {
      try {
        const form = document.getElementById('edit-fourchette-form');
        const formData = new FormData(form);
        
        const min = parseInt(document.getElementById('fourchette-min').value);
        const max = parseInt(document.getElementById('fourchette-max').value);
        
        // Déterminer le type de récompense actif
        const objectSection = document.getElementById('object-selection-section');
        const eclatsSection = document.getElementById('eclats-selection-section');
        const isEclatsMode = eclatsSection && eclatsSection.style.display !== 'none';

        let newFourchette;

        if (isEclatsMode) {
          // Mode Eclats
          const eclatsAmount = parseInt(document.getElementById('eclats-amount').value) || 1;
          
          newFourchette = {
            min: min,
            max: max,
            eclats: eclatsAmount
          };
        } else {
          // Mode Objet (comportement existant)
          if (!this.selectedObjectId) {
            alert('Veuillez sélectionner un objet');
            return;
          }

          const objet = this.allObjects.find(obj => obj.numero == this.selectedObjectId);
          if (!objet) {
            alert('Erreur: Objet sélectionné introuvable');
            return;
          }

          newFourchette = {
            min: min,
            max: max,
            objet: {
              type: 'reference',
              numero: objet.numero,
              nom: objet.nom
            }
          };
        }

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

        // Sauvegarder les données
        this.saveToStorage();
        // Fermer la modal
        this.closeAllModals();
        
        // Mettre à jour l'affichage sans recharger la page
        this.refreshTablesTresorsDisplay();
        

      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde de la fourchette');
      }
    }

    addFourchette(tableName) {
      try {
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        if (!table) {
          console.error('Table non trouvée:', tableName);
          return;
        }

        // Créer une nouvelle fourchette avec des valeurs par défaut
        const newFourchette = {
          min: 1,
          max: 1,
          objet: {
            nom: "Nouvel objet",
            type: "custom"
          }
        };

        // Ajouter la fourchette à la table
        if (!table.fourchettes) {
          table.fourchettes = [];
        }
        table.fourchettes.push(newFourchette);
        
        this.saveToStorage();
        // Mettre à jour l'affichage sans recharger la page
        this.refreshTablesTresorsDisplay();
        
        // Fourchette ajoutée avec succès

      } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        alert('Erreur lors de l\'ajout de la fourchette');
      }
    }

    editFourchette(tableName, fourchetteIndex) {
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

        this.showEditFourchetteModal(tableName, fourchetteIndex);
        
      } catch (error) {
        console.error('Erreur lors de l\'édition:', error);
        alert('Erreur lors de l\'édition de la fourchette');
      }
    }

    moveFourchette(tableName, fromIndex, toIndex) {
      try {
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        if (!table) {
          console.error('Table non trouvée:', tableName);
          return;
        }

        if (fromIndex < 0 || fromIndex >= table.fourchettes.length || 
            toIndex < 0 || toIndex >= table.fourchettes.length) {
          console.error('Index de fourchette invalide:', { fromIndex, toIndex });
          return;
        }

        // Échanger les fourchettes
        const fourchette = table.fourchettes.splice(fromIndex, 1)[0];
        table.fourchettes.splice(toIndex, 0, fourchette);
        
        this.saveToStorage();
        // Mettre à jour l'affichage sans recharger la page
        this.refreshTablesTresorsDisplay();
        
        // Fourchette déplacée avec succès

      } catch (error) {
        console.error('Erreur lors du déplacement:', error);
        alert('Erreur lors du déplacement de la fourchette');
      }
    }

    deleteFourchette(tableName, fourchetteIndex) {
      // Note: Confirmation is handled by EventHandlers.js when called from UI
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
        // Mettre à jour l'affichage sans recharger la page
        this.refreshTablesTresorsDisplay();
        
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
      // Émettre l'événement de sauvegarde pour forcer la sauvegarde
      if (window.EventBus && window.Events) {
        EventBus.emit(Events.STORAGE_SAVE);
        
        // Aussi émettre l'événement de mise à jour pour notifier les autres modules
        EventBus.emit(Events.CONTENT_UPDATE, {
          type: 'tablesTresors',
          data: window.TABLES_TRESORS
        });
      }
    }

    refreshTablesTresorsPage() {
      // Regénérer la page des tables de trésors
      if (JdrApp.modules.router && JdrApp.modules.router.getCurrentRoute() === 'tables-tresors') {
        // Force complete page regeneration using UIUtilities
        if (window.UIUtilities && UIUtilities.forcePageRefresh) {
          UIUtilities.forcePageRefresh();
        } else {
          // Fallback: force router to handle the current route again
          JdrApp.modules.router.handleRoute();
        }
      }
    }

    refreshTablesTresorsDisplay() {
      // Rafraîchir seulement l'affichage des cartes sans recharger la page
      if (JdrApp.modules.router && JdrApp.modules.router.getCurrentRoute() === 'tables-tresors') {
        // Au lieu de rafraîchir manuellement, utiliser la méthode du router qui respecte les filtres
        if (JdrApp.modules.router?.renderTablesTresorsPage) {
          JdrApp.modules.router.renderTablesTresorsPage();
        } else {
          // Fallback: regénérer la page complète si la méthode n'existe pas
          JdrApp.modules.renderer?.regenerateCurrentPage();
        }
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
        const range = (fourchette.min || 1) === (fourchette.max || 1) 
          ? `${fourchette.min || 1}` 
          : `${fourchette.min || 1}-${fourchette.max || 1}`;
        
        // Vérifier si c'est des eclats
        if (fourchette.eclats !== undefined) {
          return `
            <tr>
              <td style="text-align: center; font-weight: bold; color: var(--accent);">${range}</td>
              <td>
                <span style="color: var(--gold); font-weight: bold;">
                  💎 ${fourchette.eclats} éclats
                </span>
              </td>
            </tr>
          `;
        }
        
        // Vérifier si c'est un objet valide
        if (!fourchette.objet || !fourchette.objet.numero) {
          return `
            <tr>
              <td style="text-align: center; font-weight: bold; color: var(--accent);">${range}</td>
              <td style="color: var(--muted);">
                Objet non défini
              </td>
            </tr>
          `;
        }
        
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