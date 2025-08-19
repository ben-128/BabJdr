# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Modular Structure
This is a refactored JDR-BAB (tabletop RPG) web application split into modular components for better maintainability. The original was a single 7,469-line file, now split into ~15 files of ~200 lines each.

### Core Application Structure
- **Namespace**: `window.JdrApp` - main application object
- **Data Models**: SORTS, CLASSES, DONS stored in `JdrApp.data`
- **Module System**: Router, Renderer, Editor, Storage, Images modules
- **Dual Mode Support**: Development (modular files) vs Production (standalone HTML)

### Key Modules

#### Core (`js/core.js`)
- Application initialization and data loading
- Handles both development (fetch JSON) and standalone (embedded data) modes
- Module dependency management and initialization order

#### Router (`js/router.js`) 
- Hash-based routing system (`#/page`)
- Table of contents generation from data
- Category routing for sorts, dons, and classes

#### Renderer (`js/renderer.js`)
- Dynamic content generation from JSON data
- Handles spells, classes, feats rendering
- Static page content management

#### Editor (`js/editor.js`)
- Inline editing system (double-click to edit)
- Dev mode toggle functionality
- Real-time content modification

#### Storage (`js/storage.js`)
- Local storage management
- Export functionality (JSON, HTML)
- Data persistence across sessions

### Data Structure
- `data/sorts.json` - Spell categories and spells
- `data/classes.json` - Character classes and subclasses  
- `data/dons.json` - Feat categories and individual feats
- `data/static-pages-config.json` - Configuration for static content pages
- Additional JSON files for elements, stats, states, etc.

### Styling
Modular CSS architecture:
- `css/theme.css` - Variables and theming
- `css/utilities.css` - Utility classes
- `css/components.css` - UI components
- `css/layout.css` - Layout and responsive design
- `css/editor.css` - Development mode styles

## Important Implementation Notes

### Initialization Order
Modules must be initialized in dependency order:
1. Utils (events, DOM helpers)
2. Images module
3. Renderer (before router)
4. Router (after content generation)
5. Editor, Storage

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

### Testing/Development
- No formal test framework - manual testing via dev server
- Use browser dev tools for debugging modular version
- Test standalone build by opening generated HTML file