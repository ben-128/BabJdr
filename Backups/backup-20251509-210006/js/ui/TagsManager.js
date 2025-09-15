// ============================================================================
// JDR-BAB APPLICATION - TAGS MANAGER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // TAGS MANAGER - TAG MANAGEMENT FOR MONSTERS AND TREASURES
  // ========================================
  window.TagsManager = {

    /**
     * Show tags management modal based on content type
     */
    showTagsManagementModal() {
      // Déterminer le type de contenu basé sur la page actuelle
      const currentPage = window.location.hash.replace('#/', '') || 'creation';
      let contentType = 'objet'; // par défaut
      
      if (currentPage === 'monstres') {
        contentType = 'monster';
      } else if (currentPage === 'tables-tresors') {
        contentType = 'tableTresor';
      }

      if (contentType === 'monster') {
        this.showMonsterTagsManagement();
      } else if (contentType === 'tableTresor') {
        this.showTableTresorTagsManagement();
      } else {
        // For objects (legacy support)
        this.showGeneralTagsManagement();
      }
    },

    /**
     * Show monster tags management modal
     */
    showMonsterTagsManagement() {
      const config = window.ContentTypes.monster;
      if (!config || !config.filterConfig) {
        UIUtilities.showNotification('Configuration des tags monstres non trouvée', 'error');
        return;
      }

      // Remove existing modal if any
      const existingModal = document.querySelector('#monsterTagsModal');
      if (existingModal) {
        existingModal.remove();
      }

      const availableTags = config.filterConfig.availableTags || [];
      const modal = this.createMonsterTagsModal(availableTags);
      document.body.appendChild(modal);
      
      // Use native dialog showModal for proper z-index
      modal.showModal();
    },

    /**
     * Show table tresor tags management modal
     */
    showTableTresorTagsManagement() {
      // Priority: Load tags from metadata, then config, then fallback
      let availableTags = [];
      
      if (window.TABLES_TRESORS?._metadata?.availableTags) {
        availableTags = window.TABLES_TRESORS._metadata.availableTags;
      } else {
        // Initialize metadata if missing
        availableTags = ['Forêt', 'Boss', 'Coffre'];
        if (window.TABLES_TRESORS) {
          if (!window.TABLES_TRESORS._metadata) {
            window.TABLES_TRESORS._metadata = {};
          }
          window.TABLES_TRESORS._metadata.availableTags = [...availableTags];
        }
      }

      // Remove existing modal if any
      const existingModal = document.querySelector('#tableTresorTagsModal');
      if (existingModal) {
        existingModal.remove();
      }
      
      const modal = this.createTableTresorTagsModal(availableTags);
      document.body.appendChild(modal);
      modal.showModal();
    },

    /**
     * Show general tags management for objects
     */
    showGeneralTagsManagement() {
      // Delegate to ui.js for now (will be extracted in Phase 4)
      if (JdrApp.modules.ui?.showTagsManagementModal) {
        return JdrApp.modules.ui.showTagsManagementModal();
      }
    },

    /**
     * Create monster tags modal
     */
    createMonsterTagsModal(availableTags) {
      const modal = document.createElement('dialog');
      modal.id = 'monsterTagsModal';
      modal.style.cssText = `
        max-width: 500px;
        width: 90%;
        padding: 20px;
        border: none;
        border-radius: 12px;
        background: var(--background);
        color: var(--text);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      `;

      modal.innerHTML = `
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: var(--accent);">🏷️ Gestion des Tags - Monstres</h3>
          <button class="modal-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text);">✕</button>
        </div>
        
        <div class="modal-body">
          <div style="margin-bottom: 20px;">
            <h4>Tags Disponibles:</h4>
            <div id="availableTagsList" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
              ${availableTags.map(tag => `
                <span class="tag-item" style="background: var(--accent-dark); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                  ${tag}
                  <button class="delete-tag-btn" data-tag="${tag}" style="background: none; border: none; color: white; cursor: pointer; font-size: 14px;">🗑️</button>
                </span>
              `).join('')}
            </div>
            
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="text" id="newMonsterTag" placeholder="Nouveau tag..." style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: 4px;">
              <button id="addMonsterTagBtn" style="background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Ajouter</button>
            </div>
          </div>
        </div>
      `;

      this.setupMonsterTagsModalEvents(modal, availableTags);
      return modal;
    },

    /**
     * Create table tresor tags modal
     */
    createTableTresorTagsModal(availableTags) {
      const modal = document.createElement('dialog');
      modal.id = 'tableTresorTagsModal';
      modal.style.cssText = `
        max-width: 500px;
        width: 90%;
        padding: 20px;
        border: none;
        border-radius: 12px;
        background: var(--background);
        color: var(--text);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      `;

      modal.innerHTML = `
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: var(--accent);">🏷️ Gestion des Tags - Tables de Trésors</h3>
          <button class="modal-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text);">✕</button>
        </div>
        
        <div class="modal-body">
          <div style="margin-bottom: 20px;">
            <h4>Tags Disponibles:</h4>
            <div id="availableTagsList" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
              ${availableTags.map(tag => `
                <span class="tag-item" style="background: var(--accent-dark); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                  ${tag}
                  <button class="delete-tag-btn" data-tag="${tag}" style="background: none; border: none; color: white; cursor: pointer; font-size: 14px;">🗑️</button>
                </span>
              `).join('')}
            </div>
            
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="text" id="newTableTresorTag" placeholder="Nouveau tag..." style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: 4px;">
              <button id="addTableTresorTagBtn" style="background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Ajouter</button>
            </div>
          </div>
        </div>
      `;

      this.setupTableTresorTagsModalEvents(modal, availableTags);
      return modal;
    },

    /**
     * Setup monster tags modal events
     */
    setupMonsterTagsModalEvents(modal, availableTags) {
      // Close modal
      modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.close();
      });

      // Add new tag
      const addTag = () => {
        const newTagInput = modal.querySelector('#newMonsterTag');
        const newTag = newTagInput.value.trim();
        
        if (newTag && !availableTags.includes(newTag)) {
          // Add to the current available tags
          availableTags.push(newTag);
          
          // Save to the config
          const config = window.ContentTypes.monster;
          config.filterConfig.availableTags = [...availableTags];
          
          // Save changes to storage
          EventBus.emit(Events.STORAGE_SAVE);
          
          modal.close();
          this.showMonsterTagsManagement(); // Refresh modal
          UIUtilities.showNotification(`Tag "${newTag}" ajouté avec succès`, 'success');
        } else if (newTag && availableTags.includes(newTag)) {
          UIUtilities.showNotification('Ce tag existe déjà', 'error');
        }
      };

      const addBtn = modal.querySelector('#addMonsterTagBtn');
      const newTagInput = modal.querySelector('#newMonsterTag');

      addBtn.addEventListener('click', addTag);
      newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addTag();
        }
      });

      // Delete tag buttons using event delegation
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-tag-btn')) {
          const tagToDelete = e.target.dataset.tag;
          
          if (confirm(`Supprimer le tag "${tagToDelete}" ?`)) {
            const config = window.ContentTypes.monster;
            const index = config.filterConfig.availableTags.indexOf(tagToDelete);
            
            if (index > -1) {
              // Remove from available tags
              config.filterConfig.availableTags.splice(index, 1);
              
              // Remove the tag from all monsters
              if (window.MONSTRES) {
                window.MONSTRES.forEach(monster => {
                  if (monster.tags && monster.tags.includes(tagToDelete)) {
                    monster.tags = monster.tags.filter(tag => tag !== tagToDelete);
                    // Ensure monster has at least one tag if possible
                    if (monster.tags.length === 0 && config.filterConfig.availableTags.length > 0) {
                      monster.tags = [config.filterConfig.availableTags[0]];
                    }
                  }
                });
              }
              
              // Save changes
              EventBus.emit(Events.STORAGE_SAVE);
              
              // Refresh modal and monsters page
              modal.close();
              this.showMonsterTagsManagement();
              
              // Force complete page reload for monsters page
              if (window.location.hash === '#/monstres') {
                UIUtilities.forcePageRefresh();
              }
              
              UIUtilities.showNotification(`✅ Tag "${tagToDelete}" supprimé avec succès`, 'success');
            }
          }
        }
      });
    },

    /**
     * Setup table tresor tags modal events
     */
    setupTableTresorTagsModalEvents(modal, availableTags) {
      // Close modal
      const closeButtons = modal.querySelectorAll('.modal-close-btn');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          modal.close();
        });
      });

      // Add new tag
      const addTag = () => {
        const newTagInput = modal.querySelector('#newTableTresorTag');
        const newTag = newTagInput.value.trim();
        
        if (newTag && !availableTags.includes(newTag)) {
          // Add to available tags
          availableTags.push(newTag);
          
          // Save in TABLES_TRESORS metadata for persistence
          if (window.TABLES_TRESORS) {
            if (!window.TABLES_TRESORS._metadata) {
              window.TABLES_TRESORS._metadata = {};
            }
            window.TABLES_TRESORS._metadata.availableTags = [...availableTags];
          }
          
          // Save changes
          EventBus.emit(Events.STORAGE_SAVE);
          
          // Refresh modal and page
          modal.close();
          this.showTableTresorTagsManagement();
          
          // Force refresh of the tables-tresors page
          if (window.location.hash === '#/tables-tresors') {
            UIUtilities.forcePageRefresh();
          }
          
          UIUtilities.showNotification(`Tag "${newTag}" ajouté avec succès`, 'success');
        } else if (newTag && availableTags.includes(newTag)) {
          UIUtilities.showNotification('Ce tag existe déjà', 'error');
        }
      };

      const addBtn = modal.querySelector('#addTableTresorTagBtn');
      const newTagInput = modal.querySelector('#newTableTresorTag');

      addBtn.addEventListener('click', addTag);
      newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addTag();
        }
      });

      // Delete tag functionality
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-tag-btn')) {
          const tagToDelete = e.target.dataset.tag;
          
          if (confirm(`Supprimer le tag "${tagToDelete}" ?`)) {
            // Remove from available tags
            const index = availableTags.indexOf(tagToDelete);
            if (index > -1) {
              availableTags.splice(index, 1);
              
              // Remove from all tables that use this tag
              if (window.TABLES_TRESORS?.categories) {
                window.TABLES_TRESORS.categories.forEach(category => {
                  category.tables.forEach(table => {
                    if (table.tags && table.tags.includes(tagToDelete)) {
                      table.tags = table.tags.filter(tag => tag !== tagToDelete);
                    }
                  });
                });
              }
              
              // Save in metadata
              if (window.TABLES_TRESORS) {
                if (!window.TABLES_TRESORS._metadata) {
                  window.TABLES_TRESORS._metadata = {};
                }
                window.TABLES_TRESORS._metadata.availableTags = [...availableTags];
              }
              
              // Save changes
              EventBus.emit(Events.STORAGE_SAVE);
              
              // Close and refresh
              modal.close();
              
              // Force page reload
              if (window.location.hash === '#/tables-tresors') {
                UIUtilities.forcePageRefresh();
              }
              
              setTimeout(() => {
                this.showTableTresorTagsManagement();
              }, 200);
              
              UIUtilities.showNotification(`✅ Tag "${tagToDelete}" supprimé avec succès`, 'success');
            }
          }
        }
      });
    }
  };

})();