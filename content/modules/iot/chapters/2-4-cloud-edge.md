### 2.4.1 Le cloud computing

Le **cloud computing** est une infrastructure informatique permettant d'**accéder à des ressources** (stockage, calcul, applications) **à distance via Internet**. Dans l'IoT, il permet de **centraliser la collecte, le stockage et l'analyse** des données provenant des appareils connectés, en offrant une **puissance de traitement scalable** pour des tâches complexes comme l'**intelligence artificielle** ou le **big data**.

- **Modèles de service** : **IaaS** (infrastructure : machines virtuelles), **PaaS** (plateforme : bases de données, brokers, moteurs de règles), **SaaS** (logiciel clé en main : tableaux de bord).
- **Plateformes IoT** : AWS IoT Core, Microsoft Azure IoT Hub, ThingsBoard, The Things Network/Stack (LoRaWAN), ThingSpeak, Blynk, Node-RED (orchestration), Grafana et InfluxDB (visualisation et séries temporelles). *Google Cloud IoT Core a été arrêté en 2023.*
- **Avantages** : capacité quasi illimitée, élasticité (*scalabilité*), analyse avancée (IA), accessibilité de partout, coût à l'usage, sauvegardes.
- **Inconvénients** : **latence** (aller-retour Internet de 50 à plus de 200 ms), dépendance à la connexion, coûts récurrents, **confidentialité** (données hors du site), dépendance au fournisseur.

### 2.4.2 Le edge computing

Le **edge computing** (informatique en périphérie) **déplace les capacités de traitement et d'analyse des données au plus près de la source** (les objets connectés). Cela **réduit la latence**, **optimise les performances**, **diminue la dépendance au cloud** pour les données critiques, tout en **renforçant la confidentialité**. Dans l'IoT, il est souvent utilisé pour traiter localement les données des capteurs et **réagir en temps réel**. Le traitement peut se faire dans l'objet (microcontrôleur), sur une **passerelle** ou sur un **mini-serveur local** (Raspberry Pi, PC industriel). Le **fog computing** est une couche intermédiaire entre le edge et le cloud ; le **MEC** (*Multi-access Edge Computing*) place des serveurs dans le réseau de l'opérateur.

![Architecture hybride objets, edge/fog et cloud](/figures/iot/cloudedge.svg)

**Tâches typiques d'une passerelle edge** : filtrage et agrégation des données, **conversion de protocoles** (BLE/Zigbee/LoRa vers MQTT/IP), règles locales (si température supérieure au seuil alors alarme), **inférence IA locale** (TinyML), **mémorisation tampon** (*store-and-forward*) en cas de coupure, chiffrement, authentification locale.

### 2.4.3 Exemple pédagogique : la montre connectée

Vous rentrez à la maison un soir après une journée de travail compliquée. Votre rythme cardiaque est très élevé : la montre connectée relève cette information et l'envoie à votre enceinte, qui joue une chanson relaxante, et à la lampe, qui adoucit l'éclairage. Le rythme cardiaque est relevé à chaque instant et l'ambiance doit être créée **de façon instantanée**.

Si les informations devaient d'abord être envoyées dans le **cloud**, il y aurait un temps de transmission, de traitement puis de retour de la commande. C'est pourquoi le **edge computing** permet que les données qui nécessitent des **commandes en temps réel** soient traitées **en local**, soit par l'objet connecté (via le système embarqué intégré), soit par un ordinateur ou un serveur à proximité. Les autres données sont ensuite envoyées au cloud pour le **traitement global**.

**En résumé** : le cloud permet de **stocker et d'analyser de grandes quantités de données**, tandis que le edge permet de **traiter certaines données localement**, à proximité des objets, pour **réduire la latence et les coûts de transmission**. Cette **approche hybride** optimise les performances des systèmes IoT.

### 2.4.4 Comparaison cloud, fog et edge


| Critère | Edge | Fog | Cloud |
|---|---|---|---|
| Emplacement du traitement | Dans/près de l'objet | Réseau local, passerelles, mini-serveurs | Centres de données distants |
| Latence | Très faible (ms) | Faible | Plus élevée (dizaines à centaines de ms) |
| Puissance de calcul | Limitée | Moyenne | Quasi illimitée |
| Dépendance à Internet | Faible : fonctionne hors ligne | Moyenne | Forte |
| Bande passante consommée | Très faible (données filtrées) | Réduite | Élevée (toutes les données brutes) |
| Confidentialité | Meilleure (données gardées sur place) | Bonne | Dépend du fournisseur, données hors site |
| Stockage | Limité, temporaire | Moyen | Massif, durable |
| Usage typique | Alarme immédiate, régulation, IA légère | Agrégation par site/quartier | Historique, IA lourde, tableaux de bord globaux |


:::exemple Économie de bande passante
1 000 capteurs envoient chacun un message de 200 octets par seconde vers le cloud : 200 Ko/s, soit environ **17 Go par jour**. Si une passerelle edge ne remonte qu'une **moyenne par minute** (au lieu de 60 mesures), le volume est divisé par **60** (environ 0,3 Go/jour), et les alarmes critiques sont traitées localement en quelques millisecondes.
:::

### 2.4.5 Chaîne de traitement des données (pipeline IoT)

1. **Acquisition** (capteurs, microcontrôleur) ;
2. **Transmission** (LoRaWAN, Wi-Fi, 4G) vers une passerelle ;
3. **Ingestion** (broker MQTT, serveur réseau) ;
4. **Traitement en flux** (décodage, nettoyage, règles d'alerte, enrichissement) ;
5. **Stockage** (base de **séries temporelles** : InfluxDB, TimescaleDB ; base relationnelle pour les métadonnées ; stockage d'objets pour les archives) ;
6. **Analyse** (statistiques, IA, prévision, maintenance prédictive) ;
7. **Restitution** (tableau de bord, API, notifications push/SMS/e-mail).

### 2.4.6 Quand choisir edge ou cloud ?

- **Edge** quand : latence critique (alarme, sécurité), connexion intermittente, données volumineuses (vidéo), confidentialité forte, coût de transmission élevé.
- **Cloud** quand : historique à long terme, analyses lourdes (IA), vision globale multi-sites, mutualisation et sauvegardes.
- **Hybride** (le cas général) : l'edge décide vite et filtre ; le cloud stocke, analyse et orchestre ; les modèles d'IA entraînés dans le cloud sont déployés à la périphérie.
