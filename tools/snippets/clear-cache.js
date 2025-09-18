// Simple cache-busting script
// Add this to force browser to reload fresh versions
(function() {
  'use strict';
  
  // Clear localStorage
  try {
    localStorage.clear();
    console.log('LocalStorage cleared');
  } catch(e) {
    console.warn('Could not clear localStorage:', e);
  }
  
  // Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('SessionStorage cleared');
  } catch(e) {
    console.warn('Could not clear sessionStorage:', e);
  }
  
  // Force reload with cache bypass
  window.location.reload(true);
})();