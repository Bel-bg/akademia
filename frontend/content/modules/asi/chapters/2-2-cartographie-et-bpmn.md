### 2.2.1 Qu'est-ce qu'un processus métier ?

:::retenir Définition officielle
Un **processus métier** est un enchaînement structuré d'**activités** logiques, exécutées par des **acteurs** identifiés, qui transforme des **entrées** (matières, documents, demandes) en **sorties** ayant une valeur mesurable pour un client ou un bénéficiaire.
:::

```text
[ ENTRÉE ] -------------------> [ ACTIVITÉS ] -------------------> [ SORTIE ]
Dossier du candidat           Vérifier, Encaisser, Affecter        Apprenant inscrit en classe
(Client demandeur)             (Secrétaire, Comptable)              (Valeur ajoutée livrée)
```

#### Processus, Procédure ou Organigramme : ne pas confondre !
- **L'Organigramme** répond à : *« Qui est rattaché à qui ? »* (Structure hiérarchique statique d'un service).
- **Le Processus** répond à : *« Comment le travail s'enchaîne-t-il de bout en bout pour délivrer de la valeur ? »* (Il est transversal et traverse plusieurs services).
- **La Procédure** répond à : *« Comment réaliser concrètement une tâche précise au sein d'un service ? »* (Mode opératoire détaillé).

---

### 2.2.2 Les trois familles de processus (Cartographie globale)

Une organisation modélise ses activités en trois grandes familles de processus :

```text
+------------------------------------------------------------------------+
| 1. PROCESSUS DE MANAGEMENT : Fixer la stratégie, piloter et contrôler   |
|    (ex. Définir les filières, piloter les budgets, évaluer la qualité) |
+------------------------------------------------------------------------+
                                    |
+------------------------------------------------------------------------+
| 2. PROCESSUS DE RÉALISATION : Cœur de métier (contact direct client)   |
|    [ Accueillir ] ---> [ Inscrire ] ---> [ Enseigner ] ---> [ Évaluer ]|
+------------------------------------------------------------------------+
                                    ^
+------------------------------------------------------------------------+
| 3. PROCESSUS DE SUPPORT : Fournir les ressources nécessaires           |
|    (ex. Gérer la comptabilité, la paie, le matériel, le SI)           |
+------------------------------------------------------------------------+
```

---

### 2.2.3 La fiche processus

Avant de tracer un schéma, on renseigne la **fiche processus** pour figer le périmètre de travail :

| Rubrique | Contenu pour le processus « Inscrire un apprenant » |
|---|---|
| **Finalité** | Enregistrer un candidat et l'affecter formellement à une classe. |
| **Déclencheur** | Un candidat se présente au secrétariat avec son dossier. |
| **Entrées** | Fiche d'inscription, pièces justificatives, premier versement. |
| **Sorties** | Dossier validé dans le système, quittance/reçu de paiement, liste de classe à jour. |
| **Acteurs** | Candidat, secrétaire, comptable, formateur. |
| **Pilote** | La secrétaire académique (responsable du bon déroulement du processus). |
| **Indicateurs** | Délai moyen d'inscription (jours), taux d'erreurs de saisie sur les noms (%). |

---

### 2.2.4 La notation standard BPMN 2.0

**BPMN 2.0** (*Business Process Model and Notation*) est la norme internationale (ISO/IEC 19510) maintenue par l'**OMG** (*Object Management Group*) pour représenter visuellement les processus métier.

```text
[ Événement début ] ---> [ Activité ] ---> < Passerelle > ---> [ Événement fin ]
     (Cercle fin)         (Rectangle)        (Losange)           (Cercle épais)
```

#### Les symboles fondamentaux
1. **Événements (cercles)** :
   - *Cercle simple* : Événement de début (déclencheur) ;
   - *Double cercle* : Événement intermédiaire (ex. attente d'un accusé) ;
   - *Cercle gras* : Événement de fin (aboutissement du processus).
2. **Activités / Tâches (rectangles à coins arrondis)** :
   - Doivent impérativement être libellées par un **verbe à l'infinitif** suivi d'un complément d'objet (ex. *« Vérifier le dossier »*, *« Encaisser le paiement »*).
3. **Flux de séquence (flèche pleine continue)** :
   - Indique l'ordre temporel d'enchaînement des tâches **au sein d'un même couloir ou d'un même pool**.
4. **Passerelles (losanges)** :
   - **Passerelle exclusive $(X)$** : un seul chemin est emprunté selon une condition (ex. *dossier complet* ou *dossier incomplet*).
   - **Passerelle parallèle $(+)$** : toutes les branches sont exécutées simultanément. Une seconde passerelle $(+)$ de synchronisation referme la parallèle.

---

### 2.2.5 Pools, Couloirs (Lanes) et Flux de messages

- **Pool (bassin)** : Représente une entité organisationnelle ou un participant externe autonome (ex. le *Candidat*, l'*Entreprise cliente*, la *Banque*).
- **Couloir (*Lane*)** : Représente un rôle, un poste ou un service interne **à l'intérieur** d'un même pool (ex. le couloir *Secrétaire* et le couloir *Comptable* dans le pool du centre).
- **Flux de messages (flèche en pointillés avec cercle vide au départ)** :
  - **Représente exclusivement les échanges d'information entre deux pools distincts**.

:::attention Règle d'or absolue en BPMN
**On ne trace JAMAIS de flux de séquence (flèche pleine) entre deux pools différents !** Entre deux organisations indépendantes, seules des flèches en pointillés de messages peuvent franchir la frontière des pools.
:::
