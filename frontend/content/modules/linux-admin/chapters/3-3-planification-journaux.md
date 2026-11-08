## 3.3.1 Planifier : pourquoi et avec quoi

Un administrateur ne peut pas rester devant l'écran à minuit pour lancer la sauvegarde. Il confie donc ces tâches à un **réveil programmable** : le système les exécute à l'heure dite, sans personne connecté. Trois outils existent :

| Outil | Usage | Particularité |
|---|---|---|
| `cron` | Tâches **récurrentes** (toutes les 5 min, chaque nuit…) | Le plus répandu, syntaxe à 5 champs |
| `at` / `batch` | Tâche **unique** à une date donnée | La tâche disparaît après exécution |
| timers `systemd` | Récurrent ou unique, intégré à systemd | Journalisation native, rattrapage possible (voir 3.2) |

## 3.3.2 cron : les tâches récurrentes

### La commande crontab

Chaque utilisateur possède sa **table cron** (crontab), stockée dans `/var/spool/cron/crontabs/` (Debian/Ubuntu) ou `/var/spool/cron/` (RHEL). On ne modifie jamais ces fichiers directement : on passe par `crontab`.

| Commande | Effet |
|---|---|
| `crontab -e` | Édite sa crontab (ouvre l'éditeur par défaut) |
| `crontab -l` | Affiche sa crontab |
| `crontab -r` | **Supprime** sa crontab sans confirmation |
| `sudo crontab -u alice -e` | Édite la crontab de `alice` (`-l` et `-r` aussi) |

### Les 5 champs

```text
┌───────── minute        (0-59)
│ ┌─────── heure         (0-23)
│ │ ┌───── jour du mois  (1-31)
│ │ │ ┌─── mois          (1-12)
│ │ │ │ ┌─ jour semaine  (0-7 ; 0 et 7 = dimanche)
│ │ │ │ │
* * * * *  commande à exécuter
```

Opérateurs : `*` (toutes les valeurs), `,` (liste : `1,15`), `-` (intervalle : `1-5`), `/` (pas : `*/10`).

| Ligne crontab | Signification |
|---|---|
| `30 2 * * * /usr/local/bin/sauvegarde.sh` | Tous les jours à 02h30 |
| `*/15 8-18 * * 1-5 /usr/local/bin/verif.sh` | Toutes les 15 min, de 8h à 18h45, du lundi au vendredi |
| `0 0 1 * * /usr/local/bin/rapport.sh` | Le 1er de chaque mois à minuit |
| `0 22 * * 0 /usr/local/bin/purge.sh` | Chaque dimanche à 22h |
| `5 4 1,15 * * /usr/local/bin/x.sh` | Les 1er et 15 du mois à 04h05 |

Raccourcis : `@reboot` (au démarrage), `@hourly`, `@daily` (ou `@midnight`), `@weekly`, `@monthly`, `@yearly`.

```bash
crontab -l
```

```text
# m h dom mon dow command
MAILTO=admin@exemple.bj
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
@reboot /usr/local/bin/init-app.sh
30 2 * * * /usr/local/bin/sauvegarde.sh >> /var/log/sauvegarde.log 2>&1
```

:::attention crontab -r est à côté de crontab -e
Les touches `e` et `r` sont voisines et `crontab -r` supprime **toute** la table sans demander. Gardez une copie : `crontab -l > ~/crontab.sauve`. Restauration : `crontab ~/crontab.sauve`.
:::

Piège supplémentaire : si le jour du mois **et** le jour de la semaine sont tous deux renseignés (ni l'un ni l'autre n'est `*`), la tâche s'exécute quand **l'un ou l'autre** correspond.

### Fichiers système : /etc/crontab, /etc/cron.d, cron.daily

La crontab **système** a un **6e champ : l'utilisateur** qui exécute la commande.

```text
# /etc/crontab : m h dom mon dow user command
17 *    * * *   root    cd / && run-parts --report /etc/cron.hourly
25 6    * * *   root    test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )
```

| Emplacement | Contenu |
|---|---|
| `/etc/crontab` | Crontab système, avec champ utilisateur |
| `/etc/cron.d/` | Un fichier par application, même format que `/etc/crontab` (champ utilisateur) |
| `/etc/cron.hourly`, `cron.daily`, `cron.weekly`, `cron.monthly` | **Scripts exécutables** déposés directement (sans syntaxe cron) |

Pour qu'un script soit pris en compte dans `cron.daily`, il doit être exécutable, **sans extension** (`run-parts` ignore les noms contenant un point) :

```bash
sudo install -m 755 sauvegarde.sh /etc/cron.daily/sauvegarde
run-parts --test /etc/cron.daily
```

**anacron** rattrape les tâches `daily/weekly/monthly` d'une machine **éteinte** à l'heure prévue (portable, poste de bureau) : au prochain démarrage, la tâche manquée est lancée. Il ne gère que des périodes en jours et son état est dans `/var/spool/anacron/`.

### Pourquoi « ça marche dans mon terminal, pas dans cron »

C'est l'erreur n°1. cron lance la commande avec un environnement **minimal** : pas de profil, pas de `.bashrc`, `PATH=/usr/bin:/bin`, shell `/bin/sh`, répertoire courant = `$HOME`.

Règles d'or :
1. **Chemins absolus** pour les commandes et les fichiers (`/usr/bin/python3`, pas `python3`).
2. Définir `PATH=` ou `SHELL=` en tête de crontab si nécessaire.
3. **Rediriger** la sortie, sinon cron l'envoie par courriel (`MAILTO`) ou la perd : `commande >> /var/log/x.log 2>&1`.
4. Ne pas utiliser `%` tel quel dans une crontab : il signifie « saut de ligne ». Écrire `\%` : `date +\%F`.
5. Tester la commande avec un environnement vide : `env -i /bin/sh -c 'commande'`.

`MAILTO=admin@exemple.bj` envoie la sortie par courriel (si un MTA est installé) ; `MAILTO=""` désactive les courriels.

### Contrôler qui peut utiliser cron

| Fichier | Effet |
|---|---|
| `/etc/cron.allow` | S'il existe : **seuls** les utilisateurs listés peuvent utiliser `crontab` |
| `/etc/cron.deny` | Sinon, les utilisateurs listés sont **interdits** |

Si aucun des deux n'existe, seul `root` (Debian) ou tout le monde (selon distribution) peut l'utiliser : vérifiez avec `man 1 crontab`. `at` fonctionne de même avec `/etc/at.allow` et `/etc/at.deny`.

### Éviter les exécutions qui se chevauchent : flock

Si une sauvegarde dure plus longtemps que l'intervalle, deux copies tournent en même temps. `flock` pose un verrou sur un fichier :

```bash
*/5 * * * * /usr/bin/flock -n /var/lock/synchro.lock /usr/local/bin/synchro.sh >> /var/log/synchro.log 2>&1
```

`-n` : abandonne immédiatement si le verrou est déjà pris (la 2e instance ne démarre pas).

:::exemple Tester une tâche cron en une minute
```bash
crontab -e
```
Ajoutez la ligne :
```text
* * * * * date >> /tmp/test-cron.txt
```
Attendez 2 minutes puis :
```bash
cat /tmp/test-cron.txt
```
```text
jeu. 06 nov. 2026 10:31:01 UTC
jeu. 06 nov. 2026 10:32:01 UTC
```
Supprimez ensuite la ligne : une tâche de test oubliée est un classique. Les exécutions sont aussi visibles par `grep CRON /var/log/syslog` (Ubuntu) ou `journalctl -u cron` (`crond` sur RHEL).
:::

## 3.3.3 at et batch : une exécution unique

`at` exécute une série de commandes **une seule fois** (service `atd`, à installer : `sudo apt install at`). Les commandes se saisissent sur l'entrée standard, terminées par `Ctrl+D`.

```bash
at 23:30
```

```text
warning: commands will be executed using /bin/sh
at> /usr/local/bin/sauvegarde.sh
at> &lt;EOT&gt;
job 4 at Fri Nov  6 23:30:00 2026
```

Autres formes de date : `at now + 10 minutes`, `at 14:00 tomorrow`, `at 09:00 12/25/2026`, `at teatime`. Version non interactive : `echo "/usr/local/bin/x.sh" | at now + 1 hour` ou `at -f script.sh 17:00`.

| Commande | Rôle |
|---|---|
| `atq` (ou `at -l`) | Liste les tâches en attente (numéro, date, utilisateur) |
| `atrm 4` (ou `at -r 4`) | Supprime la tâche numéro 4 |
| `at -c 4` | Affiche le contenu de la tâche |
| `batch` | Lance la tâche **quand la charge système passe sous un seuil** (environ 1,5) |

```text
$ atq
4	Fri Nov  6 23:30:00 2026 a alice
```

## 3.3.4 Les timers systemd

Un **timer** est une unité `.timer` qui déclenche une unité `.service` du même nom. Avantages sur cron : sortie dans le journal, dépendances, `Persistent=` (rattrapage), vue d'ensemble avec `systemctl list-timers`.

Exemple : sauvegarde tous les jours à 02h30.

```ini
# /etc/systemd/system/sauvegarde.service
[Unit]
Description=Sauvegarde quotidienne

[Service]
Type=oneshot
ExecStart=/usr/local/bin/sauvegarde.sh
```

```ini
# /etc/systemd/system/sauvegarde.timer
[Unit]
Description=Lance la sauvegarde chaque nuit

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sauvegarde.timer
systemctl list-timers
```

```text
NEXT                        LEFT     LAST  PASSED  UNIT              ACTIVATES
Sat 2026-11-07 02:30:00 UTC 15h left n/a   n/a     sauvegarde.timer  sauvegarde.service
```

- On active le **timer** (pas le service).
- `Persistent=true` : si la machine était éteinte à 02h30, la tâche part au prochain démarrage.
- Autres déclencheurs « relatifs » : `OnBootSec=5min`, `OnUnitActiveSec=1h`.
- `systemd-analyze calendar` valide une expression et montre la prochaine échéance :

```bash
systemd-analyze calendar "Mon..Fri 08:00"
```

```text
  Original form: Mon..Fri 08:00
Normalized form: Mon..Fri *-*-* 08:00:00
    Next elapse: Mon 2026-11-09 08:00:00 UTC
```

Lecture des logs d'un timer : `journalctl -u sauvegarde.service`.

### sleep : une pause dans un script

`sleep 5` (secondes), `sleep 2m`, `sleep 1h` : suspend le script. Utile pour des boucles : `while true; do date; sleep 60; done`.

:::retenir cron, at ou timer ?
- Répéter à heure fixe : **cron** (rapide) ou **timer** (journal, rattrapage).
- Une seule fois : **at**.
- Quand la charge est faible : **batch**.
- Machine souvent éteinte : **anacron** ou timer avec `Persistent=true`.
:::

## 3.3.5 Les journaux : /var/log

Les journaux sont la **boîte noire** du système : on y lit ce qui s'est passé, par qui, à quelle heure. Quand quelque chose échoue, le réflexe est : *lire le journal*.

| Fichier (Debian/Ubuntu) | RHEL | Contenu |
|---|---|---|
| `/var/log/syslog` | `/var/log/messages` | Messages généraux du système |
| `/var/log/auth.log` | `/var/log/secure` | Authentifications : `sudo`, `ssh`, `su`, `login` |
| `/var/log/kern.log` | (dans `messages`) | Messages du noyau |
| `/var/log/dmesg` | idem | Tampon du noyau au démarrage ; commande `dmesg` |
| `/var/log/apt/`, `/var/log/dpkg.log` | `/var/log/dnf.log` | Installations de paquets (voir 3.4) |
| `/var/log/wtmp` | idem | Historique des connexions (binaire) : `last` |
| `/var/log/btmp` | idem | Échecs de connexion (binaire) : `sudo lastb` |
| `/var/log/lastlog` | idem | Dernière connexion de chaque compte : `lastlog` |

Les fichiers `wtmp`, `btmp`, `lastlog` sont **binaires** : on les lit avec `last`, `lastb`, `lastlog`, pas avec `cat`.

```bash
last -n 3
```

```text
alice    pts/0        192.0.2.10       Fri Nov  6 09:58   still logged in
bob      pts/1        198.51.100.7     Thu Nov  5 17:02 - 17:40  (00:38)
reboot   system boot  6.8.0-45-generic Thu Nov  5 08:00   still running
```

Commandes de lecture : `less`, `tail -n 50`, `tail -f` (suivre en direct), `grep`, `dmesg -T | tail` (horodatage lisible).

```bash
sudo tail -f /var/log/auth.log
```

## 3.3.6 rsyslog : facilities et severities

**rsyslog** reçoit les messages des services et du noyau, puis les range dans des fichiers selon des règles `facility.severity  destination`.

**Facilities** (origine) : `auth`/`authpriv`, `cron`, `daemon`, `kern`, `mail`, `syslog`, `user`, `local0` à `local7` (libres pour vos applications).

**Severities** (gravité, de la plus grave à la moins grave) :

| Niveau | Nom | Niveau | Nom |
|---|---|---|---|
| 0 | `emerg` | 4 | `warning` |
| 1 | `alert` | 5 | `notice` |
| 2 | `crit` | 6 | `info` |
| 3 | `err` | 7 | `debug` |

Une règle `facility.niveau` retient ce niveau **et tous les plus graves**. `*` = tout ; `none` = rien ; `=err` = exactement ce niveau.

Configuration : `/etc/rsyslog.conf` et `/etc/rsyslog.d/*.conf`. Exemple : envoyer les messages de votre application (facility `local5`) dans un fichier dédié.

```text
# /etc/rsyslog.d/30-monapp.conf
local5.*    /var/log/monapp.log
```

```bash
sudo systemctl restart rsyslog
logger -p local5.info -t monapp "Demarrage de l'application"
tail -n 1 /var/log/monapp.log
```

```text
Nov  6 10:40:12 srv monapp: Demarrage de l'application
```

`logger` écrit un message dans le syslog : `-p facility.niveau` (priorité), `-t étiquette` (tag). Très utile dans les scripts : `logger -t sauvegarde "Fin OK"`.

**Envoi distant** : `*.* @@192.0.2.50:514` (TCP) ou `*.* @192.0.2.50:514` (UDP). Un simple `@` = UDP, `@@` = TCP. Le serveur central doit activer la réception (module `imtcp`/`imudp`). Intérêt : un attaquant qui efface les journaux locaux ne touche pas la copie distante.

### journald et journalctl

Sur systemd, `systemd-journald` collecte aussi tout (en mémoire ou sur disque). Par défaut sur Ubuntu, le journal est lu **en plus** de rsyslog.

| Commande | Effet |
|---|---|
| `journalctl -u ssh` | Messages d'une unité (`sshd` sur RHEL) |
| `journalctl -p err` | Messages de gravité `err` et plus |
| `journalctl -b` | Depuis le démarrage courant (`-b -1` : le précédent) |
| `journalctl --since "1 hour ago"` | Depuis une durée ou une date |
| `journalctl -f` | Suivi en direct |
| `journalctl -k` | Messages du noyau |
| `journalctl --disk-usage` | Place occupée |

Pour rendre le journal **persistant** : `sudo mkdir -p /var/log/journal` puis `sudo systemctl restart systemd-journald` (ou `Storage=persistent` dans `/etc/systemd/journald.conf`).

## 3.3.7 logrotate : empêcher les journaux d'avaler le disque

Sans rotation, un journal grossit sans fin. **logrotate** (lancé chaque jour par cron ou par timer) renomme `monapp.log` en `monapp.log.1`, compresse les anciens, supprime les plus vieux. Configuration : `/etc/logrotate.conf` (général) et `/etc/logrotate.d/` (un fichier par application).

```text
# /etc/logrotate.d/monapp
/var/log/monapp.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0640 syslog adm
    postrotate
        systemctl kill -s HUP rsyslog.service >/dev/null 2>&1 || true
    endscript
}
```

| Directive | Rôle |
|---|---|
| `daily` / `weekly` / `monthly` | Fréquence |
| `rotate 4` | Garde 4 fichiers archivés |
| `compress` | Compresse avec gzip |
| `delaycompress` | Ne compresse qu'à la rotation suivante (le plus récent reste lisible) |
| `missingok` | Pas d'erreur si le fichier n'existe pas |
| `notifempty` | Ne pas tourner un fichier vide |
| `create mode user groupe` | Recrée un fichier vide avec ces droits |
| `size 10M` | Rotation selon la taille |
| `postrotate … endscript` | Commandes après rotation (recharger le service pour qu'il rouvre son fichier) |

Tests sans risque :

```bash
sudo logrotate -d /etc/logrotate.d/monapp
sudo logrotate -f /etc/logrotate.d/monapp
```

`-d` (debug) **simule** sans rien modifier ; `-f` **force** la rotation maintenant.

## 3.3.8 Analyser les journaux en pipeline

Extraire les adresses IP qui échouent le plus à se connecter en SSH :

```bash
grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -5
```

```text
    212 203.0.113.9
     37 198.51.100.7
      3 192.0.2.44
```

Explication : `grep` garde les échecs ; `awk '{print $(NF-3)}'` affiche l'avant-avant-dernier mot avant la fin (l'IP, car la ligne finit par `from IP port N ssh2`) ; `sort | uniq -c` compte les occurrences ; `sort -rn` classe par nombre décroissant.

Autres pipelines courants :

```bash
grep -c "Failed password" /var/log/auth.log
grep "sudo:" /var/log/auth.log | tail
sudo lastb | head
journalctl -p err -b --no-pager | tail -20
```

### Alerte disque très simple

```bash
#!/bin/bash
SEUIL=90
USAGE=$(df / --output=pcent | tail -1 | tr -dc '0-9')
if [ "$USAGE" -ge "$SEUIL" ]; then
    logger -p user.warning -t alerte-disque "Racine a ${USAGE}% d'occupation"
fi
```

Planifiée par `*/30 * * * * /usr/local/bin/alerte-disque.sh`. `df --output=pcent` affiche le pourcentage ; `tr -dc '0-9'` ne garde que les chiffres.

### Aperçu de la supervision

Les journaux sont de la supervision « après coup ». Pour surveiller en continu : **Netdata** (installation rapide, tableaux de bord temps réel), **Prometheus** (collecte de métriques) avec **Grafana** (graphiques et alertes), Nagios/Zabbix. Ces outils sortent du programme, mais l'idée est la même : mesurer, historiser, alerter.

:::examen Ce qui tombe à l'examen
- Lire une ligne crontab (`*/10 8-18 * * 1-5`) ou écrire celle correspondant à une description.
- Différence entre `crontab -e` et `/etc/crontab` (champ utilisateur).
- Où sont les journaux d'authentification (`/var/log/auth.log` ou `secure`) ; ce que fait `tail -f`.
- Rôle de `logrotate`, directives `rotate`, `compress`, `weekly`.
:::

## 3.3.9 Exercices corrigés

**Exercice 1.** Écrivez la ligne crontab qui exécute `/home/alice/save.sh` tous les jours à 23h45.

<details>
<summary>Voir le corrigé</summary>

```bash
45 23 * * * /home/alice/save.sh
```

Minute d'abord (45), puis heure (23). Les trois `*` restants signifient « tous les jours du mois, tous les mois, tous les jours de la semaine ».

</details>

**Exercice 2.** Que signifie `*/10 8-17 * * 1-5 /usr/bin/check.sh` ?

<details>
<summary>Voir le corrigé</summary>

```text
Toutes les 10 minutes, de 08h00 à 17h50, du lundi au vendredi.
```

`*/10` : minutes 0, 10, 20, 30, 40, 50. `8-17` : heures de 8 à 17 incluses (dernier déclenchement à 17h50). `1-5` : lundi à vendredi.

</details>

**Exercice 3.** Une tâche `backup.sh` utilise la commande `mysqldump` et marche à la main mais pas sous cron, sans aucune trace. Donnez trois causes probables et la correction de la ligne.

<details>
<summary>Voir le corrigé</summary>

```bash
0 3 * * * /usr/bin/mysqldump -u backup mabase > /var/backups/mabase.sql 2>> /var/log/backup-erreurs.log
```

- Environnement minimal : le `PATH` de cron ne contient pas forcément le programme, d'où l'usage du **chemin absolu** (`which mysqldump`).
- Variables du profil absentes (`~/.bashrc` n'est pas lu).
- Sortie et erreurs non redirigées : on ne voit rien ; on ajoute `2>>fichier` pour comprendre.

</details>

**Exercice 4.** Planifiez l'arrêt de la machine dans 30 minutes avec `at`, puis annulez la tâche.

<details>
<summary>Voir le corrigé</summary>

```bash
echo "/sbin/shutdown -h now" | sudo at now + 30 minutes
atq
sudo atrm 5
```

Les commandes sont lues sur l'entrée standard. `atq` donne le numéro de job (ici 5, à adapter) ; `atrm` le supprime. Les tâches d'un utilisateur sont listées par son propre `atq` (`root` voit tout).

</details>

**Exercice 5.** Quelle différence entre un script placé dans `/etc/cron.daily/` et une ligne dans `/etc/cron.d/` ?

<details>
<summary>Voir le corrigé</summary>

```text
cron.daily : script exécutable, sans syntaxe cron, lancé une fois par jour à l'heure fixée par le système (anacron/cron).
cron.d     : fichier au format crontab avec champ utilisateur ; vous choisissez l'heure exacte.
```

Le premier est simple mais l'heure précise n'est pas maîtrisée ; le second donne un contrôle total. Dans `cron.daily`, le nom du script ne doit pas contenir de point.

</details>

**Exercice 6.** Quelle commande consigne le message « Sauvegarde terminée » dans le syslog avec l'étiquette `backup` et la gravité `info` ?

<details>
<summary>Voir le corrigé</summary>

```bash
logger -p user.info -t backup "Sauvegarde terminee"
```

`-p` donne `facility.niveau` (`user.info`) et `-t` l'étiquette. On lit le résultat avec `grep backup /var/log/syslog` ou `journalctl -t backup`.

</details>

**Exercice 7.** Écrivez la règle rsyslog qui envoie tout ce que produit la facility `local5` dans `/var/log/monapp.log`, puis la commande qui applique le changement.

<details>
<summary>Voir le corrigé</summary>

```bash
echo 'local5.*    /var/log/monapp.log' | sudo tee /etc/rsyslog.d/30-monapp.conf
sudo systemctl restart rsyslog
```

`local5.*` : tous les niveaux de la facility `local5`. Sans redémarrage du service, la nouvelle règle n'est pas lue.

</details>

**Exercice 8.** Écrivez une configuration logrotate pour `/var/log/monapp.log` : rotation hebdomadaire, 8 archives, compression retardée, pas d'erreur si le fichier manque, pas de rotation si vide. Comment la tester sans rien modifier ?

<details>
<summary>Voir le corrigé</summary>

```text
/var/log/monapp.log {
    weekly
    rotate 8
    compress
    delaycompress
    missingok
    notifempty
}
```

```bash
sudo logrotate -d /etc/logrotate.d/monapp
```

Le fichier se place dans `/etc/logrotate.d/monapp`. L'option `-d` simule et affiche ce qui serait fait ; `-f` forcerait réellement la rotation.

</details>

**Exercice 9.** Donnez le pipeline qui affiche les 3 adresses IP ayant le plus d'échecs SSH dans `/var/log/auth.log`.

<details>
<summary>Voir le corrigé</summary>

```bash
grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -3
```

L'IP est le 4e mot avant la fin de la ligne (`from IP port N ssh2`). `uniq -c` ne compte que des lignes voisines identiques : le premier `sort` est indispensable.

</details>

**Exercice 10.** Créez un timer systemd qui lance `/usr/local/bin/nettoyage.sh` chaque dimanche à 03h00, avec rattrapage. Donnez le contenu des deux unités et les commandes d'activation.

<details>
<summary>Voir le corrigé</summary>

```ini
# /etc/systemd/system/nettoyage.service
[Unit]
Description=Nettoyage hebdomadaire

[Service]
Type=oneshot
ExecStart=/usr/local/bin/nettoyage.sh
```

```ini
# /etc/systemd/system/nettoyage.timer
[Unit]
Description=Nettoyage chaque dimanche

[Timer]
OnCalendar=Sun *-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nettoyage.timer
systemctl list-timers nettoyage.timer
```

Le timer porte le même nom que le service. `Persistent=true` rattrape l'exécution manquée si la machine était éteinte. Validez l'expression avec `systemd-analyze calendar "Sun *-*-* 03:00:00"`.

</details>
