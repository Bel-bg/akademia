### 1.2.1 Problème 1 : Les Tours de Hanoï

Le problème des Tours de Hanoï est le cas d'école emblématique de l'Intelligence Artificielle pour illustrer la modélisation formelle d'un espace d'états.

#### Énoncé
On dispose de trois tours verticales numérotées 1, 2 et 3. Sur la tour 1 reposent deux disques : un petit (numéroté 1) et un grand (numéroté 2). On demande de déplacer les disques vers une autre tour de façon qu'un disque repose toujours sur un disque de taille supérieure ou sur une tour libre.

```text
Tour 1          Tour 2          Tour 3
  [1]             |               |
 [ 2 ]            |               |
=======         =======         =======
```

#### Modélisation formelle
1. **Description d'un état** : Un état est décrit par un triplet $(A, B, C)$ où $A, B, C$ sont respectivement les ensembles de disques situés sur la tour 1, la tour 2 et la tour 3.
2. **État initial** : $E_0 = (\{1, 2\}, \emptyset, \emptyset)$
3. **États finaux** : Comme la consigne ne spécifie pas vers quelle tour libre amener les disques, il existe deux états solutions :
   - $E_{f2} = (\emptyset, \{1, 2\}, \emptyset)$
   - $E_{f3} = (\emptyset, \emptyset, \{1, 2\})$
4. **Ensemble des opérateurs acceptables** :
   $$M = \{m_{ij} \mid i \in \{1, 2, 3\}, j \in \{1, 2, 3\}, i \neq j\}$$
   où $m_{ij}$ désigne le déplacement du disque situé au sommet de la tour $i$ vers le sommet de la tour $j$, sous condition que la règle de taille soit respectée.

:::retenir Inversibilité des opérateurs
Dans cet espace d'états, les opérateurs admettent des **inverses**. Par exemple :
- Dans l'état initial $E_0 = (\{1, 2\}, \emptyset, \emptyset)$, seuls $m_{12}$ et $m_{13}$ sont applicables (on ne peut bouger que le sommet, le disque 1).
- Si on applique $m_{12}$, l'état résultant est $E_1 = (\{2\}, \{1\}, \emptyset)$.
- L'opérateur inverse $m_{21}$ appliqué à $E_1$ ramène exactement à l'état initial $E_0$.
:::

---

### 1.2.2 Problème 2 : Trois touristes et trois terroristes

#### Énoncé
Trois touristes ($T$) et trois terroristes ($X$) sont sur la rive gauche d'une rivière qu'ils doivent traverser pour rejoindre la rive droite. Ils disposent d'une barque pouvant transporter au maximum **deux personnes** et au minimum **une personne** pour la manœuvrer.

**Contrainte vitale** : Si le nombre de terroristes dépasse strictement celui des touristes sur une rive (rive gauche ou rive droite), les touristes de cette rive seront immédiatement tués (sauf s'il n'y a aucun touriste sur cette rive, auquel cas il n'y a aucun danger).

#### Modélisation formelle
- **Représentation d'un état** : Un triplet $(T_g, X_g, B)$ où :
  - $T_g \in \{0, 1, 2, 3\}$ : nombre de touristes sur la rive gauche ;
  - $X_g \in \{0, 1, 2, 3\}$ : nombre de terroristes sur la rive gauche ;
  - $B \in \{G, D\}$ : position actuelle de la barque ($G$ = rive gauche, $D$ = rive droite).
  *(Le nombre de personnes sur la rive droite s'en déduit par $T_d = 3 - T_g$ et $X_d = 3 - X_g$).*
- **Contrainte de sécurité** : Un état est valide si et seulement si :
  $$(T_g = 0 \text{ ou } T_g \ge X_g) \quad \text{ET} \quad (T_d = 0 \text{ ou } T_d \ge X_d)$$
- **État initial** : $s_0 = (3, 3, G)$ (tout le monde et la barque sur la rive gauche).
- **État final** : $s_{but} = (0, 0, D)$ (tout le monde et la barque sur la rive droite).
- **Opérateurs de déplacement** : Transférer $(\Delta T, \Delta X)$ personnes avec $\Delta T + \Delta X \in \{1, 2\}$.

:::exemple Chemin solution optimal (11 traversées)
1. $(3, 3, G) \xrightarrow{2X} (3, 1, D)$
2. $(3, 1, D) \xrightarrow{1X} (3, 2, G)$
3. $(3, 2, G) \xrightarrow{2X} (3, 0, D)$
4. $(3, 0, D) \xrightarrow{1X} (3, 1, G)$
5. $(3, 1, G) \xrightarrow{2T} (1, 1, D)$
6. $(1, 1, D) \xrightarrow{1T + 1X} (2, 2, G)$
7. $(2, 2, G) \xrightarrow{2T} (0, 2, D)$
8. $(0, 2, D) \xrightarrow{1X} (0, 3, G)$
9. $(0, 3, G) \xrightarrow{2X} (0, 1, D)$
10. $(0, 1, D) \xrightarrow{1X} (0, 2, G)$
11. $(0, 2, G) \xrightarrow{2X} (0, 0, D)$ : **But atteint !**
:::

---

### 1.2.3 Problème 3 : Les deux bidons d'eau (4L et 3L)

#### Énoncé
On dispose de deux bidons sans graduation :
- Le bidon 1 a une capacité maximale de 4 litres ;
- Le bidon 2 a une capacité maximale de 3 litres.
L'objectif est d'obtenir **exactement 2 litres dans le bidon 1**.

#### Modélisation formelle
- **État** : Un couple $(x, y)$ où $x \in \{0, 1, 2, 3, 4\}$ représente le volume d'eau dans le bidon 1, et $y \in \{0, 1, 2, 3\}$ le volume d'eau dans le bidon 2.
- **État initial** : $(0, 0)$ (deux bidons vides).
- **État but** : Tout état $(2, y)$ avec $y \in \{0, 1, 2, 3\}$.
- **Les 8 opérations acceptables** :
  1. `Remplir 1` : $(x, y) \to (4, y)$ si $x < 4$
  2. `Remplir 2` : $(x, y) \to (x, 3)$ si $y < 3$
  3. `Vider 1` : $(x, y) \to (0, y)$ si $x > 0$
  4. `Vider 2` : $(x, y) \to (x, 0)$ si $y > 0$
  5. `Verser 1 dans 2 jusqu'à vider 1` : $(x, y) \to (0, x+y)$ si $x+y \le 3$
  6. `Verser 2 dans 1 jusqu'à vider 2` : $(x, y) \to (x+y, 0)$ si $x+y \le 4$
  7. `Compléter 1 à partir de 2` : $(x, y) \to (4, y - (4 - x))$ si $x+y \ge 4$ et $y > 0$
  8. `Compléter 2 à partir de 1` : $(x, y) \to (x - (3 - y), 3)$ si $x+y \ge 3$ et $x > 0$

:::exemple Résolution pas à pas
$$(0, 0) \xrightarrow{R2} (0, 3) \xrightarrow{V2\to 1} (3, 0) \xrightarrow{R2} (3, 3) \xrightarrow{C1\leftarrow 2} (4, 2) \xrightarrow{V1} (0, 2) \xrightarrow{V2\to 1} (2, 0)$$
Le bidon 1 contient bien 2 litres.
:::

---

### 1.2.4 Problème 4 : Le monde des 4 pions (A, B, C, D)

#### Énoncé
Quatre pions non superposables $A, B, C, D$ sont disposés sur 4 positions alignées $1, 2, 3, 4$.
- **Contrainte physique** : Le pion $A$ **ne peut jamais être plus à droite que le pion $D$** (autrement dit, la position de $A$ doit toujours être strictement inférieure à celle de $D$ dans l'ordre d'alignement).
- **Exemples** : `ABCD` et `CBAD` sont des configurations légales. En revanche, `DCBA` et `CDAB` sont interdites.
- **Actions autorisées** : Seules 3 actions d'échange sont permises :
  - $echange(1, 2)$ : permute les pions en position 1 et 2 ;
  - $echange(2, 3)$ : permute les pions en position 2 et 3 ;
  - $echange(2, 4)$ : permute les pions en position 2 et 4.
- Une action ne génère un successeur **que si l'état atteint respecte la contrainte d'ordre** entre $A$ et $D$.

---

### 1.2.5 Problème 5 : Coloration de carte de pays (CSP)

#### Énoncé
On dispose de 3 couleurs distinctes (par exemple Rouge, Vert, Bleu). On souhaite colorier une carte comportant 5 pays $P_1, P_2, P_3, P_4, P_5$ tels que deux pays adjacents (partageant une frontière) n'aient jamais la même couleur.
- **État initial** : Tous les pays sont non coloriés : $(\emptyset, \emptyset, \emptyset, \emptyset, \emptyset)$.
- **Opérateur** : Assigner une couleur autorisée au pays suivant dans l'ordre d'affectation sans créer de conflit avec les pays voisins déjà coloriés.
- **État final (But)** : Les 5 pays ont une couleur assignée et aucune frontière n'est en conflit.

---

### 1.2.6 Problème 6 : Le jeu de Taquin (8-Puzzle)

Le taquin classique à 8 plaquettes comporte une grille $3 \times 3$ contenant les nombres de 1 à 8 et une case vide.

#### Actions
Les mouvements sont formellement modélisés comme le déplacement de la **case vide** dans les 4 directions cardinales : *Haut*, *Bas*, *Gauche*, *Droite*.

:::retenir Calcul du facteur de branchement moyen ($b$)
Le facteur de branchement dépend de la position de la case vide dans la grille $3 \times 3$ :
- Si la case vide est dans un **coin** (4 positions possibles) : **2 actions possibles** (par exemple en haut à gauche : uniquement Droite et Bas).
- Si la case vide est sur un **bord non-coin** (4 positions possibles) : **3 actions possibles**.
- Si la case vide est au **centre** (1 position possible) : **4 actions possibles**.

Le **facteur de branchement moyen** $b_{moyen}$ de l'arbre de jeu est donc :
$$b_{moyen} = \frac{(4 \times 2) + (4 \times 3) + (1 \times 4)}{9} = \frac{8 + 12 + 4}{9} = \frac{24}{9} \approx 2{,}67$$
:::
