# Héritage, classes abstraites et polymorphisme

L'héritage et le polymorphisme permettent de modéliser des hiérarchies de concepts, de mutualiser le code commun et de faire varier les comportements dynamiquement à l'exécution.

---

## 1. Pourquoi déclarer une classe abstraite ?

Une classe est déclarée avec le mot-clé `abstract` lorsqu'elle représente une abstraction ou un concept général qui ne doit **pas être instancié directement** (l'instruction `new CompteBancaire(...)` provoquera une erreur de compilation).

```java
// Impossible d'instancier directement :
// CompteBancaire c = new CompteBancaire("C01", 10000); // ERREUR DE COMPILATION !
```

Une classe abstraite remplit trois rôles cruciaux :
1. **Factorisation** : elle regroupe les attributs communs (`numero`, `solde`) et les méthodes concrètes (`getNumero()`, `getSolde()`, `deposer()`, `afficherSolde()`).
2. **Contrat d'implémentation** : elle déclare des méthodes abstraites (dépourvues de corps) que les sous-classes concrètes sont obligées d'implémenter selon leurs propres règles métiers.
3. **Typage polymorphique** : elle sert de type de référence unifié pour manipuler des sous-types hétérogènes.

:::retenir
Une classe abstraite peut contenir à la fois des méthodes concrètes (avec un corps d'implémentation) et des méthodes abstraites (sans corps, terminées par un point-virgule `;`). Dès qu'une classe contient au moins une méthode abstraite, la classe entière **doit obligatoirement être déclarée `abstract`**.
:::

---

## 2. Dérivation de sous-classes concrètes avec `extends`

Pour hériter d'une classe, on utilise le mot-clé `extends`. Dans le constructeur de la classe fille, le premier appel doit être `super(...)` pour initialiser la superclasse.

### A. Classe `CompteCourant` (Découvert autorisé de 50 000 FCFA)

```java
public class CompteCourant extends CompteBancaire {
    private static final double DECOUVERT_MAX = 50_000;

    public CompteCourant(String numero, double soldeInitial) {
        super(numero, soldeInitial);
    }

    @Override
    public void retirer(double montant) {
        if (!Double.isFinite(montant) || montant <= 0)
            throw new IllegalArgumentException("Montant de retrait invalide.");
        
        // Règle métier : le solde après retrait ne peut pas être inférieur à -50 000
        if (getSolde() - montant < -DECOUVERT_MAX)
            throw new IllegalStateException("Dépassement du découvert autorisé.");

        definirSolde(getSolde() - montant);
    }
}
```

### B. Classe `CompteEpargne` (Interdiction formelle de découvert)

```java
public class CompteEpargne extends CompteBancaire {
    public CompteEpargne(String numero, double soldeInitial) {
        super(numero, soldeInitial);
    }

    @Override
    public void retirer(double montant) {
        if (!Double.isFinite(montant) || montant <= 0)
            throw new IllegalArgumentException("Montant de retrait invalide.");

        // Règle métier : solde strictement non négatif
        if (montant > getSolde())
            throw new IllegalStateException("Solde insuffisant sur le compte d'épargne.");

        definirSolde(getSolde() - montant);
    }
}
```

---

## 3. L'annotation `@Override` et la redéfinition

L'annotation `@Override` informe le compilateur que la méthode redéfinit une méthode existante de la superclasse ou d'une interface.

Avantages majeurs :
- Détecte immédiatement les fautes de frappe (par exemple si vous écrivez par erreur `retirer(float m)` au lieu de `retirer(double m)`).
- Facilite la maintenance et la lisibilité du code par l'équipe.

:::attention
Ne confondez pas **redéfinition** (`@Override` : même nom, même liste de paramètres dans une sous-classe) et **surcharge** (`@Overload` informel : même nom, mais paramètres différents au sein d'une même classe).
:::

---

## 4. Le mécanisme du Polymorphisme

Le mot *polymorphisme* vient du grec « plusieurs formes ». En Java, il désigne la capacité d'un objet à être manipulé à travers une référence d'un type parent, tout en exécutant le comportement propre à son type réel à l'exécution.

```java
CompteBancaire c1 = new CompteCourant("CC-101", 10_000);
CompteBancaire c2 = new CompteEpargne("CE-202", 10_000);

c1.retirer(30_000); // Réussit ! Le solde devient -20 000 FCFA (découvert autorisé)
c2.retirer(30_000); // Lève IllegalStateException : "Solde insuffisant"
```

Bien que les variables `c1` et `c2` soient toutes deux déclarées avec le type statique `CompteBancaire`, la Machine Virtuelle Java (JVM) invoque la version de `retirer()` correspondant au type dynamique réel de l'objet : c'est la **résolution dynamique des liaisons** (*late binding*).

:::examen
Question fréquente d'examen : *« Pourquoi est-il préférable de manipuler les comptes à travers des références de type CompteBancaire dans la collection de la banque ? »*
**Réponse attendue** : Cela permet de stocker des comptes courants et des comptes d'épargne dans une unique collection homogène (`List<CompteBancaire>`), sans devoir créer une collection distincte pour chaque sous-classe. Tout nouvel ajout de type de compte (ex : `CompteJeune`) s'intègre alors sans modifier le code de la banque.
:::
