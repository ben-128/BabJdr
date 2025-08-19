// ============================================================================
// JDR-BAB APPLICATION - STORAGE MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // STORAGE MODULE
  // ========================================
  JdrApp.modules.storage = {
    
    init() {
      
      // Load stored edits immediately on startup
      this.loadStoredEdits();
      
      // Set up save handlers
      JdrApp.utils.events.register('click', '#saveAndExport', () => this.saveAndExportZip());
      
      // Auto-save functionality
      this.setupAutoSave();
    },

    setupAutoSave() {
      // Auto-save disabled - we save immediately on each edit instead
      // Previously: Auto-save every 30 seconds if in dev mode
    },

    saveChanges(silent = false) {
      try {
        // Force collect all pending edits
        const editedData = JdrApp.modules.editor.forceCollectAllEdits();
        
        // For now, just save to localStorage as backup
        localStorage.setItem('jdr-bab-edits', JSON.stringify(editedData));
        localStorage.setItem('jdr-bab-data', JSON.stringify({
          SORTS: window.SORTS,
          CLASSES: window.CLASSES,
          DONS: window.DONS,
          STATIC_PAGES: window.STATIC_PAGES,
          STATIC_PAGES_CONFIG: window.STATIC_PAGES_CONFIG
        }));
        
        if (!silent) {
          this.showNotification('💾 Modifications sauvegardées localement', 'success');
        }
        
      } catch (error) {
        console.error('❌ Failed to save changes:', error);
        if (!silent) {
          this.showNotification('❌ Erreur lors de la sauvegarde', 'error');
        }
      }
    },

    async saveAndExportZip() {
      try {
        this.showNotification('📦 Création de l\'archive ZIP...', 'info');
        
        // Force collect all pending edits
        JdrApp.modules.editor.forceCollectAllEdits();
        
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
          await this.loadJSZip();
        }
        
        const zip = new JSZip();
        
        // Add main HTML file
        const mainHTML = await this.getMainHTML();
        zip.file('index.html', mainHTML);
        
        // Add CSS files
        const cssFiles = ['theme.css', 'utilities.css', 'components.css', 'layout.css', 'editor.css'];
        for (const cssFile of cssFiles) {
          const cssContent = await this.fetchFileContent(`css/${cssFile}`);
          if (cssContent) {
            zip.file(`css/${cssFile}`, cssContent);
          }
        }
        
        // Add JS files
        const jsFiles = ['core.js', 'utils.js', 'router.js', 'renderer.js', 'editor.js', 'storage.js', 'ui.js'];
        for (const jsFile of jsFiles) {
          const jsContent = await this.fetchFileContent(`js/${jsFile}`);
          if (jsContent) {
            zip.file(`js/${jsFile}`, jsContent);
          }
        }
        
        // Add modules
        const moduleFiles = ['images.js'];
        for (const moduleFile of moduleFiles) {
          const moduleContent = await this.fetchFileContent(`js/modules/${moduleFile}`);
          if (moduleContent) {
            zip.file(`js/modules/${moduleFile}`, moduleContent);
          }
        }
        
        // Add data files with current edits
        zip.file('data/sorts.json', JSON.stringify(window.SORTS, null, 2));
        zip.file('data/classes.json', JSON.stringify(window.CLASSES, null, 2));
        zip.file('data/dons.json', JSON.stringify(window.DONS, null, 2));
        
        // Add static pages config and data
        if (window.STATIC_PAGES_CONFIG) {
          zip.file('data/static-pages-config.json', JSON.stringify(window.STATIC_PAGES_CONFIG, null, 2));
        }
        
        if (window.STATIC_PAGES) {
          for (const [pageId, pageData] of Object.entries(window.STATIC_PAGES)) {
            zip.file(`data/${pageId}.json`, JSON.stringify(pageData, null, 2));
          }
        }
        
        // Add other data files
        const otherDataFiles = ['elements.json', 'stats.json', 'competences-tests.json', 'etats.json', 'creation.json'];
        for (const dataFile of otherDataFiles) {
          const dataContent = await this.fetchFileContent(`data/${dataFile}`);
          if (dataContent) {
            zip.file(`data/${dataFile}`, dataContent);
          }
        }
        
        // Add current images (including newly uploaded ones)
        if (JdrApp.modules.images && JdrApp.modules.images.getAllImages) {
          const currentImages = JdrApp.modules.images.getAllImages();
          const imagesData = {
            images: currentImages,
            meta: {
              total_images: Object.keys(currentImages).length,
              exported_date: new Date().toISOString().slice(0, 10),
              note: "Ces images incluent les nouvelles images uploadées"
            }
          };
          zip.file('data/images.json', JSON.stringify(imagesData, null, 2));
        }
        
        // Add package.json and other config files
        const configFiles = ['package.json'];
        for (const configFile of configFiles) {
          const configContent = await this.fetchFileContent(configFile);
          if (configContent) {
            zip.file(configFile, configContent);
          }
        }
        
        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({type: 'blob'});
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        this.downloadFile(`JdrBab-${timestamp}.zip`, zipBlob, 'application/zip');
        
        this.showNotification('📦 Archive ZIP créée et téléchargée!', 'success');
        
      } catch (error) {
        console.error('❌ Failed to create ZIP:', error);
        this.showNotification('❌ Erreur lors de la création du ZIP', 'error');
      }
    },

    async loadJSZip() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },

    async fetchFileContent(filePath) {
      try {
        const response = await fetch(filePath);
        if (response.ok) {
          return await response.text();
        }
        console.warn(`❌ Could not fetch ${filePath}:`, response.status);
        return null;
      } catch (error) {
        console.warn(`❌ Error fetching ${filePath}:`, error);
        return null;
      }
    },

    async getMainHTML() {
      // Get the current index.html content or reconstruct it
      try {
        const response = await fetch('index.html');
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn('Could not fetch index.html, generating from current state');
      }
      
      // Fallback: generate HTML from current document state
      return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<meta name="referrer" content="no-referrer-when-downgrade">
<title>JDR‑BAB — Livret de règles</title>
<meta content="Livret web multipages des règles JDR‑BAB, thème parchemin, illustrations par catégorie/classe/sous‑classe, export HTML autonome." name="description">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&amp;family=Source+Serif+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&amp;display=swap" rel="stylesheet">

<!-- CSS Modulaire -->
<link rel="stylesheet" href="css/theme.css">
<link rel="stylesheet" href="css/utilities.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/editor.css">
</head>
<body class="dev-off" style="">

<!-- Le contenu HTML complet sera injecté ici par le JavaScript -->
<div id="app-loading">Chargement...</div>

<!-- JavaScript Modulaire -->
<script src="js/core.js"></script>
<script src="js/utils.js"></script>
<script src="js/modules/images.js"></script>
<script src="js/router.js"></script>
<script src="js/renderer.js"></script>
<script src="js/editor.js"></script>
<script src="js/storage.js"></script>
<script src="js/ui.js"></script>

</body>
</html>`;
    },

    buildStandaloneHTML() {
      // This function is disabled in the combined build to avoid template literal conflicts
      // The standalone build is now handled by the build system
      console.warn('buildStandaloneHTML() is disabled in standalone version');
      return '';
    },

    downloadJSON(filename, data) {
      const json = JSON.stringify(data, null, 2);
      this.downloadFile(filename, json, 'application/json');
    },

    downloadFile(filename, content, mimeType = 'text/html') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    },

    showNotification(message, type = 'info') {
      // Simple notification system
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
      
      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    },

    // Load edits from localStorage on startup
    loadStoredEdits() {
      try {
        const storedEdits = localStorage.getItem('jdr-bab-edits');
        const storedData = localStorage.getItem('jdr-bab-data');
        
        if (storedEdits) {
          JdrApp.modules.editor.editedData = JSON.parse(storedEdits);
        }
        
        if (storedData) {
          const data = JSON.parse(storedData);
          // Merge with current data if needed
          if (data.SORTS) window.SORTS = data.SORTS;
          if (data.CLASSES) window.CLASSES = data.CLASSES;
          if (data.DONS) window.DONS = data.DONS;
          if (data.STATIC_PAGES) window.STATIC_PAGES = data.STATIC_PAGES;
          if (data.STATIC_PAGES_CONFIG) window.STATIC_PAGES_CONFIG = data.STATIC_PAGES_CONFIG;
        }
        
      } catch (error) {
        console.error('❌ Failed to load stored edits:', error);
      }
    },

    // Sync don categories (maintain compatibility)
    syncDonCategories() {
      if (!window.DONS) return;
      
      // Find all don categories in HTML
      const htmlCategories = Array.from(JdrApp.utils.dom.$$('[data-edit-type="don-category-description"]'))
        .map(el => el.dataset.editCategory);
      
      // Check if categories exist in HTML but not in DONS
      htmlCategories.forEach(categoryName => {
        if (categoryName && !window.DONS.find(c => c.nom === categoryName)) {
          const newCategory = {
            nom: categoryName,
            description: `Dons accessibles seulement aux ${categoryName.toLowerCase()}.`,
            dons: []
          };
          window.DONS.push(newCategory);
        }
      });
    }
  };

  // Expose for backward compatibility
  window.syncDonCategories = () => JdrApp.modules.storage.syncDonCategories();

})();