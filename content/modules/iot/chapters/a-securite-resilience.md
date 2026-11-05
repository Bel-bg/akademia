## Annexe A : Sécurité des systèmes IoT


### A.1 Les objectifs de sécurité

- **Confidentialité** : seules les personnes et machines autorisées accèdent à l'information (chiffrement, contrôle d'accès).
- **Intégrité** : l'information n'est pas modifiée, ni par erreur ni par malveillance, sans que cela soit détecté (hachage, code d'authentification, signature numérique).
- **Disponibilité** : le système reste utilisable (redondance, protection contre le déni de service).
- **Authenticité et non-répudiation** : on est sûr de l'identité de l'émetteur et il ne peut nier son envoi (certificats, signatures).

### A.2 Mécanismes de protection


| Mécanisme | Principe | Objectif | Exemple IoT |
|---|---|---|---|
| Chiffrement symétrique (AES-128/256) | Une même clé chiffre et déchiffre ; rapide, adapté aux microcontrôleurs | Confidentialité | LoRaWAN : AES-128 ; Zigbee |
| Chiffrement asymétrique (RSA, ECC) | Clé publique / clé privée ; sert à l'échange de clés et aux signatures ; ECC plus léger que RSA | Confidentialité, authentification | Handshake TLS |
| TLS / DTLS | Canal sécurisé (chiffrement + authentification + intégrité) sur TCP / UDP | Confidentialité, intégrité | MQTT sur 8883, HTTPS, CoAP sur DTLS |
| Fonction de hachage (SHA-256) | Empreinte de taille fixe ; la moindre modification change l'empreinte | Intégrité | Vérification d'un firmware |
| HMAC / MIC | Empreinte calculée avec une clé secrète | Intégrité + authenticité | MIC de LoRaWAN |
| Signature numérique | Hachage signé par la clé privée de l'émetteur | Intégrité, authenticité, non-répudiation | Mises à jour firmware signées |
| Certificats X.509 / PKI | Lient une identité à une clé publique, émis par une autorité de certification | Authentification mutuelle | Chaque capteur a son certificat |
| Secure boot, élément sécurisé (TPM, ATECC608) | Le démarrage ne charge que du code signé ; les clés sont stockées dans une puce protégée | Intégrité, confidentialité des clés | ESP32 secure boot et flash encryption |
| Mises à jour OTA sécurisées | Firmware signé, vérifié avant installation, avec retour arrière | Intégrité, disponibilité | Correction de failles à distance |
| Authentification et contrôle d'accès | Identifiants uniques par objet, jetons (OAuth2/JWT), moindre privilège, ACL MQTT | Confidentialité, intégrité | Un capteur ne peut publier que sur son propre sujet |
| Segmentation réseau, pare-feu, VPN | Isoler l'IoT du réseau d'entreprise (VLAN), filtrer les flux | Disponibilité, confidentialité | Réseau IoT séparé du réseau administratif |
| Détection d'intrusion et supervision | Journaux, alertes sur comportements anormaux | Disponibilité | Détection d'un capteur qui émet trop |
| Anti-rejeu | Compteurs de trames, horodatage, nonces | Intégrité | Compteurs FCnt LoRaWAN |


:::examen Question type : « Expliquez deux mécanismes permettant d'assurer la sécurité et l'intégrité des données »
Réponse modèle. **(1) Chiffrement des communications (AES/TLS)** : avant l'envoi, les données sont chiffrées avec une clé (AES-128 en LoRaWAN, TLS pour MQTT/HTTPS) ; un attaquant qui intercepte les trames ne peut pas les lire, ce qui garantit la **confidentialité**, et le canal authentifié empêche l'usurpation. **(2) Contrôle d'intégrité par hachage/MIC et signature** : on joint à chaque message un code d'authentification (MIC/HMAC) ou une empreinte SHA-256 calculée avec une clé secrète ; le récepteur recalcule le code et rejette tout message modifié ; pour les firmwares, une **signature numérique** vérifiée au démarrage (*secure boot*) garantit que le code n'a pas été altéré. On peut ajouter : **authentification des appareils** (certificats, clés uniques) et **mises à jour OTA**.
:::

### A.3 Bonnes pratiques

Changer les mots de passe par défaut ; une clé unique par appareil (jamais une clé commune) ; désactiver les services inutiles (telnet) ; sécuriser l'accès physique (boîtier scellé, ports de debug désactivés) ; mettre à jour régulièrement ; limiter la collecte de données ; journaliser ; prévoir la révocation d'un appareil volé. Référentiels : **OWASP IoT Top 10**, **ETSI EN 303 645** (sécurité des objets grand public), ISO/IEC 27001.

### A.4 Confidentialité et protection de la vie privée

*Privacy by design* ; **minimisation** (ne collecter que le nécessaire) ; **anonymisation/pseudonymisation** ; **consentement** et information ; limitation de la durée de conservation ; traitement **en périphérie** pour que les données brutes (images, voix) ne quittent pas le site ; chiffrement au repos (base de données) et en transit ; journalisation des accès ; respect des lois nationales (Code du numérique du Bénin) et du RGPD pour les données de résidents européens.


## Annexe B : Résilience, fiabilité et autonomie


### B.1 Garantir la résilience en cas de panne réseau

La **résilience** est la capacité du système à continuer de remplir sa mission malgré une panne (réseau, électricité, appareil) et à se rétablir seul. Mécanismes :

1. **Autonomie locale (edge)** : l'alarme et les règles critiques s'exécutent sur le microcontrôleur ou la passerelle, sans dépendre du cloud. Une intrusion déclenche la sirène même sans Internet.
2. **Tampon local et reprise (*store-and-forward*)** : les mesures sont stockées en mémoire flash ou sur carte SD avec horodatage, puis envoyées avec **reprise automatique** quand le réseau revient (MQTT avec sessions persistantes et QoS 1 ou 2).
3. **Redondance des liaisons** : double accès (Wi-Fi/Ethernet + GSM 4G) avec **basculement automatique** (*failover*) ; plusieurs passerelles LoRaWAN couvrant la même zone.
4. **Alimentation de secours** : onduleur/batterie tampon, panneau solaire, détection de coupure et alerte de dernière minute.
5. **Surveillance de l'état** : battements de cœur (*heartbeat*), message **Last Will** MQTT, alertes quand un appareil ne répond plus ; **watchdog** pour relancer l'appareil bloqué.
6. **Reconnexion intelligente** : nouvelles tentatives avec **délai croissant** (*exponential backoff*) pour ne pas saturer le réseau.
7. **Dégradation maîtrisée** : en cas de panne, passer à un mode minimal sûr (valeurs par défaut, état sécurisé des actionneurs).
8. **Redondance logicielle et sauvegardes** (plateforme dupliquée, bases répliquées) ; **mises à jour avec retour arrière**.

### B.2 Garantir la confidentialité des données (rappel)

Chiffrement de bout en bout (AES/TLS), authentification mutuelle des appareils et des utilisateurs, contrôle d'accès par rôles, segmentation du réseau, stockage chiffré, minimisation et anonymisation, traitement local des données sensibles (images de caméras), journalisation et suppression des données après la durée utile.

### B.3 Améliorer l'autonomie énergétique (deux solutions et plus)


| Solution | Principe | Effet |
|---|---|---|
| Veille profonde + cycle de service | Le microcontrôleur et la radio dorment entre deux mesures | Réduit le courant moyen de plusieurs dizaines de mA à moins de 1 mA |
| Réduire la fréquence et la taille des transmissions | Envoi sur seuil ou changement significatif, agrégation, compression | Moins de temps radio (principal poste de consommation) |
| Récupération d'énergie | Panneau solaire + batterie/supercondensateur ; vibrations, thermique | Autonomie quasi illimitée |
| Protocole basse consommation | LoRaWAN classe A, BLE, NB-IoT PSM/eDRX, ADR | Fait baisser puissance et temps d'émission |
| Choix de composants | Régulateur à faible courant de repos, capteurs à faible consommation, batteries lithium-thionyle | Réduit les pertes permanentes |
| Traitement en périphérie | Ne transmettre que l'information utile | Moins d'émissions |
| Alimentation intelligente de capteurs | Couper l'alimentation des capteurs (MQ, ultrason) hors mesure | Évite la consommation de chauffe |
