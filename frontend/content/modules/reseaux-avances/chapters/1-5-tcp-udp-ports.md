## 1.5.1 La couche transport : relier deux programmes

IP amène un paquet jusqu'à la **bonne machine** ; la couche transport l'amène jusqu'au **bon programme**. Pour cela elle utilise les **numéros de port** (16 bits, de 0 à 65 535). Un échange est identifié par un **quadruplet** (ou 5-uplet) : adresse source, port source, adresse destination, port destination (+ protocole).

Deux protocoles se partagent le travail :

| | **TCP** (RFC 793) | **UDP** (RFC 768) |
|---|---|---|
| Mode | Orienté connexion | Sans connexion |
| Fiabilité | Oui : accusés, retransmission, ordre | Non : « envoie et oublie » |
| En-tête | 20 octets minimum | 8 octets |
| Contrôle de flux / congestion | Oui | Non |
| Valeur du champ Protocole IP | 6 | 17 |
| Usages | Web, mail, SSH, fichiers | DNS (requêtes), DHCP, voix, vidéo, jeux, NTP |

## 1.5.2 Les ports

| Plage | Nom | Usage |
|---|---|---|
| 0 - 1023 | Ports **bien connus** (*well-known*) | Services standards, réservés à root sous Linux |
| 1024 - 49151 | Ports **enregistrés** | Applications (MySQL 3306, PostgreSQL 5432…) |
| 49152 - 65535 | Ports **dynamiques / éphémères** | Ports source choisis par le client |

Le **client** choisit un port source éphémère aléatoire ; le **serveur** écoute sur un port connu. Sous Linux, la correspondance nom/port se trouve dans `/etc/services`.

### Ports à connaître par cœur

| Service | Port(s) | Transport |
|---|---|---|
| FTP | 20 (données), 21 (contrôle) | TCP |
| SSH / SFTP / SCP | 22 | TCP |
| Telnet | 23 | TCP |
| SMTP | 25 (serveur), 587 (soumission), 465 (SMTPS) | TCP |
| DNS | 53 | UDP (requêtes), TCP (transferts de zone, grosses réponses) |
| DHCP | 67 (serveur), 68 (client) | UDP |
| TFTP | 69 | UDP |
| HTTP | 80 | TCP |
| POP3 / IMAP | 110 / 143 (sécurisés : 995 / 993) | TCP |
| NTP | 123 | UDP |
| SNMP | 161 (requêtes), 162 (traps) | UDP |
| LDAP / LDAPS | 389 / 636 | TCP |
| HTTPS | 443 | TCP (et UDP pour HTTP/3) |
| Syslog | 514 | UDP |
| NFS | 2049 | TCP/UDP |
| MySQL / PostgreSQL | 3306 / 5432 | TCP |
| RDP | 3389 | TCP |
| RADIUS | 1812, 1813 | UDP |

## 1.5.3 TCP en détail

### L'en-tête TCP

Ports source et destination (16 bits chacun), **numéro de séquence** (32 bits), **numéro d'accusé de réception** (32 bits), longueur d'en-tête, **drapeaux** (SYN, ACK, FIN, RST, PSH, URG), **fenêtre** (16 bits, contrôle de flux), somme de contrôle.

### Établissement : la poignée de main en 3 temps

```text
Client                                Serveur (écoute sur le port 80)
  |  --- SYN (seq = x) ------------->  |   1. « Je voudrais me connecter »
  |  <-- SYN+ACK (seq = y, ack = x+1)  |   2. « D'accord, et moi aussi »
  |  --- ACK (ack = y+1) ----------->  |   3. « Reçu, on commence »
```

### Fermeture

Chaque sens est fermé séparément : `FIN` puis `ACK` dans chaque direction (4 échanges). Un `RST` coupe brutalement la connexion (port fermé, erreur).

### Fiabilité et contrôle

- **Accusés de réception** et **retransmission** des segments perdus.
- **Numéros de séquence** pour remettre les données dans l'ordre.
- **Fenêtre glissante** : le récepteur annonce combien d'octets il peut encore recevoir (contrôle de flux).
- **Contrôle de congestion** : TCP ralentit quand le réseau sature.

### États d'une connexion (vus avec `ss`)

`LISTEN` (serveur en attente), `SYN-SENT`, `SYN-RECV`, `ESTABLISHED` (échange en cours), `TIME-WAIT`, `CLOSE-WAIT`.

```bash
ss -tln          # ports TCP en écoute
ss -tn           # connexions établies
ss -ulnp         # ports UDP et processus
nc -zv 10.0.0.5 22      # tester si un port TCP répond
```

## 1.5.4 UDP en détail

L'en-tête UDP ne contient que **4 champs de 16 bits** : port source, port destination, longueur, somme de contrôle. Pas de connexion, pas d'accusé : c'est plus **rapide et léger**, idéal quand la perte occasionnelle est tolérable (voix, vidéo en direct) ou quand l'application gère elle-même la fiabilité (DNS, DHCP).

:::exemple Pourquoi le DNS utilise UDP
Une requête DNS et sa réponse tiennent chacune dans un seul datagramme. Ouvrir une connexion TCP (3 échanges) pour une question de 40 octets serait du gaspillage. Si la réponse est trop grosse, ou pour un transfert de zone, le DNS bascule sur TCP.
:::

## 1.5.5 TCP, UDP et les pare-feu

Un pare-feu filtre sur le triplet **protocole, adresse, port**. Un service en écoute sur `0.0.0.0:80` est accessible depuis toutes les interfaces ; sur `127.0.0.1:80`, seulement localement. Un **port fermé** répond par un `RST` (TCP) ou par un ICMP « port unreachable » (UDP) ; un **port filtré** ne répond pas du tout.

:::retenir À retenir
TCP : fiable, 3 temps (SYN, SYN-ACK, ACK), protocole 6. UDP : rapide, sans connexion, protocole 17. Un service = un port connu côté serveur, un port éphémère côté client. DNS : 53, DHCP : 67/68, SSH : 22, HTTP : 80, HTTPS : 443.
:::

:::attention Écouter n'est pas être joignable
Un service peut écouter sur le bon port et rester inaccessible à cause d'un **pare-feu**, d'une **mauvaise interface d'écoute** (127.0.0.1 au lieu de 0.0.0.0) ou d'un **NAT/redirection de port** absent (cas fréquent avec Docker, chapitre 4.4).
:::

:::examen Ce qui tombe à l'examen
Donner les ports de HTTP, HTTPS, DHCP, NTP, SNMP, LDAPS, SSH, DNS ; comparer TCP et UDP ; décrire la poignée de main ; dire quel protocole de transport utilise tel service.
:::

## 1.5.6 Exercices corrigés

**Exercice 1.** Donnez le port (et le transport) de : HTTP, HTTPS, DHCP, NTP, SNMP, LDAPS.

<details>
<summary>Voir le corrigé</summary>

HTTP 80/TCP ; HTTPS 443/TCP ; DHCP 67 (serveur) et 68 (client)/UDP ; NTP 123/UDP ; SNMP 161 (traps 162)/UDP ; LDAPS 636/TCP.

</details>

**Exercice 2.** Décrivez la poignée de main TCP avec les numéros x = 100 et y = 500.

<details>
<summary>Voir le corrigé</summary>

1. Client → serveur : `SYN, seq=100`.
2. Serveur → client : `SYN+ACK, seq=500, ack=101`.
3. Client → serveur : `ACK, ack=501`.

</details>

**Exercice 3.** Pourquoi DNS utilise-t-il surtout UDP ? Dans quel cas utilise-t-il TCP ?

<details>
<summary>Voir le corrigé</summary>

Requête et réponse courtes : UDP évite le coût d'une connexion. TCP est utilisé pour les **transferts de zone** et les **réponses trop volumineuses**.

</details>

**Exercice 4.** Quelle commande affiche les ports TCP en écoute avec le processus associé ?

<details>
<summary>Voir le corrigé</summary>

`sudo ss -tlnp`

</details>

**Exercice 5.** Un client ouvre une page web. Quels ports source et destination voit-on ?

<details>
<summary>Voir le corrigé</summary>

Destination : **80** (ou 443). Source : un port **éphémère** aléatoire (par exemple 51234, dans la plage 49152-65535 ou 32768-60999 sous Linux).

</details>

**Exercice 6.** Citez trois différences entre TCP et UDP.

<details>
<summary>Voir le corrigé</summary>

TCP : orienté connexion, fiable (accusés, ordre, retransmission), en-tête de 20 octets, contrôle de flux et congestion. UDP : sans connexion, non fiable, en-tête de 8 octets, pas de contrôle.

</details>

**Exercice 7.** Un port TCP « filtré » et un port « fermé » : comment les distinguer avec un scan ?

<details>
<summary>Voir le corrigé</summary>

Port fermé : la machine répond par un **RST**. Port filtré : **aucune réponse** (ou un ICMP interdit), un pare-feu élimine les paquets.

</details>
