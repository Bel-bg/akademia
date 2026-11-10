## B.1 La méthode d'examen en 8 réflexes

1. **Lire tout le sujet** (5 minutes) et repérer les questions les plus rapides : masques, ports, commandes, qui rapportent des points sûrs.
2. **Redessiner le schéma** : tous les réseaux, toutes les adresses de liaison, les passerelles des LAN.
3. **Poser les blocs en colonne** pour tout calcul d'adresse : `0, 16, 32...` ou `0, 64, 128, 192`. On voit la réponse, on ne calcule plus.
4. **Pour les tables de routage** : un tableau par routeur : réseau, code (**C** connecté, **S** statique), saut suivant. Remplir d'abord les C.
5. **Chaque route a un saut suivant du côté du voisin** : jamais sa propre adresse.
6. **Pense retour** : à chaque route aller, demander « et le retour ? ».
7. **Commandes complètes et exactes** : masque en décimal pour Cisco (`255.255.254.0`), `/n` pour Linux.
8. **Vérifier** : somme des tailles de blocs, absence de chevauchement, `no shutdown` n'est pas oublié.

## B.2 Fiche de calcul d'adresses

| Je cherche | Je fais |
|---|---|
| Taille d'un bloc | `2^(32 − n)` |
| Hôtes utilisables | `2^(32 − n) − 2` |
| Pas dans l'octet critique | `256 − valeur du masque` |
| Réseau | plus grand multiple du pas ≤ valeur de l'octet |
| Diffusion | réseau suivant − 1 |
| Masque d'une plage | taille de la plage → `/n` (puissance de 2 alignée) |
| Masque générique | `255` − chaque octet du masque |
| Résumé de routes | préfixe binaire commun |
| Masque d'un nombre d'hôtes | plus petit `h` avec `2^h − 2 ≥ hôtes` |

### Masques à connaître

| /n | Masque | Pas | Hôtes |
|---|---|---|---|
| /30 | 255.255.255.252 | 4 | 2 |
| /29 | .248 | 8 | 6 |
| /28 | .240 | 16 | 14 |
| /27 | .224 | 32 | 30 |
| /26 | .192 | 64 | 62 |
| /25 | .128 | 128 | 126 |
| /24 | 255.255.255.0 | 256 | 254 |
| /23 | 255.255.254.0 | 2 (3e octet) | 510 |
| /22 | 255.255.252.0 | 4 | 1 022 |
| /21 | 255.255.248.0 | 8 | 2 046 |
| /20 | 255.255.240.0 | 16 | 4 094 |
| /16 | 255.255.0.0 | 1 (2e octet 256) | 65 534 |

## B.3 Les 10 règles d'or du routage

1. Sans route de retour, il n'y a pas de communication.
2. Le préfixe le plus long l'emporte, puis la distance administrative, puis la métrique.
3. Une route `C` n'existe que si l'interface est `up/up` avec une adresse.
4. Le saut suivant doit être **directement joignable**.
5. Un routeur d'extrémité n'a besoin que d'une route par défaut.
6. Résumez seulement des blocs contigus et alignés.
7. Toute route résumée mérite une route `Null0` (ou une analyse des trous noirs).
8. Testez du plus près au plus loin : voisin, puis routeur suivant, puis destination.
9. Utilisez le **ping étendu** avec la bonne source pour tester le retour.
10. Documentez : une topologie sans tableau d'adressage est une panne à venir.

## B.4 Aide-mémoire des commandes

### Cisco IOS

```text
show ip interface brief                  ! interfaces et adresses
show ip route [static|ospf]              ! table de routage
show ip ospf neighbor                    ! voisins OSPF
show vlan brief / show interfaces trunk  ! VLAN
show access-lists / show ip nat translations
ip route R M SAUT [AD]                   ! route statique (flottante avec AD)
router ospf N / network A W area 0 / passive-interface
ping X source Y / traceroute X
copy running-config startup-config       ! enregistrer
```

### Linux

```bash
ip -br a ; ip r ; ip neigh ; ip route get X
ip route add R/n via SAUT ; ip route add default via SAUT
ss -tulnp ; nc -zv H P ; dig @S nom ; tcpdump -i eth0 -n
sysctl -w net.ipv4.ip_forward=1
docker run -d -p HOTE:CONTENEUR image
```

### Ports

HTTP 80 · HTTPS 443 · SSH 22 · Telnet 23 · FTP 20/21 · SMTP 25 · DNS 53 · DHCP 67/68 · TFTP 69 · NTP 123 · SNMP 161/162 · LDAP 389 · LDAPS 636 · BGP 179 · Syslog 514 · MySQL 3306 · PostgreSQL 5432 · RDP 3389.

### Distances administratives

Connecté 0 · Statique 1 · eBGP 20 · EIGRP 90 · **OSPF 110** · IS-IS 115 · **RIP 120** · iBGP 200.

## B.5 Les 10 erreurs qui coûtent des points

| Erreur | Correction |
|---|---|
| Donner une adresse de réseau ou de diffusion à une machine | La première et la dernière adresse du bloc sont réservées |
| Oublier de retirer 2 pour les hôtes | `2^h − 2` |
| Mélanger masque et masque générique (OSPF, ACL) | OSPF/ACL = wildcard |
| Écrire `/23` pour Cisco | Cisco `ip route` : masque décimal |
| Saut suivant = sa propre interface | Le saut suivant est l'adresse du **voisin** |
| Oublier la route de retour | Vérifier chaque réseau dans les deux sens |
| Oublier `no shutdown` | Interfaces Cisco désactivées par défaut |
| `redistribute connected` sans `subnets` | Ajouter `subnets` |
| Résumé qui couvre des réseaux inexistants | Vérifier la couverture exacte |
| Réponse sans unités ou sans méthode | Écrire le calcul, même court |

## B.6 Entraînement : programme de 4 semaines

| Semaine | Objectif | Exercices |
|---|---|---|
| 1 | Binaire, masques, réseau/diffusion | 30 calculs par jour, sans calculatrice, chronométrés |
| 2 | Subnetting, VLSM, résumé | Épreuves 2 à 6 du module |
| 3 | Routage statique et OSPF sur Packet Tracer ou GNS3 | Reconstruire l'étude de cas, ajouter une panne |
| 4 | VLAN, DHCP, NAT, ACL, Docker, puis **examens blancs** | Épreuves de synthèse en conditions réelles (2 h) |

### Grille d'auto-évaluation

- Je convertis un octet en binaire en moins de 10 secondes.
- Je donne réseau et diffusion d'une adresse CIDR en moins de 30 secondes.
- Je construis un plan VLSM sans erreur de chevauchement.
- Je lis une table de routage et j'explique chaque ligne.
- Je configure routage statique et OSPF sur un schéma de 5 routeurs.
- Je dépanne une panne de routage avec une méthode.
- Je connais par cœur les 15 ports usuels.

:::retenir La suite logique
Après ce module : **BGP** et l'interconnexion d'opérateurs, **MPLS**, **VPN** (IPsec, WireGuard), **QoS**, **réseaux sans fil**, **automatisation** (Ansible, Python Netmiko), **cloud** (VPC, groupes de sécurité) et préparation aux certifications **CCNA**, puis **CCNP**.
:::

## B.7 Exercices corrigés de synthèse

**Exercice 1.** Donnez réseau et diffusion de `172.30.33.45/12`.

<details>
<summary>Voir le corrigé</summary>

/12 = 255.240.0.0, pas 16 dans le 2e octet ; 30 dans 16-31. Réseau **172.16.0.0**, diffusion **172.31.255.255**.

</details>

**Exercice 2.** Donnez réseau et diffusion de `10.0.38.1/23`.

<details>
<summary>Voir le corrigé</summary>

Pas 2 dans le 3e octet ; 38 est pair : réseau **10.0.38.0**, diffusion **10.0.39.255**.

</details>

**Exercice 3.** Quel masque couvre `192.168.0.0 - 192.168.63.255` ?

<details>
<summary>Voir le corrigé</summary>

64 × 256 = 2¹⁴ adresses : **/18** = 255.255.192.0.

</details>

**Exercice 4.** Écrivez la route par défaut d'un routeur d'extrémité dont le voisin est `1.1.1.14`.

<details>
<summary>Voir le corrigé</summary>

`ip route 0.0.0.0 0.0.0.0 1.1.1.14`

</details>

**Exercice 5.** Écrivez la commande Docker qui lance `nginx:latest` en publiant le port 8080 de l'hôte vers le port 80.

<details>
<summary>Voir le corrigé</summary>

`docker run -d -p 8080:80 nginx:latest`

</details>

**Exercice 6.** Quelle distance administrative pour OSPF et RIP ? Quel port pour NTP et SNMP ?

<details>
<summary>Voir le corrigé</summary>

OSPF 110, RIP 120 ; NTP UDP 123, SNMP UDP 161 (traps 162).

</details>

**Exercice 7.** Classez par ordre de priorité : AD, longueur de préfixe, métrique.

<details>
<summary>Voir le corrigé</summary>

1. **Longueur de préfixe** (le plus long). 2. **AD** (la plus basse). 3. **Métrique** (la plus basse).

</details>
