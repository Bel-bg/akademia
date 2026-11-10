## 2.3.1 Le principe du résumé de routes

Un routeur au cœur d'un grand réseau peut devoir connaître des centaines de sous-réseaux. Le **résumé de routes** (agrégation, *route summarization*, « sommarisation ») remplace **plusieurs routes contiguës par une seule** qui les couvre toutes. Avantages : tables de routage plus petites, recherches plus rapides, convergence plus stable (un sous-réseau qui tombe ne provoque pas de mise à jour ailleurs).

> **Résumer = trouver le plus long préfixe commun, en binaire, à toutes les adresses réseau.**

C'est exactement ce qu'on vous demande lorsque l'énoncé dit « quel masque permet de mettre ensemble ces plages d'adresses ? ».

## 2.3.2 La méthode en 4 étapes

1. **Écrire** les adresses réseau à résumer en binaire (seul l'octet où elles diffèrent compte).
2. **Compter** les bits communs de gauche à droite, jusqu'au premier bit qui diffère.
3. **Construire** le préfixe : nombre total de bits communs, puis adresse = valeurs communes + zéros.
4. **Vérifier** que la route résumée ne contient pas d'adresses étrangères (couverture exacte).

:::exemple Quatre réseaux contigus
Réseaux : `192.168.0.0/24`, `192.168.1.0/24`, `192.168.2.0/24`, `192.168.3.0/24`. Le 3e octet vaut 0, 1, 2, 3 :

```text
0 = 00000000
1 = 00000001
2 = 00000010
3 = 00000011
      ------  6 bits communs (000000)
```

Bits communs : 16 (2 premiers octets) + 6 = **22**. Route résumée : **192.168.0.0/22**, soit les adresses 192.168.0.0 à 192.168.3.255 : couverture exacte.
:::

:::exemple Les quatre réseaux de l'examen : 10.0.0.0/23, 10.0.2.0/23, 10.0.4.0/23, 10.0.6.0/23
Le 3e octet vaut 0, 2, 4, 6 (`00000000`, `00000010`, `00000100`, `00000110`) : les 5 premiers bits sont communs. Total : 16 + 5 = **21**. Résumé : **10.0.0.0/21** (10.0.0.0 à 10.0.7.255), soit 4 × 512 adresses, couverture exacte.
:::

## 2.3.3 Deux méthodes rapides

**Méthode « taille du bloc »** : si on a `N` réseaux contigus de taille `T`, la route résumée a pour taille `N × T` (si N est une puissance de 2 et que le premier réseau est **aligné** sur cette taille). Les 4 réseaux /24 : 4 × 256 = 1024 = /22.

**Méthode « première et dernière »** : pour une plage `première - dernière`, on cherche le plus grand bloc aligné qui commence à la première adresse et ne dépasse pas la dernière. Exemple : plage `10.0.0.0 - 10.3.255.255` : taille = 4 × 65 536 = 262 144 = 2¹⁸ adresses, soit un **/14** (255.252.0.0).

## 2.3.4 Quand le résumé parfait est impossible

Deux conditions pour un résumé **exact** :

- le nombre de réseaux est une **puissance de 2** (2, 4, 8…),
- le **premier réseau est aligné** sur la taille du bloc résumé.

:::exemple Les réseaux 192.168.1.0/24 et 192.168.2.0/24
Les valeurs du 3e octet : `00000001` et `00000010` ; elles ne partagent que les **6 premiers bits** (`000000`) et diffèrent aux deux derniers : un `/23` ne peut pas les contenir, car 1 n'est pas aligné sur 2. Le plus petit résumé unique qui couvre les deux est `192.168.0.0/22`, qui contient **aussi 192.168.0.0/24 et 192.168.3.0/24** : ce sont des adresses « étrangères » au plan. Solutions : garder **deux routes** distinctes, ou renuméroter pour regrouper (par exemple 192.168.2.0 et 192.168.3.0 → `192.168.2.0/23`).
:::

## 2.3.5 Les risques du résumé

- **Trou noir** (*black hole*) : le résumé annonce des adresses qui n'existent pas ; les paquets pour elles sont attirés puis perdus. On évite cela avec une **route nulle** (`Null0`) vers le résumé et en gardant les routes précises plus spécifiques (le plus long préfixe l'emporte).
- **Boucle de routage** : un résumé trop large annoncé dans les deux sens peut renvoyer les paquets d'un routeur à l'autre jusqu'à expiration du TTL.
- **Sous-optimalité** : un routeur qui ne connaît que le résumé ne peut plus choisir le meilleur chemin vers chaque sous-réseau.

## 2.3.6 Résumé et table de routage : exemple Cisco

```text
! Au lieu de 4 routes :
ip route 10.0.0.0 255.255.254.0 1.1.1.14
ip route 10.0.2.0 255.255.254.0 1.1.1.14
ip route 10.0.4.0 255.255.254.0 1.1.1.14
ip route 10.0.6.0 255.255.254.0 1.1.1.14
! on écrit une seule route résumée :
ip route 10.0.0.0 255.255.248.0 1.1.1.14
```

:::retenir À retenir
Résumer = préfixe commun. N réseaux de taille T alignés → bloc de taille N × T. Vérifier la couverture exacte, sinon créer des trous noirs. Le plus long préfixe l'emporte toujours : on peut garder des routes spécifiques à côté d'un résumé.
:::

:::examen Ce qui tombe à l'examen
Question type : « Quel masque (décimal et /n) permet de mettre ensemble les plages 192.168.0.0 - 192.168.63.255 ? » Réponse en 20 secondes : taille = 64 × 256 = 16 384 = 2¹⁴ adresses → 14 bits hôte → **/18**, soit 255.255.192.0.
:::

## 2.3.7 Exercices corrigés

**Exercice 1.** Résumez `172.16.16.0/24`, `172.16.17.0/24`, `172.16.18.0/24`, `172.16.19.0/24`.

<details>
<summary>Voir le corrigé</summary>

3e octet : 16, 17, 18, 19 (`00010000` à `00010011`), 6 bits communs. 16 + 6 = 22. Résumé : **172.16.16.0/22**.

</details>

**Exercice 2.** Quel masque couvre la plage `192.168.0.0 - 192.168.63.255` ?

<details>
<summary>Voir le corrigé</summary>

Taille = 64 × 256 = 2¹⁴. Bits hôte = 14, donc **/18** = **255.255.192.0**.

</details>

**Exercice 3.** Quel masque couvre `10.0.0.0 - 10.3.255.255` ?

<details>
<summary>Voir le corrigé</summary>

4 × 65 536 = 2¹⁸ adresses, bits hôte = 18, **/14** = **255.252.0.0**.

</details>

**Exercice 4.** Quel masque couvre `192.168.0.0 - 192.168.0.63` ?

<details>
<summary>Voir le corrigé</summary>

64 adresses = 2⁶, **/26** = **255.255.255.192**.

</details>

**Exercice 5.** Quel masque couvre `1.0.0.0 - 1.0.7.255` ?

<details>
<summary>Voir le corrigé</summary>

8 × 256 = 2¹¹ adresses, bits hôte = 11, **/21** = **255.255.248.0**.

</details>

**Exercice 6.** Peut-on résumer parfaitement `192.168.4.0/24` à `192.168.7.0/24` ? et `192.168.5.0/24` à `192.168.8.0/24` ?

<details>
<summary>Voir le corrigé</summary>

Premier cas : oui, 4 réseaux, 4 est un multiple de 4 → **192.168.4.0/22**. Second cas : non, 5 n'est pas aligné sur 4 ; le plus petit résumé couvrant serait `192.168.0.0/20` (trop large) : on garde plusieurs routes.

</details>

**Exercice 7.** Pourquoi ajouter une route `Null0` avec un résumé ?

<details>
<summary>Voir le corrigé</summary>

Pour éviter qu'un paquet destiné à une adresse du résumé non utilisée ne soit renvoyé en boucle vers la route par défaut : la route nulle **jette** proprement ces paquets (les routes plus spécifiques existantes continuent de l'emporter).

</details>

**Exercice 8.** Résumez en une route : `10.8.0.0/16` à `10.15.0.0/16`.

<details>
<summary>Voir le corrigé</summary>

2e octet de 8 à 15 : `00001000` à `00001111`, 5 bits communs. 8 + 5 = 13. Résumé : **10.8.0.0/13** (255.248.0.0).

</details>
