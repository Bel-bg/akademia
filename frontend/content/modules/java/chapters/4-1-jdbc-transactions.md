# JDBC, requêtes SQL et transactions ACID

Java Database Connectivity (JDBC) est l'API standard de bas niveau permettant à une application Java d'interagir directement avec un Système de Gestion de Bases de Données Relationnelles (SGBDR) via le langage SQL.

---

## 1. Exécution des requêtes SQL : `executeQuery()` vs `executeUpdate()`

Lorsqu'on utilise un objet `Statement` ou `PreparedStatement`, le choix de la méthode d'exécution dépend de la nature de la commande SQL :

| Méthode | Type de requête SQL | Type de retour | Description |
|---|---|---|---|
| **`executeQuery()`** | **`SELECT` uniquement** | **`ResultSet`** | Exécute une requête d'interrogation et renvoie un curseur navigable sur les lignes retournées. |
| **`executeUpdate()`** | `INSERT`, `UPDATE`, `DELETE` (DML) ou DDL | `int` | Exécute une modification de données ou de structure et renvoie le nombre de lignes affectées. |
| **`execute()`** | Tout type (inconnu à l'avance) | `boolean` | Renvoie `true` si le premier résultat est un `ResultSet`, `false` s'il s'agit d'un compteur de mise à jour. |

```java
Connection conn = DriverManager.getConnection(url, user, password);

// 1. Pour un SELECT : executeQuery()
PreparedStatement psSelect = conn.prepareStatement("SELECT solde FROM compte WHERE numero = ?");
psSelect.setString(1, "CC-001");
ResultSet rs = psSelect.executeQuery(); // BONNE MÉTHODE

// 2. Pour un UPDATE : executeUpdate()
PreparedStatement psUpdate = conn.prepareStatement("UPDATE compte SET solde = ? WHERE numero = ?");
psUpdate.setDouble(1, 50000);
psUpdate.setString(2, "CC-001");
int lignesModifiees = psUpdate.executeUpdate();
```

:::retenir
Question d'examen : *« En JDBC, quelle méthode permet d’exécuter une requête SQL de type SELECT ? »*
- A. `executeUpdate()`
- **B. `executeQuery()`** (Bonne réponse)
- C. `execute()`
- D. `fetch()`
:::

---

## 2. Garantir l'atomicité d'un transfert avec JDBC

Par défaut, une connexion JDBC fonctionne en mode `autoCommit = true` : chaque instruction SQL est validée individuellement et immédiatement dans la base de données dès son exécution.

Supposons un transfert de 5 000 FCFA du compte A vers le compte B :
1. On débite A de 5 000 FCFA.
2. Si le système plante ou lève une exception avant de créditer B, le compte A est définitivement débité sans que B ne reçoive rien !

### La solution conforme ACID :

```java
try {
    // 1. Désactiver l'auto-commit pour ouvrir une transaction explicite
    conn.setAutoCommit(false);

    // 2. Débiter le compte A
    psDebit.setDouble(1, 5000);
    psDebit.setString(2, "A");
    psDebit.executeUpdate();

    // 3. Créditer le compte B
    psCredit.setDouble(1, 5000);
    psCredit.setString(2, "B");
    psCredit.executeUpdate();

    // 4. Valider la transaction uniquement si les deux requêtes ont réussi
    conn.commit();
    System.out.println("Transfert validé avec succès.");
} catch (SQLException e) {
    // 5. En cas d'échec ou d'exception : annuler complètement les modifications
    try {
        conn.rollback();
        System.err.println("Transfert échoué : rollback exécuté.");
    } catch (SQLException exRollback) {
        exRollback.printStackTrace();
    }
} finally {
    try {
        conn.setAutoCommit(true); // Rétablir le comportement par défaut
    } catch (SQLException ignored) {}
}
```

:::examen
Question d'examen : *« On souhaite transférer 5 000 FCFA du compte A vers le compte B. Quelle implémentation garantit le mieux l'atomicité des deux mises à jour ? »*
**Réponse attendue** : **Désactiver l'auto-commit (`setAutoCommit(false)`), exécuter les deux requêtes, appeler `commit()` uniquement si tout réussit et `rollback()` en cas d'échec.**
:::

---

## 3. Les niveaux d'isolation JDBC

Lorsque plusieurs transactions s'exécutent simultanément en concurrence sur la même base, des phénomènes d'interférence peuvent se produire.

Considérons le scénario d'examen :
- Deux transactions s'exécutent simultanément.
- $T_1$ lit le solde d'un compte (ex: 20 000 FCFA).
- $T_2$ modifie ce solde (ex: 50 000 FCFA) et valide sa transaction (`commit`).
- $T_1$ relit le même compte pendant la même transaction.

Si $T_1$ voit deux valeurs différentes lors de ces deux lectures consécutives, c'est une anomalie appelée **lecture non reproductible (Non-Repeatable Read)**.

| Niveau d'isolation JDBC | Lecture sale (*Dirty Read*) | Lecture non reproductible (*Non-Repeatable Read*) | Lignes fantômes (*Phantom Read*) |
|---|:---:|:---:|:---:|
| `TRANSACTION_READ_UNCOMMITTED` | Autorisée | Autorisée | Autorisée |
| `TRANSACTION_READ_COMMITTED` | Empêchée | **Autorisée** | Autorisée |
| **`TRANSACTION_REPEATABLE_READ`** | **Empêchée** | **EMPÊCHÉE** | Autorisée |
| `TRANSACTION_SERIALIZABLE` | Empêchée | Empêchée | Empêchée |

:::retenir
Question d'examen : *« Quel niveau d'isolation JDBC empêche normalement $T_1$ de voir deux valeurs différentes lors de ces deux lectures ? »*
Réponse : **`TRANSACTION_REPEATABLE_READ`** (Le niveau `READ_COMMITTED` permettrait à $T_1$ de voir la nouvelle valeur après le commit de $T_2$, provoquant la lecture non reproductible).
:::
