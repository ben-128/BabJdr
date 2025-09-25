// ============================================================================
// DYNAMIC CENTERING SYSTEM
// ============================================================================

(() => {
  "use strict";

  class DynamicCentering {
    constructor() {
      this.sidebarWidth = 350; // Width of the sidebar
      this.isEnabled = false;
      this.observer = null;
      this.rafId = null;
    }

    init() {
      this.isEnabled = true;
      this.setupResizeObserver();
      this.setupWindowResize();
      // Initial calculation
      this.updateCentering();
    }

    setupResizeObserver() {
      if (!window.ResizeObserver) return;

      // Observe changes to the main content container
      const viewsContainer = document.getElementById('views');
      if (!viewsContainer) return;

      this.observer = new ResizeObserver(() => {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
        }
        this.rafId = requestAnimationFrame(() => this.updateCentering());
      });

      this.observer.observe(viewsContainer);
    }

    setupWindowResize() {
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.updateCentering(), 100);
      });
    }

    updateCentering() {
      if (!this.isEnabled) return;

      const viewsContainer = document.getElementById('views');
      if (!viewsContainer) return;

      const viewportWidth = window.innerWidth;

      // Use CSS media queries for robust device detection (same as CSS breakpoints)
      const isMobileBreakpoint = window.matchMedia('(max-width: 980px)').matches;
      const isTabletBreakpoint = window.matchMedia('(max-width: 1024px)').matches;
      const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const isTouchOnly = window.matchMedia('(hover: none)').matches;
      
      // Check if sidebar is actually visible/active
      const sidebar = document.querySelector('.sidebar');
      const isSidebarVisible = sidebar && !sidebar.classList.contains('mobile-open') && 
                              window.getComputedStyle(sidebar).position === 'fixed' &&
                              viewportWidth > 1024; // Sidebar only shows above 1024px (desktop only)
      
      // Disable dynamic centering if:
      // 1. CSS mobile breakpoint is active (matches our responsive CSS) OR
      // 2. CSS tablet breakpoint is active (force full width on tablet) OR
      // 3. Device has coarse pointer (touch-first device) OR  
      // 4. Device can't hover (mobile/touch-only) OR
      // 5. Sidebar is not visible
      if (isMobileBreakpoint || isTabletBreakpoint || isCoarsePointer || isTouchOnly || !isSidebarVisible) {
        // Reset to CSS responsive behavior - force full width on tablet/mobile
        viewsContainer.style.marginLeft = '';
        viewsContainer.style.marginRight = '';
        return;
      }

      // Get actual container dimensions
      const containerRect = viewsContainer.getBoundingClientRect();
      const actualContentWidth = containerRect.width;

      // Calculate available space after sidebar
      const availableSpace = viewportWidth - this.sidebarWidth;
      
      // Calculate optimal margin to center content in available space
      const optimalMarginLeft = this.sidebarWidth + (availableSpace - actualContentWidth) / 2;

      // Apply the centering with bounds checking
      const minMarginLeft = this.sidebarWidth + 20; // Minimum clearance
      const maxMarginLeft = viewportWidth - actualContentWidth - 20; // Don't overflow right
      
      const finalMarginLeft = Math.max(minMarginLeft, Math.min(optimalMarginLeft, maxMarginLeft));

      // Apply the calculated margin
      viewsContainer.style.marginLeft = `${finalMarginLeft}px`;
      viewsContainer.style.marginRight = '20px';

      // Debug info (remove in production)
      if (window.location.hash.includes('debug-centering')) {
        console.log('🎯 Dynamic Centering:', {
          viewportWidth,
          availableSpace,
          actualContentWidth,
          optimalMarginLeft,
          finalMarginLeft
        });
      }
    }

    disable() {
      this.isEnabled = false;
      if (this.observer) {
        this.observer.disconnect();
      }
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
      
      // Reset to CSS default
      const viewsContainer = document.getElementById('views');
      if (viewsContainer) {
        viewsContainer.style.marginLeft = '';
        viewsContainer.style.marginRight = '';
      }
    }
  }

  // Initialize the dynamic centering system
  const dynamicCentering = new DynamicCentering();

  // Attach to JdrApp
  if (window.JdrApp) {
    JdrApp.modules.dynamicCentering = dynamicCentering;
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Delay initialization to ensure layout is stable
      setTimeout(() => dynamicCentering.init(), 500);
    });
  } else {
    setTimeout(() => dynamicCentering.init(), 500);
  }

  // Make it globally available for debugging
  window.DynamicCentering = dynamicCentering;

})();