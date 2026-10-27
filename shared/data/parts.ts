import type { CategoryId, Part } from '../types'
import { partImages } from './images'

export interface SeedPart extends Part {
  /** Typical single-unit price in INR at an Indian hobby store; offers are generated around it. */
  basePriceInr: number
  /** Branded part that global distributors (DigiKey, Mouser) also stock. */
  global: boolean
}

type Row = [
  id: string,
  mpn: string,
  name: string,
  manufacturer: string,
  basePriceInr: number,
  global: boolean,
  description: string,
  specs: Record<string, string>,
]

const rows: Record<CategoryId, Row[]> = {
  microcontrollers: [
    ['esp32-devkitc', 'ESP32-DevKitC-32E', 'ESP32 DevKitC (WROOM-32E)', 'Espressif', 650, true, 'Dual-core Wi-Fi + Bluetooth dev board, the default choice for most IoT projects.', { CPU: 'Xtensa LX6 dual-core, 240 MHz', Flash: '4 MB', Wireless: 'Wi-Fi 4, BT 4.2 + BLE', GPIO: '34' }],
    ['esp32-s3-devkitc', 'ESP32-S3-DevKitC-1-N8R8', 'ESP32-S3 DevKitC-1 (8MB/8MB)', 'Espressif', 1150, true, 'ESP32-S3 board with PSRAM and native USB, good for camera and AI-at-the-edge projects.', { CPU: 'Xtensa LX7 dual-core, 240 MHz', Flash: '8 MB', PSRAM: '8 MB', Wireless: 'Wi-Fi 4, BLE 5' }],
    ['esp32-c3-devkitm', 'ESP32-C3-DevKitM-1', 'ESP32-C3 DevKitM-1', 'Espressif', 550, true, 'Low-cost RISC-V Wi-Fi + BLE board.', { CPU: 'RISC-V single-core, 160 MHz', Flash: '4 MB', Wireless: 'Wi-Fi 4, BLE 5', GPIO: '15' }],
    ['nodemcu-esp8266', 'NodeMCU-ESP12E', 'NodeMCU ESP8266 (ESP-12E)', 'Generic', 280, false, 'Classic cheap Wi-Fi board based on the ESP8266.', { CPU: 'Tensilica L106, 80/160 MHz', Flash: '4 MB', Wireless: 'Wi-Fi 4', GPIO: '11' }],
    ['arduino-uno-r3', 'A000066', 'Arduino Uno Rev3', 'Arduino', 2300, true, 'The original ATmega328P Arduino board.', { MCU: 'ATmega328P, 16 MHz', Flash: '32 KB', 'Digital I/O': '14', 'Operating voltage': '5 V' }],
    ['arduino-nano-every', 'ABX00028', 'Arduino Nano Every', 'Arduino', 1500, true, 'Small breadboard-friendly Arduino with the ATmega4809.', { MCU: 'ATmega4809, 20 MHz', Flash: '48 KB', 'Digital I/O': '14', 'Operating voltage': '5 V' }],
    ['arduino-nano-33-iot', 'ABX00027', 'Arduino Nano 33 IoT', 'Arduino', 2700, true, 'Nano form factor with Wi-Fi, BLE and a crypto chip.', { MCU: 'SAMD21 Cortex-M0+, 48 MHz', Wireless: 'Wi-Fi, BLE (NINA-W102)', IMU: 'LSM6DS3', 'Operating voltage': '3.3 V' }],
    ['rpi-pico-w', 'SC0918', 'Raspberry Pi Pico W', 'Raspberry Pi', 650, true, 'RP2040 microcontroller board with on-board Wi-Fi.', { MCU: 'RP2040 dual Cortex-M0+, 133 MHz', Flash: '2 MB', Wireless: 'Wi-Fi 4, BLE', GPIO: '26' }],
    ['rpi-pico-2-w', 'SC1633', 'Raspberry Pi Pico 2 W', 'Raspberry Pi', 750, true, 'RP2350-based Pico with Wi-Fi and more memory.', { MCU: 'RP2350 dual Cortex-M33, 150 MHz', Flash: '4 MB', SRAM: '520 KB', Wireless: 'Wi-Fi 4, BLE 5.2' }],
    ['rpi-5-4gb', 'SC1111', 'Raspberry Pi 5 (4GB)', 'Raspberry Pi', 5800, true, 'Single-board computer for gateways, dashboards and edge processing.', { CPU: 'Cortex-A76 quad-core, 2.4 GHz', RAM: '4 GB LPDDR4X', Wireless: 'Wi-Fi 5, BT 5.0', Power: '5 V / 5 A USB-C' }],
    ['rpi-zero-2-w', 'SC1146', 'Raspberry Pi Zero 2 W', 'Raspberry Pi', 1700, true, 'Tiny Linux board, great as a low-power IoT gateway.', { CPU: 'Cortex-A53 quad-core, 1 GHz', RAM: '512 MB', Wireless: 'Wi-Fi 4, BLE 4.2' }],
    ['stm32-bluepill', 'STM32F103C8T6-BP', 'STM32 Blue Pill (STM32F103C8T6)', 'Generic', 300, false, 'Cheap ARM Cortex-M3 development board.', { MCU: 'STM32F103C8T6, 72 MHz', Flash: '64 KB', 'Operating voltage': '3.3 V' }],
  ],
  sensors: [
    ['dht22', 'AM2302', 'DHT22 Temperature & Humidity Sensor', 'Aosong', 280, true, 'Digital temperature and humidity sensor with single-wire interface.', { Temperature: '-40 to 80 °C (±0.5 °C)', Humidity: '0–100 % RH (±2 %)', Interface: 'Single-wire', Supply: '3.3–6 V' }],
    ['dht11', 'DHT11', 'DHT11 Temperature & Humidity Sensor', 'Aosong', 90, false, 'Basic low-cost temperature and humidity sensor.', { Temperature: '0 to 50 °C (±2 °C)', Humidity: '20–90 % RH (±5 %)', Interface: 'Single-wire', Supply: '3.3–5 V' }],
    ['bme280', 'BME280-MOD', 'BME280 Pressure/Temp/Humidity Breakout', 'Bosch Sensortec', 450, true, 'Environmental sensor for weather stations.', { Pressure: '300–1100 hPa', Temperature: '-40 to 85 °C', Humidity: '0–100 % RH', Interface: 'I2C / SPI' }],
    ['bmp280', 'BMP280-MOD', 'BMP280 Barometric Pressure Sensor', 'Bosch Sensortec', 120, false, 'Pressure and temperature sensor, often used for altitude.', { Pressure: '300–1100 hPa', Temperature: '-40 to 85 °C', Interface: 'I2C / SPI' }],
    ['ds18b20-wp', 'DS18B20-WP', 'DS18B20 Waterproof Temperature Probe', 'Analog Devices', 120, true, 'Stainless-steel probe for liquids and soil, 1 m cable.', { Range: '-55 to 125 °C', Accuracy: '±0.5 °C', Interface: '1-Wire', Supply: '3–5.5 V' }],
    ['hc-sr04', 'HC-SR04', 'HC-SR04 Ultrasonic Distance Sensor', 'Generic', 60, false, 'Ultrasonic ranging module for distance and level sensing.', { Range: '2–400 cm', Resolution: '3 mm', Supply: '5 V' }],
    ['hc-sr501', 'HC-SR501', 'HC-SR501 PIR Motion Sensor', 'Generic', 70, false, 'Passive infrared motion detector with adjustable delay.', { Range: 'up to 7 m', Angle: '120°', Supply: '4.5–20 V' }],
    ['mpu6050', 'GY-521', 'MPU-6050 6-axis Accelerometer + Gyro', 'TDK InvenSense', 150, false, 'IMU breakout for motion and orientation sensing.', { Axes: '3-axis accel + 3-axis gyro', Interface: 'I2C', Supply: '3.3–5 V' }],
    ['mq135', 'MQ-135', 'MQ-135 Air Quality Gas Sensor', 'Winsen', 150, false, 'Detects NH3, NOx, benzene, smoke and CO2.', { Output: 'Analog + digital', Supply: '5 V', Preheat: '24 h recommended' }],
    ['mq2', 'MQ-2', 'MQ-2 Smoke & LPG Gas Sensor', 'Winsen', 110, false, 'Detects LPG, propane, hydrogen and smoke.', { Output: 'Analog + digital', Supply: '5 V' }],
    ['bh1750', 'GY-302', 'BH1750 Ambient Light Sensor', 'ROHM', 110, false, 'Digital lux meter module.', { Range: '1–65535 lx', Interface: 'I2C', Supply: '3–5 V' }],
    ['soil-moisture-cap', 'SEN-CAP-V1.2', 'Capacitive Soil Moisture Sensor v1.2', 'Generic', 60, false, 'Corrosion-resistant soil moisture probe.', { Output: 'Analog 0–3 V', Supply: '3.3–5.5 V' }],
    ['vl53l0x', 'VL53L0X-MOD', 'VL53L0X Time-of-Flight Distance Sensor', 'STMicroelectronics', 350, true, 'Laser ranging sensor, accurate up to 2 m.', { Range: 'up to 2 m', Interface: 'I2C', Supply: '2.6–5 V' }],
    ['ina219', 'INA219-MOD', 'INA219 Current/Power Monitor', 'Texas Instruments', 200, true, 'High-side DC current and voltage sensor.', { Bus: '0–26 V', Current: '±3.2 A', Interface: 'I2C' }],
    ['sht31', 'SHT31-D', 'SHT31-D Temperature & Humidity Sensor', 'Sensirion', 450, true, 'High-accuracy digital humidity sensor.', { Temperature: '±0.3 °C', Humidity: '±2 % RH', Interface: 'I2C' }],
    ['max30102', 'MAX30102-MOD', 'MAX30102 Pulse Oximeter & Heart-rate Sensor', 'Analog Devices', 180, false, 'Optical SpO2 and heart-rate sensor for wearables.', { Interface: 'I2C', Supply: '1.8 V + 3.3 V' }],
  ],
  communication: [
    ['lora-ra02', 'Ra-02', 'LoRa Ra-02 SX1278 433 MHz', 'Ai-Thinker', 450, false, 'Long-range LoRa module for low-power networks.', { Chip: 'SX1278', Frequency: '433 MHz', Range: 'up to 10 km (line of sight)', Interface: 'SPI' }],
    ['rfm95w', 'RFM95W-868S2', 'RFM95W LoRa Transceiver 868 MHz', 'HopeRF', 950, true, 'LoRaWAN-capable transceiver module (IN865 band compatible).', { Chip: 'SX1276', Frequency: '868 MHz', Interface: 'SPI', 'TX power': '+20 dBm' }],
    ['nrf24l01', 'NRF24L01+', 'nRF24L01+ 2.4 GHz Transceiver', 'Nordic Semiconductor', 90, false, 'Low-cost 2.4 GHz radio for short-range links.', { Frequency: '2.4 GHz', 'Data rate': 'up to 2 Mbps', Interface: 'SPI' }],
    ['nrf24l01-pa', 'NRF24L01+PA+LNA', 'nRF24L01+ PA/LNA with Antenna', 'Nordic Semiconductor', 250, false, 'Long-range version of the nRF24L01+ with external antenna.', { Frequency: '2.4 GHz', Range: 'up to 1 km', Interface: 'SPI' }],
    ['hc05', 'HC-05', 'HC-05 Bluetooth Serial Module', 'Generic', 280, false, 'Classic Bluetooth SPP module for UART links.', { Bluetooth: '2.0 + EDR', Interface: 'UART', Supply: '3.6–6 V' }],
    ['sim800l', 'SIM800L', 'SIM800L GSM/GPRS Module', 'SIMCom', 450, false, '2G cellular module for SMS and GPRS data.', { Network: 'Quad-band GSM', Interface: 'UART', Supply: '3.4–4.4 V' }],
    ['sim7600', 'SIM7600EI', 'SIM7600EI 4G LTE Module', 'SIMCom', 3200, false, '4G LTE Cat-1 modem with GNSS for India/Europe bands.', { Network: 'LTE Cat-1', GNSS: 'GPS, GLONASS, BeiDou', Interface: 'UART / USB' }],
    ['neo6m', 'GY-NEO6MV2', 'NEO-6M GPS Module', 'u-blox', 350, false, 'GPS receiver module with ceramic antenna.', { Channels: '50', Accuracy: '2.5 m CEP', Interface: 'UART' }],
    ['rc522', 'RFID-RC522', 'RC522 RFID Reader 13.56 MHz', 'NXP', 130, false, 'RFID reader kit with card and key fob.', { Frequency: '13.56 MHz', Interface: 'SPI', Supply: '3.3 V' }],
    ['esp01', 'ESP-01S', 'ESP-01S Wi-Fi Module', 'Ai-Thinker', 150, false, 'Tiny ESP8266 module, often used as a Wi-Fi add-on for Arduino.', { Chip: 'ESP8266', Flash: '1 MB', Interface: 'UART' }],
    ['w5500', 'W5500-MOD', 'W5500 Ethernet Module', 'WIZnet', 550, true, 'Hardwired TCP/IP Ethernet controller module.', { Speed: '10/100 Mbps', Interface: 'SPI', Sockets: '8' }],
  ],
  power: [
    ['ams1117-3v3', 'AMS1117-3.3-MOD', 'AMS1117 3.3 V Regulator Module', 'Advanced Monolithic Systems', 25, false, 'Linear regulator board to power 3.3 V devices.', { Output: '3.3 V, 800 mA', Input: '4.5–7 V' }],
    ['lm2596', 'LM2596-MOD', 'LM2596 Buck Converter (Adjustable)', 'Texas Instruments', 90, false, 'Step-down DC-DC converter module.', { Input: '4–40 V', Output: '1.25–35 V', Current: '2 A (3 A peak)' }],
    ['mt3608', 'MT3608-MOD', 'MT3608 Boost Converter', 'Aerosemi', 40, false, 'Step-up DC-DC converter module.', { Input: '2–24 V', Output: 'up to 28 V', Current: '2 A' }],
    ['tp4056', 'TP4056-TYPEC', 'TP4056 Li-ion Charger (USB-C, with protection)', 'NanJing Top Power', 25, false, 'Single-cell lithium battery charging board.', { 'Charge current': '1 A', Input: '5 V USB-C', Protection: 'DW01A + FS8205' }],
    ['18650-2600', 'INR18650-26J', '18650 Li-ion Cell 2600 mAh', 'Samsung SDI', 250, false, 'Rechargeable lithium-ion cell for battery-powered nodes.', { Capacity: '2600 mAh', Voltage: '3.6 V nominal', 'Max discharge': '5.2 A' }],
    ['hlk-pm01', 'HLK-PM01', 'HLK-PM01 AC-DC 5 V Power Module', 'Hi-Link', 280, false, 'Compact 230 V AC to 5 V DC converter for mains-powered devices.', { Input: '100–240 V AC', Output: '5 V, 600 mA' }],
    ['relay-2ch', 'RELAY-2CH-5V', '2-Channel 5 V Relay Module (optocoupled)', 'Songle', 110, false, 'Switch mains loads from a microcontroller.', { Channels: '2', Contact: '10 A 250 V AC', Trigger: 'Active low' }],
  ],
  displays: [
    ['ssd1306-096', 'SSD1306-128X64-I2C', '0.96" OLED Display 128×64 (I2C)', 'Solomon Systech', 220, false, 'Small monochrome OLED for status readouts.', { Resolution: '128×64', Controller: 'SSD1306', Interface: 'I2C' }],
    ['lcd1602-i2c', 'LCD1602-I2C', '16×2 LCD with I2C Backpack', 'Generic', 180, false, 'Character LCD with PCF8574 I2C adapter.', { Characters: '16×2', Backlight: 'Blue / white', Interface: 'I2C' }],
    ['st7735-18', 'ST7735-1.8', '1.8" TFT Display 128×160', 'Sitronix', 350, false, 'Colour SPI TFT with SD card slot.', { Resolution: '128×160', Controller: 'ST7735', Interface: 'SPI' }],
    ['ili9341-24', 'ILI9341-2.4-TOUCH', '2.4" TFT Touch Display 240×320', 'Ilitek', 750, false, 'Colour TFT with resistive touch panel.', { Resolution: '240×320', Controller: 'ILI9341', Touch: 'Resistive (XPT2046)', Interface: 'SPI' }],
    ['epaper-213', 'WS-12915', '2.13" E-Paper Display Module', 'Waveshare', 1600, true, 'Ultra-low-power e-ink display, keeps image without power.', { Resolution: '250×122', Colours: 'Black / white', Interface: 'SPI' }],
    ['max7219-8x8', 'MAX7219-8X8', 'MAX7219 8×8 LED Matrix Module', 'Analog Devices', 130, false, 'Cascadable red LED dot matrix.', { LEDs: '64', Interface: 'SPI', Supply: '5 V' }],
    ['tm1637', 'TM1637-4DIG', 'TM1637 4-Digit 7-Segment Display', 'Titan Micro', 70, false, 'Clock-style numeric display.', { Digits: '4', Interface: '2-wire', Supply: '3.3–5 V' }],
  ],
  motors: [
    ['sg90', 'SG90', 'SG90 Micro Servo 9g', 'Tower Pro', 110, false, 'Small hobby servo for light mechanisms.', { Torque: '1.8 kg·cm', Rotation: '180°', Supply: '4.8–6 V' }],
    ['mg996r', 'MG996R', 'MG996R Metal Gear Servo', 'Tower Pro', 350, false, 'High-torque servo with metal gears.', { Torque: '11 kg·cm', Rotation: '180°', Supply: '4.8–7.2 V' }],
    ['28byj48', '28BYJ-48-ULN2003', '28BYJ-48 Stepper + ULN2003 Driver', 'Generic', 150, false, 'Cheap geared stepper motor kit.', { Steps: '2048 per rev (geared)', Supply: '5 V' }],
    ['nema17', '17HS4401', 'NEMA 17 Stepper Motor 1.7 A', 'Generic', 950, false, 'Standard stepper for 3D printers and CNC.', { 'Holding torque': '40 N·cm', 'Step angle': '1.8°', Current: '1.7 A' }],
    ['l298n', 'L298N-MOD', 'L298N Dual H-Bridge Motor Driver', 'STMicroelectronics', 150, false, 'Drives two DC motors or one stepper.', { Channels: '2', Current: '2 A per channel', Supply: '5–35 V' }],
    ['a4988', 'A4988-MOD', 'A4988 Stepper Driver', 'Allegro MicroSystems', 110, false, 'Microstepping driver for bipolar steppers.', { Microstepping: 'up to 1/16', Current: '2 A max', Supply: '8–35 V' }],
    ['drv8825', 'DRV8825-MOD', 'DRV8825 Stepper Driver', 'Texas Instruments', 180, true, 'Higher-current stepper driver with 1/32 microstepping.', { Microstepping: 'up to 1/32', Current: '2.5 A max', Supply: '8.2–45 V' }],
    ['tb6612fng', 'TB6612FNG-MOD', 'TB6612FNG Dual Motor Driver', 'Toshiba', 250, true, 'Efficient MOSFET motor driver for small robots.', { Channels: '2', Current: '1.2 A per channel', Supply: '2.5–13.5 V' }],
  ],
}

export const seedParts: SeedPart[] = Object.entries(rows).flatMap(([category, list]) =>
  list.map(([id, mpn, name, manufacturer, basePriceInr, global, description, specs]) => ({
    id,
    mpn,
    name,
    manufacturer,
    category: category as CategoryId,
    description,
    specs,
    image: partImages[id],
    basePriceInr,
    global,
  })),
)

/** Parts shown in the dashboard's "trending" list. */
export const trendingPartIds = ['esp32-devkitc', 'rpi-pico-w', 'dht22', 'lora-ra02', 'ssd1306-096', 'bme280']
