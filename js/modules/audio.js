// ============================================================================
// JDR-BAB APPLICATION - AUDIO MODULE
// ============================================================================

(() => {
  "use strict";

  // ========================================
  // AUDIO MANAGER MODULE
  // ========================================
  JdrApp.modules.audio = {
    currentAudio: null,
    currentPlaylist: null,
    currentTrackIndex: 0,
    isPlaying: false,
    isLooping: false, // Loop la piste en cours
    volume: 0.3,
    config: null,
    isEnabled: false,
    isBuffering: false, // Indicateur de buffering (streaming en cours)
    bufferProgress: 0, // Progression du buffering (0-100)
    isPopulating: false, // Flag pour éviter les appels multiples de populateAudioPage
    consecutiveErrors: 0, // Compteur d'erreurs consécutives pour éviter les boucles infinies
    preloadedAudio: null, // Audio préchargé pour la piste suivante
    preloadedTrackIndex: -1, // Index de la piste préchargée
    isShuffleMode: true, // Mode aléatoire activé par défaut
    playedTracksInCategory: [], // Pistes déjà jouées dans la catégorie actuelle
    
    async init() {
      try {
        await this.loadAudioConfig();
        this.setupEventListeners();
        this.restoreUserPreferences();
        // Ne plus créer les contrôles flottants automatiquement
      } catch (error) {
        console.warn('Audio module initialization failed:', error);
      }
    },

    async loadAudioConfig() {
      try {
        if (window.AUDIO_CONFIG) {
          this.config = window.AUDIO_CONFIG;
        } else {
          const response = await fetch('data/audio-config.json');
          this.config = await response.json();
          window.AUDIO_CONFIG = this.config;
        }
        
        // Générer automatiquement les playlists depuis la structure de dossiers
        this.generatePlaylistsFromFolders();
        
        this.volume = this.config.defaultVolume || 0.3;
        this.isEnabled = localStorage.getItem('jdr-audio-enabled') !== 'false';
      } catch (error) {
        console.warn('Failed to load audio config:', error);
        this.config = { playlists: {}, folderIcons: {} };
      }
    },

    async generatePlaylistsFromFolders() {
      this.config.playlists = {};
      
      try {
        // Scan dynamique des dossiers dans data/Musiques
        const baseUrl = window.STANDALONE_VERSION ? this.config.baseUrlGitHub : this.config.baseUrl;
        
        // Structure actuelle mise à jour
        const folderStructure = {
        'Auberge': ['Auberge1.mp3', 'Auberge10.mp3', 'Auberge11.mp3', 'Auberge2.mp3', 'Auberge3.mp3', 'Auberge4.mp3', 'Auberge5.mp3', 'Auberge6.mp3', 'Auberge7.mp3', 'Auberge8.mp3', 'Auberge9.mp3'],
        'Autre': ['BOS01_01.mp3', 'BOS05_01.mp3', 'BOS06_01.mp3', 'BOS07_01.mp3', 'BOS09_01.mp3', 'BOS10_01.mp3', 'BOS99_01.mp3', 'MEL02_01.mp3', 'MEL04_01.mp3', 'MEL05_02.mp3', 'MEL05_03.mp3', 'MEL06_01.mp3', 'MEL07_01.mp3', 'MEL07_02.mp3', 'MEL08_01.mp3', 'MEL10_02.mp3'],
        'Creation': ['Creation1.mp3', 'Creation2.mp3', 'Creation3.mp3', 'Creation6.mp3', 'Creation7.mp3', 'creation4.mp3', 'creation5.mp3'],
        'Foret': ['Forest8.mp3', 'Forest9.mp3', 'Foret.mp3', 'Foret2.mp3', 'Foret3.mp3', 'Foret4.mp3', 'Foret5.mp3', 'Foret6.mp3', 'Forêt7.mp3'],
        'ForetBoss': ['BossForet/BossF1.mp3', 'BossForet/BossForet2.mp3', 'BossForet/BossForet3.mp3'],
        'ForetCombat': ['CombatForet/Combat forest classic 1.mp3', 'CombatForet/Combat forest classic 2.mp3', 'CombatForet/Combat foret metal 1.mp3', 'CombatForet/Combat foret metal 2.mp3', 'CombatForet/Combat foret metal 3.mp3'],
        'Mine': ['Mine1.mp3', 'Mine2.mp3', 'Mine3.mp3', 'Mine4.mp3', 'Mine5.mp3'],
        'MineBoss': ['BossMine/BossMine1.mp3', 'BossMine/BossMine2.mp3'],
        'Voyage': ['Voyage1.mp3', 'Voyage2.mp3', 'Voyage3.mp3', 'Voyage4.mp3']
        };

        Object.entries(folderStructure).forEach(([folder, files]) => {
          const playlistId = folder.toLowerCase();
          const folderName = folder === 'ForetBoss' ? 'Boss Forêt' :
                            folder === 'MineBoss' ? 'Boss Mine' :
                            folder === 'ForetCombat' ? 'Combat Forêt' :
                            folder === 'MineCombat' ? 'Combat Mine' : folder;
          
          this.config.playlists[playlistId] = {
            name: folderName,
            icon: this.getIconForFolder(folder),
            tracks: files.map(file => {
              if (folder === 'ForetBoss' || folder === 'ForetCombat') {
                return `Foret/${file}`;
              } else if (folder === 'MineBoss' || folder === 'MineCombat') {
                return `Mine/${file}`;
              } else {
                return `${folder}/${file}`;
              }
            }),
            loop: true
          };
        });
        
      } catch (error) {
        console.error('Error generating playlists:', error);
      }
    },

    getIconForFolder(folder) {
      const iconMap = {
        'Auberge': '🍺',
        'Creation': '🎭',
        'Foret': '🌲',
        'ForetBoss': '🐲',
        'ForetCombat': '⚔️',
        'Mine': '⛏️',
        'MineBoss': '💎',
        'MineCombat': '⚔️',
        'Voyage': '🚶',
        'Autre': '🎼'
      };
      return iconMap[folder] || '🎵';
    },

    setupEventListeners() {
      // Écouter les changements de hash pour mettre à jour la page audio
      window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#/', '') || 'creation';
        
        // Mettre à jour la page audio si c'est la page affichée
        if (page === 'audio') {
          setTimeout(() => this.populateAudioPage(), 100);
        }
      });

      // Écouter l'événement de rendu de contenu pour initialiser la page audio
      EventBus.on('content-rendered', () => {
        const currentPage = window.location.hash.replace('#/', '') || 'creation';
        if (currentPage === 'audio') {
          setTimeout(() => this.populateAudioPage(), 50);
        }
      });

      // Observer pour détecter quand la page audio devient visible
      this.setupAudioPageObserver();
    },

    setupAudioPageObserver() {
      let isPopulating = false; // Éviter la boucle infinie
      
      // Observer les changements dans le DOM pour détecter la page audio
      const observer = new MutationObserver(() => {
        if (isPopulating) return; // Éviter la boucle
        
        const audioPage = document.querySelector('article[data-page="audio"].active');
        const audioControls = document.getElementById('audio-controls-page');
        
        // Ne peupler que si la page audio est active ET que les contrôles ne sont pas encore initialisés
        if (audioPage && audioControls && audioControls.innerHTML.includes('se chargent automatiquement')) {
          isPopulating = true;
          setTimeout(() => {
            this.populateAudioPage();
            isPopulating = false;
          }, 100);
        }
      });

      // Observer seulement les changements de classe (changement de page)
      const viewsContainer = document.getElementById('views');
      if (viewsContainer) {
        observer.observe(viewsContainer, { 
          attributes: true, 
          attributeFilter: ['class'],
          subtree: true
        });
      }

      // Vérifier immédiatement si la page audio est déjà visible
      setTimeout(() => {
        const audioPage = document.querySelector('article[data-page="audio"].active');
        const audioControls = document.getElementById('audio-controls-page');
        if (audioPage && audioControls && audioControls.innerHTML.includes('se chargent automatiquement')) {
          this.populateAudioPage();
        }
      }, 500);
    },

    async switchToPlaylist(playlistId) {
      if (this.currentPlaylist === playlistId) return;

      this.stop();
      this.currentPlaylist = playlistId;
      this.playedTracksInCategory = []; // Reset des pistes jouées

      const playlist = this.config.playlists[playlistId];

      if (playlist && this.isEnabled) {
        // Choisir la première piste ou une piste aléatoire selon le mode
        if (this.isShuffleMode) {
          this.currentTrackIndex = Math.floor(Math.random() * playlist.tracks.length);
        } else {
          this.currentTrackIndex = 0;
        }

        this.playedTracksInCategory.push(this.currentTrackIndex);
        await this.loadTrack(playlist.tracks[this.currentTrackIndex]);
        this.updateUI();
        this.updateAudioPageUI();

        // Auto-play quand on sélectionne une catégorie
        await this.play();
      }
    },

    async loadTrack(trackPath, usePreloaded = false) {
      try {
        // Vérifier si on peut utiliser la piste préchargée
        if (usePreloaded && this.preloadedAudio && this.preloadedTrackIndex === this.currentTrackIndex) {
          if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
          }
          this.currentAudio = this.preloadedAudio;
          this.preloadedAudio = null;
          this.preloadedTrackIndex = -1;
          this.currentAudio.volume = this.volume;
          this.setupAudioEventListeners();

          // Précharger la prochaine piste
          this.preloadNextTrack();
          return;
        }

        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
        }

        // Utiliser les URLs locales en mode dev, GitHub en mode standalone
        const baseUrl = window.STANDALONE_VERSION ? this.config.baseUrlGitHub : this.config.baseUrl;
        const fullUrl = `${baseUrl}/${trackPath}`;

        this.currentAudio = new Audio();
        this.currentAudio.volume = this.volume;
        this.currentAudio.preload = 'auto';
        this.currentAudio.crossOrigin = 'anonymous';
        this.currentAudio.loop = false; // S'assurer que l'audio ne boucle pas

        this.setupAudioEventListeners();

        // Définir la source APRÈS avoir configuré les event listeners
        this.currentAudio.src = fullUrl;

        // Auto-play si était en cours de lecture
        if (this.isPlaying) {
          await this.play();
        }

        // Précharger la prochaine piste après un court délai
        setTimeout(() => this.preloadNextTrack(), 1000);

      } catch (error) {
        console.error('Failed to load track:', trackPath, error);
      }
    },

    setupAudioEventListeners() {
      if (!this.currentAudio) return;

      // Gestion des événements audio
      this.currentAudio.addEventListener('ended', () => {
        if (this.isLooping) {
          // Rejouer la même piste
          this.currentAudio.currentTime = 0;
          this.currentAudio.play();
        } else {
          // Ne pas mettre isPlaying à false, playNext s'en charge
          this.playNext();
        }
      });

      this.currentAudio.addEventListener('play', () => {
        this.isPlaying = true;
        this.isBuffering = false;
        this.consecutiveErrors = 0; // Réinitialiser le compteur d'erreurs quand une piste se lance
        this.updateUI();
        this.updateAudioPageUI();
      });

      // Suivi de la progression du buffering
      this.currentAudio.addEventListener('progress', () => {
        this.updateBufferProgress();
      });

      // Indicateur de buffering (streaming en cours)
      this.currentAudio.addEventListener('waiting', () => {
        this.isBuffering = true;
        this.updateAudioPageUI();
      });

      this.currentAudio.addEventListener('playing', () => {
        this.isBuffering = false;
        this.updateAudioPageUI();
      });

      this.currentAudio.addEventListener('pause', () => {
        // Ne pas mettre isPlaying à false si le morceau est terminé
        // (l'événement ended s'en chargera via playNext)
        if (!this.currentAudio.ended) {
          this.isPlaying = false;
          this.updateUI();
          this.updateAudioPageUI();
        }
      });

      this.currentAudio.addEventListener('error', (e) => {
        console.error('Audio loading failed:', this.currentAudio?.src, e);
        this.isPlaying = false;
        this.consecutiveErrors++;

        // Éviter les boucles infinies: arrêter si on a eu des erreurs sur toutes les pistes
        const playlist = this.currentPlaylist ? this.config.playlists[this.currentPlaylist] : null;
        const maxErrors = playlist ? playlist.tracks.length : 5;

        if (this.consecutiveErrors >= maxErrors) {
          console.error('Too many consecutive audio errors, stopping playback');
          this.consecutiveErrors = 0;
          this.stop();
          return;
        }

        this.playNext();
      });
    },

    updateBufferProgress() {
      if (!this.currentAudio || !this.currentAudio.buffered.length) {
        this.bufferProgress = 0;
        return;
      }

      const duration = this.currentAudio.duration;
      if (duration > 0) {
        const bufferedEnd = this.currentAudio.buffered.end(this.currentAudio.buffered.length - 1);
        this.bufferProgress = Math.round((bufferedEnd / duration) * 100);
        this.updateAudioPageUI();
      }
    },

    // Précharger la prochaine piste pour une transition fluide
    preloadNextTrack() {
      if (!this.currentPlaylist || this.isLooping) return;

      const playlist = this.config.playlists[this.currentPlaylist];
      if (!playlist || !playlist.tracks.length) return;

      const nextIndex = (this.currentTrackIndex + 1) % playlist.tracks.length;

      // Ne pas précharger si déjà fait
      if (this.preloadedTrackIndex === nextIndex) return;

      const baseUrl = window.STANDALONE_VERSION ? this.config.baseUrlGitHub : this.config.baseUrl;
      const nextTrackPath = playlist.tracks[nextIndex];
      const fullUrl = `${baseUrl}/${nextTrackPath}`;

      // Nettoyer l'ancien préchargement
      if (this.preloadedAudio) {
        this.preloadedAudio.src = '';
        this.preloadedAudio = null;
      }

      this.preloadedAudio = new Audio();
      this.preloadedAudio.preload = 'auto';
      this.preloadedAudio.crossOrigin = 'anonymous';
      this.preloadedAudio.src = fullUrl;
      this.preloadedTrackIndex = nextIndex;
    },

    async play() {

      if (!this.currentAudio || !this.isEnabled) {
        return;
      }

      try {
        // Attendre qu'il y ait assez de données pour commencer à jouer (streaming)
        // readyState: 0 = HAVE_NOTHING, 1 = HAVE_METADATA, 2 = HAVE_CURRENT_DATA, 3 = HAVE_FUTURE_DATA, 4 = HAVE_ENOUGH_DATA
        if (this.currentAudio.readyState < 3) {
          // Afficher l'état de buffering pendant le chargement initial
          this.isBuffering = true;
          this.updateAudioPageUI();

          await new Promise((resolve, reject) => {
            // canplay = assez de données bufferisées pour commencer (streaming)
            // canplaythrough = peut jouer jusqu'à la fin sans interruption (chargement complet)
            this.currentAudio.addEventListener('canplay', resolve, { once: true });
            this.currentAudio.addEventListener('error', reject, { once: true });
            // Pas de timeout - on laisse le streaming se faire
          });

          this.isBuffering = false;
        }

        const playPromise = this.currentAudio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          this.isPlaying = true;
        }
        
        this.updateUI();
      } catch (error) {
        console.error('❌ Audio play failed:', error.message);
        console.error('❌ Error name:', error.name);
        console.error('❌ Audio state:', this.currentAudio.readyState);
        console.error('❌ Audio src:', this.currentAudio.src);

        this.isPlaying = false;
        this.isBuffering = false;
        this.updateUI();
        this.updateAudioPageUI();

        // Afficher un message d'erreur détaillé
        this.showAudioError(error);
      }
    },

    showAudioPermissionMessage() {
      // Afficher un message discret pour informer l'utilisateur
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1001;
        background: var(--bronze); color: white; padding: 1rem; border-radius: 8px;
        max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: "Cinzel", serif; text-align: center;
      `;
      message.innerHTML = `
        <div style="margin-bottom: 0.5rem;">🎵 Audio bloqué par le navigateur</div>
        <div style="font-size: 0.9rem; margin-bottom: 1rem;">Cliquez sur le bouton lecture pour démarrer la musique</div>
        <button onclick="this.parentElement.remove()" style="background: var(--gold); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">OK</button>
      `;
      
      document.body.appendChild(message);
      
      // Retirer automatiquement après 5 secondes
      setTimeout(() => {
        if (message.parentElement) {
          message.remove();
        }
      }, 5000);
    },

    showAudioError(error) {
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1001;
        background: #dc2626; color: white; padding: 1rem; border-radius: 8px;
        max-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: "Cinzel", serif; text-align: left;
      `;
      
      let errorMessage = 'Erreur audio inconnue';
      if (error.name === 'NotSupportedError') {
        errorMessage = 'Format audio non supporté';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Lecture audio bloquée par le navigateur';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Erreur réseau - Fichier audio inaccessible';
      }
      
      message.innerHTML = `
        <div style="margin-bottom: 0.5rem; font-weight: bold;">🚫 Erreur Audio</div>
        <div style="font-size: 0.9rem; margin-bottom: 1rem;">${errorMessage}</div>
        <div style="font-size: 0.8rem; margin-bottom: 1rem; opacity: 0.8;">
          Détails: ${error.message}
        </div>
        <button onclick="this.parentElement.remove()" style="background: var(--gold); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">OK</button>
      `;
      
      document.body.appendChild(message);
      
      setTimeout(() => {
        if (message.parentElement) {
          message.remove();
        }
      }, 8000);
    },

    pause() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.isPlaying = false;
        this.updateUI();
        this.updateAudioPageUI();
      }
    },

    stop() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.isPlaying = false;
        this.updateUI();
        this.updateAudioPageUI();
      }
    },

    toggle() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    async playNext() {
      if (!this.currentPlaylist) return;

      const playlist = this.config.playlists[this.currentPlaylist];
      if (!playlist || !playlist.tracks.length) return;

      const wasPlaying = this.isPlaying;

      // Fade out si en cours de lecture
      if (wasPlaying && this.currentAudio) {
        await this.fadeOut(300);
      }

      if (this.isShuffleMode) {
        // Mode aléatoire : choisir une piste non jouée
        const unplayedIndexes = [];
        for (let i = 0; i < playlist.tracks.length; i++) {
          if (!this.playedTracksInCategory.includes(i)) {
            unplayedIndexes.push(i);
          }
        }

        // Si toutes les pistes ont été jouées, reset et recommencer
        if (unplayedIndexes.length === 0) {
          this.playedTracksInCategory = [];
          for (let i = 0; i < playlist.tracks.length; i++) {
            if (i !== this.currentTrackIndex) {
              unplayedIndexes.push(i);
            }
          }
        }

        // Choisir une piste aléatoire parmi les non jouées
        if (unplayedIndexes.length > 0) {
          this.currentTrackIndex = unplayedIndexes[Math.floor(Math.random() * unplayedIndexes.length)];
        } else {
          this.currentTrackIndex = 0;
        }

        this.playedTracksInCategory.push(this.currentTrackIndex);
      } else {
        // Mode séquentiel
        this.currentTrackIndex = (this.currentTrackIndex + 1) % playlist.tracks.length;
      }

      // Utiliser la piste préchargée si disponible (seulement en mode séquentiel)
      const usePreloaded = !this.isShuffleMode && this.preloadedTrackIndex === this.currentTrackIndex && this.preloadedAudio;
      await this.loadTrack(playlist.tracks[this.currentTrackIndex], usePreloaded);
      this.updateAudioPageUI();

      // Relancer la lecture avec fade in si était en cours
      if (wasPlaying) {
        await this.fadeIn(300);
      }
    },

    async playPrevious() {
      if (!this.currentPlaylist) return;

      const playlist = this.config.playlists[this.currentPlaylist];
      if (!playlist || !playlist.tracks.length) return;

      const wasPlaying = this.isPlaying;

      // Fade out si en cours de lecture
      if (wasPlaying && this.currentAudio) {
        await this.fadeOut(500);
      }

      // Toujours passer à la piste précédente en ordre séquentiel
      this.currentTrackIndex = this.currentTrackIndex > 0 ? this.currentTrackIndex - 1 : playlist.tracks.length - 1;

      await this.loadTrack(playlist.tracks[this.currentTrackIndex]);
      this.updateAudioPageUI(); // Mettre à jour l'affichage du titre

      // Relancer la lecture avec fade in si était en cours
      if (wasPlaying) {
        await this.fadeIn(500);
      }
    },

    // Fade out progressif
    fadeOut(duration = 500) {
      return new Promise((resolve) => {
        if (!this.currentAudio) {
          resolve();
          return;
        }

        const startVolume = this.currentAudio.volume;
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = startVolume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
          currentStep++;
          const newVolume = Math.max(0, startVolume - (volumeStep * currentStep));
          this.currentAudio.volume = newVolume;

          if (currentStep >= steps) {
            clearInterval(fadeInterval);
            this.currentAudio.pause();
            resolve();
          }
        }, stepDuration);
      });
    },

    // Fade in progressif
    fadeIn(duration = 500) {
      return new Promise(async (resolve) => {
        if (!this.currentAudio) {
          resolve();
          return;
        }

        // Commencer à volume 0
        this.currentAudio.volume = 0;

        try {
          await this.currentAudio.play();
          this.isPlaying = true;
        } catch (error) {
          console.error('Fade in play failed:', error);
          this.currentAudio.volume = this.volume;
          resolve();
          return;
        }

        const targetVolume = this.volume;
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = targetVolume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
          currentStep++;
          const newVolume = Math.min(targetVolume, volumeStep * currentStep);
          this.currentAudio.volume = newVolume;

          if (currentStep >= steps) {
            clearInterval(fadeInterval);
            this.currentAudio.volume = targetVolume;
            this.updateUI();
            this.updateAudioPageUI();
            resolve();
          }
        }, stepDuration);
      });
    },

    setVolume(newVolume) {
      this.volume = Math.max(0, Math.min(1, newVolume));
      if (this.currentAudio) {
        this.currentAudio.volume = this.volume;
      }
      localStorage.setItem('jdr-audio-volume', this.volume.toString());
      this.updateUI();
    },

    toggleEnabled() {
      this.isEnabled = !this.isEnabled;
      localStorage.setItem('jdr-audio-enabled', this.isEnabled.toString());
      
      if (!this.isEnabled) {
        this.stop();
      }
      
      this.updateUI();
    },

    createAudioControls() {
      // Ne créer les contrôles flottants QUE en mode développement (MJ)
      if (window.STANDALONE_VERSION) return;
      
      // Créer le panneau de contrôle audio flottant
      const audioPanel = document.createElement('div');
      audioPanel.id = 'audio-controls';
      audioPanel.className = 'audio-controls';
      audioPanel.innerHTML = `
        <div class="audio-panel">
          <div class="audio-header">
            <span class="audio-icon">🎵</span>
            <span class="audio-title">Lecteur audio</span>
            <button class="audio-toggle-btn" title="Activer/Désactiver l'audio">🔊</button>
          </div>
          <div class="audio-info">
            <div class="playlist-name">Aucune playlist</div>
            <div class="track-name">Aucun titre</div>
          </div>
          <div class="audio-controls-row">
            <button class="audio-btn audio-prev" title="Piste précédente">⏮️</button>
            <button class="audio-btn audio-play-pause" title="Lecture/Pause">▶️</button>
            <button class="audio-btn audio-next" title="Piste suivante">⏭️</button>
          </div>
          <div class="audio-volume-row">
            <span class="volume-icon">🔊</span>
            <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="${this.volume}">
            <span class="volume-value">${Math.round(this.volume * 100)}%</span>
          </div>
        </div>
      `;

      document.body.appendChild(audioPanel);
      this.setupAudioControlEvents();
      this.updateUI();
    },

    setupAudioControlEvents() {
      const panel = document.getElementById('audio-controls');
      if (!panel) return;

      // Toggle activation
      panel.querySelector('.audio-toggle-btn').addEventListener('click', () => {
        this.toggleEnabled();
      });

      // Contrôles de lecture
      panel.querySelector('.audio-play-pause').addEventListener('click', () => {
        this.toggle();
      });

      panel.querySelector('.audio-prev').addEventListener('click', () => {
        this.playPrevious();
      });

      panel.querySelector('.audio-next').addEventListener('click', () => {
        this.playNext();
      });

      // Contrôle du volume
      panel.querySelector('.volume-slider').addEventListener('input', (e) => {
        this.setVolume(parseFloat(e.target.value));
      });
    },

    updateUI() {
      const panel = document.getElementById('audio-controls');
      if (!panel) return;

      const playlist = this.currentPlaylist ? this.config.playlists[this.currentPlaylist] : null;
      
      // Mettre à jour les informations
      panel.querySelector('.playlist-name').textContent = playlist ? `${playlist.icon} ${playlist.name}` : 'Aucune playlist';
      
      const currentTrack = playlist && playlist.tracks[this.currentTrackIndex] 
        ? playlist.tracks[this.currentTrackIndex].split('/').pop().replace('.mp3', '')
        : 'Aucun titre';
      panel.querySelector('.track-name').textContent = currentTrack;

      // Mettre à jour les boutons
      panel.querySelector('.audio-play-pause').textContent = this.isPlaying ? '⏸️' : '▶️';
      panel.querySelector('.audio-toggle-btn').textContent = this.isEnabled ? '🔊' : '🔇';
      
      // Mettre à jour le volume
      panel.querySelector('.volume-slider').value = this.volume;
      panel.querySelector('.volume-value').textContent = `${Math.round(this.volume * 100)}%`;

      // Opacité du panneau selon l'état
      panel.style.opacity = this.isEnabled ? '1' : '0.6';
    },

    restoreUserPreferences() {
      // Restaurer le volume
      const savedVolume = localStorage.getItem('jdr-audio-volume');
      if (savedVolume) {
        this.volume = parseFloat(savedVolume);
      }

      // Restaurer l'état activé/désactivé (déjà fait dans loadAudioConfig)
      // Ne pas écraser la valeur par défaut
    },

    // Méthodes publiques pour les contrôles externes
    getCurrentPlaylist() {
      return this.currentPlaylist ? this.config.playlists[this.currentPlaylist] : null;
    },

    getAvailablePlaylists() {
      return Object.entries(this.config.playlists).map(([id, playlist]) => ({
        id,
        name: playlist.name,
        icon: playlist.icon
      }));
    },

    async switchToPlaylistById(playlistId) {
      if (this.config.playlists[playlistId]) {
        await this.switchToPlaylist(playlistId);
      }
    },

    // Peupler la page audio avec les contrôles et informations
    populateAudioPage() {
      if (!this.config || !this.config.playlists) {
        return;
      }

      // Éviter les appels multiples simultanés
      if (this.isPopulating) {
        return;
      }

      this.isPopulating = true;

      // Fonctions globales simples
      window.audioToggle = () => {
        this.toggleEnabled();
        this.updateAudioPageUI();
      };

      window.audioPlayPause = () => {
        this.toggle();
        this.updateAudioPageUI();
      };

      window.audioVolume = (value) => {
        this.setVolume(parseFloat(value));
        const display = document.getElementById('vol-display');
        if (display) display.textContent = `${Math.round(this.volume * 100)}%`;
      };

      window.audioNext = () => {
        this.playNext();
        this.updateAudioPageUI();
      };

      window.audioToggleLoop = () => {
        this.isLooping = !this.isLooping;
        this.updateAudioPageUI();
      };

      window.audioToggleShuffle = () => {
        this.isShuffleMode = !this.isShuffleMode;
        this.playedTracksInCategory = []; // Reset quand on change de mode
        if (this.currentTrackIndex >= 0) {
          this.playedTracksInCategory.push(this.currentTrackIndex);
        }
        this.updateAudioPageUI();
      };

      // Contrôles audio principaux
      const audioControlsContainer = document.getElementById('audio-controls-page');
      if (audioControlsContainer) {
        audioControlsContainer.innerHTML = `
          <div style="padding: 2rem; background: var(--card); border-radius: 8px;">
            <h4 style="text-align: center; margin-bottom: 2rem;">🎵 Contrôles Audio</h4>
            
            <button id="toggle-btn" 
                    style="display: block; width: 100%; padding: 1.5rem; margin-bottom: 1rem; background: ${this.isEnabled ? '#16a34a' : '#dc2626'}; color: white; border: none; border-radius: 8px; font-size: 1.3rem; cursor: pointer; font-weight: bold;">
              ${this.isEnabled ? '🔊 AUDIO ACTIVÉ' : '🔇 AUDIO DÉSACTIVÉ'}
            </button>
            
            <button id="play-pause-btn"
                    style="display: block; width: 100%; padding: 1.5rem; margin-bottom: 1rem; background: var(--gold); color: white; border: none; border-radius: 8px; font-size: 1.3rem; cursor: pointer; font-weight: bold;">
              ${this.isPlaying ? '⏸️ PAUSE' : '▶️ LECTURE'}
            </button>
            
            <button id="next-btn"
                    style="display: block; width: 100%; padding: 1.5rem; margin-bottom: 1rem; background: var(--bronze); color: white; border: none; border-radius: 8px; font-size: 1.3rem; cursor: pointer; font-weight: bold;">
              ⏭️ MUSIQUE SUIVANTE
            </button>

            <button id="shuffle-btn"
                    style="display: block; width: 100%; padding: 1.5rem; margin-bottom: 1rem; background: ${this.isShuffleMode ? '#8b5cf6' : '#6b7280'}; color: white; border: none; border-radius: 8px; font-size: 1.3rem; cursor: pointer; font-weight: bold;">
              ${this.isShuffleMode ? '🔀 ALÉATOIRE ACTIVÉ' : '🔀 ALÉATOIRE DÉSACTIVÉ'}
            </button>

            <button id="loop-btn"
                    style="display: block; width: 100%; padding: 1.5rem; margin-bottom: 1rem; background: ${this.isLooping ? '#8b5cf6' : '#6b7280'}; color: white; border: none; border-radius: 8px; font-size: 1.3rem; cursor: pointer; font-weight: bold;">
              ${this.isLooping ? '🔂 BOUCLE ACTIVÉE' : '🔁 BOUCLE DÉSACTIVÉE'}
            </button>

            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">🔊 Volume: <span id="vol-display">${Math.round(this.volume * 100)}%</span></label>
              <input type="range" id="volume-slider"
                     min="0" max="1" step="0.1" value="${this.volume}" 
                     style="width: 100%; height: 12px; cursor: pointer;">
            </div>
            
            <div style="text-align: center; padding: 1rem; background: var(--paper-dark); border-radius: 6px; margin-bottom: 1rem;">
              <p id="current-playlist" style="margin: 0; font-weight: bold; color: var(--gold);">
                ${this.currentPlaylist ? `🎼 ${this.config.playlists[this.currentPlaylist].name}` : 'Aucune playlist'}
              </p>
              <p id="current-track" style="margin: 0.5rem 0 0 0; font-style: italic; color: var(--paper-muted); font-size: 0.9rem;">
                ${this.getCurrentTrackName()}
              </p>
              <div id="buffer-progress-container" style="margin-top: 0.8rem; display: ${this.isBuffering ? 'block' : 'none'};">
                <div style="font-size: 0.8rem; color: var(--paper-muted); margin-bottom: 0.3rem;">
                  Chargement: <span id="buffer-percent">${this.bufferProgress}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: var(--paper); border-radius: 3px; overflow: hidden;">
                  <div id="buffer-bar" style="width: ${this.bufferProgress}%; height: 100%; background: var(--gold); transition: width 0.3s ease;"></div>
                </div>
              </div>
            </div>
          </div>
        `;

        // Ajouter les event listeners APRÈS avoir créé le HTML
        // Utiliser { once: false } n'est pas suffisant, il faut cloner les boutons pour retirer tous les listeners
        setTimeout(() => {
          const toggleBtn = document.getElementById('toggle-btn');
          const playPauseBtn = document.getElementById('play-pause-btn');
          const nextBtn = document.getElementById('next-btn');
          const volumeSlider = document.getElementById('volume-slider');

          // Cloner et remplacer pour retirer tous les event listeners existants
          if (toggleBtn) {
            const newToggleBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
            newToggleBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.audioToggle();
            });
          }

          if (playPauseBtn) {
            const newPlayPauseBtn = playPauseBtn.cloneNode(true);
            playPauseBtn.parentNode.replaceChild(newPlayPauseBtn, playPauseBtn);
            newPlayPauseBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.audioPlayPause();
            });
          }

          if (nextBtn) {
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            newNextBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.audioNext();
            });
          }

          const shuffleBtn = document.getElementById('shuffle-btn');
          if (shuffleBtn) {
            const newShuffleBtn = shuffleBtn.cloneNode(true);
            shuffleBtn.parentNode.replaceChild(newShuffleBtn, shuffleBtn);
            newShuffleBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.audioToggleShuffle();
            });
          }

          const loopBtn = document.getElementById('loop-btn');
          if (loopBtn) {
            const newLoopBtn = loopBtn.cloneNode(true);
            loopBtn.parentNode.replaceChild(newLoopBtn, loopBtn);
            newLoopBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.audioToggleLoop();
            });
          }

          if (volumeSlider) {
            const newVolumeSlider = volumeSlider.cloneNode(true);
            volumeSlider.parentNode.replaceChild(newVolumeSlider, volumeSlider);
            newVolumeSlider.addEventListener('input', (e) => {
              window.audioVolume(e.target.value);
            });
          }
        }, 50);
      }

      // Liste des playlists
      const playlistsContainer = document.getElementById('playlists-list');
      if (playlistsContainer) {
        
        // Créer les fonctions globales pour chaque playlist
        Object.entries(this.config.playlists).forEach(([id, playlist]) => {
          window[`selectPlaylist_${id}`] = () => {
            // Feedback visuel immédiat
            const btn = document.getElementById(`playlist-btn-${id}`);
            if (btn) {
              btn.style.background = '#16a34a';
              btn.textContent = '⏳ Chargement...';
              btn.disabled = true;
            }
            
            this.switchToPlaylistById(id);
            setTimeout(() => {
              this.updateAudioPageUI();
              // Re-générer la liste des playlists pour mettre à jour les états
              this.updatePlaylistsDisplay();
            }, 200);
          };
        });

        const playlistsHTML = Object.entries(this.config.playlists).map(([id, playlist]) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; margin: 0.5rem 0; background: var(--card); border-radius: 8px; border: 2px solid ${this.currentPlaylist === id ? 'var(--gold)' : 'var(--bronze)'};">
            <div>
              <strong style="font-size: 1.1rem;">${playlist.icon} ${playlist.name}</strong>
              <br><small style="color: var(--paper-muted); font-size: 0.9rem;">${playlist.tracks.length} piste(s)</small>
            </div>
            <button id="playlist-btn-${id}" 
                    style="padding: 0.8rem 1.2rem; background: ${this.currentPlaylist === id ? 'var(--gold)' : 'var(--bronze)'}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
              ${this.currentPlaylist === id ? '🎵 Active' : '▶️ Activer'}
            </button>
          </div>
        `).join('');
        
        playlistsContainer.innerHTML = playlistsHTML;

        // Ajouter les event listeners pour les boutons de playlist
        setTimeout(() => {
          Object.entries(this.config.playlists).forEach(([id, playlist]) => {
            const btn = document.getElementById(`playlist-btn-${id}`);
            if (btn) {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                window[`selectPlaylist_${id}`]();
              });
            }
          });
        }, 50);
      }

      // Libérer le flag après un court délai pour s'assurer que tous les setTimeout sont terminés
      setTimeout(() => {
        this.isPopulating = false;
      }, 100);
    },

    // Obtenir le nom de la piste actuelle
    getCurrentTrackName() {
      if (!this.currentPlaylist || !this.config.playlists[this.currentPlaylist]) {
        return 'Aucun titre';
      }
      
      const playlist = this.config.playlists[this.currentPlaylist];
      const currentTrack = playlist.tracks[this.currentTrackIndex];
      
      if (!currentTrack) return 'Aucun titre';
      
      // Extraire le nom du fichier sans extension
      return currentTrack.split('/').pop().replace('.mp3', '');
    },

    // Mettre à jour seulement l'interface sans regénérer tout le HTML
    updateAudioPageUI() {
      // Mettre à jour le bouton toggle
      const toggleBtn = document.getElementById('toggle-btn');
      if (toggleBtn) {
        toggleBtn.style.background = this.isEnabled ? '#16a34a' : '#dc2626';
        toggleBtn.textContent = this.isEnabled ? '🔊 AUDIO ACTIVÉ' : '🔇 AUDIO DÉSACTIVÉ';
      }

      // Mettre à jour le bouton play/pause
      const playPauseBtn = document.getElementById('play-pause-btn');
      if (playPauseBtn) {
        if (this.isBuffering) {
          playPauseBtn.textContent = '⏳ CHARGEMENT...';
          playPauseBtn.style.background = '#f59e0b'; // Orange pour buffering
        } else {
          playPauseBtn.textContent = this.isPlaying ? '⏸️ PAUSE' : '▶️ LECTURE';
          playPauseBtn.style.background = 'var(--gold)';
        }
      }

      // Mettre à jour le bouton shuffle
      const shuffleBtn = document.getElementById('shuffle-btn');
      if (shuffleBtn) {
        shuffleBtn.style.background = this.isShuffleMode ? '#8b5cf6' : '#6b7280';
        shuffleBtn.textContent = this.isShuffleMode ? '🔀 ALÉATOIRE ACTIVÉ' : '🔀 ALÉATOIRE DÉSACTIVÉ';
      }

      // Mettre à jour le bouton loop
      const loopBtn = document.getElementById('loop-btn');
      if (loopBtn) {
        loopBtn.style.background = this.isLooping ? '#8b5cf6' : '#6b7280';
        loopBtn.textContent = this.isLooping ? '🔂 BOUCLE ACTIVÉE' : '🔁 BOUCLE DÉSACTIVÉE';
      }

      // Mettre à jour le volume
      const volDisplay = document.getElementById('vol-display');
      if (volDisplay) {
        volDisplay.textContent = `${Math.round(this.volume * 100)}%`;
      }

      // Mettre à jour la playlist et track actuelles
      const currentPlaylistEl = document.getElementById('current-playlist');
      if (currentPlaylistEl) {
        const playlistName = this.currentPlaylist ? 
          `🎼 ${this.config.playlists[this.currentPlaylist].name}` : 
          'Aucune playlist';
        currentPlaylistEl.textContent = playlistName;
      }

      const currentTrackEl = document.getElementById('current-track');
      if (currentTrackEl) {
        currentTrackEl.textContent = this.getCurrentTrackName();
      }

      // Mettre à jour la barre de progression du buffering
      const bufferContainer = document.getElementById('buffer-progress-container');
      const bufferBar = document.getElementById('buffer-bar');
      const bufferPercent = document.getElementById('buffer-percent');

      if (bufferContainer) {
        bufferContainer.style.display = this.isBuffering ? 'block' : 'none';
      }
      if (bufferBar) {
        bufferBar.style.width = `${this.bufferProgress}%`;
      }
      if (bufferPercent) {
        bufferPercent.textContent = `${this.bufferProgress}%`;
      }
    },

    // Mettre à jour seulement l'affichage des playlists
    updatePlaylistsDisplay() {
      const playlistsContainer = document.getElementById('playlists-list');
      if (!playlistsContainer) return;

      Object.entries(this.config.playlists).forEach(([id, playlist]) => {
        const btn = document.getElementById(`playlist-btn-${id}`);
        const container = btn?.parentElement?.parentElement;
        
        if (btn && container) {
          // Mettre à jour la bordure du container
          container.style.border = `2px solid ${this.currentPlaylist === id ? 'var(--gold)' : 'var(--bronze)'}`;
          
          // Mettre à jour le bouton
          btn.style.background = this.currentPlaylist === id ? 'var(--gold)' : 'var(--bronze)';
          btn.textContent = this.currentPlaylist === id ? '🎵 Active' : '▶️ Activer';
          btn.disabled = false;
        }
      });
    }
  };

})();