## 3.2.1 De l'allumage au login : la séquence de démarrage

Démarrer un serveur ressemble au lancement d'une fusée à étages : chaque étage ne sert qu'à allumer le suivant, puis s'efface. Quand une machine ne démarre pas, la première question de l'administrateur est donc : **à quel étage cela s'est-il arrêté ?**

| Étape | Qui | Rôle |
|---|---|---|
| 1. Firmware | BIOS ou UEFI | Teste le matériel (POST), choisit le disque de démarrage |
| 2. Chargeur d'amorçage | GRUB2 | Affiche le menu, charge le noyau et l'initramfs en mémoire |
| 3. Noyau | `vmlinuz-...` | Initialise le matériel, monte un système racine temporaire |
| 4. initramfs | `initrd.img-...` | Mini-système en RAM contenant les pilotes nécessaires pour trouver le vrai disque racine (LVM, RAID, chiffrement…) |
| 5. Init | `/sbin/init` (aujourd'hui systemd, PID 1) | Monte les systèmes de fichiers, lance les services |
| 6. Target | `multi-user.target`, `graphical.target` | État final visé : login texte ou graphique |

- **BIOS** (ancien) lit les 446 premiers octets du disque (le MBR) pour trouver GRUB. **UEFI** (moderne) lit un fichier `.efi` dans la partition système **ESP** (FAT32, montée sur `/boot/efi`).
- Le noyau et l'initramfs se trouvent dans `/boot` : `vmlinuz-6.8.0-45-generic`, `initrd.img-6.8.0-45-generic`.

### GRUB2 : fichiers et commandes

| Élément | Rôle |
|---|---|
| `/etc/default/grub` | Le fichier **que l'on édite** (délai, options du noyau, entrée par défaut) |
| `/etc/grub.d/` | Scripts qui génèrent les entrées de menu |
| `/boot/grub/grub.cfg` | Fichier **généré**, à ne jamais modifier à la main |
| `update-grub` | Régénère `grub.cfg` (Debian/Ubuntu) ; équivaut à `grub-mkconfig -o /boot/grub/grub.cfg` |
| `grub2-mkconfig -o /boot/grub2/grub.cfg` | Équivalent RHEL/Fedora (le chemin varie selon la version et BIOS/UEFI) |
| `grub-install /dev/sda` | Réinstalle GRUB sur le disque (BIOS) ; en UEFI, installe dans l'ESP |

```bash
sudo nano /etc/default/grub
```

```text
GRUB_DEFAULT=0
GRUB_TIMEOUT_STYLE=menu
GRUB_TIMEOUT=10
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
GRUB_CMDLINE_LINUX=""
```

```bash
sudo update-grub          # Debian/Ubuntu
sudo grub2-mkconfig -o /boot/grub2/grub.cfg   # RHEL/Fedora
```

Retirer `quiet splash` permet de voir les messages de démarrage, très utile pour dépanner.

:::attention Modifier /etc/default/grub sans régénérer
Si vous éditez `/etc/default/grub` mais oubliez `update-grub`, **rien ne change** au prochain démarrage : GRUB lit `grub.cfg`, pas `/etc/default/grub`. À l'inverse, éditer `grub.cfg` directement est inutile : il sera écrasé à la prochaine mise à jour du noyau.
:::

### Modifier le démarrage à la volée

Au menu GRUB, la touche **e** édite l'entrée (modification temporaire, perdue au redémarrage), **Ctrl+x** (ou F10) démarre avec la modification, **c** ouvre la ligne de commande GRUB. Sur une machine BIOS, il faut parfois maintenir **Shift** pour faire apparaître le menu ; en UEFI, appuyer sur **Échap**.

Pour démarrer en mode secours, on ajoute à la fin de la ligne `linux` : `single`, ou `systemd.unit=rescue.target`, ou `systemd.unit=emergency.target`.

### Mot de passe root perdu

Il faut un accès console (physique ou virtuel). C'est la preuve qu'**un accès physique non protégé équivaut à un accès root** : sur un serveur sensible, on protège GRUB par mot de passe et on chiffre le disque (voir 4.2).

**Ubuntu/Debian**, avec `init=/bin/bash` :

1. Au menu GRUB, touche **e**, aller à la ligne commençant par `linux`.
2. Ajouter à la fin : `init=/bin/bash`, puis **Ctrl+x**.
3. Dans le shell obtenu, la racine est en lecture seule :

```bash
mount -o remount,rw /
passwd root
exec /sbin/init
```

(ou `reboot -f` si `exec /sbin/init` n'est pas possible). Sur Ubuntu, le menu « Advanced options » propose aussi une entrée « recovery mode » avec l'option `root` (shell de secours) : mêmes commandes `mount -o remount,rw /` puis `passwd`.

**RHEL/CentOS/Fedora**, avec `rd.break` :

```bash
# ajouter rd.break à la fin de la ligne linux, puis Ctrl+x
mount -o remount,rw /sysroot
chroot /sysroot
passwd root
touch /.autorelabel
exit
exit
```

`touch /.autorelabel` demande à SELinux de réétiqueter les fichiers au démarrage suivant ; sans cela, la connexion peut échouer après le changement de mot de passe.

## 3.2.2 Les anciens runlevels SysV et leurs équivalents systemd

Avant systemd, le processus `init` (PID 1) lisait `/etc/inittab` et passait d'un **niveau d'exécution** (runlevel) à un autre.

| Runlevel | Signification (SysV) | Target systemd équivalente |
|---|---|---|
| 0 | Arrêt (halt) | `poweroff.target` |
| 1 (ou S) | Mono-utilisateur (single), maintenance | `rescue.target` |
| 2, 3, 4 | Multi-utilisateur, texte (en Debian 2 à 5 sont identiques) | `multi-user.target` |
| 5 | Multi-utilisateur + interface graphique | `graphical.target` |
| 6 | Redémarrage | `reboot.target` |

Une ligne de `/etc/inittab` a le format `id:niveaux:action:processus`. Le niveau par défaut se réglait ainsi :

```text
id:3:initdefault:
```

Les scripts de services se trouvaient dans `/etc/init.d/`. Pour chaque niveau N, le répertoire `/etc/rcN.d/` contenait des liens symboliques : ceux qui commencent par **S** (Start) sont lancés à l'entrée dans le niveau, ceux en **K** (Kill) à la sortie, dans l'ordre du numéro (`S20ssh` avant `S25mdadm`).

```bash
runlevel          # affiche le niveau précédent puis actuel, ex. : N 5
init 3            # passe au niveau 3
telinit 6         # redémarre
service ssh restart   # ancien style, redirige vers systemctl
```

Avec systemd, l'équivalent est :

```bash
systemctl get-default                       # graphical.target
sudo systemctl set-default multi-user.target   # démarrage futur en mode texte
sudo systemctl isolate rescue.target        # bascule immédiatement en mode secours
sudo systemctl isolate graphical.target
```

:::retenir Runlevel ↔ target
0 → poweroff, 1 → rescue, 2-4 → multi-user, 5 → graphical, 6 → reboot. `set-default` change le **prochain** démarrage ; `isolate` change l'état **tout de suite** sans toucher au défaut.
:::

## 3.2.3 systemctl : piloter les services

systemd est le gestionnaire de services (PID 1). Il gère des **unités** (units) décrites par des fichiers texte.

| Type | Extension | Rôle |
|---|---|---|
| Service | `.service` | Un démon (sshd, nginx…) |
| Socket | `.socket` | Démarre un service à la première connexion |
| Timer | `.timer` | Planification (équivalent de cron, voir 3.3) |
| Mount | `.mount` | Point de montage |
| Target | `.target` | Groupe d'unités = état du système |

```bash
systemctl status ssh              # état, PID, derniers logs
sudo systemctl start nginx        # démarre maintenant
sudo systemctl stop nginx
sudo systemctl restart nginx      # arrêt puis démarrage (coupe les connexions)
sudo systemctl reload nginx       # relit la configuration sans couper
sudo systemctl enable nginx       # démarrera à chaque boot
sudo systemctl disable nginx
sudo systemctl enable --now nginx # enable + start en une commande
systemctl is-active nginx         # active / inactive / failed
systemctl is-enabled nginx        # enabled / disabled / masked
systemctl list-units --type=service --state=running
systemctl list-units --failed     # services en échec
systemctl list-unit-files --type=service
sudo systemctl daemon-reload      # après modification d'un fichier d'unité
```

Sortie typique de `systemctl status ssh` :

```text
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/lib/systemd/system/ssh.service; enabled; preset: enabled)
     Active: active (running) since Wed 2026-11-04 08:12:03 WAT; 1 day ago
   Main PID: 812 (sshd)
```

`Loaded` indique le fichier utilisé et si le service est activé au boot ; `Active` l'état courant.

### enable vs start, disable vs mask

| Commande | Effet maintenant | Effet au prochain boot |
|---|---|---|
| `start` | Lance le service | Aucun |
| `enable` | Aucun | Lancement automatique (crée un lien dans `multi-user.target.wants/`) |
| `stop` | Arrête | Aucun |
| `disable` | Aucun | Plus de lancement automatique, mais **démarrage manuel ou par dépendance encore possible** |
| `mask` | Empêche tout démarrage (lien vers `/dev/null`) | Impossible aussi |
| `unmask` | Annule le masquage | |

```bash
sudo systemctl mask bluetooth
sudo systemctl start bluetooth
```

```text
Failed to start bluetooth.service: Unit bluetooth.service is masked.
```

### Où sont les fichiers d'unité ?

| Dossier | Contenu | Priorité |
|---|---|---|
| `/etc/systemd/system/` | Vos unités et surcharges (administrateur) | La plus haute |
| `/lib/systemd/system/` (ou `/usr/lib/systemd/system/` sur RHEL) | Unités installées par les paquets | Basse |

On ne modifie **jamais** les fichiers de `/lib/systemd/system` (écrasés par les mises à jour) : on crée une copie ou un **drop-in** dans `/etc`.

```bash
sudo systemctl edit nginx
```

Cela ouvre un éditeur sur `/etc/systemd/system/nginx.service.d/override.conf`. Exemple :

```ini
[Service]
Environment="APP_ENV=prod"
LimitNOFILE=65535
Restart=on-failure
```

Après sauvegarde, systemd fait le `daemon-reload` tout seul ; il faut ensuite `sudo systemctl restart nginx`. L'option `systemctl edit --full nginx` copie tout le fichier dans `/etc` pour le modifier entièrement. `systemctl cat nginx` affiche le fichier et ses drop-ins.

## 3.2.4 Anatomie d'un fichier .service

```ini
[Unit]
Description=Mon application de démonstration
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=appuser
Environment=APP_PORT=8080
ExecStart=/usr/local/bin/monapp.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

| Section | Directive | Sens |
|---|---|---|
| `[Unit]` | `Description` | Texte affiché par `status` |
| | `After=` | Ordre : démarre **après** cette unité (n'implique pas de dépendance) |
| | `Requires=` | Dépendance **forte** : si elle échoue, ce service échoue aussi |
| | `Wants=` | Dépendance **faible** : on la souhaite, sans bloquer si elle échoue |
| `[Service]` | `Type=` | `simple` (défaut : le processus lancé reste au premier plan), `forking` (démon qui se détache), `oneshot` (tâche courte qui se termine), `notify` |
| | `ExecStart=` | Commande à lancer (chemin **absolu** obligatoire) |
| | `Restart=` | `no`, `on-failure`, `always` |
| | `User=` | Compte d'exécution |
| | `Environment=` | Variable d'environnement |
| `[Install]` | `WantedBy=` | Target qui « veut » ce service quand on fait `enable` (généralement `multi-user.target`) |

### Pas à pas : créer son propre service

**1. Le programme** (écrit son état sur la sortie standard, que journald capture) :

```bash
sudo tee /usr/local/bin/monapp.sh > /dev/null <<'EOF'
#!/bin/bash
while true; do
  echo "monapp : tick $(date +%T)"
  sleep 5
done
EOF
sudo chmod +x /usr/local/bin/monapp.sh
```

**2. L'unité** : `/etc/systemd/system/monapp.service` avec le contenu de l'exemple ci-dessus (en prenant `User=nobody`, compte qui existe partout).

**3. Charger, activer, démarrer, vérifier :**

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now monapp
systemctl status monapp
journalctl -u monapp -n 3
```

```text
Nov 05 10:00:05 srv monapp.sh[2310]: monapp : tick 10:00:05
Nov 05 10:00:10 srv monapp.sh[2310]: monapp : tick 10:00:10
```

**4. Tester la reprise après panne :** `sudo kill -9 $(systemctl show -p MainPID --value monapp)` puis `systemctl status monapp` : le service est relancé après 5 secondes grâce à `Restart=on-failure`.

:::examen Les trois erreurs classiques d'un fichier .service
(1) Oublier `daemon-reload` après avoir créé ou modifié l'unité ; (2) `ExecStart` sans chemin absolu ou script non exécutable (`status` affiche `code=exited, status=203/EXEC`) ; (3) `enable` sans `[Install]`, ce qui donne « The unit files have no installation config ».
:::

## 3.2.5 journalctl : lire les journaux de systemd

`journald` collecte les messages de tous les services et du noyau dans un journal binaire. On le lit avec `journalctl`.

```bash
journalctl                       # tout (du plus ancien au plus récent)
journalctl -u ssh                # un service
journalctl -u ssh -n 20          # 20 dernières lignes
journalctl -f                    # suivi en direct (comme tail -f)
journalctl -u nginx -f
journalctl -b                    # depuis le boot courant
journalctl -b -1                 # boot précédent
journalctl --list-boots
journalctl -p err                # priorité err et plus grave
journalctl -p warning -b
journalctl --since "2026-11-05 08:00" --until "2026-11-05 09:00"
journalctl --since "1 hour ago"
journalctl --since yesterday
journalctl -u ssh -o json-pretty -n 1    # format JSON (-o json sur une ligne)
journalctl -k                    # messages du noyau uniquement
journalctl --disk-usage
```

**Persistance.** Sur certaines distributions le journal est stocké en RAM (`/run/log/journal`) et perdu au redémarrage ; `journalctl -b -1` ne renvoie alors rien. Pour le rendre persistant :

```bash
sudo mkdir -p /var/log/journal
sudo systemctl restart systemd-journald
```

ou fixer `Storage=persistent` dans `/etc/systemd/journald.conf`. Pour limiter la taille, dans ce même fichier :

```ini
[Journal]
Storage=persistent
SystemMaxUse=500M
```

```bash
sudo systemctl restart systemd-journald
sudo journalctl --vacuum-size=200M    # réduit immédiatement à 200 Mo
sudo journalctl --vacuum-time=2weeks  # supprime ce qui date de plus de 2 semaines
```

## 3.2.6 systemd-analyze : pourquoi mon démarrage est lent ?

```bash
systemd-analyze                    # durée totale (noyau + userspace)
systemd-analyze blame              # services classés du plus lent au plus rapide
systemd-analyze critical-chain     # la chaîne qui détermine la durée du boot
systemd-analyze security ssh.service   # note d'exposition sécurité d'un service
systemd-analyze plot > boot.svg    # diagramme
```

```text
Startup finished in 3.2s (kernel) + 8.5s (userspace) = 11.7s
graphical.target reached after 8.4s in userspace
```

`blame` liste les durées par unité ; `critical-chain` montre ce qui a réellement retardé l'atteinte de la target (un service lent mais parallèle ne compte pas).

## 3.2.7 Arrêt et redémarrage

```bash
sudo poweroff                 # arrêt immédiat
sudo reboot                   # redémarrage
sudo shutdown -h now          # arrêt maintenant
sudo shutdown -h +10 "Maintenance dans 10 minutes"   # arrêt dans 10 min, message aux utilisateurs
sudo shutdown -r 22:00        # redémarrage à 22h00
sudo shutdown -c              # annule un arrêt programmé
```

`-h` = halt/arrêt, `-r` = reboot. Ces commandes sont des raccourcis vers `systemctl poweroff` et `systemctl reboot`.

## 3.2.8 Noyau, modules et paramètres

```bash
uname -r                  # version du noyau, ex. 6.8.0-45-generic
uname -a                  # toutes les infos
lsmod                     # modules chargés
modinfo e1000e            # description, paramètres d'un module
sudo modprobe loop        # charge un module (et ses dépendances)
sudo modprobe -r loop     # le décharge
```

- `modprobe` gère les dépendances ; `insmod`/`rmmod` travaillent sur un fichier précis sans dépendances.
- **Charger un module au boot** : un fichier `/etc/modules-load.d/monmodule.conf` contenant le nom du module, un par ligne.
- **Interdire un module** (blacklist) : fichier `/etc/modprobe.d/blacklist-pcspkr.conf` :

```text
blacklist pcspkr
```

puis `sudo update-initramfs -u` (Debian/Ubuntu) pour que l'initramfs en tienne compte. `blacklist` empêche le chargement automatique ; pour interdire aussi un chargement manuel, on ajoute `install pcspkr /bin/false`.

**sysctl** lit et modifie les paramètres du noyau (fichiers de `/proc/sys`) :

```bash
sysctl net.ipv4.ip_forward              # net.ipv4.ip_forward = 0
sudo sysctl -w net.ipv4.ip_forward=1    # temporaire (perdu au reboot)
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-forward.conf
sudo sysctl --system                    # recharge tous les fichiers de configuration
```

**dmesg** affiche le tampon de messages du noyau (matériel détecté, erreurs de disque, OOM killer) :

```bash
sudo dmesg -T | tail -n 20        # horodatage lisible
sudo dmesg --level=err,warn
sudo dmesg -w                     # suivi en direct
```

Sur Ubuntu, `dmesg` est réservé à root par défaut (`kernel.dmesg_restrict = 1`) : utilisez `sudo` ou `journalctl -k`.

## 3.2.9 Exercices corrigés

**Exercice 1.** Citez dans l'ordre les six étapes du démarrage d'un système Linux moderne.

<details>
<summary>Voir le corrigé</summary>

BIOS/UEFI → GRUB2 → noyau → initramfs → systemd (PID 1) → target (`multi-user` ou `graphical`).

Chaque étape lance la suivante ; une panne à une étape précise (écran GRUB absent, « kernel panic », échec de montage de la racine) indique où chercher.

</details>

**Exercice 2.** Vous avez modifié `GRUB_TIMEOUT=10` dans `/etc/default/grub`. Quelle commande rend la modification effective sur Ubuntu ? Et sur Fedora ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo update-grub
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

La première est pour Ubuntu/Debian, la seconde pour RHEL/Fedora (chemin de sortie variable selon la version et le mode UEFI). Ces commandes régénèrent `grub.cfg` à partir de `/etc/default/grub` et de `/etc/grub.d/`.

</details>

**Exercice 3.** Quel est l'équivalent systemd des runlevels 1, 3, 5 et 6 ? Donnez les commandes pour afficher la target par défaut puis la fixer en mode texte.

<details>
<summary>Voir le corrigé</summary>

```bash
systemctl get-default
sudo systemctl set-default multi-user.target
```

Runlevel 1 = `rescue.target`, 3 = `multi-user.target`, 5 = `graphical.target`, 6 = `reboot.target`. Le changement s'applique au prochain démarrage ; pour basculer tout de suite : `sudo systemctl isolate multi-user.target`.

</details>

**Exercice 4.** Expliquez la différence entre `systemctl disable` et `systemctl mask`. Que se passe-t-il si on tape `systemctl start` sur un service masqué ?

<details>
<summary>Voir le corrigé</summary>

`disable` retire seulement le démarrage automatique au boot ; le service peut encore être lancé à la main ou par dépendance. `mask` lie l'unité à `/dev/null` : aucun démarrage possible, ni manuel ni par dépendance.

```text
Failed to start bluetooth.service: Unit bluetooth.service is masked.
```

On annule avec `systemctl unmask`.

</details>

**Exercice 5.** Donnez les commandes pour : (a) lister les services en échec ; (b) savoir si `ssh` est activé au démarrage ; (c) relire la configuration de `nginx` sans couper les connexions.

<details>
<summary>Voir le corrigé</summary>

```bash
systemctl list-units --failed
systemctl is-enabled ssh
sudo systemctl reload nginx
```

`reload` envoie au service l'ordre de relire sa configuration (si le service le supporte) ; `restart` couperait les connexions en cours.

</details>

**Exercice 6.** Écrivez un fichier d'unité `/etc/systemd/system/sauvegarde.service` qui exécute une seule fois `/usr/local/bin/sauvegarde.sh` en tant que `root`, après le réseau.

<details>
<summary>Voir le corrigé</summary>

```ini
[Unit]
Description=Sauvegarde quotidienne
After=network.target

[Service]
Type=oneshot
User=root
ExecStart=/usr/local/bin/sauvegarde.sh
```

`Type=oneshot` convient à une tâche qui se termine ; on n'ajoute pas de `Restart`. Aucune section `[Install]` n'est nécessaire si elle est déclenchée par un timer (voir 3.3). Puis : `sudo systemctl daemon-reload && sudo systemctl start sauvegarde`.

</details>

**Exercice 7.** Le service `monapp` doit disposer de la variable `APP_ENV=prod` sans modifier le fichier du paquet. Quelle méthode utiliser et quelles commandes taper ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo systemctl edit monapp
```

Dans l'éditeur, écrire :

```ini
[Service]
Environment="APP_ENV=prod"
```

Puis `sudo systemctl restart monapp` et vérifier avec `systemctl show monapp -p Environment`. Le drop-in est enregistré dans `/etc/systemd/system/monapp.service.d/override.conf` et survit aux mises à jour du paquet.

</details>

**Exercice 8.** Avec `journalctl`, affichez : (a) les erreurs du boot précédent ; (b) les 50 dernières lignes de `sshd` en suivi continu ; (c) les messages de `nginx` entre 08h et 09h aujourd'hui.

<details>
<summary>Voir le corrigé</summary>

```bash
journalctl -b -1 -p err
journalctl -u ssh -n 50 -f
journalctl -u nginx --since "08:00" --until "09:00"
```

Le service SSH s'appelle `ssh` sur Ubuntu/Debian et `sshd` sur RHEL. `-b -1` nécessite un journal persistant.

</details>

**Exercice 9.** Le journal occupe 3 Go. Comment le ramener à 500 Mo immédiatement, puis empêcher qu'il dépasse 500 Mo à l'avenir ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo journalctl --vacuum-size=500M
```

Puis dans `/etc/journald.conf` (ou `/etc/systemd/journald.conf`) :

```ini
[Journal]
SystemMaxUse=500M
```

et `sudo systemctl restart systemd-journald`. `--vacuum-size` est une action ponctuelle ; `SystemMaxUse` est une limite permanente.

</details>

**Exercice 10.** Le démarrage de la machine prend 2 minutes. Quelles commandes permettent d'identifier le coupable ?

<details>
<summary>Voir le corrigé</summary>

```bash
systemd-analyze
systemd-analyze blame | head
systemd-analyze critical-chain
```

`systemd-analyze` donne le temps total ; `blame` classe les unités par durée d'initialisation ; `critical-chain` montre la chaîne qui retarde réellement l'atteinte de la target.

</details>

**Exercice 11.** Rendez permanent le routage IPv4 (`net.ipv4.ip_forward=1`) et chargez le module `br_netfilter` à chaque démarrage. Donnez les commandes.

<details>
<summary>Voir le corrigé</summary>

```bash
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-forward.conf
sudo sysctl --system
echo br_netfilter | sudo tee /etc/modules-load.d/br_netfilter.conf
```

Un fichier dans `/etc/sysctl.d/` rend le réglage persistant (`sysctl -w` seul serait temporaire). Un fichier `.conf` dans `/etc/modules-load.d/` liste les modules à charger au boot.

</details>

**Exercice 12.** Vous avez perdu le mot de passe root d'une machine Ubuntu de test. Décrivez la procédure de récupération.

<details>
<summary>Voir le corrigé</summary>

```bash
# Au menu GRUB : touche e, ajouter init=/bin/bash à la ligne linux, Ctrl+x
mount -o remount,rw /
passwd root
exec /sbin/init
```

La racine est montée en lecture seule dans ce mode : sans le `remount,rw`, `passwd` échouerait. Sur RHEL, on utilise `rd.break`, puis `mount -o remount,rw /sysroot`, `chroot /sysroot`, `passwd`, `touch /.autorelabel`. Prévention : mot de passe GRUB et chiffrement du disque.

</details>
