## 3.1.1 Le rôle du routeur

Un **ordinateur** est généralement connecté à **un seul** réseau ; un **routeur** est connecté à **au moins deux** réseaux et retransmet les paquets de l'un à l'autre. Le routage est la fonction principale de la couche IP : **choisir par quel chemin envoyer un datagramme** à travers l'ensemble des réseaux.

Deux types de remise :

- **Remise directe** : l'expéditeur et le destinataire sont dans le **même réseau** (même adresse réseau avec le masque) ; le paquet va directement à la MAC du destinataire.
- **Remise indirecte** : il y a au moins un routeur entre eux ; le paquet est envoyé au routeur (le **prochain saut**, *next hop*), qui le transmet plus loin.

## 3.1.2 Le routage commence chez l'hôte

Avant le routeur, la machine source se pose une question : « **la destination est-elle dans mon réseau ?** »

```text
PC1 : 192.168.1.10/24, passerelle 192.168.1.1
Destination 192.168.1.50 : même réseau -> ARP sur 192.168.1.50, remise directe
Destination 10.0.0.9     : autre réseau -> ARP sur la passerelle 192.168.1.1
```

Sous Linux, la table de routage d'un simple PC contient souvent deux lignes : le réseau local (route directe) et la route **par défaut** vers la passerelle.

```bash
ip route
default via 192.168.1.1 dev eth0
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10
```

## 3.1.3 Les trois questions du routeur

Pour **chaque paquet** reçu, un routeur fait toujours :

1. **Quelle est la destination ?** Il lit l'adresse IP de destination.
2. **Quelle est la meilleure route dans ma table ?** Il applique la règle du préfixe le plus long (3.1.6).
3. **Par quelle interface et vers quel saut suivant ?** Il décrémente le TTL, recalcule la somme de contrôle, fait un ARP (ou lit son cache) pour le saut suivant, construit une **nouvelle trame** et l'envoie.

Si aucune route ne convient : le paquet est **jeté** et un ICMP « Destination unreachable » est renvoyé.

## 3.1.4 Voyage d'un paquet : PC1 vers PC3

Topologie : `PC1 (192.168.1.10/24) - R1 - R2 - PC3 (192.168.3.30/24)`, avec `R1` et `R2` reliés par `10.0.12.0/30` (R1 = .1, R2 = .2).

| Étape | Qui | Action | MAC destination de la trame |
|---|---|---|---|
| 1 | PC1 | Destination hors réseau : envoi à la passerelle R1 | MAC de R1 (côté LAN1) |
| 2 | R1 | Cherche 192.168.3.30 : route vers 192.168.3.0/24 via 10.0.12.2 | MAC de R2 |
| 3 | R2 | 192.168.3.0/24 est **directement connecté** : ARP de PC3 | MAC de PC3 |
| 4 | PC3 | Reçoit le paquet, répond (la **route de retour** doit exister !) | - |

:::attention La route de retour
Un ping réussit seulement si **l'aller ET le retour** sont routés. Le plus fréquent oubli en routage statique : configurer le chemin aller et oublier que le destinataire doit connaître le réseau source (ou avoir une route par défaut).
:::

## 3.1.5 Lire une table de routage Cisco

```text
R1# show ip route
Codes: C - connected, S - static, O - OSPF, L - local, * - candidate default

Gateway of last resort is 1.1.1.5 to network 0.0.0.0

      10.0.0.0/8 is variably subnetted, 4 subnets, 2 masks
C        10.0.0.0/23 is directly connected, GigabitEthernet0/0
L        10.0.1.254/32 is directly connected, GigabitEthernet0/0
S        10.0.4.0/23 [1/0] via 1.1.1.5
O        10.0.2.0/23 [110/20] via 1.1.1.13, 00:03:12, GigabitEthernet1/0
S*    0.0.0.0/0 [1/0] via 1.1.1.5
```

Lecture d'une ligne : **code** (origine), **destination/masque**, **[distance administrative / métrique]**, **via** (saut suivant), **interface** de sortie.

| Code | Origine |
|---|---|
| `C` | Réseau **directement connecté** (interface active avec une adresse) |
| `L` | Adresse **locale** de l'interface (route /32) |
| `S` | Route **statique** configurée à la main |
| `O` | Apprise par **OSPF** |
| `R`, `D`, `B` | RIP, EIGRP, BGP |
| `*` | Candidate pour la route par défaut |

Une route `C` apparaît seulement si l'interface est **en service** (`up/up`) et a une adresse IP. C'est pourquoi un `no shutdown` oublié fait « disparaître » un réseau.

### Équivalents Linux et Windows

| Action | Cisco | Linux | Windows |
|---|---|---|---|
| Voir la table | `show ip route` | `ip route` | `route print` |
| Ajouter | `ip route R M SAUT` | `ip route add R/n via SAUT` | `route add R mask M SAUT` |
| Route par défaut | `ip route 0.0.0.0 0.0.0.0 SAUT` | `ip route add default via SAUT` | `route add 0.0.0.0 mask 0.0.0.0 SAUT` |
| Supprimer | `no ip route ...` | `ip route del R/n` | `route delete R` |

### Les drapeaux de la table classique (`route -n`, `netstat -rn`)

`U` route active, `G` passe par une **passerelle**, `H` route d'**hôte** (/32), `D` créée par redirection ICMP, `M` modifiée par redirection.

## 3.1.6 Comment le routeur choisit : trois critères dans l'ordre

1. **Le préfixe le plus long** (*longest prefix match*) : la route la plus **spécifique** gagne, quelle que soit sa distance administrative.
2. **La distance administrative** (AD) : à préfixe égal, la source la plus **fiable** (AD la plus basse) gagne.
3. **La métrique** : à AD égale, la route au **coût le plus bas** gagne ; en cas d'égalité, le routeur fait de l'**équilibrage de charge** entre les routes.

:::exemple Le préfixe le plus long en action
Table : `10.0.0.0/8 via A`, `10.1.0.0/16 via B`, `10.1.2.0/24 via C`, `0.0.0.0/0 via D`.

| Destination | Routes qui correspondent | Choisie |
|---|---|---|
| 10.1.2.5 | /8, /16, /24, /0 | **/24 via C** |
| 10.1.9.9 | /8, /16, /0 | **/16 via B** |
| 10.9.9.9 | /8, /0 | **/8 via A** |
| 8.8.8.8 | /0 | **/0 via D** |
:::

### La distance administrative

| Source de la route | AD |
|---|---|
| Interface connectée | **0** |
| Route statique | **1** |
| eBGP | 20 |
| EIGRP interne | 90 |
| **OSPF** | **110** |
| IS-IS | 115 |
| **RIP** | **120** |
| EIGRP externe | 170 |
| iBGP | 200 |

Plus l'AD est basse, plus la source est digne de confiance. Une route statique (AD 1) l'emporte donc sur OSPF (110) **pour un même préfixe** ; on exploite cela pour les **routes flottantes** (AD relevée volontairement, chapitre 3.2).

### La métrique

Chaque protocole a la sienne : RIP compte les **sauts** (max 15), OSPF utilise un **coût** lié à la bande passante, EIGRP combine bande passante et délai. Une route statique a la métrique 0.

## 3.1.7 La recherche récursive

Quand une route statique indique un **saut suivant** (`via 1.1.1.5`), le routeur doit trouver comment atteindre `1.1.1.5` : il refait une recherche dans la table jusqu'à tomber sur une interface de sortie. Cela suppose que le saut suivant soit **joignable** (dans un réseau directement connecté, en pratique).

## 3.1.8 Routage statique, dynamique et par défaut

- **Statique** : la table est écrite à la main. Simple et prévisible, mais ne s'adapte pas aux pannes.
- **Dynamique** : les routeurs échangent leurs informations grâce à un protocole (RIP, OSPF, EIGRP, BGP) et recalculent seuls en cas de panne.
- **Par défaut** : une route `0.0.0.0/0` qui capture tout ce que la table ne connaît pas (typiquement la sortie vers Internet).

:::retenir À retenir
Table de routage = liste (destination/masque, saut suivant, interface, métrique). Le routeur choisit : **préfixe le plus long, puis AD, puis métrique**. `C` et `L` apparaissent automatiquement ; `S`, `O`... sont ajoutées. Sans route de retour, le ping échoue.
:::

:::examen Ce qui tombe à l'examen
« Donnez la table de routage de chaque routeur », « quelle route est choisie pour la destination X », « que signifie la ligne S* 0.0.0.0/0 ? », « quelle est la distance administrative d'OSPF ? »
:::

## 3.1.9 Exercices corrigés

**Exercice 1.** Table : `192.168.0.0/16 via A`, `192.168.5.0/24 via B`, `0.0.0.0/0 via C`. Quelle route pour `192.168.5.77`, `192.168.9.1`, `172.16.0.1` ?

<details>
<summary>Voir le corrigé</summary>

`192.168.5.77` : /24 via **B** (le plus spécifique). `192.168.9.1` : /16 via **A**. `172.16.0.1` : défaut via **C**.

</details>

**Exercice 2.** Une route statique et une route OSPF existent pour `10.5.0.0/16`. Laquelle est installée ? Et si l'OSPF annonce `10.5.0.0/24` ?

<details>
<summary>Voir le corrigé</summary>

Même préfixe : la statique (AD 1) gagne sur OSPF (110). Mais pour `10.5.0.7`, la route OSPF en **/24** est plus spécifique et l'emporte pour ce trafic, car le préfixe le plus long passe avant l'AD.

</details>

**Exercice 3.** Donnez les AD de : interface connectée, statique, OSPF, RIP.

<details>
<summary>Voir le corrigé</summary>

0, 1, 110, 120.

</details>

**Exercice 4.** PC `10.0.0.5/24` envoie à `10.0.0.77` et à `10.0.1.5`. Pour chacun, quelle adresse MAC sera visée ?

<details>
<summary>Voir le corrigé</summary>

`10.0.0.77` est dans le même /24 : MAC **du destinataire**. `10.0.1.5` est hors réseau : MAC **de la passerelle**.

</details>

**Exercice 5.** Que signifie `S* 0.0.0.0/0 [1/0] via 1.1.1.5` ?

<details>
<summary>Voir le corrigé</summary>

Route **statique**, candidate pour la route par défaut, AD 1, métrique 0, saut suivant `1.1.1.5` : tout trafic sans route plus précise y est envoyé.

</details>

**Exercice 6.** Un réseau directement connecté n'apparaît pas dans `show ip route`. Citez deux causes.

<details>
<summary>Voir le corrigé</summary>

Interface en `shutdown` (ou liaison down) et/ou **absence d'adresse IP** sur l'interface.

</details>

**Exercice 7.** PC1 ping PC3 et reçoit « Request timed out » alors que R1 connaît le réseau de PC3. Quelle cause fréquente ?

<details>
<summary>Voir le corrigé</summary>

La **route de retour** manque (R2 ou PC3 ne sait pas revenir vers le réseau de PC1) ou la passerelle de PC3 est mal configurée.

</details>

**Exercice 8.** Écrivez la commande Linux qui ajoute la route vers `172.16.0.0/16` via `10.0.0.2`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ip route add 172.16.0.0/16 via 10.0.0.2
```

</details>
