## 1.1.1 Unix, GNU et Linux : de quoi parle-t-on ?

Un ordinateur est comme un restaurant : les clients (vous et vos programmes) passent commande, la cuisine (le matériel) prépare, et entre les deux il faut un chef de salle qui répartit le travail. Ce chef de salle, c'est le **système d'exploitation**. Linux en est un.

**Unix** naît en 1969 aux laboratoires Bell (Ken Thompson, Dennis Ritchie). Il est écrit en langage C, ce qui le rend portable d'une machine à l'autre, et il inspire de nombreux descendants (BSD, macOS, Solaris, AIX). En 1983, Richard Stallman lance le projet **GNU** (« GNU's Not Unix ») : réécrire en logiciel libre tous les outils d'un système Unix (le compilateur `gcc`, le shell `bash`, les commandes `ls`, `cp`, `grep`…). Il manquait le noyau. En 1991, l'étudiant finlandais **Linus Torvalds** publie le sien : **Linux**. L'assemblage donne le système **GNU/Linux**.

Précision importante : strictement, « Linux » désigne uniquement le **noyau** (kernel). Ce que l'on installe (Ubuntu, Debian, Fedora…) est une **distribution** : noyau + outils GNU + gestionnaire de paquets + logiciels.

### Noyau (kernel space) et espace utilisateur (userland)

| Couche | Rôle | Exemples |
|---|---|---|
| **Matériel** | Processeur, mémoire, disques, cartes réseau | |
| **Noyau** (kernel space) | Gère la mémoire, les processus, les pilotes, les systèmes de fichiers, le réseau ; seul à parler au matériel | `vmlinuz`, modules `.ko` |
| **Userland** (espace utilisateur) | Programmes ordinaires ; demandent des services au noyau via des **appels système** | shell, `ls`, `firefox`, `nginx` |

Un programme de l'userland ne touche jamais directement le disque : il demande au noyau (appel système `open`, `read`, `write`…). Cette séparation protège le système : un programme qui plante ne fait pas tomber la machine. Le shell est un programme de l'userland comme un autre.

### Un système multitâche et multi-utilisateur

- **Multitâche** : le noyau répartit le temps du processeur entre de nombreux processus, qui semblent s'exécuter en même temps (voir 3.1).
- **Multi-utilisateur** : plusieurs comptes coexistent, chacun avec ses fichiers et ses droits ; plusieurs personnes peuvent même être connectées simultanément (voir 2.1).

### La philosophie Unix

1. **Tout est fichier** : documents, répertoires, disques (`/dev/sda`), terminaux, processus (`/proc`), tubes… On les manipule avec les mêmes outils (`cat`, `cp`, redirections).
2. **Un programme, une tâche** : de petits outils qui font une seule chose, mais bien (`sort` trie, `wc` compte, `grep` filtre).
3. **Les outils se combinent** : la sortie de l'un devient l'entrée du suivant grâce aux **tubes** (voir 1.4). Un programme qui lit l'entrée standard, transforme, écrit sur la sortie standard s'appelle un **filtre**.
4. **Le texte est l'interface universelle** : les configurations sont des fichiers texte lisibles, modifiables avec un simple éditeur (voir 1.5).

:::retenir Linux = noyau, distribution = assemblage
Linux est le **noyau** ; GNU fournit les **outils** ; une **distribution** (Ubuntu, Debian, Fedora, Rocky…) empaquette le tout avec un gestionnaire de paquets. Retenez aussi : « tout est fichier » et « petits outils combinés par des tubes ».
:::

## 1.1.2 Les distributions

Toutes les distributions partagent le même noyau et les mêmes outils de base ; elles diffèrent par leur gestionnaire de paquets, leurs cycles de publication et leurs choix par défaut.

| Famille | Exemples | Format de paquet | Outils de paquets | Usage typique |
|---|---|---|---|---|
| **Debian / Ubuntu** | Debian, Ubuntu, Linux Mint | `.deb` | `apt`, `dpkg` | Serveurs, postes, cloud ; **référence de ce cours** |
| **RHEL / Fedora** | RHEL, Rocky, AlmaLinux, CentOS Stream, Fedora | `.rpm` | `dnf` (anciennement `yum`), `rpm` | Entreprises, serveurs supportés longtemps |
| Autres | Arch, Alpine, openSUSE | variés | `pacman`, `apk`, `zypper` | Usages spécifiques |

Les versions **LTS** (Long Term Support) d'Ubuntu (22.04, 24.04) reçoivent des mises à jour de sécurité pendant au moins cinq ans : c'est le choix usuel pour un serveur. L'installation et la gestion des paquets sont détaillées en annexe A et en 3.4.

## 1.1.3 Shells et terminaux

Il ne faut pas confondre trois notions.

- Le **terminal** (ou émulateur de terminal) : la fenêtre où l'on tape et où le texte s'affiche. Sur un serveur, on y accède souvent à distance par SSH (voir 4.4).
- Le **shell** : le programme qui lit vos commandes, les interprète et lance les programmes. Il fait aussi office de langage de script (voir 5.1).
- La **console** : le terminal physique ou virtuel du système (Ctrl+Alt+F3 sur un poste de travail).

Les shells courants : **`bash`** (Bourne Again SHell, par défaut sur Ubuntu/Debian/RHEL), `sh` (shell POSIX minimal ; sur Debian/Ubuntu c'est `dash`), `zsh`, `fish`. Le shell d'un compte est le 7e champ de `/etc/passwd` (voir 2.1). L'invite (prompt) se termine par `$` pour un utilisateur ordinaire et par `#` pour root :

```text
miracle@srv01:~$
root@srv01:~#
```

### Structure d'une commande

```text
commande [options] [arguments]
```

```bash
ls -l /etc
```

- `ls` : la **commande** ;
- `-l` : une **option** (forme courte : un tiret, une lettre ; forme longue : deux tirets et un mot, comme `--all`) ;
- `/etc` : l'**argument** (ce sur quoi la commande travaille).

Les options courtes se regroupent : `ls -l -a -h` équivaut à `ls -lah`. Le shell découpe la ligne sur les espaces, et **Linux distingue majuscules et minuscules** : `ls` existe, `LS` non. Pour taper plusieurs commandes, on les sépare par `;` (voir 1.2). Pour couper une longue commande sur plusieurs lignes, on termine la ligne par `\`.

## 1.1.4 Obtenir de l'aide

Un administrateur n'apprend pas toutes les options par cœur : il sait où les retrouver. Sur la machine, la documentation est toujours disponible, même sans Internet.

### `man` : le manuel

```bash
man ls
```

On navigue comme dans `less` : flèches ou Espace pour avancer, `b` pour reculer, `/mot` pour chercher (puis `n` pour l'occurrence suivante), `q` pour quitter. Une page comporte les rubriques NAME, SYNOPSIS (la syntaxe), DESCRIPTION (les options), EXAMPLES, SEE ALSO. Dans le SYNOPSIS, les crochets `[ ]` désignent ce qui est facultatif.

Le manuel est divisé en **sections** numérotées :

| Section | Contenu | Exemple |
|---|---|---|
| 1 | Commandes utilisateur | `ls`, `cp` |
| 2 | Appels système (noyau) | `open`, `fork` |
| 3 | Fonctions des bibliothèques C | `printf`, `malloc` |
| 4 | Fichiers spéciaux (périphériques) | `null`, `tty` |
| 5 | Formats de fichiers et configuration | `passwd`, `fstab` |
| 6 | Jeux | |
| 7 | Divers (conventions, protocoles) | `hier`, `regex` |
| 8 | Commandes d'administration | `mount`, `useradd` |
| 9 | Interfaces internes du noyau (rare) | |

Certains noms existent dans plusieurs sections : `passwd` est à la fois une commande (section 1) et un fichier (section 5). On précise la section avant le nom :

```bash
man 5 passwd      # le format du fichier /etc/passwd
man 1 passwd      # la commande passwd
```

### Rechercher dans le manuel

```bash
man -k copy       # équivaut à : apropos copy
```

```text
cp (1)               - copy files and directories
cpio (1)             - copy files to and from archives
```

`apropos` cherche un mot dans les descriptions courtes ; `whatis cp` affiche la description d'une seule commande :

```bash
whatis cp
```

```text
cp (1)               - copy files and directories
```

Si `man -k` ne renvoie rien (base de données absente), l'administrateur lance `sudo mandb`.

### `help`, `--help` et `info`

Les commandes **internes** du shell (`cd`, `export`, `alias`, `type`…) n'ont pas de page `man` propre : on utilise `help cd`. Les programmes externes acceptent presque tous `--help`, qui affiche un résumé rapide :

```bash
help cd
ls --help | less
info coreutils 'ls invocation'
```

`info` est le format de documentation GNU, parfois plus détaillé que `man`. Enfin, `/usr/share/doc/NOM/` contient souvent des exemples et des README.

:::examen Quelle aide, pour quel cas ?
« Comment obtenir de l'aide sur une commande ? » Réponse type : `man commande` (section précisée par `man 5 fichier`), `commande --help`, `help` pour les commandes internes du shell, `apropos mot` ou `man -k mot` pour chercher quand on ne connaît pas le nom, `whatis` pour une description en une ligne, `info` pour la doc GNU.
:::

## 1.1.5 Connaître le système et la session

### Identifier la machine et la distribution

```bash
uname -a
```

```text
Linux srv01 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC Fri Aug 30 12:02:04 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
```

Les options utiles : `uname -s` (nom du noyau : `Linux`), `uname -n` (nom de machine), `uname -r` (**version du noyau**), `uname -m` (architecture : `x86_64`).

```bash
lsb_release -a        # nécessite le paquet lsb-release
cat /etc/os-release   # présent partout, lisible par les scripts
```

```text
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 24.04.1 LTS
Release:        24.04
Codename:       noble
```

```text
PRETTY_NAME="Ubuntu 24.04.1 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"
VERSION="24.04.1 LTS (Noble Numbat)"
ID=ubuntu
ID_LIKE=debian
```

`/etc/os-release` est la source la plus fiable : le champ `ID_LIKE` indique la famille (`debian`, ou `"rhel fedora"` sur Rocky). Pour afficher le nom de la machine : `hostname` (ou `hostnamectl` sous systemd).

### Savoir qui l'on est

```bash
whoami
id
```

```text
miracle
uid=1000(miracle) gid=1000(miracle) groups=1000(miracle),27(sudo),100(users)
```

`whoami` donne le nom du compte courant ; `id` donne l'UID, le GID principal et tous les groupes (voir 2.1).

### Qui est connecté, depuis quand ?

```bash
who
```

```text
miracle  pts/0   2026-11-06 08:12 (192.168.1.20)
amina    tty1    2026-11-06 07:45
```

`pts/N` désigne un pseudo-terminal (fenêtre ou SSH), `tty` une console. `w` ajoute ce que fait chaque utilisateur et la charge :

```bash
w
```

```text
 08:30:11 up 2 days,  3:12,  2 users,  load average: 0.05, 0.10, 0.08
USER     TTY      FROM             LOGIN@   IDLE   WHAT
miracle  pts/0    192.168.1.20     08:12    0.00s  w
amina    tty1     -                07:45    1:02m  -bash
```

```bash
uptime
```

```text
 08:30:11 up 2 days,  3:12,  2 users,  load average: 0.05, 0.10, 0.08
```

`uptime` indique l'heure, la durée de fonctionnement, le nombre d'utilisateurs et la **charge moyenne** sur 1, 5 et 15 minutes (le nombre moyen de processus en attente du processeur).

### Date, heure et fuseau

```bash
date
date +"%d/%m/%Y %H:%M"
timedatectl
```

```text
Fri Nov  6 08:30:11 WAT 2026
06/11/2026 08:30
               Local time: Fri 2026-11-06 08:30:11 WAT
           Universal time: Fri 2026-11-06 07:30:11 UTC
                Time zone: Africa/Porto-Novo (WAT, +0100)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```

Les formats courants de `date +` : `%d` jour, `%m` mois, `%Y` année, `%H` heure, `%M` minute, `%S` seconde. Changer le fuseau : `sudo timedatectl set-timezone Africa/Porto-Novo` (liste : `timedatectl list-timezones`).

:::attention Ne pas confondre `who`, `whoami` et `id`
`whoami` répond à « quel compte suis-je ? » ; `who` répond à « qui est connecté sur la machine ? » ; `id` répond à « quels sont mes UID et groupes ? ». Après un `su` ou un `sudo`, `whoami` change (`root`), pas `who` (qui affiche les sessions de connexion).
:::

## 1.1.6 Récapitulatif

| Besoin | Commande |
|---|---|
| Aide complète / section précise | `man cmd` / `man 5 fichier` |
| Chercher par mot-clé | `man -k mot` ou `apropos mot` |
| Description en une ligne | `whatis cmd` |
| Aide d'une commande interne / externe | `help cmd` / `cmd --help` |
| Noyau, architecture | `uname -a`, `uname -r` |
| Distribution | `cat /etc/os-release`, `lsb_release -a` |
| Compte courant, UID, groupes | `whoami`, `id` |
| Sessions ouvertes | `who`, `w` |
| Durée de fonctionnement et charge | `uptime` |
| Date, fuseau, NTP | `date`, `timedatectl` |

## 1.1 Exercices corrigés

**Exercice 1.** Quelle est la différence entre Linux, GNU/Linux et une distribution ?

<details>
<summary>Voir le corrigé</summary>

Linux est uniquement le noyau (créé par Linus Torvalds en 1991). GNU/Linux désigne le système complet : noyau Linux plus les outils GNU (bash, coreutils, gcc…). Une distribution (Ubuntu, Fedora…) est un assemblage prêt à installer : noyau, outils, gestionnaire de paquets, logiciels et configuration par défaut.

</details>

**Exercice 2.** Expliquez la différence entre le noyau (kernel space) et l'espace utilisateur (userland). Dans quel espace tourne `bash` ?

<details>
<summary>Voir le corrigé</summary>

Le noyau est le seul à accéder directement au matériel, à la mémoire et aux processus ; l'userland regroupe les programmes ordinaires, qui demandent des services au noyau par des appels système. `bash` tourne dans l'userland, comme `ls` ou `firefox`.

</details>

**Exercice 3.** Citez trois principes de la philosophie Unix et donnez un exemple pour chacun.

<details>
<summary>Voir le corrigé</summary>

- Tout est fichier : `/dev/sda` représente un disque, `/proc/cpuinfo` expose des informations du noyau, et on les lit avec `cat`.
- Un outil, une tâche : `sort` trie, `wc` compte, `grep` filtre.
- Combinaison par tubes : `cat /etc/passwd | cut -d: -f1 | sort` enchaîne trois filtres.

</details>

**Exercice 4.** Donnez la commande qui affiche la version du noyau, puis celle qui affiche le nom et la version de la distribution.

<details>
<summary>Voir le corrigé</summary>

```bash
uname -r
cat /etc/os-release
```

`uname -r` affiche par exemple `6.8.0-45-generic`. `lsb_release -a` convient aussi si le paquet `lsb-release` est installé.

</details>

**Exercice 5.** Vous voulez lire la documentation du **fichier** `/etc/passwd` (et non de la commande `passwd`). Quelle commande tapez-vous ? Et si vous ne connaissez pas le nom de la commande qui copie des fichiers ?

<details>
<summary>Voir le corrigé</summary>

```bash
man 5 passwd
man -k copy
```

Le fichier est documenté en section 5, la commande en section 1. `man -k copy` (équivalent à `apropos copy`) cherche « copy » dans les descriptions des pages et fait apparaître `cp`.

</details>

**Exercice 6.** `cd` est une commande interne. Comment obtenir son aide, sachant que `man cd` ne donne rien d'utile ?

<details>
<summary>Voir le corrigé</summary>

```bash
help cd
```

Les commandes internes au shell sont décrites par `help` (et par `man bash`). `type cd` confirme qu'il s'agit d'une commande interne (`cd is a shell builtin`).

</details>

**Exercice 7.** Décomposez `ls -la /var/log` : commande, options, argument. Écrivez deux autres façons d'écrire les options.

<details>
<summary>Voir le corrigé</summary>

Commande : `ls` ; options : `-l` (format long) et `-a` (fichiers cachés inclus) ; argument : `/var/log`.

```bash
ls -l -a /var/log
ls -al /var/log
```

Les options courtes se regroupent dans n'importe quel ordre. La forme longue de `-a` est `--all`.

</details>

**Exercice 8.** Quelle commande affiche l'heure sous la forme `06/11/2026 08:30` ? Quelle commande donne le fuseau horaire et indique si l'horloge est synchronisée ?

<details>
<summary>Voir le corrigé</summary>

```bash
date +"%d/%m/%Y %H:%M"
timedatectl
```

Dans le format, `%d` est le jour, `%m` le mois, `%Y` l'année sur quatre chiffres, `%H` l'heure et `%M` les minutes. `timedatectl` affiche `Time zone` et `System clock synchronized`.

</details>

**Exercice 9.** Quelle différence entre `who`, `w`, `whoami` et `id` ?

<details>
<summary>Voir le corrigé</summary>

- `whoami` : nom du compte qui exécute la commande.
- `id` : UID, GID et liste des groupes de ce compte.
- `who` : liste des sessions ouvertes (utilisateur, terminal, date de connexion, origine).
- `w` : comme `who`, avec en plus la commande en cours de chaque utilisateur et la charge de la machine.

</details>

**Exercice 10.** Que signifie `load average: 0.05, 0.10, 0.08` dans la sortie de `uptime` ? Sur une machine à 4 cœurs, à partir de quelle valeur la machine est-elle saturée ?

<details>
<summary>Voir le corrigé</summary>

Ce sont les charges moyennes (nombre moyen de processus prêts à s'exécuter ou en attente d'entrées-sorties) sur les 1, 5 et 15 dernières minutes. Une valeur proche du nombre de cœurs (ici 4) indique une machine pleinement utilisée ; au-dessus de 4 durablement, les processus font la queue. Ici, la machine est quasiment au repos.

</details>
