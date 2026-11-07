Les capteurs, les actionneurs et les objets connectés sont des **composants fondamentaux** de l'IoT et collaborent pour collecter, traiter et agir sur des données. Les objets connectés intègrent des capteurs et des actionneurs capables de communiquer (Wi-Fi, Bluetooth ou tout autre protocole) pour transmettre ou recevoir des données via des réseaux.

### 2.2.1 Capteurs

#### Définition

Un **capteur** est un dispositif qui **mesure une grandeur physique** provenant de l'environnement et la **convertit en un signal électrique** exploitable. Il génère une réponse à un stimulus externe (grandeur d'entrée appelée **mesurande**) : par exemple la chaleur est convertie en signal électrique dans un capteur de température, la pression atmosphérique dans un baromètre.

Trois propriétés idéales d'un capteur : il n'est **sensible qu'à la grandeur mesurée** (un capteur de température ne réagit pas à la lumière ou à la pression), il est **insensible aux autres grandeurs** (grandeurs d'influence) et il **n'influence pas la grandeur mesurée** (la mesure ne change pas la température).

**Exemple** : un capteur de température est placé dans une pièce et mesure en permanence. En cas d'incendie, la température augmente ; le capteur remarque ce changement et communique l'information à un moniteur distant par l'intermédiaire du processeur.

#### Structure d'un capteur

Un capteur se compose généralement d'un **corps d'épreuve** (élément sensible qui réagit au mesurande), d'un **transducteur** (qui convertit l'effet en signal électrique) et d'un **conditionneur/circuit de traitement** (amplification, filtrage, linéarisation, conversion) délivrant une sortie analogique (tension, courant), numérique (I2C, SPI, 1-Wire) ou logique (tout-ou-rien).

#### Classification

- **Selon la grandeur mesurée** : température, humidité, pression, lumière, gaz, distance, mouvement, accélération, position (GPS), niveau, débit, courant, pH, etc.
- **Passif ou actif** : un capteur **passif** modifie une propriété électrique sans alimentation propre pour la mesure (thermistance, LDR) ; un capteur **actif** génère un signal (thermocouple, cellule photovoltaïque) ou émet un signal et analyse le retour (ultrason, radar, lidar).
- **Selon la sortie** : analogique, numérique, tout-ou-rien (logique).

#### Caractéristiques métrologiques


| Caractéristique | Définition | Exemple |
|---|---|---|
| Étendue de mesure | Plage entre la plus petite et la plus grande valeur mesurables | DS18B20 : -55 à +125 °C |
| Sensibilité | Variation de la sortie par unité de mesurande | LM35 : 10 mV par °C |
| Résolution | Plus petite variation détectable | 0,0625 °C (DS18B20 à 12 bits) |
| Précision / justesse | Écart entre la mesure et la valeur vraie | ±0,5 °C |
| Fidélité (répétabilité) | Dispersion des mesures répétées dans les mêmes conditions | Faible dispersion = capteur fidèle |
| Linéarité | Proportionnalité entre sortie et mesurande | Souvent corrigée par étalonnage |
| Temps de réponse | Délai pour atteindre la valeur finale | Capteur de gaz : plusieurs secondes |
| Dérive | Variation lente avec le temps ou la température | Nécessite un réétalonnage |


#### Types de capteurs utilisés en IoT


| Capteur | Grandeur | Références courantes | Remarques |
|---|---|---|---|
| Température | °C | DS18B20 (1-Wire), LM35 (analogique), DHT22, BME280 | Étanche pour le DS18B20 |
| Humidité de l'air | % HR | DHT11/DHT22, BME280, SHT31 | DHT22 : ±2 à 5 % HR |
| Humidité du sol | % | Capacitif (préféré), résistif YL-69 | Le résistif se corrode |
| Pression / altitude | hPa | BMP280, BME280 | Météo, altimétrie |
| Ultrason (distance, niveau) | cm | HC-SR04, JSN-SR04T (étanche) | Distance = v × t / 2 |
| Infrarouge de présence (PIR) | Mouvement | HC-SR501 | Détecte la chaleur corporelle |
| Capteur de gaz | ppm | MQ-2 (fumée/GPL), MQ-135 (qualité de l'air) | Chauffe, étalonnage |
| Flamme / lumière / UV | Intensité | Capteur IR de flamme, LDR, UVA | Détection d'incendie |
| Courant / tension | A, V | ACS712, INA219 | Suivi de consommation |
| Accélération / mouvement | m/s² | MPU6050, ADXL345 | Vibrations, chocs |
| Position | Coordonnées | GPS NEO-6M | Suivi de flotte |
| Poids | kg | Cellule de charge + HX711 | Silos, stocks |
| Identification | ID | Lecteur RFID RC522, lecteur QR | Contrôle d'accès |
| Image | Pixels | ESP32-CAM, caméras IP | Surveillance, IA |
| Eau | pH, turbidité, O<sub>2</sub> dissous, conductivité | Sondes dédiées | Pisciculture, qualité de l'eau |
| Santé | Rythme, SpO<sub>2</sub> | MAX30102 | Wearables |


#### La chaîne d'acquisition

![Chaîne d'acquisition : capteur, conditionnement, CAN, microcontrôleur](/figures/iot/acquisition.svg)

Le signal analogique du capteur est conditionné (amplifié, filtré) puis converti en nombre par un **CAN** (convertisseur analogique-numérique) avant d'être lu par le microcontrôleur. Deux notions clés :

- **Échantillonnage** : la fréquence d'échantillonnage doit respecter le **théorème de Shannon** : f<sub>e</sub> ≥ 2 × f<sub>max</sub> du signal pour ne pas perdre d'information.
- **Résolution du CAN** : pour un CAN de **n bits** et une tension de référence V<sub>ref</sub>, le **pas de quantification** est **q = V<sub>ref</sub> / 2<sup>n</sup>**.

:::exemple Calculs de base
- CAN 10 bits (Arduino Uno), V<sub>ref</sub> = 5 V : q = 5 / 1024 ≈ **4,9 mV**.
- CAN 12 bits (ESP32), V<sub>ref</sub> = 3,3 V : q = 3,3 / 4096 ≈ **0,8 mV**.
- **Capteur ultrason HC-SR04** : l'onde (vitesse du son ≈ 340 m/s) fait l'aller-retour ; si le temps d'écho est de 1 176 µs, la distance est d = 340 × 0,001176 / 2 ≈ 0,20 m = **20 cm**. Pour une poubelle de **100 cm** de profondeur, le niveau de remplissage est (100 - 20) / 100 = **80 %** : seuil d'alerte atteint.
:::

### 2.2.2 Actionneurs

#### Définition

Un **actionneur** est un dispositif qui **effectue une action physique en réponse à une commande**. Il peut être considéré comme un composant d'une machine ou d'un système qui agit sur le mouvement ou contrôle le mécanisme ou le système. Les systèmes de contrôle modifient l'environnement par l'intermédiaire des actionneurs : le système active l'actionneur par un **signal de commande** (numérique ou analogique) et suscite une réponse qui se traduit par une forme de mouvement ou d'effet physique. La commande peut venir d'un système électronique, d'un logiciel, d'un être humain, etc.

Reprenons l'exemple de la température : lorsque le capteur communique l'information au processeur, celui-ci ordonne l'ouverture des buses (ou d'un extincteur) pour éteindre le feu. Le processeur convertit les commandes en séquences de commandes en langage machine qui permettent à la buse de s'ouvrir.

#### Catégories d'actionneurs

On classe les actionneurs selon **l'énergie** qu'ils utilisent :

- **électriques** (moteurs, relais, électroaimants, résistances chauffantes, buzzers, LED) : les plus courants en IoT ;
- **pneumatiques** (air comprimé : vérins) ;
- **hydrauliques** (huile sous pression : fortes forces) ;
- **thermiques** (résistance chauffante, alliages à mémoire de forme) ;
- **mécaniques / magnétiques / piézoélectriques**.

*(Le cours d'origine annonce « sept catégories » mais n'en énumère que cinq : retenez ces cinq familles.)*

#### Actionneurs courants en IoT


| Actionneur | Fonction | Commande | Exemple d'usage |
|---|---|---|---|
| Relais (électromécanique ou statique SSR) | Commuter une charge forte (230 V) avec un signal faible | Sortie GPIO + transistor | Pompe, lampe, ventilateur |
| LED / bandeau | Signalisation, éclairage | GPIO + résistance, PWM | Éclairage d'alerte |
| Buzzer / sirène | Alarme sonore | GPIO / PWM | Alarme d'intrusion |
| Moteur à courant continu | Rotation continue | PWM + pont en H (L298N) | Ventilateur, roue |
| Servomoteur | Position angulaire précise | PWM 50 Hz (impulsion 1 à 2 ms) | Volet, serrure |
| Moteur pas à pas | Rotation par incréments | Driver (A4988, ULN2003) | Imprimante, vanne |
| Électrovanne | Ouvrir/fermer un fluide | Relais ou MOSFET | Irrigation, distribution d'eau |
| Vérin | Mouvement linéaire | Relais/pont en H | Fenêtre, porte |
| Pompe | Déplacer un liquide | Relais, MOSFET, PWM | Arrosage, aquaculture |
| Buse | Projection de liquide | Électrovanne | Extinction, pulvérisation |
| Écran / afficheur | Affichage d'information | I2C/SPI | Panneau d'information |


:::attention Précautions d'interfaçage
Un microcontrôleur ne peut fournir que quelques dizaines de mA par broche : **ne jamais brancher directement** un moteur, un relais ou une pompe. Utiliser un **transistor/MOSFET** ou un **driver**, une **diode de roue libre** pour les charges inductives, une **alimentation séparée** et une **isolation galvanique** (optocoupleur) pour les charges en 230 V.
:::

### 2.2.3 Objets connectés

Un **objet connecté** (*smart object*) combine plusieurs briques : un ou plusieurs **capteurs**, éventuellement des **actionneurs**, un **microcontrôleur** (intelligence embarquée), un **module de communication**, une **source d'énergie** (pile, batterie, solaire, secteur) et un **identifiant unique**. Exemples : montre connectée, thermostat, compteur intelligent, ampoule connectée, collier GPS, poubelle intelligente, station météo.

La norme **RFC 7228** classe les dispositifs contraints : **classe 0** (très petits : bien moins de 10 Ko de RAM, nécessitent une passerelle), **classe 1** (~10 Ko de RAM, ~100 Ko de flash : CoAP, pile IP allégée), **classe 2** (~50 Ko de RAM, ~250 Ko de flash : pile IP plus complète). Au-delà, on est dans les dispositifs non contraints (Raspberry Pi, smartphone).

Les objets sont reliés au reste du système soit **directement** (Wi-Fi, cellulaire), soit via une **passerelle** (*gateway*) qui traduit les protocoles locaux (BLE, Zigbee, LoRa) vers IP et peut aussi faire du traitement en périphérie.
