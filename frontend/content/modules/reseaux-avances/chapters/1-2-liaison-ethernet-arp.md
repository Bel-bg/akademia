## 1.2.1 La couche liaison de données

La couche liaison a une mission simple : **faire passer une trame d'une machine à sa voisine directe**, sur le même segment. Elle utilise des adresses **physiques** appelées **adresses MAC** (*Media Access Control*), gravées dans la carte réseau.

### L'adresse MAC

Une adresse MAC est codée sur **48 bits (6 octets)**, écrite en hexadécimal : `AA:FE:90:98:FC:34`.

- Les **3 premiers octets** forment l'**OUI** (identifiant du constructeur), les 3 derniers sont le numéro de la carte.
- L'adresse de diffusion de la couche 2 est `FF:FF:FF:FF:FF:FF` (« tous »).
- Le **bit de poids faible du premier octet** indique l'unicast (0) ou le multicast (1) ; l'avant-dernier bit indique « administrée localement » ou « universelle ».

```bash
ip link show eth0        # ligne link/ether 00:99:1a:bf:ee:90
```

## 1.2.2 La trame Ethernet

```text
| Préambule | MAC dest. (6) | MAC source (6) | EtherType (2) | Données (46 à 1500) | FCS (4) |
```

- **EtherType** : indique ce que contient la trame : `0x0800` IPv4, `0x0806` ARP, `0x86DD` IPv6. Avec un VLAN, une étiquette `0x8100` est insérée (chapitre 4.1).
- **MTU** : la charge utile maximale est de **1500 octets** sur Ethernet.
- **FCS** : somme de contrôle pour détecter les erreurs ; une trame corrompue est jetée.
- Taille minimale d'une trame : 64 octets, d'où un « bourrage » (padding) si les données sont courtes.

## 1.2.3 Le commutateur apprend les adresses

Un switch tient une **table d'adresses MAC** (table CAM) qui associe chaque adresse MAC au port où elle a été vue. Son comportement :

1. **Apprentissage** : il lit la MAC **source** de chaque trame reçue et l'inscrit avec le port d'arrivée.
2. **Transmission** : si la MAC **destination** est connue, il envoie la trame sur ce seul port.
3. **Inondation** (*flooding*) : si elle est inconnue, ou si c'est une diffusion, il l'envoie sur tous les ports sauf celui d'arrivée.
4. **Filtrage** : si la destination est sur le port d'arrivée, il ne renvoie rien.

```text
Switch# show mac address-table
Vlan   Mac Address       Type     Ports
  1    0050.7966.6801    DYNAMIC  Et0/1
```

:::attention Le pont et le switch
Un **pont** relie deux segments en filtrant selon les adresses MAC ; un **switch** est un pont multiports. Les deux travaillent en couche 2 et ne comprennent pas les adresses IP.
:::

## 1.2.4 ARP : passer de l'IP à la MAC

Pour envoyer un paquet à `192.168.1.20`, la machine doit fabriquer une trame avec la **MAC** du destinataire. Le protocole **ARP** (*Address Resolution Protocol*) fournit cette correspondance dynamique.

```text
A (192.168.1.10) veut parler à B (192.168.1.20) :
1. A envoie une REQUÊTE ARP en diffusion (FF:FF:FF:FF:FF:FF) :
   « Qui a 192.168.1.20 ? Répondez à 192.168.1.10 »
2. B répond en unicast : « 192.168.1.20 est à AA:BB:CC:DD:EE:02 »
3. A enregistre la réponse dans son cache ARP et envoie la trame.
```

```bash
ip neigh                # table ARP/voisins sous Linux
arp -a                  # affichage classique (Linux, Windows)
sudo ip neigh flush all # vider le cache
```

**RARP** faisait l'inverse (MAC vers IP) ; il est obsolète, remplacé par **BOOTP** puis **DHCP**.

### Et pour sortir du réseau ?

Si la destination est dans **un autre réseau**, la machine n'interroge pas ARP pour elle : elle interroge ARP pour l'adresse de **sa passerelle par défaut**, et envoie la trame au routeur.

:::exemple Pourquoi le premier ping est parfois plus lent
Le premier paquet déclenche une requête ARP avant d'envoyer l'ICMP. Le cache est ensuite rempli : les paquets suivants partent immédiatement. Sur un routeur Cisco, le premier ping d'une série affiche souvent `.!!!!` : le point correspond au temps perdu à la résolution ARP.
:::

### Quelques attaques à connaître

- **ARP spoofing / poisoning** : un attaquant envoie de fausses réponses ARP pour se faire passer pour la passerelle (attaque de l'homme du milieu).
- **MAC flooding** : saturation de la table CAM pour forcer le switch à tout inonder.
- Parades : *Dynamic ARP Inspection*, *port security* (limiter le nombre de MAC par port), VLAN.

## 1.2.5 Le voisinage en IPv6

IPv6 n'utilise plus ARP : c'est le protocole **NDP** (*Neighbor Discovery*), fondé sur ICMPv6 (messages NS et NA, voir le chapitre 3.4).

## 1.2.6 Diagnostic de couche 2

| Symptôme | Cause probable | Commande |
|---|---|---|
| Lien « down » | Câble, port désactivé | `ip link`, `show interfaces` |
| Pas de réponse ARP | Mauvais VLAN, mauvaise adresse | `ip neigh`, `show mac address-table` |
| Doublon d'adresse IP | Deux machines, même IP | `arping -D`, messages du système |
| Beaucoup de collisions/erreurs | Duplex incohérent, câble défectueux | `ethtool eth0`, `show interfaces` |

:::retenir À retenir
MAC = 48 bits, locale au lien. ARP = IP vers MAC, requête en diffusion, réponse en unicast, cache temporaire. Le switch apprend par la MAC **source**, décide par la MAC **destination**. Une machine qui sort du réseau fait ARP sur la **passerelle**.
:::

:::examen Ce qui tombe à l'examen
Décrire une requête/réponse ARP, lire une table MAC d'un switch, expliquer l'inondation, donner la taille d'une MAC et la valeur d'EtherType pour IPv4/ARP/IPv6.
:::

## 1.2.7 Exercices corrigés

**Exercice 1.** Combien de bits compte une adresse MAC ? Quelle est l'adresse MAC de diffusion ?

<details>
<summary>Voir le corrigé</summary>

48 bits (6 octets). Diffusion : `FF:FF:FF:FF:FF:FF`.

</details>

**Exercice 2.** Un switch reçoit sur son port 3 une trame source `AA`, destination `BB`, et `BB` n'est pas dans la table. Que fait-il, et que retient-il ?

<details>
<summary>Voir le corrigé</summary>

Il retient `AA` → port 3 (apprentissage par la source). Il ne connaît pas `BB` : il **inonde** la trame sur tous les ports sauf le port 3.

</details>

**Exercice 3.** PC1 `192.168.1.10/24` veut joindre `8.8.8.8` (passerelle `192.168.1.1`). Quelle adresse IP PC1 résout-il avec ARP ?

<details>
<summary>Voir le corrigé</summary>

Celle de la **passerelle** `192.168.1.1`, car `8.8.8.8` est hors du réseau. La trame est adressée à la MAC du routeur, avec l'IP de destination `8.8.8.8`.

</details>

**Exercice 4.** Donnez les commandes Linux pour afficher le cache ARP et le vider.

<details>
<summary>Voir le corrigé</summary>

```bash
ip neigh
sudo ip neigh flush all
```

</details>

**Exercice 5.** Quelles sont les 3 valeurs EtherType à connaître ?

<details>
<summary>Voir le corrigé</summary>

`0x0800` IPv4, `0x0806` ARP, `0x86DD` IPv6.

</details>

**Exercice 6.** Expliquez l'attaque ARP spoofing et donnez deux contre-mesures.

<details>
<summary>Voir le corrigé</summary>

L'attaquant diffuse de fausses réponses ARP associant l'IP de la passerelle à **sa** MAC : le trafic passe par lui (homme du milieu). Contre-mesures : *Dynamic ARP Inspection* sur les switchs, entrées ARP statiques pour les machines critiques, *port security*, segmentation en VLAN.

</details>

**Exercice 7.** Un switch relie 4 PC. Combien de domaines de collision et de domaines de diffusion obtient-on ?

<details>
<summary>Voir le corrigé</summary>

**4 domaines de collision** (un par port) et **1 domaine de diffusion** (un switch sans VLAN ne divise pas la diffusion).

</details>
