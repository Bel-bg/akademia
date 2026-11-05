### 1.1.1 Définition

L'**Internet des Objets**, ou **IoT** (*Internet of Things*), désigne un réseau d'objets physiques connectés à Internet, capables de **collecter, échanger et traiter des données** sans intervention humaine directe. Ces objets, aussi appelés **objets connectés**, peuvent être des capteurs, des appareils ménagers, des véhicules, des équipements industriels, des compteurs, des animaux équipés de colliers, etc.

L'IoT peut aussi être défini comme l'interconnexion entre Internet et des objets, des lieux et des environnements physiques : un nombre croissant d'objets sont reliés à Internet, ce qui permet une communication entre nos biens dits « physiques » et leur existence numérique. Ces connexions génèrent de nouvelles masses de données et donc de nouvelles connaissances.

La définition normative de l'**UIT-T** (recommandation Y.2060, 2012) est la suivante : l'IoT est une « infrastructure mondiale pour la société de l'information, qui permet de disposer de services évolués en interconnectant des objets (physiques ou virtuels) grâce aux technologies de l'information et de la communication interopérables existantes ou en évolution ».

L'objectif principal de l'IoT est de rendre ces objets **intelligents** : leur permettre d'interagir entre eux et avec les systèmes numériques afin d'améliorer l'efficacité, la prise de décision et de créer de nouvelles expériences pour les utilisateurs.

:::exemple Exemples simples
- **Maison intelligente** : les lumières s'allument automatiquement selon la présence des habitants ; un thermostat ajuste la température selon vos habitudes.
- **Agriculture** (exemple typique d'examen) : des capteurs d'humidité du sol mesurent l'état d'une parcelle, les mesures sont envoyées par LoRaWAN vers une plateforme ; lorsque l'humidité passe sous un seuil, une électrovanne est ouverte automatiquement et l'agriculteur reçoit une notification sur son téléphone.
:::

:::retenir Formule de base
**Objet connecté** = capteur(s) + actionneur(s) éventuel(s) + intelligence (microcontrôleur) + moyen de communication + source d'énergie + identité unique.

**Système IoT** = objets connectés + réseau de communication + plateforme de traitement (edge/cloud) + application utilisateur + sécurité.
:::

![Boucle de fonctionnement d'un système IoT : capter, communiquer, traiter, agir](/figures/iot/boucle.svg)

#### IoT, M2M, IIoT, IoMT : ne pas confondre


| Terme | Signification | Particularités |
|---|---|---|
| IoT | Internet of Things : objets connectés à Internet, tous secteurs | Basé sur IP, plateformes cloud, applications et analyse de données |
| M2M | Machine-to-Machine : communication directe entre machines | Souvent point à point, réseau cellulaire (GSM/SMS), solutions propriétaires et fermées ; ancêtre de l'IoT |
| IIoT | Industrial IoT : IoT appliqué à l'industrie (Industrie 4.0) | Exigences élevées de fiabilité, temps réel, sécurité ; protocoles OPC UA, Modbus |
| IoMT | Internet of Medical Things : objets médicaux connectés | Données de santé très sensibles, contraintes réglementaires fortes |
| WoT | Web of Things : objets exposés via les standards du Web (HTTP, REST, JSON) | Facilite l'interopérabilité au niveau applicatif |
| CPS | Cyber-Physical Systems : systèmes mêlant calcul et processus physiques | Notion théorique proche de l'IoT, utilisée en automatique et en robotique |


### 1.1.2 Caractéristiques clés de l'IoT

Voici les caractéristiques fondamentales d'un système IoT :

- **Connectivité** : les objets sont connectés à Internet ou à un réseau local (Wi-Fi, LoRaWAN, cellulaire, etc.). Sans connectivité, il n'y a pas d'IoT.
- **Communication** : les objets échangent des données entre eux et avec des serveurs centralisés, en suivant des protocoles (MQTT, CoAP, HTTP).
- **Automatisation et contrôle** : les objets prennent des décisions à partir d'algorithmes ou de règles prédéfinies, sans intervention humaine permanente.
- **Collecte et analyse des données** : les capteurs enregistrent des informations en temps réel pour des analyses présentes et futures (statistiques, prédiction, alertes).
- **Identification unique** : chaque objet est identifiable (adresse IP, adresse MAC, identifiant DevEUI en LoRaWAN, identifiant RFID).
- **Hétérogénéité** : les objets sont très variés (puissance de calcul, énergie, protocoles, fabricants) et doivent pourtant coopérer.
- **Contraintes de ressources** : mémoire, puissance de calcul et énergie limitées, ce qui impose des protocoles légers.
- **Sensibilité au contexte et autonomie** : l'objet perçoit son environnement et adapte son comportement sans commande humaine.
- **Évolutivité** : capacité à passer de quelques dizaines à des milliers voire millions d'objets.

:::examen Comment répondre à « Donnez trois caractéristiques fondamentales d'un système IoT et expliquez leur importance »
Choisissez trois caractéristiques, puis pour chacune écrivez : **le nom**, **une définition en une phrase**, **pourquoi c'est important** (une conséquence concrète). Exemple : *Connectivité* : capacité des objets à échanger des données via un réseau ; sans elle, les mesures resteraient isolées dans l'objet et ne pourraient ni être analysées ni déclencher d'actions à distance.
:::

### 1.1.3 Bref historique de l'IoT

L'IoT est le fruit de plusieurs décennies d'avancées dans les réseaux, l'informatique et les systèmes embarqués.

![Frise chronologique de l'histoire de l'IoT](/figures/iot/timeline.svg)

#### Les prémices : années 1980-1990

- **1982** : un distributeur de Coca-Cola de l'Université Carnegie Mellon est relié au réseau du département d'informatique. Il indique le nombre de bouteilles disponibles et si elles sont fraîches : c'est l'un des tout premiers appareils connectés.
- **1990** : John Romkey présente un grille-pain contrôlable via Internet (protocole SNMP) lors du salon Interop.
- **1991** : Mark Weiser (Xerox PARC) publie sa vision de l'**informatique ubiquitaire** (*ubiquitous computing*) : les objets de tous les jours deviennent intelligents et communicants. La même année, la machine à café du laboratoire de Cambridge (« Trojan Room ») est équipée d'une caméra, puis mise en ligne sur le Web en 1993.

#### Naissance du terme « IoT » : années 1990-2000

- **1999** : **Kevin Ashton**, cofondateur de l'Auto-ID Center au MIT, utilise pour la première fois l'expression « Internet of Things » dans le cadre de projets liés à la **RFID** (identification par radiofréquence) pour la chaîne logistique. La même année, le protocole MQTT est conçu par Andy Stanford-Clark (IBM) et Arlen Nipper pour superviser des pipelines pétroliers par satellite.
- **2000** : les premiers appareils « smart » apparaissent, comme les réfrigérateurs connectés.

#### Expansion et popularisation : années 2000-2010

- Avec le déploiement de l'Internet haut débit et l'évolution des technologies sans fil (Wi-Fi, Bluetooth, ZigBee, GSM), l'IoT gagne du terrain. **2005** : l'UIT publie un rapport sur l'« Internet des objets ».
- **2008-2009** : selon Cisco, le nombre d'objets connectés dépasse celui des êtres humains connectés : c'est considéré comme la « naissance » de l'IoT.
- Les géants de la technologie, comme Google, Cisco, IBM, Amazon et Microsoft, investissent dans des plateformes IoT. Apparition des cartes accessibles (Arduino en 2005, Raspberry Pi en 2012) qui démocratisent le prototypage.

#### L'ère moderne : 2010 à aujourd'hui

- **2010-2012** : naissance des réseaux LPWAN (Sigfox, puis LoRa racheté par Semtech en 2012) ; lancement mondial d'IPv6 (2012) qui résout la pénurie d'adresses.
- **2014** : MQTT devient une norme OASIS, CoAP est standardisé (RFC 7252), l'enceinte Amazon Echo est lancée.
- **2015-2016** : création de la LoRa Alliance et du LoRaWAN ; standardisation du NB-IoT (3GPP version 13) ; attaque du botnet **Mirai** (octobre 2016) qui détourne des caméras et routeurs mal protégés.
- **2019** : déploiement commercial de la **5G**. **2022** : lancement du standard domotique **Matter**.
- L'IoT s'intègre dans tous les domaines : santé, agriculture, ville intelligente, industrie, et même applications militaires. L'arrivée de la 5G, de l'**edge computing** et de l'**IA embarquée** accélère son adoption. Aujourd'hui, l'IoT est au cœur de la transformation numérique, avec des milliards de dispositifs connectés dans le monde.


| Période | Événement marquant | Importance |
|---|---|---|
| 1982 | Distributeur de Coca-Cola connecté (CMU) | Premier objet connecté célèbre |
| 1991 | Informatique ubiquitaire (Weiser) | Vision conceptuelle de l'IoT |
| 1999 | Terme « Internet of Things » (Ashton, MIT) | Naissance du nom, lié à la RFID |
| 2008-2009 | Plus d'objets que d'humains connectés | Passage à l'échelle |
| 2012 | IPv6 mondial, Raspberry Pi, LoRa (Semtech) | Adressage massif, matériel accessible |
| 2016 | NB-IoT, Mirai | LPWAN cellulaire, prise de conscience de la sécurité |
| 2019-2022 | 5G, Matter, TinyML | Connectivité massive, interopérabilité, IA embarquée |
