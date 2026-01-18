/**
 * CombatEntity.js
 * Classe de base pour les entites de combat (heros et monstres)
 */

class CombatEntity {
  constructor(config) {
    this.id = config.id || Math.random().toString(36).substr(2, 9);
    this.name = config.name || 'Unknown';
    this.team = config.team || 1;
    this.type = config.type || 'monster'; // 'hero' ou 'monster'

    // Stats de base
    this.force = config.force || 1;
    this.agilite = config.agilite || 1;
    this.endurance = config.endurance || 1;
    this.intelligence = config.intelligence || 1;
    this.volonte = config.volonte || 1;
    this.chance = config.chance || 1;

    // Stats derivees
    this.maxHp = config.maxHp || this.endurance * 2;
    this.currentHp = config.currentHp || this.maxHp;
    this.tempHp = config.tempHp || 0;

    this.maxMana = config.maxMana || 10 + this.volonte * 2;
    this.currentMana = config.currentMana || this.maxMana;

    this.initiative = config.initiative || this.agilite;
    this.esquive = config.esquive || Math.floor(this.agilite / 5);
    this.armurePhysique = config.armurePhysique || 0;
    this.resistanceAlterations = config.resistanceAlterations || Math.floor(this.volonte / 3);

    this.coupCritiquePhysique = config.coupCritiquePhysique || Math.floor(this.agilite / 5);
    this.coupCritiqueSorts = config.coupCritiqueSorts || Math.floor(this.chance / 5);
    this.puissanceSorts = config.puissanceSorts || Math.floor(this.intelligence / 3);

    // Element
    this.element = config.element || 'Feu';

    // Armures elementaires
    this.armureElementaire = {
      Feu: config.armureFeu || 0,
      Eau: config.armureEau || 0,
      Terre: config.armureTerre || 0,
      Air: config.armureAir || 0,
      Lumiere: config.armureLumiere || 0,
      Nuit: config.armureNuit || config.armureObscurite || 0,
      Divin: config.armureDivin || 0,
      Malefique: config.armureMalefique || 0
    };

    // Mouvement (9m de base)
    this.baseMovement = config.baseMovement || 9;
    this.movementBonus = config.movementBonus || 0;

    // Classe et sous-classe (pour les heros)
    this.classe = config.classe || null;
    this.sousClasse = config.sousClasse || null;
    this.niveau = config.niveau || 1;

    // Sorts connus
    this.spells = config.spells || [];

    // Attaques (pour les monstres)
    this.attacks = config.attacks || [];

    // Equipement (pour les heros)
    this.weapon = config.weapon || null;
    this.offHand = config.offHand || null; // Bouclier ou Catalyseur
    this.armor = config.armor || null;
    this.accessories = config.accessories || [];

    // Dons
    this.dons = config.dons || [];

    // Carte du destin
    this.carteDestin = config.carteDestin !== undefined ? config.carteDestin : null;
    this.carteDestinChoices = config.carteDestinChoices || [];

    // Consommables [{item: objetData, charges: number}]
    this.consumables = config.consumables || [];

    // Position sur la grille
    this.position = null;

    // Etat de combat
    this.alterations = []; // {name, duration, value, type}
    this.activeBuffs = {}; // Buffs actifs (non-cumulables sauf vie temp)
    this.channeling = null; // Sort en cours de canalisation
    this.hasActed = false;      // Action principale (attaque/sort)
    this.hasMoved = false;      // Deplacement
    this.hasUsedSecondary = false; // Action secondaire (objet)

    // Statistiques de combat
    this.stats = {
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      spellsCast: 0,
      criticals: 0,
      kills: 0
    };

    // Don tracking
    this.isFirstCombatTurn = true; // Pour "Toujours prêt"
    this.hasExtraActionFromKill = false; // Pour "Enchaînement Brutal"
    this.hasExtraSecondaryFromCrit = false; // Pour "Combo"
    this.hasExtraActionNextTurn = false; // Pour "Adrénaline"
    this.tookDamageLastTurn = false; // Pour "Concentration sous pression"
    this.hasUsedDonAbility = {}; // Track once-per-combat don abilities
    this.castSupportSpellThisTurn = false; // Pour "Élan béni"
    this.lastSpellElement = null; // Pour "Résonance Élémentaire"
  }

  // Verifier si l'entite est morte
  isDead() {
    return this.currentHp <= 0;
  }

  // Obtenir le mouvement total
  getMovement() {
    let movement = this.baseMovement + this.movementBonus;

    // Bonus du don "Rapide" (+3m)
    if (this.hasDon('Rapide')) {
      movement += 3;
    }

    // Bonus du don "Toujours prêt" (premier tour: vitesse double)
    if (this.hasDon('Toujours prêt') && this.isFirstCombatTurn) {
      movement *= 2;
    }

    // Bonus d'acceleration
    if (this.activeBuffs.acceleration) {
      movement += this.activeBuffs.acceleration;
    }

    // Malus de ralentissement
    if (this.hasAlteration('Ralenti')) {
      movement = Math.floor(movement / 2);
    }

    return movement;
  }

  // Verifier si l'entite a un don
  hasDon(donName) {
    return this.dons && this.dons.includes(donName);
  }

  // Obtenir le coup critique effectif (avec bonus conditionnels)
  getEffectiveCoupCritiquePhysique() {
    let crit = this.coupCritiquePhysique;

    // Bonus du don "Rage sanglante" (+2 crit si PV <= 50%)
    if (this.hasDon('Rage sanglante') && this.currentHp <= this.maxHp / 2) {
      crit += 2;
    }

    return crit;
  }

  // Obtenir la portee d'attaque
  getAttackRange() {
    // Par defaut corps a corps (3m)
    if (this.weapon) {
      // Parser la portee de l'arme
      const porteeMatch = this.weapon.effet?.match(/Port[ée]e[:\s]*(\d+)m/i);
      if (porteeMatch) {
        return parseInt(porteeMatch[1]);
      }
    }
    return 3; // Corps a corps par defaut
  }

  // Obtenir les degats de l'arme
  getWeaponDamage() {
    if (!this.weapon) {
      // Attaque a mains nues
      return { base: 1, physical: this.force };
    }

    // Parser les degats de l'arme
    const effet = this.weapon.effet || '';

    // Pattern: (X + Force) ou (Force)
    const damageMatch = effet.match(/\((\d*)\s*\+?\s*Force\)/i);
    if (damageMatch) {
      const base = damageMatch[1] ? parseInt(damageMatch[1]) : 0;
      return { base, physical: base + this.force };
    }

    // Degats fixes
    const fixedMatch = effet.match(/Inflige\s+(\d+)\s+d[ée]g[âa]ts/i);
    if (fixedMatch) {
      return { base: parseInt(fixedMatch[1]), physical: parseInt(fixedMatch[1]) };
    }

    return { base: 1, physical: 1 + this.force };
  }

  // Appliquer des degats
  takeDamage(amount, element = 'Physique', source = null, isCritical = false) {
    // Minimum 1 degat
    amount = Math.max(1, amount);
    const originalAmount = amount;
    let absorbed = 0;

    // D'abord les PV temporaires
    if (this.tempHp > 0) {
      if (this.tempHp >= amount) {
        this.tempHp -= amount;
        absorbed = amount;
        amount = 0;
      } else {
        absorbed = this.tempHp;
        amount -= this.tempHp;
        this.tempHp = 0;
      }
    }

    // Appliquer les degats restants aux PV
    if (amount > 0) {
      this.currentHp -= amount;
      this.stats.damageTaken += amount;
      this.tookDamageLastTurn = true; // Pour "Concentration sous pression"

      // Don "Adrénaline": action supplémentaire prochain tour si subit critique
      if (isCritical && this.hasDon && this.hasDon('Adrénaline')) {
        this.hasExtraActionNextTurn = true;
      }

      if (source) {
        source.stats.damageDealt += amount;
      }
    }

    return { absorbed, actual: amount, total: originalAmount };
  }

  // Soigner
  heal(amount) {
    const oldHp = this.currentHp;
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    const healed = this.currentHp - oldHp;
    this.stats.healingDone += healed;
    return healed;
  }

  // Ajouter des PV temporaires (max = vie max)
  addTempHp(amount) {
    const oldTempHp = this.tempHp;
    // Les PV temporaires se cumulent mais sont plafonnes a vie max
    this.tempHp = Math.min(this.maxHp, this.tempHp + amount);
    return this.tempHp - oldTempHp; // Retourne le montant effectivement ajoute
  }

  // Depenser du mana
  spendMana(amount) {
    if (this.currentMana < amount) {
      // Mana insuffisant - paralysie
      this.currentMana = 0;
      this.addAlteration('Paralyse', 2);
      return false;
    }
    this.currentMana -= amount;
    return true;
  }

  // Recuperer du mana
  recoverMana(amount) {
    this.currentMana = Math.min(this.maxMana, this.currentMana + amount);
  }

  // Ajouter une alteration
  addAlteration(name, duration, value = 0, type = 'negative') {
    // Verifier si l'alteration existe deja
    const existing = this.alterations.find(a => a.name === name);
    if (existing) {
      // Rafraichir la duree
      existing.duration = Math.max(existing.duration, duration);
      return;
    }
    this.alterations.push({ name, duration, value, type });
  }

  // Verifier si l'entite a une alteration
  hasAlteration(name) {
    return this.alterations.some(a => a.name === name);
  }

  // Retirer une alteration
  removeAlteration(name) {
    this.alterations = this.alterations.filter(a => a.name !== name);
  }

  // Mettre a jour les alterations (fin de tour)
  updateAlterations() {
    for (const alt of this.alterations) {
      alt.duration--;
    }
    this.alterations = this.alterations.filter(a => a.duration > 0);
  }

  // Appliquer un buff (non-cumulable sauf PV temp)
  applyBuff(name, value) {
    if (name === 'tempHp') {
      // Les PV temporaires sont cumulables
      this.addTempHp(value);
      return true;
    }

    // Les autres buffs ne sont pas cumulables
    if (this.activeBuffs[name]) {
      return false; // Buff deja actif
    }

    this.activeBuffs[name] = value;

    // Appliquer l'effet selon le type
    switch (name) {
      case 'armurePhysique':
        this.armurePhysique += value;
        break;
      case 'acceleration':
        // Gere dans getMovement()
        break;
      case 'puissanceSorts':
        this.puissanceSorts += value;
        break;
      case 'force':
        this.force += value;
        break;
      case 'coupCritique':
        this.coupCritiquePhysique += value;
        this.coupCritiqueSorts += value;
        break;
      case 'weaponEnchant':
        // Gere dans CombatEngine après applyBuff (stocke element et damage)
        break;
        break;
      case 'resistanceAlterations':
        this.resistanceAlterations += value;
        break;
    }

    return true;
  }

  // Verifier si peut agir
  canAct() {
    if (this.isDead()) return false;
    if (this.hasAlteration('Paralyse')) return false;
    if (this.hasAlteration('Endormi')) return false;
    if (this.hasAlteration('A terre')) return false;
    return true;
  }

  // Verifier si peut se deplacer
  canMove() {
    if (!this.canAct()) return false;
    if (this.hasAlteration('Entrave')) return false;
    if (this.channeling) return false;
    return true;
  }

  // Verifier si peut lancer des sorts
  canCastSpell() {
    if (!this.canAct()) return false;
    if (this.hasAlteration('Silence')) return false;
    return true;
  }

  // Verifier si peut utiliser un objet
  canUseItem() {
    if (!this.canAct()) return false;
    if (!this.hasSecondaryAction()) return false;
    return this.consumables.some(c => c.charges > 0);
  }

  // Verifier si une action secondaire est disponible
  hasSecondaryAction() {
    // Support pour "Hyperactif" avec plusieurs actions secondaires
    if (this.secondaryActionsRemaining !== undefined) {
      return this.secondaryActionsRemaining > 0;
    }
    return !this.hasUsedSecondary;
  }

  // Utiliser une action secondaire
  useSecondaryAction() {
    if (this.secondaryActionsRemaining !== undefined) {
      this.secondaryActionsRemaining--;
      this.hasUsedSecondary = this.secondaryActionsRemaining <= 0;
    } else {
      this.hasUsedSecondary = true;
    }
  }

  // Utiliser un consommable (reduit les charges)
  useConsumable(consumable) {
    const found = this.consumables.find(c => c.item.numero === consumable.item.numero);
    if (found && found.charges > 0) {
      found.charges--;
      // Retirer si plus de charges
      if (found.charges <= 0) {
        this.consumables = this.consumables.filter(c => c.item.numero !== consumable.item.numero);
      }
      return true;
    }
    return false;
  }

  // Obtenir les consommables utilisables
  getUsableConsumables() {
    return this.consumables.filter(c => c.charges > 0);
  }

  // Obtenir l'esquive effective
  getEffectiveEsquive() {
    let esquive = this.esquive;
    if (this.hasAlteration('Ralenti') || this.hasAlteration('A terre') || this.hasAlteration('Endormi') || this.hasAlteration('Berserker')) {
      return 0;
    }
    return Math.min(9, esquive); // Max 9
  }

  // Obtenir l'armure physique effective (0 si Berserker)
  getEffectiveArmurePhysique() {
    if (this.hasAlteration('Berserker')) {
      return 0;
    }
    return this.armurePhysique;
  }

  // Obtenir l'armure élémentaire effective (0 si Berserker)
  getEffectiveArmureElementaire(element) {
    if (this.hasAlteration('Berserker')) {
      return 0;
    }
    return this.armureElementaire[element] || 0;
  }

  // Reinitialiser pour un nouveau tour
  resetTurn() {
    this.hasActed = false;
    this.hasMoved = false;
    this.hasUsedSecondary = false;
    this.isFirstCombatTurn = false; // Plus jamais le premier tour
    this.hasExtraActionFromKill = false;
    this.hasExtraSecondaryFromCrit = false;
    this.castSupportSpellThisTurn = false;
    this.lastAttackTarget = null;
    this.lastAttackHit = false;
    this.lastAttackWasCrit = false;

    // "Attaque surpuissante" - skip action ce tour
    if (this.skipNextTurnAction) {
      this.hasActed = true;
      this.skipNextTurnAction = false;
    }

    // "Adrénaline" - action supplémentaire si a subi des critiques
    if (this.hasExtraActionNextTurn) {
      this.hasExtraActionFromKill = true;
      this.hasExtraActionNextTurn = false;
    }

    // "Hyperactif" - deux actions secondaires
    if (this.hasDon('Hyperactif')) {
      this.secondaryActionsRemaining = 2;
    } else {
      this.secondaryActionsRemaining = 1;
    }

    // Réduire durées des effets de dons
    if (this.criIntimidantDuration) {
      this.criIntimidantDuration--;
      if (this.criIntimidantDuration <= 0) {
        this.criIntimidantMalus = 0;
      }
    }

    if (this.roiEsquiveDuration) {
      this.roiEsquiveDuration--;
      if (this.roiEsquiveDuration <= 0) {
        this.esquive -= 5;
        this.roiEsquiveDuration = 0;
      }
    }

    // Reset des bonus temporaires de tour
    if (this.expertiseBouclierBonus) {
      this.armurePhysique -= this.expertiseBouclierBonus;
      this.expertiseBouclierBonus = 0;
    }

    // Cri de guerre dure jusqu'au début du prochain tour du crieur
    // (géré dans CombatEngine)
  }

  // Obtenir un resume de l'etat
  getStatusSummary() {
    return {
      name: this.name,
      hp: `${this.currentHp}/${this.maxHp}`,
      tempHp: this.tempHp,
      mana: `${this.currentMana}/${this.maxMana}`,
      alterations: this.alterations.map(a => `${a.name}(${a.duration})`).join(', '),
      position: this.position ? `(${this.position.x}, ${this.position.y})` : 'N/A'
    };
  }

  // Cloner l'entite (pour les previews)
  clone() {
    return new CombatEntity({
      ...this,
      id: Math.random().toString(36).substr(2, 9),
      alterations: [...this.alterations],
      activeBuffs: { ...this.activeBuffs },
      stats: { ...this.stats },
      consumables: this.consumables.map(c => ({ item: c.item, charges: c.charges })),
      spells: [...this.spells],
      attacks: [...this.attacks],
      dons: [...this.dons],
      accessories: [...(this.accessories || [])]
    });
  }
}

// Elements opposes
CombatEntity.ELEMENT_OPPOSITIONS = {
  'Feu': 'Eau',
  'Eau': 'Feu',
  'Terre': 'Air',
  'Air': 'Terre',
  'Lumiere': 'Nuit',
  'Nuit': 'Lumiere',
  'Divin': 'Malefique',
  'Malefique': 'Divin'
};

// Verifier si deux elements sont opposes
CombatEntity.areElementsOpposed = function(elem1, elem2) {
  return CombatEntity.ELEMENT_OPPOSITIONS[elem1] === elem2;
};

// Normaliser le nom d'un element
CombatEntity.normalizeElement = function(element) {
  if (!element) return 'Physique';

  const normalized = element.toLowerCase()
    .replace('lumière', 'Lumiere')
    .replace('maléfique', 'Malefique')
    .replace('obscurité', 'Nuit')
    .replace('obscurite', 'Nuit');

  const mapping = {
    'feu': 'Feu',
    'eau': 'Eau',
    'terre': 'Terre',
    'air': 'Air',
    'lumiere': 'Lumiere',
    'nuit': 'Nuit',
    'divin': 'Divin',
    'malefique': 'Malefique',
    'physique': 'Physique'
  };

  return mapping[normalized.toLowerCase()] || 'Physique';
};

window.CombatEntity = CombatEntity;
