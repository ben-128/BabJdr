// ============================================================================
// JDR-BAB APPLICATION - RESPONSIVE MANAGER MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // RESPONSIVE MANAGER - MOBILE & RESPONSIVE DESIGN
  // ========================================
  window.ResponsiveManager = {

    /**
     * Setup responsive design features
     */
    setupResponsive() {
      this.setupMobileNavigation();
      this.setupLegacyResponsive();
    },

    /**
     * Setup mobile navigation
     */
    setupMobileNavigation() {
      this.createMobileNavToggle();
      this.setupResponsiveBreakpoints();
    },

    /**
     * Create mobile navigation toggle
     */
    createMobileNavToggle() {
      // Use existing toggle or create new one
      let menuToggle = document.querySelector('#menuToggle');
      let isExisting = !!menuToggle;

      if (!menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.id = 'menuToggle';
        menuToggle.className = 'menu-toggle';
        menuToggle.setAttribute('aria-controls', 'sidebar');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Ouvrir le sommaire');
        
        // Insert at the beginning of the shell
        const shell = document.querySelector('.shell');
        if (shell) {
          shell.insertBefore(menuToggle, shell.firstChild);
        }
      }
      
      // Create prettier button with icon and text
      menuToggle.innerHTML = `
        <span class="menu-icon">☰</span>
        <span class="menu-text">Sommaire</span>
      `;
      
      // Add proper styling - fix width and position issues
      menuToggle.style.cssText = `
        position: fixed !important;
        top: 16px !important;
        left: 16px !important;
        z-index: 1000 !important;
        background: var(--primary-color, #8b4513) !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 12px 16px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        width: auto !important;
        max-width: 140px !important;
        min-width: 120px !important;
      `;
      
      // Remove old event listeners to avoid conflicts
      const newMenuToggle = menuToggle.cloneNode(true);
      menuToggle.replaceWith(newMenuToggle);
      menuToggle = newMenuToggle;

      // Add hover effect
      if (menuToggle) {
        menuToggle.addEventListener('mouseenter', () => {
          menuToggle.style.transform = 'scale(1.05)';
          menuToggle.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        });
        
        menuToggle.addEventListener('mouseleave', () => {
          menuToggle.style.transform = 'scale(1)';
          menuToggle.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        });

        // Add toggle functionality
        menuToggle.addEventListener('click', () => {
          this.toggleMobileNav();
        });
      }

      // Create backdrop for mobile
      if (!document.querySelector('#backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.id = 'backdrop';
        backdrop.className = 'backdrop';
        backdrop.style.display = 'none';
        backdrop.addEventListener('click', () => {
          this.toggleMobileNav();
        });
        const shell = document.querySelector('.shell');
        if (shell) {
          shell.appendChild(backdrop);
        } else {
          document.body.appendChild(backdrop);
        }
      }
    },

    /**
     * Toggle mobile navigation
     */
    toggleMobileNav() {
      const sidebar = document.querySelector('#sidebar');
      const menuToggle = document.querySelector('#menuToggle');
      const backdrop = document.querySelector('#backdrop');
      
      if (!sidebar || !menuToggle) return;

      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        // Close mobile nav
        sidebar.classList.remove('mobile-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        if (backdrop) backdrop.style.display = 'none';
        document.body.style.overflow = '';
      } else {
        // Open mobile nav
        sidebar.classList.add('mobile-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        if (backdrop) backdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';
      }
    },

    /**
     * Setup responsive breakpoints
     */
    setupResponsiveBreakpoints() {
      // Handle window resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.handleResize();
        }, 100);
      });

      // Initial setup
      this.handleResize();
    },

    /**
     * Handle window resize
     */
    handleResize() {
      const width = window.innerWidth;
      const sidebar = document.querySelector('#sidebar');
      const menuToggle = document.querySelector('#menuToggle');
      const backdrop = document.querySelector('#backdrop');

      // Check if device is touch-capable
      const isTouchDevice = this.isTouchDevice();
      const isMobileSize = width <= window.UI_CONSTANTS.BREAKPOINTS.MOBILE;
      const isTabletSize = width > window.UI_CONSTANTS.BREAKPOINTS.MOBILE && width <= window.UI_CONSTANTS.BREAKPOINTS.TABLET_LANDSCAPE;
      
      // Show menu toggle on touch devices OR mobile size screens
      const shouldShowToggle = isTouchDevice || isMobileSize;

      if (shouldShowToggle) {
        // Mobile/Touch mode
        if (menuToggle) menuToggle.style.display = 'block';
        if (sidebar) {
          sidebar.classList.remove('desktop-open');
          // Close mobile nav on resize to mobile
          sidebar.classList.remove('mobile-open');
          if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        }
        if (backdrop) backdrop.style.display = 'none';
        document.body.style.overflow = '';
      } else {
        // Desktop mode (non-touch, large screen)
        if (menuToggle) menuToggle.style.display = 'none';
        if (sidebar) {
          sidebar.classList.remove('mobile-open');
          sidebar.classList.add('desktop-open');
        }
        if (backdrop) backdrop.style.display = 'none';
        document.body.style.overflow = '';
      }
    },

    /**
     * Check if device has touch capability
     */
    isTouchDevice() {
      return 'ontouchstart' in window || 
             navigator.maxTouchPoints > 0 || 
             navigator.msMaxTouchPoints > 0 ||
             window.matchMedia('(pointer: coarse)').matches;
    },

    /**
     * Setup legacy responsive features
     */
    setupLegacyResponsive() {
      // Handle orientation changes on mobile
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.handleResize();
        }, 300);
      });

      // Handle touch events for better mobile experience
      this.setupTouchEvents();
    },

    /**
     * Setup touch events for mobile
     */
    setupTouchEvents() {
      let touchStartX = 0;
      let touchStartY = 0;

      // Handle touch start
      document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      // Handle swipe gestures
      document.addEventListener('touchend', (e) => {
        if (!e.changedTouches[0]) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Only handle horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          const sidebar = document.querySelector('#sidebar');
          const menuToggle = document.querySelector('#menuToggle');
          
          if (!sidebar || !menuToggle) return;

          const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
          const isMobile = window.innerWidth <= window.UI_CONSTANTS.BREAKPOINTS.MOBILE;

          if (isMobile) {
            // Swipe right from left edge to open
            if (deltaX > 0 && touchStartX < 50 && !isExpanded) {
              this.toggleMobileNav();
            }
            // Swipe left when sidebar is open to close
            else if (deltaX < 0 && isExpanded) {
              this.toggleMobileNav();
            }
          }
        }
      }, { passive: true });
    },

    /**
     * Check if device is mobile
     */
    isMobileDevice() {
      return window.innerWidth <= window.UI_CONSTANTS.BREAKPOINTS.MOBILE;
    },

    /**
     * Check if device is tablet
     */
    isTabletDevice() {
      const width = window.innerWidth;
      return width > window.UI_CONSTANTS.BREAKPOINTS.MOBILE && 
             width <= window.UI_CONSTANTS.BREAKPOINTS.TABLET;
    },

    /**
     * Get current device type
     */
    getDeviceType() {
      if (this.isMobileDevice()) return 'mobile';
      if (this.isTabletDevice()) return 'tablet';
      return 'desktop';
    },

    /**
     * Apply device-specific optimizations
     */
    applyDeviceOptimizations() {
      const deviceType = this.getDeviceType();
      document.body.setAttribute('data-device-type', deviceType);

      // Add device-specific CSS classes
      document.body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
      document.body.classList.add(`device-${deviceType}`);

      // Apply device-specific optimizations
      switch (deviceType) {
        case 'mobile':
          this.applyMobileOptimizations();
          break;
        case 'tablet':
          this.applyTabletOptimizations();
          break;
        case 'desktop':
          this.applyDesktopOptimizations();
          break;
      }
    },

    /**
     * Apply mobile-specific optimizations
     */
    applyMobileOptimizations() {
      // Reduce animations for better performance
      document.body.classList.add('reduced-motion');
      
      // Optimize scroll behavior
      if (window.ScrollOptimizer) {
        ScrollOptimizer.enableMobileOptimizations();
      }
    },

    /**
     * Apply tablet-specific optimizations
     */
    applyTabletOptimizations() {
      // Tablet-specific optimizations
      document.body.classList.remove('reduced-motion');
    },

    /**
     * Apply desktop-specific optimizations
     */
    applyDesktopOptimizations() {
      // Desktop-specific optimizations
      document.body.classList.remove('reduced-motion');
    }
  };

})();