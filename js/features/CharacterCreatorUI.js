/**
 * CharacterCreatorUI.js
 * Interface utilisateur pour la création de personnage
 */

class CharacterCreatorUI {
  constructor(creator) {
    this.creator = creator;
    this.currentConfig = {
      nomJoueur: 'Joueur',
      nomPersonnage: 'Personnage',
      experience: 0,
      className: null,
      subClassName: null,
      level: 1,
      element: null,
      dons: [],
      carteDestin: null,
      carteDestinChoices: {},
      statChoices: {},
      donBonuses: {},
      equipement: [],
      consommables: {}, // { numero: quantité }
      budgetEclats: 120
    };
    this.calculatedCharacter = null;
    this.elementIcons = {
      "Feu": "data/images/Elements/Feu.png",
      "Eau": "data/images/Elements/Eau.png",
      "Terre": "data/images/Elements/Terre.png",
      "Air": "data/images/Elements/Air.png",
      "Lumière": "data/images/Elements/Lumière.png",
      "Nuit": "data/images/Elements/Nuit.png",
      "Divin": "data/images/Elements/Divin.png",
      "Maléfique": "data/images/Elements/Maléfique.png"
    };
    // Track si le formulaire a été ouvert en mode mobile (fullscreen)
    this.openedInMobileMode = false;
  }

  /**
   * Générer le HTML du formulaire
   */
  generateFormHTML() {
    return `
      <!-- Bouton d'entrée (visible sur tous les appareils quand formulaire fermé) -->
      <div id="form-entry" class="form-entry">
        <h3>📝 Créateur de personnage</h3>
        <p>Créez votre fiche de personnage avec calcul automatique des statistiques.</p>
        <button id="btn-enter-form" class="btn-base btn-enter-form">▶ Ouvrir le formulaire</button>
      </div>

      <div class="character-creator-form" style="display: none;">
        <div class="form-header">
          <h3>Créer votre personnage</h3>
          <div class="form-header-buttons">
            <button id="btn-close-form" class="btn-base btn-close-form">✕ Fermer</button>
            <button id="btn-reset" class="btn-base btn-reset">🔄 Reset</button>
          </div>
        </div>

        <!-- Modal personnalisée pour les alertes -->
        <div id="form-modal" class="form-modal" style="display: none;">
          <div class="form-modal-content">
            <p id="form-modal-message"></p>
            <button id="form-modal-close" class="btn-base" style="background: var(--accent); color: white;">OK</button>
          </div>
        </div>

        <!-- Niveau -->
        <div class="form-section">
          <h4>Niveau</h4>
          <input type="number" id="char-level" value="1" min="1" max="20" />
        </div>

        <!-- Classe -->
        <div class="form-section">
          <h4>Classe</h4>
          <select id="char-class">
            <option value="">Sélectionnez une classe...</option>
          </select>
        </div>

        <!-- Sous-classe -->
        <div id="subclass-section" class="form-section" style="display: none;">
          <h4>Sous-classe</h4>
          <select id="char-subclass">
            <option value="">Sélectionnez une sous-classe...</option>
          </select>
        </div>

        <!-- Élément -->
        <div id="element-section" class="form-section" style="display: none;">
          <h4>Élément d'affiliation</h4>
          <p id="element-selected" class="text-muted" style="font-size: 0.9rem; margin-bottom: 0.75rem;">Aucun élément sélectionné</p>
          <div id="element-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem;">
            <!-- Elements will be inserted here -->
          </div>
        </div>

        <!-- Carte du destin -->
        <div id="carte-destin-section" class="form-section" style="display: none;">
          <h4>Carte du destin</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; justify-content: center;">
            <button id="btn-tirer-carte" class="btn-base" style="background: var(--gold); color: white;">🎲 Tirer aléatoirement (d6)</button>
            <button id="btn-choisir-carte" class="btn-base" style="background: var(--bronze); color: white;">📋 Choisir manuellement</button>
          </div>
          <div id="carte-destin-manual" style="display: none; margin-bottom: 0.75rem;">
            <label style="display: block; color: var(--text-muted); margin-bottom: 0.25rem;">Sélectionnez une carte :</label>
            <select id="carte-destin-select">
              <option value="">Choisissez une carte...</option>
              <option value="0">Carte 1: Initiative/Fortune ou Esquive/Résistance</option>
              <option value="1">Carte 2: 2 points de statistiques</option>
              <option value="2">Carte 3: 4 PV ou 6 Mana</option>
              <option value="3">Carte 4: Une compétence rang 1</option>
              <option value="4">Carte 5: 2 éléments +5 armure élémentaire</option>
              <option value="5">Carte 6: 1 point de Don général</option>
            </select>
          </div>
          <div id="carte-destin-result" style="margin-top: 0.75rem; padding: 1rem; border: 2px solid var(--gold); border-radius: 8px; background: var(--card); display: none;">
            <p id="carte-destin-text" style="color: var(--text); margin-bottom: 0.5rem;"></p>
            <div id="carte-destin-choices"></div>
          </div>
        </div>

        <!-- Dons -->
        <div id="dons-section" class="form-section" style="display: none;">
          <h4>Dons (<span id="dons-count">0</span> / <span id="dons-max">2</span>)</h4>
          <p id="dons-info" style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">Les dons grisés ne respectent pas les prérequis de votre personnage.</p>
          <div id="dons-available" style="display: grid; gap: 0.5rem; margin-bottom: 0.75rem;"></div>
          <div id="dons-selected" style="padding: 0.75rem; border: 2px solid var(--ui-border); border-radius: 8px; background: var(--ui-blue-dark); min-height: 60px;">
            <p style="color: var(--text-muted); font-size: 0.9rem;">Dons sélectionnés : <span id="dons-list">Aucun</span></p>
          </div>
          <div id="don-statistiques-controls" style="display: none; margin-top: 1rem; padding: 1rem; border: 2px solid var(--gold); border-radius: 8px; background: var(--card);"></div>
        </div>

        <!-- Équipement -->
        <div id="equipement-section" class="form-section" style="display: none;">
          <h4>Équipement de départ (120 éclats)</h4>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0.75rem; background: var(--ui-blue-dark); border-radius: 8px; border: 2px solid var(--ui-border);">
            <span style="color: var(--paper-ink); font-weight: bold;"><img src="data/images/Autre/stats/éclats.png" alt="éclats" class="eclats-icon" style="width: 16px; height: 16px; vertical-align: middle;"> Budget restant:</span>
            <span id="budget-restant" style="color: #22c55e; font-size: 1.2rem; font-weight: bold;">120</span>
          </div>
          <div id="equipement-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
            <!-- Equipment items will be inserted here -->
          </div>
          <div style="padding: 1rem; border: 2px solid var(--ui-border); border-radius: 8px; background: var(--ui-blue-dark);">
            <h5 style="color: var(--paper-ink); margin-bottom: 0.5rem;">Équipement sélectionné:</h5>
            <div id="equipement-selected" style="color: var(--text-muted); min-height: 40px;">Aucun équipement sélectionné</div>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1.5rem;">
          <button id="btn-calculate" class="btn-base" style="background: var(--accent); color: white;">📊 Calculer les stats</button>
        </div>

        <!-- Statistiques -->
        <div id="stats-preview" style="display: none;">
          <h4 style="color: var(--accent); margin-bottom: 0.75rem;">📊 Aperçu des statistiques</h4>
          <div id="stats-content" style="font-family: monospace; font-size: 0.9rem; color: var(--text);"></div>
        </div>
      </div>
    `;
  }

  /**
   * Initialiser le formulaire
   */
  async init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = this.generateFormHTML();

    // Charger les classes
    this.populateClasses();

    // Créer les boutons d'éléments
    this.createElementButtons();

    // Créer les cartes d'équipement
    this.createEquipmentCards();

    // Attacher les événements
    this.attachEvents();
  }

  /**
   * Remplir la liste des classes
   */
  populateClasses() {
    const classSelect = document.getElementById('char-class');
    if (!classSelect || !this.creator.classesData) return;

    this.creator.classesData.forEach(classe => {
      const option = document.createElement('option');
      option.value = classe.nom;
      option.textContent = classe.nom;
      classSelect.appendChild(option);
    });
  }

  /**
   * Créer les boutons d'éléments avec icônes
   */
  createElementButtons() {
    const grid = document.getElementById('element-grid');
    if (!grid) return;

    const elements = ['Feu', 'Eau', 'Terre', 'Air', 'Lumière', 'Nuit', 'Divin', 'Maléfique'];

    elements.forEach(element => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'element-btn';
      btn.dataset.element = element;

      const img = document.createElement('img');
      img.src = this.elementIcons[element];
      img.alt = element;

      const text = document.createElement('span');
      text.textContent = element;

      btn.appendChild(img);
      btn.appendChild(text);

      btn.addEventListener('click', () => this.selectElement(element));

      grid.appendChild(btn);
    });
  }

  /**
   * Sélectionner un élément
   */
  selectElement(element) {
    this.currentConfig.element = element;

    // Mettre à jour le texte
    const selectedText = document.getElementById('element-selected');
    if (selectedText) {
      selectedText.textContent = `Élément sélectionné: ${element}`;
      selectedText.style.color = '#22c55e';
    }

    // Mettre à jour le style des boutons avec la classe CSS
    const buttons = document.querySelectorAll('.element-btn');
    buttons.forEach(btn => {
      if (btn.dataset.element === element) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });

    this.updateUI();
  }

  /**
   * Créer les cartes d'équipement
   */
  createEquipmentCards() {
    const grid = document.getElementById('equipement-grid');
    if (!grid || !this.creator.objetsDepart || this.creator.objetsDepart.length === 0) {
      return;
    }

    this.creator.objetsDepart.forEach(objet => {
      const prix = this.creator.extractPrice(objet.prix);
      const isConsommable = objet.tags && (objet.tags.includes('Consommable') || objet.tags.includes('Nourriture'));

      const card = document.createElement('div');
      card.className = 'equipment-card';
      card.dataset.numero = objet.numero;

      // Créer l'image
      const img = document.createElement('img');
      img.src = objet.image;
      img.alt = objet.nom;

      // Créer le nom
      const title = document.createElement('h6');
      title.textContent = objet.nom;

      // Créer le conteneur du bas
      const bottomDiv = document.createElement('div');
      bottomDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

      // Créer le prix
      const priceSpan = document.createElement('span');
      priceSpan.innerHTML = `${window.EclatsIcon?.small || '💎'} ${prix} éclats`;
      priceSpan.style.cssText = 'color: var(--text-muted); font-size: 0.85rem;';

      if (isConsommable) {
        // Pour les consommables : afficher des boutons +/- et la quantité
        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

        const btnMinus = document.createElement('button');
        btnMinus.className = 'btn-minus-consumable btn-base';
        btnMinus.textContent = '−';
        btnMinus.style.cssText = 'padding: 0.25rem 0.5rem; background: #ef4444; color: white; min-width: 32px;';
        btnMinus.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.changeConsommableQuantity(objet, -1);
        });

        const quantitySpan = document.createElement('span');
        quantitySpan.className = 'consumable-quantity';
        quantitySpan.dataset.numero = objet.numero;
        quantitySpan.textContent = '0';
        quantitySpan.style.cssText = 'min-width: 1.5rem; text-align: center; font-weight: bold; color: var(--paper-ink);';

        const btnPlus = document.createElement('button');
        btnPlus.className = 'btn-plus-consumable btn-base';
        btnPlus.textContent = '+';
        btnPlus.style.cssText = 'padding: 0.25rem 0.5rem; background: #22c55e; color: white; min-width: 32px;';
        btnPlus.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.changeConsommableQuantity(objet, 1);
        });

        controlsDiv.appendChild(btnMinus);
        controlsDiv.appendChild(quantitySpan);
        controlsDiv.appendChild(btnPlus);
        bottomDiv.appendChild(priceSpan);
        bottomDiv.appendChild(controlsDiv);
      } else {
        // Pour l'équipement normal : bouton simple
        const btn = document.createElement('button');
        btn.className = 'btn-add-equipment btn-base';
        btn.dataset.numero = objet.numero;
        btn.textContent = '+';
        btn.style.cssText = 'padding: 0.25rem 0.75rem; background: #22c55e; color: white; min-width: 40px;';

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleEquipment(objet);
        });

        bottomDiv.appendChild(priceSpan);
        bottomDiv.appendChild(btn);

        // Permettre de cliquer sur la carte entière pour équipement normal
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-add-equipment') || e.target.closest('.btn-add-equipment')) {
            return;
          }
          this.toggleEquipment(objet);
        });
      }

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(bottomDiv);

      grid.appendChild(card);
    });
  }

  /**
   * Changer la quantité d'un consommable
   */
  changeConsommableQuantity(objet, delta) {
    const prix = this.creator.extractPrice(objet.prix);
    const currentQty = this.currentConfig.consommables[objet.numero] || 0;
    const newQty = Math.max(0, currentQty + delta);

    // Vérifier le budget
    const costDelta = (newQty - currentQty) * prix;
    if (costDelta > this.currentConfig.budgetEclats) {
      this.showModal(`Budget insuffisant! Il vous reste ${this.currentConfig.budgetEclats} éclats.`);
      return;
    }

    // Mettre à jour la quantité
    if (newQty === 0) {
      delete this.currentConfig.consommables[objet.numero];
    } else {
      this.currentConfig.consommables[objet.numero] = newQty;
    }
    this.currentConfig.budgetEclats -= costDelta;

    // Mettre à jour l'affichage
    const quantitySpan = document.querySelector(`.consumable-quantity[data-numero="${objet.numero}"]`);
    if (quantitySpan) {
      quantitySpan.textContent = newQty;
    }

    this.updateEquipmentUI();
  }

  /**
   * Ajouter/Retirer un équipement
   */
  toggleEquipment(objet) {
    const index = this.currentConfig.equipement.findIndex(eq => eq.numero === objet.numero);
    const prix = this.creator.extractPrice(objet.prix);

    if (index > -1) {
      // Retirer l'objet
      this.currentConfig.equipement.splice(index, 1);
      this.currentConfig.budgetEclats += prix;
    } else {
      // Vérifier le budget
      if (prix > this.currentConfig.budgetEclats) {
        this.showModal(`Budget insuffisant! Il vous reste ${this.currentConfig.budgetEclats} éclats.`);
        return;
      }
      // Ajouter l'objet
      this.currentConfig.equipement.push(objet);
      this.currentConfig.budgetEclats -= prix;
    }

    this.updateEquipmentUI();
  }

  /**
   * Mettre à jour l'UI de l'équipement
   */
  updateEquipmentUI() {
    // Mettre à jour le budget
    const budgetSpan = document.getElementById('budget-restant');
    if (budgetSpan) {
      budgetSpan.textContent = this.currentConfig.budgetEclats;
      budgetSpan.style.color = this.currentConfig.budgetEclats < 20 ? '#f59e0b' : '#22c55e';
    }

    // Mettre à jour la liste des équipements sélectionnés
    const selectedDiv = document.getElementById('equipement-selected');
    if (selectedDiv) {
      const items = [];

      // Ajouter les équipements
      this.currentConfig.equipement.forEach(eq => {
        const prix = this.creator.extractPrice(eq.prix);
        items.push(`<div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #ccc;">
          <span style="color: #333;">${eq.nom}</span>
          <span style="color: #666;">${window.EclatsIcon?.small || '💎'} ${prix}</span>
        </div>`);
      });

      // Ajouter les consommables
      Object.entries(this.currentConfig.consommables).forEach(([numero, qty]) => {
        const objet = this.creator.objetsDepart.find(o => o.numero === parseInt(numero));
        if (objet) {
          const prix = this.creator.extractPrice(objet.prix);
          items.push(`<div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #ccc;">
            <span style="color: #333;">${objet.nom} x${qty}</span>
            <span style="color: #666;">${window.EclatsIcon?.small || '💎'} ${prix * qty}</span>
          </div>`);
        }
      });

      if (items.length === 0) {
        selectedDiv.innerHTML = '<span style="color: #666;">Aucun équipement sélectionné</span>';
      } else {
        selectedDiv.innerHTML = items.join('');
      }
    }

    // Mettre à jour le style des cartes avec classes CSS
    document.querySelectorAll('.equipment-card').forEach(card => {
      const numero = parseInt(card.dataset.numero);
      const isSelected = this.currentConfig.equipement.some(eq => eq.numero === numero);

      if (isSelected) {
        card.classList.add('selected');
        const btn = card.querySelector('.btn-add-equipment');
        if (btn) {
          btn.textContent = '−';
          btn.style.background = '#f59e0b';
        }
      } else {
        card.classList.remove('selected');
        const btn = card.querySelector('.btn-add-equipment');
        if (btn) {
          btn.textContent = '+';
          btn.style.background = '#22c55e';
        }
      }
    });
  }

  /**
   * Attacher les événements
   */
  attachEvents() {
    // Sélection de classe
    const classSelect = document.getElementById('char-class');
    classSelect?.addEventListener('change', (e) => this.onClassChange(e.target.value));

    // Sélection de sous-classe
    const subclassSelect = document.getElementById('char-subclass');
    subclassSelect?.addEventListener('change', (e) => this.onSubclassChange(e.target.value));

    // Niveau
    const levelInput = document.getElementById('char-level');
    levelInput?.addEventListener('change', (e) => {
      this.currentConfig.level = parseInt(e.target.value);
      this.updateUI();
      // Rafraîchir les dons car certains ont des prérequis de niveau
      if (this.currentConfig.subClassName) {
        this.updateDonsAvailable();
      }
    });

    // Tirage carte du destin
    const btnTirerCarte = document.getElementById('btn-tirer-carte');
    btnTirerCarte?.addEventListener('click', () => this.tirerCarteDestin());

    // Bouton choisir carte manuellement
    const btnChoisirCarte = document.getElementById('btn-choisir-carte');
    btnChoisirCarte?.addEventListener('click', () => this.showCarteManualSelect());

    // Sélection manuelle de carte
    const carteSelect = document.getElementById('carte-destin-select');
    carteSelect?.addEventListener('change', (e) => {
      if (e.target.value !== '') {
        this.choisirCarte(parseInt(e.target.value));
      }
    });

    // Bouton calculer
    const btnCalculate = document.getElementById('btn-calculate');
    btnCalculate?.addEventListener('click', () => this.calculateAndPreview());

    // Bouton reset
    const btnReset = document.getElementById('btn-reset');
    btnReset?.addEventListener('click', () => this.resetForm());

    // Bouton d'entrée (ouvre le formulaire)
    const btnEnterForm = document.getElementById('btn-enter-form');
    btnEnterForm?.addEventListener('click', () => this.openForm());

    // Bouton fermer le formulaire
    const btnCloseForm = document.getElementById('btn-close-form');
    btnCloseForm?.addEventListener('click', () => this.closeForm());

    // Bouton fermer la modal
    const btnModalClose = document.getElementById('form-modal-close');
    btnModalClose?.addEventListener('click', () => this.hideModal());

    // Gérer la sortie du plein écran (mobile)
    document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
  }

  /**
   * Afficher une modal au lieu d'alert (ne sort pas du fullscreen)
   */
  showModal(message) {
    const modal = document.getElementById('form-modal');
    const messageEl = document.getElementById('form-modal-message');
    if (modal && messageEl) {
      messageEl.textContent = message;
      modal.style.display = 'flex';
    }
  }

  /**
   * Cacher la modal
   */
  hideModal() {
    const modal = document.getElementById('form-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Ouvrir le formulaire (fullscreen sur mobile, normal sur PC)
   */
  async openForm() {
    const form = document.querySelector('.character-creator-form');
    const formEntry = document.getElementById('form-entry');
    if (!form) return;

    // Détecter le mobile par l'écran (pas par la fenêtre qui change en paysage)
    const isMobile = window.innerWidth <= 768 ||
                     (window.screen && window.screen.width <= 768) ||
                     ('ontouchstart' in window && window.innerWidth < 1024);

    // Cacher le bouton d'entrée
    if (formEntry) formEntry.style.display = 'none';

    // Afficher le formulaire
    form.style.display = 'block';

    // Sur mobile, entrer en plein écran
    if (isMobile) {
      this.openedInMobileMode = true; // Tracker qu'on a ouvert en mode mobile
      try {
        if (form.requestFullscreen) {
          await form.requestFullscreen();
        } else if (form.webkitRequestFullscreen) {
          await form.webkitRequestFullscreen();
        }

        // Forcer l'orientation paysage
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock('landscape');
          } catch (e) {
            console.log('Orientation lock not supported:', e);
          }
        }

        form.classList.add('fullscreen-mode');
      } catch (error) {
        console.error('Fullscreen error:', error);
      }
    } else {
      this.openedInMobileMode = false;
    }
  }

  /**
   * Fermer le formulaire
   */
  async closeForm() {
    const form = document.querySelector('.character-creator-form');
    const formEntry = document.getElementById('form-entry');

    // Si ouvert en mode mobile, sortir du fullscreen
    if (this.openedInMobileMode && (document.fullscreenElement || document.webkitFullscreenElement)) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }

        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (error) {
        console.error('Exit fullscreen error:', error);
      }
    }

    // Cacher le formulaire et afficher l'entrée
    if (form) {
      form.style.display = 'none';
      form.classList.remove('fullscreen-mode');
    }
    if (formEntry) formEntry.style.display = 'block';

    // Reset le flag
    this.openedInMobileMode = false;
  }

  /**
   * Gérer le changement d'état plein écran (quand l'utilisateur sort via geste/bouton système)
   */
  onFullscreenChange() {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    const form = document.querySelector('.character-creator-form');
    const formEntry = document.getElementById('form-entry');

    // Utiliser le flag au lieu de vérifier la largeur (qui change en mode paysage)
    if (!isFullscreen && this.openedInMobileMode) {
      // On est sorti du plein écran sur mobile (via geste ou bouton système)
      if (form) {
        form.classList.remove('fullscreen-mode');
        form.style.display = 'none';
      }
      if (formEntry) formEntry.style.display = 'block';

      // Déverrouiller l'orientation
      if (screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
        } catch (e) {}
      }

      // Reset le flag
      this.openedInMobileMode = false;
    }
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm() {
    // Réinitialiser la configuration
    this.currentConfig = {
      nomJoueur: 'Joueur',
      nomPersonnage: 'Personnage',
      experience: 0,
      className: null,
      subClassName: null,
      level: 1,
      element: null,
      dons: [],
      carteDestin: null,
      carteDestinChoices: {},
      statChoices: {},
      donBonuses: {},
      equipement: [],
      consommables: {},
      budgetEclats: 120
    };

    // Réinitialiser le personnage calculé
    this.calculatedCharacter = null;

    // Réinitialiser les champs du formulaire
    document.getElementById('char-level').value = 1;
    document.getElementById('char-class').value = '';
    document.getElementById('char-subclass').value = '';

    // Cacher les sections
    document.getElementById('subclass-section').style.display = 'none';
    document.getElementById('element-section').style.display = 'none';
    document.getElementById('carte-destin-section').style.display = 'none';
    document.getElementById('dons-section').style.display = 'none';
    document.getElementById('equipement-section').style.display = 'none';
    document.getElementById('stats-preview').style.display = 'none';

    // Réinitialiser la carte du destin
    document.getElementById('carte-destin-result').style.display = 'none';
    document.getElementById('carte-destin-manual').style.display = 'none';
    document.getElementById('carte-destin-select').value = '';

    // Réinitialiser l'élément sélectionné
    document.getElementById('element-selected').textContent = 'Aucun élément sélectionné';
    document.getElementById('element-selected').style.color = '';
    document.querySelectorAll('.element-btn').forEach(btn => btn.classList.remove('selected'));

    // Réinitialiser les dons
    document.getElementById('dons-count').textContent = '0';
    document.getElementById('dons-list').textContent = 'Aucun';
    document.getElementById('don-statistiques-controls').style.display = 'none';

    // Réinitialiser l'équipement
    document.getElementById('budget-restant').textContent = '120';
    document.getElementById('equipement-selected').textContent = 'Aucun équipement sélectionné';
    document.querySelectorAll('.equipment-card').forEach(card => {
      card.classList.remove('selected');
      const btn = card.querySelector('.btn-add-equipment');
      if (btn) {
        btn.textContent = '+';
        btn.style.background = '#22c55e';
      }
    });
    document.querySelectorAll('.consumable-quantity').forEach(span => {
      span.textContent = '0';
    });

    // Scroller vers le haut
    document.querySelector('.character-creator-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Gestion du changement de classe
   */
  onClassChange(className) {
    if (!className) return;

    this.currentConfig.className = className;
    this.currentConfig.subClassName = null;

    const classe = this.creator.classesData.find(c => c.nom === className);
    if (!classe) return;

    // Afficher la sélection de sous-classe
    const subclassSection = document.getElementById('subclass-section');
    const subclassSelect = document.getElementById('char-subclass');

    subclassSelect.innerHTML = '<option value="">Sélectionnez une sous-classe...</option>';
    classe.sousClasses.forEach(sc => {
      const option = document.createElement('option');
      option.value = sc.nom;
      option.textContent = sc.nom;
      subclassSelect.appendChild(option);
    });

    subclassSection.style.display = 'block';
  }

  /**
   * Gestion du changement de sous-classe
   */
  onSubclassChange(subClassName) {
    if (!subClassName) return;

    this.currentConfig.subClassName = subClassName;

    // Afficher les sections suivantes
    document.getElementById('element-section').style.display = 'block';
    document.getElementById('carte-destin-section').style.display = 'block';
    document.getElementById('dons-section').style.display = 'block';
    document.getElementById('equipement-section').style.display = 'block';

    this.updateDonsAvailable();
    this.updateUI();
  }

  /**
   * Afficher le sélecteur manuel de carte
   */
  showCarteManualSelect() {
    const manualDiv = document.getElementById('carte-destin-manual');
    const resultDiv = document.getElementById('carte-destin-result');

    // Afficher le select
    manualDiv.style.display = 'block';

    // Cacher le résultat précédent
    resultDiv.style.display = 'none';
  }

  /**
   * Choisir une carte manuellement
   */
  choisirCarte(carteIndex) {
    this.afficherCarte(carteIndex);
  }

  /**
   * Tirer une carte du destin aléatoirement
   */
  tirerCarteDestin() {
    const result = Math.floor(Math.random() * 6);

    // Cacher le select manuel
    const manualDiv = document.getElementById('carte-destin-manual');
    manualDiv.style.display = 'none';

    this.afficherCarte(result);
  }

  /**
   * Afficher une carte du destin et ses choix
   */
  afficherCarte(result) {
    this.currentConfig.carteDestin = result;
    // Réinitialiser les choix précédents
    this.currentConfig.carteDestinChoices = {};

    const resultDiv = document.getElementById('carte-destin-result');
    const textP = document.getElementById('carte-destin-text');
    const choicesDiv = document.getElementById('carte-destin-choices');

    textP.textContent = `Carte ${result + 1}: ${this.creator.cartesDestin[result]}`;
    resultDiv.style.display = 'block';

    // Afficher les choix selon la carte
    choicesDiv.innerHTML = '';

    // Carte 0: Choix entre initiative/fortune ou esquive/résistance
    if (result === 0) {
      choicesDiv.innerHTML = `
        <div style="margin-top: 0.5rem;">
          <label style="display: block; color: var(--text-muted); margin-bottom: 0.25rem;">Choisissez votre bonus :</label>
          <select id="carte-choice-0">
            <option value="initiative">+5 Initiative et +3 Fortune</option>
            <option value="esquive">+1 Esquive et +1 Résistance altérations</option>
          </select>
        </div>
      `;
      // Initialiser avec la valeur par défaut
      this.currentConfig.carteDestinChoices.option = 'initiative';
      document.getElementById('carte-choice-0')?.addEventListener('change', (e) => {
        this.currentConfig.carteDestinChoices.option = e.target.value;
      });
    }

    // Carte 1: 2 points de stats à répartir
    if (result === 1) {
      // Calculer les stats de base pour connaître les stats non-maximales
      if (!this.currentConfig.className || !this.currentConfig.subClassName) {
        choicesDiv.innerHTML = `
          <div style="margin-top: 0.5rem;">
            <p style="color: var(--gold); font-size: 0.9rem; font-style: italic;">⚠️ Veuillez d'abord sélectionner une classe et une sous-classe pour voir les options disponibles.</p>
          </div>
        `;
        return;
      }

      const classe = this.creator.classesData.find(c => c.nom === this.currentConfig.className);
      const sousClasse = classe.sousClasses.find(sc => sc.nom === this.currentConfig.subClassName);
      const baseStats = this.creator.parseBaseStats(sousClasse.base);

      // Trouver la valeur max
      const maxValue = Math.max(...Object.values(baseStats));

      // Filtrer les stats qui ne sont pas au max
      const availableStats = Object.entries(baseStats)
        .filter(([stat, value]) => value < maxValue)
        .map(([stat]) => stat);

      if (availableStats.length === 0) {
        choicesDiv.innerHTML = `
          <div style="margin-top: 0.5rem;">
            <p style="color: var(--text); font-size: 0.9rem;">Toutes vos statistiques ont la même valeur. Vous pouvez répartir 2 points dans n'importe quelle statistique.</p>
            <div id="carte-stats-controls" style="margin-top: 0.75rem;"></div>
          </div>
        `;
        this.renderStatsControls(['Force', 'Agilité', 'Endurance', 'Intelligence', 'Volonté', 'Chance'], baseStats);
      } else {
        choicesDiv.innerHTML = `
          <div style="margin-top: 0.5rem;">
            <p style="color: var(--text-muted); margin-bottom: 0.5rem;">Répartissez 2 points parmi vos statistiques les plus faibles :</p>
            <p style="color: var(--text); font-size: 0.85rem; margin-bottom: 0.5rem;">Stats de base: ${Object.entries(baseStats).map(([k,v]) => `${k}: ${v}`).join(', ')}</p>
            <p style="color: var(--gold); font-size: 0.85rem; margin-bottom: 0.75rem;">⚠️ Statistiques exclues (valeur max ${maxValue}): ${Object.entries(baseStats).filter(([k,v]) => v === maxValue).map(([k]) => k).join(', ')}</p>
            <div id="carte-stats-controls" style="margin-top: 0.75rem;"></div>
          </div>
        `;
        this.renderStatsControls(availableStats, baseStats);
      }
    }

    // Carte 2: Vie ou Mana
    if (result === 2) {
      choicesDiv.innerHTML = `
        <div style="margin-top: 0.5rem;">
          <label style="display: block; color: var(--text-muted); margin-bottom: 0.25rem;">Choisissez votre bonus :</label>
          <select id="carte-choice-2">
            <option value="vie">+4 Points de vie maximum</option>
            <option value="mana">+6 Points de mana maximum</option>
          </select>
        </div>
      `;
      // Initialiser avec la valeur par défaut
      this.currentConfig.carteDestinChoices.option = 'vie';
      document.getElementById('carte-choice-2')?.addEventListener('change', (e) => {
        this.currentConfig.carteDestinChoices.option = e.target.value;
      });
    }

    // Carte 3: Une compétence rang 1
    if (result === 3) {
      choicesDiv.innerHTML = `
        <div style="margin-top: 0.5rem;">
          <label style="display: block; color: var(--text-muted); margin-bottom: 0.25rem;">Choisissez une compétence :</label>
          <select id="carte-choice-3">
            <option value="Hardiesse">Hardiesse</option>
            <option value="Finesse">Finesse</option>
            <option value="Coordination">Coordination</option>
            <option value="Réflexion">Réflexion</option>
            <option value="Eloquence">Eloquence</option>
          </select>
        </div>
      `;
      // Initialiser avec la valeur par défaut
      this.currentConfig.carteDestinChoices.competence = 'Hardiesse';
      document.getElementById('carte-choice-3')?.addEventListener('change', (e) => {
        this.currentConfig.carteDestinChoices.competence = e.target.value;
      });
    }

    // Carte 4: Deux éléments gagnent 5 armure élémentaire
    if (result === 4) {
      choicesDiv.innerHTML = `
        <div style="margin-top: 0.5rem;">
          <label style="display: block; color: var(--text-muted); margin-bottom: 0.25rem;">Choisissez deux éléments :</label>
          <div style="display: grid; gap: 0.5rem;">
            <label><input type="checkbox" value="Feu" class="carte-element-check"> Feu</label>
            <label><input type="checkbox" value="Eau" class="carte-element-check"> Eau</label>
            <label><input type="checkbox" value="Terre" class="carte-element-check"> Terre</label>
            <label><input type="checkbox" value="Air" class="carte-element-check"> Air</label>
            <label><input type="checkbox" value="Lumière" class="carte-element-check"> Lumière</label>
            <label><input type="checkbox" value="Nuit" class="carte-element-check"> Nuit</label>
            <label><input type="checkbox" value="Divin" class="carte-element-check"> Divin</label>
            <label><input type="checkbox" value="Maléfique" class="carte-element-check"> Maléfique</label>
          </div>
        </div>
      `;
      const checkboxes = document.querySelectorAll('.carte-element-check');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const selected = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
          if (selected.length > 2) {
            cb.checked = false;
          } else {
            this.currentConfig.carteDestinChoices.elements = selected;
          }
        });
      });
    }

    // Carte 5: Un point de Don général
    if (result === 5) {
      choicesDiv.innerHTML = `
        <div style="margin-top: 0.5rem;">
          <p style="color: var(--emerald); font-weight: bold;">Vous gagnez 1 point de Don supplémentaire (utilisable uniquement dans les dons généraux)</p>
        </div>
      `;
      // Augmenter les points de dons disponibles
      this.updateDonsAvailable();
    }
  }

  /**
   * Afficher les contrôles pour répartir les points de stats (Carte 2)
   */
  renderStatsControls(availableStats, baseStats) {
    const container = document.getElementById('carte-stats-controls');
    if (!container) return;

    // Initialiser le tracker de points
    if (!this.currentConfig.carteDestinChoices.stats) {
      this.currentConfig.carteDestinChoices.stats = {};
      availableStats.forEach(stat => {
        this.currentConfig.carteDestinChoices.stats[stat] = 0;
      });
    }

    const statsAllocation = this.currentConfig.carteDestinChoices.stats;

    // Calculer les points restants
    const totalAllocated = Object.values(statsAllocation).reduce((sum, val) => sum + val, 0);
    const pointsRestants = 2 - totalAllocated;

    // HTML pour l'interface
    let html = `
      <div style="background: var(--bg); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span style="color: var(--text); font-weight: bold;">Points restants: <span id="points-restants" style="color: ${pointsRestants > 0 ? 'var(--gold)' : 'var(--emerald)'};">${pointsRestants}</span> / 2</span>
        </div>
        <div style="display: grid; gap: 0.75rem;">
    `;

    availableStats.forEach(stat => {
      const allocated = statsAllocation[stat] || 0;
      const baseValue = baseStats[stat];

      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--card); border-radius: 4px;">
          <div style="flex: 1;">
            <span style="color: var(--text); font-weight: bold;">${stat}</span>
            <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">(Base: ${baseValue})</span>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="stat-btn-minus" data-stat="${stat}" style="width: 30px; height: 30px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text); cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;" ${allocated === 0 ? 'disabled' : ''}>−</button>
            <span style="color: var(--accent); font-weight: bold; min-width: 30px; text-align: center; font-size: 1.1rem;" id="stat-value-${stat}">+${allocated}</span>
            <button class="stat-btn-plus" data-stat="${stat}" style="width: 30px; height: 30px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text); cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;" ${pointsRestants === 0 ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attacher les événements
    container.querySelectorAll('.stat-btn-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stat = e.target.dataset.stat;
        this.adjustStatAllocation(stat, 1, availableStats, baseStats);
      });
    });

    container.querySelectorAll('.stat-btn-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stat = e.target.dataset.stat;
        this.adjustStatAllocation(stat, -1, availableStats, baseStats);
      });
    });
  }

  /**
   * Ajuster l'allocation de points de stats
   */
  adjustStatAllocation(stat, delta, availableStats, baseStats) {
    const statsAllocation = this.currentConfig.carteDestinChoices.stats;
    const currentValue = statsAllocation[stat] || 0;
    const totalAllocated = Object.values(statsAllocation).reduce((sum, val) => sum + val, 0);

    // Vérifications
    if (delta > 0 && totalAllocated >= 2) return; // Plus de points disponibles
    if (delta < 0 && currentValue === 0) return; // Déjà à 0

    // Appliquer le changement
    statsAllocation[stat] = currentValue + delta;

    // Re-rendre les contrôles
    this.renderStatsControls(availableStats, baseStats);
  }

  /**
   * Calculer les stats actuelles du personnage pour la validation des prérequis
   */
  getCurrentStats() {
    if (!this.currentConfig.className || !this.currentConfig.subClassName) {
      return null;
    }

    const classe = this.creator.classesData.find(c => c.nom === this.currentConfig.className);
    if (!classe) return null;

    const sousClasse = classe.sousClasses.find(sc => sc.nom === this.currentConfig.subClassName);
    if (!sousClasse) return null;

    // Stats de base
    const baseStats = this.creator.parseBaseStats(sousClasse.base);
    const progression = this.creator.parseProgression(sousClasse.progression);
    const level = this.currentConfig.level;

    // Calculer les stats au niveau donné
    const stats = { ...baseStats };

    if (level > 1) {
      const levelsGained = level - 1;
      for (const [stat, gain] of Object.entries(progression)) {
        if (stat !== 'auChoix' && stats[stat] !== undefined) {
          stats[stat] += gain * levelsGained;
        }
      }
    }

    // Ajouter les bonus de la carte du destin (carte 1 = stats)
    if (this.currentConfig.carteDestin === 1 && this.currentConfig.carteDestinChoices?.stats) {
      for (const [stat, points] of Object.entries(this.currentConfig.carteDestinChoices.stats)) {
        stats[stat] += points;
      }
    }

    // Ajouter les bonus du don Statistiques
    if (this.currentConfig.donBonuses?.['Statistiques']) {
      for (const [stat, points] of Object.entries(this.currentConfig.donBonuses['Statistiques'])) {
        stats[stat] += points;
      }
    }

    return stats;
  }

  /**
   * Obtenir les compétences actuelles du personnage
   */
  getCurrentCompetences() {
    if (!this.currentConfig.className || !this.currentConfig.subClassName) {
      return {};
    }

    const classe = this.creator.classesData.find(c => c.nom === this.currentConfig.className);
    if (!classe) return {};

    const sousClasse = classe.sousClasses.find(sc => sc.nom === this.currentConfig.subClassName);
    if (!sousClasse) return {};

    const competences = this.creator.getBaseCompetences(classe, sousClasse);

    // Carte destin 3 donne une compétence rang 1
    if (this.currentConfig.carteDestin === 3 && this.currentConfig.carteDestinChoices?.competence) {
      const comp = this.currentConfig.carteDestinChoices.competence;
      if (competences[comp] !== undefined) {
        competences[comp] = Math.max(competences[comp], 1);
      }
    }

    // Vérifier si le don "Compétence : Doué" est sélectionné (donne rang 1)
    if (this.currentConfig.dons.includes('Compétence : Doué')) {
      // On considère qu'au moins une compétence est au rang 1
      // (l'utilisateur choisira laquelle)
    }

    return competences;
  }

  /**
   * Vérifier si un don respecte les prérequis
   */
  checkDonPrerequisites(don) {
    const prerequis = don.prerequis || '';
    const level = this.currentConfig.level;
    const stats = this.getCurrentStats();
    const competences = this.getCurrentCompetences();

    if (!stats) return { valid: false, reason: 'Sélectionnez d\'abord une classe et sous-classe' };

    // Pas de prérequis
    if (prerequis.includes('-') && !prerequis.includes('Niveau') && !prerequis.match(/\d+/)) {
      return { valid: true };
    }

    // Vérifier les prérequis "Don unique"
    if (prerequis.includes('Don unique')) {
      if (this.currentConfig.dons.includes(don.nom)) {
        // Déjà sélectionné, c'est OK
      } else {
        // Vérifier si un don unique de ce nom est déjà pris
        // Pour l'instant on suppose que "Don unique" signifie qu'on ne peut le prendre qu'une fois
      }
    }

    // Vérifier le niveau requis
    const levelMatch = prerequis.match(/Niveau\s*(\d+)/i);
    if (levelMatch) {
      const requiredLevel = parseInt(levelMatch[1]);
      if (level < requiredLevel) {
        return { valid: false, reason: `Niveau ${requiredLevel} requis (actuel: ${level})` };
      }
    }

    // Vérifier les stats requises
    const statPatterns = [
      { regex: /Force\s*(\d+)/i, stat: 'Force' },
      { regex: /Agilit[ée]\s*(\d+)/i, stat: 'Agilité' },
      { regex: /Endurance\s*(\d+)/i, stat: 'Endurance' },
      { regex: /Intelligence\s*(\d+)/i, stat: 'Intelligence' },
      { regex: /Volont[ée]\s*(\d+)/i, stat: 'Volonté' },
      { regex: /Chance\s*(\d+)/i, stat: 'Chance' }
    ];

    // Vérifier si c'est un prérequis avec "OU" ou "ET"
    const hasOr = /\bOU\b/i.test(prerequis);
    const hasAnd = /\bET\b/i.test(prerequis);

    if (hasOr) {
      // Au moins une condition doit être respectée
      let anyValid = false;
      let allReasons = [];

      for (const { regex, stat } of statPatterns) {
        const match = prerequis.match(regex);
        if (match) {
          const required = parseInt(match[1]);
          if (stats[stat] >= required) {
            anyValid = true;
            break;
          } else {
            allReasons.push(`${stat} ${required}`);
          }
        }
      }

      // Vérifier aussi les compétences en mode OU
      const compPatterns = [
        { regex: /Hardiesse\s*(?:rang\s*)?(\d+)/i, comp: 'Hardiesse' },
        { regex: /Finesse\s*(?:rang\s*)?(\d+)/i, comp: 'Finesse' },
        { regex: /Coordination\s*(?:rang\s*)?(\d+)/i, comp: 'Coordination' },
        { regex: /R[ée]flexion\s*(?:rang\s*)?(\d+)/i, comp: 'Réflexion' },
        { regex: /[ÉE]loquence\s*(?:rang\s*)?(\d+)/i, comp: 'Eloquence' }
      ];

      for (const { regex, comp } of compPatterns) {
        const match = prerequis.match(regex);
        if (match) {
          const required = parseInt(match[1]);
          if ((competences[comp] || 0) >= required) {
            anyValid = true;
            break;
          } else {
            allReasons.push(`${comp} rang ${required}`);
          }
        }
      }

      if (!anyValid && allReasons.length > 0) {
        return { valid: false, reason: `Requis: ${allReasons.join(' OU ')}` };
      }

      return { valid: true };
    }

    // Mode ET ou conditions simples
    for (const { regex, stat } of statPatterns) {
      const match = prerequis.match(regex);
      if (match) {
        const required = parseInt(match[1]);
        if (stats[stat] < required) {
          return { valid: false, reason: `${stat} ${required} requis (actuel: ${stats[stat]})` };
        }
      }
    }

    // Vérifier les compétences requises
    const compPatterns = [
      { regex: /Hardiesse\s*(?:rang\s*)?(\d+)/i, comp: 'Hardiesse' },
      { regex: /Finesse\s*(?:rang\s*)?(\d+)/i, comp: 'Finesse' },
      { regex: /Coordination\s*(?:rang\s*)?(\d+)/i, comp: 'Coordination' },
      { regex: /R[ée]flexion\s*(?:rang\s*)?(\d+)/i, comp: 'Réflexion' },
      { regex: /[ÉE]loquence\s*(?:rang\s*)?(\d+)/i, comp: 'Eloquence' }
    ];

    for (const { regex, comp } of compPatterns) {
      const match = prerequis.match(regex);
      if (match) {
        const required = parseInt(match[1]);
        const current = competences[comp] || 0;
        if (current < required) {
          return { valid: false, reason: `${comp} rang ${required} requis (actuel: ${current})` };
        }
      }
    }

    // Vérifier les prérequis spécifiques
    if (prerequis.includes('Ambidextre')) {
      if (!this.currentConfig.dons.includes('Ambidextre')) {
        return { valid: false, reason: 'Don Ambidextre requis' };
      }
    }

    if (prerequis.includes('Capable de manier un arc') || prerequis.includes('manier un arc')) {
      if (!this.currentConfig.dons.includes('Maîtrise de l\'arc')) {
        return { valid: false, reason: 'Maîtrise de l\'arc requise' };
      }
    }

    if (prerequis.includes('Capable d\'équiper des armures légères') || prerequis.includes('armures légères')) {
      if (!this.currentConfig.dons.includes('Maîtrise des armures légères')) {
        // Certaines classes ont peut-être cette maîtrise de base
        // Pour l'instant on vérifie juste le don
      }
    }

    // Vérifier si c'est un don de compétence rang 2 ou 3
    if (don.nom === 'Compétence : Brillant') {
      // Requiert rang 1 et niveau 5
      if (level < 5) {
        return { valid: false, reason: 'Niveau 5 requis' };
      }
      // Vérifier si au moins une compétence est au rang 1
      const hasRang1 = Object.values(competences).some(v => v >= 1);
      if (!hasRang1 && !this.currentConfig.dons.includes('Compétence : Doué')) {
        return { valid: false, reason: 'Une compétence rang 1 requise' };
      }
    }

    if (don.nom === 'Compétence : Prodigieux') {
      if (level < 10) {
        return { valid: false, reason: 'Niveau 10 requis' };
      }
      // Vérifier si au moins une compétence est au rang 2
      const hasRang2 = Object.values(competences).some(v => v >= 2);
      if (!hasRang2 && !this.currentConfig.dons.includes('Compétence : Brillant')) {
        return { valid: false, reason: 'Une compétence rang 2 requise' };
      }
    }

    return { valid: true };
  }

  /**
   * Mettre à jour les dons disponibles
   */
  updateDonsAvailable() {
    if (!this.currentConfig.className) return;

    const donsSection = document.getElementById('dons-available');
    if (!donsSection) return;

    // Calculer le nombre de points de dons
    let pointsDons = 2; // De base (tous les personnages au niveau 1)

    // Guerrier et Rôdeur ont la capacité "Doué" : +1 don par niveau gagné (après le niveau 1)
    if (this.currentConfig.className === 'Guerrier' || this.currentConfig.className === 'Rôdeur') {
      pointsDons += (this.currentConfig.level - 1);
    }

    // Aventurier (sous-classe) a la capacité "Polyvalent" : +1 don
    if (this.currentConfig.subClassName === 'Aventurier') {
      pointsDons += 1;
    }

    // Carte destin 5 donne +1 don
    if (this.currentConfig.carteDestin === 5) {
      pointsDons += 1;
    }

    document.getElementById('dons-max').textContent = pointsDons;

    // Afficher les catégories de dons
    donsSection.innerHTML = '';

    const categories = this.creator.donsData;
    categories.forEach(category => {
      // Filtrer les dons si c'est une classe spécifique
      if (category.nom !== 'Généraux' && category.nom !== this.currentConfig.className) {
        return;
      }

      const categoryDiv = document.createElement('div');
      categoryDiv.style.marginBottom = '1rem';

      const title = document.createElement('h5');
      title.textContent = `Dons ${category.nom}`;
      title.style.color = 'var(--accent)';
      title.style.marginBottom = '0.5rem';
      categoryDiv.appendChild(title);

      const donsGrid = document.createElement('div');
      donsGrid.style.display = 'grid';
      donsGrid.style.gap = '0.25rem';

      category.dons.forEach(don => {
        const donBtn = document.createElement('button');
        donBtn.className = 'don-btn';
        donBtn.dataset.donName = don.nom;

        // Vérifier les prérequis
        const prerequisCheck = this.checkDonPrerequisites(don);
        const isSelected = this.currentConfig.dons.includes(don.nom);

        // Description nettoyée pour le tooltip et l'aperçu
        const cleanDesc = don.description.replace(/<[^>]*>/g, '').trim();
        const shortDesc = cleanDesc.substring(0, 100) + (cleanDesc.length > 100 ? '...' : '');

        // Créer le contenu du bouton avec nom et aperçu
        const nameSpan = document.createElement('span');
        nameSpan.className = 'don-btn-name';
        nameSpan.textContent = don.nom;

        const descSpan = document.createElement('span');
        descSpan.className = 'don-btn-desc';
        descSpan.textContent = shortDesc;

        donBtn.appendChild(nameSpan);
        donBtn.appendChild(descSpan);

        if (!prerequisCheck.valid && !isSelected) {
          donBtn.disabled = true;
          donBtn.title = `⚠️ ${prerequisCheck.reason}\n\n${cleanDesc}`;
        } else {
          donBtn.disabled = false;
          donBtn.title = cleanDesc;
        }

        // Appliquer le style si sélectionné
        if (isSelected) {
          donBtn.classList.add('selected');
        }

        donBtn.addEventListener('click', () => {
          if (!donBtn.disabled) {
            this.toggleDon(don.nom, donBtn);
          }
        });

        donsGrid.appendChild(donBtn);
      });

      categoryDiv.appendChild(donsGrid);
      donsSection.appendChild(categoryDiv);
    });
  }

  /**
   * Toggle un don
   */
  toggleDon(donName, btnElement) {
    const index = this.currentConfig.dons.indexOf(donName);
    const maxDons = parseInt(document.getElementById('dons-max').textContent);

    if (index > -1) {
      // Retirer
      this.currentConfig.dons.splice(index, 1);
      btnElement.classList.remove('selected');

      // Si c'est le don Statistiques, cacher l'interface de choix
      if (donName === 'Statistiques') {
        document.getElementById('don-statistiques-controls').style.display = 'none';
        delete this.currentConfig.donBonuses['Statistiques'];
      }
    } else {
      // Ajouter
      if (this.currentConfig.dons.length >= maxDons) {
        this.showModal(`Vous ne pouvez sélectionner que ${maxDons} dons maximum.`);
        return;
      }
      this.currentConfig.dons.push(donName);
      btnElement.classList.add('selected');

      // Si c'est le don Statistiques, afficher l'interface de choix
      if (donName === 'Statistiques') {
        this.showStatistiquesControls();
      }
    }

    document.getElementById('dons-count').textContent = this.currentConfig.dons.length;
    document.getElementById('dons-list').textContent = this.currentConfig.dons.join(', ') || 'Aucun';

    // Rafraîchir la liste des dons pour mettre à jour les prérequis
    // (certains dons dépendent d'autres dons)
    this.updateDonsAvailable();
  }

  /**
   * Afficher l'interface de choix pour le don Statistiques
   */
  showStatistiquesControls() {
    const container = document.getElementById('don-statistiques-controls');
    if (!container) return;

    container.style.display = 'block';

    // Initialiser les stats du don Statistiques
    if (!this.currentConfig.donBonuses['Statistiques']) {
      this.currentConfig.donBonuses['Statistiques'] = {
        Force: 0,
        Agilité: 0,
        Endurance: 0,
        Intelligence: 0,
        Volonté: 0,
        Chance: 0
      };
    }

    const statsAllocation = this.currentConfig.donBonuses['Statistiques'];
    const totalAllocated = Object.values(statsAllocation).reduce((sum, val) => sum + val, 0);
    const pointsRestants = 2 - totalAllocated;

    let html = `
      <h5 style="color: var(--accent); margin-bottom: 0.75rem;">📊 Don Statistiques - Répartir 2 points</h5>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <span style="color: var(--text); font-weight: bold;">Points restants: <span id="don-stats-points-restants" style="color: ${pointsRestants > 0 ? 'var(--gold)' : 'var(--emerald)'};">${pointsRestants}</span> / 2</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
    `;

    const allStats = ['Force', 'Agilité', 'Endurance', 'Intelligence', 'Volonté', 'Chance'];
    allStats.forEach(stat => {
      const value = statsAllocation[stat];
      html += `
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: white; border: 1px solid #ccc; border-radius: 4px;">
          <button class="don-stat-btn-minus" data-stat="${stat}" style="width: 30px; height: 30px; border: none; background: #f59e0b; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 0.85rem; color: #666;">${stat}</div>
            <div style="font-weight: bold; color: #333;">+<span class="don-stat-value" data-stat="${stat}">${value}</span></div>
          </div>
          <button class="don-stat-btn-plus" data-stat="${stat}" style="width: 30px; height: 30px; border: none; background: #22c55e; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Attacher les événements
    container.querySelectorAll('.don-stat-btn-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stat = e.target.dataset.stat;
        this.adjustDonStat(stat, 1);
      });
    });

    container.querySelectorAll('.don-stat-btn-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stat = e.target.dataset.stat;
        this.adjustDonStat(stat, -1);
      });
    });
  }

  /**
   * Ajuster les points de stats du don Statistiques
   */
  adjustDonStat(stat, delta) {
    if (!this.currentConfig.donBonuses['Statistiques']) return;

    const statsAllocation = this.currentConfig.donBonuses['Statistiques'];
    const currentValue = statsAllocation[stat];
    const newValue = currentValue + delta;

    // Vérifier les limites
    if (newValue < 0) return;

    const totalAllocated = Object.values(statsAllocation).reduce((sum, val) => sum + val, 0);
    const pointsRestants = 2 - totalAllocated;

    if (delta > 0 && pointsRestants <= 0) {
      this.showModal('Vous avez déjà réparti tous vos points de statistiques!');
      return;
    }

    // Appliquer le changement
    statsAllocation[stat] = newValue;

    // Mettre à jour l'affichage
    const valueSpan = document.querySelector(`.don-stat-value[data-stat="${stat}"]`);
    if (valueSpan) {
      valueSpan.textContent = newValue;
    }

    const newTotal = Object.values(statsAllocation).reduce((sum, val) => sum + val, 0);
    const newPointsRestants = 2 - newTotal;
    const pointsRestantsSpan = document.getElementById('don-stats-points-restants');
    if (pointsRestantsSpan) {
      pointsRestantsSpan.textContent = newPointsRestants;
      pointsRestantsSpan.style.color = newPointsRestants > 0 ? 'var(--gold)' : 'var(--emerald)';
    }
  }

  /**
   * Mettre à jour l'interface
   */
  updateUI() {
    // Mise à jour dynamique si nécessaire
  }

  /**
   * Obtenir le HTML de la liste des dons avec effets
   */
  getDonsListHTML() {
    if (this.currentConfig.dons.length === 0) {
      return '<p style="margin: 0.25rem 0; color: #888;">Aucun don sélectionné</p>';
    }

    const items = this.currentConfig.dons.map(donName => {
      const don = this.creator.findDon(donName);
      if (don) {
        // Nettoyer la description HTML
        const cleanDesc = don.description.replace(/<[^>]*>/g, '').trim();
        return `<p style="margin: 0.5rem 0;"><strong>• ${don.nom}:</strong> ${cleanDesc}</p>`;
      }
      return `<p style="margin: 0.25rem 0;">• ${donName}</p>`;
    });

    return items.join('');
  }

  /**
   * Obtenir le HTML des capacités de classe
   */
  getCapacitesHTML() {
    const classe = this.creator.classesData.find(c => c.nom === this.currentConfig.className);
    if (!classe) return '<p style="color: #888;">N/A</p>';

    const sousClasse = classe.sousClasses.find(sc => sc.nom === this.currentConfig.subClassName);
    if (!sousClasse) return '<p style="color: #888;">N/A</p>';

    const capacites = [];

    // Extraire les capacités de la classe principale
    const classeCapList = this.parseCapacites(classe.capacites);
    capacites.push(...classeCapList);

    // Extraire les capacités de la sous-classe
    const sousClasseCapList = this.parseCapacites(sousClasse.capacites);
    capacites.push(...sousClasseCapList);

    if (capacites.length === 0) {
      return '<p style="color: #888;">Aucune capacité spéciale</p>';
    }

    return capacites.map(cap => `<p style="margin: 0.5rem 0; font-size: 0.9rem;">${cap}</p>`).join('<br>');
  }

  /**
   * Parser et filtrer les capacités
   */
  parseCapacites(capacitesHTML) {
    if (!capacitesHTML) return [];

    // Extraire le contenu entre les balises <li>
    const liRegex = /<li>(.*?)<\/li>/gs;
    const matches = [...capacitesHTML.matchAll(liRegex)];

    const capacites = matches.map(match => {
      // Nettoyer le HTML
      let text = match[1].replace(/<[^>]*>/g, '').trim();
      // Supprimer les retours à la ligne multiples
      text = text.replace(/\s+/g, ' ');
      return text;
    });

    return capacites;
  }

  /**
   * Obtenir le HTML de la liste des sorts disponibles
   */
  getSortsHTML() {
    const classe = this.creator.classesData.find(c => c.nom === this.currentConfig.className);
    if (!classe) return '';

    // Déterminer quel type de sorts la classe peut lancer
    let categorieSort = null;
    const capacites = classe.capacites;

    if (/Sorts de Mage/i.test(capacites)) {
      categorieSort = 'Mage';
    } else if (/Sorts de Prêtre/i.test(capacites) || /sorts de prêtre/i.test(capacites)) {
      categorieSort = 'Prêtre';
    }

    if (!categorieSort) {
      return ''; // Pas une classe de lanceur de sorts
    }

    // Trouver la catégorie de sorts correspondante
    const sortCategory = this.creator.sortsData.find(cat =>
      cat.nom.includes(categorieSort)
    );

    if (!sortCategory || !sortCategory.sorts) {
      return '';
    }

    // Filtrer les sorts par niveau
    const niveau = this.currentConfig.level;
    const sortsDisponibles = sortCategory.sorts.filter(sort => {
      // Extraire le niveau du prérequis
      const prerequisMatch = sort.prerequis.match(/Niveau\s*(\d+)/i);
      if (!prerequisMatch) return true; // Si pas de prérequis, disponible
      const niveauRequis = parseInt(prerequisMatch[1]);
      return niveau >= niveauRequis;
    });

    if (sortsDisponibles.length === 0) {
      return '';
    }

    const sortsNoms = sortsDisponibles.map(s => s.nom).join(', ');

    return `
      <br>
      <p><strong>SORTS DISPONIBLES (${categorieSort})</strong></p>
      <p style="margin: 0.5rem 0; font-size: 0.9rem;">${sortsNoms}</p>
    `;
  }

  /**
   * Obtenir le texte de la carte du destin sélectionnée
   */
  getCarteDestinText() {
    if (this.currentConfig.carteDestin === null) {
      return '<span style="color: #888;">Aucune carte du destin sélectionnée</span>';
    }

    const carteIndex = this.currentConfig.carteDestin;
    const carteText = this.creator.cartesDestin[carteIndex];

    // Afficher le texte de base de la carte
    let result = `Carte ${carteIndex + 1}: ${carteText}`;

    // Ajouter les choix effectués selon la carte
    const choices = this.currentConfig.carteDestinChoices;

    if (carteIndex === 0 && choices.option) {
      result += ` <br><em>Choix: ${choices.option === 'initiative' ? 'Initiative et Fortune' : 'Esquive et Résistance'}</em>`;
    } else if (carteIndex === 1 && choices.stats) {
      const statsStr = Object.entries(choices.stats)
        .filter(([stat, val]) => val > 0)
        .map(([stat, val]) => `${stat}: +${val}`)
        .join(', ');
      if (statsStr) {
        result += ` <br><em>Choix: ${statsStr}</em>`;
      }
    } else if (carteIndex === 2 && choices.option) {
      result += ` <br><em>Choix: ${choices.option === 'vie' ? '+4 PV' : '+6 Mana'}</em>`;
    } else if (carteIndex === 3 && choices.competence) {
      result += ` <br><em>Choix: ${choices.competence}</em>`;
    } else if (carteIndex === 4 && choices.elements && choices.elements.length > 0) {
      result += ` <br><em>Choix: ${choices.elements.join(', ')}</em>`;
    }

    return result;
  }

  /**
   * Obtenir le HTML de la liste d'équipement
   */
  getEquipmentListHTML() {
    const items = [];

    // Ajouter les équipements
    this.currentConfig.equipement.forEach(eq => {
      items.push(`<p style="margin: 0.25rem 0;">• ${eq.nom}</p>`);
    });

    // Ajouter les consommables
    Object.entries(this.currentConfig.consommables).forEach(([numero, qty]) => {
      const objet = this.creator.objetsDepart.find(o => o.numero === parseInt(numero));
      if (objet) {
        items.push(`<p style="margin: 0.25rem 0;">• ${objet.nom} x${qty}</p>`);
      }
    });

    if (items.length === 0) {
      return '<p style="margin: 0.25rem 0; color: #888;">Aucun équipement sélectionné</p>';
    }

    return items.join('');
  }

  /**
   * Calculer et afficher l'aperçu
   */
  calculateAndPreview() {
    try {
      // Validation
      if (!this.currentConfig.className || !this.currentConfig.subClassName) {
        this.showModal('Veuillez sélectionner une classe et une sous-classe.');
        return;
      }

      if (!this.currentConfig.element) {
        this.showModal('Veuillez sélectionner un élément d\'affiliation.');
        return;
      }

      if (this.currentConfig.carteDestin === null) {
        this.showModal('Veuillez tirer ou choisir une carte du destin avant de calculer les stats.');
        // Scroller vers la section carte du destin
        const carteDestinSection = document.getElementById('carte-destin-section');
        if (carteDestinSection) {
          carteDestinSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Vérifier que tous les dons disponibles ont été sélectionnés
      const maxDons = parseInt(document.getElementById('dons-max').textContent);
      const currentDons = this.currentConfig.dons.length;
      if (currentDons < maxDons) {
        this.showModal(`Veuillez sélectionner tous vos dons (${currentDons}/${maxDons} sélectionnés).`);
        // Scroller vers la section dons
        const donsSection = document.getElementById('dons-section');
        if (donsSection) {
          donsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Vérifier que le don Statistiques a été configuré (si sélectionné)
      if (this.currentConfig.dons.includes('Statistiques')) {
        const statsAllocation = this.currentConfig.donBonuses['Statistiques'];
        if (statsAllocation) {
          const totalAllocated = Object.values(statsAllocation).reduce((sum, val) => sum + val, 0);
          if (totalAllocated < 2) {
            this.showModal('Veuillez répartir tous les points de statistiques du don "Statistiques" (2 points à répartir).');
            // Scroller vers la section dons
            const donsSection = document.getElementById('dons-section');
            if (donsSection) {
              donsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          }
        }
      }

      // Calculer le personnage
      this.calculatedCharacter = this.creator.calculateCharacter(this.currentConfig);

      // Afficher l'aperçu
      const statsPreview = document.getElementById('stats-preview');
      const statsContent = document.getElementById('stats-content');

      // Préparer l'affichage de l'armure physique
      const armure = this.calculatedCharacter.armure;
      let armureDetails = `${armure.total}`;
      if (armure.equipement > 0 || armure.donBonus > 0) {
        const parts = [];
        if (armure.equipement > 0) parts.push(`équipement: +${armure.equipement}`);
        if (armure.donBonus > 0) parts.push(`don: +${armure.donBonus}`);
        armureDetails += ` (${parts.join(', ')})`;
      }

      // Préparer l'affichage des armures élémentaires
      const armElem = this.calculatedCharacter.armureElementaire;
      const elemColors = {
        'Feu': '#e25822',
        'Eau': '#2b6cb0',
        'Terre': '#8b5e34',
        'Air': '#22c55e',
        'Lumière': '#ffd700',
        'Nuit': '#6b7280',
        'Divin': '#a0a0b0',
        'Maléfique': '#dc2626'
      };

      // Helper pour afficher une stat avec bonus équipement
      const formatStat = (statName) => {
        const base = this.calculatedCharacter.stats[statName];
        const bonus = this.calculatedCharacter.equipementStatBonuses[statName] || 0;
        if (bonus > 0) {
          return `${base} <span style="color: #22c55e;">(${base + bonus})</span>`;
        }
        return `${base}`;
      };

      // Styles pour les sections
      const sectionStyle = `
        background: linear-gradient(135deg, rgba(30, 30, 60, 0.9), rgba(20, 20, 40, 0.95));
        border: 2px solid var(--ui-border, #4a4a6a);
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin-bottom: 1rem;
      `;
      const headerStyle = `
        color: var(--gold, #d4af37);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0 0 0.75rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--ui-border, #4a4a6a);
      `;
      const statBoxStyle = `
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        text-align: center;
      `;
      const statLabelStyle = `color: var(--text-muted, #888); font-size: 0.75rem; display: block;`;
      const statValueStyle = `color: var(--paper-ink, #e8e8e8); font-size: 1.1rem; font-weight: bold;`;

      let html = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">

          <!-- En-tête du personnage -->
          <div style="${sectionStyle} background: linear-gradient(135deg, rgba(50, 40, 20, 0.9), rgba(30, 25, 15, 0.95)); border-color: var(--gold, #d4af37);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="margin: 0; color: var(--gold, #d4af37); font-size: 1.3rem;">${this.calculatedCharacter.classe}</h3>
                <p style="margin: 0.25rem 0 0 0; color: var(--text-muted, #aaa);">Niveau ${this.calculatedCharacter.niveau}</p>
              </div>
              <div style="text-align: right;">
                <img src="${this.elementIcons[this.calculatedCharacter.element]}" alt="${this.calculatedCharacter.element}" style="width: 40px; height: 40px; vertical-align: middle;">
                <span style="color: var(--paper-ink, #e8e8e8); font-weight: bold; margin-left: 0.5rem;">${this.calculatedCharacter.element}</span>
              </div>
            </div>
          </div>

          <!-- Carte du Destin -->
          <div style="${sectionStyle} border-color: var(--gold, #d4af37); border-style: dashed;">
            <h4 style="${headerStyle}">🎴 Carte du Destin</h4>
            <p style="margin: 0; color: var(--paper-ink, #e8e8e8); font-style: italic;">${this.getCarteDestinText()}</p>
          </div>

          <!-- Statistiques -->
          <div style="${sectionStyle}">
            <h4 style="${headerStyle}">📊 Statistiques</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Force</span>
                <span style="${statValueStyle}">${formatStat('Force')}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Agilité</span>
                <span style="${statValueStyle}">${formatStat('Agilité')}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Endurance</span>
                <span style="${statValueStyle}">${formatStat('Endurance')}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Intelligence</span>
                <span style="${statValueStyle}">${formatStat('Intelligence')}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Volonté</span>
                <span style="${statValueStyle}">${formatStat('Volonté')}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Chance</span>
                <span style="${statValueStyle}">${formatStat('Chance')}</span>
              </div>
            </div>
          </div>

          <!-- Ressources -->
          <div style="${sectionStyle}">
            <h4 style="${headerStyle}">❤️ Ressources</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
              <div style="${statBoxStyle} background: linear-gradient(135deg, rgba(220, 50, 50, 0.2), rgba(150, 30, 30, 0.3));">
                <span style="${statLabelStyle}">Vie</span>
                <span style="${statValueStyle} color: #ef4444;">${this.calculatedCharacter.equipementVieBonus > 0 ? `${this.calculatedCharacter.vieMaxBase} (<span style="color: #22c55e;">${this.calculatedCharacter.vieMax}</span>)` : this.calculatedCharacter.vieMax}</span>
              </div>
              <div style="${statBoxStyle} background: linear-gradient(135deg, rgba(50, 100, 220, 0.2), rgba(30, 60, 150, 0.3));">
                <span style="${statLabelStyle}">Mana</span>
                <span style="${statValueStyle} color: #3b82f6;">${this.calculatedCharacter.equipementManaBonus > 0 ? `${this.calculatedCharacter.manaMaxBase} (<span style="color: #22c55e;">${this.calculatedCharacter.manaMax}</span>)` : this.calculatedCharacter.manaMax}</span>
              </div>
              <div style="${statBoxStyle} background: linear-gradient(135deg, rgba(220, 180, 50, 0.2), rgba(150, 120, 30, 0.3));">
                <span style="${statLabelStyle}">Efforts</span>
                <span style="${statValueStyle} color: #f59e0b;">${this.calculatedCharacter.effortsMax}</span>
              </div>
            </div>
          </div>

          <!-- Combat -->
          <div style="${sectionStyle}">
            <h4 style="${headerStyle}">⚔️ Combat</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Initiative</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.initiative.total}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Fortune</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.fortune.total}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Esquive</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.esquive.total}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Résist. Altérations</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.resistanceAlterations.total}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Crit Physique</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.coupCritiquePhysique.equipementBonus > 0 ? `${this.calculatedCharacter.coupCritiquePhysique.base} (<span style="color: #22c55e;">${this.calculatedCharacter.coupCritiquePhysique.total}</span>)` : this.calculatedCharacter.coupCritiquePhysique.total}</span>
              </div>
              <div style="${statBoxStyle}">
                <span style="${statLabelStyle}">Crit Sorts</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.coupCritiqueSorts.total}</span>
              </div>
            </div>
            <div style="${statBoxStyle} margin-top: 0.5rem;">
              <span style="${statLabelStyle}">Puissance des Sorts</span>
              <span style="${statValueStyle}">${this.calculatedCharacter.puissanceSorts.total}</span>
            </div>
          </div>

          <!-- Armures -->
          <div style="${sectionStyle}">
            <h4 style="${headerStyle}">🛡️ Armures</h4>
            <div style="${statBoxStyle} margin-bottom: 0.75rem; background: linear-gradient(135deg, rgba(100, 100, 100, 0.3), rgba(60, 60, 60, 0.4));">
              <span style="${statLabelStyle}">Armure Physique</span>
              <span style="${statValueStyle} font-size: 1.3rem;">${armureDetails}</span>
            </div>
            <p style="color: var(--text-muted, #888); font-size: 0.8rem; margin: 0 0 0.5rem 0; text-align: center;">Armures Élémentaires</p>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem;">
              <div style="${statBoxStyle} padding: 0.4rem;"><span style="color: ${elemColors.Feu};">🔥</span> <span style="font-weight: bold;">${armElem.Feu}</span></div>
              <div style="${statBoxStyle} padding: 0.4rem;"><span style="color: ${elemColors.Eau};">💧</span> <span style="font-weight: bold;">${armElem.Eau}</span></div>
              <div style="${statBoxStyle} padding: 0.4rem;"><span style="color: ${elemColors.Terre};">🪨</span> <span style="font-weight: bold;">${armElem.Terre}</span></div>
              <div style="${statBoxStyle} padding: 0.4rem;"><span style="color: ${elemColors.Air};">💨</span> <span style="font-weight: bold;">${armElem.Air}</span></div>
              <div style="${statBoxStyle} padding: 0.4rem;"><span style="color: ${elemColors.Lumière};">✨</span> <span style="font-weight: bold;">${armElem.Lumière}</span></div>
              <div style="${statBoxStyle} padding: 0.4rem;"><span style="color: ${elemColors.Nuit};">🌙</span> <span style="font-weight: bold;">${armElem.Nuit}</span></div>
              <div style="${statBoxStyle} padding: 0.4rem;"><span style="color: ${elemColors.Divin};">☀️</span> <span style="font-weight: bold;">${armElem.Divin}</span></div>
              <div style="${statBoxStyle} padding: 0.4rem;"><span style="color: ${elemColors.Maléfique};">👿</span> <span style="font-weight: bold;">${armElem.Maléfique}</span></div>
            </div>
          </div>

          <!-- Compétences -->
          <div style="${sectionStyle}">
            <h4 style="${headerStyle}">📚 Compétences</h4>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.4rem;">
              <div style="${statBoxStyle} padding: 0.4rem;">
                <span style="${statLabelStyle} font-size: 0.65rem;">Hardiesse</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.competences.Hardiesse}</span>
              </div>
              <div style="${statBoxStyle} padding: 0.4rem;">
                <span style="${statLabelStyle} font-size: 0.65rem;">Finesse</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.competences.Finesse}</span>
              </div>
              <div style="${statBoxStyle} padding: 0.4rem;">
                <span style="${statLabelStyle} font-size: 0.65rem;">Coordination</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.competences.Coordination}</span>
              </div>
              <div style="${statBoxStyle} padding: 0.4rem;">
                <span style="${statLabelStyle} font-size: 0.65rem;">Réflexion</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.competences.Réflexion}</span>
              </div>
              <div style="${statBoxStyle} padding: 0.4rem;">
                <span style="${statLabelStyle} font-size: 0.65rem;">Eloquence</span>
                <span style="${statValueStyle}">${this.calculatedCharacter.competences.Eloquence}</span>
              </div>
            </div>
          </div>

          <!-- Dons -->
          <div style="${sectionStyle}">
            <h4 style="${headerStyle}">⭐ Dons</h4>
            <div style="color: var(--paper-ink, #e8e8e8);">${this.getDonsListHTML()}</div>
          </div>

          <!-- Capacités de classe -->
          <div style="${sectionStyle}">
            <h4 style="${headerStyle}">🎭 Capacités de Classe</h4>
            <div style="color: var(--paper-ink, #e8e8e8);">${this.getCapacitesHTML()}</div>
            ${this.getSortsHTML()}
          </div>

          <!-- Équipement -->
          <div style="${sectionStyle}">
            <h4 style="${headerStyle}">🎒 Équipement</h4>
            <div style="color: var(--paper-ink, #e8e8e8);">${this.getEquipmentListHTML()}</div>
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--ui-border, #4a4a6a); text-align: center;">
              <span style="color: var(--text-muted, #888);">Budget restant:</span>
              <span style="color: var(--gold, #d4af37); font-weight: bold; margin-left: 0.5rem;">${window.EclatsIcon?.small || '💎'} ${this.currentConfig.budgetEclats} éclats</span>
            </div>
          </div>

        </div>
      `;

      statsContent.innerHTML = html;
      statsPreview.style.display = 'block';

      // Scroller vers l'aperçu des stats
      setTimeout(() => {
        statsPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error) {
      console.error('Erreur lors du calcul:', error);
      this.showModal('Erreur lors du calcul du personnage: ' + error.message);
    }
  }

}

// Exporter en tant que module global
window.CharacterCreatorUI = CharacterCreatorUI;

// Character Creator initialization function (for dev mode compatibility)
window.characterCreatorInitialized = false;
window.characterCreatorInstance = null;
window.characterCreatorUI = null;

window.initCharacterCreator = async function() {
  if (window.characterCreatorInitialized) return;

  try {
    const container = document.getElementById('creation-form-container');
    if (!container) {
      console.error('Container not found');
      return;
    }

    // Create instances
    window.characterCreatorInstance = new CharacterCreator();
    window.characterCreatorUI = new CharacterCreatorUI(window.characterCreatorInstance);

    // Initialize
    await window.characterCreatorInstance.init();
    await window.characterCreatorUI.init('creation-form-container');

    window.characterCreatorInitialized = true;
    console.log('✅ Character Creator initialized');
  } catch (error) {
    console.error('❌ Error initializing Character Creator:', error);
    const container = document.getElementById('creation-form-container');
    if (container) {
      container.innerHTML = '<p style="color: red; text-align: center;">Erreur lors du chargement du formulaire. Veuillez rafraîchir la page.</p>';
    }
  }
};
