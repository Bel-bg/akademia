# Multithreading : création et cycle de vie des Threads

Le multithreading (programmation concurrente) permet à une application Java d'exécuter plusieurs tâches en parallèle au sein d'un même processus, exploitant ainsi au maximum les processeurs multi-cœurs modernes.

---

## 1. Création d'un Thread en Java

Il existe deux manières classiques de définir le code à exécuter dans un thread :

### Méthode 1 : Implémenter l'interface `Runnable` (Approche recommandée)

L'interface fonctionnelle `Runnable` déclare une unique méthode : `public void run()`.

```java
// 1. Définition de la tâche
public class TacheVirement implements Runnable {
    @Override
    public void run() {
        System.out.println("Traitement du virement en arrière-plan par le thread : "
            + Thread.currentThread().getName());
    }
}

// 2. Création et démarrage du thread
Runnable tache = new TacheVirement();
Thread thread = new Thread(tache);
thread.start();
```

Avec les expressions lambda de Java 8+ :
```java
Thread t = new Thread(() -> {
    System.out.println("Exécution concurrente simplifiée");
});
t.start();
```

### Méthode 2 : Hériter de la classe `Thread`

```java
public class MonThread extends Thread {
    @Override
    public void run() {
        System.out.println("Code exécuté dans le thread");
    }
}

MonThread t = new MonThread();
t.start();
```

:::retenir
Question d'examen : *« Quel mot-clé / approche est utilisé pour créer un thread ? »*
Réponse : **`implements Runnable`** (ou hériter de la classe `Thread`).
La bonne pratique en génie logiciel consiste à implémenter `Runnable` car Java n'autorise pas l'héritage multiple (une classe qui `extends Thread` ne pourrait plus hériter d'aucune autre classe métier).
:::

---

## 2. Le piège d'examen capital : `start()` versus `run()`

C'est l'une des questions les plus posées dans les épreuves universitaires :

| Méthode | Comportement |
|---|---|
| **`start()`** | Crée une nouvelle pile d'exécution dans la JVM au niveau du système d'exploitation, démarre le nouveau thread, puis invoque sa méthode `run()` de manière **asynchrone et concurrente**. |
| **`run()`** | Exécute le code comme une méthode Java ordinaire **au sein du thread courant (souvent le thread principal `main`)**. Aucun nouveau thread n'est créé ! |

```java
Thread t = new Thread(() -> System.out.println("Hello"));

t.run();   // ATTENTION : exécuté de façon synchrone dans le thread appelant !
t.start(); // CORRECT : démarre un vrai thread concurrent !
```

:::examen
Question d'examen : *« Quelle méthode est utilisée pour exécuter un thread en Java ? »*
- **A. `start()`** (Bonne réponse)
- B. `run()` (Piège classique : `run()` contient le code mais ne démarre pas le thread)
- C. `execute()`
- D. `call()`
:::

---

## 3. Le cycle de vie d'un Thread

Un objet `Thread` traverse six états distincts (`Thread.State`) :
1. **NEW** : le thread est instancié (`new Thread(...)`), mais pas encore démarré.
2. **RUNNABLE** : après appel à `start()`, le thread est prêt ou en cours d'exécution sur le processeur.
3. **BLOCKED** : en attente de l'acquisition d'un verrou moniteur (`synchronized`).
4. **WAITING** : en attente indéfinie d'une notification d'un autre thread (`wait()`, `join()`).
5. **TIMED_WAITING** : en attente pendant une durée déterminée (`Thread.sleep(millis)`, `wait(timeout)`).
6. **TERMINATED** : la méthode `run()` s'est achevée normalement ou suite à une exception non capturée.
