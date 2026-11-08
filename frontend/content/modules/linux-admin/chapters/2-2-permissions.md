## 2.2.1 Pourquoi des droits sur les fichiers ?

Sur un système multi-utilisateur, il faut décider **qui peut faire quoi** sur chaque fichier. Pensez à un immeuble : la porte de chaque appartement a une serrure, certaines pièces communes sont ouvertes à tous, le local technique est réservé au gardien. Linux applique ce principe avec trois catégories de personnes et trois types d'action. Ce modèle de base s'appelle **DAC** (*Discretionary Access Control* : le propriétaire décide des droits de ses fichiers).

### Lire la sortie de `ls -l`

```bash
ls -l /etc/passwd /usr/bin/passwd /tmp
```

```text
-rw-r--r-- 1 root root  2847 oct.  3 09:12 /etc/passwd
-rwsr-xr-x 1 root root 59976 nov. 24  2022 /usr/bin/passwd
drwxrwxrwt 12 root root 4096 nov.  6 10:01 /tmp
```

Décomposons `-rw-r--r-- 1 root root 2847 oct. 3 09:12 /etc/passwd` :

| Champ | Valeur | Signification |
|---|---|---|
| 1er caractère | `-` | Type : `-` fichier, `d` répertoire, `l` lien symbolique, `c` périphérique caractère, `b` périphérique bloc, `s` socket, `p` tube nommé |
| 9 caractères suivants | `rw-r--r--` | Droits : 3 groupes de 3 (propriétaire, groupe, autres) |
| 2e colonne | `1` | Nombre de liens physiques (pour un répertoire : 2 + nombre de sous-répertoires) |
| 3e colonne | `root` | Propriétaire (user) |
| 4e colonne | `root` | Groupe propriétaire |
| 5e colonne | `2847` | Taille en octets |
| Date, nom | | Date de dernière modification, nom du fichier |

Les neuf caractères se lisent par blocs : `rw-` | `r--` | `r--`, soit **u** (user, le propriétaire), **g** (group), **o** (others, tous les autres). La lettre `a` (all) désigne les trois à la fois. Le système teste dans l'ordre : si vous êtes le propriétaire, seuls les droits `u` comptent ; sinon, si vous appartenez au groupe, ce sont les droits `g` ; sinon les droits `o`. Un propriétaire sans droit de lecture ne peut donc pas lire son fichier, même si « les autres » le peuvent (il peut toutefois changer les droits). Seul `root` ignore ces tests.

### Signification de r, w, x : fichiers et répertoires

| Droit | Sur un **fichier** | Sur un **répertoire** |
|---|---|---|
| `r` (4) | Lire le contenu (`cat`, `less`) | **Lister** les noms qu'il contient (`ls`) |
| `w` (2) | Modifier le contenu (`>`, `nano`) | **Créer, renommer, supprimer** des entrées (nécessite aussi `x`) |
| `x` (1) | Exécuter comme programme ou script | **Traverser** : entrer (`cd`) et accéder aux éléments par leur nom |

Les combinaisons sur un répertoire surprennent toujours. Test sur un répertoire `d` contenant un fichier `f` lisible :

| Droits du répertoire | `ls d` | `cat d/f` | `cd d` | `touch d/new` | `rm d/f` |
|---|---|---|---|---|---|
| `r-x` | oui | oui | oui | non | non |
| `r--` (r sans x) | noms seulement, avec erreurs sur les détails (`ls -l` échoue) | **non** (Permission denied) | non | non | non |
| `--x` (x sans r) | non | **oui si on connaît le nom** | oui | non | non |
| `-wx` | non | oui (si le nom est connu) | oui | oui | oui |
| `-w-` (w sans x) | non | non | non | **non** : `w` seul ne sert à rien | non |
| `rwx` | oui | oui | oui | oui | oui |

Retenez : **sans `x` sur un répertoire, on n'accède à rien dedans**. Le droit de supprimer un fichier dépend du **répertoire** (`w` + `x`), pas du fichier : on peut supprimer un fichier en lecture seule dont on n'est pas propriétaire, si le répertoire est inscriptible (sauf sticky bit, voir 2.2.5). Pour atteindre `/home/luke/doc/a.txt`, il faut `x` sur `/`, `/home`, `/home/luke` et `/home/luke/doc`.

:::retenir Fichier contre répertoire
Sur un fichier, `x` = exécuter ; sur un répertoire, `x` = traverser. Pour supprimer ou créer un fichier, ce sont les droits `wx` du **répertoire parent** qui comptent, pas ceux du fichier.
:::

## 2.2.2 Modifier les droits : chmod

### Notation symbolique

Syntaxe : `chmod [ugoa][+-=][rwxXst] fichier`.

- `+` ajoute, `-` retire, `=` fixe exactement (efface le reste de la catégorie).
- Plusieurs actions se séparent par une virgule, sans espace.

```bash
cd "$(mktemp -d)" && touch rapport.txt script.sh
chmod u+x script.sh            # le propriétaire peut exécuter
chmod g-w,o-r rapport.txt      # retire w au groupe, r aux autres
chmod a=r rapport.txt          # tout le monde en lecture seule : r--r--r--
chmod go= rapport.txt          # groupe et autres : aucun droit
chmod u=rw,g=r,o= rapport.txt  # rw-r-----
ls -l
```

```text
-rw-r----- 1 miracle miracle 0 nov.  6 10:20 rapport.txt
-rwxr--r-- 1 miracle miracle 0 nov.  6 10:20 script.sh
```

Sans lettre de catégorie, `chmod +x f` agit comme `a+x` **filtré par l'umask** (voir 2.2.4) : avec un umask 022 cela donne bien `a+x`, mais avec un umask 027 les « autres » n'obtiennent pas `x`.

### Notation octale

Chaque droit a un poids : **r = 4, w = 2, x = 1**. On additionne par catégorie, ce qui donne trois chiffres (propriétaire, groupe, autres).

| Chiffre | Binaire | Droits |
|---|---|---|
| 0 | 000 | `---` |
| 1 | 001 | `--x` |
| 2 | 010 | `-w-` |
| 3 | 011 | `-wx` |
| 4 | 100 | `r--` |
| 5 | 101 | `r-x` |
| 6 | 110 | `rw-` |
| 7 | 111 | `rwx` |

Conversion détaillée, de `rwxr-x---` vers l'octal : `rwx` = 4+2+1 = **7** ; `r-x` = 4+0+1 = **5** ; `---` = **0** ; résultat **750**. Dans l'autre sens, `chmod 640` : 6 = 4+2 = `rw-`, 4 = `r--`, 0 = `---` donc `rw-r-----`.

| Octal | Symbolique | Usage typique |
|---|---|---|
| 644 | `rw-r--r--` | Fichier ordinaire lisible par tous |
| 600 | `rw-------` | Fichier privé (clé SSH privée, exigé par `ssh`) |
| 755 | `rwxr-xr-x` | Programme, répertoire public |
| 700 | `rwx------` | Répertoire privé (`~/.ssh`) |
| 750 | `rwxr-x---` | Répertoire du groupe seulement |
| 640 | `rw-r-----` | Fichier de config lisible par le groupe |
| 777 | `rwxrwxrwx` | Tout ouvert : **à éviter** |

On peut vérifier avec `stat` :

```bash
stat -c '%A %a %U:%G %n' rapport.txt script.sh
```

```text
-rw-r----- 640 miracle:miracle rapport.txt
-rwxr--r-- 744 miracle:miracle script.sh
```

### Récursivité et le `X` majuscule

`chmod -R` applique les droits à toute l'arborescence. Piège : `chmod -R 644 dossier` retire `x` aux **répertoires** et les rend inaccessibles. Le `X` majuscule règle le problème : il n'ajoute `x` que sur les répertoires (et les fichiers qui ont déjà un `x`).

```bash
chmod -R u=rwX,g=rX,o= projet/
```

Résultat : les répertoires passent en `rwxr-x---`, les fichiers ordinaires en `rw-r-----`, les scripts déjà exécutables restent exécutables. Une autre approche courante utilise `find` pour traiter séparément :

```bash
find projet -type d -exec chmod 755 {} +
find projet -type f -exec chmod 644 {} +
```

:::attention Ne faites jamais chmod -R 777
`chmod -R 777` « pour que ça marche » ouvre tout à tout le monde, y compris l'écriture. Diagnostiquez plutôt avec `ls -ld` sur chaque répertoire du chemin (ou `namei -l /chemin/complet`) et corrigez uniquement ce qui manque.
:::

## 2.2.3 Propriétaire et groupe : chown et chgrp

Seul `root` peut changer le **propriétaire** d'un fichier. Le propriétaire peut changer le **groupe** vers un groupe dont il est membre.

```bash
sudo chown luke fichier              # nouveau propriétaire
sudo chown luke:dev fichier          # propriétaire et groupe
sudo chown :dev fichier              # groupe seulement (équivaut à chgrp dev)
sudo chown -R luke:dev /srv/projet   # récursif
sudo chown --reference=modele cible  # copie propriétaire et groupe de "modele"
sudo chown -h luke lien              # agit sur le lien symbolique lui-même
chgrp -R dev /srv/projet             # chgrp : groupe seulement
```

Par défaut, `chown` suit les liens symboliques et modifie la **cible** ; `-h` modifie le lien lui-même. Écrire `luke.dev` (point) est ancien et déconseillé : préférez `luke:dev`.

## 2.2.4 umask : les droits par défaut

Un nouveau fichier est demandé avec **666** (`rw-rw-rw-`, jamais exécutable à la création) et un nouveau répertoire avec **777**. L'**umask** est un masque qui **retire** des droits : `droits = demande AND NOT umask`. En pratique, on soustrait chiffre par chiffre (sans retenue) quand les bits retirés étaient bien présents.

| umask | Fichier (666 moins umask) | Répertoire (777 moins umask) | Usage |
|---|---|---|---|
| 022 | 644 | 755 | Défaut Debian/RHEL pour root |
| 002 | 664 | 775 | Défaut Ubuntu pour un utilisateur (groupe privé), travail collaboratif |
| 027 | 640 | 750 | Groupe en lecture, autres exclus |
| 077 | 600 | 700 | Tout privé |

Vérification dans un sous-shell (l'umask ne change que ce sous-shell) :

```bash
cd "$(mktemp -d)"
umask                           # affiche 0022 (ou 0002 sur Ubuntu)
( umask 027; touch g; mkdir d; stat -c '%a %n' g d )
( umask 077; touch h; stat -c '%a %n' h )
```

```text
0022
640 g
750 d
600 h
```

Pourquoi un fichier à 666 et non 777 ? Pour éviter de créer des fichiers exécutables par erreur. Avec `umask 027`, calcul binaire pour un fichier : 666 = `110 110 110`, 027 = `000 010 111` ; on retire les bits du masque : `110 100 000` = **640**.

**Rendre l'umask permanent** : `umask 027` dans `~/.bashrc` ou `~/.profile` (un utilisateur) ; `/etc/profile` ou `/etc/bash.bashrc` (tous) ; la valeur par défaut des comptes se règle aussi via `UMASK` dans `/etc/login.defs` (Ubuntu affecte l'umask de session via `pam_umask` dans `/etc/pam.d/common-session`). Pour un service systemd, utilisez `UMask=0027` dans l'unité.

:::examen Calcul d'umask
Question classique : « avec `umask 027`, quels droits ont un nouveau fichier et un nouveau répertoire ? » Réponse : **640** et **750**. Retenez 666 et 777 comme points de départ, et n'oubliez pas qu'un fichier n'est jamais créé exécutable.
:::

## 2.2.5 Droits spéciaux : SUID, SGID, sticky bit

Un quatrième chiffre octal, placé **devant** les trois autres, porte les droits spéciaux : **4** = SUID, **2** = SGID, **1** = sticky. `chmod 4755 f` ou, en symbolique, `chmod u+s`, `g+s`, `+t`.

| Bit | Octal | Sur un exécutable | Sur un répertoire | Affichage |
|---|---|---|---|---|
| **SUID** | 4000 | S'exécute avec l'identité du **propriétaire** du fichier | Sans effet | `s` à la place du `x` de u |
| **SGID** | 2000 | S'exécute avec le **groupe** du fichier | Les nouveaux fichiers héritent du **groupe du répertoire** ; les sous-répertoires héritent du SGID | `s` à la place du `x` de g |
| **Sticky** | 1000 | Ignoré sur Linux | Seuls le propriétaire du fichier, celui du répertoire ou root peuvent supprimer/renommer | `t` à la place du `x` de o |

Une lettre **majuscule** (`S`, `T`) signifie que le bit spécial est posé **sans** le `x` correspondant : c'est généralement une erreur de configuration (le bit n'a alors pas d'effet utile).

```bash
cd "$(mktemp -d)"; touch f; chmod 4755 f; ls -l f
chmod 4644 f; ls -l f
mkdir d; chmod 2770 d; ls -ld d
mkdir t; chmod 1777 t; ls -ld t
chmod 1776 t; ls -ld t
```

```text
-rwsr-xr-x 1 miracle miracle 0 nov.  6 10:30 f
-rwSr--r-- 1 miracle miracle 0 nov.  6 10:30 f
drwxrws--- 2 miracle miracle 4096 nov.  6 10:30 d
drwxrwxrwt 2 miracle miracle 4096 nov.  6 10:30 t
drwxrwxrwT 2 miracle miracle 4096 nov.  6 10:30 t
```

### Usages classiques

- **SUID** : `/usr/bin/passwd` appartient à root avec SUID. Un utilisateur ordinaire peut ainsi modifier **son** mot de passe dans `/etc/shadow`, fichier qu'il ne peut pas écrire directement. Même principe pour `sudo`, `su`, `mount`.
- **SGID sur répertoire** : dossier de travail d'équipe. Tout fichier créé dedans appartient au groupe du dossier, pas au groupe principal de l'auteur.
- **Sticky** : `/tmp` (mode `1777`). Tout le monde peut y créer des fichiers, mais personne ne peut supprimer ceux des autres.

:::attention SUID : un risque de sécurité
Le SUID sur un script (`#!/bin/bash`) est **ignoré** par le noyau Linux, par sécurité. Sur un binaire, un SUID root mal conçu (ou posé sur `vim`, `find`, `cp`) donne un accès root immédiat. Un attaquant cherche ces fichiers ; vous devez donc les auditer régulièrement.
:::

### Audit avec find -perm

```bash
find / -perm -4000 -type f 2>/dev/null          # tous les SUID
find / -perm -2000 -type f 2>/dev/null          # tous les SGID
find / -perm /6000 -type f 2>/dev/null          # SUID ou SGID
find / -perm -0002 -type f 2>/dev/null          # fichiers inscriptibles par tous
find / -perm -0002 -type d ! -perm -1000 2>/dev/null  # répertoires world-writable sans sticky
```

`-perm 644` signifie « exactement 644 » ; `-perm -644` « au moins ces bits » ; `-perm /644` « au moins un de ces bits ».

## 2.2.6 ACL : des droits plus fins

Les droits u/g/o ne permettent qu'un seul groupe. Les **ACL** (*Access Control Lists*) permettent de donner des droits à un utilisateur ou un groupe **supplémentaire**. Le système de fichiers doit les supporter (ext4 et XFS : oui par défaut). Paquet Debian/Ubuntu : `sudo apt install acl`.

```bash
setfacl -m u:luke:rw fichier        # luke : lecture/écriture
setfacl -m g:compta:r fichier       # le groupe compta : lecture
setfacl -x u:luke fichier           # retire l'entrée de luke
setfacl -b fichier                  # supprime TOUTES les ACL
setfacl -R -m g:dev:rwX /srv/projet # récursif
setfacl -d -m g:dev:rwx /srv/projet # ACL par DÉFAUT, héritée par les nouveaux fichiers
getfacl fichier
```

```text
# file: fichier
# owner: miracle
# group: miracle
user::rw-
user:luke:rw-
group::r--
mask::rw-
other::r--
```

Un `+` à la fin des droits dans `ls -l` (`-rw-rw-r--+`) signale la présence d'une ACL. Le **mask** est le plafond des droits effectifs pour les entrées nommées et le groupe : si `mask::r--`, alors `luke` n'a en pratique que `r`, même avec `user:luke:rw-` (getfacl affiche `#effective:r--`). Attention : `chmod g=...` sur un fichier à ACL **modifie le mask**.

## 2.2.7 Attributs et capacités

### chattr et lsattr

Attributs de système de fichiers (ext2/3/4), appliqués même à `root` :

```bash
sudo chattr +i config.conf   # immuable : ni modification, ni suppression, ni renommage
sudo chattr +a journal.log   # append-only : on ne peut qu'ajouter (>>)
lsattr config.conf
sudo chattr -i config.conf   # lever l'attribut
```

```text
----i---------e------- config.conf
```

Si `rm` répond « Operation not permitted » alors que vous êtes root, pensez à `lsattr`.

### Capabilities (aperçu)

Plutôt que de donner tous les droits de root par SUID, Linux découpe ses privilèges en **capacités** (`CAP_NET_BIND_SERVICE`, `CAP_CHOWN`…). Exemple : autoriser un programme à écouter sur un port inférieur à 1024 sans être root.

```bash
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/monserveur
getcap /usr/local/bin/monserveur
```

### SELinux et AppArmor : DAC contre MAC

Les droits u/g/o sont du **DAC** : le propriétaire décide. Le **MAC** (*Mandatory Access Control*) ajoute une politique imposée par le système, que ni l'utilisateur ni parfois root ne peut contourner. **SELinux** (RHEL, Fedora ; `getenforce`, `setenforce 0`, `ls -Z`) étiquette fichiers et processus. **AppArmor** (Ubuntu, Debian ; `sudo aa-status`) confine des programmes par profils de chemins. Les deux s'appliquent **après** les droits classiques : un accès refusé par les droits reste refusé, un accès permis par les droits peut encore être bloqué par le MAC. Sur RHEL, une erreur « Permission denied » inexplicable vient souvent de SELinux (consultez `ausearch -m avc` ou `journalctl`).

## 2.2.8 Cas pratique : /srv/projet pour le groupe dev

Objectif : un répertoire partagé par le groupe `dev`. Les membres y créent des fichiers lisibles et modifiables par le groupe ; personne ne supprime les fichiers d'un collègue ; les autres n'ont aucun accès.

```bash
sudo groupadd dev
sudo usermod -aG dev luke
sudo usermod -aG dev miracle
sudo mkdir /srv/projet
sudo chown root:dev /srv/projet
sudo chmod 3770 /srv/projet          # 3 = setgid (2) + sticky (1)
ls -ld /srv/projet
```

```text
drwxrws--T 2 root dev 4096 nov.  6 10:40 /srv/projet
```

Lecture de `rwxrws--T` : propriétaire `rwx` ; groupe `rws` (rwx + setgid) ; autres `--` + sticky **sans** `x`, donc `T` majuscule (normal ici, les autres n'ont aucun accès). Ainsi, `luke` crée un fichier : il appartient au groupe `dev` (setgid), et `miracle` peut le modifier si l'umask de `luke` est 002 (pour garder `w` au groupe) ; mais `miracle` ne peut pas le supprimer (sticky). Les nouveaux membres doivent ouvrir une nouvelle session pour que leur appartenance au groupe soit prise en compte (ou utiliser `newgrp dev`).

Variante : une ACL par défaut garantit l'écriture du groupe quel que soit l'umask : `sudo setfacl -d -m g:dev:rwx /srv/projet`.

:::exemple Pas d'accès ? Méthode de diagnostic
1. `id` : suis-je dans le bon groupe (session rouverte) ?
2. `namei -l /srv/projet/fichier` : quels droits sur chaque répertoire du chemin ?
3. `getfacl`, `lsattr` : une ACL ou un attribut `i` ?
4. SELinux/AppArmor : un refus dans les journaux ?
:::

## 2.2.9 Exercices corrigés

**Exercice 1.** Que signifie `-rwxr-x--- 1 luke dev 120 nov. 6 10:00 run.sh` ?

<details>
<summary>Voir le corrigé</summary>

Fichier ordinaire (`-`), propriétaire `luke` : `rwx` (lire, écrire, exécuter) ; groupe `dev` : `r-x` (lire, exécuter) ; autres : aucun droit. En octal : **750**. Un lien physique, 120 octets.

</details>

**Exercice 2.** Donnez la commande qui met `rw-r-----` sur `notes.txt`, en octal puis en symbolique.

<details>
<summary>Voir le corrigé</summary>

```bash
chmod 640 notes.txt
chmod u=rw,g=r,o= notes.txt
```

6 = 4+2 (`rw-`), 4 (`r--`), 0 (`---`).

</details>

**Exercice 3.** Un répertoire `d` est en `r--r--r--`. Que peut-on faire dedans ?

<details>
<summary>Voir le corrigé</summary>

On peut seulement lister les noms (`ls d`), mais pas `cd d`, ni lire les fichiers, ni voir leurs détails (`ls -l` donne « Permission denied » sur chaque entrée), ni créer ou supprimer. Sans `x`, le répertoire ne peut pas être traversé.

</details>

**Exercice 4.** Donnez les droits d'un nouveau fichier et d'un nouveau répertoire avec `umask 027`, puis avec `umask 077`.

<details>
<summary>Voir le corrigé</summary>

`umask 027` : fichier 640, répertoire 750. `umask 077` : fichier 600, répertoire 700.

Calcul : 666 - 027 = 640 ; 777 - 027 = 750 ; 666 - 077 = 600 ; 777 - 077 = 700.

</details>

**Exercice 5.** Donnez la commande qui donne à tout le monde la lecture, et l'exécution sur les répertoires et les scripts déjà exécutables, dans toute l'arborescence `site/`.

<details>
<summary>Voir le corrigé</summary>

```bash
chmod -R a+rX site/
```

Le `X` majuscule n'ajoute `x` qu'aux répertoires et aux fichiers qui l'ont déjà pour quelqu'un. Un fichier texte ordinaire ne devient pas exécutable.

</details>

**Exercice 6.** Passez le propriétaire de `/srv/web` et de tout son contenu à `www-data`, groupe `dev`, et vérifiez.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo chown -R www-data:dev /srv/web
ls -ld /srv/web
```

`-R` rend l'opération récursive ; `www-data:dev` fixe utilisateur et groupe d'un coup.

</details>

**Exercice 7.** Que signifient `-rwsr-xr-x` et `-rwSr--r--` ? Donnez l'octal pour chacun.

<details>
<summary>Voir le corrigé</summary>

Le premier est SUID avec `x` du propriétaire : **4755**. Le second est SUID **sans** `x` pour le propriétaire (`S` majuscule) : **4644**, bit sans effet utile. Le `s` remplace le `x` du propriétaire.

</details>

**Exercice 8.** Écrivez la commande qui liste tous les fichiers SUID du système, sans les messages d'erreur, et expliquez le `-`.

<details>
<summary>Voir le corrigé</summary>

```bash
find / -perm -4000 -type f 2>/dev/null
```

`-perm -4000` signifie « le bit 4000 au moins est présent » (alors que `-perm 4000` demanderait exactement 4000 et rien d'autre). `2>/dev/null` écarte les « Permission denied ».

</details>

**Exercice 9.** Pourquoi `/tmp` est-il en `drwxrwxrwt` ? Que se passerait-il en `drwxrwxrwx` ?

<details>
<summary>Voir le corrigé</summary>

`/tmp` doit être inscriptible par tous (1777). Le sticky bit (`t`) restreint la suppression et le renommage au propriétaire du fichier, au propriétaire du répertoire et à root. Sans lui, tout utilisateur pourrait supprimer les fichiers temporaires des autres, y compris les sockets et verrous de leurs programmes.

</details>

**Exercice 10.** Donnez le droit de lecture/écriture à l'utilisateur `luke` sur `budget.ods` sans changer ni le propriétaire, ni le groupe. Comment le vérifier ? Comment tout annuler ?

<details>
<summary>Voir le corrigé</summary>

```bash
setfacl -m u:luke:rw budget.ods
getfacl budget.ods
setfacl -b budget.ods
```

Le `+` en fin de droits dans `ls -l` signale l'ACL. `-x u:luke` retirerait seulement son entrée ; `-b` supprime toutes les ACL.

</details>

**Exercice 11.** Un fichier `/etc/important.conf` ne peut pas être supprimé, même par root (« Operation not permitted »). Quelle est probablement la cause et la solution ?

<details>
<summary>Voir le corrigé</summary>

```bash
lsattr /etc/important.conf
sudo chattr -i /etc/important.conf
```

L'attribut immuable `i` est posé. `lsattr` le révèle ; `chattr -i` le retire, après quoi `rm` fonctionne.

</details>

**Exercice 12.** Créez `/srv/compta` pour le groupe `compta` : accès réservé au groupe, fichiers créés appartenant au groupe `compta`, suppression limitée à l'auteur. Donnez les commandes et le résultat attendu de `ls -ld`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo mkdir /srv/compta
sudo chown root:compta /srv/compta
sudo chmod 3770 /srv/compta
ls -ld /srv/compta
```

```text
drwxrws--T 2 root compta 4096 nov.  6 11:00 /srv/compta
```

3 = SGID (2) + sticky (1) ; 770 donne tous les droits au propriétaire et au groupe, rien aux autres. Le `T` majuscule est normal car les autres n'ont pas `x`.

</details>
