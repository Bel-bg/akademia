## 3.1.1 Pourquoi stocker des sous-programmes ?

Une **procédure** ou une **fonction stockée** est un bloc PL/SQL **nommé**, compilé et enregistré **dans la base**. On gagne en **performance** (moins d'échanges client-serveur), en **réutilisation** (écrit une fois, appelé partout), en **cohérence** (règles métier centralisées) et en **sécurité** (on donne le droit d'exécuter sans donner accès aux tables).

## 3.1.2 Procédure ou fonction ?

| | Fonction | Procédure | Trigger |
|---|---|---|---|
| Rôle | calculer et **retourner une valeur** | **exécuter une action** | réagir automatiquement à un événement |
| Retourne une valeur | **oui** (`RETURN`, obligatoire) | non (mais paramètres `OUT` possibles) | non |
| Appel | dans un `SELECT` ou un bloc | dans un bloc ou avec `EXEC` | automatique |
| Paramètres | uniquement en entrée (`IN`) | `IN`, `OUT`, `IN OUT` | aucun |
| `COMMIT` à l'intérieur | à éviter | à éviter : l'appelant valide | **interdit** |

:::retenir Quel objet PL/SQL peut renvoyer une seule valeur scalaire ?
Une **fonction**. Une procédure ne « retourne » rien (elle peut seulement remplir un paramètre `OUT`), un trigger ne s'appelle pas, un package est un conteneur.
:::

## 3.1.3 Créer et utiliser une procédure

```sql
CREATE OR REPLACE PROCEDURE nv_film (
  p_num   IN film.numfilm%TYPE,
  p_titre IN film.titre%TYPE
) IS
BEGIN
  INSERT INTO film (numfilm, titre) VALUES (p_num, p_titre);
END nv_film;
/
```

- `CREATE OR REPLACE` : crée ou remplace sans perdre les droits accordés.
- Mode du paramètre : **`IN`** (entrée, par défaut), **`OUT`** (sortie), **`IN OUT`** (les deux). Pas de taille dans le type du paramètre (`VARCHAR2`, pas `VARCHAR2(20)`).
- Le corps commence après `IS` ou `AS`. Les variables locales se déclarent **sans** mot-clé `DECLARE`.

Appels :

```sql
EXEC nv_film(6000, 'El Camino');          -- en SQL Developer / SQL*Plus

DECLARE
  v_id NUMBER;
BEGIN
  sp_ajouter_client('Dupont', 'd@mail.com', v_id);   -- paramètre OUT reçoit une variable
  DBMS_OUTPUT.PUT_LINE('Nouvel id : ' || v_id);
END;
/
```

Par défaut, les paramètres effectifs sont associés **par position** ; on peut aussi nommer : `nv_film(p_titre => 'El Camino', p_num => 6000)`.

## 3.1.4 Créer et utiliser une fonction

```sql
CREATE OR REPLACE FUNCTION fn_prix_ttc (p_prix IN NUMBER) RETURN NUMBER IS
BEGIN
  RETURN ROUND(p_prix * 1.18);
END fn_prix_ttc;
/

SELECT id, nom, prix, fn_prix_ttc(prix) AS prix_ttc FROM produits;   -- appel dans un SELECT
```

Fonction avec accès aux données et traitement d'une absence de résultat :

```sql
CREATE OR REPLACE FUNCTION fn_nom_categorie (p_produit_id IN NUMBER) RETURN VARCHAR2 IS
  v_nom categories.nom%TYPE;
BEGIN
  SELECT c.nom INTO v_nom
  FROM produits p JOIN categories c ON c.id = p.categorie_id
  WHERE p.id = p_produit_id;
  RETURN v_nom;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN 'Inconnu';
END fn_nom_categorie;
/
```

:::attention Règles d'or des fonctions
1. **Chaque chemin d'exécution doit finir par un `RETURN`** (y compris dans `EXCEPTION`) ; sinon : erreur à l'exécution.
2. Les paramètres sont en `IN`.
3. Une fonction appelée **depuis un `SELECT`** ne doit pas modifier les tables (pas d'`INSERT`/`UPDATE`/`DELETE`).
4. Sur un agrégat, pensez à `NVL(SUM(...), 0)` pour renvoyer 0 plutôt que NULL.
:::

Une fonction peut en appeler une autre (réutilisation) :

```sql
CREATE OR REPLACE FUNCTION fn_statut_client (p_client_id IN NUMBER) RETURN VARCHAR2 IS
  v_total NUMBER := fn_total_client(p_client_id);
BEGIN
  IF    v_total >= 150000 THEN RETURN 'VIP';
  ELSIF v_total >=  50000 THEN RETURN 'Regulier';
  ELSE                         RETURN 'Occasionnel';
  END IF;
END;
/

SELECT id, nom FROM clients WHERE fn_statut_client(id) = 'VIP';   -- fonction dans le WHERE
```

## 3.1.5 Appeler procédures et fonctions : récapitulatif

| Situation | Syntaxe |
|---|---|
| Procédure dans un bloc | `nom_proc(args);` |
| Procédure en interactif | `EXEC nom_proc(args)` ou `EXECUTE nom_proc(args)` |
| Fonction dans un bloc | `v := nom_fonc(args);` |
| Fonction dans une requête | `SELECT nom_fonc(args) FROM DUAL;` |
| Fonction en interactif | `VARIABLE r NUMBER` puis `EXEC :r := nom_fonc(args)` puis `PRINT r` |
| Saisie interactive | `EXEC nv_film(&num, &titre)` ou `ACCEPT` + `&variable` |

## 3.1.6 Gérer les objets stockés

```sql
DROP PROCEDURE nom_proc;
DROP FUNCTION  nom_fonc;
SELECT * FROM user_source  WHERE name = 'FN_PRIX_TTC' ORDER BY line;   -- texte source
SELECT * FROM user_errors  WHERE name = 'FN_PRIX_TTC';                 -- erreurs de compilation
SELECT object_name, object_type, status FROM user_objects;              -- état (VALID/INVALID)
```

| Vues du dictionnaire | Contenu |
|---|---|
| `USER_OBJECTS`, `ALL_OBJECTS`, `DBA_OBJECTS` | liste des objets |
| `USER_SOURCE`, `ALL_SOURCE`, `DBA_SOURCE` | texte source |
| `USER_ERRORS`, `ALL_ERRORS`, `DBA_ERRORS` | erreurs de compilation |

(`USER_` = vos objets, `ALL_` = ceux auxquels vous avez accès, `DBA_` = tous, réservé aux administrateurs.)

Si la création affiche « Warning: ... created with compilation errors », consultez `USER_ERRORS` ou, sous SQL Developer, faites clic droit sur l'objet puis **Compile for Debug**.

## 3.1.7 Les packages

Un **package** regroupe des procédures, fonctions, variables, curseurs et exceptions apparentés. Il comporte **deux parties créées et compilées séparément** :

| Partie | Contenu | Visibilité |
|---|---|---|
| **Spécification** (`CREATE PACKAGE`) | déclarations : ce qui est accessible de l'extérieur | **public** |
| **Corps** (`CREATE PACKAGE BODY`) | définitions des sous-programmes publics + sous-programmes **privés** | privé pour ce qui n'est pas déclaré dans la spécification |

```sql
CREATE OR REPLACE PACKAGE gestion_clients IS
  FUNCTION  nb_commandes (p_id NUMBER) RETURN NUMBER;
  PROCEDURE afficher     (p_id NUMBER);
END gestion_clients;
/

CREATE OR REPLACE PACKAGE BODY gestion_clients IS
  FUNCTION nb_commandes (p_id NUMBER) RETURN NUMBER IS
    n NUMBER;
  BEGIN
    SELECT COUNT(*) INTO n FROM commandes WHERE client_id = p_id;
    RETURN n;
  END nb_commandes;

  PROCEDURE afficher (p_id NUMBER) IS
  BEGIN
    DBMS_OUTPUT.PUT_LINE('Commandes : ' || nb_commandes(p_id));
  END afficher;
END gestion_clients;
/

EXEC gestion_clients.afficher(1);                      -- nom_package.nom_element
SELECT gestion_clients.nb_commandes(1) FROM DUAL;
```

Points de cours :
- **Surcharge** : dans un package, plusieurs sous-programmes peuvent porter le même nom si leurs listes de paramètres diffèrent (par exemple une fonction qui compte les films d'un réalisateur par *nom* et une autre par *numéro*).
- Chaque **session** utilise sa **propre copie** des variables et curseurs du package.
- Privilèges : `CREATE PROCEDURE` pour créer un package sur ses propres objets, `CREATE ANY PROCEDURE` pour n'importe quels objets.
- Suppression : `DROP PACKAGE nom;` (tout) ou `DROP PACKAGE BODY nom;` (corps seulement).
