# JDR-BAB - Livret de règles ⚔️📜

Progressive Web App pour le système de jeu de rôle JDR-BAB avec thème médiéval-fantasy.

## 🚀 Accès direct

### 📱 **Version PWA (GitHub Pages)**
- **URL**: https://ben-128.github.io/BabJdr/build/JdrBab.html
- **Fonctionnalités**: Installation native, cache offline, optimisé mobile
- **Idéal pour**: Parties de JDR, usage mobile/tablette

### 🛠️ **Développement local**
- **Fichier**: `dev.html`
- **Fonctionnalités**: Version modulaire, outils de développement
- **Idéal pour**: Développement, ajout de contenu

## 📁 Structure du projet

```
├── 📄 dev.html                 # Version développement (modular)
├── 📄 index.html               # Page d'accueil GitHub Pages
├── 📁 config/                  # Configuration PWA et app
├── 📁 docs/                    # Documentation (CLAUDE.md, etc.)
├── 📁 tools/                   # Outils de développement
├── 📁 build-output/            # Builds générés
├── 📁 assets/pwa/              # Icônes PWA
├── 📁 css/                     # Styles modulaires
├── 📁 js/                      # JavaScript modulaire
├── 📁 data/                    # Contenu RPG (JSON + assets)
└── 📁 scripts/                 # Scripts de build
```

## 🔧 Développement

### Démarrage rapide
```bash
# Développement local
ouvrir dev.html dans le navigateur

# Build standalone
tools/menu.bat → Option 2 (Build)

# Mise à jour GitHub Pages
git push origin master
```

### Outils principaux
- **`tools/menu.bat`**: Menu interactif Windows
- **`scripts/build-simple.js`**: Système de build standalone
- **`docs/CLAUDE.md`**: Instructions détaillées pour Claude Code

## 🎯 Contenu RPG

- **Classes**: 5 classes principales + 10 sous-classes
- **Sorts**: 11+ sorts répartis en 3 catégories  
- **Dons**: 24+ dons en 5 catégories
- **Équipements**: 41+ objets avec système de tags
- **Monstres**: Bestiaire complet avec stats
- **Audio**: 42+ pistes musicales par thème

## 📱 Installation mobile

1. Aller sur https://ben-128.github.io/BabJdr/build/JdrBab.html
2. **Chrome Android**: Icône "Installer" ou Menu → "Ajouter à l'écran d'accueil"
3. **Safari iOS**: Partager → "Sur l'écran d'accueil"

## 🏗️ Architecture

### JavaScript Modulaire
- **UI Core**: Architecture modulaire optimisée (`js/ui/` folder)
  - `UICore.js`: Coordinateur principal (9.5KB)
  - `SearchManager.js`: Gestion des recherches (11KB)
  - `ModalManager.js`: Système de modales (12KB)
  - `ResponsiveManager.js`: Adaptabilité mobile (8.4KB)
  - `PageManager.js`: Navigation (13KB)
  - `TagsManager.js`: Filtrage par tags (15KB)
  - `ContentManager.js`: Gestion du contenu (7.3KB)
  - `EventHandlers.js`: Événements (8.4KB)

### Optimisations récentes ⚡
- **UI.js réduit de 208KB à 3.9KB** (98% de réduction)
- **Suppression du code dupliqué** entre `ui.js` et `js/ui/`
- **Architecture 100% modulaire** pour de meilleures performances

### Technologies
- **Modular Development**: Fichiers séparés pour développement
- **Standalone Production**: Fichier unique ~1MB avec tout embedded
- **PWA Features**: Service Worker, manifest, offline-first
- **Mobile Optimized**: Responsive design, touch-friendly

---

**Bon jeu !** ⚔️🛡️✨