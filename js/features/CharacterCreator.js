/**
 * CharacterCreator.js
 * Système de création automatique de fiche de personnage Foresia
 */

class CharacterCreator {
  constructor() {
    this.classesData = null;
    this.donsData = null;
    this.elementsData = null;
    this.sortsData = null;
    this.cartesDestin = [
      "Au choix, (5 Initiative et 3 Fortune) ou (1 Esquive et 1 Résistance altérations).",
      "A répartir: 2 points de statistiques parmis celles qui n'ont pas la valeur la plus élevée.",
      "Au choix, 4 points de vie maximum ou 6 points de mana maximum.",
      "Une compétence rang 1 au choix.",
      "Deux éléments au choix gagnent 5 points d'armure élémentaire.",
      "Un point de Dons, seulement utilisable dans les dons généraux."
    ];
  }

  async init() {
    await this.loadData();
  }

  async loadData() {
    try {
      const [classesRes, donsRes, objetsRes, collectionsRes, sortsRes] = await Promise.all([
        fetch('data/classes.json'),
        fetch('data/dons.json'),
        fetch('data/objets.json'),
        fetch('data/collections.json'),
        fetch('data/sorts.json')
      ]);

      this.classesData = await classesRes.json();
      this.donsData = await donsRes.json();
      const objetsData = await objetsRes.json();
      const collectionsData = await collectionsRes.json();
      this.sortsData = await sortsRes.json();

      // Extraire les objets et la collection départ
      this.objetsData = objetsData.objets;
      const collectionDepart = collectionsData.collections.find(c => c.id === 'd-part');
      this.objetsDepart = collectionDepart ? collectionDepart.objets.map(num =>
        this.objetsData.find(obj => obj.numero === num)
      ).filter(obj => obj !== undefined) : [];

    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  /**
   * Extraire le prix d'un objet depuis son HTML
   */
  extractPrice(prixHTML) {
    if (!prixHTML) return 0;
    const match = prixHTML.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Extraire l'armure physique d'un objet depuis son effet
   */
  extractArmor(objet) {
    if (!objet || !objet.effet) return 0;
    // Recherche "Augmente l'armure physique de X" ou "armure physique de X"
    const match = objet.effet.match(/armure physique de (\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Calculer l'armure physique totale depuis l'équipement
   */
  calculatePhysicalArmorFromEquipment(equipement) {
    if (!equipement || equipement.length === 0) return 0;

    let totalArmor = 0;
    equipement.forEach(objet => {
      totalArmor += this.extractArmor(objet);
    });

    return totalArmor;
  }

  /**
   * Extraire les bonus de statistiques d'un équipement
   */
  extractStatBonuses(objet) {
    const bonuses = {
      Force: 0,
      Agilité: 0,
      Endurance: 0,
      Intelligence: 0,
      Volonté: 0,
      Chance: 0
    };

    if (!objet || !objet.effet) return bonuses;

    const effet = objet.effet;

    // Patterns pour chaque stat
    const patterns = [
      { regex: /Augmente\s+(?:la\s+)?Force\s+(?:du\s+porteur\s+)?de\s+(\d+)/i, stat: 'Force' },
      { regex: /Augmente\s+(?:l')?Agilit[ée]\s+(?:du\s+porteur\s+)?de\s+(\d+)/i, stat: 'Agilité' },
      { regex: /Augmente\s+(?:l')?Endurance\s+(?:du\s+porteur\s+)?de\s+(\d+)/i, stat: 'Endurance' },
      { regex: /Augmente\s+(?:l')?Intelligence\s+(?:du\s+porteur\s+)?de\s+(\d+)/i, stat: 'Intelligence' },
      { regex: /Augmente\s+(?:la\s+)?Volont[ée]\s+(?:du\s+porteur\s+)?de\s+(\d+)/i, stat: 'Volonté' },
      { regex: /Augmente\s+(?:la\s+)?Chance\s+(?:du\s+porteur\s+)?de\s+(\d+)/i, stat: 'Chance' }
    ];

    for (const { regex, stat } of patterns) {
      const match = effet.match(regex);
      if (match) {
        bonuses[stat] = parseInt(match[1]);
      }
    }

    return bonuses;
  }

  /**
   * Calculer les bonus de stats totaux depuis l'équipement
   */
  calculateStatBonusesFromEquipment(equipement) {
    const totalBonuses = {
      Force: 0,
      Agilité: 0,
      Endurance: 0,
      Intelligence: 0,
      Volonté: 0,
      Chance: 0
    };

    if (!equipement || equipement.length === 0) return totalBonuses;

    equipement.forEach(objet => {
      const bonuses = this.extractStatBonuses(objet);
      for (const stat in bonuses) {
        totalBonuses[stat] += bonuses[stat];
      }
    });

    return totalBonuses;
  }

  /**
   * Parse les stats de base depuis le HTML d'une sous-classe
   */
  parseBaseStats(baseHTML) {
    const stats = {
      Force: 1,
      Agilité: 1,
      Endurance: 1,
      Intelligence: 1,
      Volonté: 1,
      Chance: 1
    };

    const statMapping = {
      'Force': 'Force',
      'Agilité': 'Agilité',
      'Endurance': 'Endurance',
      'Intelligence': 'Intelligence',
      'Volonté': 'Volonté',
      'Chance': 'Chance'
    };

    for (const [key, statName] of Object.entries(statMapping)) {
      const regex = new RegExp(`${key}:\\s*<strong>(\\d+)</strong>`, 'i');
      const match = baseHTML.match(regex);
      if (match) {
        stats[statName] = parseInt(match[1]);
      }
    }

    return stats;
  }

  /**
   * Parse la progression par niveau
   */
  parseProgression(progressionHTML) {
    const progression = {
      Force: 0,
      Agilité: 0,
      Endurance: 0,
      Intelligence: 0,
      Volonté: 0,
      Chance: 0,
      auChoix: 0
    };

    const lines = progressionHTML.replace(/<[^>]*>/g, ' ');

    const forceMatch = lines.match(/\+(\d+)\s*Force/i);
    if (forceMatch) progression.Force = parseInt(forceMatch[1]);

    const agiliteMatch = lines.match(/\+(\d+)\s*Agilit/i);
    if (agiliteMatch) progression.Agilité = parseInt(agiliteMatch[1]);

    const enduranceMatch = lines.match(/\+(\d+)\s*Endurance/i);
    if (enduranceMatch) progression.Endurance = parseInt(enduranceMatch[1]);

    const intelligenceMatch = lines.match(/\+(\d+)\s*Intelligence/i);
    if (intelligenceMatch) progression.Intelligence = parseInt(intelligenceMatch[1]);

    const volonteMatch = lines.match(/\+(\d+)\s*Volont/i);
    if (volonteMatch) progression.Volonté = parseInt(volonteMatch[1]);

    const chanceMatch = lines.match(/\+(\d+)\s*Chance/i);
    if (chanceMatch) progression.Chance = parseInt(chanceMatch[1]);

    const auChoixMatch = lines.match(/\+(\d+)\s*Au choix/i);
    if (auChoixMatch) progression.auChoix = parseInt(auChoixMatch[1]);

    return progression;
  }

  /**
   * Calcule les statistiques complètes d'un personnage
   */
  calculateCharacter(config) {
    const {
      className,
      subClassName,
      level = 1,
      element,
      dons = [],
      carteDestin = null,
      statChoices = {},
      nomJoueur = '',
      nomPersonnage = '',
      experience = 0,
      histoire = '',
      personnalite = '',
      traumas = [],
      equipement = []
    } = config;

    // Trouver la classe et sous-classe
    const classe = this.classesData.find(c => c.nom === className);
    if (!classe) throw new Error(`Classe ${className} non trouvée`);

    const sousClasse = classe.sousClasses.find(sc => sc.nom === subClassName);
    if (!sousClasse) throw new Error(`Sous-classe ${subClassName} non trouvée`);

    // Stats de base
    const baseStats = this.parseBaseStats(sousClasse.base);
    const progression = this.parseProgression(sousClasse.progression);

    // Calculer les stats au niveau donné
    const stats = { ...baseStats };

    // Appliquer la progression
    if (level > 1) {
      const levelsGained = level - 1;
      for (const [stat, gain] of Object.entries(progression)) {
        if (stat !== 'auChoix' && stats[stat] !== undefined) {
          stats[stat] += gain * levelsGained;
        }
      }

      // Appliquer les points "au choix"
      const totalAuChoix = progression.auChoix * levelsGained;
      if (statChoices && Object.keys(statChoices).length > 0) {
        for (const [stat, points] of Object.entries(statChoices)) {
          stats[stat] += points;
        }
      }
    }

    // Appliquer les bonus de dons
    dons.forEach(donName => {
      const don = this.findDon(donName);
      if (don) {
        this.applyDonEffects(stats, don, config);
      }
    });

    // Appliquer la carte du destin
    if (carteDestin !== null && config.carteDestinChoices) {
      this.applyCarteDestin(stats, carteDestin, config.carteDestinChoices, config);
    }

    // Bonus de stats depuis l'équipement (calculé AVANT les stats dérivées)
    const equipementStatBonuses = this.calculateStatBonusesFromEquipment(equipement);

    // Calculer les stats totales avec équipement
    const statsAvecEquipement = {
      Force: stats.Force + equipementStatBonuses.Force,
      Agilité: stats.Agilité + equipementStatBonuses.Agilité,
      Endurance: stats.Endurance + equipementStatBonuses.Endurance,
      Intelligence: stats.Intelligence + equipementStatBonuses.Intelligence,
      Volonté: stats.Volonté + equipementStatBonuses.Volonté,
      Chance: stats.Chance + equipementStatBonuses.Chance
    };

    // Calculer les stats dérivées AVEC les bonus d'équipement
    const derivedStats = this.calculateDerivedStats(statsAvecEquipement, classe, sousClasse, level, config);

    // Calculer l'armure physique depuis l'équipement
    const armureEquipement = this.calculatePhysicalArmorFromEquipment(equipement);
    derivedStats.armure.equipement = armureEquipement;
    derivedStats.armure.total += armureEquipement;

    // Bonus d'armure du don "Porteur de charge lourde" pour armures lourdes
    if (dons.includes('Porteur de charge lourde')) {
      const hasHeavyArmor = equipement.some(e => e.tags && e.tags.includes('Armure lourde'));
      if (hasHeavyArmor) {
        const bonusArmure = Math.floor(statsAvecEquipement.Force / 5);
        derivedStats.armure.donBonus = bonusArmure;
        derivedStats.armure.total += bonusArmure;
      }
    }

    // Compétences de base
    const competences = this.getBaseCompetences(classe, sousClasse);

    // Appliquer les bonus de compétences des dons et carte destin
    this.applyCompetenceBonuses(competences, dons, carteDestin, config);

    // Armure élémentaire
    const armureElementaire = this.calculateArmureElementaire(element, sousClasse, carteDestin, config);

    // Capacités et dons (texte)
    const capacitesEtDons = this.getCapacitesEtDons(classe, sousClasse, dons);

    return {
      nomJoueur,
      nomPersonnage,
      experience,
      niveau: level,
      classe: `${className} - ${subClassName}`,
      element,
      stats,
      statsAvecEquipement,
      equipementStatBonuses,
      ...derivedStats,
      competences,
      armureElementaire,
      capacitesEtDons,
      histoire,
      personnalite,
      traumas
    };
  }

  /**
   * Calcule les statistiques dérivées
   */
  calculateDerivedStats(stats, classe, sousClasse, level, config) {
    // Vie de base = Endurance × 2
    let vieMax = stats.Endurance * 2;

    // Mana de base = 10 + (Volonté × 2), ou 10 + (Volonté × 3) pour Érudit
    let manaMultiplier = 2;
    if (sousClasse.nom === 'Érudit') {
      manaMultiplier = 3;
    }
    let manaMax = 10 + (stats.Volonté * manaMultiplier);

    // Efforts de base = 5
    let effortsMax = 5;

    // Initiative de base = Agilité
    let initiativeBase = stats.Agilité;
    let initiativeTotal = initiativeBase;

    // Fortune de base = Chance
    let fortuneBase = stats.Chance;
    let fortuneTotal = fortuneBase;

    // Esquive de base = Agilité / 5 (arrondi inférieur)
    // 0 de base, +1 tous les 5 points d'Agilité
    let esquiveBase = Math.floor(stats.Agilité / 5);
    let esquiveTotal = esquiveBase;

    // Résistance altérations de base = Volonté / 3 (arrondi inférieur)
    // +1 tous les 3 points de Volonté
    let resistanceBase = Math.floor(stats.Volonté / 3);
    let resistanceTotal = resistanceBase;

    // Armure physique de base = 0
    let armureBase = 0;
    let armureTotal = armureBase;

    // Coup critique physique de base = Agilité / 5 (arrondi inférieur)
    // 0 = critique sur 20, 1 = critique sur 19-20, 2 = critique sur 18-20, etc.
    let coupCritPhysiqueBase = Math.floor(stats.Agilité / 5);
    let coupCritPhysiqueTotal = coupCritPhysiqueBase;

    // Coup critique sorts de base = Chance / 5 (arrondi inférieur)
    // 0 = critique sur 20, 1 = critique sur 19-20, 2 = critique sur 18-20, etc.
    let coupCritSortsBase = Math.floor(stats.Chance / 5);
    let coupCritSortsTotal = coupCritSortsBase;

    // Puissance des sorts = Intelligence / 3 (arrondi inférieur)
    let puissanceSortsBase = Math.floor(stats.Intelligence / 3);
    let puissanceSortsTotal = puissanceSortsBase;

    // Appliquer les bonus de capacités de sous-classe
    const capacites = sousClasse.capacites || '';

    // Nain des montagnes: +2 Résistance altérations, +5 armure élémentaire Terre/Feu/Nuit
    if (sousClasse.nom === 'Nain des montagnes') {
      resistanceTotal += 2;
    }

    // Aventurier: +1 effort max
    if (sousClasse.nom === 'Aventurier') {
      effortsMax += 1;
    }

    // Lutin: +5 Fortune
    if (sousClasse.nom === 'Lutin') {
      fortuneTotal += 5;
    }

    // Appliquer les bonus de dons
    if (config.dons) {
      config.dons.forEach(donName => {
        const don = this.findDon(donName);
        if (don) {
          // Dur à cuire: +4 vie, +1 résistance
          if (don.nom === 'Dur à cuire') {
            vieMax += 4;
            resistanceTotal += 1;
          }
          // Endurant: +1 effort
          if (don.nom === 'Endurant') {
            effortsMax += 1;
          }
          // Toujours prêt: +10 initiative
          if (don.nom === 'Toujours prêt') {
            initiativeTotal += 10;
          }
          // Grand sac: +5 poids max, +5 consommables max
          // (géré ailleurs)
        }
      });
    }

    // Appliquer la carte du destin
    if (config.carteDestin !== null && config.carteDestinChoices) {
      const carte = config.carteDestin;
      const choices = config.carteDestinChoices;

      // Carte 0: (5 Initiative et 3 Fortune) ou (1 Esquive et 1 Résistance)
      if (carte === 0 && choices.option) {
        if (choices.option === 'initiative') {
          initiativeTotal += 5;
          fortuneTotal += 3;
        } else if (choices.option === 'esquive') {
          esquiveTotal += 1;
          resistanceTotal += 1;
        }
      }

      // Carte 2: 4 PV max ou 6 mana max
      if (carte === 2 && choices.option) {
        if (choices.option === 'vie') {
          vieMax += 4;
        } else if (choices.option === 'mana') {
          manaMax += 6;
        }
      }
    }

    return {
      vieMax,
      vieActuelle: vieMax, // On commence avec vie pleine
      vieTemporaire: 0,
      manaMax,
      manaActuelle: manaMax,
      manaTemp: 0,
      effortsMax,
      effortsActuels: effortsMax,
      initiative: { base: initiativeBase, total: initiativeTotal },
      fortune: { base: fortuneBase, total: fortuneTotal },
      esquive: { base: esquiveBase, total: esquiveTotal },
      resistanceAlterations: { base: resistanceBase, total: resistanceTotal },
      armure: { base: armureBase, total: armureTotal },
      coupCritiquePhysique: { base: coupCritPhysiqueBase, total: coupCritPhysiqueTotal },
      coupCritiqueSorts: { base: coupCritSortsBase, total: coupCritSortsTotal },
      puissanceSorts: { base: puissanceSortsBase, total: puissanceSortsTotal }
    };
  }

  /**
   * Obtenir les compétences de base
   */
  getBaseCompetences(classe, sousClasse) {
    const competences = {
      Hardiesse: 0,
      Finesse: 0,
      Coordination: 0,
      Réflexion: 0,
      Eloquence: 0
    };

    const capacitesClasse = classe.capacites || '';
    const capacitesSousClasse = sousClasse.capacites || '';
    const allCapacites = capacitesClasse + ' ' + capacitesSousClasse;

    // Parser les compétences (accepter avec ou sans accents)
    if (/Hardiesse.*rang\s*1/i.test(allCapacites)) competences.Hardiesse = 1;
    if (/Finesse.*rang\s*1/i.test(allCapacites)) competences.Finesse = 1;
    if (/Coordination.*rang\s*1/i.test(allCapacites)) competences.Coordination = 1;
    if (/R[ée]flexion.*rang\s*1/i.test(allCapacites)) competences.Réflexion = 1;
    if (/[ÉE]loquence.*rang\s*1/i.test(allCapacites)) competences.Eloquence = 1;

    return competences;
  }

  /**
   * Appliquer les bonus de compétences
   */
  applyCompetenceBonuses(competences, dons, carteDestin, config) {
    // Dons de compétences
    dons.forEach(donName => {
      const don = this.findDon(donName);
      if (don && don.nom.startsWith('Compétence :')) {
        // Géré via le formulaire
      }
    });

    // Carte du destin 3: Une compétence rang 1 au choix
    if (carteDestin === 3 && config.carteDestinChoices?.competence) {
      const comp = config.carteDestinChoices.competence;
      if (competences[comp] !== undefined) {
        competences[comp] = Math.max(competences[comp], 1);
      }
    }
  }

  /**
   * Calculer l'armure élémentaire
   */
  calculateArmureElementaire(element, sousClasse, carteDestin, config) {
    const armure = {
      Feu: 0,
      Eau: 0,
      Terre: 0,
      Air: 0,
      Lumière: 0,
      Nuit: 0,
      Divin: 0,
      Maléfique: 0
    };

    // Nain des montagnes: +5 Terre/Feu/Nuit
    if (sousClasse.nom === 'Nain des montagnes') {
      armure.Terre += 5;
      armure.Feu += 5;
      armure.Nuit += 5;
    }

    // Carte du destin 4: Deux éléments gagnent 5 d'armure
    if (carteDestin === 4 && config.carteDestinChoices?.elements) {
      const elements = config.carteDestinChoices.elements;
      elements.forEach(el => {
        if (armure[el] !== undefined) {
          armure[el] += 5;
        }
      });
    }

    // Dons d'armure élémentaire
    if (config.dons) {
      config.dons.forEach(donName => {
        const don = this.findDon(donName);
        if (don) {
          // Résistance élémentaire 1: +5 Feu, Eau, Terre, Air
          if (don.nom === 'Résistance élémentaire 1') {
            armure.Feu += 5;
            armure.Eau += 5;
            armure.Terre += 5;
            armure.Air += 5;
          }
          // Résistance élémentaire 2: +5 Lumière, Nuit, Divin, Maléfique
          if (don.nom === 'Résistance élémentaire 2') {
            armure.Lumière += 5;
            armure.Nuit += 5;
            armure.Divin += 5;
            armure.Maléfique += 5;
          }
        }
      });
    }

    return armure;
  }

  /**
   * Obtenir les capacités et dons sous forme de texte
   */
  getCapacitesEtDons(classe, sousClasse, dons) {
    const capacites = [];

    // Capacités de classe
    const classeCapacitesHTML = classe.capacites || '';
    const classeCapacitesText = classeCapacitesHTML.replace(/<[^>]*>/g, '').trim();
    if (classeCapacitesText) {
      capacites.push(`[Classe ${classe.nom}]`);
      capacites.push(classeCapacitesText);
    }

    // Capacités de sous-classe
    const sousClasseCapacitesHTML = sousClasse.capacites || '';
    const sousClasseCapacitesText = sousClasseCapacitesHTML.replace(/<[^>]*>/g, '').trim();
    if (sousClasseCapacitesText) {
      capacites.push('');
      capacites.push(`[Sous-classe ${sousClasse.nom}]`);
      capacites.push(sousClasseCapacitesText);
    }

    // Dons
    if (dons && dons.length > 0) {
      capacites.push('');
      capacites.push('[Dons]');
      dons.forEach(donName => {
        const don = this.findDon(donName);
        if (don) {
          const donText = `${don.nom}: ${don.description}`.replace(/<[^>]*>/g, '');
          capacites.push(donText);
        }
      });
    }

    return capacites.join('\n');
  }

  /**
   * Trouver un don par son nom
   */
  findDon(donName) {
    for (const category of this.donsData) {
      const don = category.dons.find(d => d.nom === donName);
      if (don) return don;
    }
    return null;
  }

  /**
   * Appliquer les effets d'un don sur les stats
   */
  applyDonEffects(stats, don, config) {
    const nom = don.nom;
    const desc = don.description;

    // Statistiques: +2 points au choix
    if (nom === 'Statistiques' && config.donBonuses?.[nom]) {
      const bonuses = config.donBonuses[nom];
      for (const [stat, points] of Object.entries(bonuses)) {
        stats[stat] += points;
      }
    }

    // Polyvalence ultime: +1 à toutes les stats
    if (nom === 'Polyvalence ultime') {
      stats.Force += 1;
      stats.Agilité += 1;
      stats.Endurance += 1;
      stats.Intelligence += 1;
      stats.Volonté += 1;
      stats.Chance += 1;
    }

    // Dons de classe qui donnent +4 à une stat
    if (nom === 'Agilité du guerrier') {
      stats.Agilité += 4;
    }
    if (nom === 'Infatigable') {
      stats.Volonté += 4;
    }
    if (nom === 'Main heureuse') {
      stats.Chance += 4;
    }
    if (nom === 'Chair consacrée') {
      stats.Endurance += 4;
    }
    if (nom === 'Méditation érudite') {
      stats.Intelligence += 4;
    }
    if (nom === "Enchantement d'agilité permanente") {
      stats.Agilité += 4;
    }
    if (nom === "Enchantement de force permanente") {
      stats.Force += 4;
    }
    if (nom === 'Volonté sans faille') {
      stats.Volonté += 4;
    }
  }

  /**
   * Appliquer la carte du destin
   */
  applyCarteDestin(stats, carteIndex, choices, config) {
    // Carte 1: 2 points de stats à répartir
    if (carteIndex === 1 && choices.stats) {
      for (const [stat, points] of Object.entries(choices.stats)) {
        stats[stat] += points;
      }
    }
  }
}

// Exporter en tant que module global
window.CharacterCreator = CharacterCreator;
