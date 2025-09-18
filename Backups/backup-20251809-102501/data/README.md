# Data Directory Guide

All playable content for JDR-BAB lives here: JSON datasets, supporting media, and helper scripts.

## Key Files
- `classes.json`, `sorts.json`, `dons.json`, `objets.json`, `monstres.json` - core rule content used by the editor and renderer.
- `tables-tresors.json` and `tables-tresors-page-desc.json` - treasure table definitions and their page metadata.
- `audio.json` and `audio-config.json` - playlist structure, playback rules, and UI configuration.
- `static-pages-config.json`, `custom-page-descriptions.json`, `toc-structure.json` - static page definitions and navigation ordering.
- `images.json` - map of logical image identifiers to files stored under `data/images/`.

## Asset Folders
- `images/` - art assets grouped by category (`Classes/`, `Sorts/`, `Objets/`, `Monstres/`). Reference them via the keys defined in `images.json`.
- `Musiques/` - MP3 libraries for each ambience category plus playlist utilities (`update-playlists.js`, batch file wrapper).

## Editing Guidelines
- Keep JSON formatted with two-space indentation and UTF-8 without BOM; prefer ASCII characters in text strings unless the content intentionally includes accents.
- Store rich descriptions as HTML strings (paragraphs, lists, emphasis). Arrays or nested objects should only be used when the consuming code already expects them.
- When adding a new content type, update `js/config/contentTypes.js`, provide the matching data file here, and verify the build via `npm run build`.
- After modifying image or audio folders, refresh `images.json` or regenerate playlists with `node data/Musiques/update-playlists.js` so the runtime configuration stays in sync.

## Validation
- For quick checks, launch the app with `npm run dev` and confirm the affected items load, render, and remain editable.
- Before shipping large data changes, build the standalone bundle and open `build-output/JdrBab.html` offline to make sure all assets resolve correctly.
