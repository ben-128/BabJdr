// ============================================================================
// CAMPAIGN SCHEMAS EDITOR
// ============================================================================

const CampaignSchemas = {
  canvas: null,
  ctx: null,
  isDrawing: false,
  currentTool: 'pen',
  currentColor: '#000000',
  lineWidth: 2,
  startX: 0,
  startY: 0,
  history: [],
  currentState: null,

  init() {
    console.log('CampaignSchemas.init() called');
    this.canvas = document.getElementById('schemaCanvas');
    if (!this.canvas) {
      console.log('Canvas not found yet, will init on openSchemaEditor');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Event listeners
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseout', this.handleMouseUp.bind(this));

    // Color picker
    const colorPicker = document.getElementById('schemaColorPicker');
    if (colorPicker) {
      colorPicker.addEventListener('change', (e) => {
        this.currentColor = e.target.value;
      });
    }

    // Line width
    const lineWidth = document.getElementById('schemaLineWidth');
    if (lineWidth) {
      lineWidth.addEventListener('input', (e) => {
        this.lineWidth = e.target.value;
        document.getElementById('lineWidthDisplay').textContent = e.target.value + 'px';
      });
    }

    // Save initial state
    this.saveState();
    console.log('CampaignSchemas initialized successfully');
  },

  openSchemaEditor() {
    console.log('openSchemaEditor called');
    const modal = document.getElementById('schemaEditorModal');
    console.log('Modal found:', !!modal);

    if (modal) {
      modal.style.display = 'block';
      console.log('Modal display set to block');

      if (!this.canvas) {
        console.log('Initializing canvas...');
        this.init();
      }
      // Clear canvas with white background
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.history = [];
      this.saveState();
      this.setTool('pen');
      console.log('Schema editor ready');
    } else {
      console.error('Schema editor modal not found in DOM!');
    }
  },

  closeSchemaEditor() {
    const modal = document.getElementById('schemaEditorModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  setTool(tool) {
    this.currentTool = tool;
    // Update button styles
    document.querySelectorAll('.tool-btn').forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--accent)';
      } else {
        btn.style.background = 'var(--paper)';
        btn.style.color = 'var(--text)';
        btn.style.borderColor = 'var(--rule)';
      }
    });
  },

  handleMouseDown(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;

    if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
    } else if (this.currentTool === 'text') {
      this.addText();
    } else {
      // Save current canvas state for preview
      this.currentState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  handleMouseMove(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ctx.strokeStyle = this.currentTool === 'eraser' ? 'white' : this.currentColor;
    this.ctx.lineWidth = this.currentTool === 'eraser' ? this.lineWidth * 3 : this.lineWidth;

    if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    } else if (this.currentTool === 'line' || this.currentTool === 'rect' || this.currentTool === 'circle') {
      // Restore canvas state and draw preview
      if (this.currentState) {
        this.ctx.putImageData(this.currentState, 0, 0);
      }

      this.ctx.beginPath();
      if (this.currentTool === 'line') {
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      } else if (this.currentTool === 'rect') {
        this.ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
      } else if (this.currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      }
    }
  },

  handleMouseUp(e) {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveState();
    }
  },

  addText() {
    const text = prompt('Entrez le texte à ajouter:');
    if (text) {
      this.ctx.font = (this.lineWidth * 8) + 'px Arial';
      this.ctx.fillStyle = this.currentColor;
      this.ctx.fillText(text, this.startX, this.startY);
      this.saveState();
    }
    this.isDrawing = false;
  },

  clearCanvas() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le schéma ?')) {
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.saveState();
    }
  },

  saveState() {
    this.history.push(this.canvas.toDataURL());
    if (this.history.length > 20) {
      this.history.shift();
    }
  },

  undo() {
    if (this.history.length > 1) {
      this.history.pop();
      const img = new Image();
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);
      };
      img.src = this.history[this.history.length - 1];
    }
  },

  saveSchema() {
    const dataURL = this.canvas.toDataURL('image/png');

    // Create schema HTML
    const schemaHTML = `
<div class="campaign-schema" style="margin: 1.5rem 0; text-align: center; background: white; padding: 1rem; border-radius: 8px; border: 2px solid var(--rule);">
  <img src="${dataURL}" style="max-width: 100%; height: auto; border-radius: 4px;" alt="Schéma de campagne">
</div>`;

    // Check if we're in the HTML editor modal (textarea mode)
    if (this.editorInsertFunction && typeof this.editorInsertFunction === 'function') {
      // Insert into the textarea using the editor's insert function
      this.editorInsertFunction('\n' + schemaHTML + '\n');

      // Show notification
      if (JdrApp?.modules?.ui?.showNotification) {
        JdrApp.modules.ui.showNotification('🎨 Schéma inséré dans l\'éditeur !', 'success');
      }
    } else {
      // Fallback: direct insertion into content (legacy mode)
      const editableElement = this.currentEditableElement || document.querySelector('.subpage-content.editable');

      if (editableElement) {
        // Insert at cursor position if in edit mode
        if (editableElement.contentEditable === 'true') {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            // Create a temporary div to parse the HTML
            const temp = document.createElement('div');
            temp.innerHTML = schemaHTML;
            const schemaNode = temp.firstElementChild;

            range.insertNode(schemaNode);

            // Move cursor after the inserted schema
            range.setStartAfter(schemaNode);
            range.setEndAfter(schemaNode);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // Fallback: append at the end
            editableElement.innerHTML += '<br>' + schemaHTML;
          }
        } else {
          // Not in edit mode: append at the end
          editableElement.innerHTML += '<br>' + schemaHTML;
        }

        // Show notification
        if (JdrApp?.modules?.ui?.showNotification) {
          JdrApp.modules.ui.showNotification('🎨 Schéma inséré avec succès !', 'success');
        }
      }
    }

    // Clear the stored references
    this.currentEditableElement = null;
    this.editorTextarea = null;
    this.editorInsertFunction = null;
    this.closeSchemaEditor();
  }
};

// Make it globally accessible immediately
window.CampaignSchemas = CampaignSchemas;
console.log('CampaignSchemas module loaded and available globally');

// Initialize when DOM is ready (for canvas setup)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing CampaignSchemas on DOMContentLoaded');
    CampaignSchemas.init();
  });
} else {
  console.log('Initializing CampaignSchemas immediately');
  CampaignSchemas.init();
}
