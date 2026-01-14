/**
 * CombatGrid.js
 * Gestion de la grille de combat
 */

class CombatGrid {
  constructor(size = 20, cellSizeMeters = 3) {
    this.size = size;
    this.cellSizeMeters = cellSizeMeters;
    this.cellSizePixels = 30;
    this.grid = [];
    this.entities = [];
    this.canvas = null;
    this.ctx = null;
    this.iconManager = null;
    this.imageCache = new Map(); // Cache des images chargees

    this.initGrid();
  }

  setIconManager(iconManager) {
    this.iconManager = iconManager;
  }

  // Charger une image et la mettre en cache
  loadImage(url) {
    if (!url) return Promise.resolve(null);

    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url));
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => {
        this.imageCache.set(url, null);
        resolve(null);
      };
      img.src = url;
    });
  }

  // Obtenir l'URL de l'icone d'une entite
  getEntityIconUrl(entity) {
    if (!this.iconManager) return null;

    if (entity.type === 'hero' && entity.classe && entity.sousClasse) {
      return this.iconManager.getSubclassIcon(entity.classe, entity.sousClasse);
    } else if (entity.type === 'monster') {
      const baseName = entity.name.replace(/\s+\d+$/, '');
      return this.iconManager.getMonsterIcon(baseName);
    }
    return null;
  }

  // Precharger les icones de toutes les entites
  async preloadEntityIcons(entities) {
    const urls = entities.map(e => this.getEntityIconUrl(e)).filter(Boolean);
    const uniqueUrls = [...new Set(urls)];
    await Promise.all(uniqueUrls.map(url => this.loadImage(url)));
  }

  initGrid() {
    this.grid = [];
    for (let y = 0; y < this.size; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.size; x++) {
        this.grid[y][x] = {
          x,
          y,
          entity: null,
          terrain: 'normal' // 'normal', 'difficult', 'blocked'
        };
      }
    }
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.updateCanvasSize();
  }

  updateCanvasSize() {
    if (!this.canvas) return;
    const totalSize = this.size * this.cellSizePixels;
    this.canvas.width = totalSize;
    this.canvas.height = totalSize;
  }

  resize(newSize) {
    this.size = newSize;
    this.initGrid();
    this.updateCanvasSize();
  }

  // Convertir metres en cases
  metersToCell(meters) {
    return Math.floor(meters / this.cellSizeMeters);
  }

  // Convertir cases en metres
  cellToMeters(cells) {
    return cells * this.cellSizeMeters;
  }

  // Distance entre deux positions (en cases)
  getDistance(pos1, pos2) {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    // Distance de Chebyshev (mouvement en diagonale = 1)
    return Math.max(dx, dy);
  }

  // Distance en metres
  getDistanceMeters(pos1, pos2) {
    return this.cellToMeters(this.getDistance(pos1, pos2));
  }

  // Verifier si une position est valide
  isValidPosition(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  // Verifier si une case est libre
  isCellFree(x, y) {
    if (!this.isValidPosition(x, y)) return false;
    return this.grid[y][x].entity === null && this.grid[y][x].terrain !== 'blocked';
  }

  // Placer une entite
  placeEntity(entity, x, y) {
    if (!this.isCellFree(x, y)) return false;

    // Retirer de l'ancienne position
    if (entity.position) {
      const oldCell = this.grid[entity.position.y][entity.position.x];
      if (oldCell.entity === entity) {
        oldCell.entity = null;
      }
    }

    // Placer a la nouvelle position
    entity.position = { x, y };
    this.grid[y][x].entity = entity;
    return true;
  }

  // Deplacer une entite
  moveEntity(entity, newX, newY) {
    return this.placeEntity(entity, newX, newY);
  }

  // Retirer une entite
  removeEntity(entity) {
    if (entity.position) {
      const cell = this.grid[entity.position.y][entity.position.x];
      if (cell.entity === entity) {
        cell.entity = null;
      }
      entity.position = null;
    }
  }

  // Obtenir l'entite a une position
  getEntityAt(x, y) {
    if (!this.isValidPosition(x, y)) return null;
    return this.grid[y][x].entity;
  }

  // Trouver les cases accessibles pour un mouvement
  getReachableCells(entity, movementPoints) {
    const cells = this.metersToCell(movementPoints);
    const reachable = [];
    const startX = entity.position.x;
    const startY = entity.position.y;

    for (let dy = -cells; dy <= cells; dy++) {
      for (let dx = -cells; dx <= cells; dx++) {
        const x = startX + dx;
        const y = startY + dy;
        const distance = this.getDistance({ x: startX, y: startY }, { x, y });

        if (distance <= cells && this.isCellFree(x, y)) {
          reachable.push({ x, y, distance });
        }
      }
    }

    return reachable;
  }

  // Trouver les entites a portee
  getEntitiesInRange(position, rangeMeters, excludeEntity = null) {
    const rangeCells = this.metersToCell(rangeMeters);
    const entities = [];

    for (let dy = -rangeCells; dy <= rangeCells; dy++) {
      for (let dx = -rangeCells; dx <= rangeCells; dx++) {
        const x = position.x + dx;
        const y = position.y + dy;

        if (!this.isValidPosition(x, y)) continue;

        const entity = this.grid[y][x].entity;
        if (entity && entity !== excludeEntity) {
          const distance = this.getDistanceMeters(position, { x, y });
          if (distance <= rangeMeters) {
            entities.push({ entity, distance });
          }
        }
      }
    }

    return entities.sort((a, b) => a.distance - b.distance);
  }

  // Trouver les allies a portee
  getAlliesInRange(entity, rangeMeters) {
    const entitiesInRange = this.getEntitiesInRange(entity.position, rangeMeters, entity);
    return entitiesInRange.filter(e => e.entity.team === entity.team);
  }

  // Trouver les ennemis a portee
  getEnemiesInRange(entity, rangeMeters) {
    const entitiesInRange = this.getEntitiesInRange(entity.position, rangeMeters, entity);
    return entitiesInRange.filter(e => e.entity.team !== entity.team);
  }

  // Trouver la meilleure position pour se rapprocher d'une cible
  findBestPositionTowards(entity, target, movementPoints) {
    const reachable = this.getReachableCells(entity, movementPoints);
    let bestCell = null;
    let bestDistance = Infinity;

    for (const cell of reachable) {
      const distToTarget = this.getDistance(cell, target.position);
      if (distToTarget < bestDistance) {
        bestDistance = distToTarget;
        bestCell = cell;
      }
    }

    return bestCell;
  }

  // Trouver la meilleure position pour fuir un ennemi
  findBestPositionAway(entity, threats, movementPoints) {
    const reachable = this.getReachableCells(entity, movementPoints);
    let bestCell = null;
    let bestTotalDistance = -Infinity;

    for (const cell of reachable) {
      let totalDistance = 0;
      for (const threat of threats) {
        totalDistance += this.getDistance(cell, threat.position);
      }
      if (totalDistance > bestTotalDistance) {
        bestTotalDistance = totalDistance;
        bestCell = cell;
      }
    }

    return bestCell;
  }

  // Dessiner la grille
  render(activeEntity = null, highlightCells = []) {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const cellSize = this.cellSizePixels;

    // Effacer
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner les cases
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cell = this.grid[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        // Fond de case
        if (cell.terrain === 'difficult') {
          ctx.fillStyle = '#3d3d2e';
        } else if (cell.terrain === 'blocked') {
          ctx.fillStyle = '#2e1a1a';
        } else {
          ctx.fillStyle = '#16213e';
        }
        ctx.fillRect(px, py, cellSize, cellSize);

        // Bordure
        ctx.strokeStyle = '#3a3a5e';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }

    // Highlighter les cases accessibles
    for (const cell of highlightCells) {
      const px = cell.x * cellSize;
      const py = cell.y * cellSize;
      ctx.fillStyle = 'rgba(74, 144, 217, 0.3)';
      ctx.fillRect(px, py, cellSize, cellSize);
    }

    // Dessiner les entites
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const entity = this.grid[y][x].entity;
        if (entity) {
          this.renderEntity(entity, x, y, entity === activeEntity);
        }
      }
    }
  }

  renderEntity(entity, x, y, isActive) {
    const ctx = this.ctx;
    const cellSize = this.cellSizePixels;
    const px = x * cellSize;
    const py = y * cellSize;
    const centerX = px + cellSize / 2;
    const centerY = py + cellSize / 2;
    const radius = cellSize * 0.35;
    const iconSize = cellSize - 6;

    // Halo pour l'entite active
    if (isActive) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.fill();
    }

    // Essayer d'afficher l'icone
    const iconUrl = this.getEntityIconUrl(entity);
    const cachedImage = iconUrl ? this.imageCache.get(iconUrl) : null;

    if (cachedImage) {
      // Dessiner l'icone avec bordure
      const imgX = px + 3;
      const imgY = py + 2;

      // Fond selon l'equipe (derriere l'image)
      ctx.fillStyle = entity.isDead() ? '#555' : (entity.team === 1 ? '#4a90d9' : '#dc3545');
      ctx.fillRect(imgX - 1, imgY - 1, iconSize + 2, iconSize + 2);

      // Dessiner l'image
      ctx.save();
      ctx.beginPath();
      ctx.rect(imgX, imgY, iconSize, iconSize - 4);
      ctx.clip();
      ctx.drawImage(cachedImage, imgX, imgY, iconSize, iconSize - 4);
      ctx.restore();

      // Bordure coloree selon l'equipe/etat actif
      ctx.strokeStyle = isActive ? '#ffd700' : (entity.team === 1 ? '#4a90d9' : '#dc3545');
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.strokeRect(imgX, imgY, iconSize, iconSize - 4);

      // Opacite si mort
      if (entity.isDead()) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(imgX, imgY, iconSize, iconSize - 4);
      }
    } else {
      // Fallback: cercle avec initiale
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

      if (entity.isDead()) {
        ctx.fillStyle = '#555';
      } else if (entity.team === 1) {
        ctx.fillStyle = '#4a90d9';
      } else {
        ctx.fillStyle = '#dc3545';
      }
      ctx.fill();

      ctx.strokeStyle = isActive ? '#ffd700' : '#fff';
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = entity.name.charAt(0).toUpperCase();
      ctx.fillText(initial, centerX, centerY);
    }

    // Barre de vie (toujours affichee)
    const barWidth = cellSize - 4;
    const barHeight = 4;
    const barX = px + 2;
    const barY = py + cellSize - 6;
    const hpPercent = entity.currentHp / entity.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    let hpColor = '#28a745';
    if (hpPercent < 0.3) hpColor = '#dc3545';
    else if (hpPercent < 0.6) hpColor = '#ffc107';

    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }

  // Placer les equipes de part et d'autre de la grille
  placeTeams(team1Entities, team2Entities) {
    // Equipe 1 a gauche
    const team1StartX = 1;
    const team1StartY = Math.floor((this.size - team1Entities.length) / 2);

    for (let i = 0; i < team1Entities.length; i++) {
      const y = team1StartY + i;
      this.placeEntity(team1Entities[i], team1StartX, y);
    }

    // Equipe 2 a droite
    const team2StartX = this.size - 2;
    const team2StartY = Math.floor((this.size - team2Entities.length) / 2);

    for (let i = 0; i < team2Entities.length; i++) {
      const y = team2StartY + i;
      this.placeEntity(team2Entities[i], team2StartX, y);
    }
  }
}

window.CombatGrid = CombatGrid;
