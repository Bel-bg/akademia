## 4.4.1 Linux, poste de travail de l'ingénieur réseau

Un serveur Linux peut jouer **tous** les rôles réseau : routeur, pare-feu, serveur DHCP/DNS, passerelle NAT. Ce chapitre rassemble les commandes indispensables, la conteneurisation (Docker, où les notions de ports sont constamment utilisées) et les outils d'analyse.

## 4.4.2 La commande `ip` (iproute2)

| Besoin | Commande |
|---|---|
| Interfaces et MAC | `ip link` |
| Adresses (concis) | `ip -br a` |
| Ajouter / retirer une adresse | `ip addr add 192.168.1.50/24 dev eth0` / `ip addr del ...` |
| Activer / désactiver une interface | `ip link set eth0 up` / `down` |
| Table de routage | `ip route` |
| Route statique | `ip route add 10.0.4.0/23 via 1.1.1.5` |
| Route par défaut | `ip route add default via 192.168.1.1` |
| Voisins (ARP/NDP) | `ip neigh` |
| Route utilisée pour une destination | `ip route get 8.8.8.8` |
| Statistiques d'erreurs | `ip -s link` |

Ces commandes sont **temporaires** (perdues au redémarrage). Pour rendre une configuration permanente : **netplan** (Ubuntu : `/etc/netplan/*.yaml` puis `netplan try`/`apply`), **NetworkManager** (`nmcli`), ou les fichiers de `/etc/sysconfig/network-scripts/` (anciennes Red Hat).

```yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses: [192.168.1.50/24]
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
```

### Transformer Linux en routeur

```bash
sudo sysctl -w net.ipv4.ip_forward=1
echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-routage.conf
sudo ip route add 10.0.4.0/23 via 1.1.1.5
```

### Simuler un réseau avec des espaces de noms (*namespaces*)

On peut construire un laboratoire de routage **sans machine virtuelle** :

```bash
sudo ip netns add r1 && sudo ip netns add pc1
sudo ip link add veth-a type veth peer name veth-b
sudo ip link set veth-a netns pc1 && sudo ip link set veth-b netns r1
sudo ip netns exec pc1 ip addr add 10.0.0.2/24 dev veth-a
sudo ip netns exec pc1 ip link set veth-a up
sudo ip netns exec r1  ip addr add 10.0.0.1/24 dev veth-b
sudo ip netns exec r1  ip link set veth-b up
sudo ip netns exec pc1 ping -c1 10.0.0.1
```

## 4.4.3 Docker et les ports

Un **conteneur** est un processus isolé avec **son propre espace réseau**. Par défaut, il est branché sur un réseau interne (`bridge`, en général `172.17.0.0/16`) et possède une adresse privée, **inaccessible depuis l'extérieur** tant qu'on n'a pas **publié un port**. Docker réalise cette publication par une règle **NAT** (DNAT) dans iptables.

### Publier un port : `-p hôte:conteneur`

```bash
docker run -d --name web -p 8080:80 nginx:latest
```

- `-d` : en arrière-plan ; `--name web` : nom du conteneur.
- **`-p 8080:80`** : le port **8080 de l'hôte** est relié au port **80 du conteneur** (80 = port par défaut de HTTP, celui d'`nginx`).
- `nginx:latest` : l'image et sa version.

Test : `curl http://localhost:8080` renvoie la page d'accueil d'nginx.

| Option | Effet |
|---|---|
| `-p 8080:80` | Publie sur **toutes** les interfaces de l'hôte |
| `-p 127.0.0.1:8080:80` | Publie seulement en local |
| `-p 8443:443/tcp`, `-p 53:53/udp` | Précise le protocole |
| `-P` | Publie tous les ports exposés sur des ports **aléatoires** |
| `--network host` | Le conteneur partage le réseau de l'hôte (pas d'isolation) |
| `--network none` | Aucun réseau |

### Commandes utiles

```bash
docker ps                      # conteneurs actifs et ports publiés (0.0.0.0:8080->80/tcp)
docker port web                # correspondance des ports
docker logs -f web             # journaux
docker inspect web | grep IPAddress   # adresse IP du conteneur
docker network ls              # réseaux Docker
docker network create --subnet 10.10.0.0/24 monreseau   # réseau personnalisé
docker run -d --network monreseau --name db postgres:16
docker stop web && docker rm web
```

Dans un **réseau personnalisé**, les conteneurs se joignent par leur **nom** (DNS interne de Docker).

:::attention Docker contourne ufw
Les règles NAT et FORWARD créées par Docker passent **avant** celles d'ufw : un port publié avec `-p` reste **joignable depuis l'extérieur** même si ufw semble l'interdire. Pour l'éviter, publiez sur `127.0.0.1` ou utilisez la chaîne `DOCKER-USER` d'iptables.
:::

## 4.4.4 Observer et tester

| Outil | Usage | Exemple |
|---|---|---|
| `ping` | Joignabilité (ICMP) | `ping -c 4 8.8.8.8` |
| `traceroute` / `mtr` | Chemin, sauts | `mtr -rw 8.8.8.8` |
| `ss` | Sockets et ports | `ss -tulnp` |
| `nc` (netcat) | Tester un port, écouter | `nc -zv 10.0.0.5 22` |
| `curl` | Tester HTTP | `curl -I https://eneam.bj` |
| `dig` / `nslookup` | DNS | `dig @8.8.8.8 eneam.bj` |
| `tcpdump` | Capture en ligne de commande | `sudo tcpdump -i eth0 -n port 53` |
| **Wireshark** | Capture avec interface graphique | filtres `ip.addr == 10.0.0.5`, `tcp.port == 80`, `dns`, `arp` |
| `nmap` | Scan de ports (chez vous, avec autorisation) | `nmap -sS -p 1-1024 10.0.0.5` |
| `iperf3` | Débit entre deux machines | `iperf3 -s` puis `iperf3 -c serveur` |
| `ethtool` | Lien, vitesse, duplex | `ethtool eth0` |

:::attention Capturer et scanner : seulement avec autorisation
Capturer le trafic d'autrui ou scanner un réseau qui n'est pas le vôtre est **illégal** sans accord écrit. Travaillez dans votre laboratoire (GNS3, Packet Tracer, machines virtuelles).
:::

### Un exercice de capture

1. Lancez `sudo tcpdump -i eth0 -n -w capture.pcap`.
2. Faites un `ping` et un `curl`.
3. Ouvrez `capture.pcap` dans Wireshark : retrouvez les trames **ARP** (EtherType `0x0806`), la **poignée de main TCP** (SYN, SYN-ACK, ACK), la requête **DNS** (UDP 53) et la requête **HTTP**.

## 4.4.5 Simulateurs et laboratoires

| Outil | Intérêt |
|---|---|
| **Cisco Packet Tracer** | Gratuit (Cisco Networking Academy), simple pour débuter |
| **GNS3** / **EVE-NG** | Émulent de vrais systèmes d'exploitation de routeurs (Cisco, MikroTik, Huawei) |
| **Linux namespaces** | Laboratoire léger, uniquement avec des commandes |
| **Docker / Containerlab** | Topologies reproductibles en code |

:::retenir À retenir
`ip a`, `ip r`, `ss -tulnp`, `ip route get`. Linux devient routeur avec `ip_forward=1`. `docker run -d -p 8080:80 nginx:latest` publie le port 80 du conteneur sur le 8080 de l'hôte. `tcpdump` capture, Wireshark analyse.
:::

:::examen Ce qui tombe à l'examen
« Quelle commande lance un conteneur nginx:latest avec le port 8080 associé au port par défaut ? » : `docker run -d -p 8080:80 nginx:latest`. Aussi : commande pour voir les routes, ajouter une route, lister les ports ouverts.
:::

## 4.4.6 Exercices corrigés

**Exercice 1.** Lancez un conteneur nginx accessible sur le port 8080 de l'hôte, nommé `web`.

<details>
<summary>Voir le corrigé</summary>

```bash
docker run -d --name web -p 8080:80 nginx:latest
```

</details>

**Exercice 2.** Que signifie `0.0.0.0:8080->80/tcp` dans `docker ps` ?

<details>
<summary>Voir le corrigé</summary>

Le port TCP **8080** de l'hôte, sur **toutes les interfaces** (`0.0.0.0`), est redirigé vers le port **80** du conteneur.

</details>

**Exercice 3.** Comment publier un conteneur MySQL (3306) uniquement en local sur le port 3307 ?

<details>
<summary>Voir le corrigé</summary>

```bash
docker run -d -p 127.0.0.1:3307:3306 -e MYSQL_ROOT_PASSWORD=secret mysql:8
```

</details>

**Exercice 4.** Écrivez les commandes Linux pour ajouter l'adresse `10.0.5.254/23` à `eth1`, l'activer, et ajouter la route par défaut via `10.0.4.1`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ip addr add 10.0.5.254/23 dev eth1
sudo ip link set eth1 up
sudo ip route add default via 10.0.4.1
```

</details>

**Exercice 5.** Quelle commande indique la route que le noyau utiliserait pour `8.8.8.8` ?

<details>
<summary>Voir le corrigé</summary>

`ip route get 8.8.8.8`

</details>

**Exercice 6.** Un service écoute en `127.0.0.1:5000` sur un serveur ; un collègue ne le joint pas depuis son PC. Pourquoi ?

<details>
<summary>Voir le corrigé</summary>

Il n'écoute que sur l'interface de **bouclage** : il n'est joignable que localement. Il faut le faire écouter sur `0.0.0.0` (ou l'adresse du LAN), puis ouvrir le pare-feu.

</details>

**Exercice 7.** Quelles commandes pour tester si le port 443 de `10.0.0.5` répond, et pour capturer uniquement le DNS ?

<details>
<summary>Voir le corrigé</summary>

```bash
nc -zv 10.0.0.5 443
sudo tcpdump -i eth0 -n port 53
```

</details>

**Exercice 8.** Pourquoi un port publié par Docker reste-t-il accessible malgré `ufw deny` ?

<details>
<summary>Voir le corrigé</summary>

Docker écrit ses propres règles NAT/FORWARD dans iptables, appliquées **avant** celles d'ufw. Solutions : publier sur `127.0.0.1`, filtrer dans la chaîne `DOCKER-USER`.

</details>
