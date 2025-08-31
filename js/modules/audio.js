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
    volume: 0.3,
    config: null,
    isEnabled: false,
    
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

    generatePlaylistsFromFolders() {
      // Structure de dossiers basée sur l'exploration précédente
      const folderStructure = {
        'Auberge': ['Auberge1.mp3', 'Auberge2.mp3', 'Auberge3.mp3', 'Auberge4.mp3'],
        'Creation': ['Creation1.mp3', 'Creation2.mp3', 'Creation3.mp3'],
        'Foret': ['BossForet1.mp3', 'BossForet2.mp3', 'Foret.mp3', 'Foret2.mp3', 'Foret3.mp3'],
        'Mine': ['BossMine1.mp3', 'BossMine2.mp3', 'Mine1.mp3', 'Mine2.mp3', 'Mine3.mp3'],
        'Voyage': ['Voyage1.mp3', 'Voyage2.mp3'],
        'Autre': ['BOS01_01.mp3', 'BOS05_01.mp3', 'BOS06_01.mp3', 'BOS07_01.mp3', 'BOS09_01.mp3', 'BOS10_01.mp3', 'BOS99_01.mp3', 'MEL02_01.mp3', 'MEL04_01.mp3', 'MEL05_02.mp3', 'MEL05_03.mp3', 'MEL06_01.mp3', 'MEL07_01.mp3', 'MEL07_02.mp3', 'MEL08_01.mp3', 'MEL10_02.mp3']
      };

      this.config.playlists = {};
      
      Object.entries(folderStructure).forEach(([folder, files]) => {
        const playlistId = folder.toLowerCase();
        this.config.playlists[playlistId] = {
          name: folder,
          icon: this.config.folderIcons[folder] || '🎵',
          tracks: files.map(file => `${folder}/${file}`),
          loop: true,
          shuffle: folder === 'Auberge' || folder === 'Voyage' || folder === 'Autre'
        };
      });
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
      this.currentTrackIndex = 0;
      
      const playlist = this.config.playlists[playlistId];
      if (playlist && this.isEnabled) {
        await this.loadTrack(playlist.tracks[0]);
        this.updateUI();
      }
    },

    async loadTrack(trackPath) {
      try {
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
        
        // Gestion des événements audio
        this.currentAudio.addEventListener('ended', () => {
          this.playNext();
        });
        
        this.currentAudio.addEventListener('error', (e) => {
          console.error('🚫 Audio loading failed:', fullUrl, e);
          console.error('Error details:', e.target.error);
          this.playNext();
        });


        // Définir la source APRÈS avoir configuré les event listeners
        this.currentAudio.src = fullUrl;

        // Auto-play si était en cours de lecture
        if (this.isPlaying) {
          await this.play();
        }
        
      } catch (error) {
        console.error('🚫 Failed to load track:', trackPath, error);
      }
    },

    async play() {
      
      if (!this.currentAudio || !this.isEnabled) {
        return;
      }
      
      try {
        // Vérifier que l'audio est chargé
        if (this.currentAudio.readyState === 0) {
          await new Promise((resolve, reject) => {
            this.currentAudio.addEventListener('loadeddata', resolve, { once: true });
            this.currentAudio.addEventListener('error', reject, { once: true });
            setTimeout(() => reject(new Error('Load timeout')), 10000);
          });
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
        this.updateUI();
        
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
      }
    },

    stop() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.isPlaying = false;
        this.updateUI();
      }
    },

    toggle() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    playNext() {
      if (!this.currentPlaylist) return;
      
      const playlist = this.config.playlists[this.currentPlaylist];
      if (!playlist || !playlist.tracks.length) return;

      if (playlist.shuffle) {
        this.currentTrackIndex = Math.floor(Math.random() * playlist.tracks.length);
      } else {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % playlist.tracks.length;
      }

      this.loadTrack(playlist.tracks[this.currentTrackIndex]);
    },

    playPrevious() {
      if (!this.currentPlaylist) return;
      
      const playlist = this.config.playlists[this.currentPlaylist];
      if (!playlist || !playlist.tracks.length) return;

      if (playlist.shuffle) {
        this.currentTrackIndex = Math.floor(Math.random() * playlist.tracks.length);
      } else {
        this.currentTrackIndex = this.currentTrackIndex > 0 ? this.currentTrackIndex - 1 : playlist.tracks.length - 1;
      }

      this.loadTrack(playlist.tracks[this.currentTrackIndex]);
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
      } else {
        // Reprendre la musique de la page actuelle
        const currentPage = window.location.hash.replace('#/', '') || 'creation';
        this.handlePageChange(currentPage);
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

      // Restaurer l'état activé/désactivé
      const savedEnabled = localStorage.getItem('jdr-audio-enabled');
      if (savedEnabled !== null) {
        this.isEnabled = savedEnabled === 'true';
      }
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
            
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">🔊 Volume: <span id="vol-display">${Math.round(this.volume * 100)}%</span></label>
              <input type="range" id="volume-slider"
                     min="0" max="1" step="0.1" value="${this.volume}" 
                     style="width: 100%; height: 12px; cursor: pointer;">
            </div>
            
            <p style="text-align: center; font-style: italic; color: var(--paper-muted);">
              ${this.currentPlaylist ? `🎼 ${this.config.playlists[this.currentPlaylist].name}` : 'Aucune playlist'}
            </p>
          </div>
        `;

        // Ajouter les event listeners APRÈS avoir créé le HTML
        setTimeout(() => {
          const toggleBtn = document.getElementById('toggle-btn');
          const playPauseBtn = document.getElementById('play-pause-btn');
          const nextBtn = document.getElementById('next-btn');
          const volumeSlider = document.getElementById('volume-slider');

          if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.audioToggle();
            });
          }

          if (playPauseBtn) {
            playPauseBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.audioPlayPause();
            });
          }

          if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
              e.preventDefault();
              window.audioNext();
            });
          }

          if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
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
            this.switchToPlaylistById(id);
            setTimeout(() => this.updateAudioPageUI(), 200);
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
        playPauseBtn.textContent = this.isPlaying ? '⏸️ PAUSE' : '▶️ LECTURE';
      }

      // Mettre à jour le volume
      const volDisplay = document.getElementById('vol-display');
      if (volDisplay) {
        volDisplay.textContent = `${Math.round(this.volume * 100)}%`;
      }
    }
  };

})();