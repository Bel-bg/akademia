## 4.3.1 Le réseau en bref : pourquoi et comment

Un réseau fonctionne comme **le service postal**. Pour qu'une lettre arrive, il faut : une **adresse** (l'adresse IP), un **bureau de poste** qui sait où l'envoyer quand le destinataire n'est pas dans le quartier (la **passerelle**), un **annuaire** pour retrouver l'adresse à partir d'un nom (le **DNS**) et un numéro de **boîte aux lettres** dans l'immeuble (le **port**). Quand « Internet ne marche pas », l'administrateur teste ces éléments l'un après l'autre.

### Le modèle TCP/IP en 4 couches

| Couche | Rôle | Exemples | Outil Linux |
|---|---|---|---|
| Application | Le service lui-même | HTTP, SSH, DNS, SMTP | `curl`, `dig`, `ssh` |
| Transport | Livraison entre deux programmes (ports) | TCP, UDP | `ss`, `nc` |
| Internet (réseau) | Adressage et routage | IP, ICMP | `ip a`, `ip r`, `ping` |
| Accès réseau (liaison) | Transmission sur le câble ou le Wi-Fi | Ethernet, adresse MAC | `ip link`, `ip neigh` |

Chaque couche **encapsule** la précédente : les données d'une page web sont placées dans un segment TCP, lui-même dans un paquet IP, lui-même dans une trame Ethernet.

### Adresse IPv4, masque et notation CIDR

Une adresse IPv4 est un nombre de 32 bits écrit en 4 octets : `192.168.1.20`. Le **masque** indique quelle partie désigne le **réseau** et quelle partie désigne la **machine**. La notation **CIDR** compte les bits à 1 du masque : `/24` signifie `255.255.255.0`.

| CIDR | Masque | Adresses utilisables | Exemple |
|---|---|---|---|
| `/8` | 255.0.0.0 | 16 777 214 | 10.0.0.0/8 |
| `/16` | 255.255.0.0 | 65 534 | 172.16.0.0/16 |
| `/24` | 255.255.255.0 | 254 | 192.168.1.0/24 |
| `/26` | 255.255.255.192 | 62 | 192.168.1.0/26 |
| `/27` | 255.255.255.224 | 30 | 172.16.5.128/27 |
| `/30` | 255.255.255.252 | 2 | liaison entre deux routeurs |

Formule : nombre d'hôtes = 2^(32 - préfixe) - 2 (on retire l'adresse du **réseau** et celle de **diffusion**, *broadcast*). Exemple vérifié : `192.168.1.0/26` a pour masque `255.255.255.192`, diffusion `192.168.1.63`, hôtes de `.1` à `.62`. L'adresse `172.16.5.130/27` appartient au réseau `172.16.5.128`, diffusion `172.16.5.159`.

Les plages **privées** (non routées sur Internet) : `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. `127.0.0.1` est la boucle locale (`localhost`) : la machine se parle à elle-même.

### Les autres notions

- **Passerelle par défaut** (*default gateway*) : le routeur vers lequel part tout paquet dont la destination est hors du réseau local. Elle doit être dans le même sous-réseau que la machine.
- **Adresse MAC** : identifiant de 48 bits de la carte réseau (`52:54:00:12:35:02`), utilisé **uniquement sur le réseau local**. Le protocole **ARP** associe une IP voisine à une MAC.
- **DNS** : transforme `www.eneam.bj` en adresse IP (port 53, UDP surtout).
- **Port** : numéro de 0 à 65535 identifiant un service sur une machine. Ports bien connus : 0 à 1023 (réservés à root pour écouter).
- **TCP** : connexion fiable, ordonnée, avec accusés de réception (poignée de main SYN, SYN-ACK, ACK). Pour le web, SSH, le courrier.
- **UDP** : sans connexion, rapide, sans garantie. Pour DNS, DHCP, streaming, VoIP.
- **ICMP** : messages de contrôle et d'erreur (utilisé par `ping` et `traceroute`). Il n'a pas de port.

### Ports usuels

| Port | Service | Port | Service |
|---|---|---|---|
| 20, 21/tcp | FTP | 110/tcp | POP3 |
| 22/tcp | SSH | 143/tcp | IMAP |
| 23/tcp | Telnet (à proscrire) | 443/tcp | HTTPS |
| 25/tcp | SMTP | 3306/tcp | MySQL/MariaDB |
| 53/udp et tcp | DNS | 5432/tcp | PostgreSQL |
| 67, 68/udp | DHCP | 3389/tcp | RDP |
| 80/tcp | HTTP | 123/udp | NTP |

La liste officielle locale est le fichier `/etc/services` :

```bash
grep -w ssh /etc/services
```

```text
ssh		22/tcp				# SSH Remote Login Protocol
```

## 4.3.2 La commande ip (remplace ifconfig)

Le paquet **iproute2** fournit `ip` et `ss`. Les anciens outils (**net-tools** : `ifconfig`, `route`, `arp`, `netstat`) sont **dépréciés** et absents par défaut sur Ubuntu récent, mais l'examen les cite encore.

| Ancien | Moderne | Rôle |
|---|---|---|
| `ifconfig` | `ip a` (`ip addr`) | Voir/ajouter les adresses |
| `ifconfig eth0 up` | `ip link set eth0 up` | Activer une interface |
| `route -n` | `ip r` (`ip route`) | Table de routage |
| `route add default gw 192.168.1.1` | `ip route add default via 192.168.1.1` | Passerelle |
| `arp -n` | `ip neigh` | Voisins (IP vers MAC) |
| `netstat -tulnp` | `ss -tulnp` | Ports en écoute |

### Voir l'état du réseau

```bash
ip -br a
```

```text
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp0s3           UP             192.168.1.20/24 fe80::a00:27ff:fe4e:66a1/64
```

`-br` (*brief*) donne une ligne par interface. La version détaillée :

```bash
ip a show enp0s3
```

```text
2: enp0s3: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:4e:66:a1 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.20/24 brd 192.168.1.255 scope global dynamic enp0s3
       valid_lft 86212sec preferred_lft 86212sec
```

Lecture : `state UP` (interface active), `LOWER_UP` (câble branché), `link/ether` (adresse MAC), `inet` (IPv4 et CIDR), `brd` (diffusion).

```bash
ip link
ip -s link show enp0s3
```

`ip link` liste les interfaces (couche liaison) ; `-s` ajoute les compteurs d'octets, d'erreurs et de paquets perdus.

```bash
ip r
```

```text
default via 192.168.1.1 dev enp0s3 proto dhcp src 192.168.1.20 metric 100
192.168.1.0/24 dev enp0s3 proto kernel scope link src 192.168.1.20 metric 100
```

Première ligne : tout ce qui n'est pas local passe par la passerelle `192.168.1.1`. Deuxième : le réseau local est joignable directement.

```bash
ip neigh
```

```text
192.168.1.1 dev enp0s3 lladdr 52:54:00:12:35:02 REACHABLE
192.168.1.34 dev enp0s3 lladdr 08:00:27:aa:10:5c STALE
```

### Modifier (temporairement)

Ces commandes demandent `sudo` et **ne survivent pas au redémarrage** : elles servent aux tests et au dépannage.

```bash
sudo ip addr add 192.168.50.10/24 dev enp0s3
sudo ip addr del 192.168.50.10/24 dev enp0s3
sudo ip link set enp0s3 down
sudo ip link set enp0s3 up
sudo ip route add default via 192.168.1.1
sudo ip route del default
```

:::attention Ne coupez pas la branche sur laquelle vous êtes assis
Sur un serveur accessible par SSH, `ip link set eth0 down` ou la suppression de la passerelle **coupe votre propre session** et vous ne pouvez plus rien rattraper à distance. Travaillez depuis la console de la machine virtuelle, ou testez d'abord avec `netplan try` (voir 4.3.5).
:::

## 4.3.3 Ports et connexions : ss

`ss` (*socket statistics*) liste les sockets ouvertes, comme `netstat` autrefois.

| Option | Sens |
|---|---|
| `-t` / `-u` | TCP / UDP |
| `-l` | Seulement les sockets **en écoute** (*listening*) |
| `-n` | Numérique : pas de résolution de noms |
| `-p` | Affiche le **processus** (nécessite `sudo` pour ceux des autres) |
| `-a` | Toutes les sockets |
| `-s` | Statistiques résumées |

```bash
sudo ss -tulnp
```

```text
Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
udp   UNCONN 0      0      127.0.0.53%lo:53    0.0.0.0:*         users:(("systemd-resolve",pid=612,fd=14))
tcp   LISTEN 0      128          0.0.0.0:22    0.0.0.0:*         users:(("sshd",pid=801,fd=3))
tcp   LISTEN 0      511          0.0.0.0:80    0.0.0.0:*         users:(("nginx",pid=1210,fd=6))
tcp   LISTEN 0      128             [::]:22       [::]:*         users:(("sshd",pid=801,fd=4))
```

Moyen mnémotechnique : **t**cp, **u**dp, **l**isten, **n**umeric, **p**rocess. L'adresse `0.0.0.0:22` signifie « écoute sur **toutes** les interfaces » ; `127.0.0.1:5432` signifie « accessible seulement depuis la machine elle-même » (important pour la sécurité : une base de données ne doit pas écouter sur `0.0.0.0` sans raison).

```bash
ss -s
```

```text
Total: 438
TCP:   9 (estab 2, closed 1, orphaned 0, timewait 1)
```

`ss -tn state established` montre les connexions établies ; `ss -tn dst 192.168.1.1` filtre par destination.

## 4.3.4 Tester la connectivité

| Commande | Usage |
|---|---|
| `ping -c 4 192.168.1.1` | 4 échos ICMP ; teste la couche IP (`-c` : nombre) |
| `traceroute 8.8.8.8` | Liste les routeurs traversés (paquet `traceroute`) |
| `mtr -r -c 10 8.8.8.8` | ping + traceroute continus, rapport statistique (paquet `mtr-tiny`) |
| `nc -zv hôte 443` | Teste si un **port TCP** est ouvert (`-z` : scan sans envoi, `-v` : bavard) |
| `curl -v http://site` | Dialogue HTTP détaillé |
| `curl -I http://site` | Seulement les en-têtes de la réponse |
| `curl -H "Accept: application/json" http://site` | Ajoute un en-tête |
| `wget http://site/fichier` | Télécharge un fichier (`-c` reprend, `-O nom` renomme) |

```bash
ping -c 3 192.168.1.1
```

```text
PING 192.168.1.1 (192.168.1.1) 56(84) bytes of data.
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=0.612 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=0.498 ms
64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=0.530 ms

--- 192.168.1.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2036ms
rtt min/avg/max/mdev = 0.498/0.547/0.612/0.049 ms
```

Un `ping` qui échoue ne prouve pas que la machine est éteinte : un pare-feu peut bloquer l'ICMP. Pour un **port**, `nc` est plus fiable (sortie vérifiée sur Ubuntu) :

```bash
nc -zv 127.0.0.1 8099
nc -zv 127.0.0.1 8098
```

```text
Connection to 127.0.0.1 8099 port [tcp/*] succeeded!
nc: connect to 127.0.0.1 port 8098 (tcp) failed: Connection refused
```

`Connection refused` : la machine répond mais **personne n'écoute** sur ce port. Un délai sans réponse (*timed out*) évoque plutôt un **pare-feu** qui jette les paquets.

```bash
curl -I http://127.0.0.1:8099/
```

```text
HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/3.13.18
Content-type: text/html
Content-Length: 6
```

## 4.3.5 Noms et DNS

Quand vous tapez `ping www.eneam.bj`, le système cherche l'adresse selon l'ordre défini dans **`/etc/nsswitch.conf`** :

```text
hosts:          files mdns4_minimal [NOTFOUND=return] dns
```

`files` = fichier `/etc/hosts` d'abord, puis `dns` = serveurs listés dans `/etc/resolv.conf`.

```text
# /etc/hosts
127.0.0.1   localhost
127.0.1.1   srv1
192.168.1.10   intranet.eneam.bj   intranet
```

```text
# /etc/resolv.conf (Ubuntu : lien géré par systemd-resolved)
nameserver 127.0.0.53
options edns0 trust-ad
search lan
```

Sur Ubuntu, `127.0.0.53` est un **résolveur local** (`systemd-resolved`) qui interroge les vrais serveurs DNS. Pour voir ces derniers :

```bash
resolvectl status
resolvectl query www.eneam.bj
```

Ne modifiez pas `resolv.conf` à la main : il est régénéré. Donnez les serveurs DNS dans netplan (voir 4.3.6) ou NetworkManager.

| Commande | Sortie |
|---|---|
| `dig www.eneam.bj` | Réponse DNS complète (paquet `dnsutils` ou `bind9-dnsutils`) |
| `dig +short www.eneam.bj` | Seulement l'adresse |
| `dig @8.8.8.8 www.eneam.bj MX` | Interroge **un serveur précis**, type MX |
| `dig -x 8.8.8.8` | Résolution inverse (IP vers nom) |
| `nslookup www.eneam.bj` | Ancien outil, encore courant |
| `host www.eneam.bj` | Version courte |
| `getent hosts www.eneam.bj` | Résolution **comme le système la fait** (lit `/etc/hosts` aussi) |

```bash
getent hosts localhost
```

```text
127.0.0.1       localhost
```

:::retenir dig contre getent
`dig` interroge **directement** un serveur DNS et ignore `/etc/hosts`. `getent hosts` suit `nsswitch.conf` : c'est lui qui montre ce que verront vraiment vos programmes. Si `dig` répond et `getent` non (ou l'inverse), cherchez du côté de `/etc/hosts` ou de `nsswitch.conf`.
:::

### Nom de la machine

```bash
hostnamectl
sudo hostnamectl set-hostname srv-eneam
```

```text
 Static hostname: srv-eneam
       Icon name: computer-vm
  Operating System: Ubuntu 24.04.1 LTS
            Kernel: Linux 6.8.0-45-generic
```

`hostnamectl set-hostname` remplace l'édition manuelle de `/etc/hostname`. Pensez à mettre le nouveau nom en face de `127.0.1.1` dans `/etc/hosts`.

## 4.3.6 Configuration permanente de l'interface

Les commandes `ip` s'effacent au redémarrage. La configuration durable dépend de la distribution.

| Distribution | Outil | Fichier |
|---|---|---|
| Ubuntu serveur | **netplan** | `/etc/netplan/*.yaml` |
| Ubuntu bureau, RHEL, Fedora | **NetworkManager** (`nmcli`) | `/etc/NetworkManager/system-connections/` |
| Debian classique | `ifupdown` | `/etc/network/interfaces` |
| RHEL/CentOS anciens (7 et 8) | scripts `ifcfg` | `/etc/sysconfig/network-scripts/ifcfg-eth0` |

### netplan : DHCP

```yaml
# /etc/netplan/01-reseau.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: true
```

### netplan : adresse statique

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: false
      addresses:
        - 192.168.1.50/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]
```

Règles : **indentation par espaces** (jamais de tabulation), 2 espaces par niveau ; le fichier doit être en `chmod 600` (sinon avertissement) ; `gateway4:` est l'ancienne syntaxe, remplacée par `routes`.

| Commande | Effet |
|---|---|
| `sudo netplan generate` | Vérifie la syntaxe et génère la configuration |
| `sudo netplan try` | Applique, puis **annule seul au bout de 120 s** sans confirmation (touche Entrée) |
| `sudo netplan apply` | Applique définitivement |

:::attention netplan try avant netplan apply
Une erreur d'adresse ou de passerelle dans une session SSH vous enferme dehors. `netplan try` restaure l'ancienne configuration si vous ne confirmez pas : c'est le filet de sécurité de l'administrateur à distance. Vérifiez aussi le nom de l'interface avec `ip -br link` avant d'écrire le fichier.
:::

### NetworkManager : nmcli

```bash
nmcli device status
nmcli connection show
sudo nmcli con mod "Wired connection 1" ipv4.method manual ipv4.addresses 192.168.1.50/24 ipv4.gateway 192.168.1.1 ipv4.dns "1.1.1.1 8.8.8.8"
sudo nmcli con up "Wired connection 1"
```

### Autres fichiers (à reconnaître)

```ini
# /etc/network/interfaces (Debian, outils ifup/ifdown)
auto eth0
iface eth0 inet static
    address 192.168.1.50
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 1.1.1.1
```

```ini
# /etc/sysconfig/network-scripts/ifcfg-eth0 (RHEL 7/8)
DEVICE=eth0
BOOTPROTO=none
ONBOOT=yes
IPADDR=192.168.1.50
PREFIX=24
GATEWAY=192.168.1.1
DNS1=1.1.1.1
```

## 4.3.7 Diagnostic couche par couche

Procédez **du bas vers le haut** : ne cherchez pas un problème DNS si le câble est débranché.

:::exemple Je n'ai pas accès à Internet
```bash
ip -br link                 # 1. interface UP ? câble (LOWER_UP) ?
ip -br a                    # 2. adresse IP présente ? bon réseau ?
ip r                        # 3. route par défaut présente ?
ping -c 2 192.168.1.1       # 4. passerelle joignable ?
ping -c 2 8.8.8.8           # 5. Internet joignable par IP ?
getent hosts www.eneam.bj   # 6. les noms se résolvent ?
curl -I https://www.eneam.bj  # 7. le service répond ?
```
Interprétation : si l'étape 5 réussit et la 6 échoue, c'est **le DNS** (`resolvectl status`, `/etc/resolv.conf`). Si la 4 échoue, vérifiez la passerelle et le câble. Si la 2 montre `169.254.x.x` ou rien, le DHCP n'a pas répondu.
:::

## 4.3.8 Aller plus loin : routeur, namespaces, capture

### Faire d'une machine un routeur

Par défaut, Linux n'achemine pas les paquets d'une interface vers une autre. L'activer :

```bash
sysctl net.ipv4.ip_forward
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-forward.conf
sudo sysctl --system
```

`sysctl -w` agit immédiatement mais disparaît au redémarrage ; le fichier dans `/etc/sysctl.d/` le rend permanent. Les machines du réseau interne doivent alors avoir cette machine pour **passerelle** (le NAT est vu en 4.4).

### Namespaces réseau, veth et bridge (aperçu)

Un **namespace réseau** est une pile réseau isolée (ses interfaces, ses routes) : c'est la brique des conteneurs. Une paire **veth** est un câble virtuel dont chaque extrémité va dans un namespace ; un **bridge** est un commutateur virtuel.

```bash
sudo ip netns add ns1
sudo ip link add veth0 type veth peer name veth1
sudo ip link set veth1 netns ns1
sudo ip addr add 10.10.0.1/24 dev veth0
sudo ip link set veth0 up
sudo ip netns exec ns1 ip addr add 10.10.0.2/24 dev veth1
sudo ip netns exec ns1 ip link set veth1 up
ping -c 2 10.10.0.2
sudo ip netns del ns1
```

À essayer **dans une machine virtuelle**. `ip netns del` retire aussi la paire veth. Un bridge se crée avec `ip link add br0 type bridge`, puis `ip link set veth0 master br0`.

### Capturer le trafic : tcpdump

```bash
sudo tcpdump -i enp0s3 -nn -c 5 port 53
sudo tcpdump -i any -nn icmp
sudo tcpdump -i enp0s3 -w capture.pcap
```

`-nn` : pas de noms ; `-c 5` : arrêt après 5 paquets ; `-w` : écrit un fichier lisible plus tard dans Wireshark. Une expression comme `host 192.168.1.1 and tcp port 80` filtre le trafic.

:::attention Capturer, scanner : seulement chez vous
`tcpdump` voit les données des autres utilisateurs, `nc -z` sur une plage est un balayage de ports. N'utilisez ces outils que sur vos machines ou avec l'autorisation écrite de leur propriétaire : c'est une obligation légale et déontologique.
:::

### Mesurer le débit : iperf3

```bash
iperf3 -s                    # sur le serveur
iperf3 -c 192.168.1.20       # sur le client
```

### Transférer sans rien installer

```bash
nc -l 9000 > recu.txt              # machine B : écoute et écrit
nc 192.168.1.20 9000 &lt; envoi.txt     # machine A : envoie le fichier
```

Sur le `nc` d'Ubuntu (OpenBSD), `nc -l 9000` suffit (avec la version « traditionnelle » : `nc -l -p 9000`). Aucune authentification ni chiffrement : réservé à un réseau de confiance. Pour partager un dossier en HTTP :

```bash
cd ~/partage
python3 -m http.server 8000
```

Depuis un autre poste : `curl http://192.168.1.20:8000/` ou `wget http://192.168.1.20:8000/fichier`. `Ctrl+C` arrête le serveur. Pour limiter l'accès à la machine locale : `python3 -m http.server 8000 --bind 127.0.0.1`.

:::examen Ce qui tombe à l'examen
- Convertir `/26` en masque, calculer le nombre d'hôtes, dire si deux adresses sont dans le même réseau.
- Donner l'équivalent moderne de `ifconfig`, `route`, `netstat`, `arp`.
- Écrire un fichier netplan statique ou la commande `ip` équivalente ; expliquer `netplan try`.
- Lister les ports en écoute (`ss -tulnp`) et nommer les ports 22, 25, 53, 80, 443.
- Diagnostiquer : « ping 8.8.8.8 passe mais pas ping www.google.com ».
:::

## 4.3.9 Exercices corrigés

**Exercice 1.** Donnez le masque et le nombre de machines utilisables pour `10.20.30.0/26`. Quelle est l'adresse de diffusion ?

<details>
<summary>Voir le corrigé</summary>

```text
Masque : 255.255.255.192
Machines : 2^(32-26) - 2 = 62 (de 10.20.30.1 à 10.20.30.62)
Diffusion : 10.20.30.63
```

Le préfixe `/26` laisse 6 bits pour les machines (64 adresses). Le dernier octet vaut 192 car les 2 bits du réseau donnent 128 + 64.

</details>

**Exercice 2.** La machine A a l'adresse `192.168.1.200/24`. Laquelle de ces machines est dans son réseau : `192.168.1.7`, `192.168.2.7` ?

<details>
<summary>Voir le corrigé</summary>

```text
192.168.1.7   : même réseau (192.168.1.0/24)
192.168.2.7   : autre réseau, il faut passer par la passerelle
```

Avec `/24`, les 3 premiers octets désignent le réseau et doivent être identiques.

</details>

**Exercice 3.** Donnez les commandes qui affichent : (a) les adresses IP de façon concise, (b) la passerelle par défaut, (c) les voisins ARP.

<details>
<summary>Voir le corrigé</summary>

```bash
ip -br a
ip r
ip neigh
```

La passerelle est la ligne commençant par `default via`. Équivalents anciens : `ifconfig`, `route -n`, `arp -n`.

</details>

**Exercice 4.** Ajoutez temporairement l'adresse `192.168.50.10/24` à `enp0s3`, vérifiez-la, puis retirez-la.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ip addr add 192.168.50.10/24 dev enp0s3
ip -br a show enp0s3
sudo ip addr del 192.168.50.10/24 dev enp0s3
```

L'adresse s'ajoute à celles déjà présentes (une interface peut en avoir plusieurs) et disparaît de toute façon au redémarrage. Il faut redonner le même CIDR pour la supprimer.

</details>

**Exercice 5.** Quel programme écoute sur le port 80 ? Donnez la commande et expliquez chaque option.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ss -tlnp | grep ':80 '
```

- `-t` TCP, `-l` en écoute, `-n` numérique, `-p` nom et PID du processus (d'où `sudo`).
- `grep ':80 '` (avec l'espace final) évite de confondre avec `:8080`.
- Ancienne forme : `sudo netstat -tlnp | grep :80`.

</details>

**Exercice 6.** Écrivez un fichier netplan donnant à `enp0s3` l'adresse `192.168.10.25/24`, la passerelle `192.168.10.1` et le DNS `1.1.1.1`. Comment l'appliquer sans risque ?

<details>
<summary>Voir le corrigé</summary>

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: false
      addresses: [192.168.10.25/24]
      routes:
        - to: default
          via: 192.168.10.1
      nameservers:
        addresses: [1.1.1.1]
```

```bash
sudo chmod 600 /etc/netplan/01-reseau.yaml
sudo netplan try
```

`netplan try` annule seul la modification si vous ne confirmez pas dans les 120 secondes. On passe à `netplan apply` une fois sûr.

</details>

**Exercice 7.** Le `ping 8.8.8.8` réussit mais `ping www.eneam.bj` répond « Temporary failure in name resolution ». Quel est le diagnostic et que vérifiez-vous ?

<details>
<summary>Voir le corrigé</summary>

```bash
resolvectl status
cat /etc/resolv.conf
dig @8.8.8.8 +short www.eneam.bj
getent hosts www.eneam.bj
```

- Le réseau IP fonctionne (la passerelle et Internet répondent) : la panne est **le DNS**.
- On regarde les serveurs DNS configurés. Si `dig @8.8.8.8` répond, le serveur DNS local est en cause : corriger `nameservers` dans netplan.
- `getent` confirme ce que voient réellement les programmes (`/etc/hosts` compris).

</details>

**Exercice 8.** Faites en sorte que `intranet.eneam.bj` désigne `192.168.1.10` sur votre machine sans DNS, et vérifiez-le.

<details>
<summary>Voir le corrigé</summary>

```bash
echo "192.168.1.10   intranet.eneam.bj intranet" | sudo tee -a /etc/hosts
getent hosts intranet.eneam.bj
```

```text
192.168.1.10    intranet.eneam.bj intranet
```

`/etc/hosts` est consulté avant le DNS (ligne `hosts: files ... dns` de `nsswitch.conf`). On utilise `getent` plutôt que `dig`, qui ignore ce fichier. `tee -a` ajoute sans écraser.

</details>

**Exercice 9.** Comment savoir si le port 443 de `192.168.1.1` est ouvert, et obtenir seulement les en-têtes HTTP d'un site ?

<details>
<summary>Voir le corrigé</summary>

```bash
nc -zv 192.168.1.1 443
curl -I https://www.eneam.bj
```

- `Connection ... succeeded!` : port ouvert ; `Connection refused` : rien n'écoute ; blocage silencieux (délai) : probablement un pare-feu.
- `curl -I` n'envoie qu'une requête HEAD et affiche la ligne de statut (`HTTP/2 200`) et les en-têtes.

</details>

**Exercice 10.** Partagez le dossier `~/cours` en HTTP sur le port 8000, puis expliquez comment un camarade télécharge `tp1.pdf`. Comment limitez-vous l'accès au poste local ?

<details>
<summary>Voir le corrigé</summary>

```bash
cd ~/cours
python3 -m http.server 8000
```

```bash
wget http://192.168.1.20:8000/tp1.pdf
```

- Le serveur sert le répertoire courant ; il s'arrête avec `Ctrl+C`.
- Avec le pare-feu actif, il faut autoriser le port (voir 4.4).
- Pour le limiter à la machine locale : `python3 -m http.server 8000 --bind 127.0.0.1`.
- Ce n'est ni chiffré ni authentifié : usage ponctuel seulement.

</details>
