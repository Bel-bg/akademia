## 4.2.1 DHCP : distribuer les adresses automatiquement

Configurer à la main chaque poste est impossible à grande échelle. Le **DHCP** (*Dynamic Host Configuration Protocol*) attribue automatiquement : **adresse IP, masque, passerelle, serveur DNS**, durée du bail. Il utilise **UDP** : le serveur écoute sur le port **67**, le client sur le port **68**.

### Le dialogue DORA

```text
1. DISCOVER : le client diffuse « Y a-t-il un serveur DHCP ? »      (0.0.0.0 -> 255.255.255.255)
2. OFFER    : un serveur propose une adresse
3. REQUEST  : le client demande officiellement cette adresse
4. ACK      : le serveur confirme et fixe le bail (durée de validité)
```

Un client sans réponse s'attribue une adresse **APIPA** `169.254.x.x`. À mi-bail (50 %), le client demande le **renouvellement**.

### Configuration d'un serveur DHCP sur routeur Cisco

```text
Router(config)# service dhcp
Router(config)# ip dhcp excluded-address 10.1.1.1 10.1.1.20
Router(config)# ip dhcp pool filaire
Router(dhcp-config)# network 10.1.0.0 255.255.0.0
Router(dhcp-config)# default-router 10.1.1.254
Router(dhcp-config)# dns-server 8.8.8.8
Router(dhcp-config)# lease 0 6
```

`ip dhcp excluded-address` réserve des adresses (passerelle, serveurs) ; `lease 0 6` = bail de 0 jour et 6 heures.

### Le relais DHCP

Le DISCOVER est une diffusion : il ne franchit pas un routeur. Pour centraliser un serveur DHCP dans un autre réseau, on configure un **relais** sur l'interface du LAN : `ip helper-address 10.0.0.10`.

### DHCP sous Linux et IPv6

Sous Linux : `isc-dhcp-server`, `dnsmasq`, ou `kea`. En IPv6, deux approches : **SLAAC** (le préfixe annoncé par RA) et **DHCPv6** (avec état ou sans état).

## 4.2.2 DNS : le service d'annuaire

Le **DNS** traduit un **nom** (`www.eneam.bj`) en **adresse IP**. Port **53** (UDP pour les requêtes, TCP pour les transferts de zone). C'est une base **hiérarchique et distribuée** : racine (`.`), domaines de premier niveau (`.bj`, `.com`), domaines (`eneam.bj`), machines.

### Enregistrements à connaître

| Type | Rôle | Exemple |
|---|---|---|
| **A** | Nom vers IPv4 | `www  A  192.0.2.10` |
| **AAAA** | Nom vers IPv6 | `www  AAAA  2001:db8::10` |
| **CNAME** | Alias | `ftp  CNAME  www` |
| **MX** | Serveur de messagerie | `@  MX  10  mail.eneam.bj.` |
| **NS** | Serveur de noms de la zone | `@  NS  ns1.eneam.bj.` |
| **PTR** | Résolution inverse (IP vers nom) | `10.2.0.192.in-addr.arpa` |
| **TXT** | Texte libre (SPF, vérifications) | `v=spf1 ...` |
| **SOA** | Début d'autorité de la zone | |

### Résolution

Le poste interroge son **résolveur** (celui du FAI ou `8.8.8.8`) ; si celui-ci n'a pas la réponse en cache, il interroge la **racine**, puis le serveur du TLD, puis le serveur **faisant autorité** ; la réponse est mise en **cache** pendant la durée **TTL**.

```bash
dig www.eneam.bj                 # requête A
dig @8.8.8.8 eneam.bj MX         # mail, via un serveur précis
dig -x 192.0.2.10                # résolution inverse
nslookup www.eneam.bj
getent hosts www.eneam.bj        # ce que le système voit réellement
```

:::attention Quand « Internet ne marche pas »
`ping 8.8.8.8` fonctionne mais `ping google.com` échoue : le problème est le **DNS** (serveur absent ou erroné dans `/etc/resolv.conf` ou dans la configuration DHCP).
:::

## 4.2.3 NAT : traduire les adresses

Les adresses privées (RFC 1918) ne sont pas routables sur Internet. Le **NAT** (*Network Address Translation*) **réécrit l'adresse IP source** des paquets sortants (privée → publique) et fait l'inverse au retour.

| Type | Principe | Usage |
|---|---|---|
| **NAT statique** | 1 adresse privée ↔ 1 adresse publique fixe | Publier un serveur |
| **NAT dynamique** | Un *pool* d'adresses publiques attribué à la demande | Rare aujourd'hui |
| **PAT / NAT overload** | **Toutes** les adresses privées partagent **une** adresse publique, distinguées par le **port source** | **Cas général** (box Internet) |

### Le PAT en pratique

```text
PC1 192.168.1.10:51000 -> serveur 93.184.216.34:80
Le routeur traduit : 203.0.113.5:40001 -> 93.184.216.34:80   (note dans sa table de traduction)
Réponse : 93.184.216.34:80 -> 203.0.113.5:40001   puis retraduite vers 192.168.1.10:51000
```

### Configuration Cisco (PAT)

```text
Router(config)# interface g0/0
Router(config-if)# ip address 192.168.1.1 255.255.255.0
Router(config-if)# ip nat inside
Router(config)# interface g0/1
Router(config-if)# ip address 203.0.113.5 255.255.255.252
Router(config-if)# ip nat outside
Router(config)# access-list 1 permit 192.168.1.0 0.0.0.255
Router(config)# ip nat inside source list 1 interface g0/1 overload
Router(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.6
```

Vérifier : `show ip nat translations`, `show ip nat statistics`.

### Redirection de port (DNAT)

Pour publier un serveur interne : `ip nat inside source static tcp 192.168.1.50 80 203.0.113.5 80`. Sous Linux, c'est `iptables -t nat -A PREROUTING ...` ou `nft`. Sous Docker, l'option `-p` crée automatiquement des règles DNAT (chapitre 4.4).

### NAT sous Linux (masquerade)

```bash
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

:::retenir À retenir
DHCP : DORA, UDP 67/68, relais par `ip helper-address`. DNS : port 53, A/AAAA/MX/PTR/CNAME. NAT : statique, dynamique, **PAT** (le plus courant, partage une IP grâce aux ports). En IPv6, le NAT n'est pas nécessaire.
:::

:::examen Ce qui tombe à l'examen
Expliquer le dialogue DHCP, écrire une configuration de pool DHCP, distinguer les enregistrements DNS, configurer un PAT avec `inside` / `outside`, expliquer pourquoi le NAT casse le bout en bout.
:::

## 4.2.4 Exercices corrigés

**Exercice 1.** Citez dans l'ordre les 4 messages DHCP et dites lesquels sont diffusés.

<details>
<summary>Voir le corrigé</summary>

Discover (diffusion), Offer, Request (diffusion en général), Ack. Le client n'a pas encore d'adresse, donc ses premiers messages sont en diffusion.

</details>

**Exercice 2.** Un PC affiche `169.254.12.3`. Que s'est-il passé ?

<details>
<summary>Voir le corrigé</summary>

Aucun serveur DHCP n'a répondu : APIPA. Vérifier le lien, le VLAN, le serveur DHCP et le relais.

</details>

**Exercice 3.** Écrivez un pool DHCP pour `192.168.10.0/24`, passerelle `192.168.10.254`, DNS `1.1.1.1`, en excluant `192.168.10.1` à `.20`.

<details>
<summary>Voir le corrigé</summary>

```text
ip dhcp excluded-address 192.168.10.1 192.168.10.20
ip dhcp excluded-address 192.168.10.254
ip dhcp pool LAN10
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.254
 dns-server 1.1.1.1
```

</details>

**Exercice 4.** Quel enregistrement DNS pour un alias `ftp` de `www` ? Pour le serveur de messagerie ?

<details>
<summary>Voir le corrigé</summary>

`ftp  CNAME  www` ; messagerie : enregistrement **MX**.

</details>

**Exercice 5.** Comment le PAT distingue-t-il deux PC qui utilisent le même port source ?

<details>
<summary>Voir le corrigé</summary>

Le routeur attribue à chaque flux un **port source public distinct** et note la correspondance dans sa table de traduction.

</details>

**Exercice 6.** Pourquoi le DISCOVER ne passe-t-il pas un routeur ? Comment centraliser le DHCP ?

<details>
<summary>Voir le corrigé</summary>

C'est une diffusion et un routeur ne les transmet pas. On configure un **relais DHCP** (`ip helper-address @serveur`) sur l'interface du LAN.

</details>

**Exercice 7.** `ping 8.8.8.8` marche, `ping google.com` non. Cause et commande de diagnostic ?

<details>
<summary>Voir le corrigé</summary>

Résolution DNS en panne. Vérifier `cat /etc/resolv.conf` (ou `resolvectl status`) et tester `dig @8.8.8.8 google.com`.

</details>

**Exercice 8.** Quelles commandes Linux transforment une machine en passerelle NAT vers `eth0` ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

</details>
