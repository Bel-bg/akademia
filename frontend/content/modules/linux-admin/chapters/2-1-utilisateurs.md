## 2.1.1 Pourquoi des comptes utilisateurs ?

Linux est un système **multi-utilisateur** : plusieurs personnes (et plusieurs programmes) partagent la même machine sans pouvoir lire ou détruire le travail des autres. Pensez à un immeuble : chaque locataire a sa clé (son compte), certains ont accès au local technique (les administrateurs), et le gardien possède le passe général (root). Chaque processus et chaque fichier appartient à un compte ; c'est sur cette appartenance que reposent les droits (voir 2.2) et `sudo` (voir 2.3).

Le noyau ne connaît pas les noms, seulement des **numéros** : l'**UID** (User ID) pour un utilisateur et le **GID** (Group ID) pour un groupe. Les noms (`luke`, `jedi`) ne sont qu'une table de correspondance, stockée dans des fichiers texte de `/etc`.

### Les trois familles de comptes

| Famille | Plage d'UID | Exemples | Rôle |
|---|---|---|---|
| **root** (superutilisateur) | **0** | `root` | Tous les droits, aucune restriction |
| **Comptes système** | **1 à 999** | `daemon`, `www-data`, `sshd`, `mysql` | Font tourner les services ; pas de connexion interactive |
| **Comptes normaux** | **1000 et plus** | `luke`, `miracle` | Utilisateurs humains |

Ce qui fait de `root` un administrateur n'est pas son nom mais son **UID 0** : tout compte d'UID 0 a les pleins pouvoirs. Un second compte d'UID 0 serait une porte dérobée classique, d'où la vérification suivante :

```bash
awk -F: '$3 == 0 {print $1}' /etc/passwd
```

```text
root
```

Les plages exactes sont définies dans `/etc/login.defs` (`UID_MIN 1000`, `UID_MAX 60000`, `SYS_UID_MIN`, `SYS_UID_MAX`). Sur Debian/Ubuntu le premier compte humain reçoit l'UID 1000 ; sur les RHEL récentes aussi (les très anciennes commençaient à 500).

### Groupe principal et groupes secondaires

Tout utilisateur a **exactement un groupe principal** (champ GID de `/etc/passwd`) et **zéro, un ou plusieurs groupes secondaires**.

- Le groupe principal est le groupe attribué aux **nouveaux fichiers** créés par l'utilisateur.
- Les groupes secondaires donnent des droits supplémentaires (accès à un dossier partagé, usage de `sudo`, lecture des journaux avec `adm`…).

Par défaut (Debian et RHEL), `useradd` crée un groupe privé portant le même nom que l'utilisateur : `luke` a pour groupe principal `luke`.

## 2.1.2 Les fichiers de comptes

### /etc/passwd : 7 champs séparés par `:`

Ce fichier est lisible par tous (les programmes en ont besoin pour traduire un UID en nom).

```text
luke:x:1001:1002:Luke Skywalker,,,:/home/luke:/bin/bash
1     2  3    4        5              6          7
```

| N° | Champ | Signification |
|---|---|---|
| 1 | Login | Nom de connexion |
| 2 | Mot de passe | `x` = le hash est dans `/etc/shadow` |
| 3 | UID | Identifiant numérique |
| 4 | GID | Groupe principal (numéro) |
| 5 | GECOS | Commentaire : nom complet, bureau, téléphone |
| 6 | Répertoire personnel | Souvent `/home/login` |
| 7 | Interpréteur de connexion | `/bin/bash`, ou `/usr/sbin/nologin` pour un compte sans connexion |

Extraire des champs se fait avec `cut` ou `awk` (voir 1.4) :

```bash
cut -d: -f1,3,7 /etc/passwd | tail -3
awk -F: '$3 >= 1000 && $3 < 60000 {print $1, $3}' /etc/passwd
```

La seconde commande liste les comptes « humains » (plus `nobody` d'UID 65534 exclu par la borne 60000).

### /etc/shadow : 9 champs, réservé à root

Les hachages de mots de passe ont été sortis de `passwd` (lisible par tous, donc attaquable hors ligne) vers `/etc/shadow`, de permissions `640` (`root:shadow`) sur Debian et `000` sur RHEL.

```text
luke:$y$j9T$Fq3...hash...:20397:0:99999:7:::
1    2                    3     4 5     6 789
```

| N° | Champ | Signification |
|---|---|---|
| 1 | Login | Identique à `passwd` |
| 2 | Hash | Mot de passe haché (voir ci-dessous) |
| 3 | Dernier changement | En **jours depuis le 1er janvier 1970** |
| 4 | Âge minimal | Jours à attendre avant de pouvoir rechanger (`0` = libre) |
| 5 | Âge maximal | Jours de validité (`99999` = jamais) |
| 6 | Avertissement | Jours de prévenance avant expiration (souvent `7`) |
| 7 | Inactivité | Jours de grâce après expiration avant blocage |
| 8 | Expiration du compte | Jour (depuis 1970) où le compte est désactivé |
| 9 | Réservé | Inutilisé |

Le champ 2 a la forme `$id$sel$empreinte`. L'identifiant indique l'algorithme :

| Préfixe | Algorithme | Remarque |
|---|---|---|
| `$1$` | MD5 | Obsolète, à proscrire |
| `$5$` | SHA-256 | Correct |
| `$6$` | SHA-512 | Défaut historique (Ubuntu 20.04, RHEL) |
| `$y$` | yescrypt | Défaut récent (Debian 11+, Ubuntu 22.04+) |

Valeurs spéciales du champ 2 :

- `!` ou `!!` devant un hash : compte **verrouillé** (le hash est conservé, mais ne peut plus correspondre). `!!` seul signifie « jamais de mot de passe défini » sur RHEL.
- `*` : **pas de connexion par mot de passe** possible (comptes système). On peut quand même utiliser `su` depuis root ou une clé SSH selon la configuration.
- Champ vide : **aucun mot de passe requis**. Très dangereux.

### /etc/group et /etc/gshadow

```text
jedi:x:1001:luke,vador
1    2 3    4
```

Champs de `/etc/group` : nom du groupe, `x` (mot de passe du groupe, déplacé dans `gshadow`), **GID**, liste des **membres secondaires** séparés par des virgules. Attention : un utilisateur dont le groupe principal est `jedi` n'apparaît pas forcément dans cette liste (le lien est dans `passwd`).

`/etc/gshadow` a 4 champs : nom, hash du mot de passe de groupe (`!` ou vide : aucun), administrateurs du groupe, membres.

:::retenir Les quatre fichiers
`/etc/passwd` (7 champs, comptes), `/etc/shadow` (9 champs, mots de passe et âges), `/etc/group` (4 champs, groupes), `/etc/gshadow` (4 champs, mots de passe de groupes). Les deux premiers fichiers « shadow » ne sont lisibles que par root. Pour les modifier à la main, utilisez `vipw` et `vigr` (voir plus bas), jamais un éditeur ordinaire.
:::

## 2.1.3 Créer des comptes : useradd

`useradd` est la commande **de base**, présente partout, non interactive. Syntaxe : `useradd [options] login`.

| Option | Effet |
|---|---|
| `-m` | Crée le répertoire personnel et y copie `/etc/skel` |
| `-d rep` | Choisit le répertoire personnel (sans `-m`, il n'est pas créé) |
| `-s shell` | Interpréteur de connexion (`/bin/bash`) |
| `-u uid` | Impose l'UID |
| `-g groupe` | Groupe **principal** (nom ou GID, qui doit exister) |
| `-G g1,g2` | Groupes **secondaires** (liste sans espace) |
| `-c "texte"` | Commentaire (champ GECOS) |
| `-e AAAA-MM-JJ` | Date d'expiration du compte |
| `-r` | Compte **système** (UID dans la plage système, pas de home par défaut) |
| `-N` | Ne crée pas de groupe privé du même nom |

Sur Debian/Ubuntu, `useradd` **sans `-m` ne crée pas le répertoire personnel**, et le shell par défaut est souvent `/bin/sh`. Sur RHEL, `CREATE_HOME yes` dans `login.defs` rend `-m` implicite. D'où le réflexe : toujours écrire `-m -s /bin/bash`.

### Exemple complet : jedi, rebelles, luke, vador, solo

On crée deux groupes puis trois comptes, avec des groupes principaux et secondaires différents.

```bash
sudo groupadd jedi
sudo groupadd rebelles
sudo useradd -m -s /bin/bash -g jedi -G rebelles -c "Luke Skywalker" luke
sudo useradd -m -s /bin/bash -g jedi -c "Dark Vador" vador
sudo useradd -m -s /bin/bash -g rebelles -c "Han Solo" solo
```

Définir le mot de passe « password » pour les trois comptes en une commande, avec `chpasswd` (qui lit des lignes `login:motdepasse` sur l'entrée standard) :

```bash
printf 'luke:password\nvador:password\nsolo:password\n' | sudo chpasswd
```

Contrôles :

```bash
id luke
getent passwd luke
getent group jedi
```

```text
uid=1001(luke) gid=1001(jedi) groups=1001(jedi),1002(rebelles)
luke:x:1001:1001:Luke Skywalker:/home/luke:/bin/bash
jedi:x:1001:
```

(Les numéros dépendent de votre machine ; en français, `id` affiche `groupes=`.) Notez que `jedi` n'a pas de membres secondaires listés : luke et vador y sont par leur groupe principal.

Test de connexion :

```bash
su - luke
```

```text
Password:
luke@poste:~$ pwd
/home/luke
luke@poste:~$ exit
```

Le tiret de `su -` charge l'environnement complet de l'utilisateur (voir 2.3). Ici, `su` lancé par un utilisateur ordinaire demande le mot de passe de **luke** ; lancé par root, il n'en demande aucun.

:::attention Mot de passe « password » : uniquement en TP
Un mot de passe comme `password` n'est acceptable que dans une machine virtuelle d'entraînement. En production, forcez le changement à la première connexion avec `chage -d 0 luke` (voir plus bas) et appliquez une politique de qualité (voir 2.3).
:::

### Les valeurs par défaut

- `useradd -D` affiche les défauts de `/etc/default/useradd` (groupe, répertoire de base `HOME=/home`, `SHELL`, `SKEL=/etc/skel`, `EXPIRE`, `INACTIVE`).
- `useradd -D -s /bin/bash` change le shell par défaut des futurs comptes.
- `/etc/login.defs` règle les plages d'UID/GID, `UID_MIN`, `PASS_MAX_DAYS`, `PASS_MIN_DAYS`, `PASS_WARN_AGE`, `UMASK`, `ENCRYPT_METHOD`, `USERGROUPS_ENAB` (groupe privé). Ces valeurs ne s'appliquent qu'aux **nouveaux** comptes.
- `/etc/skel` contient les fichiers copiés dans chaque nouveau home (`.bashrc`, `.profile`, `.bash_logout`). Ajoutez-y un fichier pour qu'il soit distribué à tous les futurs comptes.
- `/etc/shells` liste les interpréteurs de connexion valides ; `chsh -s` refuse un shell absent de cette liste.

## 2.1.4 La variante Debian : adduser, deluser, addgroup

Debian et Ubuntu proposent en plus des **scripts Perl conviviaux**, interactifs et plus sûrs pour débuter :

```bash
sudo adduser luke
```

```text
Adding user `luke' ...
Adding new group `luke' (1001) ...
Adding new user `luke' (1001) with group `luke' ...
Creating home directory `/home/luke' ...
Copying files from `/etc/skel' ...
New password:
Retype new password:
passwd: password updated successfully
Changing the user information for luke
Enter the new value, or press ENTER for the default
	Full Name []:
```

`adduser` crée le home, copie `/etc/skel`, demande le mot de passe et utilise le shell défini dans `/etc/adduser.conf`. Autres usages :

| Commande Debian | Équivalent bas niveau |
|---|---|
| `adduser luke jedi` | `usermod -aG jedi luke` |
| `addgroup jedi` | `groupadd jedi` |
| `adduser --system --group --no-create-home svc` | `useradd -r ...` |
| `adduser --disabled-password --gecos "" test` | compte sans mot de passe |
| `deluser luke` | `userdel luke` |
| `deluser --remove-home luke` | `userdel -r luke` |
| `deluser luke jedi` | retire luke du groupe jedi |
| `delgroup jedi` | `groupdel jedi` |

Sur RHEL/Fedora, `adduser` est un simple lien vers `useradd` : seule la forme `useradd` est portable. **À l'examen, utilisez `useradd`**, sauf mention contraire.

## 2.1.5 Modifier, verrouiller et supprimer

### passwd

```bash
sudo passwd luke        # définit/change le mot de passe de luke
passwd                  # change son propre mot de passe
sudo passwd -l luke     # verrouille (ajoute ! devant le hash)
sudo passwd -u luke     # déverrouille
sudo passwd -e luke     # expire : changement exigé à la prochaine connexion
sudo passwd -S luke     # statut
```

```text
luke P 2026-11-05 0 99999 7 -1
```

`passwd -S` : login, état (`P` mot de passe valide, `L` verrouillé, `NP` sans mot de passe), date du dernier changement, âge minimal, maximal, avertissement, inactivité.

### usermod : modifier un compte existant

| Option | Effet |
|---|---|
| `-aG groupe` | **Ajoute** aux groupes secondaires (sans retirer les autres) |
| `-G g1,g2` | **Remplace** toute la liste des groupes secondaires |
| `-g groupe` | Change le groupe principal |
| `-l nouveau` | Change le login (le home n'est pas renommé) |
| `-d rep -m` | Nouveau home ; `-m` y déplace le contenu |
| `-s shell` | Change le shell |
| `-c "texte"` | Change le commentaire |
| `-u uid` | Change l'UID |
| `-L` / `-U` | Verrouille / déverrouille le mot de passe |
| `-e date` | Date d'expiration du compte |

:::attention usermod -G sans -a efface les autres groupes
`usermod -G jedi luke` **remplace** tous les groupes secondaires de luke par `jedi` : il perd `rebelles`, et surtout `sudo` s'il l'avait, ce qui peut priver l'unique administrateur de ses droits. Pour ajouter un groupe, écrivez toujours `usermod -aG jedi luke`. Les nouveaux groupes ne sont actifs qu'à la **prochaine connexion** de l'utilisateur.
:::

Exemples :

```bash
sudo usermod -aG sudo luke                 # donner les droits sudo (Debian)
sudo usermod -l anakin -d /home/anakin -m vador
sudo usermod -s /usr/sbin/nologin solo     # interdire la connexion interactive
sudo usermod -e 2027-01-31 stagiaire       # le compte expirera le 31/01/2027
```

### userdel

```bash
sudo userdel solo       # supprime le compte, garde /home/solo
sudo userdel -r solo    # supprime aussi le home et la boîte aux lettres
```

`userdel` refuse de supprimer un utilisateur connecté (ou ayant des processus en cours). Les fichiers de l'utilisateur situés ailleurs ne sont pas supprimés et restent attribués à un UID orphelin ; retrouvez-les avec `sudo find / -nouser 2>/dev/null`.

### Groupes : groupadd, groupmod, groupdel, gpasswd

```bash
sudo groupadd -g 2000 dev        # GID imposé
sudo groupmod -n developpeurs dev
sudo groupdel developpeurs       # refusé si c'est le groupe principal d'un compte
sudo gpasswd -a luke jedi        # ajoute luke au groupe jedi
sudo gpasswd -d luke jedi        # le retire
sudo gpasswd -A luke jedi        # luke devient administrateur du groupe
```

## 2.1.6 Vieillissement des mots de passe : chage

`chage` (change age) règle les champs 3 à 8 de `/etc/shadow`.

```bash
sudo chage -l luke
```

```text
Last password change					: Nov 05, 2026
Password expires					: never
Password inactive					: never
Account expires						: never
Minimum number of days between password change		: 0
Maximum number of days between password change		: 99999
Number of days of warning before password expires	: 7
```

| Option | Effet |
|---|---|
| `-l` | Affiche l'état |
| `-M 90` | Mot de passe valable 90 jours maximum |
| `-m 1` | Au moins 1 jour entre deux changements |
| `-W 14` | Avertissement 14 jours avant |
| `-I 7` | 7 jours de grâce après expiration |
| `-E 2027-06-30` | Date d'expiration du compte (`-E -1` : jamais) |
| `-d 0` | Dernier changement = 0 : **mot de passe à changer à la prochaine connexion** |

Exemple de politique : `sudo chage -M 90 -m 1 -W 14 luke`. Un utilisateur ordinaire peut lancer `chage -l` sur son propre compte.

## 2.1.7 Verrouiller un compte : quelle méthode ?

| Méthode | Ce qu'elle bloque | Ce qu'elle laisse passer |
|---|---|---|
| `passwd -l luke` / `usermod -L luke` | Connexion par **mot de passe** (le hash reçoit `!`) | **Clé SSH**, `su` depuis root |
| `chage -E 0 luke` | Le **compte entier** (expiré), y compris clé SSH via PAM | `su` depuis root peut encore passer |
| `usermod -s /usr/sbin/nologin luke` | Les sessions interactives (shell) | Tâches non interactives selon le service |

Pour un blocage réellement complet (départ d'un employé) : `usermod -L`, `chage -E 0` et un shell `nologin`.

**nologin ou false ?** `/usr/sbin/nologin` (sur RHEL `/sbin/nologin`) affiche « This account is currently not available. » et quitte avec un code d'erreur ; `/bin/false` quitte aussitôt, en silence. Les deux interdisent le shell ; `nologin` est préférable car il informe et peut afficher un message personnalisé via `/etc/nologin.txt`.

## 2.1.8 Qui suis-je ? Qui est connecté ?

| Commande | Rôle |
|---|---|
| `whoami` | Mon nom d'utilisateur effectif |
| `id` / `id luke` | UID, GID et tous les groupes |
| `groups` / `groups luke` | Liste des groupes |
| `getent passwd luke` | Entrée de `passwd` (fonctionne aussi avec LDAP) |
| `getent group jedi` | Entrée de `group` |
| `who` | Sessions ouvertes |
| `w` | Sessions et commande en cours, charge |
| `users` | Noms des connectés sur une ligne |
| `last` | Historique des connexions (`/var/log/wtmp`) |
| `lastb` | Échecs de connexion (`/var/log/btmp`, root) |
| `lastlog` | Dernière connexion de chaque compte |

```text
$ who
miracle  tty2         2026-11-05 08:14 (tty2)
luke     pts/0        2026-11-05 09:02 (192.168.1.20)
$ last -n 3
luke     pts/0        192.168.1.20     Thu Nov  5 09:02   still logged in
miracle  tty2         tty2             Thu Nov  5 08:14   still logged in
reboot   system boot  6.8.0-45-generic Thu Nov  5 08:13   still running
$ lastlog -u luke
Username         Port     From             Latest
luke             pts/0    192.168.1.20     Thu Nov  5 09:02:11 +0000 2026
```

`lastb` est précieux pour repérer une attaque par force brute : il liste les tentatives échouées avec l'adresse source.

## 2.1.9 Créer des comptes en masse

### newusers

`newusers fichier` lit un fichier au format de `passwd` (7 champs) dont le champ 2 contient le mot de passe **en clair**, et crée les comptes (avec home si le champ 6 est renseigné et `-m` ou le défaut le permet). Le fichier doit être supprimé ensuite.

```text
eleve1:Passw0rd1:::Élève Un:/home/eleve1:/bin/bash
eleve2:Passw0rd2:::Élève Deux:/home/eleve2:/bin/bash
```

```bash
sudo newusers liste.txt
shred -u liste.txt
```

UID et GID vides : le système les attribue automatiquement.

### Boucle sur un fichier CSV

Fichier `comptes.csv` (séparateur `;`, première ligne d'en-tête) :

```text
login;nom;groupe
luke;Luke Skywalker;jedi
solo;Han Solo;rebelles
```

Script (à lancer en root) : il crée le groupe s'il manque, saute les comptes existants, fixe un mot de passe provisoire et force son changement.

```bash
#!/bin/bash
[ "$(id -u)" -eq 0 ] || { echo "À lancer en root" >&2; exit 1; }
while IFS=';' read -r login nom groupe; do
  [ -z "$login" ] && continue
  getent group "$groupe" >/dev/null || groupadd "$groupe"
  if id "$login" &>/dev/null; then echo "$login existe déjà"; continue; fi
  useradd -m -s /bin/bash -g "$groupe" -c "$nom" "$login" &&
  echo "$login:Changeme2026" | chpasswd &&
  chage -d 0 "$login" &&
  echo "Compte $login créé"
done < <(tail -n +2 comptes.csv)
```

Remarquez `tail -n +2` pour ignorer l'en-tête et la redirection `< <(...)` qui évite d'exécuter la boucle dans un sous-shell. Pour fournir des hachages plutôt que des mots de passe en clair, `chpasswd -e` accepte des mots de passe déjà chiffrés.

## 2.1.10 Comptes de service et outils d'intégrité

Un **compte de service** fait tourner un démon (base de données, serveur web, script de sauvegarde) avec le minimum de droits. Règles : compte système (`-r`), **pas de shell** utilisable, pas de mot de passe, home réduit à un répertoire de données.

```bash
sudo useradd -r -s /usr/sbin/nologin -d /var/lib/monapp -c "Service MonApp" monapp
sudo mkdir -p /var/lib/monapp
sudo chown monapp:monapp /var/lib/monapp
```

Si un administrateur doit tout de même agir en tant que ce compte : `sudo -u monapp commande` (voir 2.3), ou `sudo -u monapp -s /bin/bash` ponctuellement.

**Vérification et édition sûre :**

- `pwck` contrôle la cohérence de `passwd` et `shadow` (home inexistant, shell invalide, doublon) ; `pwck -r` en lecture seule.
- `grpck` fait de même pour `group` et `gshadow`.
- `vipw` ouvre `/etc/passwd` dans l'éditeur avec un **verrou** (empêchant `useradd` d'écrire en même temps) ; `vipw -s` pour `shadow`, `vigr` pour `group`.

:::examen Questions classiques
Citez les 7 champs de `/etc/passwd` ; donnez la commande créant `luke` avec home, shell bash et groupe secondaire `sudo` ; expliquez la différence entre `usermod -G` et `usermod -aG` ; dites où est stocké le mot de passe haché (`/etc/shadow`) ; forcez un changement de mot de passe (`chage -d 0` ou `passwd -e`) ; verrouillez un compte (`passwd -l`).
:::

## 2.1.11 Exercices corrigés

**Exercice 1.** Quelles sont les plages d'UID des comptes système et des comptes normaux sous Debian/Ubuntu ? Quel UID possède root ?

<details>
<summary>Voir le corrigé</summary>

```text
root : 0
système : 1 à 999
normaux : 1000 et plus
```

Les bornes sont définies dans `/etc/login.defs` (`UID_MIN`, `SYS_UID_MAX`).

</details>

**Exercice 2.** Découpez la ligne `anna:x:1005:1005:Anna K.:/home/anna:/bin/bash` en ses 7 champs et expliquez le `x`.

<details>
<summary>Voir le corrigé</summary>

```text
1 login : anna
2 mot de passe : x
3 UID : 1005
4 GID : 1005
5 commentaire : Anna K.
6 home : /home/anna
7 shell : /bin/bash
```

Le `x` signifie que le hash du mot de passe n'est pas dans `passwd` mais dans `/etc/shadow`.

</details>

**Exercice 3.** Créez le groupe `compta`, puis le compte `fatou` (home, shell bash, groupe principal `compta`, commentaire « Fatou Adjovi »), puis donnez-lui le mot de passe `Eneam2026` en une commande non interactive.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo groupadd compta
sudo useradd -m -s /bin/bash -g compta -c "Fatou Adjovi" fatou
echo "fatou:Eneam2026" | sudo chpasswd
```

`-m` crée le home, `-g` fixe le groupe principal (qui doit exister), `chpasswd` lit `login:motdepasse` sur son entrée standard.

</details>

**Exercice 4.** L'utilisateur `luke` appartient aux groupes `jedi` et `sudo`. Un collègue exécute `usermod -G rebelles luke`. Quel est le résultat ? Comment aurait-il dû faire ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo usermod -aG rebelles luke
```

Sans `-a`, `-G` **remplace** la liste des groupes secondaires : luke ne serait plus que dans `rebelles` (et son groupe principal) et perdrait `jedi` et `sudo`. Avec `-aG`, `rebelles` est ajouté aux groupes existants.

</details>

**Exercice 5.** Donnez la commande qui oblige `luke` à changer son mot de passe à sa prochaine connexion, puis celle qui impose une durée de validité maximale de 60 jours avec 10 jours d'avertissement.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo chage -d 0 luke
sudo chage -M 60 -W 10 luke
```

`chage -d 0` met la date de dernier changement à 0, donc le mot de passe est considéré comme expiré. `passwd -e luke` est équivalente pour le premier besoin. Contrôle avec `sudo chage -l luke`.

</details>

**Exercice 6.** Un employé quitte l'entreprise. Verrouillez le compte `solo` de trois façons complémentaires et expliquez ce que chacune bloque.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo usermod -L solo
sudo chage -E 0 solo
sudo usermod -s /usr/sbin/nologin solo
```

`-L` (comme `passwd -l`) préfixe le hash d'un `!` : plus de connexion par mot de passe, mais une clé SSH fonctionnerait encore. `chage -E 0` fait expirer le compte lui-même. Le shell `nologin` interdit toute session interactive. Les fichiers de `solo` sont conservés pour archivage.

</details>

**Exercice 7.** Que contient le champ 2 de `/etc/shadow` dans les cas `!$6$abc...`, `*` et `$y$j9T$...` ?

<details>
<summary>Voir le corrigé</summary>

```text
!$6$abc...  : compte verrouillé, ancien hash SHA-512 conservé
*           : pas de mot de passe valable, connexion par mot de passe impossible (compte système)
$y$j9T$...  : mot de passe valide haché en yescrypt
```

</details>

**Exercice 8.** Écrivez une commande qui affiche, triés alphabétiquement, les logins de tous les comptes normaux (UID 1000 ou plus, hors `nobody`) de la machine.

<details>
<summary>Voir le corrigé</summary>

```bash
awk -F: '$3 >= 1000 && $3 < 60000 {print $1}' /etc/passwd | sort
```

`-F:` fixe le séparateur, `$3` est l'UID. La borne haute exclut `nobody` (65534). Variante avec `getent passwd` pour inclure les comptes LDAP.

</details>

**Exercice 9.** Créez le compte de service `sauvegarde` : compte système, sans connexion, home `/var/lib/sauvegarde`. Pourquoi ne lui donne-t-on pas de mot de passe ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo useradd -r -s /usr/sbin/nologin -d /var/lib/sauvegarde -c "Compte de sauvegarde" sauvegarde
sudo mkdir -p /var/lib/sauvegarde && sudo chown sauvegarde: /var/lib/sauvegarde
```

`-r` attribue un UID système (inférieur à 1000). Le compte n'a pas de mot de passe (champ `!` ou `*`) et un shell `nologin` : personne ne peut s'y connecter, le processus est lancé par `systemd`, `cron` ou `sudo -u`. Cela limite les dégâts en cas de compromission du service.

</details>

**Exercice 10.** Écrivez un script qui lit `liste.txt` (un login par ligne), et, pour chaque login absent du système, crée le compte avec home et shell bash, mot de passe provisoire `Provisoire1` à changer à la première connexion.

<details>
<summary>Voir le corrigé</summary>

```bash
#!/bin/bash
while read -r login; do
  [ -z "$login" ] && continue
  if id "$login" &>/dev/null; then
    echo "$login existe déjà"
  else
    useradd -m -s /bin/bash "$login" &&
    echo "$login:Provisoire1" | chpasswd &&
    chage -d 0 "$login" &&
    echo "$login créé"
  fi
done < liste.txt
```

`id "$login"` renvoie un code non nul si le compte n'existe pas. `chage -d 0` force le changement. Le script doit être exécuté en root (`sudo ./creer.sh`).

</details>
