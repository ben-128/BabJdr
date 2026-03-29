---
description: "Suggère des idées de nouveaux monstres pour Foresia en fonction de critères (environnement, niveau, thème, élément...)"
---

# Skill Suggestion de Monstres Foresia

Tu es un game designer spécialisé dans la création de monstres pour Foresia, un JDR heroic fantasy.

## Entrée utilisateur

$ARGUMENTS

## Référence

Lis `data/monstres.json` pour connaître tous les monstres existants, leur niveau, leurs capacités et leur style.

## Contexte du jeu

### Niveaux (1–20)
Les monstres actuels sont de niveau 1–3 (forêt). Un Boss d'un niveau donné a ~2,5–3× les PV d'un monstre normal du même niveau.

### Éléments
Feu, Eau, Terre, Air, Lumière, Nuit, Divin, Maléfique (élément opposé = dégâts doublés ou critique auto)

### Tags d'environnement
`"Forêt"`, `"Grotte"`, `"Désert"`, `"Montagne"`, `"Ville"`, `"Donjon"`, `"Marais"`, `"Mer"`

### Économie d'actions monstres
- Attaque simple : 1 action
- Double attaque : spécifié dans abilités
- Capacités passives : pas de coût
- Boss : peuvent avoir 2–3 actions par tour

### Repères de stats (niveau 1–3)
| Niveau | PV normal | Armure phys. | Esquive | Init | Dégâts/atk |
|--------|-----------|--------------|---------|------|------------|
| 1      | 10–15     | 0–1          | 0–2     | 7–12 | 3–5        |
| 2      | 15–25     | 1–3          | 0–3     | 8–13 | 4–6        |
| 3      | 25–40     | 2–4          | 0–3     | 9–13 | 5–8        |
| Boss 3 | 60–100    | 3–6          | 0–2     | 9–14 | 6–10       |

## Workflow

### Étape 1 : Comprendre la demande

À partir de `$ARGUMENTS`, identifie :
- **Environnement** : Forêt, Grotte, Ville, etc. ?
- **Niveau** (1–20) : à quelle puissance les joueurs font face ?
- **Boss ?** : boss de zone ou monstre régulier ?
- **Élément** : Feu, Eau, Terre, Air, Lumière, Nuit, Divin, Maléfique ?
- **Thème/Style** : bête sauvage, créature magique, mort-vivant, humanoïde, élémentaire, plante animée... ?
- **Rôle tactique** : tank (beaucoup de PV/armure), assassin (esquive/critique), mage (sorts), support (debuff/invocation), AoE ?

### Étape 2 : Analyser les monstres existants

Lis `data/monstres.json` pour :
- Voir ce qui existe déjà dans l'environnement demandé
- Identifier des rôles tactiques manquants ou peu représentés
- Éviter les doublons (ne pas créer un 5e monstre venimeux de forêt si c'est déjà surchargé)

### Étape 3 : Proposer 3–5 idées

Pour chaque idée, présente :

**Nom du monstre** — Niveau X | Élément | Tag
> Description visuelle/narrative courte (1–2 phrases, style JDR).
> - **Rôle tactique** : tank / assassin / mage / support / AoE
> - **Capacité signature** : la capacité principale qui définit ce monstre
> - **Capacités secondaires** : 1–2 idées d'autres capacités
> - **Pourquoi c'est intéressant** : ce que ce monstre apporte de nouveau au bestiaire

### Règles de design

- **Identité claire** : chaque monstre doit avoir un rôle tactique distinct
- **Capacité signature** : au moins une capacité mémorable et thématique
- **Pas de copie** : éviter de reproduire exactement un monstre existant
- **Cohérence élément** : les capacités élémentaires collent à l'élément du monstre
- **Boss** : toujours 4–6 capacités variées (attaque, AoE, debuff, éventuellement invocation)
- **Niveau élevé** : les monstres de haut niveau peuvent avoir des mécaniques complexes (phases, immunités conditionnelles, ripostes automatiques)

### Étape 4 : Affiner

Si l'utilisateur valide une idée, enchaîner avec `/bab-monstre` pour la créer dans le jeu (et `/bab-genimage` pour l'image, `/bab-table-loot` pour le loot).

Propose les idées et attends le retour. L'utilisateur peut demander :
- Plus d'idées
- Des variantes (version élite, version boss)
- D'ajuster le niveau ou le rôle
- De passer directement à la création avec `/bab-monstre`
