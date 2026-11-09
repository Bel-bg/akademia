### 3.1.1 Définition et rôle de l'heuristique

Le mot **heuristique** provient du grec ancien *heuriskein*, qui signifie « découvrir » ou « trouver ».

Contrairement à la recherche aveugle qui avance sans idée de la distance qui la sépare du but, la **recherche heuristique** utilise des informations supplémentaires spécifiques au domaine du problème pour prioriser les chemins les plus prometteurs.

:::retenir Définition formelle de la fonction heuristique
Une fonction heuristique est une application :
$$h : E \to \mathbb{R}$$
où :
- $E$ est l'espace d'états ;
- $\mathbb{R}$ est l'ensemble des nombres réels.

Elle associe à chaque état $n$ une estimation chiffrée de son attractivité. Il existe deux types d'estimations :
1. **L'estimation de coût** : $h(n)$ estime le coût restant pour atteindre le but à partir de l'état $n$. L'objectif est alors de **minimiser** la valeur (choisir le coût le plus faible).
2. **L'estimation de mérite** : $h(n)$ estime l'adéquation ou le gain apporté par l'état. L'objectif est alors de **maximiser** la valeur (choisir le mérite le plus haut).
:::

---

### 3.1.2 Exemple emblématique : Heuristiques pour le jeu de Taquin (8-Puzzle)

Considérons une configuration du Taquin où l'on cherche à passer d'un état initial à l'état but :

```text
État initial :             État but :
+---+---+---+             +---+---+---+
| 5 |   | 8 |             | 1 | 2 | 3 |
+---+---+---+             +---+---+---+
| 4 | 2 | 1 |             | 4 | 5 | 6 |
+---+---+---+             +---+---+---+
| 7 | 3 | 6 |             | 7 | 8 |   |
+---+---+---+             +---+---+---+
```

Deux fonctions heuristiques classiques sont définies pour ce problème :

#### 1. L'heuristique $h_1$ : Nombre de plaquettes mal placées
On compte le nombre de plaquettes (hors case vide) qui ne sont pas à leur position finale.
- Dans l'état initial ci-dessus, les plaquettes mal placées sont : 5, 8, 2, 1, 3, 6 (seules 4 et 7 sont bien placées).
- **$h_1 = 6$**.

#### 2. L'heuristique $h_2$ : Somme des distances « Manhattan »
Pour chaque plaquette $i \in \{1, \dots, 8\}$, on calcule la distance de Manhattan entre sa coordonnée courante $(x_i, y_i)$ et sa coordonnée cible $(x_i^*, y_i^*)$ :
$$\text{dist}_M(i) = |x_i - x_i^*| + |y_i - y_i^*|$$
Calcul détaillé pour chaque plaquette :
- Plaquette 1 : distance = 3
- Plaquette 2 : distance = 1
- Plaquette 3 : distance = 3
- Plaquette 4 : distance = 0 (déjà bien placée)
- Plaquette 5 : distance = 2
- Plaquette 6 : distance = 1
- Plaquette 7 : distance = 0 (déjà bien placée)
- Plaquette 8 : distance = 3
- **Total $h_2 = 3 + 1 + 3 + 0 + 2 + 1 + 0 + 3 = 13$**.

---

### 3.1.3 Notion d'admissibilité d'une heuristique

:::retenir Critère fondamental d'admissibilité
Soit $h^*(n)$ le **coût réel minimal** pour atteindre un état but depuis l'état $n$.

Une fonction heuristique $h$ est dite **admissible** si pour tout état $n$ :
$$0 \le h(n) \le h^*(n)$$
Autrement dit, **une heuristique admissible est optimiste : elle ne surestime jamais le coût réel restant pour atteindre le but**.
Pour l'état but $n_{but}$, on a toujours $h(n_{but}) = 0$.
:::

#### Pourquoi $h_1$ et $h_2$ sont-elles admissibles pour le Taquin ?
- **Pour $h_1$** : Chaque plaquette mal placée nécessite **au minimum un déplacement** pour regagner sa place. Donc le coût réel $h^*(n)$ sera au moins égal à $h_1(n)$ : $h_1(n) \le h^*(n)$.
- **Pour $h_2$** : Chaque plaquette nécessite au minimum autant de mouvements que sa distance de Manhattan (dans le cas idéal où aucune autre pièce ne lui barre la route). Comme les pièces se bloquent mutuellement dans la réalité, le nombre réel de mouvements est toujours supérieur ou égal à la somme des distances de Manhattan : $h_2(n) \le h^*(n)$.

#### Notion de dominance entre heuristiques
Si pour tout état $n$, on a :
$$h_2(n) \ge h_1(n)$$
on dit que **$h_2$ domine $h_1$**.
Comme $h_2$ est plus proche du coût réel $h^*$ tout en restant admissible, un algorithme comme $A^*$ guidé par $h_2$ développera **moins ou autant de nœuds** qu'avec $h_1$. $h_2$ est donc une heuristique plus informée et plus performante.
