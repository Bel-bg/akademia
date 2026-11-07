## 2.3.1 Deux sources d'erreurs

| Origine | Exemple | Traitement possible |
|---|---|---|
| **Détectée par le SGBD** | division par zéro, ligne introuvable, doublon de clé | section `EXCEPTION`, ou propagée à l'appelant |
| **Générée par l'utilisateur** | règle de gestion violée (stock insuffisant, client inconnu) | `RAISE` ou `RAISE_APPLICATION_ERROR` |

## 2.3.2 La section EXCEPTION

```sql
BEGIN
  ...
EXCEPTION
  WHEN nom_erreur1 THEN traitement1;
  WHEN nom_erreur2 OR nom_erreur3 THEN traitement2;
  WHEN OTHERS THEN traitement_autres_erreurs;     -- doit être le DERNIER
END;
```

:::retenir Le mot-clé de la section erreurs
La section de gestion des erreurs s'introduit par **`EXCEPTION`**. (Pas `CATCH`, pas `TRY`, pas `WHEN` seul : `WHEN` ouvre un **cas** à l'intérieur de la section.)
:::

Deux fonctions renseignent sur l'erreur en cours : **`SQLCODE`** (numéro, 0 si aucune erreur) et **`SQLERRM`** (message correspondant).

```sql
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('SQLCODE = ' || SQLCODE);
    DBMS_OUTPUT.PUT_LINE('SQLERRM  = ' || SQLERRM);
```

## 2.3.3 Les erreurs standard (prédéfinies)

| Exception | Code ORA | SQLCODE | Cause typique |
|---|---|---|---|
| `NO_DATA_FOUND` | ORA-01403 | 100 | `SELECT ... INTO` ne trouve aucune ligne |
| `TOO_MANY_ROWS` | ORA-01422 | -1422 | `SELECT ... INTO` trouve plusieurs lignes |
| `DUP_VAL_ON_INDEX` | ORA-00001 | -1 | doublon sur clé primaire ou `UNIQUE` |
| `ZERO_DIVIDE` | ORA-01476 | -1476 | division par zéro |
| `INVALID_NUMBER` | ORA-01722 | -1722 | conversion texte → nombre impossible |
| `VALUE_ERROR` | ORA-06502 | -6502 | erreur de conversion ou de taille |
| `INVALID_CURSOR` | ORA-01001 | -1001 | opération illégale sur un curseur |
| `LOGIN_DENIED` | ORA-01017 | -1017 | connexion refusée |

:::attention NO_DATA_FOUND est une exception, pas une valeur
Un `SELECT ... INTO` sans résultat **interrompt le bloc** et saute à `EXCEPTION`. Un `UPDATE`/`DELETE` sans ligne concernée ne lève **pas** d'exception (on teste `SQL%ROWCOUNT`).
:::

## 2.3.4 Erreurs définies par l'utilisateur

```sql
DECLARE
  erreur_ex EXCEPTION;                  -- 1) déclarer
BEGIN
  SELECT probleme INTO v_pb FROM exemplaire WHERE numexemplaire = 1;
  IF v_pb IS NOT NULL THEN
    RAISE erreur_ex;                    -- 2) déclencher
  END IF;
EXCEPTION
  WHEN NO_DATA_FOUND THEN DBMS_OUTPUT.PUT_LINE('numero inconnu');
  WHEN erreur_ex     THEN DBMS_OUTPUT.PUT_LINE('probleme signale');   -- 3) traiter
END;
/
```

Pour **associer un nom** à un code Oracle sans nom :

```sql
DECLARE
  e_fk EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_fk, -2292);   -- ORA-02292 : enregistrements fils existants
BEGIN
  DELETE FROM clients WHERE id = 1;
EXCEPTION
  WHEN e_fk THEN DBMS_OUTPUT.PUT_LINE('Suppression impossible : le client a des commandes');
END;
/
```

## 2.3.5 RAISE_APPLICATION_ERROR : renvoyer une erreur à l'appelant

```sql
RAISE_APPLICATION_ERROR(numero, 'message');     -- numero entre -20000 et -20999
```

```sql
CREATE OR REPLACE PROCEDURE del_film (num IN film.numfilm%TYPE) IS
  tit film.titre%TYPE;
BEGIN
  SELECT titre INTO tit FROM film WHERE numfilm = num;
  DELETE FROM film WHERE numfilm = num;
  DBMS_OUTPUT.PUT_LINE('Film ' || tit || ' supprime');
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20002, 'Le film ' || num || ' n''existe pas');
END del_film;
/
```

:::retenir Où traiter l'erreur ?
**Dans une section `EXCEPTION`** : l'appelant considère l'exécution comme *réussie* (on affiche un message ou on l'écrit dans une table d'erreurs). **Par l'environnement** : l'erreur remonte à l'appelant avec son code (`ORA-xxxxx`) et son message ; `RAISE_APPLICATION_ERROR` sert à produire sa propre erreur, avec un code **-20000 à -20999**.
:::

:::attention Détails qui font la différence
- Une apostrophe dans un texte se double : `'n''existe pas'`.
- `RAISE_APPLICATION_ERROR` interrompt le sous-programme et annule les modifications de l'instruction qui l'a appelé ; la transaction de l'appelant n'est validée que s'il fait `COMMIT`.
- Dans un **trigger**, `RAISE_APPLICATION_ERROR` est le moyen standard de **refuser** une opération (l'`INSERT`/`UPDATE`/`DELETE` est annulé).
:::

## 2.3.6 Portée des exceptions : blocs imbriqués

Une exception levée dans un bloc interne est cherchée d'abord dans **sa** section `EXCEPTION` ; si elle n'est pas traitée, elle **remonte** au bloc englobant, puis à l'appelant.

```sql
BEGIN
  BEGIN
    SELECT nom INTO v_nom FROM clients WHERE id = 99999;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN v_nom := 'Inconnu';     -- traitée localement : le bloc externe continue
  END;
  DBMS_OUTPUT.PUT_LINE(v_nom);
END;
/
```

Cette technique permet de **protéger une seule instruction** et de poursuivre le traitement (valeur par défaut, comme `'Inconnu'` ou `0`).
