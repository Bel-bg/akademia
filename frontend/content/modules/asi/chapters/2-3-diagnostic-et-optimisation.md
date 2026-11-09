### 2.3.1 Modélisation de l'existant (AS-IS) et diagnostic

Avant d'envisager le moindre changement logiciel, l'analyste doit impérativement modéliser le processus **AS-IS** (*« tel quel »*), qui décrit le fonctionnement réel de l'organisation sur le terrain.

#### L'analyse critique du parcours AS-IS au Centre Avenir Formation
1. Le candidat remplit une fiche papier au secrétariat ;
2. La secrétaire recopie la fiche dans un fichier Excel ;
3. Le candidat se rend à la comptabilité où le paiement est noté dans un cahier ;
4. La secrétaire diffuse la liste par capture d'écran dans un groupe WhatsApp ;
5. Le formateur reçoit l'information et démarre son cours.

```text
Candidat   : [ Remplir fiche papier ]
                     | (déplacement)
Secrétaire : [ Recopier dans Excel ] --------------------+
                                                         | (transmission)
Comptable  : [ Encaisser et noter dans cahier ]          v
                                                [ Envoyer sur WhatsApp ]
                                                         |
Formateur  :                                    [ Recevoir la liste ]
```

---

### 2.3.2 Les 4 symptômes majeurs de dysfonctionnement

L'analyse d'un schéma AS-IS fait ressortir quatre faiblesses récurrentes :

| Symptôme | Définition | Constat au Centre Avenir Formation |
|---|---|---|
| **Double saisie** | Une même donnée est ressaisie manuellement plusieurs fois sur des supports différents. | Saisie sur fiche papier, puis dans Excel, puis dans le cahier comptable. |
| **Attente** | Un dossier reste bloqué, inerte, entre deux étapes successives. | L'apprenant attend que la comptable saisisse son reçu pour pouvoir être affecté. |
| **Perte d'information** | Une donnée transmise n'arrive pas ou est dégradée. | Des messages d'inscriptions se perdent dans le fil WhatsApp. |
| **Retour en arrière** | Une étape passée doit être refaite à cause d'une anomalie détectée tardivement. | Un dossier incomplet n'est découvert qu'après le paiement, obligeant à tout reprendre. |

---

### 2.3.3 La notion de goulot d'étranglement

:::retenir Définition
Un **goulot d'étranglement** est l'étape du processus dont la capacité de traitement est **la plus faible**. C'est elle qui impose son rythme et plafonne le débit global de l'organisation.
:::

```text
[ Accueil / Fiche ]      --->   [ Recopie Excel (Goulot) ]   --->   [ Encaissement ]
(Capacité: 30 dossiers/j)          (Capacité: 12 dossiers/j)           (Capacité: 25 dossiers/j)
```
Même si le secrétariat accueillait 100 candidats par jour, le centre ne pourrait inscrire que **12 apprenants par jour**, car le goulot d'étranglement bloque le flux.

#### Comment repérer un goulot sur le terrain ?
- Une file d'attente permanente de dossiers devant un bureau précis ;
- Un acteur chroniquement surchargé et sous tension ;
- Les acteurs de l'étape suivante qui attendent sans travail à fournir.
*(Attention : accélérer une étape située hors du goulot ne change absolument rien au résultat final).*

---

### 2.3.4 Amélioration continue vs Réingénierie (BPR)

Pour moderniser un processus, deux stratégies s'offrent à l'organisation :

- **L'amélioration continue** : ajustements progressifs et réguliers à faible risque (ex. ajouter un champ obligatoire sur la fiche d'inscription).
- **La réingénierie (*Business Process Reengineering - BPR*)** : repenser le processus en profondeur en repartant de l'objectif final à atteindre, en faisant table rase des habitudes passées.
*(Au Centre Avenir Formation, la multiplicité des ressaisies et l'absence totale de base partagée imposent une réingénierie globale).*

---

### 2.3.5 Les 4 leviers d'optimisation (dans l'ordre strict !)

Pour transformer un processus AS-IS vers un processus **TO-BE** (*« tel qu'il doit être »*), on applique quatre leviers dans un **ordre hiérarchique impératif** :

```text
1. SUPPRIMER  ---> Cette étape est-elle utile ? (Supprimer la recopie manuelle dans Excel)
      |
2. SIMPLIFIER ---> Peut-on réduire les étapes ? (Saisie directe unique par le candidat en ligne)
      |
3. PARALLÉLISER -> Peut-on faire deux choses en même temps ? (Éditer le reçu et affecter à la classe)
      |
4. AUTOMATISER --> Un programme peut-il s'en charger ? (Envoi automatique de la quittance par e-mail)
```

:::attention Règle d'or de l'analyste
**On automatise toujours en dernier !** Automatiser une étape inutile ou mal conçue consiste simplement à exécuter un gaspillage plus rapidement.
:::

---

### 2.3.6 Comparatif de synthèse : AS-IS vs TO-BE

| Critère d'évaluation | Processus AS-IS (Aujourd'hui) | Processus TO-BE (Cible optimisée) |
|---|---|---|
| **Nombre de saisies** | 4 supports (fiche, Excel, cahier, WhatsApp) | **1 saisie unique** dématérialisée |
| **Vérification du dossier** | Tardive ou absente | Contrôle automatique de complétude **avant** paiement |
| **Goulot d'étranglement** | Recopie manuelle de la secrétaire | Supprimé (libre-service candidat et validation rapide) |
| **Délais moyens** | 3 jours d'attente | Moins de 10 minutes |
| **Information formateur** | Messages WhatsApp éparpillés | Liste synchronisée en temps réel dans l'application |
