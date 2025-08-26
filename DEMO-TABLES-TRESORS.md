# 💎 Démonstration des Tables de Trésors - BabJDR

## 🎯 Fonctionnalités implémentées

### ✅ Fonctionnalités de base
- **Page Tables de Trésors** visible uniquement en mode MJ
- **Affichage des tables** avec fourchettes et objets liés
- **Système de tags et filtres** similaire aux monstres
- **Mode développement automatique** (non-standalone uniquement)

### ✅ Édition avancée
- **Édition des fourchettes** avec modal dédié
- **Ajout/suppression de fourchettes** individuelles
- **Preview d'objets** sans quitter la page
- **Liens intelligents** vers les objets référencés

## 🚀 Comment tester

### Mode Développement
1. Lancer le serveur de développement: `npm run dev`
2. Ouvrir `http://localhost:3000` dans le navigateur  
3. Le mode MJ s'active automatiquement (vérifier dans la console les logs 🛠️)
4. Naviguer vers "🎭 Maître de jeu > 💎 Tables de trésors"

### Mode Standalone  
1. Builder la version standalone: `npm run build`
2. Ouvrir `build/JdrBab.html`
3. Activer manuellement le mode MJ avec le bouton "🛠 Dev Mode"
4. Naviguer vers "🎭 Maître de jeu > 💎 Tables de trésors"

### Fichier de test
1. Ouvrir `test-tables-tresors.html` dans le navigateur
2. Vérifier les informations de debug (mode, données chargées, etc.)
3. La page de test affiche directement les tables de trésors

### 🔍 Débogage
**Console du navigateur**: Les logs suivants confirment le bon fonctionnement

**Mode développement** (`npm run dev`):
- `🔍 Mode detection: Standalone = false`
- `🛠️ Development mode detected: Auto-enabling MJ mode`  
- `🎭 Activating MJ mode...`
- `🎭 MJ mode UI updated`
- `✅ MJ mode activated successfully`
- `📊 TablesTresorsManager initialized`

**Mode standalone** (`build/JdrBab.html`):
- `🔍 Mode detection: Standalone = true`
- `📱 Standalone mode detected: MJ mode requires manual activation`

**Note importante**: Le **mode MJ** (visibilité des sections MJ) est différent du **dev mode** (mode édition). En développement, seul le mode MJ s'active automatiquement.

## 🎮 Interactions disponibles

### 🔍 Navigation et filtres
- **Filtres par tags**: Cliquer sur les chips pour activer/désactiver
- **Filtres OR**: Une table doit avoir AU MOINS UN des tags visibles pour s'afficher
- **Compteur de résultats**: Affiche combien de tables correspondent aux filtres
- **Bouton de gestion des tags**: Accessible en mode développement pour gérer les tags disponibles

### ✏️ Édition (mode développement uniquement)
- **Ajouter une table**: Bouton "➕ Ajouter une table de trésor"
- **Gérer les tags**: Bouton "🏷️ Gérer les tags" pour ajouter/supprimer des tags de filtre
- **Éditer le nom/description**: Double-clic sur les éléments éditables
- **Éditer les tags**: Cliquer sur la zone des tags
- **Ajouter une fourchette**: Bouton "➕ Ajouter fourchette" sur chaque table
- **Éditer une fourchette**: Bouton "✏️" sur chaque fourchette  
- **Supprimer une fourchette**: Bouton "🗑️" sur chaque fourchette

### 👁️ Prévisualisation d'objets
- **Preview instantané**: Cliquer sur n'importe quel lien d'objet (📦)
- **Détails complets**: Tags, description, effet, prix, poids
- **Navigation**: Bouton "🔗 Aller à la page objets" depuis la preview

### 🎲 Modal d'édition des fourchettes
- **Fourchettes 1-20**: Validation automatique min ≤ max  
- **Sélection d'objet**: Liste déroulante de tous les objets
- **Preview dans le modal**: Bouton "👁️ Aperçu de l'objet sélectionné"
- **Validation**: Empêche les fourchettes invalides

## 📊 Structure des données

### Format JSON des tables
```json
{
  "tables": [
    {
      "nom": "Nom de la table",
      "description": "Description de la table",
      "tags": ["Tag1", "Tag2", "Tag3"],
      "fourchettes": [
        {
          "min": 1,
          "max": 5,
          "objet": {
            "type": "reference",
            "numero": 1,
            "nom": "Nom de l'objet"
          }
        }
      ]
    }
  ]
}
```

### Tags disponibles par défaut
- **Rareté**: Faible, Commun, Rare, Épique, Légendaire
- **Type d'ennemi**: Boss, Humanoïde, Bête, Dragon, Mort-vivant, Élémentaire

### Configuration des filtres
- **Mode**: OR (au moins un tag visible requis) 
- **Tags visibles par défaut**: Commun
- **Extensible**: Nouveaux tags ajoutables via le bouton "🏷️ Gérer les tags"
- **Différence avec monstres**: Les monstres utilisent le mode AND, les tables de trésors le mode OR

## 🔧 Architecture technique

### Modules impliqués
- `js/config/contentTypes.js` - Configuration du type tableTresor
- `js/builders/CardBuilder.js` - Rendu des cartes de tables
- `js/builders/PageBuilder.js` - Génération de la page avec filtres
- `js/features/TablesTresorsManager.js` - Gestion des interactions avancées
- `js/router.js` - Routage vers tables-tresors
- `js/renderer.js` - Intégration dans le système de rendu
- `js/factories/ContentFactory.js` - Gestion des données

### Intégration système
- **ContentFactory**: Accès unifié via `ContentFactory.getTablesTresors()`
- **EventBus**: Communication décentralisée entre modules  
- **Storage**: Persistance automatique des modifications
- **Router**: Navigation intégrée au système existant

## 📱 Compatibilité

### ✅ Fonctionnalités disponibles
- **Mode développement**: Toutes les fonctionnalités d'édition
- **Mode standalone**: Consultation et navigation uniquement
- **Mobile/Tablette**: Interface responsive adaptée
- **Filtres**: Fonctionnent sur tous les appareils

### 🎯 Mode MJ
- **Développement**: Activation automatique au démarrage
- **Standalone**: Activation manuelle requise
- **Persistance**: Les préférences du mode MJ sont sauvegardées

## 🚀 Prochaines améliorations possibles

### Fonctionnalités avancées
- **Génération automatique**: Bouton "🎲 Lancer les dés" sur chaque table
- **Historique des lancers**: Garder trace des objets générés
- **Tables dynamiques**: Fourchettes qui changent selon le niveau du groupe
- **Export PDF**: Impression des tables pour usage hors ligne

### Interface utilisateur
- **Drag & drop**: Réorganisation des fourchettes par glisser-déposer
- **Import/Export**: Partage de tables entre MJ
- **Templates**: Tables prédéfinies par type d'ennemi
- **Recherche**: Recherche textuelle dans les tables et objets

La fonctionnalité est maintenant complète et prête à l'usage ! 🎉