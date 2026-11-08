## 1.5.1 Pourquoi Vim ?

`vi` (ou `vim`, sa version améliorée) est installé sur pratiquement tous les serveurs Linux, même minimalistes. Sur une machine distante, en mode secours ou via SSH, c'est souvent le seul éditeur disponible : savoir l'utiliser est une compétence de base de l'administrateur. `nano` est plus simple (raccourcis affichés en bas : `Ctrl+O` enregistrer, `Ctrl+X` quitter) mais moins puissant.

## 1.5.2 Les modes de Vim

Vim est un éditeur **modal** : la même touche n'a pas le même effet selon le mode.

| Mode | Rôle | Comment y entrer | Comment en sortir |
|---|---|---|---|
| **Normal** (ou commande) | se déplacer, supprimer, copier, coller | mode par défaut | `Échap` depuis un autre mode |
| **Insertion** | saisir du texte | `i`, `a`, `o`, `I`, `A`, `O` | `Échap` |
| **Ligne de commande** | enregistrer, quitter, rechercher, remplacer | `:` depuis le mode normal | `Entrée` ou `Échap` |
| **Visuel** | sélectionner du texte | `v` (caractères), `V` (lignes), `Ctrl+V` (bloc) | `Échap` |

:::retenir La règle d'or
En cas de doute, appuyez sur `Échap` (deux fois si besoin) : vous êtes de retour en mode normal. Quand rien ne marche comme prévu, c'est presque toujours que vous êtes dans le mauvais mode.
:::

## 1.5.3 Ouvrir, enregistrer, quitter

| Commande | Effet |
|---|---|
| `vim fichier` | ouvre (ou crée) le fichier |
| `vim +45 fichier` | ouvre à la ligne 45 |
| `:w` | enregistre (write) |
| `:w autre` | enregistre sous le nom `autre` (ex. `:w ~/TP2/services2`) |
| `:q` | quitte (refusé s'il y a des modifications non enregistrées) |
| `:q!` | quitte **sans** enregistrer |
| `:wq` ou `:x` ou `ZZ` | enregistre et quitte |

Si vous ouvrez un fichier système sans droits d'écriture, `:w` échoue (« E45 : option readonly »). Solution : `:w !sudo tee %` ou, mieux, rouvrir avec `sudo vim`.

## 1.5.4 Se déplacer (mode normal)

| Touches | Déplacement |
|---|---|
| `h` `j` `k` `l` | gauche, bas, haut, droite |
| `12j` `8k` `16l` `9h` | avec compteur : 12 lignes en bas, 8 en haut, etc. |
| `w` / `b` / `e` | début du mot suivant / précédent / fin du mot |
| `0` / `^` / `$` | début de ligne / premier caractère non blanc / fin de ligne |
| `gg` / `G` / `45G` (ou `:45`) | première ligne / dernière ligne / ligne 45 |
| `Ctrl+F` / `Ctrl+B` | page suivante / précédente |
| `Ctrl+D` / `Ctrl+U` | demi-page vers le bas / vers le haut |
| `%` | saute à la parenthèse ou accolade correspondante |
| `6\|` | colonne 6 de la ligne |

## 1.5.5 Insérer du texte

| Touche | Insère… |
|---|---|
| `i` | avant le curseur |
| `a` | après le curseur |
| `I` | en début de ligne |
| `A` | en fin de ligne |
| `o` | une nouvelle ligne **en dessous** |
| `O` | une nouvelle ligne **au-dessus** |

## 1.5.6 Supprimer, copier, coller

Vim utilise un langage : **opérateur + déplacement**. `d` supprime (et copie), `y` copie (yank), `c` supprime puis passe en insertion.

| Touches | Effet |
|---|---|
| `x` / `X` | supprime le caractère sous le curseur / avant le curseur |
| `5X` | supprime les 5 caractères précédents |
| `dd` | supprime (coupe) la ligne |
| `4dd` | supprime 4 lignes |
| `dw` | supprime jusqu'au mot suivant |
| `d$` ou `D` | supprime du curseur à la fin de la ligne |
| `d0` | supprime du début de ligne jusqu'au curseur |
| `yy` / `3yy` | copie 1 / 3 lignes |
| `yw` | copie un mot |
| `p` / `P` | colle après / avant le curseur (ou la ligne) |
| `u` | annule (répété : plusieurs niveaux) |
| `Ctrl+R` | rétablit (annule l'annulation) |
| `.` | répète la dernière modification |
| `cw` | remplace le mot courant |

:::exemple Copier la dernière ligne au début du fichier
`G` (dernière ligne), `yy` (copier), `gg` (première ligne), `P` (coller avant). Pour supprimer ensuite les quatre premières lignes : `gg` puis `4dd` ; pour les quatre suivantes : `.` répète `4dd`.
:::

## 1.5.7 Rechercher et remplacer

| Commande | Effet |
|---|---|
| `/tcp` puis `Entrée` | cherche « tcp » vers le bas |
| `?tcp` | cherche vers le haut |
| `n` / `N` | occurrence suivante / précédente (dans le sens inverse pour `N`) |
| `:s/udp/UDP/` | remplace la 1re occurrence de la ligne courante |
| `:s/udp/UDP/g` | toutes les occurrences de la ligne courante |
| `:%s/udp/UDP/g` | **tout le fichier** |
| `:%s/udp/UDP/gc` | tout le fichier avec confirmation à chaque remplacement |
| `:1,5d` | supprime les lignes 1 à 5 |
| `:5,10s/a/b/g` | remplace sur les lignes 5 à 10 |
| `:g/^#/d` | supprime toutes les lignes de commentaire |

## 1.5.8 Options et configuration permanente

| Commande | Effet |
|---|---|
| `:set number` (`:set nu`) | affiche les numéros de ligne |
| `:set nonumber` | les masque |
| `:set tabstop=2` | une tabulation = 2 espaces d'affichage |
| `:set shiftwidth=2 expandtab` | indentation de 2, tabulations remplacées par des espaces |
| `:set hlsearch` | surligne les résultats de recherche |
| `:syntax on` | coloration syntaxique |
| `:set` | affiche les options modifiées ; `:set all` toutes |

Ces réglages disparaissent à la fermeture de Vim. Pour les rendre **permanents**, écrivez-les (sans les `:`) dans `~/.vimrc` :

```vim
set number
set tabstop=2
set shiftwidth=2
set expandtab
syntax on
```

## 1.5.9 Fenêtres, fichiers et aide

| Commande | Effet |
|---|---|
| `:e autre.txt` | ouvre un autre fichier |
| `:r fichier` | insère le contenu de `fichier` sous le curseur |
| `:r !date` | insère la sortie d'une commande |
| `:split` / `:vsplit` | coupe la fenêtre horizontalement / verticalement |
| `Ctrl+W w` | passe d'une fenêtre à l'autre |
| `:help sujet` | aide intégrée |
| `vimtutor` | tutoriel interactif de 30 minutes (à faire une fois) |

## 1.5.10 Exercices corrigés

**Exercice 1.** Vous venez d'ouvrir un fichier, de le modifier par erreur. Comment quittez-vous sans enregistrer ?

<details>
<summary>Voir le corrigé</summary>

`Échap` puis `:q!` puis `Entrée`. Le `!` force la sortie en abandonnant les modifications.

</details>

**Exercice 2.** Déplacez le curseur de douze lignes vers le bas, puis de huit vers le haut, puis de seize caractères vers la droite, sans les flèches.

<details>
<summary>Voir le corrigé</summary>

`12j`, `8k`, `16l`. Le nombre est un compteur appliqué au déplacement qui suit.

</details>

**Exercice 3.** Allez à la dernière ligne, à la première ligne, puis à la 45e.

<details>
<summary>Voir le corrigé</summary>

`G`, `gg`, `45G` (ou `:45` suivi de `Entrée`).

</details>

**Exercice 4.** Insérez « trois » en début de ligne et « quatre » en fin de ligne, en une seule touche pour entrer en insertion.

<details>
<summary>Voir le corrigé</summary>

`I` puis taper `trois`, `Échap` ; `A` puis taper `quatre`, `Échap`. `I` et `A` combinent le déplacement en début/fin de ligne et l'entrée en mode insertion.

</details>

**Exercice 5.** Supprimez du curseur à la fin de la ligne, puis la ligne entière, puis annulez la dernière action.

<details>
<summary>Voir le corrigé</summary>

`d$` (ou `D`), puis `dd`, puis `u`. `Ctrl+R` rétablirait l'action annulée.

</details>

**Exercice 6.** Copiez la dernière ligne du fichier et collez-la au début.

<details>
<summary>Voir le corrigé</summary>

`G`, `yy`, `gg`, `P`.

</details>

**Exercice 7.** Dans `/etc/services` (copie), remplacez tous les « udp » par « UDP ».

<details>
<summary>Voir le corrigé</summary>

`:%s/udp/UDP/g` puis `Entrée`. Le `%` désigne tout le fichier, `g` toutes les occurrences de chaque ligne.

</details>

**Exercice 8.** Affichez les numéros de ligne, puis rendez ce réglage permanent.

<details>
<summary>Voir le corrigé</summary>

Temporaire : `:set number`. Permanent : ajouter la ligne `set number` dans `~/.vimrc`.

</details>

**Exercice 9.** Enregistrez le travail dans `~/TP2/services2` sans écraser le fichier d'origine.

<details>
<summary>Voir le corrigé</summary>

`:w ~/TP2/services2`. Vim écrit une copie sous ce nom ; pour quitter ensuite : `:q`.

</details>

**Exercice 10.** Cherchez « tcp », parcourez les occurrences vers l'avant puis vers l'arrière.

<details>
<summary>Voir le corrigé</summary>

`/tcp` `Entrée`, puis `n` pour l'occurrence suivante et `N` pour la précédente.

</details>
