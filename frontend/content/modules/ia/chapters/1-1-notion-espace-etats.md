### 1.1.1 L'approche classique de l'Intelligence Artificielle

L'approche de l'Intelligence Artificielle considérée comme **classique** (ou symbolique) repose sur un principe fondateur en trois étapes :
1. **Représenter le problème de façon symbolique** ;
2. **Identifier les relations** entre les différentes représentations pour créer un **espace de recherche** ;
3. **Chercher des solutions** au sein de l'espace ainsi créé.

Dans le cadre des ateliers de programmation de systèmes intelligents, le langage de programmation logique de référence associé à cette approche est **PROLOG** (en particulier l'environnement libre **SWI-PROLOG**).

:::retenir Définition formelle d'un problème
En Intelligence Artificielle, un **problème** est rigoureusement défini par trois composantes :
- Une **situation de départ** (ou état initial $s_0$) ;
- Un **objectif** : un ensemble de situations d'arrivée désirées (états buts $F$) ;
- Un ensemble $\mathcal{O} = \{O_1, O_2, \dots, O_i, \dots\}$ d'**opérations** (ou opérateurs de transition).

Une **solution** est une suite finie d'opérations qui, étant appliquées successivement en partant de l'état initial, conduit à un état solution.
:::

---

### 1.1.2 Définition de l'espace d'états : le quadruplet $(S, s_0, F, Q)$

L'espace d'états modélise l'ensemble des configurations accessibles d'un système ainsi que les lois régissant le passage d'une configuration à une autre.

:::retenir Le quadruplet fondamental
L'espace d'états est un quadruplet $(S, s_0, F, Q)$ où :
- **$S$** : ensemble de tous les états possibles du problème ;
- **$s_0$** : état initial du système ($s_0 \in S$) ;
- **$F$** : ensemble des positions finales ou états solutions ($F \subseteq S$) ;
- **$Q : S \to S$** : ensemble des fonctions partielles de transition d'un état à un autre (les opérateurs acceptables).
:::

L'espace d'états d'un problème se représente sous la forme d'un **graphe orienté** créé en partant du nœud représentant l'état initial $s_0$ et en appliquant les opérateurs qui modélisent l'ensemble des actions du monde réel.

:::attention Mémorisation du graphe
Il faut souligner qu'**il n'est pas nécessaire d'avoir à mémoriser l'intégralité de ce graphe** à l'avance en mémoire. Dans la quasi-totalité des problèmes réels, l'arbre de recherche est **construit dynamiquement** au fur et à mesure de l'exploration de la solution.
:::

---

### 1.1.3 Les 4 étapes pour résoudre un problème dans un espace d'états

Pour résoudre avec succès un problème par la méthode de recherche dans un espace d'états, il faut suivre une démarche rigoureuse en 4 étapes :

1. **Déterminer la représentation symbolique du problème dans l'espace d'états** (choix de la structure de données : $n$-uplet, ensemble, matrice) ;
2. **Déterminer les opérateurs acceptables**, avec leurs préconditions, qui permettent à un état donné de passer à ses successeurs ;
3. **Déterminer l'état initial ($s_0$)** et caractériser le ou les **états finaux ($F$)** ;
4. **Déterminer la stratégie de recherche**, c'est-à-dire la méthode de choix de l'opérateur parmi les opérateurs acceptables à chaque instant.

---

### 1.1.4 L'algorithme général de recherche

L'algorithme abstrait commun à toute recherche séquentielle dans un espace d'états s'écrit de la façon suivante :

```text
St ← état initial
WHILE (St ≠ état final) DO
    Op ← (opérateur choisi pour l'état St selon la stratégie de recherche)
    St ← (le résultat de l'application de Op sur l'état St)
END
```

:::exemple Illustration du principe
Dans un jeu de labyrinthe :
- $St$ est la position courante `(x, y)`.
- La condition d'arrêt teste si `(x, y)` est la case de sortie.
- L'opérateur choisi peut être `aller_Nord`, `aller_Est`, etc., sous réserve qu'il n'y ait pas de mur.
- Le nouvel état $St$ devient la nouvelle coordonnée atteinte.
:::

---

### 1.1.5 Notion de coût, optimalité et admissibilité

Toutes les solutions à un problème ne se valent pas. Deux critères fondamentaux régissent l'évaluation de la qualité d'une solution :

#### 1. Coût associé à une opération
Soit $k$ la **fonction de coût** :
$$k(O_i) = k_i \in \mathbb{R}^*$$
Chaque opérateur $O_i$ appliqué a un coût associé $k_i$ (par exemple du temps, des kilomètres, de l'énergie ou un coût unitaire $k_i = 1$).

#### 2. Coût d'une solution
Pour une suite de $n$ opérations menant de l'état initial à un état final :
$$\text{Coût de la solution} = \sum_{i=1}^n k_i$$

#### 3. Solution optimale
Une solution est dite **optimale** s'il n'existe aucune autre solution de coût **strictement inférieur**.

#### 4. Méthode admissible
Une méthode (ou algorithme de recherche) est dite **admissible** si, chaque fois qu'il existe une solution optimale, la méthode la trouve en un temps fini.

:::examen Ce que vérifie le correcteur
Dans une question théorique sur les définitions :
1. Citez le quadruplet $(S, s_0, F, Q)$ avec le rôle exact de chaque lettre.
2. Définissez la condition d'optimalité d'une solution : aucun coût strictement inférieur.
3. Donnez la définition exacte d'une **méthode admissible** : elle garantit de trouver une solution optimale en temps fini dès lors qu'une telle solution existe.
:::
