---
description: "Build et outils du projet Foresia - standalone HTML, serveur dev, gestion des versions, génération d'icônes"
---

# Skill Build & Outils Foresia

Tu es un assistant spécialisé dans le build et les outils du projet Foresia (BabJDR).

## Répertoire du projet

Le projet se trouve dans `D:\projets\BabJDR\BabJDR`. Toutes les commandes doivent être exécutées depuis ce répertoire racine.

## Commandes disponibles

### Build standalone (Foresia.html)

Le build crée un fichier HTML unique (`build/Foresia.html`) qui embarque tout : 24 modules JS, 8 fichiers CSS, 25 fichiers JSON de données, le service worker PWA, et le favicon en base64.

**Build avec incrémentation de version** (par défaut) :
```bash
cd "D:/projets/BabJDR/BabJDR" && node scripts/build-simple.js
```
Ou via npm :
```bash
cd "D:/projets/BabJDR/BabJDR" && npm run build
```

**Build sans incrémentation** (pour tests) :
```bash
cd "D:/projets/BabJDR/BabJDR" && node scripts/build-simple.js --no-version-bump
```

### Serveur de développement

```bash
cd "D:/projets/BabJDR/BabJDR" && npm run dev
```
Lance live-server sur le port 3000 avec live-reload.

```bash
cd "D:/projets/BabJDR/BabJDR" && npm run serve
```
Lance le serveur sans ouvrir le navigateur.

### Génération d'icônes

**Icônes monstres** (1cm × 2cm, PDF) :
```bash
cd "D:/projets/BabJDR/BabJDR" && node scripts/monster-icons/generate-icons.js
```

**Icônes NPC** (1.5cm × 3cm, PDF) :
```bash
cd "D:/projets/BabJDR/BabJDR" && node scripts/npc-icons/generate-icons.js
```

**Icônes PNG PWA** :
```bash
cd "D:/projets/BabJDR/BabJDR" && npm run icons-png
```

## Système de versions

- La version est stockée dans `config/sw.js` dans les constantes `CACHE_NAME`, `STATIC_CACHE_NAME`, `RUNTIME_CACHE_NAME`
- Format : `jdr-bab-vX.Y.Z` (actuellement v1.0.36+)
- Le build incrémente automatiquement le patch (Z+1)
- Le cache busting utilise un hash timestamp séparé dans `index.html`

## Fichiers clés du build

| Fichier | Rôle |
|---------|------|
| `scripts/build-simple.js` | Script de build principal (27 KB) |
| `scripts/build.bat` | Wrapper Windows avec UI |
| `config/sw.js` | Service worker avec version |
| `build/Foresia.html` | Sortie du build (500-800 KB) |
| `index.html` | Point d'entrée dev (modulaire) |

## Ordre de chargement des modules JS (critique)

1. `js/core.js` (JdrApp namespace - DOIT être premier)
2. `js/config/constants.js`, `js/config/contentTypes.js`
3. `js/core/EventBus.js`, `js/core/BaseEntity.js`
4. Factories et Builders
5. Utils, storage, modules
6. Features (SpellFilter, TablesTresors, Favoris, etc.)
7. Router, renderer, editor
8. UI modules puis `js/ui.js`

## Import d'archives

```bash
cd "D:/projets/BabJDR/BabJDR" && scripts/import-archive.bat
```
Importe un `JdrBab-*.zip` depuis Downloads, avec backup automatique.

## Nettoyage des backups

```bash
cd "D:/projets/BabJDR/BabJDR" && scripts/clean-backups.bat
```

### Ship : build + commit + push en une commande

Raccourci : **`/ship`**

Quand l'utilisateur lance `/ship` (ou demande "ship", "build commit push", "publie") :

1. **Build** avec incrémentation de version :
   ```bash
   cd "D:/projets/BabJDR/BabJDR" && npm run build
   ```
2. **Vérifier** que le build a réussi (exit code 0, fichier `build/Foresia.html` existe)
3. **Récupérer la nouvelle version** depuis la sortie du build ou depuis `config/sw.js`
4. **Git add** des fichiers modifiés + fichiers de build :
   ```bash
   git add -A
   ```
5. **Commit** avec un message au format `Build vX.Y.Z: <description>` :
   - Si `$ARGUMENTS` contient une description, l'utiliser
   - Sinon, analyser le `git diff --cached` pour générer une description concise des changements
   ```bash
   git commit -m "$(cat <<'EOF'
   Build vX.Y.Z: description des changements

   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```
6. **Push** vers origin master :
   ```bash
   git push origin master
   ```
7. **Résumer** : version, taille du build, nombre de fichiers commités

Si une étape échoue, s'arrêter et reporter l'erreur sans continuer les étapes suivantes.

## Instructions

- Quand l'utilisateur demande un "build" ou "standalone", faire un build avec incrémentation par défaut
- Quand il demande un "build test" ou "build sans version", utiliser `--no-version-bump`
- Après un build réussi, mentionner la nouvelle version et la taille du fichier
- Si le build échoue, lire le script `scripts/build-simple.js` pour diagnostiquer
- Ne jamais modifier l'ordre de chargement des modules sans comprendre les dépendances

$ARGUMENTS
