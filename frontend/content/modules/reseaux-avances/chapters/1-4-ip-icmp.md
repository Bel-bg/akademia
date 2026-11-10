## 1.4.1 Le protocole IP : un service « au mieux »

Le protocole **IP** (*Internet Protocol*, RFC 791) est au cœur d'Internet. Il assure, **sans connexion** et **sans fiabilité**, la remise de **datagrammes**. Aucune garantie : un datagramme peut être perdu, dupliqué, retardé, altéré ou livré dans le désordre. On parle de **remise au mieux** (*best effort*). La fiabilité est apportée, si nécessaire, par TCP au-dessus.

IP s'occupe de trois choses : définir le **format du datagramme**, définir le **routage**, et gérer la **remise non fiable**.

## 1.4.2 L'en-tête IPv4

L'en-tête fait au minimum **20 octets**. Voici ses champs :

| Champ | Taille | Rôle |
|---|---|---|
| Version | 4 bits | 4 pour IPv4 |
| IHL | 4 bits | Longueur de l'en-tête en mots de 32 bits (5 = 20 octets) |
| Type de service (DSCP/ECN) | 8 bits | Priorité, qualité de service |
| Longueur totale | 16 bits | En-tête + données (max 65 535 octets) |
| Identification | 16 bits | Identifie les fragments d'un même datagramme |
| Drapeaux | 3 bits | DF (ne pas fragmenter), MF (d'autres fragments suivent) |
| Décalage de fragment | 13 bits | Position du fragment (en blocs de 8 octets) |
| **TTL** | 8 bits | Durée de vie, décrémentée à chaque routeur |
| **Protocole** | 8 bits | Couche supérieure : 1 ICMP, 6 TCP, 17 UDP |
| Somme de contrôle | 16 bits | Vérifie l'en-tête, recalculée par chaque routeur |
| Adresse source / destination | 32 + 32 bits | Les deux adresses IP |

:::retenir TTL
Le TTL est fixé par l'émetteur (64 sous Linux, 128 sous Windows, 255 sur beaucoup de routeurs). **Chaque routeur le décrémente de 1** ; à 0, le paquet est détruit et un message ICMP « Time Exceeded » est renvoyé. Cela empêche les paquets de tourner indéfiniment dans une boucle de routage, et c'est ce qu'exploite `traceroute`.
:::

## 1.4.3 Fragmentation et MTU

Chaque lien a un **MTU** (*Maximum Transmission Unit*), généralement 1500 octets sur Ethernet. Si un datagramme est plus grand que le MTU du lien suivant, le routeur le **fragmente**.

Règles à connaître :

- La taille d'un fragment (hors en-tête) est un **multiple de 8 octets** (le décalage est exprimé en blocs de 8).
- Le **réassemblage ne se fait qu'à la destination finale**, même si les fragments traversent ensuite des liens à plus grand MTU.
- Si le drapeau **DF** est à 1 et que le paquet est trop grand, le routeur le jette et renvoie un ICMP « Fragmentation needed ».

:::exemple Fragmenter 1300 octets de données avec un MTU de 700
En-tête de 20 octets : charge utile maximale par fragment = 700 − 20 = 680, arrondie au multiple de 8 inférieur = **680** (680 = 8 × 85). Fragment 1 : 680 octets, MF = 1, décalage 0. Fragment 2 : 620 octets, MF = 0, décalage 680 / 8 = **85**. Total : 680 + 620 = 1300 ✓.
:::

## 1.4.4 ICMP : le protocole de messages de contrôle

**ICMP** (*Internet Control Message Protocol*) permet aux routeurs et aux machines de signaler des erreurs et de tester la connectivité. Il est transporté dans IP (protocole 1).

| Type | Message | Utilité |
|---|---|---|
| 8 / 0 | Echo Request / Echo Reply | `ping` |
| 3 | Destination Unreachable | Réseau, machine, protocole ou port inaccessible |
| 11 | Time Exceeded | TTL à 0 (utilisé par `traceroute`) |
| 5 | Redirect | Un routeur indique un meilleur chemin |

Les codes de « destination inaccessible » (type 3) à retenir : **0** réseau inaccessible, **1** machine inaccessible, **2** protocole inaccessible, **3** port inaccessible, **4** fragmentation nécessaire mais DF à 1, **13** communication interdite par filtrage.

### Lire un ping

| Résultat | Signification probable |
|---|---|
| `Reply from ...` | Tout va bien jusqu'à la destination |
| `Request timed out` | Perte silencieuse : route de retour manquante, filtrage, machine éteinte |
| `Destination host unreachable` | Un routeur sait qu'il ne peut pas joindre la destination (pas de route, ARP sans réponse) |
| `TTL expired in transit` | Boucle de routage |
| `.` `!` `U` sur un routeur Cisco | `.` délai dépassé, `!` réponse reçue, `U` inaccessible |

### Traceroute

`traceroute` envoie des paquets avec un TTL de 1, 2, 3… Chaque routeur qui jette le paquet renvoie un ICMP « Time Exceeded », révélant ainsi son adresse : on obtient la liste des sauts.

```bash
traceroute 8.8.8.8        # Linux (UDP par défaut)
tracert 8.8.8.8           # Windows (ICMP)
mtr 8.8.8.8               # trace + statistiques en continu
```

## 1.4.5 Comparaison rapide IPv4 / IPv6

L'en-tête IPv6 est de taille fixe (**40 octets**), sans somme de contrôle ni fragmentation par les routeurs. Le champ **TTL devient Hop Limit**, le champ **Protocole devient Next Header**. Détails au chapitre 3.4.

:::attention Une machine qui ne répond pas au ping n'est pas forcément éteinte
Beaucoup de pare-feu bloquent l'ICMP. Un ping sans réponse prouve seulement qu'**aucune réponse n'est revenue**. Testez aussi le port du service (`nc -zv hôte 443`).
:::

:::examen Ce qui tombe à l'examen
Lister les champs de l'en-tête IP, expliquer le TTL, calculer une fragmentation, associer un code ICMP à un symptôme, expliquer le fonctionnement de traceroute.
:::

## 1.4.6 Exercices corrigés

**Exercice 1.** Quelle est la taille minimale d'un en-tête IPv4 ? Que vaut IHL pour cette taille ?

<details>
<summary>Voir le corrigé</summary>

20 octets ; IHL = 5 (5 × 4 octets).

</details>

**Exercice 2.** Un paquet arrive sur un routeur avec TTL = 1. Que se passe-t-il ?

<details>
<summary>Voir le corrigé</summary>

Le routeur décrémente à 0, **jette** le paquet et renvoie à la source un message **ICMP Time Exceeded** (type 11).

</details>

**Exercice 3.** Quelle valeur du champ Protocole pour ICMP, TCP, UDP ?

<details>
<summary>Voir le corrigé</summary>

ICMP = 1, TCP = 6, UDP = 17.

</details>

**Exercice 4.** Un datagramme de 1300 octets de données doit traverser un lien de MTU 700. Donnez les fragments (taille, MF, décalage).

<details>
<summary>Voir le corrigé</summary>

Charge utile max = 700 − 20 = 680 (multiple de 8). Fragment 1 : 680 octets, MF=1, décalage 0. Fragment 2 : 620 octets, MF=0, décalage 85.

</details>

**Exercice 5.** Où le datagramme fragmenté est-il réassemblé ?

<details>
<summary>Voir le corrigé</summary>

Uniquement à la **destination finale**, jamais sur les routeurs intermédiaires.

</details>

**Exercice 6.** Un `ping` retourne « Destination host unreachable » depuis l'adresse d'un routeur intermédiaire. Qu'en déduire ? Et si c'est « Request timed out » ?

<details>
<summary>Voir le corrigé</summary>

« Unreachable » venant d'un routeur : **ce routeur n'a pas de route** vers la destination (il le signale). « Timed out » : aucune réponse, souvent la **route de retour manquante**, un filtrage ou une machine éteinte.

</details>

**Exercice 7.** Expliquez comment `traceroute` découvre chaque routeur.

<details>
<summary>Voir le corrigé</summary>

Il envoie des paquets avec TTL = 1, 2, 3… Le routeur qui reçoit un TTL arrivé à 0 renvoie un ICMP Time Exceeded avec son adresse, ce qui donne les sauts successifs jusqu'à la destination.

</details>
