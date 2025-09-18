# Tooling

Helper utilities intended for local development on Windows.

## Files
- `menu.bat` - interactive launcher that wraps the main scripts (development server, build, archive import, backup cleanup). Run it from the repository root or double-click it in Explorer.

## Snippets
- `snippets/clear-cache.js` - clears `localStorage` and `sessionStorage`, then forces a hard reload. Load it in DevTools via `Sources > Snippets` or paste the contents into the console when caches misbehave.
- `snippets/check_storage.js` - dumps the `jdr-bab-edits` payload from `localStorage` to help debug saved changes.

Add new helpers here when they are Windows-specific or when they act as wrappers around commands documented in `scripts/`.
