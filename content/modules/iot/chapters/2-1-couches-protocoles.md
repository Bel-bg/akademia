### 2.1.1 Les différentes couches d'un système IoT

Il n'existe pas une seule architecture IoT normalisée, mais plusieurs **modèles en couches** qui organisent les différents aspects du système. Les plus courants sont :

- le modèle à **3 couches** : perception, réseau, application ;
- le modèle à **4 couches** (celui de ce cours) : perception, réseau, traitement, application ;
- le modèle à **5 couches** : perception, transport (réseau), traitement, application, métier (*business*) ;
- le modèle de référence **Cisco/IoT World Forum à 7 niveaux** (2014) : 1 dispositifs physiques et contrôleurs, 2 connectivité, 3 calcul en périphérie (*edge/fog*), 4 accumulation des données, 5 abstraction des données, 6 application, 7 collaboration et processus ;
- le modèle de l'**UIT-T Y.2060** : couche dispositifs, couche réseau, couche support de services et d'applications, couche application, avec des capacités transversales de gestion et de sécurité.

![Architecture IoT en quatre couches avec sécurité et gestion transversales](/figures/iot/couches.svg)

#### La couche de perception

Cette couche se charge de **convertir des grandeurs physiques en données numériques et vice versa** (signaux analogiques vers numériques et inversement). Elle regroupe les **capteurs**, qui collectent les données de l'environnement ; les **actionneurs**, qui agissent sur l'environnement en fonction des commandes reçues ; ainsi que les **machines et dispositifs** (microcontrôleurs) auxquels ils sont connectés. On l'appelle aussi *couche physique* ou *couche des dispositifs*.

- **Composants** : capteurs, actionneurs, microcontrôleurs, étiquettes RFID/NFC, caméras.
- **Rôle** : mesurer, identifier, agir.
- **Enjeux** : énergie, coût, robustesse, sécurité physique.
- **Exemple (poubelle connectée)** : capteur ultrason HC-SR04 + microcontrôleur + batterie.

#### La couche réseau (ou transport)

Les données collectées doivent évidemment être **transmises**. C'est ce dont se charge la couche réseau : elle transmet toutes les données et connecte les appareils du système entre eux et avec les plateformes pour une meilleure communication. Elle comprend les **technologies d'accès** (Wi-Fi, BLE, Zigbee, LoRa, NB-IoT, 4G/5G, Ethernet), les **passerelles** (*gateways*), le routage et les protocoles de transport.

- **Rôle** : acheminer les données de façon fiable, économe et sécurisée, dans les deux sens.
- **Exemple (poubelle connectée)** : radio LoRa vers une passerelle LoRaWAN, puis liaison Internet (Ethernet/4G) vers le serveur réseau.
- **Enjeux** : portée, débit, énergie, interférences, écoute et brouillage.

#### La couche de traitement (middleware)

La couche de traitement est l'étape où les données collectées sont **analysées et transformées en informations exploitables**. Elle assure principalement le **filtrage, le stockage et l'analyse** des données afin de faciliter des prises de décision automatisées ou assistées. Grâce à des technologies comme le **cloud computing**, l'**edge computing** ou l'**intelligence artificielle**, elle traite efficacement des volumes importants de données en temps réel ou en différé.

- **Composants** : serveurs réseau et applicatifs, brokers MQTT, bases de données (séries temporelles), moteurs de règles, analyse et IA, gestion des appareils.
- **Exemple (poubelle connectée)** : plateforme (ThingsBoard, TTN, AWS IoT) qui décode la mesure, la stocke, calcule le taux de remplissage et déclenche l'alerte à 80 %.

#### La couche d'application

C'est la couche qui **interagit avec l'utilisateur** du système IoT. Elle permet à l'utilisateur de communiquer avec le système et d'y **visualiser des informations**. Elle peut être une interface web, une application mobile, un écran ou tout autre élément de dialogue (tableau de bord, notifications, API pour d'autres applications).

- **Exemple (poubelle connectée)** : application des services techniques montrant la carte des bacs et les alertes de collecte, optimisation des tournées.

#### Couche métier (modèle à 5 couches)

Elle gère le système global : modèles économiques, règles de gestion, confidentialité, tableaux de bord de direction, facturation.

#### Couches transversales : sécurité et gestion

La **sécurité** (chiffrement, authentification, contrôle d'accès) et la **gestion** (supervision, mise à jour des firmwares, provisionnement des appareils) traversent toutes les couches.


| Couche (4 couches) | Fonction | Technologies / exemples | Équivalent TCP/IP |
|---|---|---|---|
| Perception | Mesurer, identifier, agir | Capteurs, actionneurs, RFID, microcontrôleurs | Physique |
| Réseau | Transmettre | Wi-Fi, BLE, Zigbee, LoRaWAN, NB-IoT, IP, passerelles | Accès réseau, Internet, Transport |
| Traitement | Filtrer, stocker, analyser | Cloud, edge, bases de données, IA, broker MQTT | Application (côté serveur) |
| Application | Interagir avec l'utilisateur | Appli mobile, web, tableau de bord, API | Application |


:::examen Question type : « Identifiez les couches de l'architecture IoT impliquées et expliquez leur rôle »
**Méthode** : (1) citez les quatre couches dans l'ordre ; (2) pour chacune, rattachez un **élément concret du scénario** (capteur ultrason = perception ; LoRaWAN = réseau ; plateforme centrale = traitement ; alertes aux services techniques = application) ; (3) donnez le **rôle** en une phrase. Les notes se gagnent sur le lien entre la théorie et le scénario.
:::

### 2.1.2 Les protocoles de communication

Différents protocoles sont utilisés dans un système IoT pour la communication entre les différents éléments. On les classe selon la couche :

- **Accès/liaison/physique** : Ethernet, Wi-Fi, Bluetooth/BLE, Zigbee, Thread, Z-Wave, LoRa/LoRaWAN, Sigfox, NB-IoT/LTE-M, réseaux cellulaires, NFC/RFID ;
- **Réseau et adaptation** : IPv4/IPv6, **6LoWPAN** (IPv6 sur réseaux 802.15.4 à faible puissance), RPL (routage) ;
- **Transport** : TCP (fiable, connecté, plus lourd) et UDP (léger, sans connexion) ;
- **Applicatifs** : MQTT, CoAP, HTTP/HTTPS (REST), AMQP, LwM2M (gestion d'appareils), OPC UA (industrie), WebSocket.

![Piles de protocoles IoT : application, transport, réseau, accès](/figures/iot/protocoles.svg)

#### L'Ethernet

Technologie de **réseau filaire** (IEEE 802.3) qui permet la connexion de plusieurs appareils pour l'échange de données dans un réseau local, par câbles (paire torsadée, fibre). Débits de 10 Mbit/s à plusieurs Gbit/s ; très fiable, faible latence ; avec le **PoE** (*Power over Ethernet*), le même câble alimente l'appareil (caméras IP, points d'accès). Inconvénient : câblage, mobilité nulle.

#### Le Wi-Fi

Le Wi-Fi est désigné techniquement par la norme **IEEE 802.11**. C'est une technologie sans fil pour la mise en réseau local (**WLAN**) de nœuds et d'appareils. Il utilise la bande **2,4 GHz** ou la bande **5 GHz** (et 6 GHz pour le Wi-Fi 6E/7), subdivisées en canaux. L'accès au canal se fait par **CSMA/CA** (écoute de la porteuse avec évitement des collisions) ; les normes récentes utilisent l'**OFDM**/**OFDMA**. Un appareil Wi-Fi se connecte à un **point d'accès** qui le relie au réseau local puis à Internet.


| Norme | Nom commercial | Bande | Débit théorique max |
|---|---|---|---|
| 802.11b | - | 2,4 GHz | 11 Mbit/s |
| 802.11a | - | 5 GHz | 54 Mbit/s |
| 802.11g | - | 2,4 GHz | 54 Mbit/s |
| 802.11n | Wi-Fi 4 | 2,4 et 5 GHz | jusqu'à 600 Mbit/s (150 Mbit/s par flux spatial) |
| 802.11ac | Wi-Fi 5 | 5 GHz | plusieurs Gbit/s |
| 802.11ax | Wi-Fi 6/6E | 2,4, 5 (et 6) GHz | près de 10 Gbit/s ; OFDMA, TWT |
| 802.11ah | Wi-Fi HaLow | sub-GHz (900 MHz) | quelques Mbit/s, portée ~1 km, faible consommation |


Avantages : débit élevé, infrastructure déjà présente, simplicité. Inconvénients : **consommation élevée** (peu adapté aux capteurs sur pile), portée limitée (dizaines de mètres), saturation des canaux. Idéal pour : caméras, maison connectée, prototypes (ESP32/ESP8266).

#### Le Bluetooth et le BLE (Bluetooth Low Energy)

Le Bluetooth est défini à l'origine par la norme **IEEE 802.15.1** ; c'est une technologie sans fil à **courte portée et faible puissance** pour la communication entre deux ou plusieurs appareils compatibles. Initialement conçue comme remplacement du câble entre appareils mobiles (smartphones, ordinateurs portables), elle transmet données et voix sur de courtes distances. Elle fonctionne dans la **bande ISM 2,4 GHz**, avec une portée d'environ **10 m** (classe 2) pouvant atteindre 100 m (classe 1).

La transmission utilise l'**étalement de spectre à saut de fréquence (FHSS)** sur **79 canaux de 1 MHz**, avec **saut de fréquence adaptatif (AFH)** à environ **1 600 sauts par seconde**, ce qui réduit les interférences avec les autres appareils du 2,4 GHz. Les données sont découpées en paquets. Les premières versions utilisent la modulation GFSK (débit de base jusqu'à 1 Mbit/s) ; les variantes EDR utilisent π/4-DQPSK et 8-DPSK pour 2 et 3 Mbit/s.

Le Bluetooth suit une **architecture maître-esclave** : un **piconet** (réseau personnel éphémère, PAN) réunit **un maître et jusqu'à sept esclaves actifs** ; un esclave ne peut appartenir qu'à un maître à la fois, et tous partagent l'horloge du maître. Deux piconets reliés par un pont forment un **scatternet** (« réseau dispersé »).

Le **BLE** (Bluetooth Low Energy, Bluetooth 4.0 en 2010) est une variante conçue pour une **très faible consommation** : 40 canaux de 2 MHz, 1 Mbit/s (2 Mbit/s en Bluetooth 5), paquets courts, temps de connexion très faible, pile bouton pendant des mois ou des années. Il utilise des profils **GATT** (services et caractéristiques) et peut fonctionner en **diffusion** (*advertising*, balises/beacons). Bluetooth 5 étend la portée (mode « longue portée » jusqu'à plusieurs centaines de mètres en champ libre) et **Bluetooth Mesh** permet des réseaux maillés. Usages : montres connectées, capteurs de santé, balises de localisation, serrures.

#### Le Zigbee

Zigbee est conçu pour des **réseaux personnels sans fil (WPAN)** de capteurs et de contrôle. Il s'appuie sur la norme **IEEE 802.15.4** pour les couches physique et MAC (couches 1 et 2 du modèle OSI). Il est conçu pour des **réseaux maillés** à faible puissance et faible coût, dans une plage typique de **10 à 100 m** (les routeurs étendent la portée par rebonds).

- **Fréquences** : 2,4 GHz mondial (16 canaux, **250 kbit/s**), 868 MHz en Europe (20 kbit/s), 915 MHz en Amérique (40 kbit/s).
- **Rôles** : **coordinateur** (un par réseau, crée le réseau), **routeurs** (relaient, sur secteur), **terminaux** (capteurs sur pile, dorment souvent).
- **Topologies** : étoile, arbre, **maillage**. Chiffrement AES-128.
- **Usages** : domotique, éclairage, capteurs de bâtiment. Concurrents : Z-Wave (sub-GHz, 100 kbit/s), **Thread** (IPv6 sur 802.15.4, base de Matter).

#### Le LoRa et le LoRaWAN

**LoRa** (*Long Range*) est une technologie sans fil de **couche physique** à modulation par **étalement de spectre chirp (CSS)**, développée par la société française Cycleo (Grenoble) puis rachetée par Semtech en 2012. Elle vise des communications longue portée et faible consommation pour le M2M et l'IoT. Elle utilise les bandes ISM sub-GHz : **169, 433, 868 MHz (Europe, Afrique)** et **915 MHz** (Amériques), avec des largeurs de bande de **125, 250 ou 500 kHz**.

Le **facteur d'étalement** (*Spreading Factor*, **SF7 à SF12**) règle le compromis portée/débit : SF élevé = portée plus grande, débit plus faible, temps d'émission plus long (donc plus d'énergie). Les débits vont de **0,3 à 50 kbit/s** ; la portée est de **2 à 5 km en milieu urbain** et peut dépasser **15 km en zone rurale dégagée**. La forte sensibilité du récepteur (jusqu'à environ -137 dBm) vient du gain d'étalement chirp. Les messages sont petits (quelques dizaines à environ 240 octets).

**LoRaWAN** est le protocole de **couche MAC et réseau** normalisé par la **LoRa Alliance** au-dessus de LoRa. Son architecture est en **étoile d'étoiles** :

![Architecture LoRaWAN en étoile d'étoiles](/figures/iot/lorawan.svg)

- **Nœuds terminaux** (*end devices*) : capteurs/actionneurs avec radio LoRa ;
- **Passerelles** (*gateways*) : reçoivent les trames radio et les transmettent au serveur réseau par IP (Ethernet, 4G). Elles sont « transparentes » : un message est reçu par **toutes les passerelles à proximité**, ce qui crée de la **redondance** et améliore la **résilience** (le serveur réseau supprime les doublons) ;
- **Serveur réseau** (*Network Server*) : déduplication, adaptation du débit (ADR), gestion des accusés de réception, sécurité de la couche réseau ;
- **Serveur applicatif** (*Application Server*) : déchiffre et traite les données applicatives ; **Join Server** pour l'activation.

**Classes d'appareils** :


| Classe | Réception | Consommation | Usage |
|---|---|---|---|
| A (*All*) | Deux brèves fenêtres après chaque émission (RX1, RX2) | La plus faible (obligatoire) | Capteurs sur pile : poubelles, humidité du sol |
| B (*Beacon*) | Fenêtres supplémentaires planifiées par balise de synchronisation | Moyenne | Actionneurs nécessitant une commande planifiée |
| C (*Continuous*) | Écoute quasi permanente | Élevée (secteur ou panneau solaire) | Actionneurs : vannes, éclairage |


**Sécurité LoRaWAN** : chiffrement **AES-128** de bout en bout ; clés de session **NwkSKey** (intégrité/authentification, MIC) et **AppSKey** (chiffrement de la charge utile) dérivées de l'**AppKey** par **OTAA** (*Over-The-Air Activation*, recommandée) ; compteurs de trames anti-rejeu ; **ABP** (*Activation By Personalization*, clés préchargées, moins sûre). **ADR** (*Adaptive Data Rate*) ajuste SF et puissance selon la qualité du lien pour économiser l'énergie et la capacité.

**Limites** : débit faible, latence, **duty cycle** (en Europe 1 % : un appareil ne peut émettre que 1 % du temps), accès aléatoire de type ALOHA (collisions quand la densité augmente), liaison descendante limitée, absence de garantie de latence : inadapté à la voix, à la vidéo, au temps réel strict.

:::retenir LoRa ou LoRaWAN ?
**LoRa** = la modulation radio (couche physique). **LoRaWAN** = le protocole réseau/MAC et l'architecture qui l'utilisent. On dit : « réseau LoRaWAN utilisant des modules LoRa ».
:::

#### Le MQTT (Message Queuing Telemetry Transport)

Protocole de messagerie **léger de type publication/abonnement** (*publish/subscribe*), conçu pour des dispositifs et réseaux limités (faible bande passante, latence élevée, connexions instables). Il distribue les messages **d'un à plusieurs** et ne se préoccupe pas du contenu de la charge utile (JSON, binaire, texte).

Les clients se connectent à un serveur appelé **courtier** (*broker*) ; ils jouent le rôle d'**éditeurs** (*publishers*, envoient des messages sur un **sujet** ou *topic*) ou d'**abonnés** (*subscribers*, reçoivent les messages des sujets auxquels ils sont abonnés). Éditeurs et abonnés ne se connaissent pas : ils sont **découplés** dans l'espace et le temps.

![Publication/abonnement MQTT via un broker](/figures/iot/mqtt.svg)

- **Transport** : TCP, port **1883** (clair) ou **8883** (TLS) ; en-tête minimal de 2 octets ; **MQTT-SN** pour réseaux non TCP.
- **Sujets hiérarchiques** : `ville/quartier1/poubelle42/niveau`. **Jokers** : `+` (un niveau) et `#` (plusieurs niveaux), par exemple `ville/+/poubelle42/niveau` ou `ville/#`.
- **Qualité de service (QoS)** : **0** = au plus une fois (« tire et oublie ») ; **1** = au moins une fois (accusé de réception, doublons possibles) ; **2** = exactement une fois (4 échanges, le plus lourd).
- **Fonctions utiles** : **retain** (le broker garde le dernier message d'un sujet pour les nouveaux abonnés), **Last Will and Testament** (message publié automatiquement si l'objet se déconnecte anormalement), **keep-alive**, sessions persistantes.
- **Sécurité** : identifiant/mot de passe, certificats clients, TLS, listes de contrôle d'accès (ACL) par sujet.
- **Brokers** : Eclipse Mosquitto, EMQX, HiveMQ, brokers cloud (AWS IoT Core, Azure IoT Hub).

#### Le Sigfox

Solution de connectivité LPWAN à très faible consommation, développée pour l'automatisation des bâtiments, les compteurs intelligents, l'agriculture et la sécurité. Elle utilise la technologie **bande ultra étroite (UNB)** : chaque message occupe environ **100 Hz** (dans une bande de 192 kHz) avec modulation **BPSK** ; les débits typiques sont de **100 à 600 bit/s**. Il utilise 868 MHz en Europe et 902-928 MHz ailleurs. Comme le récepteur n'écoute qu'une très petite portion du spectre, l'effet du bruit est réduit et la communication résiste bien aux brouillages. **Limites** : messages de **12 octets** au maximum, environ **140 messages par jour** en émission et très peu en réception (4 messages de 8 octets), couverture dépendant de l'opérateur. Le réseau Sigfox a connu des difficultés financières (reprise par UnaBiz en 2022), ce qui illustre le risque de dépendance à un opérateur propriétaire.

#### Le NB-IoT et le LTE-M

Technologies LPWAN **cellulaires** normalisées par le 3GPP (version 13, 2016) sur le **spectre licencié** des opérateurs mobiles, avec bonne pénétration en intérieur et sécurité des réseaux mobiles (carte SIM). **NB-IoT** (*Narrowband IoT*) : bande de 180 kHz, débits de quelques dizaines de kbit/s, très faible coût, pas de mobilité forte. **LTE-M** (Cat-M1) : débit de l'ordre du Mbit/s, mobilité, voix possible. Les modes **PSM** (*Power Saving Mode*) et **eDRX** permettent plus de **10 ans d'autonomie**. Inconvénient : dépendance à l'opérateur et abonnement.

#### Le NFC et la RFID

La **RFID** (*Radio Frequency Identification*) identifie des objets par radio : un **lecteur** interroge des **étiquettes** (tags) **passives** (alimentées par le champ du lecteur, sans pile, peu coûteuses) ou **actives** (avec pile, plus grande portée). Bandes : **LF** 125-134 kHz (quelques cm), **HF** 13,56 MHz (jusqu'à 1 m), **UHF** 860-960 MHz (jusqu'à 10 m, lecture simultanée de nombreux tags : logistique, inventaire).

Le **NFC** (*Near Field Communication*, champ proche) est un sous-ensemble de la RFID HF, développé conjointement par **Philips et Sony**. Il permet un échange de données **d'égal à égal (P2P)**, sur de très courtes distances (environ 4 cm), par **induction magnétique** lorsque les appareils sont rapprochés. Fréquence **13,56 MHz**, débits de **106, 212 ou 424 kbit/s**. Le lecteur émet un champ magnétique qui crée un pont dans l'espace entre deux dispositifs NFC ; une bobine du dispositif client reconvertit le champ en impulsions électriques. Il peut servir à établir ensuite une liaison Wi-Fi ou Bluetooth. Usages : paiement sans contact, badges, billets, appairage rapide ; la communication est rapide car il n'y a pas d'appairage manuel.

#### Le CoAP (Constrained Application Protocol)

Protocole de transfert web conçu pour des **dispositifs et réseaux contraints** (à faible puissance et avec pertes). Ces dispositifs ont généralement très peu de mémoire vive et un processeur de 8 bits au maximum. CoAP fonctionne efficacement même sur des réseaux à forte perte de paquets, avec des taux d'erreur élevés et une bande passante de l'ordre du kilobit.

- Normalisé par la **RFC 7252** ; fonctionne sur **UDP** (port 5683 ; **DTLS** sur 5684) ; en-tête de 4 octets ;
- modèle **requête/réponse RESTful** comme HTTP (GET, POST, PUT, DELETE) mais très léger ; messages **confirmables** (avec accusé de réception) ou **non confirmables** ;
- option **Observe** (l'abonné est notifié à chaque changement) ; découverte de ressources ; traduction facile vers HTTP.

#### HTTP/REST, AMQP, LwM2M, OPC UA

- **HTTP/HTTPS (REST)** : universel, compatible avec le web et les API, mais verbeux (en-têtes), avec connexion TCP : plutôt pour les appareils non contraints, les passerelles et les applications.
- **AMQP** : messagerie fiable orientée entreprise (files d'attente), utilisée entre serveurs.
- **LwM2M** (*Lightweight M2M*) : gestion d'appareils (configuration, supervision, mises à jour) au-dessus de CoAP.
- **OPC UA** : standard d'interopérabilité industrielle (modélisation des données, sécurité).

#### Les réseaux cellulaires (5G, 4G, 3G, 2G)

Les générations de communication mobile vont de la 2G (GSM/GPRS/SMS, très répandue, adaptée aux petits volumes) à la 5G. Les appareils basés sur ces standards communiquent via les réseaux cellulaires des opérateurs (carte SIM/eSIM) avec **large couverture**, mobilité et sécurité, au prix d'une **consommation plus élevée** et d'**abonnements**. La 2G reste utilisée en Afrique pour la géolocalisation et les compteurs (modules SIM800, SIM900) ; la 4G/LTE-M, la 5G et le NB-IoT prennent la relève.

#### Comparaison des technologies sans fil


| Technologie | Portée typique | Débit | Fréquence | Énergie | Usage typique |
|---|---|---|---|---|---|
| NFC | ~4 cm | 106-424 kbit/s | 13,56 MHz | Très faible | Paiement, badge |
| Bluetooth classique | 10-100 m | 1-3 Mbit/s | 2,4 GHz | Moyenne | Audio, périphériques |
| BLE | 10-100 m | 1-2 Mbit/s | 2,4 GHz | Très faible | Wearables, balises |
| Zigbee | 10-100 m (maillé) | 250 kbit/s | 2,4 GHz, 868/915 MHz | Faible | Domotique |
| Wi-Fi | 30-100 m | jusqu'à Gbit/s | 2,4/5/6 GHz | Élevée | Caméras, maison |
| LoRaWAN | 2-15 km | 0,3-50 kbit/s | 868/915 MHz | Très faible | Capteurs urbains et ruraux |
| Sigfox | 3-50 km | 100-600 bit/s | 868/902 MHz | Très faible | Compteurs, suivi simple |
| NB-IoT | 1-10 km (réseau mobile) | ~30-250 kbit/s | Bandes LTE licenciées | Faible (PSM) | Compteurs, objets en intérieur |
| LTE-M | Réseau mobile | ~1 Mbit/s | Bandes LTE licenciées | Moyenne | Objets mobiles, voix |
| 2G/4G/5G | Réseau mobile | kbit/s à Gbit/s | Bandes licenciées | Moyenne à élevée | Suivi de véhicules, vidéo |


#### Comparaison des protocoles applicatifs


| Critère | MQTT | CoAP | HTTP/REST |
|---|---|---|---|
| Modèle | Publication/abonnement via broker | Requête/réponse (REST), Observe | Requête/réponse |
| Transport | TCP | UDP | TCP |
| Poids du protocole | Très léger (en-tête 2 octets) | Très léger (4 octets) | Lourd (en-têtes texte) |
| Fiabilité | QoS 0, 1, 2 | Messages confirmables | Via TCP |
| Idéal pour | Télémétrie, flux de capteurs, notifications | Appareils très contraints, réseaux avec pertes | Applications web, API, appareils puissants |


#### Guide de choix d'un réseau


| Besoin | Choix probable | Justification |
|---|---|---|
| Capteurs sur pile, petits messages, grande étendue (ville, champs) | LoRaWAN, NB-IoT | Très faible consommation, longue portée, faible coût |
| Débit élevé (vidéo, caméra) | Wi-Fi, Ethernet, 4G/5G | Bande passante suffisante |
| Objets mobiles à grande échelle (véhicules) | 4G/LTE-M, GPS+GSM | Couverture et mobilité |
| Domotique intérieure, nombreux capteurs | Zigbee, Thread, BLE | Maillage, faible consommation |
| Identification de proximité | NFC, RFID | Courte portée, sans pile |
| Réseau privé sans abonnement | LoRaWAN privé, Wi-Fi | Infrastructure propre |


:::examen Justifier le choix de LoRaWAN en milieu urbain (question d'examen)
Cinq arguments : (1) **longue portée** (2 à 5 km en ville) : peu de passerelles pour couvrir une ville ; (2) **faible consommation** : capteurs sur pile pendant plusieurs années (peu de maintenance) ; (3) **faible coût** des modules et des passerelles, fréquences libres **sans abonnement** ; (4) **forte capacité** : des milliers de capteurs par passerelle, redondance entre passerelles ; (5) **sécurité intégrée** AES-128 et bonne pénétration des bâtiments. Les messages (niveau de remplissage) sont petits et peu fréquents : le faible débit n'est donc pas un problème. **Limites à mentionner** : débit faible, duty cycle, pas de temps réel.
:::
