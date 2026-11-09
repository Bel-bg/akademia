# L'API Stream : traitement déclaratif des données

L'API Stream (package `java.util.stream`), introduite en Java 8, permet de traiter des collections de données de manière déclarative et fonctionnelle, à la manière d'un pipeline de requêtes.

---

## 1. Qu'est-ce qu'un Stream ?

Un `Stream<T>` n'est **pas** une structure de données qui stocke des éléments (comme une `List` ou un tableau). C'est un **flux continu d'éléments** transportés à travers un pipeline de transformations.

```
Source (Collection) ---> [ Opération Intermédiaire 1 ] ---> [ Opération Intermédiaire 2 ] ---> [ Opération Terminale ]
```

:::retenir
Question d'examen : *« En Java, un flux de type Stream<String> permet : »*
- A. De lire un fichier texte
- **B. De traiter une collection de chaînes** (Bonne réponse)
- C. De créer un thread
- D. De convertir un tableau
:::

---

## 2. Les deux catégories d'opérations sur un Stream

Le pipeline se compose toujours de deux types d'opérations distinctes :

### A. Les opérations intermédiaires (Intermediary operations)
- Elles transforment un flux en un autre flux `Stream<T>`.
- Elles sont **paresseuses (lazy)** : elles ne s'exécutent pas immédiatement, mais attendent qu'une opération terminale déclenche le traitement.
- Exemples :
  - `filter(Predicate<T>)` : conserve les éléments vérifiant une condition.
  - `map(Function<T, R>)` : transforme chaque élément en un autre objet.
  - `sorted()` : ordonne les éléments.
  - `distinct()` : élimine les doublons.

### B. Les opérations terminales (Terminal operations)
- Elles consomment le flux, produisent un résultat ou un effet de bord, et **ferment définitivement le Stream** (un Stream ne peut être consommé qu'une seule fois).
- Exemples avec résultat :
  - `collect(Collectors.toList())` : rassemble les éléments dans une `List`.
  - `count()` : renvoie le nombre d'éléments sous forme de `long`.
  - `findFirst()`, `reduce()`, `anyMatch()`.
- Exemple **sans retour de résultat** :
  - `forEach(Consumer<T>)` : applique une action à chaque élément sans rien renvoyer (`void`).

:::retenir
Question d'examen : *« Quelle méthode d’un Stream exécute une action sans retourner de résultat ? »*
- A. `map()` (renvoie un nouveau Stream)
- B. `collect()` (renvoie une Collection ou un résultat)
- **C. `forEach()`** (action terminale de type `void`, bonne réponse)
- D. `filter()` (renvoie un nouveau Stream filtré)
:::

---

## 3. Exemple concret appliqué au domaine bancaire

Filtrons tous les comptes bancaires à découvert (solde négatif), extrayons leur numéro et affichons-les :

```java
List<CompteBancaire> liste = List.of(
    new CompteCourant("CC-1", -15_000),
    new CompteCourant("CC-2", 40_000),
    new CompteEpargne("CE-1", 100_000),
    new CompteCourant("CC-3", -35_000)
);

// Pipeline Stream complet :
liste.stream()
    .filter(c -> c.getSolde() < 0)                      // Opération intermédiaire : filtre
    .map(CompteBancaire::getNumero)                     // Opération intermédiaire : transforme en String
    .forEach(num -> System.out.println("Débiteur : " + num)); // Opération terminale sans retour
```

Pour collecter les comptes d'épargne dans une nouvelle liste :

```java
List<CompteBancaire> epargnes = liste.stream()
    .filter(c -> c instanceof CompteEpargne)
    .collect(Collectors.toList());
```
