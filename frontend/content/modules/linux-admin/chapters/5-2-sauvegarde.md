## 5.2.1 Pourquoi sauvegarder, et comment y penser

Un disque meurt, un étudiant tape `rm -rf` au mauvais endroit, un rançongiciel chiffre tout, un incendie touche la salle serveur. La sauvegarde est l'**assurance** de l'administrateur : on espère ne jamais s'en servir, et le jour où l'on en a besoin, elle doit fonctionner. Une sauvegarde qu'on n'a jamais restaurée est une **hypothèse**, pas une sauvegarde.

### La règle 3-2-1

| Chiffre | Signification | Exemple |
|---|---|---|
| **3** | Trois copies des données (l'originale + 2 sauvegardes) | Serveur, disque USB, copie distante |
| **2** | Sur deux supports différents | Disque interne + disque externe ou bande |
| **1** | Dont une copie hors site | Autre bâtiment, serveur distant, stockage en ligne |

### Complète, incrémentale, différentielle

| Type | Copie | Restauration | Place |
|---|---|---|---|
| **Complète** (full) | Tout, à chaque fois | Simple : une seule archive | Maximale |
| **Incrémentale** | Ce qui a changé depuis la **dernière sauvegarde** (quelle qu'elle soit) | Longue : complète + toutes les incrémentales dans l'ordre | Minimale |
| **Différentielle** | Ce qui a changé depuis la **dernière complète** | Moyenne : complète + la dernière différentielle | Intermédiaire (grossit chaque jour) |

Schéma classique : une complète le dimanche, une incrémentale ou différentielle les autres jours.

### RPO et RTO

- **RPO** (Recovery Point Objective) : combien de données on accepte de **perdre**, exprimé en temps. Sauvegarde chaque nuit : RPO = 24 h.
- **RTO** (Recovery Time Objective) : combien de temps on accepte d'être **indisponible** avant la remise en service.

Ces deux chiffres se décident avec l'entreprise, puis dictent la technique : un RPO de 5 minutes interdit une sauvegarde nocturne.

:::retenir Les trois questions avant de sauvegarder
**Quoi** (données, configuration, bases), **quand et combien de temps** (RPO, rétention), **où** (3-2-1), et surtout **comment je restaure** (RTO). Les sauvegardes les plus utiles contiennent `/etc`, `/home`, `/var/www`, les dumps de bases et la liste des paquets installés. Le système lui-même se réinstalle.
:::

## 5.2.2 tar : l'archiveur de référence

`tar` (tape archive) regroupe des fichiers en **une seule archive**, avec droits, propriétaires et dates. La compression est une option.

| Option | Rôle |
|---|---|
| `-c` | Create : créer une archive |
| `-x` | eXtract : extraire |
| `-t` | lisT : lister le contenu sans extraire |
| `-f archive` | Nom du fichier archive (**toujours juste avant le nom**) |
| `-v` | Verbose : affiche les fichiers traités |
| `-z` / `-j` / `-J` | Compression gzip (`.tar.gz`) / bzip2 (`.tar.bz2`) / xz (`.tar.xz`) |
| `-C répertoire` | Se placer dans ce répertoire avant d'agir |
| `--exclude=motif` | Ignorer les fichiers correspondant au motif |
| `--acl --xattrs` | Conserver les ACL et attributs étendus |

| Compression | Vitesse | Taux | Extension |
|---|---|---|---|
| gzip (`-z`) | rapide | moyen | `.tar.gz`, `.tgz` |
| bzip2 (`-j`) | lente | bon | `.tar.bz2` |
| xz (`-J`) | la plus lente | le meilleur | `.tar.xz` |

### Créer, lister, extraire

```bash
mkdir -p ~/projet/docs ~/projet/tmp
echo a > ~/projet/docs/a.txt ; echo b > ~/projet/docs/b.txt ; echo t > ~/projet/tmp/x.tmp
tar -czvf projet.tar.gz --exclude='*.tmp' -C ~/projet .
```

```text
./
./tmp/
./docs/
./docs/b.txt
./docs/a.txt
```

Le fichier `x.tmp` a été exclu. L'option `-C ~/projet` fait que les chemins dans l'archive sont **relatifs** (`./docs/a.txt`), ce qui permet de restaurer n'importe où.

```bash
tar -tzf projet.tar.gz
```

```text
./
./tmp/
./docs/
./docs/b.txt
./docs/a.txt
```

Extraire tout dans un répertoire, ou **un seul fichier** :

```bash
mkdir restauration
tar -xzf projet.tar.gz -C restauration
tar -xzf projet.tar.gz -C restauration ./docs/a.txt
```

Pour extraire un seul fichier, donnez son nom **tel qu'affiché par `-t`** (ici avec `./`). Sur un GNU tar récent, la compression est détectée automatiquement à l'extraction : `tar -xf archive.tar.xz` suffit.

Pour une sauvegarde système fidèle (droits fins), ajoutez les ACL et attributs étendus, en `root` :

```bash
sudo tar --acl --xattrs -czpf /var/backups/etc.tar.gz -C / etc
```

`-p` conserve les permissions à l'extraction (par défaut pour `root`). Notez `-C /` puis `etc` : l'archive contient `etc/...` sans le `/` initial, et tar affiche sinon `Removing leading '/' from member names`.

:::attention L'ordre des options de tar
`tar -cf` suivi du nom : `tar -cvzf archive.tgz dossier` est correct. `tar -cfz archive.tgz` est une erreur classique : `f` prend `z` comme nom d'archive. Autre piège : **l'archive ne doit pas se trouver dans le dossier qu'elle sauvegarde**. Et `tar -cf archive.tar *` oublie les fichiers cachés ; préférez `-C dossier .`.
:::

### zip et unzip

Utile pour échanger avec Windows (format universel, compression fichier par fichier).

```bash
zip -r docs.zip docs/
unzip -l docs.zip
unzip docs.zip -d /tmp/restauration
```

```text
Archive:  docs.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
        0  2026-11-07 06:04   docs/
        6  2026-11-07 06:04   docs/a.txt
---------                     -------
        6                     2 files
```

`zip` ne conserve pas bien les propriétaires ni les ACL : pour une sauvegarde Linux, préférez `tar`. Chiffrement basique : `zip -e` (faible) ; voir `gpg` plus bas.

## 5.2.3 rsync : synchroniser intelligemment

`rsync` copie **seulement ce qui a changé** (comparaison de taille et de date, puis transfert par blocs). C'est l'outil de l'incrémental, en local ou par SSH. Installation : `sudo apt install rsync` (déjà présent sur beaucoup de systèmes).

| Option | Rôle |
|---|---|
| `-a` | Archive : récursif + droits, dates, liens, propriétaire (équivaut à `-rlptgoD`) |
| `-v` | Détaille les fichiers transférés |
| `-z` | Compresse pendant le transfert (utile sur le réseau, inutile en local) |
| `-h` | Tailles lisibles (`1.5K`, `2.3M`) |
| `--progress` | Progression par fichier |
| `--delete` | **Supprime à la destination** ce qui n'existe plus à la source |
| `-n` (`--dry-run`) | **Simulation** : montre sans rien faire |
| `--exclude='motif'` | Ignorer des fichiers |
| `-e ssh` | Transport par SSH (distant) |
| `--link-dest=dir` | Fichiers inchangés = liens physiques vers la sauvegarde précédente |

### Le piège du slash final

```bash
rsync -a src/  dst/    # copie le CONTENU de src dans dst  : dst/docs/a.txt
rsync -a src   dst/    # copie le DOSSIER src dans dst      : dst/src/docs/a.txt
```

Un `/` après la source change tout. Ayez le réflexe : **simulez d'abord avec `-n`**.

```bash
rsync -avn --delete src/ dst/
```

```text
sending incremental file list
./
docs/
docs/a.txt
docs/b.txt

sent 112 bytes  received 28 bytes  280.00 bytes/sec
total size is 2  speedup is 0.01 (DRY RUN)
```

Après la vraie copie, on supprime `b.txt` à la source, on ajoute `c.txt`, puis :

```bash
rsync -avh --delete src/ dst/
```

```text
sending incremental file list
deleting docs/b.txt
docs/c.txt

sent 150 bytes  received 39 bytes  378.00 bytes/sec
total size is 2  speedup is 0.01
```

(Sorties données à titre indicatif : les nombres d'octets varient.)

### Vers un serveur distant

```bash
rsync -avz --exclude='*.tmp' -e ssh /srv/data/ sauve@192.0.2.50:/srv/sauvegardes/data/
```

Authentification par clé SSH (voir 4.4) pour que cron puisse l'exécuter sans mot de passe.

### Sauvegardes « instantanés » avec --link-dest

Chaque jour crée un dossier qui **paraît complet**, mais les fichiers inchangés sont des liens physiques vers la veille : ils ne consomment aucune place supplémentaire.

```bash
rsync -a --delete --link-dest=/sauve/2026-11-06 /srv/data/ /sauve/2026-11-07/
```

Chaque dossier daté se restaure par simple copie, et supprimer un ancien jour ne casse pas les autres (le contenu reste tant qu'un lien existe).

:::attention --delete peut vider votre sauvegarde
Si la source est **vide ou démontée** (disque NFS tombé, mauvais chemin, faute de frappe), `rsync --delete` efface logiquement toute la destination pour qu'elle lui ressemble. Toujours : `-n` d'abord, vérifier que la source existe (`[ -d /srv/data ] || exit 1`), et garder des instantanés (`--link-dest`) plutôt qu'un seul miroir.
:::

## 5.2.4 scp et dd

`scp` copie un fichier par SSH :

```bash
scp projet.tar.gz sauve@192.0.2.50:/srv/sauvegardes/
scp -r docs/ sauve@192.0.2.50:/srv/sauvegardes/docs
scp sauve@192.0.2.50:/srv/sauvegardes/projet.tar.gz /tmp/
scp -P 2222 fichier sauve@192.0.2.50:/tmp/
```

Le port se précise par **`-P` majuscule** (en minuscule pour `ssh -p`). Pour des copies répétées, `rsync` est meilleur : il reprend et n'envoie que les différences.

`dd` copie **bloc par bloc**, sans comprendre les fichiers : image d'un disque, d'une partition, d'une clé USB bootable.

| Paramètre | Rôle |
|---|---|
| `if=` | Input file : source |
| `of=` | Output file : destination |
| `bs=` | Taille de bloc (`bs=4M` accélère) |
| `count=` | Nombre de blocs à copier |
| `status=progress` | Affiche la progression |

```bash
dd if=/dev/zero of=test.img bs=1M count=2 status=progress
```

```text
2+0 records in
2+0 records out
2097152 bytes (2.1 MB, 2.0 MiB) copied, 0.000960 s, 2.2 GB/s
```

Exemples réels (à **ne pas** lancer sans avoir vérifié `lsblk`) :

```bash
sudo dd if=/dev/sdb of=/home/alice/cle.img bs=4M status=progress
sudo dd if=ubuntu.iso of=/dev/sdc bs=4M status=progress conv=fsync
```

:::attention dd, le « disk destroyer »
`of=` écrase **sans demander**. Intervertir `if` et `of`, ou viser `/dev/sda` (votre disque système) au lieu de `/dev/sdc` (la clé), détruit tout, définitivement. Avant chaque `dd` : `lsblk` pour identifier le périphérique, relire la ligne, vérifier la taille. Aucun pardon possible.
:::

## 5.2.5 Vérifier l'intégrité : sha256sum et md5sum

Une copie corrompue (réseau, disque) ressemble à une bonne copie, jusqu'à la restauration. Une **somme de contrôle** est une empreinte du contenu : un seul bit modifié donne une empreinte totalement différente.

```bash
sha256sum projet.tar.gz > projet.tar.gz.sha256
cat projet.tar.gz.sha256
```

```text
3f2b6c0e9d1a...(64 caractères hexadécimaux)  projet.tar.gz
```

```bash
sha256sum -c projet.tar.gz.sha256
```

```text
projet.tar.gz: OK
```

Si le fichier a été altéré, on lit `projet.tar.gz: FAILED` et `sha256sum: WARNING: 1 computed checksum did NOT match`. `md5sum` fonctionne pareil (32 caractères) : rapide, suffisant contre une corruption accidentelle, mais **cassé** contre une attaque volontaire. Préférez SHA-256. Même usage pour vérifier une image ISO téléchargée.

## 5.2.6 Un script de sauvegarde complet

Cahier des charges : sauvegarde quotidienne en `tar.gz`, **7 quotidiennes** conservées, **4 hebdomadaires** (copie du dimanche), un **journal**, une **vérification** après chaque archive. Ce script a été testé dans un répertoire temporaire (variables `SRC`, `DEST`, `LOG` modifiables de l'extérieur).

```bash
#!/bin/bash
# /usr/local/bin/sauvegarde.sh
set -u
SRC="${SRC:-/home /etc}"
DEST="${DEST:-/var/backups/auto}"
LOG="${LOG:-/var/log/sauvegarde.log}"
HOTE=$(hostname -s)
DATE=$(date +%F)
JOUR=$(date +%u)                      # 1 = lundi ... 7 = dimanche

log() { echo "$(date '+%F %T') $*" >> "$LOG"; }

mkdir -p "$DEST/quotidien" "$DEST/hebdo" || exit 1
FICHIER="$DEST/quotidien/$HOTE-$DATE.tar.gz"

log "DEBUT sauvegarde de $SRC"
tar -czf "$FICHIER" --exclude='*/.cache' $SRC 2>>"$LOG"
RC=$?
if [ "$RC" -ne 0 ]; then
    log "ERREUR tar (code $RC)"; exit 1
fi
(cd "$DEST/quotidien" && sha256sum "$(basename "$FICHIER")" > "$FICHIER.sha256")

# Vérification : archive lisible et somme de contrôle correcte
if tar -tzf "$FICHIER" > /dev/null && \
   (cd "$DEST/quotidien" && sha256sum -c --quiet "$(basename "$FICHIER").sha256"); then
    log "OK verification $FICHIER ($(du -h "$FICHIER" | cut -f1))"
else
    log "ERREUR verification $FICHIER"; exit 1
fi

# Copie hebdomadaire le dimanche
if [ "$JOUR" -eq 7 ]; then
    cp "$FICHIER" "$FICHIER.sha256" "$DEST/hebdo/"
    log "COPIE hebdomadaire effectuee"
fi

# Rotation : 7 jours en quotidien, 4 semaines en hebdomadaire
find "$DEST/quotidien" -type f -name "$HOTE-*" -mtime +6  -delete
find "$DEST/hebdo"     -type f -name "$HOTE-*" -mtime +27 -delete
log "FIN sauvegarde"
```

```bash
sudo install -m 750 sauvegarde.sh /usr/local/bin/sauvegarde.sh
sudo /usr/local/bin/sauvegarde.sh
tail -n 3 /var/log/sauvegarde.log
```

```text
2026-11-07 02:30:01 DEBUT sauvegarde de /home /etc
2026-11-07 02:30:19 OK verification /var/backups/auto/quotidien/srv1-2026-11-07.tar.gz (212M)
2026-11-07 02:30:19 FIN sauvegarde
```

Planification avec cron (voir 3.3), en `root`, avec protection contre le chevauchement :

```text
30 2 * * * /usr/bin/flock -n /var/lock/sauvegarde.lock /usr/local/bin/sauvegarde.sh
```

Points à retenir : `$?` est copié dans `RC` **immédiatement** (il est écrasé par la commande suivante) ; `find -mtime +6` supprime ce qui a plus de 6 jours pleins (donc 7 fichiers conservés) ; le script s'arrête avant la rotation si la vérification échoue, pour ne jamais supprimer une bonne sauvegarde au profit d'une mauvaise.

:::examen Script de sauvegarde
On vous demande presque toujours : `tar -czf` avec la date (`$(date +%F)`), un test (`if [ $? -eq 0 ]`), un message dans un journal (`>> fichier`), la suppression des anciennes (`find ... -mtime +7 -delete`) et la ligne cron. Écrivez-les dans cet ordre.
:::

## 5.2.7 Chiffrer et aller plus loin

### Chiffrer une archive avec gpg

```bash
gpg -c projet.tar.gz            # demande une phrase de passe, crée projet.tar.gz.gpg
gpg -d projet.tar.gz.gpg > projet.tar.gz   # déchiffre
```

`-c` : chiffrement **symétrique** (une phrase de passe). Sans la phrase de passe, la sauvegarde est perdue : rangez-la dans un gestionnaire de mots de passe, pas dans le même dossier.

### restic et borg

Outils modernes de sauvegarde : **dépôt chiffré**, **dédupliqué** (un bloc identique n'est stocké qu'une fois), instantanés datés, restauration d'un seul fichier.

```bash
restic init --repo /mnt/sauve/depot
restic -r /mnt/sauve/depot backup /home
restic -r /mnt/sauve/depot snapshots
restic -r /mnt/sauve/depot restore latest --target /tmp/restore --include /home/alice/rapport.odt
```

`borg` suit la même idée (`borg init`, `borg create`, `borg list`, `borg extract`). Installation par `apt install restic` ou `apt install borgbackup`.

### Snapshots LVM et bases de données

Sauvegarder des fichiers en cours d'écriture donne une copie incohérente. Un **snapshot LVM** (voir 4.2) fige l'état du volume pendant la copie :

```bash
sudo lvcreate -L 1G -s -n snap_data /dev/vg0/data
sudo mount -o ro /dev/vg0/snap_data /mnt/snap
# ... tar ou rsync depuis /mnt/snap ...
sudo umount /mnt/snap && sudo lvremove -y /dev/vg0/snap_data
```

Pour MySQL/MariaDB, on ne copie pas les fichiers de la base : on en fait un **dump** logique.

```bash
mysqldump --single-transaction -u backup -p mabase > /var/backups/mabase-$(date +%F).sql
mysql -u backup -p mabase < /var/backups/mabase-2026-11-07.sql     # restauration
```

PostgreSQL : `pg_dump mabase > mabase.sql`.

## 5.2.8 Tester les restaurations et ne pas confondre

Une sauvegarde est réussie quand la **restauration** l'est. Planifiez un test régulier : restaurer dans un répertoire temporaire, comparer, chronométrer (c'est votre RTO réel).

```bash
mkdir /tmp/test-restore
tar -xzf /var/backups/auto/quotidien/srv1-2026-11-07.tar.gz -C /tmp/test-restore
diff -r /etc /tmp/test-restore/etc && echo "identique"
```

:::attention RAID n'est pas une sauvegarde
Le RAID 1 ou 5 (voir 4.2) protège contre la **panne d'un disque**, pas contre une suppression, un virus ou une corruption : l'erreur est copiée instantanément sur tous les disques. Il en va de même pour un simple dossier « copie » sur le même disque. La sauvegarde doit être **séparée** de la source, dans le temps (versions) et dans l'espace (autre machine).
:::

### Runbook de reprise

Un **runbook** est la procédure écrite pour reprendre après sinistre, utilisable à 3 h du matin par quelqu'un de fatigué. Modèle :

1. Symptôme et décision : qui déclare le sinistre, qui prévenir.
2. Matériel ou VM de remplacement, version du système à installer.
3. Où sont les sauvegardes, comment y accéder, où est la phrase de passe.
4. Commandes exactes de restauration (copier-coller), dans l'ordre : paquets, `/etc`, données, bases.
5. Vérifications : services démarrés, accès utilisateurs, dernier enregistrement de la base.
6. Retour d'expérience : ce qui a manqué, mise à jour du runbook.

### Aperçu : Ansible

Quand on gère plusieurs serveurs, on décrit la configuration dans des fichiers **playbooks** (YAML) exécutés par SSH, sans agent : le serveur de remplacement se reconfigure en une commande (`ansible-playbook site.yml`). La configuration est ainsi **versionnée** et reproductible ; seules les données restent à restaurer.

## 5.2.9 Exercices corrigés

**Exercice 1.** Expliquez la règle 3-2-1 et donnez un exemple concret pour un cybercafé.

<details>
<summary>Voir le corrigé</summary>

```text
3 copies : le serveur + 2 sauvegardes
2 supports : disque interne + disque USB
1 hors site : copie chez le gérant ou sur un serveur distant
```

Exemple : données sur le PC serveur, copie quotidienne sur un disque USB, copie hebdomadaire chiffrée envoyée à un serveur distant. Un incendie ou un vol du local ne détruit pas tout.

</details>

**Exercice 2.** Quelle différence entre sauvegarde incrémentale et différentielle ? Laquelle se restaure le plus vite ?

<details>
<summary>Voir le corrigé</summary>

```text
Incrémentale  : changements depuis la dernière sauvegarde (de n'importe quel type)
Différentielle: changements depuis la dernière sauvegarde complète
```

La différentielle se restaure plus vite (complète + **une** différentielle) mais occupe plus de place. L'incrémentale est compacte mais exige la complète puis toutes les incrémentales dans l'ordre.

</details>

**Exercice 3.** Une entreprise sauvegarde chaque nuit à 2 h et met 3 h à restaurer. Donnez son RPO et son RTO.

<details>
<summary>Voir le corrigé</summary>

```text
RPO = 24 h (au pire, on perd une journée de données)
RTO = 3 h  (durée d'indisponibilité à la restauration)
```

Le RPO se lit dans la fréquence des sauvegardes, le RTO dans la durée de la reprise. Pour réduire le RPO il faut sauvegarder plus souvent.

</details>

**Exercice 4.** Créez une archive gzip `/tmp/web.tar.gz` du dossier `/var/www` en excluant les fichiers `*.log`, puis listez son contenu sans l'extraire.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo tar -czf /tmp/web.tar.gz --exclude='*.log' -C /var www
tar -tzf /tmp/web.tar.gz | head
```

`-c` crée, `-z` compresse en gzip, `-f` désigne l'archive, `-C /var www` archive `www` avec un chemin relatif. `-t` liste sans rien écrire.

</details>

**Exercice 5.** Extrayez uniquement `etc/hostname` de l'archive `/var/backups/etc.tar.gz` (créée avec `-C / etc`) dans `/tmp/restore`.

<details>
<summary>Voir le corrigé</summary>

```bash
mkdir -p /tmp/restore
tar -tzf /var/backups/etc.tar.gz | grep hostname
tar -xzf /var/backups/etc.tar.gz -C /tmp/restore etc/hostname
```

Le nom du membre doit être **identique à celui affiché par `-t`**. Le fichier arrive dans `/tmp/restore/etc/hostname`, sans toucher au vrai `/etc` : on le compare puis on le recopie si besoin.

</details>

**Exercice 6.** Que fait `rsync -a /srv/data /sauve/` par rapport à `rsync -a /srv/data/ /sauve/` ? Quelle précaution prendre avec `--delete` ?

<details>
<summary>Voir le corrigé</summary>

```text
sans slash : crée /sauve/data/... (le dossier est copié)
avec slash : copie le contenu directement dans /sauve/
```

Avec `--delete`, une destination peut perdre des fichiers si la source est vide ou absente : lancer d'abord `rsync -avn --delete ...` (simulation) et tester que la source existe dans le script.

</details>

**Exercice 7.** Écrivez la commande qui synchronise `/srv/data/` vers `sauve@192.0.2.50:/srv/sauvegardes/data/` par SSH, avec compression, en ignorant les `*.tmp`.

<details>
<summary>Voir le corrigé</summary>

```bash
rsync -avz --exclude='*.tmp' -e ssh /srv/data/ sauve@192.0.2.50:/srv/sauvegardes/data/
```

`-a` conserve droits et dates, `-z` compresse sur le réseau, `-e ssh` impose le transport SSH. Pour une exécution par cron, installer une clé SSH sans mot de passe (voir 4.4).

</details>

**Exercice 8.** Générez la somme SHA-256 de `backup.tar.gz`, enregistrez-la, puis vérifiez le fichier une semaine plus tard.

<details>
<summary>Voir le corrigé</summary>

```bash
sha256sum backup.tar.gz > backup.tar.gz.sha256
sha256sum -c backup.tar.gz.sha256
```

```text
backup.tar.gz: OK
```

Si le fichier a été corrompu, on lit `FAILED`. Le fichier `.sha256` doit être conservé à part (idéalement ailleurs), sinon un attaquant peut modifier les deux.

</details>

**Exercice 9.** Écrivez la commande `dd` qui crée une image de `/dev/sdb` dans `/home/alice/cle.img` avec progression. Quel est le principal danger de `dd` ?

<details>
<summary>Voir le corrigé</summary>

```bash
lsblk
sudo dd if=/dev/sdb of=/home/alice/cle.img bs=4M status=progress
```

`if` est la source, `of` la destination. Intervertir les deux, ou viser le disque système, **écrase les données sans confirmation**. On vérifie toujours le périphérique avec `lsblk` avant d'appuyer sur Entrée.

</details>

**Exercice 10.** Écrivez un script de sauvegarde de `/home/alice` vers `/var/backups`, nommé avec la date, qui consigne le résultat dans `/var/log/save.log` et supprime les archives de plus de 7 jours. Donnez la ligne cron pour 23 h 30, tous les jours.

<details>
<summary>Voir le corrigé</summary>

```bash
#!/bin/bash
DEST=/var/backups
F="$DEST/alice-$(date +%F).tar.gz"
if tar -czf "$F" -C /home alice; then
    echo "$(date '+%F %T') OK $F" >> /var/log/save.log
else
    echo "$(date '+%F %T') ERREUR $F" >> /var/log/save.log
    exit 1
fi
find "$DEST" -name 'alice-*.tar.gz' -mtime +7 -delete
```

```text
30 23 * * * /usr/local/bin/save.sh
```

La suppression n'a lieu qu'après une sauvegarde réussie (le `exit 1` la court-circuite). Le script doit être exécutable (`chmod +x`) et la ligne placée dans la crontab de `root` (`sudo crontab -e`) pour pouvoir écrire dans `/var/log` et `/var/backups`.

</details>

**Exercice 11.** Un collègue affirme : « Nos données sont sur un RAID 1, donc nous n'avons pas besoin de sauvegarde. » Répondez en deux arguments, puis chiffrez une archive avec `gpg`.

<details>
<summary>Voir le corrigé</summary>

```bash
gpg -c backup.tar.gz
ls backup.tar.gz.gpg
```

- Le RAID 1 copie instantanément **toute** modification, y compris une suppression accidentelle, un virus ou une corruption logique.
- Le RAID ne protège ni du vol, ni du feu, ni d'une erreur d'administration, et n'offre aucun historique de versions.
- `gpg -c` crée `backup.tar.gz.gpg` protégé par phrase de passe ; on déchiffre avec `gpg -d`.

</details>
