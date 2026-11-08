## B.1 Méthode d'examen en 6 temps

Les sujets d'administration Linux de l'ENEAM demandent surtout des **commandes exactes**, un **script court** et quelques **explications**. Voici la méthode :

1. **Lire tout le sujet** avant d'écrire. Repérez les consignes du type « on demande d'écrire uniquement les commandes ».
2. **Souligner les verbes** : « créer », « afficher », « trouver », « expliquer », « donner la commande ».
3. **Choisir la bonne commande** (tableaux ci-dessous). En cas de doute, la commande simple et connue vaut mieux qu'une astuce risquée.
4. **Écrire sans l'invite** (`$`, `#`), une commande par ligne, dans l'ordre de l'énoncé, avec les **options exactes**.
5. **Vérifier mentalement** : espaces, guillemets, `-a` de `usermod -aG`, `>` ou `>>`, chemin absolu, droits (`sudo`).
6. **Expliquer en une phrase** ce que fait la commande si le sujet le demande (« que réalise `chmod 750 ~/*.pl` ? »).

:::examen Barème implicite
Une commande juste = la totalité des points ; une commande presque juste (option oubliée) = la moitié ; une explication claire rapporte autant que la commande. N'écrivez jamais une réponse vide : une tentative commentée peut rapporter des points.
:::

## B.2 Quelle commande pour quoi ?

### Fichiers et répertoires

| Besoin | Commande |
|---|---|
| où suis-je ? | `pwd` |
| lister (cachés, détails, taille lisible) | `ls -la`, `ls -lh` |
| créer répertoire(s) | `mkdir -p a/b/c` |
| créer / vider un fichier | `touch f`, `> f` |
| copier / déplacer / supprimer | `cp -r`, `mv`, `rm -r` |
| lien physique / symbolique | `ln a b`, `ln -s a b` |
| taille d'un dossier | `du -sh dossier` |
| type d'un fichier | `file f` |

### Texte et recherche

| Besoin | Commande |
|---|---|
| afficher | `cat`, `less`, `head -n`, `tail -n`, `tail -f` |
| compter | `wc -l` |
| chercher dans un fichier | `grep motif f` (`-i -v -n -r -E`) |
| chercher un fichier | `find / -name "*.h"` |
| trier / dédoublonner | `sort`, `sort \| uniq -c` |
| extraire une colonne | `cut -d: -f1`, `awk -F: '{print $1}'` |
| remplacer | `sed 's/a/b/g'` |

### Utilisateurs et droits

| Besoin | Commande |
|---|---|
| créer groupe / utilisateur | `groupadd g`, `useradd -m -g g1 -G g2 -s /bin/bash u` |
| mot de passe | `passwd u`, `echo 'u:mdp' \| chpasswd` |
| ajouter à un groupe | `usermod -aG g u` |
| supprimer | `userdel -r u`, `groupdel g` |
| identité | `id u`, `groups u`, `getent passwd u` |
| changer d'utilisateur | `su - u`, `sudo cmd` |
| droits | `chmod 750 f`, `chown u:g f`, `umask 027` |

### Système

| Besoin | Commande |
|---|---|
| processus | `ps aux`, `top`, `kill`, `kill -9`, `jobs` |
| services | `systemctl status\|start\|stop\|restart\|enable nom` |
| journaux | `journalctl -u nom`, `tail -f /var/log/syslog` |
| paquets (Debian / RHEL) | `apt install` / `dnf install`, `dpkg -l` / `rpm -qa` |
| disques | `lsblk`, `df -h`, `mount`, `fdisk -l`, `/etc/fstab` |
| réseau | `ip a`, `ip r`, `ss -tulnp`, `ping`, `dig` |
| planification | `crontab -e`, `at` |
| archivage | `tar -czf`, `tar -xzf`, `rsync -a` |

## B.3 Erreurs fréquentes dans les copies

| Erreur | Conséquence | Correct |
|---|---|---|
| `usermod -G g u` sans `-a` | **efface** les autres groupes secondaires | `usermod -aG g u` |
| `/etc/password` | fichier inexistant | `/etc/passwd` |
| `>` au lieu de `>>` | écrase le fichier | `>>` pour ajouter |
| `chmod 777` partout | trou de sécurité | donner le minimum de droits |
| `rm -rf /` ou `rm -rf *` hâtif | perte de données | vérifier le chemin avec `ls` d'abord |
| `sudo echo x > /etc/f` | la redirection n'a pas les droits | `echo x \| sudo tee /etc/f` |
| `a = 5` en script | commande introuvable | `a=5` |
| script sans `chmod +x` ni shebang | `Permission denied` | `#!/bin/bash` + `chmod +x` |
| `mkdir a/b/c` sans `-p` | erreur si `a` n'existe pas | `mkdir -p a/b/c` |
| `find / -name *.h` sans guillemets | le shell développe `*.h` | `find / -name "*.h"` |
| modifier `/etc/sudoers` avec `vi` | risque de verrouiller sudo | `visudo` |
| `useradd` sans `-m` | pas de répertoire personnel | `useradd -m` |
| tester `fsck` sur un système monté | corruption | démonter avant |

## B.4 Aide-mémoire (une page)

### Permissions

| Octal | Symbolique | Binaire |
|---|---|---|
| 7 | `rwx` | 111 |
| 6 | `rw-` | 110 |
| 5 | `r-x` | 101 |
| 4 | `r--` | 100 |
| 0 | `---` | 000 |

`umask` : fichiers = 666 − umask ; répertoires = 777 − umask (`022` → 644/755 ; `027` → 640/750 ; `077` → 600/700). Bits spéciaux : SUID 4000, SGID 2000, sticky 1000 (`chmod 2775 dossier`).

### Signaux

| Signal | Numéro | Usage |
|---|---|---|
| `SIGHUP` | 1 | recharger |
| `SIGINT` | 2 | `Ctrl+C` |
| `SIGKILL` | 9 | tuer sans appel |
| `SIGTERM` | 15 | arrêt propre (défaut) |
| `SIGSTOP` / `SIGCONT` | 19 / 18 | suspendre / reprendre |

### Fichiers de configuration clés

| Fichier | Rôle |
|---|---|
| `/etc/passwd` | comptes utilisateurs (7 champs) |
| `/etc/shadow` | mots de passe hachés et expiration |
| `/etc/group` | groupes et membres |
| `/etc/sudoers`, `/etc/sudoers.d/` | droits `sudo` |
| `/etc/fstab` | systèmes de fichiers à monter au démarrage |
| `/etc/hosts`, `/etc/hostname` | résolution locale, nom de la machine |
| `/etc/resolv.conf` | serveurs DNS |
| `/etc/crontab`, `/etc/cron.d/` | tâches planifiées système |
| `/etc/ssh/sshd_config` | serveur SSH |
| `/etc/os-release` | identification de la distribution |
| `/etc/services` | correspondance nom de service ↔ port |
| `/etc/default/grub` | options de GRUB |

### Répertoires : réponses types

| Répertoire | À retenir |
|---|---|
| `/etc` | fichiers de **configuration** du système et des services (texte) |
| `/var` | données **variables** : logs (`/var/log`), spool, bases de données, caches |
| `/home` | répertoires **personnels** des utilisateurs (`/home/alice`) |
| `/tmp` | fichiers **temporaires**, accessibles à tous (sticky bit), souvent vidés au redémarrage |
| `/usr` | programmes et bibliothèques d'usage courant |
| `/dev` | fichiers représentant les **périphériques** |
| `/proc` | informations du noyau et des processus en temps réel (système de fichiers virtuel) |
| `/boot` | noyau, initramfs, GRUB |

### Ports usuels

| Port | Service | Port | Service |
|---|---|---|---|
| 20/21 | FTP | 80 | HTTP |
| 22 | SSH | 123 | NTP (UDP) |
| 25 | SMTP | 443 | HTTPS |
| 53 | DNS | 3306 | MySQL/MariaDB |
| 67/68 | DHCP | 5432 | PostgreSQL |

### Debian et Red Hat

| Tâche | Debian / Ubuntu | RHEL / Fedora |
|---|---|---|
| installer | `apt install` | `dnf install` |
| groupe admin | `sudo` | `wheel` |
| journal d'authentification | `/var/log/auth.log` | `/var/log/secure` |
| pare-feu | `ufw` | `firewalld` (`firewall-cmd`) |
| réseau | `netplan` | NetworkManager / `ifcfg` |
| service SSH | `ssh` | `sshd` |
| création de compte | `adduser` (interactif) ou `useradd` | `useradd` |

## B.5 Dix questions d'oral

1. **Différence entre un programme et un processus ?** Un programme est un fichier ; un processus est son exécution, avec un PID.
2. **Différence entre lien physique et lien symbolique ?** Le physique partage l'inode et survit à la suppression de l'original ; le symbolique pointe vers un chemin et se casse si la cible disparaît.
3. **Que contient `/etc/shadow` et qui peut le lire ?** Les mots de passe hachés et les dates d'expiration ; root (et le groupe `shadow`).
4. **Que fait le bit sticky sur `/tmp` ?** Seul le propriétaire d'un fichier (ou root) peut le supprimer, même si le répertoire est ouvert à tous.
5. **`kill` et `kill -9` ?** SIGTERM demande un arrêt propre ; SIGKILL force l'arrêt immédiat, sans nettoyage.
6. **Pourquoi `visudo` ?** Il vérifie la syntaxe avant d'enregistrer, évitant de verrouiller `sudo`.
7. **Différence entre `su -` et `sudo -i` ?** Mot de passe de la cible contre le vôtre ; `sudo` est journalisé.
8. **Qu'est-ce qu'un inode ?** La structure qui stocke les métadonnées d'un fichier (droits, propriétaire, taille, emplacement) ; le nom est dans le répertoire.
9. **Que fait `/etc/fstab` ?** Il décrit les systèmes de fichiers à monter automatiquement au démarrage.
10. **Différence entre `restart` et `reload` ?** `restart` arrête puis relance le service (coupure) ; `reload` relit la configuration sans interruption.

## B.6 Exercices corrigés : mini-sujets

**Exercice 1.** (2 pts) Créez le groupe `compta` et l'utilisateur `awa` (groupe principal `compta`, groupe secondaire `rh`, shell bash, avec répertoire personnel), puis définissez son mot de passe à `Azerty2026`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo groupadd compta
sudo groupadd rh
sudo useradd -m -g compta -G rh -s /bin/bash awa
echo 'awa:Azerty2026' | sudo chpasswd
```

(Le groupe `rh` doit exister avant `useradd -G`.)

</details>

**Exercice 2.** (1 pt) Que réalise `chmod 640 rapport.txt` ? Donnez la forme symbolique.

<details>
<summary>Voir le corrigé</summary>

Propriétaire : lecture et écriture ; groupe : lecture ; autres : aucun accès. Forme symbolique : `chmod u=rw,g=r,o= rapport.txt`.

</details>

**Exercice 3.** (1 pt) Affichez les lignes de `/var/log/auth.log` qui contiennent « Failed password ».

<details>
<summary>Voir le corrigé</summary>

```bash
sudo grep "Failed password" /var/log/auth.log
```

</details>

**Exercice 4.** (1 pt) Listez les fichiers `.conf` de `/etc` modifiés depuis moins de 2 jours.

<details>
<summary>Voir le corrigé</summary>

```bash
find /etc -name "*.conf" -mtime -2
```

</details>

**Exercice 5.** (2 pts) Écrivez un script qui crée `sauvegarde` s'il n'existe pas puis y copie tous les `.txt` du dossier courant.

<details>
<summary>Voir le corrigé</summary>

```bash
#!/bin/bash
[ -d sauvegarde ] || mkdir sauvegarde
cp *.txt sauvegarde/
```

</details>

**Exercice 6.** (1 pt) Quelle commande affiche les ports TCP/UDP en écoute avec le processus associé ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ss -tulnp
```

`-t` TCP, `-u` UDP, `-l` en écoute, `-n` numérique, `-p` processus.

</details>

**Exercice 7.** (1 pt) Planifiez le nettoyage de `/tmp` tous les soirs à 3 h.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo crontab -e
```

```text
0 3 * * * find /tmp -type f -mtime +1 -delete
```

Champs : minute, heure, jour du mois, mois, jour de la semaine.

</details>

**Exercice 8.** (1 pt) Redémarrez le service `ssh` et vérifiez qu'il est actif.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo systemctl restart ssh
systemctl status ssh
systemctl is-active ssh
```

(Sur Red Hat : `sshd`.)

</details>

**Exercice 9.** (1 pt) Donnez le rôle de `/etc/fstab`, `/etc/passwd` et `/etc/hosts`.

<details>
<summary>Voir le corrigé</summary>

`fstab` : systèmes de fichiers à monter au démarrage ; `passwd` : liste des comptes utilisateurs ; `hosts` : résolution de noms locale (nom → adresse IP) consultée avant le DNS.

</details>

**Exercice 10.** (1 pt) Un utilisateur doit pouvoir lister un dossier sans y entrer, et un autre y entrer sans lister. Quels droits ?

<details>
<summary>Voir le corrigé</summary>

Lister sans entrer : `r` sans `x` (`chmod 744` sur le dossier ; on voit les noms mais on ne peut ni ouvrir les fichiers ni faire `cd`). Entrer sans lister : `x` sans `r` (`chmod 711` : on peut traverser et lire un fichier dont on connaît le nom).

</details>
