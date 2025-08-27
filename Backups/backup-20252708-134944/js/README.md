# JavaScript Architecture

This directory contains the modular JavaScript architecture of the JDR-BAB application, completely refactored from a 7,469-line monolith into professional, maintainable modules.

## 📁 Directory Structure

### Core Foundation (`/core/`)
- **`core.js`** - Application namespace and initialization (JdrApp)
- **`EventBus.js`** - Singleton event system for decoupled module communication
- **`BaseEntity.js`** - Generic entity class for all data types (spells, dons, etc.)
- **`UnifiedEditor.js`** - Universal content editing system

### Configuration Layer (`/config/`)
- **`contentTypes.js`** - **CENTRAL CONFIGURATION** for all content types
  - Field schemas with validation (text, textarea, richtext, select)
  - Templates and icons for each content type
  - Default values for new items
  - **CRITICAL**: All new content types MUST be defined here first

### Factory Pattern (`/factories/`)
- **`ContentFactory.js`** - Unified data management via Factory pattern
  - Single point of access for all content operations (find, add, delete, move)
  - Automatically creates typed entities from ContentTypes configuration

### Builder Pattern (`/builders/`)
- **`CardBuilder.js`** - Generates cards for ANY content type using templates
- **`PageBuilder.js`** - Generates pages for ANY content type using templates
- **NO MORE** separate methods for spells, dons, classes - one builder handles all

### Feature Modules (`/modules/`, `/features/`)
- **`images.js`** - Asset management and image handling
- **`SpellFilter.js`** - Advanced filtering system for spells and objects

### Main Application Modules
- **`utils.js`** - DOM utilities, event helpers, data manipulation
- **`router.js`** - Hash-based routing system (`#/page`)
- **`renderer.js`** - Content rendering using PageBuilder and CardBuilder
- **`editor.js`** - Editor UI and dev mode functionality
- **`storage.js`** - LocalStorage, export/import, data persistence
- **`ui.js`** - UI interactions, modals, notifications

## 🔄 Critical Loading Order

```javascript
1. js/core.js                    // JdrApp namespace - MUST BE FIRST
2. js/config/contentTypes.js     // Configuration layer
3. js/core/EventBus.js          // Event system foundation  
4. js/core/BaseEntity.js        // Entity base class
5. js/factories/ContentFactory.js // Factory pattern
6. js/builders/CardBuilder.js    // Card generation
7. js/builders/PageBuilder.js    // Page generation
8. js/utils.js                  // Utilities
9. js/modules/images.js         // Asset management
10. js/storage.js               // Persistence
11. js/router.js                // Navigation
12. js/renderer.js              // Rendering
13. js/core/UnifiedEditor.js    // Editing core
14. js/editor.js                // Editor UI
15. js/features/SpellFilter.js  // Features
16. js/ui.js                    // UI - MUST BE LAST
```

**⚠️ WARNING**: Violating this order will cause runtime errors and module failures.

## 🏗️ Architecture Principles

### Configuration Over Code
- All content types defined in `contentTypes.js`
- No hardcoded HTML or field mappings
- New content types require only configuration, not code changes

### Factory Pattern Implementation
- `ContentFactory` manages all CRUD operations
- Universal methods: `addItem()`, `deleteItem()`, `updateItem()`
- **NEVER** create type-specific methods like `addSpell()`, `deleteDon()`

### Builder Pattern for UI
- `CardBuilder.create(type, data, category).build()` for ALL content types
- `PageBuilder.buildCategoryPage(type, category)` for ALL pages
- **NEVER** hardcode HTML generation in modules

### Event-Driven Communication
- `EventBus.emit()` and `EventBus.on()` for module communication
- **NEVER** direct module coupling like `JdrApp.modules.renderer.method()`
- Decoupled, testable, maintainable architecture

## 📝 Code Quality Rules

### ❌ Anti-Patterns (NEVER DO)
```javascript
// Don't create type-specific methods
generateSpellCard(spell) { ... }      // ❌ WRONG
addNewEquipment(category) { ... }     // ❌ WRONG
deleteMonster(category, name) { ... } // ❌ WRONG

// Don't hardcode HTML
element.innerHTML = `<div class="card">...`; // ❌ WRONG

// Don't directly manipulate data
window.SORTS[category].push(newSpell); // ❌ WRONG
```

### ✅ Correct Patterns (ALWAYS DO)
```javascript
// Use generic systems
CardBuilder.create('spell', data, category).build()     // ✅ RIGHT
ContentFactory.addItem('equipment', category, item)     // ✅ RIGHT
EventBus.emit(Events.PAGE_RENDER, { type, category })   // ✅ RIGHT

// Use configuration-driven approach
const config = ContentTypes.getConfig('monster');       // ✅ RIGHT
const defaultValues = config.defaultValues;             // ✅ RIGHT
```

## 🔍 Debugging and Development

### Useful Debug Commands
```javascript
// Check ContentTypes configuration
console.log(window.ContentTypes);

// Test EventBus communication
EventBus.emit('test', { data: 'hello' });

// Verify ContentFactory initialization
console.log(ContentFactory.getSpells().data);

// Debug CardBuilder output
const html = CardBuilder.create('spell', testData, 'Feu').build();
console.log(html);
```

## 📊 Module Statistics (Post-Refactoring)

- **core.js**: 172 lines (was 203) - Application initialization
- **renderer.js**: 172 lines (was 711) - **76% reduction** through builders
- **editor.js**: 584 lines (was 1370) - **57% reduction** through unification
- **ui.js**: 478 lines (was 467) - Enhanced functionality with generics

**Total code reduction: 52% while maintaining full functionality**