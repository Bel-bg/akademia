## 2.3.1 Devenir un autre utilisateur : su et sudo

Travailler en `root` en permanence est dangereux : une faute de frappe (`rm -rf`) n'a plus aucune barrière. On travaille donc avec un compte normal et on élève ses droits **à la demande**.

| Commande | Mot de passe demandé | Environnement | Usage |
|---|---|---|---|
| `su utilisateur` | celui de la **cible** | conserve l'environnement actuel | rare |
| `su - utilisateur` (ou `su -l`) | celui de la **cible** | environnement **complet** de la cible (HOME, PATH, répertoire courant) | se connecter « comme » quelqu'un |
| `sudo commande` | **le vôtre** | une seule commande, avec les droits de root | usage courant |
| `sudo -i` | le vôtre | shell de login root (`/root`, environnement de root) | session root complète |
| `sudo -s` | le vôtre | shell root avec votre environnement | session root rapide |
| `sudo -u alice commande` | le vôtre | exécute en tant qu'`alice` | tests, services |

Sur Ubuntu, le compte root n'a pas de mot de passe défini : le premier utilisateur appartient au groupe `sudo` et administre via `sudo`. Sur Red Hat, CentOS et Fedora, le groupe équivalent s'appelle **`wheel`**.

```bash
sudo usermod -aG sudo alice      # Debian/Ubuntu : alice devient administratrice
sudo usermod -aG wheel alice     # RHEL/Fedora
su - luke                        # test de connexion sous luke
exit                             # retour à l'utilisateur précédent (ou Ctrl+D)
```

:::retenir `su` demande le mot de passe de la cible, `sudo` le vôtre
C'est ce qui permet de déléguer des droits sans jamais communiquer le mot de passe de root. De plus, chaque commande `sudo` est **journalisée** avec le nom de l'utilisateur.
:::

## 2.3.2 Le fichier /etc/sudoers

Il définit **qui** peut lancer **quoi**, **où** et **en tant que qui**. On ne l'édite **jamais** avec un éditeur ordinaire mais avec :

```bash
sudo visudo                    # vérifie la syntaxe avant d'enregistrer
sudo visudo -f /etc/sudoers.d/bob
sudo visudo -c                 # vérifie les fichiers existants
```

:::attention Pourquoi toujours visudo ?
Une erreur de syntaxe dans `/etc/sudoers` rend `sudo` inutilisable pour tout le monde : plus aucun moyen d'obtenir les droits root sans redémarrer en mode secours. `visudo` verrouille le fichier et refuse l'enregistrement s'il est invalide.
:::

### Syntaxe d'une règle

```text
QUI   OÙ=(EN_TANT_QUE)   COMMANDES
root  ALL=(ALL:ALL)      ALL
%sudo ALL=(ALL:ALL)      ALL
alice ALL=(ALL)          ALL
bob   ALL=(root)         NOPASSWD: /usr/bin/systemctl restart nginx
```

- `%sudo` : le signe `%` désigne un **groupe**.
- `NOPASSWD:` : pas de mot de passe pour cette commande.
- Donnez toujours le **chemin absolu** de la commande et ses arguments exacts.

### Alias

```text
User_Alias   ADMINS = alice, bob
Runas_Alias  SERVICE = www-data, postgres
Host_Alias   SERVEURS = srv1, srv2
Cmnd_Alias   RESEAU = /usr/sbin/ip, /usr/bin/ss, /usr/bin/ping
ADMINS SERVEURS = (root) RESEAU
%ops ALL = (root) NOPASSWD: RESEAU, !/usr/sbin/ip link delete *
```

Le point d'exclamation `!` interdit une commande.

### Le dossier /etc/sudoers.d/

Le mieux est de créer **un fichier par règle** dans `/etc/sudoers.d/` (permissions `0440`, propriétaire root) :

```bash
sudo visudo -f /etc/sudoers.d/bob-nginx
# contenu : bob ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx
sudo ls -l /etc/sudoers.d/
sudo -l -U bob          # liste ce que bob peut faire
sudo -l                 # ce que JE peux faire
```

## 2.3.3 Journalisation

| Où | Contenu |
|---|---|
| `/var/log/auth.log` (Debian/Ubuntu) | chaque `sudo` avec utilisateur, répertoire, commande |
| `/var/log/secure` (RHEL) | idem |
| `journalctl _COMM=sudo` | via journald |

```bash
sudo grep sudo /var/log/auth.log | tail
```

## 2.3.4 Pièges de sécurité

:::attention Un sudo trop large équivaut à donner root
Autoriser `sudo less`, `sudo vi` ou `sudo find` permet de **s'échapper** vers un shell root : dans `less`, tapez `!sh`. De même, un joker dangereux comme `/bin/cat /var/log/*` laisse lire `/var/log/../../etc/shadow`. Corrections : n'autoriser que des commandes précises avec leurs arguments, utiliser `NOEXEC:` ou `sudoedit` pour l'édition de fichiers.
:::

:::attention Pourquoi `sudo echo "x" > /etc/fichier` échoue-t-il ?
La redirection `>` est réalisée par **votre shell**, avec vos droits, avant même que `sudo` ne démarre. Solutions : `echo "x" | sudo tee /etc/fichier` (ou `tee -a` pour ajouter), ou `sudo sh -c 'echo x > /etc/fichier'`.
:::

## 2.3.5 PAM : l'authentification modulaire

**PAM** (Pluggable Authentication Modules) sépare les programmes (login, sudo, ssh) de la façon dont on vérifie l'identité. La configuration est dans `/etc/pam.d/` (un fichier par service : `login`, `sshd`, `sudo`, `common-auth`…).

Quatre types de lignes :

| Type | Question posée |
|---|---|
| `auth` | qui es-tu ? (mot de passe, clé, biométrie) |
| `account` | le compte est-il valide, non expiré, autorisé à cette heure ? |
| `password` | comment change-t-on le mot de passe (règles de qualité) ? |
| `session` | que faire avant/après la session (limites, montage du home) ? |

Chaque ligne a un **contrôle** : `required` (doit réussir, mais on continue), `requisite` (échec = arrêt immédiat), `sufficient` (réussite = suffisant), `optional`.

```text
auth    required    pam_unix.so
password requisite  pam_pwquality.so retry=3 minlen=12
```

### Politique de mots de passe : pam_pwquality

Fichier `/etc/security/pwquality.conf` :

```ini
minlen = 12        # longueur minimale
minclass = 3       # au moins 3 types de caractères (minuscule, majuscule, chiffre, symbole)
retry = 3
```

### Blocage après échecs : pam_faillock

Dans les fichiers PAM (`system-auth`/`common-auth`), avec `/etc/security/faillock.conf` :

```ini
deny = 3            # 3 échecs
unlock_time = 600   # blocage de 10 minutes
```

```bash
faillock --user alice          # consulter les échecs
sudo faillock --user alice --reset   # débloquer
```

### Durcissement des comptes

`/etc/login.defs` fixe les valeurs par défaut : `PASS_MAX_DAYS 90`, `PASS_MIN_DAYS 1`, `PASS_WARN_AGE 7`. Pour un compte existant, utilisez `chage` (voir 2.1).

:::examen Questions classiques
« Quelle différence entre `su -` et `sudo -i` ? » (mot de passe de la cible contre le vôtre, journalisation) ; « Pourquoi visudo ? » ; « Comment autoriser bob à relancer nginx uniquement, sans mot de passe ? »
:::

:::exemple Récupérer l'accès après une erreur dans sudoers
Redémarrez en mode secours (GRUB, ajouter `single` ou `init=/bin/bash`, remonter `/` en lecture-écriture avec `mount -o remount,rw /`), corrigez le fichier avec `visudo`, puis redémarrez.
:::

## 2.3.6 Exercices corrigés

**Exercice 1.** Donnez à `alice` tous les droits sudo sur Ubuntu, puis sur Red Hat.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo usermod -aG sudo alice     # Ubuntu / Debian
sudo usermod -aG wheel alice    # Red Hat / CentOS / Fedora
```

L'option `-a` est indispensable : sans elle, `-G` remplace tous les groupes secondaires.

</details>

**Exercice 2.** Autorisez `bob` à exécuter uniquement `systemctl restart nginx` sans mot de passe.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo visudo -f /etc/sudoers.d/bob
```

```text
bob ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx
```

Vérification : `sudo -l -U bob`. Le fichier doit être en `0440`.

</details>

**Exercice 3.** Différence entre `su`, `su -`, `sudo -i` et `sudo -s` ?

<details>
<summary>Voir le corrigé</summary>

`su` : shell de la cible avec **votre** environnement, mot de passe de la cible. `su -` : environnement de login complet de la cible. `sudo -i` : shell de login root, avec **votre** mot de passe. `sudo -s` : shell root qui garde votre environnement. On le vérifie avec `env` (HOME, PATH, USER diffèrent).

</details>

**Exercice 4.** Pourquoi `sudo echo "test" > /etc/test.conf` échoue-t-il et comment le réussir ?

<details>
<summary>Voir le corrigé</summary>

La redirection est faite par le shell de l'utilisateur, non par `sudo`. Il faut `echo "test" | sudo tee /etc/test.conf`.

</details>

**Exercice 5.** Où sudo journalise-t-il ?

<details>
<summary>Voir le corrigé</summary>

`/var/log/auth.log` sous Debian/Ubuntu, `/var/log/secure` sous Red Hat, ou `journalctl _COMM=sudo`.

</details>

**Exercice 6.** Autorisez le groupe `ops` à n'utiliser que des commandes réseau, avec des alias.

<details>
<summary>Voir le corrigé</summary>

```text
Cmnd_Alias RESEAU = /usr/sbin/ip, /usr/bin/ss, /usr/bin/ping
%ops ALL=(root) RESEAU
```

Fichier créé avec `visudo -f /etc/sudoers.d/ops`.

</details>

**Exercice 7.** Bloquez un compte après 3 échecs pendant 10 minutes.

<details>
<summary>Voir le corrigé</summary>

Dans `/etc/security/faillock.conf` : `deny = 3` et `unlock_time = 600` (avec `pam_faillock` activé dans la pile PAM). Consultation : `faillock --user alice` ; débloquer : `sudo faillock --user alice --reset`.

</details>

**Exercice 8.** Pourquoi `sudo less /var/log/syslog` est-il risqué si c'est la règle accordée ?

<details>
<summary>Voir le corrigé</summary>

Dans `less`, la commande `!sh` ouvre un shell avec les droits de root : la règle permet donc de devenir root. Remède : `sudoedit` ou `NOEXEC:`, ou donner la lecture via un groupe (`adm`).

</details>

**Exercice 9.** Imposez des mots de passe d'au moins 12 caractères.

<details>
<summary>Voir le corrigé</summary>

Dans `/etc/security/pwquality.conf` : `minlen = 12` (et `minclass = 3`), module `pam_pwquality` actif dans la pile `password`.

</details>
