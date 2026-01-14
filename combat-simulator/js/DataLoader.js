/**
 * DataLoader.js
 * Charge les donnees JSON de maniere compatible avec file://
 */

class DataLoader {
  static async loadJSON(path) {
    // Essayer fetch d'abord (fonctionne avec serveur local)
    try {
      const response = await fetch(path);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.log(`Fetch failed for ${path}, trying XMLHttpRequest...`);
    }

    // Fallback avec XMLHttpRequest (peut fonctionner avec file://)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', path, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 0) { // 0 pour file://
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP error: ${xhr.status}`));
          }
        }
      };
      xhr.onerror = function() {
        reject(new Error('XMLHttpRequest failed'));
      };
      xhr.send();
    });
  }

  static async loadAllData() {
    const basePath = '../data/';

    try {
      const [classesData, donsData, sortsData, objetsRaw, monstresData] = await Promise.all([
        this.loadJSON(basePath + 'classes.json'),
        this.loadJSON(basePath + 'dons.json'),
        this.loadJSON(basePath + 'sorts.json'),
        this.loadJSON(basePath + 'objets.json'),
        this.loadJSON(basePath + 'monstres.json')
      ]);

      return {
        classesData,
        donsData,
        sortsData,
        objetsData: objetsRaw.objets,
        monstresData
      };
    } catch (error) {
      console.error('DataLoader error:', error);
      throw error;
    }
  }
}

window.DataLoader = DataLoader;
