## 3.2.1 Qu'est-ce qu'un trigger (déclencheur) ?

Un **trigger** est un traitement PL/SQL **déclenché automatiquement** par un événement sur une table : `INSERT`, `UPDATE` ou `DELETE`. On ne l'appelle jamais : il s'exécute tout seul.

Usages : **contrôler** une règle de gestion, **journaliser** (audit), **propager** une modification vers d'autres tables, **initialiser** des valeurs (identifiant automatique, date), **protéger** des données.

L'exécution d'un trigger réussit ou échoue. En cas d'échec, l'ordre qui l'a déclenché est **annulé**.

## 3.2.2 Les douze types de triggers

3 événements × 2 modes × 2 moments = **12** types.

| Critère | Choix |
|---|---|
| Événement | `INSERT`, `UPDATE`, `DELETE` |
| Mode | **par ordre** (une fois par instruction) ou **par ligne** (`FOR EACH ROW`, une fois par ligne touchée) |
| Moment | `BEFORE` (avant l'écriture) ou `AFTER` (après) |

| | `BEFORE` | `AFTER` |
|---|---|---|
| Sert à... | **contrôler** ou **modifier `:NEW`** avant l'écriture ; soumettre l'opération à des conditions ; initialiser | **tracer**, journaliser, propager dans d'autres tables, valider a posteriori |

**Ordre d'exécution** quand plusieurs triggers existent sur une table :
1. trigger **BEFORE par ordre** ;
2. pour chaque ligne : trigger **BEFORE par ligne**, puis écriture, puis trigger **AFTER par ligne** ;
3. trigger **AFTER par ordre**.

## 3.2.3 Trigger par ordre

```sql
CREATE OR REPLACE TRIGGER ajout_film
BEFORE INSERT ON film
BEGIN
  IF USER != 'FFIOREN' THEN
    RAISE_APPLICATION_ERROR(-20001, 'Utilisateur interdit');
  END IF;
END ajout_film;
/
```

Pour `UPDATE`, on peut limiter aux colonnes concernées : `BEFORE UPDATE OF titre ON film`. Le trigger ne se déclenche alors que si `titre` figure dans la clause `SET`.

## 3.2.4 Trigger par ligne, :OLD et :NEW

```sql
CREATE OR REPLACE TRIGGER trg_produits_prix
BEFORE INSERT OR UPDATE OF prix ON produits
FOR EACH ROW
BEGIN
  IF :NEW.prix IS NULL OR :NEW.prix <= 0 THEN
    RAISE_APPLICATION_ERROR(-20030, 'Prix invalide');
  END IF;
END;
/
```

| Ordre SQL | `:OLD` | `:NEW` |
|---|---|---|
| `INSERT` | NULL | valeur créée |
| `UPDATE` | valeur avant modification | valeur après modification |
| `DELETE` | valeur avant suppression | NULL |

- Dans le bloc PL/SQL, on écrit `:OLD.colonne` et `:NEW.colonne` (avec deux-points). Dans la clause `WHEN`, **sans** deux-points : `WHEN (NEW.prix > 100)`.
- Lors d'une **suppression**, la ligne n'existe plus : on utilise **`:OLD.id`** (`:NEW` est vide).
- Les prédicats **`INSERTING`**, **`UPDATING`**, **`DELETING`** indiquent quelle opération a déclenché le trigger (utile quand un seul trigger gère plusieurs événements).
- La clause `WHEN` **ne peut pas contenir de requête SQL**.

## 3.2.5 Exemple : journaliser avec un seul trigger

```sql
CREATE OR REPLACE TRIGGER trg_clients_journal
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW
DECLARE
  v_op journal.operation%TYPE;
  v_id clients.id%TYPE;
BEGIN
  IF INSERTING THEN
    v_op := 'INSERT'; v_id := :NEW.id;
  ELSIF UPDATING THEN
    v_op := 'UPDATE'; v_id := :NEW.id;
  ELSE
    v_op := 'DELETE'; v_id := :OLD.id;         -- :NEW est vide à la suppression
  END IF;

  INSERT INTO journal (table_nom, operation, ligne_id, utilisateur)
  VALUES ('CLIENTS', v_op, v_id, USER);
END;
/
```

## 3.2.6 Exemple : identifiant automatique

```sql
CREATE OR REPLACE TRIGGER trg_dept_id
BEFORE INSERT ON departement
FOR EACH ROW
WHEN (NEW.id_departement IS NULL)
BEGIN
  :NEW.id_departement := departement_id_seq.NEXTVAL;
END;
/
```

:::retenir BEFORE pour modifier :NEW
On ne peut **modifier `:NEW`** que dans un trigger **`BEFORE` par ligne**. Dans un `AFTER`, la ligne est déjà écrite.
:::

## 3.2.7 Les restrictions : table en mutation

- Un trigger **ne peut pas faire `COMMIT` ou `ROLLBACK`** (erreur ORA-04092) : il fait partie de la transaction de l'ordre qui l'a déclenché.
- Un trigger **par ligne** ne peut pas **lire ni modifier la table en mutation**, c'est-à-dire la table directement ou indirectement concernée par l'ordre en cours. Sinon : **ORA-04091** (« la table est en mutation ; le déclencheur ne peut la voir »).
- Un trigger ne peut pas modifier une colonne déclarée `PRIMARY KEY`, `UNIQUE` ou `FOREIGN KEY`.
- Un trigger dont le bloc fait des `INSERT`/`UPDATE`/`DELETE` peut en déclencher d'autres (cascade).

```sql
-- ERREUR : le trigger sur LOCATION lit LOCATION
CREATE OR REPLACE TRIGGER verif_date
AFTER UPDATE OF dateenvoi OR INSERT ON location
FOR EACH ROW
DECLARE
  delai_max NUMBER;
BEGIN
  SELECT MAX(dateenvoi - datelocation) INTO delai_max FROM location;   -- ORA-04091 !
  ...
END;
/
-- CORRECTION : ne pas relire la table, comparer à une constante ou à :NEW / :OLD
```

:::attention Contourner « table en mutation »
Comparer la ligne à une **constante** (`delai_max NUMBER := 45;`) ; lire une **autre** table (autorisé) ; ou, en cas de besoin avancé, utiliser un trigger composé (*compound trigger*).
:::

## 3.2.8 Gérer les triggers

```sql
SELECT trigger_name, trigger_type, triggering_event, table_name, status FROM user_triggers;

ALTER TRIGGER nom DISABLE;                 -- désactiver un trigger
ALTER TRIGGER nom ENABLE;
ALTER TABLE clients DISABLE ALL TRIGGERS;  -- tous ceux d'une table
ALTER TABLE clients ENABLE ALL TRIGGERS;
DROP TRIGGER nom;
```

:::attention Selon le cours
Le cours indique qu'on peut associer **un et un seul trigger de chaque type** à chaque table. Les versions récentes d'Oracle acceptent plusieurs triggers du même type (clause `FOLLOWS` pour l'ordre) ; à l'examen, suivez la présentation du cours sauf indication contraire.
:::

## 3.2.9 Trigger ou contrainte ?

Une contrainte déclarative (`CHECK`, `FOREIGN KEY`, `NOT NULL`) est **plus simple et plus fiable** qu'un trigger : on l'utilise dès qu'elle suffit. Le trigger sert aux règles qu'une contrainte ne peut pas exprimer (comparer avec **une autre table**, calculer, journaliser, message d'erreur personnalisé).

Exemple : sans le trigger `trg_clients_suppression`, supprimer un client ayant des commandes produit l'erreur Oracle **ORA-02292** (« enregistrement fils existant ») ; avec le trigger, on renvoie un message métier lisible (code -20032).
