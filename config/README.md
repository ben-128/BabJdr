# Configuration Files

The configuration bundle exposes the metadata required for Progressive Web App behaviour and cross-platform integration.

- `manifest.json` - declares icons, display mode, theme colours, and start URL. Update it whenever icon filenames or colour values change.
- `sw.js` - custom service worker responsible for caching the standalone bundle, data files, and media. Adjust the asset list when adding new top-level resources.
- `browserconfig.xml` - fallback description for Windows tiles and pinned tabs.

After editing these files, run `npm run build` followed by `npm run pwa-test` to verify installability and offline behaviour.
