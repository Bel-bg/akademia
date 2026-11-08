## 3.4.1 Pourquoi des paquets ?

Sous Windows, on télécharge un `setup.exe` sur un site, on clique sur « Suivant » et le logiciel s'éparpille dans le disque. Sous Linux, on procède comme dans une **bibliothèque municipale** : un catalogue officiel (le dépôt) liste les logiciels disponibles, un bibliothécaire (le gestionnaire de paquets) va les chercher, les range au bon endroit, note ce qu'il a prêté et sait les reprendre proprement.

Un **paquet** est une archive qui contient :
- les fichiers du logiciel (binaires, bibliothèques, documentation, fichiers de configuration) ;
- des **métadonnées** : nom, version, architecture, description, **dépendances** ;
- des **scripts de maintenance** (`preinst`, `postinst`, `prerm`, `postrm`) exécutés avant ou après l'installation ou la suppression.

Un **dépôt** (repository) est un serveur (HTTP, FTP ou un disque local) qui héberge des paquets et un **index** qui les décrit. Les **dépendances** sont les autres paquets nécessaires au bon fonctionnement : installer `nginx` oblige à installer ses bibliothèques. Le gestionnaire résout ce graphe automatiquement.

### Deux familles, deux niveaux d'outils

| | Famille Debian (Debian, Ubuntu) | Famille Red Hat (RHEL, CentOS Stream, Fedora, Rocky, Alma) |
|---|---|---|
| Format de paquet | `.deb` | `.rpm` |
| Outil bas niveau (un fichier, sans dépendances) | `dpkg` | `rpm` |
| Outil haut niveau (dépôts, dépendances) | `apt` | `dnf` (ancien : `yum`) |
| Configuration des dépôts | `/etc/apt/sources.list`, `/etc/apt/sources.list.d/` | `/etc/yum.repos.d/*.repo` |

L'outil **bas niveau** installe un fichier local mais ne va pas chercher les dépendances manquantes. L'outil **haut niveau** consulte les dépôts et s'occupe de tout. Règle pratique : on travaille avec `apt` ou `dnf`, et on descend à `dpkg` ou `rpm` pour interroger la base ou traiter un fichier isolé.

### Signatures GPG : faire confiance au dépôt

Installer un paquet revient à laisser du code s'exécuter en `root` (via les scripts de maintenance). Il faut donc être sûr que le paquet vient bien de l'éditeur. La protection repose sur la **cryptographie à clé publique** :
- l'éditeur signe avec sa **clé privée** (qu'il garde secrète) ;
- vous importez sa **clé publique** sur votre machine ;
- le gestionnaire vérifie la signature avant d'installer. Si le contenu a été altéré, la vérification échoue.

Sur Debian/Ubuntu, c'est surtout l'**index** du dépôt (fichiers `InRelease` ou `Release.gpg`) qui est signé : il contient les empreintes de tous les paquets. Sur RPM, **chaque paquet** est signé. Message classique en cas de clé absente :

```text
W: GPG error: https://depot.example.org stable InRelease: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 4F2A1B3C5D6E7F80
E: The repository 'https://depot.example.org stable InRelease' is not signed.
```

:::retenir Les deux idées clés
1. Le gestionnaire de paquets **résout les dépendances** ; `dpkg` et `rpm` seuls ne le font pas.
2. La **signature GPG** garantit l'origine : n'ajoutez jamais un dépôt dont vous ne connaissez pas la source, et ne désactivez jamais la vérification (`gpgcheck=0`, `--allow-unauthenticated`) pour « faire passer » une erreur.
:::

## 3.4.2 dpkg : le niveau bas de Debian

`dpkg` gère la base des paquets installés (`/var/lib/dpkg/`). Il travaille sur des fichiers `.deb` locaux.

| Commande | Effet |
|---|---|
| `sudo dpkg -i paquet.deb` | Installe (ou met à jour) un fichier `.deb` |
| `sudo dpkg -r nom` | Supprime le paquet, **garde** les fichiers de configuration |
| `sudo dpkg -P nom` | **Purge** : supprime aussi la configuration |
| `dpkg -l` | Liste les paquets connus (`dpkg -l 'ssh*'` filtre) |
| `dpkg -L nom` | Liste les fichiers installés par le paquet |
| `dpkg -S /chemin/fichier` | Trouve **à quel paquet** appartient un fichier installé |
| `dpkg -s nom` | Affiche l'état et les métadonnées d'un paquet installé |
| `sudo dpkg --configure -a` | Termine la configuration des paquets laissés à moitié |
| `dpkg -c paquet.deb` | Liste le **contenu** d'un fichier `.deb` (sans l'installer) |
| `dpkg -I paquet.deb` | Affiche les **informations** (control) d'un fichier `.deb` |

```bash
dpkg -l 'openssh*'
```

```text
Desired=Unknown/Install/Remove/Purge/Hold
| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
||/ Name              Version                Architecture Description
+++-=================-======================-============-==========================================
ii  openssh-client    1:9.6p1-3ubuntu13.5    amd64        secure shell (SSH) client, for secure access to remote machines
ii  openssh-server    1:9.6p1-3ubuntu13.5    amd64        secure shell (SSH) server, for secure access from remote machines
rc  openssh-sftp-server 1:8.9p1-3ubuntu0.1   amd64        secure shell (SSH) sftp server module
```

La première colonne se lit ainsi : `ii` = installé ; `rc` = supprimé (**r**emoved) mais configuration (**c**onfig) conservée ; `un` = inconnu/non installé. Les noms et versions ci-dessus sont des exemples : vos numéros seront différents.

```bash
dpkg -S /usr/bin/ssh
dpkg -L openssh-client | head -5
dpkg -s openssh-client | head -8
```

```text
openssh-client: /usr/bin/ssh
/.
/etc
/etc/ssh
/etc/ssh/ssh_config
/etc/ssh/ssh_config.d
Package: openssh-client
Status: install ok installed
Priority: standard
Section: net
Installed-Size: 1990
Maintainer: Ubuntu Developers
Architecture: amd64
Version: 1:9.6p1-3ubuntu13.5
```

`dpkg -S` est la réponse à la question d'examen « à quel paquet appartient ce fichier ? » ; son équivalent RPM est `rpm -qf`.

### Le piège de dpkg -i : les dépendances

```bash
sudo dpkg -i monlogiciel_1.0_amd64.deb
```

```text
dpkg: dependency problems prevent configuration of monlogiciel:
 monlogiciel depends on libfoo2 (>= 2.1); however:
  Package libfoo2 is not installed.
dpkg: error processing package monlogiciel (--install):
 dependency problems - leaving unconfigured
```

Le paquet est **décompressé mais non configuré**. Deux solutions : `sudo apt -f install` (voir 3.4.8) qui récupère les dépendances manquantes, ou, mieux, **ne pas passer par dpkg** : `sudo apt install ./monlogiciel_1.0_amd64.deb` (le `./` est obligatoire, sinon `apt` cherche un paquet de ce nom dans les dépôts) installe le fichier **et** ses dépendances.

## 3.4.3 apt : le niveau haut

`apt` est l'interface moderne et interactive. Dans les scripts, on préfère historiquement `apt-get` (interface stable), mais `apt` est suffisant pour l'examen.

| Commande | Effet |
|---|---|
| `sudo apt update` | **Télécharge les index** des dépôts (n'installe rien) |
| `sudo apt upgrade` | Met à jour les paquets installés, **sans jamais en supprimer** |
| `sudo apt full-upgrade` | Comme `upgrade`, mais peut **supprimer ou ajouter** des paquets pour résoudre les conflits (ancien `dist-upgrade`) |
| `sudo apt install nom` | Installe (avec dépendances) ; plusieurs noms possibles |
| `sudo apt remove nom` | Supprime, garde la configuration |
| `sudo apt purge nom` | Supprime **et** efface la configuration |
| `sudo apt autoremove` | Supprime les dépendances devenues inutiles (ajoutez `--purge` pour la configuration) |
| `apt search mot` | Cherche dans les noms et descriptions |
| `apt show nom` | Affiche la fiche (version, dépendances, taille, description) |
| `apt list --installed` | Liste les paquets installés |
| `apt list --upgradable` | Liste ceux pour lesquels une mise à jour existe |
| `apt policy nom` | Version installée, **candidate**, dépôts d'origine et priorités |
| `apt download nom` | Télécharge le `.deb` dans le répertoire courant, sans l'installer |

:::attention update n'est pas upgrade
`apt update` **rafraîchit le catalogue** ; `apt upgrade` **installe les nouveautés**. Sans `update` préalable, `apt install` peut échouer avec « Unable to locate package » (index vide ou périmé) ou installer une version ancienne. Le réflexe : `sudo apt update && sudo apt upgrade`. Pour voir ce qui se passerait sans rien modifier, ajoutez `-s` (simulation) : `apt -s upgrade`.
:::

```bash
sudo apt update
```

```text
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]
Get:3 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
Fetched 252 kB in 1s (310 kB/s)
Reading package lists... Done
Building dependency tree... Done
7 packages can be upgraded. Run 'apt list --upgradable' to see them.
```

### Remove, purge, autoremove : qui fait quoi ?

| Commande | Binaires du paquet | Configuration (`/etc`) | Dépendances orphelines |
|---|---|---|---|
| `apt remove nginx` | supprimés | **conservée** | conservées |
| `apt purge nginx` | supprimés | **supprimée** | conservées |
| `apt autoremove` | (aucun paquet nommé) | selon `--purge` | **supprimées** |

Les données dans `/var/lib` ou les bases créées par le service ne sont généralement pas supprimées par `purge` : vérifiez avant de réinstaller si vous voulez repartir de zéro.

### Cycle de vie complet

```bash
apt search "^htop$"
apt show htop | head -6
sudo apt install htop
dpkg -L htop | grep bin
sudo apt purge htop
sudo apt autoremove
```

```text
Sorting... Done
Full Text Search... Done
htop/noble 3.3.0-4build1 amd64
  interactive processes viewer

Package: htop
Version: 3.3.0-4build1
Priority: optional
Section: utils
Origin: Ubuntu
Maintainer: Ubuntu Developers
/usr/bin/htop
```

### Versions : épingler, installer une version précise, revenir en arrière

```bash
apt policy openssh-server
```

```text
openssh-server:
  Installed: 1:9.6p1-3ubuntu13.5
  Candidate: 1:9.6p1-3ubuntu13.5
  Version table:
 *** 1:9.6p1-3ubuntu13.5 500
        500 http://archive.ubuntu.com/ubuntu noble-updates/main amd64 Packages
        100 /var/lib/dpkg/status
     1:9.6p1-3ubuntu13 500
        500 http://archive.ubuntu.com/ubuntu noble/main amd64 Packages
```

Les `***` marquent la version installée ; le nombre (500, 100) est la **priorité** du dépôt. Pour lister toutes les versions disponibles : `apt list -a openssh-server` (ou `apt-cache madison openssh-server`).

| Besoin | Commande |
|---|---|
| Installer une version précise | `sudo apt install openssh-server=1:9.6p1-3ubuntu13` |
| **Downgrade** (revenir à une version plus ancienne) | La même commande avec une version **inférieure** : `apt` prévient « The following packages will be DOWNGRADED » |
| **Geler** un paquet (aucune mise à jour) | `sudo apt-mark hold openssh-server` |
| Dégeler | `sudo apt-mark unhold openssh-server` |
| Voir les paquets gelés | `apt-mark showhold` |
| Marquer comme installé manuellement / automatiquement | `apt-mark manual nom`, `apt-mark auto nom` |
| Mettre à jour **un seul** paquet | `sudo apt install --only-upgrade nom` |

Un paquet marqué `auto` (installé comme dépendance) est candidat à `autoremove` dès que plus rien ne l'utilise ; `manual` le protège.

## 3.4.4 Les dépôts : sources.list et sources.list.d

Le catalogue que consulte `apt` est défini dans :
- `/etc/apt/sources.list` (format historique, une ligne par dépôt) ;
- `/etc/apt/sources.list.d/*.list` (un fichier par dépôt, même format) ;
- `/etc/apt/sources.list.d/*.sources` (nouveau format **deb822**, par défaut sur **Ubuntu 24.04** dans `ubuntu.sources`).

Format historique (Ubuntu 22.04) :

```text
deb http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu jammy-updates main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu jammy-security main restricted universe multiverse
```

Une ligne se lit : `type  URL  distribution  composant(s)`.
- `deb` : paquets binaires ; `deb-src` : sources (rarement utile) ;
- la **distribution** est le nom de code : `jammy` (22.04), `noble` (24.04), suivi éventuellement de `-updates`, `-security` ;
- les **composants** : `main` (logiciel libre officiellement supporté), `restricted` (pilotes propriétaires), `universe` (libre, maintenu par la communauté), `multiverse` (non libre).

Format deb822 (Ubuntu 24.04) :

```text
Types: deb
URIs: http://archive.ubuntu.com/ubuntu/
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

Après toute modification d'un fichier de dépôt : `sudo apt update`.

### Ajouter un dépôt tiers avec sa clé

Beaucoup d'éditeurs (Docker, Microsoft, etc.) publient leur propre dépôt. La méthode actuelle consiste à stocker la clé dans un **trousseau dédié** (`/etc/apt/keyrings/`) et à lier **ce dépôt seulement** à cette clé avec `signed-by`. Exemple avec un éditeur fictif :

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://depot.example.org/cle-publique.asc | sudo gpg --dearmor -o /etc/apt/keyrings/example.gpg
echo "deb [signed-by=/etc/apt/keyrings/example.gpg] https://depot.example.org/apt stable main" | sudo tee /etc/apt/sources.list.d/example.list
sudo apt update
sudo apt install logiciel-example
```

`gpg --dearmor` convertit la clé du format texte (ASCII) au format binaire attendu. Si l'éditeur fournit déjà un fichier binaire `.gpg`, un simple téléchargement vers `/etc/apt/keyrings/` suffit. Avant de faire confiance à la clé, **vérifiez son empreinte** sur le site officiel : `gpg --show-keys /etc/apt/keyrings/example.gpg`.

:::attention apt-key est obsolète
Les anciens tutoriels recommandent `apt-key add`. Cette commande est **obsolète** (deprecated) : elle ajoute la clé à un trousseau **global**, ce qui permet à n'importe quel dépôt déjà configuré d'être « authentifié » par cette clé. Avec `signed-by`, une clé n'est valable que pour **son** dépôt. Si un tutoriel utilise `apt-key`, remplacez-le par la méthode ci-dessus.
:::

### PPA, snap, flatpak

- **PPA** (Personal Package Archive, spécifique à Ubuntu) : dépôt personnel hébergé sur Launchpad. `sudo add-apt-repository ppa:utilisateur/nom` ajoute le dépôt et sa clé (nécessite le paquet `software-properties-common`) ; `sudo add-apt-repository --remove ppa:utilisateur/nom` le retire. Un PPA n'est pas contrôlé par Ubuntu : risque réel.
- **snap** (Canonical) : paquets autonomes, mis à jour automatiquement, isolés. `snap find nom`, `sudo snap install nom`, `snap list`, `sudo snap refresh`, `sudo snap remove nom`.
- **flatpak** : même idée, surtout pour les applications de bureau. `flatpak install flathub org.exemple.App`, `flatpak list`, `flatpak update`, `flatpak uninstall org.exemple.App` (le dépôt Flathub doit d'abord être ajouté).

Ces formats embarquent leurs bibliothèques : plus lourds, mais indépendants des dépendances du système.

## 3.4.5 rpm et dnf : la famille Red Hat

### rpm : le niveau bas

| Commande | Effet |
|---|---|
| `sudo rpm -ivh paquet.rpm` | Installe (`-v` verbeux, `-h` barre de progression) |
| `sudo rpm -Uvh paquet.rpm` | Met à jour (ou installe si absent) |
| `sudo rpm -e nom` | Efface (erase) le paquet |
| `rpm -q nom` | Le paquet est-il installé ? Quelle version ? |
| `rpm -qa` | Liste **tous** les paquets installés |
| `rpm -ql nom` | Liste les **fichiers** du paquet |
| `rpm -qf /chemin/fichier` | **À quel paquet** appartient le fichier |
| `rpm -qi nom` | Informations du paquet |
| `rpm -qpl paquet.rpm` | Contenu d'un fichier `.rpm` non installé (`p` = package file) |
| `rpm -V nom` | **Vérifie** les fichiers installés par rapport à la base |
| `sudo rpm --import cle.asc` | Importe une clé GPG publique |
| `rpm -K paquet.rpm` | Vérifie la signature et l'intégrité du fichier |

```bash
rpm -qf /usr/bin/ssh
rpm -q openssh-clients
```

```text
openssh-clients-8.7p1-38.el9.x86_64
openssh-clients-8.7p1-38.el9.x86_64
```

### dnf : le niveau haut

| Commande | Effet |
|---|---|
| `sudo dnf install nom` | Installe avec les dépendances |
| `sudo dnf remove nom` | Supprime |
| `sudo dnf update` (ou `upgrade`) | Met à jour un paquet ou tout le système |
| `dnf check-update` | Liste les mises à jour disponibles |
| `dnf search mot` | Recherche |
| `dnf info nom` | Fiche du paquet |
| `dnf provides /usr/bin/ssh` | Quel paquet **fournit** ce fichier (même s'il n'est pas installé) |
| `dnf repolist` | Liste les dépôts actifs (`--all` : tous) |
| `dnf history` | Historique des transactions, numérotées |
| `sudo dnf history undo 12` | **Annule** la transaction n° 12 |
| `sudo dnf versionlock add nom` | Fige la version (nécessite le plugin `python3-dnf-plugin-versionlock`) |
| `sudo dnf autoremove` | Supprime les dépendances orphelines |
| `sudo dnf clean all` | Vide le cache |

Un dépôt se déclare par un fichier `.repo` dans `/etc/yum.repos.d/` :

```ini
# /etc/yum.repos.d/example.repo
[example]
name=Depot Example
baseurl=https://depot.example.org/rpm/el9/$basearch
enabled=1
gpgcheck=1
gpgkey=https://depot.example.org/rpm/RPM-GPG-KEY-example
```

`gpgcheck=1` impose la vérification de la signature de chaque paquet ; `gpgkey` indique où trouver la clé (dnf propose de l'importer à la première installation, **vérifiez l'empreinte** affichée). Un `.repo` s'écrit à la main ou se télécharge ; ne mettez jamais `gpgcheck=0` pour contourner une erreur.

### Correspondance apt / dnf

| Action | Debian / Ubuntu | RHEL / Fedora |
|---|---|---|
| Rafraîchir le catalogue | `apt update` | `dnf makecache` (automatique) |
| Mise à jour complète | `apt upgrade` | `dnf upgrade` |
| Installer | `apt install nom` | `dnf install nom` |
| Supprimer | `apt remove nom` | `dnf remove nom` |
| Supprimer avec la configuration | `apt purge nom` | (pas d'équivalent exact : `dnf remove`) |
| Orphelins | `apt autoremove` | `dnf autoremove` |
| Chercher | `apt search mot` | `dnf search mot` |
| Informations | `apt show nom` | `dnf info nom` |
| Liste des installés | `apt list --installed` ou `dpkg -l` | `dnf list installed` ou `rpm -qa` |
| Fichiers d'un paquet | `dpkg -L nom` | `rpm -ql nom` |
| Paquet propriétaire d'un fichier | `dpkg -S fichier` | `rpm -qf fichier` |
| Qui fournit un fichier (non installé) | `apt-file search fichier` | `dnf provides fichier` |
| Geler une version | `apt-mark hold nom` | `dnf versionlock add nom` |
| Installer un fichier local | `apt install ./f.deb` | `dnf install ./f.rpm` |
| Vider le cache | `apt clean` | `dnf clean all` |
| Historique | `/var/log/apt/history.log` | `dnf history` |

:::examen Ce qui tombe à l'examen
- Donner la commande pour installer, supprimer, **purger**, rechercher un paquet, et trouver **le paquet d'un fichier** (`dpkg -S` / `rpm -qf`).
- Différence `update` / `upgrade` ; `remove` / `purge` / `autoremove`.
- Différence entre `dpkg` (bas niveau) et `apt` (dépendances).
- Où se déclarent les dépôts (`/etc/apt/sources.list`, `sources.list.d`, `/etc/yum.repos.d`) et rôle de la clé GPG.
:::

## 3.4.6 Vérifier l'intégrité et automatiser les mises à jour

### Détecter un fichier modifié

Un fichier de programme qui ne correspond plus au paquet peut signaler une corruption ou une compromission.

- Debian/Ubuntu : `sudo apt install debsums`, puis `sudo debsums -c` (affiche seulement les fichiers **modifiés**), `sudo debsums -s` (silencieux : n'affiche que les erreurs), `sudo debsums -e` (vérifie aussi les fichiers de configuration, naturellement modifiables).
- RHEL : `rpm -V nom` ou `sudo rpm -Va` (tout le système).

```bash
sudo rpm -V openssh-server
```

```text
S.5....T.  c /etc/ssh/sshd_config
```

Lecture de `S.5....T.  c` : 9 caractères d'attributs, puis le type de fichier. `S` = taille différente, `5` = somme MD5/SHA différente (contenu changé), `T` = date de modification différente, `M` = droits, `U`/`G` = propriétaire/groupe, `L` = lien ; un point `.` signifie « identique ». `c` signale un fichier de **configuration** : sa modification est normale. Une ligne sans `c` sur un binaire (`/usr/bin/ssh`) est en revanche suspecte. Absence de sortie = tout est conforme.

### Mises à jour de sécurité automatiques

Sur un serveur, appliquer les correctifs de sécurité sans attendre est un gain majeur.

**Ubuntu : unattended-upgrades**

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
sudo unattended-upgrade --dry-run -d
```

Le fichier `/etc/apt/apt.conf.d/20auto-upgrades` active la tâche périodique :

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

(`"1"` = tous les jours). Les origines autorisées (par défaut `-security`) sont listées dans `/etc/apt/apt.conf.d/50unattended-upgrades`. L'option `--dry-run` simule sans rien installer ; les journaux sont dans `/var/log/unattended-upgrades/`.

**RHEL/Fedora : dnf-automatic**

```bash
sudo dnf install dnf-automatic
sudo nano /etc/dnf/automatic.conf
sudo systemctl enable --now dnf-automatic.timer
```

Dans `automatic.conf`, la directive `apply_updates = yes` fait **installer** les mises à jour (sinon, elles sont seulement téléchargées ou notifiées). Le timer systemd (voir 3.3) déclenche l'exécution.

## 3.4.7 Compiler depuis les sources

Quand un logiciel n'existe pas en paquet, on peut le compiler. Il faut un compilateur et les outils de base : `sudo apt install build-essential` (Debian/Ubuntu) ou `sudo dnf groupinstall "Development Tools"` (RHEL).

Séquence classique pour une archive de sources `prog-1.0.tar.gz` :

```bash
tar xzf prog-1.0.tar.gz
cd prog-1.0
./configure --prefix=/usr/local
make
sudo make install
```

- `./configure` vérifie le système et prépare la compilation ; `--prefix` choisit le répertoire d'installation ;
- `make` compile (`make -j4` utilise 4 cœurs) ;
- `make install` copie les fichiers dans le préfixe.

**Où installer ?**
- `/usr/local` : réservé aux logiciels installés **localement** par l'administrateur, hors paquets. Les binaires vont dans `/usr/local/bin`, déjà dans le `PATH`. Le gestionnaire de paquets n'y touche jamais.
- `/opt/nom` : logiciel autonome dans son propre dossier (`--prefix=/opt/prog-1.0`), facile à supprimer d'un bloc.

Le défaut majeur : le gestionnaire de paquets **ne connaît pas** ce logiciel. Il n'apparaît pas dans `dpkg -l`, ne reçoit pas de mises à jour de sécurité, et `make uninstall` n'existe pas toujours. Deux outils pallient ce problème :

| Outil | Principe |
|---|---|
| `checkinstall` | Remplace `make install` : `sudo checkinstall` crée un paquet `.deb` et l'installe, donc désinstallable par `dpkg -r` |
| `stow` | Installe dans `/usr/local/stow/prog-1.0` (`--prefix=/usr/local/stow/prog-1.0`), puis `cd /usr/local/stow && sudo stow prog-1.0` crée des **liens symboliques** vers `/usr/local` ; `sudo stow -D prog-1.0` les retire |

:::exemple Installer, puis désinstaller proprement avec stow
```bash
./configure --prefix=/usr/local/stow/prog-1.0
make
sudo make install
cd /usr/local/stow
sudo stow prog-1.0
ls -l /usr/local/bin/prog
```
```text
lrwxrwxrwx 1 root root 33 nov.   7 10:12 /usr/local/bin/prog -> ../stow/prog-1.0/bin/prog
```
Pour désinstaller : `sudo stow -D prog-1.0` puis `sudo rm -r /usr/local/stow/prog-1.0`. Tout est réversible et aucun fichier ne traîne.
:::

## 3.4.8 Dépannage : paquets cassés, verrous, cache

### Installation interrompue ou dépendances cassées

| Symptôme | Commande |
|---|---|
| « dpkg was interrupted, you must manually run 'sudo dpkg --configure -a' » | `sudo dpkg --configure -a` : termine la configuration des paquets en attente |
| Dépendances non satisfaites après un `dpkg -i` | `sudo apt -f install` (`--fix-broken`) : installe ou retire ce qu'il faut |
| Index corrompu ou erreurs « Hash Sum mismatch » | `sudo rm -rf /var/lib/apt/lists/*` (**seulement ce répertoire**, jamais `/var/lib/apt`) puis `sudo apt update` |

Ordre type face à un blocage : `sudo dpkg --configure -a`, puis `sudo apt -f install`, puis `sudo apt update`.

### Verrous

```text
E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 2417 (unattended-upgr)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?
```

Un **verrou** empêche deux gestionnaires de modifier la base en même temps. Souvent, c'est une mise à jour automatique en cours : **attendez**. Identifiez le processus :

```bash
ps -p 2417 -o pid,etime,cmd
sudo lsof /var/lib/dpkg/lock-frontend
```

Les verrous sont `/var/lib/dpkg/lock-frontend`, `/var/lib/dpkg/lock`, `/var/lib/apt/lists/lock` et `/var/cache/apt/archives/lock`. Ne supprimez un fichier de verrou **qu'en dernier recours**, après avoir vérifié qu'**aucun** processus `apt` ou `dpkg` ne tourne, puis lancez `sudo dpkg --configure -a`.

### Cache

Les `.deb` téléchargés restent dans `/var/cache/apt/archives/`. `du -sh /var/cache/apt/archives` donne la place occupée ; `sudo apt clean` vide tout ; `sudo apt autoclean` ne supprime que les paquets devenus obsolètes.

### Journaux d'installation

`/var/log/apt/history.log` (commandes `apt` avec date et paquets), `/var/log/dpkg.log` (chaque étape), `/var/log/dnf.log` ou `dnf history` sur RHEL. Voir 3.3 pour la lecture des journaux.

## 3.4.9 Exercices corrigés

**Exercice 1.** Quel est le paquet propriétaire du fichier `/usr/bin/ssh` ? Donnez la commande Debian puis la commande RHEL.

<details>
<summary>Voir le corrigé</summary>

```bash
dpkg -S /usr/bin/ssh
rpm -qf /usr/bin/ssh
```

`dpkg -S` et `rpm -qf` interrogent la base locale : ils répondent pour un fichier **déjà installé**. Pour un fichier absent, utilisez `apt-file search` (Debian) ou `dnf provides` (RHEL).

</details>

**Exercice 2.** Expliquez la différence entre `apt remove`, `apt purge` et `apt autoremove`.

<details>
<summary>Voir le corrigé</summary>

```text
remove     : supprime le logiciel, garde la configuration dans /etc
purge      : supprime le logiciel ET sa configuration
autoremove : supprime les dépendances installées automatiquement et devenues inutiles
```

Pour tout nettoyer après désinstallation : `sudo apt purge nom && sudo apt autoremove --purge`.

</details>

**Exercice 3.** Mettez à jour le catalogue puis tout le système, en simulant d'abord. Pourquoi `apt update` seul ne met-il rien à jour ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo apt update
apt -s upgrade
sudo apt upgrade
```

`apt update` ne fait que télécharger les listes de paquets disponibles. `-s` simule l'opération sans rien modifier. Seul `apt upgrade` installe les nouvelles versions.

</details>

**Exercice 4.** Installez la version précise `1:9.6p1-3ubuntu13` d'`openssh-server` (supposée plus ancienne que l'installée), puis empêchez qu'elle soit mise à jour.

<details>
<summary>Voir le corrigé</summary>

```bash
apt list -a openssh-server
sudo apt install openssh-server=1:9.6p1-3ubuntu13
sudo apt-mark hold openssh-server
apt-mark showhold
```

On liste d'abord les versions disponibles. La syntaxe `paquet=version` provoque un **downgrade** si la version est inférieure. `hold` bloque ensuite toute mise à jour ; `sudo apt-mark unhold openssh-server` lève le blocage.

</details>

**Exercice 5.** Téléchargez le paquet `htop` sans l'installer, affichez son contenu et ses métadonnées.

<details>
<summary>Voir le corrigé</summary>

```bash
apt download htop
dpkg -c htop_*.deb
dpkg -I htop_*.deb
```

`apt download` dépose le `.deb` dans le répertoire courant. `dpkg -c` liste les fichiers que le paquet installerait ; `dpkg -I` affiche le fichier `control` (version, dépendances) et les scripts de maintenance présents. Équivalent RPM : `rpm -qpl fichier.rpm` et `rpm -qpi fichier.rpm`.

</details>

**Exercice 6.** Ajoutez le dépôt `https://depot.example.org/apt` (distribution `stable`, composant `main`) dont la clé publique est à `https://depot.example.org/cle-publique.asc`, en utilisant la méthode moderne.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://depot.example.org/cle-publique.asc | sudo gpg --dearmor -o /etc/apt/keyrings/example.gpg
echo "deb [signed-by=/etc/apt/keyrings/example.gpg] https://depot.example.org/apt stable main" | sudo tee /etc/apt/sources.list.d/example.list
sudo apt update
```

La clé va dans `/etc/apt/keyrings/` et l'option `signed-by` la lie à ce seul dépôt. `apt-key add` est obsolète car il rend la clé valable pour tous les dépôts. Il faut vérifier l'empreinte de la clé auprès de l'éditeur.

</details>

**Exercice 7.** Après une coupure de courant pendant une mise à jour, `apt` affiche « dpkg was interrupted ». Donnez la séquence de réparation.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo dpkg --configure -a
sudo apt -f install
sudo apt update && sudo apt upgrade
```

`dpkg --configure -a` termine la configuration des paquets décompressés. `apt -f install` corrige les dépendances restantes. On relance ensuite une mise à jour normale pour vérifier que tout est cohérent.

</details>

**Exercice 8.** Sur un serveur RHEL, la commande `rpm -V httpd` renvoie les deux lignes ci-dessous. Que signifient-elles, et laquelle est inquiétante ?

```text
S.5....T.  c /etc/httpd/conf/httpd.conf
..5....T.    /usr/sbin/httpd
```

<details>
<summary>Voir le corrigé</summary>

```text
Ligne 1 : fichier de configuration (c) modifié : taille, contenu et date changent. Normal.
Ligne 2 : le binaire /usr/sbin/httpd a un contenu et une date différents de ceux du paquet. Suspect.
```

Un administrateur modifie légitimement `httpd.conf`, pas un binaire. Il faut réinstaller le paquet (`sudo dnf reinstall httpd`), comparer, et envisager une compromission. Sur Debian, `sudo debsums -c` fait le même contrôle.

</details>

**Exercice 9.** Sur RHEL, installez `httpd`, annulez cette installation grâce à l'historique, puis figez la version de `bash`.

<details>
<summary>Voir le corrigé</summary>

```bash
sudo dnf install httpd
dnf history
sudo dnf history undo 14
sudo dnf install python3-dnf-plugin-versionlock
sudo dnf versionlock add bash
```

`dnf history` affiche les transactions numérotées (ici 14, à adapter) ; `undo` les inverse. `versionlock` est un plugin : il faut l'installer avant d'ajouter `bash` à la liste verrouillée. `sudo dnf versionlock list` montre le résultat.

</details>

**Exercice 10.** Compilez `prog-1.0` depuis ses sources de façon à pouvoir le désinstaller proprement avec `stow`, puis supprimez-le. Pourquoi `/usr/local` plutôt que `/usr` ?

<details>
<summary>Voir le corrigé</summary>

```bash
tar xzf prog-1.0.tar.gz && cd prog-1.0
./configure --prefix=/usr/local/stow/prog-1.0
make
sudo make install
cd /usr/local/stow && sudo stow prog-1.0
# désinstallation
sudo stow -D prog-1.0
sudo rm -r /usr/local/stow/prog-1.0
```

`/usr` appartient au gestionnaire de paquets : y copier à la main des fichiers risque des conflits avec ses futures mises à jour. `/usr/local` lui est réservé à l'administrateur. Avec `stow`, le logiciel vit dans son propre dossier et n'apparaît que par des liens symboliques.

</details>

**Exercice 11.** `apt install` répond « Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 2417 ». Que faites-vous, dans l'ordre ?

<details>
<summary>Voir le corrigé</summary>

```bash
ps -p 2417 -o pid,etime,cmd
sudo lsof /var/lib/dpkg/lock-frontend
```

1. Identifier le processus (souvent `unattended-upgr`, une mise à jour automatique) et **attendre** sa fin.
2. Réessayer ensuite la commande.
3. Seulement si le processus a disparu et que le message persiste : vérifier qu'aucun `apt` ou `dpkg` ne tourne, puis `sudo dpkg --configure -a`.

Supprimer le verrou ou tuer le processus en pleine installation peut corrompre la base des paquets.

</details>
