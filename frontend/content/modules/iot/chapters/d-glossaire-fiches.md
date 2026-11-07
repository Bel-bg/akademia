## Annexe D : Glossaire



| Terme | Définition |
|---|---|
| ADR | *Adaptive Data Rate* : adaptation automatique du débit/SF et de la puissance en LoRaWAN |
| Actionneur | Dispositif qui convertit une commande en action physique |
| AES | Algorithme de chiffrement symétrique par blocs (128, 192, 256 bits) |
| AMQP | Protocole de messagerie orienté files d'attente |
| BLE | Bluetooth Low Energy : Bluetooth à très faible consommation |
| Botnet | Réseau d'appareils infectés contrôlés à distance par un attaquant |
| Broker (courtier) | Serveur MQTT qui reçoit les messages publiés et les redistribue aux abonnés |
| CAN / ADC | Convertisseur analogique-numérique |
| CoAP | Protocole applicatif léger de type REST sur UDP |
| Cloud computing | Accès à des ressources informatiques distantes via Internet |
| Duty cycle | Pourcentage de temps pendant lequel un émetteur radio est autorisé à émettre |
| DTLS / TLS | Protocoles de sécurisation des communications (UDP / TCP) |
| Edge computing | Traitement des données près de leur source |
| Firmware | Logiciel embarqué dans un microcontrôleur |
| Fog computing | Couche de calcul intermédiaire entre edge et cloud |
| GPIO | Broche d'entrée/sortie à usage général d'un microcontrôleur |
| Gateway (passerelle) | Équipement reliant des réseaux de technologies différentes et traduisant les protocoles |
| I2C / SPI / UART | Bus de communication série entre composants |
| IPv6 | Protocole Internet à adresses de 128 bits |
| LPWAN | Réseau étendu à faible consommation (LoRaWAN, Sigfox, NB-IoT) |
| LoRa / LoRaWAN | Modulation radio longue portée / protocole réseau associé |
| M2M | Communication entre machines |
| MQTT | Protocole de publication/abonnement léger sur TCP |
| NFC / RFID | Communication champ proche / identification par radiofréquence |
| OTA | *Over-The-Air* : mise à jour ou activation à distance par radio |
| OTAA / ABP | Modes d'activation LoRaWAN : par échange sur radio (sûr) / clés préchargées |
| PIR | Capteur infrarouge passif de mouvement |
| PWM | Modulation de largeur d'impulsion |
| QoS | Qualité de service (MQTT : 0, 1, 2) |
| RTOS | Système d'exploitation temps réel |
| Scalabilité | Capacité à supporter la montée en charge |
| SoC | Système sur puce |
| Store-and-forward | Stockage local des données puis envoi quand la liaison revient |
| TinyML | Apprentissage automatique sur microcontrôleurs |
| Watchdog | Minuterie de surveillance qui redémarre le système en cas de blocage |
| Zigbee | Réseau maillé basse consommation sur IEEE 802.15.4 |



## Annexe E : Fiches de révision


### E.1 Dix points à connaître par cœur

1. IoT = objets + capteurs + connectivité + traitement + action, avec peu d'intervention humaine ; boucle capter → transmettre → traiter → agir.
2. Quatre couches : perception, réseau, traitement, application (+ sécurité et gestion transversales).
3. LoRa = modulation ; LoRaWAN = protocole réseau ; étoile d'étoiles ; classes A/B/C ; AES-128 ; portée 2-5 km en ville, 15 km et plus en rural ; 0,3-50 kbit/s.
4. MQTT = publish/subscribe via broker, TCP, QoS 0/1/2 ; CoAP = REST sur UDP ; HTTP = lourd.
5. Capteur : grandeur physique → signal électrique ; actionneur : commande → action physique.
6. Microcontrôleur = CPU + mémoire + périphériques sur une puce ; cerveau de l'objet.
7. Edge = traitement local, faible latence ; cloud = stockage et analyse massifs ; l'hybride est la règle.
8. Sécurité : chiffrement, authentification, intégrité (hachage/signature), mises à jour OTA signées, secure boot.
9. Autonomie : veille profonde, protocoles basse consommation, récupération d'énergie, moins de transmissions.
10. Résilience : décision locale, tampon store-and-forward, liaison de secours, alimentation de secours, watchdog.

### E.2 Formules et ordres de grandeur


| Grandeur | Formule / valeur |
|---|---|
| Autonomie | Capacité (mAh) / courant moyen (mA) |
| Courant moyen | (I<sub>actif</sub> × t<sub>actif</sub> + I<sub>veille</sub> × t<sub>veille</sub>) / période |
| Pas du CAN | q = V<sub>ref</sub> / 2<sup>n</sup> (10 bits, 5 V : 4,9 mV ; 12 bits, 3,3 V : 0,8 mV) |
| Distance ultrason | d = v × t / 2, v ≈ 340 m/s |
| Niveau de remplissage | (hauteur - distance mesurée) / hauteur |
| Shannon | f<sub>e</sub> ≥ 2 × f<sub>max</sub> |
| Débit utile LoRa | 0,3 à 50 kbit/s ; Sigfox 100-600 bit/s ; BLE 1-2 Mbit/s ; Zigbee 250 kbit/s |
| Portées | NFC 4 cm ; BLE/Zigbee 10-100 m ; Wi-Fi 30-100 m ; LoRa 2-15 km |
| Ports | MQTT 1883/8883 ; CoAP 5683/5684 ; HTTPS 443 |


### E.3 Tableau de synthèse : quel réseau pour quel besoin ?

Capteurs sur pile en extérieur et petits messages : **LoRaWAN/NB-IoT**. Domotique intérieure : **Zigbee/Thread/BLE**. Caméras : **Wi-Fi/Ethernet**. Véhicules : **4G/LTE-M + GPS**. Badge et paiement : **NFC/RFID**. Zone sans couverture : **satellite**.


## Annexe F : Précisions et corrections apportées au cours d'origine


Pour que vos révisions soient exactes, voici les points du support initial qui ont été **précisés ou corrigés** dans cette version :


| Sujet | Cours d'origine | Version corrigée |
|---|---|---|
| Page de garde | « INTERNET DES OBBETS » | Internet des Objets |
| Wi-Fi 5,8 GHz | Bande de 5,8 GHz | Bande de **5 GHz** (et 6 GHz pour Wi-Fi 6E/7) |
| Wi-Fi 802.11n | 140 Mbit/s sur 5 GHz | Jusqu'à **600 Mbit/s** théoriques, en 2,4 et 5 GHz |
| Accès au canal Wi-Fi | Multiplexage TDMA et CSMA/CA | L'accès repose sur **CSMA/CA** (et OFDMA en Wi-Fi 6) |
| Bluetooth | 800 sauts par seconde | **1 600** sauts par seconde |
| LoRa | Portée de 15 à 20 km, débit de 27 à 50 kbit/s | **2-5 km en ville, 15 km et plus en zone rurale**, débit de **0,3 à 50 kbit/s** |
| Actionneurs | « Sept catégories » (cinq citées) | **Cinq familles** : électriques, pneumatiques, hydrauliques, thermiques, mécaniques |
| Nombre d'objets | Plus de 30 milliards d'ici 2030 | Estimations de **30 à 40 milliards** selon les sources |
| Sigfox | Présenté sans réserve | Limites de messages et difficultés de l'opérateur |
