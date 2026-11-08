## 3.1.1 Qu'est-ce qu'un processus ?

Un **programme** est un fichier sur le disque ; un **processus** est ce programme **en cours d'exécution**, avec sa mémoire, ses fichiers ouverts et son identité. Linux est multitâche : des centaines de processus tournent « en même temps ».

Chaque processus possède :

| Attribut | Signification |
|---|---|
| **PID** | numéro unique du processus |
| **PPID** | PID de son **père** (le processus qui l'a créé) |
| **UID/GID** | utilisateur et groupe propriétaires (détermine ses droits) |
| **État** | R (running), S (sleeping), D (attente disque), T (arrêté), Z (zombie) |
| **Priorité / nice** | importance relative pour l'ordonnanceur |

Tous les processus descendent du **PID 1** (`systemd` ou `init`), le seul sans vrai père (PPID 0 : le noyau). Un nouveau processus est créé par `fork` (copie du père) puis `exec` (remplacement par le nouveau programme).

## 3.1.2 Observer les processus

```bash
ps                      # processus du terminal courant
ps aux                  # tous les processus, format BSD (utilisateur, %CPU, %MEM...)
ps -ef                  # tous, format System V (UID, PID, PPID, CMD)
ps -u alice             # processus d'alice
ps -p 1 -o pid,ppid,comm
ps aux --sort=-%mem | head -5      # 5 plus gros consommateurs de mémoire
ps -ef --forest         # arbre
pstree -p               # arbre avec PID
pstree -s -p $$         # ancêtres du shell courant ($$ = PID du shell)
```

Colonnes de `ps aux` : `USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND`.

`top` affiche la même chose **en temps réel** :

```text
top - 10:12:01 up 3 days,  load average: 0.52, 0.40, 0.35
Tasks: 210 total,   1 running, 209 sleeping,   0 stopped,   0 zombie
%Cpu(s):  3.0 us,  1.0 sy,  0.0 ni, 95.5 id,  0.3 wa,  0.0 hi,  0.2 si,  0.0 st
MiB Mem :  7900.0 total,  1200.0 free,  3100.0 used,  3600.0 buff/cache
```

| Champ | Sens |
|---|---|
| `load average` | charge moyenne sur 1, 5, 15 minutes (nombre moyen de processus prêts ; comparer au nombre de CPU) |
| `us` / `sy` | CPU en espace utilisateur / noyau |
| `ni` | processus à priorité modifiée |
| `id` | CPU inactif |
| `wa` | attente d'entrées-sorties (disque saturé si élevé) |
| `st` | temps volé par l'hyperviseur (machine virtuelle) |
| `buff/cache` | mémoire utilisée comme cache, récupérable |

Touches de `top` : `k` tuer, `r` renice, `M` trier par mémoire, `P` par CPU, `1` un CPU par ligne, `q` quitter. `htop` est une version plus confortable.

```bash
pgrep -a sleep        # PID des processus nommés sleep
pkill -f script.sh    # tuer par nom
killall nginx         # tuer tous les processus portant ce nom
```

## 3.1.3 Les signaux

Un **signal** est un message envoyé à un processus. `kill -l` les liste.

| N° | Nom | Effet | Ignorable ? |
|---|---|---|---|
| 1 | `SIGHUP` | terminal fermé ; sert souvent à **recharger** la configuration | oui |
| 2 | `SIGINT` | interruption (`Ctrl+C`) | oui |
| 3 | `SIGQUIT` | quitter avec core dump (`Ctrl+\`) | oui |
| 9 | `SIGKILL` | **arrêt immédiat**, non interceptable | **non** |
| 15 | `SIGTERM` | demande d'arrêt propre (**signal par défaut de `kill`**) | oui |
| 18 | `SIGCONT` | reprendre un processus arrêté | oui |
| 19 | `SIGSTOP` | suspendre, non interceptable | **non** |
| 20 | `SIGTSTP` | suspension depuis le clavier (`Ctrl+Z`) | oui |
| 17 | `SIGCHLD` | un fils s'est terminé (envoyé au père) | oui |

```bash
kill 1234            # SIGTERM (demande polie)
kill -9 1234         # SIGKILL (dernier recours : pas de nettoyage, risque de perte de données)
kill -HUP 1234       # recharge la configuration (nginx, sshd...)
kill -STOP 1234 ; kill -CONT 1234
```

:::retenir Ordre à suivre
Essayez d'abord `kill PID` (SIGTERM) ; si le processus ne répond pas, `kill -9 PID`. Un `kill -9` ne laisse pas au programme le temps de fermer ses fichiers ni de supprimer ses verrous.
:::

Un script peut intercepter des signaux avec `trap` :

```bash
trap 'echo "arrêt propre"; exit 0' INT TERM
```

## 3.1.4 Premier plan, arrière-plan : le job control

| Action | Commande |
|---|---|
| lancer en arrière-plan | `commande &` |
| suspendre le processus au premier plan | `Ctrl+Z` |
| lister les travaux du shell | `jobs` (`-l` avec les PID) |
| reprendre en arrière-plan | `bg %n` |
| ramener au premier plan | `fg %n` |
| arrêter un travail | `kill %n` |
| interrompre le premier plan | `Ctrl+C` |

Dans `jobs`, le `+` marque le travail **courant** (celui que `fg` ou `bg` sans argument reprendra) et le `-` le **précédent**.

```text
$ sleep 100
^Z
[1]+  Stoppé                  sleep 100
$ sleep 200 &
[2] 19858
$ jobs
[1]+  Stoppé                  sleep 100
[2]-  En cours d'exécution    sleep 200 &
$ bg %1
$ fg %2
```

### Survivre à la fermeture du terminal

Quand le terminal se ferme, le shell envoie `SIGHUP` à ses travaux : même ceux en arrière-plan meurent.

| Solution | Effet |
|---|---|
| `nohup cmd &` | ignore SIGHUP ; sortie dans `nohup.out` |
| `disown %1` | retire le travail de la liste du shell (il ne reçoit plus SIGHUP) |
| `setsid cmd` | nouvelle session, détachée du terminal |
| `tmux` / `screen` | session persistante qu'on peut rattacher |

```bash
nohup sleep 1000 > /dev/null 2>&1 &
```

:::attention Arrière-plan ≠ détaché
`gedit &` continue d'exister tant que le terminal vit. Pour qu'un programme survive à la fermeture du terminal, il faut `nohup` (et `&` pour garder la main), ou `disown`.
:::

## 3.1.5 Priorités : nice et renice

La **gentillesse** (`nice`) va de **−20** (très prioritaire) à **+19** (très gentil, donc peu prioritaire). Défaut : 0. Seul root peut abaisser la valeur en dessous de 0.

```bash
nice -n 10 ./calcul.sh          # lance avec nice 10
renice -n 5 -p 1234             # change un processus existant
sudo renice -n -5 -p 1234       # augmenter la priorité : root requis
ps -o pid,ni,comm -p 1234
```

## 3.1.6 Le répertoire /proc

Chaque processus a un dossier `/proc/PID/` :

| Entrée | Contenu |
|---|---|
| `cmdline` | ligne de commande |
| `status` | état, PPID, UID, mémoire |
| `environ` | variables d'environnement |
| `fd/` | descripteurs de fichiers ouverts |
| `cwd`, `exe` | répertoire courant, binaire exécuté (liens) |
| `maps` | zones mémoire |

```bash
ls -l /proc/$$/fd
cat /proc/$$/status | head
```

`lsof` liste les fichiers ouverts (`lsof -i :22` : qui écoute sur le port 22 ; `lsof +L1` : fichiers supprimés mais encore ouverts) et `fuser -v /home` : qui utilise ce point de montage.

## 3.1.7 Zombies, mémoire et limites

- **Zombie** (état `Z`, `<defunct>`) : processus terminé dont le père n'a pas encore lu le code de retour. Il ne consomme plus de ressource, mais garde son entrée. On le fait disparaître en terminant (ou en réveillant) le **père** ; les orphelins sont adoptés par PID 1.
- `free -h`, `vmstat 1 5`, `uptime` donnent l'état de la mémoire et de la charge. La mémoire « libre » est trompeuse : regardez `available`.
- `ulimit -n` : nombre maximal de fichiers ouverts par processus ; `ulimit -a` toutes les limites.
- **OOM killer** : quand la mémoire est épuisée, le noyau tue le processus le plus « coupable » (message dans `dmesg`).

:::examen Le processus sans père
« Quel est le processus qui n'a pas de père ? » : le PID 1 (`init`/`systemd`), dont le PPID est 0 (le noyau). Il se vérifie avec `ps -p 1 -o pid,ppid,comm`.
:::

## 3.1.8 Exercices corrigés

**Exercice 1.** Quel est le processus qui n'a pas de père et quel est son PID ?

<details>
<summary>Voir le corrigé</summary>

```bash
ps -p 1 -o pid,ppid,comm
```

Le PID 1 : `systemd` (ou `init`). Son PPID vaut 0.

</details>

**Exercice 2.** Lancez trois `sleep` en arrière-plan avec des durées différentes, listez-les, puis arrêtez le deuxième par son numéro de travail.

<details>
<summary>Voir le corrigé</summary>

```bash
sleep 300 &
sleep 400 &
sleep 500 &
jobs
kill %2
```

`%2` désigne le travail n° 2 (et non le PID).

</details>

**Exercice 3.** Que signifient `+` et `-` dans la sortie de `jobs` ?

<details>
<summary>Voir le corrigé</summary>

`+` : travail courant (sera repris par `fg`/`bg` sans argument) ; `-` : travail précédent, qui deviendra courant ensuite.

</details>

**Exercice 4.** Lancez `sleep 600` au premier plan, suspendez-le, puis relancez-le en arrière-plan.

<details>
<summary>Voir le corrigé</summary>

```bash
sleep 600
# Ctrl+Z
bg
jobs
```

</details>

**Exercice 5.** Un programme graphique lancé avec `gedit &` se ferme quand on ferme le terminal. Comment l'éviter ?

<details>
<summary>Voir le corrigé</summary>

```bash
nohup gedit > /dev/null 2>&1 &
```

`nohup` rend le processus insensible à SIGHUP, `&` le met en arrière-plan. Alternative : `gedit &` puis `disown`.

</details>

**Exercice 6.** Quel signal `kill` envoie-t-il par défaut ? Comment forcer l'arrêt ?

<details>
<summary>Voir le corrigé</summary>

SIGTERM (15). Pour forcer : `kill -9 PID` (SIGKILL), en dernier recours.

</details>

**Exercice 7.** Affichez les 5 processus qui consomment le plus de mémoire.

<details>
<summary>Voir le corrigé</summary>

```bash
ps aux --sort=-%mem | head -n 6
```

`head -n 6` : la première ligne est l'en-tête.

</details>

**Exercice 8.** Lancez `sleep 1000` avec une gentillesse de 10, puis passez-la à 15.

<details>
<summary>Voir le corrigé</summary>

```bash
nice -n 10 sleep 1000 &
renice -n 15 -p $!
ps -o pid,ni,comm -p $!
```

`$!` est le PID du dernier travail lancé en arrière-plan.

</details>

**Exercice 9.** Qui écoute sur le port 22 ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo ss -tulnp | grep ':22'
sudo lsof -i :22
```

</details>

**Exercice 10.** Qu'est-ce qu'un zombie et comment le faire disparaître ?

<details>
<summary>Voir le corrigé</summary>

Un processus terminé dont le père n'a pas récupéré le statut de sortie (état `Z`). Il ne se tue pas lui-même (il est déjà mort) : on fait agir le père (`kill -SIGCHLD PPID`) ou on termine le père, après quoi `init` adopte et nettoie le zombie.

</details>
