// ============================================================================
// JDR-BAB APPLICATION - CONSTANTS
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // UI CONSTANTS
  // ========================================
  window.UI_CONSTANTS = {
    // Layout dimensions
    SIDEBAR_WIDTH: 350,
    SIDEBAR_WIDTH_TABLET: 320,
    
    // Image processing defaults
    IMAGE_MAX_WIDTH: 800,
    IMAGE_QUALITY: 0.85,
    
    // Timing constants (milliseconds)
    TIMEOUTS: {
      VALIDATION_DELAY: 500,
      AUTO_MJ_DELAY: 800,
      RENDER_DELAY: 100,
      ROUTER_RETRY_DELAY: 1000,
      ERROR_RETRY_DELAY: 2000,
      DYNAMIC_CENTERING_DELAY: 50
    },
    
    // Breakpoints
    BREAKPOINTS: {
      MOBILE: 480,
      TABLET_PORTRAIT: 768,
      TABLET_LANDSCAPE: 1024,
      DESKTOP: 980
    }
  };

  // ========================================
  // ELEMENT COLORS
  // ========================================
  window.ELEMENT_COLORS = {
    FEU: { color: '#ff6b35', weight: 'bold' },
    EAU: { color: '#4682b4', weight: 'bold' },
    TERRE: { color: '#8b4513', weight: 'bold' },
    AIR: { color: '#87ceeb', weight: 'bold' },
    DIVIN: { color: '#ffd700', weight: 'bold' },
    MALEFIQUE: { color: '#8b008b', weight: 'bold' },
    NEUTRE: { color: '#696969', weight: 'normal' }
  };

  // ========================================
  // STORAGE KEYS
  // ========================================
  window.STORAGE_KEYS = {
    EDITS: 'jdr-bab-edits',
    LAST_MODIFIED: 'jdr-bab-last-modified',
    MONSTER_BACKUPS: 'jdr-bab-monster-backups',
    FILTER_SETTINGS: 'jdr-bab-filter-settings'
  };

  // ========================================
  // EVENT CONSTANTS
  // ========================================
  window.Events = {
    STORAGE_SAVE: 'storage:save',
    PAGE_RENDER: 'page:render',
    CONTENT_UPDATE: 'content:update'
  };

  // ========================================
  // DEFAULT VALUES
  // ========================================
  window.DEFAULT_VALUES = {
    // Monster backup retention
    MAX_MONSTER_BACKUPS: 10,
    
    // Filter defaults
    DEFAULT_VISIBLE_TAGS: ['Arme', 'Armure', 'Bouclier', 'Consommable'],
    
    // Image defaults
    DEFAULT_MONSTER_IMAGE: 'data/images/Monstres/foret/default-monster.png',
    DEFAULT_SPELL_IMAGE: 'data/images/Sorts/default-spell.png',
    DEFAULT_CLASS_IMAGE: 'data/images/Classes/default-class.png'
  };

})();