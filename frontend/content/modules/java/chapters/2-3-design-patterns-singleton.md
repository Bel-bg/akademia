# Design Pattern Singleton & robustesse avec Optional

La conception logicielle professionnelle s'appuie sur des patrons éprouvés (Design Patterns) et des idiomes modernes pour éviter les erreurs d'instanciation et les plantages dus aux valeurs nulles.

---

## 1. Le Design Pattern Singleton

Le patron **Singleton** fait partie des patrons de création du « Gang of Four » (GoF).

### Intention :
Garantir qu'une classe donnée ne possède **qu'une seule et unique instance** dans toute l'application (ou dans la JVM), et fournir un point d'accès global à cette instance.

### Cas d'usage typiques :
- Gestionnaire de configuration de l'application.
- Pool de connexions vers la base de données.
- Spooler d'impression ou journaliseur central (Logger).

### Implémentation classique (Eager / Thread-Safe) :

```java
public class BanqueCentrale {
    // 1. Instance unique créée au chargement de la classe
    private static final BanqueCentrale INSTANCE = new BanqueCentrale();

    // 2. Constructeur PRIVÉ : empêche tout 'new BanqueCentrale()' externe
    private BanqueCentrale() {
        // Initialisation des ressources
    }

    // 3. Méthode statique publique fournissant le point d'accès unique
    public static BanqueCentrale getInstance() {
        return INSTANCE;
    }

    public void regulerTaux() {
        System.out.println("Régulation des taux bancaires...");
    }
}
```

:::retenir
Question d'examen : *« Le design pattern Singleton garantit : »*
- A. L'héritage unique
- **B. Une seule instance d'une classe** (Bonne réponse)
- C. La sérialisation automatique
- D. L'accès multithreadé

Pour interdire l'instanciation directe, le constructeur de la classe doit être déclaré **`private`**.
:::

---

## 2. La classe `Optional<T>` en Java moderne

Introduite en Java 8 dans le package `java.util`, la classe `Optional<T>` est un conteneur qui encapsule soit une valeur non nulle, soit l'absence de valeur (vide).

### Pourquoi `Optional` a-t-il été créé ?
Son objectif premier est d'exprimer explicitement qu'une méthode peut ne retourner aucun résultat, **éliminant ainsi les redoutables erreurs `NullPointerException` (NPE)**.

```java
// Mauvaise pratique historique :
CompteBancaire c = banque.trouver("C01"); // Peut renvoyer null !
c.afficherSolde(); // Si c vaut null -> NullPointerException et crash !

// Bonne pratique moderne :
Optional<CompteBancaire> opt = banque.trouverOptional("C01");
```

### Méthodes essentielles d'`Optional` :

```java
// 1. Création
Optional<String> vide = Optional.empty();
Optional<String> valeur = Optional.of("Akademia");
Optional<String> possible = Optional.ofNullable(valeurPotentiellementNulle);

// 2. Vérification et extraction
if (opt.isPresent()) {
    CompteBancaire c = opt.get();
}

// 3. Style fonctionnel sans if (très recommandé) :
opt.ifPresent(c -> c.afficherSolde());

// 4. Valeur par défaut de repli avec orElse
String nom = optNom.orElse("Compte Anonyme");

// 5. Levée d'exception contrôlée si absent
CompteBancaire c = opt.orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));
```

:::examen
Question d'examen : *« En Java, Optional est utilisé pour : »*
- A. Rendre une valeur obligatoire
- **B. Gérer les valeurs nulles sans NullPointerException** (Bonne réponse)
- C. Créer un objet générique
- D. Empêcher la sérialisation
:::
