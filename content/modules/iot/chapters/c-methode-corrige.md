### C.1 Méthode générale

**Partie 1 (connaissances, 5 points)** : réponses **courtes et précises** : une définition d'une phrase, puis 2 ou 3 éléments, puis un exemple. 3 à 6 lignes par question, vocabulaire exact. **Partie 2 (analyse de situation, 7 points)** : lisez le scénario en soulignant les technologies et les préoccupations ; **rattachez chaque réponse à un élément du texte** ; justifiez (« parce que », « donc »). **Partie 3 (cas pratique, 8 points)** : suivez les consignes dans l'ordre : (1) tableau des composants avec **rôle/justification** ; (2) **architecture** en couches avec **schéma** et flux de données de bout en bout ; (3) mécanismes concrets pour **chaque garantie** demandée. Soignez la **clarté**, la **logique** et la **créativité** (critères d'évaluation de l'épreuve).

:::attention Erreurs fréquentes
Réponses vagues sans exemple ; confusion LoRa/LoRaWAN ; oublier la couche application ou le traitement ; dire « on utilise le cloud » sans préciser quoi et pourquoi ; ne pas justifier les composants ; citer des technologies sans lien avec le scénario ; oublier la sécurité des communications et la panne réseau ; ne pas faire de schéma.
:::

### C.2 Corrigé de l'examen d'Introduction à l'Internet des Objets (ENEAM, 2025-2026)

#### Première partie (5 points)

**1. Définissez l'IoT et donnez un exemple d'application dans l'agriculture.** L'IoT est un réseau d'objets physiques équipés de capteurs, de logiciels et de moyens de communication, connectés à Internet, capables de collecter, d'échanger et de traiter des données avec peu ou pas d'intervention humaine. *Exemple* : l'irrigation intelligente : des capteurs d'humidité du sol transmettent leurs mesures à une plateforme ; si l'humidité passe sous un seuil, une électrovanne s'ouvre automatiquement et l'agriculteur est notifié, ce qui économise l'eau et améliore les rendements.

**2. Trois caractéristiques fondamentales et leur importance.** (a) **Connectivité** : permet aux objets d'échanger leurs données avec le réseau et les plateformes ; sans elle, pas de supervision à distance. (b) **Collecte de données par capteurs** : fournit l'information de base sur l'environnement, indispensable à toute décision. (c) **Automatisation/action** : les actionneurs agissent selon des règles, ce qui rend le système autonome et réactif. (D'autres réponses valables : interopérabilité, sécurité, évolutivité, faible consommation.)

**3. Système embarqué et rôle du microcontrôleur.** Un système embarqué est un ensemble matériel et logiciel dédié à une tâche précise au sein d'un appareil plus grand, avec des contraintes de taille, d'énergie et de coût. Le microcontrôleur (CPU + mémoire + périphériques sur une puce) est le « cerveau » de l'objet IoT : il lit les capteurs, traite les données, commande les actionneurs, gère la communication et l'énergie.

**4. Deux défis de scalabilité et pourquoi ils sont critiques.** (a) **Volume de données** : des milliers d'objets produisent des flux continus qui saturent réseaux, stockage et analyse ; critique car sans capacité de traitement, les alertes arrivent trop tard ou les données sont perdues. (b) **Gestion et interopérabilité de nombreux appareils hétérogènes** : configuration, supervision, mises à jour et protocoles différents ; critique car le coût d'exploitation explose et le système devient ingérable sans automatisation et standards.

**5. Cloud et edge.** Le **cloud** centralise le stockage et le traitement dans des centres de données distants : puissance quasi illimitée, analyses lourdes, historique, mais latence plus élevée, dépendance à Internet et coût de transmission. L'**edge** traite les données près de la source (objet, passerelle) : latence faible, réaction en temps réel, économie de bande passante, meilleure confidentialité, mais ressources limitées. Les architectures sont **complémentaires** (approche hybride).

#### Deuxième partie : gestion intelligente des déchets (7 points)

**1. Couches de l'architecture.** *Perception* : capteurs ultrason de remplissage dans les poubelles et leur microcontrôleur (mesure du niveau). *Réseau* : liaison radio LoRa vers des passerelles LoRaWAN puis Internet vers la plateforme (transport des données). *Traitement* : plateforme centrale (serveur réseau/applicatif, base de données) : décodage, stockage, calcul du taux de remplissage, règle « 80 % » qui déclenche l'alerte. *Application* : interface/application destinée aux services techniques : cartes, alertes, optimisation des tournées de collecte.

**2. Choix du LoRaWAN.** Longue portée (2 à 5 km en ville : peu de passerelles pour couvrir la municipalité) ; très faible consommation (capteurs sur pile plusieurs années) ; faible coût des modules et fréquences libres sans abonnement ; grande capacité (des milliers de capteurs par passerelle) ; bonne pénétration en milieu urbain ; sécurité AES-128 intégrée. Le faible débit n'est pas gênant : un niveau de remplissage est un petit message envoyé quelques fois par jour.

**3. Deux solutions pour l'autonomie.** (a) **Veille profonde et cycle de service** : le capteur se réveille quelques secondes toutes les 15 à 60 minutes, mesure, transmet puis se rendort. (b) **Réduire l'énergie de transmission** : LoRaWAN classe A, ADR (puissance et SF minimaux), envoi sur seuil ou changement significatif ; on peut ajouter un petit panneau solaire sur le couvercle de la poubelle.

**4. Deux mécanismes de sécurité et d'intégrité.** (a) **Chiffrement AES-128 de bout en bout** (clés de session NwkSKey/AppSKey) pour empêcher l'interception. (b) **MIC (code d'intégrité du message) et compteurs de trames anti-rejeu** pour détecter toute modification ou rejeu ; activation OTAA avec clé unique par capteur et TLS entre passerelle et serveur.

*Pour le grand nombre d'appareils* : plateforme de gestion de flotte (enregistrement, supervision, mises à jour OTA), IDs uniques, supervision des batteries, ajout de passerelles, bases de séries temporelles.

#### Troisième partie : entrepôt logistique (8 points)

**1. Composants matériels.**


| Fonction | Composant | Justification |
|---|---|---|
| Détection d'intrusion | Capteurs infrarouges passifs (PIR HC-SR501) aux accès et allées ; contacts magnétiques sur les portes | Détection fiable du mouvement, faible coût, faible consommation |
| Vérification visuelle | Caméras IP ou ESP32-CAM | Confirmation de l'intrusion, preuve, analyse d'images |
| Alarme | Sirène/buzzer de forte puissance | Dissuasion immédiate |
| Éclairage | Projecteurs/LED via relais | Dissuasion et meilleure image des caméras |
| Commande | Relais ou MOSFET + alimentation séparée | Un microcontrôleur ne peut pas alimenter directement sirène ni projecteur |
| Intelligence | Microcontrôleur ESP32 (Wi-Fi + BLE, plusieurs GPIO, deep sleep) | Lit les capteurs, applique la règle, active les actionneurs, communique |
| Communication | Wi-Fi/Ethernet vers le routeur ; module GSM/4G (SIM7600) de secours ; LoRa pour de grands sites | Notification en temps réel et redondance |
| Passerelle locale | Raspberry Pi (edge) | Traitement des images, tampon des données, MQTT |
| Énergie | Alimentation secteur + batterie de secours/onduleur | Fonctionnement en cas de coupure |


**2. Architecture fonctionnelle.** *Perception* : PIR, contacts, caméras, sirène, éclairage reliés aux ESP32 par zone. *Réseau* : Wi-Fi/Ethernet local, GSM en secours ; messages MQTT sur TLS. *Traitement (edge puis cloud)* : sur la passerelle locale, une règle « si PIR actif et système armé alors sirène + éclairage + publication d'une alerte » s'exécute en moins d'une seconde, sans attendre le cloud ; l'image est analysée localement (détection de personne) ; les événements sont mis en tampon puis envoyés au cloud (broker MQTT, base de séries temporelles, stockage d'images) pour l'historique et l'analyse ultérieure. *Application* : une application mobile reçoit la notification push en temps réel (via un service de messagerie), affiche l'image, permet d'armer/désarmer et de couper l'alarme ; tableau de bord web pour l'historique. Flux : capteur → ESP32 → passerelle (décision) → actionneurs (local) + alerte → cloud → application mobile.

**3. Garanties.** *Confidentialité* : chiffrement TLS pour tous les échanges (MQTT sur 8883, HTTPS), vidéo chiffrée, authentification des appareils par certificats ou clés uniques, contrôle d'accès par rôles dans l'application, segmentation du réseau (VLAN IoT), stockage chiffré, minimisation et durée de conservation des vidéos. *Résilience en cas de panne réseau* : décision d'alarme **locale** (edge) ; **tampon local** (carte SD, flash) avec renvoi automatique au retour du réseau (store-and-forward, MQTT QoS 1/2, sessions persistantes) ; **liaison de secours GSM** avec basculement automatique et SMS d'alerte ; batterie de secours ; watchdog et surveillance du battement de cœur (Last Will) qui alerte si un nœud tombe.
