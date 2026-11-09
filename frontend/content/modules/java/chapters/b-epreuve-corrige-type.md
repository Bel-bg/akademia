# Épreuve officielle & corrigé type universitaire

Ce chapitre présente le sujet d'examen universitaire de référence ainsi que son **corrigé type officiel commenté**.

---

# PARTIE I (10 points) : Étude de cas & Analyse

## 1. Travail à faire

1. **Classe abstraite `CompteBancaire`** :
   Attributs `numero` (String) et `solde` (double), méthode abstraite `retirer(double montant)`, méthode concrète `deposer(double montant)` et méthode d'affichage `afficherSolde()`.
2. **Classes dérivées `CompteCourant` et `CompteEpargne`** :
   - `CompteCourant` : découvert maximal autorisé de 50 000 FCFA.
   - `CompteEpargne` : interdiction formelle de solde négatif.
3. **Classe `Banque`** :
   Collection de comptes, méthodes `ajouterCompte(CompteBancaire)` et `transferer(numeroSource, numeroDestination, montant)`.
4. **Exceptions et atomicité** :
   Garantir que si le retrait ou le dépôt échoue, les soldes des deux comptes retrouvent exactement leurs valeurs initiales.

---

## 2. Questions d'Analyse (Corrigé officiel)

### Question 1 : Pourquoi la classe `CompteBancaire` est-elle abstraite ?
> **Réponse officielle** :
> Elle représente un concept général de compte bancaire. Elle définit les caractéristiques communes aux différents comptes, mais laisse aux sous-classes le soin d'implémenter la méthode `retirer()` selon leurs propres règles métiers spécifiques (découvert autorisé ou interdiction de découvert).

### Question 2 : Quel mécanisme de la POO permet à la méthode `retirer()` d'avoir des comportements différents selon le type de compte ?
> **Réponse officielle** :
> **Le polymorphisme**, associé à la redéfinition de méthode (**`@Override`**). Un objet de type réel `CompteCourant` applique la règle du découvert, tandis qu'un objet de type `CompteEpargne` interdit un solde négatif. La JVM détermine dynamiquement à l'exécution la méthode à invoquer selon le type de l'instance réelle (*liaison tardive / late binding*).

### Question 3 : Pourquoi est-il préférable de manipuler les comptes à travers des références de type `CompteBancaire` dans la collection de la banque ?
> **Réponse officielle** :
> Cela permet de stocker des comptes courants et des comptes d'épargne dans une même collection générique (`List<CompteBancaire>`), sans devoir créer une collection distincte pour chaque sous-classe. Les appels aux méthodes redéfinies sont résolus selon le type réel de chaque objet : c'est le polymorphisme. De plus, cela respecte le principe d'ouverture/fermeture (OCP) : l'ajout d'un nouveau type de compte ne modifie pas la classe `Banque`.

### Question 4 : Quel doit être le résultat du transfert de 30 000 FCFA ?
*(Conditions : Compte courant initialement à -20 000 FCFA, Compte d'épargne initialement à +20 000 FCFA)*
> **Réponse officielle** :
> **Le transfert réussit.** Le compte courant passe de −20 000 à −50 000 FCFA, ce qui correspond exactement à la limite de découvert autorisée (50 000 FCFA). Le compte d'épargne passe de 20 000 à 50 000 FCFA. Aucune restauration n'est nécessaire.

---

# PARTIE II (10 points) : Grille des 20 Questions QCM

| N° | Question | Réponse | Justification technique |
|:---:|---|:---:|---|
| **1** | Concaténation de chaîne dans boucle 10 000 itérations | **A** | `StringBuilder` et `append()` évitent la création de 10 000 objets temporaires `String` immuables. |
| **2** | Isolation JDBC empêchant deux valeurs différentes lors de deux lectures | **C** | `TRANSACTION_REPEATABLE_READ` garantit qu'une ligne relue conserve la même valeur même si validée par $T_2$. |
| **3** | Atomicité du transfert de 5 000 FCFA | **C** | `setAutoCommit(false)`, exécuter les requêtes, puis `commit()` si succès et `rollback()` en cas d'échec. |
| **4** | Rôle du mot-clé `transient` | **B** | Exclut formellement un champ du processus de sérialisation binaire `Serializable`. |
| **5** | JPA `@OneToMany(fetch = FetchType.LAZY)` sur 100 départements | **C** | Provoque le **problème N+1** : 1 requête initiale + 1 requête par département pour charger ses employés. |
| **6** | Mot-clé pour créer un Thread | **C** | `implements Runnable` (ou hériter de la classe `Thread`). |
| **7** | `String s1 = "Java"; String s2 = new String("Java"); s1 == s2` | **B** | `false` : `==` compare les références. `s1` pointe vers le String Pool et `s2` vers un nouvel objet sur le Heap. |
| **8** | Comportement de `em.merge(e)` sur entité détachée | **B** | `merge(e)` retourne une nouvelle instance gérée ; l'objet original `e` passé reste détaché. |
| **9** | JavaFX : racine d’une interface graphique | **D** | `Parent` est la classe de base pour tous les nœuds racines pouvant contenir des enfants graphiques. |
| **10** | Méthode pour exécuter / démarrer un thread | **A** | `start()` alloue les ressources du thread et lance l'exécution concurrente. `run()` n'est qu'un appel synchrone. |
| **11** | JDBC : méthode pour exécuter un `SELECT` | **B** | `executeQuery()` renvoie un `ResultSet`. `executeUpdate()` est réservé aux écritures DML (`INSERT/UPDATE/DELETE`). |
| **12** | Garantie du design pattern Singleton | **B** | Garantit qu'une classe ne possède **qu'une seule et unique instance** dans l'application. |
| **13** | Annotation indiquant qu'une méthode redéfinit la superclasse | **B** | `@Override` vérifie la conformité de la signature lors de la compilation. |
| **14** | Rôle d'un `Stream<String>` | **B** | Permet de traiter une collection ou un flux de chaînes de manière déclarative et fonctionnelle. |
| **15** | Méthode d'un Stream exécutant une action sans résultat | **C** | `forEach(Consumer<T>)` est une opération terminale de type `void`. |
| **16** | Différence entre `throw` et `throws` | **B** | `throw` lance concrètement une exception, tandis que `throws` déclare les exceptions dans la signature. |
| **17** | Fichier définissant l’interface utilisateur en JavaFX | **C** | Les fichiers `.fxml` (langage déclaratif basé sur XML) décrivent les vues graphiques. |
| **18** | Interface représentant une collection sans doublons | **D** | `Set` interdit les doublons (`HashSet`, `TreeSet`). `List` accepte les doublons. |
| **19** | Classe Java pour la synchronisation manuelle entre threads | **B** | `Semaphore` gère manuellement un pool de permis d'accès concurrents (`acquire()`, `release()`). |
| **20** | Utilité de la classe `Optional` | **B** | Modélise la présence ou l'absence d'une valeur sans risquer de `NullPointerException`. |

:::examen
Conseil Akademia : mémorisez parfaitement les justifications ci-dessus. Ce sont les critères exacts sur lesquels les correcteurs universitaires départagent les étudiants !
:::
