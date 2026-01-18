/**
 * SpellParser.js
 * Parser pour les sorts et leurs effets
 */

class SpellParser {
  constructor() {
    this.spellCache = new Map();
  }

  // Vider le cache des sorts (utile apres mise a jour du parser)
  clearCache() {
    this.spellCache.clear();
    console.log('SpellParser: Cache vide');
  }

  // Parser un sort depuis les donnees JSON
  parseSpell(spellData) {
    // Si le sort est deja parse (a 'name' au lieu de 'nom'), le retourner tel quel
    if (spellData.name && spellData.effect !== undefined) {
      return spellData;
    }

    if (this.spellCache.has(spellData.nom)) {
      return this.spellCache.get(spellData.nom);
    }

    const spell = {
      name: spellData.nom,
      element: this.normalizeElement(spellData.element),
      category: spellData.category || spellData.categorie || 'Unknown',
      description: spellData.description || '',

      // Prerequis
      requiredLevel: this.parseLevel(spellData.prerequis),

      // Portee
      range: this.parseRange(spellData.portee),

      // Temps d'incantation
      castTime: this.parseCastTime(spellData.tempsIncantation),

      // Cout mana
      manaCost: this.parseManaCost(spellData.coutMana),

      // Resistance
      resistance: this.parseResistance(spellData.resistance),

      // Effets
      effect: this.parseEffect(spellData.effetNormal),
      criticalEffect: this.parseEffect(spellData.effetCritique),

      // Type de sort
      type: this.determineSpellType(spellData),

      // Donnees brutes pour reference
      raw: spellData
    };

    this.spellCache.set(spellData.nom, spell);
    return spell;
  }

  normalizeElement(element) {
    if (!element) return 'Physique';

    const mapping = {
      'feu': 'Feu',
      'eau': 'Eau',
      'terre': 'Terre',
      'air': 'Air',
      'lumière': 'Lumiere',
      'lumiere': 'Lumiere',
      'nuit': 'Nuit',
      'divin': 'Divin',
      'maléfique': 'Malefique',
      'malefique': 'Malefique',
      'variable': 'Variable',
      'physique': 'Physique'
    };

    return mapping[element.toLowerCase()] || 'Physique';
  }

  parseLevel(prerequis) {
    if (!prerequis) return 1;
    const match = prerequis.match(/Niveau\s*(\d+)/i);
    return match ? parseInt(match[1]) : 1;
  }

  parseRange(portee) {
    if (!portee) return 0;
    // Chercher le pattern "Xm" ou "X m"
    const match = portee.match(/(\d+)\s*m/i);
    if (match) return parseInt(match[1]);
    // Si "-" ou rien, c'est personnel
    if (portee.includes('-')) return 0;
    return 3; // Corps a corps par defaut
  }

  parseCastTime(temps) {
    if (!temps) return 1;
    const match = temps.match(/(\d+)\s*tours?/i);
    return match ? parseInt(match[1]) : 1;
  }

  parseManaCost(cout) {
    if (!cout) return 0;
    const match = cout.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  parseResistance(resistance) {
    if (!resistance) return { type: 'none' };

    const result = {
      type: 'none',
      conditions: []
    };

    // Esquive
    if (/esquive/i.test(resistance)) {
      result.type = 'dodge';
    }

    // Resistance alterations
    if (/r[ée]sistance\s*alt[ée]rations/i.test(resistance)) {
      result.type = 'alteration';
    }

    // Element specifique
    if (/element/i.test(resistance)) {
      result.type = 'element';
      // Parser l'element
      const elemMatch = resistance.match(/[ée]l[ée]ment\s+(\w+)/i);
      if (elemMatch) {
        result.conditions.push(this.normalizeElement(elemMatch[1]));
      }
    }

    // Volant
    if (/volant/i.test(resistance)) {
      result.conditions.push('flying');
    }

    // Taille
    if (/taille\s*grand/i.test(resistance)) {
      result.conditions.push('large');
    }

    return result;
  }

  parseEffect(effet) {
    if (!effet) return null;

    // Nettoyer le HTML et les prefixes
    let cleanEffect = effet.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // Retirer les prefixes courants
    cleanEffect = cleanEffect.replace(/^(Coup\s*Critique\s*:?|Effet\s*:?|&nbsp;)\s*/i, '').trim();

    const result = {
      raw: cleanEffect,
      damage: null,
      healing: null,
      tempHp: null,
      buff: null,
      debuff: null,
      alteration: null,
      movement: null,
      special: []
    };

    // Parser les degats - DOIT contenir "dégâts" ou "Inflige"
    // Pattern 1: "Inflige (X + Puiss. Sorts) dégâts de Element"
    const damageMatch1 = cleanEffect.match(/inflige\s*\((\d+)\s*\+\s*Puiss\.?\s*Sorts?\)\s*(?:points?\s*de\s*)?d[ée]g[âa]ts\s*(?:de\s*)?(\w+)?/i);
    if (damageMatch1) {
      result.damage = {
        base: parseInt(damageMatch1[1]),
        scaling: 'puissanceSorts',
        element: damageMatch1[2] ? this.normalizeElement(damageMatch1[2]) : 'Physique'
      };
    }

    // Pattern 2: "(X + Puiss. Sorts) dégâts de Element" (dégâts APRES le nombre)
    if (!result.damage) {
      const damageMatch2 = cleanEffect.match(/\((\d+)\s*\+\s*Puiss\.?\s*Sorts?\)\s*(?:points?\s*de\s*)?d[ée]g[âa]ts\s*(?:de\s*)?(\w+)?/i);
      if (damageMatch2) {
        result.damage = {
          base: parseInt(damageMatch2[1]),
          scaling: 'puissanceSorts',
          element: damageMatch2[2] ? this.normalizeElement(damageMatch2[2]) : 'Physique'
        };
      }
    }

    // Pattern 3: "Les dégâts passent à (X + Puiss. Sorts)" (critique)
    if (!result.damage) {
      const critDamageMatch = cleanEffect.match(/d[ée]g[âa]ts\s*(?:passent|sont)\s*(?:[àa]|de)\s*\((\d+)\s*\+\s*Puiss\.?\s*Sorts?\)/i);
      if (critDamageMatch) {
        result.damage = {
          base: parseInt(critDamageMatch[1]),
          scaling: 'puissanceSorts',
          element: 'Physique'
        };
      }
    }

    // Pattern 4: "Inflige X dégâts" (sans scaling)
    if (!result.damage) {
      const fixedDamageMatch = cleanEffect.match(/inflige\s*(\d+)\s*(?:points?\s*de\s*)?d[ée]g[âa]ts/i);
      if (fixedDamageMatch) {
        result.damage = {
          base: parseInt(fixedDamageMatch[1]),
          scaling: null,
          element: 'Physique'
        };
      }
    }

    // Pattern 5: "subit X dégâts" (sans scaling)
    if (!result.damage) {
      const subitDamageMatch = cleanEffect.match(/subit\s*(\d+)\s*(?:points?\s*de\s*)?d[ée]g[âa]ts/i);
      if (subitDamageMatch) {
        result.damage = {
          base: parseInt(subitDamageMatch[1]),
          scaling: null,
          element: 'Physique'
        };
      }
    }

    // Parser les soins / PV temporaires
    // Format 1: "(X + Puiss. Sorts) points de vie temporaires"
    // Format 2: "passe à (X + Puiss. Sorts) points de vie temporaires" (critique)
    const tempHpMatch = cleanEffect.match(/(?:passe\s*[àa]\s*)?\((\d+)\s*\+\s*Puiss\.?\s*Sorts?\)\s*points?\s*de\s*vie\s*temporaires?/i);
    if (tempHpMatch) {
      result.tempHp = {
        base: parseInt(tempHpMatch[1]),
        scaling: 'puissanceSorts'
      };
    }

    // Pattern: X points de vie temporaires (sans scaling)
    if (!result.tempHp) {
      const fixedTempHpMatch = cleanEffect.match(/(?:re[çc]oit\s*(?:[ée]galement\s*)?)?(\d+)\s*points?\s*de\s*vie\s*temporaires?/i);
      if (fixedTempHpMatch) {
        result.tempHp = {
          base: parseInt(fixedTempHpMatch[1]),
          scaling: null
        };
      }
    }

    // Parser les buffs
    // Armure physique - plusieurs formats possibles
    // Format 1: "Augmente l'armure physique de (X + Puiss. Sorts)"
    // Format 2: "L'armure est augmentée de (X + Puiss. Sorts)"
    // Format 3: "L'armure physique est également augmentée de (X + Puiss. Sorts)"
    const armorMatch = cleanEffect.match(/(?:augmente\s*(?:l['']\s*)?armure\s*physique|l['']\s*armure\s*(?:physique\s*)?(?:est\s*)?(?:[ée]galement\s*)?augment[ée]e)\s*de\s*\((\d+)\s*\+\s*Puiss\.?\s*Sorts?\)/i);
    if (armorMatch) {
      result.buff = {
        type: 'armurePhysique',
        base: parseInt(armorMatch[1]),
        scaling: 'puissanceSorts'
      };
    }

    // Vitesse (ex: "La vitesse de déplacement de la cible est augmentée de 3m")
    const speedMatch = cleanEffect.match(/vitesse\s*(?:de\s*d[ée]placement)?(?:\s*de\s*(?:la\s*)?(?:cible|tous\s*les\s*alli[ée]s))?\s*(?:est\s*)?augment[ée]e?\s*de\s*(\d+)\s*m/i);
    if (speedMatch) {
      result.buff = {
        type: 'acceleration',
        base: parseInt(speedMatch[1]),
        scaling: null
      };
    }

    // Puissance sorts
    const spellPowerMatch = cleanEffect.match(/puissance\s*des?\s*sorts?\s*de\s*(\d+)/i);
    if (spellPowerMatch) {
      result.buff = {
        type: 'puissanceSorts',
        base: parseInt(spellPowerMatch[1]),
        scaling: null
      };
    }

    // Enchantement d'arme (Arme de lumière, etc.)
    // "L'arme du X infligera (Y + Puiss. Sorts) dégâts de Element"
    const weaponEnchantMatch = cleanEffect.match(/l'arme\s+(?:du|de)\s+\w+\s+infligera\s*\((\d+)\s*\+\s*Puiss\.?\s*Sorts?\)\s*d[ée]g[âa]ts\s*(?:de\s*)?([\wÀ-ÿ]+)?/i);
    if (weaponEnchantMatch) {
      result.buff = {
        type: 'weaponEnchant',
        base: parseInt(weaponEnchantMatch[1]),
        scaling: 'puissanceSorts',
        element: weaponEnchantMatch[2] ? this.normalizeElement(weaponEnchantMatch[2]) : 'Physique'
      };
      console.log(`  Parsed weaponEnchant: base=${weaponEnchantMatch[1]}, element=${weaponEnchantMatch[2]}`);
    }

    // Force
    const forceMatch = cleanEffect.match(/force\s*de\s*\((\d+)\s*\+\s*Puiss\.?\s*Sorts?\)/i);
    if (forceMatch) {
      result.buff = {
        type: 'force',
        base: parseInt(forceMatch[1]),
        scaling: 'puissanceSorts'
      };
    }

    // Resistance alterations
    // Format 1: "Résistance altérations de (X + Puiss. Sorts)"
    // Format 2: "La Résistance altérations est augmentée de (X + Puiss. Sorts)"
    const resistMatch = cleanEffect.match(/(?:(?:la\s*)?r[ée]sistance\s*alt[ée]rations?\s*(?:est\s*augment[ée]e\s*)?de|augmente\s*(?:la\s*)?r[ée]sistance\s*alt[ée]rations?\s*de)\s*\((\d+)\s*\+\s*Puiss\.?\s*Sorts?\)/i);
    if (resistMatch) {
      result.buff = {
        type: 'resistanceAlterations',
        base: parseInt(resistMatch[1]),
        scaling: 'puissanceSorts'
      };
    }

    // Parser les alterations
    const alterations = [
      { pattern: /ralenti/i, name: 'Ralenti' },
      { pattern: /empoisonn[ée]/i, name: 'Empoisonne' },
      { pattern: /aveugl[ée]/i, name: 'Aveugle' },
      { pattern: /endormi|sommeil/i, name: 'Endormi' },
      { pattern: /paralys[ée]/i, name: 'Paralyse' },
      { pattern: /silence/i, name: 'Silence' },
      { pattern: /confus/i, name: 'Confus' },
      { pattern: /maudit/i, name: 'Maudit' },
      { pattern: /[àa]\s*terre/i, name: 'A terre' },
      { pattern: /entrav[ée]|entoil[ée]|gel[ée]/i, name: 'Entrave' },
      { pattern: /affaibli/i, name: 'Affaibli' },
      { pattern: /vuln[ée]rable/i, name: 'Vulnerable' },
      { pattern: /d[ée]bilit[ée]/i, name: 'Debilite' },
      { pattern: /drain[ée]/i, name: 'Draine' },
      { pattern: /berserker/i, name: 'Berserker' }
    ];

    for (const alt of alterations) {
      if (alt.pattern.test(cleanEffect)) {
        // Chercher la duree
        const durationMatch = cleanEffect.match(new RegExp(alt.pattern.source + '.*?(\\d+)\\s*tours?', 'i'));
        result.alteration = {
          name: alt.name,
          duration: durationMatch ? parseInt(durationMatch[1]) : 1
        };
        break;
      }
    }

    // Parser le mouvement (repousser)
    const pushMatch = cleanEffect.match(/repousse[nt]?\s*(?:la\s*cible\s*)?(?:de\s*)?(\d+)\s*m/i);
    if (pushMatch) {
      result.movement = {
        type: 'push',
        distance: parseInt(pushMatch[1])
      };
    }

    // Parser le mouvement du lanceur vers la cible (Charge des Vents, etc.)
    // "Déplace le héros jusqu'à une cible à portée"
    // Note: L'apostrophe peut être ' (U+0027), ' (U+2019), ` ou autre
    const chargeMatch = cleanEffect.match(/d[ée]place\s+le\s+h[ée]ros\s+jusqu.{0,2}[àa]\s+(?:une\s+)?(?:la\s+)?cible/i);
    if (chargeMatch) {
      result.casterMovement = {
        type: 'charge',
        toTarget: true
      };
      console.log('SpellParser: Detected charge spell effect:', cleanEffect.substring(0, 60));
    }

    return result;
  }

  determineSpellType(spellData) {
    // Nettoyer le HTML et les entites
    const rawEffet = (spellData.effetNormal || '');
    const effet = rawEffet.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
    const nom = (spellData.nom || '').toLowerCase();

    // Debug log
    console.log(`determineSpellType: "${spellData.nom}" effet: "${effet.substring(0, 100)}..."`);

    // Buff detection based on spell name first
    // Common buff spell name patterns
    if (/impr[ée]gnation|b[ée]n[ée]diction|acc[ée]l[ée]ration|protection|renforcement|enchantement|armure\s+de|bouclier|aura|blessing|haste/i.test(nom)) {
      console.log(`  -> buff (name match)`);
      return 'buff';
    }

    // Buffs - sorts qui ameliorent les allies (verifier en premier)
    // "L'arme du X infligera" = buff d'arme, pas degats directs
    if (/l'arme\s+(du|de)\s+\w+\s+infligera/i.test(effet)) {
      console.log(`  -> buff (weapon enchant)`);
      return 'buff';
    }

    // Points de vie temporaires = buff/healing
    if (/vie\s*temporaires?/i.test(effet)) {
      console.log(`  -> buff (temp HP)`);
      return 'buff';
    }

    // Elemental impregnation / buff effects
    if (/impr[èe]gne|imbu[ée]|conf[èe]re|octroie|accorde|prot[èe]ge|renforce/i.test(effet)) {
      console.log(`  -> buff (impregnation/conferral)`);
      return 'buff';
    }

    // Soins et guerisons
    if (/soins?|gu[ée]rison|rend.*vie|enl[èe]ve\s+l'[ée]tat/i.test(effet)) {
      console.log(`  -> healing`);
      return 'healing';
    }

    // Buffs - augmente armure, resistance, vitesse, etc. sur allie
    // Patterns: "augmente la vitesse", "la vitesse est augmentée", "vitesse augmentée"
    if (/(?:augmente|est\s+augment[ée]e?|augment[ée]e?\s+de)\s*.*(armure|r[ée]sistance|initiative|vitesse|esquive|force|puissance)/i.test(effet)) {
      console.log(`  -> buff (augmente stats)`);
      return 'buff';
    }
    if (/(armure|r[ée]sistance|initiative|vitesse|esquive|force|puissance).*(?:augmente|est\s+augment[ée]e?|augment[ée]e?\s+de)/i.test(effet)) {
      console.log(`  -> buff (stats augmente)`);
      return 'buff';
    }

    // Debuffs - alterations negatives sur ennemis
    if (/contracte\s+l'[ée]tat|ralenti|endormi|paralys|silence|confus|maudit|entrav|affaibli|aveugl/i.test(effet)) {
      console.log(`  -> debuff`);
      return 'debuff';
    }

    // Degats directs (Inflige X degats A LA CIBLE)
    if (/inflige\s*\([^)]+\)\s*(?:points?\s*de\s*)?d[ée]g[âa]ts/i.test(effet)) {
      // Mais pas si c'est "l'arme infligera" (buff)
      if (!/l'arme.*infligera/i.test(effet)) {
        console.log(`  -> damage (inflige)`);
        return 'damage';
      }
    }

    // Degats de zone
    if (/d[ée]g[âa]ts.*(?:aux|a\s+tous|autour|devant|zone)/i.test(effet)) {
      console.log(`  -> damage (zone)`);
      return 'damage';
    }

    // Deplacement/utilitaire
    if (/d[ée]place|repousse|t[ée]l[ée]porte|ramen[ée]/i.test(effet)) {
      console.log(`  -> utility`);
      return 'utility';
    }

    // Buff generique - inclut les formes conjuguees
    if (/augment[ée]?e?|am[ée]lior[ée]?e?|gagne|bonus|prot[ée]g[ée]|b[ée]n[ée]ficie/i.test(effet)) {
      console.log(`  -> buff (generic)`);
      return 'buff';
    }

    console.log(`  -> other`);
    return 'other';
  }

  // Calculer les degats d'un sort
  calculateSpellDamage(spell, caster, isCritical = false) {
    const effect = isCritical && spell.criticalEffect ? spell.criticalEffect : spell.effect;

    if (!effect || !effect.damage) return 0;

    let damage = effect.damage.base;

    // Ajouter le scaling
    if (effect.damage.scaling === 'puissanceSorts') {
      damage += caster.puissanceSorts;
    }

    // Doubler si critique pour les sorts de degats
    if (isCritical && spell.type === 'damage') {
      damage = Math.floor(damage * 1.5); // Generalement +50% pour les sorts
    }

    return damage;
  }

  // Calculer les PV temporaires d'un sort
  calculateSpellTempHp(spell, caster, isCritical = false) {
    const effect = isCritical && spell.criticalEffect ? spell.criticalEffect : spell.effect;

    if (!effect || !effect.tempHp) return 0;

    let tempHp = effect.tempHp.base;

    if (effect.tempHp.scaling === 'puissanceSorts') {
      tempHp += caster.puissanceSorts;
    }

    return tempHp;
  }

  // Verifier si un sort peut cibler une entite
  canTargetEntity(spell, caster, target, grid) {
    // Sorts sur soi-meme (portee 0 ou "-")
    if (caster === target) {
      // Les sorts personnels (portee 0) peuvent toujours cibler soi-meme
      // Les sorts avec portee > 0 peuvent aussi cibler soi-meme (distance 0)
      return { canTarget: true, reason: null };
    }

    // Verifier la portee
    const distance = grid.getDistanceMeters(caster.position, target.position);
    if (spell.range > 0 && distance > spell.range) {
      return { canTarget: false, reason: 'Hors de portee' };
    }

    // Sorts personnels (portee 0) ne peuvent pas cibler les autres
    if (spell.range === 0) {
      return { canTarget: false, reason: 'Sort personnel uniquement' };
    }

    // Verifier les conditions de resistance
    const resistance = spell.resistance;

    // Cibles volantes
    if (resistance.conditions.includes('flying') && target.hasAlteration('Volant')) {
      return { canTarget: false, reason: 'Sans effet sur volant' };
    }

    // Cibles grandes
    if (resistance.conditions.includes('large') && target.size === 'large') {
      return { canTarget: false, reason: 'Sans effet sur grande taille' };
    }

    // Element immunise
    if (resistance.conditions.includes(target.element)) {
      return { canTarget: false, reason: `Sans effet sur element ${target.element}` };
    }

    return { canTarget: true, reason: null };
  }

  // Verifier si un sort reussit (apres le jet de de)
  checkSpellSuccess(spell, caster, target, diceRoll) {
    // Les buffs et soins sur allies reussissent toujours (sauf sur 1)
    if (spell.type === 'buff' || spell.type === 'healing') {
      if (diceRoll <= 1) {
        return { success: false, reason: 'Echec automatique (1)' };
      }
      return { success: true, reason: null };
    }

    // 1 = echec automatique
    if (diceRoll <= 1) {
      return { success: false, reason: 'Echec automatique (1)' };
    }

    const resistance = spell.resistance;

    // Esquive (sorts offensifs seulement)
    if (resistance.type === 'dodge') {
      const dodgeThreshold = 1 + target.getEffectiveEsquive();
      if (diceRoll <= dodgeThreshold) {
        return { success: false, reason: `Esquive (${diceRoll} <= ${dodgeThreshold})` };
      }
    }

    // Resistance alterations (debuffs seulement)
    if (resistance.type === 'alteration') {
      if (caster.puissanceSorts <= target.resistanceAlterations) {
        return { success: false, reason: `Resistance alterations (${caster.puissanceSorts} <= ${target.resistanceAlterations})` };
      }
    }

    return { success: true, reason: null };
  }

  // Verifier si le sort est critique
  checkSpellCritical(spell, caster, target, diceRoll) {
    // Critique automatique si element oppose - SEULEMENT pour sorts offensifs
    if (spell.type === 'damage' || spell.type === 'debuff') {
      if (spell.element !== 'Physique' && spell.element !== 'Variable') {
        if (CombatEntity.areElementsOpposed(spell.element, target.element)) {
          return { isCritical: true, reason: 'Element oppose' };
        }
      }
    }

    // Critique sur le de
    const critThreshold = 20 - caster.coupCritiqueSorts;
    if (diceRoll >= critThreshold) {
      return { isCritical: true, reason: `Coup critique (${diceRoll} >= ${critThreshold})` };
    }

    return { isCritical: false, reason: null };
  }

  // Obtenir les sorts offensifs (degats directs)
  getOffensiveSpells(spells) {
    return spells
      .map(s => this.parseSpell(s))
      .filter(s => s.type === 'damage');
  }

  // Obtenir les sorts de debuff (alterations negatives)
  getDebuffSpells(spells) {
    return spells
      .map(s => this.parseSpell(s))
      .filter(s => s.type === 'debuff');
  }

  // Obtenir les sorts de buff (ameliorations)
  getBuffSpells(spells) {
    return spells
      .map(s => this.parseSpell(s))
      .filter(s => s.type === 'buff');
  }

  // Obtenir les sorts de soin
  getHealingSpells(spells) {
    return spells
      .map(s => this.parseSpell(s))
      .filter(s => s.type === 'healing');
  }

  // Obtenir les sorts de support (buff + healing)
  getSupportSpells(spells) {
    return spells
      .map(s => this.parseSpell(s))
      .filter(s => s.type === 'buff' || s.type === 'healing');
  }

  // Obtenir le meilleur sort offensif pour une situation
  getBestOffensiveSpell(caster, target, grid) {
    const offensiveSpells = this.getOffensiveSpells(caster.spells);

    let bestSpell = null;
    let bestScore = -Infinity;

    for (const spell of offensiveSpells) {
      // Verifier si on peut lancer le sort
      if (spell.manaCost > caster.currentMana) continue;

      const canTarget = this.canTargetEntity(spell, caster, target, grid);
      if (!canTarget.canTarget) continue;

      // Calculer un score
      let score = 0;

      // Degats potentiels
      if (spell.effect && spell.effect.damage) {
        const damage = this.calculateSpellDamage(spell, caster);
        score += damage;

        // Bonus si element oppose a la cible
        if (CombatEntity.areElementsOpposed(spell.element, target.element)) {
          score += damage; // Double les degats = double le score
        }
      }

      // Bonus pour les debuffs
      if (spell.effect && spell.effect.alteration) {
        score += 10;
      }

      // Malus pour cout en mana eleve
      score -= spell.manaCost / 2;

      if (score > bestScore) {
        bestScore = score;
        bestSpell = spell;
      }
    }

    return bestSpell;
  }

  // Obtenir le meilleur sort de buff pour un allie
  getBestBuffSpell(caster, target, grid) {
    const buffSpells = this.getBuffSpells(caster.spells);

    let bestSpell = null;
    let bestScore = -Infinity;

    for (const spell of buffSpells) {
      // Verifier si on peut lancer le sort
      if (spell.manaCost > caster.currentMana) continue;

      const canTarget = this.canTargetEntity(spell, caster, target, grid);
      if (!canTarget.canTarget) continue;

      // Calculer un score
      let score = 0;

      // PV temporaires
      if (spell.effect && spell.effect.tempHp) {
        const tempHp = this.calculateSpellTempHp(spell, caster);
        score += tempHp;

        // Bonus si la cible a peu de vie
        const hpPercent = target.currentHp / target.maxHp;
        if (hpPercent < 0.5) {
          score *= 1.5;
        }
      }

      // Buffs
      if (spell.effect && spell.effect.buff) {
        // Verifier si le buff n'est pas deja actif
        if (target.activeBuffs[spell.effect.buff.type]) {
          continue; // Buff non-cumulable deja actif
        }
        score += 15;
      }

      // Malus pour cout en mana eleve
      score -= spell.manaCost / 3;

      if (score > bestScore) {
        bestScore = score;
        bestSpell = spell;
      }
    }

    return bestSpell;
  }
}

window.SpellParser = SpellParser;
