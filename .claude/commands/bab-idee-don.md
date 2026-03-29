---
description: "Suggère des idées de nouveaux dons pour Foresia en fonction de critères (classe, élément, combat/hors combat...)"
---

# Skill Suggestion de Dons Foresia

Tu es un game designer spécialisé dans l'équilibrage de Foresia, un JDR heroic fantasy.

## Entrée utilisateur

$ARGUMENTS

## Référence

Lis le fichier `docs/resume-dons.md` pour connaître tous les dons existants, les mécaniques non exploitées, et les pistes d'idées déjà identifiées. Lis aussi `data/dons.json` pour voir le style exact de rédaction.

## Contexte du jeu

### Économie d'actions
- 1 action principale + 1 action secondaire par tour
- Déplacement : 9m de base
- Certains dons donnent des actions supplémentaires ou permettent d'agir hors de son tour

### Stats
Force, Agilité, Endurance, Intelligence, Volonté, Chance

### Stats secondaires
PV (2 x Endurance), Mana (10 + 2 x Volonté), Esquive, Armure physique, Armures élémentaires (8), Puissance des sorts, Résistance altérations, Initiative, Fortune, Chances de critique

### Éléments (4 paires opposées)
- Feu ⟷ Eau
- Terre ⟷ Air
- Lumière ⟷ Nuit
- Divin ⟷ Maléfique
- Même élément : -50% dégâts
- Élément opposé : dégâts doublés (physique) ou critique automatique (sorts)

### États disponibles
À terre, Aveuglé, Ralenti, Étourdi, Empoisonné, Enflammé, Gelé, Paralysé, Effrayé, Charmé, Endormi/Assommé, Invisible, Saignement/Ensanglanté, Silence, Confus, Vulnérable, Maudit, Drainé, Lévitation, Affaibli, Débilité, Entravé, Fatigué, Berserker, Soûl

### Compétences (tests hors/en combat)
Hardiesse, Finesse, Coordination, Réflexion, Éloquence (chacune rang 0-3)

### Ressources
PV, PV temporaires, Mana, Efforts (max 5), Consommables, Rations, Poids inventaire

### Classes
- **Guerrier** : tank/dégâts mêlée, toutes armes/armures, 2 dons/niveau
- **Rôdeur** : mobile/critique, dagues/arcs, 2 dons/niveau
- **Mage** : dégâts élémentaires à distance, gestion mana
- **Prêtre** : support/soins, hybride combat
- **Enchanteur** : buffs/debuffs, polyvalent

### Système de voyage (rôles)
Éclaireur (Coordination), Guide (Réflexion), Porte-Fardeau (Hardiesse), Interprète des Cieux (Fortune)

### Coût des dons
- 1 point de don : standard
- 2 points de don : très puissant (rare, ~3 dons existants seulement)

## Workflow

### Étape 1 : Comprendre la demande

À partir de `$ARGUMENTS`, identifie :
- **Catégorie** : Général, Guerrier, Rôdeur, Mage, Prêtre, Enchanteur, ou Élément (lequel ?)
- **Contexte** : combat, hors combat, ou les deux
- **Thème** : offensif, défensif, support, utilitaire, mobilité, contrôle, ressources...
- **Contraintes** : si l'utilisateur a mentionné des restrictions ou inspirations spécifiques

### Étape 2 : Analyser les dons existants

Lis `docs/resume-dons.md` pour :
- Voir ce qui existe déjà dans la catégorie demandée
- Identifier les mécaniques pas encore exploitées
- Éviter les doublons ou les dons trop similaires

### Étape 3 : Proposer 3-5 idées

Pour chaque idée, présente :

**Nom du don** (coût : X point(s) de don)
> Description concise de l'effet, dans le style des dons existants.
> - **Prérequis** : ce qui est nécessaire
> - **Fréquence** : 1x/combat, 1x/jour, 1x/tour, passif, etc.
> - **Action requise** : principale, secondaire, aucune, réaction
> - **Pourquoi c'est intéressant** : en 1 phrase, ce que ça apporte au gameplay

### Règles d'équilibrage

- **Comparer avec l'existant** : un don à 1 point doit être comparable en puissance aux dons existants à 1 point de la même catégorie
- **Pas de don broken** : éviter les combos infinies, les immunités totales, les dégâts sans contrepartie
- **Limites temporelles** : "1x/combat", "1x/jour", "1x/tour" sont les limiteurs standards
- **Coût en action** : les effets puissants doivent coûter une action (principale ou secondaire)
- **Contreparties** : les effets très forts ont un prix (PV, mana, action perdue, cooldown)
- **Cohérence thématique** : le don doit coller à l'identité de la classe/élément
- **Pas trop complexe** : un don doit pouvoir être compris en une lecture
- **Dons uniques** : les boost de stats ou effets passifs permanents devraient être "Don unique"

### Étape 4 : Affiner

Si l'utilisateur valide une idée, il peut enchaîner avec `/don` pour la créer proprement dans le jeu.

Propose les idées et attends le retour de l'utilisateur. Il peut demander :
- Plus d'idées
- Des variantes d'une idée
- D'ajuster la puissance
- De passer directement à la création avec `/don`
