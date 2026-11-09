### 4.1.1 Qu'est-ce qu'un projet ?

:::retenir Définition officielle
Un **projet** est une entreprise temporaire qui possède une date de **début** et une date de **fin**, mobilisant des **ressources limitées** pour atteindre un **objectif unique** et novateur.
:::

| Critère de distinction | Projet informatique | Activité courante (*Run*) |
|---|---|---|
| **Horizon temporel** | Durée limitée dans le temps, date d'échéance fixée | Activité continue, sans date de fin prévue |
| **Objectif visé** | Produire un résultat unique (livrable) | Répéter un service quotidien |
| **Exemple au centre** | Développer et déployer le nouveau portail de scolarité | Enregistrer les inscriptions chaque matin |

---

### 4.1.2 Le triangle fondamental : Périmètre, Délai, Coût

Toute gestion de projet est gouvernée par l'équilibre de la **triple contrainte** :

```text
               PÉRIMÈTRE (Ce qu'on livre)
                       /\
                      /  \
                     /    \
                    / QUALITÉ \
                   /   AU      \
                  /   CENTRE    \
                 /                \
   DÉLAI (Quand) ------------------ COÛT (Budget & Moyens)
```

Ces trois grandeurs sont indissolublement liées :
- Si le directeur exige d'ajouter une nouvelle fonctionnalité (*Périmètre*), il faut obligatoirement accorder **plus de temps** (*Délai*), **plus de budget** (*Coût*), ou alors **la qualité finale sera dégradée** (bugs, absence de tests).

---

### 4.1.3 Les objectifs SMART et le WBS

Tout objectif de projet doit vérifier les critères **SMART** :
- **S - Spécifique** : clair, précis et sans ambiguïté ;
- **M - Mesurable** : quantifiable par des indicateurs tangibles ;
- **A - Atteignable** : stimulant mais à la portée des compétences de l'équipe ;
- **R - Réaliste** : aligné avec les contraintes opérationnelles de l'entreprise ;
- **T - Temporellement défini** : doté d'une date butoir ferme.

#### Le découpage en tâches : Le WBS (*Work Breakdown Structure*)
Le **WBS** (ou Organigramme des Tâches) découpe l'ensemble du projet en lots de travaux, puis en tâches élémentaires :

```text
                          [ Système de Scolarité ]
                                     |
    +--------------------+-----------+-----------+--------------------+
    |                    |                       |                    |
[ Inscriptions ]    [ Paiements ]          [ Statistiques ]      [ Sécurité ]
    |                    |                       |                    |
    +- Concevoir écran   +- Gérer quittances     +- Calcul effectif   +- Rôles d'accès
    +- Coder contrôles   +- Calculer solde       +- Export Excel      +- Chiffrement BDD
    +- Tester saisie     +- Tester calculs       +- Tester affichage  +- Tests intrusion
```

:::retenir La règle d'une bonne tâche WBS
Une tâche de WBS doit avoir :
1. Un **responsable unique clairement désigné** ;
2. Un **résultat vérifiable concret** (un livrable testable) ;
3. Une durée raisonnable (généralement comprise entre 1 et 5 jours-homme).
:::

---

### 4.1.4 Estimation des charges : Jours-homme et fourchettes

- **La Charge** : Quantité d'effort de travail nécessaire pour accomplir une tâche, mesurée en **jours-homme (j/h)** (le travail qu'un travailleur moyen accomplit en une journée standard).
- **La Durée calendaire** : Le temps réel écoulé sur le calendrier. Une tâche de 10 j/h confiée à deux personnes travaillant à plein temps pourra durer environ 5 jours ouvrés si le travail se parallélise bien.

:::attention Le piège de l'estimation unique
Donner un chiffre d'estimation unique et précis est un piège majeur de débutant. L'analyste sérieux fournit toujours une **fourchette d'estimation** (estimation basse et estimation haute) pour intégrer les aléas techniques :
*Exemple : « La programmation des paiements est estimée entre 5 et 8 jours-homme »*.
:::

---

### 4.1.5 Ordonnancement, Diagramme de Gantt et Chemin critique

Le **diagramme de Gantt** positionne les tâches sur une échelle de temps calendaire en respectant leurs **dépendances logiques** (telle tâche ne peut débuter tant que telle autre n'est pas achevée) :

```text
Jours                 1   2   3   4   5   6   7   8   9   10
------------------------------------------------------------
Tâche 1 : Écrans      [===]
Tâche 2 : Inscription     [=======]
Tâche 3 : Paiements           [===========] (Chemin critique)
Tâche 4 : Tests                                   [===]
```

:::retenir La notion capitale de Chemin Critique
Le **chemin critique** est la séquence de tâches dépendantes qui représente **la durée totale la plus longue** pour achever le projet.
- **Toute journée de retard sur une tâche du chemin critique retarde d'autant la date de fin finale du projet tout entier !**
- Les tâches hors chemin critique possèdent une marge de sécurité (*flottement*).
:::

---

### 4.1.6 La gestion des risques et le registre des risques

Un **risque** est un événement incertain qui, s'il se réalise, impacte négativement les objectifs du projet.
On l'évalue par sa criticité :
$$\text{Criticité} = \text{Probabilité d'occurrence} \times \text{Gravité de l'impact}$$

| Risque identifié | Probabilité | Impact | Stratégie de réponse retenue |
|---|---|---|---|
| Démission ou maladie d'un développeur | Faible | Fort | **Réduire** : binômage régulier et documentation du code sur Git. |
| Changement d'exigences en cours de route | Forte | Moyen | **Contrôler** : procédure d'analyse d'impact écrite et avenant au cahier des charges. |
| Coupures d'électricité et d'Internet | Moyenne | Moyen | **Réduire** : onduleur de secours et sauvegardes cloud automatisées. |
| Rejet du système par les utilisateurs | Moyenne | Fort | **Éviter** : impliquer les secrétaires dès la phase de maquettage et former en continu. |

Les quatre réponses stratégiques à un risque sont : **Éviter** (supprimer la cause), **Réduire** (diminuer probabilité ou gravité), **Transférer** (assurance, sous-traitance) ou **Accepter** (prévoir une réserve budgétaire).
