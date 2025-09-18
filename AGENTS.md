# Repository Guidelines

## Project Structure & Module Organization
- `dev-debug.html` hosts the modular development shell; `index.html` remains the lightweight landing page consumed by GitHub Pages.
- Modular JavaScript lives in `js/`, split into `core/`, `ui/`, `modules/`, `builders/`, and `features/`; keep new managers in their scoped directory and expose them on `window` like existing modules.
- Styling is in `css/` with component-specific files; global assets and audio stay in `assets/` and gameplay JSON in `data/`.
- Build artifacts belong in `build-output/`; configuration and service worker assets sit in `config/`; reusable automation scripts live under `scripts/` and Windows helpers in `tools/`.
- Long-form documentation for agents is under `docs/`; sync any new contributor notes there after updating this guide.

## Build, Test, and Development Commands
- `npm install` prepares local dependencies (Node 14+).
- `npm run dev` launches `live-server` on port 3000 and opens `index.html`; use `npm run serve` when you only need the server.
- `npm run dev-clean` starts `scripts/server.js` for a quieter development server.
- `npm run build` (or `node scripts/build-simple.js`) produces `build-output/JdrBab.html` from the modular sources.
- `npm run pwa-test` serves the build over HTTPS for service-worker checks; `node scripts/generate-pwa-icons.js` refreshes manifest icons.

## Coding Style & Naming Conventions
- Use two-space indentation, strict mode IIFEs, and `const`/`let`; mirror the header banner comments already present.
- Expose shared modules as `window.SomeManager` and keep methods in `camelCase`; only use `PascalCase` for constructors or manager singletons.
- Keep data schemas consistent with existing JSON shape (for example, tags arrays and localized strings); run `scripts/clean-backups.bat` before committing archival data updates.
- Linting is manual; review diffs carefully and favor small, incremental patches.

## Testing Guidelines
- There is no automated suite; manually validate new work.
- After UI changes, load `dev-debug.html` via `npm run dev` and exercise responsive breakpoints.
- For release validation, run `npm run build`, open `build-output/JdrBab.html`, and verify offline caching plus search and filter flows.
- When touching PWA assets, run `npm run pwa-test` and check the browser console for service-worker warnings before opening a PR.

## Commit & Pull Request Guidelines
- Follow the git log style: emoji shorthand such as :bug:, :art:, or :broom: plus an imperative summary under 72 characters; prefer French phrasing when continuing an existing series.
- Reference related issues or tasks in the body, list the commands you ran, and attach screenshots or GIFs for UI-facing changes.
- PRs should describe scope, risks, and manual test results; request review from the maintainer who last touched the affected module whenever possible.
