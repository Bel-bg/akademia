## 4.4.1 Sécuriser l'accès distant : la logique

Un serveur exposé sur Internet est comme **un immeuble dont la porte donne sur la rue** : SSH est la porte d'entrée des administrateurs, le **pare-feu** est le gardien qui décide quelles portes sont ouvertes et pour qui. Quelques minutes après sa mise en ligne, un serveur reçoit déjà des tentatives de connexion automatiques. La défense repose sur trois gestes : **ne laisser ouvert que le nécessaire** (pare-feu), **remplacer les mots de passe par des clés** (SSH), **surveiller** (journaux, `fail2ban`, audit).

## 4.4.2 SSH : connexion, empreinte et known_hosts

SSH (*Secure Shell*, port 22/tcp) chiffre la session, authentifie le serveur et l'utilisateur, et sert aussi de tunnel et de transfert de fichiers. Côté serveur, le paquet `openssh-server` fournit le service `ssh` (Ubuntu/Debian) ou `sshd` (RHEL/Fedora).

```bash
sudo apt install openssh-server
sudo systemctl enable --now ssh
ssh alice@192.168.1.50
ssh -p 2222 alice@192.168.1.50
ssh alice@192.168.1.50 'df -h /'
```

À la **première connexion**, le client affiche l'empreinte de la clé du serveur :

```text
The authenticity of host '192.168.1.50 (192.168.1.50)' can't be established.
ED25519 key fingerprint is SHA256:Qm3z0aXk9n4s7yHc2E0pVwT1rJ8dLfB6uYhK5oPaNzI.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Si l'empreinte correspond à celle donnée par l'administrateur, répondez `yes` : elle est enregistrée dans **`~/.ssh/known_hosts`**. Aux connexions suivantes, le client compare. En cas de différence (réinstallation du serveur, ou attaque de l'homme du milieu) :

```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
```

Si le changement est légitime, supprimez l'ancienne entrée : `ssh-keygen -R 192.168.1.50`. Sinon, ne continuez pas.

## 4.4.3 Authentification par clés

Une paire de clés se compose d'une clé **privée** (secrète, reste sur votre poste) et d'une clé **publique** (déposée sur le serveur). Le serveur envoie un défi que seul le détenteur de la clé privée sait résoudre : aucun mot de passe ne circule.

```bash
ssh-keygen -t ed25519 -C "alice@poste-eneam"
ssh-copy-id -i ~/.ssh/id_ed25519.pub alice@192.168.1.50
ssh alice@192.168.1.50
```

```text
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/alice/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
Your identification has been saved in /home/alice/.ssh/id_ed25519
Your public key has been saved in /home/alice/.ssh/id_ed25519.pub
```

- **Ed25519** est le type recommandé (court, rapide, sûr) ; `-t rsa -b 4096` reste valable pour l'ancien matériel.
- Donnez une **phrase secrète** (*passphrase*) : elle protège la clé privée si votre poste est volé.
- `ssh-copy-id` ajoute la clé publique à `~/.ssh/authorized_keys` du serveur. À la main : `cat ~/.ssh/id_ed25519.pub | ssh alice@srv 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'`.

### Permissions exigées

SSH refuse de travailler si les droits sont trop larges :

| Élément | Droits | Commande |
|---|---|---|
| `~/.ssh` | `700` | `chmod 700 ~/.ssh` |
| `~/.ssh/authorized_keys` | `600` | `chmod 600 ~/.ssh/authorized_keys` |
| Clé privée `id_ed25519` | `600` | `chmod 600 ~/.ssh/id_ed25519` |
| Clé publique `.pub` | `644` | `chmod 644 ~/.ssh/id_ed25519.pub` |

Une clé privée en `644` provoque `WARNING: UNPROTECTED PRIVATE KEY FILE!` et elle est ignorée. Si la connexion par clé échoue côté serveur, vérifiez aussi que le **répertoire personnel** n'est pas modifiable par tous (voir 2.2).

### ssh-agent : saisir la phrase secrète une seule fois

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh-add -l
```

L'agent garde la clé déchiffrée en mémoire pour la session. `ssh-add -l` liste les clés chargées, `ssh-add -D` les décharge. Sur un poste de bureau, l'agent est en général déjà lancé.

### ~/.ssh/config : des raccourcis

```ini
Host srv-eneam
    HostName 192.168.1.50
    User alice
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

Host interne
    HostName 10.0.0.20
    User alice
    ProxyJump srv-eneam
```

Il suffit désormais de `ssh srv-eneam` ; `ssh interne` passe automatiquement par la machine **bastion** `srv-eneam` (option `ProxyJump`, équivalent en ligne de commande : `ssh -J alice@192.168.1.50 alice@10.0.0.20`). Le fichier doit être en `600`.

## 4.4.4 Tunnels et transferts

| Option | Nom | Effet | Exemple |
|---|---|---|---|
| `-L` | Redirection **locale** | Un port local mène vers une destination vue **depuis le serveur** | `ssh -L 8080:localhost:80 alice@srv` |
| `-R` | Redirection **distante** | Un port du serveur mène vers votre poste | `ssh -R 9000:localhost:3000 alice@srv` |
| `-D` | Proxy **SOCKS** dynamique | Navigation à travers le serveur | `ssh -D 1080 alice@srv` |

Avec `-L 8080:localhost:80`, ouvrir `http://localhost:8080` sur votre poste affiche le site web qui écoute sur le port 80 **du serveur**, à travers un canal chiffré. Pour accéder à une base de données interne : `ssh -L 5433:10.0.0.30:5432 alice@srv`. Ajoutez `-N` (aucune commande distante) et `-f` (arrière-plan) pour un tunnel permanent : `ssh -fN -L 8080:localhost:80 alice@srv`.

### Copier des fichiers

```bash
scp rapport.pdf alice@srv:/home/alice/
scp -P 2222 alice@srv:/var/log/syslog ./
scp -r projet/ alice@srv:/srv/
rsync -avz -e ssh projet/ alice@srv:/srv/projet/
rsync -avz -e "ssh -p 2222" projet/ alice@srv:/srv/projet/
sftp alice@srv
```

Piège classique : `scp` prend **`-P`** majuscule pour le port, `ssh` prend `-p` minuscule. `rsync` ne transfère que les différences (`-a` archive, `-v` bavard, `-z` compresse) et l'ordre du `/` final compte : `projet/` copie le **contenu**, `projet` copie le dossier lui-même (voir 5.2). `sftp` ouvre une session interactive (`ls`, `lls`, `cd`, `get`, `put`, `exit`).

## 4.4.5 Durcir le serveur : sshd_config

La configuration du serveur est dans `/etc/ssh/sshd_config` (et, sur Ubuntu récent, les fichiers `/etc/ssh/sshd_config.d/*.conf`, lus en premier : **la première valeur rencontrée l'emporte**). Ne confondez pas avec `ssh_config`, qui configure le client.

```text
# /etc/ssh/sshd_config.d/10-durcissement.conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers alice bob
LoginGraceTime 30
X11Forwarding no
```

| Directive | Effet |
|---|---|
| `PermitRootLogin no` | Interdit la connexion directe de `root` (on passe par un compte + `sudo`) |
| `PasswordAuthentication no` | Seules les clés sont acceptées : fini le « brute force » de mots de passe |
| `AllowUsers alice bob` / `AllowGroups ssh-admins` | **Liste blanche** : seuls ces comptes/groupes peuvent se connecter |
| `MaxAuthTries 3` | Nombre d'essais par connexion |
| `Port 2222` | Change le port (évite le bruit des robots, **ne remplace pas** la sécurité) |
| `LoginGraceTime 30` | Délai pour s'authentifier |

:::attention Ne vous enfermez pas dehors
Avant de désactiver les mots de passe, **vérifiez que votre clé fonctionne**. Procédure sûre : (1) modifier la configuration ; (2) `sudo sshd -t` (aucune sortie = syntaxe correcte) ; (3) `sudo systemctl reload ssh` ; (4) **sans fermer la session actuelle**, ouvrir une **deuxième session** dans un autre terminal pour tester ; (5) seulement si elle fonctionne, fermer la première. En cas de problème, la session d'origine permet de corriger. `sudo sshd -T` affiche la configuration réellement appliquée.
:::

Sur Ubuntu 24.04, SSH est lancé à la demande par un socket systemd (`ssh.socket`) : changer `Port` dans `sshd_config` n'a alors d'effet que si l'on adapte aussi `ssh.socket` (`sudo systemctl edit ssh.socket`) ou si l'on le désactive ; vérifiez toujours avec `ss -tlnp | grep ssh` et conservez la session ouverte. Sur RHEL, un port différent demande aussi `semanage port` (SELinux) et firewalld.

### Aperçu : SFTP enfermé (chroot)

Pour des clients qui ne doivent que déposer des fichiers :

```text
Match Group sftpusers
    ChrootDirectory /srv/sftp/%u
    ForceCommand internal-sftp
    AllowTcpForwarding no
    X11Forwarding no
```

Le dossier `ChrootDirectory` doit appartenir à `root:root` et ne pas être modifiable par d'autres (`755`) ; on crée dedans un sous-dossier (`upload`) appartenant à l'utilisateur.

### fail2ban

`fail2ban` lit les journaux et **bannit temporairement** (par le pare-feu) les adresses qui échouent trop souvent.

```bash
sudo apt install fail2ban
```

```ini
# /etc/fail2ban/jail.local
[sshd]
enabled  = true
maxretry = 5
findtime = 10m
bantime  = 1h
```

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
sudo fail2ban-client set sshd unbanip 203.0.113.9
```

## 4.4.6 Le pare-feu Linux : netfilter et ses interfaces

Le filtrage est fait par le **noyau** (*netfilter*). On le pilote par des interfaces de plus ou moins haut niveau :

| Outil | Distribution | Niveau |
|---|---|---|
| **ufw** | Ubuntu/Debian | Simple, pour serveurs et postes |
| **firewalld** (`firewall-cmd`) | RHEL, Fedora, CentOS | Zones et services |
| **iptables** | Partout (historique) | Règles détaillées, très présent à l'examen |
| **nftables** (`nft`) | Moderne (successeur d'iptables) | Un seul outil pour IPv4/IPv6 |

Choisissez **un seul** outil de gestion à la fois : mélanger ufw, firewalld et iptables produit des règles imprévisibles.

### ufw (*Uncomplicated Firewall*)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow from 192.168.1.0/24 to any port 22 proto tcp
sudo ufw allow 80,443/tcp
sudo ufw enable
sudo ufw status numbered
```

```text
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere
[ 2] 192.168.1.0/24 22/tcp      ALLOW IN    Anywhere
[ 3] 80,443/tcp                 ALLOW IN    Anywhere
```

| Commande | Effet |
|---|---|
| `sudo ufw allow 22/tcp` | Autorise le port 22 en TCP (`ufw allow ssh` utilise `/etc/services`) |
| `sudo ufw deny 23/tcp` | Refuse (silencieusement) |
| `sudo ufw limit 22/tcp` | Autorise mais **limite** les essais (6 par 30 secondes) |
| `sudo ufw delete 3` | Supprime la règle n° 3 de `status numbered` |
| `sudo ufw delete allow 80,443/tcp` | Supprime par description |
| `sudo ufw status verbose` | Politiques par défaut et journalisation |
| `sudo ufw disable` / `reset` | Désactive / efface toutes les règles |

:::attention Autorisez SSH avant enable
`ufw enable` avec `default deny incoming` et **sans** règle sur le port 22 coupe immédiatement votre session SSH. Ordre sûr : `allow 22/tcp` (ou le port choisi), **puis** `enable`. ufw avertit d'ailleurs (« Command may disrupt existing ssh connections ») : ne répondez pas `y` sans avoir lu.
:::

### firewalld (RHEL, Fedora)

```bash
sudo systemctl enable --now firewalld
sudo firewall-cmd --state
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

Sans `--permanent`, la règle est **immédiate mais temporaire** ; avec `--permanent`, elle n'est active qu'après `--reload`. Retirer : `--remove-service=http --permanent`. Pour n'autoriser que le réseau local : `sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" service name="ssh" accept'`.

## 4.4.7 iptables : tables, chaînes, règles

Un paquet traverse des **chaînes** ; chaque chaîne est une liste de **règles** lues **de haut en bas** : la **première qui correspond** s'applique (`ACCEPT`, `DROP`, `REJECT`), sinon la **politique par défaut** (`-P`) décide.

| Table | Rôle | Chaînes |
|---|---|---|
| **filter** (par défaut) | Autoriser ou bloquer | `INPUT` (vers la machine), `OUTPUT` (depuis la machine), `FORWARD` (à travers la machine) |
| **nat** | Traduction d'adresses | `PREROUTING` (DNAT), `POSTROUTING` (SNAT, MASQUERADE) |
| **mangle** | Modification de paquets | (rarement utilisée) |

| Option | Sens | Option | Sens |
|---|---|---|---|
| `-A chaîne` | Ajoute **à la fin** | `-p tcp` | Protocole |
| `-I chaîne 1` | **Insère** en position 1 | `-s IP/CIDR` | Source |
| `-D chaîne 3` | Supprime la règle n° 3 | `--dport 22` | Port de destination |
| `-L -n -v --line-numbers` | Liste (numérique, compteurs, numéros) | `-j ACCEPT` | Action (*jump*) |
| `-P INPUT DROP` | Politique par défaut | `-i`, `-o` | Interface d'entrée, de sortie |
| `-F` | Vide les règles | `-m module` | Module d'extension |

```bash
sudo iptables -L INPUT -n -v --line-numbers
```

```text
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1      152 11248 ACCEPT     all  --  lo     *       0.0.0.0/0            0.0.0.0/0
2     8412  912K ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0   ctstate RELATED,ESTABLISHED
3       12   720 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0   tcp dpt:22
```

### Le jeu de règles standard « tout refuser sauf… »

```bash
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT
sudo iptables -P INPUT DROP
```

L'ordre **protège** votre session : (1) le trafic interne (`lo`) ; (2) les paquets d'une connexion **déjà établie** (dont votre SSH en cours) ; (3) les nouvelles connexions autorisées ; (4) **en dernier** la politique `DROP`. Mettre `-P INPUT DROP` en premier, avant les règles `ACCEPT`, coupe SSH immédiatement. Pour insérer une règle avant les autres : `sudo iptables -I INPUT 1 -s 203.0.113.9 -j DROP`.

:::retenir Ne jamais se couper SSH
1. Autoriser `lo`, `ESTABLISHED,RELATED` et le port SSH **avant** toute politique `DROP`.
2. Travailler depuis la console de la VM ou garder une **deuxième session** ouverte.
3. Prévoir un filet : `sudo sh -c 'sleep 300; iptables -P INPUT ACCEPT; iptables -F' &` annule tout au bout de 5 minutes ; on le tue (`kill %1`) quand tout fonctionne.
4. Ne rendre permanent qu'après vérification.
:::

### Limiter, journaliser, traduire

```bash
sudo iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --set
sudo iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 4 -j DROP
sudo iptables -A INPUT -p icmp -m limit --limit 5/second -j ACCEPT
sudo iptables -A INPUT -j LOG --log-prefix "IPT-DROP: " --log-level 4
```

Les deux premières règles bannissent pendant la minute une source qui tente plus de 3 nouvelles connexions SSH (il faut qu'elles précèdent la règle `ACCEPT` du port 22). `-m limit` plafonne un débit.

**NAT** (la machine est un routeur ; `ip_forward` doit être à 1, voir 4.3.8) :

```bash
sudo iptables -t nat -A POSTROUTING -s 192.168.50.0/24 -o enp0s3 -j MASQUERADE
sudo iptables -t nat -A PREROUTING -i enp0s3 -p tcp --dport 8080 -j DNAT --to-destination 192.168.50.10:80
sudo iptables -A FORWARD -d 192.168.50.10 -p tcp --dport 80 -j ACCEPT
```

`MASQUERADE` fait sortir les machines du réseau privé avec l'adresse publique du routeur (partage de connexion). `DNAT` redirige un port entrant vers une machine interne (publication d'un serveur).

### Sauvegarder et restaurer

Les règles `iptables` disparaissent au redémarrage.

```bash
sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
sudo iptables-restore < /etc/iptables/rules.v4
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

La redirection `>` s'exécute avec **vos** droits : d'où `sudo sh -c '...'` ou `| sudo tee`. Sur Ubuntu, `iptables-persistent` recharge `rules.v4` au démarrage.

## 4.4.8 nftables : aperçu

`nftables` remplace iptables, avec une syntaxe unifiée IPv4/IPv6 :

```text
#!/usr/sbin/nft -f
flush ruleset
table inet filtre {
  chain input {
    type filter hook input priority 0; policy drop;
    iif lo accept
    ct state established,related accept
    tcp dport 22 accept
    tcp dport { 80, 443 } accept
  }
  chain forward { type filter hook forward priority 0; policy drop; }
  chain output  { type filter hook output priority 0; policy accept; }
}
```

```bash
sudo nft -c -f /etc/nftables.conf
sudo nft -f /etc/nftables.conf
sudo nft list ruleset
sudo systemctl enable --now nftables
```

`-c` **vérifie** la syntaxe sans appliquer. Reconnaissez l'équivalence : `ct state established,related accept` est l'ancien `-m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT`. Ubuntu fournit aussi `iptables-nft` (les commandes iptables écrivent dans nftables).

## 4.4.9 Durcissement du noyau, audit et scan

### sysctl réseau

```text
# /etc/sysctl.d/99-durcissement.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.ip_forward = 0
```

`sudo sysctl --system` applique tous les fichiers. Rôles : `tcp_syncookies` résiste aux inondations SYN ; `rp_filter` rejette les adresses sources falsifiées ; `accept_redirects` et `send_redirects` empêchent le détournement de route ; `ip_forward = 0` (sauf routeur).

### Ce qui écoute : ss depuis l'intérieur, nmap depuis l'extérieur

`ss -tulnp` (voir 4.3.3) montre **ce que la machine croit** ouvrir ; `nmap` montre **ce qu'un voisin voit réellement**, pare-feu compris :

```bash
sudo ss -tulnp
nmap -sT -p 1-1024 192.168.1.50
nmap -sV 192.168.1.50
```

```text
PORT   STATE    SERVICE
22/tcp open     ssh
80/tcp open     http
23/tcp filtered telnet
```

`open` : un service répond ; `closed` : machine joignable, rien n'écoute ; `filtered` : le pare-feu ignore les paquets. **Scannez uniquement vos propres machines** ou avec autorisation écrite.

### auditd et Lynis (aperçu)

```bash
sudo apt install auditd lynis
sudo auditctl -w /etc/passwd -p wa -k identite
sudo ausearch -k identite
sudo lynis audit system
```

`auditd` journalise des événements précis : ici, toute écriture ou changement d'attribut (`-p wa`) sur `/etc/passwd`, étiquetée `identite`. `lynis` passe la machine en revue (SSH, noyau, mots de passe, paquets) et propose une liste de suggestions ainsi qu'un **indice de durcissement** (*hardening index*).

:::examen Ce qui tombe à l'examen
- Lister et justifier cinq directives de durcissement de `sshd_config` ; expliquer `sshd -t` et la seconde session.
- Générer une clé, la déployer (`ssh-copy-id`), donner les permissions de `~/.ssh`.
- Écrire les commandes `ufw` (politique par défaut, ouvrir 22/80/443, supprimer une règle) ou `firewall-cmd --permanent` + `--reload`.
- Écrire des règles `iptables` : accepter SSH, accepter `ESTABLISHED,RELATED`, politique `DROP`, `MASQUERADE` ; dire pourquoi l'**ordre** compte.
- Différencier `-L`/`-I`/`-A`/`-D`, `-p` et `--dport`, tables `filter` et `nat`.
:::

## 4.4.10 Exercices corrigés

**Exercice 1.** Générez une clé Ed25519 et déployez-la sur `alice@192.168.1.50`. Quelles sont les permissions attendues sur `~/.ssh` ?

<details>
<summary>Voir le corrigé</summary>

```bash
ssh-keygen -t ed25519 -C "alice@poste"
ssh-copy-id -i ~/.ssh/id_ed25519.pub alice@192.168.1.50
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519
```

Le dossier `.ssh` en `700`, `authorized_keys` et la clé privée en `600`. Sinon SSH ignore la clé.

</details>

**Exercice 2.** Écrivez un bloc `~/.ssh/config` pour joindre `srv-eneam` (192.168.1.50, utilisateur `alice`, port 2222) avec une simple commande `ssh srv-eneam`. Comment atteindre `10.0.0.20` à travers ce serveur ?

<details>
<summary>Voir le corrigé</summary>

```ini
Host srv-eneam
    HostName 192.168.1.50
    User alice
    Port 2222
```

```bash
ssh -J srv-eneam alice@10.0.0.20
```

`-J` (ou `ProxyJump` dans le fichier) passe par un **bastion**. Le fichier `config` doit être en `600`.

</details>

**Exercice 3.** Donnez une commande qui permet d'afficher dans votre navigateur local (`http://localhost:8080`) le site qui écoute sur le port 80 du serveur `srv`. Quelle option pour un proxy SOCKS ?

<details>
<summary>Voir le corrigé</summary>

```bash
ssh -N -L 8080:localhost:80 alice@srv
ssh -D 1080 alice@srv
```

`-L port_local:hôte:port_distant` ouvre un tunnel dont la destination est évaluée **depuis le serveur** ; `-N` n'ouvre pas de shell. `-D 1080` crée un proxy SOCKS5 local.

</details>

**Exercice 4.** Copiez `rapport.pdf` vers le serveur (port SSH 2222) puis synchronisez le dossier `projet/` avec `rsync`.

<details>
<summary>Voir le corrigé</summary>

```bash
scp -P 2222 rapport.pdf alice@srv:/home/alice/
rsync -avz -e "ssh -p 2222" projet/ alice@srv:/srv/projet/
```

`scp` : **P** majuscule ; `ssh` : p minuscule. `rsync` ne copie que les différences ; le `/` final de `projet/` signifie « le contenu ».

</details>

**Exercice 5.** Listez les quatre modifications les plus importantes de `sshd_config` pour durcir un serveur et la procédure d'application sans risque.

<details>
<summary>Voir le corrigé</summary>

```text
PermitRootLogin no
PasswordAuthentication no
AllowUsers alice bob
MaxAuthTries 3
```

```bash
sudo sshd -t
sudo systemctl reload ssh
```

- Tester d'abord **la connexion par clé**, puis conserver la session ouverte et en ouvrir une **seconde** pour valider avant de fermer la première.
- `sshd -t` valide la syntaxe ; `reload` applique sans couper les sessions existantes.
- Sur RHEL, le service s'appelle `sshd`.

</details>

**Exercice 6.** Avec `ufw`, interdisez tout le trafic entrant, autorisez SSH uniquement depuis `192.168.1.0/24`, ainsi que HTTP et HTTPS pour tous, puis activez le pare-feu.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 22 proto tcp
sudo ufw allow 80,443/tcp
sudo ufw enable
sudo ufw status verbose
```

Les règles précèdent `enable` pour ne pas se couper. Si vous êtes en SSH depuis une adresse **hors** de `192.168.1.0/24`, la session sera perdue.

</details>

**Exercice 7.** Une règle `ufw` pour le port 8080 a été ajoutée par erreur. Comment la supprimer de deux façons ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ufw status numbered
sudo ufw delete 4
sudo ufw delete allow 8080/tcp
```

La première façon passe par le **numéro** (relisez la liste après chaque suppression : les numéros se décalent) ; la seconde répète la règle précédée de `delete`.

</details>

**Exercice 8.** Avec `firewalld`, ouvrez HTTP et le port 8080/tcp de façon permanente, puis vérifiez.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

`--permanent` écrit la configuration mais ne l'applique pas : `--reload` est nécessaire. Sans `--permanent`, la règle est immédiate mais perdue au redémarrage.

</details>

**Exercice 9.** Écrivez des règles `iptables` qui n'autorisent en entrée que : le trafic local, les connexions établies, SSH (22) et HTTP (80). Tout le reste est bloqué. Pourquoi l'ordre est-il important ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -P INPUT DROP
```

- Les règles sont lues de haut en bas : la **première correspondance** gagne.
- `ESTABLISHED,RELATED` maintient votre session SSH ouverte quand on passe la politique à `DROP`.
- `-P INPUT DROP` va **en dernier** : placé avant les `ACCEPT`, il coupe SSH.

</details>

**Exercice 10.** Affichez les règles `INPUT` avec leurs numéros, supprimez la 3e et insérez en première position le blocage de `203.0.113.9`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo iptables -L INPUT -n -v --line-numbers
sudo iptables -D INPUT 3
sudo iptables -I INPUT 1 -s 203.0.113.9 -j DROP
```

`-A` ajoute en fin de liste (donc après un éventuel `ACCEPT` plus général qui masquerait la règle) ; `-I ... 1` place en tête. `-n` évite les résolutions DNS lentes.

</details>

**Exercice 11.** Votre machine `192.168.50.1` doit partager sa connexion avec le réseau `192.168.50.0/24` (sortie par `enp0s3`) et publier le serveur web interne `192.168.50.10:80` sur son port 8080. Donnez les commandes et la sauvegarde permanente.

<details>
<summary>Voir le corrigé</summary>

```bash
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-forward.conf
sudo sysctl --system
sudo iptables -t nat -A POSTROUTING -s 192.168.50.0/24 -o enp0s3 -j MASQUERADE
sudo iptables -t nat -A PREROUTING -i enp0s3 -p tcp --dport 8080 -j DNAT --to-destination 192.168.50.10:80
sudo iptables -A FORWARD -d 192.168.50.10 -p tcp --dport 80 -j ACCEPT
sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
```

Le routage est activé par `ip_forward` ; `MASQUERADE` (POSTROUTING) gère le partage ; `DNAT` (PREROUTING) la publication ; la règle `FORWARD` est nécessaire si la politique est `DROP`.

</details>

**Exercice 12.** Vous devez passer `INPUT` en « tout refuser » sur un serveur à distance, sans risque de perdre l'accès. Décrivez la démarche, puis un filet de sécurité.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo sh -c 'sleep 300; iptables -P INPUT ACCEPT; iptables -F' &
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -P INPUT DROP
```

- Le filet (tâche d'arrière-plan) rétablit l'accès au bout de 5 minutes si quelque chose se passe mal ; on l'arrête avec `kill %1` une fois la **deuxième session SSH** testée avec succès.
- Les trois règles `ACCEPT` précèdent la politique `DROP`.
- Avec ufw la logique est la même : `allow 22/tcp` avant `enable`.

</details>
