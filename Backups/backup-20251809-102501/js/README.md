# JavaScript Architecture Guide

The JavaScript layer is organised into focused directories that keep configuration, data access, rendering, and UI responsibilities separate. Every module is wrapped in an IIFE and usually exposes a single object on `window` so the build pipeline can concatenate files in a predictable order.

## Directory Map
- `config/` - global constants and the `contentTypes` schema that defines every editable entity (fields, defaults, icons, render hints).
- `core/` - foundational abstractions shared across the app (`EventBus`, `BaseEntity`, `UnifiedEditor`).
- `builders/` - HTML builders that transform data into cards and pages without hardcoding per-type markup.
- `factories/` - data factories that manage CRUD operations and create typed entities based on the configuration layer.
- `modules/` - cross-cutting helpers such as asset loading (`images.js`) and soundtrack control (`audio.js`).
- `features/` - standalone gameplay helpers (treasure tables, spell filtering, favourites, scroll optimisation, etc.).
- `ui/` - modularised pieces of the old `ui.js` monolith: modal handling, responsive state, search, tags, page management, and table filters.
- `utils/` - low-level helpers (for example `device-detection.js`).
- Root files (`core.js`, `renderer.js`, `editor.js`, `storage.js`, `router.js`, `ui.js`) wire everything together and provide backwards compatibility for older build scripts.

## Initialisation Flow
1. Constants and content types are loaded first so downstream modules know about the available entities.
2. Core services, factories, and builders register themselves on `window` (for example `window.EventBus`).
3. Feature and UI modules subscribe to `EventBus` events via `UICore.init()`.
4. `core.js` sets up the `JdrApp` namespace and bootstraps the renderer from `dev-debug.html` and `index.html`.

## Conventions
- Use two-space indentation, `const` or `let`, and strict mode.
- Prefer emitting events rather than calling other modules directly; most UI actions travel through `EventBus`.
- When adding a new content type, update `js/config/contentTypes.js`, ensure the data file exists in `data/`, and confirm the builders render it correctly in both dev and build outputs.
- Keep new files within the relevant directory and export them via the same `window.ModuleName` pattern used by existing code.
