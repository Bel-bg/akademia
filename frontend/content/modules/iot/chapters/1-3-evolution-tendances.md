### 1.3.1 Croissance du nombre d'appareils

Le nombre d'appareils IoT est en pleine expansion. Les estimations varient selon les cabinets, mais elles s'accordent sur l'ordre de grandeur : de l'ordre de **15 à 20 milliards d'objets connectés** au milieu des années 2020, et **30 à 40 milliards attendus d'ici 2030**. Cette croissance est alimentée par la demande accrue dans les secteurs domestique, industriel et public, par la baisse du coût des capteurs et des modules radio, et par l'arrivée de réseaux dédiés (LPWAN, 5G).

:::attention Remarque sur la figure du cours initial
La figure 1.2 du cours d'origine présente l'évolution du nombre d'appareils connectés de 2004 à 2018 : l'idée à retenir est une **croissance exponentielle**, avec un dépassement du nombre d'objets sur le nombre d'humains connectés vers 2008-2009.
:::

### 1.3.2 Nouvelles technologies

Les nouvelles technologies de l'IoT évoluent rapidement pour répondre aux besoins croissants de connectivité, d'efficacité, de sécurité et de scalabilité.

#### Réseaux et connectivité avancés

- **5G et 6G** : la 5G offre des débits élevés, une latence très faible (objectif de l'ordre de 1 ms) et une connectivité massive (objectif d'un million d'objets par km²). Elle est structurée en trois grands usages : **eMBB** (haut débit mobile), **URLLC** (communications ultra-fiables à faible latence : véhicules autonomes, chirurgie à distance, usines connectées) et **mMTC** (communications massives de type machine : capteurs en grand nombre). La recherche sur la 6G promet d'aller encore plus loin (intégration de l'IA au réseau, capteurs et communication combinés).
- **LPWAN** (*Low Power Wide Area Networks*) : LoRaWAN, Sigfox, NB-IoT, LTE-M. Idéaux pour des dispositifs à faible puissance en zones rurales ou urbaines, avec une autonomie de plusieurs années.
- **Wi-Fi 6 et Wi-Fi 7** : meilleure capacité dans les environnements IoT denses (maisons intelligentes, bureaux connectés), avec des mécanismes d'économie d'énergie (TWT, *Target Wake Time*). Le **Wi-Fi HaLow** (IEEE 802.11ah, bande sub-GHz) vise des portées de l'ordre du kilomètre pour l'IoT.
- **Connectivité satellitaire** (NTN, *Non-Terrestrial Networks*) : pour les zones sans couverture terrestre (élevage extensif, océans, forêts).
- **Standards domotiques** : **Matter** et **Thread** unifient les écosystèmes de maison intelligente.

#### Edge computing et fog computing

Ces technologies déplacent le traitement des données IoT vers la périphérie du réseau pour **réduire la latence, améliorer la confidentialité et économiser la bande passante**. Les applications incluent les systèmes industriels (Industrie 4.0) et les villes intelligentes. Le *fog computing* désigne une couche intermédiaire (passerelles, petits serveurs) entre l'objet et le cloud.

#### Intelligence artificielle et apprentissage automatique

- **Apprentissage automatique embarqué (TinyML)** : les dispositifs IoT peuvent exécuter localement des modèles d'IA très légers (quelques dizaines de Ko) pour détecter une anomalie, reconnaître un mot-clé ou un geste, avec une prise de décision autonome et une consommation minimale.
- **Vision par ordinateur** : utilisée pour la surveillance, la reconnaissance faciale et l'agriculture intelligente grâce à des capteurs visuels avancés.
- **AIoT** : fusion de l'IA et de l'IoT (maintenance prédictive, détection d'intrusion, prévision de la demande).

#### Blockchain et technologies de registre distribué

Ces technologies assurent la **sécurité, l'intégrité et la traçabilité** des données IoT, particulièrement utiles dans la logistique, les chaînes d'approvisionnement et les transactions financières. Limite : coût en énergie et en stockage, peu adapté aux objets très contraints.

#### Capteurs avancés

- **Capteurs intelligents** (*smart sensors*) : mesurent des paramètres comme la qualité de l'air, l'humidité, le mouvement, la lumière et même des marqueurs biologiques ; ils intègrent conversion, calibrage et parfois un peu de calcul.
- **Capteurs sans batterie** : utilisent l'**énergie ambiante** (solaire, vibratoire, thermique, radiofréquence), réduisant les besoins de maintenance (*energy harvesting*, « IoT ambiant »).

#### Systèmes d'exploitation IoT spécialisés

Les systèmes d'exploitation légers comme **RIOT OS, FreeRTOS, Zephyr, Contiki-NG, Mbed OS** sont conçus pour des dispositifs IoT contraints en ressources (quelques dizaines de Ko de RAM).

#### Réalité augmentée (AR) et réalité virtuelle (VR)

Les technologies AR et VR connectées à des dispositifs IoT sont utilisées pour la formation, la maintenance industrielle et l'expérience utilisateur dans des environnements intelligents (un technicien voit en lunettes AR la température et l'état d'une machine).

#### Jumeaux numériques

Un **jumeau numérique** (*digital twin*) est une réplique virtuelle d'un objet ou d'un système physique, alimentée en temps réel par ses capteurs. Il permet de simuler, de prévoir les pannes et d'optimiser le fonctionnement.

#### Nanotechnologies et bio-IoT

- **Nano-IoT** : développement de capteurs et de dispositifs miniaturisés pour des applications médicales et environnementales ;
- **Bio-IoT** : intègre des dispositifs biologiques et électroniques, comme les capteurs corporels et les implants.

#### Cybersécurité et réglementation

Les gouvernements imposent peu à peu des règles de sécurité minimales aux fabricants (mots de passe uniques, mises à jour de sécurité, notification des vulnérabilités), notamment en Europe.

### 1.3.3 Perspectives pour l'Afrique

Dans le contexte africain, l'IoT se développe d'abord là où il répond à un besoin concret : **agriculture de précision** (irrigation, suivi des cultures de rente : coton, anacarde, cacao), **énergie solaire** à paiement à l'usage, **eau** (pompes et forages solaires), **santé** (chaîne du froid des vaccins), **logistique** et **villes intelligentes**. Les défis spécifiques sont la couverture réseau, l'alimentation électrique irrégulière, le coût des équipements, la formation et le cadre réglementaire. Les réseaux LPWAN, l'énergie solaire et les plateformes ouvertes (The Things Network, ThingsBoard) y sont particulièrement adaptés.
