// ============================================================================
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
        effetNormal: "<strong>Effet:</strong> Inflige 5 dégâts de <span style='color: #e25822; font-weight: bold;'>Feu</span> à la cible.<br>&nbsp;Tous les 5 points d'intelligence, augmente les dégâts de 1.",
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
        availableTags: [
          "Accessoire",
          "Arc",
          "Arme",
          "Arme exotique",
          "Armure",
          "Armure lourde",
          "Armure légère",
          "Baton",
          "Bouclier",
          "Catalyseur",
          "Composant",
          "Consommable",
          "Dague",
          "Deux mains",
          "Flèche",
          "Magie",
          "Main secondaire",
          "Non identifié",
          "Nourriture",
          "Plante",
          "Robe",
          "Une main",
          "Épée"
],
        defaultVisibleTags: [
          "Arme"
] // Filtres affichés par défaut
      },
      defaultValues: {
        nom: "Nouvel Objet",
        numero: 1,
        image: "",
        description: "Description de l'objet.",
        tags: ["Nouvel objet"],
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
            { value: 'Feu', label: 'Feu' },
            { value: 'Eau', label: 'Eau' },
            { value: 'Terre', label: 'Terre' },
            { value: 'Air', label: 'Air' },
            { value: 'Lumière', label: 'Lumière' },
            { value: 'Nuit', label: 'Nuit' },
            { value: 'Divin', label: 'Divin' },
            { value: 'Maléfique', label: 'Maléfique' }
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
        abilites: { type: 'richtext', label: 'Capacités', required: false },
        butin: { type: 'richtext', label: 'Butin', required: false }
      },
      editMapping: {
        'monster-name': 'nom',
        'monster-tags': 'tags',
        'monster-image': 'image',
        'monster-element': 'element',
        // Stats principaux
        'monster-pointsdevie': 'pointsDeVie',
        'monster-armurephysique': 'armurePhysique', 
        'monster-esquive': 'esquive',
        'monster-coupcritique': 'coupCritique',
        'monster-coupcritiquesorts': 'coupCritiqueSorts',
        'monster-resistancealterations': 'resistanceAlterations',
        // Armures élémentaires
        'monster-armurefeu': 'armureFeu',
        'monster-armureeau': 'armureEau',
        'monster-armureterre': 'armureTerre',
        'monster-armureair': 'armureAir',
        'monster-armurelumiere': 'armureLumiere',
        'monster-armureobscurite': 'armureObscurite',
        'monster-armuredivin': 'armureDivin',
        'monster-armuremalefique': 'armureMalefique',
        // Contenu narratif
        'monster-abilites': 'abilites',
        'monster-butin': 'butin'
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
        availableTags: [
          "Forêt",
          "Boss"
],
        defaultVisibleTags: [
          "Forêt"
]
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

    npc: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        image: { type: 'text', label: 'Image', required: false },
        description: { type: 'richtext', label: 'Description', required: false },
        interactions: { type: 'richtext', label: 'Interactions possibles', required: false }
      },
      editMapping: {
        'npc-name': 'nom',
        'npc-description': 'description',
        'npc-interactions': 'interactions'
      },
      identifiers: {
        name: 'nom',
        category: 'npcs'
      },
      template: 'npc-card',
      container: 'npcs',
      dataKey: 'NPCS',
      pageType: 'single',
      icons: {
        category: '👥',
        item: '👤',
        add: '➕',
        delete: '🗑️'
      },
      defaultValues: {
        nom: "Nouveau PNJ",
        image: "",
        description: "Description du personnage non-joueur, son apparence, sa personnalité...",
        interactions: "Liste des interactions possibles avec ce PNJ : dialogues, quêtes, services proposés, etc."
      }
    },

    tableTresor: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        description: { type: 'textarea', label: 'Description', required: true },
        tags: { type: 'tags', label: 'Tags', required: true },
        fourchettes: { type: 'list', label: 'Fourchettes', required: true }
      },
      editMapping: {
        'table-tresor-name': 'nom',
        'table-tresor-description': 'description',
        'table-tresor-tags': 'tags'
      },
      identifiers: {
        name: 'nom',
        category: 'tables'
      },
      template: 'table-tresor-card',
      container: 'tables-tresors',
      dataKey: 'TABLES_TRESORS',
      pageType: 'single',
      filterMode: 'AND',
      icons: { 
        category: '💎', 
        item: '📦',
        add: '➕',
        delete: '🗑️'
      },
      filterConfig: {
        // availableTags managed dynamically via window.TABLES_TRESORS._metadata.availableTags
        defaultVisibleTags: [
          "Forêt",
          "Boss"
        ]
      },
      defaultValues: {
        nom: "Nouvelle Table de Trésor",
        description: "Table de butin pour une situation spécifique.",
        tags: ["Forêt"],
        fourchettes: [
          {
            min: 1,
            max: 10,
            objet: {
              type: "reference",
              numero: 1,
              nom: "Objet par défaut"
            }
          }
        ]
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

  // Helper: resolve local image path (encode special chars, add GitHub raw base in standalone)
  const _ghRawBase = 'https://raw.githubusercontent.com/ben-128/BabJdr/master/';
  const _resolveImg = (path) => {
    const encoded = path.split('/').map((p, i) => i < 2 ? p : encodeURIComponent(p)).join('/');
    return window.STANDALONE_VERSION === true ? _ghRawBase + encoded : encoded;
  };
  const _statIcon = (path, alt) => `<img src="${_resolveImg(path)}" alt="${alt}" class="stat-icon" style="width: 48px; height: 48px; vertical-align: middle;">`;
  window.StatIcons = {
    'Force': _statIcon('data/images/Autre/stats/Force.png', 'Force'),
    'Agilité': _statIcon('data/images/Autre/stats/Agilité.png', 'Agilité'),
    'Endurance': _statIcon('data/images/Autre/stats/Endurance.png', 'Endurance'),
    'Intelligence': _statIcon('data/images/Autre/stats/Intelligence.png', 'Intelligence'),
    'Volonté': _statIcon('data/images/Autre/stats/Volonté.png', 'Volonté'),
    'Chance': _statIcon('data/images/Autre/stats/Chance.png', 'Chance')
  };

  window.ElementColors = {
    'Feu': { color: '#ff6b35', weight: 'bold' },
    'Eau': { color: '#4682b4', weight: 'bold' },
    'Terre': { color: '#8b4513', weight: 'bold' },
    'Air': { color: '#22c55e', weight: 'bold' },
    'Lumière': { color: '#ffd700', weight: 'bold' },
    'Nuit': { color: '#1a1a1a', weight: 'bold', background: 'rgba(180, 180, 200, 0.6)', padding: '2px 4px', borderRadius: '3px' },
    'Divin': { color: '#f5f5f5', weight: 'bold', background: 'rgba(100, 100, 100, 0.3)', padding: '2px 4px', borderRadius: '3px' },
    'Maléfique': { color: '#dc2626', weight: 'bold' }
  };

  // Element icons - local images with GitHub raw fallback for standalone
  const _elIcon = (path, alt) => `<img src="${_resolveImg(path)}" alt="${alt}" class="element-icon" style="width: 72px; height: 72px; vertical-align: middle;" loading="lazy">`;
  window.ElementIcons = {
    'Feu': _elIcon('data/images/Elements/Feu.png', 'Feu'),
    'Eau': _elIcon('data/images/Elements/Eau.png', 'Eau'),
    'Terre': _elIcon('data/images/Elements/Terre.png', 'Terre'),
    'Air': _elIcon('data/images/Elements/Air.png', 'Air'),
    'Lumière': _elIcon('data/images/Elements/Lumière.png', 'Lumière'),
    'Nuit': _elIcon('data/images/Elements/Nuit.png', 'Nuit'),
    'Divin': _elIcon('data/images/Elements/Divin.png', 'Divin'),
    'Maléfique': _elIcon('data/images/Elements/Maléfique.png', 'Maléfique')
  };

})();