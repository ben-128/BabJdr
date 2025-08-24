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
        tempsIncantation: { type: 'richtext', label: 'Temps d\'incantation', required: true },
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
        effetNormal: "<strong>Effet:</strong> Inflige 5 dégats de <span style=\"color: #e25822; font-weight: bold;\">Feu</span> à la cible.<br>&nbsp;Tous les 5 points d'intelligence, augmente les dégats de 1.",
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
          "Départ",
          "Arme",
          "Armure",
          "Consommable",
          "Bouclier",
          "Épée",
          "Arme exotique",
          "Une main",
          "Deux mains",
          "Baton",
          "Dague",
          "Arc",
          "Armure lourde",
          "Armure légère",
          "Robe",
          "Plante",
          "Catalyseur"
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
        tags: ["Arme"],
        effet: "<strong>Effet:</strong> Description de l'effet de l'objet.",
        prix: "🔷 <strong>Prix:</strong> 10",
        poids: "⚖️ <strong>Poids:</strong> 1"
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

  // Monster configuration
  window.ContentTypes.monster = {
    fields: {
      nom: { type: 'text', label: 'Nom', required: true },
      image: { type: 'text', label: 'Image', required: false },
      tags: { type: 'tags', label: 'Tags', required: false },
      pointsDeVie: { type: 'text', label: 'Points de vie', required: true },
      armurePhysique: { type: 'text', label: 'Armure physique', required: true },
      esquive: { type: 'text', label: 'Esquive', required: true },
      coupCritique: { type: 'text', label: 'Coup critique', required: true },
      coupCritiqueSorts: { type: 'text', label: 'Coup critique sorts', required: true },
      resistanceAlterations: { type: 'text', label: 'Résistance altérations', required: true },
      armureFeu: { type: 'text', label: 'Armure Feu', required: true },
      armureEau: { type: 'text', label: 'Armure Eau', required: true },
      armureTerre: { type: 'text', label: 'Armure Terre', required: true },
      armureAir: { type: 'text', label: 'Armure Air', required: true },
      armureLumiere: { type: 'text', label: 'Armure Lumière', required: true },
      armureNuit: { type: 'text', label: 'Armure Nuit', required: true },
      armureDivin: { type: 'text', label: 'Armure Divin', required: true },
      armureMalefique: { type: 'text', label: 'Armure Maléfique', required: true },
      abilites: { type: 'richtext', label: 'Abilités', required: true },
      butin: { type: 'richtext', label: 'Butin', required: true }
    },
    editMapping: {
      'monster-name': 'nom',
      'monster-image': 'image', 
      'monster-tags': 'tags',
      'monster-pv': 'pointsDeVie',
      'monster-armor': 'armurePhysique',
      'monster-dodge': 'esquive',
      'monster-crit': 'coupCritique',
      'monster-spell-crit': 'coupCritiqueSorts',
      'monster-resist': 'resistanceAlterations',
      'monster-armor-fire': 'armureFeu',
      'monster-armor-water': 'armureEau',
      'monster-armor-earth': 'armureTerre',
      'monster-armor-air': 'armureAir',
      'monster-armor-light': 'armureLumiere',
      'monster-armor-night': 'armureNuit',
      'monster-armor-divine': 'armureDivin',
      'monster-armor-evil': 'armureMalefique',
      'monster-abilities': 'abilites',
      'monster-loot': 'butin'
    },
    identifiers: {
      name: 'nom'
    },
    template: 'monster-card',
    container: 'monstres',
    dataKey: 'MONSTRES',
    icons: {
      category: '👹',
      item: '🐲',
      add: '➕',
      delete: '🗑️'
    },
    defaultValues: {
      nom: "Nouveau Monstre",
      image: "",
      tags: ["Foret"],
      pointsDeVie: "20",
      armurePhysique: "1",
      esquive: "3",
      coupCritique: "19",
      coupCritiqueSorts: "20", 
      resistanceAlterations: "1",
      armureFeu: "0",
      armureEau: "0",
      armureTerre: "0",
      armureAir: "0",
      armureLumiere: "0",
      armureNuit: "0",
      armureDivin: "0",
      armureMalefique: "0",
      abilites: "<ul><li><strong>Attaque:</strong> 1d6 dégâts</li></ul>",
      butin: "<ul><li>Quelques pièces</li></ul>"
    },
    filterConfig: {
      availableTags: ["Foret", "Animal", "Humanoid", "Dragon", "Faible", "Puissant", "Boss", "Feu", "Eau", "Terre", "Air", "Rapide"],
      defaultVisibleTags: ["Foret", "Animal", "Humanoid"]
    }
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

})();