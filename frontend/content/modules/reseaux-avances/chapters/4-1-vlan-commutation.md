## 4.1.1 Les problèmes d'un réseau « à plat »

Sur un réseau local sans segmentation, **tous les postes reçoivent toutes les diffusions**. Plus il y a de machines, plus le bruit augmente, et tout le monde (invités, comptabilité, serveurs, caméras) partage le même domaine : mauvais pour la **performance** et la **sécurité**. Les **VLAN** (*Virtual LAN*, norme **IEEE 802.1Q**) résolvent ce problème.

Un VLAN permet de :

- **diviser un commutateur physique en plusieurs commutateurs virtuels** ;
- **réduire les domaines de diffusion** (un VLAN = un domaine de diffusion = en général un sous-réseau IP) ;
- **gérer et maintenir** plusieurs réseaux locaux sur **une seule infrastructure** physique ;
- **isoler** les services : seul un routeur (ou un commutateur de niveau 3) autorise le passage de l'un à l'autre.

## 4.1.2 Ports ACCESS et ports TRUNK

| Type de port | Rôle | Étiquette 802.1Q |
|---|---|---|
| **Access** | Relie un **poste** ou un équipement terminal, appartient à **un seul VLAN** | Aucune (le switch l'ajoute/la retire) |
| **Trunk** | Relie **deux commutateurs** (ou commutateur et routeur) et **transporte plusieurs VLAN** | Oui, sauf pour le VLAN natif |

- **VLAN natif** : VLAN dont les trames circulent **sans étiquette** sur un trunk (par défaut le VLAN 1). Bonne pratique : changer le VLAN natif (par exemple 50 ou 99), ne pas laisser d'utilisateurs dans le VLAN 1, et le configurer de la **même façon aux deux bouts** du trunk.
- **VLAN de gestion** : réservé à l'administration des équipements.

### L'étiquette 802.1Q

Sur un trunk, 4 octets sont insérés dans la trame Ethernet, entre l'adresse MAC source et l'EtherType : le **TPID** (`0x8100`) et le **TCI** (priorité sur 3 bits, bit DEI, **identifiant de VLAN sur 12 bits**). Un VLAN-ID va donc de **1 à 4094** (0 et 4095 réservés). La taille maximale de la trame passe de 1518 à 1522 octets.

## 4.1.3 Configuration Cisco

```text
Switch# configure terminal
Switch(config)# vlan 10
Switch(config-vlan)# name filaire
Switch(config)# vlan 20
Switch(config-vlan)# name wifi
Switch(config)# vlan 30
Switch(config-vlan)# name voip
Switch(config)# vlan 50
Switch(config-vlan)# name mgmt

! Port ACCESS pour un poste
Switch(config)# interface f1/10
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
Switch(config-if)# no shutdown

! Port TRUNK vers un autre commutateur
Switch(config)# interface f1/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk native vlan 50
Switch(config-if)# switchport trunk allowed vlan 10,20,30,50
Switch(config-if)# no shutdown
```

Vérifications : `show vlan brief`, `show interfaces trunk`, `show interfaces f1/10 switchport`.

:::attention Les pièges classiques
Un port laissé dans le **mauvais VLAN** (le poste n'obtient pas d'adresse) ; un VLAN **non créé** ou **non autorisé** sur le trunk ; un **VLAN natif différent** aux deux extrémités (message d'erreur *native VLAN mismatch*) ; un trunk qui ne monte pas parce qu'un côté est en `access`.
:::

## 4.1.4 Faire communiquer les VLAN : le routage inter-VLAN

Deux VLAN sont deux **réseaux IP différents** ; il faut un équipement de **couche 3** pour les relier.

### Méthode 1 : « router-on-a-stick » (routeur sur un trunk)

Un seul lien trunk entre le commutateur et le routeur, avec une **sous-interface** par VLAN :

```text
Router(config)# interface g0/0
Router(config-if)# no shutdown
Router(config)# interface g0/0.10
Router(config-subif)# encapsulation dot1Q 10
Router(config-subif)# ip address 10.1.10.1 255.255.255.0
Router(config)# interface g0/0.20
Router(config-subif)# encapsulation dot1Q 20
Router(config-subif)# ip address 10.1.20.1 255.255.255.0
```

Chaque sous-interface est la **passerelle** de son VLAN.

### Méthode 2 : commutateur de niveau 3 (SVI)

```text
Switch(config)# ip routing
Switch(config)# interface vlan 10
Switch(config-if)# ip address 10.1.10.1 255.255.255.0
Switch(config-if)# no shutdown
Switch(config)# interface vlan 20
Switch(config-if)# ip address 10.1.20.1 255.255.255.0
```

Plus rapide et standard dans les entreprises : le routage se fait **dans le commutateur**.

## 4.1.5 L'architecture réseau en 3 couches

Modèle hiérarchique inventé par Cisco :

| Couche | Rôle | Équipements |
|---|---|---|
| **Cœur** (*core*) | Transport très rapide entre sites ou bâtiments, aucun filtrage lourd | Commutateurs/routeurs hautes performances |
| **Distribution** | Regroupe les accès, **routage inter-VLAN**, politiques, ACL, résumé de routes | Commutateurs L3 |
| **Accès** (*access*) | Connecte les postes, VLAN, sécurité de port | Commutateurs L2 |

Pour les petits sites, cœur et distribution sont fusionnés (*collapsed core*, architecture à 2 couches). Le modèle apporte **évolutivité**, **résilience** et **dépannage** plus simple.

## 4.1.6 Protocoles liés à la commutation (à connaître)

- **STP** (*Spanning Tree*, 802.1D/RSTP 802.1w) : empêche les **boucles de couche 2** en bloquant certains liens redondants ; élit un **pont racine**. Sans lui, une trame de diffusion tournerait indéfiniment (« tempête de diffusion »).
- **EtherChannel / LACP** (802.3ad) : agrège plusieurs liens physiques en un seul lien logique.
- **Port security** : limite le nombre d'adresses MAC par port, protège contre le MAC flooding.
- **DTP** : négociation automatique de trunk (à désactiver : `switchport nonegotiate`).
- **VTP** : propagation de la base de VLAN (à utiliser avec précaution).

:::retenir À retenir
Un VLAN = un domaine de diffusion = en général un sous-réseau. **Access** = un VLAN sans étiquette ; **trunk** = plusieurs VLAN avec étiquette 802.1Q (12 bits : 1-4094). Pour relier deux VLAN : routeur (sous-interfaces) ou commutateur L3 (SVI). STP évite les boucles L2.
:::

:::examen Ce qui tombe à l'examen
Écrire la configuration VLAN/access/trunk, expliquer le VLAN natif, configurer le routage inter-VLAN, décrire l'architecture 3 couches, donner le rôle de STP.
:::

## 4.1.7 Exercices corrigés

**Exercice 1.** Deux PC dans deux VLAN différents du même commutateur peuvent-ils se pinguer sans routeur ? Pourquoi ?

<details>
<summary>Voir le corrigé</summary>

Non : deux VLAN = deux domaines de diffusion et deux réseaux IP ; il faut un équipement L3 (routeur ou commutateur de niveau 3).

</details>

**Exercice 2.** Écrivez la configuration d'un port ACCESS pour un poste dans le VLAN 20.

<details>
<summary>Voir le corrigé</summary>

```text
interface f1/5
 switchport mode access
 switchport access vlan 20
 no shutdown
```

</details>

**Exercice 3.** Combien de VLAN utilisables au maximum et pourquoi ?

<details>
<summary>Voir le corrigé</summary>

L'identifiant est sur 12 bits : 4096 valeurs, dont 0 et 4095 réservées, soit **4094** VLAN (1 à 4094).

</details>

**Exercice 4.** Qu'est-ce que le VLAN natif ? Pourquoi conseille-t-on de ne pas utiliser le VLAN 1 ?

<details>
<summary>Voir le corrigé</summary>

Le VLAN dont les trames traversent le trunk **sans étiquette**. Le VLAN 1 est le VLAN par défaut de tous les ports (et du trafic de contrôle) : l'utiliser pour les utilisateurs ou le laisser natif facilite les attaques (VLAN hopping).

</details>

**Exercice 5.** Écrivez la configuration « router-on-a-stick » pour les VLAN 10 (192.168.10.0/24) et 20 (192.168.20.0/24), passerelles .254.

<details>
<summary>Voir le corrigé</summary>

```text
interface g0/0
 no shutdown
interface g0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.254 255.255.255.0
interface g0/0.20
 encapsulation dot1Q 20
 ip address 192.168.20.254 255.255.255.0
```

</details>

**Exercice 6.** Un trunk entre deux switchs ne fait pas passer le VLAN 30. Citez trois causes.

<details>
<summary>Voir le corrigé</summary>

VLAN 30 **non créé** sur un des switchs ; VLAN 30 **non autorisé** (`allowed vlan`) sur le trunk ; port en mode `access` d'un côté ; incohérence de VLAN natif.

</details>

**Exercice 7.** Quel est le rôle des trois couches de l'architecture hiérarchique ?

<details>
<summary>Voir le corrigé</summary>

Accès : raccorder les postes (VLAN). Distribution : agréger, routage inter-VLAN, ACL, résumés. Cœur : transport rapide entre les blocs de distribution.

</details>

**Exercice 8.** Pourquoi STP est-il nécessaire dès qu'il y a des liens redondants entre switchs ?

<details>
<summary>Voir le corrigé</summary>

Sans lui, les trames de diffusion circulent en boucle (pas de TTL en couche 2) : **tempête de diffusion** qui sature le réseau. STP bloque logiquement certains ports pour obtenir une topologie sans boucle.

</details>
