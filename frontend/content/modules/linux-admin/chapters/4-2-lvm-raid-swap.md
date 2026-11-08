## 4.2.1 Pourquoi aller au-delà des partitions

Une partition classique est comme **une cloison fixe** : si le dossier `/var` déborde, déplacer la cloison est pénible et risqué. **LVM** remplace les cloisons par des **cloisons coulissantes** (volumes qu'on agrandit à chaud, qu'on répartit sur plusieurs disques). **RAID** répond à une autre question : que se passe-t-il si un disque meurt ? Le **swap** prolonge la mémoire vive sur le disque, et les **quotas** empêchent un utilisateur de remplir seul le disque.

Toutes les manipulations de ce chapitre peuvent être faites **sans risque** sur des périphériques loop (voir 4.1.9) dans une machine virtuelle de TP. Préparation commune :

```bash
cd "$(mktemp -d)"
for i in 1 2 3 4; do fallocate -l 200M d$i.img; sudo losetup -f --show d$i.img; done
```

```text
/dev/loop1
/dev/loop2
/dev/loop3
/dev/loop4
```

Les numéros réels dépendent de votre machine ; dans la suite, on suppose `/dev/loop1` à `/dev/loop4` (adaptez-les). Pour tout défaire à la fin : `sudo losetup -d /dev/loop1 ...` (voir 4.2.9).

## 4.2.2 LVM : les trois étages

| Terme | Sens | Analogie |
|---|---|---|
| **PV** (*Physical Volume*) | Disque ou partition préparé pour LVM | Les briques |
| **VG** (*Volume Group*) | Réserve qui regroupe un ou plusieurs PV | Le tas de briques |
| **LV** (*Logical Volume*) | « Partition » souple taillée dans un VG, que l'on formate | Les pièces construites |
| **PE** / extent | Unité d'allocation du VG (4 Mo par défaut) | La taille d'une brique |

Les LV sont découpés en **extents logiques** (LE) qui correspondent aux **extents physiques** (PE) des PV : un LV de 5 Go fait 1 280 extents de 4 Mo. Le noyau les expose via le *device mapper* : `/dev/mapper/vg_data-lv_web`, aussi accessible par `/dev/vg_data/lv_web` (deux noms, même volume).

### Création complète

```bash
sudo pvcreate /dev/loop1 /dev/loop2
sudo vgcreate vg_data /dev/loop1 /dev/loop2
sudo lvcreate -L 150M -n lv_web vg_data
sudo lvcreate -l 50%FREE -n lv_db vg_data
sudo mkfs.ext4 /dev/vg_data/lv_web
sudo mkdir -p /srv/web
sudo mount /dev/vg_data/lv_web /srv/web
```

| Option de `lvcreate` | Sens |
|---|---|
| `-L 150M` | Taille **absolue** (`M`, `G`, `T`) |
| `-l 100` | Taille en **extents** |
| `-l 100%FREE` | Tout l'espace libre du VG ; `-l 50%VG` : la moitié du VG |
| `-n nom` | Nom du volume |

### Observer : pvs, vgs, lvs

```bash
sudo pvs
sudo vgs
sudo lvs
```

```text
  PV         VG      Fmt  Attr PSize   PFree
  /dev/loop1 vg_data lvm2 a--  196.00m      0
  /dev/loop2 vg_data lvm2 a--  196.00m 120.00m

  VG      #PV #LV #SN Attr   VSize   VFree
  vg_data   2   2   0 wz--n- 392.00m 120.00m

  LV     VG      Attr       LSize   Pool Origin Data%  Meta%
  lv_web vg_data -wi-ao---- 152.00m
  lv_db  vg_data -wi-a----- 120.00m
```

`lvcreate` arrondit au multiple d'extent supérieur (150M devient 152M). Les versions détaillées sont `pvdisplay`, `vgdisplay`, `lvdisplay`. Dans `Attr` de `lvs`, le dernier groupe `ao` signifie **a**ctif et **o**uvert (monté).

### Agrandir un volume à chaud

C'est LE bénéfice de LVM. Agrandir un LV **puis** son système de fichiers :

```bash
sudo lvextend -L +50M /dev/vg_data/lv_web
sudo resize2fs /dev/vg_data/lv_web
```

L'option **`-r`** (`--resizefs`) fait les deux d'un coup, quel que soit le FS (ext4, XFS) :

```bash
sudo lvextend -r -L +50M /dev/vg_data/lv_web
sudo lvextend -r -l +100%FREE /dev/vg_data/lv_web
```

Avec XFS, `-r` appelle `xfs_growfs` ; à la main on écrirait `sudo xfs_growfs /srv/web` (point de montage). Il faut bien sûr de la **place libre dans le VG** (`vgs`, colonne `VFree`), sinon on ajoute un disque (ci-dessous).

### Réduire (ext4 seulement)

```bash
sudo umount /srv/web
sudo e2fsck -f /dev/vg_data/lv_web
sudo resize2fs /dev/vg_data/lv_web 100M
sudo lvreduce -L 100M /dev/vg_data/lv_web
sudo mount /dev/vg_data/lv_web /srv/web
```

:::attention Réduire : le FS d'abord, le volume ensuite
L'**ordre** est crucial : on réduit le système de fichiers **puis** le LV. Faire l'inverse coupe la fin du FS et détruit des données. Le FS doit être démonté, vérifié, et la nouvelle taille doit rester supérieure aux données. **XFS ne se réduit pas** ; `lvreduce -r` automatise l'ordre correct pour ext4 mais demande tout de même une sauvegarde préalable.
:::

### Ajouter, vider et retirer un disque

```bash
sudo pvcreate /dev/loop3
sudo vgextend vg_data /dev/loop3
sudo pvmove /dev/loop1
sudo vgreduce vg_data /dev/loop1
sudo pvremove /dev/loop1
```

`vgextend` ajoute un PV au VG ; `pvmove` **déplace les données** d'un PV vers les autres PV du VG, à chaud (il faut assez de place ailleurs) ; `vgreduce` sort le PV du VG ; `pvremove` efface son marquage LVM. C'est la procédure de remplacement d'un vieux disque sans interruption de service.

### Snapshots

Un **snapshot** fige l'état d'un volume à un instant : on ne copie que les blocs modifiés ensuite, dans un espace réservé (ici 40 Mo : s'il se remplit, le snapshot devient invalide).

```bash
sudo lvcreate -s -n snap_web -L 40M /dev/vg_data/lv_web
sudo mkdir -p /mnt/snap
sudo mount -o ro /dev/vg_data/snap_web /mnt/snap
```

Après une mauvaise manipulation, on peut **revenir en arrière** :

```bash
sudo umount /srv/web /mnt/snap
sudo lvconvert --merge vg_data/snap_web
```

La fusion (`--merge`) remet le volume d'origine dans l'état du snapshot, puis supprime ce dernier ; si l'origine est utilisée, elle a lieu à la prochaine activation. Pour simplement jeter un snapshot : `sudo lvremove vg_data/snap_web`.

:::retenir Chaîne LVM à connaître
`pvcreate` puis `vgcreate` puis `lvcreate` puis `mkfs` puis `mount`. Agrandir : `lvextend -r`. Ajouter un disque : `pvcreate` puis `vgextend`. Retirer : `pvmove`, `vgreduce`, `pvremove`. Voir : `pvs`, `vgs`, `lvs`.
:::

## 4.2.3 RAID logiciel avec mdadm

**RAID** (*Redundant Array of Independent Disks*) associe plusieurs disques pour gagner en **performance** et/ou en **tolérance de panne**. Avec `mdadm`, c'est le noyau qui fait le travail (RAID **logiciel**) : le résultat est un périphérique `/dev/md0`. Avec *N* disques de taille *s* :

| Niveau | Principe | Disques min. | Capacité utile | Pannes tolérées |
|---|---|---|---|---|
| **RAID 0** | Répartition (*striping*) | 2 | N × s | **0** (un disque perdu, tout est perdu) |
| **RAID 1** | Miroir | 2 | s | N - 1 |
| **RAID 5** | Répartition + 1 parité | 3 | (N - 1) × s | 1 |
| **RAID 6** | Répartition + 2 parités | 4 | (N - 2) × s | 2 |
| **RAID 10** | Miroirs répartis (1+0) | 4 | N / 2 × s | 1 par miroir (au moins 1) |

Exemples : 4 disques de 1 To en RAID 5 donnent 3 To ; en RAID 6, 2 To ; en RAID 10, 2 To ; en RAID 0, 4 To mais sans protection.

:::attention RAID n'est pas une sauvegarde
Le RAID protège d'une **panne de disque**, pas d'un `rm -rf`, d'un virus, d'un incendie, d'une erreur de manipulation : l'erreur est **répliquée** instantanément sur tous les disques. Il faut malgré tout des sauvegardes (voir 5.2), idéalement hors site.
:::

### Créer un miroir

```bash
sudo apt install mdadm
sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/loop1 /dev/loop2
cat /proc/mdstat
```

```text
mdadm: Defaulting to version 1.2 metadata
mdadm: array /dev/md0 started.
Personalities : [raid1]
md0 : active raid1 loop2[1] loop1[0]
      204736 blocks super 1.2 [2/2] [UU]
```

Lecture de `/proc/mdstat` : `[2/2]` = 2 disques attendus, 2 actifs ; **`[UU]`** = les deux sont **U**p. `[U_]` signifie qu'un disque manque (RAID dégradé). Pendant la synchronisation, une ligne `resync = 42.0%` apparaît. Ensuite, on utilise `/dev/md0` comme un disque :

```bash
sudo mkfs.ext4 /dev/md0
sudo mkdir -p /srv/raid
sudo mount /dev/md0 /srv/raid
sudo mdadm --detail /dev/md0
```

```text
/dev/md0:
        Raid Level : raid1
        Array Size : 204736 (199.94 MiB 209.65 MB)
      Raid Devices : 2
     Total Devices : 2
             State : clean
    Active Devices : 2
    Failed Devices : 0
```

RAID 5 avec trois disques et un disque de secours (*spare*) : `sudo mdadm --create /dev/md1 --level=5 --raid-devices=3 --spare-devices=1 /dev/loop1 /dev/loop2 /dev/loop3 /dev/loop4`.

### Simuler et réparer une panne

```bash
sudo mdadm /dev/md0 --fail /dev/loop2
sudo mdadm /dev/md0 --remove /dev/loop2
cat /proc/mdstat
sudo mdadm /dev/md0 --add /dev/loop3
```

Après `--fail`, `/proc/mdstat` montre `[2/1] [U_]` : le miroir fonctionne toujours (données lisibles) mais **sans redondance**. On retire le disque défectueux (`--remove`), on ajoute le remplaçant (`--add`) et la **reconstruction** démarre automatiquement. Surveillez-la avec `watch cat /proc/mdstat`.

### Rendre la configuration permanente

```bash
sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
sudo update-initramfs -u
```

Sur RHEL/Fedora, le fichier est `/etc/mdadm.conf` et on régénère avec `dracut --force`. Pour un montage automatique, mettez l'**UUID** du FS de `/dev/md0` dans `fstab` (voir 4.1.7). Démontage et suppression complète :

```bash
sudo umount /srv/raid
sudo mdadm --stop /dev/md0
sudo mdadm --zero-superblock /dev/loop1 /dev/loop3
```

## 4.2.4 Le swap

Le **swap** est l'espace disque que le noyau utilise quand la RAM est saturée : il y déplace les pages mémoire les moins utilisées. Il est beaucoup plus lent que la RAM : c'est un filet de sécurité (et il permet l'hibernation), pas une extension de performance.

```bash
free -h
swapon --show
```

```text
               total        used        free      shared  buff/cache   available
Mem:           3.8Gi       1.1Gi       1.9Gi        24Mi       0.8Gi       2.5Gi
Swap:          2.0Gi          0B       2.0Gi
NAME      TYPE SIZE USED PRIO
/swapfile file   2G   0B   -2
```

### Créer un fichier swap

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
swapon --show
```

```text
Setting up swapspace version 1, size = 1024 MiB (1073737728 bytes)
no label, UUID=3a6d3660-8baf-492b-b120-e786d2341d15
```

`chmod 600` est **obligatoire** : sinon `swapon` avertit (« insecure permissions ») car le swap contient des fragments de la mémoire de tous les processus. Sur Btrfs ou certains FS, `fallocate` ne convient pas : utilisez `sudo dd if=/dev/zero of=/swapfile bs=1M count=1024`.

Pour la rendre **permanente**, ajoutez à `/etc/fstab` :

```text
/swapfile  none  swap  sw  0  0
```

Une **partition** swap se crée avec `mkswap /dev/sdb2` (type `82` en MBR), s'active avec `swapon /dev/sdb2` et s'écrit dans `fstab` avec son UUID. Désactiver : `sudo swapoff /swapfile` (puis `rm`, et retrait de la ligne de `fstab`) ; `swapoff -a` désactive tout, `swapon -a` active tout ce qui est dans `fstab`.

### vm.swappiness

Ce paramètre (0 à 100, 60 par défaut) règle la **propension** à utiliser le swap plutôt qu'à libérer le cache disque. Plus il est faible, plus le noyau garde les applications en RAM.

```bash
cat /proc/sys/vm/swappiness
sudo sysctl vm.swappiness=10
echo "vm.swappiness = 10" | sudo tee /etc/sysctl.d/99-swappiness.conf
```

La première commande de réglage est immédiate mais temporaire ; le fichier de `/etc/sysctl.d/` rend le réglage permanent (voir 4.3.8). Un serveur de base de données utilise souvent 10.

## 4.2.5 Les quotas

Les **quotas** limitent l'espace disque (**blocs**) et le nombre de fichiers (**inodes**) par **utilisateur** ou par **groupe** sur un système de fichiers donné. Chaque limite a deux niveaux : la limite **souple** (*soft*) peut être dépassée pendant un **délai de grâce** (7 jours par défaut) ; la limite **dure** (*hard*) ne l'est jamais.

```bash
sudo apt install quota
```

Mise en place sur un FS dédié (ici le LV de 4.2.2, monté sur `/srv/web`) :

```bash
sudo mount -o remount,usrquota,grpquota /srv/web
sudo quotacheck -cugm /srv/web
sudo quotaon -v /srv/web
```

Pour la rendre permanente, mettez `defaults,usrquota,grpquota` dans le 4e champ de `fstab`. `quotacheck -cug` crée les fichiers de comptabilité (`c` : créer, `u` utilisateurs, `g` groupes ; `m` évite de remonter le FS en lecture seule). Sur des noyaux Ubuntu allégés (images cloud), le module peut manquer : `sudo apt install linux-modules-extra-$(uname -r)`.

| Commande | Rôle |
|---|---|
| `sudo edquota -u alice` | Éditeur interactif des limites de `alice` (`-g` pour un groupe) |
| `sudo setquota -u alice 50000 60000 0 0 /srv/web` | Limites sans éditeur : blocs souple, blocs dur, inodes souple, inodes dur |
| `sudo edquota -t` | Règle le délai de grâce |
| `quota -u alice` | Consommation et limites de `alice` |
| `sudo repquota -a` | Rapport de tous les FS avec quotas |
| `sudo quotaoff -v /srv/web` | Désactive les quotas |

Les blocs de `setquota` valent **1 Ko** : `50000 60000` signifie environ 49 Mo souples et 59 Mo durs. Un `0` signifie « pas de limite ».

```bash
sudo repquota -s /srv/web
```

```text
*** Report for user quotas on device /dev/mapper/vg_data-lv_web
Block grace time: 7days; Inode grace time: 7days
                        Block limits                File limits
User            used    soft    hard  grace    used  soft  hard  grace
----------------------------------------------------------------------
root      --      20K      0K      0K              2     0     0
alice     --    4096K  48828K  58594K              3     0     0
```

Un `+` à la place du `-` dans la colonne de statut indique que la limite souple est **dépassée** ; l'écriture d'un fichier au-delà de la limite dure échoue avec `Disk quota exceeded`.

## 4.2.6 Chiffrement : aperçu de LUKS

**LUKS** (via `cryptsetup`) chiffre une partition ou un volume : sans la phrase secrète, le disque est illisible (disque volé, machine mise au rebut). Le périphérique déchiffré apparaît dans `/dev/mapper`.

```bash
sudo apt install cryptsetup
sudo cryptsetup luksFormat /dev/loop4
sudo cryptsetup open /dev/loop4 secret
sudo mkfs.ext4 /dev/mapper/secret
sudo mount /dev/mapper/secret /mnt/secret
sudo umount /mnt/secret
sudo cryptsetup close secret
```

`luksFormat` **détruit** les données et demande de confirmer en tapant `YES` en majuscules. `open` demande la phrase secrète ; `close` referme le volume. Un montage automatique passe par `/etc/crypttab`. **Perdre la phrase secrète, c'est perdre les données** : il n'existe aucune porte dérobée (sauvegardez l'en-tête avec `cryptsetup luksHeaderBackup`).

## 4.2.7 Mesurer les performances disque

| Outil | Usage |
|---|---|
| `dd` | Test rudimentaire de débit séquentiel |
| `fio` | Banc d'essai précis (aléatoire, séquentiel, IOPS) |
| `iostat -x 2` | Activité par disque : `%util`, `await` (paquet `sysstat`) |
| `iotop -o` | Processus qui lisent/écrivent en ce moment |

```bash
dd if=/dev/zero of=/srv/web/test.bin bs=1M count=100 oflag=direct status=progress
rm /srv/web/test.bin
```

```text
104857600 bytes (105 MB, 100 MiB) copied, 0.28 s, 374 MB/s
```

`oflag=direct` contourne le cache pour mesurer le disque et non la RAM. Avec `fio` : `fio --name=lecture --filename=/srv/web/fio.bin --size=64M --rw=randread --bs=4k --runtime=10 --time_based`. Si `iostat -x` montre un `%util` proche de 100 % avec un `await` élevé, le disque est le **goulot d'étranglement** ; `iotop -o` désigne alors le processus responsable.

## 4.2.8 TP complet sur loop devices

Scénario : trois loops forment un VG, un LV agrandi à chaud, et deux autres loops forment un miroir.

```bash
sudo pvcreate /dev/loop1 /dev/loop2
sudo vgcreate vg_tp /dev/loop1 /dev/loop2
sudo lvcreate -L 100M -n lv_tp vg_tp
sudo mkfs.ext4 -q /dev/vg_tp/lv_tp
sudo mount /dev/vg_tp/lv_tp /mnt
df -h /mnt
sudo lvextend -r -L +150M /dev/vg_tp/lv_tp
df -h /mnt
```

Le `df -h` montre la taille passer d'environ 85 Mo à environ 230 Mo **sans démontage**.

:::examen Ce qui tombe à l'examen
- Définir PV, VG, LV et donner l'ordre des commandes de création ; agrandir un LV (`lvextend -r`).
- Calculer la capacité d'un RAID 0, 1, 5, 6 ou 10 et le nombre de pannes tolérées ; lire `[UU]` ou `[U_]` dans `/proc/mdstat`.
- Remplacer un disque en panne : `--fail`, `--remove`, `--add`.
- Créer et activer un fichier swap (**chmod 600** !) et la ligne `fstab` correspondante.
- Expliquer pourquoi le RAID n'est pas une sauvegarde.
:::

## 4.2.9 Nettoyage

Dans l'ordre inverse de la construction :

```bash
sudo umount /mnt
sudo lvremove -y vg_tp/lv_tp
sudo vgremove vg_tp
sudo pvremove /dev/loop1 /dev/loop2
sudo losetup -d /dev/loop1 /dev/loop2 /dev/loop3 /dev/loop4
```

## 4.2.10 Exercices corrigés

**Exercice 1.** Expliquez PV, VG et LV en une phrase chacun.

<details>
<summary>Voir le corrigé</summary>

- **PV** : disque ou partition initialisé par `pvcreate` pour LVM.
- **VG** : réserve d'espace formée par un ou plusieurs PV (`vgcreate`).
- **LV** : volume taillé dans le VG (`lvcreate`), que l'on formate et monte comme une partition.

</details>

**Exercice 2.** Avec deux disques `/dev/sdb` et `/dev/sdc`, créez un VG `vg_data`, un LV `lv_web` de 5 Go formaté en ext4 et monté sur `/srv/web`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo pvcreate /dev/sdb /dev/sdc
sudo vgcreate vg_data /dev/sdb /dev/sdc
sudo lvcreate -L 5G -n lv_web vg_data
sudo mkfs.ext4 /dev/vg_data/lv_web
sudo mkdir -p /srv/web
sudo mount /dev/vg_data/lv_web /srv/web
```

On ajoute ensuite la ligne `/dev/vg_data/lv_web  /srv/web  ext4  defaults  0  2` à `/etc/fstab` (ou l'UUID relevé par `blkid`).

</details>

**Exercice 3.** Le LV `lv_web` est plein. Ajoutez 2 Go sans démontage, d'abord quand le VG a de la place, puis en utilisant tout l'espace libre.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo vgs
sudo lvextend -r -L +2G /dev/vg_data/lv_web
sudo lvextend -r -l +100%FREE /dev/vg_data/lv_web
```

`-r` agrandit aussi le système de fichiers. Sans `-r` : `resize2fs /dev/vg_data/lv_web` (ext4) ou `xfs_growfs /srv/web` (XFS).

</details>

**Exercice 4.** Le VG n'a plus de place. Ajoutez le disque `/dev/sdd` puis agrandissez `lv_web` de 10 Go.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo pvcreate /dev/sdd
sudo vgextend vg_data /dev/sdd
sudo lvextend -r -L +10G /dev/vg_data/lv_web
```

`vgextend` ajoute le PV au VG, ce qui augmente `VFree` ; `lvextend` peut alors s'étendre.

</details>

**Exercice 5.** Réduisez un LV ext4 de 5 Go à 3 Go. Quel est l'ordre obligatoire et pourquoi ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo umount /srv/web
sudo e2fsck -f /dev/vg_data/lv_web
sudo resize2fs /dev/vg_data/lv_web 3G
sudo lvreduce -L 3G /dev/vg_data/lv_web
sudo mount /dev/vg_data/lv_web /srv/web
```

- On réduit le **FS puis le LV** : inverser l'ordre tronquerait le FS et perdrait des données.
- `e2fsck -f` est exigé avant `resize2fs`. Impossible avec XFS.
- Prévoir une sauvegarde ; la taille finale doit rester supérieure aux données.

</details>

**Exercice 6.** Le disque `/dev/sdb` du VG est vieillissant. Comment le remplacer par `/dev/sde` sans interruption ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo pvcreate /dev/sde
sudo vgextend vg_data /dev/sde
sudo pvmove /dev/sdb
sudo vgreduce vg_data /dev/sdb
sudo pvremove /dev/sdb
```

`pvmove` copie les extents de `sdb` vers les autres PV (dont `sde`) pendant que le système tourne ; le VG doit avoir assez d'espace libre ailleurs.

</details>

**Exercice 7.** Faites un snapshot de `lv_web` avant une mise à jour risquée, puis revenez en arrière après un échec.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo lvcreate -s -n avant_maj -L 1G /dev/vg_data/lv_web
sudo umount /srv/web
sudo lvconvert --merge vg_data/avant_maj
sudo mount /dev/vg_data/lv_web /srv/web
```

Le snapshot ne stocke que les écarts : sa taille (1 Go) borne le volume de modifications ; s'il est plein il devient inutilisable. `--merge` restaure l'origine puis supprime le snapshot. Si la mise à jour réussit : `lvremove vg_data/avant_maj`.

</details>

**Exercice 8.** Quatre disques de 2 To : quelle capacité utile et combien de pannes tolérées en RAID 0, 1, 5, 6 et 10 ?

<details>
<summary>Voir le corrigé</summary>

```text
RAID 0  : 8 To, 0 panne
RAID 1  : 2 To (copie sur 4 disques), 3 pannes
RAID 5  : 6 To, 1 panne
RAID 6  : 4 To, 2 pannes
RAID 10 : 4 To, 1 panne garantie (2 si elles touchent des miroirs différents)
```

Formules : N x s ; s ; (N - 1) x s ; (N - 2) x s ; N / 2 x s.

</details>

**Exercice 9.** Créez un RAID 5 de trois disques `/dev/sdb`, `/dev/sdc`, `/dev/sdd`, formatez-le, montez-le et rendez la configuration permanente.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo mdadm --create /dev/md0 --level=5 --raid-devices=3 /dev/sdb /dev/sdc /dev/sdd
cat /proc/mdstat
sudo mkfs.ext4 /dev/md0
sudo mkdir -p /srv/raid
sudo mount /dev/md0 /srv/raid
sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
sudo update-initramfs -u
```

Puis une ligne `fstab` avec l'UUID de `/dev/md0` (`blkid /dev/md0`). Le tableau reste utilisable pendant la synchronisation initiale.

</details>

**Exercice 10.** `/proc/mdstat` affiche `[3/2] [UU_]` pour `md0`. Que s'est-il passé et que faites-vous ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo mdadm --detail /dev/md0
sudo mdadm /dev/md0 --remove /dev/sdd
sudo mdadm /dev/md0 --add /dev/sde
watch cat /proc/mdstat
```

- Le tableau est **dégradé** : un des trois disques est tombé (ici `sdd`, repérable avec `--detail`). Les données sont encore lisibles mais plus protégées.
- On retire l'élément défaillant (`--fail` d'abord s'il n'est pas déjà marqué), on ajoute un disque neuf ; la reconstruction démarre seule.

</details>

**Exercice 11.** Créez un swap de 2 Go dans `/swapfile`, activez-le, rendez-le permanent et réglez `vm.swappiness` à 10 de façon durable.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile  none  swap  sw  0  0' | sudo tee -a /etc/fstab
echo 'vm.swappiness = 10' | sudo tee /etc/sysctl.d/99-swappiness.conf
sudo sysctl --system
swapon --show
```

`chmod 600` protège le contenu mémoire écrit sur disque. Le fichier de `sysctl.d` rend le réglage durable.

</details>

**Exercice 12.** Limitez `alice` à 100 Mo (souple) et 120 Mo (dur) sur `/home` monté en ext4. Quelles étapes et quelles vérifications ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo apt install quota
sudo sed -i 's/\(\/home *ext4 *defaults\)/\1,usrquota/' /etc/fstab
sudo mount -o remount /home
sudo quotacheck -cum /home
sudo quotaon -v /home
sudo setquota -u alice 102400 122880 0 0 /home
quota -u alice
sudo repquota -s /home
```

- 100 Mo = 102 400 blocs de 1 Ko ; 120 Mo = 122 880.
- Il faut l'option `usrquota` dans `fstab` (le `sed` l'ajoute à la ligne de `/home`), puis `quotacheck` et `quotaon`.
- Vérifier `fstab` avant (`grep home /etc/fstab`) : l'expression `sed` suppose la forme `/home ext4 defaults`.

</details>
