## 5.3.1 La méthode

Un bon administrateur ne « tente pas des commandes au hasard ». Il suit une démarche :

1. **Reproduire / décrire** le symptôme précisément (message d'erreur exact, depuis quand, qu'est-ce qui a changé ?).
2. **Observer** : journaux, état des services, ressources.
3. **Formuler une hypothèse**, la plus simple d'abord.
4. **Tester** sans rien casser (commande de lecture, test de configuration).
5. **Corriger**, puis **vérifier** que le symptôme a disparu.
6. **Documenter** et mettre en place une **prévention**.

### La méthode USE (Brendan Gregg)

Pour chaque ressource (CPU, mémoire, disque, réseau), regardez :

| Lettre | Question | Exemple (CPU) |
|---|---|---|
| **U**tilisation | quel pourcentage est occupé ? | `top`, `mpstat` |
| **S**aturation | du travail attend-il ? | `load average` > nombre de cœurs |
| **E**rreurs | y a-t-il des erreurs ? | `dmesg`, compteurs d'erreurs |

Pour le réseau, on avance **couche par couche** : lien, adresse IP, passerelle, DNS, service (voir 4.3).

| Ressource | Outils |
|---|---|
| CPU | `top`, `uptime`, `mpstat`, `ps aux --sort=-%cpu` |
| Mémoire | `free -h`, `vmstat 1`, `ps aux --sort=-%mem`, `dmesg \| grep -i oom` |
| Disque | `df -h`, `df -i`, `du`, `iostat -x`, `iotop`, `lsof +L1` |
| Réseau | `ip a`, `ip r`, `ss -tulnp`, `ping`, `dig`, `traceroute` |
| Services / logs | `systemctl status`, `journalctl -xeu service`, `/var/log/` |

## 5.3.2 Scénario 1 : le disque est plein

**Symptôme** : `No space left on device`, applications qui plantent.

```bash
df -h                                   # quelle partition est pleine ?
sudo du -xh / --max-depth=1 2>/dev/null | sort -h | tail     # quel dossier est gros ? (-x : reste sur la partition)
sudo du -xh /var --max-depth=2 | sort -h | tail
sudo lsof +L1                           # fichiers supprimés mais toujours ouverts (l'espace n'est pas rendu)
```

**Corrections** : supprimer ou archiver les gros fichiers (souvent des logs), `sudo journalctl --vacuum-size=200M`, `sudo apt clean`, relancer le service qui retient un fichier supprimé (ou `: > /proc/PID/fd/N` pour le vider sans redémarrer). **Prévention** : `logrotate`, quotas, alerte à 80 % (voir 3.3).

## 5.3.3 Scénario 2 : « No space left » alors qu'il reste de la place

```bash
df -h /var      # 40 % utilisé : l'espace est là
df -i /var      # IUse% à 100 % : plus d'inodes !
```

Un système de fichiers a un nombre fixe d'**inodes** ; des millions de petits fichiers (sessions PHP, mails, caches) les épuisent. On cherche le dossier fautif : `sudo find /var -xdev -type f | cut -d/ -f1-4 | sort | uniq -c | sort -nr | head`, puis on supprime les fichiers inutiles.

## 5.3.4 Scénario 3 : fstab cassé, le système démarre en mode urgence

**Symptôme** : au démarrage, « You are in emergency mode » après une modification de `/etc/fstab` (mauvais UUID, faute de frappe).

```bash
journalctl -xb | tail          # le message indique le montage fautif
mount -o remount,rw /          # le système racine est en lecture seule en mode urgence
nano /etc/fstab                # corriger (ou commenter la ligne fautive)
blkid                          # retrouver le bon UUID
mount -a                       # tester sans redémarrer
reboot
```

**Prévention** : après chaque modification de `fstab`, toujours lancer `sudo mount -a` avant de redémarrer ; ajouter l'option `nofail` pour les disques non essentiels.

## 5.3.5 Scénario 4 : un service ne démarre pas

```bash
systemctl status nginx          # état, dernières lignes du journal
journalctl -xeu nginx           # détails de l'unité
nginx -t                        # test de la configuration (sshd -t, apachectl configtest)
ss -tulnp | grep ':80'          # un autre programme occupe-t-il le port ?
```

Causes fréquentes : erreur de syntaxe dans la configuration, port déjà utilisé, permission refusée, fichier manquant, disque plein. Après correction : `sudo systemctl restart nginx` puis `systemctl status nginx`.

## 5.3.6 Scénario 5 : le réseau ne fonctionne plus

| Test | Commande | Si échec |
|---|---|---|
| Lien et adresse | `ip -br a` | interface down ou pas d'IP : `ip link set eth0 up`, netplan, DHCP |
| Passerelle | `ip r` puis `ping 192.168.1.1` | route par défaut manquante : `sudo ip route add default via 192.168.1.1` |
| Internet par IP | `ping -c 3 8.8.8.8` | problème de passerelle, NAT ou pare-feu |
| DNS | `ping google.com`, `dig google.com` | `/etc/resolv.conf`, `resolvectl status` |
| Service distant | `nc -zv hôte 443`, `curl -v https://...` | pare-feu, service arrêté |

Si `ping 8.8.8.8` marche mais pas `ping google.com`, le problème est le **DNS**.

## 5.3.7 Scénario 6 : la machine est lente

```bash
uptime                      # load average par rapport au nombre de cœurs (nproc)
top                         # %us/%sy élevés : CPU ; %wa élevé : disque ; swap qui s'enfle : mémoire
free -h ; vmstat 1 5        # colonnes si/so : activité de swap
iostat -x 1 3               # %util proche de 100 : disque saturé
ps aux --sort=-%cpu | head
```

On identifie la **ressource limitante** (USE), puis le processus responsable : `kill`, `renice`, ajout de mémoire, limitation avec cgroups/systemd (`MemoryMax=`).

## 5.3.8 Scénario 7 : accès perdu

**Mot de passe root perdu** (Ubuntu/Debian) : au menu GRUB, touche `e`, ajouter `rw init=/bin/bash` à la ligne `linux`, `Ctrl+X`. Dans le shell obtenu : `passwd root`, puis `exec /sbin/init` ou redémarrage. Sur Red Hat : ajouter `rd.break`, puis `mount -o remount,rw /sysroot`, `chroot /sysroot`, `passwd`, `touch /.autorelabel`.

**sudoers ou PAM cassé** : démarrer en mode secours, corriger avec `visudo`, redémarrer. C'est la raison de ne **jamais** éditer `sudoers` autrement qu'avec `visudo`, et de garder une session root ouverte avant de toucher à PAM ou à `sshd_config`.

## 5.3.9 Autres incidents fréquents

| Symptôme | Diagnostic | Remède |
|---|---|---|
| `dpkg` interrompu, paquet cassé | `sudo dpkg --configure -a` puis `sudo apt -f install` | réparer la configuration |
| Verrou `/var/lib/dpkg/lock` | un autre `apt` tourne | attendre, ne pas supprimer le verrou à la légère |
| Zombies (`Z`) | `ps aux \| grep ' Z '` | agir sur le **père** |
| Out of memory | `dmesg \| grep -i 'killed process'` | réduire la charge, ajouter du swap/RAM |
| Disque d'un RAID1 en panne | `cat /proc/mdstat` (`[U_]`) | `mdadm --fail`, `--remove`, `--add` |
| Machine compromise | `last`, `lastb`, `find / -mtime -2`, `debsums -c` / `rpm -V` | isoler, analyser, réinstaller |
| `Permission denied` mystérieux | `namei -l /chemin/complet` | il manque `x` sur un répertoire du chemin |

:::retenir Le réflexe
Lire le **message d'erreur exact**, puis le **journal** (`journalctl -xe`, `/var/log`). 80 % des pannes s'expliquent par ces deux sources.
:::

:::attention Avant toute manipulation risquée
Prenez un **snapshot** de la VM (ou une sauvegarde), gardez une **deuxième session ouverte**, et testez les configurations avant de les appliquer (`sshd -t`, `nginx -t`, `mount -a`, `visudo -c`).
:::

## 5.3.10 Exercices corrigés

**Exercice 1.** `df -h` montre 45 % d'utilisation mais l'écriture échoue avec « No space left on device ». Que vérifiez-vous ?

<details>
<summary>Voir le corrigé</summary>

```bash
df -i
```

Les inodes sont saturés (IUse% à 100 %). On cherche le dossier contenant des millions de petits fichiers et on les supprime.

</details>

**Exercice 2.** Comment trouver les cinq plus gros sous-dossiers de `/var` ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo du -xh /var --max-depth=1 2>/dev/null | sort -rh | head -n 6
```

La première ligne est le total de `/var`.

</details>

**Exercice 3.** Vous avez supprimé un énorme log mais `df` n'indique aucun gain. Pourquoi ?

<details>
<summary>Voir le corrigé</summary>

Un processus garde le fichier ouvert : l'espace n'est libéré qu'à sa fermeture. `sudo lsof +L1` le montre ; on relance le service ou on vide le fichier via `/proc/PID/fd/N`.

</details>

**Exercice 4.** Le système démarre en mode urgence après une modification de `/etc/fstab`. Que faites-vous ?

<details>
<summary>Voir le corrigé</summary>

```bash
mount -o remount,rw /
nano /etc/fstab        # corriger l'UUID (blkid) ou commenter la ligne
mount -a
reboot
```

</details>

**Exercice 5.** `nginx` ne démarre pas. Donnez la séquence de diagnostic.

<details>
<summary>Voir le corrigé</summary>

```bash
systemctl status nginx
journalctl -xeu nginx
nginx -t
sudo ss -tulnp | grep ':80'
```

</details>

**Exercice 6.** `ping 8.8.8.8` fonctionne mais `ping google.com` échoue. Quelle est la panne ?

<details>
<summary>Voir le corrigé</summary>

La résolution DNS. On vérifie `/etc/resolv.conf`, `resolvectl status` et `dig google.com`.

</details>

**Exercice 7.** Expliquez la méthode USE.

<details>
<summary>Voir le corrigé</summary>

Pour chaque ressource, on examine l'**U**tilisation (pourcentage occupé), la **S**aturation (du travail en attente) et les **E**rreurs. Cela désigne rapidement la ressource limitante.

</details>

**Exercice 8.** Comment réparer un paquet dont l'installation a été interrompue ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo dpkg --configure -a
sudo apt -f install
```

</details>

**Exercice 9.** Un utilisateur obtient « Permission denied » sur `/home/projet/docs/rapport.txt` alors que le fichier est en `644`. Pourquoi ?

<details>
<summary>Voir le corrigé</summary>

Il manque probablement le droit `x` sur l'un des répertoires du chemin (`/home/projet` ou `docs`). `namei -l /home/projet/docs/rapport.txt` affiche les droits de chaque niveau.

</details>
