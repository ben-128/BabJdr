// ============================================================================
// JDR-BAB APPLICATION - BASE MODAL CLASS
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // BASE MODAL - GENERIC MODAL MANAGEMENT
  // ========================================
  window.BaseModal = {
    /**
     * Initialize modal system event listeners
     */
    init() {
      this.setupModalEventListeners();
    },

    /**
     * Setup global modal event listeners
     */
    setupModalEventListeners() {
      // Close modal on overlay click or close button
      JdrApp.utils.events.register('click', '.modal-overlay, .modal-close', (e) => {
        const modal = e.target.closest('.modal') || document.querySelector('.modal.visible');
        if (modal) {
          this.closeModal(modal);
        }
      });

      // Prevent modal content clicks from closing modal
      JdrApp.utils.events.register('click', '.modal-content', (e) => {
        e.stopPropagation();
      });

      // Close modal on Escape key
      JdrApp.utils.events.register('keydown', 'body', (e) => {
        if (e.key === 'Escape') {
          const openModal = document.querySelector('.modal.visible');
          if (openModal) {
            this.closeModal(openModal);
          }
        }
      });

      // EventBus integration
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

    /**
     * Create a generic modal with common structure
     */
    createModal(id, title, content, options = {}) {
      const modal = document.createElement('div');
      modal.id = id;
      modal.className = 'modal';
      modal.style.display = 'none';

      const isDialog = options.useDialog !== false;
      
      if (isDialog) {
        modal.innerHTML = `
          <div class="modal-overlay">
            <div class="modal-content">
              <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" type="button">✕</button>
              </div>
              <div class="modal-body">
                ${content}
              </div>
              ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
          </div>
        `;
      } else {
        // For dialog elements
        modal.innerHTML = `
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" type="button">✕</button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
        `;
      }

      return modal;
    },

    /**
     * Open modal by ID or element
     */
    openModal(modalId) {
      const modal = typeof modalId === 'string' 
        ? JdrApp.utils.dom.$(`#${modalId}`) 
        : modalId;
        
      if (modal) {
        if (modal.tagName === 'DIALOG') {
          modal.showModal();
        } else {
          modal.classList.add('visible');
          modal.style.display = 'flex';
        }
        
        // Force background and opacity on modal
        modal.style.setProperty('background', 'rgba(0, 0, 0, 0.7)', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        
        // Force background on modal content
        const modalContent = modal.querySelector('.modal-content, .modal-body');
        if (modalContent) {
          modalContent.style.setProperty('background', 'rgb(248, 246, 240)', 'important');
          modalContent.style.setProperty('opacity', '1', 'important');
        }
        
        // Focus first input element
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 100);
        }

        // Emit event
        EventBus.emit(Events.MODAL_OPENED, { modal, modalId });
      }
    },

    /**
     * Close modal
     */
    closeModal(modal) {
      if (modal) {
        if (modal.tagName === 'DIALOG') {
          modal.close();
        } else {
          modal.classList.remove('visible');
          modal.style.display = 'none';
        }
        
        // Reset form if present
        const form = modal.querySelector('form');
        if (form) {
          form.reset();
        }

        // Emit event
        EventBus.emit(Events.MODAL_CLOSED, { modal });
      }
    },

    /**
     * Remove modal from DOM
     */
    destroyModal(modalId) {
      const modal = typeof modalId === 'string' 
        ? JdrApp.utils.dom.$(`#${modalId}`) 
        : modalId;
        
      if (modal) {
        this.closeModal(modal);
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }
    },

    /**
     * Show confirmation dialog
     */
    showConfirmation(message, title = 'Confirmation', onConfirm = null, onCancel = null) {
      const modalId = 'confirmationModal';
      
      // Remove existing confirmation modal
      this.destroyModal(modalId);

      const content = `
        <p style="margin-bottom: 20px;">${message}</p>
      `;

      const footer = `
        <button type="button" class="btn btn-secondary" id="cancelBtn">Annuler</button>
        <button type="button" class="btn btn-danger" id="confirmBtn">Confirmer</button>
      `;

      const modal = this.createModal(modalId, title, content, { footer });
      document.body.appendChild(modal);

      // Setup button handlers
      const confirmBtn = modal.querySelector('#confirmBtn');
      const cancelBtn = modal.querySelector('#cancelBtn');

      const handleConfirm = () => {
        if (onConfirm) onConfirm();
        this.closeModal(modal);
        this.destroyModal(modal);
      };

      const handleCancel = () => {
        if (onCancel) onCancel();
        this.closeModal(modal);
        this.destroyModal(modal);
      };

      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);

      this.openModal(modalId);
      
      return modal;
    },

    /**
     * Show input dialog
     */
    showInput(message, title = 'Saisie', defaultValue = '', onSubmit = null, onCancel = null) {
      const modalId = 'inputModal';
      
      // Remove existing input modal
      this.destroyModal(modalId);

      const content = `
        <label style="display: block; margin-bottom: 10px;">${message}</label>
        <input type="text" id="inputValue" value="${defaultValue}" style="width: 100%; padding: 8px; margin-bottom: 20px;" />
      `;

      const footer = `
        <button type="button" class="btn btn-secondary" id="cancelBtn">Annuler</button>
        <button type="button" class="btn btn-primary" id="submitBtn">Valider</button>
      `;

      const modal = this.createModal(modalId, title, content, { footer });
      document.body.appendChild(modal);

      const inputElement = modal.querySelector('#inputValue');
      const submitBtn = modal.querySelector('#submitBtn');
      const cancelBtn = modal.querySelector('#cancelBtn');

      const handleSubmit = () => {
        const value = inputElement.value.trim();
        if (onSubmit) onSubmit(value);
        this.closeModal(modal);
        this.destroyModal(modal);
      };

      const handleCancel = () => {
        if (onCancel) onCancel();
        this.closeModal(modal);
        this.destroyModal(modal);
      };

      submitBtn.addEventListener('click', handleSubmit);
      cancelBtn.addEventListener('click', handleCancel);
      
      inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSubmit();
        }
      });

      this.openModal(modalId);
      inputElement.focus();
      inputElement.select();
      
      return modal;
    }
  };

})();