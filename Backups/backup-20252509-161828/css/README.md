# CSS Architecture

This directory contains the modular CSS architecture for the JDR-BAB application, designed with a medieval-fantasy aesthetic and full responsive support.

## 📁 CSS Module Structure

### Core Styling Foundation
- **`theme.css`** - CSS variables, color palette, typography, and theming system
- **`utilities.css`** - Utility classes for spacing, alignment, visibility, and common patterns
- **`layout.css`** - Grid systems, responsive design, and page layout structures
- **`components.css`** - UI components (cards, buttons, images, modals)
- **`editor.css`** - Development mode interface and editing tools

## 🎨 Design System

### Color Palette (Medieval Parchment Theme)
```css
/* Primary Colors */
--parchment-light: #f4f1e8;      /* Background base */
--parchment-dark: #e8e0d0;       /* Content backgrounds */
--bronze-gold: #cd7f32;          /* Accent color */
--dark-bronze: #8b5a2b;          /* Hover states */
--text-dark: #2c1810;            /* Primary text */
--text-medium: #5d4037;          /* Secondary text */

/* Status Colors */
--success-green: #4caf50;
--warning-amber: #ff9800;
--error-red: #f44336;
--info-blue: #2196f3;
```

### Typography System
```css
/* Font Families */
--font-heading: 'Cinzel', serif;           /* Medieval-style headings */
--font-body: 'Source Serif Pro', serif;    /* Readable body text */
--font-ui: 'Inter', sans-serif;           /* UI elements */

/* Font Scale */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
--text-3xl: 1.875rem; /* 30px */
```

### Spacing System
```css
/* Consistent spacing scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

## 🏗️ Component Architecture

### Card System (`components.css`)
```css
.card                   /* Base card styling */
.card-spell            /* Spell-specific card enhancements */
.card-class            /* Character class cards */
.card-monster          /* Monster stat blocks */
.card-equipment        /* Equipment item cards */
```

### Image Management
```css
.image-container       /* Responsive image containers */
.dual-image           /* Subclass dual-image layout */
.spell-icon           /* Spell icon sizing (350×250px max) */
.class-portrait       /* Character portrait sizing */
.monster-image        /* Monster gallery images */
```

### Interactive Elements
```css
.btn                  /* Base button styling */
.btn-primary         /* Primary action buttons */
.btn-secondary       /* Secondary action buttons */
.btn-edit           /* Edit mode buttons (✏️) */
.btn-danger         /* Destructive actions */
```

### Navigation Components
```css
.nav-main           /* Primary navigation */
.nav-breadcrumb     /* Breadcrumb navigation */
.nav-sidebar        /* Sidebar navigation */
.nav-mobile         /* Mobile navigation overlay */
```

## 📱 Responsive Design System

### Breakpoint Strategy
```css
/* Mobile First Approach */
/* Default: 320px+ (mobile) */

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}

@media (min-width: 1200px) {
  /* Large desktop styles */
}
```

### Mobile Optimization
- **Touch-friendly**: Minimum 44px touch targets
- **Readable text**: 16px+ base font size
- **Thumb navigation**: Bottom-aligned primary actions
- **Swipe gestures**: Horizontal scrolling for cards
- **Viewport optimization**: Proper meta viewport settings

### Layout Patterns
```css
.container            /* Main content container with max-width */
.grid-2               /* 2-column responsive grid */
.grid-3               /* 3-column responsive grid */
.flex-center          /* Flexbox centering utility */
.stack                /* Vertical stacking with consistent spacing */
```

## ⚙️ Development Mode Styling

### Editor Interface (`editor.css`)
```css
.dev-mode             /* Development mode container */
.edit-button          /* ✏️ edit buttons */
.edit-overlay         /* Editing interface overlay */
.edit-form            /* Form styling for content editing */
.dev-toggle           /* Mode switch button */
```

### Visual Feedback
```css
.editable             /* Editable content highlighting */
.editing              /* Active editing state */
.modified             /* Content modified indicator */
.saved                /* Save confirmation styling */
```

## 🎭 Theme Customization

### CSS Custom Properties (Variables)
All theming uses CSS custom properties for easy customization:

```css
:root {
  /* Override any theme variable */
  --primary-color: #your-color;
  --border-radius: 8px;
  --shadow-elevation: 0 2px 8px rgba(0,0,0,0.1);
}
```

### Dark Mode Support
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Automatic dark mode variables */
    --bg-primary: #1a1a1a;
    --text-primary: #e0e0e0;
  }
}
```

## 🏷️ Utility Classes

### Spacing Utilities
```css
.p-{size}             /* Padding (1-12) */
.m-{size}             /* Margin (1-12) */
.mt-{size}            /* Margin top */
.mb-{size}            /* Margin bottom */
.ml-{size}            /* Margin left */
.mr-{size}            /* Margin right */
```

### Display Utilities
```css
.hidden               /* Display: none */
.block                /* Display: block */
.flex                 /* Display: flex */
.grid                 /* Display: grid */
.inline-block         /* Display: inline-block */
```

### Text Utilities
```css
.text-center          /* Text alignment */
.text-left            
.text-right           
.font-bold            /* Font weight */
.font-semibold        
.text-sm              /* Font size utilities */
.text-lg              
.text-xl              
```

## 🎯 Performance Optimization

### CSS Organization
- **Modular structure**: Separate concerns for maintainability
- **Minimal duplication**: Shared variables and utilities
- **Efficient selectors**: Avoid deep nesting and overly specific selectors
- **Mobile-first**: Progressive enhancement for larger screens

### Loading Strategy
- **Critical CSS**: Above-the-fold styles inlined in HTML
- **Progressive loading**: Non-critical styles loaded asynchronously
- **Bundle optimization**: Build process combines and minifies CSS

### Animation Performance
```css
/* Hardware acceleration for smooth animations */
.animated {
  will-change: transform;
  transform: translateZ(0);
}

/* Prefer transform and opacity for animations */
.fade-in {
  transition: opacity 0.3s ease-in-out;
}
```

## 🔍 Development Guidelines

### CSS Methodology
- **BEM-like naming**: `.component__element--modifier`
- **Utility-first**: Use utility classes for common patterns
- **Component-based**: Each component has its own styling scope
- **Mobile-first**: Start with mobile styles, enhance for larger screens

### Browser Support
- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Progressive enhancement**: Graceful degradation for older browsers
- **CSS Grid**: Used with fallbacks for older browser support
- **Custom properties**: Used with fallbacks where needed

### Maintenance Best Practices
- **Consistent naming**: Follow established patterns
- **Documentation**: Comment complex calculations and magic numbers
- **Variables**: Use CSS custom properties for all theme values
- **Testing**: Verify responsive behavior across devices

This modular CSS architecture supports the application's medieval-fantasy aesthetic while providing modern, accessible, and responsive user experience across all devices.