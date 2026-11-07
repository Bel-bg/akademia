## 1.1.1 Le rôle de l'administrateur et les familles de commandes SQL

Un **administrateur de base de données** (DBA) garantit que les données sont disponibles, cohérentes et protégées. Au quotidien, il manipule le langage **SQL** (*Structured Query Language*) dont les commandes se rangent en familles :

| Famille | Rôle | Commandes principales |
|---|---|---|
| **LDD / DDL** (définition) | créer et modifier la structure | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME` |
| **LMD / DML** (manipulation) | modifier les données | `INSERT`, `UPDATE`, `DELETE`, `MERGE` |
| **LID / DQL** (interrogation) | lire les données | `SELECT` |
| **LCT / TCL** (transactions) | valider ou annuler | `COMMIT`, `ROLLBACK`, `SAVEPOINT` |
| **LCD / DCL** (contrôle) | gérer les droits | `GRANT`, `REVOKE` |

:::retenir Distinction essentielle
Les commandes **DDL** valident automatiquement la transaction (*auto-commit*) : on ne peut pas les annuler avec `ROLLBACK`. Les commandes **DML** restent en attente jusqu'à un `COMMIT` ou un `ROLLBACK`.
:::

## 1.1.2 Les types de données Oracle

| Type | Usage | Exemple |
|---|---|---|
| `NUMBER(p,s)` | nombres (p chiffres au total, s décimales) | `NUMBER(8,2)` |
| `VARCHAR2(n)` | texte de longueur variable (n caractères max) | `VARCHAR2(50)` |
| `CHAR(n)` | texte de longueur fixe | `CHAR(1)` |
| `DATE` | date **et heure** (siècle, année, mois, jour, heure, minute, seconde) | `SYSDATE` |
| `CLOB` | long texte (jusqu'à plusieurs Go) | descriptions, documents |
| `BLOB` | données binaires | images, fichiers |

:::attention Piège classique
Oracle utilise `VARCHAR2`, pas `VARCHAR`. Une `DATE` Oracle contient toujours une heure : `TRUNC(date)` ramène à minuit.
:::

## 1.1.3 Créer une table avec ses contraintes

```sql
CREATE TABLE departement (
  id_departement NUMBER(6)     CONSTRAINT pk_dept PRIMARY KEY,
  nom            VARCHAR2(50)  NOT NULL,
  budget         NUMBER(10,2)  DEFAULT 0 CHECK (budget >= 0)
);

CREATE TABLE employe (
  id_employe     NUMBER(6)     PRIMARY KEY,
  nom            VARCHAR2(50)  NOT NULL,
  email          VARCHAR2(80)  UNIQUE,
  date_embauche  DATE          DEFAULT SYSDATE,
  id_departement NUMBER(6)     REFERENCES departement(id_departement)
);
```

| Contrainte | Effet |
|---|---|
| `PRIMARY KEY` | identifiant unique, non nul |
| `FOREIGN KEY ... REFERENCES` | référence une clé primaire d'une autre table (intégrité référentielle) |
| `UNIQUE` | pas de doublon (les NULL sont tolérés) |
| `NOT NULL` | valeur obligatoire |
| `CHECK (condition)` | la condition doit être vraie |
| `DEFAULT valeur` | valeur prise si aucune n'est fournie |

Créer une table à partir d'une autre (copie de la structure, avec ou sans les données) :

```sql
CREATE TABLE facturepaye AS SELECT * FROM facture WHERE 1 = 0;  -- structure seule
CREATE TABLE sauvegarde  AS SELECT * FROM facture;              -- structure + données
```

:::examen Réflexe d'examen
« Créer une table **ayant le même schéma** que X » → `CREATE TABLE nouvelle AS SELECT * FROM X WHERE 1 = 0;`. La condition toujours fausse copie la structure sans les lignes.
:::

## 1.1.4 Modifier la structure : ALTER, RENAME, DROP

```sql
ALTER TABLE employe ADD (telephone VARCHAR2(20));            -- ajouter une colonne
ALTER TABLE employe MODIFY (nom VARCHAR2(100));              -- changer le type / la taille
ALTER TABLE employe DROP COLUMN telephone;                   -- supprimer une colonne
ALTER TABLE employe RENAME COLUMN nom TO nom_famille;        -- renommer une colonne
ALTER TABLE employe RENAME TO salarie;                       -- renommer la table
ALTER TABLE employe ADD CONSTRAINT fk_dept FOREIGN KEY (id_departement)
      REFERENCES departement(id_departement);                -- ajouter une contrainte
DROP TABLE salarie;                                          -- supprimer table + données + structure
```

:::retenir Pour modifier la structure d'une table existante
La commande est **`ALTER TABLE`**. Ni `CHANGE TABLE`, ni `MODIFY TABLE`, ni `UPDATE TABLE` n'existent en Oracle.
:::

## 1.1.5 DELETE, TRUNCATE et DROP : ne pas les confondre

| | `DELETE` | `TRUNCATE TABLE` | `DROP TABLE` |
|---|---|---|---|
| Famille | DML | DDL | DDL |
| Clause `WHERE` | oui | **non** (tout ou rien) | non |
| Annulable (`ROLLBACK`) | **oui** | **non** (auto-commit) | non |
| Déclenche les triggers `DELETE` | oui | **non** | non |
| Vitesse sur grosse table | plus lent (ligne par ligne, journal) | très rapide | rapide |
| Structure conservée | oui | oui | **non** (table supprimée) |

```sql
DELETE FROM employe;                    -- supprime toutes les lignes (annulable)
DELETE FROM employe WHERE id_employe = 7;
TRUNCATE TABLE employe;                 -- vide la table, définitif
```

:::attention Question d'examen très fréquente
`DELETE FROM Employe;` **supprime toutes les lignes** mais pas la table ni ses contraintes. `TRUNCATE` est plus rapide, mais **ne peut pas être annulé** par un `ROLLBACK`.
:::

## 1.1.6 Les séquences et l'auto-incrément

Une **séquence** est un objet qui génère des nombres uniques, utilisé surtout pour les clés primaires.

```sql
CREATE SEQUENCE departement_id_seq
  START WITH 2        -- première valeur
  INCREMENT BY 1      -- pas
  NOCACHE NOCYCLE;

INSERT INTO departement (id_departement, nom)
VALUES (departement_id_seq.NEXTVAL, 'Informatique');

SELECT departement_id_seq.CURRVAL FROM DUAL;   -- dernière valeur obtenue dans la session
```

- `NEXTVAL` : produit la valeur suivante (la valeur est consommée).
- `CURRVAL` : relit la dernière valeur de **votre session** (après un premier `NEXTVAL`).
- Une séquence n'est **pas liée à une table** : plusieurs tables peuvent l'utiliser. Elle peut avoir des « trous » (valeurs perdues après un `ROLLBACK`).

Depuis Oracle 12c, on peut aussi utiliser une **colonne d'identité** :

```sql
CREATE TABLE client (
  id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nom VARCHAR2(50)
);
```

## 1.1.7 Manipuler les données : INSERT, UPDATE, DELETE

```sql
INSERT INTO employe (id_employe, nom, id_departement) VALUES (1, 'Dupont', 2);
INSERT INTO employe_archive SELECT * FROM employe WHERE id_departement = 2;  -- insertion en masse

UPDATE employe SET nom = UPPER(nom) WHERE id_departement = 2;
UPDATE produits SET stock = 100;                 -- sans WHERE : TOUTES les lignes

DELETE FROM employe WHERE id_employe = 1;
```

:::attention Sans WHERE, tout est touché
`UPDATE` ou `DELETE` sans clause `WHERE` agit sur **toutes** les lignes. Vérifiez toujours votre condition avant de valider.
:::

## 1.1.8 Les transactions

Une **transaction** est un groupe d'opérations traité comme un tout : tout réussit, ou rien n'est conservé (propriétés **ACID** : Atomicité, Cohérence, Isolation, Durabilité).

```sql
UPDATE compte SET solde = solde - 5000 WHERE id = 1;
SAVEPOINT apres_debit;
UPDATE compte SET solde = solde + 5000 WHERE id = 2;
ROLLBACK TO apres_debit;   -- annule seulement ce qui suit le point de sauvegarde
COMMIT;                    -- valide définitivement
```

| Commande | Effet |
|---|---|
| `COMMIT` | valide et rend visibles les modifications aux autres sessions |
| `ROLLBACK` | annule tout depuis le dernier `COMMIT` |
| `SAVEPOINT nom` | pose un repère |
| `ROLLBACK TO nom` | annule jusqu'au repère |

Un `COMMIT` est exécuté **implicitement** à la fin d'une commande DDL et à la déconnexion normale.

## 1.1.9 Les vues

Une **vue** est une requête enregistrée sous un nom ; elle se consulte comme une table, sans stocker de données.

```sql
CREATE OR REPLACE VIEW vue_employes_dept AS
SELECT e.nom, d.nom AS departement
FROM employe e JOIN departement d ON d.id_departement = e.id_departement;

SELECT * FROM vue_employes_dept;
DROP VIEW vue_employes_dept;
```

Intérêts : simplifier des requêtes complexes, **masquer** des colonnes sensibles, offrir une présentation stable malgré l'évolution des tables.
