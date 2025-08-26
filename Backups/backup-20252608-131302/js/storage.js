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
      
      // Clear localStorage on startup - JSON files are always source of truth
      this.clearStorageOnStartup();
      
      // Set up save handlers
      JdrApp.utils.events.register('click', '#saveAndExport', () => this.saveAndExportZip());
      
      
      
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
        zip.file('data/objets.json', JSON.stringify(window.OBJETS, null, 2));
        
        // Add monsters data with current edits
        if (window.MONSTRES) {
          zip.file('data/monstres.json', JSON.stringify(window.MONSTRES, null, 2));
        }
        
        // Add TOC structure with new pages
        if (window.TOC_STRUCTURE) {
          zip.file('data/toc-structure.json', JSON.stringify(window.TOC_STRUCTURE, null, 2));
        }
        
        // Add ContentTypes configuration (includes availableTags modifications)
        if (window.ContentTypes) {
          const updatedContentTypesJS = this.generateContentTypesJS(window.ContentTypes);
          zip.file('js/config/contentTypes.js', updatedContentTypesJS);
        }
        
        // Add static pages config and data
        if (window.STATIC_PAGES_CONFIG) {
          zip.file('data/static-pages-config.json', JSON.stringify(window.STATIC_PAGES_CONFIG, null, 2));
        }
        
        if (window.STATIC_PAGES) {
          for (const [pageId, pageData] of Object.entries(window.STATIC_PAGES)) {
            zip.file(`data/${pageId}.json`, JSON.stringify(pageData, null, 2));
          }
        }
        
        // Note: All static pages are now handled via window.STATIC_PAGES above
        
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

    generateContentTypesJS(contentTypes) {
      // Generate the updated contentTypes.js file with current availableTags
      const availableTags = contentTypes.objet?.filterConfig?.availableTags || [];
      const defaultVisibleTags = contentTypes.objet?.filterConfig?.defaultVisibleTags || [];
      
      // Get monster tags configuration
      const monsterAvailableTags = contentTypes.monster?.filterConfig?.availableTags || [];
      const monsterDefaultVisibleTags = contentTypes.monster?.filterConfig?.defaultVisibleTags || [];
      
      return `// ============================================================================
// JDR-BAB APPLICATION - CONTENT TYPES CONFIGURATION
// ============================================================================

(() => {
  "use strict";

  window.ContentTypes = {
    spell: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        element: { type: 'select', label: 'Élément', required: true, options: ['Feu', 'Eau', 'Terre', 'Air', 'Lumière', 'Nuit', 'Divin', 'Maléfique'] },
        description: { type: 'textarea', label: 'Description', required: true },
        prerequis: { type: 'richtext', label: 'Prérequis', required: true },
        portee: { type: 'richtext', label: 'Portée', required: true },
        tempsIncantation: { type: 'richtext', label: "Temps d'incantation", required: true },
        coutMana: { type: 'richtext', label: 'Coût mana', required: true },
        resistance: { type: 'richtext', label: 'Résistance', required: true },
        effetNormal: { type: 'richtext', label: 'Effet normal', required: true },
        effetCritique: { type: 'richtext', label: 'Effet critique', required: false }
      },
      editMapping: {
        'spell-name': 'nom',
        'spell-element': 'element',
        'spell-description': 'description',
        'spell-prerequis': 'prerequis',
        'spell-portee': 'portee',
        'spell-mana': 'coutMana',
        'spell-temps-incantation': 'tempsIncantation',
        'spell-resistance': 'resistance',
        'spell-effect-normal': 'effetNormal',
        'spell-effect-critical': 'effetCritique'
      },
      identifiers: {
        name: 'nom',
        category: 'sorts'
      },
      template: 'spell-card',
      container: 'sorts',
      dataKey: 'SORTS',
      icons: { 
        category: '🔮', 
        item: '✨',
        add: '➕',
        delete: '🗑️'
      },
      defaultValues: {
        nom: "Nouveau Sort",
        element: "Feu",
        description: "Lance une boule de Feu sur un adversaire.",
        prerequis: "📋 <strong>Prérequis:</strong> Niveau 1",
        portee: "🎯 <strong>Portée:</strong> 20m",
        tempsIncantation: "⏰ <strong>Temps d'incantation:</strong> 1 tour",
        coutMana: "🔵 <strong>Coût mana:</strong> 3",
        resistance: "<strong>Sans effet si:</strong> Esquive.",
        effetNormal: "<strong>Effet:</strong> Inflige 5 dégats de <span style='color: #e25822; font-weight: bold;'>Feu</span> à la cible.<br>&nbsp;Tous les 5 points d'intelligence, augmente les dégats de 1.",
        effetCritique: "<strong>Coup Critique:&nbsp;</strong>&nbsp;Double les dégâts et enflamme la cible."
      }
    },

    don: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        description: { type: 'textarea', label: 'Description', required: true },
        prerequis: { type: 'richtext', label: 'Prérequis', required: true },
        cout: { type: 'richtext', label: 'Coût', required: true }
      },
      editMapping: {
        'don-name': 'nom',
        'don-description': 'description',
        'don-prerequis': 'prerequis',
        'don-cout': 'cout'
      },
      identifiers: {
        name: 'nom',
        category: 'dons'
      },
      template: 'don-card',
      container: 'dons',
      dataKey: 'DONS',
      icons: { 
        category: '🎖️', 
        item: '🏆',
        add: '➕',
        delete: '🗑️'
      },
      defaultValues: {
        nom: "Nouveau Don",
        description: "Description du don.",
        prerequis: "Aucun prérequis",
        cout: "1 point de don"
      }
    },

    class: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        resume: { type: 'textarea', label: 'Résumé', required: true },
        capacites: { type: 'list', label: 'Capacités', required: true }
      },
      editMapping: {
        'class-name': 'nom',
        'class-resume': 'resume',
        'class-capacites': 'capacites'
      },
      identifiers: {
        name: 'nom',
        category: null
      },
      template: 'class-page',
      container: 'classes',
      dataKey: 'CLASSES',
      icons: { 
        category: '⚔️', 
        item: '🛡️',
        add: '➕',
        delete: '🗑️'
      }
    },

    subclass: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        description: { type: 'textarea', label: 'Description', required: true },
        base: { type: 'stats', label: 'Statistiques de base', required: true },
        progression: { type: 'richtext', label: 'Progression', required: true },
        capacites: { type: 'list', label: 'Capacités', required: true }
      },
      editMapping: {
        'subclass-name': 'nom',
        'subclass-description': 'description',
        'subclass-stats': 'base',
        'subclass-progression': 'progression',
        'subclass-capacites': 'capacites'
      },
      identifiers: {
        name: 'nom',
        category: 'sousClasses',
        parent: 'class'
      },
      template: 'subclass-card',
      icons: { 
        item: '⚡',
        add: '➕',
        delete: '🗑️'
      },
      defaultValues: {
        nom: "Nouvelle sous-classe",
        description: "Description de la sous-classe",
        base: {
          Force: 3,
          Agilité: 3,
          Endurance: 3,
          Intelligence: 3,
          Volonté: 3,
          Chance: 3
        },
        progression: "<strong>📈 Progression par niveau:</strong> +1 Force 💪, +1 Agilité 🏃",
        capacites: [
          "<em>Capacité unique</em>: Description de la capacité spéciale de cette sous-classe."
        ]
      }
    },

    objet: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        numero: { type: 'number', label: 'Numéro', required: true },
        image: { type: 'text', label: 'Image', required: false },
        description: { type: 'textarea', label: 'Description', required: true },
        tags: { type: 'tags', label: 'Tags', required: true },
        effet: { type: 'richtext', label: 'Effet', required: true },
        prix: { type: 'richtext', label: 'Prix', required: true },
        poids: { type: 'richtext', label: 'Poids', required: true }
      },
      editMapping: {
        'objet-name': 'nom',
        'objet-numero': 'numero',
        'objet-image': 'image',
        'objet-description': 'description',
        'objet-tags': 'tags',
        'objet-effet': 'effet',
        'objet-prix': 'prix',
        'objet-poids': 'poids'
      },
      identifiers: {
        name: 'nom',
        category: 'objets'
      },
      template: 'objet-card',
      container: 'objets',
      dataKey: 'OBJETS',
      pageType: 'single', // Page unique avec filtres
      icons: { 
        category: '📦', 
        item: '🎒',
        add: '➕',
        delete: '🗑️'
      },
      // Configuration des filtres disponibles (MISE À JOUR AUTOMATIQUE)
      filterConfig: {
        availableTags: ${JSON.stringify(availableTags, null, 10)},
        defaultVisibleTags: ${JSON.stringify(defaultVisibleTags, null, 10)} // Filtres affichés par défaut
      },
      defaultValues: {
        nom: "Nouvel Objet",
        numero: 1,
        image: "",
        description: "Description de l'objet.",
        tags: ["Arme"],
        effet: "<strong>Effet:</strong> Description de l'effet de l'objet.",
        prix: "🔷 <strong>Prix:</strong> 10",
        poids: "⚖️ <strong>Poids:</strong> 1"
      }
    },

    monster: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        tags: { type: 'tags', label: 'Tags', required: true },
        image: { type: 'text', label: 'Image', required: false },
        element: { 
          type: 'select', 
          label: "Élément d'affiliation", 
          required: true,
          options: [
            { value: 'Feu', label: '🔥 Feu' },
            { value: 'Eau', label: '💧 Eau' },
            { value: 'Terre', label: '🤎 Terre' },
            { value: 'Air', label: '🟢 Air' },
            { value: 'Lumiere', label: '☀️ Lumière' },
            { value: 'Nuit', label: '⚫ Nuit' },
            { value: 'Divin', label: '⚪ Divin' },
            { value: 'Malefique', label: '🟣 Maléfique' }
          ]
        },
        pointsDeVie: { type: 'number', label: 'Points de vie', required: true },
        armurePhysique: { type: 'number', label: 'Armure physique', required: true },
        esquive: { type: 'number', label: 'Esquive', required: true },
        coupCritique: { type: 'number', label: 'Coup critique', required: true },
        coupCritiqueSorts: { type: 'number', label: 'Critique sorts', required: true },
        resistanceAlterations: { type: 'number', label: 'Résistance altérations', required: true },
        armureFeu: { type: 'number', label: 'Armure Feu', required: true },
        armureEau: { type: 'number', label: 'Armure Eau', required: true },
        armureTerre: { type: 'number', label: 'Armure Terre', required: true },
        armureAir: { type: 'number', label: 'Armure Air', required: true },
        armureLumiere: { type: 'number', label: 'Armure Lumière', required: true },
        armureObscurite: { type: 'number', label: 'Armure Obscurité', required: true },
        armureDivin: { type: 'number', label: 'Armure Divin', required: true },
        armureMalefique: { type: 'number', label: 'Armure Maléfique', required: true },
        abilites: { type: 'richtext', label: 'Abilités', required: false },
        butin: { type: 'richtext', label: 'Butin', required: false }
      },
      editMapping: {
        'monster-name': 'nom',
        'monster-tags': 'tags',
        'monster-image': 'image',
        'monster-element': 'element'
      },
      identifiers: {
        name: 'nom',
        category: 'monstres'
      },
      template: 'monster-card',
      container: 'monstres',
      dataKey: 'MONSTRES',
      pageType: 'single',
      filterMode: 'AND',
      icons: { 
        category: '🐲', 
        item: '👾',
        add: '➕',
        delete: '🗑️'
      },
      filterConfig: {
        availableTags: ${JSON.stringify(monsterAvailableTags, null, 10)},
        defaultVisibleTags: ${JSON.stringify(monsterDefaultVisibleTags, null, 10)}
      },
      defaultValues: {
        nom: "Nouveau Monstre",
        tags: ["Forêt"],
        image: "",
        element: "Feu",
        pointsDeVie: 20,
        armurePhysique: 2,
        esquive: 5,
        coupCritique: 10,
        coupCritiqueSorts: 8,
        resistanceAlterations: 3,
        armureFeu: 0,
        armureEau: 0,
        armureTerre: 0,
        armureAir: 0,
        armureLumiere: 0,
        armureObscurite: 0,
        armureDivin: 0,
        armureMalefique: 0,
        abilites: "<strong>Attaque basique:</strong> Inflige 5 dégâts physiques.",
        butin: "<strong>Butin:</strong> 10-50 pièces d'or."
      }
    },

    staticPage: {
      fields: {
        title: { type: 'text', label: 'Titre', required: true },
        sections: { type: 'sections', label: 'Sections', required: true }
      },
      template: 'static-page',
      icons: { 
        category: '📄', 
        item: '📝'
      }
    }
  };

  window.StatIcons = {
    'Force': '💪',
    'Agilité': '🏃',
    'Endurance': '🛡️',
    'Intelligence': '🧠',
    'Volonté': '⚡',
    'Chance': '🍀'
  };

  window.ElementColors = {
    'Feu': { color: '#ff6b35', weight: 'bold' },
    'Eau': { color: '#4682b4', weight: 'bold' },
    'Terre': { color: '#8b4513', weight: 'bold' },
    'Air': { color: '#22c55e', weight: 'bold' },
    'Lumière': { color: '#ffd700', weight: 'bold' },
    'Nuit': { color: '#1a1a1a', weight: 'bold' },
    'Divin': { color: '#f5f5f5', weight: 'bold', background: 'rgba(100, 100, 100, 0.3)', padding: '2px 4px', borderRadius: '3px' },
    'Maléfique': { color: '#8b5cf6', weight: 'bold' }
  };

  window.ElementIcons = {
    'Feu': '🔥',
    'Eau': '💧',
    'Terre': '🤎',
    'Air': '🟢',
    'Lumière': '☀️',
    'Nuit': '⚫',
    'Divin': '⚪',
    'Maléfique': '🟣'
  };

})();`;
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
        // Could not fetch file
        return null;
      } catch (error) {
        // Error fetching file
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
        // Could not fetch index.html, generating from current state
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
        this.showNotification('❌ Veuillez sélectionner un fichier ZIP', 'error');
        return;
      }

      try {
        this.showNotification('📥 Import en cours...', 'info');

        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
          await this.loadJSZip();
        }

        const zip = new JSZip();
        const contents = await zip.loadAsync(file);

        // Import data files
        const dataFiles = ['sorts.json', 'classes.json', 'dons.json', 'objets.json', 'monstres.json'];
        for (const dataFile of dataFiles) {
          const zipFile = contents.file(`data/${dataFile}`);
          if (zipFile) {
            const content = await zipFile.async('text');
            const data = JSON.parse(content);
            
            if (dataFile === 'sorts.json') {
              window.SORTS = data;
            } else if (dataFile === 'classes.json') {
              window.CLASSES = data;
            } else if (dataFile === 'dons.json') {
              window.DONS = data;
            } else if (dataFile === 'objets.json') {
              window.OBJETS = data;
            } else if (dataFile === 'monstres.json') {
              window.MONSTRES = data;
            }
          }
        }

        // Import static pages config
        const configFile = contents.file('data/static-pages-config.json');
        if (configFile) {
          const configContent = await configFile.async('text');
          window.STATIC_PAGES_CONFIG = JSON.parse(configContent);
        }

        // Import static pages data
        if (window.STATIC_PAGES_CONFIG && window.STATIC_PAGES_CONFIG.pages) {
          window.STATIC_PAGES = {};
          for (const pageConfig of window.STATIC_PAGES_CONFIG.pages) {
            if (pageConfig.active) {
              const pageFile = contents.file(`data/${pageConfig.file}`);
              if (pageFile) {
                const pageContent = await pageFile.async('text');
                window.STATIC_PAGES[pageConfig.id] = JSON.parse(pageContent);
              }
            }
          }
        }

        // Import images
        const imagesFile = contents.file('data/images.json');
        if (imagesFile && JdrApp.modules.images && JdrApp.modules.images.importImages) {
          const imagesContent = await imagesFile.async('text');
          const imagesData = JSON.parse(imagesContent);
          if (imagesData.images) {
            JdrApp.modules.images.importImages(imagesData.images);
          }
        }

        // Save imported data to localStorage
        this.saveChanges(true);

        this.showNotification('✅ Import réussi! Rechargement...', 'success');

        // Reload page to show imported data
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } catch (error) {
        this.showNotification('❌ Erreur lors de l\'import', 'error');
      }

      // Reset file input
      event.target.value = '';
    },


  };

})();