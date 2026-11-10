## 1.3.1 L'adresse IPv4 et le binaire

Une adresse IPv4 est un nombre de **32 bits**, découpé en **4 octets** de 8 bits et écrit en notation décimale pointée : `192.168.10.45`. Chaque octet vaut de 0 à 255 (2⁸ = 256 valeurs). On compte ainsi 2³² ≈ 4,3 milliards d'adresses.

Pourquoi le binaire ? Parce que le subnetting consiste à **tracer une frontière dans ces 32 bits**. Tant qu'on ne voit pas les bits, les règles paraissent magiques ; dès qu'on les voit, tout devient mécanique.

### Les 8 poids d'un octet

| Position | 8e | 7e | 6e | 5e | 4e | 3e | 2e | 1re |
|---|---|---|---|---|---|---|---|---|
| Puissance | 2⁷ | 2⁶ | 2⁵ | 2⁴ | 2³ | 2² | 2¹ | 2⁰ |
| Poids | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

**Décimal vers binaire (méthode des soustractions)** : de gauche à droite, si le poids tient dans le reste, on écrit 1 et on soustrait ; sinon 0.

```text
172 : 128 tient (reste 44) -> 1 | 64 non -> 0 | 32 tient (reste 12) -> 1
      16 non -> 0 | 8 tient (reste 4) -> 1 | 4 tient (reste 0) -> 1 | 2 non -> 0 | 1 non -> 0
172 = 10101100
```

**Binaire vers décimal** : on additionne les poids des bits à 1. `11001010` = 128 + 64 + 8 + 2 = **202**.

:::retenir Les 9 valeurs de masque à connaître par cœur
Quand les bits à 1 sont collés à gauche, un octet ne prend que 9 valeurs :

| Bits à 1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| Décimal | 0 | 128 | 192 | 224 | 240 | 248 | 252 | 254 | 255 |

Moyen mnémotechnique : on part de 128 et on ajoute à chaque fois la moitié du poids précédent (128, +64 = 192, +32 = 224, +16 = 240, +8 = 248, +4 = 252, +2 = 254, +1 = 255).
:::

## 1.3.2 Masque, CIDR et partie réseau

Une adresse IP est toujours accompagnée d'un **masque de sous-réseau**. Dans le masque, les bits à **1** désignent la **partie réseau** et les bits à **0** la **partie hôte**.

La notation **CIDR** (*Classless Inter-Domain Routing*) écrit le nombre de bits à 1 : `/24` = `255.255.255.0`, `/26` = `255.255.255.192`. Elle a remplacé les masques fixes par classe, devenus ingérables par les routeurs dans les années 1990.

### Le ET logique : trouver l'adresse du réseau

Un **ET bit à bit** entre l'adresse et le masque donne l'**adresse du réseau** (partie hôte à 0).

```text
Adresse : 192.168.10.45   = 11000000.10101000.00001010.00101101
Masque  : /26             = 11111111.11111111.11111111.11000000
ET      :                   11000000.10101000.00001010.00000000 = 192.168.10.0
```

L'**adresse de diffusion** (broadcast) s'obtient en mettant **tous les bits hôte à 1** : ici `00111111` = 63, donc `192.168.10.63`.

### Les formules essentielles

| Grandeur | Formule | Exemple /26 |
|---|---|---|
| Adresses totales | 2^(32 − n) | 2⁶ = 64 |
| Hôtes utilisables | 2^(32 − n) − 2 | 62 |
| Adresse réseau | première adresse du bloc | .0 |
| Diffusion | dernière adresse du bloc | .63 |
| Taille du bloc dans l'octet concerné | 256 − valeur du masque | 256 − 192 = 64 |

:::exemple Le raccourci du « saut de bloc »
Pour `172.30.33.45/12` : le masque `/12` donne 255.240.0.0 ; l'octet concerné est le 2e, valeur 240, donc bloc de 256 − 240 = **16**. Les réseaux du 2e octet sont 0, 16, 32… ; 30 tombe dans le bloc **16 à 31**. Réseau : `172.16.0.0`, diffusion : `172.31.255.255`.
:::

### Table de référence

| CIDR | Masque | Adresses | Hôtes | CIDR | Masque | Adresses | Hôtes |
|---|---|---|---|---|---|---|---|
| /8 | 255.0.0.0 | 16 777 216 | 16 777 214 | /27 | 255.255.255.224 | 32 | 30 |
| /16 | 255.255.0.0 | 65 536 | 65 534 | /28 | 255.255.255.240 | 16 | 14 |
| /20 | 255.255.240.0 | 4 096 | 4 094 | /29 | 255.255.255.248 | 8 | 6 |
| /23 | 255.255.254.0 | 512 | 510 | /30 | 255.255.255.252 | 4 | 2 |
| /24 | 255.255.255.0 | 256 | 254 | /31 | 255.255.255.254 | 2 | 2 (liens point à point) |
| /25 | 255.255.255.128 | 128 | 126 | /32 | 255.255.255.255 | 1 | 1 (route d'hôte) |
| /26 | 255.255.255.192 | 64 | 62 | | | | |

## 1.3.3 Classes (historique), adresses privées et spéciales

Avant le CIDR, on découpait en classes : **A** (1-126, masque /8), **B** (128-191, /16), **C** (192-223, /24), **D** (224-239, multicast), **E** (240-255, réservé). Cette notion sert surtout à lire le vocabulaire ; en pratique on raisonne en CIDR.

### Adresses privées (RFC 1918)

Elles ne sont **pas routées sur Internet** ; on les réutilise librement dans chaque entreprise.

| Classe | Plage | CIDR |
|---|---|---|
| A | 10.0.0.0 - 10.255.255.255 | 10.0.0.0/8 |
| B | 172.16.0.0 - 172.31.255.255 | 172.16.0.0/12 |
| C | 192.168.0.0 - 192.168.255.255 | 192.168.0.0/16 |

### Adresses spéciales

| Adresse / bloc | Rôle |
|---|---|
| `0.0.0.0` | « inconnue » (l'hôte au démarrage), ou route par défaut `0.0.0.0/0` |
| `127.0.0.0/8` | Bouclage (*loopback*), `127.0.0.1` = la machine elle-même |
| `169.254.0.0/16` | APIPA : auto-adresse quand le DHCP ne répond pas |
| `100.64.0.0/10` | Espace partagé des opérateurs (CGNAT) |
| `224.0.0.0/4` | Multicast |
| `255.255.255.255` | Diffusion limitée (réseau local) |
| `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` | Réseaux de documentation (exemples) |

:::attention Adresse réseau et diffusion ne s'attribuent pas
Dans un sous-réseau, la première adresse (réseau) et la dernière (diffusion) ne peuvent pas être données à une machine. Un `/31` (RFC 3021) fait exception pour les liens point à point.
:::

## 1.3.4 Pénurie d'adresses : CIDR, NAT et IPv6

Trois mécanismes ont retardé l'épuisement d'IPv4 : le **CIDR**, le **NAT** (chapitre 4.2) et les **adresses privées**. Ils n'ont fait que gagner du temps ; la solution définitive est **IPv6** (chapitre 3.4).

## 1.3.5 Même réseau ou non ?

Deux machines communiquent **directement** (sans routeur) si elles sont dans le **même sous-réseau** : leurs adresses donnent la même adresse réseau avec le même masque. Sinon, il faut une **passerelle**, qui doit elle-même appartenir au réseau de la machine.

:::examen Ce qui tombe à l'examen
Calculer réseau, diffusion et plage d'hôtes d'une adresse CIDR ; convertir un masque ; dire si deux machines sont dans le même réseau ; reconnaître les adresses privées et spéciales.
:::

## 1.3.6 Exercices corrigés

**Exercice 1.** Convertissez `203` et `77` en binaire, puis `10010110` en décimal.

<details>
<summary>Voir le corrigé</summary>

`203` = 128 + 64 + 8 + 2 + 1 = `11001011`. `77` = 64 + 8 + 4 + 1 = `01001101`. `10010110` = 128 + 16 + 4 + 2 = **150**.

</details>

**Exercice 2.** Écrivez `/20` en notation décimale et donnez le nombre d'hôtes.

<details>
<summary>Voir le corrigé</summary>

20 bits à 1 = 8 + 8 + 4 : 255.255.**240**.0. Hôtes : 2¹² − 2 = **4 094**.

</details>

**Exercice 3.** Réseau et diffusion de `10.0.1.1/23`.

<details>
<summary>Voir le corrigé</summary>

Masque 255.255.254.0, bloc de 2 dans le 3e octet. 1 tombe dans le bloc 0-1 : réseau **10.0.0.0**, diffusion **10.0.1.255**. Hôtes : 10.0.0.1 à 10.0.1.254 (510).

</details>

**Exercice 4.** Réseau et diffusion de `192.168.8.9/22`.

<details>
<summary>Voir le corrigé</summary>

/22 = 255.255.252.0, bloc de 4 dans le 3e octet. 8 est un multiple de 4 : réseau **192.168.8.0**, diffusion **192.168.11.255**.

</details>

**Exercice 5.** Réseau et diffusion de `192.168.0.30/27`, `10.0.0.168/25`, `192.168.6.6/29`.

<details>
<summary>Voir le corrigé</summary>

- `/27` (bloc 32) : 30 dans 0-31 → **192.168.0.0** / **192.168.0.31**.
- `/25` (bloc 128) : 168 dans 128-255 → **10.0.0.128** / **10.0.0.255**.
- `/29` (bloc 8) : 6 dans 0-7 → **192.168.6.0** / **192.168.6.7**.

</details>

**Exercice 6.** Les machines `192.168.1.200/24` et `192.168.2.7/24` communiquent-elles directement ?

<details>
<summary>Voir le corrigé</summary>

Non : réseaux `192.168.1.0/24` et `192.168.2.0/24` différents. Il faut un routeur.

</details>

**Exercice 7.** Parmi `172.15.0.1`, `172.16.5.9`, `172.32.0.1`, `192.169.1.1`, lesquelles sont privées ?

<details>
<summary>Voir le corrigé</summary>

Seule **`172.16.5.9`** (plage 172.16.0.0/12 = 172.16 à 172.31). Les trois autres sont publiques.

</details>

**Exercice 8.** À quoi sert `169.254.x.x` ? Que signale-t-elle quand on la voit sur un PC ?

<details>
<summary>Voir le corrigé</summary>

C'est une adresse APIPA, attribuée automatiquement quand aucun serveur DHCP ne répond. Elle signale un **problème de DHCP** (ou de lien).

</details>
