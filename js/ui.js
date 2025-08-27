// ============================================================================
// JDR-BAB APPLICATION - UI MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // UI INTERACTIONS MODULE
  // ========================================
  JdrApp.modules.ui = {
    _initialized: false,
    
    init() {
      // Prevent multiple initialization to avoid duplicate event listeners
      if (this._initialized) {
        return;
      }
      
      this.setupEventListeners();
      this.setupSearch();
      this.setupModals();
      this.setupResponsive();
      this.setupNewPageHandler();
      this._initialized = true;
    },

    setupEventListeners() {
      // Content management via EventBus
      EventBus.on(Events.CONTENT_ADD, (payload) => {
        this.handleContentAdd(payload.type, payload.category, payload.item);
      });

      EventBus.on(Events.CONTENT_DELETE, (payload) => {
        this.handleContentDelete(payload.type, payload.category, payload.item);
      });

      EventBus.on(Events.CONTENT_MOVE, (payload) => {
        this.handleContentMove(payload.type, payload.category, payload.itemName, payload.direction);
      });

      // UI event handlers
      this.setupContentHandlers();
      this.setupTagsManagement();
    },

    setupContentHandlers() {
      // Generic content addition
      JdrApp.utils.events.register('click', '[class$="-add"]', (e) => {
        const type = this.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        if (type && categoryName) {
          this.addContent(type, categoryName);
        }
      });

      // Generic content deletion - using multiple specific selectors
      JdrApp.utils.events.register('click', '.spell-delete, .don-delete, .delete-subclass-btn, .objet-delete, .monster-delete, .tableTresor-delete', (e) => {
        const type = this.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        // Handle different dataset attribute naming patterns
        let itemName;
        if (type === 'spell') {
          itemName = e.target.dataset.spellName;
        } else if (type === 'don') {
          itemName = e.target.dataset.donName;
        } else if (type === 'objet') {
          itemName = e.target.dataset.objetName;
        } else if (type === 'monster') {
          itemName = e.target.dataset.monsterName;
        } else if (type === 'tableTresor') {
          itemName = e.target.dataset.tableTresorName;
        } else if (type === 'class') {
          itemName = e.target.dataset.className || e.target.dataset.subclassName;
        } else {
          itemName = e.target.dataset[`${type}Name`];
        }
        
        if (type && categoryName && itemName) {
          this.deleteContent(type, categoryName, itemName);
        }
      });

      // Generic content movement
      JdrApp.utils.events.register('click', '[class*="-move-"]', (e) => {
        const type = this.extractTypeFromClass(e.target.className);
        const categoryName = e.target.dataset.categoryName;
        
        // Handle different dataset attribute naming patterns
        let itemName;
        if (type === 'spell') {
          itemName = e.target.dataset.spellName;
        } else if (type === 'don') {
          itemName = e.target.dataset.donName;
        } else if (type === 'tableTresor') {
          itemName = e.target.dataset.tableTresorName;
        } else if (type === 'class') {
          itemName = e.target.dataset.className || e.target.dataset.subclassName;
        } else {
          itemName = e.target.dataset[`${type}Name`];
        }
        
        const direction = e.target.className.includes('move-up') ? -1 : 1;
        
        if (type && categoryName && itemName) {
          this.moveContent(type, categoryName, itemName, direction);
        }
      });

      // Filter manager button for objects
      JdrApp.utils.events.register('click', '.filter-manager-btn', () => {
        this.showFilterManagementModal();
      });

      // Tags manager button for objects
      JdrApp.utils.events.register('click', '.tags-manager-btn', () => {
        this.showTagsManagementModal();
      });

      // Filter chip toggle for objects
      JdrApp.utils.events.register('click', '.filter-chip', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleFilter(e.target);
      });

      // Select all tags button
      JdrApp.utils.events.register('click', '#select-all-tags', () => {
        this.selectAllTags();
      });

      // Select no tags button
      JdrApp.utils.events.register('click', '#select-no-tags', () => {
        this.selectNoTags();
      });

      // ID search functionality (only on Enter key or button click)
      JdrApp.utils.events.register('keydown', '#id-search-input', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performIdSearch(e.target.value);
        } else if (e.key === 'Escape') {
          e.target.value = '';
          this.clearIdSearch();
        }
      });

      JdrApp.utils.events.register('click', '#clear-id-search', () => {
        this.clearIdSearch();
      });

      // Spell element change
      JdrApp.utils.events.register('change', '.spell-element-selector select', (e) => {
        this.updateSpellElement(e.target);
      });

      // Paragraph addition
      JdrApp.utils.events.register('click', '.add-paragraph-btn', (e) => {
        const target = e.target.dataset.target;
        this.addParagraph(target, e.target);
      });

      // Section deletion for static pages
      JdrApp.utils.events.register('click', '.section-delete', (e) => {
        const sectionName = e.target.dataset.sectionName;
        if (sectionName && confirm(`Supprimer la section "${sectionName}" ?`)) {
          this.deleteSection(sectionName, e.target);
        }
      });

      // Dev toolbox category creation buttons
      JdrApp.utils.events.register('click', '#addSpellCategory', () => {
        this.createNewCategory('spell');
      });

      JdrApp.utils.events.register('click', '#addDonCategory', () => {
        this.createNewCategory('don');
      });

      // Category deletion buttons
      JdrApp.utils.events.register('click', '[class$="-category-delete"]', (e) => {
        const categoryName = e.target.dataset.categoryName;
        const categoryType = e.target.dataset.categoryType;
        
        if (categoryName && categoryType) {
          this.deleteCategory(categoryType, categoryName);
        }
      });

      // Filter management for objects page
      JdrApp.utils.events.register('click', '.filter-manager-btn', (e) => {
        this.showFilterManagementModal();
      });

      // Tables de trésors - Edition des fourchettes
      JdrApp.utils.events.register('click', '.edit-fourchette-btn', (e) => {
        const tableName = e.target.dataset.tableName;
        const fourchetteIndex = parseInt(e.target.dataset.fourchetteIndex);
        
        if (tableName && fourchetteIndex >= 0) {
          this.editFourchette(tableName, fourchetteIndex);
        }
      });

      // Tables de trésors - Suppression des fourchettes
      JdrApp.utils.events.register('click', '.delete-fourchette-btn', (e) => {
        const tableName = e.target.dataset.tableName;
        const fourchetteIndex = parseInt(e.target.dataset.fourchetteIndex);
        
        if (tableName && fourchetteIndex >= 0) {
          if (confirm('Êtes-vous sûr de vouloir supprimer cette fourchette ?')) {
            this.deleteFourchette(tableName, fourchetteIndex);
          }
        }
      });

      // Tables de trésors - Ajout de fourchettes
      JdrApp.utils.events.register('click', '.table-tresor-add-fourchette', (e) => {
        const tableName = e.target.dataset.tableTresorName;
        
        if (tableName) {
          this.addFourchette(tableName);
        }
      });

      // Tables de trésors - Prévisualisation des objets
      JdrApp.utils.events.register('click', '.object-preview-link', (e) => {
        e.preventDefault();
        const objetNumero = parseInt(e.target.dataset.objectNumero);
        
        if (objetNumero) {
          this.showObjectPreview(objetNumero);
        }
      });

      // Filter chip toggling (REMOVED - duplicate listener that was causing double toggle)

      // Element selector for spells (dev mode)
      JdrApp.utils.events.register('change', '.spell-element-selector', (e) => {
        this.updateSpellElement(e.target);
      });
    },

    setupTagsManagement() {
      // Handle manage tags button clicks
      JdrApp.utils.events.register('click', '.manage-tags-btn', (e) => {
        const contentType = e.target.dataset.contentType;
        if (contentType === 'monster') {
          this.showMonsterTagsManagement();
        } else if (contentType === 'tableTresor') {
          this.showTableTresorTagsManagement();
        }
      });
    },

    showMonsterTagsManagement() {
      const config = window.ContentTypes.monster;
      if (!config || !config.filterConfig) {
        this.showNotification('Configuration des tags monstres non trouvée', 'error');
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

    showTableTresorTagsManagement() {
      // Priority: Load tags from metadata, then config, then fallback
      let availableTags = [];
      
      if (window.TABLES_TRESORS?._metadata?.availableTags) {
        availableTags = window.TABLES_TRESORS._metadata.availableTags;
      } else {
        // Initialize metadata if missing (shouldn't happen normally)
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
      
      // Use native dialog showModal for proper z-index
      modal.showModal();
    },

    createMonsterTagsModal(availableTags) {
      const modal = document.createElement('dialog');
      modal.id = 'monsterTagsModal';
      modal.style.cssText = `
        max-width: 500px;
        width: 90%;
        padding: 0;
        border: none;
        border-radius: 12px;
        background: transparent;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      `;
      
      modal.innerHTML = `
        <div style="background: var(--paper); padding: 24px; border-radius: 12px; border: 3px solid var(--bronze);">
          <h3 style="margin: 0 0 16px 0; color: var(--bronze); display: flex; align-items: center; gap: 8px;">
            🏷️ Gérer les tags - Monstres
          </h3>
          <p style="margin: 0 0 20px 0; color: var(--text-muted);">
            Ajoutez, modifiez ou supprimez les tags disponibles pour le filtrage des monstres.
          </p>
          
          <div class="current-tags" style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: var(--bronze);">Tags actuels:</h4>
            <div class="tags-list" style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${availableTags.map(tag => `
                <div class="tag-item" style="display: flex; align-items: center; background: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 8px 12px;">
                  <span class="tag-name" style="margin-right: 12px; font-weight: 600; color: #333;">${tag}</span>
                  <button 
                    class="delete-monster-tag-btn" 
                    data-tag="${tag}" 
                    type="button"
                    style="background: #dc2626; color: white; border: none; padding: 6px 10px; font-size: 14px; border-radius: 4px; cursor: pointer;"
                    title="Supprimer ${tag}"
                  >🗑️</button>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="add-tag-section" style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: var(--bronze);">Ajouter un nouveau tag:</h4>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="text" id="new-monster-tag-input" placeholder="Nom du nouveau tag" style="flex: 1; padding: 8px 12px; border: 2px solid var(--rule); border-radius: 6px; font-size: 14px;">
              <button class="btn btn-primary" id="add-monster-tag-btn" style="padding: 8px 16px; background: var(--bronze); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">➕ Ajouter</button>
            </div>
          </div>
          
          <div style="text-align: right; padding-top: 20px; border-top: 2px solid var(--rule);">
            <button type="button" class="btn modal-close" style="padding: 8px 16px; background: var(--paper-light); border: 2px solid var(--rule); border-radius: 6px; cursor: pointer;">Fermer</button>
          </div>
        </div>
      `;

      // Setup event handlers for this modal
      this.setupMonsterTagsModalEvents(modal, availableTags);

      return modal;
    },

    createTableTresorTagsModal(availableTags) {
      const modal = document.createElement('dialog');
      modal.id = 'tableTresorTagsModal';
      modal.style.cssText = `
        max-width: 500px;
        width: 90%;
        border: 2px solid var(--gold);
        border-radius: 12px;
        padding: 0;
        background: #2a2a2a;
        color: #ffffff;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
      `;
      
      const tagsListHTML = availableTags.map(tag => `
        <div class="tag-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin: 4px 0; background: #3a3a3a; border-radius: 6px; border-left: 4px solid var(--gold);">
          <span style="font-weight: 500; color: #ffffff;">${tag}</span>
          <button type="button" class="delete-table-tresor-tag-btn" data-tag="${tag}" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 0.8em; cursor: pointer;" title="Supprimer ce tag">🗑️</button>
        </div>
      `).join('');
      
      modal.innerHTML = `
        <div style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: var(--gold); display: flex; align-items: center; gap: 8px;">
              💎 <span>Gérer les Tags - Tables de Trésors</span>
            </h3>
            <button type="button" class="modal-close-btn" style="background: none; border: none; font-size: 1.5em; cursor: pointer; color: var(--text-color);" title="Fermer">×</button>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Ajouter un nouveau tag :</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="newTableTresorTagInput" placeholder="Ex: Boss, Mythique..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--gold); border-radius: 6px; background: #1a1a1a; color: #ffffff;">
              <button type="button" id="addTableTresorTagBtn" style="background: var(--accent); color: white; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-weight: 500;">
                ➕ Ajouter
              </button>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: var(--gold);">Tags existants :</h4>
            <div id="tableTresorTagsList" style="max-height: 300px; overflow-y: auto;">
              ${tagsListHTML}
            </div>
          </div>
          
          <div style="text-align: center; padding-top: 16px; border-top: 1px solid var(--rule);">
            <button type="button" class="modal-close-btn" style="background: var(--secondary-color); color: white; border: none; border-radius: 6px; padding: 10px 20px; cursor: pointer; font-weight: 500;">
              Fermer
            </button>
          </div>
        </div>
      `;
      
      // Setup event handlers for this modal
      this.setupTableTresorTagsModalEvents(modal, availableTags);

      return modal;
    },

    setupMonsterTagsModalEvents(modal, availableTags) {
      // Close modal
      modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.close();
      });

      // Add new tag
      const addBtn = modal.querySelector('#add-monster-tag-btn');
      const newTagInput = modal.querySelector('#new-monster-tag-input');
      
      const addTag = () => {
        const newTag = newTagInput.value.trim();
        if (newTag && !availableTags.includes(newTag)) {
          window.ContentTypes.monster.filterConfig.availableTags.push(newTag);
          modal.close();
          this.showMonsterTagsManagement(); // Refresh modal
          this.showNotification(`Tag "${newTag}" ajouté avec succès`, 'success');
        } else if (newTag && availableTags.includes(newTag)) {
          this.showNotification('Ce tag existe déjà', 'error');
        }
      };

      addBtn.addEventListener('click', addTag);
      newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addTag();
        }
      });

      // Delete tag buttons using event delegation
      modal.addEventListener('click', (e) => {        
        // Check if the clicked element is a delete button
        if (e.target && (e.target.classList.contains('delete-monster-tag-btn') || 
            e.target.closest('.delete-monster-tag-btn'))) {
          
          e.preventDefault();
          e.stopPropagation();
          
          // Get the button element (might be clicked on emoji inside)
          const button = e.target.classList.contains('delete-monster-tag-btn') ? 
                        e.target : e.target.closest('.delete-monster-tag-btn');
          
          const tagToDelete = button.dataset.tag;
          
          if (!tagToDelete) {
            console.error('No tag found on delete button:', button);
            this.showNotification('❌ Erreur: tag non trouvé', 'error');
            return;
          }
          
          const config = window.ContentTypes.monster;
          if (!config || !config.filterConfig || !config.filterConfig.availableTags) {
            console.error('Monster config not found or invalid');
            this.showNotification('❌ Configuration des monstres non trouvée', 'error');
            return;
          }
          
          const index = config.filterConfig.availableTags.indexOf(tagToDelete);
          
          if (index > -1) {
            // Confirm deletion
            if (confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tagToDelete}" ?\n\nCela supprimera aussi ce tag de tous les monstres qui l'utilisent.`)) {
              // Remove from available tags
              config.filterConfig.availableTags.splice(index, 1);
              
              // Remove the tag from all monsters
              if (window.MONSTRES && Array.isArray(window.MONSTRES)) {
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
              
              // Update filter state to remove deleted tag
              if (window.MONSTRES_FILTER_STATE && window.MONSTRES_FILTER_STATE.visibleTags) {
                window.MONSTRES_FILTER_STATE.visibleTags = 
                  window.MONSTRES_FILTER_STATE.visibleTags.filter(tag => tag !== tagToDelete);
                // Ensure at least one visible tag remains
                if (window.MONSTRES_FILTER_STATE.visibleTags.length === 0 && 
                    config.filterConfig.availableTags.length > 0) {
                  window.MONSTRES_FILTER_STATE.visibleTags = [config.filterConfig.availableTags[0]];
                }
              }
              
              // Save the updated availableTags in the monster data for persistence
              if (window.MONSTRES && Array.isArray(window.MONSTRES)) {
                // Store availableTags in the first monster's metadata or create a special entry
                if (!window.MONSTRES._metadata) {
                  window.MONSTRES._metadata = {};
                }
                window.MONSTRES._metadata.availableTags = [...config.filterConfig.availableTags];
              }
              
              // Save changes to storage
              EventBus.emit(Events.STORAGE_SAVE);
              
              // Refresh modal and monsters page
              modal.close();
              this.showMonsterTagsManagement();
              
              // Force complete page reload for monsters page to update filters
              const currentPage = window.location.hash.replace('#/', '');
              if (currentPage === 'monstres') {
                // Trigger router to completely rebuild the page
                setTimeout(() => {
                  if (JdrApp.modules.router && JdrApp.modules.router.show) {
                    JdrApp.modules.router.show('monstres');
                  }
                }, 100);
              }
              
              this.showNotification(`✅ Tag "${tagToDelete}" supprimé avec succès`, 'success');
            }
          } else {
            console.error(`Tag "${tagToDelete}" not found in available tags`);
            this.showNotification(`❌ Tag "${tagToDelete}" non trouvé`, 'error');
          }
        }
      });
    },

    setupTableTresorTagsModalEvents(modal, availableTags) {
      // Close modal
      const closeButtons = modal.querySelectorAll('.modal-close-btn');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          modal.close();
          modal.remove();
        });
      });

      const newTagInput = modal.querySelector('#newTableTresorTagInput');
      const addBtn = modal.querySelector('#addTableTresorTagBtn');

      const addTag = () => {
        const newTag = newTagInput.value.trim();
        
        if (newTag && !availableTags.includes(newTag)) {
          // Add to the current available tags
          availableTags.push(newTag);
          
          // Save in TABLES_TRESORS metadata for persistence (primary storage)
          if (window.TABLES_TRESORS) {
            if (!window.TABLES_TRESORS._metadata) {
              window.TABLES_TRESORS._metadata = {};
            }
            window.TABLES_TRESORS._metadata.availableTags = [...availableTags];
          }
          
          // Note: ContentTypes.tableTresor.filterConfig.availableTags removed - metadata is single source of truth
          
          // Save changes to storage
          EventBus.emit(Events.STORAGE_SAVE);
          
          // Refresh modal and tables page
          modal.close();
          this.showTableTresorTagsManagement(); // Refresh modal
          this.showNotification(`Tag "${newTag}" ajouté avec succès`, 'success');
        } else if (newTag && availableTags.includes(newTag)) {
          this.showNotification('Ce tag existe déjà', 'error');
        }
      };

      addBtn.addEventListener('click', addTag);
      newTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addTag();
        }
      });

      // Delete tag buttons using event delegation
      modal.addEventListener('click', (e) => {        
        // Check if the clicked element is a delete button
        if (e.target && (e.target.classList.contains('delete-table-tresor-tag-btn') || 
            e.target.closest('.delete-table-tresor-tag-btn'))) {
          
          e.preventDefault();
          e.stopPropagation();
          
          const deleteBtn = e.target.classList.contains('delete-table-tresor-tag-btn') 
            ? e.target 
            : e.target.closest('.delete-table-tresor-tag-btn');
          
          const tagToDelete = deleteBtn.dataset.tag;
          
          if (confirm(`Êtes-vous sûr de vouloir supprimer le tag "${tagToDelete}" ?\n\nCela supprimera le tag de tous les filtres et des tables qui l'utilisent.`)) {
            // Get current availableTags from metadata if available, otherwise from config
            let currentAvailableTags = window.TABLES_TRESORS?._metadata?.availableTags || 
                                     window.ContentTypes?.tableTresor?.filterConfig?.availableTags || 
                                     availableTags;
            
            const tagIndex = currentAvailableTags.indexOf(tagToDelete);
            
            if (tagIndex > -1) {
              // Remove from available tags
              currentAvailableTags.splice(tagIndex, 1);
              
              // Remove from all tables that use this tag
              if (window.TABLES_TRESORS?.tables) {
                window.TABLES_TRESORS.tables.forEach(table => {
                  if (table.tags && table.tags.includes(tagToDelete)) {
                    const tableTagIndex = table.tags.indexOf(tagToDelete);
                    table.tags.splice(tableTagIndex, 1);
                  }
                });
              }
              
              // Save in TABLES_TRESORS metadata for persistence (primary storage)
              if (window.TABLES_TRESORS) {
                if (!window.TABLES_TRESORS._metadata) {
                  window.TABLES_TRESORS._metadata = {};
                }
                window.TABLES_TRESORS._metadata.availableTags = [...currentAvailableTags];
              }
              
              // Note: ContentTypes backup removed - metadata is single source of truth
              
              // Clear filter state to force refresh
              if (window.TABLES_TRESORS_FILTER_STATE && window.TABLES_TRESORS_FILTER_STATE.visibleTags) {
                // Remove the deleted tag from visible tags if present  
                const visibleTagIndex = window.TABLES_TRESORS_FILTER_STATE.visibleTags.indexOf(tagToDelete);
                if (visibleTagIndex > -1) {
                  window.TABLES_TRESORS_FILTER_STATE.visibleTags.splice(visibleTagIndex, 1);
                }
              }
              
              // Save changes to storage
              EventBus.emit(Events.STORAGE_SAVE);
              
              // Close modal first 
              modal.close();
              
              // Force complete page reload for tables page to update filters
              const currentPage = window.location.hash.replace('#/', '');
              if (currentPage === 'tables-tresors') {
                // Trigger router to completely rebuild the page
                setTimeout(() => {
                  if (JdrApp.modules.router && JdrApp.modules.router.renderTablesTresorsPage) {
                    JdrApp.modules.router.renderTablesTresorsPage();
                  }
                }, 100);
              }
              
              // Refresh modal after page update
              setTimeout(() => {
                this.showTableTresorTagsManagement();
              }, 200);
              
              this.showNotification(`✅ Tag "${tagToDelete}" supprimé avec succès`, 'success');
            }
          } else {
            console.error(`Tag "${tagToDelete}" not found in available tags`);
            this.showNotification(`❌ Tag "${tagToDelete}" non trouvé`, 'error');
          }
        }
      });
    },

    extractTypeFromClass(className) {
      if (className.includes('spell')) return 'spell';
      if (className.includes('don')) return 'don';
      if (className.includes('class')) return 'class';
      if (className.includes('objet')) return 'objet';
      if (className.includes('monster')) return 'monster';
      if (className.includes('tableTresor')) return 'tableTresor';
      return null;
    },

    deleteContent(type, categoryName, itemName) {
      if (!confirm(`Supprimer "${itemName}" ?`)) return;

      const success = ContentFactory.deleteItem(type, categoryName, itemName);
      
      if (success) {
        EventBus.emit(Events.PAGE_RENDER, {
          type: 'category',
          categoryType: type,
          category: ContentFactory.getEntity(type).findCategory(categoryName)
        });
        
        this.showNotification('🗑 Élément supprimé');
      }
    },

    moveContent(type, categoryName, itemName, direction) {
      const success = ContentFactory.moveItem(type, categoryName, itemName, direction);
      
      if (success) {
        EventBus.emit(Events.PAGE_RENDER, {
          type: 'category',
          categoryType: type,
          category: ContentFactory.getEntity(type).findCategory(categoryName)
        });
        
        const directionText = direction > 0 ? 'descendu' : 'monté';
        this.showNotification(`🔄 Élément ${directionText}`);
      }
    },

    addParagraph(target, button) {
      // Handle different types of additions based on target
      if (target === 'section') {
        this.addNewSection(button);
      } else {
        this.addParagraphToSection(target, button);
      }
    },

    addNewSection(button) {
      // Generate a unique but readable ID
      const pageId = this.getCurrentPageId();
      const sectionCount = this.countExistingSections();
      const sectionId = `${pageId}-new-${sectionCount + 1}-${Date.now()}`;
      
      const newSection = document.createElement('div');
      newSection.className = 'card editable-section';
      newSection.dataset.sectionType = 'card';
      newSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="generic" data-edit-section="${sectionId}-title">Nouvelle section</h3>
            <button class="edit-btn edit-title-btn" title="Éditer le titre">✏️</button>
          </div>
        </div>
        <div style="position:relative;">
          <div class="editable" data-edit-type="generic" data-edit-section="${sectionId}">
            <p>Contenu de la nouvelle section.</p>
          </div>
          <button class="edit-btn edit-section-btn" title="Éditer cette section">✏️</button>
        </div>
        <div style="margin-top: 1rem; text-align: center;">
          <button class="section-delete btn small" data-section-name="Nouvelle section" type="button" style="background: #ff6b6b; color: white;">🗑 Supprimer section</button>
        </div>
      `;
      
      button.parentNode.insertBefore(newSection, button);
      
      // Immediately save the new section to JSON
      this.saveNewSectionToJSON(sectionId, "Nouvelle section", "<p>Contenu de la nouvelle section.</p>");
      
      // No need to recalculate indices - unique IDs prevent conflicts
      // this.recalculateSectionIndices();
      
      // Trigger persistent storage save
      this.triggerDataSave();
      
      this.showNotification('➕ Nouvelle section ajoutée et sauvegardée');
    },

    addParagraphToSection(target, button) {
      // Generate a unique but readable ID
      const pageId = this.getCurrentPageId();
      const sectionCount = this.countExistingSections();
      const paragraphId = `${pageId}-para-${sectionCount + 1}-${Date.now()}`;
      
      const container = document.createElement('div');
      container.className = 'editable-paragraph card';
      container.dataset.sectionType = 'card';
      container.style.position = 'relative';
      container.style.marginTop = '1rem';
      
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 class="editable editable-card-title" data-edit-type="generic" data-edit-section="${paragraphId}-title">Nouveau paragraphe</h3>
            <button class="edit-btn edit-title-btn" title="Éditer le titre">✏️</button>
          </div>
        </div>
        <div style="position:relative;">
          <div class="editable" data-edit-type="generic" data-edit-section="${paragraphId}">
            <p>Contenu du nouveau paragraphe.</p>
          </div>
          <button class="edit-btn edit-section-btn" title="Éditer cette section">✏️</button>
        </div>
        <div style="margin-top: 1rem; text-align: center;">
          <button class="section-delete btn small" data-section-name="Nouveau paragraphe" type="button" style="background: #ff6b6b; color: white;">🗑 Supprimer section</button>
        </div>
      `;
      
      button.parentNode.insertBefore(container, button);
      
      // Immediately save the new paragraph as a section to JSON
      this.saveNewSectionToJSON(paragraphId, "Nouveau paragraphe", "<p>Contenu du nouveau paragraphe.</p>");
      
      // No need to recalculate indices - unique IDs prevent conflicts
      // this.recalculateSectionIndices();
      
      // Trigger persistent storage save
      this.triggerDataSave();
      
      this.showNotification('➕ Paragraphe ajouté et sauvegardé');
    },

    deleteSection(sectionName, button) {
      // Find and remove the section
      const section = button.closest('.card');
      if (section) {
        // Extract the section ID from the editable elements
        const editableElement = section.querySelector('[data-edit-section]');
        let sectionId = null;
        if (editableElement) {
          sectionId = editableElement.dataset.editSection;
          // Remove "-title" suffix if present to get base ID
          if (sectionId.endsWith('-title')) {
            sectionId = sectionId.replace('-title', '');
          }
        }
        
        section.remove();
        
        // Save the deletion to JSON
        if (sectionId) {
          this.deleteSectionFromJSON(sectionId);
        }
        
        // Recalculate all section indices after deletion
        this.recalculateSectionIndices();
        
        // Trigger persistent storage save
        this.triggerDataSave();
        
        this.showNotification(`🗑️ Section "${sectionName}" supprimée et mise à jour JSON`);
      }
    },

    // ========================================
    // CONTENT MANIPULATION METHODS 
    // ========================================
    
    addContent(type, categoryName) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Create new item with default values
      const defaultItem = ContentFactory.createDefaultItem(type);
      
      // Special handling for objects and monsters (add to single array)
      if (type === 'objet') {
        if (!window.OBJETS.objets) {
          window.OBJETS.objets = [];
        }
        
        // Get next number
        const existingNumbers = window.OBJETS.objets.map(obj => obj.numero || 0);
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        defaultItem.numero = nextNumber;
        
        window.OBJETS.objets.push(defaultItem);
        this.refreshObjectsPage();
      } else if (type === 'monster') {
        if (!window.MONSTRES) {
          window.MONSTRES = [];
        }
        
        window.MONSTRES.push(defaultItem);
        this.refreshMonstersPage();
      } else {
        // Standard category-based addition
        const success = ContentFactory.addItem(type, categoryName, defaultItem);
        if (success) {
          EventBus.emit(Events.CONTENT_ADD, {
            type: type,
            category: categoryName,
            item: defaultItem
          });
          
          EventBus.emit(Events.PAGE_RENDER, {
            type: 'category',
            categoryType: type,
            category: ContentFactory.getEntity(type).findCategory(categoryName)
          });
        }
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      this.showNotification(`${config.icons.add} Nouvel élément ajouté`, 'success');
    },

    deleteContent(type, categoryName, itemName) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      if (!confirm(`Supprimer "${itemName}" ?`)) {
        return;
      }

      // Special handling for objects and monsters
      if (type === 'objet') {
        if (window.OBJETS?.objets) {
          const itemIndex = window.OBJETS.objets.findIndex(obj => obj.nom === itemName);
          if (itemIndex >= 0) {
            window.OBJETS.objets.splice(itemIndex, 1);
            this.refreshObjectsPage();
          }
        }
      } else if (type === 'monster') {
        if (window.MONSTRES) {
          const itemIndex = window.MONSTRES.findIndex(monster => monster.nom === itemName);
          if (itemIndex >= 0) {
            window.MONSTRES.splice(itemIndex, 1);
            this.refreshMonstersPage();
          }
        }
      } else {
        // Standard category-based deletion
        const success = ContentFactory.deleteItem(type, categoryName, itemName);
        if (success) {
          EventBus.emit(Events.CONTENT_DELETE, {
            type: type,
            category: categoryName,
            item: itemName
          });
          
          EventBus.emit(Events.PAGE_RENDER, {
            type: 'category',
            categoryType: type,
            category: ContentFactory.getEntity(type).findCategory(categoryName)
          });
        }
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      this.showNotification(`${config.icons.delete} "${itemName}" supprimé`, 'success');
    },

    moveContent(type, categoryName, itemName, direction) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Special handling for objects
      if (type === 'objet') {
        if (window.OBJETS?.objets) {
          const itemIndex = window.OBJETS.objets.findIndex(obj => obj.nom === itemName);
          if (itemIndex >= 0) {
            const newIndex = itemIndex + direction;
            if (newIndex >= 0 && newIndex < window.OBJETS.objets.length) {
              const item = window.OBJETS.objets.splice(itemIndex, 1)[0];
              window.OBJETS.objets.splice(newIndex, 0, item);
              this.refreshObjectsPage();
            }
          }
        }
      } else {
        // Standard category-based movement
        const success = ContentFactory.moveItem(type, categoryName, itemName, direction);
        if (success) {
          EventBus.emit(Events.CONTENT_MOVE, {
            type: type,
            category: categoryName,
            itemName: itemName,
            direction: direction
          });
          
          EventBus.emit(Events.PAGE_RENDER, {
            type: 'category',
            categoryType: type,
            category: ContentFactory.getEntity(type).findCategory(categoryName)
          });
        }
      }
      
      EventBus.emit(Events.STORAGE_SAVE);
      const directionText = direction > 0 ? 'descendu' : 'monté';
      this.showNotification(`🔄 "${itemName}" ${directionText}`, 'success');
    },

    handleContentAdd(type, category, item) {
      // Additional handling after content is added
      setTimeout(() => {
        if (JdrApp.modules.renderer?.autoLoadImages) {
          JdrApp.modules.renderer.autoLoadImages();
        }
      }, 100);
    },

    handleContentDelete(type, category, item) {
      // Cleanup after content deletion
    },

    handleContentMove(type, category, itemName, direction) {
      // Additional handling after content is moved
    },

    setupSearch() {
      const searchInput = JdrApp.utils.dom.$('#search');
      const clearButton = JdrApp.utils.dom.$('#clear');
      let searchTimeout;
      
      if (searchInput) {
        // Only search on Enter key press
        JdrApp.utils.events.register('keydown', '#search', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length > 0) {
              this.performSearch(query);
            } else {
              this.clearMainSearchResults();
            }
          } else if (e.key === 'Escape') {
            this.clearMainSearchResults();
            e.target.value = '';
            e.target.blur();
          }
        });
      }
      
      if (clearButton) {
        JdrApp.utils.events.register('click', '#clear', () => {
          if (searchInput) {
            searchInput.value = '';
            this.clearMainSearchResults();
          }
        });
      }

      // Remove click outside handler since we're not using dropdown anymore
      // JdrApp.utils.events.register('click', 'body', (e) => {
      //   if (!e.target.closest('.searchbar') && !e.target.closest('#search-results')) {
      //     this.hideSearchResults();
      //   }
      // });

      // Remove EventBus listener that may cause issues
      // EventBus.on(Events.SEARCH_PERFORM, (payload) => {
      //   this.performSearch(payload.query);
      // });
    },

    performSearch(query) {
      const normalizedQuery = query.toLowerCase().trim();
      
      if (!normalizedQuery) {
        this.showAllContent();
        this.clearMainSearchResults();
        return;
      }

      // Search without minimum character limit since user has to press Enter
      const results = this.searchInData(normalizedQuery);
      this.displaySearchResultsInMain(results, normalizedQuery);
      
      // Keep existing TOC search for compatibility
      this.searchInTOC(normalizedQuery);
    },

    searchInData(query) {
      const results = [];
      
      // Search in SORTS
      if (window.SORTS) {
        window.SORTS.forEach(category => {
          if (category.sorts) {
            category.sorts.forEach(sort => {
              if (this.matchesSearch(sort, query)) {
                const url = `#/sorts-${JdrApp.utils.data.sanitizeId(category.nom)}`;
                
                results.push({
                  type: 'spell',
                  category: category.nom,
                  item: sort,
                  url: url,
                  summary: this.generateSpellSummary(sort)
                });
              }
            });
          }
        });
      }

      // Search in DONS
      if (window.DONS) {
        window.DONS.forEach(category => {
          if (category.dons) {
            category.dons.forEach(don => {
              if (this.matchesSearch(don, query)) {
                results.push({
                  type: 'don',
                  category: category.nom,
                  item: don,
                  url: `#/dons-${JdrApp.utils.data.sanitizeId(category.nom)}`,
                  summary: this.generateDonSummary(don)
                });
              }
            });
          }
        });
      }

      // Search in CLASSES
      if (window.CLASSES) {
        window.CLASSES.forEach(classe => {
          if (this.matchesSearch(classe, query)) {
            results.push({
              type: 'class',
              category: null,
              item: classe,
              url: `#/${JdrApp.utils.data.sanitizeId(classe.nom)}`,
              summary: this.generateClassSummary(classe)
            });
          }
          
          // Search in subclasses
          if (classe.sousClasses) {
            classe.sousClasses.forEach(sousClasse => {
              if (this.matchesSearch(sousClasse, query)) {
                results.push({
                  type: 'subclass',
                  category: classe.nom,
                  item: sousClasse,
                  url: `#/${JdrApp.utils.data.sanitizeId(classe.nom)}`,
                  summary: this.generateSubclassSummary(sousClasse, classe.nom)
                });
              }
            });
          }
        });
      }

      // Search in static pages
      this.searchInStaticPages(query, results);
      
      return results.slice(0, 10); // Limit to 10 results
    },

    searchInStaticPages(query, results) {
      // Search in static pages data
      if (window.STATIC_PAGES) {
        Object.keys(window.STATIC_PAGES).forEach(pageId => {
          const pageData = window.STATIC_PAGES[pageId];
          if (this.matchesStaticPage(pageData, query)) {
            results.push({
              type: 'staticPage',
              category: null,
              item: pageData,
              url: `#/${pageId}`,
              summary: this.generateStaticPageSummary(pageData)
            });
          }
        });
      }

      // Also search in static page config if available
      if (window.STATIC_PAGE_CONFIG?.pages) {
        window.STATIC_PAGE_CONFIG.pages.forEach(pageConfig => {
          if (pageConfig.active && this.matchesPageConfig(pageConfig, query)) {
            // Only add if we haven't already found this page
            const alreadyExists = results.some(r => 
              r.type === 'staticPage' && r.url === `#/${pageConfig.id}`
            );
            
            if (!alreadyExists) {
              results.push({
                type: 'staticPage',
                category: null,
                item: { 
                  title: pageConfig.title, 
                  page: pageConfig.id,
                  description: `Page sur ${pageConfig.title.toLowerCase()}`
                },
                url: `#/${pageConfig.id}`,
                summary: this.generatePageConfigSummary(pageConfig)
              });
            }
          }
        });
      }
    },

    matchesStaticPage(pageData, query) {
      const searchText = [
        pageData.title || '',
        pageData.page || '',
        this.extractStaticPageContent(pageData.sections || [])
      ].join(' ').toLowerCase();
      
      return searchText.includes(query);
    },

    matchesPageConfig(pageConfig, query) {
      const searchText = [
        pageConfig.title || '',
        pageConfig.id || ''
      ].join(' ').toLowerCase();
      
      return searchText.includes(query);
    },

    extractStaticPageContent(sections) {
      return sections.map(section => {
        let content = '';
        if (section.content) {
          if (typeof section.content === 'string') {
            content += section.content;
          } else if (section.content.content) {
            // New HTML format: extract text from HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = section.content.content;
            content += tempDiv.textContent || tempDiv.innerText || '';
          } else if (section.content.items && Array.isArray(section.content.items)) {
            // Legacy format
            content += section.content.items.join(' ');
          }
        }
        return content;
      }).join(' ');
    },

    matchesSearch(item, query) {
      // Fonction pour nettoyer le HTML et extraire le texte
      const stripHtml = (text) => {
        if (!text) return '';
        if (typeof text !== 'string') text = String(text);
        return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      };

      // Fonction pour traiter les listes/arrays
      const processArray = (arr) => {
        if (!arr) return '';
        if (Array.isArray(arr)) {
          return arr.map(item => stripHtml(item)).join(' ');
        }
        return stripHtml(arr);
      };

      // Collecter TOUS les champs textuels possibles
      const searchFields = [
        // Champs communs
        item.nom,
        item.description,
        item.prerequis,
        item.resume,
        
        // Champs spécifiques aux sorts
        item.element,
        item.portee,
        item.tempsIncantation,
        item.coutMana,
        item.resistance,
        item.effetNormal,
        item.effetCritique,
        
        // Champs spécifiques aux dons
        item.cout,
        
        // Champs spécifiques aux classes/sous-classes
        item.progression,
        processArray(item.capacites),
        
        // Champs spécifiques aux objets
        item.effet,
        item.prix,
        item.poids,
        item.tags ? item.tags.join(' ') : '',
        
        // Champs de statistiques (si c'est un objet)
        item.base ? Object.entries(item.base || {}).map(([key, value]) => `${key} ${value}`).join(' ') : '',
        
        // Autres champs possibles
        item.title,
        item.content,
        item.type
      ];

      // Joindre tous les champs et nettoyer
      const searchText = searchFields
        .filter(field => field !== null && field !== undefined)
        .map(field => stripHtml(field))
        .join(' ')
        .toLowerCase();
      
      // Chercher chaque mot de la requête
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      // Tous les mots doivent être trouvés (recherche ET logique)
      return queryWords.every(word => searchText.includes(word));
    },

    generateSpellSummary(spell) {
      // Strip HTML tags from fields to avoid breaking template
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `🔮 ${stripHtml(spell.nom)} - ${stripHtml(spell.prerequis || 'Aucun prérequis')} | ${stripHtml(spell.coutMana || 'Coût inconnu')}`;
    },

    generateDonSummary(don) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `🏆 ${stripHtml(don.nom)} - ${stripHtml(don.prerequis || 'Aucun prérequis')} | ${stripHtml(don.cout || 'Coût inconnu')}`;
    },

    generateClassSummary(classe) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `⚔️ ${stripHtml(classe.nom)} - ${stripHtml(classe.resume || 'Classe de combat')}`;
    },

    generateSubclassSummary(sousClasse, parentClass) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `⚡ ${stripHtml(sousClasse.nom)} (${stripHtml(parentClass)}) - Sous-classe spécialisée`;
    },

    generateStaticPageSummary(pageData) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `📄 ${stripHtml(pageData.title)} - ${stripHtml(pageData.description || 'Page d\'information du jeu')}`;
    },

    generatePageConfigSummary(pageConfig) {
      const stripHtml = (text) => {
        if (!text) return '';
        return String(text).replace(/<[^>]*>/g, '').trim();
      };
      
      return `📄 ${stripHtml(pageConfig.title)} - Guide et informations sur ${stripHtml(pageConfig.title.toLowerCase())}`;
    },

    slugify(text) {
      return text.toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    },

    showAllContent() {
      JdrApp.utils.dom.$$('article, .toc a').forEach(el => {
        el.style.display = '';
      });
    },

    displaySearchResultsInMain(results, query) {
      const main = document.querySelector('main');
      if (!main) return;

      // Create search results page content
      const searchPageHTML = this.generateSearchResultsPage(results, query);
      
      // Replace main content with search results
      main.innerHTML = searchPageHTML;
      
      // Quick debug to see card dimensions
      setTimeout(() => {
        const cards = main.querySelectorAll('.search-result-card');
        console.log('Cards found:', cards.length);
        cards.forEach((card, i) => {
          console.log(`Card ${i+1} dimensions:`, {
            height: card.offsetHeight,
            width: card.offsetWidth,
            display: getComputedStyle(card).display,
            visibility: getComputedStyle(card).visibility
          });
        });
      }, 100);
      
      // Setup click handlers for results
      this.setupMainSearchHandlers();
      
      // Also setup direct handlers as fallback
      this.setupDirectHandlers();
    },

    generateSearchResultsPage(results, query) {
      if (results.length === 0) {
        return `
          <div class="search-page">
            <div class="search-page-header">
              <h1>🔍 Recherche: "${query}"</h1>
              <p class="search-no-results">Aucun résultat trouvé</p>
              <button class="btn small" onclick="JdrApp.modules.ui.clearMainSearchResults()">
                ← Retour au sommaire
              </button>
            </div>
          </div>
        `;
      }
      
      let resultsHTML = '';
      
      try {
        resultsHTML = results.map((result, index) => {
          const itemName = result.item.nom || result.item.title || 'Sans nom';
          
          
          // Generate preview safely
          let preview;
          try {
            preview = this.generatePreview(result.item, result.type);
          } catch (previewError) {
            console.error('Preview error:', previewError);
            preview = '<div class="preview-field">Erreur dans l\'aperçu</div>';
          }
          
          // Escape potentially problematic text
          const escapeAttr = (text) => {
            if (!text) return '';
            return String(text).replace(/"/g, '&quot;');
          };
          
          const escapeText = (text) => {
            if (!text) return '';
            return String(text)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          };

          const cardHTML = `
            <article class="search-result-card" data-url="${result.url}">
              <div class="search-result-header">
                <h3>${this.getTypeIcon(result.type)} ${itemName}</h3>
                <div class="search-result-type">${this.getTypeName(result.type)}</div>
              </div>
              <div class="search-result-content">
                <div class="search-result-summary">${escapeText(result.summary || 'Pas de résumé')}</div>
                ${result.category ? `<div class="search-result-category">📂 Catégorie: ${escapeText(result.category)}</div>` : ''}
                <div class="search-result-preview">
                  ${preview}
                </div>
              </div>
              <div class="search-result-footer">
                <button class="btn small search-result-btn" data-url="${result.url}">
                  Voir la page →
                </button>
              </div>
            </article>
          `;
          
          return cardHTML;
        }).join('');
      } catch (error) {
        console.error('Error generating results HTML:', error);
        resultsHTML = '<div class="error">Erreur lors de la génération des résultats</div>';
      }

      const finalHTML = `
        <div class="search-page">
          <div class="search-page-header">
            <h1>🔍 Recherche: "${query}"</h1>
            <p class="search-results-count">${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}</p>
            <button class="btn small" onclick="JdrApp.modules.ui.clearMainSearchResults()">
              ← Retour au sommaire
            </button>
          </div>
          <div class="search-results-grid">
            ${resultsHTML}
          </div>
        </div>
      `;
      
      return finalHTML;
    },

    getTypeIcon(type) {
      const icons = {
        'spell': '🔮',
        'don': '🏆', 
        'class': '⚔️',
        'subclass': '⚡',
        'staticPage': '📄'
      };
      return icons[type] || '📄';
    },

    getTypeName(type) {
      const names = {
        'spell': 'Sort',
        'don': 'Don',
        'class': 'Classe',
        'subclass': 'Sous-classe',
        'staticPage': 'Page'
      };
      return names[type] || 'Contenu';
    },

    generatePreview(item, type) {
      // Strip all HTML and clean text completely
      const cleanText = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&[^;]+;/g, ' ') // Remove HTML entities
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .substring(0, 100); // Limit length
      };

      switch (type) {
        case 'spell':
          const desc = cleanText(item.description || 'Non spécifiée');
          const portee = cleanText(item.portee || 'Non spécifiée');
          return `<div class="preview-field">Description: ${desc}</div><div class="preview-field">Portée: ${portee}</div>`;
          
        case 'don':
          const donDesc = cleanText(item.description || 'Non spécifiée');
          return `<div class="preview-field">Description: ${donDesc}</div>`;
          
        case 'class':
          const resume = cleanText(item.resume || 'Non spécifié');
          return `<div class="preview-field">Résumé: ${resume}</div>`;
          
        case 'subclass':
          const progression = cleanText(item.progression || 'Non spécifiée');
          return `<div class="preview-field">Progression: ${progression}</div>`;
          
        case 'staticPage':
          const content = this.extractStaticPageContent(item.sections || []);
          const preview = cleanText(content || 'Page d\'information');
          return `<div class="preview-field">Contenu: ${preview}</div>`;
          
        default:
          return '<div class="preview-field">Aperçu non disponible</div>';
      }
    },

    setupMainSearchHandlers() {
      // Handle click on entire card
      JdrApp.utils.events.register('click', '.search-result-card', (e) => {
        console.log('Card clicked, currentTarget:', e.currentTarget);
        if (e.target.closest('.search-result-btn')) return; // Let button handle it
        
        const url = e.currentTarget ? e.currentTarget.dataset.url : null;
        console.log('Card URL:', url);
        
        if (url && url !== '#test') {
          console.log('Navigating to:', url);
          window.location.hash = url;
          // Force page reload to trigger router
          window.location.reload();
        } else {
          console.warn('No valid URL found on card');
        }
      });

      // Handle button clicks
      JdrApp.utils.events.register('click', '.search-result-btn', (e) => {
        console.log('Button clicked, target:', e.target);
        e.stopPropagation();
        
        const url = e.target ? e.target.dataset.url : null;
        console.log('Button URL:', url);
        
        if (url && url !== '#test') {
          console.log('Navigating to:', url);
          window.location.hash = url;
          // Force page reload to trigger router
          window.location.reload();
        } else {
          console.warn('No valid URL found on button');
        }
      });
    },

    setupDirectHandlers() {
      // Direct event listeners on the elements themselves
      setTimeout(() => {
        const cards = document.querySelectorAll('.search-result-card');
        const buttons = document.querySelectorAll('.search-result-btn');
        
        console.log('Setting up direct handlers for', cards.length, 'cards and', buttons.length, 'buttons');
        
        cards.forEach((card, index) => {
          const url = card.dataset.url;
          console.log(`Card ${index + 1} URL:`, url);
          
          card.addEventListener('click', (e) => {
            if (e.target.closest('.search-result-btn')) return;
            console.log('Direct card click, URL:', url);
            if (url && url !== '#test') {
              window.location.hash = url;
              window.location.reload();
            }
          });
        });
        
        buttons.forEach((button, index) => {
          const url = button.dataset.url;
          console.log(`Button ${index + 1} URL:`, url);
          
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Direct button click, URL:', url);
            if (url && url !== '#test') {
              window.location.hash = url;
              window.location.reload();
            }
          });
        });
      }, 200);
    },

    clearMainSearchResults() {
      // Reload the current page or go back to homepage
      if (window.location.hash && window.location.hash !== '#/') {
        window.location.reload();
      } else {
        window.location.hash = '#/creation';
      }
    },

    searchInTOC(query) {
      JdrApp.utils.dom.$$('.toc a').forEach(link => {
        const text = link.textContent.toLowerCase();
        const isMatch = text.includes(query);
        link.style.display = isMatch ? '' : 'none';
        
        if (isMatch) {
          const category = link.closest('.toc-category');
          if (category) {
            category.classList.remove('collapsed');
          }
        }
      });
    },

    searchInContent(query) {
      JdrApp.utils.dom.$$('article').forEach(article => {
        const text = article.textContent.toLowerCase();
        const isMatch = text.includes(query);
        
        if (isMatch) {
          this.highlightSearchTerms(article, query);
        }
      });
    },

    highlightSearchTerms(container, query) {
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
      JdrApp.utils.events.register('click', '.modal-overlay, .modal-close', (e) => {
        const modal = e.target.closest('.modal') || document.querySelector('.modal.visible');
        if (modal) {
          this.closeModal(modal);
        }
      });

      JdrApp.utils.events.register('click', '.modal-content', (e) => {
        e.stopPropagation();
      });

      JdrApp.utils.events.register('keydown', 'body', (e) => {
        if (e.key === 'Escape') {
          const openModal = document.querySelector('.modal.visible');
          if (openModal) {
            this.closeModal(openModal);
          }
        }
      });

      // Resource tools
      JdrApp.utils.events.register('click', '#elementsBtn', () => {
        this.showElementsModal();
      });

      JdrApp.utils.events.register('click', '#etatsBtn', () => {
        this.showEtatsModal();
      });

      JdrApp.utils.events.register('click', '#spellLinksBtn', () => {
        this.showSpellLinksModal();
      });

      JdrApp.utils.events.register('click', '#pageLinksBtn', () => {
        this.showPageLinksModal();
      });

      // Gestionnaire pour les liens de sorts dans le contenu
      JdrApp.utils.events.register('click', '.spell-link', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const spellName = e.target.dataset.spell;
        const categoryName = e.target.dataset.category;
        this.showSpellPreview(spellName, categoryName, e.target);
      });

      // Gestionnaire pour les liens d'états dans le contenu
      JdrApp.utils.events.register('click', '.etat-link', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const etatName = e.target.dataset.etat;
        
        // Récupérer dynamiquement la description depuis les données statiques
        let etatDescription = '';
        if (window.STATIC_PAGES?.etats?.sections) {
          const etatSection = window.STATIC_PAGES.etats.sections.find(section => 
            section.type === 'card' && section.title === etatName
          );
          if (etatSection) {
            // Convertir le HTML en texte propre
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = etatSection.content;
            tempDiv.innerHTML = tempDiv.innerHTML
              .replace(/<\/p>/gi, '\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/li>/gi, '\n')
              .replace(/<\/div>/gi, '\n');
            etatDescription = (tempDiv.textContent || tempDiv.innerText || etatSection.content)
              .replace(/\n\s*\n/g, '\n')
              .trim();
          }
        }
        
        this.showEtatPreview(etatName, etatDescription, e.target);
      });

      EventBus.on(Events.MODAL_OPEN, (payload) => {
        this.openModal(payload.modalId);
      });

      EventBus.on(Events.MODAL_CLOSE, (payload) => {
        const modal = payload.modal || document.querySelector('.modal.visible');
        if (modal) {
          this.closeModal(modal);
        }
      });
    },

    openModal(modalId) {
      const modal = JdrApp.utils.dom.$(`#${modalId}`);
      if (modal) {
        if (modal.tagName === 'DIALOG') {
          modal.showModal();
        } else {
          modal.classList.add('visible');
          modal.style.display = 'flex';
        }
        
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
        
        const form = modal.querySelector('form');
        if (form) {
          form.reset();
        }
      }
    },

    showElementsModal() {
      let modal = JdrApp.utils.dom.$('#elementsModal');
      if (!modal) {
        modal = this.createElementsModal();
        document.body.appendChild(modal);
      }
      
      this.openModal('elementsModal');
    },

    createElementsModal() {
      const elements = Object.entries(window.ElementColors).map(([name, config]) => ({
        name,
        color: config.color,
        icon: this.getElementIcon(name)
      }));

      const elementsHTML = elements.map(element => `
        <div class="element-item" data-element="${element.name}" data-color="${element.color}">
          <div class="element-icon" style="background: ${element.color};">${element.icon}</div>
          <div class="element-name">${element.name}</div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = JdrApp.utils.dom.create('div', 'modal elements-modal', `
        <div class="modal-content elements-modal-content">
          <div style="position: relative;">
            <button class="modal-close-x" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--paper-muted); padding: 4px 8px; border-radius: 4px; transition: all 0.2s ease;" onmouseover="this.style.background='var(--rule)'; this.style.color='var(--accent-ink)';" onmouseout="this.style.background='none'; this.style.color='var(--paper-muted)';">×</button>
            <h3>🎨 Éléments</h3>
          </div>
          <p>Cliquez sur un élément pour copier sa balise HTML colorée.</p>
          <div class="elements-list">
            ${elementsHTML}
          </div>
          <button class="modal-close btn">Fermer</button>
        </div>
      `, { id: 'elementsModal' });

      modal.addEventListener('click', (e) => {
        const elementItem = e.target.closest('.element-item');
        if (elementItem) {
          const elementName = elementItem.dataset.element;
          
          // Get the full style configuration from ElementColors
          const style = window.ElementColors[elementName];
          if (style) {
            // Build the complete style string
            let styleString = `color: ${style.color}; font-weight: ${style.weight || 'bold'};`;
            if (style.background) styleString += ` background: ${style.background};`;
            if (style.padding) styleString += ` padding: ${style.padding};`;
            if (style.borderRadius) styleString += ` border-radius: ${style.borderRadius};`;
            
            const html = `<span style="${styleString}">${elementName}</span>`;
            this.copyToClipboard(html);
          } else {
            // Fallback for elements not found
            const html = `<span style="color: ${elementItem.dataset.color}; font-weight: bold;">${elementName}</span>`;
            this.copyToClipboard(html);
          }
          
          elementItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            this.closeModal(modal);
          }, 500);
        }
      });

      // Gestionnaire pour le bouton X de fermeture
      const closeBtn = modal.querySelector('.modal-close-x');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeModal(modal);
        });
      }

      return modal;
    },

    getElementIcon(elementName) {
      const icons = {
        'Feu': '🔥',
        'Air': '💨',
        'Eau': '💧',
        'Terre': '🌍',
        'Divin': '✨',
        'Lumière': '☀️',
        'Maléfique': '💀'
      };
      return icons[elementName] || '⚡';
    },

    showEtatsModal() {
      // TOUJOURS recréer la modal pour avoir les données à jour
      let modal = JdrApp.utils.dom.$('#etatsModal');
      if (modal) {
        document.body.removeChild(modal);
      }
      
      modal = this.createEtatsModal();
      document.body.appendChild(modal);
      
      this.openModal('etatsModal');
    },

    createEtatsModal() {
      // Récupérer les données d'états depuis window.STATIC_PAGES.etats
      const etatsData = window.STATIC_PAGES?.etats;
      const etats = [];
      
      if (etatsData?.sections) {
        etatsData.sections.forEach(section => {
          if (section.type === 'card' && section.title && section.content) {
            // Convertir le HTML en texte en préservant les sauts de ligne
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = section.content;
            
            // Remplacer les balises de saut de ligne par des \n avant d'extraire le texte
            tempDiv.innerHTML = tempDiv.innerHTML
              .replace(/<\/p>/gi, '\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/li>/gi, '\n')
              .replace(/<\/div>/gi, '\n');
            
            const description = (tempDiv.textContent || tempDiv.innerText || section.content)
              .replace(/\n\s*\n/g, '\n') // Supprimer les doubles sauts de ligne
              .trim();
            
            etats.push({
              name: section.title,
              description: description
            });
          }
        });
      }

      const etatsHTML = etats.map(etat => `
        <div class="etat-item" data-etat-name="${etat.name}" data-etat-description="${etat.description}">
          <div class="etat-icon">⚡</div>
          <div class="etat-content">
            <div class="etat-name">${etat.name}</div>
            <div class="etat-description">${etat.description.length > 60 ? etat.description.substring(0, 60) + '...' : etat.description}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = JdrApp.utils.dom.create('div', 'modal etats-modal', `
        <div class="modal-content etats-modal-content">
          <div style="position: relative;">
            <button class="modal-close-x" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--paper-muted); padding: 4px 8px; border-radius: 4px; transition: all 0.2s ease;" onmouseover="this.style.background='var(--rule)'; this.style.color='var(--accent-ink)';" onmouseout="this.style.background='none'; this.style.color='var(--paper-muted)';">×</button>
            <h3>⚡ États</h3>
          </div>
          <p>Cliquez sur un état pour copier un lien avec prévisualisation dans le presse-papiers.</p>
          <div class="etats-list">
            ${etatsHTML || '<div style="text-align: center; color: #666; padding: 2rem;">Aucun état trouvé</div>'}
          </div>
          <button class="modal-close btn">Fermer</button>
        </div>
      `, { id: 'etatsModal' });

      modal.addEventListener('click', (e) => {
        const etatItem = e.target.closest('.etat-item');
        if (etatItem) {
          const etatName = etatItem.dataset.etatName;
          const etatDescription = etatItem.dataset.etatDescription;
          
          // Créer un lien cliquable simple avec prévisualisation (description récupérée dynamiquement)
          const etatLink = `<span class="etat-link" data-etat="${etatName}" style="color: #ea7332; cursor: pointer; text-decoration: underline;">${etatName}</span>`;
          
          // Toujours copier dans le presse-papiers
          this.copyToClipboard(etatLink);
          
          etatItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            this.closeModal(modal);
          }, 500);
        }
      });

      // Gestionnaire pour le bouton X de fermeture
      const closeBtn = modal.querySelector('.modal-close-x');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeModal(modal);
        });
      }

      return modal;
    },

    showSpellLinksModal() {
      let modal = JdrApp.utils.dom.$('#spellLinksModal');
      if (modal) {
        document.body.removeChild(modal);
      }
      
      modal = this.createSpellLinksModal();
      document.body.appendChild(modal);

      
      this.openModal('spellLinksModal');
    },

    createSpellLinksModal() {
      // Récupérer tous les sorts depuis window.SORTS
      const spells = [];
      
      if (window.SORTS && Array.isArray(window.SORTS)) {
        window.SORTS.forEach(category => {
          if (category.sorts && Array.isArray(category.sorts)) {
            category.sorts.forEach(spell => {
              spells.push({
                name: spell.nom,
                category: category.nom,
                element: spell.element,
                description: spell.description || ''
              });
            });
          }
        });
      }

      const spellsHTML = spells.map(spell => `
        <div class="spell-item" data-spell-name="${spell.name}" data-spell-category="${spell.category}">
          <div class="spell-info">
            <div class="spell-name" style="color: ${this.getElementColor(spell.element)}; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${spell.name}</div>
            <span data-spell-meta style="color: ${this.getElementColor(spell.element)} !important; font-size: 12px; margin-bottom: 6px; display: block;">${this.getElementIcon(spell.element)} ${spell.element} • ${spell.category}</span>
            <div class="spell-description">${spell.description.length > 80 ? spell.description.substring(0, 80) + '...' : spell.description}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = JdrApp.utils.dom.create('div', 'modal spell-links-modal', `
        <div class="modal-content spell-links-modal-content">
          <div style="position: relative;">
            <button class="modal-close-x" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--paper-muted); padding: 4px 8px; border-radius: 4px; transition: all 0.2s ease;" onmouseover="this.style.background='var(--rule)'; this.style.color='var(--accent-ink)';" onmouseout="this.style.background='none'; this.style.color='var(--paper-muted)';">×</button>
            <h3>🔮 Liens vers les sorts</h3>
          </div>
          <p>Cliquez sur un sort pour copier un lien avec aperçu interactif.</p>
          <div class="spells-search">
            <input type="text" id="spellSearchInput" placeholder="Rechercher un sort..." style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid var(--rule); border-radius: 4px;">
          </div>
          <div class="spells-list" style="max-height: 400px; overflow-y: auto;">
            ${spellsHTML || '<div style="text-align: center; color: #666; padding: 2rem;">Aucun sort trouvé</div>'}
          </div>
          <button class="modal-close btn">Fermer</button>
        </div>
      `, { id: 'spellLinksModal' });

      // Recherche dans la modal
      const searchInput = modal.querySelector('#spellSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          const spellItems = modal.querySelectorAll('.spell-item');
          
          spellItems.forEach(item => {
            const spellName = item.querySelector('.spell-name').textContent.toLowerCase();
            const spellCategory = item.querySelector('.spell-meta').textContent.toLowerCase();
            
            if (spellName.includes(searchTerm) || spellCategory.includes(searchTerm)) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
        });
      }

      // Clic sur un sort
      modal.addEventListener('click', (e) => {
        const spellItem = e.target.closest('.spell-item');
        if (spellItem) {
          const spellName = spellItem.dataset.spellName;
          const spellCategory = spellItem.dataset.spellCategory;
          
          // Créer le lien HTML avec les attributs nécessaires
          const spellLink = `<span class="spell-link" data-spell="${spellName}" data-category="${spellCategory}" style="color: var(--accent); cursor: pointer; text-decoration: underline;">${spellName}</span>`;
          
          this.copyToClipboard(spellLink);
          
          spellItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            this.closeModal(modal);
          }, 500);
        }
      });

      // Gestionnaire pour le bouton X de fermeture
      const closeBtn = modal.querySelector('.modal-close-x');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeModal(modal);
        });
      }

      return modal;
    },

    getElementColor(element) {
      // Couleurs optimisées pour la lisibilité sur fond clair et foncé
      const colorMap = {
        'Feu': '#e25822',        // Rouge-orange vif
        'Eau': '#2563eb',        // Bleu vif
        'Terre': '#92400e',      // Marron foncé
        'Air': '#059669',        // Vert émeraude
        'Lumière': '#d97706',    // Orange doré (au lieu du jaune pâle)
        'Nuit': '#6b21a8',       // Violet foncé (au lieu du noir)
        'Divin': '#7c2d12',      // Marron doré (au lieu du blanc)
        'Maléfique': '#7c3aed'   // Violet intense
      };
      
      return colorMap[element] || '#666666';
    },

    getElementIcon(element) {
      const icons = window.ElementIcons || {};
      return icons[element] || '⚡';
    },

    showSpellPreview(spellName, categoryName, triggerElement) {
      // Trouver le sort dans les données
      let spellData = null;
      
      if (window.SORTS && Array.isArray(window.SORTS)) {
        for (const category of window.SORTS) {
          if (category.nom === categoryName && category.sorts) {
            spellData = category.sorts.find(spell => spell.nom === spellName);
            if (spellData) break;
          }
        }
      }

      if (!spellData) {
        this.showNotification(`❌ Sort "${spellName}" non trouvé`, 'error');
        return;
      }

      // Fermer toute preview existante
      const existingPreview = document.querySelector('.spell-preview-popup');
      if (existingPreview) {
        existingPreview.remove();
      }

      // Calculer la position de la popup
      const rect = triggerElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Créer la popup de preview
      const popup = document.createElement('div');
      popup.className = 'spell-preview-popup';
      
      const elementColor = this.getElementColor(spellData.element);
      
      popup.innerHTML = `
        <div class="spell-preview-content">
          <div class="spell-preview-header" style="border-left: 4px solid ${elementColor};">
            <div class="spell-title" style="color: ${elementColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${spellData.nom}</div>
            <span data-element-display style="color: ${elementColor} !important; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${this.getElementIcon(spellData.element)} ${spellData.element} • ${categoryName}</span>
            <button class="spell-preview-close">✕</button>
          </div>
          <div class="spell-preview-body">
            ${spellData.description ? `<div class="spell-description">${spellData.description}</div>` : ''}
            ${spellData.prerequis ? `<div class="spell-field">${spellData.prerequis}</div>` : ''}
            ${spellData.portee ? `<div class="spell-field">${spellData.portee}</div>` : ''}
            ${spellData.tempsIncantation ? `<div class="spell-field">${spellData.tempsIncantation}</div>` : ''}
            ${spellData.coutMana ? `<div class="spell-field">${spellData.coutMana}</div>` : ''}
            ${spellData.resistance ? `<div class="spell-field">${spellData.resistance}</div>` : ''}
            ${spellData.effetNormal ? `<div class="spell-field">${spellData.effetNormal}</div>` : ''}
            ${spellData.effetCritique ? `<div class="spell-field">${spellData.effetCritique}</div>` : ''}
          </div>
        </div>
      `;

      // Styles de la popup
      popup.style.cssText = `
        position: fixed;
        z-index: 10000;
        background: var(--card);
        border: 2px solid ${elementColor};
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        max-width: 400px;
        max-height: 500px;
        overflow-y: auto;
        font-family: 'Roboto', sans-serif;
        line-height: 1.4;
      `;

      document.body.appendChild(popup);

      // FORCE les couleurs avec JavaScript après ajout au DOM
      setTimeout(() => {
        const elementDisplay = popup.querySelector('[data-element-display]');
        if (elementDisplay) {
          elementDisplay.style.setProperty('color', elementColor, 'important');
        }
      }, 10);

      // Positionner la popup
      const popupRect = popup.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - popupRect.width / 2;
      let top = rect.bottom + 8;

      // Ajustements si la popup sort de l'écran
      if (left < 8) left = 8;
      if (left + popupRect.width > viewportWidth - 8) left = viewportWidth - popupRect.width - 8;
      if (top + popupRect.height > viewportHeight - 8) top = rect.top - popupRect.height - 8;
      if (top < 8) top = 8;

      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;

      // Gestionnaires d'événements
      popup.querySelector('.spell-preview-close').addEventListener('click', () => {
        popup.remove();
      });

      // Fermer en cliquant à l'extérieur
      const handleOutsideClick = (e) => {
        if (!popup.contains(e.target) && e.target !== triggerElement) {
          popup.remove();
          document.removeEventListener('click', handleOutsideClick);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
      }, 100);

      // Fermer avec Escape
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          popup.remove();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    },

    showEtatPreview(etatName, etatDescription, triggerElement) {
      // Fermer toute preview existante
      const existingPreview = document.querySelector('.etat-preview-popup');
      if (existingPreview) {
        existingPreview.remove();
      }

      // Calculer la position de la popup
      const rect = triggerElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Créer la popup de preview
      const popup = document.createElement('div');
      popup.className = 'etat-preview-popup';
      
      popup.innerHTML = `
        <div class="etat-preview-content">
          <div class="etat-preview-header">
            <div class="etat-title">⚡ ${etatName}</div>
            <button class="etat-preview-close">✕</button>
          </div>
          <div class="etat-preview-body">
            <div class="etat-description">${etatDescription}</div>
          </div>
        </div>
      `;

      // Styles de la popup
      popup.style.cssText = `
        position: fixed;
        z-index: 10000;
        background: var(--card);
        border: 2px solid #7c2d12;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        max-width: 300px;
        padding: 1rem;
        font-size: 14px;
        line-height: 1.4;
        color: var(--paper-ink);
        pointer-events: auto;
      `;

      document.body.appendChild(popup);

      // Positionner la popup
      setTimeout(() => {
        const popupRect = popup.getBoundingClientRect();
        let left = rect.left + rect.width / 2 - popupRect.width / 2;
        let top = rect.bottom + 8;

        // Ajustements si la popup sort de l'écran
        if (left < 8) left = 8;
        if (left + popupRect.width > viewportWidth - 8) left = viewportWidth - popupRect.width - 8;
        if (top + popupRect.height > viewportHeight - 8) top = rect.top - popupRect.height - 8;
        if (top < 8) top = 8;

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
      }, 10);

      // Gestionnaires d'événements
      popup.querySelector('.etat-preview-close').addEventListener('click', () => {
        popup.remove();
      });

      // Fermer en cliquant à l'extérieur
      const handleOutsideClick = (e) => {
        if (!popup.contains(e.target) && e.target !== triggerElement) {
          popup.remove();
          document.removeEventListener('click', handleOutsideClick);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
      }, 100);

      // Fermer avec Escape
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          popup.remove();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('📋 Copié dans le presse-papiers', 'success');
      }).catch(() => {
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
      this.setupMobileNavigation();
      this.setupLegacyResponsive();
    },

    setupMobileNavigation() {
      // Create mobile navigation toggle button immediately and on resize
      this.createMobileNavToggle();
      
      // Handle mobile nav toggle with delegation
      document.addEventListener('click', (e) => {
        if (e.target.closest('.mobile-nav-toggle')) {
          e.preventDefault();
          this.toggleMobileNav();
        }
      });

      // Auto-close navigation when selecting a page
      document.addEventListener('click', (e) => {
        if (e.target.closest('.toc a') && window.innerWidth <= 980) {
          this.closeMobileNav();
        }
      });

      // Handle window resize
      window.addEventListener('resize', () => {
        if (window.innerWidth <= 980) {
          this.createMobileNavToggle();
        } else {
          this.closeMobileNav();
          const existingButton = document.querySelector('.mobile-nav-toggle');
          if (existingButton) {
            existingButton.remove();
          }
        }
      });
      
      // Also create on DOM content loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.createMobileNavToggle();
        });
      }
    },

    createMobileNavToggle() {
      // Only create if it doesn't exist and we're on mobile
      if (window.innerWidth <= 980 && !document.querySelector('.mobile-nav-toggle')) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-nav-toggle';
        toggleButton.innerHTML = `
          <span class="icon">📜</span>
          <span class="text">Menu</span>
        `;
        toggleButton.setAttribute('aria-label', 'Ouvrir/fermer le menu de navigation');
        toggleButton.setAttribute('title', 'Navigation');
        toggleButton.type = 'button';
        
        // Insert at the beginning of body
        if (document.body) {
          document.body.insertBefore(toggleButton, document.body.firstChild);
        }
      }
    },

    toggleMobileNav() {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.mobile-nav-toggle');
      
      if (sidebar && toggleButton) {
        const isOpen = sidebar.classList.contains('mobile-open');
        
        if (isOpen) {
          this.closeMobileNav();
        } else {
          this.openMobileNav();
        }
      }
    },

    openMobileNav() {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.mobile-nav-toggle');
      
      if (sidebar && toggleButton) {
        sidebar.classList.add('mobile-open');
        toggleButton.classList.add('open');
        
        const textSpan = toggleButton.querySelector('.text');
        if (textSpan) {
          textSpan.textContent = 'Fermer';
        }
        
        // Add event listener to close on outside click
        setTimeout(() => {
          document.addEventListener('click', this.handleOutsideClick);
        }, 100);
      }
    },

    closeMobileNav() {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.mobile-nav-toggle');
      
      if (sidebar && toggleButton) {
        sidebar.classList.remove('mobile-open');
        toggleButton.classList.remove('open');
        
        const textSpan = toggleButton.querySelector('.text');
        if (textSpan) {
          textSpan.textContent = 'Menu';
        }
        
        // Remove outside click listener
        document.removeEventListener('click', this.handleOutsideClick);
      }
    },

    handleOutsideClick: (e) => {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.mobile-nav-toggle');
      
      // Close if clicking outside sidebar and toggle button
      if (sidebar && toggleButton && 
          !sidebar.contains(e.target) && 
          !toggleButton.contains(e.target)) {
        JdrApp.modules.ui.closeMobileNav();
      }
    },

    setupLegacyResponsive() {
      // Keep existing responsive handlers for compatibility
      JdrApp.utils.events.register('click', '#menuToggle', () => {
        const sidebar = JdrApp.utils.dom.$('#sidebar');
        const backdrop = JdrApp.utils.dom.$('#backdrop');
        
        if (sidebar && backdrop) {
          sidebar.classList.toggle('mobile-open');
          backdrop.hidden = !sidebar.classList.contains('mobile-open');
        }
      });

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
      EventBus.emit(Events.NOTIFICATION_SHOW, { message, type });
      
      // Fallback notification if storage module is not available
      if (!JdrApp.modules.storage?.showNotification) {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 500;
          z-index: 10000;
          animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      } else {
        JdrApp.modules.storage.showNotification(message, type);
      }
    },

    // Get current page ID from DOM
    getCurrentPageId() {
      // Find the currently visible article (not hidden)
      const articles = document.querySelectorAll('article[data-static-page="true"]');
      let visibleArticle = null;
      
      for (const article of articles) {
        const style = window.getComputedStyle(article);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          visibleArticle = article;
          break;
        }
      }
      
      // Fallback: find by active class or current hash
      if (!visibleArticle) {
        const hash = window.location.hash.replace('#/', '');
        if (hash) {
          visibleArticle = document.querySelector(`article[data-page="${hash}"]`);
        }
      }
      
      // Last fallback: any visible article
      if (!visibleArticle) {
        visibleArticle = document.querySelector('article[data-static-page="true"]:not([style*="display: none"])');
      }
      
      const pageId = visibleArticle ? visibleArticle.dataset.page : null;
      // console.log('🔍 DEBUG getCurrentPageId: Found visible article:', !!visibleArticle);
      // console.log('🔍 DEBUG getCurrentPageId: Page ID:', pageId);
      if (visibleArticle) {
        // console.log('🔍 DEBUG getCurrentPageId: Article attributes:', {
        //   'data-static-page': visibleArticle.dataset.staticPage,
        //   'data-page': visibleArticle.dataset.page,
        //   'data-page-title': visibleArticle.dataset.pageTitle
        // });
      }
      return pageId;
    },

    // Count existing sections for unique ID generation
    countExistingSections() {
      const pageId = this.getCurrentPageId();
      if (!pageId || !window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        return 0;
      }
      const pageData = window.STATIC_PAGES[pageId];
      return pageData.sections ? pageData.sections.length : 0;
    },

    // Save new section to JSON data
    saveNewSectionToJSON(sectionId, title, content) {
      const pageId = this.getCurrentPageId();
      // console.log('🔍 DEBUG SAVE: getCurrentPageId() returned:', pageId);
      // console.log('🔍 DEBUG SAVE: Available pages in STATIC_PAGES:', Object.keys(window.STATIC_PAGES || {}));
      
      if (!pageId || !window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        console.warn('Cannot save new section - page not found:', pageId);
        console.warn('window.STATIC_PAGES exists:', !!window.STATIC_PAGES);
        console.warn('pageId exists in STATIC_PAGES:', pageId && window.STATIC_PAGES && !!window.STATIC_PAGES[pageId]);
        return false;
      }

      const pageData = window.STATIC_PAGES[pageId];
      
      // Create new section object
      const newSection = {
        type: "card",
        id: sectionId,
        title: title,
        content: content,
        deletable: true,
        sectionName: title
      };

      // Add to sections array
      if (!pageData.sections) {
        pageData.sections = [];
      }
      
      pageData.sections.push(newSection);
      
      return true;
    },

    // Delete section from JSON data
    deleteSectionFromJSON(sectionId) {
      const pageId = this.getCurrentPageId();
      if (!pageId || !window.STATIC_PAGES || !window.STATIC_PAGES[pageId]) {
        console.warn('Cannot delete section - page not found:', pageId);
        return false;
      }

      const pageData = window.STATIC_PAGES[pageId];
      if (!pageData.sections) {
        console.warn('No sections found in page data');
        return false;
      }

      console.log(`🗑️ SUPPRESSION JSON: Tentative de suppression "${sectionId}" de ${pageId}.json`);
      console.log('📊 État JSON avant suppression:', {
        pageId,
        totalSections: pageData.sections.length,
        sectionIds: pageData.sections.map(s => s.id)
      });

      // Remove section by ID
      const initialLength = pageData.sections.length;
      pageData.sections = pageData.sections.filter(section => section.id !== sectionId);
      
      // Check if section was found and removed
      const removed = pageData.sections.length < initialLength;
      if (removed) {
        console.log(`✅ SUPPRESSION JSON: Section "${sectionId}" supprimée de ${pageId}.json`);
        console.log('📊 État JSON après suppression:', {
          pageId,
          totalSections: pageData.sections.length,
          sectionIds: pageData.sections.map(s => s.id)
        });
        return true;
      } else {
        // Try to find in nested grid content
        for (let section of pageData.sections) {
          if (section.type === 'grid' && section.content) {
            const gridInitialLength = section.content.length;
            section.content = section.content.filter(item => item.id !== sectionId);
            if (section.content.length < gridInitialLength) {
              console.log(`✅ SUPPRESSION JSON: Section "${sectionId}" supprimée de grille dans ${pageId}.json`);
              return true;
            }
          }
        }
        
        console.error(`❌ ERREUR: Section "${sectionId}" introuvable pour suppression`);
        // console.log('🔍 Sections disponibles:', pageData.sections.map(s => ({id: s.id, title: s.title})));
        return false;
      }
    },

    // Recalculate all section indices in the current page to prevent conflicts
    recalculateSectionIndices() {
      // Disable index recalculation for now - it causes ID mismatches
      // The current approach of using timestamp-based unique IDs is more stable
      console.log('Index recalculation disabled - using stable unique IDs');
      return true;
    },

    // OLD VERSION - kept for reference but disabled
    _recalculateSectionIndicesOld() {
      const pageId = this.getCurrentPageId();
      if (!pageId) {
        console.warn('Cannot recalculate indices - no current page');
        return false;
      }

      // Update DOM data-edit-section attributes to match JSON structure
      const article = document.querySelector('article[data-static-page="true"]');
      if (!article) {
        console.warn('No static page article found');
        return false;
      }

      // Get the JSON data for this page
      const pageData = window.STATIC_PAGES?.[pageId];
      if (!pageData?.sections) {
        console.warn('No page data found for recalculation');
        return false;
      }

      // Build a mapping of DOM sections to JSON sections
      const sections = article.querySelectorAll('.editable-section, .card');
      let sectionIndex = 0;

      sections.forEach((domSection, domIndex) => {
        // Skip sections that don't have editable content
        const editableElements = domSection.querySelectorAll('[data-edit-section]');
        if (editableElements.length === 0) return;

        // Find corresponding JSON section
        let jsonSection = null;
        let jsonIndex = sectionIndex;

        // Try to match by existing ID first
        const firstEditable = editableElements[0];
        let currentId = firstEditable.dataset.editSection;
        if (currentId.endsWith('-title')) {
          currentId = currentId.replace('-title', '');
        }

        // Look for matching JSON section
        for (let i = 0; i < pageData.sections.length; i++) {
          const section = pageData.sections[i];
          if (section.id === currentId || section.type === 'intro') {
            jsonSection = section;
            jsonIndex = i;
            break;
          }
        }

        // If no match found, assign next available index
        if (!jsonSection && sectionIndex < pageData.sections.length) {
          jsonSection = pageData.sections[sectionIndex];
          jsonIndex = sectionIndex;
        }

        if (jsonSection) {
          // Update DOM attributes to match JSON structure
          editableElements.forEach(editable => {
            const currentEditSection = editable.dataset.editSection;
            
            // Determine the new ID based on JSON section
            let newEditSection;
            if (currentEditSection.endsWith('-title')) {
              newEditSection = `${jsonSection.id}-title`;
            } else {
              newEditSection = jsonSection.id;
            }

            // Update the data attribute
            editable.dataset.editSection = newEditSection;
            
            console.log(`Updated section ${domIndex}: ${currentEditSection} → ${newEditSection}`);
          });

          sectionIndex++;
        }
      });

      // Also update section indices in JSON to ensure consistency
      pageData.sections.forEach((section, index) => {
        // Ensure each section has a proper ID
        if (!section.id || section.id.startsWith('section-')) {
          // Generate a stable ID based on title or position
          const baseId = section.title ? 
            section.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') :
            `section-${index}`;
          section.id = baseId;
        }
      });

      console.log(`Recalculated indices for ${sectionIndex} sections in page ${pageId}`);
      return true;
    },

    // Trigger data save to localStorage/persistent storage
    triggerDataSave() {
      // Data is already saved in window.STATIC_PAGES in memory
    },

    createNewCategory(type) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Demander le nom de la catégorie
      const categoryName = prompt(`Nom de la nouvelle catégorie de ${config.container} :`);
      if (!categoryName || !categoryName.trim()) {
        return;
      }

      const trimmedName = categoryName.trim();

      // Vérifier que la catégorie n'existe pas déjà
      const entity = ContentFactory.getEntity(type);
      if (entity && entity.findCategory(trimmedName)) {
        this.showNotification(`❌ Une catégorie "${trimmedName}" existe déjà`, 'error');
        return;
      }

      // Demander la description et spoilAlert pour les objets
      let description = prompt(`Description de la catégorie "${trimmedName}" :`);
      if (!description) description = '';

      let spoilAlert = false;
      if (type === 'objet') {
        spoilAlert = confirm('Cette catégorie contient-elle des éléments de spoil ?');
      }

      // Créer la nouvelle catégorie
      const newCategory = {
        nom: trimmedName,
        description: description.trim(),
        [config.identifiers.category]: []
      };

      // Ajouter spoilAlert pour les objets
      if (type === 'objet') {
        newCategory.spoilAlert = spoilAlert;
      }

      // Ajouter à la structure de données
      const dataKey = config.dataKey;
      if (!window[dataKey]) {
        window[dataKey] = [];
      }

      window[dataKey].push(newCategory);

      // Rafraîchir ContentFactory
      ContentFactory.refreshData();

      // Rafraîchir le router TOC
      if (JdrApp.modules.router && JdrApp.modules.router.generateTOC) {
        JdrApp.modules.router.generateTOC();
      }

      // Naviguer vers la nouvelle catégorie
      const categoryRoute = `${config.container}-${JdrApp.utils.data.sanitizeId(trimmedName)}`;
      JdrApp.modules.router.navigate(categoryRoute);

      this.showNotification(`${config.icons.category} Catégorie "${trimmedName}" créée avec succès!`, 'success');
    },

    deleteCategory(type, categoryName) {
      const config = window.ContentTypes[type];
      if (!config) {
        this.showNotification(`❌ Configuration manquante pour le type ${type}`, 'error');
        return;
      }

      // Confirmation avec détails
      const entity = ContentFactory.getEntity(type);
      const category = entity?.findCategory(categoryName);
      
      if (!category) {
        this.showNotification(`❌ Catégorie "${categoryName}" introuvable`, 'error');
        return;
      }

      const itemsProperty = this.getItemsProperty(type);
      const itemCount = category[itemsProperty]?.length || 0;
      
      const confirmMessage = itemCount > 0 
        ? `Supprimer la catégorie "${categoryName}" et ses ${itemCount} éléments ?`
        : `Supprimer la catégorie vide "${categoryName}" ?`;
        
      if (!confirm(confirmMessage)) {
        return;
      }

      // Supprimer de la structure de données
      const dataKey = config.dataKey;
      if (window[dataKey]) {
        const categoryIndex = window[dataKey].findIndex(cat => cat.nom === categoryName);
        
        if (categoryIndex >= 0) {
          window[dataKey].splice(categoryIndex, 1);
          
          // Rafraîchir ContentFactory
          ContentFactory.refreshData();

          // Rafraîchir le router TOC
          if (JdrApp.modules.router && JdrApp.modules.router.generateTOC) {
            JdrApp.modules.router.generateTOC();
          }

          // Naviguer vers la page principale du type
          JdrApp.modules.router.navigate(config.container);

          this.showNotification(`${config.icons.delete} Catégorie "${categoryName}" supprimée`, 'success');
        } else {
          this.showNotification(`❌ Erreur lors de la suppression`, 'error');
        }
      }
    },

    getItemsProperty(type) {
      switch (type) {
        case 'spell': return 'sorts';
        case 'don': return 'dons';
        case 'objet': return 'objets';
        case 'class': return 'sousClasses';
        default: return 'items';
      }
    },

    // SUPPRIMÉ: Toutes les méthodes de gestion des filtres (showFilterManagementModal, createFilterModal, updateFilterModalContent, saveFilterSettings, resetFilterSettings, moveTagInModal)

    refreshObjectsPage() {
      // Check if we're currently on the objects page
      if (window.location.hash === '#/objets' || window.location.hash === '#/objet') {
        EventBus.emit(Events.PAGE_RENDER, {
          type: 'category',
          categoryType: 'objet',
          category: window.OBJETS
        });
      }
    },

    refreshMonstersPage() {
      // Check if we're currently on the monsters page
      if (window.location.hash === '#/monstres' || window.location.hash === '#/monstre') {
        // Use the router to refresh the monsters page
        if (JdrApp.modules.router && JdrApp.modules.router.renderMonstersPage) {
          JdrApp.modules.router.renderMonstersPage();
        }
      }
    },

    refreshTablesTresorsPage() {
      // Check if we're currently on the tables de trésors page
      if (window.location.hash === '#/tables-tresors') {
        // Use the router to refresh the tables de trésors page
        if (JdrApp.modules.router && JdrApp.modules.router.renderTablesTresorsPage) {
          JdrApp.modules.router.renderTablesTresorsPage();
        }
      }
    },

    // ==== SPELL ELEMENT MANAGEMENT ====

    updateSpellElement(selectElement) {
      // Get the selected element
      const newElement = selectElement.value;
      const spellName = selectElement.dataset.spellName;
      const categoryName = selectElement.dataset.categoryName;

      if (!newElement || !spellName || !categoryName) {
        this.showNotification('❌ Erreur : données du sort manquantes', 'error');
        return;
      }

      // Find and update the spell data
      const spellEntity = ContentFactory.getEntity('spell');
      const category = spellEntity?.findCategory(categoryName);
      
      if (!category) {
        this.showNotification(`❌ Catégorie "${categoryName}" introuvable`, 'error');
        return;
      }

      const spell = category.sorts?.find(s => s.nom === spellName);
      if (!spell) {
        this.showNotification(`❌ Sort "${spellName}" introuvable`, 'error');
        return;
      }

      // Update the spell element
      spell.element = newElement;

      // Save the changes to storage
      EventBus.emit(Events.STORAGE_SAVE);

      // Update the visual display
      const spellCard = selectElement.closest('.card');
      if (spellCard) {
        const elementDisplay = spellCard.querySelector('.spell-element-selector').parentNode;
        if (elementDisplay) {
          // Find the icon and colors for the new element
          const icon = window.ElementIcons ? window.ElementIcons[newElement] : '🔥';
          const colors = window.ElementColors ? window.ElementColors[newElement] : { color: '#ff6b35', weight: 'bold' };
          
          // Build style string
          let style = `color: ${colors.color}; font-weight: ${colors.weight};`;
          if (colors.background) style += ` background: ${colors.background};`;
          if (colors.padding) style += ` padding: ${colors.padding};`;
          if (colors.borderRadius) style += ` border-radius: ${colors.borderRadius};`;
          
          // Update the dropdown options to reflect the selection
          const options = Object.keys(window.ElementIcons || {});
          const optionsHTML = options.map(elem => 
            `<option value="${elem}" ${elem === newElement ? 'selected' : ''}>${window.ElementIcons[elem]} ${elem}</option>`
          ).join('');
          
          selectElement.innerHTML = optionsHTML;
        }
      }

      // Trigger page re-render to update all spell displays
      EventBus.emit(Events.PAGE_RENDER, {
        type: 'category',
        categoryType: 'spell',
        category: category
      });

      // Show success notification
      const elementIcon = window.ElementIcons ? window.ElementIcons[newElement] : '🔥';
      this.showNotification(`${elementIcon} Élément du sort "${spellName}" mis à jour : ${newElement}`, 'success');
    },

    // ========================================
    // NEW PAGE CREATION WITH SECTION SELECTION
    // ========================================
    setupNewPageHandler() {
      // Set up event listener for "Nouvelle page" button
      document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'addCategory') {
          e.preventDefault();
          this.showSectionSelectionModal();
        }
      });
    },

    showSectionSelectionModal() {
      const modal = this.createSectionSelectionModal();
      document.body.appendChild(modal);
      this.openModal('sectionSelectionModal');
    },

    createSectionSelectionModal() {
      // Get available sections from TOC structure
      const sections = window.TOC_STRUCTURE?.sections || [
        { id: 'heros', title: '🦸 Héros', icon: '🦸' },
        { id: 'arsenal', title: '⚔️ Arsenal', icon: '⚔️' },
        { id: 'regles', title: '📚 Règles', icon: '📚' }
      ];

      // Filter sections based on MJ access if needed
      const availableSections = sections.filter(section => 
        !section.requiresMJ || window.JdrApp?.state?.isMJ
      );

      const sectionsHTML = availableSections.map(section => `
        <div class="section-option" data-section-id="${section.id}">
          <div class="section-icon">${section.icon}</div>
          <div class="section-info">
            <div class="section-title">${section.title}</div>
            <div class="section-description">${section.description || 'Section de contenu'}</div>
          </div>
        </div>
      `).join('');

      const modal = document.createElement('div');
      modal.className = 'modal section-selection-modal';
      modal.id = 'sectionSelectionModal';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <h3>📄 Nouvelle page</h3>
          <p>Dans quelle section souhaitez-vous créer la nouvelle page ?</p>
          
          <div class="sections-list">
            ${sectionsHTML}
          </div>
          
          <div class="page-details" style="display: none;">
            <div class="form-group">
              <label for="pageTitle">Titre de la page :</label>
              <input type="text" id="pageTitle" placeholder="Nom de la nouvelle page" required>
            </div>
            <div class="form-group">
              <label for="pageIcon">Icône (optionnel) :</label>
              <select id="pageIcon">
                <option value="📄">📄 Page</option>
                <option value="⚔️">⚔️ Combat</option>
                <option value="🔮">🔮 Magie</option>
                <option value="🏛️">🏛️ Lieu</option>
                <option value="👥">👥 Personnages</option>
                <option value="📚">📚 Règles</option>
                <option value="🗡️">🗡️ Armes</option>
                <option value="🛡️">🛡️ Armures</option>
                <option value="💰">💰 Économie</option>
                <option value="🌟">🌟 Éléments</option>
                <option value="📊">📊 Statistiques</option>
                <option value="🎯">🎯 Compétences</option>
                <option value="⚡">⚡ États</option>
                <option value="📜">📜 Histoire</option>
                <option value="🗺️">🗺️ Géographie</option>
                <option value="👹">👹 Monstres</option>
                <option value="🎭">🎭 Culture</option>
                <option value="🏰">🏰 Royaumes</option>
                <option value="⭐">⭐ Important</option>
                <option value="💎">💎 Trésors</option>
              </select>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn modal-close">Annuler</button>
            <button type="button" class="btn btn-primary" id="createPageBtn" style="display: none;">Créer la page</button>
          </div>
        </div>
      `;

      // Set up event handlers
      this.setupSectionSelectionHandlers(modal);

      return modal;
    },

    setupSectionSelectionHandlers(modal) {
      let selectedSectionId = null;

      // Section selection
      modal.addEventListener('click', (e) => {
        const sectionOption = e.target.closest('.section-option');
        if (sectionOption) {
          // Remove previous selection
          modal.querySelectorAll('.section-option').forEach(opt => opt.classList.remove('selected'));
          
          // Select this section
          sectionOption.classList.add('selected');
          selectedSectionId = sectionOption.dataset.sectionId;
          
          // Show page details form
          const pageDetails = modal.querySelector('.page-details');
          const createBtn = modal.querySelector('#createPageBtn');
          pageDetails.style.display = 'block';
          createBtn.style.display = 'inline-block';
          
          // Focus on title input
          modal.querySelector('#pageTitle').focus();
        }
      });

      // Create page button
      modal.querySelector('#createPageBtn').addEventListener('click', () => {
        const titleInput = modal.querySelector('#pageTitle');
        const iconInput = modal.querySelector('#pageIcon');
        
        const pageTitle = titleInput.value.trim();
        const pageIcon = iconInput.value || '📄';
        
        if (!pageTitle) {
          this.showNotification('Veuillez saisir un titre pour la page', 'error');
          titleInput.focus();
          return;
        }

        if (!selectedSectionId) {
          this.showNotification('Veuillez sélectionner une section', 'error');
          return;
        }

        this.createNewPage(selectedSectionId, pageTitle, pageIcon);
        this.closeModal(modal);
      });

      // Handle Enter key in form
      modal.querySelector('#pageTitle').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && selectedSectionId) {
          modal.querySelector('#createPageBtn').click();
        }
      });
    },

    createNewPage(sectionId, pageTitle, pageIcon) {
      // Generate page ID from title
      const pageId = this.slugify(pageTitle);
      
      // Create new page object
      const newPage = {
        type: 'page',
        id: pageId,
        title: pageTitle,
        icon: pageIcon
      };

      // Add to TOC structure
      if (window.TOC_STRUCTURE) {
        const section = window.TOC_STRUCTURE.sections.find(s => s.id === sectionId);
        if (section) {
          section.items.push(newPage);
          
          // Create default page data
          const defaultPageData = {
            page: pageId,
            title: pageTitle,
            sections: [
              {
                type: 'intro',
                content: `Contenu de la page ${pageTitle}. Vous pouvez éditer ce texte en mode développement.`
              }
            ]
          };

          // Add to static pages
          if (!window.STATIC_PAGES) {
            window.STATIC_PAGES = {};
          }
          window.STATIC_PAGES[pageId] = defaultPageData;

          // Add to static pages config
          if (!window.STATIC_PAGES_CONFIG) {
            window.STATIC_PAGES_CONFIG = { pages: [] };
          }
          const newPageConfig = {
            id: pageId,
            title: pageTitle,
            file: `${pageId}.json`,
            active: true,
            order: window.STATIC_PAGES_CONFIG.pages.length + 1
          };
          window.STATIC_PAGES_CONFIG.pages.push(newPageConfig);

          // Create the article element for the new page
          this.createPageArticle(pageId, pageTitle, defaultPageData);

          // Regenerate TOC to include new page
          if (JdrApp.modules.router) {
            JdrApp.modules.router.generateTOC();
          }

          // Save changes
          if (JdrApp.modules.storage) {
            JdrApp.modules.storage.saveChanges(true);
          }

          // Navigate to new page
          window.location.hash = `#/${pageId}`;

          this.showNotification(`📄 Page "${pageTitle}" créée avec succès dans la section ${this.getSectionTitle(sectionId)}`, 'success');
        }
      }
    },

    createPageArticle(pageId, pageTitle, pageData) {
      // Force the renderer to generate the page content immediately
      if (JdrApp.modules.renderer && JdrApp.modules.renderer.generatePageContent) {
        const content = JdrApp.modules.renderer.generatePageContent(pageId);
        if (content) {
          // Create the article if it doesn't exist
          let article = document.querySelector(`article[data-page="${pageId}"]`);
          if (!article) {
            article = document.createElement('article');
            article.setAttribute('data-page', pageId);
            article.style.display = 'none';
            const viewsContainer = document.getElementById('views');
            if (viewsContainer) {
              viewsContainer.appendChild(article);
            }
          }
          // Set the content
          article.innerHTML = content;
        }
      }
    },

    getSectionTitle(sectionId) {
      if (window.TOC_STRUCTURE) {
        const section = window.TOC_STRUCTURE.sections.find(s => s.id === sectionId);
        return section ? section.title : sectionId;
      }
      return sectionId;
    },

    // ==== GLOBAL TAGS MANAGEMENT ====

    showTagsManagementModal() {
      // Déterminer le type de contenu basé sur la page actuelle
      const currentPage = window.location.hash.replace('#/', '') || 'creation';
      let contentType = 'objet'; // par défaut
      let config = null;
      
      if (currentPage === 'monstres' && window.ContentTypes.monster?.filterConfig) {
        contentType = 'monster';
        config = window.ContentTypes.monster.filterConfig;
      } else if (window.ContentTypes.objet?.filterConfig) {
        contentType = 'objet';
        config = window.ContentTypes.objet.filterConfig;
      }
      
      if (!config) {
        this.showNotification('❌ Configuration des tags non trouvée', 'error');
        return;
      }

      // Remove any existing modal
      const existingModal = document.querySelector('#tagsManagementModal');
      if (existingModal) {
        existingModal.remove();
      }

      const modal = this.createTagsManagementModal(config, contentType);
      document.body.appendChild(modal);
      
      // Use native dialog showModal for proper z-index
      modal.showModal();
    },

    createTagsManagementModal(config, contentType = 'objet') {
      const modal = document.createElement('dialog');
      modal.id = 'tagsManagementModal';
      modal.style.cssText = `
        max-width: 600px;
        width: 90%;
        padding: 0;
        border: none;
        border-radius: 12px;
        background: transparent;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      `;

      const tagsListHTML = config.availableTags.map((tag, index) => `
        <div class="tag-item" data-tag-index="${index}" data-tag-name="${tag}">
          <span class="tag-chip" style="background: var(--bronze); color: white; padding: 4px 8px; border-radius: 8px; margin-right: 0.5rem;">${tag}</span>
          <input type="text" value="${tag}" class="tag-input" style="flex: 1; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 4px; margin-right: 0.5rem;">
          <button type="button" class="btn small delete-tag-btn" data-tag-name="${tag}" style="background: #dc2626 !important; color: white !important; padding: 0.25rem 0.5rem !important; display: inline-block !important; opacity: 1 !important; visibility: visible !important;">
            🗑️
          </button>
        </div>
      `).join('');

      modal.innerHTML = `
        <div style="background: var(--paper); border-radius: 12px; padding: 1.5rem; border: 2px solid var(--rule);">
          <h3 style="margin: 0 0 1rem 0; color: var(--accent-ink);">🏷️ Gestion des tags globaux</h3>
          <p style="margin: 0 0 1rem 0; color: var(--paper-muted);">Gérez la liste principale des tags disponibles pour les ${contentType === 'monster' ? 'monstres' : 'objets'}.</p>
          
          <div style="margin: 1rem 0;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-ink);">Tags existants :</h4>
            <div id="tagsManagementList" style="max-height: 300px; overflow-y: auto;">
              ${tagsListHTML}
            </div>
          </div>
          
          <div style="margin: 1rem 0; padding: 1rem; background: var(--card); border-radius: 8px;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-ink);">Ajouter un nouveau tag :</h4>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="text" id="newTagInput" placeholder="Nom du nouveau tag" style="flex: 1; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 4px;">
              <button type="button" id="addTagBtn" class="btn" style="background: var(--accent); color: white;">
                ➕ Ajouter
              </button>
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn modal-close" style="background: #666; color: white;">
              ❌ Annuler
            </button>
            <button type="button" id="saveTagsManagementBtn" class="btn" style="background: var(--accent); color: white;">
              💾 Sauvegarder
            </button>
          </div>
        </div>
      `;

      this.setupTagsManagementHandlers(modal, config, contentType);
      return modal;
    },

    setupTagsManagementHandlers(modal, config, contentType = 'objet') {
      // Add new tag
      modal.querySelector('#addTagBtn').addEventListener('click', () => {
        const input = modal.querySelector('#newTagInput');
        const newTag = input.value.trim();
        
        if (!newTag) {
          this.showNotification('❌ Veuillez saisir un nom de tag', 'error');
          return;
        }
        
        if (config.availableTags.includes(newTag)) {
          this.showNotification(`❌ Le tag "${newTag}" existe déjà`, 'error');
          return;
        }
        
        // Add to temporary config (will be saved when user clicks save)
        config.availableTags.push(newTag);
        
        // Update the modal display
        this.refreshTagsManagementModal(modal, config);
        
        // Clear input
        input.value = '';
        this.showNotification(`➕ Tag "${newTag}" ajouté à la liste`, 'success');
      });

      // Handle Enter key in new tag input
      modal.querySelector('#newTagInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          modal.querySelector('#addTagBtn').click();
        }
      });

      // Delete tag
      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-tag-btn')) {
          const tagName = e.target.dataset.tagName;
          
          if (config.availableTags.length <= 1) {
            this.showNotification('❌ Impossible de supprimer le dernier tag', 'error');
            return;
          }
          
          if (confirm(`Supprimer le tag "${tagName}" ?\nAttention: il sera retiré de tous les objets qui l'utilisent.`)) {
            // Remove from config
            config.availableTags = config.availableTags.filter(tag => tag !== tagName);
            
            // Remove from all items that use this tag
            if (contentType === 'monster' && Array.isArray(window.MONSTRES)) {
              window.MONSTRES.forEach(monster => {
                if (monster.tags && monster.tags.includes(tagName)) {
                  monster.tags = monster.tags.filter(tag => tag !== tagName);
                  // Ensure monster has at least one tag if possible
                  if (monster.tags.length === 0 && config.availableTags.length > 0) {
                    monster.tags = [config.availableTags[0]];
                  }
                }
              });
              
              // Update filter settings to remove deleted tag for monsters
              if (window.MONSTRES_FILTER_STATE?.visibleTags) {
                window.MONSTRES_FILTER_STATE.visibleTags = window.MONSTRES_FILTER_STATE.visibleTags.filter(tag => tag !== tagName);
                // Ensure at least one visible tag remains
                if (window.MONSTRES_FILTER_STATE.visibleTags.length === 0 && config.availableTags.length > 0) {
                  window.MONSTRES_FILTER_STATE.visibleTags = [config.availableTags[0]];
                }
              }
            } else if (contentType === 'objet' && window.OBJETS?.objets) {
              window.OBJETS.objets.forEach(obj => {
                if (obj.tags && obj.tags.includes(tagName)) {
                  obj.tags = obj.tags.filter(tag => tag !== tagName);
                  // Ensure object has at least one tag if possible
                  if (obj.tags.length === 0 && config.availableTags.length > 0) {
                    obj.tags = [config.availableTags[0]];
                  }
                }
              });
              
              // Update filter settings to remove deleted tag for objects
              if (window.OBJETS?.filterSettings?.visibleTags) {
                window.OBJETS.filterSettings.visibleTags = window.OBJETS.filterSettings.visibleTags.filter(tag => tag !== tagName);
                // Ensure at least one visible tag remains
                if (window.OBJETS.filterSettings.visibleTags.length === 0 && config.availableTags.length > 0) {
                  window.OBJETS.filterSettings.visibleTags = [config.availableTags[0]];
                }
              }
            }
            
            // Update modal display
            this.refreshTagsManagementModal(modal, config);
            this.showNotification(`🗑️ Tag "${tagName}" supprimé`, 'success');
          }
        }
      });

      // Save all changes
      modal.querySelector('#saveTagsManagementBtn').addEventListener('click', () => {
        // Collect all tag renames
        const tagItems = modal.querySelectorAll('.tag-item');
        const renames = [];
        
        tagItems.forEach(item => {
          const originalName = item.dataset.tagName;
          const newName = item.querySelector('.tag-input').value.trim();
          
          if (newName && newName !== originalName) {
            renames.push({ old: originalName, new: newName });
          }
        });
        
        // Apply renames to config
        renames.forEach(rename => {
          const index = config.availableTags.indexOf(rename.old);
          if (index >= 0) {
            config.availableTags[index] = rename.new;
            
            // Update all items that use this tag
            if (contentType === 'monster' && Array.isArray(window.MONSTRES)) {
              window.MONSTRES.forEach(monster => {
                if (monster.tags && monster.tags.includes(rename.old)) {
                  const tagIndex = monster.tags.indexOf(rename.old);
                  monster.tags[tagIndex] = rename.new;
                }
              });
            } else if (contentType === 'objet' && window.OBJETS?.objets) {
              window.OBJETS.objets.forEach(obj => {
                if (obj.tags && obj.tags.includes(rename.old)) {
                  const tagIndex = obj.tags.indexOf(rename.old);
                  obj.tags[tagIndex] = rename.new;
                }
              });
              
              // Update filter settings for objects
              if (window.OBJETS?.filterSettings?.visibleTags) {
                const visibleIndex = window.OBJETS.filterSettings.visibleTags.indexOf(rename.old);
                if (visibleIndex >= 0) {
                  window.OBJETS.filterSettings.visibleTags[visibleIndex] = rename.new;
                }
              }
            }
          }
        });
        
        // Save to storage
        EventBus.emit(Events.STORAGE_SAVE);
        
        // Refresh current page if it matches the content type
        if (contentType === 'monster') {
          this.refreshMonstersPage();
        } else {
          this.refreshObjectsPage();
        }
        
        // Close modal
        modal.close();
        modal.remove();
        
        const changesCount = renames.length;
        if (changesCount > 0) {
          this.showNotification(`💾 ${changesCount} modification(s) sauvegardée(s)`, 'success');
        } else {
          this.showNotification('💾 Tags sauvegardés', 'success');
        }
      });

      // Close modal events
      modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.close();
        modal.remove();
      });

      modal.addEventListener('cancel', () => {
        modal.close();
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.close();
          modal.remove();
        }
      });
    },

    refreshTagsManagementModal(modal, config) {
      const container = modal.querySelector('#tagsManagementList');
      if (!container) return;

      const tagsListHTML = config.availableTags.map((tag, index) => `
        <div class="tag-item" data-tag-index="${index}" data-tag-name="${tag}">
          <span class="tag-chip" style="background: var(--bronze); color: white; padding: 4px 8px; border-radius: 8px; margin-right: 0.5rem;">${tag}</span>
          <input type="text" value="${tag}" class="tag-input" style="flex: 1; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 4px; margin-right: 0.5rem;">
          <button type="button" class="btn small delete-tag-btn" data-tag-name="${tag}" style="background: #dc2626; color: white; padding: 0.25rem 0.5rem;">
            🗑️
          </button>
        </div>
      `).join('');

      container.innerHTML = tagsListHTML;
    },

    // ==== ID SEARCH FUNCTIONALITY ====

    performIdSearch(searchValue) {
      const searchId = searchValue.trim();
      const resultDiv = document.querySelector('#id-search-result');
      
      if (!searchId) {
        this.clearIdSearch();
        return;
      }

      const searchNumber = parseInt(searchId, 10);
      if (isNaN(searchNumber)) {
        if (resultDiv) {
          resultDiv.innerHTML = '❌ Veuillez saisir un numéro valide';
          resultDiv.style.color = '#dc2626';
        }
        return;
      }

      // Find object by number
      const allObjects = window.OBJETS?.objets || [];
      const foundObject = allObjects.find(obj => obj.numero === searchNumber);

      if (!foundObject) {
        if (resultDiv) {
          resultDiv.innerHTML = `❌ Aucun objet trouvé avec l'ID ${searchNumber}`;
          resultDiv.style.color = '#dc2626';
        }
        // Hide all objects
        this.hideAllObjects();
        return;
      }

      // Set global flag BEFORE regenerating page
      window.activeIdSearch = true;

      // Immediately hide the container to prevent flash
      const container = document.querySelector('#objets-container');
      if (container) {
        container.style.visibility = 'hidden';
      }

      // Show success message immediately
      if (resultDiv) {
        resultDiv.innerHTML = `✅ Objet trouvé : "${foundObject.nom}" (ID: ${searchNumber})`;
        resultDiv.style.color = '#16a34a';
      }

      // Force regenerate page with all objects AND visual feedback
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }

      // After regeneration, configure display and show only target object
      requestAnimationFrame(() => {
        const newContainer = document.querySelector('#objets-container');
        if (newContainer) {
          // Hide all objects first
          this.hideAllObjects();
          
          // Show only the target object and make container visible again
          setTimeout(() => {
            this.showOnlyObjectById(searchNumber);
            newContainer.style.visibility = 'visible';
            
            // Restore the search value in the input field
            const searchInput = document.querySelector('#id-search-input');
            if (searchInput) {
              searchInput.value = searchNumber;
            }
          }, 10);
        }
      });
    },

    clearIdSearch() {
      const input = document.querySelector('#id-search-input');
      const resultDiv = document.querySelector('#id-search-result');
      
      if (input) {
        input.value = '';
      }
      
      if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.style.color = '';
      }

      // Clear global flag for active ID search
      window.activeIdSearch = false;

      // Reset container styles when clearing search
      const container = document.querySelector('#objets-container');
      if (container) {
        container.style.display = '';
        container.style.flexDirection = '';
        container.style.alignItems = '';
        container.style.justifyContent = '';
        container.style.minHeight = '';
        container.style.padding = '';
        container.style.visibility = ''; // Restore visibility
        
        // Reset all card sizes to normal
        const allCards = container.querySelectorAll('.card');
        allCards.forEach(card => {
          card.style.minWidth = '';
          card.style.maxWidth = '';
          card.style.width = '';
        });
      }

      // Regenerate page to update visual feedback and return to normal display
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
    },

    hideAllObjects() {
      const container = document.querySelector('#objets-container');
      if (container) {
        const allCards = container.querySelectorAll('.card');
        allCards.forEach(card => {
          card.style.display = 'none';
        });
      }
    },

    showOnlyObjectById(objectId) {
      // console.log('🔍 showOnlyObjectById called with ID:', objectId);
      const container = document.querySelector('#objets-container');
      if (!container) {
        // console.log('🔍 No objets-container found');
        return;
      }

      const allCards = container.querySelectorAll('.card');
      // console.log('🔍 Found', allCards.length, 'cards in container');
      let foundCard = null;

      allCards.forEach((card, index) => {
        const objetName = card.dataset.objetName;
        // console.log(`🔍 Card ${index}: objetName = "${objetName}"`);
        if (objetName) {
          // Find the object by name to get its number
          const obj = window.OBJETS?.objets?.find(o => o.nom === objetName);
          // console.log(`🔍 Found object:`, obj);
          if (obj && obj.numero === objectId) {
            // console.log('🔍 MATCH! Showing card for:', objetName);
            card.style.display = '';
            foundCard = card;
          } else {
            card.style.display = 'none';
          }
        }
      });

      // console.log('🔍 foundCard:', foundCard);

      // Scroll to the found card if it exists
      if (foundCard) {
        // Center the found object both horizontally and vertically
        const container = document.querySelector('#objets-container');
        if (container) {
          // Apply centering styles to the container when showing single object
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.minHeight = '70vh';
          container.style.padding = '2rem';
        }

        // Enlarge the found card for better visibility when searched by ID
        // Check if we're on mobile to adjust sizing accordingly
        const isMobile = window.innerWidth <= 640;
        if (isMobile) {
          // On mobile, use slightly smaller enlargement to fit the screen
          foundCard.style.minWidth = '320px';
          foundCard.style.maxWidth = '90vw';
          foundCard.style.width = '90vw';
        } else {
          // On desktop, double the normal size
          foundCard.style.minWidth = '560px'; // Double the normal min-width (280px * 2)
          foundCard.style.maxWidth = '700px'; // Double the normal max-width (350px * 2)
          foundCard.style.width = 'auto';
        }

        setTimeout(() => {
          foundCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Enhanced highlight effect for centered object
          foundCard.style.transition = 'all 0.4s ease';
          foundCard.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.3)';
          foundCard.style.transform = 'scale(1.05)';
          foundCard.style.zIndex = '10';
          
          setTimeout(() => {
            foundCard.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            foundCard.style.transform = 'scale(1.02)';
            foundCard.style.zIndex = '';
          }, 2000);
        }, 100);
      }
    },

    showAllObjectsWithTagFilters() {
      // Restore normal tag filtering behavior
      const currentSettings = window.OBJETS?.filterSettings || { 
        visibleTags: window.ContentTypes.objet.filterConfig.defaultVisibleTags 
      };
      
      const container = document.querySelector('#objets-container');
      if (!container) return;

      // Reset container styles to normal grid layout
      container.style.display = '';
      container.style.flexDirection = '';
      container.style.alignItems = '';
      container.style.justifyContent = '';
      container.style.minHeight = '';
      container.style.padding = '';
      container.style.visibility = ''; // Restore visibility

      const allCards = container.querySelectorAll('.card');
      allCards.forEach(card => {
        // Reset card sizing to normal
        card.style.minWidth = '';
        card.style.maxWidth = '';
        card.style.width = '';
        
        const objetName = card.dataset.objetName;
        if (objetName) {
          // Find the object and check if it has visible tags
          const obj = window.OBJETS?.objets?.find(o => o.nom === objetName);
          if (obj && obj.tags) {
            const hasVisibleTag = obj.tags.some(tag => currentSettings.visibleTags.includes(tag));
            card.style.display = hasVisibleTag ? '' : 'none';
          } else {
            card.style.display = 'none';
          }
        }
      });
    },

    // Toggle individual filter tag
    toggleFilter(chipElement) {
      const tag = chipElement.dataset.tag;
      if (!tag) return;

      // GUARD: Prevent rapid double clicks (debounce)
      if (this._toggleInProgress) {
        return;
      }
      this._toggleInProgress = true;
      
      // Release the lock after a short delay
      setTimeout(() => {
        this._toggleInProgress = false;
      }, 100);

      // Déterminer le type de contenu basé sur la page actuelle
      const currentPage = window.location.hash.replace('#/', '') || 'creation';
      let contentType = 'objet'; // par défaut
      let dataObject = null;
      let visibleTags = null;
      
      if (currentPage === 'monstres') {
        contentType = 'monster';
        // Pour les monstres, on utilise une structure simplifiée dans window.MONSTRES_FILTER_STATE
        if (!window.MONSTRES_FILTER_STATE) {
          window.MONSTRES_FILTER_STATE = { visibleTags: [...window.ContentTypes.monster.filterConfig.defaultVisibleTags] };
        }
        visibleTags = window.MONSTRES_FILTER_STATE.visibleTags;
      } else if (currentPage === 'tables-tresors') {
        contentType = 'tableTresor';
        // Pour les tables de trésors
        if (!window.TABLES_TRESORS_FILTER_STATE) {
          // Use fallback default tags if ContentTypes is not available
          const defaultTags = window.ContentTypes?.tableTresor?.filterConfig?.defaultVisibleTags || ['Commun'];
          window.TABLES_TRESORS_FILTER_STATE = { visibleTags: [...defaultTags] };
        }
        visibleTags = window.TABLES_TRESORS_FILTER_STATE.visibleTags;
      } else {
        // Pour les objets - NOUVEAU SYSTÈME SIMPLIFIÉ
        if (!window.ACTIVE_OBJECT_TAGS) {
          window.ACTIVE_OBJECT_TAGS = []; // Aucun tag actif par défaut
        }
        visibleTags = window.ACTIVE_OBJECT_TAGS;
      }
      
      // IMPORTANT: Track state BEFORE modification to know if we need full regeneration
      const wasEmpty = visibleTags.length === 0;
      
      // SIMPLE LOGIC: Check visual state directly and toggle
      const isVisuallyActive = chipElement.classList.contains('active');
      

      if (isVisuallyActive) {
        // DEACTIVATE - remove from visible tags
        const tagIndex = visibleTags.indexOf(tag);
        if (tagIndex > -1) {
          visibleTags.splice(tagIndex, 1);
        }
        chipElement.classList.remove('active');
        chipElement.classList.add('inactive');
        chipElement.style.background = '#6b7280';
        chipElement.style.opacity = '0.6';
        chipElement.style.boxShadow = '';
        // Mise à jour du texte du bouton
        chipElement.innerHTML = tag;
        chipElement.title = 'Inactif - Cliquer pour activer';
        this.showNotification(`🏷️ Tag "${tag}" désactivé`, 'info');
      } else {
        // ACTIVATE - add to visible tags
        if (!visibleTags.includes(tag)) {
          visibleTags.push(tag);
        }
        chipElement.classList.add('active');
        chipElement.classList.remove('inactive');
        chipElement.style.background = '#16a34a';
        chipElement.style.opacity = '1';
        chipElement.style.boxShadow = '0 2px 4px rgba(22, 163, 74, 0.3)';
        // Mise à jour du texte du bouton
        chipElement.innerHTML = '✓ ' + tag;
        chipElement.title = 'Actif - Cliquer pour désactiver';
        this.showNotification(`🏷️ Tag "${tag}" activé`, 'info');
      }


      // Check if we need a full page regeneration vs just visibility update
      const nowHasTags = visibleTags.length > 0;
      
      if (contentType === 'monster' || contentType === 'tableTresor') {
        // For monsters and tables de trésors, ALWAYS refresh because they have special logic
        // Any change in tags can reveal/hide different content and update UI elements
        this.refreshCurrentPage(contentType);
      } else {
        // SIMPLIFIÉ: Pour les objets, toujours rafraîchir la page
        // C'est plus simple et évite les problèmes de synchronisation
        this.refreshCurrentPage(contentType);
        
        // Mettre à jour le texte indicateur du nombre de tags actifs
        setTimeout(() => {
          const statusElement = document.querySelector('.objects-tag-display p');
          if (statusElement) {
            const activeCount = visibleTags.length;
            statusElement.innerHTML = activeCount === 0 
              ? 'Aucun filtre actif - Tous les objets affichés' 
              : activeCount === 1 
                ? '1 filtre actif - Objets avec ce tag uniquement'
                : `${activeCount} filtres actifs - Objets avec TOUS ces tags`;
          }
        }, 100);
      }

      // Save changes to storage
      EventBus.emit(Events.STORAGE_SAVE);
    },

    refreshCurrentPage(contentType) {
      if (contentType === 'monster') {
        this.refreshMonstersPage();
      } else if (contentType === 'tableTresor') {
        this.refreshTablesTresorsPage();
      } else {
        this.refreshObjectsPage();
      }
    },

    updateContentVisibility(contentType) {
      if (contentType === 'monster') {
        this.updateMonstersVisibility();
      } else if (contentType === 'tableTresor') {
        this.updateTablesTresorsVisibility();
      } else {
        this.updateObjectVisibility();
      }
    },

    updateMonstersVisibility() {
      if (!window.MONSTRES_FILTER_STATE) return;
      
      const visibleTags = window.MONSTRES_FILTER_STATE.visibleTags;
      const allMonsterCards = document.querySelectorAll('#monstres-container .card');
      
      allMonsterCards.forEach(card => {
        const monsterName = card.dataset.monsterName || card.querySelector('[data-edit-section*="nom"]')?.textContent;
        if (!monsterName) return;
        
        // Trouver le monstre correspondant dans les données
        const monster = window.MONSTRES.find(m => m.nom === monsterName);
        if (!monster || !monster.tags) return;
        
        // En mode "ET" : le monstre doit avoir TOUS les tags visibles
        const shouldShow = visibleTags.length === 0 || 
                          visibleTags.every(tag => monster.tags.includes(tag));
        
        card.style.display = shouldShow ? '' : 'none';
      });
    },

    updateTablesTresorsVisibility() {
      if (!window.TABLES_TRESORS_FILTER_STATE) return;
      
      const visibleTags = window.TABLES_TRESORS_FILTER_STATE.visibleTags;
      const allTableCards = document.querySelectorAll('#tables-tresors-container .card');
      
      allTableCards.forEach(card => {
        const tableName = card.dataset.tableTresorName;
        if (!tableName) return;
        
        // Trouver la table correspondante dans les données
        const table = window.TABLES_TRESORS?.tables?.find(t => t.nom === tableName);
        if (!table || !table.tags) return;
        
        // En mode "OR" : la table doit avoir AU MOINS UN des tags visibles
        const shouldShow = visibleTags.length === 0 || 
                          visibleTags.some(tag => table.tags.includes(tag));
        
        card.style.display = shouldShow ? '' : 'none';
      });
    },

    // Update object visibility based on current filter settings
    updateObjectVisibility() {
      const allObjects = document.querySelectorAll('.card[data-objet-name]');
      const visibleTags = window.OBJETS.filterSettings?.visibleTags || [];
      
      allObjects.forEach(card => {
        const objetName = card.dataset.objetName;
        const objet = window.OBJETS.objets?.find(o => o.nom === objetName);
        
        if (objet && objet.tags) {
          // Check if object should be visible based on current filter settings
          const hasVisibleTag = objet.tags.some(tag => visibleTags.includes(tag));
          
          // Apply same logic as PageBuilder for "Départ" tag requirement
          const isMJMode = window.JdrApp?.state?.isMJ || false;
          const isDevMode = window.JdrApp?.utils?.isDevMode?.() || false;
          const bypassDepartRequirement = isMJMode || isDevMode || window.activeIdSearch;
          
          let shouldShow = hasVisibleTag && visibleTags.length > 0;
          
          // CONDITION OBLIGATOIRE : L'objet doit avoir le tag "Départ" pour être visible
          // SAUF si mode MJ activé, dev mode activé, ou recherche par ID active
          if (shouldShow && !bypassDepartRequirement) {
            const hasDepartTag = objet.tags.includes('Départ');
            if (!hasDepartTag) {
              shouldShow = false;
            }
          }
          
          if (shouldShow) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        }
      });
      
      // Update filter count display if it exists
      const filterCount = document.querySelector('.filter-count');
      if (filterCount) {
        const visibleCount = Array.from(allObjects).filter(card => card.style.display !== 'none').length;
        filterCount.textContent = `${visibleCount} objet(s) affiché(s)`;
      }
    },

    // Select all tags
    selectAllTags() {
      if (!window.OBJETS.filterSettings) {
        window.OBJETS.filterSettings = { visibleTags: [] };
      }

      // Get all available tags and set them as visible
      const availableTags = window.ContentTypes.objet.filterConfig.availableTags || [];
      window.OBJETS.filterSettings.visibleTags = [...availableTags];

      // Reset regeneration flag since we're doing a full reset
      this._needsRegenerationAfterEmpty = false;

      // Save changes to storage
      EventBus.emit(Events.STORAGE_SAVE);
      
      // Regenerate the objects page to reflect changes
      this.refreshObjectsPage();
    },

    // Select no tags (allow having no tags active)
    selectNoTags() {
      if (!window.OBJETS.filterSettings) {
        window.OBJETS.filterSettings = { visibleTags: [] };
      }

      // Clear all visible tags
      window.OBJETS.filterSettings.visibleTags = [];

      // Reset regeneration flag since we're starting fresh
      this._needsRegenerationAfterEmpty = false;

      // Save changes to storage
      EventBus.emit(Events.STORAGE_SAVE);
      
      // Regenerate the objects page to reflect changes
      this.refreshObjectsPage();
    },

    // Refresh the objects page after filter changes
    refreshObjectsPage() {
      // Clean up active tags that are not in displayed buttons
      this.cleanupActiveFilters();
      
      // Don't regenerate if an ID search is active
      if (window.activeIdSearch) {
        // Just show notification, keep current display
        const tagCount = window.OBJETS.filterSettings?.visibleTags?.length || 0;
        this.showNotification(`🏷️ Filtres mis à jour (${tagCount} tag${tagCount > 1 ? 's' : ''} actif${tagCount > 1 ? 's' : ''}) - Recherche par ID active`, 'success');
        return;
      }

      // Regenerate and update the objects page
      if (JdrApp.modules.renderer?.regenerateCurrentPage) {
        JdrApp.modules.renderer.regenerateCurrentPage();
      }
      
      // Show notification
      const tagCount = window.OBJETS.filterSettings?.visibleTags?.length || 0;
      this.showNotification(`🏷️ Filtres mis à jour (${tagCount} tag${tagCount > 1 ? 's' : ''} actif${tagCount > 1 ? 's' : ''})`, 'success');
    },

    // Clean up active filters to ensure only displayed buttons can be active
    cleanupActiveFilters() {
      if (!window.OBJETS?.filterSettings) return;
      
      const displayedButtons = window.OBJETS.filterSettings.displayedFilterButtons || [];
      const activeFilters = window.OBJETS.filterSettings.visibleTags || [];
      
      // Remove any active filters that are not in displayed buttons
      const cleanedActiveFilters = activeFilters.filter(tag => displayedButtons.includes(tag));
      
      // Update if something was cleaned
      if (cleanedActiveFilters.length !== activeFilters.length) {
        window.OBJETS.filterSettings.visibleTags = cleanedActiveFilters;
        const removedCount = activeFilters.length - cleanedActiveFilters.length;
      }
    },

    // ========================================
    // UTILITY METHODS
    // ========================================

    // Créer une modale simple
    createModal(title, content) {
      // Créer le overlay de la modale
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      // Créer la modale
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: var(--parchment, #f4f1e8);
        border: 2px solid var(--bronze, #8b5c17);
        border-radius: 8px;
        padding: 1.5rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      `;

      modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--bronze); padding-bottom: 0.5rem;">
          <h3 style="margin: 0; color: var(--bronze);">${title}</h3>
          <button type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--bronze);" title="Fermer">✕</button>
        </div>
        <div>${content}</div>
      `;

      overlay.appendChild(modal);

      // Méthode pour fermer la modale
      overlay.close = () => {
        document.body.removeChild(overlay);
      };

      // Gestionnaires d'événements pour fermer
      const closeBtn = modal.querySelector('button');
      closeBtn.addEventListener('click', overlay.close);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.close();
        }
      });

      // Ajouter au DOM
      document.body.appendChild(overlay);

      return overlay;
    },

    // ========================================
    // TABLES DE TRÉSORS - GESTION DES FOURCHETTES
    // ========================================

    // Éditer une fourchette existante
    editFourchette(tableName, fourchetteIndex) {
      const table = this.findTableTresor(tableName);
      if (!table || !table.fourchettes || fourchetteIndex >= table.fourchettes.length) {
        this.showNotification('Table ou fourchette introuvable', 'error');
        return;
      }

      const fourchette = table.fourchettes[fourchetteIndex];
      this.showFourchetteModal(tableName, fourchetteIndex, fourchette);
    },

    // Supprimer une fourchette
    deleteFourchette(tableName, fourchetteIndex) {
      const table = this.findTableTresor(tableName);
      if (!table || !table.fourchettes || fourchetteIndex >= table.fourchettes.length) {
        this.showNotification('Table ou fourchette introuvable', 'error');
        return;
      }

      // Supprimer la fourchette
      table.fourchettes.splice(fourchetteIndex, 1);

      // Sauvegarder les changements
      EventBus.emit(Events.STORAGE_SAVE);

      // Supprimer la fourchette du DOM et réindexer
      this.removeFourchetteFromDOM(tableName, fourchetteIndex);

      this.showNotification('Fourchette supprimée', 'success');
    },

    // Ajouter une nouvelle fourchette
    addFourchette(tableName) {
      const table = this.findTableTresor(tableName);
      if (!table) {
        this.showNotification('Table introuvable', 'error');
        return;
      }

      // Calculer les valeurs par défaut pour la nouvelle fourchette
      const lastFourchette = table.fourchettes?.[table.fourchettes.length - 1];
      const nextMin = lastFourchette ? lastFourchette.max + 1 : 1;
      const nextMax = nextMin + 4; // Fourchette de 5 valeurs par défaut

      const newFourchette = {
        min: nextMin,
        max: nextMax,
        objet: {
          type: "reference",
          numero: 1,
          nom: "Nouvel objet"
        }
      };

      // Ajouter la nouvelle fourchette
      if (!table.fourchettes) {
        table.fourchettes = [];
      }
      table.fourchettes.push(newFourchette);

      // Ouvrir immédiatement le modal d'édition
      const newIndex = table.fourchettes.length - 1;
      this.showFourchetteModal(tableName, newIndex, newFourchette);
    },

    // Trouver une table de trésor par nom
    findTableTresor(tableName) {
      return window.TABLES_TRESORS?.tables?.find(table => table.nom === tableName);
    },

    // Afficher le modal d'édition d'une fourchette
    showFourchetteModal(tableName, fourchetteIndex, fourchette) {
      const modal = this.createModal('Éditer la fourchette', `
        <form id="fourchette-edit-form" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; gap: 1rem;">
            <div style="flex: 1;">
              <label for="fourchette-min" style="display: block; margin-bottom: 0.25rem; font-weight: 600;">🎲 Valeur minimum:</label>
              <input type="number" id="fourchette-min" value="${fourchette.min}" min="1" style="width: 100%; padding: 0.5rem; border: 1px solid var(--bronze); border-radius: 4px;">
            </div>
            <div style="flex: 1;">
              <label for="fourchette-max" style="display: block; margin-bottom: 0.25rem; font-weight: 600;">🎲 Valeur maximum:</label>
              <input type="number" id="fourchette-max" value="${fourchette.max}" min="1" style="width: 100%; padding: 0.5rem; border: 1px solid var(--bronze); border-radius: 4px;">
            </div>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.25rem; font-weight: 600;">📦 Objet sélectionné:</label>
            <div id="selected-object-display" style="padding: 0.75rem; border: 1px solid var(--bronze); border-radius: 4px; background: #f9f9f9; margin-bottom: 0.5rem; min-height: 2rem; display: flex; align-items: center; justify-content: space-between;">
              <span id="selected-object-text" style="flex: 1;">
                ${fourchette.objet?.nom ? `📦 ${fourchette.objet.nom} (N°${fourchette.objet.numero})` : 'Aucun objet sélectionné'}
              </span>
              ${fourchette.objet?.nom ? `<button type="button" id="clear-object-selection" style="background: #dc2626; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 0.8em; cursor: pointer;" title="Effacer la sélection">✕</button>` : ''}
            </div>
            <button type="button" id="select-object-btn" style="width: 100%; background: var(--accent); color: white; padding: 0.75rem; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
              🔍 Sélectionner un objet
            </button>
            <input type="hidden" id="fourchette-objet-numero" value="${fourchette.objet?.numero || ''}">
            <input type="hidden" id="fourchette-objet-nom" value="${fourchette.objet?.nom || ''}">
          </div>
          
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button type="submit" style="flex: 1; background: var(--accent); color: white; padding: 0.75rem; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
              ✅ Sauvegarder
            </button>
            <button type="button" id="cancel-fourchette-edit" style="flex: 1; background: #666; color: white; padding: 0.75rem; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
              ❌ Annuler
            </button>
          </div>
        </form>
      `);

      // Gestionnaire de soumission
      const form = modal.querySelector('#fourchette-edit-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveFourchette(tableName, fourchetteIndex, modal);
      });

      // Gestionnaire d'annulation
      modal.querySelector('#cancel-fourchette-edit').addEventListener('click', () => {
        modal.close();
      });

      // Gestionnaire de sélection d'objet
      modal.querySelector('#select-object-btn').addEventListener('click', () => {
        this.showObjectSelectionModal(modal);
      });

      // Gestionnaire d'effacement de sélection (si présent)
      const clearBtn = modal.querySelector('#clear-object-selection');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearObjectSelection(modal);
        });
      }
    },

    // Sauvegarder les modifications d'une fourchette
    saveFourchette(tableName, fourchetteIndex, modal) {
      const table = this.findTableTresor(tableName);
      if (!table) {
        this.showNotification('Table introuvable', 'error');
        return;
      }

      // Récupérer les valeurs du formulaire
      const minValue = parseInt(modal.querySelector('#fourchette-min').value);
      const maxValue = parseInt(modal.querySelector('#fourchette-max').value);
      const objetNumero = parseInt(modal.querySelector('#fourchette-objet-numero').value);
      const objetNom = modal.querySelector('#fourchette-objet-nom').value.trim();

      // Validation
      if (minValue <= 0 || maxValue <= 0 || minValue > maxValue) {
        this.showNotification('Les valeurs min/max doivent être positives et min ≤ max', 'error');
        return;
      }

      if (!objetNumero || !objetNom) {
        this.showNotification('Veuillez sélectionner un objet', 'error');
        return;
      }

      // Mettre à jour la fourchette
      const updatedFourchette = {
        min: minValue,
        max: maxValue,
        objet: {
          type: "reference",
          numero: objetNumero,
          nom: objetNom
        }
      };

      table.fourchettes[fourchetteIndex] = updatedFourchette;

      // Sauvegarder les changements
      EventBus.emit(Events.STORAGE_SAVE);

      // Fermer le modal
      modal.close();

      // Mettre à jour immédiatement l'affichage de la fourchette modifiée
      this.updateFourchetteDisplay(tableName, fourchetteIndex, updatedFourchette);

      this.showNotification('Fourchette mise à jour', 'success');
    },

    // Afficher la prévisualisation d'un objet
    showObjectPreview(objetNumero) {
      // Trouver l'objet par son numéro
      const objet = this.findObjetByNumero(objetNumero);
      
      if (!objet) {
        this.showNotification(`Objet N°${objetNumero} introuvable`, 'error');
        return;
      }

      // Construire l'affichage des tags
      const tagsDisplay = objet.tags && objet.tags.length > 0 
        ? objet.tags.map(tag => `<span class="tag-chip" style="background: var(--bronze); color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.8em; margin-right: 4px;">${tag}</span>`).join('')
        : '<span style="font-style: italic; color: #666;">Aucun tag</span>';

      // Créer le contenu de la prévisualisation
      const previewContent = `
        <div style="text-align: center; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0; font-size: 0.9em; color: var(--bronze);">
            <div style="font-weight: bold;">N°${objet.numero}</div>
            <div style="flex: 1; text-align: right;">
              ${tagsDisplay}
            </div>
          </div>
        </div>
        
        <div style="margin: 1rem 0; text-align: center; font-style: italic;">
          ${objet.description}
        </div>
        
        <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--rule);">
        
        <div style="margin: 1rem 0;">
          ${objet.effet}
        </div>
        
        <div style="display: flex; justify-content: space-between; gap: 1rem; margin: 1rem 0; font-size: 0.9em;">
          <div style="flex: 1;">
            ${objet.prix}
          </div>
          <div style="flex: 1;">
            ${objet.poids}
          </div>
        </div>
      `;

      // Afficher la modal de prévisualisation
      const modal = this.createModal(`📦 ${objet.nom}`, previewContent);

      // Ajouter un bouton pour aller à la page de l'objet si désiré
      const modalContent = modal.querySelector('div:last-child');
      modalContent.insertAdjacentHTML('beforeend', `
        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--rule);">
          <button type="button" onclick="window.location.hash = '#/objets'; this.closest('.modal-overlay, [style*=fixed]').remove();" 
                  style="background: var(--accent); color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
            🔗 Voir tous les objets
          </button>
        </div>
      `);
    },

    // Trouver un objet par son numéro
    findObjetByNumero(numero) {
      if (!window.OBJETS || !window.OBJETS.objets) {
        return null;
      }
      
      return window.OBJETS.objets.find(objet => objet.numero === numero);
    },

    // Afficher la modal de sélection d'objets
    showObjectSelectionModal(parentModal) {
      const objets = window.OBJETS?.objets || [];
      
      if (objets.length === 0) {
        this.showNotification('Aucun objet disponible', 'error');
        return;
      }

      const selectionContent = `
        <div style="margin-bottom: 1rem;">
          <label for="object-search" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">🔍 Rechercher un objet:</label>
          <input type="text" id="object-search" placeholder="Tapez le nom ou numéro d'un objet..." 
                 style="width: 100%; padding: 0.75rem; border: 1px solid var(--bronze); border-radius: 4px; font-size: 1rem;">
        </div>
        
        <div style="margin-bottom: 1rem; color: var(--bronze); font-size: 0.9em;">
          <span id="object-count">${objets.length} objet(s) disponible(s)</span>
        </div>
        
        <div id="objects-list" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--bronze); border-radius: 4px;">
          ${this.generateObjectsList(objets)}
        </div>
        
        <div style="text-align: center; margin-top: 1rem;">
          <button type="button" id="cancel-object-selection" style="background: #666; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
            ❌ Annuler
          </button>
        </div>
      `;

      const selectionModal = this.createModal('📦 Sélectionner un objet', selectionContent);
      
      // Référence au modal parent pour pouvoir le mettre à jour
      selectionModal._parentModal = parentModal;

      // Gestionnaire de recherche
      const searchInput = selectionModal.querySelector('#object-search');
      const objectsList = selectionModal.querySelector('#objects-list');
      const objectCount = selectionModal.querySelector('#object-count');
      
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const query = searchInput.value.toLowerCase().trim();
          const filteredObjets = this.filterObjects(objets, query);
          objectsList.innerHTML = this.generateObjectsList(filteredObjets);
          objectCount.textContent = `${filteredObjets.length} objet(s) trouvé(s)`;
          
          // Réattacher les gestionnaires de clic
          this.attachObjectClickHandlers(selectionModal);
        }, 300);
      });

      // Gestionnaire d'annulation
      selectionModal.querySelector('#cancel-object-selection').addEventListener('click', () => {
        selectionModal.close();
      });

      // Attacher les gestionnaires de clic aux objets
      this.attachObjectClickHandlers(selectionModal);

      // Focus sur le champ de recherche
      setTimeout(() => {
        searchInput.focus();
      }, 100);
    },

    // Générer la liste HTML des objets
    generateObjectsList(objets) {
      if (objets.length === 0) {
        return '<div style="padding: 2rem; text-align: center; color: #666; font-style: italic;">Aucun objet trouvé</div>';
      }

      return objets.map(objet => {
        const tagsDisplay = objet.tags && objet.tags.length > 0 
          ? objet.tags.slice(0, 3).map(tag => `<span style="background: var(--bronze); color: white; padding: 1px 4px; border-radius: 3px; font-size: 0.7em; margin-left: 4px;">${tag}</span>`).join('')
          : '';

        return `
          <div class="object-selection-item" data-object-numero="${objet.numero}" data-object-nom="${objet.nom}" 
               style="padding: 0.75rem; border-bottom: 1px solid #ddd; cursor: pointer; transition: background 0.2s;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--bronze);">
                  📦 ${objet.nom}
                </div>
                <div style="font-size: 0.9em; color: #666; margin-top: 2px;">
                  N°${objet.numero} • ${objet.description.substring(0, 60)}${objet.description.length > 60 ? '...' : ''}
                </div>
              </div>
              <div style="text-align: right;">
                ${tagsDisplay}
              </div>
            </div>
          </div>
        `;
      }).join('');
    },

    // Filtrer les objets selon la recherche
    filterObjects(objets, query) {
      if (!query) return objets;

      return objets.filter(objet => {
        return (
          objet.nom.toLowerCase().includes(query) ||
          objet.description.toLowerCase().includes(query) ||
          objet.numero.toString().includes(query) ||
          (objet.tags && objet.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      });
    },

    // Attacher les gestionnaires de clic aux objets
    attachObjectClickHandlers(selectionModal) {
      const objectItems = selectionModal.querySelectorAll('.object-selection-item');
      
      objectItems.forEach(item => {
        // Style au survol
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = 'rgba(139, 92, 23, 0.1)';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = '';
        });

        // Clic pour sélectionner
        item.addEventListener('click', () => {
          const numero = parseInt(item.dataset.objectNumero);
          const nom = item.dataset.objectNom;
          
          this.selectObject(selectionModal._parentModal, numero, nom);
          selectionModal.close();
        });
      });
    },

    // Sélectionner un objet et mettre à jour le modal parent
    selectObject(parentModal, numero, nom) {
      const numeroInput = parentModal.querySelector('#fourchette-objet-numero');
      const nomInput = parentModal.querySelector('#fourchette-objet-nom');
      const displayText = parentModal.querySelector('#selected-object-text');
      const displayContainer = parentModal.querySelector('#selected-object-display');

      numeroInput.value = numero;
      nomInput.value = nom;
      displayText.textContent = `📦 ${nom} (N°${numero})`;
      
      // Ajouter le bouton d'effacement s'il n'existe pas
      if (!parentModal.querySelector('#clear-object-selection')) {
        displayContainer.insertAdjacentHTML('beforeend', `
          <button type="button" id="clear-object-selection" style="background: #dc2626; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 0.8em; cursor: pointer;" title="Effacer la sélection">✕</button>
        `);
        
        // Attacher le gestionnaire au nouveau bouton
        parentModal.querySelector('#clear-object-selection').addEventListener('click', () => {
          this.clearObjectSelection(parentModal);
        });
      }

      this.showNotification(`📦 "${nom}" sélectionné`, 'success');
    },

    // Effacer la sélection d'objet
    clearObjectSelection(parentModal) {
      const numeroInput = parentModal.querySelector('#fourchette-objet-numero');
      const nomInput = parentModal.querySelector('#fourchette-objet-nom');
      const displayText = parentModal.querySelector('#selected-object-text');
      const clearBtn = parentModal.querySelector('#clear-object-selection');

      numeroInput.value = '';
      nomInput.value = '';
      displayText.textContent = 'Aucun objet sélectionné';
      
      if (clearBtn) {
        clearBtn.remove();
      }

      this.showNotification('Sélection effacée', 'info');
    },

    // Mettre à jour l'affichage d'une fourchette spécifique sans recharger la page
    updateFourchetteDisplay(tableName, fourchetteIndex, updatedFourchette) {
      try {
        // Trouver la table et la fourchette dans le DOM
        const tableCard = document.querySelector(`[data-table-tresor-name="${tableName}"]`);
        if (!tableCard) {
          console.warn('Table non trouvée dans le DOM:', tableName);
          this.forcePageRefresh();
          return;
        }

        // Trouver toutes les fourchettes de cette table
        const fourchetteRows = tableCard.querySelectorAll('.fourchette-row');
        if (fourchetteIndex >= fourchetteRows.length) {
          console.warn('Index de fourchette invalide:', fourchetteIndex);
          this.forcePageRefresh();
          return;
        }

        const fourchetteRow = fourchetteRows[fourchetteIndex];
        
        // Générer le nouveau contenu pour cette fourchette
        const objet = updatedFourchette.objet;
        const objetLink = objet?.type === 'reference' 
          ? `<a href="#" class="object-preview-link" data-object-numero="${objet.numero}" style="color: var(--accent); text-decoration: none;" title="Cliquer pour prévisualiser l'objet #${objet.numero}">📦 ${objet.nom} (N°${objet.numero})</a>`
          : `📦 ${objet?.nom || 'Objet inconnu'}`;

        // Déterminer si on doit afficher les boutons d'édition
        const shouldShowButtons = this.shouldShowFourchetteButtons();
        const editButtons = shouldShowButtons ? `
          <div class="fourchette-actions" style="margin-left: 8px; display: flex; gap: 4px;">
            <button class="edit-fourchette-btn" data-table-name="${tableName}" data-fourchette-index="${fourchetteIndex}" title="Éditer cette fourchette" style="background: #3b82f6; color: white; border: none; border-radius: 4px; padding: 2px 6px; font-size: 0.8em; cursor: pointer;">✏️</button>
            <button class="delete-fourchette-btn" data-table-name="${tableName}" data-fourchette-index="${fourchetteIndex}" title="Supprimer cette fourchette" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 2px 6px; font-size: 0.8em; cursor: pointer;">🗑️</button>
          </div>
        ` : '';

        // Mettre à jour le contenu de la fourchette
        fourchetteRow.innerHTML = `
          <div class="fourchette-range" style="font-weight: bold; color: var(--bronze); min-width: 80px;">
            🎲 ${updatedFourchette.min}-${updatedFourchette.max}
          </div>
          <div class="fourchette-objet" style="flex: 1; margin-left: 12px;">
            ${objetLink}
          </div>
          ${editButtons}
        `;

        console.log('Fourchette mise à jour dans le DOM:', tableName, fourchetteIndex);
        
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la fourchette:', error);
        // En cas d'erreur, on revient au rechargement complet
        this.forcePageRefresh();
      }
    },

    // Supprimer une fourchette du DOM et réindexer les autres
    removeFourchetteFromDOM(tableName, fourchetteIndex) {
      try {
        const tableCard = document.querySelector(`[data-table-tresor-name="${tableName}"]`);
        if (!tableCard) {
          console.warn('Table non trouvée dans le DOM:', tableName);
          this.forcePageRefresh();
          return;
        }

        const fourchetteRows = tableCard.querySelectorAll('.fourchette-row');
        if (fourchetteIndex >= fourchetteRows.length) {
          console.warn('Index de fourchette invalide:', fourchetteIndex);
          this.forcePageRefresh();
          return;
        }

        // Supprimer l'élément du DOM
        fourchetteRows[fourchetteIndex].remove();

        // Réindexer toutes les fourchettes restantes pour les boutons d'édition
        const remainingRows = tableCard.querySelectorAll('.fourchette-row');
        remainingRows.forEach((row, newIndex) => {
          const editBtn = row.querySelector('.edit-fourchette-btn');
          const deleteBtn = row.querySelector('.delete-fourchette-btn');
          
          if (editBtn) editBtn.dataset.fourchetteIndex = newIndex;
          if (deleteBtn) deleteBtn.dataset.fourchetteIndex = newIndex;
        });

        console.log('Fourchette supprimée du DOM:', tableName, fourchetteIndex);
        
      } catch (error) {
        console.error('Erreur lors de la suppression de la fourchette:', error);
        this.forcePageRefresh();
      }
    },

    // Vérifier si on doit afficher les boutons d'édition des fourchettes
    shouldShowFourchetteButtons() {
      // Reprendre la même logique que dans CardBuilder
      return JdrApp.utils.isDevMode() || 
             (!window.STANDALONE_VERSION && window.location.search.includes('dev=1')) ||
             (document.body.classList.contains('dev-on')) ||
             (window.location.protocol === 'file:' && !window.STANDALONE_VERSION) ||
             (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    },

    showPageLinksModal() {
      let modal = JdrApp.utils.dom.$('#pageLinksModal');
      if (modal) {
        document.body.removeChild(modal);
      }
      
      modal = this.createPageLinksModal();
      document.body.appendChild(modal);
      
      this.openModal('pageLinksModal');
    },

    createPageLinksModal() {
      // Construire la liste des pages à partir de la structure TOC
      const pages = [];
      
      if (window.TOC_STRUCTURE && window.TOC_STRUCTURE.sections) {
        window.TOC_STRUCTURE.sections.forEach(section => {
          if (section.items && Array.isArray(section.items)) {
            section.items.forEach(item => {
              if (item.type === 'page') {
                pages.push({
                  id: item.id,
                  title: item.title,
                  icon: item.icon,
                  section: section.title
                });
              } else if (item.type === 'category') {
                // Ajouter la page principale de catégorie
                pages.push({
                  id: item.id,
                  title: item.title,
                  icon: item.icon,
                  section: section.title
                });
                
                // Ajouter les sous-catégories si elles existent
                if (item.id === 'sorts' && window.SORTS) {
                  window.SORTS.forEach(category => {
                    pages.push({
                      id: `sorts-${category.nom}`,
                      title: `${category.nom} (sorts)`,
                      icon: '🔮',
                      section: section.title
                    });
                  });
                } else if (item.id === 'dons' && window.DONS) {
                  window.DONS.forEach(category => {
                    pages.push({
                      id: `dons-${category.nom}`,
                      title: `${category.nom} (dons)`,
                      icon: '🎖️',
                      section: section.title
                    });
                  });
                } else if (item.id === 'classes' && window.CLASSES) {
                  window.CLASSES.forEach(classe => {
                    pages.push({
                      id: classe.nom.toLowerCase(),
                      title: classe.nom,
                      icon: '⚔️',
                      section: section.title
                    });
                  });
                }
              }
            });
          }
        });
      }

      const pagesHTML = pages.map(page => `
        <div class="page-item" data-page-id="${page.id}">
          <div class="page-info">
            <div class="page-name">${page.icon} ${page.title}</div>
            <div class="page-section" style="color: var(--paper-muted); font-size: 12px;">${page.section}</div>
          </div>
          <div class="copy-indicator">Copié!</div>
        </div>
      `).join('');

      const modal = JdrApp.utils.dom.create('div', 'modal page-links-modal', `
        <div class="modal-content page-links-modal-content">
          <div style="position: relative;">
            <button class="modal-close-x" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--paper-muted); padding: 4px 8px; border-radius: 4px; transition: all 0.2s ease;" onmouseover="this.style.background='var(--rule)'; this.style.color='var(--accent-ink)';" onmouseout="this.style.background='none'; this.style.color='var(--paper-muted)';">×</button>
            <h3>🔗 Liens vers les pages</h3>
          </div>
          <p>Cliquez sur une page pour copier un lien vers celle-ci.</p>
          <div class="pages-search">
            <input type="text" id="pageSearchInput" placeholder="Rechercher une page..." style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid var(--rule); border-radius: 4px;">
          </div>
          <div class="pages-list" style="max-height: 400px; overflow-y: auto;">
            ${pagesHTML || '<div style="text-align: center; color: #666; padding: 2rem;">Aucune page trouvée</div>'}
          </div>
          <button class="modal-close btn">Fermer</button>
        </div>
      `, { id: 'pageLinksModal' });

      // Recherche dans la modal
      const searchInput = modal.querySelector('#pageSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          const pageItems = modal.querySelectorAll('.page-item');
          
          pageItems.forEach(item => {
            const pageName = item.querySelector('.page-name').textContent.toLowerCase();
            const pageSection = item.querySelector('.page-section').textContent.toLowerCase();
            
            if (pageName.includes(searchTerm) || pageSection.includes(searchTerm)) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
        });
      }

      // Clic sur une page
      modal.addEventListener('click', (e) => {
        const pageItem = e.target.closest('.page-item');
        if (pageItem) {
          const pageId = pageItem.dataset.pageId;
          const pageTitle = pageItem.querySelector('.page-name').textContent.replace(/^[^\s]+ /, ''); // Enlever l'icône
          
          // Créer le lien vers la page
          const pageLink = `<a href="#/${pageId}" style="color: var(--accent); text-decoration: underline;">${pageTitle}</a>`;
          
          this.copyToClipboard(pageLink);
          
          pageItem.classList.add('copied');
          
          // Fermer la modale après un court délai pour voir l'effet "Copié!"
          setTimeout(() => {
            this.closeModal(modal);
          }, 500);
        }
      });

      // Gestionnaire pour le bouton X de fermeture
      const closeBtn = modal.querySelector('.modal-close-x');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeModal(modal);
        });
      }

      return modal;
    },

    // Méthode robuste pour forcer le rafraîchissement de la page (fallback)
    forcePageRefresh() {
      setTimeout(() => {
        try {
          const currentHash = window.location.hash;
          const pageName = currentHash.replace('#/', '');
          
          if (JdrApp.modules.router && JdrApp.modules.router.show) {
            JdrApp.modules.router.show(pageName);
          } else if (JdrApp.modules.renderer && JdrApp.modules.renderer.regenerateCurrentPage) {
            JdrApp.modules.renderer.regenerateCurrentPage();
          } else {
            window.location.reload();
          }
        } catch (error) {
          console.error('Erreur lors du rafraîchissement:', error);
          window.location.reload();
        }
      }, 100);
    }
  };

})();