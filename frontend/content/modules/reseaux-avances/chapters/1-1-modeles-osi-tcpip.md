## 1.1.1 Pourquoi des modèles en couches ?

Imaginez l'envoi d'un colis de Cotonou à Paris. Vous n'avez pas besoin de savoir quel avion le transportera : vous donnez le colis au bureau de poste, qui le confie à un trieur, puis à un transporteur, puis à un livreur. **Chaque métier ne connaît que son voisin direct.** Un réseau fonctionne exactement ainsi : le travail est découpé en **couches**, chacune rend un service à la couche du dessus et utilise celui de la couche du dessous.

Ce découpage apporte trois avantages concrets :

- **Indépendance** : on peut changer le Wi-Fi pour un câble sans toucher au navigateur web.
- **Standardisation** : des constructeurs différents (Cisco, Huawei, MikroTik, Linux) dialoguent parce qu'ils respectent les mêmes règles à chaque couche.
- **Dépannage** : on teste couche par couche, du câble vers l'application.

### Un peu d'histoire

Au milieu des années 1970, l'agence américaine **ARPA** développe un réseau à commutation de paquets conçu pour résister à des pannes massives. Chaque constructeur avait alors sa propre pile (SNA d'IBM, DECnet de DEC, DSA de Bull). Pour les interconnecter, l'**ISO** publie le modèle **OSI**, tandis que la pile **TCP/IP**, née du réseau ARPA, s'impose dans les faits. Elle n'appartient à aucun constructeur : l'**IETF** (ingénierie à court et moyen terme) et l'**IRTF** (recherche), sous l'**IAB**, publient des documents appelés **RFC** (*Request For Comments*), numérotés séquentiellement. Exemples à connaître : RFC 791 (IP), RFC 768 (UDP), RFC 1918 (adresses privées).

## 1.1.2 Le modèle OSI en 7 couches

| N° | Couche | Rôle | Unité de données | Exemples |
|---|---|---|---|---|
| 7 | Application | Interface avec le programme | Données | HTTP, DNS, SMTP |
| 6 | Présentation | Format, chiffrement, compression | Données | TLS, JPEG |
| 5 | Session | Ouverture et gestion des dialogues | Données | RPC, NetBIOS |
| 4 | Transport | Livraison de bout en bout, ports | Segment (TCP) / Datagramme (UDP) | TCP, UDP |
| 3 | Réseau | Adressage logique et routage | Paquet | IP, ICMP |
| 2 | Liaison de données | Livraison sur un même lien, adresses MAC | Trame | Ethernet, Wi-Fi |
| 1 | Physique | Transmission des bits | Bits | Câble, fibre, ondes |

Moyen mnémotechnique pour retenir de 7 à 1 : **A**ucun **P**ays **S**ans **T**ravail **R**éel **L**ibère **P**ersonne.

:::retenir Les trois couches qui comptent le plus
Pour un administrateur réseau, **la couche 2 (MAC, commutateurs)**, **la couche 3 (IP, routeurs)** et **la couche 4 (ports, TCP/UDP)** concentrent 90 % du travail. Un **commutateur** (switch) travaille en couche 2, un **routeur** en couche 3, un **pare-feu** en couches 3 et 4 (voire 7).
:::

## 1.1.3 Le modèle TCP/IP en 4 couches

La pile réellement utilisée sur Internet regroupe les couches OSI :

| TCP/IP | Correspond à OSI | Contenu | Exemple d'adresse |
|---|---|---|---|
| Application | 5, 6, 7 | Programmes utilisateurs, DNS | `www.eneam.bj` |
| Transport | 4 | Communication de bout en bout (TCP ou UDP) | Port `443` |
| Internet (Réseau) | 3 | Adressage IP et routage | `1.1.1.1/24` ou `2001:db8::1/64` |
| Accès réseau (Lien) | 1 et 2 | Pilote de la carte, câble | MAC `00:99:1a:bf:ee:90` |

On distingue deux niveaux de communication : **intra-réseau** (couche lien : on parle à une machine du même segment grâce à son adresse MAC) et **inter-réseau** (couche IP : on traverse des routeurs grâce à l'adresse IP).

## 1.1.4 L'encapsulation, au cœur de tout

Quand une application envoie des données, chaque couche **ajoute son en-tête** (et parfois une fin) : c'est l'**encapsulation**. À l'arrivée, chaque couche retire le sien : la **désencapsulation**.

```text
Application   : [ Données HTTP ]
Transport     : [ En-tête TCP | Données HTTP ]                 = segment
Réseau        : [ En-tête IP | En-tête TCP | Données ]          = paquet
Liaison       : [ En-tête Ethernet | paquet IP | FCS ]          = trame
Physique      : 0101101001...                                   = bits
```

:::exemple Une page web de A vers B
Le navigateur de A prépare une requête HTTP. TCP ajoute les ports (source 51000, destination 80). IP ajoute les adresses (10.0.0.5 vers 192.168.1.9). Ethernet ajoute les adresses MAC **du prochain saut** (la passerelle), pas celles de B. Sur chaque routeur, la trame est ouverte, le paquet IP lu, puis une **nouvelle trame** est fabriquée pour le saut suivant. Les adresses IP restent les mêmes de bout en bout ; les adresses MAC changent à chaque saut.
:::

### La règle d'or

> **Les adresses MAC changent à chaque saut ; les adresses IP source et destination ne changent pas (sauf NAT).**

Cette phrase résout la moitié des questions de routage posées à l'examen.

## 1.1.5 Équipements et domaines

| Équipement | Couche | Décide selon | Sépare les domaines de... |
|---|---|---|---|
| Concentrateur (hub) | 1 | rien, répète tout | rien (obsolète) |
| Pont / commutateur (switch) | 2 | adresse MAC | collision |
| Routeur | 3 | adresse IP | **diffusion** (broadcast) |
| Pare-feu | 3-4 (-7) | IP, ports, état | trafic autorisé ou non |

Un **domaine de diffusion** est l'ensemble des machines qui reçoivent un message envoyé « à tous ». Un routeur ne le transmet pas ; un VLAN le divise aussi (chapitre 4.1).

## 1.1.6 Les outils de base pour observer les couches

```bash
ip link                 # couche 2 : interfaces, adresses MAC
ip -br a                # couche 3 : adresses IP
ss -tulnp               # couche 4 : ports en écoute
ping 8.8.8.8            # test de bout en bout (ICMP)
traceroute 8.8.8.8      # chemin, routeur par routeur
sudo tcpdump -i eth0 -n # capturer les trames
```

Wireshark permet de visualiser les couches : repérez la valeur **EtherType** (`0x0800` = IPv4, `0x0806` = ARP, `0x86DD` = IPv6) puis le champ **Protocole** de l'en-tête IP (`1` = ICMP, `6` = TCP, `17` = UDP).

:::attention Confusions fréquentes
Ne dites pas « l'adresse MAC de Google » : la MAC n'a de sens que sur le **lien local**. Ne confondez pas **trame** (couche 2), **paquet** (couche 3) et **segment** (couche 4). Un « switch de niveau 3 » est un commutateur qui sait aussi router.
:::

:::examen Ce qui tombe à l'examen
Nommer les 7 couches dans l'ordre, placer un protocole ou un équipement sur la bonne couche, expliquer l'encapsulation, dire ce qui change (MAC) et ce qui ne change pas (IP) pendant un trajet.
:::

## 1.1.7 Exercices corrigés

**Exercice 1.** À quelle couche OSI appartiennent : un switch, un routeur, TCP, HTTP, une adresse MAC, une adresse IP ?

<details>
<summary>Voir le corrigé</summary>

Switch : 2. Routeur : 3. TCP : 4. HTTP : 7. Adresse MAC : 2. Adresse IP : 3.

</details>

**Exercice 2.** Donnez le nom de l'unité de données à chaque couche : 2, 3, 4 (TCP).

<details>
<summary>Voir le corrigé</summary>

Couche 2 : **trame**. Couche 3 : **paquet** (ou datagramme IP). Couche 4 TCP : **segment** (UDP : datagramme).

</details>

**Exercice 3.** PC A (réseau X) envoie un paquet à PC B (réseau Y) via deux routeurs. Combien de trames différentes sont fabriquées ? Les adresses IP changent-elles ?

<details>
<summary>Voir le corrigé</summary>

Il y a 3 liens (A-R1, R1-R2, R2-B), donc **3 trames différentes**, avec des adresses MAC différentes. Les adresses IP source et destination restent identiques de bout en bout.

</details>

**Exercice 4.** Quelle est la différence entre un domaine de collision et un domaine de diffusion ? Quel équipement sépare chacun ?

<details>
<summary>Voir le corrigé</summary>

- Domaine de collision : machines qui se partagent un même support ; chaque port de **switch** crée son propre domaine.
- Domaine de diffusion : machines qui reçoivent une diffusion ; seul un **routeur** (ou un VLAN) le délimite.

</details>

**Exercice 5.** Dans Wireshark, vous voyez EtherType `0x0806`. Quel protocole est transporté ? Et si le champ Protocole IP vaut `17` ?

<details>
<summary>Voir le corrigé</summary>

`0x0806` : **ARP**. Protocole IP `17` : **UDP** (TCP vaut 6, ICMP vaut 1).

</details>

**Exercice 6.** Associez chaque couche TCP/IP à ses équivalents OSI.

<details>
<summary>Voir le corrigé</summary>

Application = OSI 5, 6, 7. Transport = OSI 4. Internet = OSI 3. Accès réseau = OSI 1 et 2.

</details>

**Exercice 7.** Quelle commande Linux montre l'adresse MAC de l'interface, laquelle montre les ports en écoute ?

<details>
<summary>Voir le corrigé</summary>

`ip link` (champ `link/ether`) et `ss -tulnp`.

</details>
