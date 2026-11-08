## 5.1.1 Pourquoi écrire des scripts ?

Un **script shell** est un fichier texte contenant des commandes exécutées l'une après l'autre. Il sert à automatiser (sauvegardes, création de comptes, audits), à éviter les erreurs de saisie et à rendre une opération reproductible. Citation du cours : « faire un maximum de scripts pour en faire le moins possible ».

## 5.1.2 Premier script

```bash
#!/bin/bash
# bonjour.sh : mon premier script
echo "Bonjour $USER, nous sommes le $(date +%d/%m/%Y)"
```

- La première ligne, le **shebang** `#!/bin/bash`, indique l'interpréteur.
- Rendre exécutable puis lancer :

```bash
chmod +x bonjour.sh
./bonjour.sh          # exécution directe (le ./ est nécessaire : le dossier courant n'est pas dans le PATH)
bash bonjour.sh       # sans droit d'exécution ni shebang
source bonjour.sh     # exécuté DANS le shell courant (les variables restent) ; équivalent : . bonjour.sh
```

Pour l'appeler de partout, placez-le dans un dossier du `PATH` (`~/bin`, `/usr/local/bin`).

:::attention Les deux oublis classiques
Oublier `chmod +x` (erreur `Permission denied`) ou le shebang (le script est interprété par le shell courant, ce qui peut changer son comportement).
:::

## 5.1.3 Variables

```bash
nom="Luke"                # PAS d'espace autour du =
echo "Salut $nom"         # ou ${nom}
echo 'Salut $nom'         # apostrophes : aucun développement → affiche $nom
fichiers=$(ls | wc -l)    # substitution de commande
readonly PI=3.14
export CHEMIN=/opt        # visible par les processus fils
unset nom
```

:::attention Espaces autour du = : erreur classique
`nom = "Luke"` est une erreur : le shell cherche une commande nommée `nom`. Écrivez `nom="Luke"`. Mettez aussi **toujours** les variables entre guillemets (`"$fichier"`), sinon un nom avec espace est coupé en deux.
:::

### Variables spéciales

| Variable | Contenu |
|---|---|
| `$0` | nom du script |
| `$1` … `$9` | arguments (`${10}` au-delà) |
| `$#` | nombre d'arguments |
| `$@` | tous les arguments (chacun préservé avec `"$@"`) |
| `$*` | tous les arguments en une seule chaîne |
| `$?` | code de retour de la dernière commande (0 = succès) |
| `$$` | PID du script |
| `$!` | PID du dernier travail en arrière-plan |

### Saisie, affichage, calcul

```bash
read -p "Votre nom : " nom           # saisie
read -s -p "Mot de passe : " mdp     # saisie masquée
echo "Bonjour $nom"
printf "%-10s %5d\n" "$nom" 42
a=7; b=3
echo $((a * b))          # arithmétique : 21
echo $((a % b))          # reste : 1
```

## 5.1.4 Tests et conditions

```bash
if [ -d /tmp ]; then
  echo "dossier"
elif [ -f /tmp ]; then
  echo "fichier"
else
  echo "autre"
fi
```

Les crochets `[ ]` sont une commande (`test`) : **espaces obligatoires** à l'intérieur. La version moderne `[[ ]]` de bash est plus sûre (pas besoin de guillemets, accepte `&&`, `||`, `=~`).

| Tests sur fichiers | Vrai si… |
|---|---|
| `-e f` | existe |
| `-f f` | fichier ordinaire |
| `-d f` | répertoire |
| `-r` `-w` `-x` | lisible / modifiable / exécutable |
| `-s f` | non vide |
| `-L f` | lien symbolique |

| Chaînes | Entiers | Combinaison |
|---|---|---|
| `"$a" = "$b"`, `!=` | `-eq` `-ne` | `&&` (ET), `\|\|` (OU) |
| `-z "$a"` (vide), `-n "$a"` (non vide) | `-lt` `-le` `-gt` `-ge` | `!` négation |
| `[[ $a =~ ^[0-9]+$ ]]` (regex) | | `-a`, `-o` dans `[ ]` |

```bash
case "$1" in
  start)   echo "démarrage" ;;
  stop)    echo "arrêt" ;;
  *)       echo "usage : $0 start|stop" ;;
esac
```

## 5.1.5 Boucles

```bash
for i in 1 2 3; do echo "$i"; done
for i in {1..10}; do echo "$i"; done
for ((i=0; i<5; i++)); do echo "$i"; done
for f in *.txt; do echo "$f : $(wc -l < "$f") lignes"; done

n=0
while [ "$n" -lt 3 ]; do echo "$n"; n=$((n+1)); done
until [ -f /tmp/pret ]; do sleep 1; done

while IFS= read -r ligne; do echo "> $ligne"; done < fichier.txt   # lecture ligne par ligne
```

`break` sort de la boucle, `continue` passe à l'itération suivante.

## 5.1.6 Fonctions, tableaux, codes de retour

```bash
somme() {
  local a=$1 b=$2           # variables locales
  echo $((a + b))           # « retourne » en affichant
}
resultat=$(somme 4 5)

tab=(Un Deux Trois)
echo "${tab[1]}"            # Deux
echo "${#tab[@]}"           # 3
declare -A age=([luke]=19 [vador]=45)    # tableau associatif
echo "${age[luke]}"
```

`return N` renvoie un **code de retour** (0 à 255), pas une valeur textuelle ; pour obtenir un résultat, on l'affiche avec `echo` et on le capte avec `$(...)`. `exit N` termine le script avec ce code ; on le lit avec `$?`.

## 5.1.7 Robustesse

```bash
#!/bin/bash
set -euo pipefail        # -e : stop si une commande échoue ; -u : variable non définie = erreur ; pipefail : échec dans un tube
tmp=$(mktemp -d)         # dossier temporaire sûr
trap 'rm -rf "$tmp"' EXIT    # nettoyage garanti, même en cas d'erreur
```

Gérer des options avec `getopts` :

```bash
while getopts "hvf:n:" opt; do
  case $opt in
    h) echo "usage..."; exit 0 ;;
    v) verbose=1 ;;
    f) fichier=$OPTARG ;;
    n) nombre=$OPTARG ;;
    *) exit 1 ;;
  esac
done
```

Un script est **idempotent** s'il peut être lancé 10 fois avec le même résultat : testez avant d'agir (`[ -d Ex2 ] || mkdir Ex2`, `mkdir -p`, `id user || useradd user`). Pour déboguer : `bash -x script.sh` ; pour vérifier : `shellcheck script.sh`.

## 5.1.8 Scripts complets

**Création du répertoire Ex2 avec dix fichiers (sujet d'examen) :**

```bash
#!/bin/bash
# Crée Ex2 avec les fichiers Un..Dix, une ligne chacun
rep="Ex2"
if [ -d "$rep" ]; then
  echo "Le répertoire $rep existe déjà : il n'est pas recréé."
  exit 0
fi
mkdir "$rep"
noms=(Un Deux Trois Quatre Cinq Six Sept Huit Neuf Dix)
ord=(Première Deuxième Troisième Quatrième Cinquième Sixième Septième Huitième Neuvième Dixième)
for i in "${!noms[@]}"; do
  echo "${ord[$i]} fichier" > "$rep/${noms[$i]}"
done
```

**Surveillance d'un service avec trois tentatives :**

```bash
#!/bin/bash
svc=${1:?usage: $0 service}
for essai in 1 2 3; do
  if systemctl is-active --quiet "$svc"; then
    echo "$(date '+%F %T') $svc actif" >> /var/log/surveillance.log
    exit 0
  fi
  echo "$(date '+%F %T') $svc arrêté, tentative $essai" >> /var/log/surveillance.log
  systemctl restart "$svc"
  sleep 5
done
echo "$svc ne redémarre pas" | logger -t surveillance -p user.err
exit 1
```

**Création d'utilisateurs depuis un CSV (`login,motdepasse`) :**

```bash
#!/bin/bash
[ "$EUID" -eq 0 ] || { echo "À lancer en root" >&2; exit 1; }
while IFS=, read -r login mdp; do
  if id "$login" &>/dev/null; then
    echo "$login existe déjà"
  else
    useradd -m -s /bin/bash "$login"
    echo "$login:$mdp" | chpasswd
    echo "$login créé"
  fi
done < comptes.csv
```

**Audit système minimal :**

```bash
#!/bin/bash
echo "== $(hostname) : $(date) =="
. /etc/os-release; echo "OS : $PRETTY_NAME"
uptime -p
echo "CPU : $(nproc) cœur(s)"
free -h | awk 'NR==2 {print "RAM : "$3" utilisés sur "$2}'
df -h / | awk 'NR==2 {print "Disque / : "$5" utilisé"}'
echo "Connectés : $(who | wc -l)"
ss -tuln | awk 'NR>1 {print $5}' | sort -u | head
```

:::examen Ce qu'on attend d'un script d'examen
Shebang, test d'existence **avant** l'action, variables entre guillemets, boucle propre, un message clair. Commentez votre code : même une erreur mineure sera pardonnée si la logique est lisible.
:::

## 5.1.9 Exercices corrigés

**Exercice 1.** Que fait `chmod 750 ~/*.pl` ?

<details>
<summary>Voir le corrigé</summary>

Le shell développe `~/*.pl` en tous les fichiers `.pl` du répertoire personnel, puis `chmod` donne `rwxr-x---` : le propriétaire lit/écrit/exécute, le groupe lit et exécute, les autres n'ont aucun droit.

</details>

**Exercice 2.** Écrivez un script qui affiche son nombre d'arguments et le premier.

<details>
<summary>Voir le corrigé</summary>

```bash
#!/bin/bash
echo "Nombre d'arguments : $#"
echo "Premier : ${1:-aucun}"
```

`${1:-aucun}` donne « aucun » si `$1` est vide.

</details>

**Exercice 3.** Un script qui dit si le fichier passé en argument existe, est un fichier ou un répertoire.

<details>
<summary>Voir le corrigé</summary>

```bash
#!/bin/bash
f="$1"
if [ ! -e "$f" ]; then echo "$f n'existe pas"
elif [ -d "$f" ]; then echo "$f est un répertoire"
elif [ -f "$f" ]; then echo "$f est un fichier"
else echo "$f est d'un autre type"
fi
```

</details>

**Exercice 4.** Affichez la table de multiplication par 7 de 1 à 10.

<details>
<summary>Voir le corrigé</summary>

```bash
for i in {1..10}; do echo "7 x $i = $((7 * i))"; done
```

</details>

**Exercice 5.** Lisez un fichier ligne par ligne et numérotez les lignes.

<details>
<summary>Voir le corrigé</summary>

```bash
n=0
while IFS= read -r ligne; do
  n=$((n+1))
  echo "$n: $ligne"
done < fichier.txt
```

`IFS=` et `-r` préservent espaces et antislashs.

</details>

**Exercice 6.** Quelle différence entre `$@` et `$*` ?

<details>
<summary>Voir le corrigé</summary>

Entre guillemets, `"$@"` produit un mot par argument (les espaces internes sont préservés) ; `"$*"` produit un seul mot contenant tous les arguments. On préfère presque toujours `"$@"`.

</details>

**Exercice 7.** Écrivez un script qui crée le répertoire `Ex2` seulement s'il n'existe pas.

<details>
<summary>Voir le corrigé</summary>

```bash
#!/bin/bash
[ -d Ex2 ] || mkdir Ex2
# ou simplement : mkdir -p Ex2
```

`||` n'exécute `mkdir` que si le test échoue.

</details>

**Exercice 8.** Que fait `set -euo pipefail` ?

<details>
<summary>Voir le corrigé</summary>

`-e` arrête le script à la première commande en échec ; `-u` traite une variable non définie comme une erreur ; `-o pipefail` fait échouer un tube si l'une de ses commandes échoue.

</details>

**Exercice 9.** Comment obtenir un nettoyage fiable d'un fichier temporaire ?

<details>
<summary>Voir le corrigé</summary>

```bash
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
```

Le `trap ... EXIT` s'exécute à la sortie normale comme en cas d'erreur.

</details>

**Exercice 10.** Pourquoi `a = 5` échoue-t-il ?

<details>
<summary>Voir le corrigé</summary>

Les espaces font interpréter `a` comme une commande suivie des arguments `=` et `5`. Écrire `a=5`.

</details>
