### 2.3.1 Recherche en largeur d'abord (BFS)

L'algorithme de **recherche en largeur d'abord** (*Breadth First Search*, **BFS**) explore l'espace d'états niveau par niveau :
1. Il commence par la racine (profondeur 0) ;
2. Il explore ensuite **tous les nœuds de profondeur 1** ;
3. Puis tous les nœuds de profondeur 2, et ainsi de suite.

```text
              A (1)
            /       \
         B (2)      C (3)
        /     \     /   \
      D (4)   E(5) F(6) G(7)
      /   \     \
    H(8)  I(9)  J(10)
```
*(Ordre de visite en BFS : A, puis niveau 1 : B, C ; puis niveau 2 : D, E, F, G ; puis niveau 3 : H, I, J).*

---

### 2.3.2 Algorithme formel de BFS

La différence fondamentale entre BFS et DFS réside dans l'ordre d'insertion des successeurs dans la file $Q$. Dans BFS, la file fonctionne selon le principe **FIFO (First In, First Out)** : les nouveaux nœuds sont insérés **en fin de file** via `append(Q, S)`.

```text
Function Recherche-BFS(Noeud-initial)
    Q = [Noeud-initial]
    REPEAT
        n ← first(Q)
        Q ← rest(Q)
        
        IF (n est noeud But) THEN
            RETURN n
        END IF
        
        S = succ(n)         // Génère les successeurs de n
        Q = append(Q, S)    // Insère S à la FIN de Q (file FIFO)
    UNTIL Q = []
    
    RETURN ECHEC
```

:::retenir Analyse des critères de performance de BFS
- **Complétude : OUI**
  Si le facteur de branchement $b$ est fini, BFS est garanti de trouver une solution si elle existe, car il explore exhaustivement les profondeurs successives sans jamais s'enfoncer prématurément.
- **Optimalité : OUI sous condition**
  BFS est optimal **si et seulement si le coût de chaque action est identique** (coût unitaire $k_i = 1$). Dans ce cas, la solution trouvée est garantie d'être de profondeur minimale $d$. Si les coûts diffèrent, BFS ne trouve pas forcément le coût minimal.
- **Complexité en espace : $O(b^d)$ (Goulot d'étranglement critique)**
  C'est le point faible majeur de BFS : tous les nœuds du niveau courant doivent être conservés simultanément dans la file $Q$. Pour $b=10$ et $d=6$, cela représente déjà 1 million d'états en mémoire vive.
:::

---

### 2.3.3 Recherche à coût uniforme (UCS)

Lorsque les transitions possèdent des **coûts variables** $k(O_i) > 0$, BFS ne garantit plus l'optimalité. On utilise alors la **recherche à coût uniforme** (*Uniform Cost Search*, **UCS**).

- **Principe** : La file $Q$ n'est plus une simple file FIFO, mais une **file de priorité** ordonnée par ordre croissant du coût accumulé depuis l'origine, noté $g(n)$ :
  $$g(n) = \sum \text{coûts des actions du départ jusqu'à } n$$
- À chaque itération, UCS extrait le nœud $n$ pour lequel $g(n)$ est le plus faible.
- **Optimalité et complétude** : UCS est **complet et optimal** pour n'importe quelle fonction de coût positif (dès lors qu'il existe un coût minimal de transition $\epsilon > 0$).
- **Structure de données** : File de priorité (tas ou tri ordonné).

---

### 2.3.4 Tableau comparatif : DFS vs BFS vs UCS

| Algorithme | Structure de $Q$ | Complétude | Optimalité | Complexité Temps | Complexité Espace |
|---|---|---|---|---|---|
| **DFS** | Pile LIFO (`append(S, Q)`) | Non (si boucles/profondeur infinie) | Non | $O(b^m)$ | **$O(b \cdot m)$ (Excellente)** |
| **BFS** | File FIFO (`append(Q, S)`) | **Oui** (si $b$ fini) | **Oui** (si coûts égaux) | $O(b^d)$ | **$O(b^d)$ (Élevée)** |
| **UCS** | File de priorité sur $g(n)$ | **Oui** (si coûts $\ge \epsilon > 0$) | **Oui** (toujours optimal) | $O(b^{1 + \lfloor C^* / \epsilon \rfloor})$ | $O(b^{1 + \lfloor C^* / \epsilon \rfloor})$ |
