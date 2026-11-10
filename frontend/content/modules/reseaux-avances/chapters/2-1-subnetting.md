## 2.1.1 Pourquoi découper un réseau ?

Un grand réseau unique pose trois problèmes : trop de **diffusions** (broadcast) qui ralentissent tout le monde, aucune **séparation** entre services (comptabilité, invités, serveurs), et un **gaspillage** d'adresses. Le **subnetting** consiste à découper un bloc d'adresses en plusieurs **sous-réseaux** plus petits, chacun avec sa propre adresse réseau, son masque et sa passerelle.

> **Subnetter = emprunter des bits à la partie hôte pour les ajouter à la partie réseau.**

Si on emprunte `s` bits, on obtient **2^s sous-réseaux** ; il reste `h = 32 − n − s` bits pour les hôtes, soit **2^h − 2** hôtes utilisables par sous-réseau.

## 2.1.2 La méthode universelle en 5 étapes

1. **Identifier le bloc de départ** : adresse et masque (ex. `192.168.10.0/24`).
2. **Déterminer le besoin** : nombre de sous-réseaux **ou** nombre d'hôtes par sous-réseau.
3. **Calculer les bits** : `2^s ≥ nombre de sous-réseaux`, ou `2^h − 2 ≥ nombre d'hôtes`.
4. **Écrire le nouveau masque** (`/n + s`) et le **pas** : taille du bloc = `256 − valeur du masque` dans l'octet concerné.
5. **Lister les sous-réseaux** : réseau, première et dernière adresse utilisable, diffusion.

## 2.1.3 Découper selon le nombre de sous-réseaux

:::exemple 4 sous-réseaux dans 192.168.10.0/24
4 sous-réseaux : 2^s ≥ 4 donc s = 2. Nouveau masque : /24 + 2 = **/26** (255.255.255.192). Pas : 256 − 192 = **64**. Hôtes par sous-réseau : 2⁶ − 2 = **62**.

| Sous-réseau | Réseau | Plage utilisable | Diffusion |
|---|---|---|---|
| 1 | 192.168.10.0/26 | .1 à .62 | 192.168.10.63 |
| 2 | 192.168.10.64/26 | .65 à .126 | 192.168.10.127 |
| 3 | 192.168.10.128/26 | .129 à .190 | 192.168.10.191 |
| 4 | 192.168.10.192/26 | .193 à .254 | 192.168.10.255 |
:::

:::exemple 50 sous-réseaux dans 172.16.0.0/16
2^s ≥ 50 donne s = 6 (64 sous-réseaux). Masque /16 + 6 = **/22** = 255.255.252.0. Le changement se produit dans le **3e octet**, pas = 256 − 252 = **4**. Sous-réseaux : 172.16.0.0, 172.16.4.0, 172.16.8.0… Hôtes : 2¹⁰ − 2 = **1 022** par sous-réseau.
:::

### Quand on « traverse » un octet

Si le nouveau masque dépasse le 3e octet (ex. `/18` à partir de `10.0.0.0/8`, soit 10 bits empruntés = 1 024 sous-réseaux), on raisonne dans **l'octet où la frontière tombe** : /18 = 255.255.**192**.0, pas = 64 dans le 3e octet. Sous-réseaux : `10.0.0.0/18`, `10.0.64.0/18`, `10.0.128.0/18`, `10.0.192.0/18`, puis `10.1.0.0/18`… Chaque sous-réseau contient 2¹⁴ − 2 = **16 382** hôtes.

## 2.1.4 Découper selon le nombre d'hôtes

On cherche le **plus petit** `h` tel que `2^h − 2 ≥ hôtes`. Rappel : il faut compter la **passerelle** parmi les hôtes.

| Hôtes nécessaires | Bits hôte h | Masque | Hôtes réels |
|---|---|---|---|
| jusqu'à 2 | 2 | /30 | 2 |
| jusqu'à 6 | 3 | /29 | 6 |
| jusqu'à 14 | 4 | /28 | 14 |
| jusqu'à 30 | 5 | /27 | 30 |
| jusqu'à 62 | 6 | /26 | 62 |
| jusqu'à 126 | 7 | /25 | 126 |
| jusqu'à 254 | 8 | /24 | 254 |
| jusqu'à 510 | 9 | /23 | 510 |
| jusqu'à 1 022 | 10 | /22 | 1 022 |

:::exemple 5 services de 25 postes dans 192.168.20.0/24
25 postes + 1 passerelle = 26 adresses utilisables nécessaires : 2⁵ − 2 = 30 ≥ 26, donc h = 5 et masque **/27**. Cela donne 8 sous-réseaux possibles (3 bits empruntés), on en utilise 5 : `192.168.20.0/27`, `.32/27`, `.64/27`, `.96/27`, `.128/27`. Les trois derniers (.160, .192, .224) restent libres pour l'avenir.
:::

### La fenêtre de solutions

Quand on a **deux contraintes** (au moins X sous-réseaux **et** au moins Y hôtes), il faut `s ≥ log₂(X)` **et** `h ≥ log₂(Y + 2)`, avec `s + h ≤ 32 − n`. Il peut y avoir plusieurs masques possibles (une « fenêtre ») : on choisit en général celui qui laisse de la marge de croissance du côté le plus incertain.

## 2.1.5 Savoir dans quel sous-réseau se trouve une adresse

1. Écrire le masque et repérer **l'octet critique** (le premier qui n'est ni 255 ni 0).
2. Calculer le **pas** = 256 − valeur du masque.
3. L'adresse du réseau est le **plus grand multiple du pas inférieur ou égal** à la valeur de l'octet.

Exemple : `10.0.38.1/23`. /23 = 255.255.254.0, octet critique = 3e, pas = 2. Le plus grand multiple de 2 ≤ 38 est 38 : réseau `10.0.38.0/23`, diffusion `10.0.39.255`.

:::retenir Le tableau à savoir recalculer en 5 secondes
Un `/n` qui tombe dans le 4e octet : pas = 2^(32 − n). Dans le 3e octet : pas = 2^(24 − n) dans cet octet. Dans le 2e octet : pas = 2^(16 − n). La diffusion est toujours « réseau suivant − 1 ».
:::

:::attention Les erreurs de masque les plus fréquentes
Oublier de retirer 2 (réseau + diffusion) ; confondre `/26` (pas 64) et `/27` (pas 32) ; donner une adresse de réseau ou de diffusion à une machine ; configurer deux machines du même LAN avec des masques différents ; mettre une passerelle **hors** du sous-réseau.
:::

:::examen Ce qui tombe à l'examen
« Donnez le masque qui regroupe cette plage », « donnez les adresses de réseau et de diffusion de... », « découpez ce réseau en N sous-réseaux », « combien d'hôtes par sous-réseau ». Toujours poser les **blocs** en colonne avant de répondre.
:::

## 2.1.6 Exercices corrigés

**Exercice 1.** Découpez `192.168.5.0/24` en 8 sous-réseaux. Donnez le masque, le pas et les 3 premiers sous-réseaux.

<details>
<summary>Voir le corrigé</summary>

2^s ≥ 8 donne s = 3, masque **/27** (255.255.255.224), pas 32, 30 hôtes. Sous-réseaux : `192.168.5.0/27`, `192.168.5.32/27`, `192.168.5.64/27`...

</details>

**Exercice 2.** Quel masque pour 100 hôtes ? Pour 500 hôtes ?

<details>
<summary>Voir le corrigé</summary>

100 hôtes : 2⁷ − 2 = 126 ≥ 100, **/25**. 500 hôtes : 2⁹ − 2 = 510 ≥ 500, **/23**.

</details>

**Exercice 3.** Donnez réseau, diffusion et plage utilisable de `192.168.1.165/25`.

<details>
<summary>Voir le corrigé</summary>

/25 : pas 128, 165 dans 128-255. Réseau **192.168.1.128**, diffusion **192.168.1.255**, plage 192.168.1.129 à 192.168.1.254.

</details>

**Exercice 4.** Donnez réseau et diffusion de `10.0.0.1/20`.

<details>
<summary>Voir le corrigé</summary>

/20 = 255.255.240.0, pas 16 dans le 3e octet. 0 est dans le bloc 0-15 : réseau **10.0.0.0**, diffusion **10.0.15.255**.

</details>

**Exercice 5.** Combien de sous-réseaux et d'hôtes si l'on passe `172.20.0.0/16` en `/21` ?

<details>
<summary>Voir le corrigé</summary>

5 bits empruntés : 2⁵ = **32 sous-réseaux**. 11 bits hôte : 2¹¹ − 2 = **2 046 hôtes** par sous-réseau. Pas : 256 − 248 = 8 dans le 3e octet.

</details>

**Exercice 6.** Un PC a l'adresse `192.168.4.130/26`. Quelle est son adresse réseau, et la passerelle `192.168.4.100` est-elle valide ?

<details>
<summary>Voir le corrigé</summary>

/26 : pas 64, 130 dans 128-191. Réseau **192.168.4.128/26**. La passerelle `192.168.4.100` est dans le bloc 64-127 : **non valide**, elle doit être dans 192.168.4.129-190.

</details>

**Exercice 7.** Une société a besoin de 6 sous-réseaux d'au plus 20 hôtes avec `10.10.0.0/24`. Quel masque ? Est-ce possible ?

<details>
<summary>Voir le corrigé</summary>

6 sous-réseaux : s = 3 (8). 20 hôtes : h = 5 (30). s + h = 8 = 32 − 24 : **possible**, avec **/27**. Sous-réseaux : .0, .32, .64, .96, .128, .160 (puis .192 et .224 disponibles).

</details>

**Exercice 8.** Quelle plage regroupe `192.168.0.0/18` : première et dernière adresse ?

<details>
<summary>Voir le corrigé</summary>

/18 : pas 64 dans le 3e octet. Plage **192.168.0.0 à 192.168.63.255** (le bloc 0-63).

</details>
