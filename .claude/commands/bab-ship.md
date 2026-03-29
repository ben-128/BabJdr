---
description: "Ship : build + commit + push en une commande"
---

Exécute le workflow complet de publication du projet Foresia :

1. **Build** avec incrémentation de version (`npm run build`)
2. **Commit** de tous les changements avec message `Build vX.Y.Z: <description>`
3. **Push** vers `origin master`

Si `$ARGUMENTS` contient du texte, l'utiliser comme description du commit.
Sinon, analyser le diff pour générer une description concise.

Utilise le skill `/bab-build` pour exécuter la section "Ship : build + commit + push en une commande".

$ARGUMENTS
