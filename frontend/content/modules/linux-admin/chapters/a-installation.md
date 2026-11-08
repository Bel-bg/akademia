## A.1 Choisir comment installer

Pour s'entraîner, il y a trois possibilités :

| Option | Avantage | Inconvénient |
|---|---|---|
| **Machine virtuelle** (VirtualBox, VMware) | sans risque, snapshots, plusieurs VM | demande de la RAM |
| **Double démarrage** avec Windows | performances réelles | risque sur les partitions |
| **WSL** (Windows Subsystem for Linux) | rapide, pour le shell uniquement | pas de noyau complet, pas de systemd par défaut selon les versions |

Pour les travaux pratiques du module (disques, LVM, RAID, réseau, boot), la **VM avec snapshot** est le meilleur choix : on peut tout casser et revenir en arrière.

## A.2 Obtenir et vérifier l'image

Ubuntu est libre et gratuit : l'image `.iso` se télécharge sur le site officiel. Il faut ensuite **vérifier son intégrité** pour être sûr qu'elle n'est ni incomplète ni corrompue (ni piégée).

```bash
sha256sum ubuntu-24.04-desktop-amd64.iso     # comparer avec la somme publiée dans SHA256SUMS
md5sum ubuntu-16.04-desktop-amd64.iso        # le TP utilise MD5 (outil MD5Checker sous Windows)
```

Si l'empreinte diffère de celle publiée, on retélécharge l'image.

Pour créer une **clé USB amorçable** : Rufus ou UNetbootin (Windows), « Créateur de disque de démarrage » (Ubuntu) ou `dd` :

```bash
lsblk                                                              # identifier la clé avec certitude
sudo dd if=ubuntu.iso of=/dev/sdX bs=4M status=progress && sync    # sdX = la clé, PAS le disque système
```

:::attention dd peut effacer le mauvais disque
Une erreur sur `of=` détruit les données du périphérique indiqué. Vérifiez avec `lsblk` (taille, nom) avant de valider.
:::

## A.3 Session live ou installation

Au démarrage sur le média (touche F12, F10, F9 ou Échap pour le menu de démarrage, ou ordre de boot dans le BIOS/UEFI) apparaît le menu GRUB2 ou une interface graphique :

- **Essayer Ubuntu sans rien changer sur l'ordinateur** : session **live** chargée en RAM. On teste l'interface et la compatibilité matérielle (écran, son, Wi-Fi, imprimante) **sans rien écrire sur le disque**.
- **Installer Ubuntu** : lance l'assistant qui écrit le système sur le disque.

## A.4 Les étapes de l'installation

1. **Langue** : Français (langue du système, d'autres pourront être ajoutées).
2. **Préparation** : disque libre suffisant, branchement secteur, Internet ; option de téléchargement des mises à jour et du logiciel tiers (codecs, pilotes Wi-Fi).
3. **Type d'installation** :
   - *Installer à côté d'un autre système* : conserve Windows (double démarrage) ;
   - *Effacer le disque* : supprime **tout** ;
   - *Autre chose* : partitionnement manuel.
4. **Partitionnement manuel** (exemple) :

| Partition | Système de fichiers | Taille indicative |
|---|---|---|
| `/` | ext4 | 20 à 30 Go |
| swap | swap | ~ taille de la RAM (ou 2 Go) |
| `/home` (facultatif) | ext4 | le reste |
| EFI (si UEFI) | FAT32 | 500 Mo |

5. **Fuseau horaire** : carte ou ville (Cotonou, Porto-Novo…), ce qui règle l'heure et la synchronisation (`timedatectl` pour vérifier).
6. **Clavier** : pays et variante (AZERTY).
7. **Identité** : nom, nom de l'ordinateur, nom d'utilisateur, mot de passe. Choisissez « Demander mon mot de passe pour ouvrir une session ». **Ce premier compte est administrateur** (groupe `sudo`).
8. **Copie des fichiers**, puis redémarrage en retirant le média.

## A.5 Après l'installation

```bash
ping -c 3 ubuntu.com                                  # Internet fonctionne-t-il ?
sudo apt update && sudo apt upgrade                   # index puis mises à jour
sudo apt install language-pack-fr language-pack-gnome-fr    # système 100 % français
sudo apt install ubuntu-restricted-extras             # codecs multimédia (mp3, etc.)
sudo update-grub                                      # détecte Windows et régénère le menu de démarrage
```

Autres réglages : *Pilotes additionnels* (Logiciels et mises à jour) pour la carte graphique ou Wi-Fi ; *Accès universel* (loupe, lecteur d'écran) ; *Apparence* (thème, fond d'écran).

:::retenir Les trois idées
Toujours vérifier l'intégrité de l'image ; la session live ne modifie pas le disque ; le premier utilisateur créé est administrateur via `sudo`.
:::

## A.6 Exercices corrigés

**Exercice 1.** Pourquoi vérifier la somme de contrôle de l'image ISO ?

<details>
<summary>Voir le corrigé</summary>

Pour s'assurer que le fichier téléchargé est complet, sans erreur de transfert et identique à l'original publié. Une somme différente impose de retélécharger.

</details>

**Exercice 2.** Quelle différence entre « Essayer Ubuntu » et « Installer Ubuntu » ?

<details>
<summary>Voir le corrigé</summary>

Le premier lance une session live en mémoire vive pour tester le système et le matériel sans toucher au disque ; le second écrit Ubuntu sur le disque.

</details>

**Exercice 3.** Proposez un schéma de partitionnement manuel pour un PC en UEFI avec 8 Go de RAM.

<details>
<summary>Voir le corrigé</summary>

EFI 500 Mo (FAT32), `/` en ext4 de 30 Go, swap de 2 à 8 Go, `/home` en ext4 sur le reste.

</details>

**Exercice 4.** Quel groupe le premier utilisateur reçoit-il, et que permet-il ?

<details>
<summary>Voir le corrigé</summary>

Le groupe `sudo` : il peut exécuter des commandes avec les droits de root via `sudo`.

</details>

**Exercice 5.** Comment rendre le système entièrement français après une installation sans Internet ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo apt install language-pack-fr language-pack-gnome-fr
```

Puis se déconnecter et se reconnecter.

</details>

**Exercice 6.** Comment retrouver le menu de choix Ubuntu/Windows au démarrage ?

<details>
<summary>Voir le corrigé</summary>

```bash
sudo update-grub
```

GRUB détecte les systèmes installés et régénère son menu.

</details>

**Exercice 7.** Quels avantages une VM offre-t-elle pour s'entraîner à l'administration ?

<details>
<summary>Voir le corrigé</summary>

Aucun risque pour la machine hôte, **snapshots** pour revenir en arrière après une erreur, possibilité d'ajouter des disques virtuels (LVM, RAID) et de simuler un réseau entre plusieurs VM.

</details>
