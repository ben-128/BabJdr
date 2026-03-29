---
description: "Génère une image via ChatGPT dans le navigateur, style heroic fantasy, et la place dans le bon dossier data/images"
---

# Skill Génération d'Image Foresia

Tu es un assistant qui génère des images pour le projet Foresia via ChatGPT dans le navigateur Chrome.

## Répertoire du projet

`D:\projets\BabJDR\BabJDR`

## Entrée utilisateur

$ARGUMENTS

## Workflow

### Étape 1 : Analyser la demande

À partir de `$ARGUMENTS`, détermine :

1. **Le type d'asset** parmi les catégories suivantes :
   - `classe` → `data/images/Classes/`
   - `don` → `data/images/Dons/{sous-catégorie}/` (sous-catégories : `Elements`, `Enchanteur`, `Generaux`, `guerrier`, `mage`, `pretre`, `rodeur`)
   - `sort` → `data/images/Sorts/{sous-catégorie}/` (sous-catégories : `Enchanteur`, `Mage`, `Monstre`, `Pretre`)
   - `npc` → `data/images/NPC/`
   - `monstre` → `data/images/Monstres/` ou `data/images/Monstres/foret/` selon la région
   - `objet` → `data/images/Objets/{sous-catégorie}/` (sous-catégories : `Accessoires`, `Armes`, `Armures`, `Bouclier`, `Consumables/*`, `Other/*`)
   - `element` → `data/images/Elements/`
   - `dieu` → `data/images/Autre/Dieux/`
   - `campagne` → `data/images/Campagne/{lieu}/`
   - `icone` → `data/images/Autre/Iconeheros/` ou `data/images/Autre/stats/`
   - `illustration` → `data/images/Autre/Illustrations/`

2. **Le nom du fichier** en respectant les conventions :
   - Classes : PascalCase, ex: `Guerrier.png`, `ChasseurF.png` (F pour féminin)
   - Dons : PascalCase, ex: `Charge.png`, `AgiliteGuerrier.png`
   - Sorts : PascalCase, ex: `BouleDeFeu.png`, `Eclair.png`
   - NPC : Nom complet avec espaces, ex: `Kael Fenraven.png`
   - Monstres : `Monstre_Région_Nom.png`, ex: `Monstre_Forêt_Araignée.png`
   - Objets/Armes : PascalCase, ex: `Arc1.png`, `EpeeLongue1.png`
   - Objets/Armures : `Armure[Type][Num].png`, ex: `ArmureCuir1.png`
   - Dieux : `Dieu-Element-Nom.jpg`
   - Autres : PascalCase

3. **La description visuelle** pour le prompt ChatGPT.

Si la catégorie ou sous-catégorie n'est pas claire, demande à l'utilisateur de préciser.

### Étape 2 : Générer l'image via ChatGPT

1. Utilise les outils `mcp__Claude_in_Chrome__*` (navigateur Chrome) pour interagir avec ChatGPT.
2. Récupère le contexte des onglets avec `tabs_context_mcp` (avec `createIfEmpty: true`).
3. Crée un nouvel onglet avec `tabs_create_mcp`, puis navigue vers `https://chatgpt.com`.
4. Attends que la page charge (screenshot pour vérifier).
5. Trouve la zone de saisie de message et tape le prompt suivant :

```
Generate a single image in exactly 1:1 square format (1024x1024). Style: heroic fantasy, detailed digital painting, rich colors, dramatic lighting. Subject: [DESCRIPTION VISUELLE]. The image should be on a transparent or clean background suitable for use as a game asset/icon. No text, no watermark, no frame, no border.
```

6. Envoie le message (touche Entrée ou bouton d'envoi).
7. Attends que l'image soit générée (vérifie périodiquement avec des screenshots, attends jusqu'à 60 secondes).
8. Une fois l'image visible, fais un clic droit dessus pour ouvrir le menu contextuel, puis clique sur "Save image as..." / "Enregistrer l'image sous...".
9. Gère le dialogue de sauvegarde :
   - Le nom du fichier doit correspondre à ce qui a été déterminé à l'étape 1
   - Le dossier de destination doit être le chemin complet déterminé à l'étape 1

**Alternative si le clic droit ne fonctionne pas :**
- Clique sur l'image pour l'ouvrir en grand
- Utilise le bouton de téléchargement de ChatGPT s'il existe
- Ou utilise JavaScript pour récupérer l'URL de l'image et la télécharger

### Étape 3 : Vérifier et finaliser

1. Vérifie que le fichier a bien été téléchargé dans le bon dossier.
2. Si le fichier est au mauvais endroit ou mal nommé, utilise Bash pour le déplacer/renommer :
   ```bash
   mv "source" "D:/projets/BabJDR/BabJDR/data/images/{catégorie}/{nom}.png"
   ```
3. Si le fichier est en `.webp` ou autre format, convertis-le en `.png` si nécessaire (les assets du projet utilisent majoritairement `.png`).
4. Confirme à l'utilisateur le résultat avec :
   - Le chemin final du fichier
   - Un résumé de ce qui a été généré

### Étape 4 : Nettoyage

- Ferme l'onglet ChatGPT créé avec `tabs_close_mcp`.

## Notes importantes

- Le format doit TOUJOURS être 1:1 (carré) pour être cohérent avec les autres assets du jeu.
- Le style doit TOUJOURS être heroic fantasy / digital painting.
- Les images doivent idéalement avoir un fond neutre/transparent pour une bonne intégration dans le jeu.
- Format de fichier : `.png` de préférence (94.8% des assets existants), `.jpg` uniquement pour les illustrations/scènes de campagne et les dieux.
- Demande confirmation à l'utilisateur avant de télécharger l'image (obligation de sécurité).
