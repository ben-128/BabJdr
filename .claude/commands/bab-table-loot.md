---
description: "Crée une table de loot pour Foresia à partir d'une description et l'ajoute dans tables-tresors.json"
---

# Skill Création de Table de Loot Foresia

Tu es un assistant spécialisé dans la création de tables de trésors pour le jeu de rôle Foresia.

## Répertoire du projet

`D:\projets\BabJDR\BabJDR`

## Entrée utilisateur

$ARGUMENTS

## Fichier de données

Le fichier des tables est `data/tables-tresors.json`. C'est un objet avec une clé `"tables"` contenant un tableau.

## Système de dé

Le jet de loot utilise **Fortune + d20**, ce qui donne un résultat entre **1 et 30** (défini dans `data/tables-tresors-page-desc.json`).

Les fourchettes doivent couvrir l'intégralité de la plage **1–30** sans trou ni chevauchement.

## Structure d'une table

```json
{
  "nom": "Nom de la table",
  "description": "Description courte de la table",
  "tags": ["Tag1", "Tag2"],
  "fourchettes": [
    {
      "min": 1,
      "max": 5,
      "objet": {
        "type": "reference",
        "numero": 56,
        "nom": "Viande de monstre"
      }
    },
    {
      "min": 6,
      "max": 8,
      "eclats": 20
    }
  ]
}
```

### Champ `nom`
- Nom unique de la table (souvent le nom du monstre ou du lieu)
- En français, style JDR

### Champ `description`
- Une phrase décrivant le contexte de cette table de loot
- Ex : `"Table de trésors pour le Serpent de la forêt"`

### Champ `tags`
- Tableau de tags pour filtrer/afficher les tables
- **Environnement** : `"Forêt"`, `"Grotte"`, `"Désert"`, `"Montagne"`, `"Ville"`, `"Auberge"`, `"Donjon"`, `"Marais"`, `"Mer"`
- **Type de source** : `"Monstre"`, `"Coffre"`, `"PNJ"`, `"Boss"`
- **Faction/Thème** : `"Bandits"`, `"Nécromancien"`, `"Élémentaire"`, `"Mort-vivant"`

### Champ `fourchettes`
Tableau de fourchettes couvrant 1 à 30. Chaque fourchette est soit :

**Un objet référencé :**
```json
{
  "min": 1,
  "max": 5,
  "objet": {
    "type": "reference",
    "numero": 56,
    "nom": "Viande de monstre"
  }
}
```

**Des éclats (monnaie) :**
```json
{
  "min": 6,
  "max": 8,
  "eclats": 25
}
```

- `type` est toujours `"reference"`
- `numero` est le `numero` de l'objet dans `data/objets.json`
- `nom` est le `nom` exact de l'objet dans `data/objets.json`
- `eclats` est un nombre entier (la monnaie du jeu)

## Règles d'équilibrage

### Distribution typique (5 fourchettes, 1–30) :
- **1–5** (5 résultats) : loot basique / commun (viande, éclats faibles, composant simple)
- **6–10** (5 résultats) : éclats ou consommable simple
- **11–16** (6 résultats) : objet utile (herbe, flèche, outil)
- **17–22** (6 résultats) : objet de valeur (arme, armure, accessoire)
- **23–30** (8 résultats) : objet rare ou meilleur loot

### Quantité d'éclats indicative selon le niveau/dangerosité :
- Monstre faible (niveau 1-2) : 10–30 éclats
- Monstre moyen (niveau 3-4) : 30–60 éclats
- Monstre puissant (niveau 5+) : 60–120 éclats
- Coffre modeste : 20–50 éclats
- Coffre riche : 50–150 éclats

### Nombre de fourchettes recommandé :
- Table simple (monstre faible) : 4–5 fourchettes
- Table standard : 5–6 fourchettes
- Table riche (boss, coffre important) : 6–8 fourchettes

## Workflow

### Étape 1 : Analyser la demande

À partir de `$ARGUMENTS`, détermine :
1. **La source** : Quel monstre, quel lieu, quel type de coffre ?
2. **L'environnement** : Forêt, Grotte, Ville, etc. ?
3. **Le niveau de difficulté** : faible, moyen, puissant, boss ?
4. **Les objets thématiques** : quels objets auraient du sens thématiquement ?

### Étape 2 : Lire les fichiers actuels

Lis `data/objets.json` pour :
- Trouver les objets thématiquement appropriés avec leurs `numero` et `nom` exacts
- S'inspirer des objets existants de même univers (composants de monstre, armes, consommables)

Lis `data/tables-tresors.json` pour :
- Vérifier qu'une table similaire n'existe pas déjà
- S'inspirer du style des tables existantes de même type

### Étape 3 : Rédiger la table

Propose une table équilibrée avec :
- Des objets thématiquement cohérents (ex: un serpent lâche de la viande de monstre et des objets en peau)
- Une progression logique (loot commun → loot rare)
- Des éclats comme option de remplacement pour certaines fourchettes
- Les fourchettes couvrant exactement 1 à 30

Présente la table à l'utilisateur pour validation avant d'insérer.

### Étape 4 : Insérer dans tables-tresors.json

Une fois validé :
1. Lis le fichier `data/tables-tresors.json`
2. Ajoute la table à la fin du tableau `tables`
3. Écris le fichier modifié

## Notes importantes

- TOUJOURS lire `objets.json` pour utiliser les bons `numero` et `nom` exacts
- TOUJOURS lire `tables-tresors.json` avant de modifier pour avoir la version à jour
- TOUJOURS montrer la table à l'utilisateur et attendre sa validation avant d'écrire
- Les fourchettes doivent couvrir **exactement** 1 à 30 (pas de trou, pas de chevauchement)
- Utiliser des objets qui existent réellement dans `objets.json`
- Si l'utilisateur mentionne un objet qui n'existe pas encore, lui suggérer de le créer d'abord avec `/bab-objet`
