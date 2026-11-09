# Synchronisation manuelle, verrous et Semaphore

Lorsque plusieurs threads accèdent et modifient simultanément une ressource partagée (par exemple le solde d'un compte bancaire), des **conditions de course (race conditions)** surviennent si aucun mécanisme de synchronisation n'est mis en place.

---

## 1. La condition de course (Race Condition)

Supposons que deux guichets automatiques effectuent simultanément un retrait de 10 000 FCFA sur le même compte ayant 15 000 FCFA :

1. Le Thread 1 lit le solde : 15 000 FCFA.
2. Le processeur bascule sur le Thread 2 qui lit également : 15 000 FCFA.
3. Le Thread 2 retire 10 000 FCFA et écrit : 5 000 FCFA.
4. Le Thread 1 retire 10 000 FCFA et écrit à son tour : 5 000 FCFA.

Le compte a distribué 20 000 FCFA alors qu'il n'en contenait que 15 000, et le solde final est corrompu !

---

## 2. Le mot-clé `synchronized`

Pour protéger une section critique, le mot-clé `synchronized` oblige chaque thread à acquérir le verrou exclusif (moniteur) de l'objet avant d'entrer dans la méthode ou le bloc de code.

```java
public class CompteBancaireSynchronise {
    private double solde;

    // Un seul thread à la fois peut exécuter cette méthode sur cette instance
    public synchronized void deposer(double montant) {
        solde += montant;
    }

    public synchronized void retirer(double montant) {
        if (solde >= montant) {
            solde -= montant;
        }
    }
}
```

---

## 3. Synchronisation manuelle avec `Semaphore`

Dans le package `java.util.concurrent`, Java fournit des outils avancés de synchronisation concurrente manuelle. La classe **`Semaphore`** en est l'un des piliers.

### Qu'est-ce qu'un sémaphore ?
Un sémaphore maintient un ensemble de **permis (permits)** :
- Lorsqu'un thread souhaite accéder à une ressource protégée, il appelle `semaphore.acquire()`.
  - Si un permis est disponible, il le prend et continue immédiatement.
  - S'il n'y a plus de permis disponible, le thread est bloqué et mis en attente.
- Lorsque le thread a fini son travail, il appelle `semaphore.release()`, ce qui restitue le permis et réveille l'un des threads en attente.

```java
import java.util.concurrent.Semaphore;

public class GestionnaireGuichets {
    // Exactement 3 guichets disponibles simultanément
    private final Semaphore guichets = new Semaphore(3);

    public void servirClient(String client) {
        try {
            // Demande d'un permis (bloque si 3 clients sont déjà en cours)
            guichets.acquire();
            System.out.println("Client " + client + " servi au guichet.");
            Thread.sleep(1000); // Traitement
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            // TOUJOURS libérer le permis dans un bloc finally !
            guichets.release();
        }
    }
}
```

:::retenir
Question d'examen : *« Quelle classe Java permet la synchronisation manuelle entre threads ? »*
- A. `AtomicInteger` (gestion atomique de variable entière, sans synchronisation manuelle)
- **B. `Semaphore`** (outil de contrôle d'accès et synchronisation manuelle avec permis, bonne réponse)
- C. `Timer`
- D. `ThreadGroup`
:::

---

## 4. Comparatif des mécanismes de synchronisation

| Outil | Usage principal | Caractéristique |
|---|---|---|
| `synchronized` | Exclusion mutuelle (1 seul thread) | Géré automatiquement au niveau du bytecode par la JVM. |
| `ReentrantLock` | Verrou explicite souple | Permet l'interruption, le timeout (`tryLock()`) et la justice. |
| **`Semaphore`** | **Régulation manuelle de flux** | **Gère $N$ accès simultanés à un groupe de ressources partagées.** |
| `AtomicInteger` / `AtomicReference` | Variables partagées sans verrou | Basé sur l'instruction CPU matérielle compare-and-swap (CAS). |
