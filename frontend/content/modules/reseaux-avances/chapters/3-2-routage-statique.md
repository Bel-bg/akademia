## 3.2.1 Définition et usages

Le **routage statique** consiste à écrire **à la main** les routes dans la table de chaque routeur. Il est adapté aux **petits réseaux**, aux **réseaux d'extrémité** (stub : un seul chemin de sortie), aux **liaisons de secours** et à la route par défaut vers l'opérateur.

| Avantages | Inconvénients |
|---|---|
| Aucune consommation de CPU ni de bande passante pour échanger des routes | Aucune adaptation automatique à une panne |
| Comportement prévisible, sécurité (pas d'annonces à usurper) | Lourd et source d'erreurs quand le réseau grandit |
| Configuration simple pour peu de routeurs | Chaque changement demande d'intervenir sur tous les routeurs concernés |

## 3.2.2 Prérequis avant toute route statique

1. Les **interfaces sont `up/up`** et portent une adresse IP correcte (`no shutdown`).
2. Le **saut suivant est joignable** : il se trouve dans un réseau directement connecté (testez `ping` du voisin).
3. On a dressé la **liste de tous les réseaux** et identifié ceux que chaque routeur **ne connaît pas encore**.

## 3.2.3 La commande `ip route` (Cisco IOS)

```text
R1(config)# ip route RÉSEAU MASQUE {SAUT-SUIVANT | INTERFACE} [DISTANCE]
```

Trois façons d'indiquer la sortie :

| Forme | Exemple | Remarque |
|---|---|---|
| **Saut suivant** | `ip route 10.0.4.0 255.255.254.0 1.1.1.5` | La plus courante ; recherche récursive |
| **Interface de sortie** | `ip route 10.0.4.0 255.255.254.0 g1/0` | Pour les liens point à point seulement ; sur Ethernet, le routeur fera un ARP pour **chaque** destination |
| **Les deux** | `ip route 10.0.4.0 255.255.254.0 g1/0 1.1.1.5` | La plus précise, conseillée sur Ethernet |

### Les 5 types de routes statiques

| Type | Exemple | Usage |
|---|---|---|
| **Route de réseau** | `ip route 10.0.4.0 255.255.254.0 1.1.1.5` | Atteindre un sous-réseau distant |
| **Route par défaut** | `ip route 0.0.0.0 0.0.0.0 1.1.1.5` | « Tout le reste » : sortie vers Internet |
| **Route d'hôte** (/32) | `ip route 8.8.8.8 255.255.255.255 1.1.1.5` | Un seul équipement |
| **Route flottante** | `ip route 0.0.0.0 0.0.0.0 1.1.1.9 200` | Secours : AD élevée, activée si la principale tombe |
| **Route résumée** | `ip route 10.0.0.0 255.255.248.0 1.1.1.14` | Une route pour plusieurs réseaux |

## 3.2.4 La méthode en 6 étapes pour construire des tables de routage

1. **Lister tous les réseaux** de la topologie (LAN et liaisons routeur-routeur) avec leur adresse/masque.
2. **Pour chaque routeur**, repérer les réseaux **directement connectés** (ils sont déjà présents, code `C`).
3. **Les autres réseaux** sont ceux à ajouter : un par un, ou résumés.
4. **Pour chaque réseau inconnu**, trouver **par quel voisin direct** passe le plus court chemin : ce voisin est le saut suivant.
5. **Écrire la route** : `ip route réseau masque saut-suivant`. Le saut suivant est toujours une **adresse du voisin** du **côté du lien commun**.
6. **Vérifier la route de retour** : pour chaque réseau, les routeurs situés de l'autre côté savent-ils revenir ?

:::exemple Trois routeurs en ligne
```text
LAN1 192.168.1.0/24 -- R1 --[10.0.12.0/30]-- R2 --[10.0.23.0/30]-- R3 -- LAN3 192.168.3.0/24
R1 : g0/0 = 192.168.1.1  g0/1 = 10.0.12.1
R2 : g0/0 = 10.0.12.2    g0/1 = 10.0.23.1
R3 : g0/0 = 10.0.23.2    g0/1 = 192.168.3.1
```

Réseaux connus par chaque routeur sans configuration :
- R1 : LAN1, 10.0.12.0/30. R2 : 10.0.12.0/30, 10.0.23.0/30. R3 : 10.0.23.0/30, LAN3.

À ajouter :
```text
R1(config)# ip route 10.0.23.0 255.255.255.252 10.0.12.2
R1(config)# ip route 192.168.3.0 255.255.255.0 10.0.12.2
R2(config)# ip route 192.168.1.0 255.255.255.0 10.0.12.1
R2(config)# ip route 192.168.3.0 255.255.255.0 10.0.23.2
R3(config)# ip route 10.0.12.0 255.255.255.252 10.0.23.1
R3(config)# ip route 192.168.1.0 255.255.255.0 10.0.23.1
```

R1 et R3 sont des routeurs d'extrémité : on pourrait remplacer leurs deux routes par une seule route par défaut (`ip route 0.0.0.0 0.0.0.0 10.0.12.2` sur R1).
:::

:::retenir Compter les routes
Pour **N réseaux** au total, un routeur connecté à `k` d'entre eux a besoin de **N − k routes** statiques (sans résumé ni route par défaut). Cela montre pourquoi le routage statique ne passe pas à l'échelle.
:::

## 3.2.5 Les routes avancées

### La route par défaut

Elle s'écrit `0.0.0.0/0` : masque `0.0.0.0`, tous les bits sont « joker », elle a le **préfixe le plus court**, donc ne gagne que si rien de plus précis ne correspond. Elle apparaît avec `*` : `Gateway of last resort is ... to network 0.0.0.0`.

### La route flottante (liaison de secours)

On crée une route de secours dont la **distance administrative est supérieure** à celle de la route principale. Tant que la principale est active, la flottante reste **invisible** dans la table ; quand la principale disparaît (lien tombé), la flottante prend la relève.

```text
ip route 0.0.0.0 0.0.0.0 1.1.1.5          ! principale, AD 1
ip route 0.0.0.0 0.0.0.0 1.1.1.9 200      ! secours, AD 200
```

Attention : une route avec **saut suivant** ne disparaît que si l'**interface de sortie tombe** ; si la panne est plus loin sur le chemin, la route reste en place. Pour tester vraiment la disponibilité, on associe un suivi (*IP SLA* / `track`).

### Équilibrage de charge

Deux routes statiques vers le même réseau avec la **même AD** sont **toutes les deux installées** : le routeur répartit le trafic (équilibrage par flux ou par paquet selon la configuration).

### La route nulle `Null0`

```text
ip route 10.0.0.0 255.255.248.0 Null0
```

Interface « poubelle » : les paquets sont jetés sans message. On l'utilise avec un **résumé**, pour éviter les boucles et trous noirs, ou pour **bloquer** un réseau.

### Supprimer ou modifier une route

On supprime avec `no` suivi de **la commande exacte** : `no ip route 10.0.4.0 255.255.254.0 1.1.1.5`. Pour modifier, supprimer puis recréer. `show running-config | include ip route` liste toutes les routes statiques.

## 3.2.6 Vérifier

```text
show ip route                 ! la table complète
show ip route static          ! seulement les routes statiques
show ip route 10.0.4.7        ! la route choisie pour une destination
show ip interface brief       ! état et adresses des interfaces
ping 10.0.4.7 source g0/0     ! ping étendu : la source compte !
traceroute 10.0.4.7
```

:::attention Le ping étendu, l'arme des experts
Un ping émis depuis un routeur prend comme source l'adresse de l'**interface de sortie** : il peut réussir alors que le PC échoue. Testez avec `ping DEST source INTERFACE-DU-LAN` pour simuler un vrai PC et révéler les routes de **retour** manquantes.
:::

## 3.2.7 Autres plateformes

| Plateforme | Route par défaut | Route de réseau |
|---|---|---|
| **Cisco IOS** | `ip route 0.0.0.0 0.0.0.0 1.1.1.5` | `ip route 10.0.4.0 255.255.254.0 1.1.1.5` |
| **Linux** | `ip route add default via 1.1.1.5` | `ip route add 10.0.4.0/23 via 1.1.1.5` |
| **Windows** | `route add 0.0.0.0 mask 0.0.0.0 1.1.1.5` (`-p` = permanente) | `route add 10.0.4.0 mask 255.255.254.0 1.1.1.5` |
| **MikroTik** | `/ip route add dst-address=0.0.0.0/0 gateway=1.1.1.5` | `/ip route add dst-address=10.0.4.0/23 gateway=1.1.1.5` |
| **Huawei** | `ip route-static 0.0.0.0 0 1.1.1.5` | `ip route-static 10.0.4.0 23 1.1.1.5` |

Pour qu'un **routeur Linux** fasse suivre les paquets : `sudo sysctl -w net.ipv4.ip_forward=1` (permanent dans `/etc/sysctl.d/`).

## 3.2.8 Dépannage : du plus près au plus loin

1. `show ip interface brief` : interfaces `up/up` ? adresses correctes ?
2. **Ping du voisin direct**, puis du routeur suivant, jusqu'à la destination.
3. `show ip route` : la route vers le réseau existe-t-elle sur **chaque** routeur du chemin, **aller et retour** ?
4. `traceroute` : où le trajet s'arrête-t-il ?
5. Vérifier **masque**, **passerelle du PC** et **pare-feu/ACL**.

### Les erreurs classiques

| Erreur | Effet |
|---|---|
| Route de retour oubliée | Ping `timed out` |
| Mauvais saut suivant (adresse de son propre côté du lien) | Route absente ou paquets perdus |
| Mauvais masque dans la route | Réseau non joint ou trop large |
| Interface en `shutdown` | Route `C` absente |
| Saut suivant non joignable | Route non installée |
| Passerelle de PC erronée | Aucune sortie du LAN |
| Boucle (A pointe vers B, B vers A) | `TTL expired in transit` |
| Route par défaut manquante | Internet inaccessible |

:::examen Ce qui tombe à l'examen
Donner la table de routage de chaque routeur d'un schéma, en distinguant **réseaux connectés** (C) et **routes à ajouter** (S) ; écrire les commandes `ip route` ; proposer une route par défaut ; expliquer une route flottante.
:::

## 3.2.9 Exercices corrigés

**Exercice 1.** Écrivez la route par défaut d'un routeur dont le fournisseur est `203.0.113.1`.

<details>
<summary>Voir le corrigé</summary>

```text
ip route 0.0.0.0 0.0.0.0 203.0.113.1
```

</details>

**Exercice 2.** Dans l'exemple des trois routeurs, combien de routes statiques sur R2 si on ajoute un LAN2 `192.168.2.0/24` sur R2 ? Sur R1 ?

<details>
<summary>Voir le corrigé</summary>

R2 connaît LAN2 (connecté) ; ses routes : LAN1 et LAN3 → **2 routes**. R1 : réseaux = LAN1, LAN2, LAN3, 2 liaisons = 5 ; connectés : 2 ; routes nécessaires : 3 (ou 1 route par défaut).

</details>

**Exercice 3.** Écrivez une route flottante de secours via `10.0.9.2` pour le réseau `172.16.0.0/16` dont la principale passe par `10.0.8.2`.

<details>
<summary>Voir le corrigé</summary>

```text
ip route 172.16.0.0 255.255.0.0 10.0.8.2
ip route 172.16.0.0 255.255.0.0 10.0.9.2 200
```

</details>

**Exercice 4.** Pourquoi `ip route 10.0.4.0 255.255.254.0 g1/0` est-il déconseillé sur un lien Ethernet multi-accès ?

<details>
<summary>Voir le corrigé</summary>

Avec seulement l'interface, le routeur considère la destination comme **directement connectée** et émet une requête ARP pour **chaque adresse de destination** : lourd et fragile. On préfère le saut suivant (ou les deux).

</details>

**Exercice 5.** Résumez et écrivez en une route les réseaux `10.0.0.0/23`, `10.0.2.0/23`, `10.0.4.0/23`, `10.0.6.0/23` via `1.1.1.14`.

<details>
<summary>Voir le corrigé</summary>

```text
ip route 10.0.0.0 255.255.248.0 1.1.1.14
```

(10.0.0.0/21 couvre exactement les quatre réseaux.)

</details>

**Exercice 6.** Un PC peut pinguer sa passerelle mais pas Internet. Donnez trois vérifications dans l'ordre.

<details>
<summary>Voir le corrigé</summary>

1. `show ip route` du routeur : y a-t-il une route par défaut vers l'opérateur ?
2. Le routeur pingue-t-il l'opérateur ? (interface, adresse).
3. NAT et route de retour côté opérateur (chapitre 4.2).

</details>

**Exercice 7.** Écrivez, pour un routeur Linux, l'activation du routage et une route vers `192.168.50.0/24` via `10.0.0.2`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo sysctl -w net.ipv4.ip_forward=1
sudo ip route add 192.168.50.0/24 via 10.0.0.2
```

</details>

**Exercice 8.** Deux routes vers `10.9.0.0/16` : via A (AD 1) et via B (AD 1). Que se passe-t-il ?

<details>
<summary>Voir le corrigé</summary>

Les deux sont installées : **équilibrage de charge** entre A et B.

</details>
