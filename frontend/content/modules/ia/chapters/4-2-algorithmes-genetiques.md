### 4.2.1 Principes fondamentaux des algorithmes génétiques

Les **algorithmes génétiques** (AG) appartiennent à la famille des métaheuristiques évolutionnaires. Conçus à l'origine par John Holland, ils s'inspirent des mécanismes biologiques de la **sélection naturelle** théorisée par Charles Darwin :
> Au fil des générations, les individus les mieux adaptés à leur environnement survivent et transmettent leurs caractéristiques génétiques avantageuses à leur descendance.

:::retenir Le vocabulaire génétique en IA
- **Gène** : Valeur élémentaire ou paramètre atomique de la solution.
- **Chromosome (ou Individu)** : Une solution candidate complète au problème, représentée sous la forme d'un vecteur (binaire, entier, permutation ou réel).
- **Population** : Ensemble de $N$ individus évoluant simultanément à une génération donnée.
- **Fonction Fitness (ou fonction d'adaptation)** : Mesure numérique qui évalue la performance ou la qualité d'une solution candidate. Plus le fitness d'un individu est élevé, plus ses chances d'être sélectionné pour se reproduire sont grandes.
:::

---

### 4.2.2 Le cycle de reproduction génétique

Une itération d'un algorithme génétique suit invariablement le cycle suivant :

1. **Initialisation** : Génération aléatoire d'une population initiale d'individus.
2. **Évaluation** : Calcul du score de fitness de chaque individu de la population.
3. **Sélection** : Choix des parents les plus aptes (par exemple via la **roulette biaisée** où la probabilité de sélection d'un individu $i$ est $p_i = \frac{\text{fitness}_i}{\sum_k \text{fitness}_k}$).
4. **Croisement (*Crossover*)** : Combinaison des chromosomes de deux parents pour créer un ou deux enfants possédant des traits mixtes.
5. **Mutation** : Modification aléatoire avec une faible probabilité $p_m$ d'un ou plusieurs gènes pour introduire de la diversité et éviter la convergence prématurée vers un optimum local.
6. **Remplacement et condition d'arrêt** : Remplacement de l'ancienne population et répétition jusqu'à atteindre un nombre maximal de générations ou une convergence du score.

---

### 4.2.3 Application 1 : Maximisation de $f(x) = x^2 + 1$ sur $[0, 31]$

#### 1. Encodage du chromosome
Comme $x \in [0, 31]$, l'espace des solutions contient $32 = 2^5$ valeurs entières. Chaque solution est naturellement encodée sous la forme d'une **chaîne binaire de 5 bits** :
- `00000` $\to x = 0$
- `01101` $\to x = 8 + 4 + 1 = 13$
- `11111` $\to x = 31$

#### 2. Calcul du fitness
Pour chaque individu $x$, la fonction fitness est directement :
$$\text{fitness}(x) = x^2 + 1$$
Exemple pour $x = 13$ : $\text{fitness}(13) = 13^2 + 1 = 169 + 1 = 170$.
Pour la solution optimale $x = 31$ : $\text{fitness}(31) = 31^2 + 1 = 961 + 1 = 962$.

#### 3. Croisement et mutation
- **Croisement en un point** : On choisit un point de coupure après le 2ᵉ bit :
  - Parent 1 : `01 | 101` ($x=13$)
  - Parent 2 : `11 | 000` ($x=24$)
  - Enfant 1 : `01 | 000` ($x=8$)
  - Enfant 2 : `11 | 101` ($x=29$) : cet enfant combine les bits forts de P2 et les bits faibles de P1, atteignant un fitness élevé de $29^2 + 1 = 842$ !
- **Mutation** : Inversion d'un bit aléatoire (`0` devient `1`, ou `1` devient `0`).

---

### 4.2.4 Application 2 : Le problème du voyageur de commerce (TSP)

#### Énoncé et matrice des distances
Le problème consiste à trouver le circuit le plus court reliant 5 villes sans visiter aucune ville plus d'une fois, avant de revenir à la ville de départ.

Matrice des distances en kilomètres :

| | Ville 1 | Ville 2 | Ville 3 | Ville 4 | Ville 5 |
|---|---|---|---|---|---|
| **Ville 1** | 0 | 2 | 6 | 12 | 5 |
| **Ville 2** | 2 | 0 | 4 | 8 | 1 |
| **Ville 3** | 6 | 4 | 0 | 3 | 3 |
| **Ville 4** | 12 | 8 | 3 | 0 | 10 |
| **Ville 5** | 5 | 1 | 3 | 10 | 0 |

#### 1. Encodage par vecteur de permutation
Comme chaque ville doit être visitée une et une seule fois, un encodage binaire classique risquerait de créer des villes en doublon ou des villes oubliées.
On utilise donc un **vecteur de permutation d'entiers** sans répétition, suivi du retour à la ville de départ.
Exemple : `1 3 4 5 2 1` représente l'itinéraire :
$$\text{Ville 1} \to \text{Ville 3} \to \text{Ville 4} \to \text{Ville 5} \to \text{Ville 2} \to \text{Ville 1}$$

#### 2. Calcul de la distance totale et de la fonction fitness
Calcul de la distance du chromosome `1 3 4 5 2 1` :
- $d(1, 3) = 6$ km
- $d(3, 4) = 3$ km
- $d(4, 5) = 10$ km
- $d(5, 2) = 1$ km
- $d(2, 1) = 2$ km
- **Distance totale** = $6 + 3 + 10 + 1 + 2 = 22$ km.

:::retenir Définition du fitness pour un problème de minimisation
Puisque le but est de **minimiser** la distance totale, la fonction fitness doit être inversement proportionnelle à cette distance :
$$\text{fitness} = \frac{1}{\text{Distance totale}} \quad \text{ou} \quad \text{fitness} = C - \text{Distance totale}$$
Ainsi, **plus la distance totale est courte, plus la fonction fitness de l'individu est élevée**, assurant sa transmission préférentielle aux générations futures.
:::
