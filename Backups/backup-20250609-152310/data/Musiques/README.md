# 🎵 Dossier Musiques - Gestion des playlists

## 🔧 Mise à jour des playlists

Quand vous modifiez les fichiers/dossiers de musique, utilisez cet outil :

```bash
node update-playlists.js
```

**Puis :**
1. Copiez la structure générée
2. Collez-la dans `js/modules/audio.js` ligne ~60-68
3. Rechargez la page audio

## 📁 Structure actuelle

```
Musiques/
├── Auberge/          # 🍺 Ambiance d'auberge (4 musiques)
├── Creation/         # 🎭 Création de personnage (3 musiques)  
├── Foret/            # 🌲 Exploration forêt (3 musiques)
│   └── BossForet/    # 🐲 Boss de forêt (2 musiques)
├── Mine/             # ⛏️ Exploration mine (3 musiques)
│   └── BossMine/     # 💎 Boss de mine (2 musiques)
├── Voyage/           # 🚶 Voyage/Déplacement (2 musiques)
└── Autre/            # 🎼 Musiques diverses (16 musiques)
```

## ⚙️ Configuration

- **Shuffle activé** : Auberge, Voyage, Autre
- **Lecture séquentielle** : Foret, Mine, Boss
- **Sous-dossiers** : Créent automatiquement des playlists séparées