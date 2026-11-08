## 1.3.1 Créer, copier, déplacer, supprimer

Gérer des fichiers en ligne de commande, c'est le quotidien d'un administrateur. Imaginez un classeur de bureau : `mkdir` ajoute un intercalaire, `cp` photocopie un document, `mv` le range ailleurs (ou change l'étiquette), `rm` le jette à la corbeille... sauf qu'ici **il n'y a pas de corbeille** : ce qui est supprimé est perdu.

Tout ce chapitre s'appuie sur le TP2 « Atelier systèmes 2 » : nous construirons pas à pas l'arborescence `TP2` avec `Mon_fichier`, les sous-répertoires `Source`, `Data`, `Old`, puis les liens. Travaillez dans un répertoire jetable :

```bash
cd "$(mktemp -d)"
pwd
```

### mkdir et rmdir : les répertoires

```bash
mkdir TP2                      # un répertoire
cd TP2
mkdir Source Data              # plusieurs d'un coup
mkdir -p projet/{src,doc,tests}   # -p : crée aussi les parents ; {a,b,c} : accolades du shell
mkdir -p a/b/c                 # chaîne complète, sans erreur si elle existe déjà
ls -F
```

```text
Data/  Source/  a/  projet/
```

- `-p` (*parents*) crée les répertoires intermédiaires manquants **et** ne signale pas d'erreur si le répertoire existe déjà ; sans `-p`, `mkdir a/b/c` échoue si `a/b` n'existe pas.
- `-m 750` fixe les droits à la création : `mkdir -m 750 prive`.
- `rmdir Source` supprime un répertoire **vide** uniquement ; sur un répertoire non vide : `rmdir: failed to remove 'd1': Directory not empty`. `rmdir -p a/b/c` supprime `c`, puis `b`, puis `a` si chacun devient vide.

Les accolades `{src,doc,tests}` ne sont pas une option de `mkdir` : c'est le **shell** qui les développe avant l'exécution (voir 1.3.8). `mkdir` reçoit simplement trois arguments.

### touch : créer un fichier vide, changer une date

```bash
touch Mon_fichier                       # crée un fichier vide, ou met à jour ses dates s'il existe
touch f{1..3}.txt                       # f1.txt f2.txt f3.txt
touch -d "2026-01-15 10:30" vieux       # force la date de modification (et d'accès)
touch -r Mon_fichier copie_date         # recopie les dates d'un autre fichier
touch -c inexistant                     # -c : ne crée pas le fichier s'il n'existe pas
```

Sur un fichier existant, `touch` ne modifie pas le contenu : il met à jour l'horodatage (voir 1.3.5). Pour mettre du texte dans `Mon_fichier`, on utilise une redirection (voir 1.4) :

```bash
printf 'Bonjour\nLinux\n' > Mon_fichier
```

### cp : copier

Syntaxe : `cp [options] source... destination`. Si la destination est un répertoire existant, les sources y sont copiées ; sinon, c'est une copie sous un nouveau nom.

| Option | Effet |
|---|---|
| `-r` ou `-R` | Récursif : indispensable pour copier un **répertoire** |
| `-p` | Préserve propriétaire (si possible), droits et dates |
| `-a` | Archive : `-r` + `-p` + liens symboliques copiés tels quels (équivaut à `-dR --preserve=all`) ; idéal pour une sauvegarde fidèle |
| `-i` | Interactif : demande confirmation avant d'écraser |
| `-u` | N'écrase que si la source est plus récente (ou si la destination manque) |
| `-v` | Verbeux : affiche chaque copie |

```bash
cp Mon_fichier Mon_fichier_2           # copie sous un autre nom
cp Mon_fichier Data/                   # copie dans un répertoire
cp -rv projet projet_sauve
cp -i Mon_fichier Mon_fichier_2
```

```text
'projet' -> 'projet_sauve'
'projet/src' -> 'projet_sauve/src'
'projet/doc' -> 'projet_sauve/doc'
'projet/tests' -> 'projet_sauve/tests'
cp: overwrite 'Mon_fichier_2'?
```

Sans `-p`, la copie a **de nouvelles dates**, l'utilisateur courant pour propriétaire et les droits filtrés par l'umask (voir 2.2.4). Par défaut, `cp` **écrase sans prévenir** (certaines distributions définissent un alias `cp -i` pour root : vérifiez avec `alias`). Pour ne pas écraser du tout, utilisez `-n` (en coreutils récents, `--update=none` est la forme recommandée).

### mv : déplacer et renommer

`mv` n'a qu'une commande pour deux usages : **renommer** (même répertoire) ou **déplacer** (autre répertoire). Sur un même système de fichiers, c'est instantané : seule l'entrée de répertoire change, l'inode reste le même (voir 1.3.6).

```bash
mv Mon_fichier Mon_fichier_1       # renommer
mkdir Old
for f in Mon_fichier_1 Mon_fichier_2; do cp "$f" "$f.old"; done   # TP2 : copie en nom.old
mv *.old Old/                      # déplacer tous les .old vers Old
mv -i a b      # confirmation avant écrasement ; -n : jamais d'écrasement ; -v : verbeux
mv -- -rf rf   # rendre inoffensif un nom commençant par un tiret (voir 1.3.9)
```

Entre deux systèmes de fichiers différents (deux partitions), `mv` copie puis supprime : plus lent, et l'inode change.

### rm : supprimer (définitivement)

| Commande | Effet |
|---|---|
| `rm fichier` | Supprime un fichier |
| `rm -i fichier` | Demande confirmation |
| `rm -r dossier` | Supprime un répertoire **et tout son contenu** |
| `rm -f fichier` | *Force* : pas de confirmation, pas d'erreur si le fichier manque |
| `rm -rf dossier` | La combinaison la plus dangereuse |
| `rm -v` | Affiche ce qui est supprimé |

:::attention rm -rf : pas de corbeille, pas de retour
`rm -rf /` ou `rm -rf ~` ou `rm -rf *` lancé dans le mauvais répertoire détruit des années de travail. Une espace de trop suffit : `rm -rf /home/miracle /tmp/x` est correct, `rm -rf /home/miracle / tmp/x` ne l'est pas. Habitudes de sécurité : faites `ls` avec **exactement le même motif** avant de lancer `rm`, utilisez `rm -i` ou `rm -I` (une seule question pour plus de trois fichiers), et ne lancez jamais `rm -rf` en `root` sans relire la ligne. GNU `rm` refuse `rm -r /` (option `--preserve-root` par défaut) mais pas `rm -rf /*`.
:::

Supprimer un fichier n'a rien à voir avec ses droits : ce sont les droits `w` et `x` du **répertoire** qui comptent (voir 2.2.1). Pour effacer de manière irrécupérable (rare), `shred -u fichier` écrase le contenu avant suppression.

## 1.3.2 Afficher le contenu : cat, tac, less, more, file

```bash
cat Mon_fichier              # affiche tout
cat -n Mon_fichier           # numérote les lignes
cat -A fichier               # montre les caractères invisibles : tabulation = ^I, fin de ligne = $
cat f1 f2 > f12              # concaténer
tac Mon_fichier              # affiche les lignes en ordre inverse (cat à l'envers)
```

```text
     1	Bonjour
     2	Linux
```

`cat -A` est l'outil pour débusquer une tabulation ou des espaces en fin de ligne :

```bash
printf 'a\tb\n' | cat -A
```

```text
a^Ib$
```

Pour un long fichier, un **paginateur** est préférable :

| Commande | Usage |
|---|---|
| `less fichier` | Paginateur moderne : on peut remonter. `Espace` page suivante, `b` page précédente, `/mot` recherche, `n` occurrence suivante, `G` fin, `g` début, `q` quitter, `-N` numéros de lignes |
| `more fichier` | Ancêtre de `less` : avance surtout, `Espace`, `q` |
| `head`, `tail` | Début et fin du fichier (voir 1.4.5) |

```bash
less /etc/services
```

**Déterminer la nature d'un fichier** : sous Linux, l'extension n'est qu'une convention. `file` examine le contenu.

```bash
file /etc/services /bin/ls /tmp Mon_fichier
```

```text
/etc/services: ASCII text
/bin/ls:       ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, ...
/tmp:          sticky, directory
Mon_fichier:   ASCII text
```

`file -i` donne le type MIME (`text/plain; charset=us-ascii`).

## 1.3.3 Types de fichiers : « tout est fichier »

Le premier caractère de `ls -l` indique le type (voir 2.2.1). Les sept types de Linux :

| Caractère | Type | Exemple |
|---|---|---|
| `-` | Fichier ordinaire (texte, binaire, image...) | `/etc/passwd` |
| `d` | Répertoire | `/home` |
| `l` | Lien symbolique | `/bin -> usr/bin` |
| `b` | Périphérique en mode **bloc** (disques) | `/dev/sda`, `/dev/loop0` |
| `c` | Périphérique en mode **caractère** (flux) | `/dev/null`, `/dev/tty` |
| `s` | Socket (communication entre processus) | `/run/systemd/private` |
| `p` | Tube nommé (FIFO) | créé par `mkfifo` |

```bash
ls -l /dev/null /dev/zero /dev/loop0
```

```text
crw-rw-rw- 1 root root 1, 3 nov.  7 03:36 /dev/null
crw-rw-rw- 1 root root 1, 5 nov.  7 03:36 /dev/zero
brw------- 1 root root 7, 0 nov.  7 03:36 /dev/loop0
```

Pour les fichiers de périphériques, la colonne de taille est remplacée par deux nombres : **majeur** et **mineur** (identifiant du pilote et de l'unité). On peut tester un type directement : `find . -type d`, `find /dev -type b`.

### Fichiers cachés

Un fichier dont le nom commence par un **point** est « caché » : `ls` ne l'affiche pas sans option. Ce n'est pas une protection, seulement un confort (fichiers de configuration personnels : `.bashrc`, `.ssh`).

```bash
touch .cache .env
ls
ls -a        # tout, y compris . et ..
ls -A        # tout sauf . et ..
ls -d .[!.]* # seulement les cachés (le motif exclut . et ..)
```

Le joker `*` **ne correspond pas** aux fichiers cachés : `rm *` laisse `.env` en place, et `cp -r source/* dest/` n'emporte pas les cachés. Utilisez `cp -a source/. dest/` pour tout copier.

## 1.3.4 Taille et espace : du et df

```bash
du -sh .          # taille totale du répertoire, lisible (K, M, G)
du -sb .          # en octets (taille apparente)
du -h --max-depth=1 /var | sort -h   # taille de chaque sous-dossier de premier niveau
du -ah Data       # fichiers et dossiers
df -h             # espace des systèmes de fichiers montés
df -h /home       # celui qui contient /home
df -i             # utilisation des inodes
```

```text
$ du -sh .
24K	.
$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda        252G   13G   30G  30% /
```

| Commande | Mesure | Question typique |
|---|---|---|
| `du` | Ce que **occupent** des fichiers ou répertoires | « Quelle taille fait `TP2` ? » |
| `df` | L'espace **libre ou utilisé** d'un système de fichiers entier | « Reste-t-il de la place sur `/` ? » |

Les deux peuvent différer : un fichier supprimé mais encore ouvert par un processus occupe toujours de la place pour `df` mais plus pour `du` (voir 5.3 pour le dépannage). `du` compte les blocs réellement alloués, alors que `ls -l` donne la taille en octets du contenu : un fichier de 1 octet occupe un bloc de 4 Kio (`du -sb` ou `--apparent-size` donne la taille apparente).

## 1.3.5 stat : tout savoir sur un fichier

```bash
stat -c '%i %h %s %F %n' Mon_fichier
LC_ALL=C stat vieux
```

```text
1204680 1 0 regular empty file vieux
  File: vieux
  Size: 0         	Blocks: 0          IO Block: 4096   regular empty file
Device: 254,0	Inode: 1204680     Links: 1
Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
Access: 2026-01-15 10:30:00.000000000 +0100
Modify: 2026-01-15 10:30:00.000000000 +0100
Change: 2026-11-07 06:03:05.557631314 +0100
 Birth: 2026-11-07 06:03:05.557631314 +0100
```

Un fichier a **trois dates**, à ne pas confondre :

| Date | Nom | Quand change-t-elle ? | Voir avec |
|---|---|---|---|
| **atime** | *Access* | À la lecture du contenu (avec `relatime`, mise à jour partielle) | `ls -lu` |
| **mtime** | *Modify* | À la modification du **contenu** | `ls -l` (défaut) |
| **ctime** | *Change* | À la modification de l'**inode** : droits, propriétaire, nombre de liens, contenu. Impossible à fixer à la main | `ls -lc` |

`touch -d` change atime et mtime, mais **pas** ctime : le `Change` d'un fichier antidaté reste la date réelle. C'est ce qui permet de détecter une falsification. `stat -c` accepte des formats : `%a` droits octaux, `%A` droits lisibles, `%U` propriétaire, `%G` groupe, `%s` taille, `%i` inode, `%h` liens, `%y` mtime, `%F` type.

## 1.3.6 Inodes et liens

### L'inode

Sur un système de fichiers ext4, chaque fichier est décrit par un **inode** (*index node*) : un enregistrement qui contient le type, les droits, le propriétaire, la taille, les trois dates et l'emplacement des blocs de données, **mais pas le nom**. Le nom est stocké dans le **répertoire**, qui n'est qu'une table « nom → numéro d'inode ». Analogie : l'inode est la fiche d'une bibliothèque (cote, rayon), le répertoire est le catalogue qui associe un titre à une cote.

Conséquences : `mv` dans la même partition ne change que le catalogue ; plusieurs noms peuvent pointer sur le même inode (liens physiques) ; on peut manquer d'inodes avant de manquer de place (`df -i` : colonne `IUse%` à 100 %, symptôme « No space left on device » alors que `df -h` montre de la place, typique avec des millions de petits fichiers).

```bash
ls -i Mon_fichier          # affiche le numéro d'inode
```

### Lien physique (hard link)

Un lien physique est un **deuxième nom pour le même inode**. Les deux noms sont strictement équivalents : il n'y a pas d'« original ».

```bash
printf 'deuxieme\n' > Mon_fichier_2
ln Mon_fichier_2 Mon_lien
ls -li Mon_lien Mon_fichier_2
```

```text
1204612 -rw-r--r-- 2 miracle miracle 9 nov.  7 06:03 Mon_fichier_2
1204612 -rw-r--r-- 2 miracle miracle 9 nov.  7 06:03 Mon_lien
```

Même inode (1204612), compteur de liens à **2**. Si on supprime l'un des noms, le compteur redescend, les données **restent** tant qu'au moins un nom (et aucun processus) les référence :

```bash
rm Mon_lien
ls -li Mon_fichier_2
```

```text
1204612 -rw-r--r-- 1 miracle miracle 9 nov.  7 06:03 Mon_fichier_2
```

Réponse à la question du TP : non, `Mon_fichier_2` n'a pas disparu ; `rm` n'efface que le nom et décrémente le compteur. Les données ne sont libérées que quand le compteur tombe à 0.

**Limites** : un lien physique ne peut pas traverser un système de fichiers (les numéros d'inodes n'ont de sens que dans une partition) et on ne peut pas en faire sur un **répertoire** (sauf `.` et `..` gérés par le système : un répertoire a donc 2 liens + le nombre de ses sous-répertoires).

### Lien symbolique (symlink)

Un lien symbolique est un **petit fichier spécial** (type `l`, son propre inode) qui contient un **chemin** vers la cible, comme un raccourci Windows.

```bash
ln -s Mon_fichier_2 Mon_nouveau_lien
ls -li Mon_nouveau_lien Mon_fichier_2
```

```text
1204612 -rw-r--r-- 1 miracle miracle  9 nov.  7 06:03 Mon_fichier_2
1204618 lrwxrwxrwx 1 miracle miracle 13 nov.  7 06:03 Mon_nouveau_lien -> Mon_fichier_2
```

On remarque : des inodes **différents**, le type `l`, des droits `lrwxrwxrwx` sans signification (ce sont ceux de la cible qui comptent), une taille de 13 octets (la longueur du texte `Mon_fichier_2`) et l'affichage `-> cible`. Le lien peut pointer vers un répertoire, traverser les partitions et même viser un chemin inexistant.

Si on supprime la cible, le lien n'est plus supprimé mais devient **cassé** (*dangling*) :

```bash
rm Mon_fichier_2
ls -l Mon_nouveau_lien
cat Mon_nouveau_lien
```

```text
lrwxrwxrwx 1 miracle miracle 13 nov.  7 06:03 Mon_nouveau_lien -> Mon_fichier_2
cat: Mon_nouveau_lien: No such file or directory
```

Dans un terminal en couleurs, un lien cassé s'affiche en rouge. Pour les trouver : `find . -xtype l` (type du fichier visé : `l` seulement si cassé). Attention : un chemin **relatif** dans `ln -s` est interprété à partir du répertoire **du lien**, pas de l'endroit où vous tapez la commande ; en cas de doute, utilisez un chemin absolu.

| Critère | Lien physique (`ln`) | Lien symbolique (`ln -s`) |
|---|---|---|
| Inode | Le **même** que la cible | Son propre inode |
| Cible supprimée | Données conservées | Lien **cassé** |
| Répertoires | Interdit | Possible |
| Autre partition | Impossible | Possible |
| Compteur de liens | Incrémenté | Inchangé |
| Taille | Celle du fichier | Longueur du chemin |

:::retenir Deux noms, un inode ; un raccourci, un chemin
Lien physique : même inode, compteur `+1`, survit à la suppression de l'autre nom, limité à une partition et aux fichiers. Lien symbolique : fichier contenant un chemin, peut être cassé, fonctionne partout. Options utiles : `ln -sf cible lien` (remplace un lien existant), `readlink lien` (affiche le texte du lien), `ls -L` (suit le lien).
:::

Usage réel : `/bin -> usr/bin`, ou `ln -s /opt/app-2.1 /opt/app` pour basculer de version en changeant juste le lien.

## 1.3.7 Chemins : basename, dirname, realpath, readlink

```bash
basename /home/miracle/rapport.txt          # rapport.txt
basename /home/miracle/rapport.txt .txt     # rapport  (supprime le suffixe)
dirname  /home/miracle/rapport.txt          # /home/miracle
dirname  rapport.txt                        # .
realpath ../TP2/Mon_nouveau_lien            # chemin absolu canonique, liens résolus
readlink Mon_nouveau_lien                   # contenu brut du lien : Mon_fichier_2
readlink -f Mon_nouveau_lien                # chemin absolu final (cible résolue)
```

Ces commandes manipulent des textes : `basename` et `dirname` n'ont pas besoin que le fichier existe. Elles servent surtout dans les scripts (voir 5.1) : `nom=$(basename "$f" .log)`.

## 1.3.8 Les jokers : globbing

Avant d'exécuter une commande, le shell **remplace** les motifs contenant des jokers par la liste des noms correspondants : c'est le *globbing*. La commande ne voit jamais le joker, seulement la liste. Ce n'est pas une expression régulière (voir 1.4.9).

| Motif | Signification | Exemple |
|---|---|---|
| `*` | Zéro ou plusieurs caractères quelconques | `*.txt` |
| `?` | Exactement un caractère | `f?.txt` |
| `[abc]` | Un caractère parmi a, b, c | `f[12].txt` |
| `[a-c]` | Un caractère de l'intervalle | `[a-c]*` |
| `[!0-9]` ou `[^0-9]` | Un caractère **hors** de l'ensemble | `[!0-9]*` |
| `[[:digit:]]` | Classe POSIX : `[:alpha:]`, `[:digit:]`, `[:upper:]`, `[:lower:]`, `[:alnum:]`, `[:space:]` | `f[[:digit:]].txt` |
| `{a,b}` | Développement d'accolades (ce n'est pas un joker) | `{a,b}x` donne `ax bx` |

```bash
touch f{1..3}.txt
echo f*.txt ; echo f?.txt ; echo f[12].txt ; echo f[!2].txt
echo {a,b}x ; echo {1..3}{a,b} ; echo {01..03}
```

```text
f1.txt f2.txt f3.txt
f1.txt f2.txt f3.txt
f1.txt f2.txt
f1.txt f3.txt
ax bx
1a 1b 2a 2b 3a 3b
01 02 03
```

Les accolades produisent des noms **même s'ils n'existent pas** (utile avec `mkdir` et `touch`), alors que les jokers ne retournent que des fichiers existants. Si un motif ne correspond à rien, bash le laisse tel quel (`echo *.zzz` affiche `*.zzz`).

**Globbing étendu (`extglob`)** : activez-le avec `shopt -s extglob` (dans un script ou `~/.bashrc`), puis :

| Motif | Signification |
|---|---|
| `?(m)` | zéro ou un des motifs |
| `*(m)` | zéro ou plusieurs |
| `+(m)` | un ou plusieurs |
| `@(m1\|m2)` | exactement un des motifs |
| `!(m)` | tout sauf ce motif |

```bash
shopt -s extglob
touch a.jpg b.png c.txt d.jpg
echo !(*.jpg)          # tout sauf les .jpg
echo @(*.jpg|*.png)    # les images
ls *.+(jpg|png)
```

```text
b.png c.txt
a.jpg b.png d.jpg
a.jpg
b.png
d.jpg
```

(Dans un fichier de script, `shopt -s extglob` doit être exécuté avant la ligne qui utilise le motif.)

:::examen Copier selon un motif
Question type du TP : « Copier en une commande les fichiers dont le nom commence par `std` » : `cp std* inc/`. « Lister ceux qui commencent par `a`, `b` ou `c` » : `ls [abc]*` ou `ls [a-c]*`. « Lister les fichiers de trois lettres » : `ls ???`. Rappelez-vous que `*` ignore les fichiers cachés.
:::

## 1.3.9 Noms piégeux

Le shell découpe la ligne sur les espaces **avant** de lancer la commande. Un nom qui contient des caractères spéciaux demande donc des précautions.

**Espaces dans un nom** : sans guillemets, c'est deux fichiers.

```bash
touch "mon fichier"
ls mon fichier        # ERREUR : cherche 'mon' puis 'fichier'
ls "mon fichier"      # correct (ou : ls mon\ fichier)
```

```text
ls: cannot access 'mon': No such file or directory
ls: cannot access 'fichier': No such file or directory
mon fichier
```

Les guillemets doubles protègent aussi vos **variables** : écrivez toujours `"$f"` et non `$f` dans une boucle (voir 1.2.7 et 5.1).

**Nom commençant par un tiret** : `rm -rf` serait pris pour des options.

```bash
touch -- -rf          # -- : fin des options
ls                    # affiche -rf (parmi les autres)
rm -- -rf             # ou : rm ./-rf
```

La convention `--` signifie « tout ce qui suit est un argument, pas une option » ; `./-rf` (chemin explicite) fonctionne partout.

**Un joker dans un vrai nom** (`a*b`) :

```bash
touch "a*b" ab axxb
echo a*b         # a*b ab axxb : le motif correspond à TROIS fichiers
ls 'a*b'         # a*b : seulement le fichier au nom littéral
rm 'a*b'         # supprime uniquement celui-là ; rm a*b supprimerait les trois !
```

:::attention Un nom malicieux peut être dangereux
Un fichier appelé `-rf` placé dans un dossier peut transformer `rm *` en `rm -rf ...` (le shell développe `*` en `-rf fichier1 ...`). Prenez l'habitude d'écrire `rm -- *` ou `rm ./*`. Pour supprimer un nom bizarre difficile à taper, utilisez la complétion avec Tab, ou `ls -i` puis `find . -inum 1204680 -delete`.
:::

## 1.3.10 Renommage en masse

Avec une boucle `for` et la substitution de suffixe `${f%motif}` (retire la fin du nom) :

```bash
touch Photo1.JPG Photo2.JPG
for f in *.JPG; do mv -- "$f" "${f%.JPG}.jpg"; done     # change l'extension
for f in *.jpg; do mv -n -- "$f" "img_$f"; done         # ajoute un préfixe
ls
```

```text
img_Photo1.jpg  img_Photo2.jpg
```

| Expression | Rôle |
|---|---|
| `${f%.JPG}` | Retire le suffixe `.JPG` le plus court en fin de valeur |
| `${f#img_}` | Retire le préfixe `img_` en début de valeur |
| `${f/ /_}` | Remplace la première espace par un souligné (`${f// /_}` : toutes) |

Sur Debian/Ubuntu, la commande `rename` (version Perl) fait la même chose en une ligne :

```bash
rename 's/\.JPG$/.jpg/' *.JPG       # expression de substitution Perl
rename -n 's/ /_/g' *               # -n : simulation, affiche sans renommer
```

Sur RHEL/Fedora, `rename` (util-linux) a une autre syntaxe : `rename .JPG .jpg *.JPG`. Dans un examen ou un script portable, préférez la boucle `for`. Faites toujours un essai à blanc avec `echo mv ...` avant de renommer des centaines de fichiers.

## 1.3.11 Bilan : le TP2 complet

Voici la séquence complète, que vous pouvez rejouer :

```bash
mkdir TP2 && cd TP2
printf 'Bonjour\nLinux\n' > Mon_fichier
mkdir Source Data && cd Source && cd ..
rmdir Source
cp Mon_fichier Mon_fichier_2
for f in Mon_fichier Mon_fichier_2; do cp "$f" "$f.old"; done
mkdir Old && mv *.old Old/
ln Mon_fichier_2 Mon_lien
ls -li Mon_lien Mon_fichier_2
rm Mon_lien
ln -s Mon_fichier_2 Mon_nouveau_lien
rm Mon_fichier_2
ls -l Mon_nouveau_lien
du -sh .
cd .. && rm -r TP2
```

## 1.3.12 Exercices corrigés

**Exercice 1.** Donnez une seule commande qui crée l'arborescence `site/css`, `site/js`, `site/img` même si `site` n'existe pas.

<details>
<summary>Voir le corrigé</summary>

```bash
mkdir -p site/{css,js,img}
```

`-p` crée le parent `site`, les accolades sont développées par le shell en `site/css site/js site/img`.

</details>

**Exercice 2.** Quelle commande copie le répertoire `projet` (avec son contenu) vers `/tmp/sauve` en conservant dates et droits ? Donnez la forme la plus courte.

<details>
<summary>Voir le corrigé</summary>

```bash
cp -a projet /tmp/sauve
```

`-a` (archive) équivaut à `-dR --preserve=all` : récursif, liens symboliques copiés tels quels, propriétaire, droits et dates préservés. La forme `cp -rp projet /tmp/sauve` est proche mais plus pauvre : elle ne préserve pas tous les attributs (ACL, attributs étendus).

</details>

**Exercice 3.** Dans `TP2`, copiez chaque fichier `f` en `f.old`, créez le répertoire `Old` et déplacez-y tous les fichiers `.old`.

<details>
<summary>Voir le corrigé</summary>

```bash
for f in Mon_fichier Mon_fichier_2; do cp "$f" "$f.old"; done
mkdir Old
mv *.old Old/
```

La boucle évite de taper deux fois la copie ; `*.old` est développé par le shell en la liste des fichiers.

</details>

**Exercice 4.** Un utilisateur tape `rm *.txt` et se rend compte qu'il aurait dû vérifier avant. Quelle habitude adopter ?

<details>
<summary>Voir le corrigé</summary>

```bash
ls *.txt
rm -i *.txt
```

On teste d'abord le même motif avec `ls` : on voit exactement ce qui sera supprimé. `rm -i` (ou `-I`) ajoute une confirmation. Il n'y a pas de corbeille : une suppression est définitive.

</details>

**Exercice 5.** Créez `Mon_lien`, lien physique de `Mon_fichier_2`, affichez les inodes, puis supprimez `Mon_lien`. Que devient `Mon_fichier_2` ?

<details>
<summary>Voir le corrigé</summary>

```bash
ln Mon_fichier_2 Mon_lien
ls -li Mon_lien Mon_fichier_2
rm Mon_lien
ls -l Mon_fichier_2
```

Les deux noms ont **le même numéro d'inode** et le compteur de liens vaut 2. Après `rm Mon_lien`, le compteur retombe à 1 et `Mon_fichier_2` existe toujours, contenu intact : `rm` ne supprime qu'un nom.

</details>

**Exercice 6.** Créez un lien symbolique `Mon_nouveau_lien` vers `Mon_fichier_2`, puis supprimez `Mon_fichier_2`. Qu'observez-vous ? Comment retrouver les liens cassés d'un répertoire ?

<details>
<summary>Voir le corrigé</summary>

```bash
ln -s Mon_fichier_2 Mon_nouveau_lien
rm Mon_fichier_2
ls -l Mon_nouveau_lien
find . -xtype l
```

Le lien existe encore (`lrwxrwxrwx ... -> Mon_fichier_2`) mais est **cassé** : `cat Mon_nouveau_lien` répond « No such file or directory ». `find . -xtype l` liste les liens dont la cible est introuvable. Le lien symbolique est un chemin, il ne maintient pas la cible en vie.

</details>

**Exercice 7.** Écrivez des commandes qui listent : (a) les fichiers de `/etc` commençant par `a`, `b` ou `c` ; (b) les fichiers de `/etc` dont le nom se termine par `.conf` et comporte exactement 6 caractères avant le point ; (c) tous les fichiers du dossier courant **sauf** les `.txt`.

<details>
<summary>Voir le corrigé</summary>

```bash
ls -d /etc/[abc]*
ls -d /etc/??????.conf
shopt -s extglob; ls -d !(*.txt)
```

`-d` évite d'entrer dans les répertoires listés. `?` représente un caractère exactement. Le motif `!(*.txt)` demande `extglob` ; sans, utilisez `ls | grep -v '\.txt$'`.

</details>

**Exercice 8.** Un répertoire contient les fichiers `mon fichier` et `-rf`. Donnez les commandes pour les supprimer sans dégât.

<details>
<summary>Voir le corrigé</summary>

```bash
rm -- 'mon fichier' -rf
```

Cette forme est piégeante : après `--`, `-rf` est traité comme un nom de fichier, ce qui est le but. Plus lisible : `rm 'mon fichier'` puis `rm -- -rf` (ou `rm ./-rf`). Sans les guillemets, `rm mon fichier` chercherait deux fichiers inexistants.

</details>

**Exercice 9.** Renommez en masse tous les fichiers `*.JPG` du dossier en `*.jpg`, sans `rename`. Comment tester d'abord ?

<details>
<summary>Voir le corrigé</summary>

```bash
for f in *.JPG; do echo mv -- "$f" "${f%.JPG}.jpg"; done   # essai à blanc
for f in *.JPG; do mv -- "$f" "${f%.JPG}.jpg"; done
```

`${f%.JPG}` retire le suffixe `.JPG` ; on le remplace par `.jpg`. Les guillemets autour de `"$f"` protègent les noms contenant des espaces ; `echo` devant `mv` permet de vérifier avant d'agir.

</details>

**Exercice 10.** Quelle est la différence entre mtime et ctime ? Un fichier vient d'être passé en `chmod 600` : lequel change ? Comment les afficher ?

<details>
<summary>Voir le corrigé</summary>

```bash
stat -c 'mtime=%y ctime=%z' fichier
ls -l fichier       # mtime
ls -lc fichier      # ctime
```

`mtime` change quand le **contenu** est modifié ; `ctime` change quand l'**inode** l'est (droits, propriétaire, liens, contenu aussi). Un `chmod 600` modifie seulement le `ctime`. `touch -d` ne peut pas falsifier `ctime`.

</details>

**Exercice 11.** `df -h` montre 40 % d'espace libre mais `touch nouveau` répond « No space left on device ». Quelle est l'explication probable et la vérification ?

<details>
<summary>Voir le corrigé</summary>

```bash
df -i /chemin
```

Le système de fichiers a épuisé ses **inodes** (colonne `IUse%` à 100 %), par exemple à cause de millions de petits fichiers. Il reste des blocs de données mais plus d'inodes pour décrire de nouveaux fichiers. Solution : supprimer les fichiers inutiles ou recréer le système de fichiers avec plus d'inodes.

</details>

**Exercice 12.** Que renvoient `basename /var/log/syslog.1 .1` et `dirname /var/log/syslog.1` ? Quel type de fichier désigne le premier caractère `c` de `crw-rw-rw- 1 root root 1, 3 ... /dev/null` ?

<details>
<summary>Voir le corrigé</summary>

```text
syslog
/var/log
```

`basename` retire le chemin puis le suffixe `.1` ; `dirname` ne garde que le répertoire. Le `c` indique un **périphérique en mode caractère** : `/dev/null` n'est pas un fichier de données mais un point d'accès au pilote (« trou noir » qui avale tout ce qu'on y écrit), d'où les nombres majeur/mineur `1, 3` à la place de la taille.

</details>
