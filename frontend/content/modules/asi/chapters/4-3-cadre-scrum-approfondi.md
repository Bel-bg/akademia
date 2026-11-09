### 4.3.1 Origine et philosophie du cadre Scrum

Créé en 1995 par **Ken Schwaber** et **Jeff Sutherland**, **Scrum** (terme emprunté au rugby signifiant la *« mêlée »*) est aujourd'hui la méthode agile la plus largement adoptée dans le monde pour le développement de systèmes complexes.

Scrum n'est pas une méthodologie lourde prescriptive, mais un **cadre de processus léger (*process framework*)** fondé sur l'**empirisme** :
> Face à la complexité, la connaissance s'acquiert par l'expérience et la prise de décision s'appuie sur des faits réels observés.

:::retenir Les trois piliers empiriques de Scrum
1. **Transparence** : Les aspects significatifs du processus et de l'état d'avancement doivent être visibles par tous (management visuel, backlog partagé).
2. **Inspection** : Évaluation régulière et critique des artefacts Scrum et de l'avancement vers l'objectif de sprint pour détecter les dérives.
3. **Adaptation** : Ajustement immédiat du produit ou du processus dès qu'un écart de qualité ou de contenu est identifié.
:::

---

### 4.3.2 Le rythme du Sprint : un bloc de temps rigide (*Timebox*)

Le cœur de Scrum est le **Sprint** : une itération d'une durée fixe comprise entre **une semaine et un mois** (la norme actuelle étant de 2 à 3 semaines).

:::attention La règle absolue du bloc de temps
**Une fois le sprint lancé, sa date de fin est STRICTEMENT FIXÉE et ne peut jamais être repoussée !**
Même si l'équipe n'a pas terminé toutes les tâches prévues, le sprint se clôture le jour convenu. Cette discipline évite le syndrome du *« presque fini »*. Les éléments incomplets sont réintégrés au backlog et réestimés pour les sprints suivants.
:::

- **Mise en service vs Déploiement** :
  - Le *Déploiement* consiste à installer une version sur une plateforme de test pour apprendre et obtenir du feedback (valeur d'apprentissage).
  - La *Mise en service* procure de la valeur directe aux utilisateurs finaux en production. Elle peut être décidée indépendamment de la fin du sprint.

---

### 4.3.3 Les trois rôles Scrum

Scrum **élimine formellement le rôle traditionnel de chef de projet** et répartit ses responsabilités entre trois rôles spécialisés :

```text
+-----------------------+     +-----------------------+     +-----------------------+
|     PRODUCT OWNER     |     |     SCRUM MASTER      |     |     DÉVELOPPEURS      |
| Responsable du PRODUIT|     | Responsable de la     |     | Responsables de la    |
| et de la VALEUR MÉTIER|     | MÉTHODE et du CADRE   |     | RÉALISATION TECHNIQUE |
+-----------------------+     +-----------------------+     +-----------------------+
```

1. **Le Product Owner (PO - Propriétaire du produit)** :
   - Porte la vision du produit et maximise la valeur créée ;
   - Rédige, affine et **ordonne de manière stricte le backlog** (aucun ex-aequo) ;
   - Arbitre les compromis fonctionnels et décide des dates de mise en service.
2. **Le Scrum Master (SM)** :
   - Leader-serviteur qui aide l'équipe à appliquer les valeurs et pratiques de Scrum ;
   - **Élimine activement les obstacles (*impediments*)** qui bloquent les développeurs ;
   - **Ne possède AUCUNE autorité hiérarchique** sur l'équipe : il ne commande pas et n'assigne pas le travail.
3. **L'Équipe de Développement (Les Développeurs)** :
   - Professionnels pluridisciplinaires (analystes, développeurs, testeurs) responsables de la construction de l'incrément ;
   - **Auto-organisée** : l'équipe décide elle-même de la façon technique d'atteindre l'objectif du sprint.

---

### 4.3.4 Le Backlog Produit et la Définition de Fini (*DoD*)

Le **Backlog Produit** est la liste ordonnée, unique, publique et évolutive de tout ce qui pourrait être nécessaire dans le produit :
- **Fonctionnalités (ou *Epics*)** : gros blocs fonctionnels visibles par le client ;
- **User Stories** : petites unités de valeur métier suffisamment réduites pour être entièrement réalisées, testées et livrées au cours d'un seul sprint.

#### La Définition de Fini (*Definition of Done - DoD*)
Un élément n'est pas considéré comme achevé simplement parce que le code a été saisi. La **DoD** est une liste de contrôle exigeante partagée par toute l'équipe :

| Catégorie de vérification | Critères constitutifs de la DoD |
|---|---|
| **1. Fonctionnement** | Tous les tests des critères d'acceptation de la story sont exécutés avec succès. |
| **2. Qualité Externe** | Ergonomie validée, temps de réponse sous le seuil, sécurité vérifiée, aucune régression. |
| **3. Qualité Interne** | Code relu en binôme (*code review*), normes respectées, tests unitaires écrits, documentation à jour. |

---

### 4.3.5 Les quatre événements d'un Sprint

Un sprint est structuré par quatre rituels synchronisés :

```text
[ LUNDI MATIN ]       ---> [ QUOTIDIEN : 15 MIN ] ---> [ VENDREDI APM ]   ---> [ VENDREDI SOIR ]
Sprint Planning             Daily Scrum (Mêlée)         Sprint Review            Sprint Retrospective
(Que faire & comment)       (Debout, 3 questions)       (Démo & Feedback)        (Amélioration continue)
```

1. **Sprint Planning (Planification)** :
   L'équipe choisit les éléments prioritaires en haut du backlog et formule un **objectif de sprint** (*Sprint Goal*).
2. **Daily Scrum (La Mêlée quotidienne)** :
   Réunion de 15 minutes chrono, debout devant le tableau visuel :
   - *Qu'ai-je accompli hier pour rapprocher l'équipe du but ?*
   - *Que vais-je faire aujourd'hui ?*
   - *Quels sont les obstacles qui me bloquent ?*
3. **Sprint Review (Revue de sprint)** :
   Démonstration de l'incrément fonctionnel fini aux parties prenantes pour recueillir leurs impressions et adapter le backlog.
4. **Sprint Retrospective (Rétrospective)** :
   Réunion interne à l'équipe Scrum pour examiner ce qui a bien fonctionné, ce qui a posé problème, et décider d'un plan d'amélioration de ses pratiques pour le sprint suivant.

---

### 4.3.6 Le suivi par la courbe d'avancement (*Burndown Chart*)

Le **Burndown Chart** (littéralement *« graphique du travail qui brûle »*) affiche la quantité d'effort restant à accomplir jour après jour :
- **Ligne idéale** : trajectoire linéaire descendant régulièrement de la charge totale initiale à zéro au dernier jour du sprint.
- **Ligne réelle** : permet d'anticiper les dérives. Si la courbe réelle reste au-dessus de la ligne idéale, l'équipe négocie immédiatement avec le PO pour retirer une story avant la fin du sprint.

---

### 4.3.7 Scrum à grande échelle : Plusieurs équipes sur un même produit

Lorsque le projet nécessite plusieurs dizaines de développeurs, on applique les principes du passage à l'échelle :

- **Équipes « fonctionnalités » (*Feature Teams*)** : Chaque équipe Scrum est pluridisciplinaire et développe une fonctionnalité de bout en bout (IHM, logique, base de données).
- **Synchronisation des sprints** : Toutes les équipes débutent et achèvent leurs sprints le même jour pour fiabiliser l'intégration continue.
- **Product Manager (PM / PO de PO)** : Un groupe de Product Owners coordonne les priorités, arbitré par le Product Manager.
- **La Mêlée des Mêlées (*Scrum of Scrums*)** : Réunion tenue tous les 2 à 3 jours par des ambassadeurs de chaque équipe pour synchroniser les interfaces et lever les blocages inter-équipes.
