// ============================================================================
// DEVICE DETECTION UTILITIES
// ============================================================================

(() => {
  "use strict";

  window.DeviceDetection = {
    
    // Detect if device is a tablet based on multiple factors
    isTablet() {
      const userAgent = navigator.userAgent.toLowerCase();
      const screen = window.screen;
      const width = Math.max(screen.width, screen.height);
      const height = Math.min(screen.width, screen.height);
      
      // Check user agent for tablet indicators
      const tabletUA = /ipad|android(?!.*mobile)|tablet|kindle|playbook|nook|silk/i.test(userAgent);
      
      // Check for coarse pointer (touch) and tablet-like dimensions
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const tabletDimensions = (width >= 768 && width <= 1366) && (height >= 600);
      
      // iPad specific check
      const isIPad = /ipad/i.test(userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Android tablet check (excludes phones)
      const isAndroidTablet = /android/i.test(userAgent) && !/mobile/i.test(userAgent);
      
      return tabletUA || isIPad || isAndroidTablet || (hasCoarsePointer && tabletDimensions);
    },

    // Detect mobile phones specifically
    isMobile() {
      const userAgent = navigator.userAgent.toLowerCase();
      return /mobile|iphone|ipod|android.*mobile|blackberry|windows.*phone/i.test(userAgent);
    },

    // Check if device has touch capability
    isTouchDevice() {
      return 'ontouchstart' in window || 
             navigator.maxTouchPoints > 0 || 
             navigator.msMaxTouchPoints > 0;
    },

    // Check screen orientation
    isPortrait() {
      return window.innerHeight > window.innerWidth;
    },

    // Check if device should use mobile navigation
    shouldUseMobileNav() {
      const isSmallScreen = window.innerWidth <= 1024;
      const isTabletDevice = this.isTablet();
      const isMobileDevice = this.isMobile();
      
      return isMobileDevice || (isTabletDevice && isSmallScreen) || 
             (this.isTouchDevice() && isSmallScreen);
    },

    // Get device type as string
    getDeviceType() {
      if (this.isMobile()) return 'mobile';
      if (this.isTablet()) return 'tablet';
      return 'desktop';
    },

    // Check if should auto-close sidebar after navigation
    shouldAutoCloseSidebar() {
      return this.shouldUseMobileNav();
    }
  };

})();