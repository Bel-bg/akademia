### 2.1.1 L'espace exploré : Arbre de recherche

Lorsqu'un algorithme résout un problème dans un espace d'états, le processus génère dynamiquement un **arbre de recherche** constitué de :
- **Nœuds** : représentent des états de l'espace d'états (avec l'historique du chemin pour y parvenir) ;
- **Arcs** : représentent l'application d'un opérateur de transition entre un nœud parent et un nœud enfant.

On distingue deux grandes familles d'algorithmes de recherche :

1. **Les algorithmes non informés (dits « aveugles »)** :
   Ils réalisent un parcours systématique ou exhaustif, **sans utiliser aucune information sur la structure ou la distance** restant à parcourir vers le but.
2. **Les algorithmes informés (dits « heuristiques »)** :
   Ils exploitent des connaissances et des estimations spécifiques au problème pour guider la recherche vers les zones les plus prometteuses de l'espace d'états.

---

### 2.1.2 Les quatre critères d'évaluation des performances

Pour apprécier et comparer rigoureusement la performance d'un algorithme de recherche, l'Intelligence Artificielle s'appuie sur quatre critères universels :

:::retenir Les 4 critères clés
1. **Complétude** :
   Caractéristique d'un algorithme qui **garantit de trouver une solution s'il en existe une**. Si l'algorithme peut s'enfermer dans une boucle infinie ou ignorer la branche solution, il n'est pas complet.
2. **Optimalité** :
   Caractéristique d'un algorithme qui **trouve la meilleure solution** (celle de coût minimal) parmi toutes les solutions admissibles du problème.
3. **Complexité en temps** :
   Estimation du **temps de calcul** (nombre de nœuds générés ou explorés) nécessaire pour aboutir à la solution.
4. **Complexité en espace** :
   Estimation de l'**espace mémoire** maximal requis au cours de la recherche (notamment la taille de la frontière d'exploration).
:::

Pour exprimer ces complexités, on utilise généralement :
- $b$ : le **facteur de branchement** maximal (nombre moyen de successeurs par nœud) ;
- $d$ : la **profondeur de la solution** la moins profonde ;
- $m$ : la **profondeur maximale** de l'arbre de recherche (pouvant être infinie s'il y a des cycles).

---

### 2.1.3 Les structures de données fondamentales

Tous les algorithmes classiques de parcours d'arbres et de graphes s'articulent autour de trois structures de données essentielles :

| Notation | Rôle | Description |
|---|---|---|
| **$Q$** | **File des nœuds à explorer** (la « frontière ») | Contient les états découverts mais dont les successeurs n'ont pas encore été générés. |
| **$C$** | **Ensemble des nœuds déjà explorés** (les « fermés ») | Mémorise les états déjà traités afin d'éviter les boucles et les réexplorations redondantes. |
| **$S$** | **File des successeurs** | Liste temporaire des enfants générés par l'expansion du nœud courant $n$. |

:::examen Question type d'examen
« Citez les 4 critères d'évaluation des algorithmes de recherche et définissez brièvement chacun d'eux. Précisez le rôle des structures de données $Q$ et $C$. »
- **Complétude** : trouve une solution si elle existe.
- **Optimalité** : trouve la solution de coût minimal.
- **Complexité en temps** : nombre d'états développés.
- **Complexité en espace** : mémoire maximale occupée (taille de $Q$ et $C$).
- **$Q$** est la file d'attente des nœuds à développer.
- **$C$** est la liste des nœuds fermés/déjà explorés pour éviter les cycles.
:::
