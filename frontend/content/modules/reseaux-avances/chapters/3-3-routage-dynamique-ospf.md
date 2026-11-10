## 3.3.1 Pourquoi un routage dynamique ?

Le routage statique ne tient pas quand le réseau grandit ou change. Avec un **protocole de routage dynamique**, les routeurs **s'échangent leurs informations**, construisent seuls leurs tables et **recalculent** en cas de panne. On parle de **convergence** : le temps nécessaire pour que tous les routeurs aient de nouveau une vision cohérente du réseau.

### Classification

| Famille | Utilisation | Exemples |
|---|---|---|
| **IGP** (*Interior Gateway Protocol*) | À l'intérieur d'un **système autonome** (AS : réseau sous une même administration) | RIP, **OSPF**, EIGRP, IS-IS |
| **EGP** (*Exterior Gateway Protocol*) | **Entre** systèmes autonomes sur Internet | **BGP** (seul EGP utilisé) |

Parmi les IGP :

| | Vecteur de distance | État de lien |
|---|---|---|
| Principe | Chacun annonce « mes distances » à ses voisins (Bellman-Ford) | Chacun annonce **l'état de ses liens** à tous ; chacun calcule le meilleur chemin (Dijkstra, SPF) |
| Vue du réseau | Par rumeur (« voisin dit que... ») | **Carte complète** du réseau |
| Convergence | Lente, sensible aux boucles | Rapide |
| Ressources | Faibles | CPU/RAM plus gourmands |
| Exemples | RIP, EIGRP (avancé) | **OSPF**, IS-IS |

## 3.3.2 RIP en bref

**RIP** (*Routing Information Protocol*) est le plus simple : la métrique est le **nombre de sauts**, limité à **15** (16 = inaccessible), mises à jour toutes les **30 secondes**, AD **120**. RIPv2 transporte le masque (VLSM) et utilise le multicast `224.0.0.9`. Adapté aux petits réseaux ; trop lent et limité pour les grands.

## 3.3.3 OSPF : les notions clés

**OSPF** (*Open Shortest Path First*, RFC 2328 pour OSPFv2/IPv4) est le protocole IGP à état de lien standard de l'entreprise. AD **110**, protocole IP **89**, multicast `224.0.0.5` (tous les routeurs OSPF) et `224.0.0.6` (DR/BDR).

- **Router ID** : identifiant unique du routeur (une adresse IPv4) : celui configuré, sinon la plus haute adresse de loopback, sinon la plus haute adresse d'interface active.
- **Voisins** : deux routeurs d'un même lien deviennent voisins en échangeant des paquets **Hello** (toutes les **10 s** sur Ethernet ; temps mort *dead* = **40 s**). Ils doivent s'accorder sur les temporisateurs, la zone et le masque.
- **Zones (areas)** : OSPF découpe le réseau en zones pour limiter la taille des bases. Tout passe par la **zone 0** (*backbone*).
- **LSA** (*Link State Advertisement*) : messages décrivant l'état des liens, regroupés dans la **LSDB** (base de données d'état de liens), identique pour tous les routeurs d'une zone.
- **Coût** : `100 Mb/s ÷ bande passante` par défaut (référence 100 Mb/s) : FastEthernet = 1, Ethernet 10 Mb/s = 10, Gigabit = **1 aussi** (arrondi), ce qui pose problème. On ajuste avec `auto-cost reference-bandwidth 10000`.
- **DR / BDR** : sur un réseau multi-accès (Ethernet), les routeurs élisent un **Designated Router** et un **Backup** pour limiter les échanges ; l'élection se fait selon la **priorité** puis le **Router ID**.

### Les états d'un voisinage

`Down` → `Init` → `2-Way` → `ExStart` → `Exchange` → `Loading` → **`Full`** (voisinage complet). Sur Ethernet, seuls le DR/BDR atteignent `Full` avec tous ; les autres restent à `2-Way`.

## 3.3.4 Configurer OSPF (Cisco IOS) : deux méthodes

### Méthode 1 : par commande `network` (avec masque générique)

```text
R1(config)# router ospf 100
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.10.10.0 0.0.0.255 area 0
R1(config-router)# network 10.10.11.0 0.0.0.255 area 0
R1(config-router)# redistribute connected subnets
```

Le **masque générique** (*wildcard*) est l'**inverse du masque** : `255.255.255.0` donne `0.0.0.255` ; `255.255.254.0` donne `0.0.1.255`. Les interfaces dont l'adresse **correspond** à une commande `network` entrent dans OSPF et annoncent leur réseau.

### Méthode 2 : directement sur l'interface

```text
R1(config)# router ospf 10
R1(config-router)# passive-interface g0
R1(config-router)# redistribute connected subnets
R1(config-router)# exit
R1(config)# interface g0/0/0
R1(config-if)# ip ospf 10 area 0
R1(config)# interface g0/0/1
R1(config-if)# ip ospf 10 area 0
```

L'interface est engagée dans le processus 10, zone 0 : plus besoin de calculer des masques génériques.

:::retenir Le numéro de processus
Le numéro après `router ospf` (10, 100...) n'a **qu'une signification locale** : deux routeurs voisins peuvent avoir des numéros différents. Ce qui compte pour former le voisinage : la **zone**, le **masque**, les temporisateurs Hello/Dead, l'authentification.
:::

### passive-interface

```text
router ospf 10
 passive-interface g0
```

Une interface **passive** annonce son réseau mais **n'envoie plus de Hello** : on l'utilise sur les LAN d'utilisateurs, où il n'y a pas de routeur voisin. Cela évite qu'un attaquant ou un équipement inconnu ne devienne voisin OSPF.

### redistribute connected subnets

`redistribute connected subnets` injecte dans OSPF les réseaux **directement connectés** qui ne sont pas couverts par une commande `network`/`ip ospf`. Le mot **`subnets`** est indispensable : sans lui, OSPF ne redistribue que les réseaux « classful ».

### Route par défaut dans OSPF

```text
R0(config)# ip route 0.0.0.0 0.0.0.0 nat0       ! route vers Internet
R0(config)# router ospf 10
R0(config-router)# default-information originate
```

Le routeur de sortie **annonce** sa route par défaut à tous les autres.

## 3.3.5 Vérifier OSPF

```text
show ip ospf neighbor            ! voisins et état (FULL)
show ip route ospf               ! routes apprises (code O)
show ip ospf interface brief     ! interfaces, zone, coût, état
show ip protocols                ! résumé des protocoles et réseaux
debug ip ospf adj                ! dépannage (à utiliser avec prudence)
```

:::exemple Pourquoi le voisinage ne monte pas ?
Vérifiez dans l'ordre : lien actif (`ping` du voisin) ; **même sous-réseau et même masque** sur le lien ; **même zone** ; temporisateurs identiques ; pas de `passive-interface` **sur le lien** entre routeurs ; ACL qui bloquerait le protocole 89 ; type de réseau cohérent.
:::

## 3.3.6 Autres protocoles à connaître

- **EIGRP** : protocole avancé (Cisco à l'origine), AD 90, métrique composée (bande passante, délai), convergence très rapide par l'algorithme DUAL.
- **IS-IS** : état de lien, très utilisé chez les opérateurs.
- **BGP** (*Border Gateway Protocol*) : relie les **systèmes autonomes** ; basé sur TCP port **179** ; choisit selon des **politiques** (attributs) et non la vitesse seule ; il porte la table de routage complète d'Internet.

:::attention Statique ou dynamique ?
Statique pour les petits réseaux, les stubs et le secours ; dynamique dès que le réseau a plusieurs chemins ou des changements fréquents. On **combine** souvent les deux : OSPF à l'intérieur et une route par défaut statique vers Internet, annoncée par `default-information originate`.
:::

:::examen Ce qui tombe à l'examen
Écrire la configuration OSPF de 4 routeurs (interfaces + `router ospf` + `network`/`ip ospf area` + `passive-interface`), expliquer wildcard et passive-interface, comparer vecteur de distance et état de lien, donner l'AD d'OSPF (110) et son protocole (89).
:::

## 3.3.7 Exercices corrigés

**Exercice 1.** Donnez le masque générique de `255.255.254.0`, `255.255.255.252` et `255.255.248.0`.

<details>
<summary>Voir le corrigé</summary>

`0.0.1.255`, `0.0.0.3`, `0.0.7.255` (inverse du masque : 255 moins chaque octet).

</details>

**Exercice 2.** Écrivez l'annonce OSPF (méthode `network`) du LAN `10.0.4.0/23` et du lien `1.1.1.8/30`, zone 0, processus 1.

<details>
<summary>Voir le corrigé</summary>

```text
router ospf 1
 network 10.0.4.0 0.0.1.255 area 0
 network 1.1.1.8 0.0.0.3 area 0
```

</details>

**Exercice 3.** À quoi sert `passive-interface g0/0` ? Sur quelles interfaces l'utilise-t-on ?

<details>
<summary>Voir le corrigé</summary>

Empêche l'envoi de Hello OSPF sur cette interface tout en annonçant son réseau. On la met sur les **interfaces LAN** (vers les utilisateurs), jamais sur les liens entre routeurs.

</details>

**Exercice 4.** Citez quatre conditions pour que deux routeurs OSPF deviennent voisins.

<details>
<summary>Voir le corrigé</summary>

Même sous-réseau/masque sur le lien, même zone, mêmes temporisateurs Hello/Dead, même type d'authentification, interface non passive, Router ID différents.

</details>

**Exercice 5.** Quelles sont l'AD et la métrique d'OSPF ? Pour un lien Gigabit avec la référence par défaut, quel coût et quel problème ?

<details>
<summary>Voir le corrigé</summary>

AD 110 ; métrique = coût = 100 Mb/s ÷ bande passante. Gigabit : 100 ÷ 1000 → arrondi à **1**, identique à FastEthernet : on ne distingue plus les liens rapides. Correction : `auto-cost reference-bandwidth 10000` (partout).

</details>

**Exercice 6.** Un routeur reste en état `2-Way` avec son voisin sur un réseau Ethernet. Est-ce une panne ?

<details>
<summary>Voir le corrigé</summary>

Non, c'est **normal** pour deux routeurs ni DR ni BDR : seuls DR et BDR forment `Full` avec tous les autres.

</details>

**Exercice 7.** Comment le routeur R0 annonce-t-il sa sortie Internet à tous les autres ?

<details>
<summary>Voir le corrigé</summary>

Route statique par défaut vers la sortie, puis `default-information originate` dans le processus OSPF.

</details>

**Exercice 8.** Comparez en deux phrases vecteur de distance et état de lien.

<details>
<summary>Voir le corrigé</summary>

Vecteur de distance : chaque routeur ne connaît que ce que ses voisins lui disent (distances), convergence lente, risque de boucle. État de lien : chaque routeur dispose de la **carte complète** de la zone et calcule lui-même les chemins (SPF), convergence rapide mais plus de ressources.

</details>
