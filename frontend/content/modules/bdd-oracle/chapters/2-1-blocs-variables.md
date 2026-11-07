## 2.1.1 Qu'est-ce que PL/SQL ?

**PL/SQL** (*Procedural Language / SQL*) est l'extension procédurale d'Oracle : elle ajoute au SQL des **variables, conditions, boucles, curseurs et gestion d'erreurs**. Elle correspond au chapitre « SQL/PSM » de la norme SQL3 (*Persistent Stored Modules*).

Intérêts :
- écrire de vrais **traitements** (et pas seulement des requêtes isolées) ;
- construire des **procédures, fonctions, packages et triggers stockés** dans la base, donc exécutés côté serveur (moins d'échanges client-serveur, logique centralisée) ;
- gérer proprement les **erreurs** (à la manière du langage Ada).

## 2.1.2 La structure d'un bloc

Un programme PL/SQL est un ensemble de **blocs**. Chaque bloc a trois sections :

| Section | Mot-clé | Obligatoire ? | Contenu |
|---|---|---|---|
| Déclaration | `DECLARE` | non | variables, constantes, types, curseurs, exceptions |
| Corps | `BEGIN ... END` | **oui** | instructions SQL et procédurales |
| Traitement des erreurs | `EXCEPTION` | non | réactions aux erreurs |

```sql
SET SERVEROUTPUT ON            -- une fois par session : autorise l'affichage

DECLARE
  x VARCHAR2(10);
BEGIN
  x := 'Bonjour';
  DBMS_OUTPUT.PUT_LINE(x);
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Erreur : ' || SQLERRM);
END;
/
```

:::retenir Trois détails qui font perdre des points
1. Le bloc se termine par `END;` puis une ligne contenant **seulement** `/` : c'est ce qui l'exécute dans un script SQL Developer ou SQL*Plus.
2. Sans `SET SERVEROUTPUT ON`, le bloc s'exécute **mais `DBMS_OUTPUT.PUT_LINE` n'affiche rien**.
3. Chaque instruction PL/SQL se termine par un point-virgule.
:::

## 2.1.3 Les types de variables

| Famille | Types | Exemples |
|---|---|---|
| **Scalaires** (une valeur) | issus de SQL : `NUMBER`, `VARCHAR2`, `CHAR`, `DATE` ; propres à PL/SQL : `BOOLEAN`, `BINARY_INTEGER`/`PLS_INTEGER`, `INTEGER`, `SMALLINT` | `v_age NUMBER(3);` |
| **Composés** | enregistrement (`RECORD`), table PL/SQL (`TABLE OF`) | voir ci-dessous |
| **Référencés** | `%TYPE`, `%ROWTYPE` | `v_nom clients.nom%TYPE;` |

:::attention BOOLEAN n'existe qu'en PL/SQL
Un `BOOLEAN` ne vaut que `TRUE`, `FALSE` ou `NULL`. On **ne peut pas** écrire `v BOOLEAN := 1;`. Et on ne peut pas stocker un `BOOLEAN` dans une colonne de table SQL.
:::

## 2.1.4 Déclarer une variable : les règles de syntaxe

```sql
DECLARE
  v_id      NUMBER(4);                      -- simple
  v_total   NUMBER := 0;                    -- avec valeur initiale
  v_tva     CONSTANT NUMBER := 0.18;        -- constante (valeur obligatoire)
  v_taux    NUMBER DEFAULT 10;              -- valeur par défaut (équivalent à :=)
  v_date    DATE NOT NULL := SYSDATE;       -- NOT NULL impose une valeur initiale
  v_nom     clients.nom%TYPE;               -- même type que la colonne
```

| Écriture | Verdict | Pourquoi |
|---|---|---|
| `v_id NUMBER(4);` | correcte | |
| `v_x, v_y, v_z VARCHAR2(10);` | **incorrecte** | une seule variable par déclaration en PL/SQL |
| `v_date DATE NOT NULL;` | **incorrecte** | `NOT NULL` exige une valeur initiale (`:= ...`) |
| `v_ok BOOLEAN := 1;` | **incorrecte** | un `BOOLEAN` prend `TRUE`/`FALSE`/`NULL`, pas `1` |
| `v_emp emp_type;` sans `TYPE emp_type IS ...` | **incorrecte** | le type doit être déclaré **avant** la variable |
| `v_nom VARCHAR2;` | **incorrecte** | la taille est obligatoire pour `VARCHAR2` dans une déclaration |

:::examen Question type « déclarations incorrectes »
Pour chaque déclaration, vérifiez dans l'ordre : (1) une seule variable ? (2) `NOT NULL` accompagné d'une valeur initiale ? (3) valeur compatible avec le type (`BOOLEAN`) ? (4) type utilisateur déclaré avant ? (5) taille précisée pour `VARCHAR2` ? Justifiez toujours **en une phrase**.
:::

## 2.1.5 Affecter une valeur

Trois façons de remplir une variable :

```sql
v_total := v_total + 10;                         -- 1) opérateur :=
SELECT nom INTO v_nom FROM clients WHERE id = 3; -- 2) SELECT ... INTO
FETCH c1 INTO v_num, v_nom;                      -- 3) FETCH d'un curseur
```

:::attention SELECT ... INTO exige exactement UNE ligne
Aucune ligne → exception `NO_DATA_FOUND`. Plusieurs lignes → exception `TOO_MANY_ROWS`. Pour plusieurs lignes, utilisez un **curseur** (chapitre 2.2).
:::

## 2.1.6 %TYPE et %ROWTYPE : suivre le schéma de la base

```sql
DECLARE
  v_titre film.titre%TYPE;        -- même type que la colonne film.titre
  rec     film%ROWTYPE;           -- enregistrement : une variable par colonne de la table
BEGIN
  SELECT * INTO rec FROM film WHERE numfilm = 2210;
  DBMS_OUTPUT.PUT_LINE(rec.numfilm || ' ' || rec.titre || ' ' || rec.realisateur);
END;
/
```

Avantage : si le type de la colonne change, le code reste valide sans modification.

## 2.1.7 Les types composés

**Enregistrement défini par l'utilisateur** (2 étapes : le type, puis la variable) :

```sql
DECLARE
  TYPE type_film IS RECORD (
    num   INTEGER,
    titre film.titre%TYPE,
    real  INTEGER
  );
  rec type_film;
BEGIN
  SELECT numfilm, titre, realisateur INTO rec FROM film WHERE numfilm = 2210;
  DBMS_OUTPUT.PUT_LINE(rec.num || ' ' || rec.titre);
END;
/
```

**Table PL/SQL** (tableau indexé ; éléments de même type scalaire, indice entier) :

```sql
DECLARE
  TYPE tab_nom IS TABLE OF VARCHAR2(20) INDEX BY BINARY_INTEGER;
  tableNom tab_nom;
  i BINARY_INTEGER;
BEGIN
  tableNom(5) := 'Dupont';
  i := 10;
  tableNom(i) := 'Dupond';
END;
/
```

## 2.1.8 Visibilité, conversions et instructions

- **Visibilité** : une variable est utilisable dans le bloc où elle est déclarée **et dans les blocs imbriqués**, sauf si un bloc interne la redéclare.
- **Conversions explicites** : `TO_CHAR`, `TO_DATE`, `TO_NUMBER`, `RAWTOHEX`, `HEXTORAW` ; Oracle fait aussi des conversions **implicites** (à éviter dans les formats de dates).
- **Instructions autorisées dans un bloc** : affectation, ordres DML (`INSERT`, `UPDATE`, `DELETE`, `SELECT ... INTO`), gestion de transaction (`COMMIT`, `ROLLBACK`, `SAVEPOINT`, `SET TRANSACTION`, `LOCK`), structures de contrôle, curseurs, exceptions.
- Un ordre **DDL** (`CREATE TABLE`...) ne s'écrit pas directement dans un bloc : il faut `EXECUTE IMMEDIATE '...'`.

```sql
BEGIN
  EXECUTE IMMEDIATE 'CREATE TABLE facturepaye AS SELECT * FROM facture WHERE 1 = 0';
END;
/
```

## 2.1.9 Variables de substitution et saisie

Pour demander une valeur à l'utilisateur dans un script SQL Developer :

```sql
ACCEPT p_nom PROMPT 'Nom du departement : '
DECLARE
  v_nom departement.nom%TYPE := '&p_nom';     -- texte entre apostrophes
  v_id  NUMBER := &p_id;                      -- nombre : pas d'apostrophes
BEGIN
  DBMS_OUTPUT.PUT_LINE(v_nom);
END;
/
```

`&nom` est remplacé **avant** l'exécution par la valeur saisie. Les variables hôtes (liées) sont préfixées par `:` (`VARIABLE nb NUMBER` puis `:nb`).
