## 2.2.1 Les structures alternatives

```sql
IF condition THEN
  instructions;
END IF;

IF condition THEN
  instructions;
ELSE
  instructions;
END IF;

IF cond1 THEN
  instructions;
ELSIF cond2 THEN            -- ELSIF, sans E au milieu
  instructions;
ELSE
  instructions;
END IF;
```

Il existe aussi `CASE` :

```sql
v_niveau := CASE
              WHEN v_prix < 5000  THEN 'Economique'
              WHEN v_prix < 50000 THEN 'Standard'
              ELSE 'Premium'
            END;
```

:::attention Erreurs de syntaxe fréquentes
`ELSIF` (pas `ELSEIF`, pas `ELSE IF`), `END IF;` (deux mots, point-virgule), `THEN` obligatoire. L'égalité se teste avec `=`, l'affectation avec `:=`.
:::

## 2.2.2 Les structures répétitives

| Boucle | Syntaxe | Quand l'utiliser |
|---|---|---|
| `LOOP` simple | `LOOP ... EXIT WHEN cond; ... END LOOP;` | sortie au milieu de la boucle |
| `WHILE` | `WHILE cond LOOP ... END LOOP;` | condition testée **avant** chaque tour |
| `FOR` | `FOR i IN [REVERSE] debut .. fin LOOP ... END LOOP;` | **nombre de tours connu** |

```sql
FOR i IN 1 .. 5 LOOP
  DBMS_OUTPUT.PUT_LINE('Tour ' || i);
END LOOP;
```

Particularités du `FOR` :
- l'indice (`i`) est une variable **locale à la boucle, non déclarée** ;
- le pas est +1, ou −1 avec `REVERSE` ;
- il n'existe **pas** de boucle `REPEAT` ni `DO ... WHILE` en PL/SQL : on utilise `LOOP ... EXIT WHEN`.

:::retenir « Boucler un nombre précis de fois »
Réponse : **`FOR`**. (`WHILE` et `LOOP` conviennent à une condition d'arrêt, pas à un nombre connu d'avance.)
:::

## 2.2.3 Pourquoi des curseurs ?

Dès qu'on exécute un ordre SQL, Oracle crée un **curseur** : une zone de travail en mémoire qui contient le texte de l'ordre, sa version compilée, un tampon pour une ligne de résultat, un statut et des informations de contrôle.

| Type | Quand | Gestion |
|---|---|---|
| **Implicite** | `INSERT`, `UPDATE`, `DELETE`, `SELECT ... INTO` (une seule ligne) | automatique |
| **Explicite** | `SELECT` pouvant renvoyer **plusieurs lignes** | à écrire par le programmeur |

## 2.2.4 Le curseur explicite en quatre étapes

1. **Déclarer** (section `DECLARE`) : `CURSOR c1 IS SELECT ...;`
2. **Ouvrir** : `OPEN c1;` (alloue la mémoire et exécute la requête)
3. **Lire** ligne par ligne : `FETCH c1 INTO ...;`
4. **Fermer** : `CLOSE c1;`

```sql
DECLARE
  CURSOR c1 IS SELECT numindividu, nomindividu FROM individu WHERE nomindividu LIKE 'A%';
  v_num individu.numindividu%TYPE;
  v_nom individu.nomindividu%TYPE;
BEGIN
  OPEN c1;
  LOOP
    FETCH c1 INTO v_num, v_nom;
    EXIT WHEN c1%NOTFOUND;            -- sortir quand il n'y a plus de ligne
    DBMS_OUTPUT.PUT_LINE(v_num || ' ' || v_nom);
  END LOOP;
  CLOSE c1;
END;
/
```

:::attention Placer EXIT WHEN juste après FETCH
Si on teste `%NOTFOUND` avant le `FETCH`, ou si on affiche avant le test, la dernière ligne est traitée deux fois ou une ligne vide s'affiche.
:::

## 2.2.5 Les quatre façons de lire une ligne

| Forme | Cible du `FETCH` |
|---|---|
| 1 | une liste de variables : `FETCH c1 INTO v_num, v_nom;` |
| 2 | un enregistrement défini par `TYPE ... IS RECORD` |
| 3 | un enregistrement `c1%ROWTYPE` |
| 4 | **boucle `FOR` sur le curseur** : ouverture, lecture et fermeture automatiques |

```sql
-- Forme 4 : la plus courte et la plus sûre
DECLARE
  CURSOR c1 IS SELECT numindividu, nomindividu FROM individu;
BEGIN
  FOR r IN c1 LOOP
    DBMS_OUTPUT.PUT_LINE(r.numindividu || ' ' || r.nomindividu);
  END LOOP;
END;
/

-- Variante sans déclarer le curseur
BEGIN
  FOR r IN (SELECT nom, prix FROM produits ORDER BY prix) LOOP
    DBMS_OUTPUT.PUT_LINE(r.nom || ' : ' || r.prix);
  END LOOP;
END;
/
```

:::retenir Boucle FOR sur un curseur
Pas de `OPEN`, `FETCH` ni `CLOSE` à écrire, pas de variable `r` à déclarer : c'est la forme à privilégier pour parcourir plusieurs lignes.
:::

## 2.2.6 Curseurs paramétrés

```sql
DECLARE
  CURSOR c2 (p NUMBER, q NUMBER) IS
    SELECT titre FROM film WHERE realisateur >= p AND realisateur <= q;
BEGIN
  FOR r IN c2(1600, 1800) LOOP
    DBMS_OUTPUT.PUT_LINE(r.titre);
  END LOOP;
END;
/
-- OPEN c2(1600, 1800);  ou, par nom :  OPEN c2(q => 1800, p => 1600);
```

## 2.2.7 Le statut d'un curseur

| Attribut | Vrai quand... |
|---|---|
| `%FOUND` | le dernier ordre/`FETCH` a trouvé au moins une ligne |
| `%NOTFOUND` | il n'a rien trouvé |
| `%ISOPEN` | le curseur est ouvert |
| `%ROWCOUNT` | nombre de lignes traitées jusqu'ici (0 au départ) |

Pour un curseur **implicite**, on préfixe par `SQL` : `SQL%FOUND`, `SQL%NOTFOUND`, `SQL%ROWCOUNT`, `SQL%ISOPEN` (toujours faux, car fermé automatiquement).

```sql
UPDATE produits SET stock = stock + 10 WHERE categorie_id = 2;
DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' produit(s) modifié(s)');
IF SQL%ROWCOUNT = 0 THEN
  DBMS_OUTPUT.PUT_LINE('Aucune ligne concernée');
END IF;
```

:::examen Astuce : tester si une ligne existe
Après un `UPDATE` ou `DELETE` ciblant une clé primaire, `IF SQL%ROWCOUNT = 0 THEN RAISE ...` permet de signaler « élément inexistant » sans requête supplémentaire.
:::

## 2.2.8 Modifier la ligne courante : FOR UPDATE et CURRENT OF

```sql
DECLARE
  CURSOR c IS SELECT * FROM location WHERE dateenvoi IS NULL FOR UPDATE OF dateenvoi;
BEGIN
  FOR rec IN c LOOP
    UPDATE location SET dateenvoi = SYSDATE WHERE CURRENT OF c;   -- ligne lue par le dernier FETCH
  END LOOP;
  COMMIT;
END;
/
```

`FOR UPDATE` **verrouille** les lignes du `SELECT` ; `WHERE CURRENT OF curseur` cible directement la ligne courante, sans recalculer l'accès. Sous Oracle, un `COMMIT` dans la boucle ferme le curseur `FOR UPDATE` : on valide après la boucle.
