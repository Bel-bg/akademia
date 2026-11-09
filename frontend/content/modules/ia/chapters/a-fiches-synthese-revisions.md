### A.1 Fiche 1 : Le Quadruplet de l'espace d'états $(S, s_0, F, Q)$

- **$S$** : Ensemble exhaustif des états possibles.
- **$s_0$** : État initial ($s_0 \in S$).
- **$F$** : Ensemble des états finaux / buts ($F \subseteq S$).
- **$Q$** : Ensemble des fonctions partielles de transition (opérateurs $O_i$).
- **Coût d'une opération** : $k(O_i) = k_i \in \mathbb{R}^*$.
- **Coût d'une solution** : $\sum_{i=1}^n k_i$.
- **Solution optimale** : Aucune solution de coût strictement inférieur.
- **Méthode admissible** : Trouve toujours une solution optimale en temps fini dès lors qu'il en existe une.

---

### A.2 Fiche 2 : Comparatif synthétique des algorithmes de recherche

| Algorithme | Type | Structure de $Q$ | Complétude | Optimalité | Complexité Temps | Complexité Espace |
|---|---|---|---|---|---|---|
| **DFS** | Aveugle | Pile LIFO (`append(S, Q)`) | Non (si cycles ou infini) | Non | $O(b^m)$ | **$O(b \cdot m)$ (minimal)** |
| **BFS** | Aveugle | File FIFO (`append(Q, S)`) | **Oui** (si $b$ fini) | **Oui** (si coûts unitaires) | $O(b^d)$ | **$O(b^d)$ (exponentiel)** |
| **UCS** | Aveugle | File priorité triée sur $g(n)$ | **Oui** (si coûts $\ge \epsilon > 0$) | **Oui** (toujours) | $O(b^{1 + \lfloor C^*/\epsilon \rfloor})$ | $O(b^{1 + \lfloor C^*/\epsilon \rfloor})$ |
| **Hill Climbing** | Heuristique | Aucune (état unique) | Non (optimum local) | Non | Rapide | **$O(1)$** |
| **Glouton (Best-First)** | Heuristique | File priorité triée sur $h(n)$ | Non (si boucles) | Non | $O(b^m)$ | $O(b^m)$ |
| **A\*** | Heuristique | File triée sur $f = g + h$ | **Oui** (si $h$ admissible) | **Oui** (si $h$ admissible) | $O(b^d)$ | $O(b^d)$ |

---

### A.3 Fiche 3 : Heuristiques et règles d'or

:::retenir Admissibilité
Une heuristique $h(n)$ est admissible si :
$$0 \le h(n) \le h^*(n)$$
- Elle est **optimiste** (ne surestime jamais le coût réel).
- Elle garantit l'optimalité de l'algorithme A\*.
- Pour le Taquin : $h_1$ (plaquettes mal placées) et $h_2$ (somme des distances de Manhattan) sont admissibles.
- Dominance : $h_2(n) \ge h_1(n)$ pour tout $n \implies h_2$ explore moins ou autant de nœuds que $h_1$.
:::

---

### A.4 Fiche 4 : Jeux à deux joueurs & Alpha-Bêta

- **Arbre Min-Max** :
  - MAX prend le maximum de ses enfants : $v = \max(v_{enfants})$.
  - MIN prend le minimum de ses enfants : $v = \min(v_{enfants})$.
- **Bornes Alpha-Bêta** :
  - $\alpha$ : Meilleure valeur pour MAX (initialisé à $-\infty$).
  - $\beta$ : Meilleure valeur pour MIN (initialisé à $+\infty$).
- **Coupure** : Dès que $\alpha \ge \beta$, on coupe l'exploration des enfants restants !
- Même résultat exact que Min-Max complet, avec une complexité réduite à $O(b^{d/2})$ dans le cas idéal.

---

### A.5 Fiche 5 : Algorithmes Génétiques

- **Chromosome** : Vecteur binaire ou permutation d'entiers représentant une solution.
- **Fitness** : Mesure de la qualité de la solution (à maximiser).
- **Sélection** : Choix proportionnel au fitness (roulette : $p_i = \frac{f_i}{\sum f_k}$).
- **Croisement (Crossover)** : Échange de segments chromosomiques entre 2 parents.
- **Mutation** : Inversion aléatoire d'un bit ou permutation pour conserver la diversité.
