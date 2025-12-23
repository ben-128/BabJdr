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

  window.StatIcons = {
    'Force': '<img src="https://i.ibb.co/23cGYFvZ/stat-Force.png" alt="Force" class="stat-icon" style="width: 48px; height: 48px; vertical-align: middle;">',
    'Agilité': '<img src="https://i.ibb.co/Ng9TzjZL/stat-Agilit.png" alt="Agilité" class="stat-icon" style="width: 48px; height: 48px; vertical-align: middle;">',
    'Endurance': '<img src="https://i.ibb.co/67ZW01Q7/stat-Endurance.png" alt="Endurance" class="stat-icon" style="width: 48px; height: 48px; vertical-align: middle;">',
    'Intelligence': '<img src="https://i.ibb.co/9mcP0Y0Y/stat-Intelligence.png" alt="Intelligence" class="stat-icon" style="width: 48px; height: 48px; vertical-align: middle;">',
    'Volonté': '<img src="https://i.ibb.co/B2BCGP6T/stat-Volont.png" alt="Volonté" class="stat-icon" style="width: 48px; height: 48px; vertical-align: middle;">',
    'Chance': '<img src="https://i.ibb.co/HfthhzSF/stat-Chance.png" alt="Chance" class="stat-icon" style="width: 48px; height: 48px; vertical-align: middle;">'
  };

  window.ElementColors = {
    'Feu': { color: '#ff6b35', weight: 'bold' },
    'Eau': { color: '#4682b4', weight: 'bold' },
    'Terre': { color: '#8b4513', weight: 'bold' },
    'Air': { color: '#22c55e', weight: 'bold' },
    'Lumière': { color: '#ffd700', weight: 'bold' },
    'Nuit': { color: '#a0a0b0', weight: 'bold', background: 'rgba(60, 60, 80, 0.5)', padding: '2px 4px', borderRadius: '3px' },
    'Divin': { color: '#f5f5f5', weight: 'bold', background: 'rgba(100, 100, 100, 0.3)', padding: '2px 4px', borderRadius: '3px' },
    'Maléfique': { color: '#8b5cf6', weight: 'bold' }
  };

  window.ElementIcons = {
    'Feu': '<img src="https://i.ibb.co/VWfKvNCL/element-Feu.png" alt="Feu" class="element-icon" style="width: 18px; height: 18px; vertical-align: middle;">',
    'Eau': '<img src="https://i.ibb.co/bMVKwNQP/element-Eau.png" alt="Eau" class="element-icon" style="width: 18px; height: 18px; vertical-align: middle;">',
    'Terre': '<img src="https://i.ibb.co/gLxnsvfg/element-Terre.png" alt="Terre" class="element-icon" style="width: 18px; height: 18px; vertical-align: middle;">',
    'Air': '<img src="https://i.ibb.co/W484kM90/element-Air.png" alt="Air" class="element-icon" style="width: 18px; height: 18px; vertical-align: middle;">',
    'Lumière': '<img src="https://i.ibb.co/pjmcYV72/element-Lumi-re.png" alt="Lumière" class="element-icon" style="width: 18px; height: 18px; vertical-align: middle;">',
    'Nuit': '<img src="https://i.ibb.co/b5qK7czM/element-Nuit.png" alt="Nuit" class="element-icon" style="width: 18px; height: 18px; vertical-align: middle;">',
    'Divin': '<img src="https://i.ibb.co/rKYgZ4Yp/element-Divin.png" alt="Divin" class="element-icon" style="width: 18px; height: 18px; vertical-align: middle;">',
    'Maléfique': '<img src="https://i.ibb.co/SDD5KX34/element-Mal-fique.png" alt="Maléfique" class="element-icon" style="width: 18px; height: 18px; vertical-align: middle;">'
  };

})();