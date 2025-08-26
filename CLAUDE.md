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
- **Complete build**: Combines 15+ JS modules, 5 CSS files, and 8+ JSON data files
- **Size**: ~500-800KB complete application with all content and assets

## Architecture Overview

### Refactored Modular Structure
This codebase has been completely refactored from a 7,469-line monolith into a professional, modular architecture. The new structure reduces code duplication by 52% while maintaining full functionality.

### Core Application Structure
- **Namespace**: `window.JdrApp` - main application object
- **Data Models**: SORTS, CLASSES, DONS managed by ContentFactory
- **Event System**: Decentralized EventBus for module communication
- **Pattern-Based Architecture**: Factory, Builder, Observer patterns
- **Dual Mode Support**: Development (modular files) vs Production (standalone HTML)

### New Architecture Components

#### Configuration Layer (`js/config/`)
- `contentTypes.js` - **CENTRAL CONFIGURATION** for all content types
- Defines fields, templates, icons, default values for spells, dons, classes, etc.
- **CRITICAL**: All new content types MUST be defined here first

#### Core Foundation (`js/core/`)
- `EventBus.js` - Singleton event system for decoupled communication
- `BaseEntity.js` - Generic entity class for all data types (spells, dons, etc.)
- Eliminates duplicate CRUD operations across different content types

#### Factory Layer (`js/factories/`)
- `ContentFactory.js` - Unified data management via Factory pattern
- Single point of access for all content operations (find, add, delete, move)
- Automatically creates typed entities from ContentTypes configuration

#### Builder Layer (`js/builders/`)
- `CardBuilder.js` - Generates cards for ANY content type using templates
- `PageBuilder.js` - Generates pages for ANY content type using templates  
- **NO MORE** separate methods for spells, dons, classes - one builder handles all

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

#### Editor (`js/editor.js`) - 584 lines (was 1370) **-57% reduction**  
- **UNIFIED**: Single editing system for all content types via ContentFactory
- **EVENT-DRIVEN**: Uses EventBus for decoupled communication
- Dev mode toggle functionality
- Real-time content modification with automatic persistence

#### UI (`js/ui.js`) - 478 lines (was 467) **Enhanced functionality**
- **GENERIC**: Single handler for all content operations (add/delete/move)
- **EVENT-BASED**: Modal and notification system via EventBus
- Search, responsive design, accessibility features

#### Storage (`js/storage.js`) - Unchanged
- Local storage management
- Export functionality (JSON, HTML)  
- Data persistence across sessions

### Data Structure and Content Types
```
data/
├── sorts.json              # Spell categories with 60+ spells
├── classes.json            # 8+ character classes and subclasses
├── dons.json              # Feat categories and abilities
├── objets.json            # Equipment and items with filtering
├── monstres.json          # Creature bestiary with full RPG stats  
├── images.json            # Image URL mappings (42+ images)
├── static-pages-config.json # Static page configurations
├── toc-structure.json     # Navigation structure
├── elements.json          # Elemental types and relationships
├── stats.json, states.json # Game mechanics data
└── creation.json          # Character creation rules
```

**Content Type System**: All content types are defined in `js/config/contentTypes.js` with:
- Field schemas and validation
- Template identifiers  
- Icons and default values
- Edit mappings for UI elements

### Asset Organization (42+ Images)
```
data/images/
├── Classes/               # Character portraits (22 images)  
│   ├── Aventurier.png, AventurierF.png
│   ├── Mage.png, MageF.png, Guerrier.png, etc.
│   └── [Male/Female variants for each class]
├── Sorts/                 # Spell icons (10 images)
│   ├── BouleDeFeu.png, Eclair.png, Protection.png
│   └── [Elemental and utility spell icons]
├── Equipements/           # Equipment imagery
│   ├── Armes/            # Weapons (6+ items)
│   ├── Armures/          # Armor (6+ items including robes)
│   ├── Bouclier/         # Shields  
│   └── Consumables/      # Consumable items
│       ├── Herbs/        # Herbal items (8 images)
│       ├── Pots/         # Potions (2 images)
│       └── SpellCasting/ # Magical implements (8 wands)
└── Monstres/             # Monster imagery
    └── foret/            # Forest creatures (10+ monsters)
```

**Image Management System**:
- **Dual URLs**: External (ibb.co) for dev, local paths for assets
- **Type-specific naming**: `sort:category:name`, `subclass:class:name:index`
- **Dual-image support**: Subclasses can have 2 images (`:1`, `:2` suffixes)
- **Responsive sizing**: CSS `object-fit: contain` for optimal display

### Styling
Modular CSS architecture:
- `css/theme.css` - Variables and theming
- `css/utilities.css` - Utility classes
- `css/components.css` - UI components
- `css/layout.css` - Layout and responsive design
- `css/editor.css` - Development mode styles

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
- ✅ **Editor** automatically handles editing for your new type
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

### Critical Module Loading Order
Modules must be loaded in exact dependency order:
```javascript
1. js/core.js                    // JdrApp namespace - MUST BE FIRST
2. js/config/contentTypes.js     // Configuration layer
3. js/core/EventBus.js          // Event system foundation  
4. js/core/BaseEntity.js        // Entity base class
5. js/factories/ContentFactory.js // Factory pattern implementation
6. js/builders/CardBuilder.js    // Card template generation
7. js/builders/PageBuilder.js    // Page template generation
8. js/utils.js                  // DOM and utility functions
9. js/modules/images.js         // Asset management
10. js/storage.js               // Persistence layer
11. js/router.js                // Navigation system
12. js/renderer.js              // Content rendering 
13. js/core/UnifiedEditor.js    // Editing system core
14. js/editor.js                // Editor UI and interactions
15. js/features/SpellFilter.js  // Specialized features
16. js/ui.js                    // UI interactions - MUST BE LAST
```
**Violation of this order will cause runtime errors and module failures.**

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
- Inline editing: Double-click elements with `editable` class
- Changes stored in `JdrApp.data.editedData` overlay system

### **🔧 Development Best Practices**

#### **Adding New Features**
1. **Check Configuration First**: Can this be configured in `contentTypes.js`?
2. **Use EventBus**: Communicate between modules via events, not direct calls
3. **Extend Builders**: If you need custom rendering, extend CardBuilder/PageBuilder
4. **Generic Methods**: Always prefer `ContentFactory.operation()` over type-specific methods

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
- **Key Info**: Factory/Builder patterns, EventBus communication, configuration-driven development

#### **Data Structure & Content Management**
**Read**: [`data/README.md`](data/README.md)  
- **When**: Working with JSON data, adding content types, understanding content format
- **Contains**: All data files explained, image management system, content type schemas
- **Key Info**: 60+ spells, 42+ images, universal HTML format rules, asset organization

#### **Styling & Visual Design**
**Read**: [`css/README.md`](css/README.md)
- **When**: Modifying appearance, responsive design, theming, component styling
- **Contains**: CSS architecture, medieval-fantasy design system, responsive breakpoints
- **Key Info**: Color palette, typography scale, utility classes, mobile-first approach

#### **Build System & Development Tools**
**Read**: [`scripts/README.md`](scripts/README.md)
- **When**: Build issues, development server problems, understanding deployment process
- **Contains**: Build pipeline, Windows batch tools, import/export system
- **Key Info**: Module loading order, data embedding process, development workflow

### 🎯 Common Task Scenarios

#### **"I need to add a new content type (equipment, NPCs, etc.)"**
1. **Start with**: [`js/README.md`](js/README.md) → "Configuration Over Code" section
2. **Then read**: [`data/README.md`](data/README.md) → "Content Type System" section
3. **Key process**: Define in `contentTypes.js` → System handles the rest automatically

#### **"I'm getting build errors or module loading issues"**
1. **Start with**: [`scripts/README.md`](scripts/README.md) → "Build System Architecture"
2. **Then check**: [`js/README.md`](js/README.md) → "Critical Loading Order" section
3. **Debug approach**: Verify module dependency order, check for syntax errors

#### **"I need to understand the data format or add new content"**
1. **Start with**: [`data/README.md`](data/README.md) → "Universal Content Format" section
2. **Key rule**: All content must be HTML strings, never arrays or complex objects
3. **Reference**: See content type examples and field schemas

#### **"I want to modify the visual design or add responsive features"**
1. **Start with**: [`css/README.md`](css/README.md) → "Design System" section
2. **Key info**: CSS custom properties, utility classes, responsive breakpoints
3. **Approach**: Use existing components and utilities before creating new CSS

#### **"I need to understand how editing and persistence works"**
1. **Start with**: [`js/README.md`](js/README.md) → "Event-Driven Communication" section
2. **Then read**: [`data/README.md`](data/README.md) → "Data Validation Rules" section
3. **Key concepts**: UnifiedEditor system, EventBus, localStorage persistence

#### **"I'm working on mobile compatibility or responsive design"**
1. **Primary**: [`css/README.md`](css/README.md) → "Responsive Design System" section
2. **Secondary**: [`scripts/README.md`](scripts/README.md) → "Mobile Compatible" build process
3. **Remember**: Mobile users only access the standalone build, not dev mode

### 📋 Quick Reference Cheat Sheet

```bash
# Architecture & Patterns     → js/README.md
# Data & Content             → data/README.md  
# Styling & Design           → css/README.md
# Build & Development        → scripts/README.md
```

**💡 Pro Tip**: When debugging issues, start with the README that matches your error domain (JavaScript errors → js/, build errors → scripts/, styling issues → css/, data problems → data/).