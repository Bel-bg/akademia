## 1.2.1 L'arborescence des fichiers (FHS)

Sous Windows, chaque disque a sa lettre (`C:`, `D:`). Sous Linux, il n'y a **qu'un seul arbre**, dont la racine est `/`. Les disques, clés USB et partitions sont **montés** (« greffés ») sur un répertoire de cet arbre (voir 4.1). L'organisation des répertoires suit une convention, le **FHS** (Filesystem Hierarchy Standard), identique d'une distribution à l'autre : une fois apprise, elle sert partout.

| Répertoire | Contenu |
|---|---|
| `/` | Racine de l'arbre ; tout part d'ici |
| `/bin` | Commandes essentielles (`ls`, `cp`, `cat`) |
| `/sbin` | Commandes d'administration essentielles (`fdisk`, `ip`, `reboot`) |
| `/usr` | Programmes, bibliothèques, documentation installés (`/usr/bin`, `/usr/sbin`, `/usr/lib`, `/usr/share`, `/usr/local`) |
| `/etc` | **Fichiers de configuration** du système et des services (texte) |
| `/home` | Répertoires personnels des utilisateurs (`/home/miracle`) |
| `/root` | Répertoire personnel de **root** (hors de `/home`) |
| `/var` | Données **variables** : journaux (`/var/log`), files d'attente, caches, bases (`/var/lib`), sites web (`/var/www`) |
| `/tmp` | Fichiers temporaires, accessibles à tous, vidés au redémarrage ou périodiquement |
| `/dev` | Fichiers de **périphériques** (`/dev/sda`, `/dev/null`, `/dev/tty`) |
| `/proc` | Système de fichiers **virtuel** : processus et état du noyau (`/proc/cpuinfo`, `/proc/1/`) |
| `/sys` | Système de fichiers virtuel : matériel et pilotes vus par le noyau |
| `/boot` | Noyau (`vmlinuz-*`), image `initrd`, chargeur d'amorçage GRUB |
| `/lib`, `/lib64` | Bibliothèques partagées nécessaires aux programmes de `/bin` et `/sbin` |
| `/mnt` | Point de montage **manuel** temporaire |
| `/media` | Montage **automatique** des supports amovibles (clé USB, DVD) |
| `/opt` | Logiciels tiers autonomes (`/opt/google/chrome`) |
| `/srv` | Données servies par le système (FTP, web, selon la politique du site) |
| `/run` | Données d'exécution depuis le démarrage (PID, sockets), en mémoire |
| `lost+found` | Présent à la racine de chaque système de fichiers ext4 : `fsck` y dépose les fragments de fichiers récupérés |

Sur les distributions récentes, `/bin`, `/sbin` et `/lib` sont de simples **liens symboliques** vers `/usr/bin`, `/usr/sbin` et `/usr/lib` (fusion « usrmerge »). On le vérifie :

```bash
ls -ld /bin /sbin /lib
```

```text
lrwxrwxrwx 1 root root 7 Apr 22  2024 /bin -> usr/bin
lrwxrwxrwx 1 root root 8 Apr 22  2024 /sbin -> usr/sbin
lrwxrwxrwx 1 root root 7 Apr 22  2024 /lib -> usr/lib
```

```bash
ls /
```

```text
bin   boot  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
```

:::retenir Où chercher quoi
Configuration : `/etc`. Journaux : `/var/log`. Données d'un utilisateur : `/home/nom`. Périphériques : `/dev`. Informations noyau : `/proc` et `/sys`. Noyau et GRUB : `/boot`. Programmes installés : `/usr/bin`. Fichiers temporaires : `/tmp`.
:::

## 1.2.2 Chemins et navigation

Un **chemin absolu** commence par `/` et décrit le trajet depuis la racine : `/etc/ssh/sshd_config`. Un **chemin relatif** ne commence pas par `/` et part du répertoire courant : `ssh/sshd_config` (si l'on est dans `/etc`).

| Symbole | Signification |
|---|---|
| `.` | Le répertoire courant |
| `..` | Le répertoire parent |
| `~` | Le répertoire personnel de l'utilisateur (`$HOME`) ; `~amina` : celui d'amina |
| `-` | Le répertoire précédent (avec `cd -`) |

```bash
pwd                 # affiche le répertoire courant
cd /var/log         # chemin absolu
cd ..               # remonte à /var
cd log/apt          # chemin relatif : /var/log/apt
cd                  # sans argument : retour au répertoire personnel
cd ~/Documents      # sous le répertoire personnel
cd -                # retour au répertoire précédent (et l'affiche)
```

```text
$ pwd
/home/miracle
$ cd /var/log
$ cd -
/home/miracle
```

`CDPATH` liste des répertoires dans lesquels `cd` cherche un chemin relatif, comme `PATH` pour les commandes : avec `export CDPATH=.:/var`, `cd log` mène à `/var/log` depuis n'importe où (s'il n'existe pas de `log` dans le répertoire courant).

### `ls` et ses options

| Option | Effet |
|---|---|
| `-l` | Format long : droits, liens, propriétaire, groupe, taille, date, nom |
| `-a` | Tous les fichiers, y compris cachés (commençant par `.`) |
| `-A` | Comme `-a`, sans `.` ni `..` |
| `-h` | Tailles lisibles (K, M, G), avec `-l` |
| `-t` / `-r` | Tri par date (récent d'abord) / ordre inversé |
| `-S` | Tri par taille décroissante |
| `-R` | Récursif |
| `-d` | Affiche le répertoire lui-même, pas son contenu |
| `-i` | Affiche le numéro d'inode |
| `-F` | Suffixe de type : `/` répertoire, `*` exécutable, `@` lien |

```bash
ls -lh /etc/hostname
```

```text
-rw-r--r-- 1 root root 6 Apr 22  2024 /etc/hostname
```

`ls -lrt` (du plus ancien au plus récent) est très utilisé pour voir ce qui a changé en dernier. La lecture d'une ligne `ls -l` est détaillée en 1.3 et 2.2.

## 1.2.3 Variables d'environnement

Une **variable** associe un nom à une valeur. Une variable **d'environnement** est transmise aux programmes lancés depuis le shell. Par convention, les noms sont en majuscules. On affecte **sans espace** autour du `=` et on lit avec `$` :

```bash
VILLE=Cotonou
echo $VILLE
echo "Bienvenue à ${VILLE}-centre"
```

```text
Cotonou
Bienvenue à Cotonou-centre
```

Une variable simplement affectée n'est visible que dans le shell courant. Pour qu'elle soit **héritée** par les programmes et sous-shells, on l'**exporte** :

```bash
export VILLE=Cotonou      # affectation + export
bash -c 'echo $VILLE'     # le sous-shell la voit
unset VILLE               # suppression
```

### Variables essentielles

| Variable | Rôle |
|---|---|
| `HOME` | Répertoire personnel |
| `USER` | Nom de l'utilisateur |
| `SHELL` | Shell de connexion de l'utilisateur |
| `PATH` | Liste de répertoires (séparés par `:`) où chercher les commandes |
| `PWD`, `OLDPWD` | Répertoire courant, précédent |
| `PS1` | Aspect de l'invite de commande |
| `LANG` | Langue et encodage (`fr_FR.UTF-8`) |
| `$?` | **Code de retour** de la dernière commande (0 = succès) |
| `$$` | PID du shell courant |
| `$!` | PID du dernier processus lancé en arrière-plan |

```bash
ls /etc/hostname; echo $?
ls /inexistant; echo $?
```

```text
/etc/hostname
0
ls: cannot access '/inexistant': No such file or directory
2
```

### Consulter l'environnement

| Commande | Affiche |
|---|---|
| `env` ou `printenv` | Les variables **exportées** ; `printenv HOME` affiche une seule valeur |
| `set` | **Toutes** les variables et fonctions du shell (très long) |
| `export` (sans argument) | Les variables exportées, au format `declare -x` |

L'invite est contrôlée par `PS1`. Exemple courant : `PS1='\u@\h:\w\$ '` où `\u` est l'utilisateur, `\h` la machine, `\w` le répertoire courant et `\$` le caractère `$` (ou `#` pour root).

## 1.2.4 La variable PATH : comment le shell trouve les commandes

Quand vous tapez `ls`, le shell parcourt, **dans l'ordre**, les répertoires listés dans `PATH` jusqu'à trouver un exécutable de ce nom.

```bash
echo $PATH
```

```text
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
```

Pour ajouter un répertoire (par exemple `~/bin` pour vos scripts), on le **concatène** sans écraser l'ancien contenu :

```bash
export PATH="$PATH:$HOME/bin"
```

:::attention Le « . » dans PATH
Ne mettez jamais `.` (répertoire courant) ni un champ vide dans `PATH`, surtout en tête. Un utilisateur malveillant pourrait déposer dans `/tmp` un faux script nommé `ls` : l'administrateur qui tape `ls` dans ce répertoire l'exécuterait avec ses droits. C'est pourquoi on lance un script local avec `./script.sh` et non `script.sh`.
:::

### Retrouver l'origine d'une commande

| Commande | Rôle | Exemple de sortie |
|---|---|---|
| `type cmd` | Dit **comment le shell interprète** le nom (alias, interne, fichier) | `ls is aliased to 'ls --color=auto'` |
| `type -a cmd` | Toutes les définitions, par ordre de priorité | |
| `which cmd` | Chemin de l'exécutable trouvé dans `PATH` | `/usr/bin/ls` |
| `whereis cmd` | Binaire, source et page de manuel | `ls: /usr/bin/ls /usr/share/man/man1/ls.1.gz` |
| `command -v cmd` | Version portable pour les scripts ; affiche chemin, alias ou nom d'interne | `/usr/bin/ls` |

```bash
type cd
type ls
```

```text
cd is a shell builtin
ls is /usr/bin/ls
```

Les commandes **internes** (`cd`, `export`, `alias`…) sont intégrées au shell, sans fichier exécutable propre : `which cd` peut ne rien afficher alors que `type cd` répond. Dans un script, on teste l'existence d'une commande avec `command -v`.

### Alias

Un **alias** est un raccourci personnel :

```bash
alias ll='ls -lh'
alias maj='sudo apt update && sudo apt upgrade -y'
alias            # liste les alias
unalias ll       # supprime l'alias
```

Un alias défini dans un terminal disparaît à sa fermeture. Pour le garder, on l'écrit dans `~/.bashrc`.

## 1.2.5 Fichiers de démarrage de bash

Quand bash démarre, il lit des fichiers de configuration qui dépendent de la façon dont il est lancé.

- Un shell de **connexion** (**login**) est lancé à l'ouverture de session sur une console, par SSH, ou avec `bash -l` / `su -`.
- Un shell **interactif non-login** est lancé quand vous ouvrez un terminal graphique ou tapez `bash` dans un terminal.

| Fichier | Lu par | Usage |
|---|---|---|
| `/etc/profile` | Shell **login**, pour tous | Configuration globale ; lit aussi `/etc/profile.d/*.sh` |
| `~/.bash_profile` ou `~/.bash_login` ou `~/.profile` | Shell **login** (le premier trouvé) | Configuration personnelle de connexion (PATH, variables) |
| `~/.bashrc` | Shell **non-login interactif** | Alias, fonctions, invite |
| `/etc/bash.bashrc` | Non-login, pour tous (Debian/Ubuntu) | Configuration globale |
| `~/.bash_logout` | À la déconnexion d'un shell login | Nettoyage |

Sur Ubuntu, `~/.profile` charge `~/.bashrc` s'il existe : vos alias sont donc disponibles dans les deux cas. Sur RHEL/Fedora, c'est `~/.bash_profile` qui joue ce rôle. Après modification, on relit un fichier **sans se reconnecter** avec `source` (ou son équivalent `.`) :

```bash
echo 'alias ll="ls -lh"' >> ~/.bashrc
source ~/.bashrc
```

## 1.2.6 Historique, complétion et raccourcis

bash garde les commandes tapées, ce qui évite de tout retaper.

```bash
history          # liste numérotée
history 5        # les 5 dernières
```

```text
  498  cd /var/log
  499  ls -l
  500  history 5
```

| Saisie | Effet |
|---|---|
| `!!` | Relance la dernière commande (`sudo !!` : la même avec sudo) |
| `!n` | Relance la commande numéro `n` |
| `!texte` | Relance la dernière commande commençant par `texte` |
| `!$` | Dernier argument de la commande précédente |
| `Ctrl+R` | Recherche incrémentale dans l'historique (Ctrl+R de nouveau : suivant) |
| Flèches haut / bas | Parcourt l'historique |
| `history -d n` / `history -c` | Supprime la ligne `n` / efface l'historique de la session |

L'historique est conservé en mémoire pendant la session puis écrit dans `~/.bash_history` à la déconnexion. Trois variables le règlent (à placer dans `~/.bashrc`) :

```bash
HISTSIZE=5000                    # nombre de lignes gardées en mémoire
HISTFILESIZE=10000               # nombre de lignes gardées dans ~/.bash_history
HISTTIMEFORMAT="%F %T  "         # ajoute la date et l'heure dans history
```

### Complétion et raccourcis clavier

La touche **Tab** complète un nom de commande, de fichier ou de répertoire ; deux appuis affichent toutes les possibilités. Elle évite les fautes de frappe. Les raccourcis de la ligne de commande :

| Raccourci | Effet |
|---|---|
| `Ctrl+A` / `Ctrl+E` | Début / fin de ligne |
| `Ctrl+U` / `Ctrl+K` | Efface du curseur au début / à la fin de la ligne |
| `Ctrl+W` | Efface le mot précédent |
| `Alt+B` / `Alt+F` | Recule / avance d'un mot |
| `Ctrl+L` | Efface l'écran (comme `clear`) |
| `Ctrl+C` | **Interrompt** le programme en cours |
| `Ctrl+D` | Fin de saisie (EOF) ; à l'invite vide : ferme le shell |
| `Ctrl+Z` | Suspend le programme (voir 3.1) |

## 1.2.7 Guillemets et enchaînements de commandes

Le shell interprète certains caractères (`$`, `*`, espace, `;`…). Le **quoting** sert à lui dire de ne pas le faire.

| Forme | Effet | Exemple (avec `X=Cotonou`) |
|---|---|---|
| `'...'` apostrophes | **Aucune** interprétation | `echo '$X'` affiche `$X` |
| `"..."` guillemets | Les variables (`$X`) et `$(...)` sont développées ; le reste est littéral | `echo "$X"` affiche `Cotonou` |
| `\` antislash | Protège le caractère suivant | `echo \$X` affiche `$X` |
| `$(commande)` | Remplacé par la **sortie** de la commande | `echo "Année : $(date +%Y)"` affiche `Année : 2026` |

```bash
echo "Nous sommes en $(date +%Y), utilisateur $USER"
echo 'Le prix est de 5$ ou $X'
```

```text
Nous sommes en 2026, utilisateur miracle
Le prix est de 5$ ou $X
```

On enchaîne les commandes de trois manières :

| Opérateur | Signification |
|---|---|
| `cmd1 ; cmd2` | Exécute `cmd2` après `cmd1`, quel que soit le résultat |
| `cmd1 && cmd2` | Exécute `cmd2` **seulement si** `cmd1` réussit (code 0) |
| `cmd1 \|\| cmd2` | Exécute `cmd2` **seulement si** `cmd1` échoue |

```bash
mkdir projet && cd projet && echo "Créé"
cd /inexistant || echo "Répertoire introuvable"
ping -c1 -W2 8.8.8.8 > /dev/null && echo "en ligne" || echo "hors ligne"
```

:::examen `&&` contre `;`
Question classique : « Que fait `mkdir rep && cd rep` ? ». Il crée `rep` et n'y entre que si la création a réussi. Avec `;`, `cd rep` serait tenté même après un échec. Dans `a && b || c`, `c` s'exécute si `a` échoue **ou** si `b` échoue.
:::

## 1.2 Exercices corrigés

**Exercice 1.** Dans quels répertoires trouve-t-on : la configuration du serveur SSH, les journaux du système, le répertoire personnel de l'utilisateur `amina`, le noyau et GRUB ?

<details>
<summary>Voir le corrigé</summary>

```text
/etc/ssh/sshd_config
/var/log
/home/amina
/boot
```

La configuration est dans `/etc`, les journaux dans `/var/log`, les répertoires personnels dans `/home`, le noyau et GRUB dans `/boot`.

</details>

**Exercice 2.** Vous êtes dans `/var/log/apt`. Donnez trois commandes différentes pour aller dans `/etc`, puis la commande pour revenir au répertoire précédent.

<details>
<summary>Voir le corrigé</summary>

```bash
cd /etc
cd ../../../etc
cd -P /etc
cd -
```

`cd /etc` est un chemin absolu. Le chemin relatif remonte de trois niveaux (`apt`, `log`, `var`) puis redescend dans `etc`. `cd -` revient au répertoire précédent (`/var/log/apt`) et l'affiche.

</details>

**Exercice 3.** Donnez la commande qui liste, avec tailles lisibles et du plus récent au plus ancien, tous les fichiers (cachés compris) du répertoire courant.

<details>
<summary>Voir le corrigé</summary>

```bash
ls -lath
```

`-l` format long, `-a` fichiers cachés, `-t` tri par date de modification (récent d'abord), `-h` tailles lisibles. Avec `-r` en plus, l'ordre serait inversé.

</details>

**Exercice 4.** Créez une variable `PROJET` valant `eneam`, vérifiez qu'un sous-shell ne la voit pas, puis exportez-la et vérifiez à nouveau.

<details>
<summary>Voir le corrigé</summary>

```bash
PROJET=eneam
bash -c 'echo "[$PROJET]"'
export PROJET
bash -c 'echo "[$PROJET]"'
```

```text
[]
[eneam]
```

Une variable non exportée reste locale au shell courant ; `export` la transmet aux processus enfants. On pouvait écrire directement `export PROJET=eneam`.

</details>

**Exercice 5.** Ajoutez `/opt/outils/bin` à la fin de `PATH` pour la session courante, puis rendez le changement permanent pour votre utilisateur.

<details>
<summary>Voir le corrigé</summary>

```bash
export PATH="$PATH:/opt/outils/bin"
echo 'export PATH="$PATH:/opt/outils/bin"' >> ~/.bashrc
source ~/.bashrc
```

On concatène à la valeur existante (écrire `PATH=/opt/outils/bin` écraserait tout et casserait presque toutes les commandes). Le fichier `~/.bashrc` est relu à chaque nouveau terminal.

</details>

**Exercice 6.** Pourquoi est-il dangereux d'avoir `.` dans `PATH` ? Comment lancer un script du répertoire courant sans cela ?

<details>
<summary>Voir le corrigé</summary>

Avec `.` dans `PATH`, le shell exécute un fichier du répertoire courant portant le nom d'une commande usuelle ; un attaquant peut y placer un faux `ls` qui s'exécutera avec les droits de la victime (par exemple root). On lance un script local en indiquant explicitement son chemin :

```bash
./script.sh
```

</details>

**Exercice 7.** Quelles sont les différences entre `type`, `which` et `command -v` ? Que renvoie `type cd` ?

<details>
<summary>Voir le corrigé</summary>

```bash
type cd
which ls
command -v ls
```

`type cd` répond `cd is a shell builtin`. `type` sait reconnaître alias, fonctions, commandes internes et fichiers ; `which` ne cherche que des fichiers exécutables dans `PATH` ; `command -v` est la forme portable pour tester l'existence d'une commande dans un script (par exemple `command -v git > /dev/null || echo "git manquant"`).

</details>

**Exercice 8.** Créez l'alias `ll` valant `ls -lh`, disponible à chaque ouverture de terminal.

<details>
<summary>Voir le corrigé</summary>

```bash
echo "alias ll='ls -lh'" >> ~/.bashrc
source ~/.bashrc
```

On ajoute la définition au fichier lu par les shells interactifs non-login. `source` la prend en compte immédiatement. Sans cette écriture, l'alias disparaîtrait avec le terminal.

</details>

**Exercice 9.** Que s'affiche-t-il ?

```bash
X=Benin
echo '$X' "$X" "$(echo $X | tr a-z A-Z)"
```

<details>
<summary>Voir le corrigé</summary>

```text
$X Benin BENIN
```

Les apostrophes empêchent toute interprétation ; les guillemets développent `$X` ; `$(...)` est remplacé par la sortie de la commande interne (ici `tr` met en majuscules).

</details>

**Exercice 10.** Expliquez ce que font ces trois lignes et ce qu'elles affichent si `/data` n'existe pas.

```bash
cd /data && echo "ok" || echo "echec"
cd /data ; echo "ok"
mkdir /tmp/a && cd /tmp/a && pwd
```

<details>
<summary>Voir le corrigé</summary>

```text
bash: cd: /data: No such file or directory
echec
bash: cd: /data: No such file or directory
ok
/tmp/a
```

Ligne 1 : `cd` échoue, donc `echo "ok"` est sauté et `echo "echec"` s'exécute. Ligne 2 : `;` n'attend pas le résultat, donc `ok` s'affiche malgré l'échec. Ligne 3 : chaque commande ne s'exécute que si la précédente a réussi (la ligne n'affiche `/tmp/a` que si `/tmp/a` n'existait pas déjà).

</details>

**Exercice 11.** Dans quels cas `~/.bashrc` est-il lu, et dans quels cas `~/.profile` ? Que se passe-t-il quand vous modifiez `HISTSIZE` dans `.bashrc` ?

<details>
<summary>Voir le corrigé</summary>

`~/.profile` (ou `~/.bash_profile`) est lu par un shell de **connexion** (console, SSH, `su -`). `~/.bashrc` est lu par un shell **interactif non-login** (nouveau terminal graphique, commande `bash`). Sur Ubuntu, `~/.profile` charge `~/.bashrc`. La modification de `HISTSIZE` ne s'applique qu'à un shell qui relit le fichier : ouvrez un nouveau terminal ou tapez `source ~/.bashrc`.

</details>

**Exercice 12.** Vous avez tapé `apt update` sans `sudo` et obtenu « Permission denied ». Quelle commande relance la précédente avec les droits qu'il faut ? Quelle recherche retrouve rapidement une commande `ssh` tapée hier ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo !!
history | grep ssh
```

`!!` est remplacé par la dernière commande. On peut aussi presser `Ctrl+R` puis taper `ssh` pour une recherche incrémentale, ou utiliser `!ssh` pour relancer la dernière commande commençant par `ssh`.

</details>
