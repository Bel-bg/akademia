### B.1 Rédiger la modélisation d'un espace d'états à l'examen

Dans toutes les épreuves d'IA (problème des cruches/bidons, des missionnaires/terroristes, du taquin, ou des pions), les correcteurs attendent une structure rigoureuse en 4 points :

1. **Représentation d'un état** :
   Définissez clairement les variables et leur domaine de validité.
   *Exemple pour les bidons* : « Un état est un couple $(x, y) \in \{0, 1, 2, 3, 4\} \times \{0, 1, 2, 3\}$ où $x$ est le volume dans le bidon 1 et $y$ le volume dans le bidon 2. »
2. **État initial et état(s) final(aux)** :
   Écrivez explicitement $s_0$ et l'ensemble $F$ ou le prédicat de test du but.
   *Exemple* : « $s_0 = (0, 0)$ ; But : tout état $(x, y)$ tel que $x = 2$. »
3. **Opérateurs de transition et préconditions** :
   Pour chaque action, donnez son nom, sa précondition (quand elle peut être déclenchée) et son effet (l'état obtenu).
4. **Contraintes d'intégrité** :
   Indiquez les états formellement rejetés par le problème (par exemple les états dangereux ou interdits).

---

### B.2 Dresser la table de trace d'exécution de A*

Pour obtenir l'intégralité des points lors du déroulement de l'algorithme A\* sur un graphe, organisez toujours votre réponse sous la forme d'un tableau à 7 colonnes :

| Itération | Nœud extrait $n$ | $g(n)$ | $h(n)$ | $f(n) = g + h$ | File d'attente $Q$ (triée par $f$ croissant) | Ensemble fermé $C$ |
|---|---|---|---|---|---|---|
| **0** | — | — | — | — | `[(S, f=11.0)]` | `[]` |
| **1** | $S$ | 0 | 11.0 | 11.0 | `[(A, f=12.4), (D, f=13.9)]` | `[S]` |
| **2** | $A$ | 2 | 10.4 | 12.4 | `[(B, f=9.7), (D, f=13.9)]` | `[S, A]` |

:::examen Les 3 réflexes indispensables pour A*
1. **Extraction** : On extrait toujours le premier nœud de $Q$ (celui ayant le plus petit $f$).
2. **Test du but** : On ne teste si un nœud est le but qu'au moment où il est **extrait** de $Q$, et non pas au moment où il est simplement généré dans les successeurs !
3. **Mise à jour / Réouverture** : Si un successeur est déjà dans $Q$ ou $C$ avec un coût $g$ plus élevé, on remplace son coût par la nouvelle valeur plus économique.
:::

---

### B.3 Méthode pour annoter un arbre Alpha-Bêta

Lorsqu'un sujet d'examen vous demande d'appliquer l'élagage Alpha-Bêta sur un arbre :

1. **Parcours en profondeur d'abord, de gauche à droite** :
   On propage les valeurs de $\alpha$ et $\beta$ du haut vers le bas.
   - À la racine : $\alpha = -\infty$ et $\beta = +\infty$.
2. **Aux feuilles** :
   On évalue la fonction d'utilité terminale et on renvoie la valeur numérique au père.
3. **À un nœud MAX** :
   - Pour chaque valeur $v$ reçue d'un enfant : $\alpha = \max(\alpha, v)$.
   - Si $\alpha \ge \beta$ : **coupure $\beta$** ! On ne visite pas les enfants suivants de ce nœud MAX.
   - La valeur renvoyée au père est $\alpha$.
4. **À un nœud MIN** :
   - Pour chaque valeur $v$ reçue d'un enfant : $\beta = \min(\beta, v)$.
   - Si $\beta \le \alpha$ : **coupure $\alpha$** ! On ne visite pas les enfants suivants de ce nœud MIN.
   - La valeur renvoyée au père est $\beta$.
5. **Indication sur la copie** :
   Barrez nettement la branche coupée avec deux traits obliques et écrivez explicitement à côté : « Coupure $\alpha$ car $\beta \le \alpha$ (valeurs : $\alpha = \dots, \beta = \dots$) ».
