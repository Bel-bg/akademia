### 2.2.1 Principe d'exploration

L'algorithme de **recherche en profondeur d'abord** (*Depth First Search*, **DFS**) explore en priorité un chemin le plus profondément possible dans l'arbre de recherche.
- Tant qu'un nœud possède des successeurs inexplorés, DFS descend vers le premier enfant.
- Si le chemin courant aboutit à une impasse (un nœud sans successeur qui n'est pas le but), l'algorithme remonte d'un niveau (**retour arrière** ou *backtracking*) et explore le chemin alternatif suivant en profondeur.

```text
              A (1)
            /       \
         B (2)      C (8)
        /     \     /   \
      D (3)   E(6) F(9) G(10)
      /   \     \
    H(4)  I(5)  J(7)
```
*(Ordre typique de visite en DFS : A, puis B, D, H, I, E, J, puis enfin C, F, G).*

---

### 2.2.2 Algorithme formel de DFS

La file $Q$ fonctionne selon une logique de **pile (LIFO - Last In, First Out)** : les successeurs découverts sont insérés **en tête de file** via `append(S, Q)`.

```text
Function Recherche-DFS(Noeud-initial)
    Q = [Noeud-initial]
    REPEAT
        n ← first(Q)
        Q ← rest(Q)
        
        IF (n est un noeud but) THEN
            RETURN n
        END IF
        
        S = succ(n)         // Génère les successeurs de n
        Q = append(S, Q)    // Insère S au DEBUT de Q (pile LIFO)
    UNTIL Q = []
    
    RETURN ECHEC
```

:::attention Contrainte pour les graphes quelconques
Pour un graphe quelconque pouvant comporter des cycles, il faut impérativement ajouter la contrainte suivante :
> **Si un état a déjà été exploré auparavant (présent dans $C$), on ne l'explore plus.**

Même si plusieurs chemins mènent à un même état, cet état ne doit être développé qu'une seule fois, sous peine d'enfermer DFS dans une boucle infinie.
:::

---

### 2.2.3 Analyse des critères de performance

:::retenir Forces et faiblesses de DFS
- **Complexité en espace : $O(b \cdot m)$**
  C'est le **grand avantage** de DFS. À chaque instant, DFS ne mémorise que le chemin reliant la racine au nœud courant et les frères non encore explorés le long de ce chemin. La consommation mémoire est linéaire par rapport à la profondeur maximale.
- **Complexité en temps : $O(b^m)$**
  Dans le pire des cas, DFS peut visiter l'ensemble des branches avant d'atteindre la solution.
- **Complétude : NON garantie** dans le cas général
  DFS peut s'enfermer indéfiniment le long d'une branche infinie ou d'un cycle si aucune vérification d'état n'est effectuée.
- **Optimalité : NON**
  DFS retourne la première solution rencontrée sur son parcours en profondeur. Celle-ci peut se trouver à une profondeur très élevée avec un coût exorbitant, alors qu'une solution optimale existait à faible profondeur sur une autre branche.
:::
