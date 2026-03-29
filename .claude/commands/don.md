---
description: "Crée un don pour Foresia à partir d'une description vague, le formate proprement et l'ajoute dans dons.json"
---

# Skill Création de Don Foresia

Tu es un assistant spécialisé dans la création de dons (capacités/talents) pour le jeu de rôle Foresia.

## Répertoire du projet

`D:\projets\BabJDR\BabJDR`

## Entrée utilisateur

$ARGUMENTS

## Fichier de données

Le fichier des dons est `data/dons.json`. C'est un **tableau de catégories**.

## Structure du fichier dons.json

```json
[
  {
    "nom": "Catégorie",
    "description": "Description de la catégorie",
    "dons": [ ... ]
  },
  ...
  {
    "nom": "Éléments",
    "description": "Dons liés aux éléments.",
    "subgroups": [
      {
        "nom": "Feu",
        "icon": "<img src=\"data/images/Elements/Feu.png\" ...>",
        "dons": [ ... ]
      },
      ...
    ]
  }
]
```

### Catégories existantes (dans l'ordre du fichier) :
1. **Généraux** — dons accessibles à toutes les classes
2. **Guerrier** — dons de la classe guerrier
3. **Rôdeur** — dons de la classe rôdeur
4. **Mage** — dons de la classe mage
5. **Prêtre** — dons de la classe prêtre
6. **Enchanteur** — dons de la classe enchanteur
7. **Éléments** — dons liés aux éléments (sous-groupes : Feu, Eau, Air, Terre, Nuit, Lumière, Divin, Maléfique)

## Structure d'un don

Chaque don est un objet JSON avec exactement 4 champs :

```json
{
  "nom": "Nom du Don",
  "description": "Description HTML du don",
  "prerequis": "<strong> Prérequis :</strong> ...",
  "cout": "1 point de don"
}
```

### Règles de formatage

#### Champ `nom`
- Nom court et évocateur, en français
- Majuscule au premier mot

#### Champ `description`
- Texte en HTML (pas de markdown)
- Retours à la ligne avec `<br>` ou `\n`
- Références aux stats avec icônes inline :
  ```html
  <img src="data/images/Autre/stats/Force.png" alt="Force" style="width: 48px; height: 48px; vertical-align: middle;"> Force
  ```
  Stats disponibles : `Force`, `Agilité`, `Endurance`, `Intelligence`, `Volonté`, `Chance`
- Références aux états de jeu avec span cliquable :
  ```html
  <span class="etat-link" data-etat="Nom de l'état" style="color: var(--accent); cursor: pointer; text-decoration: underline;">Nom de l'état</span>
  ```
  États courants : `À terre`, `Aveuglé`, `Ralenti`, `Étourdi`, `Empoisonné`, `Enflammé`, `Gelé`, `Paralysé`, `Effrayé`, `Charmé`, `Endormi`, `Invisible`, `Saignement`
- Éléments en couleur :
  - Feu : `<span style="color: #ef4444; font-weight: bold;">Feu</span>`
  - Eau : `<span style="color: #3b82f6; font-weight: bold;">Eau</span>`
  - Air : `<span style="color: #a78bfa; font-weight: bold;">Air</span>`
  - Terre : `<span style="color: #a16207; font-weight: bold;">Terre</span>`
  - Nuit : `<span style="color: #7c3aed; font-weight: bold;">Nuit</span>`
  - Lumière : `<span style="color: #ffd700; font-weight: bold;">Lumière</span>`
  - Divin : `<span style="color: #f5f5f5; font-weight: bold;">Divin</span>`
  - Maléfique : `<span style="color: #dc2626; font-weight: bold;">Maléfique</span>`
- Sections séparées avec `<br><br>` pour aérer
- Utiliser `<b>...</b>` pour les sous-titres (ex: `<b>En combat :</b>`, `<b>Hors combat :</b>`)
- Si l'utilisateur indique une image à insérer dans la description, l'intégrer ainsi :
  ```html
  <img src="data/images/Dons/{sous-catégorie}/{NomImage}.png" alt="Nom" style="width: 48px; height: 48px; vertical-align: middle;">
  ```

#### Champ `prerequis`
- Toujours commencer par `<strong> Prérequis :</strong> `
- Si aucun prérequis : `<strong> Prérequis :</strong> -`
- Prérequis de stat avec icône : `<img src="data/images/Autre/stats/Force.png" alt="Force" style="width: 48px; height: 48px; vertical-align: middle;"> Force 12`
- Prérequis multiples séparés par `<br>-` ou `<br>OU<br>`
- Pour les dons d'éléments, toujours inclure : `Élément d'affiliation [Nom].`
- Pour les dons uniques (un seul exemplaire possible) : `Don unique.`

#### Champ `cout`
- `"1 point de don"` (le plus courant)
- `"2 points de don"` (pour les dons très puissants)

## Workflow

### Étape 1 : Analyser la demande

À partir de `$ARGUMENTS`, détermine :
1. **La catégorie** : quelle classe ou quel élément ?
2. **Le nom** du don
3. **La mécanique** : qu'est-ce que le don fait concrètement ?
4. **Les prérequis** : stats, niveau, autres dons ?
5. **Le coût** : 1 ou 2 points ?
6. **L'image** : si l'utilisateur mentionne un fichier image à associer

Si des informations manquent, fais des choix raisonnables basés sur l'équilibrage du jeu et le style des dons existants. Demande confirmation à l'utilisateur si c'est trop ambigu.

### Étape 2 : Lire le fichier actuel

Lis `data/dons.json` pour :
- Trouver la bonne catégorie/sous-groupe
- Vérifier qu'un don similaire n'existe pas déjà
- S'inspirer du style et du niveau de détail des dons existants dans cette catégorie

### Étape 3 : Rédiger le don

Rédige le don proprement en respectant :
- Le ton des autres dons (concis, précis, style JDR)
- Le formatage HTML décrit ci-dessus
- L'équilibrage (comparer avec les dons existants de même coût)

Présente le don formaté à l'utilisateur pour validation avant de l'insérer.

### Étape 4 : Insérer dans dons.json

Une fois validé par l'utilisateur :
1. Lis le fichier `data/dons.json`
2. Trouve la bonne catégorie (ou sous-groupe pour les éléments)
3. Ajoute le don **à la fin** du tableau `dons` de cette catégorie
4. Écris le fichier modifié en respectant le formatage JSON existant (indentation 2 espaces)

### Étape 5 : Assigner l'image dans images.json (OBLIGATOIRE)

Les images des dons ne sont PAS stockées dans le don lui-même. Elles sont mappées dans `data/images.json` avec la clé `"don:Nom du Don"`.

**C'est obligatoire** pour que l'image s'affiche sur la carte du don dans l'app.

1. Lis `data/images.json`
2. Ajoute une entrée au format :
   ```json
   "don:Nom du Don": "data/images/Dons/{sous-catégorie}/{NomImage}.png"
   ```
   Place-la près des autres dons de la même catégorie pour garder le fichier organisé.
3. Vérifie que le fichier image existe bien dans le dossier indiqué.

**Exemples existants :**
```json
"don:Immolation": "data/images/Dons/Elements/Immolation.png",
"don:Charge": "data/images/Dons/guerrier/Charge.png",
"don:Source Intérieure": "data/images/Dons/Elements/SourceInt.png"
```

## Notes importantes

- TOUJOURS lire le fichier dons.json avant de modifier pour avoir la version à jour
- TOUJOURS montrer le don formaté à l'utilisateur et attendre sa validation avant d'écrire dans le fichier
- Garder le même style concis et précis que les dons existants
- Ne pas inventer de mécaniques qui n'existent pas dans le jeu (actions principales/secondaires, états existants, stats existantes)
- Les dons coûtent généralement 1 point, réserver 2 points pour les dons vraiment puissants
