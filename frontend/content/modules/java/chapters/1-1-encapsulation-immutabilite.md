# Encapsulation, validation défensive et immutabilité

L'encapsulation est l'un des piliers cardinaux de la Programmation Orientée Objet (POO). Elle consiste à regrouper les données (état) et les méthodes qui les manipulent au sein d'une même structure, tout en masquant les détails internes d'implémentation et en protégeant les objets contre les états incohérents.

---

## 1. Les modificateurs d'accès en Java

En Java, l'accès aux classes, attributs et méthodes est contrôlé par quatre niveaux de visibilité :

| Modificateur | Même classe | Même package | Sous-classe (héritage) | Partout (public) |
|---|:---:|:---:|:---:|:---:|
| `private` | **Oui** | Non | Non | Non |
| *(défaut / package-private)* | **Oui** | **Oui** | Non | Non |
| `protected` | **Oui** | **Oui** | **Oui** | Non |
| `public` | **Oui** | **Oui** | **Oui** | **Oui** |

:::retenir
Règle d'or de la robustesse : les attributs d'une classe doivent **toujours être déclarés `private`**. Pour permettre aux sous-classes de modifier un état interne de manière contrôlée, on privilégie une méthode `protected` spécifique (comme `definirSolde(double nouveauSolde)`), évitant ainsi d'exposer directement l'attribut.
:::

---

## 2. Le mot-clé `final` et l'immutabilité

Lorsqu'un attribut est marqué `final` :
- Sa valeur doit obligatoirement être initialisée lors de sa déclaration ou au sein de chaque constructeur.
- Sa référence (ou valeur primitive) ne peut plus jamais être réassignée après la construction.

```java
public abstract class CompteBancaire {
    // Le numéro de compte est immuable : assigné à la création et jamais réassigné
    private final String numero;
    // Le solde évolue au cours de la vie du compte
    private double solde;

    public CompteBancaire(String numero, double soldeInitial) {
        // Initialisation obligatoire de la variable final
        this.numero = numero;
        this.solde = soldeInitial;
    }
}
```

:::exemple
Un objet immuable (`String`, `Integer`, `java.time.LocalDate`) ne fournit aucun setter. Son état ne change jamais après la construction. Cela confère une sécurité totale en environnement multithread sans nécessiter de synchronisation.
:::

---

## 3. Programmation défensive et validation des paramètres

Une application robuste en production universitaire ou d'entreprise ne doit **jamais** accepter d'arguments invalides (`null`, chaînes vides, nombres non finis ou montants négatifs).

Toute anomalie détectée dès l'entrée dans un constructeur ou une méthode publique doit immédiatement lever une exception appropriée, en général `IllegalArgumentException`.

### A. Validation des chaînes avec `isBlank()`

Depuis Java 11, la méthode `isBlank()` vérifie si une chaîne est vide ou ne contient que des espaces blancs (contrairement à `isEmpty()` qui ne vérifie que la longueur zéro).

```java
if (numero == null || numero.isBlank()) {
    throw new IllegalArgumentException("Numéro invalide.");
}
```

### B. Validation des nombres à virgule flottante avec `Double.isFinite()`

En Java, les types `double` et `float` peuvent prendre des valeurs spéciales comme `Double.NaN` (Not a Number), `Double.POSITIVE_INFINITY` ou `Double.NEGATIVE_INFINITY` suite à des divisions par zéro.

La méthode standard `Double.isFinite(valeur)` garantit que le nombre est un nombre réel fini valide.

```java
if (!Double.isFinite(soldeInitial)) {
    throw new IllegalArgumentException("Solde invalide.");
}

if (!Double.isFinite(montant) || montant <= 0) {
    throw new IllegalArgumentException("Le montant doit être positif et valide.");
}
```

:::attention
Un test simple `montant <= 0` ne suffit pas à rejeter `Double.NaN`, car l'expression `Double.NaN <= 0` s'évalue toujours à `false` en Java ! L'appel à `Double.isFinite(montant)` est impératif pour éviter toute corruption de données financières.
:::

---

## 4. Application à la classe `CompteBancaire`

Voici le modèle de conception rigoureux appliqué à la classe abstraite `CompteBancaire` :

```java
public abstract class CompteBancaire {
    private final String numero;
    private double solde;

    public CompteBancaire(String numero, double soldeInitial) {
        if (numero == null || numero.isBlank())
            throw new IllegalArgumentException("Numéro invalide.");
        if (!Double.isFinite(soldeInitial))
            throw new IllegalArgumentException("Solde invalide.");

        this.numero = numero;
        this.solde = soldeInitial;
    }

    public String getNumero() {
        return numero;
    }

    public double getSolde() {
        return solde;
    }

    public void deposer(double montant) {
        if (!Double.isFinite(montant) || montant <= 0)
            throw new IllegalArgumentException("Le montant doit être positif et valide.");
        solde += montant;
    }

    public abstract void retirer(double montant);

    public void afficherSolde() {
        System.out.printf("Compte %s : %.2f FCFA%n", numero, solde);
    }

    // Méthode protégée pour modifier le solde dans les sous-classes.
    protected void definirSolde(double nouveauSolde) {
        solde = nouveauSolde;
    }
}
```

:::examen
Dans le sujet d'examen officiel, le barème évalue expressément :
1. L'utilisation de `private final String numero;` et `private double solde;`.
2. La validation des entrées (`numero.isBlank()`, `Double.isFinite(...)`).
3. La présence d'une méthode `protected void definirSolde(double nouveauSolde)` pour encapsuler l'affectation du solde sans rendre l'attribut public ni package-private.
:::
