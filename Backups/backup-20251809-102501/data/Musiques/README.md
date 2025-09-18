# Music Library

Ambient soundtracks are organised per mood so the UI can build playlists automatically.

## Folder Layout
- `Auberge/`, `Creation/`, `Foret/`, `Mine/`, `Voyage/`, `Autre/` - top-level categories shown in the app.
- Nested folders (for example `Foret/BossForet/`) become nested playlists while preserving the parent category label.
- Only MP3 files are loaded; other extensions are ignored by the scanner.

## Updating Playlists
1. Add or remove MP3 files in the desired folder.
2. Run `node data/Musiques/update-playlists.js` from the repository root (or double-click `update-playlists.bat` on Windows).
3. Copy the generated JSON snippet from the console and update the relevant sections in `data/audio.json` if prompted.
4. Launch `npm run dev` and confirm the playlists appear and play as expected.

## Conventions
- Use descriptive filenames without spaces, e.g. `Boss_Mine_02.mp3`.
- Keep volume-balanced masters to avoid dramatic jumps between tracks.
- Large files increase load time; prefer looping tracks under 10 MB where possible.

Changes here should always be paired with a quick run of `npm run build` to ensure the standalone bundle embeds the updated audio references.
