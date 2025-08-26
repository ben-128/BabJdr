# Build Scripts and Development Tools

This directory contains the build system and development automation tools for the JDR-BAB application, supporting both Windows batch workflows and Node.js-based operations.

## 📁 Script Overview

### Build System
- **`build-simple.js`** - Node.js build script for standalone HTML generation
- **`build.bat`** - Windows batch wrapper for build process with UI feedback
- **`server.js`** - Clean development server (alternative to live-server)

### Development Tools  
- **`dev-server.bat`** - Development server launcher with clean output
- **`import-archive.bat`** - Import system for restoring exported data
- **`clean-backups.bat`** - Maintenance tool for backup folder cleanup

## 🏗️ Build System Architecture

### `build-simple.js` - Core Build Engine
**Purpose**: Combines modular development files into a single standalone HTML file

**Process**:
1. **Template Loading**: Reads `index.html` as base template
2. **Module Aggregation**: Combines 15+ JavaScript modules in correct dependency order
3. **CSS Integration**: Merges 5 CSS files with proper cascade order
4. **Data Embedding**: Converts JSON files to `window.SORTS`, `window.CLASSES`, etc.
5. **Asset Optimization**: Inlines all resources for offline functionality
6. **Output Generation**: Creates `build/JdrBab.html` (~500-800KB complete app)

**Key Features**:
- **Dependency Management**: Maintains critical module loading order
- **Data Transformation**: JSON → JavaScript global variables
- **Single File Output**: Complete application in one HTML file
- **Offline Ready**: No external dependencies required
- **Mobile Compatible**: Optimized for mobile/tablet usage

### `build.bat` - Windows Build Interface
**Purpose**: User-friendly Windows interface for build process

**Features**:
- **Visual Feedback**: Progress indicators and status messages
- **Error Handling**: Clear error reporting and troubleshooting
- **File Information**: Shows build output size and location
- **Quick Launch**: Option to immediately open generated file
- **Path Display**: Full file path for easy access

## 🖥️ Development Servers

### `server.js` - Clean Development Server
**Purpose**: Alternative to npm live-server with cleaner output

**Features**:
- **Port 3000**: Standard development port
- **No Browser Auto-Open**: Terminal-friendly behavior
- **Clean Console**: Minimal logging for better development experience
- **Static File Serving**: Serves all project files correctly
- **CORS Enabled**: Proper headers for JSON data loading

### `dev-server.bat` - Development Launcher
**Purpose**: Windows wrapper for development server startup

**Features**:
- **Multiple Fallbacks**: Tries npm, then Node.js server, then Python
- **Environment Detection**: Automatically selects best available server
- **Error Recovery**: Graceful fallback when primary options fail
- **User Feedback**: Clear status messages and instructions

## 📥 Import/Export System

### `import-archive.bat` - Data Import Tool
**Purpose**: Automated restoration of exported data archives

**Workflow**:
1. **Auto-Detection**: Finds latest `JdrBab-*.zip` file in Downloads folder
2. **Backup Creation**: Creates timestamped backup before import
3. **Archive Extraction**: Unzips data to temporary directory
4. **File Replacement**: Overwrites existing data with imported content
5. **Validation**: Ensures all required files are present
6. **Cleanup**: Removes temporary files after successful import

**Safety Features**:
- **Automatic Backups**: Never lose current data
- **Validation Checks**: Ensures import integrity
- **Error Recovery**: Rollback capability on failure
- **User Confirmation**: Clear prompts before destructive operations

## 🧹 Maintenance Tools

### `clean-backups.bat` - Backup Management
**Purpose**: Maintains backup folder by removing old backups

**Strategy**:
- **Keep Recent**: Preserves most recent backups
- **Remove Old**: Cleans up backups older than specified threshold
- **Space Management**: Prevents backup folder from growing too large
- **Safe Deletion**: Confirms before removing any files

## 🔄 Development Workflow Integration

### Windows Menu System
All scripts integrate with the main `menu.bat` interface:

```
1. Serveur de développement  → dev-server.bat
2. Build standalone          → build.bat  
3. Import archive           → import-archive.bat
4. Nettoyage sauvegardes   → clean-backups.bat
5. Quitter
```

### NPM Integration
Scripts complement npm commands defined in `package.json`:

```json
{
  "dev": "live-server --port=3000 --open=/index.html",
  "build": "node scripts/build-simple.js",
  "serve": "live-server --port=3000 --no-browser",
  "dev-clean": "node scripts/server.js"
}
```

## ⚙️ Technical Specifications

### Build Process Dependencies
```javascript
// Critical module loading order maintained by build-simple.js
const moduleOrder = [
  'js/core.js',                    // JdrApp namespace
  'js/config/contentTypes.js',     // Configuration
  'js/core/EventBus.js',          // Event system
  'js/core/BaseEntity.js',        // Base entity
  'js/factories/ContentFactory.js', // Factory pattern
  // ... (complete order maintained automatically)
];
```

### CSS Compilation Order
```javascript
const cssOrder = [
  'css/theme.css',        // Variables first
  'css/utilities.css',    // Utilities
  'css/components.css',   // Components
  'css/layout.css',       // Layout
  'css/editor.css'        // Editor styles last
];
```

### Data Embedding Strategy
```javascript
// JSON files converted to global window objects
data/sorts.json     → window.SORTS
data/classes.json   → window.CLASSES  
data/dons.json      → window.DONS
data/objets.json    → window.OBJETS
data/monstres.json  → window.MONSTRES
// ... etc for all data files
```

## 🔧 Development Guidelines

### Adding New Scripts
1. **Create script file** in `/scripts/` directory
2. **Add batch wrapper** if Windows UI needed
3. **Update menu.bat** if user-facing feature
4. **Document in this README** for future reference

### Build Script Modifications
**⚠️ CRITICAL**: When modifying `build-simple.js`:
- **Maintain module order**: Dependency violations cause runtime errors
- **Test thoroughly**: Validate standalone build functionality
- **Check mobile compatibility**: Ensure mobile users can access content
- **Verify data embedding**: All JSON data must be properly converted

### Error Handling Best Practices
- **Clear error messages**: Help users understand what went wrong
- **Graceful fallbacks**: Provide alternative options when possible
- **Safety checks**: Validate inputs and environment before operations
- **Recovery guidance**: Explain how to fix common issues

## 📊 Performance Metrics

### Build Output Statistics
- **HTML Size**: ~500-800KB (complete application)
- **Module Count**: 15+ JavaScript modules combined
- **CSS Files**: 5 stylesheets merged
- **Data Files**: 8+ JSON files embedded
- **Total Assets**: 42+ images referenced
- **Build Time**: ~1-3 seconds on modern hardware

### Development Server Performance
- **Startup Time**: <2 seconds
- **Memory Usage**: <50MB RAM
- **Port**: 3000 (configurable)
- **Hot Reload**: Not enabled (manual refresh required)
- **File Watching**: Static file serving only

This script collection provides a complete development and build environment optimized for Windows workflows while maintaining Node.js compatibility for cross-platform development.