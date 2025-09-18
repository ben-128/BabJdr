// ============================================================================
// JDR-BAB APPLICATION - STORAGE MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // STORAGE MODULE
  // ========================================
  JdrApp.modules.storage = {
    DATA_MANIFEST_URL: 'config/data-manifest.json',
    _dataManifest: null,
    
    init() {
      
      // Clear localStorage on startup - JSON files are always source of truth
      this.clearStorageOnStartup();
      
      // Set up save handlers
      JdrApp.utils.events.register('click', '#saveAndExport', () => this.saveAndExportZip());
      
      // Listen for storage save events
      EventBus.on(Events.STORAGE_SAVE, () => {
        console.log('📢 STORAGE_SAVE event received');
        this.saveChanges(true); // Silent save
      });
      
      // Auto-save functionality
      this.setupAutoSave();
    },

    setupAutoSave() {
      // Auto-save disabled - we save immediately on each edit instead
      // Previously: Auto-save every 30 seconds if in dev mode
    },

    clearStorageOnStartup() {
      // Clear all localStorage data on page load - JSON files are source of truth
      localStorage.removeItem('jdr-bab-edits');
      localStorage.removeItem('jdr-bab-static-pages');
      localStorage.removeItem('jdr-bab-last-modified');
    },

    saveChanges(silent = false) {
      try {
        // Force collect all pending edits
        const editedData = JdrApp.modules.editor ? JdrApp.modules.editor.forceCollectAllEdits() : {};
        
        // Data is already saved in memory (window.STATIC_PAGES, window.SORTS, etc.)
        // No localStorage persistence needed - JSON files are source of truth
        
        if (!silent) {
          this.showNotification('💾 Modifications sauvegardées en mémoire', 'success');
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

        this.showNotification('Creating ZIP archive...', 'info');

        if (JdrApp.modules.editor && JdrApp.modules.editor.forceCollectAllEdits) {

          JdrApp.modules.editor.forceCollectAllEdits();

        }

        if (typeof JSZip === 'undefined') {

          await this.loadJSZip();

        }

        const zip = new JSZip();

        const manifest = await this.loadDataManifest();

        await this.exportManifestEntries(zip, manifest.entries || []);

        if (manifest && manifest.entries) {

          zip.file('config/data-manifest.json', JSON.stringify(manifest, null, 2));

        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });

        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');

        this.downloadFile(`JdrBab-${timestamp}.zip`, zipBlob, 'application/zip');

        this.showNotification('ZIP archive created and downloaded!', 'success');

      } catch (error) {

        console.error('Failed to create ZIP:', error);

        this.showNotification('Erreur lors de la creation du ZIP', 'error');

      }

    },



    async loadDataManifest() {

      if (this._dataManifest) {

        return this._dataManifest;

      }

      try {

        const response = await fetch(this.DATA_MANIFEST_URL, { cache: 'no-store' });

        if (!response.ok) {

          throw new Error(`HTTP ${response.status}`);

        }

        const manifest = await response.json();

        this._dataManifest = this.normalizeManifest(manifest);

      } catch (error) {

        console.warn('Unable to load data-manifest.json, using defaults:', error);

        this._dataManifest = this.getDefaultDataManifest();

      }

      return this._dataManifest;

    },



    getDefaultDataManifest() {

      return {

        entries: [

          { type: 'json', file: 'sorts.json', global: 'SORTS' },

          { type: 'json', file: 'classes.json', global: 'CLASSES' },

          { type: 'json', file: 'dons.json', global: 'DONS' },

          { type: 'json', file: 'objets.json', global: 'OBJETS' },

          { type: 'json', file: 'monstres.json', global: 'MONSTRES' },

          { type: 'json', file: 'tables-tresors.json', global: 'TABLES_TRESORS' },

          { type: 'json', file: 'collections.json', global: 'COLLECTIONS' },

          { type: 'json', file: 'toc-structure.json', global: 'TOC_STRUCTURE' },

          { type: 'json', file: 'static-pages-config.json', global: 'STATIC_PAGES_CONFIG' },

          { type: 'static-pages' },

          { type: 'json', file: 'custom-page-descriptions.json', global: 'CUSTOM_PAGE_DESCRIPTIONS', dataKey: 'customPageDescriptions' },

          { type: 'json', file: 'monstres-page-desc.json', global: 'MONSTRES_PAGE_DESC' },

          { type: 'json', file: 'tables-tresors-page-desc.json', global: 'TABLES_TRESORS_PAGE_DESC' },

          { type: 'images', file: 'images.json' },

          { type: 'json', file: 'audio-config.json', global: 'AUDIO_CONFIG' }

        ]

      };

    },



    normalizeManifest(manifest) {

      if (!manifest || typeof manifest !== 'object') {

        return this.getDefaultDataManifest();

      }

      if (!Array.isArray(manifest.entries)) {

        manifest.entries = [];

      }

      return manifest;

    },

    async loadJSZip() {

      if (window.JSZip) {

        return Promise.resolve();

      }



      return new Promise((resolve, reject) => {

        const script = document.createElement('script');

        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

        script.onload = () => resolve();

        script.onerror = (error) => reject(error);

        document.head.appendChild(script);

      });

    },





    getDataFromEntry(entry) {

      if (!entry) {

        return null;

      }

      if (entry.global && window[entry.global] !== undefined) {

        return window[entry.global];

      }

      const dataKey = entry.dataKey || entry.global;

      if (dataKey && JdrApp?.data && JdrApp.data[dataKey] !== undefined) {

        return JdrApp.data[dataKey];

      }

      return null;

    },



    setDataTargets(entry, data) {

      if (!entry) {

        return;

      }

      if (entry.global) {

        window[entry.global] = data;

      }

      const dataKey = entry.dataKey || entry.global;

      if (dataKey && JdrApp?.data) {

        JdrApp.data[dataKey] = data;

      }

    },



    async exportManifestEntries(zip, entries) {

      if (!Array.isArray(entries)) {

        return;

      }

      for (const entry of entries) {

        if (!entry) {

          continue;

        }

        switch (entry.type) {

          case 'static-pages':

            this.exportStaticPages(zip);

            break;

          case 'images':

            await this.exportImages(zip, entry);

            break;

          case 'json':

          default:

            this.exportJsonEntry(zip, entry);

            break;

        }

      }

    },



    exportJsonEntry(zip, entry) {

      if (!entry.file) {

        return;

      }

      const data = this.getDataFromEntry(entry);

      if (data === undefined || data === null) {

        return;

      }

      zip.file(`data/${entry.file}`, JSON.stringify(data, null, 2));

    },



    exportStaticPages(zip) {

      if (!window.STATIC_PAGES) {

        return;

      }

      for (const [pageId, pageData] of Object.entries(window.STATIC_PAGES)) {

        zip.file(`data/${pageId}.json`, JSON.stringify(pageData, null, 2));

      }

    },



    async exportImages(zip, entry) {

      if (!JdrApp.modules.images) {

        return;

      }

      if (JdrApp.modules.images.autoSyncImages) {

        JdrApp.modules.images.autoSyncImages();

      }

      if (!JdrApp.modules.images.getAllImages) {

        return;

      }

      const currentImages = JdrApp.modules.images.getAllImages();

      const payload = {

        images: currentImages,

        meta: {

          total_images: Object.keys(currentImages).length,

          exported_date: new Date().toISOString().slice(0, 10)

        }

      };

      const target = entry.file ? `data/${entry.file}` : 'data/images.json';

      zip.file(target, JSON.stringify(payload, null, 2));

    },



    async importManifestEntries(contents, entries) {

      if (!Array.isArray(entries)) {

        return;

      }

      for (const entry of entries) {

        if (!entry) {

          continue;

        }

        switch (entry.type) {

          case 'static-pages':

            await this.importStaticPages(contents);

            break;

          case 'images':

            await this.importImages(contents, entry);

            break;

          case 'json':

          default:

            await this.importJsonEntry(contents, entry);

            break;

        }

      }

    },



    async importJsonEntry(contents, entry) {

      if (!entry.file) {

        return;

      }

      const zipFile = contents.file(`data/${entry.file}`);

      if (!zipFile) {

        return;

      }

      const rawContent = await zipFile.async('text');

      if (!rawContent) {

        return;

      }

      try {

        const data = JSON.parse(rawContent);

        this.setDataTargets(entry, data);

      } catch (error) {

        console.warn(`Unable to parse ${entry.file}:`, error);

      }

    },



    async importStaticPages(contents) {

      if (!window.STATIC_PAGES_CONFIG || !Array.isArray(window.STATIC_PAGES_CONFIG.pages)) {

        return;

      }

      window.STATIC_PAGES = {};

      if (JdrApp.data) {

        JdrApp.data.STATIC_PAGES = {};

      }

      for (const pageConfig of window.STATIC_PAGES_CONFIG.pages) {

        const fileName = `data/${pageConfig.id}.json`;

        const pageFile = contents.file(fileName);

        if (!pageFile) {

          continue;

        }

        try {

          const pageContent = await pageFile.async('text');

          const pageData = JSON.parse(pageContent);

          window.STATIC_PAGES[pageConfig.id] = pageData;

          if (JdrApp.data) {

            JdrApp.data.STATIC_PAGES[pageConfig.id] = pageData;

          }

        } catch (error) {

          console.warn(`Unable to import static page ${pageConfig.id}:`, error);

        }

      }

    },



    async importImages(contents, entry) {

      const target = entry.file ? `data/${entry.file}` : 'data/images.json';

      const imagesFile = contents.file(target);

      if (!imagesFile || !JdrApp.modules.images || !JdrApp.modules.images.importImages) {

        return;

      }

      try {

        const imagesContent = await imagesFile.async('text');

        const imagesData = JSON.parse(imagesContent);

        if (imagesData.images) {

          JdrApp.modules.images.importImages(imagesData.images);

        }

      } catch (error) {

        console.warn('Unable to import images.json:', error);

      }

    },



    async getMainHTML() {
      // Return the current document HTML to avoid double body tags
      return document.documentElement.outerHTML;
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
        
        if (storedEdits && JdrApp.modules.editor) {
          JdrApp.modules.editor.editedData = JSON.parse(storedEdits);
        }
        
        // Load stored static pages data (includes dynamically created sections)
        const storedStaticPages = localStorage.getItem('jdr-bab-static-pages');
        if (storedStaticPages) {
          const staticPagesData = JSON.parse(storedStaticPages);
          
          // Merge with existing STATIC_PAGES data
          if (window.STATIC_PAGES) {
            Object.assign(window.STATIC_PAGES, staticPagesData);
          } else {
            window.STATIC_PAGES = staticPagesData;
          }
          
          console.log('Restored static pages data from localStorage:', Object.keys(staticPagesData));
        }
        
        // Ne plus charger jdr-bab-data - laisser les JSON être la source de vérité
        
      } catch (error) {
        console.warn('Failed to load stored edits:', error);
      }
    },

    // Handle ZIP file import
    async handleZipImport(event) {

      const file = event.target.files[0];

      if (!file || file.type !== 'application/zip') {

        this.showNotification('Veuillez selectionner un fichier ZIP', 'error');

        return;

      }



      try {

        this.showNotification('Import en cours...', 'info');

        if (typeof JSZip === 'undefined') {

          await this.loadJSZip();

        }

        const zip = await new JSZip().loadAsync(file);

        const manifest = await this.loadDataManifest();



        await this.importManifestEntries(zip, manifest.entries || []);



        this.saveChanges(true);

        this.showNotification('Import reussi! Rechargement...', 'success');

        setTimeout(() => {

          window.location.reload();

        }, 1000);

      } catch (error) {

        console.error('Failed to import ZIP:', error);

        this.showNotification("Erreur lors de l'import", 'error');

      }



      event.target.value = '';

    },








  };

})();
