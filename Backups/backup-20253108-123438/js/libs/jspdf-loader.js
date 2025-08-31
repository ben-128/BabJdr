// ============================================================================
// JSPDF LOADER - Character Sheet PDF Generation Support
// ============================================================================

(() => {
  "use strict";

  // Check if jsPDF is already loaded
  if (window.jsPDF) {
    console.log('📋 jsPDF already loaded');
    return;
  }

  // For standalone builds, we need to handle jsPDF loading
  const loadJsPDF = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        console.log('📋 jsPDF loaded successfully');
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
    console.log('📋 Loading jsPDF for character sheet functionality...');
    loadJsPDF().catch(() => {
      console.warn('⚠️ jsPDF could not be loaded. PDF generation will not be available.');
    });
  }

})();