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

    this.combatLog = [];
    this.onLogUpdate = null;
    this.onStateUpdate = null;
    this.onCombatEnd = null;
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

  // Executer le tour d'une entite (IA)
  async executeEntityTurn(entity) {
    if (!entity || entity.isDead() || !entity.canAct()) {
      this.nextTurn();
      return;
    }

    const entityIcon = this.getEntityIconHtml(entity, 24);
    this.log(`>> Tour de ${entityIcon}${entity.name}`, 'turn');

    // L'IA decide des actions
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

  // Executer une action
  async executeAction(entity, action) {
    switch (action.type) {
      case 'move':
        this.executeMove(entity, action.target);
        break;

      case 'attack':
        this.executeMeleeAttack(entity, action.target);
        break;

      case 'spell':
        this.executeSpell(entity, action.spell, action.target);
        break;

      case 'skip':
      case 'wait':
        this.log(`${entity.name} attend.`, 'movement');
        break;
    }

    entity.hasActed = true;
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
  executeMeleeAttack(entity, target) {
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
      return;
    }

    // Verifier le critique
    const critThreshold = 20 - entity.coupCritiquePhysique;
    const isCritical = roll >= critThreshold;

    if (isCritical) {
      this.log(`  COUP CRITIQUE! (${roll} >= ${critThreshold})`, 'critical');
      entity.stats.criticals++;
    }

    // Detail des degats physiques
    const weaponBase = weaponDamage.base;
    const forceBonus = entity.force;
    let rawPhysicalDamage = weaponBase + forceBonus;

    this.log(`  Degats bruts: ${weaponBase} (arme) + ${forceBonus} (Force) = ${rawPhysicalDamage}`, 'movement');

    // Doubler les degats physiques si critique
    if (isCritical) {
      rawPhysicalDamage *= 2;
      this.log(`  x2 (critique) = ${rawPhysicalDamage}`, 'critical');
    }

    // Appliquer l'armure physique
    const armorReduction = target.armurePhysique;
    const finalPhysicalDamage = Math.max(1, rawPhysicalDamage - armorReduction);

    if (armorReduction > 0) {
      this.log(`  - ${armorReduction} (armure) = ${finalPhysicalDamage} degats finaux`, 'movement');
    }

    // Infliger les degats physiques
    const damageResult = target.takeDamage(finalPhysicalDamage, 'Physique', entity);

    if (damageResult.absorbed > 0) {
      this.log(`  ${target.name} perd ${damageResult.absorbed} PV temporaires et ${damageResult.actual} PV.`, 'damage');
    } else {
      this.log(`  ${target.name} perd ${finalPhysicalDamage} PV.`, 'damage');
    }

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

      // Appliquer l'armure elementaire
      const elementArmor = target.armureElementaire[element] || 0;
      const finalEnchantDamage = Math.max(0, enchantDamage - elementArmor);

      if (elementArmor > 0) {
        this.log(`    - ${elementArmor} (armure ${element}) = ${finalEnchantDamage}`, 'movement');
      }

      if (finalEnchantDamage > 0) {
        target.takeDamage(finalEnchantDamage, element, entity);
        this.log(`  ${target.name} perd ${finalEnchantDamage} PV (${element}).`, 'damage');
      }
    }

    // Verifier la mort
    if (target.isDead()) {
      this.log(`  ${target.name} est vaincu!`, 'death');
      entity.stats.kills++;
    }
  }

  // Executer un sort
  executeSpell(entity, spell, target) {
    const targetText = entity === target ? 'lui-meme' : target.name;
    const spellIcon = this.getSpellIconHtml(spell);
    this.log(`${entity.name} lance ${spellIcon}${spell.name} sur ${targetText}.`, 'spell');

    // Verifier le mana
    if (entity.currentMana < spell.manaCost) {
      this.log(`  Mana insuffisant! ${entity.name} est paralyse.`, 'damage');
      entity.currentMana = 0;
      entity.addAlteration('Paralyse', 2);
      return;
    }

    // Depenser le mana
    entity.spendMana(spell.manaCost);
    entity.stats.spellsCast++;
    this.log(`  Mana: ${entity.currentMana + spell.manaCost} - ${spell.manaCost} = ${entity.currentMana}`, 'movement');

    // Pour les buffs/heals, pas besoin de jet sauf pour critique
    if (spell.type === 'buff' || spell.type === 'healing') {
      const roll = this.rollD20();
      const critThreshold = 20 - entity.coupCritiqueSorts;
      const isCritical = roll >= critThreshold;

      if (isCritical) {
        this.log(`  Jet: ${roll} - CRITIQUE! (>= ${critThreshold})`, 'critical');
        entity.stats.criticals++;
      }

      this.applySpellEffects(spell, entity, target, isCritical);
      return;
    }

    // Sorts offensifs: lancer le d20
    const roll = this.rollD20();
    this.log(`  Jet de de: ${roll}`, 'movement');

    // Echec automatique sur 1
    if (roll <= 1) {
      this.log(`  Le sort echoue! (1)`, 'movement');
      return;
    }

    // Verifier la resistance
    const successCheck = this.spellParser.checkSpellSuccess(spell, entity, target, roll);
    if (!successCheck.success) {
      this.log(`  ${successCheck.reason}`, 'movement');
      return;
    }

    // Verifier le critique
    const criticalCheck = this.spellParser.checkSpellCritical(spell, entity, target, roll);
    const isCritical = criticalCheck.isCritical;

    if (isCritical) {
      this.log(`  EFFET CRITIQUE! (${criticalCheck.reason})`, 'critical');
      entity.stats.criticals++;
    }

    // Appliquer les effets du sort
    this.applySpellEffects(spell, entity, target, isCritical);

    // Verifier la mort
    if (target.isDead()) {
      this.log(`  ${target.name} est vaincu!`, 'death');
      entity.stats.kills++;
    }
  }

  // Appliquer les effets d'un sort
  applySpellEffects(spell, caster, target, isCritical) {
    const effect = isCritical && spell.criticalEffect ? spell.criticalEffect : spell.effect;
    if (!effect) {
      this.log(`  (Effet du sort non implemente)`, 'movement');
      return;
    }

    let hasEffect = false;

    // Degats
    if (effect.damage) {
      hasEffect = true;
      const baseDamage = effect.damage.base;
      const spellPower = caster.puissanceSorts;
      let rawDamage = baseDamage + spellPower;
      const element = effect.damage.element;

      this.log(`  Degats bruts: ${baseDamage} (sort) + ${spellPower} (Puiss.Sorts) = ${rawDamage}`, 'movement');

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

      // Appliquer l'armure elementaire
      const armor = target.armureElementaire[element] || 0;
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
    const url = this.iconManager.getSpellIcon(spell.name, spell.category);
    return this.getIconHtml(url, spell.name);
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

  // Reinitialiser
  reset() {
    this.entities = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.roundNumber = 1;
    this.isRunning = false;
    this.isPaused = false;
    this.autoMode = false;
    this.combatLog = [];
  }
}

window.CombatEngine = CombatEngine;
