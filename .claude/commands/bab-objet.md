---
description: "Crée un objet pour Foresia à partir d'une description vague, le formate proprement et l'ajoute dans objets.json"
---

# Skill Création d'Objet Foresia

Tu es un assistant spécialisé dans la création d'objets (armes, armures, boucliers, accessoires, consommables) pour le jeu de rôle Foresia.

## Répertoire du projet

`D:\projets\BabJDR\BabJDR`

## Entrée utilisateur

$ARGUMENTS

## Fichier de données

Le fichier des objets est `data/objets.json`. C'est un objet avec une clé `"objets"` contenant un tableau.

## Structure d'un objet

Chaque objet est un objet JSON avec exactement 8 champs :

```json
{
  "nom": "Nom de l'objet",
  "numero": 73,
  "image": "data/images/Objets/{Catégorie}/{NomImage}.png",
  "description": "<i>Description immersive en italique.</i>",
  "tags": ["Tag1", "Tag2"],
  "effet": "<strong>Effet:</strong> Description des effets en HTML.",
  "prix": "🔷 <strong>Prix:</strong> 50",
  "poids": "⚖️ <strong>Poids:</strong> 1"
}
```

### Champ `nom`
- Nom unique, en français
- Doit correspondre exactement à la clé dans images.json

### Champ `numero`
- Numéro unique auto-incrémenté
- Lis le fichier pour trouver le dernier numéro et ajouter +1

### Champ `image`
- Chemin vers l'image dans `data/images/Objets/{sous-dossier}/`
- Sous-dossiers : `Armes/`, `Armures/`, `Bouclier/`, `Accessoires/`, `Consumables/Pots/`, `Consumables/Herbs/`, `Consumables/SpellCasting/`, `Consumables/Fleches/`, `Consumables/Buff/`, `Other/food/`, `Other/Compo/`

### Champ `description`
- Toujours entre `<i>...</i>` (italique)
- Description immersive et courte (1-2 phrases), style littéraire/JDR
- Pas de mécanique ici, uniquement de la narration

### Champ `tags`
- Tableau de tags parmi les tags disponibles :

**Catégories principales :**
- `"Arme"` — armes de toute sorte
- `"Armure"` — pièces d'armure
- `"Bouclier"` — boucliers
- `"Catalyseur"` — orbes/focus magiques (main secondaire)
- `"Accessoire"` — bijoux, ceintures, gants, etc.
- `"Consommable"` — objets à charges
- `"Nourriture"` — rations et plats

**Sous-types d'armes :**
- `"Épée"`, `"Dague"`, `"Bâton"`, `"Arc"`, `"Arme exotique"`
- `"Une main"`, `"Deux mains"`

**Sous-types d'armures :**
- `"Armure légère"`, `"Armure lourde"`, `"Robe"`

**Sous-types bouclier :**
- `"Main secondaire"`

**Sous-types consommables :**
- `"Magie"` (baguettes), `"Plante"` (herbes), `"Flèche"`

**Modificateurs :**
- `"Non identifié"` — objet magique/rare non identifié au départ
- `"Légendaire"` — objet légendaire très puissant
- `"Composant"` — ingrédient de craft

### Champ `effet`
- HTML formaté
- Commence toujours par `<strong>Effet:</strong>` ou `<strong>Dégâts:</strong>` pour les armes
- Retours à la ligne avec `<br>`
- Liens vers des sorts : `<span class="spell-link" data-spell="NomSort" data-category="Sorts de Mage" style="color: var(--accent); cursor: pointer; text-decoration: underline;">NomSort</span>`
- Liens vers des états : `<span class="etat-link" data-etat="NomÉtat" style="color: var(--accent); cursor: pointer; text-decoration: underline;">NomÉtat</span>`
- Liens vers d'autres objets : `<span class="objet-link" data-objet="NomObjet" style="color: var(--accent); cursor: pointer; text-decoration: underline;">NomObjet</span>`
- Éléments en couleur :
  - Feu : `<span style="color: #ff6b35; font-weight: bold;">Feu</span>`
  - Eau : `<span style="color: #4682b4; font-weight: bold;">Eau</span>`
  - Terre : `<span style="color: #8b4513; font-weight: bold;">Terre</span>`
  - Air : `<span style="color: #22c55e; font-weight: bold;">Air</span>`
  - Lumière : `<span style="color: #ffd700; font-weight: bold;">Lumière</span>`
  - Nuit : `<span style="color: #7c3aed; font-weight: bold;">Nuit</span>`
  - Divin : `<span style="color: #ffd700; font-weight: bold;">Divin</span>`
  - Maléfique : `<span style="color: #dc2626; font-weight: bold;">Maléfique</span>`
- Pour les consommables, indiquer les charges : `<strong>Charges :</strong> 3`
- Pour les objets craftés, indiquer la recette : `<strong>Recette :</strong>` + liens objet

#### Formules de dégâts standards (armes) :
- Basique : `(2 + Force)` dégâts physiques
- Amélioré : `(4 + Force)` dégâts physiques
- Puissant : `(5 + Force)` dégâts physiques
- Arc basique : `(2 + Agilité)` dégâts physiques
- Arc amélioré : `(4 + Agilité)` dégâts physiques

#### Effets standards (armures) :
- Armure physique : `Augmente l'armure physique de X`
- Stat : `Augmente la {Stat} de X`
- Armure élémentaire : `Augmente l'armure élémentaire de {Élément} de X`

### Champ `prix`
- Format : `"🔷 <strong>Prix:</strong> 50"` (avec le prix en nombre)
- Si prix inconnu (objet rare/magique) : `"🔷 <strong>Prix:</strong> ?"`

### Champ `poids`
- Format : `"⚖️ <strong>Poids:</strong> 1"` (1 ou 2 en général)
- Vide `""` pour les consommables (pas de poids)

## Workflow

### Étape 1 : Analyser la demande

À partir de `$ARGUMENTS`, détermine :
1. **Le type** : Arme, Armure, Bouclier, Catalyseur, Accessoire, Consommable, Nourriture ?
2. **Les sous-types** : Épée/Dague/Arc, Une main/Deux mains, Armure légère/lourde/Robe, etc.
3. **Le nom** de l'objet
4. **Les effets** mécaniques
5. **La rareté** : commun, magique (Non identifié), Légendaire ?
6. **Le prix et le poids**
7. **L'image** : si l'utilisateur mentionne un fichier image

Si des informations manquent, fais des choix raisonnables basés sur l'équilibrage des objets existants.

### Étape 2 : Lire le fichier actuel

Lis `data/objets.json` pour :
- Trouver le dernier `numero` utilisé
- Vérifier qu'un objet similaire n'existe pas déjà
- S'inspirer du style des objets existants de même type

### Étape 3 : Rédiger l'objet

Rédige l'objet proprement en respectant :
- Le ton des descriptions existantes (immersif, style JDR)
- Le formatage HTML décrit ci-dessus
- L'équilibrage (comparer avec les objets existants de même type/prix)

Présente l'objet formaté à l'utilisateur pour validation avant de l'insérer.

### Étape 4 : Insérer dans objets.json

Une fois validé :
1. Lis le fichier `data/objets.json`
2. Ajoute l'objet à la fin du tableau `objets`
3. Écris le fichier modifié

### Étape 5 : Assigner l'image dans images.json (OBLIGATOIRE)

Les images des objets sont mappées dans `data/images.json` avec la clé `"objet:Nom de l'objet"`.

1. Lis `data/images.json`
2. Ajoute une entrée :
   ```json
   "objet:Nom de l'objet": "data/images/Objets/{Catégorie}/{NomImage}.png"
   ```
3. Vérifie que le fichier image existe

**Exemples existants :**
```json
"objet:Espadon": "data/images/Objets/Armes/Epee2M1.png",
"objet:Bouclier en bois": "data/images/Objets/Bouclier/Bouclier1.png",
"objet:Petite potion de vie": "data/images/Objets/Consumables/Pots/LifePot1.png"
```

## Équilibrage de référence

### Prix indicatifs par type :
- Arme basique : 15-35
- Arme améliorée : 50-100
- Armure légère : 30-50
- Armure lourde : 100-200
- Robe : 20-50
- Bouclier : 15-40
- Catalyseur : 25-60
- Accessoire commun : 20-50
- Potion : 10-30
- Herbe : 15-25
- Flèche : 10-15
- Nourriture : 5-15
- Cristal : 30-50
- Baguette : 20-40
- Objet magique/Non identifié : `?`
- Objet Légendaire : `?`

### Poids indicatifs :
- Arme une main : 1
- Arme deux mains : 2
- Armure légère : 1
- Armure lourde : 2
- Robe : 1
- Bouclier/Catalyseur : 1
- Accessoire : 1
- Consommables : pas de poids (vide)
- Nourriture : 1

## Notes importantes

- TOUJOURS lire objets.json avant de modifier pour avoir la version à jour et le bon numéro
- TOUJOURS montrer l'objet formaté à l'utilisateur et attendre sa validation avant d'écrire
- Garder le même style immersif dans les descriptions
- Ne pas oublier le champ `image` dans l'objet ET le mapping dans `images.json`
- Les consommables n'ont pas de poids (champ vide `""`)
