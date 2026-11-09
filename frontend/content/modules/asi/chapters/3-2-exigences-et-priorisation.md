### 3.2.1 Définition et typologie des exigences

Une **exigence** est la traduction formelle et rigoureuse d'un besoin utilisateur, exprimée de manière suffisamment précise pour être développée par les informaticiens et validée par les tests. On distingue deux catégories fondamentales :

#### 1. Les Exigences Fonctionnelles (EF)
Elles décrivent **les services métier rendus par le système : ce que le système doit faire**.
- **Formule de rédaction recommandée** : *« Le système doit [Verbe d'action à l'infinitif] + [Complément d'objet précis] »*.

| Code | Énoncé de l'exigence fonctionnelle |
|---|---|
| **EF-01** | Le système doit enregistrer une inscription et refuser tout dossier en doublon pour un même numéro d'identification. |
| **EF-02** | Le système doit afficher l'historique des versements et le solde restant dû pour un apprenant sélectionné. |
| **EF-03** | Le système doit calculer automatiquement et exporter l'effectif total des inscrits par filière. |

#### 2. Les Exigences Non Fonctionnelles (ENF)
Elles spécifient **comment** le système doit rendre ses services : le niveau de qualité de service, les contraintes techniques, réglementaires ou environnementales.

| Catégorie | Question posée | Exemple au Centre Avenir Formation |
|---|---|---|
| **Performance** | En combien de temps ? | *ENF-01* : Une inscription complète doit être validée et enregistrée en base en **moins de 3 secondes**. |
| **Sécurité** | Qui a le droit de faire quoi ? | *ENF-02* : La saisie et modification des quittances financières est **strictement réservée** aux profils Comptable et Direction. |
| **Ergonomie** | Le système est-il facile d'accès ? | *ENF-03* : Une secrétaire formée pendant une heure doit pouvoir enregistrer un dossier sans assistance externe. |
| **Disponibilité** | Quand le service doit-il fonctionner ? | *ENF-04* : Le système doit être opérationnel et accessible **de 8h à 18h, du lundi au samedi** avec un taux de disponibilité de 99%. |
| **Compatibilité** | Sur quel matériel ? | *ENF-05* : L'application web doit s'exécuter sur les postes existants sous Windows et Linux sans ajout de mémoire vive. |

---

### 3.2.2 Les 4 critères d'une exigence bien rédigée

Une exigence exploitable par un chef de projet doit obligatoirement respecter quatre critères :
1. **Claire** : compréhensible de la même façon par l'utilisateur et par le développeur, sans jargon ambigu.
2. **Unique** : exprime **une seule idée atomique** à la fois (ne jamais mélanger deux fonctionnalités dans une seule phrase).
3. **Vérifiable (Testable)** : on doit pouvoir concevoir un protocole de test formel qui répond par **Oui** ou par **Non**.
4. **Sans solution technique imposée** : elle dit *quoi faire*, mais ne préjuge pas de la bibliothèque ou du framework utilisé.

| Formulation défectueuse (À CORRIGER) | Formulation professionnelle conforme |
|---|---|
| *« Le système doit être rapide. »* (Non mesurable) | *« Le temps de génération du bulletin de notes ne doit pas excéder 2 secondes. »* |
| *« Le système gère les paiements et envoie les bulletins. »* (Deux idées distinctes) | Séparer en deux exigences : *EF-02 (Suivi paiements)* et *EF-05 (Édition bulletins)*. |
| *« L'interface doit être conviviale. »* (Vague et subjectif) | *« Le formulaire d'inscription doit être complété en moins de 5 clics par un utilisateur standard. »* |

---

### 3.2.3 La méthode de priorisation MoSCoW

Dans un projet informatique, les ressources, le budget et le temps sont finis. La méthode **MoSCoW** classe les exigences en quatre catégories de priorité :

| Catégorie | Signification | Règle de gestion sur le projet |
|---|---|---|
| **M - Must** (*Doit être fait*) | **Indispensable absolu**. Sans cette exigence, le produit n'a aucune valeur métier ou n'est pas utilisable légalement. | Si un seul *Must* manque, le projet ne peut être mis en service. |
| **S - Should** (*Devrait être fait*) | **Très importante**, mais des solutions de contournement temporaires sont possibles si le délai presse. | Prioritaire dès que les *Must* sont stabilisés. |
| **C - Could** (*Pourrait être fait*) | **Fonctionnalité de confort** ou d'agrément, réalisée si et seulement s'il reste du temps et du budget. | C'est la **première variable d'ajustement** abandonnée en cas de retard sur le planning. |
| **W - Won't** (*Ne sera pas fait cette fois*) | Exigence formellement identifiée et validée, mais **reportée à une version ultérieure**. | Évite les dérives de périmètre (*scope creep*). |

:::attention Le piège mortel du « Tout est Must »
Si un donneur d'ordre déclare que 100% de ses exigences sont des *Must*, la priorisation devient nulle et inapplicable. En cas d'aléa ou de retard de planning, l'équipe ne saura pas quoi sacrifier et le projet s'effondrera sur sa qualité globale.
:::

---

### 3.2.4 La structure d'un Cahier des Charges fonctionnel

Le **cahier des charges** scelle le contrat de confiance entre le client (maîtrise d'ouvrage) et l'équipe de réalisation (maîtrise d'œuvre) à travers 7 chapitres normés :
1. **Contexte et objectifs** : présentation de l'organisation, problème constaté, gains attendus ;
2. **Périmètre du projet** : ce qui est expressément **inclus** et ce qui est expressément **hors périmètre** ;
3. **Parties prenantes** : profils utilisateurs, droits d'accès et attentes respectives ;
4. **Exigences détaillées** : catalogue des exigences fonctionnelles et non fonctionnelles priorisées en MoSCoW ;
5. **Contraintes du projet** : budget alloué, date butoir impérative, contraintes matérielles ou juridiques ;
6. **Livrables et calendrier prévisionnel** : jalons de livraison et documents attendus ;
7. **Modalités de recette et validation** : critères formels d'acceptation du système par les utilisateurs.
