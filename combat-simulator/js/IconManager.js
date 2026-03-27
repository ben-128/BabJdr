/**
 * IconManager.js
 * Gestion des icones pour le simulateur de combat
 */

class IconManager {
  constructor() {
    this.imagesData = null;
    this.monstersData = null;
    this.objetsData = null;
    this.elementUrls = null;
    this.loaded = false;
  }

  async init(data) {
    // Utiliser les donnees deja chargees
    this.monstersData = data.monstresData;
    this.objetsData = data.objetsData;

    // URLs des elements (toujours disponibles)
    this.elementUrls = {
      'Feu': '../data/images/Elements/Feu.png',
      'Eau': '../data/images/Elements/Eau.png',
      'Terre': '../data/images/Elements/Terre.png',
      'Air': '../data/images/Elements/Air.png',
      'Lumiere': '../data/images/Elements/Lumière.png',
      'Lumière': '../data/images/Elements/Lumière.png',
      'Nuit': '../data/images/Elements/Nuit.png',
      'Divin': '../data/images/Elements/Divin.png',
      'Malefique': '../data/images/Elements/Maléfique.png',
      'Maléfique': '../data/images/Elements/Maléfique.png'
    };

    try {
      // Charger images.json
      const imagesRes = await DataLoader.loadJSON('../data/images.json');
      this.imagesData = imagesRes.images || {};
      console.log('IconManager: images.json charge avec', Object.keys(this.imagesData).length, 'icones');
    } catch (error) {
      console.warn('IconManager: images.json non charge, utilisation des fallbacks', error);
      this.imagesData = {};
    }

    this.loaded = true;
    console.log('IconManager initialise');
  }

  // Obtenir l'icone d'une sous-classe
  getSubclassIcon(className, subClassName) {
    // Icone par defaut selon la classe
    const defaultIcons = {
      'Guerrier': '../data/images/Classes/Aventurier.png',
      'Mage': '../data/images/Classes/Mage.png',
      'Pretre': '../data/images/Classes/Prêtre.png',
      'Prêtre': '../data/images/Classes/Prêtre.png',
      'Rodeur': '../data/images/Classes/Voleur-min.png',
      'Rôdeur': '../data/images/Classes/Voleur-min.png',
      'Enchanteur': '../data/images/Classes/Lutin.png'
    };

    if (!this.imagesData) {
      return defaultIcons[className] || defaultIcons['Guerrier'];
    }

    // Essayer avec le format exact
    const key1 = `subclass:${className}:${subClassName}:1`;
    if (this.imagesData[key1]) {
      return this.imagesData[key1];
    }

    // Essayer avec des variations d'accents
    for (const key of Object.keys(this.imagesData)) {
      if (key.startsWith('subclass:') && key.includes(subClassName)) {
        return this.imagesData[key];
      }
    }

    return defaultIcons[className] || defaultIcons['Guerrier'];
  }

  // Obtenir l'icone d'un monstre
  getMonsterIcon(monsterName) {
    // Chercher dans monstres.json
    if (this.monstersData) {
      const monster = this.monstersData.find(m => m.nom === monsterName);
      if (monster && monster.image) {
        // Convertir le chemin relatif
        return '../' + monster.image;
      }
    }

    // Chercher dans images.json
    if (this.imagesData) {
      for (const key of Object.keys(this.imagesData)) {
        if (key.startsWith('monster:') && key.toLowerCase().includes(monsterName.toLowerCase())) {
          return this.imagesData[key];
        }
      }
    }

    // Pas d'icone par defaut pour les monstres (evite les erreurs 404)
    return null;
  }

  // Obtenir l'icone d'un sort
  getSpellIcon(spellName, category = null) {
    if (!this.imagesData || !spellName) return null;

    // Chercher avec la categorie
    if (category) {
      const key = `sort:${category}:${spellName}`;
      if (this.imagesData[key]) {
        return this.imagesData[key];
      }
    }

    // Chercher par nom uniquement
    for (const key of Object.keys(this.imagesData)) {
      if (key.startsWith('sort:') && key.endsWith(':' + spellName)) {
        return this.imagesData[key];
      }
    }

    // Chercher avec correspondance partielle
    const normalizedName = spellName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const key of Object.keys(this.imagesData)) {
      if (key.startsWith('sort:')) {
        const keyName = key.split(':').pop().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (keyName === normalizedName || keyName.includes(normalizedName)) {
          return this.imagesData[key];
        }
      }
    }

    return null;
  }

  // Obtenir l'icone d'un objet/arme
  getItemIcon(itemName) {
    if (!itemName) return null;

    // Chercher dans objets.json
    if (this.objetsData) {
      const item = this.objetsData.find(o => o.nom === itemName);
      if (item && item.image) {
        return item.image;
      }
    }

    // Chercher dans images.json
    if (this.imagesData) {
      for (const key of Object.keys(this.imagesData)) {
        if (key.startsWith('objet:') && key.toLowerCase().includes(itemName.toLowerCase())) {
          return this.imagesData[key];
        }
      }
    }

    return null;
  }

  // Obtenir l'icone d'un element
  getElementIcon(element) {
    if (!this.elementUrls || !element) return null;
    return this.elementUrls[element] || null;
  }

  // Creer un element img HTML
  createIconElement(url, alt = '', size = 24) {
    if (!url) return '';
    return `<img src="${url}" alt="${alt}" class="combat-icon" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:4px;vertical-align:middle;">`;
  }

  // Creer une icone avec fallback
  createIconWithFallback(url, alt = '', size = 24) {
    if (!url) return `<span class="icon-placeholder" style="display:inline-block;width:${size}px;height:${size}px;background:#333;border-radius:4px;"></span>`;
    return `<img src="${url}" alt="${alt}" class="combat-icon" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:4px;vertical-align:middle;" onerror="this.style.display='none'">`;
  }
}

window.IconManager = IconManager;
