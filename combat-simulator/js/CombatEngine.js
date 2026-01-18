/**
 * CombatEngine.js
 * Moteur de combat principal
 */

class CombatEngine {
  constructor(grid, spellParser, iconManager = null) {
    this.grid = grid;
    this.spellParser = spellParser;
    this.iconManager = iconManager;
    this.ai = new CombatAI(grid, spellParser);

    this.entities = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.roundNumber = 1;

    this.isRunning = false;
    this.isPaused = false;
    this.autoMode = false;
    this.autoDelay = 500; // ms entre les actions en mode auto

    // Manual combat state
    this.awaitingPlayerInput = false;
    this.playerControlledTeams = [1, 2]; // Both teams controlled by player by default
    this.selectedAction = null;
    this.selectedSpell = null;

    this.combatLog = [];
    this.onLogUpdate = null;
    this.onStateUpdate = null;
    this.onCombatEnd = null;
    this.onAwaitingInput = null; // Callback when waiting for player
    this.onActionAnimation = null; // Callback for action animations
  }

  // Check if entity is controlled by player
  isPlayerControlled(entity) {
    return entity && this.playerControlledTeams.includes(entity.team) && !this.autoMode;
  }

  // Toggle player control for a team
  setTeamPlayerControlled(team, isControlled) {
    if (isControlled && !this.playerControlledTeams.includes(team)) {
      this.playerControlledTeams.push(team);
    } else if (!isControlled) {
      this.playerControlledTeams = this.playerControlledTeams.filter(t => t !== team);
    }
  }

  // Auto-play current turn (let AI decide)
  async autoPlayCurrentTurn() {
    const entity = this.getCurrentEntity();
    if (!entity || !this.awaitingPlayerInput) return;

    this.awaitingPlayerInput = false;

    const entityIcon = this.getEntityIconHtml(entity, 24);
    this.log(`${entityIcon}${entity.name} joue automatiquement...`, 'movement');

    // Let AI decide
    const actions = this.ai.decideTurn(entity, this.entities);

    for (const action of actions) {
      await this.delay(this.autoDelay);
      await this.executeAction(entity, action);

      if (this.checkCombatEnd()) {
        return;
      }
    }

    this.nextTurn();
    await this.processNextTurn();
  }

  // Initialiser le combat
  initCombat(team1Entities, team2Entities) {
    this.entities = [...team1Entities, ...team2Entities];
    this.combatLog = [];
    this.roundNumber = 1;
    this.currentTurnIndex = 0;
    this.isRunning = true;
    this.isPaused = false;

    // Placer les equipes sur la grille
    this.grid.placeTeams(team1Entities, team2Entities);

    // Calculer l'ordre d'initiative
    this.calculateTurnOrder();

    this.log(`=== COMBAT COMMENCE ===`, 'turn');
    this.log(`Tour 1`, 'turn');

    this.updateState();
  }

  // Calculer l'ordre des tours
  calculateTurnOrder() {
    this.turnOrder = [...this.entities]
      .filter(e => !e.isDead())
      .sort((a, b) => b.initiative - a.initiative);
  }

  // Obtenir l'entite courante
  getCurrentEntity() {
    if (this.turnOrder.length === 0) return null;
    return this.turnOrder[this.currentTurnIndex];
  }

  // Passer au tour suivant
  nextTurn() {
    if (!this.isRunning) return;

    const current = this.getCurrentEntity();
    if (current) {
      // Mettre a jour les alterations
      current.updateAlterations();
      current.resetTurn();
    }

    this.currentTurnIndex++;

    // Nouveau round?
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.roundNumber++;
      this.calculateTurnOrder(); // Recalculer pour les morts
      this.log(`--- Tour ${this.roundNumber} ---`, 'turn');
    }

    // Verifier si le combat est termine
    if (this.checkCombatEnd()) {
      return;
    }

    // Passer les entites qui ne peuvent pas agir
    const next = this.getCurrentEntity();
    if (next && !next.canAct()) {
      this.log(`${next.name} ne peut pas agir (${this.getSkipReason(next)})`, 'movement');
      this.nextTurn();
      return;
    }

    this.updateState();
  }

  getSkipReason(entity) {
    if (entity.isDead()) return 'mort';
    if (entity.hasAlteration('Paralyse')) return 'paralyse';
    if (entity.hasAlteration('Endormi')) return 'endormi';
    if (entity.hasAlteration('A terre')) return 'a terre';
    return 'incapable d\'agir';
  }

  // Executer le tour d'une entite
  async executeEntityTurn(entity) {
    if (!entity || entity.isDead() || !entity.canAct()) {
      this.nextTurn();
      return;
    }

    const entityIcon = this.getEntityIconHtml(entity, 24);
    this.log(`>> Tour de ${entityIcon}${entity.name}`, 'turn');

    // Don "Concentration sous pression": regagne mana si a subi des dégâts au tour précédent
    if (entity.hasDon && entity.hasDon('Concentration sous pression') && entity.tookDamageLastTurn) {
      const manaGain = entity.niveau || 1;
      entity.recoverMana(manaGain);
      this.log(`  ${entity.name} regagne ${manaGain} mana (Concentration sous pression).`, 'buff');
    }
    // Reset the flag for this turn
    entity.tookDamageLastTurn = false;

    // If player-controlled, wait for input
    if (this.isPlayerControlled(entity)) {
      this.awaitingPlayerInput = true;
      this.selectedAction = null;
      this.selectedSpell = null;

      if (this.onAwaitingInput) {
        this.onAwaitingInput(entity);
      }
      return; // Player will call playerAction methods
    }

    // AI-controlled entity
    const actions = this.ai.decideTurn(entity, this.entities);

    for (const action of actions) {
      if (this.autoMode && !this.isPaused) {
        await this.delay(this.autoDelay);
      }

      await this.executeAction(entity, action);

      if (this.checkCombatEnd()) {
        return;
      }
    }

    this.nextTurn();
  }

  // Player action: Move to position
  async playerMove(x, y) {
    const entity = this.getCurrentEntity();
    if (!entity || !this.awaitingPlayerInput || entity.hasMoved) return false;

    const reachable = this.grid.getReachableCells(entity, entity.getMovement());
    const canReach = reachable.some(c => c.x === x && c.y === y);

    if (!canReach) {
      this.log(`Position hors de portee!`, 'movement');
      return false;
    }

    await this.executeAction(entity, { type: 'move', target: { x, y } });
    this.updateState();
    return true;
  }

  // Player action: Melee attack
  async playerAttack(target) {
    const entity = this.getCurrentEntity();
    if (!entity || !this.awaitingPlayerInput || entity.hasActed) return false;

    const range = entity.getAttackRange();
    const distance = this.grid.getDistanceMeters(entity.position, target.position);

    if (distance > range) {
      this.log(`Cible hors de portee! (${distance}m > ${range}m)`, 'movement');
      return false;
    }

    await this.executeAction(entity, { type: 'attack', target });

    if (this.checkCombatEnd()) return true;

    this.updateState();
    return true;
  }

  // Player action: Cast spell
  async playerCastSpell(spell, target) {
    const entity = this.getCurrentEntity();
    if (!entity || !this.awaitingPlayerInput || entity.hasActed) return false;

    const manaCost = this.getSpellManaCost(spell);
    if (entity.currentMana < manaCost) {
      this.log(`Mana insuffisant! (${entity.currentMana}/${manaCost})`, 'movement');
      return false;
    }

    const range = this.getSpellRange(spell);
    const distance = this.grid.getDistanceMeters(entity.position, target.position);

    if (distance > range) {
      this.log(`Cible hors de portee! (${distance}m > ${range}m)`, 'movement');
      return false;
    }

    await this.executeAction(entity, { type: 'spell', spell, target });

    if (this.checkCombatEnd()) return true;

    this.updateState();
    return true;
  }

  // Player action: Wait (do nothing)
  async playerWait() {
    const entity = this.getCurrentEntity();
    if (!entity || !this.awaitingPlayerInput) return false;

    await this.executeAction(entity, { type: 'wait' });
    this.updateState();
    return true;
  }

  // Player action: End turn
  async playerEndTurn() {
    const entity = this.getCurrentEntity();
    if (!entity || !this.awaitingPlayerInput) return false;

    this.awaitingPlayerInput = false;
    this.log(`${entity.name} termine son tour.`, 'movement');
    this.nextTurn();

    // Auto-execute AI turns
    await this.processNextTurn();
  }

  // Player action: Use item (action secondaire)
  async playerUseItem(consumable) {
    const entity = this.getCurrentEntity();
    if (!entity || !this.awaitingPlayerInput || entity.hasUsedSecondary) return false;

    if (!consumable || consumable.charges <= 0) {
      this.log(`Objet non disponible!`, 'movement');
      return false;
    }

    await this.executeAction(entity, { type: 'item', item: consumable });

    if (this.checkCombatEnd()) return true;

    this.updateState();
    return true;
  }

  // Process turns automatically for AI, wait for player
  async processNextTurn() {
    if (!this.isRunning) return;

    const entity = this.getCurrentEntity();
    if (!entity) return;

    if (this.isPlayerControlled(entity)) {
      // Wait for player input
      await this.executeEntityTurn(entity);
    } else {
      // Execute AI turn then continue
      await this.executeEntityTurn(entity);
      // After AI turn, check next
      if (this.isRunning && !this.autoMode) {
        await this.delay(300);
        await this.processNextTurn();
      }
    }
  }

  // Get available actions for current entity
  getAvailableActions(entity) {
    if (!entity) entity = this.getCurrentEntity();
    if (!entity) return {};

    const actions = {
      canMove: entity.canMove() && !entity.hasMoved,
      canAttack: entity.canAct() && !entity.hasActed,
      canCastSpell: entity.canCastSpell() && !entity.hasActed && entity.spells.length > 0,
      canUseItem: entity.canUseItem() && !entity.hasUsedSecondary,
      canWait: true,
      canEndTurn: true,
      movementRange: entity.getMovement(),
      attackRange: entity.getAttackRange(),
      spells: entity.spells.filter(s => entity.currentMana >= this.getSpellManaCost(s)),
      items: entity.getUsableConsumables(),
      // Active don abilities
      donAbilities: this.getAvailableDonAbilities(entity)
    };

    return actions;
  }

  // Get available don abilities that can be activated
  getAvailableDonAbilities(entity) {
    if (!entity || !entity.dons) return [];

    const abilities = [];
    const used = entity.hasUsedDonAbility || {};
    const hasSecondary = entity.hasSecondaryAction ? entity.hasSecondaryAction() : !entity.hasUsedSecondary;

    // ===== DONS GÉNÉRAUX =====

    // Accélération: +6m movement (main action)
    if (entity.hasDon('Accélération') && !entity.hasActed) {
      abilities.push({ name: 'Accélération', type: 'main', description: '+6m déplacement ce tour' });
    }

    // ===== DONS GUERRIER =====

    // Charge: 3x vitesse + à terre (secondary, 1x/combat)
    if (entity.hasDon('Charge') && hasSecondary && !used.Charge) {
      abilities.push({ name: 'Charge', type: 'secondary', description: 'Triple vitesse, met à terre' });
    }

    // Cri de guerre: +niveau dégâts pour tous (secondary, 1x/combat)
    if (entity.hasDon('Cri de guerre') && hasSecondary && !used.CriDeGuerre) {
      abilities.push({ name: 'Cri de guerre', type: 'secondary', description: `+${entity.niveau || 1} dégâts physiques équipe` });
    }

    // Cri intimidant: -2 dégâts ennemis 9m (secondary, 1x/combat)
    if (entity.hasDon('Cri intimidant') && hasSecondary && !used.CriIntimidant) {
      abilities.push({ name: 'Cri intimidant', type: 'secondary', description: '-2 dégâts ennemis (9m) 2 tours' });
    }

    // Coup d'épaule: repousse 3m après attaque (secondary)
    if (entity.hasDon("Coup d'épaule") && hasSecondary && entity.lastAttackHit) {
      const pushDist = entity.lastAttackWasCrit ? 6 : 3;
      abilities.push({ name: "Coup d'épaule", type: 'secondary', description: `Repousse cible de ${pushDist}m` });
    }

    // Attaque surpuissante: double dégâts mais skip next turn (secondary)
    if (entity.hasDon('Attaque surpuissante') && hasSecondary && !entity.hasActed) {
      abilities.push({ name: 'Attaque surpuissante', type: 'secondary', description: 'x2 dégâts, skip prochain tour' });
    }

    // Provocation: force ennemis à cibler (main action)
    if (entity.hasDon('Provocation') && !entity.hasActed) {
      abilities.push({ name: 'Provocation', type: 'main', description: 'Ennemis (12m) vous ciblent' });
    }

    // Second souffle: regagne PV = endurance (secondary, 1x/jour)
    if (entity.hasDon('Second souffle') && hasSecondary && !used.SecondSouffle) {
      abilities.push({ name: 'Second souffle', type: 'secondary', description: `Regagne ${entity.endurance} PV` });
    }

    // Volonté de fer: retire altérations magiques (secondary, 1x/jour)
    if (entity.hasDon('Volonté de fer') && hasSecondary && !used.VolonteDeFer && entity.alterations?.length > 0) {
      abilities.push({ name: 'Volonté de fer', type: 'secondary', description: 'Retire altérations magiques' });
    }

    // Expertise du bouclier: double armure bouclier (secondary)
    if (entity.hasDon('Expertise du bouclier') && hasSecondary && entity.offHand?.tags?.includes('Bouclier') && !used.ExpertiseBouclier) {
      abilities.push({ name: 'Expertise du bouclier', type: 'secondary', description: 'x2 armure bouclier ce tour' });
    }

    // ===== DONS RÔDEUR =====

    // Brise-genou: prochaine attaque Ralenti (secondary, 1x/combat)
    if (entity.hasDon('Brise-genou') && hasSecondary && !used.BriseGenou) {
      abilities.push({ name: 'Brise-genou', type: 'secondary', description: 'Prochaine attaque: Ralenti 5 tours' });
    }

    // Poison: prochaine attaque empoisonne (secondary)
    if (entity.hasDon('Poison') && hasSecondary) {
      abilities.push({ name: 'Poison', type: 'secondary', description: `Prochaine attaque: Poison ${entity.niveau || 1}` });
    }

    // Roi de l'esquive: +5 esquive 3 tours (secondary, 1x/jour)
    if (entity.hasDon("Roi de l'esquive") && hasSecondary && !used.RoiEsquive) {
      abilities.push({ name: "Roi de l'esquive", type: 'secondary', description: '+5 esquive pendant 3 tours' });
    }

    // Croche-patte: met à terre (secondary, 1x/combat)
    if (entity.hasDon('Croche-patte') && hasSecondary && !used.CrochePatte) {
      abilities.push({ name: 'Croche-patte', type: 'secondary', description: 'Prochaine attaque: À terre' });
    }

    // Éventail de couteaux: attaque tous ennemis 3m (secondary, 1x/combat)
    if (entity.hasDon('Éventail de couteaux') && hasSecondary && !used.EventailCouteaux) {
      abilities.push({ name: 'Éventail de couteaux', type: 'secondary', description: 'Prochaine attaque: tous ennemis 3m' });
    }

    // Exposer l'armure: Vulnérable 2 tours (secondary, 1x/combat)
    if (entity.hasDon("Exposer l'armure") && hasSecondary && !used.ExposerArmure) {
      abilities.push({ name: "Exposer l'armure", type: 'secondary', description: 'Prochaine attaque: Vulnérable 2 tours' });
    }

    // ===== DONS MAGE =====

    // Gemme de mana: récupère tout le mana (secondary, 1x/jour)
    if (entity.hasDon('Gemme de mana') && hasSecondary && !used.GemmeDeMana) {
      abilities.push({ name: 'Gemme de mana', type: 'secondary', description: 'Récupère tout le mana' });
    }

    // Infusion élémentaire: imbue arme avec élément du dernier sort (secondary)
    if (entity.hasDon('Infusion élémentaire') && hasSecondary && entity.lastSpellElement) {
      abilities.push({ name: 'Infusion élémentaire', type: 'secondary', description: `Arme +${entity.lastSpellLevel || 1} ${entity.lastSpellElement}` });
    }

    // ===== DONS PRÊTRE =====

    // Sacrifice pieux: PV -> Mana x2 (secondary)
    if (entity.hasDon('Sacrifice pieux') && hasSecondary && entity.currentHp > 1) {
      const maxSacrifice = Math.min(entity.currentHp - 1, (entity.niveau || 1) * 2);
      abilities.push({ name: 'Sacrifice pieux', type: 'secondary', description: `Sacrifie PV -> x2 Mana (max ${maxSacrifice})` });
    }

    // ===== DONS ENCHANTEUR =====

    // Téléportation amicale: teleport près d'un allié (secondary, 1x/combat)
    if (entity.hasDon('Téléportation amicale') && hasSecondary && !used.TeleportAmicale) {
      abilities.push({ name: 'Téléportation amicale', type: 'secondary', description: 'Téléporte à 3m d\'un allié' });
    }

    return abilities;
  }

  // Execute a don ability
  async executeDonAbility(entity, abilityName) {
    if (!entity.hasUsedDonAbility) entity.hasUsedDonAbility = {};

    const useSecondary = () => {
      if (entity.useSecondaryAction) entity.useSecondaryAction();
      else entity.hasUsedSecondary = true;
    };

    switch (abilityName) {
      // ===== GÉNÉRAUX =====
      case 'Accélération':
        entity.applyBuff('acceleration', 6);
        entity.hasActed = true;
        this.log(`${entity.name} utilise Accélération! (+6m deplacement)`, 'buff');
        break;

      // ===== GUERRIER =====
      case 'Charge':
        entity.chargeActive = true;
        entity.applyBuff('acceleration', entity.getMovement() * 2); // Triple = base + 2x base
        useSecondary();
        entity.hasUsedDonAbility.Charge = true;
        this.log(`${entity.name} se prépare à charger! (3x vitesse, met à terre)`, 'buff');
        break;

      case 'Cri de guerre':
        const bonusDamage = entity.niveau || 1;
        for (const ally of this.entities.filter(e => e.team === entity.team && !e.isDead())) {
          ally.criDeGuerreBonus = bonusDamage;
        }
        useSecondary();
        entity.hasUsedDonAbility.CriDeGuerre = true;
        this.log(`${entity.name} pousse un cri de guerre! (+${bonusDamage} dégâts physiques équipe)`, 'buff');
        break;

      case 'Cri intimidant':
        const enemies9m = this.entities.filter(e =>
          e.team !== entity.team && !e.isDead() &&
          this.grid.getDistanceMeters(entity.position, e.position) <= 9
        );
        for (const enemy of enemies9m) {
          enemy.criIntimidantMalus = 2;
          enemy.criIntimidantDuration = 2;
        }
        useSecondary();
        entity.hasUsedDonAbility.CriIntimidant = true;
        this.log(`${entity.name} pousse un cri intimidant! (${enemies9m.length} ennemis: -2 dégâts)`, 'buff');
        break;

      case "Coup d'épaule":
        if (entity.lastAttackTarget) {
          const pushDist = entity.lastAttackWasCrit ? 6 : 3;
          const target = entity.lastAttackTarget;
          const dx = target.position.x - entity.position.x;
          const dy = target.position.y - entity.position.y;
          const dist = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
          const pushCells = this.grid.metersToCell(pushDist);

          let finalX = target.position.x;
          let finalY = target.position.y;
          for (let i = 1; i <= pushCells; i++) {
            const testX = target.position.x + Math.round(dx / dist) * i;
            const testY = target.position.y + Math.round(dy / dist) * i;
            if (this.grid.isCellFree(testX, testY)) {
              finalX = testX;
              finalY = testY;
            } else break;
          }
          if (finalX !== target.position.x || finalY !== target.position.y) {
            this.grid.moveEntity(target, finalX, finalY);
            this.log(`${entity.name} repousse ${target.name} de ${pushDist}m! (Coup d'épaule)`, 'buff');
          }
        }
        useSecondary();
        break;

      case 'Attaque surpuissante':
        entity.attaqueSurpuissanteActive = true;
        entity.skipNextTurnAction = true;
        useSecondary();
        this.log(`${entity.name} prépare une attaque surpuissante! (x2 dégâts)`, 'buff');
        break;

      case 'Provocation':
        const enemies12m = this.entities.filter(e =>
          e.team !== entity.team && !e.isDead() &&
          e.resistanceAlterations <= 2 &&
          this.grid.getDistanceMeters(entity.position, e.position) <= 12
        );
        for (const enemy of enemies12m) {
          enemy.provokedBy = entity.id;
        }
        entity.hasActed = true;
        this.log(`${entity.name} provoque ${enemies12m.length} ennemis!`, 'buff');
        break;

      case 'Second souffle':
        const healed = entity.heal(entity.endurance);
        useSecondary();
        entity.hasUsedDonAbility.SecondSouffle = true;
        this.log(`${entity.name} utilise Second souffle! (+${healed} PV)`, 'heal');
        break;

      case 'Volonté de fer':
        entity.alterations = [];
        useSecondary();
        entity.hasUsedDonAbility.VolonteDeFer = true;
        this.log(`${entity.name} utilise Volonté de fer! (altérations retirées)`, 'buff');
        break;

      case 'Expertise du bouclier':
        if (entity.offHand?.tags?.includes('Bouclier')) {
          const shieldArmor = this.extractShieldArmor(entity.offHand);
          entity.expertiseBouclierBonus = shieldArmor;
          entity.armurePhysique += shieldArmor;
        }
        useSecondary();
        entity.hasUsedDonAbility.ExpertiseBouclier = true;
        this.log(`${entity.name} utilise Expertise du bouclier! (x2 armure bouclier)`, 'buff');
        break;

      // ===== RÔDEUR =====
      case 'Brise-genou':
        entity.nextAttackEffect = 'ralenti';
        useSecondary();
        entity.hasUsedDonAbility.BriseGenou = true;
        this.log(`${entity.name} prépare un brise-genou! (prochaine attaque: Ralenti)`, 'buff');
        break;

      case 'Poison':
        entity.nextAttackEffect = 'poison';
        entity.nextAttackPoisonLevel = entity.niveau || 1;
        useSecondary();
        this.log(`${entity.name} empoisonne son arme! (prochaine attaque: Poison)`, 'buff');
        break;

      case "Roi de l'esquive":
        entity.esquive += 5;
        entity.roiEsquiveDuration = 3;
        useSecondary();
        entity.hasUsedDonAbility.RoiEsquive = true;
        this.log(`${entity.name} utilise Roi de l'esquive! (+5 esquive 3 tours)`, 'buff');
        break;

      case 'Croche-patte':
        entity.nextAttackEffect = 'aTerre';
        useSecondary();
        entity.hasUsedDonAbility.CrochePatte = true;
        this.log(`${entity.name} prépare un croche-patte! (prochaine attaque: À terre)`, 'buff');
        break;

      case 'Éventail de couteaux':
        entity.nextAttackAoE = true;
        useSecondary();
        entity.hasUsedDonAbility.EventailCouteaux = true;
        this.log(`${entity.name} prépare un éventail de couteaux! (prochaine attaque: zone 3m)`, 'buff');
        break;

      case "Exposer l'armure":
        entity.nextAttackEffect = 'vulnerable';
        useSecondary();
        entity.hasUsedDonAbility.ExposerArmure = true;
        this.log(`${entity.name} va exposer l'armure! (prochaine attaque: Vulnérable)`, 'buff');
        break;

      // ===== MAGE =====
      case 'Gemme de mana':
        const manaRecovered = entity.maxMana - entity.currentMana;
        entity.currentMana = entity.maxMana;
        useSecondary();
        entity.hasUsedDonAbility.GemmeDeMana = true;
        this.log(`${entity.name} utilise Gemme de mana! (+${manaRecovered} mana)`, 'buff');
        break;

      case 'Infusion élémentaire':
        entity.weaponEnchantElement = entity.lastSpellElement;
        entity.weaponEnchantDamage = entity.lastSpellLevel || 1;
        useSecondary();
        this.log(`${entity.name} imprègne son arme de ${entity.lastSpellElement}! (+${entity.weaponEnchantDamage} dégâts)`, 'buff');
        break;

      // ===== PRÊTRE =====
      case 'Sacrifice pieux':
        const maxSacrifice = Math.min(entity.currentHp - 1, (entity.niveau || 1) * 2);
        const sacrifice = maxSacrifice;
        entity.currentHp -= sacrifice;
        entity.recoverMana(sacrifice * 2);
        useSecondary();
        this.log(`${entity.name} se sacrifie! (-${sacrifice} PV, +${sacrifice * 2} mana)`, 'buff');
        break;

      // ===== ENCHANTEUR =====
      case 'Téléportation amicale':
        // Will need target selection - for now find closest ally
        const allies = this.entities.filter(e => e.team === entity.team && e.id !== entity.id && !e.isDead());
        if (allies.length > 0) {
          const closestAlly = allies[0];
          const adjCells = this.getAdjacentCells(closestAlly.position);
          const freeCell = adjCells.find(c => this.grid.isCellFree(c.x, c.y));
          if (freeCell) {
            this.grid.moveEntity(entity, freeCell.x, freeCell.y);
            this.log(`${entity.name} se téléporte près de ${closestAlly.name}!`, 'buff');
          }
        }
        useSecondary();
        entity.hasUsedDonAbility.TeleportAmicale = true;
        break;
    }

    this.updateState();
  }

  // Helper: get adjacent cells
  getAdjacentCells(pos) {
    return [
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y },
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x, y: pos.y + 1 }
    ];
  }

  // Helper: extract shield armor value
  extractShieldArmor(shield) {
    if (!shield?.effet) return 0;
    const match = shield.effet.match(/armure physique de (\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }

  // Get valid movement cells for current entity
  getValidMovementCells() {
    const entity = this.getCurrentEntity();
    if (!entity || !entity.canMove() || entity.hasMoved) return [];
    return this.grid.getReachableCells(entity, entity.getMovement());
  }

  // Get valid attack targets for current entity
  getValidAttackTargets() {
    const entity = this.getCurrentEntity();
    if (!entity || !entity.canAct() || entity.hasActed) return [];

    const range = entity.getAttackRange();
    const enemies = this.entities.filter(e => e.team !== entity.team && !e.isDead());

    return enemies.filter(enemy => {
      const distance = this.grid.getDistanceMeters(entity.position, enemy.position);
      return distance <= range;
    });
  }

  // Get valid spell targets
  getValidSpellTargets(spell) {
    const entity = this.getCurrentEntity();
    if (!entity || !entity.canCastSpell() || entity.hasActed) return [];

    const range = this.getSpellRange(spell);
    const spellType = this.getSpellType(spell);
    const spellName = this.getSpellName(spell);

    console.log(`getValidSpellTargets: ${spellName}, type=${spellType}, range=${range}m`);

    // Personal spells (range 0) can only target the caster
    if (range === 0) {
      console.log(`  personalSpell=true, target=self`);
      return [entity];
    }

    // Check if spell can target both allies and enemies (e.g., "alliée ou ennemie")
    const rawEffect = spell.raw?.effetNormal || spell.effetNormal || '';
    const canTargetBoth = /alli[ée]e?\s+ou\s+ennemi|ennemi\s+ou\s+alli[ée]/i.test(rawEffect);

    // Determine target type
    const isFriendlySpell = spellType === 'buff' || spellType === 'healing';

    let targetList;
    if (canTargetBoth) {
      // Spells that can target both allies and enemies (exclude self)
      targetList = this.entities.filter(e => e.id !== entity.id && !e.isDead());
      console.log(`  canTargetBoth=true, potentialTargets=${targetList.length}`);
    } else if (isFriendlySpell) {
      targetList = this.entities.filter(e => e.team === entity.team && !e.isDead());
      console.log(`  isFriendlySpell=true, potentialTargets=${targetList.length}`);
    } else {
      targetList = this.entities.filter(e => e.team !== entity.team && !e.isDead());
      console.log(`  isHostileSpell=true, potentialTargets=${targetList.length}`);
    }

    const validTargets = targetList.filter(target => {
      const distance = this.grid.getDistanceMeters(entity.position, target.position);
      const inRange = distance <= range;
      console.log(`  - ${target.name}: distance=${distance}m, inRange=${inRange}`);
      return inRange;
    });

    console.log(`  validTargets=${validTargets.length}`);
    return validTargets;
  }

  // Executer une action
  async executeAction(entity, action) {
    switch (action.type) {
      case 'move':
        this.executeMove(entity, action.target);
        break;

      case 'attack':
        await this.executeMeleeAttack(entity, action.target);
        break;

      case 'spell':
        await this.executeSpell(entity, action.spell, action.target);
        break;

      case 'item':
        await this.executeUseItem(entity, action.item);
        break;

      case 'skip':
      case 'wait':
        this.log(`${entity.name} attend.`, 'movement');
        entity.hasActed = true; // Attendre consomme l'action
        break;
    }

    // Seules les actions principales consomment hasActed (pas le deplacement)
    if (action.type === 'attack' || action.type === 'spell') {
      entity.hasActed = true;
    }
    // Les objets utilisent hasUsedSecondary (action secondaire)
    if (action.type === 'item') {
      entity.hasUsedSecondary = true;
    }

    this.updateState();
  }

  // Executer un deplacement
  executeMove(entity, target) {
    if (!entity.canMove()) {
      this.log(`${entity.name} ne peut pas se deplacer.`, 'movement');
      return false;
    }

    const oldPos = { ...entity.position };
    const success = this.grid.moveEntity(entity, target.x, target.y);

    if (success) {
      const distance = this.grid.getDistanceMeters(oldPos, target);
      this.log(`${entity.name} se deplace de ${distance}m.`, 'movement');
      entity.hasMoved = true;
      return true;
    }

    return false;
  }

  // Executer une attaque de melee
  async executeMeleeAttack(entity, target) {
    const weaponDamage = entity.getWeaponDamage();
    const weaponName = entity.weapon ? entity.weapon.nom : 'mains nues';
    const weaponIcon = this.getWeaponIconHtml(entity.weapon);
    this.log(`${entity.name} attaque ${target.name} avec ${weaponIcon}${weaponName}.`, 'damage');

    // Lancer le d20
    const roll = this.rollD20();
    this.log(`  Jet d'attaque: ${roll}`, 'movement');

    // Verifier l'esquive
    const dodgeThreshold = 1 + target.getEffectiveEsquive();
    if (roll <= dodgeThreshold) {
      this.log(`  ${target.name} esquive! (${roll} <= 1+${target.getEffectiveEsquive()} esquive)`, 'movement');

      // Animation for dodge
      if (this.onActionAnimation) {
        const weaponIconUrl = this.iconManager ? this.iconManager.getItemIcon(weaponName) : null;
        await this.onActionAnimation(entity, target, weaponIconUrl, weaponName, 'Esquive!', 'dodge');
      }

      // Don "Contre-attaque": après avoir esquivé une attaque CàC, peut contre-attaquer
      if (target.hasDon && target.hasDon('Contre-attaque') && target.hasSecondaryAction && target.hasSecondaryAction()) {
        const counterRange = target.getAttackRange();
        const distance = this.grid.getDistanceMeters(target.position, entity.position);
        if (distance <= counterRange) {
          this.log(`  ${target.name} contre-attaque! (Contre-attaque)`, 'buff');
          target.useSecondaryAction();
          // Execute counter attack (simplified - just damage)
          const counterDamage = target.getWeaponDamage();
          const counterRoll = this.rollD20();
          const counterDodgeThreshold = 1 + entity.getEffectiveEsquive();
          if (counterRoll > counterDodgeThreshold) {
            const rawDamage = counterDamage.base + target.force;
            const finalDamage = Math.max(1, rawDamage - entity.armurePhysique);
            entity.takeDamage(finalDamage, 'Physique', target);
            this.log(`    ${entity.name} subit ${finalDamage} dégâts!`, 'damage');
          } else {
            this.log(`    ${entity.name} esquive la contre-attaque!`, 'movement');
          }
        }
      }
      return;
    }

    // Verifier le critique (utilise le bonus conditionnel de Rage sanglante)
    const effectiveCrit = entity.getEffectiveCoupCritiquePhysique ?
      entity.getEffectiveCoupCritiquePhysique() : entity.coupCritiquePhysique;
    const critThreshold = 20 - effectiveCrit;

    // Berserker: toute attaque physique non esquivée est critique
    const isBerserker = entity.hasAlteration && entity.hasAlteration('Berserker');
    const isCritical = isBerserker || roll >= critThreshold;

    if (isCritical) {
      if (isBerserker) {
        this.log(`  COUP CRITIQUE! (Berserker)`, 'critical');
      } else {
        this.log(`  COUP CRITIQUE! (${roll} >= ${critThreshold})`, 'critical');
      }
      entity.stats.criticals++;
    }

    // Detail des degats physiques
    const weaponBase = weaponDamage.base;
    const forceBonus = entity.force;
    let rawPhysicalDamage = weaponBase + forceBonus;

    this.log(`  Degats bruts: ${weaponBase} (arme) + ${forceBonus} (Force) = ${rawPhysicalDamage}`, 'movement');

    // Bonus "Cri de guerre"
    if (entity.criDeGuerreBonus) {
      rawPhysicalDamage += entity.criDeGuerreBonus;
      this.log(`  +${entity.criDeGuerreBonus} (Cri de guerre) = ${rawPhysicalDamage}`, 'buff');
    }

    // Malus "Cri intimidant" sur l'attaquant
    if (entity.criIntimidantMalus) {
      rawPhysicalDamage = Math.max(1, rawPhysicalDamage - entity.criIntimidantMalus);
      this.log(`  -${entity.criIntimidantMalus} (Cri intimidant) = ${rawPhysicalDamage}`, 'movement');
    }

    // Don "Attaque surpuissante": dégâts doublés
    if (entity.attaqueSurpuissanteActive) {
      rawPhysicalDamage *= 2;
      this.log(`  x2 (Attaque surpuissante) = ${rawPhysicalDamage}`, 'buff');
      entity.attaqueSurpuissanteActive = false;
    }

    // Don "Mécréants": dégâts physiques doublés contre Maléfique
    if (entity.hasDon && entity.hasDon('Mécréants') && target.element === 'Malefique') {
      rawPhysicalDamage *= 2;
      this.log(`  x2 (Mécréants vs Maléfique) = ${rawPhysicalDamage}`, 'buff');
    }

    // Doubler les degats physiques si critique
    if (isCritical) {
      rawPhysicalDamage *= 2;
      this.log(`  x2 (critique) = ${rawPhysicalDamage}`, 'critical');
    }

    // Appliquer l'armure physique (0 si cible en Berserker)
    const armorReduction = target.getEffectiveArmurePhysique();
    const finalPhysicalDamage = Math.max(1, rawPhysicalDamage - armorReduction);

    if (armorReduction > 0) {
      this.log(`  - ${armorReduction} (armure) = ${finalPhysicalDamage} degats finaux`, 'movement');
    }

    // Infliger les degats physiques
    const damageResult = target.takeDamage(finalPhysicalDamage, 'Physique', entity, isCritical);

    if (damageResult.absorbed > 0) {
      this.log(`  ${target.name} perd ${damageResult.absorbed} PV temporaires et ${damageResult.actual} PV.`, 'damage');
    } else {
      this.log(`  ${target.name} perd ${finalPhysicalDamage} PV.`, 'damage');
    }

    // Calculate total damage for animation
    let totalDamage = finalPhysicalDamage;
    let elementalDamageForAnim = 0;
    let elementalTypeForAnim = null;

    // Degats elementaires d'enchantement d'arme
    if (entity.weaponEnchantDamage && entity.weaponEnchantElement) {
      let enchantDamage = entity.weaponEnchantDamage;
      const element = entity.weaponEnchantElement;
      const elemIcon = this.getElementIconHtml(element);

      this.log(`  + Enchantement ${elemIcon}${element}: ${enchantDamage} degats de base`, 'buff');

      // Verifier opposition elementaire (double les degats)
      const isOpposed = CombatEntity.areElementsOpposed(element, target.element);
      if (isOpposed) {
        enchantDamage *= 2;
        this.log(`    x2 (element oppose) = ${enchantDamage}`, 'critical');
      }

      // Reduction si meme element
      if (element === target.element) {
        enchantDamage = Math.floor(enchantDamage / 2);
        this.log(`    /2 (meme element) = ${enchantDamage}`, 'movement');
      }

      // Appliquer l'armure elementaire (0 si cible en Berserker)
      const elementArmor = target.getEffectiveArmureElementaire(element);
      const finalEnchantDamage = Math.max(0, enchantDamage - elementArmor);

      if (elementArmor > 0) {
        this.log(`    - ${elementArmor} (armure ${element}) = ${finalEnchantDamage}`, 'movement');
      }

      if (finalEnchantDamage > 0) {
        target.takeDamage(finalEnchantDamage, element, entity);
        this.log(`  ${target.name} perd ${finalEnchantDamage} PV (${element}).`, 'damage');
        totalDamage += finalEnchantDamage;
        elementalDamageForAnim = finalEnchantDamage;
        elementalTypeForAnim = element;
      }
    }

    // Show animation
    if (this.onActionAnimation) {
      const weaponIconUrl = this.iconManager ? this.iconManager.getItemIcon(weaponName) : null;
      let resultText;
      if (elementalDamageForAnim > 0) {
        // Affichage separé: physique + élémentaire
        resultText = isCritical ? 'Critique!\n' : '';
        resultText += `${finalPhysicalDamage} Physique + ${elementalDamageForAnim} ${elementalTypeForAnim}`;
      } else {
        resultText = isCritical ? `Critique!\n${totalDamage} degats` : `${totalDamage} degats`;
      }
      const resultType = isCritical ? 'critical' : 'damage';
      await this.onActionAnimation(entity, target, weaponIconUrl, weaponName, resultText, resultType);
    }

    // Don "Extraction de mana": regagne mana = niveau après attaque CàC réussie
    if (entity.hasDon && entity.hasDon('Extraction de mana')) {
      const manaGain = entity.niveau || 1;
      entity.recoverMana(manaGain);
      this.log(`  ${entity.name} regagne ${manaGain} mana (Extraction de mana).`, 'buff');
    }

    // Don "Combo": action secondaire sur coup critique physique
    if (isCritical && entity.hasDon && entity.hasDon('Combo') && !entity.hasExtraSecondaryFromCrit) {
      entity.hasExtraSecondaryFromCrit = true;
      if (entity.secondaryActionsRemaining !== undefined) {
        entity.secondaryActionsRemaining++;
      } else {
        entity.hasUsedSecondary = false;
      }
      this.log(`  ${entity.name} gagne une action secondaire (Combo)!`, 'buff');
    }

    // Track last attack for Coup d'épaule
    entity.lastAttackTarget = target;
    entity.lastAttackHit = true;
    entity.lastAttackWasCrit = isCritical;

    // Apply next attack effects from dons
    if (entity.nextAttackEffect) {
      switch (entity.nextAttackEffect) {
        case 'ralenti':
          target.addAlteration('Ralenti', 5);
          this.log(`  ${target.name} est Ralenti pendant 5 tours! (Brise-genou)`, 'damage');
          break;
        case 'poison':
          const poisonLevel = entity.nextAttackPoisonLevel || entity.niveau || 1;
          if (target.resistanceAlterations < poisonLevel) {
            target.addAlteration('Empoisonné', 3, poisonLevel);
            this.log(`  ${target.name} est Empoisonné ${poisonLevel} pendant 3 tours!`, 'damage');
          }
          break;
        case 'aTerre':
          target.addAlteration('A terre', 1);
          this.log(`  ${target.name} est À terre! (Croche-patte)`, 'damage');
          break;
        case 'vulnerable':
          target.addAlteration('Vulnérable', isCritical ? 4 : 2);
          this.log(`  ${target.name} est Vulnérable pendant ${isCritical ? 4 : 2} tours! (Exposer l'armure)`, 'damage');
          break;
      }
      entity.nextAttackEffect = null;
      entity.nextAttackPoisonLevel = null;
    }

    // Charge effect: met à terre
    if (entity.chargeActive) {
      target.addAlteration('A terre', 1);
      this.log(`  ${target.name} est À terre! (Charge)`, 'damage');
      entity.chargeActive = false;
    }

    // Verifier la mort
    if (target.isDead()) {
      this.log(`  ${target.name} est vaincu!`, 'death');
      entity.stats.kills++;

      // Don "Enchaînement Brutal": nouvelle action si tue un ennemi
      if (entity.hasDon && entity.hasDon('Enchaînement Brutal') && !entity.hasExtraActionFromKill) {
        entity.hasExtraActionFromKill = true;
        entity.hasActed = false; // Réinitialise l'action principale
        this.log(`  ${entity.name} peut agir à nouveau (Enchaînement Brutal)!`, 'buff');
      }
    }
  }

  // Executer un sort
  async executeSpell(entity, spell, target) {
    const targetText = entity === target ? 'lui-meme' : target.name;
    const spellIcon = this.getSpellIconHtml(spell);
    const spellName = this.getSpellName(spell);
    const manaCost = this.getSpellManaCost(spell);
    const spellType = this.getSpellType(spell);
    const category = spell.category || spell.categorie;

    this.log(`${entity.name} lance ${spellIcon}${spellName} sur ${targetText}.`, 'spell');

    // Get spell icon URL for animation
    const spellIconUrl = this.iconManager ? this.iconManager.getSpellIcon(spellName, category) : null;

    // Verifier le mana
    if (entity.currentMana < manaCost) {
      this.log(`  Mana insuffisant! ${entity.name} est paralyse.`, 'damage');
      entity.currentMana = 0;
      entity.addAlteration('Paralyse', 2);
      return;
    }

    // Depenser le mana
    entity.spendMana(manaCost);
    entity.stats.spellsCast++;
    this.log(`  Mana: ${entity.currentMana + manaCost} - ${manaCost} = ${entity.currentMana}`, 'movement');

    // Don "Osmose magique": les ennemis à moins de 12m regagnent du mana quand on lance un sort
    for (const other of this.entities) {
      if (other.team !== entity.team && !other.isDead() && other.hasDon && other.hasDon('Osmose magique')) {
        const distance = this.grid.getDistanceMeters(entity.position, other.position);
        if (distance <= 12) {
          const manaGain = other.niveau || 1;
          other.recoverMana(manaGain);
          this.log(`  ${other.name} regagne ${manaGain} mana (Osmose magique)`, 'buff');
        }
      }
    }

    // Pour les buffs/heals, pas besoin de jet sauf pour critique
    if (spellType === 'buff' || spellType === 'healing') {
      const roll = this.rollD20();
      const critThreshold = 20 - entity.coupCritiqueSorts;
      const isCritical = roll >= critThreshold;

      if (isCritical) {
        this.log(`  Jet: ${roll} - CRITIQUE! (>= ${critThreshold})`, 'critical');
        entity.stats.criticals++;
      }

      this.applySpellEffects(spell, entity, target, isCritical);

      // Animation for buff/heal
      if (this.onActionAnimation) {
        const resultText = spellType === 'healing' ? 'Soin!' : 'Buff!';
        await this.onActionAnimation(entity, target, spellIconUrl, spellName, resultText, spellType);
      }
      return;
    }

    // Sorts offensifs: lancer le d20
    const roll = this.rollD20();
    this.log(`  Jet de de: ${roll}`, 'movement');

    // Echec automatique sur 1
    if (roll <= 1) {
      this.log(`  Le sort echoue! (1)`, 'movement');
      // Don "Apprentissage par l'échec": regagne le mana si échec critique
      if (entity.hasDon && entity.hasDon('Apprentissage par l\'échec')) {
        entity.recoverMana(manaCost);
        this.log(`  ${entity.name} regagne ${manaCost} mana (Apprentissage par l'échec).`, 'buff');
      }
      if (this.onActionAnimation) {
        await this.onActionAnimation(entity, target, spellIconUrl, spellName, 'Echec!', 'miss');
      }
      return;
    }

    // Verifier la resistance
    const successCheck = this.spellParser.checkSpellSuccess(spell, entity, target, roll);
    if (!successCheck.success) {
      this.log(`  ${successCheck.reason}`, 'movement');
      // Don "Apprentissage par l'échec": regagne le mana si sort esquivé
      if (entity.hasDon && entity.hasDon('Apprentissage par l\'échec')) {
        entity.recoverMana(manaCost);
        this.log(`  ${entity.name} regagne ${manaCost} mana (Apprentissage par l'échec).`, 'buff');
      }
      if (this.onActionAnimation) {
        await this.onActionAnimation(entity, target, spellIconUrl, spellName, 'Resiste!', 'dodge');
      }
      return;
    }

    // Verifier le critique
    const criticalCheck = this.spellParser.checkSpellCritical(spell, entity, target, roll);
    const isCritical = criticalCheck.isCritical;

    if (isCritical) {
      this.log(`  EFFET CRITIQUE! (${criticalCheck.reason})`, 'critical');
      entity.stats.criticals++;
    }

    // Store target HP before applying effects
    const hpBefore = target.currentHp;

    // Appliquer les effets du sort
    this.applySpellEffects(spell, entity, target, isCritical);

    // Calculate damage dealt for animation
    const damageDealt = Math.max(0, hpBefore - target.currentHp);

    // Show animation
    if (this.onActionAnimation) {
      let resultText, resultType;
      if (damageDealt > 0) {
        resultText = isCritical ? `Critique!\n${damageDealt} degats` : `${damageDealt} degats`;
        resultType = isCritical ? 'critical' : 'damage';
      } else {
        resultText = isCritical ? 'Critique!\nEffet applique!' : 'Effet applique!';
        resultType = isCritical ? 'critical' : 'spell';
      }
      await this.onActionAnimation(entity, target, spellIconUrl, spellName, resultText, resultType);
    }

    // Verifier la mort
    if (target.isDead()) {
      this.log(`  ${target.name} est vaincu!`, 'death');
      entity.stats.kills++;

      // Don "Enchaînement Brutal": nouvelle action si tue un ennemi
      if (entity.hasDon && entity.hasDon('Enchaînement Brutal') && !entity.hasExtraActionFromKill) {
        entity.hasExtraActionFromKill = true;
        entity.hasActed = false;
        this.log(`  ${entity.name} peut agir à nouveau (Enchaînement Brutal)!`, 'buff');
      }
    }
  }

  // Executer l'utilisation d'un objet
  async executeUseItem(entity, consumable) {
    const item = consumable.item;
    const itemName = item.nom;
    const itemIcon = item.image || '';

    this.log(`${entity.name} utilise ${itemName}.`, 'buff');

    // Utiliser l'objet (reduit les charges)
    entity.useConsumable(consumable);

    // Parser et appliquer l'effet
    const effect = this.parseItemEffect(item.effet);

    // Appliquer les effets
    let resultText = 'Utilise!';

    if (effect.heal > 0) {
      let healAmount = effect.heal;
      // Don "Premier soin": +3 + INT/5 aux soins de consommables
      if (entity.hasDon && entity.hasDon('Premier soin')) {
        const bonusHeal = 3 + Math.floor(entity.intelligence / 5);
        healAmount += bonusHeal;
        this.log(`  Premier soin: +${bonusHeal} soins bonus`, 'buff');
      }
      const healed = entity.heal(healAmount);
      this.log(`  ${entity.name} recupere ${healed} PV.`, 'heal');
      resultText = `+${healed} PV`;
    }

    if (effect.mana > 0) {
      entity.recoverMana(effect.mana);
      this.log(`  ${entity.name} recupere ${effect.mana} Mana.`, 'buff');
      resultText = `+${effect.mana} Mana`;
    }

    if (effect.tempHp > 0) {
      const gained = entity.addTempHp(effect.tempHp);
      this.log(`  ${entity.name} gagne ${gained} PV temporaires.`, 'buff');
      resultText = `+${gained} PV temp`;
    }

    if (effect.damage > 0) {
      // Pour les objets offensifs (rares), on pourrait cibler un ennemi
      this.log(`  L'objet a un effet de degats (${effect.damage}).`, 'damage');
    }

    if (effect.removeAlteration) {
      entity.removeAlteration(effect.removeAlteration);
      this.log(`  ${entity.name} n'est plus ${effect.removeAlteration}.`, 'buff');
      resultText = `Soigne ${effect.removeAlteration}`;
    }

    if (effect.bonusDamage > 0) {
      // Buff de degats pour la prochaine attaque
      entity.applyBuff('bonusDamage', effect.bonusDamage);
      this.log(`  Prochaine attaque: +${effect.bonusDamage} degats.`, 'buff');
      resultText = `+${effect.bonusDamage} degats`;
    }

    // Animation
    if (this.onActionAnimation) {
      await this.onActionAnimation(entity, entity, itemIcon, itemName, resultText, 'buff');
    }
  }

  // Parser l'effet d'un objet
  parseItemEffect(effet) {
    if (!effet) return {};

    const result = {
      heal: 0,
      mana: 0,
      tempHp: 0,
      damage: 0,
      bonusDamage: 0,
      removeAlteration: null
    };

    // Nettoyer le HTML
    const cleanEffet = effet.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

    // Soins PV: "Rend X points de vie" ou "Rend X PV"
    const healMatch = cleanEffet.match(/Rend\s+(\d+)\s*(?:points?\s*de\s*vie|PV)/i);
    if (healMatch) {
      result.heal = parseInt(healMatch[1]);
    }

    // Restaure PV
    const restoreHpMatch = cleanEffet.match(/Restaure\s+(\d+)\s*(?:points?\s*de\s*vie|PV)/i);
    if (restoreHpMatch) {
      result.heal = parseInt(restoreHpMatch[1]);
    }

    // Soins Mana: "Restaure X mana" ou "Rend X mana"
    const manaMatch = cleanEffet.match(/(?:Restaure|Rend)\s+(\d+)\s*(?:points?\s*de\s*)?[Mm]ana/i);
    if (manaMatch) {
      result.mana = parseInt(manaMatch[1]);
    }

    // PV temporaires
    const tempHpMatch = cleanEffet.match(/(\d+)\s*(?:points?\s*de\s*vie\s*)?temporaires?/i);
    if (tempHpMatch) {
      result.tempHp = parseInt(tempHpMatch[1]);
    }

    // Bonus degats: "+X dégâts"
    const bonusDamageMatch = cleanEffet.match(/\+\s*(\d+)\s*d[ée]g[âa]ts/i);
    if (bonusDamageMatch) {
      result.bonusDamage = parseInt(bonusDamageMatch[1]);
    }

    // Guerit poison
    if (/gu[ée]rit?\s*(?:le\s*)?poison|soigne?\s*(?:le\s*)?poison/i.test(cleanEffet)) {
      result.removeAlteration = 'Empoisonne';
    }

    // Enleve fatigue
    if (/[ée]vite\s*(?:l'[ée]tat\s*)?fatigu[ée]|enl[èe]ve\s*(?:l'[ée]tat\s*)?fatigu[ée]/i.test(cleanEffet)) {
      result.removeAlteration = 'Fatigue';
    }

    return result;
  }

  // Appliquer les effets d'un sort
  applySpellEffects(spell, caster, target, isCritical) {
    const effect = isCritical && spell.criticalEffect ? spell.criticalEffect : spell.effect;
    if (!effect) {
      this.log(`  (Effet du sort non implemente)`, 'movement');
      return;
    }

    // Debug log pour tracer les effets
    console.log('applySpellEffects:', {
      spellName: spell.name || spell.nom,
      hasEffect: !!effect,
      effectKeys: effect ? Object.keys(effect) : [],
      casterMovement: effect?.casterMovement,
      raw: effect?.raw?.substring(0, 100)
    });

    let hasEffect = false;

    // Degats
    if (effect.damage) {
      hasEffect = true;
      const baseDamage = effect.damage.base;
      const spellPower = caster.puissanceSorts;
      let rawDamage = baseDamage + spellPower;
      const element = effect.damage.element;

      this.log(`  Degats bruts: ${baseDamage} (sort) + ${spellPower} (Puiss.Sorts) = ${rawDamage}`, 'movement');

      // Don "Puissance monocible": +niveau sort pour sorts esquivables
      const spellLevel = spell.level || 1;
      if (caster.hasDon && caster.hasDon('Puissance monocible') && spell.resistance?.type === 'esquive') {
        rawDamage += spellLevel;
        this.log(`  +${spellLevel} (Puissance monocible) = ${rawDamage}`, 'buff');
      }

      // Bonus critique pour sorts
      if (isCritical) {
        const critBonus = Math.floor(rawDamage * 0.5);
        rawDamage += critBonus;
        this.log(`  +${critBonus} (critique) = ${rawDamage}`, 'critical');
      }

      // Reduction element meme que la cible
      if (element === target.element) {
        const reduction = Math.floor(rawDamage / 2);
        rawDamage = rawDamage - reduction;
        this.log(`  -${reduction} (meme element ${element}) = ${rawDamage}`, 'movement');
      }

      // Bonus element oppose
      if (CombatEntity.areElementsOpposed(element, target.element)) {
        rawDamage *= 2;
        this.log(`  x2 (element oppose) = ${rawDamage}`, 'critical');
      }

      // Appliquer l'armure elementaire (0 si cible en Berserker)
      const armor = target.getEffectiveArmureElementaire(element);
      const finalDamage = Math.max(1, rawDamage - armor);

      if (armor > 0) {
        this.log(`  - ${armor} (armure ${element}) = ${finalDamage}`, 'movement');
      }

      const damageResult = target.takeDamage(finalDamage, element, caster);

      if (damageResult.absorbed > 0) {
        this.log(`  ${target.name} perd ${damageResult.absorbed} PV temp. et ${damageResult.actual} PV.`, 'damage');
      } else {
        this.log(`  ${target.name} perd ${finalDamage} PV.`, 'damage');
      }
    }

    // PV temporaires
    if (effect.tempHp) {
      hasEffect = true;
      const baseTempHp = effect.tempHp.base;
      const spellPower = effect.tempHp.scaling === 'puissanceSorts' ? caster.puissanceSorts : 0;
      const rawTempHp = baseTempHp + spellPower;

      this.log(`  PV temp: ${baseTempHp} (sort) + ${spellPower} (Puiss.Sorts) = ${rawTempHp}`, 'movement');

      const actualGained = target.addTempHp(rawTempHp);

      if (actualGained < rawTempHp) {
        this.log(`  ${target.name} gagne ${actualGained} PV temporaires (plafond: ${target.maxHp}).`, 'heal');
      } else {
        this.log(`  ${target.name} gagne ${actualGained} PV temporaires (total: ${target.tempHp}).`, 'heal');
      }
    }

    // Buffs
    if (effect.buff) {
      hasEffect = true;
      const baseValue = effect.buff.base;
      const spellPower = effect.buff.scaling === 'puissanceSorts' ? caster.puissanceSorts : 0;
      const value = baseValue + spellPower;

      this.log(`  Calcul: ${baseValue} (base) + ${spellPower} (Puiss.Sorts) = +${value}`, 'movement');

      const buffType = effect.buff.type;
      const oldValue = this.getStatValue(target, buffType);
      const applied = target.applyBuff(buffType, value);

      if (applied) {
        const newValue = this.getStatValue(target, buffType);
        // Message selon le type de buff
        switch (buffType) {
          case 'weaponEnchant':
            const element = effect.buff.element || 'Lumiere';
            this.log(`  L'arme de ${target.name} inflige +${value} degats ${element} par attaque!`, 'buff');
            // Stocker l'element pour les attaques
            target.weaponEnchantElement = element;
            target.weaponEnchantDamage = value;
            break;
          case 'armurePhysique':
            this.log(`  Armure physique de ${target.name}: ${oldValue} -> ${newValue}`, 'buff');
            break;
          case 'puissanceSorts':
            this.log(`  Puissance sorts de ${target.name}: ${oldValue} -> ${newValue}`, 'buff');
            break;
          case 'force':
            this.log(`  Force de ${target.name}: ${oldValue} -> ${newValue}`, 'buff');
            break;
          case 'resistanceAlterations':
            this.log(`  Resistance alterations de ${target.name}: ${oldValue} -> ${newValue}`, 'buff');
            break;
          case 'acceleration':
            this.log(`  Vitesse de ${target.name}: +${value}m ce tour`, 'buff');
            break;
          default:
            this.log(`  ${target.name} gagne +${value} ${buffType}.`, 'buff');
        }
      } else {
        this.log(`  ${buffType} deja actif sur ${target.name} (non-cumulable, ignore).`, 'movement');
      }
    }

    // Alterations
    if (effect.alteration) {
      hasEffect = true;
      // Verifier la resistance
      if (caster.puissanceSorts > target.resistanceAlterations || spell.resistance.type !== 'alteration') {
        target.addAlteration(effect.alteration.name, effect.alteration.duration);
        this.log(`  ${target.name} est ${effect.alteration.name} pendant ${effect.alteration.duration} tours!`, 'damage');
        this.log(`  (Puiss.Sorts ${caster.puissanceSorts} > Resist.Alt ${target.resistanceAlterations})`, 'movement');
      } else {
        this.log(`  ${target.name} resiste! (Puiss.Sorts ${caster.puissanceSorts} <= Resist.Alt ${target.resistanceAlterations})`, 'movement');
      }
    }

    // Mouvement (repousser)
    if (effect.movement && effect.movement.type === 'push') {
      hasEffect = true;
      // Calculer la direction
      const dx = target.position.x - caster.position.x;
      const dy = target.position.y - caster.position.y;
      const dist = Math.max(Math.abs(dx), Math.abs(dy)) || 1;
      const pushCells = this.grid.metersToCell(effect.movement.distance);

      const newX = target.position.x + Math.round(dx / dist) * pushCells;
      const newY = target.position.y + Math.round(dy / dist) * pushCells;

      // Trouver la case la plus proche valide
      let finalX = target.position.x;
      let finalY = target.position.y;

      for (let i = 1; i <= pushCells; i++) {
        const testX = target.position.x + Math.round(dx / dist) * i;
        const testY = target.position.y + Math.round(dy / dist) * i;
        if (this.grid.isCellFree(testX, testY)) {
          finalX = testX;
          finalY = testY;
        } else {
          break;
        }
      }

      if (finalX !== target.position.x || finalY !== target.position.y) {
        this.grid.moveEntity(target, finalX, finalY);
        this.log(`  ${target.name} est repousse de ${effect.movement.distance}m.`, 'movement');
      }
    }

    // Mouvement du lanceur vers la cible (Charge des Vents, etc.)
    if (effect.casterMovement && effect.casterMovement.type === 'charge') {
      hasEffect = true;
      // Trouver une case adjacente a la cible
      const targetX = target.position.x;
      const targetY = target.position.y;
      const adjacentCells = [
        { x: targetX - 1, y: targetY },
        { x: targetX + 1, y: targetY },
        { x: targetX, y: targetY - 1 },
        { x: targetX, y: targetY + 1 },
        { x: targetX - 1, y: targetY - 1 },
        { x: targetX + 1, y: targetY - 1 },
        { x: targetX - 1, y: targetY + 1 },
        { x: targetX + 1, y: targetY + 1 }
      ];

      // Trouver la case libre la plus proche du lanceur
      let bestCell = null;
      let bestDistance = Infinity;

      for (const cell of adjacentCells) {
        if (this.grid.isCellFree(cell.x, cell.y)) {
          const dist = Math.abs(cell.x - caster.position.x) + Math.abs(cell.y - caster.position.y);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestCell = cell;
          }
        }
      }

      if (bestCell) {
        const oldPos = { ...caster.position };
        this.grid.moveEntity(caster, bestCell.x, bestCell.y);
        const distance = this.grid.getDistanceMeters(oldPos, bestCell);
        this.log(`  ${caster.name} charge jusqu'a ${target.name} (${distance}m)!`, 'movement');
      } else {
        this.log(`  ${caster.name} ne peut pas atteindre ${target.name} (pas de case libre).`, 'movement');
      }
    }

    // Fallback si aucun effet reconnu
    if (!hasEffect) {
      this.log(`  (Effet "${effect.raw?.substring(0, 50)}..." non implemente)`, 'movement');
    }
  }

  // Verifier si le combat est termine
  checkCombatEnd() {
    const team1Alive = this.entities.filter(e => e.team === 1 && !e.isDead());
    const team2Alive = this.entities.filter(e => e.team === 2 && !e.isDead());

    if (team1Alive.length === 0) {
      this.endCombat(2);
      return true;
    }

    if (team2Alive.length === 0) {
      this.endCombat(1);
      return true;
    }

    return false;
  }

  // Terminer le combat
  endCombat(winningTeam) {
    this.isRunning = false;
    this.log(`=== COMBAT TERMINE ===`, 'turn');
    this.log(`Equipe ${winningTeam} victorieuse!`, 'turn');

    if (this.onCombatEnd) {
      this.onCombatEnd({
        winner: winningTeam,
        rounds: this.roundNumber,
        survivors: this.entities.filter(e => e.team === winningTeam && !e.isDead()),
        stats: this.getCombatStats()
      });
    }
  }

  // Obtenir les statistiques du combat
  getCombatStats() {
    const stats = {
      rounds: this.roundNumber,
      totalDamage: 0,
      totalHealing: 0,
      totalSpells: 0,
      totalCriticals: 0,
      team1Stats: { damage: 0, kills: 0 },
      team2Stats: { damage: 0, kills: 0 }
    };

    for (const entity of this.entities) {
      stats.totalDamage += entity.stats.damageDealt;
      stats.totalHealing += entity.stats.healingDone;
      stats.totalSpells += entity.stats.spellsCast;
      stats.totalCriticals += entity.stats.criticals;

      if (entity.team === 1) {
        stats.team1Stats.damage += entity.stats.damageDealt;
        stats.team1Stats.kills += entity.stats.kills;
      } else {
        stats.team2Stats.damage += entity.stats.damageDealt;
        stats.team2Stats.kills += entity.stats.kills;
      }
    }

    return stats;
  }

  // Mode automatique
  async startAutoMode() {
    this.autoMode = true;
    this.isPaused = false;

    while (this.isRunning && this.autoMode && !this.isPaused) {
      const entity = this.getCurrentEntity();
      if (entity) {
        await this.executeEntityTurn(entity);
      }
      await this.delay(100);
    }
  }

  stopAutoMode() {
    this.autoMode = false;
  }

  pauseAutoMode() {
    this.isPaused = true;
  }

  resumeAutoMode() {
    this.isPaused = false;
    if (this.autoMode) {
      this.startAutoMode();
    }
  }

  // Obtenir la valeur d'une stat pour le log
  getStatValue(entity, statType) {
    switch (statType) {
      case 'armurePhysique': return entity.armurePhysique;
      case 'puissanceSorts': return entity.puissanceSorts;
      case 'force': return entity.force;
      case 'resistanceAlterations': return entity.resistanceAlterations;
      case 'coupCritique': return entity.coupCritiquePhysique;
      default: return 0;
    }
  }

  // Utilitaires
  rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }

  // Helper to get spell name (supports both parsed and raw formats)
  getSpellName(spell) {
    return spell.name || spell.nom || 'Sort inconnu';
  }

  // Helper to get spell mana cost
  getSpellManaCost(spell) {
    if (spell.manaCost !== undefined) return spell.manaCost;
    if (spell.coutMana) {
      const match = spell.coutMana.toString().match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  // Helper to get spell range
  getSpellRange(spell) {
    if (spell.range !== undefined) return spell.range;
    if (spell.portee) {
      const match = spell.portee.toString().match(/(\d+)\s*m/i);
      return match ? parseInt(match[1]) : 9;
    }
    return 9;
  }

  // Helper to get spell type
  getSpellType(spell) {
    // If spell has a parsed type, use it
    if (spell.type && spell.type !== 'other') {
      return spell.type;
    }
    // Otherwise, try to determine type from raw data using parser
    if (this.spellParser && (spell.nom || spell.effetNormal)) {
      return this.spellParser.determineSpellType(spell);
    }
    return spell.type || 'other';
  }

  // Creer une icone HTML pour les logs
  getIconHtml(url, alt = '', size = 20) {
    if (!url) return '';
    return `<img src="${url}" alt="${alt}" class="log-icon" style="width:${size}px;height:${size}px;vertical-align:middle;margin-right:4px;border-radius:3px;object-fit:cover;" onerror="this.style.display='none'">`;
  }

  // Obtenir l'icone d'une arme
  getWeaponIconHtml(weapon) {
    if (!this.iconManager || !weapon) return '';
    const url = this.iconManager.getItemIcon(weapon.nom);
    return this.getIconHtml(url, weapon.nom);
  }

  // Obtenir l'icone d'un sort
  getSpellIconHtml(spell) {
    if (!this.iconManager || !spell) return '';
    const spellName = this.getSpellName(spell);
    const category = spell.category || spell.categorie;
    const url = this.iconManager.getSpellIcon(spellName, category);
    return this.getIconHtml(url, spellName);
  }

  // Obtenir l'icone d'un element
  getElementIconHtml(element, size = 16) {
    if (!this.iconManager || !element) return '';
    const url = this.iconManager.getElementIcon(element);
    return this.getIconHtml(url, element, size);
  }

  // Obtenir l'icone d'une entite (hero ou monstre)
  getEntityIconHtml(entity, size = 20) {
    if (!this.iconManager || !entity) return '';

    let url = null;
    if (entity.type === 'hero' && entity.classe && entity.sousClasse) {
      url = this.iconManager.getSubclassIcon(entity.classe, entity.sousClasse);
    } else if (entity.type === 'monster') {
      const baseName = entity.name.replace(/\s+\d+$/, '');
      url = this.iconManager.getMonsterIcon(baseName);
    }

    return this.getIconHtml(url, entity.name, size);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, type = 'info') {
    const entry = { message, type, timestamp: Date.now() };
    this.combatLog.push(entry);

    if (this.onLogUpdate) {
      this.onLogUpdate(entry);
    }

    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  updateState() {
    if (this.onStateUpdate) {
      this.onStateUpdate({
        currentEntity: this.getCurrentEntity(),
        roundNumber: this.roundNumber,
        entities: this.entities,
        isRunning: this.isRunning
      });
    }
  }

  // Start combat in manual mode
  async startManualCombat() {
    if (!this.isRunning) return;
    this.autoMode = false;
    await this.processNextTurn();
  }

  // Reinitialiser
  reset() {
    this.entities = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.roundNumber = 1;
    this.isRunning = false;
    this.isPaused = false;
    this.autoMode = false;
    this.awaitingPlayerInput = false;
    this.playerControlledTeams = [1, 2]; // Reset to both teams player-controlled
    this.selectedAction = null;
    this.selectedSpell = null;
    this.combatLog = [];
  }
}

window.CombatEngine = CombatEngine;
