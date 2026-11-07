Les principes fondamentaux de l'IoT reposent sur des concepts clés qui assurent son fonctionnement et sa mise en œuvre. Ils sont au nombre de dix dans ce cours.

### 1.2.1 Collecte de données

Les objets connectés sont équipés de **capteurs** pour recueillir des informations sur leur environnement : température, humidité, position (GPS), mouvement, état mécanique (vibration, pression), luminosité, gaz, niveau de remplissage, présence, etc. Sans données, les objets ne peuvent pas fonctionner efficacement : les capteurs sont la base de l'IoT.

Trois notions importantes :

- **Types de données** : mesure continue (température), état (porte ouverte/fermée), événement (intrusion détectée), identifiant (badge RFID).
- **Fréquence d'échantillonnage** : à quelle cadence on mesure. Trop rapide : on gaspille énergie et bande passante ; trop lente : on rate des événements.
- **Qualité de la donnée** : précision, étalonnage, bruit, valeurs aberrantes ; on filtre souvent localement (moyenne glissante, seuils).

### 1.2.2 Connectivité

La connectivité est essentielle pour relier les objets entre eux et avec les systèmes informatiques. Technologies utilisées : **Wi-Fi, Bluetooth/BLE, ZigBee, LoRaWAN, Sigfox, NB-IoT, réseaux cellulaires (2G, 3G, 4G, 5G)**, Ethernet, et le **protocole IP** pour la communication sur Internet. Chaque appareil doit pouvoir transmettre ses données à une plateforme ou à d'autres appareils.

On classe les réseaux selon leur portée : **PAN** (quelques mètres : Bluetooth, NFC), **LAN** (dizaines de mètres : Wi-Fi, Zigbee), **WAN/LPWAN** (kilomètres : LoRaWAN, NB-IoT, cellulaire). Le choix dépend de la portée, du débit, de la consommation, du coût et de la disponibilité du réseau (voir le tableau de choix en 2.1.2).

### 1.2.3 Traitement et analyse des données

Une fois collectées, les données sont traitées et analysées pour fournir des informations utiles. Cela se fait :

- **Localement (edge computing)** : traitement à proximité de l'appareil pour réduire la latence, économiser la bande passante et préserver la confidentialité ;
- **Dans le cloud** : stockage et traitement centralisés pour des analyses approfondies (statistiques, apprentissage automatique, tableaux de bord).

L'objectif est de transformer des **données brutes** en **informations exploitables** (alertes, décisions automatiques, prévisions).

### 1.2.4 Action et automatisation

Grâce aux **actionneurs**, les systèmes IoT répondent aux données collectées en exécutant des actions automatiques : réguler la température d'après un capteur thermique, allumer des lumières quand un mouvement est détecté, ouvrir une vanne d'irrigation, déclencher une sirène. Cette **boucle d'action** permet de créer des systèmes autonomes et efficaces.

On distingue la **boucle ouverte** (l'action est déclenchée sans vérifier son effet) et la **boucle fermée** (le capteur mesure l'effet de l'action et corrige : régulation). Une règle courante est le **seuil avec hystérésis** :

```
si humidite_sol < 30 % alors ouvrir_vanne
si humidite_sol > 45 % alors fermer_vanne
// entre 30 % et 45 % : on garde l'état précédent (évite les commutations rapides)
```

### 1.2.5 Communication bidirectionnelle

Les objets connectés doivent pouvoir **envoyer et recevoir** des informations. Cela permet :

- la **surveillance à distance** (voie montante ou *uplink* : de l'objet vers le serveur) ;
- le **contrôle à distance** (voie descendante ou *downlink* : modification des paramètres, commande d'un actionneur, mise à jour du firmware).

Certaines technologies sont très asymétriques : en Sigfox ou LoRaWAN classe A, la voie descendante est très limitée (fenêtres de réception brèves après chaque émission).

### 1.2.6 Interopérabilité

Les systèmes IoT doivent fonctionner ensemble, même s'ils proviennent de fabricants différents. Cela nécessite des **protocoles standards** et des plateformes compatibles. On distingue quatre niveaux :

- **technique** (même réseau/protocole : Wi-Fi, MQTT) ;
- **syntaxique** (même format de données : JSON, CBOR) ;
- **sémantique** (même signification des champs : « temp » = température en °C) ;
- **organisationnel** (processus et règles communs entre acteurs).

Standards et initiatives : oneM2M, Matter, OPC UA, LwM2M, W3C Web of Things. Sans interopérabilité, on subit le *vendor lock-in* (dépendance à un fournisseur).

### 1.2.7 Sécurité et confidentialité

Avec l'échange constant de données, la sécurité est un enjeu majeur. Les principes fondamentaux sont :

- **Cryptage (chiffrement) des données** : assurer que les données ne peuvent pas être interceptées et lues ;
- **Authentification** : garantir que seuls les utilisateurs et appareils autorisés accèdent au système ;
- **Mise à jour des logiciels** : corriger les failles de sécurité (*patchs*, mises à jour OTA) ;
- **Intégrité** : s'assurer que les données ne sont pas modifiées en route ;
- **Disponibilité** : le service reste accessible.

Ces notions sont développées en 1.5.1 et en Annexe A.

### 1.2.8 Évolutivité

Un système IoT doit pouvoir s'adapter à une augmentation du nombre d'appareils connectés ou à des exigences fonctionnelles plus importantes : ajout de capteurs, de passerelles, de serveurs. Cela suppose des architectures modulaires, des protocoles légers, un adressage large (IPv6) et des plateformes cloud élastiques.

### 1.2.9 Faible consommation d'énergie

Pour les appareils fonctionnant sur batterie, la durée de vie est cruciale : changer des milliers de piles est coûteux. Les systèmes IoT doivent optimiser leur consommation en utilisant des technologies à faible consommation (**LoRa, BLE, NB-IoT en mode PSM**), des microcontrôleurs à mode veille profonde, et des stratégies de transmission économes (envoyer peu, rarement, et seulement si nécessaire). La relation de base est :

:::retenir Autonomie d'une batterie
**Autonomie (h) = Capacité de la batterie (mAh) / Courant moyen consommé (mA)**

Exemple : batterie de 2 000 mAh, courant moyen de 0,28 mA, autonomie théorique = 2 000 / 0,28 ≈ 7 140 h ≈ 300 jours. En pratique on applique une marge (70 % de la capacité) à cause de l'autodécharge, de la température et du vieillissement.
:::

### 1.2.10 Conformité réglementaire et éthique

Les solutions IoT doivent respecter les lois et règlements concernant :

- la **protection des données personnelles** (RGPD en Europe ; en République du Bénin, le Code du numérique et l'autorité de protection des données personnelles) : consentement, finalité, minimisation, durée de conservation, droit d'accès ;
- les **impacts environnementaux** : déchets électroniques (DEEE), recyclage, substances dangereuses (norme RoHS), consommation d'énergie ;
- la **réglementation radio** : bandes de fréquences autorisées, puissance maximale et **duty cycle** (par exemple 1 % en bande 868 MHz en Europe), homologation des équipements par le régulateur des télécommunications ;
- l'**éthique** : transparence, consentement, absence de discrimination, responsabilité en cas de décision automatique erronée.
