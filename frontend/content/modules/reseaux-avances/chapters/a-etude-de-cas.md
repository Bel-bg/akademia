## A.1 Le cas : un réseau de deux sites avec sortie Internet

Cette étude de cas est inspirée de l'épreuve « Réseaux avancés » (ENEAM, 2 h). Cinq routeurs relient quatre réseaux locaux et une sortie Internet par NAT.

```text
 NetB2 10.0.6.0/23 -- RB2 ==[L3 1.1.1.8/30]== RB1 -- NetB1 10.0.4.0/23
                       ||                       |
                 [L5 1.1.1.16/30]         [L2 1.1.1.4/30]
                       ||                       |
 NetA2 10.0.2.0/23 -- RA2 ==[L4 1.1.1.12/30]== RA1 --[L1 1.1.1.0/30]-- R0 -- NAT / Internet
                                              |
                                      NetA1 10.0.0.0/23
```

Précisions : RB1 est relié à R0 par L2 (1.1.1.4/30), RA1 est relié à R0 par L1 (1.1.1.0/30), RB2 et RA2 sont reliés par L5 (1.1.1.16/30). L'énoncé demande d'abord de raisonner **sans la liaison L5**, puis de configurer OSPF **avec** elle.

:::attention Reconstitution
Les adresses ci-dessous viennent de l'énoncé ; le nom exact de certaines interfaces LAN est supposé (`g0/0`). Sur l'épreuve, appuyez-vous sur le schéma fourni.
:::

## A.2 Plan d'adressage

| Équipement | Interface | Adresse | Réseau |
|---|---|---|---|
| RB2 | g1/0 | 1.1.1.9/30 | L3 |
| RB1 | g2/0 | 1.1.1.10/30 | L3 |
| RB1 | g1/0 | 1.1.1.5/30 | L2 |
| R0 | g1/0 | 1.1.1.6/30 | L2 |
| R0 | g2/0 | 1.1.1.2/30 | L1 |
| RA1 | g1/0 | 1.1.1.1/30 | L1 |
| RA1 | g2/0 | 1.1.1.14/30 | L4 |
| RA2 | g1/0 | 1.1.1.13/30 | L4 |
| RA2 | g2/0 | 1.1.1.18/30 | L5 |
| RB2 | g2/0 | 1.1.1.17/30 | L5 |
| RB2 | g0/0 | 10.0.7.254/23 | NetB2 |
| RB1 | g0/0 | 10.0.5.254/23 | NetB1 |
| RA2 | g0/0 | 10.0.3.254/23 | NetA2 |
| RA1 | g0/0 | 10.0.1.254/23 | NetA1 |

La passerelle de chaque LAN est la **dernière adresse utilisable** du réseau (`.254` du second bloc de 256, par exemple `10.0.7.254` pour `10.0.6.0/23` dont la diffusion est `10.0.7.255`).

### Les liaisons en /30

Chaque liaison /30 offre exactement **2 adresses utilisables** (les deux routeurs) : `1.1.1.8/30` = `.9` et `.10`, diffusion `.11`. Il n'y a **aucun gaspillage**, c'est le VLSM appliqué.

## A.3 Routage statique sans la liaison L5

Sans L5, la topologie est une **chaîne** : `RB2 - RB1 - R0 - RA1 - RA2`. Tout le trafic de RB2 passe par RB1, tout celui de RA2 par RA1. On applique la méthode en 6 étapes :

### RB2 (extrémité de la chaîne)

| Réseau | Type | Saut suivant / sortie |
|---|---|---|
| 10.0.6.0/23 (NetB2) | C | g0/0 |
| 1.1.1.8/30 (L3) | C | g1/0 |
| 10.0.4.0/23, 1.1.1.4/30, 1.1.1.0/30, 10.0.0.0/23, 1.1.1.12/30, 10.0.2.0/23 | S | **1.1.1.10** (RB1) |

Les six routes statiques peuvent être **remplacées par une seule route par défaut** : `ip route 0.0.0.0 0.0.0.0 1.1.1.10`.

### RB1

| Réseau | Type | Saut suivant |
|---|---|---|
| 10.0.4.0/23, 1.1.1.8/30, 1.1.1.4/30 | C | - |
| **10.0.6.0/23** (NetB2) | S | **1.1.1.9** (RB2) |
| 1.1.1.0/30, 10.0.0.0/23, 1.1.1.12/30, 10.0.2.0/23 | S | **1.1.1.6** (R0) |

### R0

| Réseau | Type | Saut suivant |
|---|---|---|
| 1.1.1.4/30, 1.1.1.0/30 | C | - |
| 1.1.1.8/30, 10.0.4.0/23, 10.0.6.0/23 | S | **1.1.1.5** (RB1) |
| 1.1.1.12/30, 10.0.0.0/23, 10.0.2.0/23 | S | **1.1.1.1** (RA1) |
| 0.0.0.0/0 | S | Sortie NAT (Internet) |

### RA1

| Réseau | Type | Saut suivant |
|---|---|---|
| 10.0.0.0/23, 1.1.1.0/30, 1.1.1.12/30 | C | - |
| **10.0.2.0/23** (NetA2) | S | **1.1.1.13** (RA2) |
| 1.1.1.4/30, 1.1.1.8/30, 10.0.4.0/23, 10.0.6.0/23 | S | **1.1.1.2** (R0) |

### RA2 (extrémité)

| Réseau | Type | Saut suivant |
|---|---|---|
| 10.0.2.0/23, 1.1.1.12/30 | C | - |
| tout le reste | S | **1.1.1.14** (RA1), par une route par défaut |

### Les commandes pour RB1

```text
RB1(config)# interface g0/0
RB1(config-if)# ip address 10.0.5.254 255.255.254.0
RB1(config-if)# no shutdown
RB1(config)# interface g1/0
RB1(config-if)# ip address 1.1.1.5 255.255.255.252
RB1(config-if)# no shutdown
RB1(config)# interface g2/0
RB1(config-if)# ip address 1.1.1.10 255.255.255.252
RB1(config-if)# no shutdown
RB1(config)# ip route 10.0.6.0 255.255.254.0 1.1.1.9
RB1(config)# ip route 0.0.0.0 0.0.0.0 1.1.1.6
```

:::retenir Le trou à éviter
Quand les réseaux de gauche (B) et de droite (A) passent par R0, **R0 doit connaître tous les réseaux des deux côtés** (ou avoir leur résumé). Les réseaux `10.0.0.0/23`, `10.0.2.0/23`, `10.0.4.0/23`, `10.0.6.0/23` se résument en `10.0.0.0/21` : RA1 et RB1 peuvent chacun utiliser ce résumé, mais **attention à ne pas créer une boucle** entre RB1 et R0 pour les adresses du résumé qui n'existent pas.
:::

## A.4 Avec la liaison L5 : OSPF

Avec L5, la topologie devient un **anneau** : le routage statique devient pénible (deux chemins, secours à gérer). On passe à **OSPF**, zone 0, qui calcule les meilleurs chemins et bascule seul en cas de panne.

### Configuration des adresses (extrait)

```text
RA2(config)# interface g2/0
RA2(config-if)# ip address 1.1.1.18 255.255.255.252
RA2(config-if)# no shutdown
RB2(config)# interface g2/0
RB2(config-if)# ip address 1.1.1.17 255.255.255.252
RB2(config-if)# no shutdown
```

### OSPF type 1 : par interface, avec `passive-interface` (modèle de l'annexe)

```text
RB2(config)# router ospf 10
RB2(config-router)# passive-interface g0/0
RB2(config-router)# redistribute connected subnets
RB2(config)# interface g1/0
RB2(config-if)# ip ospf 10 area 0
RB2(config)# interface g2/0
RB2(config-if)# ip ospf 10 area 0
```

Même schéma sur **RB1, RA1, RA2, R0** : on active `ip ospf 10 area 0` sur **chaque interface de liaison** (et sur les LAN si l'on ne veut pas `redistribute`), on met les LAN en `passive-interface`.

### OSPF type 2 : par commande `network`

```text
RB2(config)# router ospf 100
RB2(config-router)# network 10.0.6.0 0.0.1.255 area 0
RB2(config-router)# network 1.1.1.8 0.0.0.3 area 0
RB2(config-router)# network 1.1.1.16 0.0.0.3 area 0
RB2(config-router)# passive-interface g0/0
```

### Sortie Internet sur R0

```text
R0(config)# ip route 0.0.0.0 0.0.0.0 <interface-NAT>
R0(config)# router ospf 10
R0(config-router)# default-information originate
```

### Vérification

```text
RB2# show ip ospf neighbor          ! RB1 et RA2 en FULL
RB2# show ip route ospf             ! réseaux 10.0.x.0/23 appris (O)
PC_B2-1> ping 10.0.1.1              ! de NetB2 vers NetA1
PC_B2-1> trace 10.0.1.1             ! chemin choisi
```

Chemin choisi de NetB2 vers NetA2 avec L5 : `RB2 → RA2` (**un saut**, coût le plus faible) ; si L5 tombe, OSPF recalcule : `RB2 → RB1 → R0 → RA1 → RA2`.

:::exemple Panne de la liaison L5
`show ip route 10.0.2.1` sur RB2 avant : `O 10.0.2.0/23 via 1.1.1.18`. On coupe L5 (`shutdown` sur g2/0). Après la convergence (quelques secondes avec les temporisateurs par défaut, moins avec un réglage adapté) : `O 10.0.2.0/23 via 1.1.1.10`. Un routage **statique** simple, lui, aurait **conservé** la route cassée (sauf route flottante).
:::

## A.5 Les autres questions de l'épreuve

| Question | Réponse |
|---|---|
| Ports : HTTP, HTTPS, DHCP, NTP, SNMP, LDAPS | 80, 443, 67/68, 123, 161 (162 pour les traps), 636 |
| Conteneur `nginx:latest`, port 8080 vers le port par défaut | `docker run -d -p 8080:80 nginx:latest` |
| Masque pour regrouper `192.168.0.0 - 192.168.63.255` | `255.255.192.0` = `/18` |
| Masque pour `10.0.0.0 - 10.3.255.255` | `255.252.0.0` = `/14` |
| Masque pour `192.168.0.0 - 192.168.0.63` | `255.255.255.192` = `/26` |
| Masque pour `1.0.0.0 - 1.0.7.255` | `255.255.248.0` = `/21` |

:::examen Barème indicatif
Adressage et masques : 2 à 4 points. Tables de routage : 5 à 6 points. Configuration OSPF : 4 à 5 points. Ports et Docker : 2 à 3 points. Soignez la **présentation** : un tableau par routeur (réseau, code C/S, saut suivant) vaut mieux qu'un paragraphe.
:::

## A.6 Exercices corrigés

**Exercice 1.** Quelle est l'adresse de diffusion de `1.1.1.12/30` ? Quelles sont les deux adresses utilisables ?

<details>
<summary>Voir le corrigé</summary>

Bloc 12-15 : adresses utilisables **1.1.1.13** et **1.1.1.14**, diffusion **1.1.1.15**.

</details>

**Exercice 2.** Quelle est la passerelle (dernière adresse utilisable) de `10.0.2.0/23` ?

<details>
<summary>Voir le corrigé</summary>

Le bloc va de 10.0.2.0 à 10.0.3.255 ; la dernière utilisable est **10.0.3.254**.

</details>

**Exercice 3.** Sans L5, combien de routes statiques (ou quelle route) sur RA2 pour joindre tous les réseaux ?

<details>
<summary>Voir le corrigé</summary>

RA2 est une extrémité : une seule route par défaut suffit : `ip route 0.0.0.0 0.0.0.0 1.1.1.14`.

</details>

**Exercice 4.** Sur R0 (sans L5), donnez les routes vers les réseaux du côté B, avec le saut suivant.

<details>
<summary>Voir le corrigé</summary>

```text
ip route 1.1.1.8 255.255.255.252 1.1.1.5
ip route 10.0.4.0 255.255.254.0 1.1.1.5
ip route 10.0.6.0 255.255.254.0 1.1.1.5
```

Résumable : `10.0.4.0/22` couvre 10.0.4.0 à 10.0.7.255 (NetB1 + NetB2).

</details>

**Exercice 5.** Écrivez la commande `network` OSPF pour annoncer le réseau `10.0.0.0/23` dans la zone 0.

<details>
<summary>Voir le corrigé</summary>

```text
network 10.0.0.0 0.0.1.255 area 0
```

</details>

**Exercice 6.** Pourquoi met-on `passive-interface` sur les interfaces des LAN ?

<details>
<summary>Voir le corrigé</summary>

Aucun routeur voisin n'est présent sur un LAN : inutile d'envoyer des Hello (bruit, risque d'un faux voisin) ; le réseau reste cependant annoncé aux autres routeurs.

</details>

**Exercice 7.** Après activation de OSPF, `show ip ospf neighbor` ne montre aucun voisin entre RB2 et RA2. Citez trois vérifications.

<details>
<summary>Voir le corrigé</summary>

Interfaces `up/up` et dans le même /30 (1.1.1.17 et 1.1.1.18) ; `ip ospf 10 area 0` bien présent sur **les deux** interfaces de liaison ; interface **non passive** sur le lien ; temporisateurs et zone identiques.

</details>
