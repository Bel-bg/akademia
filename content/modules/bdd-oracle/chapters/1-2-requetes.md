## 1.2.1 Structure d'une requête SELECT

```sql
SELECT   colonnes ou expressions
FROM     tables
WHERE    condition sur les lignes
GROUP BY colonnes de regroupement
HAVING   condition sur les groupes
ORDER BY colonnes de tri;
```

L'ordre **logique** d'exécution est : `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY`.

:::retenir WHERE ou HAVING ?
`WHERE` filtre les **lignes** avant le regroupement ; `HAVING` filtre les **groupes** après calcul des agrégats (`COUNT`, `SUM`...). On ne peut pas écrire `WHERE COUNT(*) > 2`.
:::

## 1.2.2 Filtrer, trier, supprimer les doublons

```sql
SELECT DISTINCT id_langue FROM utilisateur;                 -- sans doublons
SELECT nom, prix FROM produits WHERE prix BETWEEN 1000 AND 5000 ORDER BY prix DESC;
SELECT nom FROM clients WHERE nom LIKE 'A%' OR email IS NULL;
SELECT nom FROM produits WHERE categorie_id IN (1, 3, 5);
```

- `DISTINCT` supprime les doublons **dans le résultat** ; il ne modifie pas la table.
- Pour comparer à NULL : `IS NULL` / `IS NOT NULL` (jamais `= NULL`).
- `LIKE` : `%` = n'importe quelle suite de caractères, `_` = un seul caractère.

## 1.2.3 Limiter le nombre de lignes (Top-N)

```sql
SELECT nom, prix FROM produits ORDER BY prix DESC FETCH FIRST 5 ROWS ONLY;   -- Oracle 12c et +
SELECT * FROM (SELECT nom, prix FROM produits ORDER BY prix DESC) WHERE ROWNUM <= 5;  -- toutes versions
```

:::attention LIMIT et TOP n'existent pas en Oracle
`LIMIT` est MySQL/PostgreSQL, `TOP` est SQL Server. En Oracle : **`FETCH FIRST N ROWS ONLY`**, ou `ROWNUM` dans une sous-requête déjà triée (`ROWNUM` est attribué *avant* le tri s'il est dans la même requête).
:::

## 1.2.4 Les jointures

```sql
-- jointure interne : seulement les correspondances
SELECT c.nom, cmd.montant
FROM clients c JOIN commandes cmd ON cmd.client_id = c.id;

-- jointure externe gauche : tous les clients, même sans commande
SELECT c.nom, cmd.id
FROM clients c LEFT JOIN commandes cmd ON cmd.client_id = c.id;
```

| Jointure | Lignes retournées |
|---|---|
| `INNER JOIN` (ou `JOIN`) | uniquement celles qui correspondent des deux côtés |
| `LEFT [OUTER] JOIN` | toutes celles de gauche + correspondances de droite (sinon NULL) |
| `RIGHT [OUTER] JOIN` | l'inverse |
| `FULL [OUTER] JOIN` | toutes des deux côtés |
| `CROSS JOIN` | produit cartésien |

**Plusieurs jointures** (cas fréquent à l'examen : facture → contrat → compteur → catégorie) :

```sql
SELECT f.numfacture, f.quantite * cat.prix AS montant
FROM facture   f
JOIN contrat   c   ON c.numpolice   = f.numpolice
JOIN compteur  cp  ON cp.numcompteur = c.numcompteur
JOIN categorie cat ON cat.codecat   = cp.codcat;
```

:::examen Méthode pour une requête à plusieurs tables
1. Repérez la table qui contient ce qu'on cherche. 2. Suivez les **clés étrangères** (`#`) pour atteindre les autres tables. 3. Écrivez une jointure par clé. 4. Ajoutez `WHERE`, puis `GROUP BY`/`HAVING`, puis `ORDER BY`.
:::

## 1.2.5 Fonctions d'agrégation et regroupements

| Fonction | Résultat |
|---|---|
| `COUNT(*)` | nombre de lignes |
| `COUNT(col)` | nombre de valeurs non NULL |
| `SUM(col)`, `AVG(col)` | somme, moyenne (NULL ignorés) |
| `MIN(col)`, `MAX(col)` | minimum, maximum |

```sql
SELECT ville, quartier, SUM(montant) AS total
FROM   ...
GROUP BY ville, quartier          -- toute colonne du SELECT non agrégée doit figurer ici
HAVING SUM(montant) > 100000
ORDER BY total DESC;
```

:::attention SUM sur zéro ligne
`SUM` renvoie **NULL** (et non 0) s'il n'y a aucune ligne. On corrige avec `NVL(SUM(x), 0)`.
:::

## 1.2.6 Sous-requêtes : IN, EXISTS, NOT EXISTS

```sql
-- clients ayant au moins une commande
SELECT * FROM clients c WHERE EXISTS (SELECT 1 FROM commandes o WHERE o.client_id = c.id);

-- clients n'ayant JAMAIS commandé (anti-jointure)
SELECT * FROM clients c WHERE NOT EXISTS (SELECT 1 FROM commandes o WHERE o.client_id = c.id);

-- équivalent avec NOT IN (attention aux NULL !)
SELECT * FROM clients WHERE id NOT IN (SELECT client_id FROM commandes WHERE client_id IS NOT NULL);
```

:::retenir « N'ayant jamais ... » = NOT EXISTS
La formulation « jamais », « aucun », « sans » appelle une **anti-jointure** : `NOT EXISTS` (le plus sûr) ou `LEFT JOIN ... WHERE colonne_droite IS NULL`. `NOT IN` donne un résultat vide si la sous-requête contient un NULL.
:::

## 1.2.7 Dates et valeurs nulles

| Expression | Rôle |
|---|---|
| `SYSDATE` | date et heure courantes du serveur |
| `TRUNC(SYSDATE)` | aujourd'hui à minuit |
| `TRUNC(SYSDATE, 'MM')` | premier jour du mois en cours |
| `ADD_MONTHS(SYSDATE, -60)` | il y a 5 ans (60 mois) |
| `EXTRACT(YEAR FROM d)` | l'année d'une date |
| `TO_CHAR(d, 'DD/MM/YYYY')` | date → texte formaté |
| `TO_DATE('01/02/2025','DD/MM/YYYY')` | texte → date |
| `d2 - d1` | nombre de **jours** entre deux dates |
| `NVL(x, 0)` / `COALESCE(x, y, 0)` | remplace NULL |

Exemple : « factures envoyées **dans le mois en cours** » :

```sql
WHERE dateenvoi >= TRUNC(SYSDATE, 'MM')
  AND dateenvoi <  ADD_MONTHS(TRUNC(SYSDATE, 'MM'), 1)
-- ou, plus court : WHERE TRUNC(dateenvoi, 'MM') = TRUNC(SYSDATE, 'MM')
```

## 1.2.8 Archiver des données : INSERT ... SELECT puis DELETE

L'archivage se fait en **deux ordres avec la même condition**, dans une seule transaction :

```sql
INSERT INTO facturepaye
  SELECT * FROM facture WHERE datepaie IS NOT NULL AND datepaie < ADD_MONTHS(SYSDATE, -60);

DELETE FROM facture
  WHERE datepaie IS NOT NULL AND datepaie < ADD_MONTHS(SYSDATE, -60);

COMMIT;
```

:::attention Ordre et cohérence
Insérer **avant** de supprimer, puis un seul `COMMIT`. Si l'insertion échoue, on fait un `ROLLBACK` et rien n'est perdu. `INSERT INTO t SELECT *` suppose que les deux tables ont **la même structure** (d'où `CREATE TABLE ... AS SELECT ... WHERE 1=0`).
:::
