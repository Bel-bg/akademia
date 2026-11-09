### 3.2.1 L'algorithme Hill Climbing (Ascension de colline)

L'algorithme de **Hill Climbing** (ou *ascension de colline*) est une méthode de recherche locale guidée par l'heuristique. Son principe consiste à progresser pas à pas dans la direction de la pente la plus favorable, à l'image d'un marcheur qui gravit une montagne dans le brouillard en choisissant systématiquement le pas qui monte le plus.

#### Déroulement formel en 5 étapes

```text
1. Considérer l'état de départ comme état courant ;
2. Générer les enfants (successeurs) de l'état courant ;
3. Évaluer les enfants à l'aide de l'heuristique et choisir le MEILLEUR enfant ;
4. Si le meilleur enfant est encore MEILLEUR que l'état courant :
       Avancer sur cet enfant (qui devient le nouvel état courant) ;
       Reprendre à l'étape 2 ;
5. Sinon (aucun enfant n'est meilleur) :
       Arrêt de l'algorithme.
```

---

### 3.2.2 Caractéristiques et limites majeures de Hill Climbing

:::attention Les faiblesses critiques de Hill Climbing
1. **Un seul chemin exploré** : Une fois qu'un enfant est choisi, tous les autres chemins alternatifs sont définitivement écartés.
2. **Optimum local** : L'algorithme s'arrête dès que les successeurs immédiats ne sont pas meilleurs que l'état courant. L'état final atteint est donc un **optimum local**, qui est très souvent loin d'être l'optimum global.
3. **Absence de retour en arrière** : On ne dispose d'aucun mécanisme de retour sur les décisions passées (*backtracking*).
4. **Non complet et non optimal** : La solution trouvée n'est pas garantie d'être optimale, et l'algorithme peut échouer à trouver une solution pourtant existante.
:::

#### Les trois pièges topologiques de Hill Climbing

```text
       Optimum global
           /\
          /  \                Optimum local
         /    \                   /\
        /      \   Plateau       /  \
       /        \___________    /    \
      /                     \  /      \
```

- **L'optimum local** : Un pic plus bas que la solution désirée mais entouré de voisins tous moins bons. L'algorithme s'y arrête prématurément.
- **Le plateau** : Une zone plate où tous les voisins ont la même valeur heuristique. L'algorithme n'a aucun repère pour choisir une direction.
- **La crête** : Une succession de pics étroits où la recherche peut osciller d'un côté à l'autre sans réussir à progresser le long de la crête.

---

### 3.2.3 La recherche gloutonne (Greedy Best-First Search)

La **recherche gloutonne** (ou *Best-First*) utilise une file de priorité pour explorer en premier le nœud qui semble le plus proche de l'objectif, en se basant **uniquement sur l'heuristique** :
$$f(n) = h(n)$$

À chaque itération :
1. Elle extrait de la frontière $Q$ le nœud ayant la plus petite valeur de $h(n)$ ;
2. Elle génère ses successeurs et les insère dans $Q$.

Contrairement à Hill Climbing, la recherche gloutonne conserve les chemins alternatifs dans sa file d'attente $Q$. Elle peut donc abandonner une branche devenue défavorable pour explorer un autre nœud prometteur. En revanche, comme elle ignore le coût déjà dépensé pour arriver au nœud, elle est **sensible aux faux départs et n'est pas optimale**.
