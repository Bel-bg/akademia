## 4.1.1 Disques, partitions et systèmes de fichiers : le vocabulaire

Un disque neuf ressemble à un **terrain vague**. Il faut d'abord le **lotir** (créer des **partitions**), puis **construire** sur chaque lot (créer un **système de fichiers**, ou FS), enfin **raccorder** la construction à la rue principale (le **montage** dans l'arborescence). Linux n'a pas de lettres `C:` ou `D:` : tout est rattaché sous `/`.

| Étape | Outil | Résultat |
|---|---|---|
| Partitionner | `fdisk`, `parted` | `/dev/sdb1` |
| Formater (créer le FS) | `mkfs.ext4`, `mkfs.xfs`, `mkfs.vfat` | un FS avec UUID |
| Monter | `mount`, `/etc/fstab` | accessible dans `/mnt/data` |

### Noms des périphériques

| Nom | Type | Partition 1 |
|---|---|---|
| `/dev/sda`, `/dev/sdb`… | Disques SATA/SAS/USB (ordre de détection) | `/dev/sda1` |
| `/dev/vda`, `/dev/vdb`… | Disques virtio (machines virtuelles KVM) | `/dev/vda1` |
| `/dev/nvme0n1` | SSD NVMe : contrôleur 0, espace de noms 1 | `/dev/nvme0n1p1` |
| `/dev/sr0` | Lecteur optique | |
| `/dev/loop0` | Fichier présenté comme un disque (voir 4.1.9) | |

Avec NVMe on ajoute un `p` avant le numéro de partition (`nvme0n1p1`), car le nom du disque se termine déjà par un chiffre. Les lettres `sdX` dépendent de l'ordre de détection : un disque peut passer de `sdb` à `sdc` après un redémarrage. C'est pourquoi on monte par **UUID** et non par nom (voir 4.1.7).

### MBR ou GPT

| | MBR (DOS) | GPT |
|---|---|---|
| Taille de disque maximale | 2 To | pratiquement illimitée |
| Partitions | 4 primaires (ou 3 + 1 étendue contenant des logiques) | 128 par défaut |
| Démarrage | BIOS « legacy » | UEFI (accepté aussi en BIOS avec une partition `bios_grub`) |
| Sauvegarde de la table | aucune | copie en fin de disque, contrôle CRC |

Règle pratique : **GPT** pour tout disque neuf, MBR pour du matériel ancien ou une petite clé USB compatible partout.

## 4.1.2 Observer : lsblk, blkid, df, du

```bash
lsblk
```

```text
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   40G  0 disk
├─sda1   8:1    0    1M  0 part
├─sda2   8:2    0    2G  0 part /boot
└─sda3   8:3    0   38G  0 part /
sdb      8:16   0   10G  0 disk
```

`sdb` n'a aucune partition : c'est notre disque à préparer. `-f` ajoute le type de FS, le label et l'UUID :

```bash
lsblk -f
sudo blkid
sudo blkid /dev/sdb1
```

```text
NAME   FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sda2   ext4   1.0         3f1c0b3e-7d1a-4b8f-9c3e-5a0c1d2e4f60  1.6G    11%    /boot
sda3   ext4   1.0         8612cb56-e968-4321-8e71-9b9c479a2af7   24G    32%    /

/dev/sdb1: UUID="a1b2c3d4-0000-4aaa-bbbb-123456789abc" BLOCK_SIZE="4096" TYPE="ext4"
```

`blkid` lit directement les métadonnées du FS (UUID, type, label) ; c'est la commande à citer pour « trouver l'UUID d'une partition ».

### Espace utilisé : df et du

```bash
df -h
df -hT /home
df -i
du -sh /var/log
du -h --max-depth=1 /var | sort -h
```

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda3        38G   12G   24G  34% /
/dev/sda2       2.0G  190M  1.6G  11% /boot
tmpfs           2.0G     0  2.0G   0% /dev/shm
```

| Commande | Rôle |
|---|---|
| `df -h` | Espace par **système de fichiers monté** (`-h` : lisible, Ko/Mo/Go) |
| `df -T` | Ajoute la colonne **type** de FS |
| `df -i` | Compte les **inodes** (voir 4.1.4) au lieu des octets |
| `du -sh dossier` | **Taille d'un dossier** (`-s` : total seul) |
| `du -h --max-depth=1 /var` | Taille de chaque sous-dossier direct |

`df` interroge le système de fichiers (rapide, global) ; `du` parcourt les fichiers (plus lent, précis pour un dossier). Quand ils divergent, pensez à un fichier supprimé mais encore ouvert (voir 4.1.11).

## 4.1.3 Partitionner : fdisk et parted

**`fdisk`** est interactif et ne touche le disque qu'à l'appui sur `w` : tant que vous n'avez pas écrit, vous pouvez tout abandonner avec `q`.

```bash
sudo fdisk -l /dev/sdb
sudo fdisk /dev/sdb
```

Commandes internes de `fdisk` à connaître :

| Touche | Action |
|---|---|
| `m` | Aide |
| `p` | Affiche la table actuelle |
| `g` / `o` | Crée une table **GPT** / **MBR** vide |
| `n` | Nouvelle partition (numéro, premier secteur, taille comme `+5G`) |
| `d` | Supprime une partition |
| `t` | Change le **type** (par exemple `8e` ou « Linux LVM », `82` ou « Linux swap » en MBR) |
| `w` | **Écrit** et quitte |
| `q` | Quitte **sans** écrire |

Session type (extrait) : table GPT, une partition de 5 Go.

```text
Command (m for help): g
Created a new GPT disklabel (GUID: 1E3F...).

Command (m for help): n
Partition number (1-128, default 1):
First sector (2048-20971486, default 2048):
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-20971486, default 20971486): +5G
Created a new partition 1 of type 'Linux filesystem' and of size 5 GiB.

Command (m for help): w
The partition table has been altered.
Syncing disks.
```

Appuyer sur Entrée accepte la valeur par défaut. Après `w`, vérifiez avec `lsblk /dev/sdb` ; si le noyau n'a pas relu la table, `sudo partprobe /dev/sdb` le force.

**`parted`** fonctionne aussi en une ligne (script) et **applique immédiatement** :

```bash
sudo parted /dev/sdb --script mklabel gpt
sudo parted /dev/sdb --script mkpart data ext4 1MiB 5GiB
sudo parted /dev/sdb print
```

:::attention Le bon disque, toujours
`fdisk` et `parted` détruisent la table de partitions du disque visé, donc ses données. Avant `w`, relisez le nom avec `lsblk` : taper `/dev/sda` au lieu de `/dev/sdb` efface le système. Faites vos exercices sur des **fichiers loop** (voir 4.1.9) ou une machine virtuelle.
:::

## 4.1.4 Les systèmes de fichiers : choisir et créer

| FS | Points forts | Limites / usage |
|---|---|---|
| **ext4** | Stable, universel, journalisé, **réductible** ; défaut Ubuntu/Debian | Aucune fonction avancée (pas de snapshot natif) |
| **XFS** | Très bon avec gros fichiers et forte charge ; défaut RHEL | **Agrandissable mais pas réductible** |
| **Btrfs** | Snapshots, compression, sommes de contrôle, sous-volumes | Plus complexe ; réservé aux cas où on veut ces fonctions |
| **FAT32 / vfat** | Lisible partout (clés USB, EFI) | Fichier limité à 4 Go, pas de droits Unix |
| **NTFS** | Disques Windows | Pilote `ntfs3` ou `ntfs-3g` ; droits Unix émulés |
| **swap** | Espace d'échange (voir 4.2) | Pas un FS monté |
| **tmpfs** | FS en **mémoire vive** (voir 4.1.10) | Contenu perdu au redémarrage |

### Créer le système de fichiers

```bash
sudo mkfs.ext4 -L DATA /dev/sdb1
sudo mkfs.xfs -L DATA /dev/sdb1
sudo mkfs.vfat -F 32 -n USB /dev/sdb1
sudo mkswap /dev/sdb2
```

`-L` (ext4, xfs) ou `-n` (vfat) donne une étiquette. `mkfs.xfs` demande `-f` pour écraser un FS existant. `mkfs` écrase le contenu de la partition : c'est une commande destructrice.

### Journal et inodes

Le **journal** est un petit carnet où le FS note ce qu'il va faire avant de le faire. Après une coupure de courant, le noyau relit le journal et termine ou annule les opérations en cours : le contrôle est quasi instantané au lieu de durer des heures. ext4 et XFS sont journalisés, FAT32 ne l'est pas.

Un **inode** est la fiche d'identité d'un fichier (propriétaire, droits, dates, emplacement des blocs ; **pas son nom**, qui est dans le répertoire). Leur nombre est **fixé à la création** du FS (ext4). Un FS peut donc être « plein » de deux façons : plus d'**octets** libres, ou plus d'**inodes** libres.

:::exemple No space left on device alors que df -h montre de la place
Un serveur de messagerie stocke des millions de petits fichiers. Les écritures échouent :

```bash
df -h /var/spool
df -i /var/spool
```

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdb1        50G  8.0G   39G  18% /var/spool

Filesystem      Inodes   IUsed IFree IUse% Mounted on
/dev/sdb1      3276800 3276800     0  100% /var/spool
```

`IFree = 0` : les inodes sont épuisés. Remède : supprimer les petits fichiers inutiles (on repère le dossier coupable avec `for d in /var/spool/*; do echo "$d $(find "$d" | wc -l)"; done`). À la création, `mkfs.ext4 -N nombre` ou `-i octets_par_inode` prévoit davantage d'inodes.
:::

Pour voir les caractéristiques d'un ext4 (on peut tester sur un fichier image, sans droits spéciaux) :

```bash
tune2fs -l disque.img | grep -E "Filesystem volume name|Inode count|Block size|features"
```

```text
Filesystem volume name:   DATA
Filesystem features:      has_journal ext_attr resize_inode dir_index filetype extent 64bit flex_bg sparse_super large_file huge_file dir_nlink extra_isize metadata_csum
Inode count:              16384
Block size:               4096
```

`has_journal` confirme la présence du journal. `tune2fs` ajuste aussi : `-L` (label), `-c 0` (désactive le contrôle périodique), `-m 1` (réserve root ramenée à 1 % ; 5 % par défaut).

## 4.1.5 Monter et démonter

Monter = **associer** un FS à un dossier existant, le **point de montage**. Le contenu antérieur du dossier est masqué tant que le montage dure.

```bash
sudo mkdir -p /mnt/data
sudo mount /dev/sdb1 /mnt/data
mount | grep sdb1
findmnt /mnt/data
sudo umount /mnt/data
```

```text
/dev/sdb1 on /mnt/data type ext4 (rw,relatime)

TARGET     SOURCE    FSTYPE OPTIONS
/mnt/data  /dev/sdb1 ext4   rw,relatime
```

`umount` (sans « n » : c'est bien `umount`, pas `unmount`) accepte le point de montage ou le périphérique. `mount` sans argument liste tout ; `findmnt` l'affiche en arbre, `findmnt -t ext4` filtre par type, `findmnt --verify` contrôle `fstab`.

### Options de montage (`-o`)

| Option | Effet | Cas d'usage |
|---|---|---|
| `ro` / `rw` | Lecture seule / lecture-écriture | Analyse d'un disque suspect |
| `noexec` | Interdit d'**exécuter** les binaires | `/tmp`, clés USB |
| `nosuid` | Ignore les bits setuid/setgid | Partitions de données |
| `nodev` | Ignore les fichiers de périphériques | Partitions de données |
| `noatime` | Ne met plus à jour la date d'accès | Moins d'écritures (SSD) |
| `defaults` | `rw,suid,dev,exec,auto,nouser,async` | Valeur courante dans `fstab` |
| `remount` | Change les options d'un FS déjà monté | `mount -o remount,ro /mnt/data` |

`-t type` force le type de FS (`mount -t vfat /dev/sdc1 /mnt/usb`) ; souvent inutile, le noyau le détecte. On combine par une liste séparée par des virgules : `sudo mount -o ro,noexec,nosuid,nodev /dev/sdb1 /mnt/data`.

### Démontage impossible : « target is busy »

```text
umount: /mnt/data: target is busy.
```

Un processus utilise le FS (souvent votre propre shell, placé dans le dossier).

```bash
cd ~
sudo fuser -vm /mnt/data
sudo lsof +f -- /mnt/data
```

```text
                     USER        PID ACCESS COMMAND
/mnt/data:           alice      4121 ..c..  bash
```

`fuser -vm` liste les processus (`c` = répertoire courant) ; `fuser -km` les **tue** (à manier avec précaution). `umount -l` (« lazy ») détache tout de suite et nettoie plus tard : dernier recours.

## 4.1.6 Vérifier et réparer : fsck, e2fsck, xfs_repair

`fsck` vérifie la cohérence d'un FS (blocs, inodes, répertoires). `fsck.ext4` est un autre nom de `e2fsck`.

```bash
sudo umount /dev/sdb1
sudo e2fsck -f /dev/sdb1
sudo e2fsck -fn /dev/sdb1
sudo xfs_repair /dev/sdb1
```

```text
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information
DATA: 11/16384 files (9.1% non-contiguous), 2065/16384 blocks
```

`-f` force la vérification même si le FS paraît propre ; `-n` répond « non » à tout (simple diagnostic, aucune écriture) ; `-p` répare automatiquement les cas sûrs. XFS utilise `xfs_repair`, et non `fsck`.

:::attention Jamais fsck sur un système de fichiers monté
Réparer un FS en cours d'utilisation corrompt les données : le noyau et `fsck` modifient les mêmes structures. Démontez d'abord. Pour `/`, on lance la vérification au démarrage (paramètre `fsck.mode=force` sur la ligne noyau) ou depuis un système de secours (voir 5.3).
:::

## 4.1.7 /etc/fstab : montage automatique

`/etc/fstab` liste les FS montés au démarrage. Une ligne = **6 champs** :

```text
UUID=a1b2c3d4-0000-4aaa-bbbb-123456789abc  /mnt/data  ext4  defaults,noatime  0  2
```

| N° | Champ | Exemple | Sens |
|---|---|---|---|
| 1 | Périphérique | `UUID=...`, `LABEL=DATA`, `/dev/sdb1` | Quoi monter (préférer l'**UUID**) |
| 2 | Point de montage | `/mnt/data` | Où |
| 3 | Type | `ext4`, `xfs`, `vfat`, `swap` | Système de fichiers |
| 4 | Options | `defaults,noatime` | Comme `-o` |
| 5 | dump | `0` | Sauvegarde par `dump` (presque toujours 0) |
| 6 | fsck | `0`, `1`, `2` | Ordre de vérification : 1 pour `/`, 2 pour les autres, 0 jamais |

Avant de redémarrer, **testez** sans risque :

```bash
sudo mount -a
findmnt --verify
df -h /mnt/data
```

`mount -a` monte tout ce qui est listé et pas encore monté : une erreur apparaît immédiatement au lieu d'un démarrage bloqué. Ajoutez `nofail` aux disques non vitaux (clé USB, disque réseau) pour que leur absence n'empêche pas le démarrage.

:::examen Les six champs et mount -a
Questions fréquentes : « citez les 6 champs de `fstab` », « pourquoi l'UUID plutôt que `/dev/sdb1` ? » (les noms changent selon l'ordre de détection), « comment tester `fstab` sans redémarrer ? » (`mount -a`), « que signifie le 6e champ ? » (ordre de `fsck`). Sur Ubuntu récent, après modification de `fstab`, pensez aussi à `sudo systemctl daemon-reload`.
:::

## 4.1.8 Ajouter un disque pas à pas

Scénario : un disque de 10 Go (`/dev/sdb`) est ajouté pour stocker les données dans `/srv/data`.

```bash
lsblk
sudo fdisk /dev/sdb
```

Dans `fdisk` : `g` (GPT), `n` (Entrée trois fois pour tout le disque), `w`. Puis :

```bash
sudo mkfs.ext4 -L DATA /dev/sdb1
sudo blkid /dev/sdb1
sudo mkdir -p /srv/data
echo 'UUID=a1b2c3d4-0000-4aaa-bbbb-123456789abc  /srv/data  ext4  defaults  0  2' | sudo tee -a /etc/fstab
sudo mount -a
df -hT /srv/data
```

```text
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/sdb1      ext4  9.8G   24K  9.3G   1% /srv/data
```

Récapitulatif en sept temps : **repérer** (`lsblk`), **partitionner** (`fdisk`), **formater** (`mkfs`), **relever l'UUID** (`blkid`), **créer le point de montage**, **déclarer** dans `fstab`, **tester** (`mount -a`).

## 4.1.9 S'exercer sans disque : les périphériques loop

Un **périphérique loop** présente un **fichier** comme un disque. C'est l'outil idéal pour apprendre sans risque (les montages et `losetup` demandent root ; dans une machine virtuelle de TP).

```bash
cd "$(mktemp -d)"
fallocate -l 100M disque.img
mkfs.ext4 -q -L TEST disque.img
sudo mkdir -p /mnt/test
sudo mount -o loop disque.img /mnt/test
df -h /mnt/test
sudo umount /mnt/test
```

`fallocate -l 100M` réserve instantanément 100 Mo. Variantes : `truncate -s 100M disque.img` (fichier **creux**, ne consomme rien au départ) ou `dd if=/dev/zero of=disque.img bs=1M count=100` (écrit réellement des zéros, plus lent).

Pour manipuler le périphérique lui-même (partitionner, empiler LVM ou RAID) :

```bash
sudo losetup -f --show disque.img
sudo losetup -a
sudo losetup -d /dev/loop0
```

```text
/dev/loop0
/dev/loop0: [64769]:131075 (/tmp/tmp.k3x9/disque.img)
```

`-f` choisit le premier loop libre, `--show` affiche son nom, `-d` le libère. Les chapitres suivants (4.2) s'appuient sur ces loops pour LVM, RAID, quotas.

## 4.1.10 Agrandir, réduire, tmpfs

Après avoir agrandi la partition ou le volume (voir 4.2 pour LVM), il faut **agrandir le FS** pour qu'il occupe l'espace :

| FS | Agrandir | Réduire |
|---|---|---|
| ext4 | `sudo resize2fs /dev/sdb1` (monté ou non) | Démonté : `e2fsck -f`, puis `resize2fs /dev/sdb1 3G`, puis réduire la partition |
| XFS | `sudo xfs_growfs /srv/data` (**point de montage**, FS monté) | **Impossible** |

```bash
sudo resize2fs /dev/sdb1
sudo xfs_growfs /srv/data
```

Test sans risque sur un fichier image (vérifié) : `truncate -s 200M disque.img` puis `resize2fs disque.img` après un `e2fsck -f disque.img`.

**`tmpfs`** est un FS en RAM : très rapide, vidé à l'arrêt. `/dev/shm` et `/run` en sont. Pour un cache temporaire :

```bash
sudo mount -t tmpfs -o size=256M,noexec,nosuid tmpfs /mnt/ram
df -h /mnt/ram
```

Ligne `fstab` équivalente : `tmpfs  /mnt/ram  tmpfs  size=256M,noexec,nosuid  0  0`.

## 4.1.11 Fichier supprimé, espace non libéré : lsof +L1

Un `rm` retire le nom du fichier, mais l'espace n'est rendu que lorsque plus aucun processus ne l'ouvre. Un journal de 20 Go supprimé alors que le service tourne encore occupe toujours le disque.

```bash
sudo lsof +L1
```

```text
COMMAND  PID USER  FD  TYPE DEVICE   SIZE/OFF NLINK  NODE NAME
nginx    812 root   4w  REG    8,3 21474836480     0 99123 /var/log/nginx/access.log (deleted)
```

`+L1` liste les fichiers dont le nombre de liens est inférieur à 1 (supprimés mais ouverts). Solution : redémarrer ou recharger le processus (`systemctl reload nginx`), ou vider sans supprimer : `: > /chemin/fichier` (voir 1.4).

:::retenir Les réflexes disque
`lsblk -f` pour voir ; `df -h` et `df -i` pour la place (octets **et** inodes) ; `du -sh` pour trouver le gros dossier ; UUID dans `fstab` ; `mount -a` pour tester ; jamais `fsck` sur un FS monté ; ext4 se réduit, XFS non.
:::

## 4.1.12 Exercices corrigés

**Exercice 1.** Quels sont les noms probables du premier disque SATA, du deuxième disque virtio et de la deuxième partition d'un SSD NVMe ?

<details>
<summary>Voir le corrigé</summary>

```text
/dev/sda
/dev/vdb
/dev/nvme0n1p2
```

Avec NVMe, on insère `p` entre le nom du disque (qui finit par un chiffre) et le numéro de partition.

</details>

**Exercice 2.** Quelle commande affiche les disques, leur type de système de fichiers et leur UUID ? Comment obtenir uniquement l'UUID de `/dev/sdb1` ?

<details>
<summary>Voir le corrigé</summary>

```bash
lsblk -f
sudo blkid -s UUID -o value /dev/sdb1
```

`-s UUID` ne garde que cette information et `-o value` supprime le décor (`UUID="..."`), pratique dans un script.

</details>

**Exercice 3.** Donnez la différence entre `df -h` et `du -sh /var`, et la commande qui affiche l'occupation des inodes.

<details>
<summary>Voir le corrigé</summary>

```bash
df -h
du -sh /var
df -i
```

- `df` donne l'espace par **système de fichiers monté**, `du` la taille cumulée d'un **dossier**.
- `df -i` compte les inodes. Il explique un « No space left on device » alors que `df -h` montre de la place.

</details>

**Exercice 4.** Sur un disque `/dev/sdb` vide, créez une table GPT et une partition de 5 Go avec `fdisk`. Donnez la suite des touches.

<details>
<summary>Voir le corrigé</summary>

```text
sudo fdisk /dev/sdb
g
n
(Entrée)
(Entrée)
+5G
p
w
```

- `g` : table GPT ; `n` : nouvelle partition, numéro et premier secteur par défaut, fin à `+5G`.
- `p` permet de relire avant d'écrire ; `w` enregistre ; `q` aurait tout abandonné.

</details>

**Exercice 5.** Formatez `/dev/sdb1` en ext4 avec l'étiquette `DATA`, puis en XFS. Quelle différence majeure pour la taille ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo mkfs.ext4 -L DATA /dev/sdb1
sudo mkfs.xfs -f -L DATA /dev/sdb1
```

ext4 peut être agrandi et **réduit** ; XFS peut seulement être **agrandi** (`xfs_growfs`). `-f` de `mkfs.xfs` force l'écrasement d'un FS existant.

</details>

**Exercice 6.** Montez `/dev/sdb1` sur `/mnt/data` en lecture seule, sans exécution de binaires ni bits setuid. Puis repassez-le en lecture-écriture sans le démonter.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo mkdir -p /mnt/data
sudo mount -o ro,noexec,nosuid /dev/sdb1 /mnt/data
sudo mount -o remount,rw /mnt/data
findmnt /mnt/data
```

`remount` modifie les options d'un montage existant. Les options non citées (`noexec`, `nosuid`) restent en vigueur ; `findmnt` permet de vérifier.

</details>

**Exercice 7.** Écrivez la ligne `fstab` qui monte l'UUID `a1b2c3d4-0000-4aaa-bbbb-123456789abc` sur `/srv/data` en ext4, avec `noatime`, puis testez-la sans redémarrer.

<details>
<summary>Voir le corrigé</summary>

```text
UUID=a1b2c3d4-0000-4aaa-bbbb-123456789abc  /srv/data  ext4  defaults,noatime  0  2
```

```bash
sudo mount -a
findmnt --verify
df -hT /srv/data
```

Les six champs : périphérique, point de montage, type, options, dump (0), ordre `fsck` (2 pour un FS autre que `/`). `mount -a` révèle une faute de frappe avant un redémarrage raté.

</details>

**Exercice 8.** `umount /mnt/data` répond « target is busy ». Comment trouver le coupable et résoudre le problème ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo fuser -vm /mnt/data
sudo lsof +f -- /mnt/data
cd ~
sudo umount /mnt/data
```

- `fuser -vm` et `lsof` listent les processus qui utilisent le FS ; le plus souvent, c'est son propre shell resté dans le dossier.
- On quitte le dossier (`cd ~`), on arrête le processus proprement, puis on démonte. `umount -l` n'est qu'un dernier recours.

</details>

**Exercice 9.** Sans disque physique, créez une image de 50 Mo, formatez-la en ext4, montez-la sur `/mnt/test`, créez un fichier dedans, puis démontez et vérifiez le FS.

<details>
<summary>Voir le corrigé</summary>

```bash
cd "$(mktemp -d)"
fallocate -l 50M disque.img
mkfs.ext4 -q -L TEST disque.img
sudo mkdir -p /mnt/test
sudo mount -o loop disque.img /mnt/test
echo bonjour | sudo tee /mnt/test/hello.txt
sudo umount /mnt/test
e2fsck -fn disque.img
```

- `-o loop` associe automatiquement un périphérique loop au fichier.
- On vérifie un FS **démonté** ; `-n` évite toute écriture. La dernière ligne ressemble à `TEST: 12/12800 files (0.0% non-contiguous), ... blocks`.

</details>

**Exercice 10.** Un serveur répond « No space left on device » ; `df -h` indique 18 % d'utilisation. Quelle est la démarche de diagnostic ? Et si `df -h` indique 100 % mais que `du` ne retrouve pas l'espace ?

<details>
<summary>Voir le corrigé</summary>

```bash
df -i
sudo lsof +L1
```

- Premier cas : `df -i` affiche `IUse% 100%` : inodes épuisés par des millions de petits fichiers ; on supprime ceux-ci.
- Second cas : un fichier supprimé est encore ouvert par un processus (`lsof +L1`) ; recharger ou redémarrer le service libère l'espace.
- Autre piège : un FS monté **par-dessus** un dossier plein masque ses fichiers à `du`.

</details>

**Exercice 11.** Agrandissez un système de fichiers XFS monté sur `/srv/data` et un ext4 sur `/dev/sdb1` après avoir agrandi leur partition. Pourquoi ne peut-on pas réduire le XFS ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo xfs_growfs /srv/data
sudo resize2fs /dev/sdb1
```

`xfs_growfs` prend le **point de montage**, `resize2fs` le **périphérique**. XFS ne sait pas libérer des groupes d'allocation : pour réduire, il faut sauvegarder, recréer un FS plus petit et restaurer.

</details>

**Exercice 12.** Créez un tmpfs de 128 Mo monté sur `/mnt/ram` et rendez-le permanent. Que devient son contenu au redémarrage ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo mkdir -p /mnt/ram
sudo mount -t tmpfs -o size=128M tmpfs /mnt/ram
echo 'tmpfs  /mnt/ram  tmpfs  size=128M  0  0' | sudo tee -a /etc/fstab
sudo mount -a
```

Le tmpfs vit en mémoire vive : son **contenu est perdu** à l'arrêt ; seule la ligne `fstab` le recrée, vide.

</details>
