# 🎯 Claude Project Feature Guide - JDR BAB Application

> **Purpose**: This guide helps Claude (AI assistant) efficiently navigate and understand the JDR BAB tabletop RPG application's features and architecture.

## 📋 Quick Reference Map

### 🔍 **Spell Filtering System**
- **Location**: `js/features/SpellFilter.js`
- **Function**: Advanced spell filtering by level with dynamic UI updates
- **Key Features**:
  - Level-based filtering (≤ max level)
  - Category-aware filtering (mage, prêtre, enchanteur)
  - DOM manipulation for hiding/showing spell cards
  - Throttled performance optimization
  - Filter state persistence across page navigation

### 🏷️ **Tag Management System**
- **Location**: `js/ui/TagsManager.js`
- **Function**: Comprehensive tag management for monsters, objects, and treasure tables
- **Key Features**:
  - Modal-based tag creation/deletion
  - Multi-content-type support (monster, objet, tableTresor)
  - Persistent storage in metadata
  - Tag assignment to content items
  - Automatic content cleanup when tags are deleted

### ⭐ **Favorites Management**
- **Location**: `js/features/FavorisManager.js`
- **Function**: Add/remove items to favorites with local storage persistence
- **Key Features**:
  - Star-based UI (⭐/☆)
  - Local storage persistence
  - Event bus integration
  - Support for sorts (spells) and objets (objects)
  - Feedback notifications

### 🎨 **Favorites Rendering**
- **Location**: `js/features/FavorisRenderer.js`
- **Function**: Real-time favorites page rendering and updates
- **Key Features**:
  - Auto-updates favorites display when items added/removed
  - Event-driven rendering (listens to favorites changes)
  - Empty state management
  - Responsive grid layout after content insertion

### ✏️ **Unified Editor System**
- **Location**: `js/core/UnifiedEditor.js`
- **Function**: Content editing system for all data types
- **Key Features**:
  - HTML content editing
  - Generic field editing
  - Context-aware editing sessions
  - Content restoration (prevents HTML tag display)
  - Edit session management

### 💎 **Treasure Tables Manager**
- **Location**: `js/features/TablesTresorsManager.js`
- **Function**: Advanced treasure table management with object preview
- **Key Features**:
  - Object preview modals (shows object details when clicked)
  - Range ("fourchette") editing system
  - Add/edit/delete treasure ranges
  - Table preview functionality
  - Modal management with event delegation

### 📜 **Scroll Performance Optimizer**
- **Location**: `js/features/ScrollOptimizer.js`
- **Function**: Performance optimization for large content lists
- **Key Features**:
  - Virtual scrolling for long lists (>20 items)
  - Debounced/throttled scroll handlers
  - Lazy loading implementation
  - Viewport-based card visibility optimization
  - Mutation observer for dynamic content

### 🎯 **Dynamic Content Centering**
- **Location**: `js/features/DynamicCentering.js`
- **Function**: Intelligent content centering based on viewport and device
- **Key Features**:
  - Responsive design integration
  - Sidebar-aware centering calculations
  - Device detection (mobile/tablet/desktop)
  - ResizeObserver for automatic adjustments
  - CSS media query coordination

### 🏗️ **Content Builders**
- **Card Builder**: `js/builders/CardBuilder.js` - Generates UI cards for all content types
- **Page Builder**: `js/builders/PageBuilder.js` - Builds complete pages and layouts

### 🎮 **Core System Files**

#### Router & Navigation
- **Router**: `js/router.js` - Main routing system, handles all page navigation
- **Page Manager**: `js/ui/PageManager.js` - Page lifecycle management

#### Data & Storage
- **Storage**: `js/storage.js` - Data persistence and localStorage management
- **Content Types**: `js/config/contentTypes.js` - Configuration for all content types (spell, don, class, subclass, monster, objet, tableTresor)
- **Constants**: `js/config/constants.js` - Application-wide constants
- **Base Entity**: `js/core/BaseEntity.js` - Base class for data management with CRUD operations

#### Event System
- **Event Bus**: `js/core/EventBus.js` - Central event system for communication between modules
- **Events**: Includes CONTENT_ADD, CONTENT_DELETE, PAGE_RENDER, STORAGE_SAVE, FAVORIS_UPDATE, etc.

#### UI Components
- **Modal Manager**: `js/ui/ModalManager.js` - Modal dialog system
- **Search Manager**: `js/ui/SearchManager.js` - Global search functionality
- **Responsive Manager**: `js/ui/ResponsiveManager.js` - Mobile/desktop responsiveness
- **UICore**: `js/ui/UICore.js` - Core UI utilities and helpers
- **Content Manager**: `js/ui/ContentManager.js` - Content lifecycle management
- **Event Handlers**: `js/ui/EventHandlers.js` - UI event delegation

#### Specialized Filters
- **Monster Filters**: `js/ui/MonsterFilters.js` - Monster-specific filtering
- **GM Object Filters**: `js/ui/GMObjectFilters.js` - Game master object filters
- **Table Tresor Filters**: `js/ui/TableTresorFilters.js` - Treasure table filters

#### Device & Performance
- **Device Detection**: `js/utils/device-detection.js` - Mobile/tablet/desktop detection
- **Utils**: `js/utils.js` - General utility functions

### 📊 **Data Files & Configuration**
- **Core Game Data**: `data/` directory contains all JSON files:
  - `sorts.json` - Spells data (by category: mage, prêtre, enchanteur)
  - `objets.json` - Objects/items data with complex structure
  - `monstres.json` - Monsters data with tags and filtering
  - `tables-tresors.json` - Treasure tables with ranges and categories
  - `classes.json` - Character classes with subclasses
  - `dons.json` - Character feats/abilities
  - `etats.json` - Status effects and conditions

- **Configuration Files**:
  - `static-pages-config.json` - Static page definitions
  - `toc-structure.json` - Table of contents and navigation structure
  - `audio-config.json` - Audio system configuration
  - `images.json` - Image metadata and categories
  - `favoris.json` - User favorites storage structure

- **Page Descriptions**:
  - `monstres-page-desc.json` - Monster page configuration
  - `tables-tresors-page-desc.json` - Treasure tables page config
  - `custom-page-descriptions.json` - Custom page metadata

### 🎨 **Styling System**
- **Main Styles**: `css/` directory:
  - `components.css` - UI component styles (cards, buttons, modals)
  - `layout.css` - Page layout and responsive grid system
  - `theme.css` - Color themes and CSS variables
  - `editor.css` - Editor-specific styles and states
  - `utilities.css` - Utility classes
  - `scroll-optimizations.css` - Performance optimizations

### 🔧 **Advanced Modules & Utilities**
- **Audio System**: `js/modules/audio.js` - Background music with playlist management
- **Image Management**: `js/modules/images.js` - Image loading, optimization and display
- **PDF Generation**: `js/libs/jspdf-loader.js` - Character sheet PDF generation
- **Content Factory**: `js/factories/ContentFactory.js` - Dynamic content creation
- **Utils**: `js/utils.js` - General utility functions

## 🎯 **How to Find Specific Features**

### When User Wants to Modify Spell Filtering:
```
PRIMARY: js/features/SpellFilter.js
RELATED: js/ui/SearchManager.js (if global search integration needed)
```

### When User Wants to Add/Modify Tags:
```
PRIMARY: js/ui/TagsManager.js
RELATED: js/config/contentTypes.js (tag configuration)
RELATED: data/*.json (actual tag data)
```

### When User Wants to Edit Content Creation/Editing:
```
PRIMARY: js/core/UnifiedEditor.js
RELATED: js/builders/CardBuilder.js (for display)
RELATED: js/builders/PageBuilder.js (for page layout)
```

### When User Wants to Modify Navigation/Pages:
```
PRIMARY: js/router.js
RELATED: js/ui/PageManager.js
RELATED: js/ui/ResponsiveManager.js (mobile considerations)
```

### When User Wants to Add New Content Types:
```
PRIMARY: js/config/contentTypes.js (configuration)
RELATED: js/builders/CardBuilder.js (rendering)
RELATED: js/storage.js (persistence)
RELATED: data/ (add new JSON file)
```

## 🚀 **Performance & Optimization Features**
- **Scroll Optimizations**: `js/features/ScrollOptimizer.js` - Virtual scrolling, lazy loading
- **Dynamic Centering**: `js/features/DynamicCentering.js` - Intelligent viewport centering
- **Event Throttling**: Built into SpellFilter and other interactive components
- **Mutation Observers**: For efficient DOM monitoring
- **ResizeObserver**: For responsive layout adjustments

## 📱 **Mobile/Responsive Features**
- **Device Detection**: `js/utils/device-detection.js` - Comprehensive device type detection
- **Responsive Manager**: `js/ui/ResponsiveManager.js` - Layout adaptation
- **Touch-friendly UI**: Integrated throughout component styles
- **Breakpoint System**: Mobile (≤980px), Tablet (≤1024px), Desktop (>1024px)
- **Pointer Detection**: Coarse/fine pointer support

## 🔄 **Event System Architecture**
- **Central Event Bus**: `js/core/EventBus.js` - Singleton pattern event system
- **Events**: Comprehensive event catalog:
  - Page navigation: `PAGE_RENDER`
  - Content operations: `CONTENT_ADD`, `CONTENT_DELETE`, `CONTENT_UPDATE`
  - Favorites: `FAVORIS_ADD`, `FAVORIS_REMOVE`, `FAVORIS_UPDATE`
  - Storage: `STORAGE_SAVE`
  - UI: `MODAL_OPEN`, `MODAL_CLOSE`, `NOTIFICATION_SHOW`
  - Editing: `EDITOR_TOGGLE`

## 💾 **Data Persistence & Structure**
- **Storage Keys**: Defined in `js/config/constants.js`
- **LocalStorage**: Primary storage mechanism with JSON serialization
- **Metadata System**: `_metadata` properties for extended data (tags, configuration)
- **Content Types**: Defined in `js/config/contentTypes.js` with field mappings
- **Base Entity**: `js/core/BaseEntity.js` provides CRUD operations
- **Backup System**: `Backups/` directory for data safety

## 🎵 **Audio System**
- **Audio Manager**: `js/modules/audio.js` - Complete audio player with playlist support
- **Music Files**: `data/Musiques/` directory organized by themes
- **Configuration**: `data/audio-config.json` - Volume, autoplay, folder icons
- **Categories**: Auberge, Creation, Foret, Mine, Voyage, Autre
- **Playlist Generator**: `data/Musiques/update-playlists.js`

## 🖼️ **Image System**
- **Image Manager**: `js/modules/images.js` - Image loading and optimization
- **Image Files**: `data/images/` directory with categorized structure
- **Categories**: Classes, Monsters, Objects, Spells with subcategories
- **Metadata**: `data/images.json` - Image configuration and mappings
- **Optimization**: Lazy loading and progressive enhancement

## 📄 **PDF Generation**
- **PDF Library**: `js/libs/jspdf-loader.js` - Dynamic jsPDF loading
- **Character Sheets**: PDF generation for character creation
- **CDN Fallback**: External CDN with error handling

---

## 🔧 **Quick Action Reference**

| Task | Primary File | Supporting Files |
|------|-------------|------------------|
| Add spell filter | `SpellFilter.js` | `contentTypes.js` |
| Create new tag | `TagsManager.js` | `data/*.json` |
| Modify favorites | `FavorisManager.js` | `FavorisRenderer.js`, `storage.js` |
| Edit content | `UnifiedEditor.js` | `CardBuilder.js`, `BaseEntity.js` |
| Add new page | `router.js` | `PageManager.js`, `toc-structure.json` |
| Style changes | `css/components.css` | `css/theme.css` |
| Add audio | `audio.js` | `audio-config.json`, `data/Musiques/` |
| Performance fix | `ScrollOptimizer.js` | `DynamicCentering.js`, `utils.js` |
| Treasure tables | `TablesTresorsManager.js` | `TableTresorFilters.js` |
| Device detection | `device-detection.js` | `ResponsiveManager.js` |
| PDF generation | `jspdf-loader.js` | Character creation pages |
| Event handling | `EventBus.js` | All modules (event-driven) |

## 📚 **Important Notes for Claude**
- **Always check `js/config/contentTypes.js`** for content configuration and field mappings
- **Data files location**: `data/` directory for all JSON data
- **Event-driven architecture**: Most features communicate via EventBus
- **Responsive design**: Multi-breakpoint system with device detection
- **Performance-first**: Optimized for large datasets with virtual scrolling
- **Modular structure**: Each feature is self-contained but event-integrated