L'IoT a le potentiel de révolutionner de nombreux secteurs, mais il présente aussi plusieurs enjeux et défis à surmonter pour garantir son efficacité et sa durabilité. Pour chaque défi, retenez **le problème, ses causes, ses conséquences et les solutions**.

### 1.5.1 Sécurité

- **Vulnérabilités des appareils** : les objets connectés sont des cibles privilégiées pour les cyberattaques, en raison de leur faible niveau de sécurité, de la diversité des appareils, de ressources de calcul limitées pour le chiffrement, de mots de passe par défaut et de l'absence de protocoles de sécurité robustes ou de mises à jour.
- **Protection des données** : les objets IoT collectent beaucoup de données sensibles, y compris personnelles et professionnelles. Une gestion inadéquate expose à des risques de piratage, de vol d'identité ou de fraude.
- **Attaques DDoS** (*Distributed Denial of Service*) : des appareils IoT insuffisamment sécurisés peuvent être compromis et transformés en **botnet** pour mener des attaques par déni de service à grande échelle. Exemple : **Mirai (2016)**, qui a infecté des centaines de milliers de caméras et routeurs en essayant des identifiants par défaut (telnet), et a paralysé le fournisseur DNS Dyn, rendant inaccessibles de grands sites.

:::retenir Types d'attaques par couche
- **Perception** : vol ou démontage de l'objet, extraction du firmware, falsification de capteur, brouillage (*jamming*), canaux auxiliaires.
- **Réseau** : écoute (*sniffing*), homme du milieu (MITM), rejeu (*replay*), usurpation d'identité (*spoofing*), déni de service.
- **Traitement/Application** : injections, API non protégées, mots de passe faibles, firmware vulnérable, fuite de base de données.
:::

**Solutions principales** : chiffrement (AES, TLS/DTLS), authentification forte (certificats, clés uniques par objet), démarrage sécurisé (*secure boot*), mises à jour OTA signées, segmentation du réseau, principe du moindre privilège, supervision des anomalies. Détails en Annexe A.

### 1.5.2 Confidentialité et protection des données

- **Collecte massive de données** : l'IoT collecte une quantité colossale de données personnelles et sensibles (santé, maison connectée, transports, localisation). Leur utilisation par des entreprises ou des gouvernements soulève des questions sur la vie privée.
- **Stockage et traitement** : les données doivent être stockées et traitées de manière sécurisée ; les systèmes doivent garantir la confidentialité tout en permettant un accès à des fins légitimes.
- **Réglementations** : beaucoup de juridictions n'ont pas encore de règles claires pour la gestion des données IoT, ce qui crée des incertitudes pour respecter les lois locales sur la confidentialité.

**Solutions** : minimisation des données, anonymisation/pseudonymisation, traitement local (edge), consentement explicite, chiffrement des données au repos et en transit, contrôle d'accès, durée de conservation limitée, *privacy by design*.

### 1.5.3 Scalabilité

- **Volume de données** : l'IoT génère d'énormes volumes de données en temps réel, ce qui exige des infrastructures de traitement, de stockage et d'analyse capables de suivre.
- **Interconnexion et compatibilité** : assurer la compatibilité entre des milliers d'appareils de fabricants différents ; il faut des normes pour garantir l'interopérabilité.
- **Gestion du réseau** : avec le nombre croissant d'appareils, les réseaux doivent supporter l'expansion en gardant performance et fiabilité (collisions radio, saturation des passerelles, adressage).
- **Gestion de flotte** : provisionner, configurer, surveiller, mettre à jour des milliers d'objets à distance.

**Solutions** : architectures cloud élastiques, IPv6, files de messages (Kafka, MQTT), bases de données de séries temporelles, edge computing pour filtrer à la source, standards ouverts, plateformes de gestion d'appareils (LwM2M), ajout de passerelles.

:::examen Défis de scalabilité : « deux défis et pourquoi ils sont critiques »
Réponse type : (1) **Volume et vitesse des données** : des milliers de capteurs envoyant chaque seconde saturent le stockage et le réseau ; critique car la plateforme devient lente ou perd des données, ce qui rend les alertes inutiles. (2) **Gestion et interopérabilité d'un grand nombre d'objets hétérogènes** : provisionnement, mises à jour, protocoles différents ; critique car sans automatisation et standards, le coût d'exploitation explose et le système devient ingérable.
:::

### 1.5.4 Énergie et autonomie des appareils

- **Consommation énergétique** : de nombreux dispositifs, notamment en environnements distants, doivent fonctionner sans interruption sur batterie ; il faut des avancées dans la durée de vie des batteries et l'efficacité énergétique.
- **Alimentation sans fil et récupération d'énergie** : pour les dispositifs difficiles d'accès, l'alimentation par induction ou la récupération d'énergie ambiante devient cruciale afin d'éviter les remplacements fréquents de batteries.

**Solutions** (à connaître pour l'examen) : (1) **mode veille profonde** et cycle de service (le microcontrôleur dort >99 % du temps) ; (2) **protocoles basse consommation** (LoRaWAN, BLE, NB-IoT PSM/eDRX) ; (3) **récupération d'énergie** (panneau solaire + supercondensateur/batterie) ; (4) **réduction des transmissions** (envoi sur changement significatif, agrégation et compression, traitement à la périphérie) ; (5) **choix de composants** à faible consommation et de batteries adaptées (lithium thionyle chlorure pour 10 ans) ; (6) **ADR** pour réduire la puissance et le facteur d'étalement.

### 1.5.5 Standards et compatibilité

- **Absence de standards universels** : la multiplication des protocoles et des normes complique l'intégration et l'interopérabilité des appareils de fabricants différents.
- **Plateformes propriétaires** : de nombreux géants créent des plateformes IoT fermées, ce qui réduit la flexibilité et empêche l'intégration avec d'autres systèmes (*vendor lock-in*).

**Solutions** : adopter des standards ouverts (MQTT, CoAP, LwM2M, OPC UA, oneM2M, Matter), des API ouvertes, des passerelles de traduction de protocoles.

### 1.5.6 Gestion et analyse des données

- **Big Data et analyse** : l'IoT génère des volumes massifs ; la difficulté est la gestion, le stockage et l'analyse efficaces (IA, apprentissage machine, analyse prédictive) pour en extraire des informations pertinentes.
- **Prise de décision** : l'exploitation des données pour des décisions stratégiques ou opérationnelles exige des analyses en temps réel pour permettre des actions rapides.
- **Qualité des données** : capteurs défaillants, doublons, valeurs manquantes, horodatages incohérents.

### 1.5.7 Coût et adoption

- **Coût de mise en œuvre** : l'infrastructure IoT demande un investissement initial important (capteurs, systèmes de gestion des données, connectivité), ce qui peut freiner l'adoption quand les budgets sont limités.
- **Retour sur investissement (ROI)** : les entreprises doivent évaluer les coûts d'implémentation et d'exploitation face aux économies ou bénéfices générés. Formule : ROI = (gains - coûts) / coûts.

### 1.5.8 Fiabilité et résilience du système

- **Pannes d'appareils** : les objets IoT sont souvent exposés à des conditions environnementales difficiles (chaleur, poussière, humidité, foudre), ce qui peut provoquer des pannes ; la fiabilité est cruciale en santé et en industrie.
- **Redondance** : l'IoT repose sur des réseaux interconnectés : la défaillance d'un appareil ou d'une partie du système peut affecter l'ensemble ; la résilience et la redondance sont essentielles à la continuité de service.

**Solutions** : tampon local et reprise après coupure (*store-and-forward*), double liaison réseau (Wi-Fi + GSM), alimentation de secours, chien de garde (*watchdog*), redondance des passerelles, supervision et alertes de panne, mises à jour avec retour arrière.

### 1.5.9 Éthique et responsabilité

- **Autonomie des objets connectés** : l'automatisation des processus soulève des questions éthiques sur la prise de décision autonome par des systèmes. La responsabilité des actions des dispositifs, notamment en santé ou dans l'automobile, doit être clairement définie.
- **Impacts sociétaux** : l'IoT contribue à la transformation numérique de la société, mais soulève des questions de vie privée, d'autonomie individuelle et de dépendance accrue à la technologie ; il existe aussi un risque de fracture numérique.

### 1.5.10 Durabilité et environnement

**Impact écologique** : l'augmentation du nombre d'appareils IoT a un impact environnemental (consommation d'énergie des serveurs et des réseaux, déchets électroniques, ressources nécessaires à la fabrication, piles usagées). Le recyclage, l'éco-conception, la réparabilité, l'allongement de la durée de vie et l'optimisation des ressources deviennent cruciaux pour minimiser l'empreinte écologique.


| Défi | Risque principal | Solutions clés |
|---|---|---|
| Sécurité | Piratage, botnet, vol de données | Chiffrement, authentification, OTA signées, secure boot |
| Confidentialité | Atteinte à la vie privée | Minimisation, anonymisation, traitement local, consentement |
| Scalabilité | Saturation des réseaux et plateformes | Cloud élastique, IPv6, edge, gestion de flotte |
| Énergie | Batterie vide, maintenance coûteuse | Veille profonde, LPWAN, récupération d'énergie |
| Standards | Dépendance à un fournisseur | Standards ouverts, passerelles, API |
| Données | Surcharge, mauvaise qualité | Filtrage edge, séries temporelles, IA |
| Coût | Frein à l'adoption | Analyse du ROI, déploiement progressif |
| Fiabilité | Pannes, arrêt de service | Redondance, store-and-forward, watchdog |
| Éthique | Perte de contrôle, discrimination | Transparence, responsabilité, cadre légal |
| Environnement | Déchets électroniques | Éco-conception, recyclage, durée de vie longue |
