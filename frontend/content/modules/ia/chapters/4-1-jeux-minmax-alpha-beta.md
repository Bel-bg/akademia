### 4.1.1 Modélisation des jeux à deux joueurs à somme nulle

Les jeux de stratégie classiques (échecs, dames, morpion) sont modélisés comme des **jeux à deux joueurs, alternés, à information complète et à somme nulle** :
- Deux adversaires s'affrontent : le joueur **MAX** (qui cherche à maximiser son score) et le joueur **MIN** (qui cherche à minimiser le score de MAX).
- À somme nulle : le gain de l'un est exactement la perte de l'autre ($G_{MAX} + G_{MIN} = 0$).

---

### 4.1.2 L'algorithme Min-Max

L'algorithme **Min-Max** explore l'arbre des configurations de jeu jusqu'aux feuilles terminales (ou jusqu'à une profondeur maximale avec une fonction d'évaluation heuristique) et remonte les valeurs de façon récursive :

:::retenir Règle de calcul de la valeur Min-Max
Soit $n$ un nœud de l'arbre de jeu :
- Si $n$ est une **feuille terminale** :
  $$\text{valeur}(n) = \text{utilité}(n)$$
  *(Par exemple pour le morpion : $+1$ si MAX gagne, $0$ si match nul, $-1$ si MIN gagne).*
- Si $n$ est un **nœud MAX** (au tour de MAX de jouer) :
  $$\text{valeur}(n) = \max_{s \in succ(n)} \text{valeur}(s)$$
- Si $n$ est un **nœud MIN** (au tour de MIN de jouer) :
  $$\text{valeur}(n) = \min_{s \in succ(n)} \text{valeur}(s)$$
:::

Une fois les valeurs remontées à la racine, le joueur MAX choisit l'action menant au successeur ayant la valeur maximale.

---

### 4.1.3 L'élagage Alpha-Bêta ($\alpha$-$\beta$ pruning)

Min-Max classique explore l'intégralité de l'arbre, ce qui devient impraticable pour les jeux à fort facteur de branchement ($O(b^d)$).
L'**élagage Alpha-Bêta** est une technique d'optimisation fondamentale qui **évite d'explorer des sous-arbres dont le résultat ne peut en aucun cas modifier le choix final de la racine**.

#### Définition des bornes $\alpha$ et $\beta$
- **$\alpha$** : la valeur de la meilleure option (la plus haute) trouvée à ce jour pour le joueur **MAX** le long du chemin vers la racine. Initialement $\alpha = -\infty$.
- **$\beta$** : la valeur de la meilleure option (la plus basse) trouvée à ce jour pour le joueur **MIN** le long du chemin vers la racine. Initialement $\beta = +\infty$.

:::retenir Condition d'élagage (coupure)
Lors du parcours en profondeur, **dès que l'on a :**
$$\alpha \ge \beta$$
**on arrête immédiatement l'exploration des enfants restants du nœud courant** (on effectue une coupure).

- Si l'arrêt a lieu au niveau d'un nœud MIN, on parle de **coupure $\alpha$**.
- Si l'arrêt a lieu au niveau d'un nœud MAX, on parle de **coupure $\beta$**.
:::

:::examen Propriété essentielle pour l'examen
L'élagage Alpha-Bêta **renvoie exactement la même décision et la même valeur à la racine que Min-Max standard**. Aucune information utile n'est perdue. Dans le meilleur des cas (nœuds triés du meilleur au pire), la complexité en temps passe de $O(b^d)$ à **$O(b^{d/2})$**, ce qui permet de doubler la profondeur de recherche pour un même temps de calcul.
:::

---

### 4.1.4 Application résolue : Le jeu de Morpion (Tic-Tac-Toe 3x3)

Dans le jeu de Morpion sur une grille $3 \times 3$, deux joueurs posent tour à tour leur symbole : `X` (joueur MAX) et `O` (joueur MIN).
Valeurs des états terminaux :
- $+1$ si `X` a aligné trois symboles (victoire de X) ;
- $0$ si la grille est pleine sans vainqueur (match nul) ;
- $-1$ si `O` a aligné trois symboles (défaite de X).

À partir d'une configuration donnée où c'est au tour de `X` de jouer :
1. On génère toutes les cases vides restantes comme actions possibles pour `X` (nœuds enfants de niveau MAX).
2. Pour chaque action de `X`, on anticipe les réponses possibles de `O` (nœuds de niveau MIN).
3. On remonte les valeurs par Min-Max : `X` choisira la case qui maximise la valeur finale garantie, même face au jeu le plus brillant de son adversaire `O`.
