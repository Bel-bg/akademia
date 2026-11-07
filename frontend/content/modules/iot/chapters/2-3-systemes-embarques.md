Dans un système IoT, les informations collectées sont traitées : c'est le rôle du **microcontrôleur**. Voyons d'abord ce que sont un système embarqué et un microcontrôleur.

### 2.3.1 Système embarqué

Un **système embarqué** est un **ensemble de matériel et de logiciel conçu pour accomplir une tâche spécifique au sein d'un appareil ou d'un système plus vaste**. Il est intégré dans des dispositifs comme les voitures, les téléphones, les appareils médicaux, les machines industrielles, les électroménagers. Il est optimisé pour être **efficace et fiable** dans son contexte d'utilisation, souvent avec des **contraintes de taille, de consommation d'énergie, de coût et de temps réel**.

Caractéristiques : **dédié** à une fonction précise ; **ressources limitées** (mémoire, calcul) ; **faible consommation** ; **fiabilité** (fonctionne sans arrêt, redémarre seul) ; **réactivité** (parfois **temps réel dur** : le délai doit être respecté absolument, ou **mou**) ; interaction directe avec l'environnement via capteurs et actionneurs.

![Structure d'un système embarqué autour d'un microcontrôleur](/figures/iot/embarque.svg)

### 2.3.2 Microcontrôleur

Le **microcontrôleur** (MCU) est un composant clé des systèmes embarqués : c'est une **puce informatique compacte qui contient un processeur (CPU), de la mémoire (RAM et ROM/Flash) et des interfaces d'entrée/sortie, le tout intégré sur une seule puce**. Il est conçu pour exécuter des programmes spécifiques qui contrôlent les fonctions du système embarqué.

#### Constituants

- **CPU** : 8, 16 ou 32 bits (AVR, ARM Cortex-M, Xtensa, RISC-V) ;
- **Mémoires** : **Flash** (programme, non volatile), **SRAM** (données, volatile), **EEPROM** (paramètres conservés) ;
- **Entrées/sorties numériques (GPIO)** ;
- **CAN** (ADC) et parfois **CNA** (DAC) ;
- **Timers/compteurs et PWM** (modulation de largeur d'impulsion) ;
- **Interfaces de communication** : UART, I2C, SPI, USB, CAN bus ; radio intégrée (Wi-Fi/BLE sur ESP32) ;
- **Interruptions**, **watchdog** (chien de garde), horloge temps réel (RTC), contrôleur DMA, modes de veille.

#### Rôle du microcontrôleur dans un dispositif IoT

1. **Acquérir** les mesures des capteurs (lecture analogique/numérique) ;
2. **Traiter** localement (filtrage, calibration, comparaison à un seuil, décision) ;
3. **Commander** les actionneurs (relais, vannes, sirène) ;
4. **Communiquer** : formater les données et les envoyer via le module radio (ou par sa radio intégrée) ; recevoir des commandes ;
5. **Gérer l'énergie** (mises en veille) et la **sécurité** (chiffrement, authentification) ;
6. **Superviser** son propre fonctionnement (watchdog, mises à jour OTA).

:::retenir Microcontrôleur, microprocesseur, SoC, carte monocarte
- **Microcontrôleur** : CPU + mémoire + périphériques sur une puce ; faible coût et consommation ; pas de système d'exploitation complexe ; temps réel (Arduino, ESP32, STM32).
- **Microprocesseur** : CPU seul, nécessite RAM et périphériques externes ; plus puissant (PC).
- **SoC** (*System on Chip*) : processeur plus périphériques évolués dans une puce (Raspberry Pi).
- **Carte monocarte (SBC)** : carte complète sous Linux (Raspberry Pi) : idéale pour une **passerelle edge**, trop gourmande pour un capteur sur pile.
:::

#### Cartes et microcontrôleurs courants


| Carte / puce | Architecture | Fréquence | Mémoire | Connectivité | Usage typique |
|---|---|---|---|---|---|
| Arduino Uno (ATmega328P) | AVR 8 bits | 16 MHz | 2 Ko SRAM, 32 Ko Flash | Aucune (modules externes) | Apprentissage, prototypes |
| ESP8266 (NodeMCU) | 32 bits Tensilica | 80 MHz | ~80 Ko RAM | Wi-Fi | Objets Wi-Fi bon marché |
| ESP32 | Dual-core Xtensa 32 bits (RISC-V pour C3) | jusqu'à 240 MHz | 520 Ko SRAM | Wi-Fi + Bluetooth/BLE | IoT polyvalent, edge léger |
| STM32 (ARM Cortex-M) | 32 bits | 48-480 MHz | Variable | Selon modèle (+ LoRa avec STM32WL) | Industrie, très faible consommation |
| nRF52 (Nordic) | ARM Cortex-M4 | 64 MHz | 256 Ko RAM | BLE, Thread | Objets BLE sur pile |
| Raspberry Pi Pico (RP2040) | Dual Cortex-M0+ | 133 MHz | 264 Ko SRAM | Aucune (Pico W : Wi-Fi) | Prototypes, éducation |
| Raspberry Pi (SBC) | Microprocesseur ARM, Linux | 1-2,4 GHz | 1-8 Go | Wi-Fi, Ethernet, BLE | Passerelle, edge, caméra |


#### Interfaces et bus de communication


| Bus | Fils | Mode | Vitesse typique | Usage |
|---|---|---|---|---|
| UART (série) | TX, RX (+GND) | Asynchrone, point à point | 9 600 à 115 200 bauds | GPS, modules GSM/LoRa, console |
| I2C | SDA, SCL | Synchrone, multi-appareils par adresse (7 bits), résistances de rappel | 100 kHz, 400 kHz | Capteurs (BME280, MPU6050), écrans |
| SPI | MOSI, MISO, SCK, CS | Synchrone, full duplex, un CS par esclave | Plusieurs MHz | Cartes SD, radio LoRa SX127x, écrans |
| 1-Wire | 1 fil de données | Bus partagé, adresse unique par composant | ~16 kbit/s | DS18B20 (plusieurs sondes sur un fil) |
| PWM | 1 broche | Rapport cyclique variable | kHz | Servomoteurs, variation de vitesse/luminosité |
| CAN (bus) | CAN_H, CAN_L | Différentiel, robuste | jusqu'à 1 Mbit/s | Automobile, industrie |


#### Logiciel embarqué

- **Programmation** : C/C++ (Arduino IDE, PlatformIO, ESP-IDF), **MicroPython**, Rust ;
- **Bare metal** (boucle infinie) ou **RTOS** (FreeRTOS, Zephyr, RIOT) pour gérer plusieurs tâches avec priorités et temps réel ;
- **Interruptions** : réagir immédiatement à un événement (détection de mouvement) sans scruter en permanence ;
- **Watchdog** : redémarre automatiquement le microcontrôleur s'il se bloque ;
- **Bootloader et OTA** : mise à jour du firmware à distance, avec signature et retour arrière.

Exemple minimal (ESP32 + capteur de distance) : mesurer, calculer le niveau, publier en MQTT, puis dormir.

```
void loop() {
  float d = mesurerDistanceCm();          // capteur ultrason
  int niveau = (100 - d);                 // bac de 100 cm
  if (!mqtt.connected()) reconnecter();
  mqtt.publish("ville/poubelle42/niveau", String(niveau).c_str());
  esp_deep_sleep(15 * 60 * 1000000ULL);   // veille profonde : 15 minutes
}
```

#### Gestion de l'énergie

Les microcontrôleurs proposent plusieurs **modes** : actif (plusieurs dizaines de mA, davantage avec la radio), veille légère (*light sleep*), **veille profonde (*deep sleep*, de l'ordre de 10 µA pour l'ESP32)**, hibernation. La stratégie est le **cycle de service** (*duty cycling*) : se réveiller brièvement, mesurer, transmettre, se rendormir.

:::exemple Calcul d'autonomie avec cycle de service
Un capteur consomme **120 mA** pendant **2 s** (mesure + émission) toutes les **15 min** (900 s), et **0,01 mA** en veille le reste du temps (898 s).

Courant moyen = (120 × 2 + 0,01 × 898) / 900 = 248,98 / 900 ≈ **0,277 mA**.

Avec une batterie de **2 000 mAh** : autonomie = 2 000 / 0,277 ≈ **7 230 h ≈ 300 jours** (environ 10 mois ; moins en pratique à cause de l'autodécharge). En émettant toutes les 60 min au lieu de 15 min, l'autonomie dépasse **3 ans**. Avec un panneau solaire, elle devient quasi illimitée.
:::

#### Critères de choix d'un microcontrôleur

Besoin de connectivité intégrée (Wi-Fi/BLE/LoRa), consommation en veille, nombre et type d'entrées/sorties, mémoire, puissance (IA embarquée ?), écosystème logiciel, **coût**, disponibilité, sécurité matérielle (secure boot, chiffrement matériel, stockage de clés).
