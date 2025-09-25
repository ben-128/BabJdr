// ============================================================================
// JDR-BAB APPLICATION - UI TEMPLATES
// ============================================================================

(() => {
  "use strict";

  window.JdrApp = window.JdrApp || {};
  const templateCache = new Map();

  const getFragment = (key, markup) => {
    if (!templateCache.has(key)) {
      const template = document.createElement('template');
      template.innerHTML = markup.trim();
      templateCache.set(key, template);
    }
    return templateCache.get(key).content.cloneNode(true);
  };

  const Templates = {
    renderDevToolbox() {
      const markup = 
        <div class="dev-toolbox-content">
          <div class="dev-toolbox-header">
            <span class="dev-toolbox-header-icon">DEV</span>
            <strong class="dev-toolbox-title">Outils de developpement</strong>
          </div>
          <div class="dev-toolbox-section">
            <div class="dev-toolbox-section-label">Edition</div>
            <div class="dev-toolbox-actions">
              <button class="btn small" id="saveAndExport" title="Sauvegarder et exporter tout en ZIP">Export ZIP</button>
            </div>
          </div>
          <div class="dev-toolbox-section">
            <div class="dev-toolbox-section-label">Creation</div>
            <div class="dev-toolbox-actions">
              <button class="btn small" id="addCategory" title="Creer une nouvelle categorie/page">Nouvelle page</button>
              <button class="btn small" id="addSpellCategory" title="Creer une nouvelle categorie de sorts">Categorie de sorts</button>
              <button class="btn small" id="addDonCategory" title="Creer une nouvelle categorie de dons">Categorie de dons</button>
            </div>
          </div>
        </div>
      ;
      return getFragment('dev-toolbox', markup);
    },

    renderMJToggle() {
      const markup = 
        <div class="mj-toggle-container">
          <button id="mjToggleBtn" class="btn-base btn-small mj-toggle-button" type="button" aria-pressed="false">
            <span class="mj-toggle-label">Maitre de jeu</span>
            <span class="mj-status-indicator" aria-hidden="true"></span>
          </button>
        </div>
      ;
      return getFragment('mj-toggle', markup);
    }
  };

  window.JdrApp.templates = Object.assign({}, window.JdrApp.templates, Templates);
})();
