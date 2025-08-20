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
```

**IMPORTANT**: Claude should NOT run `npm run dev` or similar dev server commands as they block the terminal and prevent further interaction. Use existing running servers instead.

### Windows Batch Alternatives
- `dev-server.bat` - Development mode with dev tools and live reload
- `build.bat` - Build standalone version with Windows-specific output handling
- `start-server.bat` - Fallback server startup (tries npm, then Python HTTP server)

### Project Build System
- Built files are generated in `build/standalone/JdrBab.html`
- Build process combines modular files into a single standalone HTML file
- Standalone version embeds all CSS, JS, and JSON data inline

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

### Data Structure
- `data/sorts.json` - Spell categories and spells
- `data/classes.json` - Character classes and subclasses  
- `data/dons.json` - Feat categories and individual feats
- `data/static-pages-config.json` - Configuration for static content pages
- `data/images.json` - Image references and metadata (42+ images as of 2025-08-20)
- Additional JSON files for elements, stats, states, etc.

### Assets Structure
- `data/images/Classes/` - Character class portraits (20 images)
- `data/images/Sorts/` - Spell icons (9 images) 
- `data/images/Equipements/` - **NEW** Equipment imagery
  - `Armes/` - Weapon images (6+ items)
  - `Armures/` - Armor images (3+ items) 
  - `Consumables/` - Consumable items with subcategories:
    - `Herbs/` - Herb items (8+ images)
    - `Pots/` - Potion items (2+ images)
    - `SpellCasting/` - Magical implements (8+ images)
- `data/images/Monstres/` - **NEW** Monster imagery
  - `foret/` - Forest monsters (4+ creatures)

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

### Initialization Order
Modules must be initialized in dependency order:
1. **Configuration** (contentTypes.js, EventBus, BaseEntity, ContentFactory)
2. **Builders** (CardBuilder, PageBuilder) 
3. **Utils** (events, DOM helpers)
4. **Images** module
5. **Core, Renderer** (before router)
6. **Router** (after content generation)
7. **Editor, Storage, UI**

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