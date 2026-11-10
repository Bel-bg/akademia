## 4.3.1 Filtrer le trafic : pourquoi et où

Un réseau d'entreprise doit **contrôler qui parle à qui**. On filtre avec des **listes de contrôle d'accès** (ACL) sur les routeurs, des **pare-feu** dédiés, ou **iptables/nftables** sous Linux. Une ACL est une **suite ordonnée de règles** `permit` / `deny` appliquée sur une interface, dans un sens (`in` ou `out`).

## 4.3.2 Les règles d'une ACL Cisco

1. Les règles sont examinées **de haut en bas** ; **la première qui correspond s'applique** et on s'arrête.
2. À la fin de chaque ACL, il y a un **`deny any` implicite** (invisible) : tout ce qui n'est pas autorisé est refusé.
3. Une ACL n'a **aucun effet** tant qu'elle n'est pas **appliquée** à une interface (`ip access-group`).
4. Une ACL filtre le trafic **qui traverse** le routeur, pas celui que le routeur génère lui-même.
5. **Entrant** (`in`) : filtre les paquets **avant** la décision de routage ; **sortant** (`out`) : après.

### Les masques génériques (wildcard)

Les ACL utilisent le **masque inverse** : un bit à **0** = « doit correspondre », un bit à **1** = « peu importe ».

| Besoin | Écriture |
|---|---|
| Un seul hôte `10.0.0.5` | `host 10.0.0.5` ou `10.0.0.5 0.0.0.0` |
| Tout le réseau `192.168.1.0/24` | `192.168.1.0 0.0.0.255` |
| Le réseau `10.0.4.0/23` | `10.0.4.0 0.0.1.255` |
| Toutes les adresses | `any` ou `0.0.0.0 255.255.255.255` |

## 4.3.3 ACL standard et étendue

| | **Standard** | **Étendue** |
|---|---|---|
| Numéros | 1-99, 1300-1999 | 100-199, 2000-2699 |
| Critères | **Adresse source** seulement | Source, destination, **protocole, ports** |
| Placement conseillé | **Près de la destination** | **Près de la source** |

:::exemple ACL standard : ne laisser entrer que le réseau comptabilité
```text
access-list 10 permit 192.168.10.0 0.0.0.255
interface g0/1
 ip access-group 10 out
```
:::

:::exemple ACL étendue nommée : le LAN peut naviguer et utiliser le DNS, rien d'autre
```text
ip access-list extended LAN-OUT
 permit tcp 192.168.10.0 0.0.0.255 any eq 80
 permit tcp 192.168.10.0 0.0.0.255 any eq 443
 permit udp 192.168.10.0 0.0.0.255 any eq 53
 deny   ip any any log
interface g0/0
 ip access-group LAN-OUT in
```
Le dernier `deny ip any any log` est explicite pour **journaliser** les refus.
:::

### Modifier une ACL

Utilisez les **ACL nommées** : on peut insérer une règle avec un numéro de séquence (`15 permit ...`) et en supprimer une (`no 20`). Avec une ACL numérotée, on doit tout supprimer et réécrire.

### Vérifier

```text
show access-lists            ! règles et compteurs de correspondances
show ip interface g0/0       ! quelle ACL est appliquée, dans quel sens
```

:::attention Les erreurs de placement
Mettre une règle large avant une règle précise (la première correspondance gagne) ; oublier que le `deny` implicite bloque **tout le reste** (y compris OSPF, DHCP, ARP n'est pas concerné mais le protocole 89 l'est) ; appliquer l'ACL dans le **mauvais sens** ; se couper soi-même l'accès SSH.
:::

## 4.3.4 Le pare-feu sous Linux

### ufw (simple)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow from 192.168.10.0/24 to any port 443 proto tcp
sudo ufw enable
sudo ufw status numbered
```

### iptables / nftables

Les chaînes principales : **INPUT** (vers la machine), **OUTPUT** (depuis la machine), **FORWARD** (en transit, si c'est un routeur). Le suivi de connexion (`conntrack`) permet un pare-feu à **états** (*stateful*) : on autorise les réponses des connexions déjà établies.

```bash
sudo iptables -P INPUT DROP
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -L -n -v --line-numbers
```

Avec **firewalld** (Red Hat) : `firewall-cmd --permanent --add-service=http`, puis `--reload`.

:::retenir Stateless et stateful
Une ACL classique est **sans état** : elle examine chaque paquet isolément, et il faut autoriser explicitement le retour. Un pare-feu **à états** mémorise les connexions et laisse passer automatiquement les réponses.
:::

## 4.3.5 Durcissement de base d'un réseau

| Mesure | Pourquoi |
|---|---|
| Désactiver les ports inutilisés (`shutdown`) et les placer dans un VLAN poubelle | Empêche le branchement sauvage |
| **Port security** | Limite les adresses MAC par port |
| **DHCP snooping** + **Dynamic ARP Inspection** | Bloque les faux serveurs DHCP et l'usurpation ARP |
| Remplacer **Telnet** par **SSH** | Telnet transmet les mots de passe en clair |
| Mots de passe chiffrés, `enable secret` | Évite les secrets en clair dans la configuration |
| Authentification des protocoles de routage (OSPF) | Évite l'injection de fausses routes |
| Changer le VLAN natif, désactiver DTP | Empêche le VLAN hopping |
| Sauvegarder les configurations, journaliser (syslog) | Reprise et enquête |
| Mises à jour du système des équipements | Corrige les vulnérabilités |

### SSH sur un routeur Cisco

```text
hostname R1
ip domain-name eneam.bj
crypto key generate rsa modulus 2048
username admin secret MotDePasseFort
ip ssh version 2
line vty 0 4
 transport input ssh
 login local
```

:::examen Ce qui tombe à l'examen
Écrire une ACL qui autorise ou refuse un service, dire où la placer, expliquer le `deny` implicite, lire un masque générique, citer des mesures de sécurité de couche 2.
:::

## 4.3.6 Exercices corrigés

**Exercice 1.** Quel masque générique pour `192.168.4.0/22` ?

<details>
<summary>Voir le corrigé</summary>

`/22` = 255.255.252.0, donc générique **0.0.3.255** : `192.168.4.0 0.0.3.255`.

</details>

**Exercice 2.** Écrivez une ACL étendue qui interdit à `10.0.1.0/24` d'accéder au serveur web `10.0.9.5` (port 80) mais autorise tout le reste.

<details>
<summary>Voir le corrigé</summary>

```text
ip access-list extended NO-WEB
 deny   tcp 10.0.1.0 0.0.0.255 host 10.0.9.5 eq 80
 permit ip any any
```

À appliquer en `in` sur l'interface du LAN `10.0.1.0/24` (près de la source).

</details>

**Exercice 3.** Où placer une ACL standard ? Une étendue ? Pourquoi ?

<details>
<summary>Voir le corrigé</summary>

Standard (adresse source seulement) : **près de la destination**, sinon on bloquerait le trafic source pour tous les services. Étendue (précise) : **près de la source**, pour éliminer tôt le trafic indésirable.

</details>

**Exercice 4.** Que fait ce jeu de règles ? `permit ip any any` suivi de `deny tcp any any eq 23`.

<details>
<summary>Voir le corrigé</summary>

Le Telnet est quand même **autorisé** : la première règle correspond à tout et arrête l'examen. Il faut placer le `deny` **avant** le `permit`.

</details>

**Exercice 5.** Qu'est-ce que le `deny` implicite ? Quelle conséquence pour une ACL qui ne contient qu'un `deny` ?

<details>
<summary>Voir le corrigé</summary>

Règle invisible en fin de liste : tout ce qui n'a pas été explicitement autorisé est refusé. Une ACL contenant **uniquement** des `deny` bloque donc **tout** ; il faut terminer par `permit ip any any`.

</details>

**Exercice 6.** Écrivez les règles `ufw` pour un serveur web accessible en HTTP/HTTPS depuis partout et en SSH seulement depuis `192.168.10.0/24`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ufw default deny incoming
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 192.168.10.0/24 to any port 22 proto tcp
sudo ufw enable
```

</details>

**Exercice 7.** Citez quatre mesures pour sécuriser la couche 2.

<details>
<summary>Voir le corrigé</summary>

Port security, DHCP snooping, Dynamic ARP Inspection, désactivation des ports inutilisés, changement du VLAN natif, désactivation de DTP, STP guards (BPDU guard).

</details>

**Exercice 8.** Pourquoi remplacer Telnet par SSH ?

<details>
<summary>Voir le corrigé</summary>

Telnet envoie identifiants et commandes **en clair** (interceptables par un simple `tcpdump`) ; SSH **chiffre** la session et authentifie le serveur (et le client par clé).

</details>
