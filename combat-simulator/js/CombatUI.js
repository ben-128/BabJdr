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

    document.getElementById('next-turn').addEventListener('click', async () => {
      await this.executeTurn();
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
  }

  toggleTeamConfig(teamNum, type) {
    const classConfig = document.getElementById(`team${teamNum}-class-config`);
    const classSelect = document.getElementById(`team${teamNum}-class-select`);
    const monsterConfig = document.getElementById(`team${teamNum}-monster-config`);
    const levelConfig = document.getElementById(`team${teamNum}-level-config`);

    if (type === 'heroes') {
      classConfig.style.display = 'block';
      if (classSelect) classSelect.style.display = 'block';
      monsterConfig.style.display = 'none';
      levelConfig.style.display = 'block';
    } else {
      classConfig.style.display = 'none';
      if (classSelect) classSelect.style.display = 'none';
      monsterConfig.style.display = 'block';
      levelConfig.style.display = 'none';
    }
  }

  populateClassSelects() {
    const classes = this.heroGenerator.getAvailableClasses();
    const team1Select = document.getElementById('team1-class');
    const team2Select = document.getElementById('team2-class');

    [team1Select, team2Select].forEach(select => {
      select.innerHTML = '';
      for (const classe of classes) {
        for (const sousClasse of classe.sousClasses) {
          const option = document.createElement('option');
          option.value = `${classe.nom}|${sousClasse}`;
          option.textContent = `${classe.nom} - ${sousClasse}`;
          select.appendChild(option);
        }
      }
    });
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
    const team1Size = parseInt(document.getElementById('team1-size').value);
    const team1Level = parseInt(document.getElementById('team1-level').value);

    // Equipe 2
    const team2Type = document.getElementById('team2-type').value;
    const team2Size = parseInt(document.getElementById('team2-size')?.value) || 3;
    const team2Level = parseInt(document.getElementById('team2-level').value);

    // Reinitialiser la grille
    this.grid.resize(gridSize);

    // Generer les equipes
    const team1 = await this.generateTeam(1, team1Type, team1Size, team1Level);
    const team2 = await this.generateTeam(2, team2Type, team2Size, team2Level);

    if (team1.length === 0) {
      alert('Equipe 1 vide. Selectionnez des combattants.');
      return;
    }
    if (team2.length === 0) {
      alert('Equipe 2 vide. Selectionnez des monstres (quantite > 0).');
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
  }

  async generateTeam(teamNum, type, size, level) {
    const entities = [];

    if (type === 'heroes') {
      const selectedClasses = this.getSelectedClasses(teamNum);

      for (let i = 0; i < size; i++) {
        // Choisir une classe (cycler si pas assez de selections)
        const classIndex = i % Math.max(1, selectedClasses.length);
        const [className, subClassName] = selectedClasses.length > 0
          ? selectedClasses[classIndex].split('|')
          : ['Guerrier', 'Aventurier'];

        const hero = this.heroGenerator.generateHero({
          className,
          subClassName,
          level,
          team: teamNum,
          name: `${className} ${i + 1}`
        });

        if (hero) {
          entities.push(hero);
        }
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

  getSelectedClasses(teamNum) {
    const select = document.getElementById(`team${teamNum}-class`);
    return Array.from(select.selectedOptions).map(opt => opt.value);
  }

  getSelectedMonsters(teamNum) {
    const select = document.getElementById(`team${teamNum}-monsters`);
    return Array.from(select.selectedOptions).map(opt => opt.value);
  }

  createMonsterEntity(monsterName, team, index) {
    const monsterData = this.monstersData.find(m => m.nom === monsterName);
    if (!monsterData) return null;

    // Parser les attaques du monstre
    const attacks = this.parseMonsterAbilities(monsterData.abilites);

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
      spells: [] // Les monstres utilisent leurs attaques speciales
    });
  }

  parseMonsterAbilities(abilitiesHtml) {
    if (!abilitiesHtml) return [];

    const attacks = [];
    const cleanText = abilitiesHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

    // Parser les attaques basiques
    const damageMatch = cleanText.match(/Inflige\s+(\d+)\s+d[ée]g[âa]ts?\s*(\w+)?/gi);
    if (damageMatch) {
      for (const match of damageMatch) {
        const parts = match.match(/Inflige\s+(\d+)\s+d[ée]g[âa]ts?\s*(\w+)?/i);
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

    // Parser les attaques a distance
    const rangedMatch = cleanText.match(/Port[ée]e\s+(\d+)m.*?(\d+)\s+d[ée]g[âa]ts/gi);
    if (rangedMatch) {
      for (const match of rangedMatch) {
        const parts = match.match(/Port[ée]e\s+(\d+)m.*?(\d+)\s+d[ée]g[âa]ts/i);
        if (parts) {
          attacks.push({
            name: 'Attaque a distance',
            damage: parseInt(parts[2]),
            element: 'Physique',
            range: parseInt(parts[1])
          });
        }
      }
    }

    // Si pas d'attaques trouvees, attaque par defaut
    if (attacks.length === 0) {
      attacks.push({
        name: 'Attaque',
        damage: 5,
        element: 'Physique',
        range: 3
      });
    }

    return attacks;
  }

  showCombatArena() {
    this.configPanel.style.display = 'none';
    this.combatArena.style.display = 'block';
    this.resultsPanel.style.display = 'none';
    this.combatLog.innerHTML = '';
  }

  async executeTurn() {
    const entity = this.engine.getCurrentEntity();
    if (entity) {
      await this.engine.executeEntityTurn(entity);
    }
  }

  startAutoCombat() {
    document.getElementById('auto-combat').style.display = 'none';
    document.getElementById('pause-combat').style.display = 'inline-block';
    this.engine.startAutoMode();
  }

  pauseCombat() {
    document.getElementById('auto-combat').style.display = 'inline-block';
    document.getElementById('pause-combat').style.display = 'none';
    this.engine.pauseAutoMode();
  }

  backToConfig() {
    this.engine.reset();
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
    document.getElementById('team1-size').value = 3;
    document.getElementById('team2-size').value = 3;
    document.getElementById('team1-level').value = 5;
    document.getElementById('team2-level').value = 5;
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

    // Mettre a jour la grille
    this.grid.render(state.currentEntity);
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
}

window.CombatUI = CombatUI;
