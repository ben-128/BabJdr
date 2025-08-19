# JDR-BAB

Application web interactive pour le jeu de rôle JDR-BAB avec système d'édition intégré et gestion multimédia.

## 🎯 Fonctionnalités principales

### 📝 Système d'édition complet
- **Édition en temps réel** : Modification directe des sorts, classes, dons et pages
- **Mode développeur** : Interface d'édition avec boutons et outils
- **Sauvegarde automatique** : Persistance des modifications dans localStorage
- **Export/Import** : Génération de fichiers ZIP avec toutes les données

### 🖼️ Gestion multimédia avancée
- **Images par élément** : Sorts, classes, sous-classes et dons
- **Sous-classes à double image** : 2 images centrées et collées par sous-classe
- **Redimensionnement intelligent** : Tailles optimisées selon le contexte
- **Upload et gestion** : Interface simple pour ajouter/retirer des images

### 🎨 Interface moderne
- **Design responsive** : Adaptation mobile et desktop
- **Thème parchemin** : Esthétique médiévale-fantastique
- **Navigation fluide** : Router avec hashbang pour navigation rapide
- **Recherche intégrée** : Filtrage en temps réel du contenu

## 🏗️ Architecture

```
JdrBab/
├── index.html              # Point d'entrée de l'application
├── css/                    # Styles modulaires
│   ├── theme.css           # Variables et thème principal
│   ├── components.css      # Composants UI (cartes, boutons, images)
│   ├── layout.css          # Mise en page et responsive
│   ├── utilities.css       # Classes utilitaires
│   └── editor.css          # Interface d'édition
├── js/                     # JavaScript modulaire
│   ├── core.js             # Initialisation et namespace principal
│   ├── utils.js            # Utilitaires DOM, événements, données
│   ├── router.js           # Système de navigation et routing
│   ├── renderer.js         # Génération dynamique du contenu
│   ├── editor.js           # Système d'édition inline
│   ├── storage.js          # Sauvegarde, export et import
│   ├── ui.js               # Interactions et modales
│   └── modules/
│       └── images.js       # Gestion des images et illustrations
├── data/                   # Base de données JSON
│   ├── sorts.json          # Sorts par catégorie avec tous les détails
│   ├── classes.json        # Classes et sous-classes de personnages
│   ├── dons.json           # Système de dons et capacités
│   ├── creation.json       # Guide de création de personnage
│   ├── images.json         # Base de données des images
│   └── *.json              # Autres pages et données statiques
├── scripts/                # Outils de développement
│   ├── build.bat           # Script de build standalone
│   ├── dev-server.bat      # Serveur de développement
│   ├── import-archive.bat  # Import d'archives ZIP
│   └── clean-backups.bat   # Nettoyage des sauvegardes
└── build/                  # Version compilée
    └── JdrBab.html         # Application standalone complète
```

## 🚀 Utilisation

### Menu principal Windows

Le moyen le plus simple pour commencer :

```batch
# Double-cliquer sur menu.bat pour accéder au menu interactif
menu.bat
```

**Options disponibles :**
1. **Serveur de développement** - Lance l'application en mode édition
2. **Build standalone** - Génère un fichier HTML autonome
3. **Import archive** - Importe une archive ZIP exportée
4. **Nettoyage sauvegardes** - Supprime les anciennes sauvegardes
5. **Quitter** - Ferme le menu

### Workflow d'édition complet

#### 1. 🛠️ Mode développement

```batch
# Via le menu
menu.bat → Option 1

# Ou directement
scripts\dev-server.bat

# Ou via npm
npm run dev-clean
```

**Ce qui se lance :**
- Serveur HTTP local sur `http://localhost:3000`
- Mode édition activé (bouton "Mode Dev" visible)
- Pas de live-reload (rechargement manuel pour voir les changements)
- Console propre sans logs parasites

#### 2. ✏️ Éditer le contenu

Une fois le serveur lancé :

1. **Activer le mode dev** : Cliquer sur le bouton "Mode Dev" en haut à droite
2. **Éditer du contenu** : Cliquer sur les boutons ✏️ qui apparaissent
3. **Modifier les textes** : Éditer directement dans les champs qui s'ouvrent
4. **Sauvegarder** : Les modifications sont automatiquement sauvegardées
5. **Voir les changements** : Rafraîchir la page (F5) pour voir les mises à jour

**Types de contenu éditables :**
- **Sorts** : Noms, descriptions, prérequis, effets, coûts en mana
- **Classes** : Descriptions, capacités, sous-classes
- **Dons** : Descriptions, prérequis, effets
- **Pages statiques** : Création de personnage, règles, éléments

#### 3. 📤 Exporter les modifications

**Via l'interface web :**
1. Cliquer sur "Sauvegarder & Exporter" dans l'interface
2. Un fichier ZIP `JdrBab-YYYYMMDDHHH.zip` sera téléchargé
3. Ce ZIP contient toutes vos modifications

**Contenu de l'export :**
- Tous les fichiers JSON avec vos modifications
- Fichiers CSS et JavaScript mis à jour
- Images ajoutées ou modifiées
- Fichier index.html principal

#### 4. 📥 Importer des modifications

```batch
# Via le menu
menu.bat → Option 3

# Ou directement
scripts\import-archive.bat
```

**Le script d'import :**
1. Cherche automatiquement le dernier fichier `JdrBab-*.zip` dans Downloads
2. Extrait et importe toutes les données
3. Crée une sauvegarde automatique avant l'import
4. Recharge l'application avec les nouvelles données

### Production et build

#### 1. 🏗️ Générer la version standalone

```batch
# Via le menu
menu.bat → Option 2

# Ou directement
scripts\build.bat

# Ou via npm
npm run build
```

**Ce qui est généré :**
- Fichier unique `build/JdrBab.html` (autonome)
- Toutes les données embarquées dans le HTML
- Fonctionne sans serveur (double-clic pour ouvrir)
- Inclut toutes vos modifications actuelles

#### 2. 📊 Informations du build

Le script affiche :
- Statut du build (succès/échec)
- Taille du fichier généré
- Chemin complet du fichier
- Option pour ouvrir immédiatement

### Scripts de maintenance

#### Nettoyage des sauvegardes

```batch
scripts\clean-backups.bat
```
- Supprime les anciennes sauvegardes du dossier `Backups/`
- Garde seulement les plus récentes
- Libère l'espace disque

### Commandes npm alternatives

```bash
# Installation des dépendances
npm install

# Serveur avec live-reload (plus verbeux)
npm run dev

# Serveur sans navigateur
npm run serve

# Build standalone
npm run build

# Serveur propre sans live-reload
npm run dev-clean
```

## ✨ Fonctionnalités d'édition

### Mode développeur
- **Toggle dev mode** : Activation/désactivation de l'interface d'édition
- **Édition inline** : Clic sur les boutons ✏️ pour éditer directement
- **Validation automatique** : Sauvegarde automatique des modifications
- **Aperçu temps réel** : Visualisation immédiate des changements

### Gestion des données
- **Sorts** : Nom, description, prérequis, effets, images
- **Classes** : Statistiques, capacités, sous-classes avec double images
- **Dons** : Descriptions, prérequis, coûts
- **Pages statiques** : Création de personnage, règles, éléments

### Export et sauvegarde
- **Export ZIP** : Archive complète avec toutes les données modifiées
- **Import ZIP** : Restauration depuis archive
- **Persistance locale** : Sauvegarde automatique dans le navigateur
- **Version standalone** : Génération d'un fichier HTML autonome

## 🎨 Personnalisation

### Tailles d'images
- **Sorts** : 350×250px max avec cadre doré
- **Sous-classes** : 400×300px max par image (2 images collées)
- **Classes** : Taille adaptative selon le contexte
- **Object-fit: contain** : Respect des proportions sans déformation

### Thème et style
- **Palette** : Tons parchemin avec accents bronze/or
- **Typographie** : Cinzel pour les titres, Source Serif Pro pour le contenu
- **Icônes** : Unicode et emojis pour une compatibilité universelle
- **Responsive** : Adaptation automatique mobile/tablette/desktop

## 🔧 Configuration

### Variables d'environnement
Le projet détecte automatiquement le mode :
- **Développement** : Fichiers séparés avec serveur local
- **Standalone** : Version compilée avec données embarquées

### Personnalisation du thème
Modifier `css/theme.css` pour ajuster :
- Couleurs principales et secondaires
- Espacements et dimensions
- Ombres et effets visuels
- Points de rupture responsive

## 📊 Performance

### Optimisations
- **Chargement modulaire** : Code séparé par responsabilité
- **Cache intelligent** : Gestion optimisée des images et données
- **Minification** : Build optimisé pour la production
- **Lazy loading** : Chargement à la demande des composants lourds

### Compatibilité
- **Navigateurs modernes** : Chrome, Firefox, Safari, Edge
- **Responsive design** : Mobile, tablette, desktop
- **Hors ligne** : Version standalone fonctionnelle sans serveur
- **Import/Export** : Compatibilité avec les outils externes

## 🔄 Gestion de version avec Git

### Workflow Git recommandé

#### 1. 📋 Vérifier l'état du projet

```bash
# Voir les fichiers modifiés
git status

# Voir les différences détaillées
git diff
```

#### 2. 📦 Ajouter les modifications

```bash
# Ajouter tous les fichiers modifiés
git add .

# Ou ajouter des fichiers spécifiques
git add data/sorts.json css/components.css
```

#### 3. 💾 Créer un commit

```bash
# Commit avec message descriptif
git commit -m "Ajout de nouveaux sorts et amélioration des images"

# Ou commit plus détaillé
git commit -m "Système d'édition des sorts

- Correction de la persistance des modifications
- Ajout d'images pour les sorts de feu
- Amélioration de l'interface d'édition"
```

#### 4. 🚀 Pousser vers GitHub

```bash
# Première fois (si le repo n'est pas encore lié)
git remote add origin https://github.com/ben-128/BabJdr.git

# Pousser les changements
git push origin master

# Ou forcer le push si nécessaire
git push -f origin master
```

### 📋 Templates de messages de commit

**Pour des modifications de contenu :**
```
Mise à jour des sorts de [catégorie]

- Ajout de X nouveaux sorts
- Correction des descriptions de Y sorts
- Amélioration des images de Z sorts
```

**Pour des corrections techniques :**
```
Fix: problème de persistance des données

- Correction du système de sauvegarde des sorts
- Fix de l'export ZIP des modifications
- Amélioration de la gestion du cache localStorage
```

**Pour des améliorations visuelles :**
```
Interface: amélioration des images et du style

- Augmentation de la taille des images de sorts
- Ajout du système double-image pour les sous-classes
- Amélioration de la typographie des titres
```

### 🔧 Commandes Git utiles

```bash
# Voir l'historique des commits
git log --oneline

# Voir les dernières modifications d'un fichier
git log -p data/sorts.json

# Annuler le dernier commit (garde les modifications)
git reset --soft HEAD~1

# Revenir à un commit précédent
git checkout [hash-du-commit]

# Créer une nouvelle branche pour des tests
git checkout -b nouvelle-fonctionnalite

# Fusionner une branche
git checkout master
git merge nouvelle-fonctionnalite
```

### 📂 Fichiers à ignorer

Les fichiers suivants sont automatiquement ignorés (.gitignore) :
- `node_modules/` - Dépendances npm
- `build/` - Fichiers de build temporaires  
- `Backups/` - Sauvegardes automatiques
- `*.log` - Fichiers de logs
- Fichiers temporaires Windows

---

*Application JDR-BAB développée avec une architecture modulaire pour une expérience utilisateur optimale et une maintenance facilitée.*