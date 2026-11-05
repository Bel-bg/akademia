## B.1 Anatomie des épreuves

Les sujets de ce module suivent deux formes, toutes deux de **2 heures** :

| Forme | Contenu typique |
|---|---|
| **Exercices** (/20) | requêtes SQL sur un schéma (5 pts) · déclarations de variables à corriger (3 pts) · séquence + blocs PL/SQL (7 pts) · bloc PL/SQL de calcul avec condition (5 pts) |
| **QCM + étude de cas** | 10 QCM (SQL, PL/SQL) puis étude de cas : création de table, vue, trigger, fonction, procédure |

## B.2 Méthode en 6 temps pour tout exercice SQL/PL/SQL

1. **Lire le schéma** : repérer clés primaires (soulignées) et clés étrangères (`#`).
2. **Reformuler** la demande en une phrase : quoi afficher, pour qui, avec quel filtre.
3. **Choisir l'outil** : requête simple, agrégat, sous-requête, bloc anonyme, fonction (valeur à retourner), procédure (action), trigger (automatique).
4. **Écrire** en commençant par le squelette (`SELECT/FROM/WHERE`, ou `DECLARE/BEGIN/EXCEPTION/END;/`).
5. **Traiter les cas limites** : aucune ligne (`NO_DATA_FOUND`, `NVL`), plusieurs lignes, NULL, élément inexistant.
6. **Relire** : point-virgules, `/` final, `THEN`/`END IF`, noms de colonnes du schéma.

## B.3 Quel objet pour quelle consigne ?

| La consigne dit... | Utiliser |
|---|---|
| « retourner », « calculer le nombre / le montant » | **fonction** |
| « mettre à jour », « enregistrer », « supprimer », « ajouter » avec paramètres | **procédure** |
| « empêcher », « refuser », « automatiquement », « à chaque insertion » | **trigger** (`BEFORE` pour empêcher, `AFTER` pour tracer) |
| « afficher la liste de... à partir de... » | requête, ou `FOR r IN (SELECT ...) LOOP` |
| « qui prend en paramètre l'identifiant » | paramètre `IN` (ou `&variable` dans un bloc anonyme) |
| « une vue » | `CREATE OR REPLACE VIEW ... AS SELECT ...` |
| « n'ayant jamais », « aucun » | `NOT EXISTS` |
| « plus de N » (sur des groupes) | `GROUP BY ... HAVING COUNT(*) > N` |
| « le même schéma que » | `CREATE TABLE ... AS SELECT * ... WHERE 1=0` |

## B.4 Erreurs qui coûtent des points

| Erreur | Correction |
|---|---|
| Oublier le `/` après `END;` | toujours une ligne `/` pour exécuter le bloc |
| `ELSEIF`, `ELSE IF`, `END-IF` | `ELSIF`, `END IF;` |
| `=` pour affecter | `:=` |
| `SELECT ... ` seul dans un bloc | `SELECT ... INTO variable ...` |
| `SELECT ... INTO` sur plusieurs lignes | curseur ou boucle `FOR` |
| Oublier `NVL` autour de `SUM` | `NVL(SUM(x), 0)` |
| `WHERE COUNT(*) > 2` | `HAVING COUNT(*) > 2` |
| `NOT IN` avec des NULL possibles | `NOT EXISTS` |
| `COMMIT` dans un trigger | interdit ; l'appelant valide |
| Lire la table du trigger dans un trigger par ligne | table en mutation (ORA-04091) |
| `:NEW` pour une suppression | `:OLD` |
| Fonction sans `RETURN` sur tous les chemins | `RETURN` aussi dans `EXCEPTION` |
| Variable `BOOLEAN := 1` ; `NOT NULL` sans valeur | `TRUE/FALSE` ; ajouter `:= valeur` |
| Oublier `SET SERVEROUTPUT ON` | sinon aucun affichage |

## B.5 Fiche syntaxe à connaître par cœur

```sql
-- BLOC
SET SERVEROUTPUT ON
DECLARE  v NUMBER := 0;  r t%ROWTYPE;
BEGIN    ...
EXCEPTION WHEN NO_DATA_FOUND THEN ...  WHEN OTHERS THEN ...
END;
/

-- CURSEUR
CURSOR c IS SELECT ...;     OPEN c;  FETCH c INTO ...;  EXIT WHEN c%NOTFOUND;  CLOSE c;
FOR r IN c LOOP ... END LOOP;                    -- ou FOR r IN (SELECT ...) LOOP

-- ERREURS
RAISE nom_exception;     RAISE_APPLICATION_ERROR(-20001, 'message');     SQLCODE / SQLERRM

-- PROCEDURE / FONCTION
CREATE OR REPLACE PROCEDURE p (a IN NUMBER, b OUT NUMBER) IS ... BEGIN ... END p;
CREATE OR REPLACE FUNCTION  f (a IN NUMBER) RETURN NUMBER IS ... BEGIN RETURN x; END f;
EXEC p(1, :v);     SELECT f(1) FROM DUAL;

-- TRIGGER
CREATE OR REPLACE TRIGGER t
BEFORE|AFTER INSERT OR UPDATE [OF col] OR DELETE ON table
[FOR EACH ROW] [WHEN (condition)]
BEGIN ... :NEW.col  :OLD.col  INSERTING  UPDATING  DELETING ... END;
/

-- SEQUENCE
CREATE SEQUENCE s START WITH 2 INCREMENT BY 1;   s.NEXTVAL   s.CURRVAL
```
