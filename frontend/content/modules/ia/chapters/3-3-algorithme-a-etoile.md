### 3.3.1 Philosophie et formulation de A*

L'algorithme **A\*** (prononcé *A-star* ou *A-étoile*) est l'un des algorithmes les plus célèbres et les plus puissants de l'Intelligence Artificielle.
Il se positionne à la convergence entre la recherche en largeur d'abord (BFS) et la recherche heuristique :
- Dans A\*, les nouveaux nœuds ne sont pas simplement empilés ou enfilés : **ils sont fusionnés dans la file d'attente $Q$ de telle sorte que $Q$ reste ordonnée en permanence par ordre croissant d'une fonction d'évaluation $f$**.

:::retenir La formule fondamentale de A*
Pour tout état $n$, la fonction d'évaluation globale $f(n)$ décompose le coût d'un chemin en deux composantes :
$$f(n) = g(n) + h(n)$$
où :
- **$g(n)$** : le coût exact de la **partie déjà explorée** (somme des coûts des arcs depuis la racine jusqu'au nœud $n$) ;
- **$h(n)$** : l'estimation heuristique de la **partie future** pour atteindre le but à partir de $n$ ;
- **$f(n)$** : l'estimation du coût total du chemin complet passant par le nœud $n$.
:::

---

### 3.3.2 L'algorithme formel de A*

```text
Function Recherche-A*(Noeud-initial)
    Q = [Noeud-initial]
    C = []
    
    REPEAT
        n ← first(Q)
        Q ← rest(Q)
        
        // On traite n s'il n'a jamais été visité OU si on a trouvé un meilleur chemin pour l'atteindre
        IF ( (n ∉ C) OU (n ≡ n' ∈ C mais g(n) < g(n')) ) THEN
            
            IF (n est un noeud but) THEN
                RETURN n
            END IF
            
            Ajouter n à C
            S = succ(n)
            S = sort(S, f)          // Trie les successeurs selon f
            Q = merge(Q, S, f)      // Fusionne Q et S en conservant le tri croissant selon f
            
        END IF
    UNTIL Q = []
    
    RETURN ECHEC
```

:::retenir Théorème d'optimalité de A*
Si la fonction heuristique $h(n)$ est **admissible** (c'est-à-dire qu'elle ne surestime jamais le coût réel : $0 \le h(n) \le h^*(n)$), alors **l'algorithme A\* est garanti de trouver une solution optimale**.
De plus, A\* est **optimalement efficace** : aucun autre algorithme admissible guidé par la même heuristique ne peut explorer strictement moins de nœuds que A\*.
:::

---

### 3.3.3 Étude de cas réelle : De Linz à Ulm

Considérons le réseau routier extrait de l'énoncé de cours pour relier **Linz** à **Ulm**.
Les distances à vol d'oiseau par rapport à Ulm fournissent l'heuristique $h$ :

| Ville | Heuristique $h$ (vol d'oiseau à Ulm) |
|---|---|
| **Linz** | 318 |
| **Passau** | 257 |
| **Salzburg** | 236 |
| **München** | 120 |
| **Rosenheim** | 168 |
| **Memmingen** | 47 |
| **Stuttgart** | 75 |
| **Nürnberg** | 132 |
| **Ulm** | **0** |

#### Comparaison entre Hill Climbing et A*
- **Avec Hill Climbing** :
  Depuis Linz ($h=318$), les voisins immédiats sont évalués. Passau a $h=257$ et Salzburg a $h=236$. Hill Climbing choisit aveuglément Salzburg (meilleur $h$). De Salzburg, il avance vers München ($h=120$). Hill Climbing ne peut jamais reconsidérer d'autres routes si un embranchement semblait localement moins bon.
- **Avec A\*** :
  À chaque étape, A\* calcule $f(n) = g(n) + h(n)$. Si un détour court sur la carte présente un coût accumulé $g(n)$ trop élevé, sa valeur $f(n)$ augmente et A\* réoriente naturellement son exploration vers les branches plus économiques.
  Le chemin optimal Linz $\to$ Passau ou Salzburg $\to$ München $\to$ Memmingen $\to$ Ulm est garanti d'être identifié.
