# Le Framework Collections : List, Set et Map

Le Java Collections Framework (`java.util`) fournit une architecture standardisée pour stocker, organiser et manipuler des groupes d'objets en mémoire.

---

## 1. La hiérarchie des interfaces principales

```
                Iterable<E>
                    |
               Collection<E>
             /      |       \
        List<E>   Set<E>   Queue<E>
```
*(Remarque : `Map<K, V>` est une interface indépendante gérant des paires clé-valeur et n'hérite pas directement de `Collection`).*

---

## 2. L'interface `Set` : la collection sans doublons

L'interface `Set<E>` modélise un ensemble mathématique : **elle interdit formellement la présence de doublons**.

Si l'on tente d'insérer un élément déjà existant (au sens de la méthode `equals()`), la méthode `add()` renvoie simplement `false` sans lever d'exception et sans modifier la collection.

```java
Set<String> prenoms = new HashSet<>();
prenoms.add("Aminata");
prenoms.add("Koffi");
boolean ajoute = prenoms.add("Aminata"); // Renvoie false ! Ignoré car doublon

System.out.println(prenoms.size()); // Affiche 2
```

### Principales implémentations de `Set` :
- `HashSet` : basée sur une table de hachage. Recherche, insertion et suppression très rapides en $O(1)$. Aucun ordre garanti.
- `LinkedHashSet` : conserve l'ordre d'insertion des éléments.
- `TreeSet` : conserve les éléments triés selon leur ordre naturel (`Comparable`) ou un `Comparator` en $O(\log N)$.

:::retenir
Question d'examen : *« Quelle interface représente une collection sans doublons ? »*
Réponse : **`Set`** (l'interface `List` autorise les doublons et préserve l'ordre indicé ; `Map` stocke des paires clés/valeurs).
:::

---

## 3. L'interface `List` : collections ordonnées et indicées

L'interface `List<E>` représente une séquence ordonnée d'éléments accessibles par un index numérique (de `0` à `size() - 1`). Elle autorise les doublons.

### Implémentations courantes :
- `ArrayList<E>` : basée sur un tableau dynamique.
  - Accès direct par index en $O(1)$ (`get(i)`).
  - Ajout en fin de tableau en $O(1)$ amorti.
  - Choix idéal pour la majorité des cas d'usage (ex : `Banque.comptes`).
- `LinkedList<E>` : liste doublement chaînée.
  - Insertions et suppressions rapides au début ou milieu en $O(1)$ si l'on détient le nœud.
  - Accès par index lent en $O(N)$.

```java
List<CompteBancaire> liste = new ArrayList<>();
liste.add(new CompteCourant("CC01", 15_000));
liste.add(new CompteEpargne("CE01", 50_000));

// Parcours moderne avec boucle for-each
for (CompteBancaire c : liste) {
    c.afficherSolde();
}
```

---

## 4. L'interface `Map<K, V>` : dictionnaires de paires clé-valeur

Une `Map` associe une clé unique à une valeur. Les clés obéissent aux règles de `Set` (pas de doublons de clés).

- `HashMap<K, V>` : hachage en $O(1)$.
- `TreeMap<K, V>` : clés ordonnées en $O(\log N)$.

```java
Map<String, CompteBancaire> indexComptes = new HashMap<>();
indexComptes.put("CC-001", new CompteCourant("CC-001", 10_000));

// Recherche instantanée par numéro en O(1) :
CompteBancaire c = indexComptes.get("CC-001");
```

:::examen
Dans une application d'entreprise ou bancaire :
- Pour stocker un catalogue sans doublons : `Set<E>`.
- Pour indexer rapidement par identifiant unique : `Map<String, CompteBancaire>`.
- Pour maintenir une liste ordonnée traitable par index ou flux : `List<E>`.
:::
