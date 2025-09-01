// ============================================================================
// JSPDF LOADER - Character Sheet PDF Generation Support
// ============================================================================

(() => {
  "use strict";

  // Check if jsPDF is already loaded
  if (window.jsPDF) {
    return;
  }

  // For standalone builds, we need to handle jsPDF loading
  const loadJsPDF = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load jsPDF');
        reject();
      };
      document.head.appendChild(script);
    });
  };

  // Load jsPDF if not available
  if (typeof window.jsPDF === 'undefined') {
    loadJsPDF().catch(() => {
      // Silent fallback - PDF generation will not be available
    });
  }

})();