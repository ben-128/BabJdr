# CSS Overview

The CSS bundle is split into focused files so that theming, layout, and editor-specific rules remain easy to maintain.

## Files
- `theme.css` - defines CSS custom properties, colour palette, typography, and base body styles.
- `utilities.css` - utility classes for spacing, text alignment, display helpers, and visibility toggles.
- `layout.css` - structural rules for the navigation, content panels, responsive grids, and breakpoints.
- `components.css` - styling for cards, buttons, modals, and reusable UI elements.
- `editor.css` - additional styles shown when the in-app editor or developer toolbox is active.
- `scroll-optimizations.css` - scroll snapping, smooth scrolling, and performance tweaks for long lists.

## Design Principles
- Mobile first: start with narrow viewports and progressively enhance for widths above 768px and 1024px.
- Utility classes keep one-off overrides out of component files; prefer combining utilities to writing new selectors.
- Use the variables declared in `theme.css` for colours, spacing, and font sizes so the parchment theme stays consistent.

## Adding Styles
1. Identify the correct file: layout changes go in `layout.css`, shared component tweaks in `components.css`, etc.
2. Follow the existing two-space indentation and comment style.
3. When introducing a new component, document its expected markup near the selector or in the relevant README (for example `js/README.md`).
4. Test on mobile widths and with the dev toolbar open to ensure the interface remains scrollable and touch-friendly.

The build process concatenates these files into the standalone HTML bundle; no extra configuration is required after editing.
