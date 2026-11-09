### 2.1.1 Qu'est-ce qu'une organisation ?

Une **organisation** est un groupement de personnes unies par des règles, travaillant ensemble à l'aide de moyens coordonnés pour atteindre des **objectifs communs**. Pour la décrire avec pertinence, l'analyste de systèmes étudie quatre dimensions fondamentales :

| Dimension | Question clé | Application au Centre Avenir Formation |
|---|---|---|
| **Mission** | Pourquoi l'organisation existe-t-elle ? | Former et qualifier des apprenants à un métier d'avenir. |
| **Structure** | Qui est rattaché à qui ? Quels sont les départements ? | Direction générale, secrétariat académique, service comptable, corps professoral. |
| **Ressources** | Avec quels moyens concrets opère-t-elle ? | Bâtiments, salles de cours, ordinateurs, budget de fonctionnement, équipe enseignante. |
| **Environnement** | Qui interagit avec l'organisation depuis l'extérieur ? | Candidats, parents d'élèves, entreprises partenaires, ministère de tutelle, concurrents. |

---

### 2.1.2 L'organigramme et ses limites majeures

L'**organigramme** est la représentation schématique de la structure formelle de l'organisation :

```text
                  +--------------------+
                  |     DIRECTION      |
                  +--------------------+
                            |
         +------------------+------------------+
         |                                     |
+------------------+                  +------------------+
|   SECRÉTARIAT    |                  |   COMPTABILITÉ   |
+------------------+                  +------------------+
         |                                     |
+--------------------------------------------------------+
|                      FORMATEURS                        |
+--------------------------------------------------------+
```

:::attention Ce que l'organigramme ne montre pas
- L'organigramme montre **qui dépend hiérarchiquement de qui** et la découpe des services.
- **Il ne montre JAMAIS comment le travail circule au quotidien** d'un service à l'autre.
Deux entreprises peuvent avoir exactement le même organigramme hiérarchique et fonctionner de manière totalement opposée. Pour comprendre le fonctionnement réel, l'analyste doit impérativement cartographier les **processus métier**.
:::

---

### 2.1.3 La matrice RACI

La **matrice RACI** est un outil standard de gouvernance qui clarifie, pour chaque activité opérationnelle, le rôle et le niveau d'engagement de chaque acteur.

:::retenir La signification des 4 lettres RACI
- **R - Responsible** (*Réalisateur*) : La ou les personnes qui **exécutent concrètement** le travail pour accomplir la tâche.
- **A - Accountable** (*Autorité / Responsable final*) : La personne unique qui **répond du résultat final** devant la direction. Elle valide ou rejette le livrable.
- **C - Consulted** (*Consulté*) : L'expert ou la partie prenante dont on recueille l'avis ou l'information avant ou pendant la réalisation.
- **I - Informed** (*Informé*) : La personne tenue au courant de l'avancement ou de la fin de l'activité, sans participer directement à sa prise de décision.
:::

#### Les deux règles d'or de la matrice RACI
1. **Un seul « A » par ligne (par tâche)** : Si une tâche a plusieurs $A$, la responsabilité est diluée et les conflits surviennent. Si elle n'a aucun $A$, personne ne répond du résultat.
2. **Au moins un « R » par ligne** : Une tâche sans $R$ est une tâche orpheline que personne ne réalise.

---

### 2.1.4 Matrice RACI appliquée au Centre Avenir Formation

| Tâche opérationnelle | Direction | Secrétaire | Comptable | Formateurs |
|---|:---:|:---:|:---:|:---:|
| **Inscrire un apprenant** | I | **R / A** | C | I |
| **Encaisser une mensualité** | I | C | **R / A** | — |
| **Saisir les notes** | A | — | — | **R** |
| **Éditer les bulletins de notes** | A | **R** | I | C |

#### Analyse des combinaisons
- **$R/A$ sur une même personne** : Parfaitement conseillé dans les petites équipes où la personne qui réalise est aussi celle qui porte la responsabilité directe de l'opération (ex. la comptable pour l'encaissement).
- **Plusieurs $R$, plusieurs $C$ ou plusieurs $I$ sur une tâche** : Tout à fait autorisé et fréquent (le travail et l'information peuvent se partager).
- **Cumul $C$ et $I$ ou $R$ et $C$ dans la même case** : **Interdit et inutile**. Celui qui réalise ($R$) ou qui est consulté ($C$) est de fait déjà informé ($I$).
