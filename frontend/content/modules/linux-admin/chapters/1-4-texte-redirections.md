## 1.4.1 Les trois flux standard

Tout processus Linux possède trois « tuyaux » ouverts dès son démarrage, identifiés par un numéro appelé **descripteur de fichier** :

| Nom | Numéro | Rôle | Par défaut |
|---|---|---|---|
| `stdin` | 0 | entrée standard | le clavier |
| `stdout` | 1 | sortie standard (résultats) | l'écran |
| `stderr` | 2 | sortie d'erreur (messages d'erreur) | l'écran |

`stdout` et `stderr` s'affichent tous les deux à l'écran, mais ce sont **deux flux distincts** : on peut les envoyer à des endroits différents.

```bash
ls /etc /inexistant
```

```text
ls: impossible d'accéder à '/inexistant': Aucun fichier ou dossier de ce type
/etc:
adduser.conf
...
```

La première ligne est écrite sur `stderr`, la liste de `/etc` sur `stdout`.

## 1.4.2 Les redirections

| Syntaxe | Effet |
|---|---|
| `cmd > f` | `stdout` vers `f` (le fichier est **écrasé**) |
| `cmd >> f` | `stdout` ajouté **à la fin** de `f` |
| `cmd < f` | `stdin` lu depuis `f` |
| `cmd 2> f` | `stderr` vers `f` |
| `cmd 2>> f` | `stderr` ajouté à `f` |
| `cmd > f 2> g` | `stdout` dans `f`, `stderr` dans `g` |
| `cmd > f 2>&1` | `stdout` ET `stderr` dans `f` |
| `cmd &> f` | idem (raccourci bash) |
| `cmd 2>/dev/null` | on jette les erreurs |

```bash
ls /etc /inexistant > sortie.txt 2> erreurs.txt
cat erreurs.txt
```

:::attention L'ordre des redirections compte
`cmd > f 2>&1` signifie : « envoie `stdout` dans `f`, puis `stderr` là où va `stdout` (donc `f`) ». Mais `cmd 2>&1 > f` envoie `stderr` vers l'ancien `stdout` (l'écran), puis seulement `stdout` vers `f` : les erreurs restent à l'écran. On lit de gauche à droite.
:::

:::attention `>` écrase sans prévenir
`echo "x" > fichier` détruit l'ancien contenu. Pour ajouter, utilisez `>>`. Une faute classique à l'examen est de confondre les deux.
:::

### Fichiers spéciaux dans /dev

| Fichier | Comportement |
|---|---|
| `/dev/null` | « trou noir » : avale tout, lit comme vide |
| `/dev/zero` | fournit des octets nuls à l'infini |
| `/dev/urandom` | octets aléatoires |
| `/dev/full` | répond toujours « disque plein » (sert aux tests) |

```bash
head -c 10M /dev/zero > gros.bin                 # fichier de 10 Mo
tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 16   # mot de passe aléatoire de 16 caractères
> fichier.txt                                    # vide un fichier (ou : : > fichier.txt)
```

### Here-document et here-string

```bash
cat > config.txt <<'EOF'
serveur=10.0.0.1
port=8080
EOF

mot=$(tr 'a-z' 'A-Z' <<< "bonjour")   # here-string : une chaîne sur stdin
echo "$mot"                            # BONJOUR
```

## 1.4.3 Les tubes (pipes)

Le tube `|` branche le `stdout` d'une commande sur le `stdin` de la suivante. Philosophie Unix : petits outils, enchaînés.

```bash
ls /etc | wc -l                         # nombre d'entrées de /etc
cat /etc/passwd | grep root             # lignes contenant « root »
ps aux | sort -nrk 3 | head -5          # 5 processus les plus gourmands en CPU
```

`tee` copie le flux vers un fichier **et** vers la sortie : `dmesg | tee dmesg.txt | grep -i usb`.

:::retenir Redirection et tube : ne pas confondre
`>` envoie vers un **fichier** ; `|` envoie vers une **commande**. Les erreurs ne passent pas dans le tube (seul `stdout` y passe) : pour les faire passer, `cmd 2>&1 | autre` ou `cmd |& autre`.
:::

## 1.4.4 Les filtres de base

| Commande | Rôle | Exemple |
|---|---|---|
| `cat f` | affiche / concatène | `cat a b > ab` |
| `head -n N` | N premières lignes (10 par défaut) | `head -n 5 /etc/passwd` |
| `tail -n N` | N dernières lignes ; `-f` suit le fichier | `tail -f /var/log/syslog` |
| `wc -l -w -c` | lignes, mots, octets | `wc -l /etc/passwd` |
| `sort` | trie ; `-n` numérique, `-r` inverse, `-k2` colonne, `-t:` séparateur, `-u` sans doublon | `sort -t: -k3 -n /etc/passwd` |
| `uniq` | supprime les doublons **consécutifs** ; `-c` compte | `sort f \| uniq -c` |
| `cut` | découpe : `-d` séparateur, `-f` champs | `cut -d: -f1,7 /etc/passwd` |
| `tr` | remplace/supprime des caractères | `tr 'a-z' 'A-Z'` |
| `paste` | colle des fichiers côte à côte | `paste noms numeros` |
| `diff -u` | différences entre deux fichiers | `diff -u a.conf b.conf` |

:::exemple Afficher la 7e ligne seule
`head -n 7 fichier | tail -n 1` : on garde les 7 premières lignes puis la dernière des 7. Autre solution : `sed -n 7p fichier`.
:::

Fil rouge : `telephone.txt`, un répertoire où chaque ligne est `nom prénom numéro` (séparés par des **tabulations**).

```bash
sort telephone.txt                          # trié par nom
wc -l telephone.txt                         # nombre de personnes
grep Dupond telephone.txt | head -n 1 | cut -f3   # numéro du premier Dupond (cut: tabulation par défaut)
grep -v Dupond telephone.txt                # tous sauf les Dupond
```

## 1.4.5 grep et les expressions régulières

`grep motif fichier` affiche les lignes qui correspondent.

| Option | Sens |
|---|---|
| `-i` | ignorer la casse |
| `-v` | inverser (lignes qui ne correspondent pas) |
| `-n` | numéros de ligne |
| `-c` | compter les lignes |
| `-r` | récursif dans un dossier |
| `-l` | seulement les noms de fichiers |
| `-w` | mot entier |
| `-o` | n'afficher que la partie qui correspond |
| `-E` | expressions régulières étendues (= `egrep`) |
| `-A n -B n -C n` | lignes après / avant / autour |

### Les caractères spéciaux

| Symbole | Signification |
|---|---|
| `.` | un caractère quelconque |
| `^` `$` | début / fin de ligne |
| `[abc]` `[a-z]` `[^0-9]` | un caractère de la liste / de l'intervalle / hors liste |
| `*` | 0 ou plusieurs fois l'élément précédent |
| `+` | 1 fois ou plus (ERE) |
| `?` | 0 ou 1 fois (ERE) |
| `{n,m}` | de n à m fois (ERE) |
| `(a\|b)` | groupe et alternative (ERE) |
| `[[:digit:]]` `[[:space:]]` | classes POSIX |

En mode basique (`grep` sans `-E`), `+ ? { } | ( )` doivent être précédés d'un antislash.

```bash
grep -E '^(daemon|root):' /etc/passwd              # lignes commençant par daemon: ou root:
grep -rin 'PermitRootLogin' /etc/ssh/              # recherche récursive, insensible à la casse
grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' access.log | sort -u   # adresses IPv4 sans doublon
grep -v -E '^(#|$)' /etc/ssh/sshd_config           # configuration effective : sans commentaires ni lignes vides
grep HTTP /etc/services                            # lignes contenant la chaîne HTTP
```

## 1.4.6 sed et awk

**sed** est un éditeur de flux : il transforme le texte ligne par ligne.

```bash
sed 's/ancien/nouveau/' f           # remplace la 1re occurrence de chaque ligne
sed 's/ancien/nouveau/g' f          # toutes les occurrences
sed -i.bak 's/ancien/nouveau/g' f   # modifie f EN PLACE et garde f.bak
sed -n '5,10p' f                    # affiche seulement les lignes 5 à 10
sed '/^#/d;/^$/d' f                 # supprime commentaires et lignes vides
sed '3d' f                          # supprime la ligne 3
```

**awk** découpe chaque ligne en champs (`$1`, `$2`, …, `$NF` = dernier, `$0` = ligne entière, `NR` = numéro de ligne).

```bash
awk -F: '{print $1, $7}' /etc/passwd                # login et shell
awk -F: '$3 >= 1000 {print $1}' /etc/passwd         # comptes dont l'UID est ≥ 1000
awk '{s += $1} END {print s}' nombres.txt           # somme d'une colonne
awk 'NR>=5 && NR<=10' /etc/passwd                   # lignes 5 à 10
```

## 1.4.7 find : chercher des fichiers

Syntaxe : `find OÙ CRITÈRES ACTION`.

| Critère | Sens |
|---|---|
| `-name "*.h"` / `-iname` | nom (jokers entre guillemets) / sans casse |
| `-type f` / `d` / `l` | fichier / dossier / lien |
| `-size +100M` | plus de 100 Mo (`-1k` : moins de 1 Ko) |
| `-mtime -7` / `+7` | modifié depuis moins / plus de 7 jours |
| `-mmin -30` | modifié depuis moins de 30 minutes |
| `-user alice` / `-group dev` | propriétaire / groupe |
| `-perm 644` / `-perm -4000` | permissions exactes / SUID présent |
| `-maxdepth 2` | profondeur limitée |
| `! -name x` | négation |

| Action | Effet |
|---|---|
| `-print` (défaut) | affiche |
| `-delete` | supprime (à manier avec prudence) |
| `-exec cmd {} \;` | lance `cmd` **une fois par fichier** |
| `-exec cmd {} +` | lance `cmd` **une fois** avec tous les fichiers |

```bash
find /usr/include -name "*.h"                       # fichiers .h sous /usr/include
find /var -type f -size +100M -mtime -7 2>/dev/null
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} +
find . -name "*.tmp" -print0 | xargs -0 rm -f       # robuste aux espaces dans les noms
find /usr/bin -perm -4000 -ls                       # programmes SUID
```

`locate nom` cherche dans une base indexée (très rapide) mais ne voit pas les fichiers récents tant que `sudo updatedb` n'a pas été lancé ; `find` parcourt le disque en direct.

:::examen Les trois lignes qui tombent le plus souvent
`find /usr/include -name "*.h"` ; `grep HTTP /etc/services` ; `ls /usr/include | grep t | wc -l`. Sachez les écrire sans hésiter, avec les guillemets autour de `*.h`.
:::

## 1.4.8 Pipelines classiques à connaître

```bash
history | awk '{print $2}' | sort | uniq -c | sort -nr | head -10   # 10 commandes les plus utilisées
cut -d: -f7 /etc/passwd | sort | uniq -c                            # utilisateurs par shell
du -h /var 2>/dev/null | sort -rh | head -5                         # 5 plus gros dossiers
grep 'Failed password' /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -nr | head   # IP en échec SSH
diff <(ls a) <(ls b)                                                # substitution de processus
```

`zcat`, `zgrep`, `zless` fonctionnent comme `cat`, `grep`, `less` sur des fichiers `.gz`.

## 1.4.9 Exercices corrigés

**Exercice 1.** Écrivez dans `liste.txt` le contenu de `/etc` (sans les erreurs affichées à l'écran) et les erreurs éventuelles de `ls /etc /nulle` dans `err.txt`.

<details>
<summary>Voir le corrigé</summary>

```bash
ls /etc /nulle > liste.txt 2> err.txt
```

`>` pour `stdout`, `2>` pour `stderr` : deux fichiers distincts.

</details>

**Exercice 2.** Ajoutez la ligne « The end » à la fin du fichier `Temp` sans effacer son contenu.

<details>
<summary>Voir le corrigé</summary>

```bash
echo "The end" >> Temp
```

`>>` ajoute ; `>` aurait écrasé le fichier.

</details>

**Exercice 3.** Affichez le nombre de fichiers de `/usr/include` dont le nom contient la lettre `t`.

<details>
<summary>Voir le corrigé</summary>

```bash
ls /usr/include | grep t | wc -l
```

`ls` liste, `grep t` garde les noms contenant « t », `wc -l` compte les lignes.

</details>

**Exercice 4.** Affichez les lignes 5 à 10 de `/etc/passwd` de trois façons.

<details>
<summary>Voir le corrigé</summary>

```bash
head -n 10 /etc/passwd | tail -n 6
sed -n '5,10p' /etc/passwd
awk 'NR>=5 && NR<=10' /etc/passwd
```

Pour `head | tail` : 10 − 5 + 1 = 6 lignes à garder.

</details>

**Exercice 5.** Affichez le login et le shell des utilisateurs dont l'UID est supérieur ou égal à 1000.

<details>
<summary>Voir le corrigé</summary>

```bash
awk -F: '$3 >= 1000 {print $1, $7}' /etc/passwd
```

`-F:` fixe le séparateur, `$3` est l'UID, `$7` le shell.

</details>

**Exercice 6.** Affichez le contenu de `/etc/ssh/sshd_config` sans les commentaires ni les lignes vides.

<details>
<summary>Voir le corrigé</summary>

```bash
grep -v -E '^\s*(#|$)' /etc/ssh/sshd_config
```

`^\s*(#|$)` reconnaît une ligne qui commence (après d'éventuels espaces) par `#` ou qui est vide ; `-v` inverse la sélection.

</details>

**Exercice 7.** Remplacez toutes les occurrences de « Paris » par « Cotonou » dans `villes.txt` en gardant une sauvegarde.

<details>
<summary>Voir le corrigé</summary>

```bash
sed -i.bak 's/Paris/Cotonou/g' villes.txt
```

`-i.bak` modifie en place et crée `villes.txt.bak` ; `g` remplace toutes les occurrences.

</details>

**Exercice 8.** Dans `telephone.txt`, affichez le numéro (sans le nom) du premier « Dupond » dans l'ordre alphabétique des prénoms.

<details>
<summary>Voir le corrigé</summary>

```bash
grep Dupond telephone.txt | sort -t $'\t' -k2,2 | head -n 1 | cut -f3
```

On filtre, on trie sur le 2e champ (le prénom) avec la tabulation comme séparateur, on garde la première ligne puis le 3e champ.

</details>

**Exercice 9.** Trouvez les fichiers de plus de 100 Mo, modifiés depuis moins de 7 jours, sous `/var`.

<details>
<summary>Voir le corrigé</summary>

```bash
find /var -type f -size +100M -mtime -7 2>/dev/null
```

`2>/dev/null` masque les « Permission non accordée ».

</details>

**Exercice 10.** Quelle différence entre `-exec ... \;` et `-exec ... +` ?

<details>
<summary>Voir le corrigé</summary>

Avec `\;`, la commande est lancée une fois par fichier trouvé (lent mais simple). Avec `+`, `find` regroupe les fichiers et lance la commande un petit nombre de fois, comme `xargs`. La variante `-print0 | xargs -0` est la plus sûre quand les noms contiennent des espaces.

</details>
