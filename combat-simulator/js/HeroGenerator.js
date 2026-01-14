/**
 * HeroGenerator.js
 * Generateur de heros utilisant CharacterCreator
 */

class HeroGenerator {
  constructor() {
    this.characterCreator = null;
    this.classesData = null;
    this.donsData = null;
    this.sortsData = null;
    this.objetsData = null;
    this.loaded = false;
  }

  // Initialiser avec des donnees pre-chargees
  initWithData(data) {
    this.classesData = data.classesData;
    this.donsData = data.donsData;
    this.sortsData = data.sortsData;
    this.objetsData = data.objetsData;

    // Initialiser CharacterCreator
    this.characterCreator = new CharacterCreator();
    this.characterCreator.classesData = this.classesData;
    this.characterCreator.donsData = this.donsData;
    this.characterCreator.sortsData = this.sortsData;
    this.characterCreator.objetsData = this.objetsData;

    this.loaded = true;
    console.log('HeroGenerator initialise');
  }

  async init() {
    try {
      // Charger les donnees JSON via DataLoader
      const data = await DataLoader.loadAllData();
      this.initWithData(data);
    } catch (error) {
      console.error('Error loading HeroGenerator data:', error);
    }
  }

  // Obtenir toutes les classes disponibles
  getAvailableClasses() {
    if (!this.classesData) return [];
    return this.classesData.map(c => ({
      nom: c.nom,
      sousClasses: c.sousClasses.map(sc => sc.nom)
    }));
  }

  // Obtenir les sorts disponibles pour une classe
  getSpellsForClass(className, level) {
    if (!this.sortsData) return [];

    // Normaliser le nom de classe
    const normalizedClass = className.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Trouver la categorie correspondante
    let category = null;

    for (const cat of this.sortsData) {
      const catNameNormalized = cat.nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      if (normalizedClass === 'mage' && catNameNormalized.includes('mage')) {
        category = cat;
        break;
      }
      if (normalizedClass === 'pretre' && catNameNormalized.includes('pretre')) {
        category = cat;
        break;
      }
      if (normalizedClass === 'enchanteur' && catNameNormalized.includes('enchanteur')) {
        category = cat;
        break;
      }
    }

    if (!category) {
      console.log(`Pas de sorts trouves pour la classe: ${className}`);
      return [];
    }

    console.log(`Sorts trouves pour ${className}: ${category.sorts.length} sorts dans ${category.nom}`);

    // Filtrer par niveau et ajouter la categorie
    return category.sorts
      .filter(spell => {
        const prereq = spell.prerequis || '';
        const levelMatch = prereq.match(/Niveau\s*(\d+)/i);
        const requiredLevel = levelMatch ? parseInt(levelMatch[1]) : 1;
        return requiredLevel <= level;
      })
      .map(spell => ({
        ...spell,
        category: category.nom // Ajouter la categorie pour les icones
      }));
  }

  // Obtenir l'equipement de depart recommande pour une classe
  getStartingEquipment(className, budget = 120) {
    if (!this.objetsData) return [];

    const equipment = [];
    let remaining = budget;

    // Normaliser le nom de classe
    const normalizedClass = className.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Armes par classe
    const classWeapons = {
      'guerrier': ['Espadon', 'Simple epee', 'Bouclier en bois'],
      'mage': ['Baton en bois', 'Petite orbe de mana'],
      'pretre': ['Baton en bois', 'Bouclier en bois'],
      'rodeur': ['Dague en fer', 'Arc simple'],
      'enchanteur': ['Baton en bois', 'Petite orbe de mana']
    };

    const armors = {
      'guerrier': 'Armure en maille',
      'mage': 'Robe simple',
      'pretre': 'Robe simple',
      'rodeur': 'Armure de cuir',
      'enchanteur': 'Robe simple'
    };

    // Chercher les armes
    const weapons = classWeapons[normalizedClass] || ['Dague en fer'];
    for (const weaponName of weapons) {
      const weapon = this.objetsData.find(o =>
        o.nom.toLowerCase().includes(weaponName.toLowerCase())
      );
      if (weapon) {
        const price = this.extractPrice(weapon.prix);
        if (price <= remaining) {
          equipment.push(weapon);
          remaining -= price;
        }
      }
    }

    // Chercher l'armure
    const armorName = armors[normalizedClass];
    if (armorName) {
      const armor = this.objetsData.find(o =>
        o.nom.toLowerCase().includes(armorName.toLowerCase())
      );
      if (armor) {
        const price = this.extractPrice(armor.prix);
        if (price <= remaining) {
          equipment.push(armor);
          remaining -= price;
        }
      }
    }

    return equipment;
  }

  extractPrice(priceStr) {
    if (!priceStr) return 0;
    const match = priceStr.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // Generer des dons appropries pour une classe
  getRecommendedDons(className, sousClassName, level) {
    if (!this.donsData) return [];

    const normalizedClass = className.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const dons = [];
    const availablePoints = 2 + (['guerrier', 'rodeur'].includes(normalizedClass) ? level - 1 : 0);

    // Dons generaux utiles
    const generalDons = ['Dur a cuire', 'Endurant', 'Toujours pret'];

    // Dons de classe
    const classDons = {
      'guerrier': ['Agilite du guerrier', 'Spécialiste des armures lourdes'],
      'mage': ['Meditation erudite', 'Infatigable'],
      'pretre': ['Chair consacree', 'Infatigable'],
      'rodeur': ['Main heureuse', 'Hyperactif'],
      'enchanteur': ['Enchantement d\'agilite permanente', 'Infatigable']
    };

    // Trouver les dons disponibles
    for (const category of this.donsData) {
      for (const don of category.dons) {
        const classSpecificDons = classDons[normalizedClass] || [];
        if (generalDons.includes(don.nom) || classSpecificDons.includes(don.nom)) {
          dons.push(don.nom);
          if (dons.length >= availablePoints) break;
        }
      }
      if (dons.length >= availablePoints) break;
    }

    return dons.slice(0, availablePoints);
  }

  // Choisir un element aleatoire
  getRandomElement() {
    const elements = ['Feu', 'Eau', 'Terre', 'Air', 'Lumiere', 'Nuit', 'Divin', 'Malefique'];
    return elements[Math.floor(Math.random() * elements.length)];
  }

  // Distribuer les points "au choix" intelligemment
  getSmartStatChoices(className, level, progression) {
    const choices = {};
    const totalPoints = progression.auChoix * (level - 1);

    if (totalPoints <= 0) return choices;

    const normalizedClass = className.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Stats prioritaires par classe
    const priorities = {
      'guerrier': ['Force', 'Endurance', 'Agilite'],
      'mage': ['Intelligence', 'Volonte', 'Endurance'],
      'pretre': ['Volonte', 'Intelligence', 'Endurance'],
      'rodeur': ['Agilite', 'Force', 'Chance'],
      'enchanteur': ['Intelligence', 'Volonte', 'Chance']
    };

    const statPriority = priorities[normalizedClass] || ['Force', 'Endurance', 'Agilite'];

    let remaining = totalPoints;
    let idx = 0;

    while (remaining > 0) {
      const stat = statPriority[idx % statPriority.length];
      const normalizedStat = this.normalizeStatName(stat);
      choices[normalizedStat] = (choices[normalizedStat] || 0) + 1;
      remaining--;
      idx++;
    }

    return choices;
  }

  normalizeStatName(stat) {
    const mapping = {
      'force': 'Force',
      'agilite': 'Agilité',
      'agilité': 'Agilité',
      'endurance': 'Endurance',
      'intelligence': 'Intelligence',
      'volonte': 'Volonté',
      'volonté': 'Volonté',
      'chance': 'Chance'
    };
    return mapping[stat.toLowerCase()] || stat;
  }

  // Generer un heros complet
  generateHero(config) {
    const {
      className,
      subClassName = null,
      level = 1,
      team = 1,
      name = null
    } = config;

    // Trouver la classe
    const classe = this.classesData.find(c => c.nom === className);
    if (!classe) {
      console.error(`Classe ${className} non trouvee`);
      return null;
    }

    // Choisir une sous-classe
    let sousClasse;
    if (subClassName) {
      sousClasse = classe.sousClasses.find(sc => sc.nom === subClassName);
    }
    if (!sousClasse) {
      // Sous-classe aleatoire
      sousClasse = classe.sousClasses[Math.floor(Math.random() * classe.sousClasses.length)];
    }

    // Parser les stats de base
    const baseStats = this.characterCreator.parseBaseStats(sousClasse.base);
    const progression = this.characterCreator.parseProgression(sousClasse.progression);

    // Obtenir les dons
    const dons = this.getRecommendedDons(className, sousClasse.nom, level);

    // Obtenir l'equipement
    const equipement = this.getStartingEquipment(className);

    // Element aleatoire
    const element = this.getRandomElement();

    // Carte du destin aleatoire
    const carteDestin = Math.floor(Math.random() * 6);

    // Choix de la carte du destin
    const carteDestinChoices = this.getCarteDestinChoices(carteDestin, element);

    // Distribution des stats au choix
    const statChoices = this.getSmartStatChoices(className, level, progression);

    // Utiliser CharacterCreator pour calculer le personnage complet
    try {
      const characterData = this.characterCreator.calculateCharacter({
        className,
        subClassName: sousClasse.nom,
        level,
        element,
        dons,
        carteDestin,
        carteDestinChoices,
        statChoices,
        equipement
      });

      // Obtenir les sorts disponibles
      const availableSpells = this.getSpellsForClass(className, level);

      // Creer l'entite de combat
      const hero = new CombatEntity({
        name: name || this.generateHeroName(className),
        team,
        type: 'hero',

        // Stats de base avec equipement
        force: characterData.statsAvecEquipement.Force,
        agilite: characterData.statsAvecEquipement.Agilité,
        endurance: characterData.statsAvecEquipement.Endurance,
        intelligence: characterData.statsAvecEquipement.Intelligence,
        volonte: characterData.statsAvecEquipement.Volonté,
        chance: characterData.statsAvecEquipement.Chance,

        // Stats derivees
        maxHp: characterData.vieMax,
        currentHp: characterData.vieMax,
        maxMana: characterData.manaMax,
        currentMana: characterData.manaMax,

        initiative: characterData.initiative.total,
        esquive: characterData.esquive.total,
        armurePhysique: characterData.armure.total,
        resistanceAlterations: characterData.resistanceAlterations.total,

        coupCritiquePhysique: characterData.coupCritiquePhysique.total,
        coupCritiqueSorts: characterData.coupCritiqueSorts.total,
        puissanceSorts: characterData.puissanceSorts.total,

        element: element,

        // Armures elementaires
        armureFeu: characterData.armureElementaire.Feu,
        armureEau: characterData.armureElementaire.Eau,
        armureTerre: characterData.armureElementaire.Terre,
        armureAir: characterData.armureElementaire.Air,
        armureLumiere: characterData.armureElementaire.Lumière,
        armureNuit: characterData.armureElementaire.Nuit,
        armureDivin: characterData.armureElementaire.Divin,
        armureMalefique: characterData.armureElementaire.Maléfique,

        // Infos classe
        classe: className,
        sousClasse: sousClasse.nom,
        niveau: level,

        // Sorts
        spells: availableSpells,

        // Equipement
        weapon: equipement.find(e => e.tags && e.tags.includes('Arme')),
        armor: equipement.find(e => e.tags && e.tags.includes('Armure')),
        accessories: equipement.filter(e => e.tags && (e.tags.includes('Accessoire') || e.tags.includes('Bouclier'))),

        dons
      });

      return hero;
    } catch (error) {
      console.error('Error generating hero:', error);
      return null;
    }
  }

  getCarteDestinChoices(carteDestin, element) {
    const choices = {};

    switch (carteDestin) {
      case 0:
        choices.option = Math.random() > 0.5 ? 'initiative' : 'esquive';
        break;
      case 1:
        choices.stats = { Force: 1, Endurance: 1 };
        break;
      case 2:
        choices.option = Math.random() > 0.5 ? 'vie' : 'mana';
        break;
      case 3:
        choices.competence = 'Hardiesse';
        break;
      case 4:
        const elements = ['Feu', 'Eau', 'Terre', 'Air', 'Lumière', 'Nuit', 'Divin', 'Maléfique'];
        const elem1 = elements[Math.floor(Math.random() * elements.length)];
        let elem2 = elements[Math.floor(Math.random() * elements.length)];
        while (elem2 === elem1) {
          elem2 = elements[Math.floor(Math.random() * elements.length)];
        }
        choices.elements = [elem1, elem2];
        break;
      case 5:
        // Pas de choix supplementaire
        break;
    }

    return choices;
  }

  generateHeroName(className) {
    const normalizedClass = className.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const prefixes = {
      'guerrier': ['Thorin', 'Ragnar', 'Bjorn', 'Siegfried', 'Roland'],
      'mage': ['Merlin', 'Gandalf', 'Elminster', 'Raistlin', 'Morvran'],
      'pretre': ['Antonius', 'Celestin', 'Aldemar', 'Benedictus', 'Erasmus'],
      'rodeur': ['Strider', 'Talon', 'Shadow', 'Swift', 'Raven'],
      'enchanteur': ['Fey', 'Sylvan', 'Whisper', 'Dream', 'Illusion']
    };

    const suffixes = ['le Brave', 'le Sage', 'le Fort', 'le Rapide', 'le Mystique', ''];

    const prefix = prefixes[normalizedClass] || prefixes['guerrier'];
    const name = prefix[Math.floor(Math.random() * prefix.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return suffix ? `${name} ${suffix}` : name;
  }

  // Generer plusieurs heros
  generateHeroTeam(configs) {
    return configs.map(config => this.generateHero(config)).filter(h => h !== null);
  }
}

window.HeroGenerator = HeroGenerator;
