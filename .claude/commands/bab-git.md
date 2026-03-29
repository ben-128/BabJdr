---
description: "Opérations Git pour le projet Foresia/BabJDR - commits, branches, push, merge direct dans master"
---

# Skill Git - Projet Foresia (BabJDR)

Tu es un assistant spécialisé dans les opérations Git du projet Foresia.

## Informations du dépôt

- **Remote** : `origin` → `https://github.com/ben-128/BabJdr.git`
- **Branche principale** : `master`
- **Répertoire** : `D:\projets\BabJDR\BabJDR`

## Conventions de commit

### Format des messages
- Ligne de sujet courte (< 72 caractères), style impératif
- Langue : français de préférence, anglais acceptable
- Inclure `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` quand Claude contribue

### Préfixes courants
- `Build vX.Y.Z:` pour les commits incluant un build
- `Fix` pour les corrections de bugs
- `Add` pour les nouvelles fonctionnalités
- `Update` pour les mises à jour de données ou composants
- `Remove` pour les suppressions

### Exemples de bons messages
```
Build v1.0.37: ajout filtre monstres et correction recherche

Fix sidebar version footer styling (remove grey bg, fix layout)

Add new Mage feats: canalisation incrémentale et incantation rapide
```

## Workflow typique

### Commit simple
```bash
cd "D:/projets/BabJDR/BabJDR"
git add [fichiers spécifiques]
git commit -m "$(cat <<'EOF'
Message de commit

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Workflow avec build
1. Faire les modifications de code/données
2. Tester avec `npm run dev`
3. Build : `npm run build` (incrémente la version)
4. Commit incluant le build :
```bash
git add [fichiers modifiés] build/Foresia.html config/sw.js index.html
git commit -m "Build vX.Y.Z: description des changements"
```
5. Push : `git push origin master`

### Merge dans master (pas de PR)
Ce projet n'utilise pas de Pull Requests. On merge directement dans master :
```bash
git checkout master
git merge [branche-feature]
git push origin master
```

## Fichiers à ne PAS committer

Selon `.gitignore` :
- `node_modules/`
- `Backups/`, `backup-*/`
- `*.tmp`, `*.temp`, `*.log`
- `.vscode/`, `.idea/`
- `data/imgbb-delete-urls.json`
- `Thumbs.db`, `.DS_Store`
- `tmpclaude-*`

## Fichiers souvent commités ensemble

- **Build** : `build/Foresia.html` + `config/sw.js` + `index.html` (cache busting)
- **Données RPG** : `data/*.json` + éventuellement `data/images/...`
- **UI** : `js/ui/*.js` + `css/*.css`
- **Features** : `js/features/*.js`

## Instructions

- Toujours vérifier `git status` et `git diff` avant de committer
- Préférer `git add` de fichiers spécifiques plutôt que `git add -A`
- Ne jamais committer de fichiers secrets ou de clés API
- Si le worktree est actif, les opérations git se font dans le contexte du worktree
- Pas de PR : toujours merger directement dans master et push
- Après un commit incluant un build, mentionner la version dans le message

$ARGUMENTS
