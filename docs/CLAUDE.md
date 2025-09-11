# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Information

**GitHub Repository**: https://github.com/ben-128/BabJdr.git
- Use for periodic saves: `git push origin master`
- Current branch: master

## Development Commands

### Primary Development Workflow
```bash
npm run dev         # Start development server with live-reload (port 3000)
npm run build       # Build standalone HTML version
npm run serve       # Start server without opening browser
npm run dev-clean   # Clean dev server via scripts/server.js (preferred)
```

### Windows Batch Menu System (Primary Interface)
```batch
menu.bat            # Interactive menu for all operations (RECOMMENDED)
```
**Menu Options:**
1. Development server (launches clean dev environment)
2. Build standalone (generates single HTML file)  
3. Import archive (auto-finds latest ZIP in Downloads)
4. Clean backups (removes old backup folders)
5. Quit

**IMPORTANT**: Claude should NOT run `npm run dev` or dev server commands as they block the terminal. Use existing running servers or direct users to the batch menu system instead.

### Dependencies and Requirements
```json
"devDependencies": {
  "live-server": "^1.2.2",
  "nodemon": "^3.0.1"
},
"engines": {
  "node": ">=14.0.0"
}
```
- **Node.js**: Version 14.0.0 or higher required
- **Primary dev server**: live-server (lightweight HTTP server)
- **Install dependencies**: `npm install` (if needed)

**MOBILE STANDALONE PRIORITY**: The standalone version (`build/JdrBab.html`) is the primary way users access the application on mobile devices and tablets. Mobile users do NOT use dev mode - only the standalone version matters for mobile/tablet compatibility. Ensure:
- Images display properly on mobile/tablet
- Navigation is fully functional on touch devices  
- Layout is responsive and readable on small screens
- All content remains accessible without dev mode

### Windows Batch Alternatives
- `dev-server.bat` - Development mode with dev tools and live reload
- `build.bat` - Build standalone version with Windows-specific output handling
- `start-server.bat` - Fallback server startup (tries npm, then Python HTTP server)

### Project Build System
- **Build output**: `build/JdrBab.html` (single standalone file, NOT `build/standalone/JdrBab.html`)
- **Build script**: `scripts/build-simple.js` (Node.js-based build system)
- **Dual-mode architecture**: Development (modular files) vs Production (embedded data)
- **Data embedding**: JSON files become `window.SORTS`, `window.CLASSES`, etc.
- **Complete build**: Combines 20+ JS modules, 5 CSS files, and 27+ JSON data files
- **Size**: ~500-800KB complete application with all content and assets

## Architecture Overview

### Complete Refactored Modular Structure
This codebase has been completely refactored from a 7,469-line monolith into a professional, modular architecture. The new structure reduces code duplication by 52% while maintaining full functionality and adding advanced features.

### Core Application Structure
- **Namespace**: `window.JdrApp` - main application object
- **Data Models**: Complete RPG system managed by ContentFactory (200+ content items)
- **Event System**: Decentralized EventBus for module communication
- **Pattern-Based Architecture**: Factory, Builder, Observer patterns
- **Dual Mode Support**: Development (modular files) vs Production (standalone HTML)
- **UnifiedEditor System**: Advanced context-aware content editing

### New Architecture Components

#### Configuration Layer (`js/config/`)
- `constants.js` - **CENTRALIZED CONSTANTS** (UI_CONSTANTS, ELEMENT_COLORS, etc.)
- `contentTypes.js` - **CENTRAL CONFIGURATION** for all content types
- Defines fields, templates, icons, default values for spells, dons, classes, etc.
- **CRITICAL**: All new content types MUST be defined here first

#### Core Foundation (`js/core/`)
- `EventBus.js` - Singleton event system for decoupled communication
- `BaseEntity.js` - Generic entity class for all data types (spells, dons, etc.)
- `UnifiedEditor.js` - **ADVANCED EDITING SYSTEM** with context-aware content editing
- Eliminates duplicate CRUD operations across different content types

#### Factory Layer (`js/factories/`)
- `ContentFactory.js` - Unified data management via Factory pattern
- Single point of access for all content operations (find, add, delete, move)
- Automatically creates typed entities from ContentTypes configuration

#### Builder Layer (`js/builders/`)
- `CardBuilder.js` - Generates cards for ANY content type using templates
- `PageBuilder.js` - Generates pages for ANY content type using templates  
- **NO MORE** separate methods for spells, dons, classes - one builder handles all

#### Advanced Features (`js/features/`)
- `SpellFilter.js` - Advanced filtering system with AND/OR logic
- `TablesTresorsManager.js` - **TREASURE TABLE SYSTEM** with fourchettes management
- `DynamicCentering.js` - UI centering features

### UI Architecture Optimization (September 2025)

#### **🚀 Major UI Refactor - 98% Code Reduction**
Recent optimization completely refactored the UI layer, eliminating massive code duplication:

**Before Optimization:**
- `ui.js`: 208KB, 5,411 lines with fallback implementations
- Duplicated code between `ui.js` and `js/ui/` folder
- Monolithic approach with redundant functionality

**After Optimization:**
- `ui.js`: 3.9KB, 156 lines (pure delegation layer)
- **Eliminated 204KB of duplicated code**
- **10 specialized UI modules** in `js/ui/` folder:
  - `UICore.js` (9.5KB) - Main coordinator
  - `SearchManager.js` (11KB) - Search functionality
  - `ModalManager.js` (12KB) - Modal system
  - `ResponsiveManager.js` (8.4KB) - Responsive design
  - `PageManager.js` (13KB) - Page navigation
  - `TagsManager.js` (15KB) - Tag filtering
  - `ContentManager.js` (7.3KB) - Content operations
  - `EventHandlers.js` (8.4KB) - Event management
  - `BaseModal.js` (7.5KB) - Modal base class
  - `UIUtilities.js` (5.9KB) - UI utilities

#### **Critical UI Module Loading Order**
UI modules must be loaded in this specific order in HTML:
```html
<script src="js/ui/UIUtilities.js"></script>
<script src="js/ui/BaseModal.js"></script>
<script src="js/ui/EventHandlers.js"></script>
<script src="js/ui/ContentManager.js"></script>
<script src="js/ui/SearchManager.js"></script>
<script src="js/ui/ModalManager.js"></script>
<script src="js/ui/ResponsiveManager.js"></script>
<script src="js/ui/PageManager.js"></script>
<script src="js/ui/TagsManager.js"></script>
<script src="js/ui/UICore.js"></script>
<script src="js/ui.js"></script> <!-- Main delegation layer LAST -->
```

#### **⚠️ Implementation Requirements**
- **ALL UI functionality** must go through the modular components
- **NO fallback implementations** in main ui.js
- **UICore requires** all specialized modules to be loaded first
- **Backup available** as `ui.js.backup` if rollback needed

### Refactored Main Modules

#### Core (`js/core.js`) - 172 lines (was 203)
- Application initialization and ContentFactory setup
- Handles both development (fetch JSON) and standalone (embedded data) modes
- Module dependency management and initialization order

#### Router (`js/router.js`) - Unchanged
- Hash-based routing system (`#/page`)
- Table of contents generation from data
- Category routing for sorts, dons, and classes

#### Renderer (`js/renderer.js`) - 172 lines (was 711) **-76% reduction**
- **SIMPLIFIED**: Uses PageBuilder and CardBuilder for ALL rendering
- **NO DUPLICATION**: Single rendering pipeline for all content types
- Event-driven rendering via EventBus
- Static page content management

#### Editor (`js/editor.js`) - 665 lines (was 1370) **-51% reduction**  
- **UNIFIED**: Single editing system for all content types via ContentFactory
- **ADVANCED FEATURES**: Image enlargement, dev toolbox, subclass management
- **EVENT-DRIVEN**: Uses EventBus and UnifiedEditor for decoupled communication
- Dev mode toggle functionality with comprehensive button management
- Real-time content modification with automatic persistence

#### UI (`js/ui.js`) - 156 lines (was 5,411) **98% reduction, optimized**
- **STREAMLINED**: Removed 204KB of duplicated code, now pure delegation layer
- **MODULAR ARCHITECTURE**: Relies entirely on specialized `js/ui/` modules
- **NO FALLBACKS**: Eliminated redundant implementations, 100% modular approach
- **10 UI MODULES**: UICore, SearchManager, ModalManager, ResponsiveManager, PageManager, TagsManager, ContentManager, EventHandlers, BaseModal, UIUtilities

#### Storage (`js/storage.js`) - Unchanged
- Local storage management
- Export functionality (JSON, HTML)  
- Data persistence across sessions

### Data Structure and Content Types (27 JSON Files)
```
data/
├── sorts.json              # Spell system (11 spells, 3 categories)
├── classes.json            # Character classes (5 main + 10 subclasses)
├── dons.json              # Feat system (24+ feats, 5 categories)
├── objets.json            # Equipment system (41+ items with tags)
├── monstres.json          # Creature bestiary (10 monsters with full stats)
├── tables-tresors.json    # Treasure table system with fourchettes
├── images.json            # Asset management (105+ images)
├── audio.json, audio-config.json # Music and ambient audio system
├── static-pages-config.json # Static page definitions (13 pages)
├── toc-structure.json     # Navigation structure (5 main sections)
├── elements.json          # Elemental system (8 elements, 4 opposing pairs)
├── stats.json, etats.json # Character stats and status effects
├── creation.json          # Character creation rules
├── combat.json, competences-tests.json # Combat and skill systems
├── dieux.json, histoire.json, geographie.json # World building
├── gestion-des-ressources.json # Resource management
├── collections.json       # Character creation collections
├── traumas.json           # Trauma system
├── campagne.json          # Campaign management tools
├── custom-page-descriptions.json # Custom page content
├── monstres-page-desc.json, tables-tresors-page-desc.json # Page descriptions
└── Musiques/ (42+ audio files) # Ambient music by category
```

**Content Type System**: All content types are defined in `js/config/contentTypes.js` with:
- Field schemas and validation
- Template identifiers  
- Icons and default values
- Edit mappings for UI elements

### Asset Organization (105+ Images)
```
data/images/
├── Classes/               # Character portraits (22+ images)  
│   ├── All 5 main classes with male/female variants
│   ├── All 10 subclasses with specialized portraits
│   └── Racial variants (Elfe, Nain, Fée, Lutin, etc.)
├── Sorts/                 # Spell icons (13+ images)
│   ├── Offensive: BouleDeFeu.png, Eclair.png, VoleePierre.png
│   ├── Defensive: Protection.png, SoinMineur.png
│   ├── Divine: ChatimentSacré.png, ArmeLum.png, Revelation series
│   └── Utility: Acceleration.png, Sleep.png, AccrocheTerre.png
├── Equipements/           # Equipment imagery (40+ images)
│   ├── Armes/            # Weapons (6 images: swords, bow, dagger, staffs)
│   ├── Armures/          # Armor (6 images: leather, heavy armor, robes)
│   ├── Bouclier/         # Shields (1 image)
│   └── Consumables/      # Consumable items (27+ images)
│       ├── Herbs/        # Herbal remedies (8 images)
│       ├── Pots/         # Potions (2 images)
│       └── SpellCasting/ # Magical wands (8+ elemental variants)
├── Monstres/             # Monster imagery (10+ images)
│   └── foret/            # Forest creatures with boss variants
└── Musiques/             # Audio assets (42+ MP3 files)
    ├── Auberge/, Creation/, Foret/, Mine/, Voyage/, Autre/
```

**Image Management System**:
- **Dual URLs**: External (ibb.co) for dev, local paths for assets
- **Type-specific naming**: `sort:category:name`, `subclass:class:name:index`
- **Dual-image support**: Subclasses can have 2 images (`:1`, `:2` suffixes)
- **Responsive sizing**: CSS `object-fit: contain` for optimal display

### Styling
Modular CSS architecture:
- `css/theme.css` - Variables and theming (medieval-fantasy design)
- `css/utilities.css` - Utility classes
- `css/components.css` - UI components
- `css/layout.css` - Layout and responsive design
- `css/editor.css` - Development mode styles

## Application Constants System

### **🔧 Centralized Constants**

The application uses centralized constants in `js/config/constants.js` to avoid magic numbers and improve maintainability:

```javascript
// UI layout dimensions
window.UI_CONSTANTS.SIDEBAR_WIDTH = 350
window.UI_CONSTANTS.BREAKPOINTS.MOBILE = 480

// Timing constants
window.UI_CONSTANTS.TIMEOUTS.VALIDATION_DELAY = 500
window.UI_CONSTANTS.TIMEOUTS.AUTO_MJ_DELAY = 800

// Element colors
window.ELEMENT_COLORS.FEU = { color: '#ff6b35', weight: 'bold' }

// Storage keys
window.STORAGE_KEYS.EDITS = 'jdr-bab-edits'

// Default values
window.DEFAULT_VALUES.MAX_MONSTER_BACKUPS = 10
```

**Constants File Location:** `js/config/constants.js`

**Usage Rules:**
- ✅ **ALWAYS** use constants instead of magic numbers
- ✅ **ALWAYS** reference constants via `window.UI_CONSTANTS.*` 
- ✅ **ALWAYS** update constants.js when adding new dimensions or timeouts
- ❌ **NEVER** hardcode timeout values, breakpoints, or dimensions
- ❌ **NEVER** duplicate constant values across files
- ❌ **NEVER** modify constants at runtime (they are configuration, not state)

## Critical Implementation Guidelines

### **🚨 MANDATORY: Adding New Content Types**

When adding a new content type (e.g., "equipment", "monsters"), you **MUST** follow this exact process to maintain modularity:

#### **Step 1: Define Configuration FIRST**
```javascript
// In js/config/contentTypes.js - ADD YOUR TYPE HERE
window.ContentTypes.equipment = {
  fields: {
    nom: { type: 'text', label: 'Nom', required: true },
    description: { type: 'textarea', label: 'Description', required: true },
    // Define ALL fields your content type needs
  },
  template: 'equipment-card',      // Template identifier
  container: 'equipment',          // URL container name  
  dataKey: 'EQUIPMENT',           // Global data key
  icons: { category: '⚔️', item: '🛡️', add: '➕', delete: '🗑️' },
  defaultValues: {
    nom: "Nouvel équipement",
    description: "Description de l'équipement"
  }
};
```

#### **Step 2: Update ContentFactory**
```javascript  
// In js/factories/ContentFactory.js initialize() method
this.entities.set('equipment', new BaseEntity('equipment', window.EQUIPMENT));

// Add getter method
getEquipment() {
  return this.getEntity('equipment');
}
```

#### **Step 3: The Magic Happens Automatically**
- ✅ **CardBuilder** automatically generates cards for your new type
- ✅ **PageBuilder** automatically generates pages for your new type  
- ✅ **UI handlers** automatically handle add/delete/move operations
- ✅ **UnifiedEditor** automatically handles editing for your new type
- ✅ **Search** automatically includes your new content type

#### **❌ NEVER DO THIS (Old Anti-Pattern)**
```javascript
// DON'T create separate methods like this:
generateEquipmentCard(equipment) { ... }      // ❌ WRONG
generateEquipmentPage(category) { ... }       // ❌ WRONG  
addNewEquipment(categoryName) { ... }         // ❌ WRONG
deleteEquipment(categoryName, itemName) { ... } // ❌ WRONG
```

#### **✅ DO THIS (New Pattern)**
```javascript
// Use existing generic systems:
CardBuilder.create('equipment', data, categoryName).build()           // ✅ RIGHT
PageBuilder.buildCategoryPage('equipment', category)                  // ✅ RIGHT
ContentFactory.addItem('equipment', categoryName, defaultItem)        // ✅ RIGHT
ContentFactory.deleteItem('equipment', categoryName, itemName)        // ✅ RIGHT
```

### **🎯 Key Principle: Configuration Over Code**

- **Before adding ANY functionality**: Check if it can be configured instead of coded
- **Before writing similar methods**: Check if an existing generic method can be extended
- **Before duplicating logic**: Use EventBus to communicate between modules

### Critical Module Loading Order (Verified Current Order)
Modules must be loaded in exact dependency order:
```javascript
1. js/config/constants.js        // Application constants - LOADED FIRST
2. js/config/contentTypes.js     // Configuration layer
3. js/core/EventBus.js          // Event system foundation  
4. js/core/BaseEntity.js        // Entity base class
5. js/core/UnifiedEditor.js     // Advanced unified editing system
6. js/factories/ContentFactory.js // Factory pattern implementation
7. js/builders/CardBuilder.js    // Card template generation
8. js/builders/PageBuilder.js    // Page template generation
9. js/core.js                   // JdrApp namespace and initialization
10. js/utils.js                 // DOM and utility functions
11. js/modules/images.js        // Asset management
12. js/modules/audio.js         // Audio system
13. js/storage.js               // Persistence layer
14. js/router.js                // Navigation system
15. js/renderer.js              // Content rendering 
16. js/editor.js                // Editor UI and interactions
17. js/features/SpellFilter.js  // Spell filtering system
18. js/features/TablesTresorsManager.js // Treasure table management
19. js/libs/jspdf-loader.js     // PDF generation support
20. js/ui.js                    // UI interactions - MUST BE LAST
```
**⚠️ This exact order is enforced in index.html and build-simple.js**

### Data Loading Strategy
- Development: Fetches individual JSON files
- Standalone: Uses embedded `window.SORTS`, `window.CLASSES`, etc.
- Check for embedded data first, fallback to fetch

### Routing Patterns
- `/creation` - Character creation (default)
- `/classes`, `/sorts`, `/dons` - Category overview pages
- `/sorts-{category}`, `/dons-{category}` - Specific category pages
- `/guerrier`, `/mage`, etc. - Individual class pages

### Editor Integration
- Dev mode toggle: `#devToggle` button
- Inline editing: Edit buttons with UnifiedEditor integration
- Changes stored in `JdrApp.data.editedData` overlay system
- Advanced features: Image enlargement, dev toolbox, subclass management

### **🔧 Development Best Practices**

#### **Adding New Features**
1. **Check Configuration First**: Can this be configured in `contentTypes.js`?
2. **Use EventBus**: Communicate between modules via events, not direct calls
3. **Extend Builders**: If you need custom rendering, extend CardBuilder/PageBuilder
4. **Generic Methods**: Always prefer `ContentFactory.operation()` over type-specific methods
5. **UnifiedEditor Integration**: Use UnifiedEditor for all content editing workflows
6. **Test Standalone Build**: Ensure mobile/tablet compatibility in build/JdrBab.html

#### **Code Quality Rules**
- ❌ **NEVER** create methods like `addSpell()`, `addDon()`, `addEquipment()`  
- ✅ **ALWAYS** use `ContentFactory.addItem(type, category, data)`
- ❌ **NEVER** duplicate HTML generation logic
- ✅ **ALWAYS** use CardBuilder/PageBuilder templates
- ❌ **NEVER** hardcode field mappings or configurations
- ✅ **ALWAYS** define everything in `contentTypes.js`

#### **Testing**
- Use `test-refactoring.html` to validate architecture changes
- Test new content types by adding them to the test file  
- Use browser dev tools for debugging modular version
- Test standalone build by opening generated HTML file

#### **Debugging Architecture Issues**
```javascript
// Check if ContentTypes is loaded correctly
console.log(window.ContentTypes);

// Test EventBus communication  
EventBus.emit('test', { data: 'hello' });

// Verify ContentFactory initialization
console.log(ContentFactory.getSpells().data);

// Debug CardBuilder output
const html = CardBuilder.create('spell', testData, 'category').build();
console.log(html);
```

### **⚠️ Common Pitfalls to Avoid**

1. **Adding type-specific methods instead of using generics**
   - Bad: `deleteSpell()`, `deleteDon()`, `deleteEquipment()`
   - Good: `ContentFactory.deleteItem(type, category, name)`

2. **Hardcoding HTML instead of using builders**
   - Bad: Inline template literals in modules
   - Good: `CardBuilder.create(type, data).build()`

3. **Direct module coupling instead of EventBus**
   - Bad: `JdrApp.modules.renderer.updatePage()`
   - Good: `EventBus.emit(Events.PAGE_RENDER, payload)`

4. **Bypassing ContentFactory for data operations**
   - Bad: Direct manipulation of `window.SORTS`
   - Good: `ContentFactory.updateItem(type, category, name, property, value)`

### **🔧 Code Quality & Production Readiness (Updated 2025-09-05)**

**✅ COMPREHENSIVE SYSTEM COMPLETED:**

1. **Advanced Editing System**: Implemented UnifiedEditor with:
   - Context-aware content editing for all content types
   - Session-based editing with proper content restoration
   - Universal content restoration preventing HTML tag visibility
   - Smart edit button management and dev mode integration

2. **Enhanced Architecture**: 
   - **27 JSON data files** with complete RPG system (200+ content items)
   - **105+ multimedia assets** with dual-mode URL system
   - **Advanced treasure table system** with fourchettes management
   - **Complete audio system** with ambient music playlists
   - **Campaign management tools** with hierarchical content structure

3. **Production Features**:
   - **Mobile-first standalone build** (build/JdrBab.html) for tablets/mobile
   - **Constants system** with centralized configuration (UI_CONSTANTS, etc.)
   - **Silent error handling** for production deployment
   - **Advanced filtering systems** (AND/OR logic for equipment/spells)
   - **Dev toolbox** with treasure table HTML link generation

4. **Developer Experience**:
   - **Interactive Windows batch menu** (menu.bat) for all operations
   - **Comprehensive README system** for js/, data/, css/, scripts/ directories
   - **Image enlargement system** with mobile touch support
   - **Real-time content editing** with automatic persistence

**Current Status**: Complete tabletop RPG system ready for production deployment.

### **📝 Content Format Standards**

**CRITICAL**: All content must be stored as HTML strings, never as arrays or complex objects.

#### **✅ CORRECT Format**
```json
{
  "capacites": "<ul><li><em>Expert de l'équipement</em>: Description.</li><li><em>Hardiesse</em>: Description.</li></ul>",
  "description": "<strong>Description:</strong> Texte avec formatage HTML.",
  "progression": "<strong>📈 Progression par niveau:</strong> +2 Force 💪"
}
```

#### **❌ WRONG Format**  
```json
{
  "capacites": [
    "Expert de l'équipement: Description.",
    "Hardiesse: Description."
  ],
  "description": {
    "type": "grid",
    "items": ["item1", "item2"]
  }
}
```

#### **Universal HTML Rule**
- ✅ **ALWAYS** save edited content as HTML strings
- ✅ **ALWAYS** use `<ul><li>` for lists, `<strong>` for bold, `<em>` for italic
- ❌ **NEVER** use arrays, grids, or complex nested objects
- ❌ **NEVER** create special processing for different content types

This ensures:
- Universal editing system works everywhere
- No special cases or type-specific code
- All content renders consistently
- Simple save/load mechanism to JSON

### **🛠️ Content Editing Implementation Rules**

**CRITICAL**: All content restoration after editing MUST use the unified system to prevent HTML tags being displayed as visible text.

#### **✅ CORRECT: Unified Content Restoration**

When implementing ANY content editing functionality:

```javascript
// In js/core/UnifiedEditor.js - USE THIS METHOD FOR ALL CONTENT TYPES
restoreElementContent(session, content) {
  // ALWAYS use innerHTML to render HTML content properly
  // This prevents HTML tags from being displayed as visible text
  session.element.innerHTML = content;
}
```

#### **❌ WRONG: Direct Assignment**
```javascript
// NEVER do this in editing contexts:
session.element.innerHTML = content;        // ❌ WRONG - bypasses unified system
session.element.textContent = content;      // ❌ WRONG - shows HTML tags as text
element.innerHTML = editedContent;          // ❌ WRONG - inconsistent behavior
```

#### **🔧 Implementation Guidelines**

1. **For ANY new editable content type:**
   - Use `data-edit-type="generic"` in the HTML
   - Content will automatically go through `restoreElementContent()`
   - No special handling needed

2. **When modifying UnifiedEditor.js:**
   - ALWAYS call `restoreElementContent()` instead of direct `innerHTML` assignment
   - This applies to `saveCurrentEdit()`, `cancelCurrentEdit()`, and any new methods

3. **When adding new editing features:**
   - Follow the existing pattern in UnifiedEditor.js
   - All content types (static pages, spells, classes, dons) use the same restoration method
   - No type-specific content restoration logic

#### **🎯 Universal Rule**
> **ALL edited content MUST be restored through `restoreElementContent()` to ensure HTML is rendered properly and tags are never visible to users.**

This prevents the recurring issue where HTML tags like `<p>`, `<strong>`, `<em>` appear as visible text after editing instead of being rendered as formatted HTML.

## 📖 README Navigation Guide

The codebase includes detailed README files in key directories to help analyze specific aspects of the application. Use this guide to find the right documentation for your task:

### 🧠 What You're Looking For → Which README to Read

#### **JavaScript Architecture & Code Analysis**
**Read**: [`js/README.md`](js/README.md)
- **When**: Understanding module structure, adding new features, debugging architecture
- **Contains**: Module dependency order, architecture patterns, code quality rules
- **Key Info**: Factory/Builder patterns, EventBus communication, UnifiedEditor system, configuration-driven development

#### **Data Structure & Content Management**
**Read**: [`data/README.md`](data/README.md)  
- **When**: Working with JSON data, adding content types, understanding content format
- **Contains**: All 27 data files explained, 105+ images, content type schemas
- **Key Info**: Complete RPG system (11 spells, 5 classes, 24+ feats, 41+ items, 10 monsters), treasure tables, audio system

#### **Styling & Visual Design**
**Read**: [`css/README.md`](css/README.md)
- **When**: Modifying appearance, responsive design, theming, component styling
- **Contains**: CSS architecture, medieval-fantasy design system, responsive breakpoints
- **Key Info**: Color palette, typography scale, utility classes, mobile-first approach

#### **Build System & Development Tools**
**Read**: [`scripts/README.md`](scripts/README.md)
- **When**: Build issues, development server problems, understanding deployment process
- **Contains**: Build pipeline, Windows batch tools, import/export system
- **Key Info**: Module loading order, data embedding process, standalone mobile build

### 🎯 Common Task Scenarios

#### **"I need to add a new content type (equipment, NPCs, etc.)"**
1. **Start with**: [`js/README.md`](js/README.md) → "Configuration Over Code" section
2. **Then read**: [`data/README.md`](data/README.md) → "Content Type System" section
3. **Key process**: Define in `contentTypes.js` → UnifiedEditor + builders handle automatically

#### **"I'm getting build errors or module loading issues"**
1. **Start with**: [`scripts/README.md`](scripts/README.md) → "Build System Architecture"
2. **Then check**: [`js/README.md`](js/README.md) → "Critical Loading Order" section (updated 20 modules)
3. **Debug approach**: Verify constants.js loads first, check UnifiedEditor integration

#### **"I need to understand the data format or add new content"**
1. **Start with**: [`data/README.md`](data/README.md) → "Universal Content Format" section
2. **Key rule**: All content must be HTML strings, never arrays or complex objects
3. **Reference**: 27 JSON files with complete RPG system (200+ items total)

#### **"I want to modify the visual design or add responsive features"**
1. **Start with**: [`css/README.md`](css/README.md) → "Design System" section
2. **Key info**: Medieval-fantasy theme, mobile-first responsive design
3. **Approach**: Test in standalone build (mobile users' primary access method)

#### **"I need to understand how editing and persistence works"**
1. **Start with**: [`js/README.md`](js/README.md) → "UnifiedEditor System" section
2. **Key concepts**: Context-aware editing, session-based editing, universal content restoration
3. **Integration**: EventBus communication, localStorage persistence, dev mode management

#### **"I'm working on mobile compatibility or responsive design"**
1. **Primary**: [`css/README.md`](css/README.md) → "Responsive Design System" section
2. **Secondary**: [`scripts/README.md`](scripts/README.md) → "Mobile-first standalone build"
3. **Critical**: Mobile users ONLY access build/JdrBab.html (not dev mode)

#### **"I want to add treasure tables, audio, or campaign features"**
1. **Start with**: [`data/README.md`](data/README.md) → "Advanced Features" section
2. **Reference**: TablesTresorsManager.js, audio system, campaign tools
3. **Integration**: Dev toolbox provides HTML link generation for treasure tables

### 📋 Quick Reference Cheat Sheet

```bash
# Architecture & Patterns     → js/README.md
# Data & Content             → data/README.md  
# Styling & Design           → css/README.md
# Build & Development        → scripts/README.md
```

**💡 Pro Tip**: When debugging issues, start with the README that matches your error domain (JavaScript errors → js/, build errors → scripts/, styling issues → css/, data problems → data/).