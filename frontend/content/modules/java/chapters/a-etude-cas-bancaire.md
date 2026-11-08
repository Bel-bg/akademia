# Étude de cas bancaire : modélisation complète pas à pas

Ce chapitre rassemble et détaille l'intégralité de l'application de gestion de comptes bancaires demandée dans la Partie I de l'épreuve officielle.

---

## 1. La classe abstraite `CompteBancaire`

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

:::retenir
Points clés d'évaluation :
- `final String numero` : immuabilité garantie de la référence du compte.
- `isBlank()` et `Double.isFinite()` : blindage contre les valeurs nulles, vides, négatives et `Double.NaN`.
- `protected void definirSolde(...)` : permet aux sous-classes d'appliquer leur logique de retrait sans rendre le champ `solde` public.
:::

---

## 2. La classe `CompteCourant`

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

        // La règle du découvert : le solde résultant ne peut franchir -50 000 FCFA
        if (getSolde() - montant < -DECOUVERT_MAX)
            throw new IllegalStateException("Dépassement du découvert autorisé.");

        definirSolde(getSolde() - montant);
    }
}
```

---

## 3. La classe `CompteEpargne`

```java
public class CompteEpargne extends CompteBancaire {
    public CompteEpargne(String numero, double soldeInitial) {
        super(numero, soldeInitial);
    }

    @Override
    public void retirer(double montant) {
        if (!Double.isFinite(montant) || montant <= 0)
            throw new IllegalArgumentException("Montant de retrait invalide.");

        // Interdiction stricte de solde négatif
        if (montant > getSolde())
            throw new IllegalStateException("Solde insuffisant sur le compte d'épargne.");

        definirSolde(getSolde() - montant);
    }
}
```

---

## 4. La classe `Banque` et le transfert transactionnel atomique

```java
import java.util.ArrayList;
import java.util.List;

public class Banque {
    private final List<CompteBancaire> comptes = new ArrayList<>();

    public void ajouterCompte(CompteBancaire compte) {
        if (compte == null)
            throw new IllegalArgumentException("Le compte ne peut pas être null.");

        for (CompteBancaire c : comptes) {
            if (c.getNumero().equals(compte.getNumero()))
                throw new IllegalArgumentException("Ce numéro de compte existe déjà.");
        }
        comptes.add(compte);
    }

    public CompteBancaire rechercherCompte(String numero) {
        for (CompteBancaire compte : comptes) {
            if (compte.getNumero().equals(numero))
                return compte;
        }
        throw new IllegalArgumentException("Compte introuvable : " + numero);
    }

    public void transferer(String numeroSource, String numeroDestination, double montant) {
        if (numeroSource.equals(numeroDestination))
            throw new IllegalArgumentException("Les deux comptes doivent être différents.");

        CompteBancaire source = rechercherCompte(numeroSource);
        CompteBancaire destination = rechercherCompte(numeroDestination);

        // Mémoriser les soldes avant le transfert.
        double ancienSoldeSource = source.getSolde();
        double ancienSoldeDestination = destination.getSolde();

        try {
            source.retirer(montant);
            destination.deposer(montant);
        } catch (RuntimeException e) {
            // Restauration des deux soldes : Rollback mémoire
            source.definirSolde(ancienSoldeSource);
            destination.definirSolde(ancienSoldeDestination);
            throw new IllegalStateException("Transfert annulé : " + e.getMessage(), e);
        }
    }
}
```

:::exemple
Test d'exécution unitaire :
```java
public class TestBanque {
    public static void main(String[] args) {
        Banque b = new Banque();
        CompteBancaire cc = new CompteCourant("CC-1", -20_000);
        CompteBancaire ce = new CompteEpargne("CE-1", 20_000);

        b.ajouterCompte(cc);
        b.ajouterCompte(ce);

        // Virement de 30 000 FCFA
        b.transferer("CC-1", "CE-1", 30_000);

        cc.afficherSolde(); // Compte CC-1 : -50000.00 FCFA
        ce.afficherSolde(); // Compte CE-1 : 50000.00 FCFA
    }
}
```
:::
