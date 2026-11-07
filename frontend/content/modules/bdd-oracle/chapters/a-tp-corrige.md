Ce chapitre corrige le **TP Oracle PL/SQL : triggers, fonctions et procédures stockées**. Hypothèses sur le schéma (à adapter aux noms exacts de ton TP) :

```
clients(id, nom, email, date_inscription)
categories(id, nom)
produits(id, nom, prix, categorie_id)            -- + stock ajouté au TP
commandes(id, client_id, date_commande, montant)
commande_produits(commande_id, produit_id, quantite)
journal(id, table_nom, operation, ligne_id, utilisateur, date_op, details)
```

:::attention Avant de recopier
Les corrections respectent la **logique** du TP. Vérifie les noms de colonnes de ta base (`id` ou `client_id` ?) et teste chaque objet avec les exemples du sujet. Plusieurs solutions correctes existent.
:::

## A.1 Partie 1 : préparation

**1.1** Ajouter le stock, l'initialiser, créer le journal :

```sql
ALTER TABLE produits ADD (stock NUMBER DEFAULT 0);
UPDATE produits SET stock = 100;

CREATE TABLE journal (
  id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_nom   VARCHAR2(30),
  operation   VARCHAR2(10),
  ligne_id    NUMBER,
  utilisateur VARCHAR2(50),
  date_op     DATE DEFAULT SYSDATE,
  details     VARCHAR2(200)          -- ou CLOB selon la consigne
);
COMMIT;
```

`GENERATED ALWAYS AS IDENTITY` rend la clé **automatique** (Oracle 12c+). Sur une version plus ancienne : séquence + trigger `BEFORE INSERT` (voir 3.2.6).

**1.2** Le message s'affiche dans la fenêtre **« Sortie script » / « Dbms Output »** de SQL Developer. Sans `SET SERVEROUTPUT ON`, le bloc s'exécute normalement mais **rien ne s'affiche** : `DBMS_OUTPUT` écrit dans un tampon que le client n'affiche pas.

## A.2 Partie 2 : blocs anonymes

**2.1**

```sql
DECLARE
  v_nb NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_nb FROM clients;
  DBMS_OUTPUT.PUT_LINE('Nombre de clients : ' || v_nb);
END;
/
```

**2.2 a)** et **b)**

```sql
DECLARE
  v_nom  produits.nom%TYPE;
  v_prix produits.prix%TYPE;
BEGIN
  SELECT nom, prix INTO v_nom, v_prix FROM produits WHERE id = 3;     -- 99999 en b)
  DBMS_OUTPUT.PUT_LINE(v_nom || ' : ' || v_prix);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('Produit introuvable');
END;
/
```

Avec 99999 et **sans** section `EXCEPTION`, l'erreur est **ORA-01403 : no data found**.

**2.3** Parcours du moins cher au plus cher avec niveau :

```sql
BEGIN
  FOR r IN (SELECT nom, prix FROM produits ORDER BY prix) LOOP
    DBMS_OUTPUT.PUT_LINE(r.nom || ' : ' ||
      CASE WHEN r.prix < 5000  THEN 'Economique'
           WHEN r.prix < 50000 THEN 'Standard'
           ELSE 'Premium' END);
  END LOOP;
END;
/
```

**2.4** Accumulation dans une variable :

```sql
DECLARE
  v_ca NUMBER := 0;
BEGIN
  FOR r IN (SELECT montant FROM commandes) LOOP
    v_ca := v_ca + NVL(r.montant, 0);
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('CA total : ' || v_ca);
END;
/
SELECT SUM(montant) FROM commandes;     -- vérification
```

## A.3 Partie 3 : fonctions stockées

```sql
-- 3.1
CREATE OR REPLACE FUNCTION fn_prix_ttc (p_prix IN NUMBER) RETURN NUMBER IS
BEGIN
  RETURN ROUND(p_prix * 1.18);
END;
/
SELECT id, nom, prix, fn_prix_ttc(prix) AS prix_ttc FROM produits;

-- 3.2
CREATE OR REPLACE FUNCTION fn_nb_commandes (p_client_id IN NUMBER) RETURN NUMBER IS
  v_nb NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_nb FROM commandes WHERE client_id = p_client_id;
  RETURN v_nb;
END;
/
SELECT id, nom, fn_nb_commandes(id) FROM clients;

-- 3.3
CREATE OR REPLACE FUNCTION fn_total_client (p_client_id IN NUMBER) RETURN NUMBER IS
  v_total NUMBER;
BEGIN
  SELECT NVL(SUM(montant), 0) INTO v_total FROM commandes WHERE client_id = p_client_id;
  RETURN v_total;
END;
/
```

Pour le client 99999 **sans** `NVL`, `SUM` renvoie **NULL** (aucune ligne) et non 0 : la fonction retournerait NULL.

```sql
-- 3.4 (réutilise fn_total_client)
CREATE OR REPLACE FUNCTION fn_statut_client (p_client_id IN NUMBER) RETURN VARCHAR2 IS
  v_total NUMBER := fn_total_client(p_client_id);
BEGIN
  IF    v_total >= 150000 THEN RETURN 'VIP';
  ELSIF v_total >=  50000 THEN RETURN 'Regulier';
  ELSE                         RETURN 'Occasionnel';
  END IF;
END;
/
SELECT id, nom, fn_total_client(id) AS total, fn_statut_client(id) AS statut FROM clients;   -- a)
SELECT id, nom FROM clients WHERE fn_statut_client(id) = 'VIP';                              -- b)

-- 3.5
CREATE OR REPLACE FUNCTION fn_nom_categorie (p_produit_id IN NUMBER) RETURN VARCHAR2 IS
  v_nom categories.nom%TYPE;
BEGIN
  SELECT c.nom INTO v_nom
  FROM produits p JOIN categories c ON c.id = p.categorie_id
  WHERE p.id = p_produit_id;
  RETURN v_nom;
EXCEPTION
  WHEN NO_DATA_FOUND THEN RETURN 'Inconnu';
END;
/
SELECT fn_nom_categorie(3) FROM DUAL;  SELECT fn_nom_categorie(99999) FROM DUAL;
```

## A.4 Partie 4 : procédures stockées

```sql
-- 4.1
CREATE OR REPLACE PROCEDURE sp_afficher_client (p_id IN NUMBER) IS
  v_nom   clients.nom%TYPE;
  v_email clients.email%TYPE;
BEGIN
  SELECT nom, email INTO v_nom, v_email FROM clients WHERE id = p_id;
  DBMS_OUTPUT.PUT_LINE('Client : ' || v_nom || ' (' || v_email || ')');
  DBMS_OUTPUT.PUT_LINE('Commandes : ' || fn_nb_commandes(p_id));
  DBMS_OUTPUT.PUT_LINE('Total : ' || fn_total_client(p_id));
  DBMS_OUTPUT.PUT_LINE('Statut : ' || fn_statut_client(p_id));
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20020, 'Client inconnu');
END;
/
EXEC sp_afficher_client(1);
EXEC sp_afficher_client(99);        -- ORA-20020 : Client inconnu

-- 4.2
CREATE OR REPLACE PROCEDURE sp_ajouter_client (
  p_nom IN VARCHAR2, p_email IN VARCHAR2, p_id OUT NUMBER
) IS
BEGIN
  SELECT NVL(MAX(id), 0) + 1 INTO p_id FROM clients;
  INSERT INTO clients (id, nom, email, date_inscription)
  VALUES (p_id, p_nom, p_email, TRUNC(SYSDATE));         -- TRUNC : date sans l'heure
END;
/
DECLARE v_id NUMBER;
BEGIN
  sp_ajouter_client('Nouveau', 'n@mail.com', v_id);
  DBMS_OUTPUT.PUT_LINE('Identifiant : ' || v_id);
END;
/
```

**Pourquoi pas de `COMMIT` dans `sp_ajouter_client` ?** Parce que c'est **l'appelant qui décide** de valider ou d'annuler : la procédure peut faire partie d'une transaction plus large (plusieurs procédures enchaînées). Un `COMMIT` interne empêcherait d'annuler l'ensemble.

```sql
-- 4.3
CREATE OR REPLACE PROCEDURE sp_recalculer_montant (p_commande_id IN NUMBER) IS
BEGIN
  UPDATE commandes
  SET montant = (SELECT NVL(SUM(p.prix * cp.quantite), 0)
                 FROM commande_produits cp JOIN produits p ON p.id = cp.produit_id
                 WHERE cp.commande_id = p_commande_id)
  WHERE id = p_commande_id;
  IF SQL%ROWCOUNT = 0 THEN
    RAISE_APPLICATION_ERROR(-20021, 'Commande inconnue');
  END IF;
END;
/

-- 4.4
CREATE OR REPLACE PROCEDURE sp_passer_commande (
  p_client_id IN NUMBER, p_produit_id IN NUMBER, p_quantite IN NUMBER, p_commande_id OUT NUMBER
) IS
  v_nb NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_nb FROM clients WHERE id = p_client_id;
  IF v_nb = 0 THEN
    RAISE_APPLICATION_ERROR(-20020, 'Client inconnu');
  END IF;

  SELECT NVL(MAX(id), 0) + 1 INTO p_commande_id FROM commandes;
  INSERT INTO commandes (id, client_id, date_commande, montant)
  VALUES (p_commande_id, p_client_id, SYSDATE, 0);          -- SYSDATE garde l'heure

  INSERT INTO commande_produits (commande_id, produit_id, quantite)
  VALUES (p_commande_id, p_produit_id, p_quantite);

  sp_recalculer_montant(p_commande_id);
END;
/

-- 4.5
CREATE OR REPLACE PROCEDURE sp_rapport_mensuel (p_annee IN NUMBER) IS
BEGIN
  FOR r IN (SELECT TO_CHAR(date_commande, 'MM') AS mois, COUNT(*) AS nb, SUM(montant) AS ca
            FROM commandes
            WHERE EXTRACT(YEAR FROM date_commande) = p_annee
            GROUP BY TO_CHAR(date_commande, 'MM')
            ORDER BY 1) LOOP
    DBMS_OUTPUT.PUT_LINE('Mois ' || r.mois || ' : ' || r.nb || ' commande(s), CA = ' || r.ca);
  END LOOP;
END;
/
EXEC sp_rapport_mensuel(2025);
```

## A.5 Partie 5 : triggers

```sql
-- 5.1 voir 3.2.5 : trg_clients_journal (AFTER INSERT OR UPDATE OR DELETE, :OLD.id à la suppression)

-- 5.2
CREATE OR REPLACE TRIGGER trg_produits_prix
BEFORE INSERT OR UPDATE OF prix ON produits
FOR EACH ROW
BEGIN
  IF :NEW.prix IS NULL OR :NEW.prix <= 0 THEN
    RAISE_APPLICATION_ERROR(-20030, 'Le prix doit etre strictement positif');
  END IF;
END;
/
```

Tests : **a)** `UPDATE produits SET prix = -5 WHERE id = 1;` échoue ; **b)** `INSERT` d'un produit de prix 0 échoue ; **c)** `UPDATE produits SET stock = 100 WHERE id = 1;` **réussit** : le trigger est déclaré `UPDATE OF prix`, il ne se déclenche que si `prix` figure dans la clause `SET`.

```sql
-- 5.3
CREATE OR REPLACE TRIGGER trg_lignes_stock
BEFORE INSERT ON commande_produits
FOR EACH ROW
DECLARE
  v_stock produits.stock%TYPE;
BEGIN
  SELECT stock INTO v_stock FROM produits WHERE id = :NEW.produit_id;
  IF v_stock < :NEW.quantite THEN
    RAISE_APPLICATION_ERROR(-20031, 'Stock insuffisant');
  ELSE
    UPDATE produits SET stock = stock - :NEW.quantite WHERE id = :NEW.produit_id;
  END IF;
END;
/

-- 5.4
CREATE OR REPLACE TRIGGER trg_clients_suppression
BEFORE DELETE ON clients
FOR EACH ROW
BEGIN
  IF fn_nb_commandes(:OLD.id) > 0 THEN
    RAISE_APPLICATION_ERROR(-20032, 'Suppression refusee : le client a des commandes');
  END IF;
END;
/
```

Sans le trigger, Oracle répondrait **ORA-02292 : violation de contrainte (clé étrangère) - enregistrement fils existant** : message technique, alors que le trigger renvoie un message **métier** avec notre code -20032.

:::attention Interactions à connaître
- `trg_lignes_stock` modifie `produits` mais pas la colonne `prix` : il ne déclenche donc pas `trg_produits_prix`.
- `sp_passer_commande` insère une ligne dans `commande_produits` : le trigger de stock s'exécute et **décrémente automatiquement** le stock (ou refuse la commande si le stock est insuffisant, et tout l'ordre est annulé).
:::
