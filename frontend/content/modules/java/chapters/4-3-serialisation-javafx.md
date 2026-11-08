# Sérialisation (transient) et interfaces graphiques JavaFX

La sérialisation d'objets et la construction d'interfaces graphiques riches constituent deux volets importants du développement applicatif en Java SE.

---

## 1. La sérialisation et le mot-clé `transient`

La sérialisation est le mécanisme permettant de convertir un graphe d'objets Java en un flux d'octets binaire (pour le stocker dans un fichier ou le transmettre sur le réseau), puis de le reconstruire fidèlement à l'identique (désérialisation).

Pour qu'un objet soit sérialisable, sa classe doit implémenter l'interface marqueur `java.io.Serializable`.

### À quoi sert le mot-clé `transient` ?

Le mot-clé `transient` est un modificateur appliqué à un attribut pour **l'exclure formellement du processus de sérialisation**.

Lors de la sérialisation, la valeur d'un champ marqué `transient` est purement et simplement ignorée. À la désérialisation, ce champ prend sa valeur par défaut (`null` pour les objets, `0` pour les nombres, `false` pour les booléens).

```java
import java.io.Serializable;

public class Utilisateur implements Serializable {
    private static final long serialVersionUID = 1L;

    private String login; // Sérialisé normalement

    // Donnée sensible ou ressource temporaire non sérialisable :
    private transient String motDePasse;
    private transient Connection connexionBdd;

    public Utilisateur(String login, String motDePasse) {
        this.login = login;
        this.motDePasse = motDePasse;
    }
}
```

:::retenir
Question d'examen : *« En Java, le mot-clé transient est utilisé pour : »*
- A. Rendre un champ immuable (c'est le rôle de `final`)
- **B. Exclure un champ de la sérialisation** (Bonne réponse)
- C. Marquer un champ temporaire
- D. Empêcher un champ d’être modifié (c'est le rôle de `final`)
:::

---

## 2. Architecture des interfaces graphiques JavaFX

JavaFX est la bibliothèque moderne recommandée pour concevoir des applications clientes riches en Java (en remplacement de Swing et AWT).

L'architecture d'une fenêtre JavaFX repose sur une analogie théâtrale structurée en trois couches :

```
[ Stage (La scène / La fenêtre OS) ]
      |
   [ Scene (Le plateau de jeu) ]
         |
      [ Parent (La racine du graphe de scène / Root Node) ]
            /          \
      [ Button ]    [ VBox ]
```

1. **`Stage`** : représente la fenêtre de niveau supérieur fournie par le système d'exploitation.
2. **`Scene`** : le conteneur physique des composants graphiques affiché à l'intérieur du Stage.
3. **`Parent` (sous-classe de `Node`)** : **la racine (root node)** de l'arborescence des éléments visuels (layouts tels que `Pane`, `VBox`, `BorderPane`, `StackPane`).

:::retenir
Question d'examen : *« En JavaFX, quelle classe représente la racine d’une interface graphique ? »*
- A. `Stage` (représente la fenêtre entière)
- B. `Scene` (représente le conteneur de scène)
- C. `Node` (classe parente de tout élément graphique individuel)
- **D. `Parent`** (représente spécifiquement la racine hiérarchique d'un graphe de nœuds, bonne réponse)
:::

---

## 3. Définition déclarative avec les fichiers `.fxml`

En JavaFX, la bonne pratique sépare le design visuel de la logique applicative :
- **Fichier `.fxml`** : fichier XML décrivant l'arborescence et la disposition des composants graphiques (boutons, champs texte, menus).
- **Contrôleur Java** : classe Java annotée avec `@FXML` qui gère les interactions et les événements utilisateur.
- **Fichier `.css`** : feuilles de style pour personnaliser les couleurs et bordures.

```xml
<!-- Exemple de vue FXML : vue-compte.fxml -->
<?xml version="1.0" encoding="UTF-8"?>
<?import javafx.scene.layout.VBox?>
<?import javafx.scene.control.Label?>
<?import javafx.scene.control.Button?>

<VBox xmlns:fx="http://javafx.com/fxml" fx:controller="com.akademia.CompteController" spacing="10">
    <Label fx:id="labelSolde" text="Solde du compte : 0 FCFA" />
    <Button text="Actualiser" onAction="#handleActualiser" />
</VBox>
```

:::examen
Question d'examen : *« Dans JavaFX, quel fichier définit généralement l’interface utilisateur ? »*
- A. `.java`
- B. `.css`
- **C. `.fxml`** (Bonne réponse)
- D. `.xml` (Bien qu'au format XML, l'extension standard dédiée est bien `.fxml`)
:::
