/**
 * CombatAI.js
 * Systeme d'intelligence artificielle pour les decisions de combat
 */

class CombatAI {
  constructor(grid, spellParser) {
    this.grid = grid;
    this.spellParser = spellParser;
  }

  // Decider de l'action pour une entite
  decideAction(entity, allEntities) {
    const enemies = allEntities.filter(e => e.team !== entity.team && !e.isDead());
    const allies = allEntities.filter(e => e.team === entity.team && !e.isDead() && e !== entity);

    if (enemies.length === 0) {
      return { type: 'wait', reason: 'Pas d\'ennemis' };
    }

    // Verifier si l'entite peut agir
    if (!entity.canAct()) {
      return { type: 'skip', reason: 'Ne peut pas agir' };
    }

    // Priorite 1: Si en danger critique, essayer de se soigner (heros seulement fuient)
    if (this.isInCriticalDanger(entity)) {
      const healAction = this.findHealingAction(entity, allies);
      if (healAction) return healAction;

      // Seuls les heros peuvent fuir, pas les monstres
      if (entity.type === 'hero' && entity.canMove()) {
        const fleeAction = this.findFleeAction(entity, enemies);
        if (fleeAction) return fleeAction;
      }
    }

    // Priorite 2: Utiliser un sort offensif si possible
    if (entity.spells && entity.spells.length > 0 && entity.canCastSpell()) {
      const spellAction = this.findBestSpellAction(entity, enemies, allies);
      if (spellAction) return spellAction;
    }

    // Priorite 3: Attaque au corps a corps
    const meleeAction = this.findMeleeAction(entity, enemies);
    if (meleeAction) return meleeAction;

    // Priorite 4: Se deplacer vers l'ennemi le plus proche
    if (entity.canMove()) {
      const moveAction = this.findMoveTowardEnemy(entity, enemies);
      if (moveAction) return moveAction;
    }

    return { type: 'wait', reason: 'Aucune action possible' };
  }

  // Verifier si l'entite est en danger critique
  isInCriticalDanger(entity) {
    const hpPercent = entity.currentHp / entity.maxHp;
    return hpPercent < 0.25;
  }

  // Trouver une action de soin (pour soi ou allie en danger)
  findHealingAction(entity, allies) {
    if (!entity.spells || entity.spells.length === 0) return null;
    if (!entity.canCastSpell()) return null;

    // Cibles potentielles: soi-meme et allies
    const targets = [entity, ...allies];
    let bestAction = null;
    let bestScore = 0;

    for (const spellData of entity.spells) {
      const spell = this.spellParser.parseSpell(spellData);

      if (spell.type !== 'healing' && spell.type !== 'buff') continue;
      if (spell.manaCost > entity.currentMana) continue;
      if (!spell.effect || !spell.effect.tempHp) continue;

      for (const target of targets) {
        // Verifier la portee
        const canTarget = this.spellParser.canTargetEntity(spell, entity, target, this.grid);
        if (!canTarget.canTarget) continue;

        // Ne pas cibler si deja au max de PV temp
        if (target.tempHp >= target.maxHp) continue;

        // Calculer le score
        let score = 0;
        const hpPercent = target.currentHp / target.maxHp;

        if (hpPercent < 0.3) {
          score = 50; // Tres urgent
        } else if (hpPercent < 0.5) {
          score = 30;
        } else if (hpPercent < 0.75) {
          score = 10;
        }

        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'spell',
            spell: spell,
            target: target,
            reason: target === entity ? 'Soin d\'urgence' : `Soin pour ${target.name}`
          };
        }
      }
    }

    return bestAction;
  }

  // Trouver une action de fuite
  findFleeAction(entity, enemies) {
    if (!entity.canMove()) return null;

    const bestPosition = this.grid.findBestPositionAway(
      entity,
      enemies,
      entity.getMovement()
    );

    if (bestPosition && (bestPosition.x !== entity.position.x || bestPosition.y !== entity.position.y)) {
      return {
        type: 'move',
        target: bestPosition,
        reason: 'Fuite'
      };
    }

    return null;
  }

  // Trouver la meilleure action de sort
  findBestSpellAction(entity, enemies, allies) {
    if (!entity.canCastSpell()) return null;
    if (!entity.spells || entity.spells.length === 0) return null;

    let bestOffensiveAction = null;
    let bestOffensiveScore = 0;

    let bestBuffAction = null;
    let bestBuffScore = 0;

    let bestDebuffAction = null;
    let bestDebuffScore = 0;

    // Evaluer les sorts offensifs sur les ennemis
    for (const enemy of enemies) {
      for (const spellData of entity.spells) {
        const spell = this.spellParser.parseSpell(spellData);

        if (spell.manaCost > entity.currentMana) continue;
        if (spell.type !== 'damage') continue;

        const canTarget = this.spellParser.canTargetEntity(spell, entity, enemy, this.grid);
        if (!canTarget.canTarget) continue;

        let score = this.evaluateOffensiveSpell(spell, entity, enemy);

        if (score > bestOffensiveScore) {
          bestOffensiveScore = score;
          bestOffensiveAction = {
            type: 'spell',
            spell: spell,
            target: enemy,
            reason: 'Attaque magique'
          };
        }
      }
    }

    // Evaluer les debuffs sur les ennemis
    for (const enemy of enemies) {
      for (const spellData of entity.spells) {
        const spell = this.spellParser.parseSpell(spellData);

        if (spell.manaCost > entity.currentMana) continue;
        if (spell.type !== 'debuff') continue;

        const canTarget = this.spellParser.canTargetEntity(spell, entity, enemy, this.grid);
        if (!canTarget.canTarget) continue;

        let score = this.evaluateDebuffSpell(spell, entity, enemy);

        if (score > bestDebuffScore) {
          bestDebuffScore = score;
          bestDebuffAction = {
            type: 'spell',
            spell: spell,
            target: enemy,
            reason: 'Alteration magique'
          };
        }
      }
    }

    // Evaluer les sorts de buff/heal sur allies et soi-meme
    const allAllies = [...allies, entity];
    for (const ally of allAllies) {
      for (const spellData of entity.spells) {
        const spell = this.spellParser.parseSpell(spellData);

        if (spell.manaCost > entity.currentMana) continue;
        if (spell.type !== 'buff' && spell.type !== 'healing') continue;

        const canTarget = this.spellParser.canTargetEntity(spell, entity, ally, this.grid);
        if (!canTarget.canTarget) continue;

        let score = this.evaluateBuffSpell(spell, entity, ally, allAllies);

        if (score > bestBuffScore) {
          bestBuffScore = score;
          bestBuffAction = {
            type: 'spell',
            spell: spell,
            target: ally,
            reason: spell.type === 'healing' ? 'Soin' : 'Amelioration'
          };
        }
      }
    }

    // Decision strategique selon la classe/situation
    const isSupport = this.isSupportClass(entity);
    const isCaster = this.isCaster(entity);

    // Si support (Pretre, Enchanteur), prioriser buffs/debuffs
    if (isSupport) {
      // Prioriser buff si aucun allie n'est buff et score decent
      if (bestBuffScore >= 10) {
        return bestBuffAction;
      }
      // Ensuite debuff
      if (bestDebuffScore >= 12) {
        return bestDebuffAction;
      }
      // Sinon attaque si disponible
      if (bestOffensiveScore > 0) {
        return bestOffensiveAction;
      }
      // Fallback buff meme avec score bas
      if (bestBuffAction) return bestBuffAction;
      if (bestDebuffAction) return bestDebuffAction;
    }

    // Pour les autres casters, equilibrer
    if (isCaster) {
      // Si un allie a besoin de soin urgent
      if (bestBuffScore >= 20) {
        return bestBuffAction;
      }
      // Prioriser attaque sinon
      if (bestOffensiveScore >= bestDebuffScore) {
        return bestOffensiveAction;
      }
      if (bestDebuffAction) return bestDebuffAction;
      if (bestBuffAction) return bestBuffAction;
    }

    // Retourner la meilleure action globale
    if (bestOffensiveScore >= bestBuffScore && bestOffensiveScore >= bestDebuffScore) {
      return bestOffensiveAction;
    }
    if (bestBuffScore >= bestDebuffScore) {
      return bestBuffAction;
    }
    return bestDebuffAction;
  }

  // Verifier si c'est une classe de support
  isSupportClass(entity) {
    if (entity.type === 'hero') {
      const classe = (entity.classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return ['pretre', 'enchanteur'].includes(classe);
    }
    return false;
  }

  // Evaluer un sort offensif
  evaluateOffensiveSpell(spell, caster, target) {
    let score = 0;

    // Degats potentiels
    if (spell.effect && spell.effect.damage) {
      let damage = spell.effect.damage.base;
      if (spell.effect.damage.scaling === 'puissanceSorts') {
        damage += caster.puissanceSorts;
      }

      // Appliquer l'armure elementaire
      const element = spell.effect.damage.element;
      const armor = target.armureElementaire[element] || 0;
      damage = Math.max(1, damage - armor);

      score += damage;

      // Bonus si element oppose (degats doubles)
      if (CombatEntity.areElementsOpposed(element, target.element)) {
        score += damage;
      }

      // Malus si meme element (degats reduits de moitie)
      if (element === target.element) {
        score -= damage / 2;
      }
    }

    // Bonus pour les debuffs
    if (spell.effect && spell.effect.alteration) {
      // Verifier si l'alteration peut passer
      if (caster.puissanceSorts > target.resistanceAlterations) {
        score += 15;
      }
    }

    // Bonus si ca peut tuer la cible
    if (spell.effect && spell.effect.damage) {
      let damage = spell.effect.damage.base + (spell.effect.damage.scaling ? caster.puissanceSorts : 0);
      if (damage >= target.currentHp + target.tempHp) {
        score += 20; // Priorite au kill
      }
    }

    // Malus pour cout mana eleve
    score -= spell.manaCost / 3;

    return score;
  }

  // Evaluer un sort de buff
  evaluateBuffSpell(spell, caster, target, allAllies = []) {
    let score = 0;

    // PV temporaires - tres utile
    if (spell.effect && spell.effect.tempHp) {
      // Ne pas lancer si deja au max de PV temp
      if (target.tempHp >= target.maxHp) {
        return 0; // Deja au plafond
      }

      let tempHp = spell.effect.tempHp.base;
      if (spell.effect.tempHp.scaling === 'puissanceSorts') {
        tempHp += caster.puissanceSorts;
      }

      // Reduire le score si proche du plafond
      const remainingTempHp = target.maxHp - target.tempHp;
      const effectiveTempHp = Math.min(tempHp, remainingTempHp);

      score += effectiveTempHp;

      // Gros bonus si la cible a peu de vie
      const hpPercent = target.currentHp / target.maxHp;
      if (hpPercent < 0.3) {
        score += 25; // Urgent!
      } else if (hpPercent < 0.5) {
        score += 15;
      } else if (hpPercent < 0.75) {
        score += 5;
      }

      // Pas de bonus si PV temp deja hauts
      if (target.tempHp > target.maxHp * 0.5) {
        score -= 10;
      }
    }

    // Buffs
    if (spell.effect && spell.effect.buff) {
      const buffType = spell.effect.buff.type;

      // Verifier si le buff n'est pas deja actif (non-cumulable)
      if (target.activeBuffs[buffType]) {
        return 0; // Ne pas appliquer un buff deja actif
      }

      // Score de base pour un nouveau buff
      score += 15;

      // Calculer la valeur du buff
      let buffValue = spell.effect.buff.base;
      if (spell.effect.buff.scaling === 'puissanceSorts') {
        buffValue += caster.puissanceSorts;
      }

      // Normaliser le nom de classe pour comparaison
      const targetClasse = target.type === 'hero'
        ? (target.classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        : '';

      switch (buffType) {
        case 'armurePhysique':
          score += buffValue * 2;
          // Plus utile pour les tanks en premiere ligne
          if (['guerrier', 'pretre'].includes(targetClasse)) {
            score += 10;
          }
          break;

        case 'weaponEnchant':
          // Enchantement d'arme - tres utile pour les combattants physiques
          score += buffValue * 3;
          if (['guerrier', 'rodeur'].includes(targetClasse)) {
            score += 15;
          }
          // Prioriser les allies qui font des attaques physiques
          if (target.force >= 5) {
            score += 10;
          }
          break;

        case 'puissanceSorts':
          score += buffValue * 2;
          if (['mage', 'enchanteur', 'pretre'].includes(targetClasse)) {
            score += 10;
          }
          break;

        case 'force':
          score += buffValue * 2;
          if (['guerrier', 'rodeur'].includes(targetClasse)) {
            score += 8;
          }
          break;

        case 'resistanceAlterations':
          score += buffValue * 3;
          break;

        case 'acceleration':
          score += 8;
          break;
      }
    }

    // Bonus si c'est le premier tour (buffs en debut de combat)
    // Plus on a d'allies sans buff, plus c'est utile
    const unbuffedAllies = allAllies.filter(a => Object.keys(a.activeBuffs).length === 0).length;
    if (unbuffedAllies > 0) {
      score += unbuffedAllies * 3;
    }

    // Bonus pour cibler un allie plutot que soi-meme (repartir les buffs)
    if (target !== allAllies[allAllies.length - 1]) { // Le dernier est le caster (self)
      score += 5;
    }

    // Malus pour cout mana (mais pas trop severe pour les supports)
    score -= spell.manaCost / 5;

    return score;
  }

  // Evaluer un sort de debuff
  evaluateDebuffSpell(spell, caster, target) {
    let score = 0;

    // Verifier si le debuff peut passer (resistance alterations)
    if (caster.puissanceSorts <= target.resistanceAlterations) {
      return 0; // Peu de chances de reussir
    }

    // Score de base
    score += 15;

    // Bonus selon la puissance relative
    const powerDiff = caster.puissanceSorts - target.resistanceAlterations;
    score += powerDiff * 3;

    // Alterations
    if (spell.effect && spell.effect.alteration) {
      const altName = spell.effect.alteration.name.toLowerCase();
      const duration = spell.effect.alteration.duration;

      score += duration * 5;

      // Bonus selon le type d'alteration
      if (altName.includes('ralenti')) {
        score += 12; // Empeche de fuir/approcher
      }
      if (altName.includes('endormi') || altName.includes('paralyse')) {
        score += 20; // Empeche d'agir
      }
      if (altName.includes('aveugle')) {
        score += 10;
      }
      if (altName.includes('silence')) {
        // Tres utile contre les casters
        const targetClasse = target.type === 'hero'
          ? (target.classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
          : '';
        if (['mage', 'enchanteur', 'pretre'].includes(targetClasse)) {
          score += 25;
        } else {
          score += 5;
        }
      }
      if (altName.includes('entrave') || altName.includes('terre')) {
        score += 15; // Immobilise
      }
    }

    // Bonus si la cible est dangereuse (priorite)
    const dangerClasse = target.type === 'hero'
      ? (target.classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      : '';
    if (['mage', 'guerrier'].includes(dangerClasse)) {
      score += 8;
    }

    // Malus pour cout mana
    score -= spell.manaCost / 4;

    return score;
  }

  // Trouver une action de melee
  findMeleeAction(entity, enemies) {
    const attackRange = entity.getAttackRange();

    // Chercher les ennemis a portee
    const enemiesInRange = this.grid.getEnemiesInRange(entity, attackRange);

    if (enemiesInRange.length === 0) return null;

    // Choisir la meilleure cible
    let bestTarget = null;
    let bestScore = -Infinity;

    for (const { entity: enemy, distance } of enemiesInRange) {
      let score = 0;

      // Priorite aux cibles avec peu de vie
      const hpPercent = enemy.currentHp / enemy.maxHp;
      score += (1 - hpPercent) * 20;

      // Priorite aux casters (menaces)
      if (enemy.type === 'hero' && (enemy.classe === 'Mage' || enemy.classe === 'Enchanteur')) {
        score += 10;
      }

      // Bonus si on peut tuer
      const damage = entity.getWeaponDamage().physical;
      if (damage >= enemy.currentHp + enemy.tempHp) {
        score += 30;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
      }
    }

    if (bestTarget) {
      return {
        type: 'attack',
        target: bestTarget,
        reason: 'Attaque au corps a corps'
      };
    }

    return null;
  }

  // Trouver un deplacement vers l'ennemi
  findMoveTowardEnemy(entity, enemies) {
    if (!entity.canMove()) return null;

    // Trouver l'ennemi le plus proche
    let closestEnemy = null;
    let closestDistance = Infinity;

    for (const enemy of enemies) {
      const distance = this.grid.getDistanceMeters(entity.position, enemy.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    if (!closestEnemy) return null;

    // Deja a portee de melee?
    if (closestDistance <= entity.getAttackRange()) {
      return null; // Pas besoin de bouger
    }

    // Trouver la meilleure position pour se rapprocher
    const bestPosition = this.grid.findBestPositionTowards(
      entity,
      closestEnemy,
      entity.getMovement()
    );

    if (bestPosition && (bestPosition.x !== entity.position.x || bestPosition.y !== entity.position.y)) {
      return {
        type: 'move',
        target: bestPosition,
        reason: 'Approche'
      };
    }

    return null;
  }

  // Decider d'un plan complet pour le tour
  decideTurn(entity, allEntities) {
    const actions = [];

    // Action de mouvement
    if (entity.canMove() && !entity.hasMoved) {
      const moveAction = this.decideMovement(entity, allEntities);
      if (moveAction && moveAction.type === 'move') {
        actions.push(moveAction);
      }
    }

    // Action principale
    if (!entity.hasActed) {
      const mainAction = this.decideAction(entity, allEntities);
      if (mainAction && mainAction.type !== 'wait' && mainAction.type !== 'skip') {
        actions.push(mainAction);
      }
    }

    return actions;
  }

  // Decider du mouvement optimal
  decideMovement(entity, allEntities) {
    const enemies = allEntities.filter(e => e.team !== entity.team && !e.isDead());
    const allies = allEntities.filter(e => e.team === entity.team && !e.isDead() && e !== entity);

    // Si on est un caster hero avec peu de vie, s'eloigner (pas les monstres)
    if (entity.type === 'hero' && this.isCaster(entity) && this.isInCriticalDanger(entity)) {
      return this.findFleeAction(entity, enemies);
    }

    // Si on est un caster, rester a distance mais a portee de sort
    if (this.isCaster(entity)) {
      const bestSpellRange = this.getBestSpellRange(entity);
      if (bestSpellRange > 3) {
        // Trouver une position a distance optimale
        return this.findOptimalCasterPosition(entity, enemies, bestSpellRange);
      }
    }

    // Sinon, se rapprocher de l'ennemi
    return this.findMoveTowardEnemy(entity, enemies);
  }

  isCaster(entity) {
    if (entity.type === 'hero') {
      const classe = (entity.classe || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return ['mage', 'pretre', 'enchanteur'].includes(classe);
    }
    // Pour les monstres, verifier s'ils ont des sorts
    return entity.spells && entity.spells.length > 0;
  }

  getBestSpellRange(entity) {
    if (!entity.spells || entity.spells.length === 0) return 3;

    let maxRange = 3;
    for (const spellData of entity.spells) {
      const spell = this.spellParser.parseSpell(spellData);
      if (spell.range > maxRange && spell.manaCost <= entity.currentMana) {
        maxRange = spell.range;
      }
    }
    return maxRange;
  }

  findOptimalCasterPosition(entity, enemies, optimalRange) {
    const reachable = this.grid.getReachableCells(entity, entity.getMovement());
    let bestCell = null;
    let bestScore = -Infinity;

    for (const cell of reachable) {
      let score = 0;

      for (const enemy of enemies) {
        const distance = this.grid.getDistanceMeters(cell, enemy.position);

        // Score maximal quand on est a portee optimale
        if (distance <= optimalRange && distance >= optimalRange - 3) {
          score += 10;
        } else if (distance < optimalRange - 3) {
          // Trop proche = danger
          score -= 5;
        } else if (distance > optimalRange) {
          // Trop loin = ne peut pas attaquer
          score -= 3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCell = cell;
      }
    }

    if (bestCell && (bestCell.x !== entity.position.x || bestCell.y !== entity.position.y)) {
      return {
        type: 'move',
        target: bestCell,
        reason: 'Positionnement tactique'
      };
    }

    return null;
  }
}

window.CombatAI = CombatAI;
