# JPA / Hibernate : cycle de vie et problème du N+1

Le standard JPA (Jakarta Persistence API, implémenté par Hibernate) permet de faire correspondre des objets Java avec des tables relationnelles (ORM : Object-Relational Mapping).

---

## 1. Le cycle de vie des entités JPA

Une entité JPA traverse quatre états possibles par rapport au contexte de persistance (`EntityManager`) :

```
    [ Transitoire / New ]  --- persist() --->  [ Gérée / Managed ]
                                                     |
                                                  detach() / close()
                                                     |
                                                     v
    [ Détachée / Detached ]  --- merge() --->  [ Gérée / Managed ] (nouvelle copie !)
```

1. **Transitoire (New / Transient)** : nouvel objet Java créé avec `new`, non encore persisté en base et non associé à un `EntityManager`.
2. **Gérée (Managed)** : associée au contexte de persistance actif. Toutes les modifications apportées à ses attributs seront automatiquement synchronisées en base lors du `commit()` (mécanisme de *dirty checking*).
3. **Détachée (Detached)** : l'entité possède un identifiant en base, mais son `EntityManager` a été fermé (`close()`), vidé (`clear()`) ou l'entité en a été retirée (`detach()`).
4. **Supprimée (Removed)** : marquée pour suppression lors du prochain commit (`remove()`).

---

## 2. Le fonctionnement exact de `em.merge(e)`

Considérons le fragment de code d'examen suivant :

```java
EntityManager em = emf.createEntityManager();
em.getTransaction().begin();

em.merge(e); // Que se passe-t-il pour l'objet 'e' ?

em.getTransaction().commit();
em.close();
```

### Le piège d'examen :
Beaucoup d'étudiants pensent à tort que `em.merge(e)` rattache directement l'objet `e` au contexte de persistance. C'est faux !

**Ce que fait réellement `merge(e)` :**
1. JPA charge (ou recherche dans le contexte) une instance managée correspondant à la même clé primaire.
2. Il copie l'état des champs de l'objet détaché `e` vers cette instance managée.
3. Il **retourne l'instance managée** !
4. **L'objet initial `e` reste détaché.**

```java
// Mauvais usage :
em.merge(e);
e.setNom("Nouveau"); // INUTILE : 'e' est détaché, la modification sera PERDUE !

// Bon usage :
Departement gere = em.merge(e);
gere.setNom("Nouveau"); // PRIS EN COMPTE : 'gere' est l'instance managée !
```

:::retenir
Question d'examen : *« Quelle affirmation est correcte concernant merge(e) ? »*
**Réponse attendue** : **`merge(e)` retourne une instance gérée contenant l'état fusionné ; l'objet original `e` reste détaché.**
:::

---

## 3. Les relations `@OneToMany` et le piège du « Problème N+1 »

Considérons l'analyse de code suivante tirée de l'examen :

```java
// Relation dans la classe Departement :
// @OneToMany(fetch = FetchType.LAZY)
// private List<Employe> employes;

List<Departement> departements = em.createQuery(
    "SELECT d FROM Departement d", Departement.class
).getResultList();

for (Departement d : departements) {
    System.out.println(d.getEmployes().size()); // Déclenche un chargement paresseux !
}
```

### Analyse du problème du N+1 :
1. **Requête 1 (la requête initiale)** : `SELECT * FROM departement` charge les 100 départements.
2. En raison de `FetchType.LAZY`, la collection `employes` de chaque département n'est pas chargée immédiatement (JPA injecte un proxy vide).
3. **Les $N$ requêtes supplémentaires** : lors du parcours de la boucle, l'appel à `d.getEmployes().size()` force Hibernate à exécuter une requête SQL individuelle pour chaque département afin de charger ses employés :
   $$1 \text{ (requête initiale)} + 100 \text{ (requêtes filles)} = 101 \text{ requêtes SQL au total !}$$

:::retenir
Question d'examen : *« Quelle affirmation est la plus juste ? »*
**Réponse attendue** : **Cette approche peut provoquer le problème N+1 : une requête initiale, puis des requêtes supplémentaires pour charger les associations, selon le fournisseur et sa configuration.**
:::

### Comment résoudre le problème N+1 ?
En utilisant une jointure de chargement précoce (**`JOIN FETCH`**) dans la requête JPQL :
```java
SELECT d FROM Departement d JOIN FETCH d.employes
```
Une seule et unique requête SQL avec jointure ramène alors tous les départements et leurs employés simultanément.
