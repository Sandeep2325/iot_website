import type { CategoryId } from '@/types'
import type { IllustrationSpec } from './PartIllustration'

// Board colours close to the real hardware, so the drawings are recognisable at a glance.
const BLACK = '#22262c'
const BLUE = '#1e5fb4'
const GREEN = '#1f7a3d'
const PURPLE = '#5b2a86'
const RED = '#b3261e'
const TEAL = '#00878f'

/** Drawing for each catalog part, used when it has no photo. */
export const illustrations: Record<string, IllustrationSpec> = {
  'esp32-devkitc': { kind: 'board', color: BLACK, label: 'ESP32' },
  'esp32-s3-devkitc': { kind: 'board', color: BLACK, label: 'ESP32-S3' },
  'esp32-c3-devkitm': { kind: 'board', color: BLACK, label: 'ESP32-C3' },
  'nodemcu-esp8266': { kind: 'board', color: BLACK, label: 'ESP8266' },
  'arduino-uno-r3': { kind: 'board', color: TEAL, label: 'UNO' },
  'arduino-nano-every': { kind: 'board', color: TEAL, label: 'NANO' },
  'arduino-nano-33-iot': { kind: 'board', color: TEAL, label: 'NANO 33' },
  'rpi-pico-w': { kind: 'board', color: GREEN, label: 'PICO W' },
  'rpi-pico-2-w': { kind: 'board', color: GREEN, label: 'PICO 2W' },
  'rpi-5-4gb': { kind: 'board', color: GREEN, label: 'Pi 5' },
  'rpi-zero-2-w': { kind: 'board', color: GREEN, label: 'ZERO 2W' },
  'stm32-bluepill': { kind: 'board', color: BLUE, label: 'STM32' },

  dht22: { kind: 'dht', color: '#f4f4f2', label: 'DHT22' },
  dht11: { kind: 'dht', color: '#4f8fd6', label: 'DHT11' },
  bme280: { kind: 'module', color: PURPLE, label: 'BME280' },
  bmp280: { kind: 'module', color: PURPLE, label: 'BMP280' },
  'ds18b20-wp': { kind: 'probe', color: BLACK, label: 'DS18B20' },
  'hc-sr04': { kind: 'ultrasonic', color: BLUE, label: 'HC-SR04' },
  'hc-sr501': { kind: 'pir', color: GREEN, label: 'HC-SR501' },
  mpu6050: { kind: 'module', color: BLUE, label: 'MPU6050' },
  mq135: { kind: 'gas', color: BLUE, label: 'MQ-135' },
  mq2: { kind: 'gas', color: BLUE, label: 'MQ-2' },
  bh1750: { kind: 'module', color: BLUE, label: 'BH1750' },
  'soil-moisture-cap': { kind: 'module', color: BLACK, label: 'SOIL v1.2' },
  vl53l0x: { kind: 'module', color: PURPLE, label: 'VL53L0X' },
  ina219: { kind: 'module', color: PURPLE, label: 'INA219' },
  sht31: { kind: 'module', color: BLUE, label: 'SHT31' },
  max30102: { kind: 'module', color: PURPLE, label: 'MAX30102' },

  'lora-ra02': { kind: 'radio-rod', color: BLACK, label: 'RA-02' },
  rfm95w: { kind: 'radio', color: GREEN, label: 'RFM95W' },
  nrf24l01: { kind: 'radio', color: GREEN, label: 'nRF24' },
  'nrf24l01-pa': { kind: 'radio-rod', color: BLACK, label: 'nRF24 PA' },
  hc05: { kind: 'radio', color: BLUE, label: 'HC-05' },
  sim800l: { kind: 'radio-rod', color: RED, label: 'SIM800L' },
  sim7600: { kind: 'radio-rod', color: BLUE, label: 'SIM7600' },
  neo6m: { kind: 'module', color: BLUE, label: 'NEO-6M' },
  rc522: { kind: 'rfid', color: BLUE, label: 'RC522' },
  esp01: { kind: 'radio', color: BLACK, label: 'ESP-01' },
  w5500: { kind: 'ethernet', color: BLUE, label: 'W5500' },

  'ams1117-3v3': { kind: 'module', color: BLUE, label: 'AMS1117' },
  lm2596: { kind: 'module', color: BLUE, label: 'LM2596' },
  mt3608: { kind: 'module', color: BLUE, label: 'MT3608' },
  tp4056: { kind: 'module', color: BLUE, label: 'TP4056' },
  '18650-2600': { kind: 'battery', color: '#2e7d32', label: '18650' },
  'hlk-pm01': { kind: 'brick', color: BLACK, label: 'HLK-PM01' },
  'relay-2ch': { kind: 'relay', color: BLUE, label: '2CH RELAY' },

  'ssd1306-096': { kind: 'display', color: BLUE, label: 'OLED', screen: 'oled' },
  'lcd1602-i2c': { kind: 'display', color: GREEN, label: '16x2 LCD', screen: 'lcd' },
  'st7735-18': { kind: 'display', color: RED, label: 'ST7735', screen: 'tft' },
  'ili9341-24': { kind: 'display', color: RED, label: 'ILI9341', screen: 'tft' },
  'epaper-213': { kind: 'display', color: BLACK, label: 'E-PAPER', screen: 'epaper' },
  'max7219-8x8': { kind: 'display', color: BLUE, label: 'MAX7219', screen: 'matrix' },
  tm1637: { kind: 'display', color: BLUE, label: 'TM1637', screen: 'segment' },

  sg90: { kind: 'servo', color: '#2563eb', label: 'SG90' },
  mg996r: { kind: 'servo', color: BLACK, label: 'MG996R' },
  '28byj48': { kind: 'stepper-round', color: '#c9ced6', label: '28BYJ-48' },
  nema17: { kind: 'stepper', color: BLACK, label: 'NEMA 17' },
  l298n: { kind: 'module', color: RED, label: 'L298N' },
  a4988: { kind: 'module', color: GREEN, label: 'A4988' },
  drv8825: { kind: 'module', color: PURPLE, label: 'DRV8825' },
  tb6612fng: { kind: 'module', color: RED, label: 'TB6612' },
}

const byCategory: Record<CategoryId, IllustrationSpec['kind']> = {
  microcontrollers: 'board',
  sensors: 'module',
  communication: 'radio',
  power: 'module',
  displays: 'display',
  motors: 'module',
}

/** Drawing for a part; parts added later get a generic one for their category. */
export function illustrationFor(part: { id: string; category: CategoryId; mpn: string }): IllustrationSpec {
  return illustrations[part.id] ?? { kind: byCategory[part.category], color: BLUE, label: part.mpn.slice(0, 10) }
}
