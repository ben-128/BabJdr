// ============================================================================
// JDR-BAB APPLICATION - CONTENT TYPES CONFIGURATION
// ============================================================================

(() => {
  "use strict";

  window.ContentTypes = {
    spell: {
      fields: {
        nom: { type: 'text', label: 'Nom', required: true },
        description: { type: 'textarea', label: 'Description', required: true },
        prerequis: { type: 'richtext', label: 'Prérequis', required: true },
        portee: { type: 'richtext', label: 'Portée', required: true },
        tempsIncantation: { type: 'richtext', label: 'Temps d\'incantation', required: true },
        coutMana: { type: 'richtext', label: 'Coût mana', required: true },
        resistance: { type: 'richtext', label: 'Résistance', required: true },
        effetNormal: { type: 'richtext', label: 'Effet normal', required: true },
        effetCritique: { type: 'richtext', label: 'Effet critique', required: false },
        effetEchec: { type: 'richtext', label: 'Effet d\'échec', required: false }
      },
      editMapping: {
        'spell-name': 'nom',
        'spell-description': 'description',
        'spell-prerequis': 'prerequis',
        'spell-portee': 'portee',
        'spell-mana': 'coutMana',
        'spell-temps-incantation': 'tempsIncantation',
        'spell-resistance': 'resistance',
        'spell-effect-normal': 'effetNormal',
        'spell-effect-critical': 'effetCritique',
        'spell-effect-failure': 'effetEchec'
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
        description: "Lance une boule de Feu sur un adversaire.",
        prerequis: "📋 <strong>Prérequis:</strong> Niveau 1",
        portee: "🎯 <strong>Portée:</strong> 20m",
        tempsIncantation: "⏰ <strong>Temps d'incantation:</strong> 1 tour",
        coutMana: "🔵 <strong>Coût mana:</strong> 3",
        resistance: "<strong>Sans effet si:</strong> Esquive.",
        effetNormal: "<strong>Effet:</strong> Inflige 5 dégats de <span style=\"color: #e25822; font-weight: bold;\">Feu</span> à la cible.<br>&nbsp;Tous les 5 points d'intelligence, augmente les dégats de 1.",
        effetCritique: "<strong>Coup Critique:&nbsp;</strong>&nbsp;Double les dégâts et enflamme la cible.",
        effetEchec: "<strong>Échec Critique:&nbsp;</strong>Le sort inflige ses dégats à un allié."
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
        base: { type: 'stats', label: 'Statistiques de base', required: true },
        progression: { type: 'richtext', label: 'Progression', required: true },
        capacites: { type: 'list', label: 'Capacités', required: true }
      },
      editMapping: {
        'subclass-name': 'nom',
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
    'Air': { color: '#87ceeb', weight: 'bold' },
    'Eau': { color: '#4682b4', weight: 'bold' },
    'Terre': { color: '#8b7355', weight: 'bold' },
    'Divin': { color: '#ffd700', weight: 'bold' },
    'Maléfique': { color: '#8b008b', weight: 'bold' }
  };

})();