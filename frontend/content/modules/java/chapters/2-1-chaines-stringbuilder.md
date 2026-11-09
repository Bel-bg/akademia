# Chaînes de caractères : String, StringBuilder et String Pool

La manipulation de texte est omniprésente en programmation Java. Cependant, méconnaître le fonctionnement interne des objets `String` conduit fréquemment à de graves contre-performances et à des bugs subtils lors des examens.

---

## 1. L'immutabilité de `String` et le piège des boucles

En Java, un objet de type `String` est **strictement immuable**. Une fois créé en mémoire, son contenu de caractères ne peut plus jamais être altéré.

Considérons le code suivant tiré de l'examen :

```java
String resultat = "";
for (int i = 0; i < 10_000; i++) {
    resultat += i; // PIÈGE MAJEUR DE PERFORMANCE !
}
```

### Que se passe-t-il réellement à chaque tour de boucle ?
À chaque itération, l'opérateur `+=` instancie un nouvel objet `String` en mémoire et recopie l'intégralité des caractères accumulés jusque-là.
Pour 10 000 itérations, cela engendre :
- La création de 10 000 objets temporaires jetables.
- Une complexité algorithmique en $O(N^2)$ (quadratique).
- Une surcharge massive pour le Garbage Collector (GC), pouvant mener à un ralentissement sévère ou à un `OutOfMemoryError`.

### La solution optimale : `StringBuilder`

`StringBuilder` est une classe mutable conçue pour accumuler des caractères dans un tableau interne redimensionnable sans instancier de nouveaux objets :

```java
StringBuilder resultat = new StringBuilder();
for (int i = 0; i < 10_000; i++) {
    resultat.append(i); // Très rapide, en O(N) !
}
String finalString = resultat.toString();
```

| Critère | `String` | `StringBuilder` | `StringBuffer` |
|---|---|---|---|
| **Mutabilité** | Immuable | **Mutable** | Mutable |
| **Performance** | Lente si concaténations répétées | **Maximale (recommandée)** | Modérée (verrous internes) |
| **Thread-Safe** | Oui (car immuable) | **Non (mono-thread)** | Oui (`synchronized`) |

:::retenir
Règle d'examen : pour construire ou concaténer des chaînes de caractères au sein d'une boucle comptant des milliers d'itérations, la solution recommandée est **d'utiliser `StringBuilder` avec sa méthode `append()`**.
:::

---

## 2. Le String Constant Pool et la comparaison `==` vs `equals()`

La JVM optimise l'utilisation de la mémoire vive grâce à une zone spéciale appelée **String Constant Pool** (bassin de constantes de chaînes).

### A. Les littéraux de chaînes
Lorsque deux variables sont initialisées avec le même littéral, la JVM ne crée qu'une seule instance dans le pool et partage la référence :

```java
String a = "Java";
String b = "Java";
System.out.println(a == b); // Affiche true ! Même adresse mémoire dans le Pool
```

### B. L'opérateur `new String(...)`
L'utilisation explicite du mot-clé `new` force impérativement la JVM à allouer un nouvel objet distinct dans le tas standard (Heap), hors du pool partagé :

```java
String s1 = "Java";
String s2 = new String("Java");

System.out.println(s1 == s2);      // Affiche FALSE !
System.out.println(s1.equals(s2)); // Affiche TRUE !
```

:::attention
Question d'examen :
- L'opérateur `==` compare les **adresses mémoires (références)** des objets. Comme `s1` pointe vers le String Pool et `s2` vers un nouvel objet sur le Heap, `s1 == s2` renvoie **`false`**.
- La méthode `equals()` compare le **contenu textuel** des deux chaînes. `s1.equals(s2)` renvoie `true`.
En Java, comparez TOUJOURS les chaînes avec `.equals()` !
:::

---

## 3. La méthode `intern()`

La méthode `s2.intern()` recherche si une chaîne égale à `s2` existe déjà dans le pool :
- Si oui, elle renvoie la référence de l'objet partagé du pool.
- Sinon, elle ajoute `s2` au pool et en renvoie la référence.

```java
String s1 = "Java";
String s2 = new String("Java");
String s3 = s2.intern();

System.out.println(s1 == s3); // Affiche true !
```
Toutefois, l'usage systématique de `intern()` n'est pas une solution adaptée pour la concaténation dans une boucle volumineuse (car cela encombre inutilement le pool sans résoudre le coût de concaténation).
