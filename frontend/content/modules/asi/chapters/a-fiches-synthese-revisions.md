### A.1 Fiche 1 : Mémento Système d'Information vs Système Informatique

- **Donnée** : Fait brut sans contexte (ex. `14,5`).
- **Information** : Donnée contextualisée ayant un sens (ex. `Note d'algèbre de Marie = 14,5`).
- **Connaissance** : Information reliée permettant d'agir et de décider.
- **Système d'Information (SI)** : Ensemble organisé (Personnes, Procédures, Données, Logiciels, Matériel) pour **collecter, stocker, traiter et diffuser** l'information.
- **Système Informatique** : Partie purement technique et automatisée du SI (matériel, réseau, code).
- **ERP / PGI** : Progiciel unique articulé autour d'une **base de données unique partagée** entre tous les départements.

---

### A.2 Fiche 2 : Règles clés de la Matrice RACI

| Rôle RACI | Signification | Règle d'or absolue |
|---|---|---|
| **R** (Responsible) | Réalise la tâche | **Au moins un R par ligne** (sinon tâche orpheline). |
| **A** (Accountable) | Répond du résultat final | **UN SEUL A par ligne** (sinon responsabilité diluée ou conflit). |
| **C** (Consulted) | Fournit son avis d'expert | Pas de cumul contradictoire (inutile d'écrire $C$ et $I$ ensemble). |
| **I** (Informed) | Tenu informé des résultats | Notifié sans pouvoir de décision. |

---

### A.3 Fiche 3 : Symboles et Règles BPMN 2.0

- **Activité / Tâche** : Rectangle à coins arrondis $\to$ **Verbe d'action à l'infinitif** + complément.
- **Événements** : Cercle fin (début), cercle double (intermédiaire), cercle épais (fin).
- **Passerelle exclusive $(X)$** : Choix binaire ou exclusif (une seule sortie empruntée).
- **Passerelle parallèle $(+)$** : Exécution simultanée de toutes les branches (synchronisation par un second $+$).
- **Pool** : Une entité organisationnelle ou un participant externe indépendant.
- **Couloir (*Lane*)** : Un rôle ou un service interne à un pool.
- **Flux de messages (pointillés)** : Uniquement **entre deux pools différents**. Pas de flux plein entre deux pools.

---

### A.4 Fiche 4 : Les 4 leviers d'optimisation de processus (dans l'ordre)

1. **Supprimer** : Les étapes sans valeur ajoutée ni contrôle utile ;
2. **Simplifier** : Réduire le nombre de saisies et d'écrans ;
3. **Paralléliser** : Exécuter simultanément des activités indépendantes ;
4. **Automatiser** : En dernier lieu, confier l'exécution à un programme.

---

### A.5 Fiche 5 : Priorisation MoSCoW et Exigences

- **Must** : Indispensable (sans lui, le système ne peut pas être mis en service).
- **Should** : Très important mais contournable temporairement.
- **Could** : Confort (première variable d'ajustement en cas de retard).
- **Won't** : Reporté à la version suivante.
- **Critères d'une bonne exigence** : Claire, Unique, Vérifiable (testable par oui/non), Sans solution technique imposée.

---

### A.6 Fiche 6 : Synthèse du cadre Scrum

- **3 Rôles** : Product Owner (Valeur et Backlog), Scrum Master (Cadre et Obstacles), Développeurs (Réalisation pluridisciplinaire). Pas de chef de projet !
- **4 Événements** : Sprint Planning, Daily Scrum (15 min debout), Sprint Review (démo et feedback), Sprint Retrospective (amélioration du processus).
- **Artefacts** : Backlog Produit ordonné, Backlog de Sprint, Incrément fini selon la Définition de Fini (*DoD*).
- **Règle clé du Sprint** : Durée fixe (*Timebox* de 1 à 4 semaines), la date de fin n'est jamais repoussée.
