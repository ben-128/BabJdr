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
        this.createAudioControls();
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
        
        this.volume = this.config.defaultVolume || 0.3;
        this.isEnabled = localStorage.getItem('jdr-audio-enabled') !== 'false';
      } catch (error) {
        console.warn('Failed to load audio config:', error);
        this.config = { playlists: {}, pageMapping: {} };
      }
    },

    setupEventListeners() {
      // Écouter les changements de page pour changer la musique
      EventBus.on(Events.PAGE_CHANGE || 'page-change', (payload) => {
        if (this.isEnabled && payload.page) {
          this.handlePageChange(payload.page);
        }
      });

      // Écouter les changements de hash pour détecter les changements de page
      window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#/', '') || 'creation';
        
        // Mettre à jour la page audio si c'est la page affichée
        if (page === 'audio') {
          setTimeout(() => this.populateAudioPage(), 100);
        }
        
        if (this.isEnabled) {
          this.handlePageChange(page);
        }
      });
    },

    handlePageChange(page) {
      // Mapper la page à une playlist
      const playlistId = this.config.pageMapping[page] || this.getPlaylistForPage(page);
      
      if (playlistId && this.config.playlists[playlistId]) {
        this.switchToPlaylist(playlistId);
      }
    },

    getPlaylistForPage(page) {
      // Logique de mapping par défaut
      if (page === 'creation') return 'creation';
      if (page.includes('foret') || page === 'monstres') return 'foret';
      if (page.includes('boss')) return 'boss';
      if (page === 'objets') return 'auberge';
      return 'melodique'; // Par défaut
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

        const fullUrl = `${this.config.baseUrl}/${trackPath}`;
        this.currentAudio = new Audio(fullUrl);
        this.currentAudio.volume = this.volume;
        
        // Support Bluetooth automatique
        this.currentAudio.preload = 'metadata';
        
        // Gestion des événements audio
        this.currentAudio.addEventListener('ended', () => {
          this.playNext();
        });
        
        this.currentAudio.addEventListener('error', (e) => {
          console.warn('Audio loading failed:', fullUrl, e);
          this.playNext(); // Passer au suivant en cas d'erreur
        });

        // Auto-play si était en cours de lecture
        if (this.isPlaying) {
          await this.play();
        }
        
      } catch (error) {
        console.warn('Failed to load track:', trackPath, error);
      }
    },

    async play() {
      if (!this.currentAudio || !this.isEnabled) return;
      
      try {
        await this.currentAudio.play();
        this.isPlaying = true;
        this.updateUI();
      } catch (error) {
        console.warn('Autoplay blocked or audio failed:', error);
        this.isPlaying = false;
        this.updateUI();
      }
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
      if (!this.config || !this.config.playlists) return;

      // Contrôles audio principaux
      const audioControlsContainer = document.getElementById('audio-controls-page');
      if (audioControlsContainer) {
        audioControlsContainer.innerHTML = `
          <div style="text-align: center; padding: 1rem; background: var(--card); border-radius: 8px; border: 2px solid var(--bronze);">
            <h4 style="color: var(--gold); margin-bottom: 1rem;">🎵 Contrôles principaux</h4>
            <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
              <button id="master-audio-toggle" class="btn" style="background: var(--bronze); color: white;">
                ${this.isEnabled ? '🔊 Audio activé' : '🔇 Audio désactivé'}
              </button>
              <button id="master-audio-play-pause" class="btn" style="background: var(--gold); color: white;">
                ${this.isPlaying ? '⏸️ Pause' : '▶️ Lecture'}
              </button>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
              <span>🔊 Volume:</span>
              <input type="range" id="master-volume" min="0" max="1" step="0.1" value="${this.volume}" style="flex: 1; max-width: 200px;">
              <span id="master-volume-display">${Math.round(this.volume * 100)}%</span>
            </div>
            <p style="margin-top: 1rem; font-style: italic; color: var(--paper-muted);">
              ${this.currentPlaylist ? `🎼 Playlist active: ${this.config.playlists[this.currentPlaylist].name}` : 'Aucune playlist active'}
            </p>
          </div>
        `;

        // Event listeners pour les contrôles de la page
        document.getElementById('master-audio-toggle')?.addEventListener('click', () => {
          this.toggleEnabled();
          this.populateAudioPage(); // Rafraîchir l'affichage
        });

        document.getElementById('master-audio-play-pause')?.addEventListener('click', () => {
          this.toggle();
          this.populateAudioPage(); // Rafraîchir l'affichage
        });

        document.getElementById('master-volume')?.addEventListener('input', (e) => {
          this.setVolume(parseFloat(e.target.value));
          document.getElementById('master-volume-display').textContent = `${Math.round(this.volume * 100)}%`;
        });
      }

      // Liste des playlists
      const playlistsContainer = document.getElementById('playlists-list');
      if (playlistsContainer) {
        const playlistsHTML = Object.entries(this.config.playlists).map(([id, playlist]) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; margin: 0.5rem 0; background: var(--card); border-radius: 6px; border-left: 4px solid ${this.currentPlaylist === id ? 'var(--gold)' : 'var(--bronze)'};">
            <div>
              <strong>${playlist.icon} ${playlist.name}</strong>
              <br><small style="color: var(--paper-muted);">${playlist.tracks.length} piste(s)</small>
            </div>
            <button class="btn small playlist-select-btn" data-playlist-id="${id}" style="background: var(--bronze); color: white;">
              ${this.currentPlaylist === id ? '🎵 Active' : '▶️ Activer'}
            </button>
          </div>
        `).join('');
        
        playlistsContainer.innerHTML = playlistsHTML;

        // Event listeners pour la sélection de playlist
        document.querySelectorAll('.playlist-select-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const playlistId = e.target.dataset.playlistId;
            await this.switchToPlaylistById(playlistId);
            this.populateAudioPage(); // Rafraîchir l'affichage
          });
        });
      }

      // Mapping page → playlist
      const mappingContainer = document.getElementById('page-mapping-list');
      if (mappingContainer) {
        const mappingHTML = Object.entries(this.config.pageMapping).map(([page, playlistId]) => {
          const playlist = this.config.playlists[playlistId];
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0; border-bottom: 1px solid var(--rule);">
              <span><strong>${page}</strong></span>
              <span>${playlist ? playlist.icon + ' ' + playlist.name : playlistId}</span>
            </div>
          `;
        }).join('');
        
        mappingContainer.innerHTML = mappingHTML || '<p style="color: var(--paper-muted); font-style: italic;">Aucun mapping configuré</p>';
      }
    }
  };

})();