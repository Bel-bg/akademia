## 2.2.1 Le problème du découpage uniforme

Avec un découpage uniforme, tous les sous-réseaux ont la **même taille**. Imaginez une banque avec un réseau de 100 postes, un de 50, un de 25, un de 10 et deux liaisons entre routeurs de 2 adresses. En découpant en /25, on donne 126 adresses à la liaison point à point qui n'en utilise que 2 : un **gaspillage énorme**.

Le **VLSM** (*Variable Length Subnet Mask*, masques de longueur variable) résout ce problème : chaque sous-réseau reçoit **le masque juste nécessaire** à son besoin. Le VLSM est possible dès lors que le protocole de routage transmet le masque (c'est le cas de tous les protocoles modernes : OSPF, RIPv2, EIGRP, BGP) et c'est la norme avec le CIDR.

## 2.2.2 Les règles du VLSM

1. **Trier** les besoins du plus grand au plus petit.
2. Pour chaque besoin, choisir le **masque minimal** (`2^h − 2 ≥ hôtes`, passerelle comprise).
3. **Attribuer dans l'ordre**, en commençant par les blocs les plus gros, **sans chevauchement**.
4. Chaque bloc commence à un **multiple de sa taille** (un /26 commence à 0, 64, 128 ou 192).
5. Les liaisons point à point utilisent des **/30** (2 hôtes) ou /31.
6. **Garder de la marge** : prévoir la croissance, et conserver des blocs libres contigus.

:::attention Pourquoi on commence par les plus gros
Un gros bloc doit être **aligné** sur un multiple de sa taille. Si l'on place d'abord des petits blocs, on fragmente l'espace et les gros blocs ne trouvent plus de place alignée.
:::

## 2.2.3 Résolution pas à pas

:::exemple Plan VLSM de la banque : 192.168.100.0/24
Besoins : **A** 100 hôtes, **B** 50 hôtes, **C** 25 hôtes, **D** 10 hôtes, **L1** et **L2** deux liaisons point à point.

| Étape | Besoin | Masque | Taille | Bloc attribué | Plage utilisable | Diffusion |
|---|---|---|---|---|---|---|
| 1 | A (100) | /25 | 128 | 192.168.100.0/25 | .1 - .126 | .127 |
| 2 | B (50) | /26 | 64 | 192.168.100.128/26 | .129 - .190 | .191 |
| 3 | C (25) | /27 | 32 | 192.168.100.192/27 | .193 - .222 | .223 |
| 4 | D (10) | /28 | 16 | 192.168.100.224/28 | .225 - .238 | .239 |
| 5 | L1 | /30 | 4 | 192.168.100.240/30 | .241 - .242 | .243 |
| 6 | L2 | /30 | 4 | 192.168.100.244/30 | .245 - .246 | .247 |

Le prochain bloc libre commence à `192.168.100.248` : il reste **8 adresses** (.248 à .255) pour la suite. Vérification : 128 + 64 + 32 + 16 + 4 + 4 = 248 ≤ 256 ✓.
:::

### Vérifier qu'il n'y a pas de chevauchement

Deux blocs se chevauchent si la plage de l'un contient une adresse de l'autre. Méthode simple : écrire chaque bloc sous la forme **[début, fin]** en décimal sur le dernier octet et vérifier que chaque début est strictement supérieur à la fin du précédent.

## 2.2.4 Choisir entre uniforme et VLSM

| | Uniforme | VLSM |
|---|---|---|
| Simplicité | Très simple | Demande du soin |
| Gaspillage | Élevé si besoins variés | Faible |
| Routage | Tous les masques identiques | Chaque route porte son masque |
| Résumé de routes | Facile | Possible si les blocs sont bien regroupés |

## 2.2.5 Bonnes pratiques d'un plan d'adressage

- **Documentez** : tableau (nom du réseau, adresse/masque, passerelle, plage DHCP, VLAN).
- **Convention** : passerelle = **première** ou **dernière** adresse utilisable, partout pareil (l'examen demande souvent « la dernière adresse de chaque réseau »).
- **Regroupez par site** pour permettre le **résumé de routes** (chapitre 2.3) : par exemple un bloc /22 par agence.
- **Réservez** des plages pour les serveurs et imprimantes (adresses fixes) en dehors de la plage DHCP.
- **Laissez de la marge** (au moins 20 à 30 %) pour la croissance.

:::retenir À retenir
VLSM = masque adapté à chaque besoin. Trier par taille décroissante, aligner chaque bloc sur un multiple de sa taille, /30 pour les liaisons point à point. Vérifier que la somme des tailles ne dépasse pas celle du bloc d'origine.
:::

:::examen Ce qui tombe à l'examen
Un énoncé donne un bloc (souvent un /24 ou un /16) et une liste de besoins : on demande le tableau complet réseau/masque/plage/diffusion, parfois le bloc restant. La méthode « trier, attribuer, vérifier » donne tous les points.
:::

## 2.2.6 Exercices corrigés

**Exercice 1.** Quel masque pour une liaison point à point entre deux routeurs ? Pourquoi pas /24 ?

<details>
<summary>Voir le corrigé</summary>

**/30** (2 hôtes utilisables), ou /31 (RFC 3021). Un /24 gaspillerait 252 adresses.

</details>

**Exercice 2.** Dans `10.1.0.0/24`, placez 3 réseaux : 120 hôtes, 60 hôtes, 28 hôtes.

<details>
<summary>Voir le corrigé</summary>

- 120 hôtes : **/25** → `10.1.0.0/25` (0-127).
- 60 hôtes : **/26** → `10.1.0.128/26` (128-191).
- 28 hôtes : **/27** → `10.1.0.192/27` (192-223). Reste 224-255 (32 adresses).

</details>

**Exercice 3.** Un bloc `172.16.8.0/22` doit accueillir 3 sites de 200, 100 et 50 hôtes. Proposez un plan.

<details>
<summary>Voir le corrigé</summary>

/22 = 172.16.8.0 à 172.16.11.255 (1024 adresses).
- 200 hôtes : **/24** → `172.16.8.0/24`.
- 100 hôtes : **/25** → `172.16.9.0/25`.
- 50 hôtes : **/26** → `172.16.9.128/26`.
Il reste `172.16.9.192/26` et `172.16.10.0/23`.

</details>

**Exercice 4.** Combien de /30 peut-on tirer d'un /24 ?

<details>
<summary>Voir le corrigé</summary>

256 / 4 = **64** sous-réseaux /30.

</details>

**Exercice 5.** Pourquoi deux sous-réseaux `192.168.1.0/25` et `192.168.1.64/26` ne peuvent-ils pas coexister ?

<details>
<summary>Voir le corrigé</summary>

Le premier couvre 0-127, le second 64-127 : le second est **inclus** dans le premier, il y a chevauchement.

</details>

**Exercice 6.** Vérifiez ce plan : `192.168.50.0/26`, `192.168.50.64/27`, `192.168.50.96/27`, `192.168.50.128/25`. Est-il valide ?

<details>
<summary>Voir le corrigé</summary>

0-63, 64-95, 96-127, 128-255 : aucun chevauchement, alignements corrects (le /25 commence à 128). Valide, il occupe tout le /24.

</details>

**Exercice 7.** Une entreprise a 4 agences de 30, 30, 14 et 6 postes et deux liaisons. Bloc `192.168.7.0/24`. Donnez le plan.

<details>
<summary>Voir le corrigé</summary>

Besoins avec passerelle : 30+1 → /26 pour chacune des deux premières ? 31 > 30 : **/26** (62). Les 14 postes + 1 = 15 > 14 : **/27** (30). 6+1 = 7 > 6 : **/28** (14). Plan : `192.168.7.0/26`, `192.168.7.64/26`, `192.168.7.128/27`, `192.168.7.160/28`, liaisons `192.168.7.176/30` et `.180/30`.

</details>

**Exercice 8.** Pourquoi doit-on aligner chaque bloc sur un multiple de sa taille ?

<details>
<summary>Voir le corrigé</summary>

Parce que l'adresse d'un réseau a tous ses bits hôte à 0 : pour un /26, l'adresse réseau doit être un multiple de 64. Un bloc non aligné chevaucherait deux blocs naturels et ne pourrait pas s'écrire avec un seul préfixe.

</details>
