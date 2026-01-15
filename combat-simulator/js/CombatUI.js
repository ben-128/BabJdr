/**
 * CombatUI.js
 * Interface utilisateur du simulateur de combat
 */

class CombatUI {
  constructor() {
    this.grid = null;
    this.engine = null;
    this.heroGenerator = null;
    this.spellParser = null;
    this.iconManager = null;
    this.monstersData = null;

    // Elements DOM
    this.configPanel = document.getElementById('config-panel');
    this.combatArena = document.getElementById('combat-arena');
    this.resultsPanel = document.getElementById('results-panel');
    this.combatLog = document.getElementById('combat-log');
    this.canvas = document.getElementById('combat-grid');

    // Manual combat state
    this.currentAction = null; // 'move', 'attack', 'spell'
    this.selectedSpell = null;
    this.highlightedCells = [];
    this.validTargets = [];
    this.highlightType = 'move'; // 'move', 'target', 'ally'

    // Team hero configuration
    this.teamHeroes = {
      1: [], // Array of CombatEntity for team 1
      2: []  // Array of CombatEntity for team 2
    };
    this.currentEditingTeam = null;
    this.currentEditingHero = null;

    // Bindings
    this.bindEvents();
  }

  async init() {
    try {
      // Charger toutes les donnees
      console.log('Chargement des donnees...');
      const data = await DataLoader.loadAllData();

      this.monstersData = data.monstresData;
      this.classesData = data.classesData;
      this.sortsData = data.sortsData;
      this.donsData = data.donsData;
      this.objetsData = data.objetsData;

      console.log('Donnees chargees:', {
        monstres: this.monstersData.length,
        classes: this.classesData.length
      });

      // Initialiser les composants
      this.spellParser = new SpellParser();
      this.heroGenerator = new HeroGenerator();
      this.heroGenerator.initWithData(data);

      // Initialiser le gestionnaire d'icones
      this.iconManager = new IconManager();
      await this.iconManager.init(data);

      // Populer les selects
      this.populateClassSelects();
      this.populateMonsterSelects();

      // Initialiser la grille
      const gridSize = parseInt(document.getElementById('grid-size').value);
      this.grid = new CombatGrid(gridSize);
      this.grid.setCanvas(this.canvas);
      this.grid.setIconManager(this.iconManager);

      // Initialiser le moteur
      this.engine = new CombatEngine(this.grid, this.spellParser, this.iconManager);
      this.engine.onLogUpdate = (entry) => this.addLogEntry(entry);
      this.engine.onStateUpdate = (state) => this.updateCombatState(state);
      this.engine.onCombatEnd = (result) => this.showResults(result);
      this.engine.onAwaitingInput = (entity) => this.onAwaitingPlayerInput(entity);
      this.engine.onActionAnimation = (attacker, target, actionIcon, actionName, resultText, resultType) =>
        this.showActionAnimation(attacker, target, actionIcon, actionName, resultText, resultType);

      console.log('CombatUI initialise avec succes');
    } catch (error) {
      console.error('Erreur initialisation CombatUI:', error);
      alert('Erreur de chargement. Essayez avec un serveur local (live-server).');
    }
  }

  bindEvents() {
    // Type de team
    document.getElementById('team1-type').addEventListener('change', (e) => {
      this.toggleTeamConfig(1, e.target.value);
    });

    document.getElementById('team2-type').addEventListener('change', (e) => {
      this.toggleTeamConfig(2, e.target.value);
    });

    // Boutons
    document.getElementById('start-combat').addEventListener('click', () => {
      this.startCombat();
    });

    document.getElementById('reset-combat').addEventListener('click', () => {
      this.resetConfig();
    });

    document.getElementById('auto-combat').addEventListener('click', () => {
      this.startAutoCombat();
    });

    document.getElementById('pause-combat').addEventListener('click', () => {
      this.pauseCombat();
    });

    document.getElementById('back-to-config').addEventListener('click', () => {
      this.backToConfig();
    });

    document.getElementById('new-combat').addEventListener('click', () => {
      this.backToConfig();
    });

    document.getElementById('replay-combat').addEventListener('click', () => {
      this.replayCombat();
    });

    // Taille de grille
    document.getElementById('grid-size').addEventListener('change', (e) => {
      const size = parseInt(e.target.value);
      if (this.grid) {
        this.grid.resize(size);
        this.grid.render();
      }
    });

    // Action buttons for manual combat
    document.getElementById('action-move').addEventListener('click', () => {
      this.selectAction('move');
    });

    document.getElementById('action-attack').addEventListener('click', () => {
      this.selectAction('attack');
    });

    document.getElementById('action-spell').addEventListener('click', () => {
      this.selectAction('spell');
    });

    document.getElementById('action-end-turn').addEventListener('click', async () => {
      this.clearActionSelection();
      await this.engine.playerEndTurn();
    });

    document.getElementById('action-auto-turn').addEventListener('click', async () => {
      this.clearActionSelection();
      this.hideActionPanel();
      await this.engine.autoPlayCurrentTurn();
    });

    document.getElementById('cancel-spell').addEventListener('click', () => {
      this.hideSpellPopup();
    });

    document.getElementById('action-item').addEventListener('click', () => {
      this.selectAction('item');
    });

    document.getElementById('cancel-item').addEventListener('click', () => {
      this.hideItemPopup();
    });

    // Hero builder
    document.getElementById('team1-add-hero').addEventListener('click', () => {
      this.showHeroCreatePopup(1);
    });

    document.getElementById('team2-add-hero').addEventListener('click', () => {
      this.showHeroCreatePopup(2);
    });

    document.getElementById('hero-create-confirm').addEventListener('click', () => {
      this.confirmCreateHero();
    });

    document.getElementById('hero-create-cancel').addEventListener('click', () => {
      this.hideHeroCreatePopup();
    });

    document.getElementById('hero-edit-close').addEventListener('click', () => {
      this.hideHeroEditPopup();
    });

    document.getElementById('hero-edit-regenerate').addEventListener('click', () => {
      this.regenerateCurrentHero();
    });

    // Class select change updates subclass options
    document.getElementById('hero-class-select').addEventListener('change', (e) => {
      this.updateSubclassOptions(e.target.value);
    });

    // Equipment editing
    document.getElementById('btn-edit-weapon').addEventListener('click', () => {
      this.showEquipmentSelectPopup('weapon');
    });

    document.getElementById('btn-edit-armor').addEventListener('click', () => {
      this.showEquipmentSelectPopup('armor');
    });

    document.getElementById('btn-edit-offhand').addEventListener('click', () => {
      this.showEquipmentSelectPopup('offhand');
    });

    document.getElementById('btn-add-consumable').addEventListener('click', () => {
      this.showConsumableSelectPopup();
    });

    document.getElementById('equipment-select-cancel').addEventListener('click', () => {
      this.hideEquipmentSelectPopup();
    });

    document.getElementById('consumable-select-cancel').addEventListener('click', () => {
      this.hideConsumableSelectPopup();
    });

    // Equipment search
    document.getElementById('equipment-search').addEventListener('input', (e) => {
      this.filterEquipmentList(e.target.value);
    });

    document.getElementById('consumable-search').addEventListener('input', (e) => {
      this.filterConsumableList(e.target.value);
    });

    // Don editing
    document.getElementById('btn-add-don').addEventListener('click', () => {
      this.showDonSelectPopup();
    });

    document.getElementById('don-select-cancel').addEventListener('click', () => {
      this.hideDonSelectPopup();
    });

    document.getElementById('don-search').addEventListener('input', (e) => {
      this.filterDonList(e.target.value);
    });

    // Carte du destin editing
    document.getElementById('btn-change-carte').addEventListener('click', () => {
      this.showCarteDestinPopup();
    });

    document.getElementById('carte-destin-cancel').addEventListener('click', () => {
      this.hideCarteDestinPopup();
    });

    // Grid click for movement and targeting
    this.canvas.addEventListener('click', (e) => {
      this.handleGridClick(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.handleGridHover(e);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hideTargetInfo();
    });
  }

  toggleTeamConfig(teamNum, type) {
    const heroesConfig = document.getElementById(`team${teamNum}-heroes-config`);
    const monsterConfig = document.getElementById(`team${teamNum}-monster-config`);

    if (type === 'heroes') {
      if (heroesConfig) heroesConfig.style.display = 'block';
      monsterConfig.style.display = 'none';
    } else {
      if (heroesConfig) heroesConfig.style.display = 'none';
      monsterConfig.style.display = 'block';
    }
  }

  populateClassSelects() {
    // Populate hero creation popup class select
    const classSelect = document.getElementById('hero-class-select');
    const classes = this.heroGenerator.getAvailableClasses();

    classSelect.innerHTML = '';
    for (const classe of classes) {
      const option = document.createElement('option');
      option.value = classe.nom;
      option.textContent = classe.nom;
      classSelect.appendChild(option);
    }

    // Initialize subclass options for first class
    if (classes.length > 0) {
      this.updateSubclassOptions(classes[0].nom);
    }
  }

  updateSubclassOptions(className) {
    const subclassSelect = document.getElementById('hero-subclass-select');
    const classes = this.heroGenerator.getAvailableClasses();
    const classe = classes.find(c => c.nom === className);

    subclassSelect.innerHTML = '';
    if (classe) {
      for (const sousClasse of classe.sousClasses) {
        const option = document.createElement('option');
        option.value = sousClasse;
        option.textContent = sousClasse;
        subclassSelect.appendChild(option);
      }
    }
  }

  // ============= HERO BUILDER METHODS =============

  showHeroCreatePopup(teamNum) {
    this.currentEditingTeam = teamNum;
    document.getElementById('hero-create-popup').style.display = 'flex';
  }

  hideHeroCreatePopup() {
    document.getElementById('hero-create-popup').style.display = 'none';
    this.currentEditingTeam = null;
  }

  confirmCreateHero() {
    const className = document.getElementById('hero-class-select').value;
    const subClassName = document.getElementById('hero-subclass-select').value;
    const level = parseInt(document.getElementById('hero-level-input').value);
    const teamNum = this.currentEditingTeam;

    if (!className || !subClassName || !teamNum) return;

    // Generate hero
    const hero = this.heroGenerator.generateHero({
      className,
      subClassName,
      level,
      team: teamNum
    });

    if (hero) {
      this.teamHeroes[teamNum].push(hero);
      this.renderHeroList(teamNum);
    }

    this.hideHeroCreatePopup();
  }

  renderHeroList(teamNum) {
    const listContainer = document.getElementById(`team${teamNum}-heroes-list`);
    listContainer.innerHTML = '';

    for (let i = 0; i < this.teamHeroes[teamNum].length; i++) {
      const hero = this.teamHeroes[teamNum][i];
      const card = this.createHeroConfigCard(hero, teamNum, i);
      listContainer.appendChild(card);
    }
  }

  createHeroConfigCard(hero, teamNum, index) {
    const card = document.createElement('div');
    card.className = 'hero-config-card';

    // Get icon
    const iconUrl = this.iconManager ? this.iconManager.getSubclassIcon(hero.classe, hero.sousClasse) : '';

    card.innerHTML = `
      ${iconUrl ? `<img src="${iconUrl}" class="hero-icon" onerror="this.style.display='none'">` : ''}
      <div class="hero-info">
        <div class="hero-name">${hero.name}</div>
        <div class="hero-class">${hero.classe} - ${hero.sousClasse}</div>
        <div class="hero-level">Niveau ${hero.niveau} | PV: ${hero.maxHp} | Mana: ${hero.maxMana}</div>
      </div>
      <div class="hero-actions">
        <button class="btn-hero-action btn-hero-edit" title="Modifier">✏️</button>
        <button class="btn-hero-action btn-hero-delete" title="Supprimer">🗑️</button>
      </div>
    `;

    // Edit button
    card.querySelector('.btn-hero-edit').addEventListener('click', () => {
      this.showHeroEditPopup(hero, teamNum, index);
    });

    // Delete button
    card.querySelector('.btn-hero-delete').addEventListener('click', () => {
      this.deleteHero(teamNum, index);
    });

    return card;
  }

  deleteHero(teamNum, index) {
    this.teamHeroes[teamNum].splice(index, 1);
    this.renderHeroList(teamNum);
  }

  showHeroEditPopup(hero, teamNum, index) {
    this.currentEditingHero = { hero, teamNum, index };

    // Update title
    document.getElementById('hero-edit-title').textContent = `${hero.name} - ${hero.classe} ${hero.sousClasse}`;

    // Populate info section
    const infoContainer = document.getElementById('hero-edit-info');
    infoContainer.innerHTML = `
      <div class="stat-item"><span class="stat-label">Force</span><span class="stat-value">${hero.force}</span></div>
      <div class="stat-item"><span class="stat-label">Agilite</span><span class="stat-value">${hero.agilite}</span></div>
      <div class="stat-item"><span class="stat-label">Endurance</span><span class="stat-value">${hero.endurance}</span></div>
      <div class="stat-item"><span class="stat-label">Intelligence</span><span class="stat-value">${hero.intelligence}</span></div>
      <div class="stat-item"><span class="stat-label">Volonte</span><span class="stat-value">${hero.volonte}</span></div>
      <div class="stat-item"><span class="stat-label">Chance</span><span class="stat-value">${hero.chance}</span></div>
      <div class="stat-item"><span class="stat-label">Initiative</span><span class="stat-value">${hero.initiative}</span></div>
      <div class="stat-item"><span class="stat-label">Esquive</span><span class="stat-value">${hero.esquive}</span></div>
      <div class="stat-item"><span class="stat-label">Armure</span><span class="stat-value">${hero.armurePhysique}</span></div>
      <div class="stat-item"><span class="stat-label">Puiss. Sorts</span><span class="stat-value">${hero.puissanceSorts}</span></div>
    `;

    // Populate weapon section
    const weaponContainer = document.getElementById('hero-edit-weapon');
    if (hero.weapon) {
      const iconUrl = hero.weapon.image || '';
      weaponContainer.innerHTML = `
        <div class="equip-item">
          ${iconUrl ? `<img src="${iconUrl}" onerror="this.style.display='none'">` : ''}
          <span>${hero.weapon.nom}</span>
        </div>
      `;
    } else {
      weaponContainer.innerHTML = '<div class="no-items">Aucune arme</div>';
    }

    // Populate armor section
    const armorContainer = document.getElementById('hero-edit-armor');
    if (hero.armor) {
      const iconUrl = hero.armor.image || '';
      armorContainer.innerHTML = `
        <div class="equip-item">
          ${iconUrl ? `<img src="${iconUrl}" onerror="this.style.display='none'">` : ''}
          <span>${hero.armor.nom}</span>
        </div>
      `;
    } else {
      armorContainer.innerHTML = '<div class="no-items">Aucune armure</div>';
    }

    // Populate offhand section
    const offhandContainer = document.getElementById('hero-edit-offhand');
    if (hero.offHand) {
      const iconUrl = hero.offHand.image || '';
      offhandContainer.innerHTML = `
        <div class="equip-item">
          ${iconUrl ? `<img src="${iconUrl}" onerror="this.style.display='none'">` : ''}
          <span>${hero.offHand.nom}</span>
        </div>
      `;
    } else {
      offhandContainer.innerHTML = '<div class="no-items">Vide (Bouclier/Catalyseur)</div>';
    }

    // Populate consumables section with remove buttons
    const consumContainer = document.getElementById('hero-edit-consumables');
    consumContainer.innerHTML = '';

    if (hero.consumables && hero.consumables.length > 0) {
      for (let i = 0; i < hero.consumables.length; i++) {
        const cons = hero.consumables[i];
        const iconUrl = cons.item.image || '';
        const itemDiv = document.createElement('div');
        itemDiv.className = 'consumable-item';
        itemDiv.innerHTML = `
          ${iconUrl ? `<img src="${iconUrl}" onerror="this.style.display='none'">` : ''}
          <span>${cons.item.nom}</span>
          <span class="consumable-charges">x${cons.charges}</span>
          <button class="btn-remove-item" data-index="${i}" title="Retirer">×</button>
        `;
        consumContainer.appendChild(itemDiv);
      }

      // Add remove button event listeners
      consumContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.index);
          this.removeConsumableFromHero(idx);
        });
      });
    } else {
      consumContainer.innerHTML = '<div class="no-items">Aucun consommable</div>';
    }

    // Populate dons section with remove buttons
    const donsContainer = document.getElementById('hero-edit-dons');
    donsContainer.innerHTML = '';

    if (hero.dons && hero.dons.length > 0) {
      for (let i = 0; i < hero.dons.length; i++) {
        const don = hero.dons[i];
        const donName = typeof don === 'string' ? don : don.nom;
        const donDiv = document.createElement('div');
        donDiv.className = 'don-item';
        donDiv.innerHTML = `
          <span>${donName}</span>
          <button class="btn-remove-item" data-index="${i}" title="Retirer">×</button>
        `;
        donsContainer.appendChild(donDiv);
      }
      // Add remove button event listeners
      donsContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.index);
          this.removeDonFromHero(idx);
        });
      });
    } else {
      donsContainer.innerHTML = '<div class="no-items">Aucun don</div>';
    }

    // Populate carte du destin section
    const carteDestinContainer = document.getElementById('hero-edit-carte-destin');
    carteDestinContainer.innerHTML = '';

    if (hero.carteDestin !== null && hero.carteDestin !== undefined) {
      const carteNames = ['Le Destin', 'La Malchance', 'La Fortune', 'La Destinée', 'La Fatalité', 'La Providence'];
      const carteDescriptions = [
        '(+5 Initiative, +3 Fortune) OU (+1 Esquive, +1 Résist.)',
        '+2 points de stats à répartir',
        '+4 Vie max OU +6 Mana max',
        '+1 rang Compétence au choix',
        '+5 Armure élémentaire (2 éléments)',
        '+1 point de Don généraux'
      ];
      const carteName = carteNames[hero.carteDestin] || 'Inconnue';
      const carteDesc = carteDescriptions[hero.carteDestin] || '';

      carteDestinContainer.innerHTML = `
        <div class="carte-destin-name">${carteName}</div>
        <div class="carte-destin-choice"><span>${carteDesc}</span></div>
      `;

      // Afficher les choix specifiques si presents
      if (hero.carteDestinChoices) {
        if (hero.carteDestinChoices.option) {
          carteDestinContainer.innerHTML += `<div class="carte-destin-choice"><span>Choix: ${hero.carteDestinChoices.option}</span></div>`;
        }
        if (hero.carteDestinChoices.elements) {
          carteDestinContainer.innerHTML += `<div class="carte-destin-choice"><span>Éléments: ${hero.carteDestinChoices.elements.join(', ')}</span></div>`;
        }
      }
    } else {
      carteDestinContainer.innerHTML = '<div class="no-items">Aucune carte du destin</div>';
    }

    // Populate spells section
    const spellsContainer = document.getElementById('hero-edit-spells');
    spellsContainer.innerHTML = '';

    if (hero.spells && hero.spells.length > 0) {
      for (const spell of hero.spells) {
        const spellName = spell.name || spell.nom;
        const category = spell.category || spell.categorie;
        const iconUrl = this.iconManager ? this.iconManager.getSpellIcon(spellName, category) : '';
        spellsContainer.innerHTML += `
          <div class="spell-item-mini">
            ${iconUrl ? `<img src="${iconUrl}" onerror="this.style.display='none'">` : ''}
            <span>${spellName}</span>
          </div>
        `;
      }
    } else {
      spellsContainer.innerHTML = '<div class="no-items">Aucun sort</div>';
    }

    document.getElementById('hero-edit-popup').style.display = 'flex';
  }

  hideHeroEditPopup() {
    document.getElementById('hero-edit-popup').style.display = 'none';
    this.currentEditingHero = null;
  }

  regenerateCurrentHero() {
    if (!this.currentEditingHero) return;

    const { hero, teamNum, index } = this.currentEditingHero;

    // Generate a new hero with same class/subclass/level
    const newHero = this.heroGenerator.generateHero({
      className: hero.classe,
      subClassName: hero.sousClasse,
      level: hero.niveau,
      team: teamNum
    });

    if (newHero) {
      this.teamHeroes[teamNum][index] = newHero;
      this.renderHeroList(teamNum);
      this.showHeroEditPopup(newHero, teamNum, index);
    }
  }

  // ============= EQUIPMENT SELECTION METHODS =============

  showEquipmentSelectPopup(type) {
    if (!this.currentEditingHero) return;

    this.currentEquipmentType = type;
    const popup = document.getElementById('equipment-select-popup');
    const title = document.getElementById('equipment-select-title');
    const listContainer = document.getElementById('equipment-list');
    const searchInput = document.getElementById('equipment-search');

    // Clear search
    searchInput.value = '';

    // Set title
    if (type === 'weapon') {
      title.textContent = 'Choisir une arme';
    } else if (type === 'armor') {
      title.textContent = 'Choisir une armure';
    } else if (type === 'offhand') {
      title.textContent = 'Choisir main gauche (Bouclier/Catalyseur)';
    }

    // Get available equipment from objetsData
    const equipmentList = this.getAvailableEquipment(type);

    // Populate list
    listContainer.innerHTML = '';

    // Add "None" option
    const noneOption = document.createElement('div');
    noneOption.className = 'equipment-option';
    noneOption.innerHTML = `
      <div class="equip-info">
        <div class="equip-name">Aucun(e)</div>
        <div class="equip-effect">Retirer l'equipement actuel</div>
      </div>
    `;
    noneOption.addEventListener('click', () => {
      this.selectEquipment(null, type);
    });
    listContainer.appendChild(noneOption);

    for (const item of equipmentList) {
      const option = document.createElement('div');
      option.className = 'equipment-option';
      option.dataset.name = item.nom.toLowerCase();

      const iconUrl = item.image || '';
      const effectText = this.parseItemEffect(item.effet || '');

      option.innerHTML = `
        ${iconUrl ? `<img src="${iconUrl}" class="equip-icon" onerror="this.style.display='none'">` : ''}
        <div class="equip-info">
          <div class="equip-name">${item.nom}</div>
          <div class="equip-effect">${effectText}</div>
        </div>
      `;

      option.addEventListener('click', () => {
        this.selectEquipment(item, type);
      });

      listContainer.appendChild(option);
    }

    popup.style.display = 'flex';
  }

  hideEquipmentSelectPopup() {
    document.getElementById('equipment-select-popup').style.display = 'none';
    this.currentEquipmentType = null;
  }

  filterEquipmentList(searchText) {
    const listContainer = document.getElementById('equipment-list');
    const items = listContainer.querySelectorAll('.equipment-option');
    const search = searchText.toLowerCase();

    items.forEach(item => {
      const name = item.dataset.name || '';
      // Skip "None" option (no dataset.name)
      if (!name) {
        item.style.display = 'flex';
        return;
      }
      item.style.display = name.includes(search) ? 'flex' : 'none';
    });
  }

  selectEquipment(item, type) {
    if (!this.currentEditingHero) return;

    const { hero, teamNum, index } = this.currentEditingHero;

    // Update the equipment
    if (type === 'weapon') {
      hero.weapon = item;
    } else if (type === 'armor') {
      hero.armor = item;
    } else if (type === 'offhand') {
      hero.offHand = item;
    }

    // Recalculate all stats with new equipment
    this.recalculateHeroStats(hero);

    // Update the hero in teamHeroes
    this.teamHeroes[teamNum][index] = hero;

    // Refresh displays
    this.hideEquipmentSelectPopup();
    this.showHeroEditPopup(hero, teamNum, index);
    this.renderHeroList(teamNum);
  }

  extractOffHandBonus(item) {
    const bonus = { armor: 0, puissanceSorts: 0 };
    if (!item || !item.effet) return bonus;

    // Bouclier: chercher bonus d'armure
    if (item.tags && item.tags.includes('Bouclier')) {
      const armorMatch = item.effet.match(/armure physique de (\d+)/i);
      if (armorMatch) bonus.armor = parseInt(armorMatch[1]);
    }

    // Catalyseur: chercher bonus de puissance sorts
    if (item.tags && item.tags.includes('Catalyseur')) {
      const puissanceMatch = item.effet.match(/puissance (?:des )?sorts? de (\d+)/i);
      if (puissanceMatch) bonus.puissanceSorts = parseInt(puissanceMatch[1]);
    }

    return bonus;
  }

  getAvailableEquipment(type) {
    if (!this.objetsData) return [];

    if (type === 'weapon') {
      // Filter weapons by tags array containing "Arme"
      return this.objetsData.filter(item => {
        if (!item.tags || !Array.isArray(item.tags)) return false;
        return item.tags.some(tag => tag === 'Arme');
      });
    } else if (type === 'armor') {
      // Filter armors by tags array containing "Armure"
      return this.objetsData.filter(item => {
        if (!item.tags || !Array.isArray(item.tags)) return false;
        return item.tags.some(tag => tag === 'Armure');
      });
    } else if (type === 'offhand') {
      // Filter off-hand items (Bouclier or Catalyseur)
      return this.objetsData.filter(item => {
        if (!item.tags || !Array.isArray(item.tags)) return false;
        return item.tags.some(tag => tag === 'Bouclier' || tag === 'Catalyseur');
      });
    }

    return [];
  }

  // ============= CONSUMABLE SELECTION METHODS =============

  showConsumableSelectPopup() {
    if (!this.currentEditingHero) return;

    const popup = document.getElementById('consumable-select-popup');
    const listContainer = document.getElementById('consumable-list');
    const searchInput = document.getElementById('consumable-search');

    // Clear search
    searchInput.value = '';

    // Get available consumables
    const consumables = this.getAvailableConsumables();

    // Populate list
    listContainer.innerHTML = '';

    for (const item of consumables) {
      const option = document.createElement('div');
      option.className = 'equipment-option';
      option.dataset.name = item.nom.toLowerCase();

      const iconUrl = item.image || '';
      const effectText = this.parseItemEffect(item.effet || '');
      const charges = this.heroGenerator.extractCharges(item.effet);

      option.innerHTML = `
        ${iconUrl ? `<img src="${iconUrl}" class="equip-icon" onerror="this.style.display='none'">` : ''}
        <div class="equip-info">
          <div class="equip-name">${item.nom}</div>
          <div class="equip-charges">Charges: ${charges}</div>
          <div class="equip-effect">${effectText}</div>
        </div>
      `;

      option.addEventListener('click', () => {
        this.addConsumableToHero(item);
      });

      listContainer.appendChild(option);
    }

    popup.style.display = 'flex';
  }

  hideConsumableSelectPopup() {
    document.getElementById('consumable-select-popup').style.display = 'none';
  }

  filterConsumableList(searchText) {
    const listContainer = document.getElementById('consumable-list');
    const items = listContainer.querySelectorAll('.equipment-option');
    const search = searchText.toLowerCase();

    items.forEach(item => {
      const name = item.dataset.name || '';
      item.style.display = name.includes(search) ? 'flex' : 'none';
    });
  }

  addConsumableToHero(item) {
    if (!this.currentEditingHero) return;

    const { hero, teamNum, index } = this.currentEditingHero;

    // Check if hero already has this consumable
    const existing = hero.consumables.find(c => c.item.numero === item.numero);
    if (existing) {
      // Increase charges
      existing.charges += this.heroGenerator.extractCharges(item.effet);
    } else {
      // Add new consumable
      hero.consumables.push({
        item: item,
        charges: this.heroGenerator.extractCharges(item.effet)
      });
    }

    // Update the hero in teamHeroes
    this.teamHeroes[teamNum][index] = hero;

    // Refresh displays
    this.hideConsumableSelectPopup();
    this.showHeroEditPopup(hero, teamNum, index);
    this.renderHeroList(teamNum);
  }

  removeConsumableFromHero(consumableIndex) {
    if (!this.currentEditingHero) return;

    const { hero, teamNum, index } = this.currentEditingHero;

    // Remove the consumable
    hero.consumables.splice(consumableIndex, 1);

    // Update the hero in teamHeroes
    this.teamHeroes[teamNum][index] = hero;

    // Refresh displays
    this.showHeroEditPopup(hero, teamNum, index);
    this.renderHeroList(teamNum);
  }

  getAvailableConsumables() {
    if (!this.objetsData) return [];

    // Filter consumables by tags array containing "Consommable"
    return this.objetsData.filter(item => {
      if (!item.tags || !Array.isArray(item.tags)) return false;
      return item.tags.some(tag => tag === 'Consommable');
    });
  }

  // ============= DON SELECTION METHODS =============

  showDonSelectPopup() {
    if (!this.currentEditingHero) return;

    const popup = document.getElementById('don-select-popup');
    const listContainer = document.getElementById('don-list');
    const searchInput = document.getElementById('don-search');

    searchInput.value = '';
    listContainer.innerHTML = '';

    const hero = this.currentEditingHero.hero;
    const currentDons = hero.dons || [];
    const heroClass = hero.classe; // "Guerrier", "Mage", etc.

    // Collecter les dons disponibles pour cette classe
    if (this.donsData) {
      for (const category of this.donsData) {
        // Filtrer par classe: "Généraux" pour tous, sinon doit matcher la classe du héros
        const categoryName = category.nom;
        const isAccessible = categoryName === 'Généraux' || categoryName === heroClass;

        if (!isAccessible) continue;

        // Ajouter un header pour la catégorie
        const header = document.createElement('div');
        header.className = 'don-category-header';
        header.textContent = categoryName;
        listContainer.appendChild(header);

        for (const don of category.dons) {
          // Ne pas afficher les dons deja possedes
          if (currentDons.includes(don.nom)) continue;

          const option = document.createElement('div');
          option.className = 'equipment-option';
          option.dataset.name = don.nom.toLowerCase();
          option.dataset.category = categoryName.toLowerCase();

          // Parser la description
          const desc = don.description ? don.description.substring(0, 80) + '...' : '';

          option.innerHTML = `
            <div class="equip-info">
              <div class="equip-name">${don.nom}</div>
              <div class="equip-effect">${desc}</div>
            </div>
          `;

          option.addEventListener('click', () => {
            this.addDonToHero(don.nom);
          });

          listContainer.appendChild(option);
        }
      }
    }

    popup.style.display = 'flex';
  }

  hideDonSelectPopup() {
    document.getElementById('don-select-popup').style.display = 'none';
  }

  filterDonList(searchText) {
    const listContainer = document.getElementById('don-list');
    const items = listContainer.querySelectorAll('.equipment-option');
    const headers = listContainer.querySelectorAll('.don-category-header');
    const search = searchText.toLowerCase();

    // Filter items
    items.forEach(item => {
      const name = item.dataset.name || '';
      item.style.display = name.includes(search) ? 'flex' : 'none';
    });

    // Hide headers if all their items are hidden
    headers.forEach(header => {
      const categoryName = header.textContent.toLowerCase();
      const categoryItems = listContainer.querySelectorAll(`.equipment-option[data-category="${categoryName}"]`);
      const hasVisibleItems = Array.from(categoryItems).some(item => item.style.display !== 'none');
      header.style.display = hasVisibleItems ? 'block' : 'none';
    });
  }

  addDonToHero(donName) {
    if (!this.currentEditingHero) return;

    const { hero, teamNum, index } = this.currentEditingHero;

    if (!hero.dons) hero.dons = [];
    if (!hero.dons.includes(donName)) {
      hero.dons.push(donName);
    }

    // Recalculate stats with new don
    this.recalculateHeroStats(hero);

    this.teamHeroes[teamNum][index] = hero;

    this.hideDonSelectPopup();
    this.showHeroEditPopup(hero, teamNum, index);
    this.renderHeroList(teamNum);
  }

  removeDonFromHero(donIndex) {
    if (!this.currentEditingHero) return;

    const { hero, teamNum, index } = this.currentEditingHero;

    if (hero.dons && hero.dons.length > donIndex) {
      hero.dons.splice(donIndex, 1);
    }

    // Recalculate stats without the removed don
    this.recalculateHeroStats(hero);

    this.teamHeroes[teamNum][index] = hero;

    this.showHeroEditPopup(hero, teamNum, index);
    this.renderHeroList(teamNum);
  }

  // Recalculate hero stats based on current equipment and dons
  recalculateHeroStats(hero) {
    if (!this.heroGenerator || !this.heroGenerator.characterCreator) return;

    try {
      // Collect current equipment
      const equipement = [];
      if (hero.weapon) equipement.push(hero.weapon);
      if (hero.armor) equipement.push(hero.armor);
      if (hero.offHand) equipement.push(hero.offHand);

      // Use CharacterCreator to recalculate
      const characterData = this.heroGenerator.characterCreator.calculateCharacter({
        className: hero.classe,
        subClassName: hero.sousClasse,
        level: hero.niveau || 1,
        element: hero.element,
        dons: hero.dons || [],
        carteDestin: hero.carteDestin,
        carteDestinChoices: hero.carteDestinChoices || {},
        equipement: equipement
      });

      // Update hero stats from recalculated data
      hero.force = characterData.statsAvecEquipement.Force;
      hero.agilite = characterData.statsAvecEquipement.Agilité;
      hero.endurance = characterData.statsAvecEquipement.Endurance;
      hero.intelligence = characterData.statsAvecEquipement.Intelligence;
      hero.volonte = characterData.statsAvecEquipement.Volonté;
      hero.chance = characterData.statsAvecEquipement.Chance;

      hero.maxHp = characterData.vieMax;
      hero.currentHp = Math.min(hero.currentHp, hero.maxHp);
      hero.maxMana = characterData.manaMax;
      hero.currentMana = Math.min(hero.currentMana, hero.maxMana);

      hero.initiative = characterData.initiative.total;
      hero.esquive = characterData.esquive.total;
      hero.armurePhysique = characterData.armure.total;
      hero.resistanceAlterations = characterData.resistanceAlterations.total;

      hero.coupCritiquePhysique = characterData.coupCritiquePhysique.total;
      hero.coupCritiqueSorts = characterData.coupCritiqueSorts.total;
      hero.puissanceSorts = characterData.puissanceSorts.total;

      // Armure élémentaire
      hero.armureElementaire = characterData.armureElementaire;
      hero.armureFeu = characterData.armureElementaire.Feu;
      hero.armureEau = characterData.armureElementaire.Eau;
      hero.armureTerre = characterData.armureElementaire.Terre;
      hero.armureAir = characterData.armureElementaire.Air;
      hero.armureLumiere = characterData.armureElementaire.Lumière;
      hero.armureNuit = characterData.armureElementaire.Nuit;
      hero.armureDivin = characterData.armureElementaire.Divin;
      hero.armureMalefique = characterData.armureElementaire.Maléfique;

      // Update movement for "Rapide" don
      hero.baseMovement = 9;
      hero.movementBonus = 0;
      if (hero.dons && hero.dons.includes('Rapide')) {
        hero.movementBonus += 3;
      }

      console.log('Hero stats recalculated:', hero.name, { force: hero.force, maxHp: hero.maxHp, initiative: hero.initiative });
    } catch (error) {
      console.error('Error recalculating hero stats:', error);
    }
  }

  // ============= CARTE DU DESTIN METHODS =============

  showCarteDestinPopup() {
    if (!this.currentEditingHero) return;

    const popup = document.getElementById('carte-destin-popup');
    const optionsContainer = document.getElementById('carte-destin-options');

    optionsContainer.innerHTML = '';

    const cartes = [
      { id: 0, nom: 'Le Destin', desc: '(+5 Initiative, +3 Fortune) OU (+1 Esquive, +1 Résist. Alt.)' },
      { id: 1, nom: 'La Malchance', desc: '+2 points de stats à répartir (hors stat max)' },
      { id: 2, nom: 'La Fortune', desc: '+4 Vie max OU +6 Mana max' },
      { id: 3, nom: 'La Destinée', desc: '+1 rang Compétence au choix' },
      { id: 4, nom: 'La Fatalité', desc: '+5 Armure élémentaire (2 éléments au choix)' },
      { id: 5, nom: 'La Providence', desc: '+1 point de Don (généraux uniquement)' }
    ];

    for (const carte of cartes) {
      const option = document.createElement('div');
      option.className = 'equipment-option';

      option.innerHTML = `
        <div class="equip-info">
          <div class="equip-name">${carte.nom}</div>
          <div class="equip-effect">${carte.desc}</div>
        </div>
      `;

      option.addEventListener('click', () => {
        this.selectCarteDestin(carte.id);
      });

      optionsContainer.appendChild(option);
    }

    popup.style.display = 'flex';
  }

  hideCarteDestinPopup() {
    document.getElementById('carte-destin-popup').style.display = 'none';
  }

  selectCarteDestin(carteId) {
    if (!this.currentEditingHero) return;

    const { hero, teamNum, index } = this.currentEditingHero;

    hero.carteDestin = carteId;
    hero.carteDestinChoices = this.heroGenerator.getCarteDestinChoices(carteId, hero.element);

    // Recalculate stats with new carte du destin
    this.recalculateHeroStats(hero);

    this.teamHeroes[teamNum][index] = hero;

    this.hideCarteDestinPopup();
    this.showHeroEditPopup(hero, teamNum, index);
    this.renderHeroList(teamNum);
  }

  populateMonsterSelects() {
    const team1List = document.getElementById('team1-monster-list');
    const team2List = document.getElementById('team2-monster-list');

    [team1List, team2List].forEach((list, index) => {
      const teamNum = index + 1;
      list.innerHTML = `
        <div class="monster-filter">
          <input type="text" placeholder="Rechercher un monstre..."
                 onkeyup="window.combatUI.filterMonsters(${teamNum}, this.value)">
        </div>
      `;

      for (const monster of this.monstersData) {
        const item = document.createElement('div');
        item.className = 'monster-quantity-item';
        item.dataset.name = monster.nom.toLowerCase();

        // Obtenir l'icone du monstre
        const monsterIcon = this.iconManager ? this.iconManager.getMonsterIcon(monster.nom) : '';
        const iconHtml = monsterIcon ?
          `<img src="${monsterIcon}" alt="${monster.nom}" class="monster-select-icon" onerror="this.style.display='none'">` : '';

        item.innerHTML = `
          ${iconHtml}
          <span class="monster-name" title="${monster.nom}">${monster.nom}</span>
          <span class="monster-stats">PV:${monster.pointsDeVie} Init:${monster.initiative}</span>
          <input type="number" min="0" max="10" value="0"
                 data-monster="${monster.nom}"
                 onchange="window.combatUI.updateMonsterQuantity(this)">
        `;

        list.appendChild(item);
      }
    });
  }

  filterMonsters(teamNum, searchText) {
    const list = document.getElementById(`team${teamNum}-monster-list`);
    const items = list.querySelectorAll('.monster-quantity-item');
    const search = searchText.toLowerCase();

    items.forEach(item => {
      const name = item.dataset.name || '';
      item.style.display = name.includes(search) ? 'flex' : 'none';
    });
  }

  updateMonsterQuantity(input) {
    const item = input.closest('.monster-quantity-item');
    const value = parseInt(input.value) || 0;

    if (value > 0) {
      item.classList.add('has-quantity');
    } else {
      item.classList.remove('has-quantity');
    }
  }

  getMonsterQuantities(teamNum) {
    const list = document.getElementById(`team${teamNum}-monster-list`);
    const inputs = list.querySelectorAll('input[data-monster]');
    const quantities = [];

    inputs.forEach(input => {
      const qty = parseInt(input.value) || 0;
      if (qty > 0) {
        quantities.push({
          name: input.dataset.monster,
          quantity: qty
        });
      }
    });

    return quantities;
  }

  async startCombat() {
    // Recuperer la configuration
    const gridSize = parseInt(document.getElementById('grid-size').value);

    // Equipe 1
    const team1Type = document.getElementById('team1-type').value;

    // Equipe 2
    const team2Type = document.getElementById('team2-type').value;

    // Reinitialiser la grille
    this.grid.resize(gridSize);

    // Generer les equipes
    const team1 = await this.generateTeam(1, team1Type);
    const team2 = await this.generateTeam(2, team2Type);

    if (team1.length === 0) {
      alert('Equipe 1 vide. Ajoutez des heros ou selectionnez des monstres.');
      return;
    }
    if (team2.length === 0) {
      alert('Equipe 2 vide. Ajoutez des heros ou selectionnez des monstres.');
      return;
    }

    // Precharger les icones des entites pour la grille
    await this.grid.preloadEntityIcons([...team1, ...team2]);

    // Initialiser le combat
    this.engine.initCombat(team1, team2);

    // Afficher l'arene
    this.showCombatArena();

    // Render initial
    this.updateCombatState({
      currentEntity: this.engine.getCurrentEntity(),
      roundNumber: 1,
      entities: this.engine.entities,
      isRunning: true
    });

    // Start manual combat mode (process first turn)
    await this.engine.startManualCombat();
  }

  async generateTeam(teamNum, type) {
    const entities = [];

    if (type === 'heroes') {
      // Use pre-configured heroes from teamHeroes
      for (const hero of this.teamHeroes[teamNum]) {
        // Clone the hero to avoid modifying the original
        const clonedHero = hero.clone();
        clonedHero.team = teamNum;
        entities.push(clonedHero);
      }
    } else {
      // Utiliser les quantites par monstre
      const monsterQuantities = this.getMonsterQuantities(teamNum);

      let globalIndex = 0;
      for (const { name, quantity } of monsterQuantities) {
        for (let i = 0; i < quantity; i++) {
          const monster = this.createMonsterEntity(name, teamNum, globalIndex);
          if (monster) {
            entities.push(monster);
            globalIndex++;
          }
        }
      }
    }

    return entities;
  }

  getSelectedMonsters(teamNum) {
    const select = document.getElementById(`team${teamNum}-monsters`);
    return Array.from(select.selectedOptions).map(opt => opt.value);
  }

  createMonsterEntity(monsterName, team, index) {
    const monsterData = this.monstersData.find(m => m.nom === monsterName);
    if (!monsterData) return null;

    // Parser les attaques et sorts du monstre
    const { attacks, spells } = this.parseMonsterAbilities(monsterData.abilites);

    return new CombatEntity({
      name: `${monsterData.nom} ${index + 1}`,
      team,
      type: 'monster',

      force: 5, // Estimer depuis les degats
      agilite: monsterData.initiative || 1,
      endurance: Math.floor(monsterData.pointsDeVie / 2),
      intelligence: 3,
      volonte: 3,
      chance: 1,

      maxHp: monsterData.pointsDeVie,
      currentHp: monsterData.pointsDeVie,
      maxMana: 20,
      currentMana: 20,

      initiative: monsterData.initiative || 1,
      esquive: monsterData.esquive || 0,
      armurePhysique: monsterData.armurePhysique || 0,
      resistanceAlterations: monsterData.resistanceAlterations || 0,

      coupCritiquePhysique: monsterData.coupCritique || 0,
      coupCritiqueSorts: monsterData.coupCritiqueSorts || 0,
      puissanceSorts: 2,

      element: CombatEntity.normalizeElement(monsterData.element),

      armureFeu: monsterData.armureFeu || 0,
      armureEau: monsterData.armureEau || 0,
      armureTerre: monsterData.armureTerre || 0,
      armureAir: monsterData.armureAir || 0,
      armureLumiere: monsterData.armureLumiere || 0,
      armureNuit: monsterData.armureObscurite || 0,
      armureDivin: monsterData.armureDivin || 0,
      armureMalefique: monsterData.armureMalefique || 0,

      attacks,
      spells
    });
  }

  parseMonsterAbilities(abilitiesHtml) {
    if (!abilitiesHtml) return { attacks: [{ name: 'Attaque', damage: 5, element: 'Physique', range: 3 }], spells: [] };

    const attacks = [];
    const spells = [];

    // Extraire les references aux sorts (spell-link)
    const spellLinkRegex = /<span[^>]*class="spell-link"[^>]*data-spell="([^"]+)"[^>]*data-category="([^"]+)"[^>]*>/gi;
    let spellMatch;
    while ((spellMatch = spellLinkRegex.exec(abilitiesHtml)) !== null) {
      const spellName = spellMatch[1];
      const category = spellMatch[2];

      // Chercher le sort dans les donnees
      if (this.sortsData) {
        for (const cat of this.sortsData) {
          const foundSpell = cat.sorts?.find(s => s.nom === spellName);
          if (foundSpell) {
            const spellWithCategory = { ...foundSpell, category: cat.nom };
            // Parser le sort pour obtenir le format utilisable
            if (this.spellParser) {
              spells.push(this.spellParser.parseSpell(spellWithCategory));
            } else {
              spells.push(spellWithCategory);
            }
            break;
          }
        }
      }
    }

    // Nettoyer le HTML pour parser les attaques
    const cleanText = abilitiesHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Parser les attaques nommees: "<strong>Nom:</strong> ... Inflige X degats"
    // Diviser par les noms d'attaques
    const abilityBlocks = abilitiesHtml.split(/<strong>/i);

    for (const block of abilityBlocks) {
      if (!block.trim()) continue;

      // Extraire le nom de l'attaque
      const nameMatch = block.match(/^([^<:]+):/);
      const abilityName = nameMatch ? nameMatch[1].trim() : null;

      // Ignorer si c'est juste "Butin" ou similaire
      if (abilityName && /^(butin|loot)/i.test(abilityName)) continue;

      const blockClean = block.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

      // Chercher les degats dans ce bloc
      const damageMatch = blockClean.match(/(?:Inflige\s+)?(\d+)\s+d[ée]g[âa]ts?\s*(?:de\s+)?(\w+)?/i);
      if (damageMatch) {
        const damage = parseInt(damageMatch[1]);
        let element = damageMatch[2] ? CombatEntity.normalizeElement(damageMatch[2]) : 'Physique';

        // Chercher la portee
        const rangeMatch = blockClean.match(/Port[ée]e\s+(\d+)\s*m/i);
        const range = rangeMatch ? parseInt(rangeMatch[1]) : 3;

        // Chercher les alterations
        let alteration = null;
        const altMatch = blockClean.match(/(Empoisonn[ée]|Paralys[ée]|Endormi|Ralenti|Entrav[ée]|Entoil[ée]|Silence|A terre|À terre)/i);
        if (altMatch) {
          alteration = altMatch[1].replace('é', 'e').replace('É', 'E');
        }

        attacks.push({
          name: abilityName || 'Attaque',
          damage,
          element,
          range,
          alteration
        });
      }
    }

    // Si pas d'attaques nommees, chercher les degats globaux
    if (attacks.length === 0) {
      const globalDamageMatch = cleanText.match(/(\d+)\s+d[ée]g[âa]ts?\s*(?:de\s+)?(\w+)?/gi);
      if (globalDamageMatch) {
        for (const match of globalDamageMatch) {
          const parts = match.match(/(\d+)\s+d[ée]g[âa]ts?\s*(?:de\s+)?(\w+)?/i);
          if (parts) {
            attacks.push({
              name: 'Attaque',
              damage: parseInt(parts[1]),
              element: parts[2] ? CombatEntity.normalizeElement(parts[2]) : 'Physique',
              range: 3
            });
          }
        }
      }
    }

    // Si toujours pas d'attaques et pas de sorts, attaque par defaut
    if (attacks.length === 0 && spells.length === 0) {
      attacks.push({
        name: 'Attaque',
        damage: 5,
        element: 'Physique',
        range: 3
      });
    }

    console.log('parseMonsterAbilities:', { attacks, spells: spells.map(s => s.name || s.nom) });
    return { attacks, spells };
  }

  showCombatArena() {
    this.configPanel.style.display = 'none';
    this.combatArena.style.display = 'block';
    this.resultsPanel.style.display = 'none';
    this.combatLog.innerHTML = '';
    // Action panel will be shown when player turn starts
  }

  startAutoCombat() {
    document.getElementById('auto-combat').style.display = 'none';
    document.getElementById('pause-combat').style.display = 'inline-block';
    this.hideActionPanel();
    this.clearActionSelection();
    this.engine.startAutoMode();
  }

  pauseCombat() {
    document.getElementById('auto-combat').style.display = 'inline-block';
    document.getElementById('pause-combat').style.display = 'none';
    this.engine.pauseAutoMode();
    // Resume manual mode
    this.engine.autoMode = false;
    this.engine.processNextTurn();
  }

  backToConfig() {
    this.engine.reset();
    this.hideActionPanel();
    this.configPanel.style.display = 'block';
    this.combatArena.style.display = 'none';
    this.resultsPanel.style.display = 'none';
  }

  async replayCombat() {
    // Cacher les resultats et relancer avec la meme config
    this.resultsPanel.style.display = 'none';
    this.combatLog.innerHTML = '';
    await this.startCombat();
  }

  resetConfig() {
    document.getElementById('grid-size').value = 20;

    // Clear hero teams
    this.teamHeroes = { 1: [], 2: [] };
    this.renderHeroList(1);
    this.renderHeroList(2);

    // Reset monster quantities
    document.querySelectorAll('.monster-quantity-item input[type="number"]').forEach(input => {
      input.value = 0;
      input.closest('.monster-quantity-item')?.classList.remove('has-quantity');
    });
  }

  addLogEntry(entry) {
    const div = document.createElement('div');
    div.className = `log-entry ${entry.type}`;
    // Support HTML pour les icones
    div.innerHTML = entry.message;
    this.combatLog.appendChild(div);
    this.combatLog.scrollTop = this.combatLog.scrollHeight;
  }

  updateCombatState(state) {
    // Mettre a jour les infos de tour
    document.getElementById('current-round').textContent = `Tour: ${state.roundNumber}`;
    document.getElementById('current-entity').textContent = state.currentEntity
      ? `Au tour de: ${state.currentEntity.name}`
      : 'En attente...';

    // Mettre a jour les listes d'entites
    this.updateEntityList(1, state.entities.filter(e => e.team === 1), state.currentEntity);
    this.updateEntityList(2, state.entities.filter(e => e.team === 2), state.currentEntity);

    // Show/hide action panel based on player turn
    if (state.currentEntity && this.engine.isPlayerControlled(state.currentEntity)) {
      // Player turn - action panel will be shown via onAwaitingInput callback
    } else if (!this.engine.autoMode) {
      // AI turn - hide action panel
      this.hideActionPanel();
    }

    // Mettre a jour la grille
    this.grid.render(state.currentEntity, this.highlightedCells, this.highlightType);
  }

  updateEntityList(team, entities, activeEntity) {
    const container = document.getElementById(`team${team}-entities`);
    container.innerHTML = '';

    for (const entity of entities) {
      const card = document.createElement('div');
      card.className = `entity-card team${team}`;

      if (entity.isDead()) {
        card.classList.add('dead');
      }

      if (entity === activeEntity) {
        card.classList.add('active');
      }

      const hpPercent = entity.currentHp / entity.maxHp;
      let hpClass = '';
      if (hpPercent < 0.3) hpClass = 'critical';
      else if (hpPercent < 0.6) hpClass = 'low';

      // Obtenir l'icone selon le type d'entite
      let iconUrl = '';
      if (entity.type === 'hero' && entity.classe && entity.sousClasse) {
        iconUrl = this.iconManager.getSubclassIcon(entity.classe, entity.sousClasse);
      } else if (entity.type === 'monster') {
        // Extraire le nom sans le numero
        const baseName = entity.name.replace(/\s+\d+$/, '');
        iconUrl = this.iconManager.getMonsterIcon(baseName);
      }

      const iconHtml = iconUrl ?
        `<img src="${iconUrl}" alt="${entity.name}" class="entity-icon" onerror="this.style.display='none'">` : '';

      card.innerHTML = `
        <div class="entity-header">
          ${iconHtml}
          <div class="entity-info">
            <div class="entity-name">${entity.name}</div>
            <div class="entity-class">${entity.classe ? `${entity.classe} - ${entity.sousClasse}` : entity.element}</div>
          </div>
        </div>
        <div class="entity-stats">
          <span class="stat-hp">PV: ${entity.currentHp}/${entity.maxHp}${entity.tempHp > 0 ? ` (+${entity.tempHp})` : ''}</span>
          <span class="stat-mana">Mana: ${entity.currentMana}/${entity.maxMana}</span>
        </div>
        <div class="health-bar">
          <div class="health-bar-fill ${hpClass}" style="width: ${Math.max(0, hpPercent * 100)}%"></div>
        </div>
        ${entity.alterations.length > 0 ? `
          <div class="alterations">
            ${entity.alterations.map(a => `<span class="alteration-badge negative">${a.name} (${a.duration})</span>`).join('')}
          </div>
        ` : ''}
      `;

      container.appendChild(card);
    }
  }

  showResults(result) {
    // Garder l'arene visible avec les resultats
    this.configPanel.style.display = 'none';
    this.combatArena.style.display = 'block';
    this.resultsPanel.style.display = 'block';
    document.getElementById('action-panel').style.display = 'none';

    const winnerDisplay = document.getElementById('winner-display');
    winnerDisplay.className = `team${result.winner}`;
    winnerDisplay.innerHTML = `
      <h2>Victoire de l'Equipe ${result.winner}!</h2>
      <p>Combat termine en ${result.rounds} tours</p>
    `;

    const statsContainer = document.getElementById('combat-stats');
    const stats = result.stats;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <h4>Tours joues</h4>
        <div class="value">${stats.rounds}</div>
      </div>
      <div class="stat-card">
        <h4>Degats totaux</h4>
        <div class="value">${stats.totalDamage}</div>
      </div>
      <div class="stat-card">
        <h4>Soins totaux</h4>
        <div class="value">${stats.totalHealing}</div>
      </div>
      <div class="stat-card">
        <h4>Sorts lances</h4>
        <div class="value">${stats.totalSpells}</div>
      </div>
      <div class="stat-card">
        <h4>Coups critiques</h4>
        <div class="value">${stats.totalCriticals}</div>
      </div>
      <div class="stat-card">
        <h4>Survivants</h4>
        <div class="value">${result.survivors.length}</div>
      </div>
      <div class="stat-card">
        <h4>Equipe 1 - Degats</h4>
        <div class="value">${stats.team1Stats.damage}</div>
      </div>
      <div class="stat-card">
        <h4>Equipe 2 - Degats</h4>
        <div class="value">${stats.team2Stats.damage}</div>
      </div>
    `;
  }

  // ============= MANUAL COMBAT METHODS =============

  // Called when engine awaits player input
  onAwaitingPlayerInput(entity) {
    this.showActionPanel(entity);
    this.updateActionPanel();
  }

  // Show the action panel
  showActionPanel(entity) {
    const actionPanel = document.getElementById('action-panel');
    actionPanel.style.display = 'block';

    // Update current entity display
    const entityInfo = document.getElementById('current-entity-info');
    entityInfo.className = `current-entity-info team${entity.team}`;

    // Get entity icon
    let iconHtml = '';
    if (entity.type === 'hero' && entity.classe && entity.sousClasse) {
      const iconUrl = this.iconManager.getSubclassIcon(entity.classe, entity.sousClasse);
      if (iconUrl) iconHtml = `<img src="${iconUrl}" class="entity-action-icon" onerror="this.style.display='none'">`;
    } else if (entity.type === 'monster') {
      const baseName = entity.name.replace(/\s+\d+$/, '');
      const iconUrl = this.iconManager.getMonsterIcon(baseName);
      if (iconUrl) iconHtml = `<img src="${iconUrl}" class="entity-action-icon" onerror="this.style.display='none'">`;
    }

    entityInfo.innerHTML = `
      ${iconHtml}
      <span class="entity-action-name">${entity.name}</span>
      <span class="entity-action-team">Equipe ${entity.team}</span>
      <span class="entity-action-hp">PV: ${entity.currentHp}/${entity.maxHp}</span>
      <span class="entity-action-mana">Mana: ${entity.currentMana}/${entity.maxMana}</span>
    `;

    this.updateActionPanel();
  }

  // Hide the action panel
  hideActionPanel() {
    const actionPanel = document.getElementById('action-panel');
    actionPanel.style.display = 'none';
    this.clearActionSelection();
  }

  // Update action panel based on entity state
  updateActionPanel() {
    const entity = this.engine.getCurrentEntity();
    if (!entity) return;

    const actions = this.engine.getAvailableActions(entity);

    // Update buttons
    document.getElementById('action-move').disabled = !actions.canMove;
    document.getElementById('action-attack').disabled = !actions.canAttack;
    document.getElementById('action-spell').disabled = !actions.canCastSpell;
    document.getElementById('action-item').disabled = !actions.canUseItem;

    // Update status badges
    const moveStatus = document.getElementById('move-status');
    const actionStatus = document.getElementById('action-status');
    const secondaryStatus = document.getElementById('secondary-status');

    if (entity.hasMoved) {
      moveStatus.textContent = 'Deplacement: utilise';
      moveStatus.classList.add('used');
    } else {
      moveStatus.textContent = `Deplacement: ${actions.movementRange}m`;
      moveStatus.classList.remove('used');
    }

    if (entity.hasActed) {
      actionStatus.textContent = 'Action: utilisee';
      actionStatus.classList.add('used');
    } else {
      actionStatus.textContent = 'Action: disponible';
      actionStatus.classList.remove('used');
    }

    if (entity.hasUsedSecondary) {
      secondaryStatus.textContent = 'Objet: utilise';
      secondaryStatus.classList.add('used');
    } else {
      secondaryStatus.textContent = 'Objet: disponible';
      secondaryStatus.classList.remove('used');
    }

    // Update don abilities section
    this.updateDonAbilitiesPanel(entity, actions);

    // Update hint
    this.updateActionHint();
  }

  // Update don abilities panel
  updateDonAbilitiesPanel(entity, actions) {
    const donAbilitiesContainer = document.getElementById('don-abilities');

    if (!actions.donAbilities || actions.donAbilities.length === 0) {
      donAbilitiesContainer.style.display = 'none';
      return;
    }

    donAbilitiesContainer.style.display = 'flex';
    donAbilitiesContainer.innerHTML = '';

    for (const ability of actions.donAbilities) {
      const btn = document.createElement('button');
      btn.className = 'don-ability-btn';
      btn.innerHTML = `
        <span class="ability-name">${ability.name}</span>
        <span class="ability-desc">${ability.description}</span>
        <span class="ability-type">${ability.type === 'main' ? 'Action principale' : 'Action secondaire'}</span>
      `;
      btn.addEventListener('click', async () => {
        await this.engine.executeDonAbility(entity, ability.name);
        this.updateActionPanel();
        this.grid.render(entity, []);
      });
      donAbilitiesContainer.appendChild(btn);
    }
  }

  // Select an action type
  selectAction(actionType) {
    this.clearActionSelection();
    this.currentAction = actionType;

    // Highlight selected button
    const buttons = document.querySelectorAll('.action-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`action-${actionType}`).classList.add('selected');

    const entity = this.engine.getCurrentEntity();

    switch (actionType) {
      case 'move':
        this.highlightedCells = this.engine.getValidMovementCells();
        this.highlightType = 'move';
        this.canvas.classList.add('selecting-move');
        const movement = entity ? entity.getMovement() : 9;
        this.setActionHint(`Deplacement: ${movement}m - Cliquez sur une case en surbrillance`);
        break;

      case 'attack':
        this.validTargets = this.engine.getValidAttackTargets();
        this.highlightTargets(this.validTargets);
        this.highlightType = 'target';
        this.canvas.classList.add('selecting-target');
        const attackRange = entity ? entity.getAttackRange() : 3;
        if (this.validTargets.length === 0) {
          this.setActionHint(`Attaque: portee ${attackRange}m - Aucune cible a portee`);
        } else {
          this.setActionHint(`Attaque: portee ${attackRange}m - Cliquez sur un ennemi`);
        }
        break;

      case 'spell':
        if (entity && entity.spells.length > 0) {
          this.showSpellPopup(entity);
        } else {
          this.setActionHint('Aucun sort disponible');
        }
        return; // Don't render yet, wait for spell selection

      case 'item':
        if (entity && entity.canUseItem()) {
          this.showItemPopup(entity);
        } else {
          this.setActionHint('Aucun objet disponible');
        }
        return; // Don't render yet, wait for item selection
    }

    // Render grid with highlights
    this.grid.render(entity, this.highlightedCells, this.highlightType);
  }

  // Clear action selection
  clearActionSelection() {
    this.currentAction = null;
    this.selectedSpell = null;
    this.highlightedCells = [];
    this.validTargets = [];
    this.highlightType = 'move';

    const buttons = document.querySelectorAll('.action-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));

    this.canvas.classList.remove('selecting-move', 'selecting-target');

    // Clear target highlights on entity cards
    document.querySelectorAll('.entity-card').forEach(card => {
      card.classList.remove('targetable', 'targeted');
      card.onclick = null;
    });

    this.setActionHint('');

    const entity = this.engine.getCurrentEntity();
    if (entity) {
      this.grid.render(entity, []);
    }
  }

  // Highlight valid targets on entity cards
  highlightTargets(targets) {
    // Clear previous
    document.querySelectorAll('.entity-card').forEach(card => {
      card.classList.remove('targetable');
    });

    // Highlight valid targets
    targets.forEach(target => {
      const cards = document.querySelectorAll('.entity-card');
      cards.forEach(card => {
        const nameEl = card.querySelector('.entity-name');
        if (nameEl && nameEl.textContent === target.name) {
          card.classList.add('targetable');
          card.onclick = () => this.handleTargetClick(target);
        }
      });
    });

    // Also highlight on grid
    this.highlightedCells = targets.map(t => t.position);
  }

  // Handle click on target (entity card or grid)
  async handleTargetClick(target) {
    if (this.currentAction === 'attack') {
      await this.engine.playerAttack(target);
      this.clearActionSelection();
      this.updateActionPanel();
    } else if (this.currentAction === 'spell' && this.selectedSpell) {
      await this.engine.playerCastSpell(this.selectedSpell, target);
      this.clearActionSelection();
      this.updateActionPanel();
    }
  }

  // Handle grid click
  handleGridClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.grid.cellSizePixels);
    const y = Math.floor((e.clientY - rect.top) / this.grid.cellSizePixels);

    if (!this.grid.isValidPosition(x, y)) return;

    if (this.currentAction === 'move') {
      // Check if clicked cell is in highlighted cells
      const isValid = this.highlightedCells.some(c => c.x === x && c.y === y);
      if (isValid) {
        this.engine.playerMove(x, y).then(() => {
          this.clearActionSelection();
          this.updateActionPanel();
        });
      }
    } else if (this.currentAction === 'attack' || (this.currentAction === 'spell' && this.selectedSpell)) {
      // Check if clicked on a valid target
      const entity = this.grid.getEntityAt(x, y);
      if (entity && this.validTargets.includes(entity)) {
        this.handleTargetClick(entity);
      }
    }
  }

  // Handle grid hover for target info
  handleGridHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.grid.cellSizePixels);
    const y = Math.floor((e.clientY - rect.top) / this.grid.cellSizePixels);

    if (!this.grid.isValidPosition(x, y)) {
      this.hideTargetInfo();
      return;
    }

    const entity = this.grid.getEntityAt(x, y);
    if (entity) {
      this.showTargetInfo(entity, e.clientX, e.clientY);
    } else {
      this.hideTargetInfo();
    }
  }

  // Show target info tooltip
  showTargetInfo(entity, mouseX, mouseY) {
    const info = document.getElementById('target-info');
    info.style.display = 'block';
    info.style.left = (mouseX + 15) + 'px';
    info.style.top = (mouseY + 15) + 'px';

    info.querySelector('.target-name').textContent = entity.name;
    info.querySelector('.target-hp').textContent = `PV: ${entity.currentHp}/${entity.maxHp}`;
  }

  // Hide target info tooltip
  hideTargetInfo() {
    document.getElementById('target-info').style.display = 'none';
  }

  // Show spell selection popup
  showSpellPopup(entity) {
    const popup = document.getElementById('spell-popup');
    const spellList = document.getElementById('spell-list');
    popup.style.display = 'flex';

    spellList.innerHTML = '';

    entity.spells.forEach(spell => {
      // Support both parsed spells (name, manaCost) and raw spells (nom, coutMana)
      const spellName = spell.name || spell.nom;
      const manaCost = spell.manaCost !== undefined ? spell.manaCost : this.parseManaCost(spell.coutMana);
      const range = spell.range !== undefined ? spell.range : this.parseRange(spell.portee);
      const spellType = spell.type || 'unknown';
      const category = spell.category || spell.categorie;

      const canCast = entity.currentMana >= manaCost;
      const item = document.createElement('div');
      item.className = 'spell-item' + (canCast ? '' : ' disabled');

      const iconUrl = this.iconManager ? this.iconManager.getSpellIcon(spellName, category) : '';
      const iconHtml = iconUrl ? `<img src="${iconUrl}" class="spell-icon" onerror="this.style.display='none'">` : '';

      item.innerHTML = `
        ${iconHtml}
        <div class="spell-info">
          <div class="spell-name">${spellName}</div>
          <div class="spell-cost">Mana: ${manaCost}</div>
          <div class="spell-range">Portee: ${range || 9}m | Type: ${spellType}</div>
        </div>
      `;

      if (canCast) {
        item.onclick = () => {
          this.selectedSpell = spell;
          this.hideSpellPopup();
          this.showSpellTargets(spell);
        };
      }

      spellList.appendChild(item);
    });
  }

  // Helper to parse mana cost from raw format
  parseManaCost(coutMana) {
    if (!coutMana) return 0;
    const match = coutMana.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // Helper to parse range from raw format
  parseRange(portee) {
    if (!portee) return 9;
    const match = portee.toString().match(/(\d+)\s*m/i);
    return match ? parseInt(match[1]) : 9;
  }

  // Hide spell popup
  hideSpellPopup() {
    document.getElementById('spell-popup').style.display = 'none';
  }

  // Show item selection popup
  showItemPopup(entity) {
    const popup = document.getElementById('item-popup');
    const itemList = document.getElementById('item-list');
    popup.style.display = 'flex';

    itemList.innerHTML = '';

    const usableItems = entity.getUsableConsumables();

    if (usableItems.length === 0) {
      itemList.innerHTML = '<p class="no-items">Aucun objet disponible</p>';
      return;
    }

    usableItems.forEach(consumable => {
      const item = consumable.item;
      const charges = consumable.charges;

      const entry = document.createElement('div');
      entry.className = 'item-entry';

      // Get item icon
      const iconUrl = item.image || '';

      // Parse effect for display (strip HTML)
      const effectText = this.parseItemEffect(item.effet);

      entry.innerHTML = `
        ${iconUrl ? `<img src="${iconUrl}" class="item-icon" onerror="this.style.display='none'">` : ''}
        <div class="item-info">
          <div class="item-name">${item.nom}</div>
          <div class="item-charges">Charges: ${charges}</div>
          <div class="item-effect">${effectText}</div>
        </div>
      `;

      entry.onclick = () => {
        this.hideItemPopup();
        this.useItem(consumable);
      };

      itemList.appendChild(entry);
    });
  }

  // Hide item popup
  hideItemPopup() {
    document.getElementById('item-popup').style.display = 'none';
    this.clearActionSelection();
  }

  // Parse item effect for display
  parseItemEffect(effet) {
    if (!effet) return '';
    // Strip HTML and get first sentence
    let text = effet.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    // Remove "Effet:" prefix
    text = text.replace(/^Effet\s*:\s*/i, '');
    // Truncate if too long
    if (text.length > 60) {
      text = text.substring(0, 60) + '...';
    }
    return text;
  }

  // Use an item
  async useItem(consumable) {
    const result = await this.engine.playerUseItem(consumable);
    if (result) {
      this.clearActionSelection();
      this.updateActionPanel();
    }
  }

  // Show valid targets for selected spell
  showSpellTargets(spell) {
    this.currentAction = 'spell';
    this.validTargets = this.engine.getValidSpellTargets(spell);
    this.highlightTargets(this.validTargets);

    const spellType = spell.type || 'other';
    const spellName = spell.name || spell.nom;
    this.highlightType = spellType === 'buff' || spellType === 'healing' ? 'ally' : 'target';
    this.canvas.classList.add('selecting-target');

    const spellRange = this.engine.getSpellRange(spell);
    const rangeText = spellRange === 0 ? 'personnel' : `${spellRange}m`;

    if (this.validTargets.length === 0) {
      this.setActionHint(`${spellName} (portee: ${rangeText}) - Aucune cible a portee`);
    } else {
      this.setActionHint(`${spellName} (portee: ${rangeText}) - Cliquez sur une cible`);
    }

    const entity = this.engine.getCurrentEntity();
    this.grid.render(entity, this.highlightedCells, this.highlightType);
  }

  // Set action hint text
  setActionHint(text) {
    document.getElementById('action-hint').textContent = text;
  }

  // Update action hint based on current state
  updateActionHint() {
    if (!this.currentAction) {
      const entity = this.engine.getCurrentEntity();
      if (entity && this.engine.isPlayerControlled(entity)) {
        this.setActionHint('Selectionnez une action');
      } else {
        this.setActionHint('');
      }
    }
  }

  // ============= ACTION ANIMATION =============

  // Show action animation popup
  async showActionAnimation(attacker, target, actionIcon, actionName, resultText, resultType) {
    const overlay = document.getElementById('action-animation');
    const leftActor = overlay.querySelector('.actor-left');
    const rightActor = overlay.querySelector('.actor-right');
    const projectileContainer = overlay.querySelector('.action-projectile-container');
    const projectile = overlay.querySelector('.action-projectile');
    const resultDiv = overlay.querySelector('.action-result');

    // Determine which side is attacker based on team
    const attackerOnLeft = attacker.team === 1;

    // Set actor icons and names
    const attackerIcon = this.getEntityIconUrl(attacker);
    const targetIcon = this.getEntityIconUrl(target);

    // Helper to set actor icon with fallback
    const setActorIcon = (actor, iconUrl, name) => {
      const img = actor.querySelector('.actor-icon');
      if (iconUrl) {
        img.src = iconUrl;
        img.style.display = 'block';
      } else {
        img.src = '';
        img.style.display = 'none';
      }
      actor.querySelector('.actor-name').textContent = name;
    };

    if (attackerOnLeft) {
      setActorIcon(leftActor, attackerIcon, attacker.name);
      leftActor.className = `action-actor actor-left team${attacker.team}`;

      setActorIcon(rightActor, targetIcon, target.name);
      rightActor.className = `action-actor actor-right team${target.team} hit`;

      overlay.classList.remove('reverse');
    } else {
      setActorIcon(rightActor, attackerIcon, attacker.name);
      rightActor.className = `action-actor actor-right team${attacker.team}`;

      setActorIcon(leftActor, targetIcon, target.name);
      leftActor.className = `action-actor actor-left team${target.team} hit`;

      overlay.classList.add('reverse');
    }

    // Set projectile icon with fallback
    if (actionIcon) {
      projectile.src = actionIcon;
      projectile.style.display = 'block';
      projectileContainer.dataset.actionName = '';
    } else {
      projectile.src = '';
      projectile.style.display = 'none';
      // Show action name as fallback
      projectileContainer.dataset.actionName = actionName;
    }
    projectile.alt = actionName;

    // Set result
    resultDiv.textContent = resultText;
    resultDiv.className = `action-result ${resultType}`;

    // Show overlay
    overlay.style.display = 'flex';

    // Wait for animation to complete
    await this.delay(2100);

    // Hide overlay
    overlay.style.display = 'none';

    // Reset classes for next animation
    leftActor.classList.remove('hit');
    rightActor.classList.remove('hit');
    overlay.classList.remove('reverse');
  }

  // Get entity icon URL helper
  getEntityIconUrl(entity) {
    if (!entity) return null;

    if (entity.type === 'hero' && entity.classe && entity.sousClasse) {
      return this.iconManager ? this.iconManager.getSubclassIcon(entity.classe, entity.sousClasse) : null;
    } else if (entity.type === 'monster') {
      const baseName = entity.name.replace(/\s+\d+$/, '');
      return this.iconManager ? this.iconManager.getMonsterIcon(baseName) : null;
    }
    return null;
  }

  // Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.CombatUI = CombatUI;
