# Exceptions, atomicité et restauration d'état (Rollback)

La fiabilité d'un système bancaire ou transactionnel repose sur sa capacité à réagir de façon prévisible face aux pannes, erreurs et données corrompues.

---

## 1. La distinction fondamentale : `throw` versus `throws`

Ces deux mots-clés de Java ont des rôles totalement distincts et font l'objet d'un piège d'examen récurrent :

| Mot-clé | Rôle | Emplacement | Exemple |
|---|---|---|---|
| `throw` | **Déclenche / lance** concrètement une instance d'exception dans le flux d'instructions. | Dans le corps d'une méthode ou d'un bloc. | `throw new IllegalArgumentException("Montant négatif");` |
| `throws` | **Déclare** les exceptions contrôlées qu'une méthode est susceptible de propager aux appelants. | Dans la signature de la méthode. | `public void lireFichier() throws IOException { ... }` |

:::retenir
Règle mnémotechnique :
- `throw` (au singulier) : **action ponctuelle** de lancer un objet d'exception.
- `throws` (au pluriel avec un s) : **contrat public** listant les exceptions potentielles dans l'en-tête de méthode.
:::

---

## 2. Exceptions contrôlées (Checked) vs non contrôlées (Unchecked)

En Java, toutes les exceptions héritent de `java.lang.Throwable` :

```
             Throwable
            /         \
        Error        Exception
                     /       \
      RuntimeException      Checked Exceptions
      (Unchecked)           (IOException, SQLException...)
```

- **Unchecked (`RuntimeException` et sous-classes)** :
  - Erreurs de logique ou violations de préconditions (`IllegalArgumentException`, `IllegalStateException`, `NullPointerException`, `IndexOutOfBoundsException`).
  - Le compilateur n'impose **pas** de clause `throws` ni de bloc `try-catch` obligatoire.
- **Checked (dérivant directement d'`Exception`)** :
  - Événements extérieurs prévisibles (panne réseau, fichier inexistant).
  - Obligation stricte de déclarer avec `throws` ou d'intercepter avec `try-catch`.

---

## 3. Qu'est-ce que l'Atomicité ?

L'atomicité est la propriété **A** des principes **ACID** (Atomicité, Cohérence, Isolation, Durabilité).
Une opération atomique obéit à la règle du **« tout ou rien »** :
- Soit l'ensemble des opérations réussit et l'état global du système est validé.
- Soit au moins une sous-opération échoue, et le système doit annuler toutes les modifications partielles déjà effectuées pour revenir exactement à son état d'origine (**Rollback**).

Dans un virement bancaire : si le compte source est débité mais que le crédit du compte cible échoue, l'argent ne doit pas disparaître !

---

## 4. Implémentation complète de la classe `Banque`

Voici comment implémenter la gestion atomique en mémoire Java à l'aide d'un bloc `try-catch` :

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
                throw new IllegalArgumentException("Ce numéro de compte existe déjà : " + compte.getNumero());
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
        if (numeroSource == null || numeroDestination == null)
            throw new IllegalArgumentException("Les numéros de compte ne peuvent pas être null.");
        
        if (numeroSource.equals(numeroDestination))
            throw new IllegalArgumentException("Les deux comptes doivent être différents.");

        CompteBancaire source = rechercherCompte(numeroSource);
        CompteBancaire destination = rechercherCompte(numeroDestination);

        // Étape 1 : Mémorisation des soldes avant le transfert
        double ancienSoldeSource = source.getSolde();
        double ancienSoldeDestination = destination.getSolde();

        try {
            // Étape 2 : Exécution séquentielle des deux opérations
            source.retirer(montant);
            destination.deposer(montant);
        } catch (RuntimeException e) {
            // Étape 3 : Restauration des deux soldes initiaux en cas d'échec
            source.definirSolde(ancienSoldeSource);
            destination.definirSolde(ancienSoldeDestination);
            
            // Relance d'une exception explicite chaînée
            throw new IllegalStateException("Transfert annulé : " + e.getMessage(), e);
        }
    }
}
```

:::exemple
Scénario de panne intercepté :
Supposons que `source.retirer(100_000)` réussisse sur un compte courant, mais que la méthode `destination.deposer(...)` lève une anomalie inattendue. Le bloc `catch (RuntimeException e)` s'exécute immédiatement : `source` récupère son solde d'origine et aucun franc n'est perdu.
:::

---

## 5. Analyse du Cas d'Examen : Transfert de 30 000 FCFA

Considérons la question d'examen :
- Compte Source : `CompteCourant` avec solde initial de **−20 000 FCFA** (découvert max autorisé de **50 000 FCFA**).
- Compte Cible : `CompteEpargne` avec solde initial de **20 000 FCFA**.
- Montant transféré : **30 000 FCFA**.

### Déroulement pas à pas :
1. Débit du compte courant de 30 000 FCFA :
   $$\text{Nouveau solde} = -20\,000 - 30\,000 = -50\,000 \text{ FCFA}$$
   La condition limite autorisée est :
   $$-50\,000 \ge -50\,000 \quad \text{(valide, pas de dépassement)}$$
2. Crédit du compte d'épargne de 30 000 FCFA :
   $$\text{Nouveau solde} = 20\,000 + 30\,000 = 50\,000 \text{ FCFA}$$
3. **Conclusion** : Le transfert réussit intégralement. Aucune exception n'est levée, aucune restauration n'est déclenchée. Le compte courant s'établit à −50 000 FCFA et le compte d'épargne à +50 000 FCFA.
