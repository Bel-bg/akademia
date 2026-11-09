### 3.1.1 Qui est concerné ? Les parties prenantes

:::retenir Définition
Une **partie prenante** (*stakeholder*) est une personne, un groupe ou une institution qui peut influencer le projet informatique ou qui est directement impacté par ses résultats.
:::

On distingue quatre catégories majeures :
1. **Les utilisateurs métier** : manipulent le système au quotidien (secrétaire, comptable, formateurs).
2. **Les décideurs** : financent, valident les jalons et arbitrent les priorités (directeur général).
3. **Les personnes touchées** : subissent les effets du système sans nécessairement être devant l'écran (apprenants, parents d'élèves).
4. **Les acteurs externes** : imposent des règles légales ou fournissent des prestations (ministère de tutelle, hébergeur cloud, éditeur de logiciel).

---

### 3.1.2 Cartographie des parties prenantes (Influence $\times$ Intérêt)

Toutes les parties prenantes ne nécessitent pas le même temps d'attention. On les positionne sur une matrice à deux dimensions :

```text
INFLUENCE
  Forte  ^  [ Tenir satisfait ]          [ Collaborer étroitement ]
         |  Autorité de tutelle           Direction du centre
         |
  Faible |  [ Surveiller ]               [ Tenir informé / Écouter ]
         |  Prestataire occasionnel       Secrétaire, Comptable, Apprenants
         +------------------------------------------------------------>
           Faible                                                Fort  INTÉRÊT
```

- **Collaborer étroitement** : Acteurs à fort pouvoir et fort intérêt. Ils valident les orientations clés.
- **Tenir informé / Écouter** : Acteurs à forte implication opérationnelle mais faible pouvoir formel. Ils constituent **la source première des besoins réels**. Si on les ignore, ils contourneront l'outil.

---

### 3.1.3 Les techniques de collecte des besoins

Aucune technique ne suffit à elle seule. L'analyste les combine selon le contexte :

| Technique | Quand l'utiliser | Avantages | Limites |
|---|---|---|---|
| **Entretien individuel** | Pour approfondir le métier d'un acteur clé | Échange direct et compréhensif | Chronophage ; vision subjective |
| **Observation sur site** | Pour voir la réalité du terrain sans filtre | Révèle les **contournements réels** | Les utilisateurs peuvent modifier leurs habitudes lorsqu'ils sont observés |
| **Étude documentaire** | Analyse des formulaires, classeurs, fiches | Permet de comprendre les données manipulées | Les formulaires réels sont parfois obsolètes |
| **Questionnaire** | Pour interroger une large population (ex. 500 étudiants) | Données statistiques quantitatives | Réponses superficielles, pas d'explication des causes |
| **Atelier (*workshop*)** | Pour confronter des points de vue divergents | Aligne les services autour d'un consensus | Risque de monopolisation par les personnalités fortes |

---

### 3.1.4 Conduire un entretien : l'art des questions ouvertes

Pour faire émerger les vrais besoins, l'analyste évite à tout prix les questions fermées orientées et privilégie les **questions ouvertes** :

| Question fermée orientée (À BANNIR) | Question ouverte constructive (À PRIVILÉGIER) |
|---|---|
| *« Vous voulez un logiciel, n'est-ce pas ? »* (Suggère la réponse) | *« Décrivez-moi comment se déroule une journée type d'inscription. »* |
| *« Excel vous pose problème ? »* (Réponse par oui ou non) | *« Quelles sont les tâches qui vous prennent le plus de temps aujourd'hui ? »* |
| *« Un tableau de bord vous intéresse ? »* (Impose une solution) | *« De quels chiffres manquez-vous aujourd'hui pour piloter vos effectifs ? »* |

:::retenir Ce que révèle l'observation
Un **contournement observé** (ex. la secrétaire qui garde un carnet papier à côté de son ordinateur, ou un formateur qui recopie les listes d'un message) est presque toujours le signe d'un **besoin essentiel que les outils existants ne couvrent pas**.
:::

---

### 3.1.5 Besoin, Solution ou Souhait ?

L'un des plus grands pièges de l'ingénierie des exigences est de prendre une solution technique pour un besoin :

- **Le Besoin** : Ce que l'utilisateur doit pouvoir accomplir ou obtenir, **indépendamment de toute technologie** (*« Consulter en temps réel la situation financière d'un apprenant »*).
- **La Solution** : Un moyen technique particulier parmi d'autres de répondre au besoin (*« Un tableau Excel partagé sur Google Drive »*).
- **Le Souhait** : Une préférence esthétique ou de confort non indispensable au métier (*« Je veux que le fond d'écran soit violet »*).

:::retenir L'astuce du « Pour quoi faire ? »
Face à un utilisateur qui réclame un outil précis (*« Je veux un bouton Excel »*), l'analyste demande : **« Pour quoi faire ? Quel résultat en attendez-vous ? »**. En posant cette question deux à trois fois, on remonte infailliblement au besoin fondamental.
:::
