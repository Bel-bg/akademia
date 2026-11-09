### 4.2.1 Deux philosophies pour conduire un projet

Lorsque le projet est lancé, une question méthodologique majeure se pose : **comment organiser le travail dans le temps ?**

```text
APPROCHE PRÉDICTIVE (Cycle en cascade / Cycle en V)
[ Exigences ] ---> [ Conception ] ---> [ Réalisation ] ---> [ Tests ] ---> [ LIVRAISON UNIQUE ]
                                                                            (au bout de 6 mois)

APPROCHE AGILE (Scrum / Kanban)
[ Étape 1 ]        [ Étape 2 ]        [ Étape 3 ]        [ Étape 4 ]
Livraison V1  ---> Livraison V2  ---> Livraison V3  ---> Livraison V4
(Semaine 2)        (Semaine 4)        (Semaine 6)        (Semaine 8)
```

- **L'approche prédictive** suppose que tout peut être anticipé, spécifié et figé dès le premier jour dans un contrat immuable. Le résultat n'est montré au client qu'à la fin.
- **L'approche agile** part du constat d'humilité inverse : **dans un monde complexe, on ne sait jamais tout à l'avance**. Les utilisateurs découvrent leurs véritables besoins en voyant le produit fonctionner. On procède donc par livraisons fréquentes et cycles courts.

---

### 4.2.2 Les méthodes prédictives : Cascade et Cycle en V

#### 1. Le modèle en cascade (*Waterfall*)
Dans ce modèle traditionnel, les phases se succèdent de façon linéaire : on ne passe à la phase suivante que lorsque la précédente est entièrement achevée et validée.
- **L'écueil dramatique de la cascade** : le client ne voit le logiciel fonctionner qu'au tout dernier mois. Si la secrétaire s'aperçoit à ce moment qu'il manque le numéro de téléphone des parents, il faut réécrire les spécifications, redessiner l'architecture et modifier le code. Plus un défaut est découvert tard, plus son coût de correction est exponentiel.

#### 2. Le Cycle en V
Le Cycle en V améliore la cascade en introduisant une **symétrie stricte entre les phases descendantes de conception et les phases ascendantes de validation** :

```text
  [ Analyse des Exigences ] ------------ (Recette client : le système répond-il au besoin ?) -------> [ Recette Finale ]
            \                                                                                            /
      [ Conception Générale ] -------- (Tests d'intégration : les modules coopèrent-ils ?) ------> [ Intégration ]
              \                                                                                      /
        [ Conception Détaillée ] - (Tests unitaires : chaque fonction marche-t-elle isolée ?) -> [ Tests Unitaires ]
                \                                                                              /
                 +------------------------> [ CODAGE ] ---------------------------------------+
```

:::attention La limite du cycle en V
Le cycle en V reste séquentiel dans sa planification temporelle. Il suppose d'avoir rédigé 100% des spécifications avant de concevoir, et 100% du code avant de tester. Dans la réalité des projets informatiques, cette rigidité documentaire conduit à de multiples retards.
:::

---

### 4.2.3 La révolution Agile et le Manifeste Agile (2001)

Rédigé en 2001 par 17 experts du génie logiciel (dont Ken Schwaber et Jeff Sutherland), le **Manifeste Agile** pose quatre valeurs fondamentales :

:::retenir Les 4 valeurs du Manifeste Agile
1. **Les individus et leurs interactions** plutôt que les processus et les outils ;
2. **Un logiciel opérationnel** plutôt qu'une documentation exhaustive ;
3. **La collaboration avec les clients** plutôt que la négociation contractuelle ;
4. **L'adaptation au changement** plutôt que le suivi rigide d'un plan.
*(Ce qui signifie : sans renier les éléments de droite, nous accordons une valeur prioritaire aux éléments de gauche).*
:::

---

### 4.2.4 Les principes de l'approche itérative et incrémentale

Les méthodes agiles combinent deux dimensions puissantes :
- **Incrémentale** : le système est construit morceau par morceau. Chaque nouvelle version apporte un incrément utilisable qui vient s'ajouter aux fonctionnalités déjà en place.
- **Itérative** : l'équipe répète un cycle régulier d'activités complètes. Au sein de chaque itération, l'équipe mène de front les 4 activités **SACT** : **S**pécification, **A**rchitecture, **C**odage et **T**ests.

```text
Cycle séquentiel classique (Phases séparées) :  [  Spécification  ] [  Conception  ] [   Codage   ] [   Tests   ]
Cycle agile (Toutes activités dans chaque sprint) : [ S-A-C-T ] [ S-A-C-T ] [ S-A-C-T ] [ S-A-C-T ]
```

---

### 4.2.5 La méthode Kanban : Le flux continu et la limite du WIP

**Kanban** (terme japonais signifiant *« étiquette »* ou *« carte visuelle »*) est une méthode agile issue du système de production Toyota, axée sur la gestion en **flux continu**.

```text
+-----------------------+-----------------------------+-----------------------+
|  À FAIRE (Backlog)    |   EN COURS [ LIMITE : 2 ]   |       TERMINÉ         |
+-----------------------+-----------------------------+-----------------------+
| [ Reçu par e-mail ]   | [ Saisie Inscription ]      | [ Analyse Exigences ] |
| [ Statistiques ]      | [ Contrôle Doublons ]       | [ Schéma BDD ]        |
+-----------------------+-----------------------------+-----------------------+
```

#### La règle d'or de Kanban : Limiter le travail en cours (*WIP*)
Kanban applique la règle essentielle : **Limiter le Work In Progress (WIP)**.
Dans l'exemple ci-dessus, la colonne « En cours » a une limite stricte de 2 cartes.
- **Conséquence** : les développeurs ont interdiction absolue de commencer une 3ᵉ tâche tant qu'au moins l'une des deux tâches en cours n'a pas été terminée et basculée dans la colonne « Terminé ».
- **Devise** : *« Arrêter de commencer, commencer par finir ! »*.

---

### 4.2.6 Tableau comparatif : Comment choisir sa méthode ?

| Contexte du projet | Méthode conseillée | Justification méthodologique |
|---|---|---|
| **Besoins stables, clairs, contrat au forfait figé** | **Cascade ou Cycle en V** | Les exigences ne bougent pas ; le planning séquentiel optimise les coûts d'exécution. |
| **Besoins évolutifs, produit innovant, retours fréquents** | **Scrum** | Sprints courts de durée fixe permettant de réorienter le produit à chaque itération. |
| **Maintenance corrective, support continu, flux de tickets** | **Kanban** | Absence d'itérations fixes ; traitement des demandes au fil de l'eau en optimisant le flux. |
