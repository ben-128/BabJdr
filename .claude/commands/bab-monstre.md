---
description: "Crée un monstre pour Foresia à partir d'une description vague, le formate proprement et l'ajoute dans monstres.json"
---

# Skill Création de Monstre Foresia

Tu es un assistant spécialisé dans la création de monstres pour le jeu de rôle Foresia.

## Répertoire du projet

`D:\projets\BabJDR\BabJDR`

## Entrée utilisateur

$ARGUMENTS

## Fichier de données

Le fichier des monstres est `data/monstres.json`. C'est un tableau JSON direct (pas d'objet racine).

## Structure d'un monstre

```json
{
  "nom": "Nom du monstre",
  "tags": ["Forêt", "Boss"],
  "niveau": 2,
  "image": "data/images/Monstres/foret/NomFichier.png",
  "element": "Terre",
  "pointsDeVie": 20,
  "armurePhysique": 2,
  "esquive": 1,
  "initiative": 10,
  "coupCritique": 1,
  "coupCritiqueSorts": 0,
  "resistanceAlterations": 0,
  "armureFeu": 0,
  "armureEau": 0,
  "armureTerre": 3,
  "armureAir": 0,
  "armureLumiere": 0,
  "armureObscurite": 0,
  "armureDivin": 0,
  "armureMalefique": 0,
  "abilites": "<strong>Attaque:</strong> Inflige 5 dégâts physiques.",
  "butin": "<strong>Butin:</strong> <span class=\"treasure-table-link\" data-table-name=\"Nom du monstre\" style=\"color: var(--accent); cursor: pointer; text-decoration: underline;\" title=\"Cliquer pour voir la table des trésors\">[Table: Nom du monstre]</span>"
}
```

### Champ `nom`
- Nom unique en français, style JDR héroïque-fantasy

### Champ `niveau`
- Nombre entier de 1 à 20 indiquant la puissance du monstre
- Sert à calibrer les stats et à indiquer aux MJ pour quel tier le monstre est adapté
- Les monstres actuels (forêt) sont de niveau 1–3 (Boss Forêt = niveau 3)

### Champ `tags`
- Tableau, au moins un tag d'environnement :
  - `"Forêt"`, `"Grotte"`, `"Désert"`, `"Montagne"`, `"Ville"`, `"Donjon"`, `"Marais"`, `"Mer"`
- Tags modificateurs optionnels :
  - `"Boss"` — monstre boss avec beaucoup de PV et capacités spéciales
  - `"Élite"` — version renforcée d'un monstre normal
  - `"Invocable"` — peut être invoqué par un autre monstre

### Champ `image`
- Chemin direct vers l'image (pas via images.json)
- Format : `"data/images/Monstres/{sous-dossier}/{NomFichier}.png"`
- Sous-dossiers existants : `foret/`, (d'autres peuvent être créés selon l'environnement)
- Convention de nommage : `Monstre_{Environnement}_{NomSansAccent}.png`
- Si l'utilisateur mentionne un fichier image, l'utiliser. Sinon, proposer un nom logique.

### Champ `element`
- L'élément principal du monstre (influe sur ses armures élémentaires)
- Valeurs : `"Feu"`, `"Eau"`, `"Terre"`, `"Air"`, `"Lumière"`, `"Nuit"`, `"Divin"`, `"Maléfique"`

### Champs de stats

| Stat | Description | Typique |
|------|-------------|---------|
| `pointsDeVie` | PV totaux | 10–100 selon niveau |
| `armurePhysique` | Réduction dégâts physiques | 0–10 |
| `esquive` | Bonus d'esquive | 0–7 |
| `initiative` | Ordre de jeu | 7–16 |
| `coupCritique` | Bonus coup critique physique | 0–4 |
| `coupCritiqueSorts` | Bonus coup critique magique | 0–3 |
| `resistanceAlterations` | Résistance aux altérations d'état | 0–5 |

### Champs armures élémentaires
- `armureFeu`, `armureEau`, `armureTerre`, `armureAir`, `armureLumiere`, `armureObscurite`, `armureDivin`, `armureMalefique`
- Valeurs : 0–10 (0 = aucune résistance, 5 = forte résistance, 10 = immunité quasi-totale)
- L'élément principal du monstre a généralement une armure de 3–8
- Les éléments opposés peuvent avoir une armure négative (faiblesse), mais rarement dans ce jeu

### Champ `abilites`
- HTML formaté décrivant toutes les capacités du monstre
- Chaque capacité est en `<strong>Nom:</strong> description`
- Retours à la ligne entre capacités : `<br>`
- Double saut de ligne entre groupes : `<br><br>`

**Liens utilisables dans abilites :**

États (couleur orange fixe) :
```html
<span class="etat-link" data-etat="NomÉtat" style="color: #ea7332; cursor: pointer; text-decoration: underline;">NomÉtat</span>
```

Sorts :
```html
<span class="spell-link" data-spell="NomSort" data-category="Sorts de Mage" style="color: var(--accent); cursor: pointer; text-decoration: underline;">NomSort</span>
```
Catégories de sorts : `"Sorts de Mage"`, `"Sorts d'Enchanteur"`, `"Sorts de Monstres"`, `"Sorts de Prêtre"`

Autres monstres :
```html
<span class="monster-link" data-monster="NomMonstre" style="color: var(--accent); cursor: pointer; text-decoration: underline;">NomMonstre</span>
```

**Couleurs élémentaires dans abilites :**
- Feu : `<span style="color: #ff6b35; font-weight: bold;">Feu</span>`
- Eau : `<span style="color: #3b82f6; font-weight: bold;">Eau</span>`
- Terre : `<span style="color: #8b4513; font-weight: bold;">Terre</span>`
- Air : `<span style="color: #22c55e; font-weight: bold;">Air</span>`
- Lumière : `<span style="color: #ffd700; font-weight: bold;">Lumière</span>`
- Nuit : `<span style="color: #7c3aed; font-weight: bold;">Nuit</span>`
- Divin : `<span style="color: #ffd700; font-weight: bold;">Divin</span>`
- Maléfique : `<span style="color: #dc2626; font-weight: bold;">Maléfique</span>`

**États courants :** `Empoisonné`, `Affaibli`, `Ralenti`, `Entravé/Entoilé/Embourbé`, `À terre`, `Aveuglé`, `Brûlé`, `Gelé`, `Étourdi`

### Champ `butin`
Toujours ce format avec le nom exact du monstre :
```html
<strong>Butin:</strong> <span class="treasure-table-link" data-table-name="Nom du monstre" style="color: var(--accent); cursor: pointer; text-decoration: underline;" title="Cliquer pour voir la table des trésors">[Table: Nom du monstre]</span>
```
Si aucune table n'est prévue, mettre `""` (vide).

## Équilibrage de référence par niveau (1–20)

Le `niveau` est un entier de 1 à 20. Les Boss d'un niveau donné ont environ 3× les PV d'un monstre normal du même niveau et plusieurs capacités spéciales.

| Niveau | PV (normal) | Armure phys. | Esquive | Initiative | Coup critique | Résist. alt. | Dégâts/attaque | Armure élément |
|--------|------------|--------------|---------|------------|---------------|--------------|----------------|----------------|
| 1      | 10–15      | 0–1          | 0–2     | 7–12       | 0–2           | 0            | 3–5            | 2–5            |
| 2      | 15–25      | 1–3          | 0–3     | 8–13       | 1–2           | 0–1          | 4–6            | 3–6            |
| 3      | 25–40      | 2–4          | 0–3     | 9–13       | 1–3           | 0–1          | 5–8            | 4–7            |
| 4      | 35–55      | 3–5          | 1–3     | 9–14       | 1–3           | 1–2          | 6–9            | 4–8            |
| 5      | 50–70      | 4–6          | 1–4     | 10–14      | 2–3           | 1–2          | 7–11           | 5–8            |
| 6      | 65–90      | 5–7          | 1–4     | 10–15      | 2–4           | 1–3          | 8–13           | 5–9            |
| 7      | 80–110     | 5–8          | 1–5     | 10–15      | 2–4           | 2–3          | 10–15          | 6–10           |
| 8      | 100–130    | 6–9          | 2–5     | 11–15      | 2–4           | 2–3          | 11–17          | 6–11           |
| 9      | 120–160    | 7–10         | 2–5     | 11–16      | 3–5           | 2–4          | 13–19          | 7–12           |
| 10     | 150–200    | 8–11         | 2–6     | 11–16      | 3–5           | 3–4          | 15–22          | 8–13           |
| 11–12  | 180–250    | 9–12         | 2–6     | 12–16      | 3–5           | 3–5          | 17–25          | 9–14           |
| 13–14  | 220–300    | 10–14        | 3–7     | 12–17      | 4–6           | 3–5          | 20–30          | 10–15          |
| 15–16  | 280–380    | 12–16        | 3–7     | 13–17      | 4–6           | 4–6          | 24–35          | 11–17          |
| 17–18  | 350–470    | 14–18        | 3–8     | 13–18      | 5–7           | 4–6          | 28–42          | 12–18          |
| 19–20  | 450–600    | 16–22        | 4–9     | 14–18      | 5–8           | 5–7          | 33–50          | 13–20          |

**Boss d'un niveau donné :** PV × 2,5–3 | Résistance altérations +2 | 4–6 capacités variées (AoE, invocation, buff/debuff) | Plusieurs armures élémentaires élevées

## Workflow

### Étape 1 : Analyser la demande

À partir de `$ARGUMENTS`, détermine :
1. **Le nom** du monstre
2. **L'environnement** (tag) : Forêt, Grotte, Ville, etc.
3. **Le niveau** (1–20) : demander à l'utilisateur si non précisé
4. **Boss ?** : si oui, ajouter le tag `"Boss"` et multiplier les PV
5. **L'élément** principal
6. **Les capacités** : combien, quel type (physique, élémentaire, altération, invocation, AoE) ?
7. **L'image** : si l'utilisateur mentionne un fichier image

### Étape 2 : Lire le fichier actuel

Lis `data/monstres.json` pour :
- Vérifier qu'un monstre similaire n'existe pas déjà
- S'inspirer des monstres existants de même environnement/niveau
- Calibrer les stats en comparaison

### Étape 3 : Rédiger le monstre

Propose le monstre complet avec stats équilibrées et capacités cohérentes.
Présente le monstre à l'utilisateur pour validation avant d'insérer.

### Étape 4 : Insérer dans monstres.json

Une fois validé :
1. Lis le fichier `data/monstres.json`
2. Ajoute le monstre à la fin du tableau
3. Écris le fichier modifié

### Étape 5 : Image (OBLIGATOIRE)

L'image est référencée directement dans le champ `image` du monstre (**pas** via images.json).

- Si l'utilisateur a déjà une image : vérifier que le fichier existe à l'emplacement indiqué
- Si une image doit être générée : utiliser `/bab-genimage` avec un prompt décrivant le monstre (style heroic fantasy, format 1:1), puis placer le fichier dans `data/images/Monstres/{environnement}/`
- Convention de nommage : `Monstre_{Environnement}_{NomSansAccent}.png`

### Étape 6 : Table de loot (recommandé)

Si le monstre a un champ `butin` avec un lien de table, suggérer à l'utilisateur de créer la table correspondante avec `/bab-table-loot`.

## Notes importantes

- TOUJOURS lire `monstres.json` avant de modifier pour avoir la version à jour
- TOUJOURS montrer le monstre formaté à l'utilisateur et attendre sa validation avant d'écrire
- Les monstres N'ont PAS d'entrée dans `images.json` — le chemin est directement dans le champ `image`
- Garder un équilibre cohérent avec les monstres existants de même environnement
- Les Boss ont toujours plusieurs capacités variées (attaque, AoE, debuff, éventuellement invocation)
- Si le monstre n'a pas de table de loot, mettre `"butin": ""`
