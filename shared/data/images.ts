import type { PartImage } from '../types'

/**
 * Freely licensed product photos from Wikimedia Commons, stored in client/public/images/parts/.
 * Each licence requires the credit shown on the part page. Parts not listed here use a drawing.
 */
export const partImages: Record<string, PartImage> = {
  'nodemcu-esp8266': {
    src: '/images/parts/nodemcu-esp8266.jpg',
    credit: {
      author: 'Vowstar',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:NodeMCU_DEVKIT_1.0.jpg',
    },
  },
  'arduino-uno-r3': {
    src: '/images/parts/arduino-uno-r3.jpg',
    credit: {
      author: 'SparkFun Electronics from Boulder, USA',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arduino_Uno_-_R3.jpg',
    },
  },
  'arduino-nano-every': {
    src: '/images/parts/arduino-nano-every.png',
    credit: {
      author: 'Enirstad',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arduino_Nano_Every.png',
    },
  },
  'rpi-5-4gb': {
    src: '/images/parts/rpi-5-4gb.jpg',
    credit: {
      author: 'SimonWaldherr',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Raspberry_Pi_5.jpg',
    },
  },
  'rpi-zero-2-w': {
    src: '/images/parts/rpi-zero-2-w.jpg',
    credit: {
      author: 'Anil Öztas',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Raspberry_Pi_Zero_2_W_--_2024_--_0012.jpg',
    },
  },
  'stm32-bluepill': {
    src: '/images/parts/stm32-bluepill.jpg',
    credit: {
      author: 'Popolon',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Core_Learning_Board_module_Arduino_STM32_F103_C8T6.jpg',
    },
  },
  dht22: {
    src: '/images/parts/dht22.jpg',
    credit: {
      author: 'Ubahnverleih',
      license: 'CC0',
      licenseUrl: 'http://creativecommons.org/publicdomain/zero/1.0/deed.en',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:DHT22-Temperatur-Sensor.jpg',
    },
  },
  bme280: {
    src: '/images/parts/bme280.jpg',
    credit: {
      author: 'SparkFun',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:SparkFun_Atmospheric_Sensor_Breakout_-_BME280_13676.jpg',
    },
  },
  bmp280: {
    src: '/images/parts/bmp280.jpg',
    credit: {
      author: 'AGermanBeck',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:BMP280Sensor.jpg',
    },
  },
  'ds18b20-wp': {
    src: '/images/parts/ds18b20-wp.jpg',
    credit: {
      author: 'Leonardo Postay',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sensor_DS18B20.jpg',
    },
  },
  'hc-sr04': {
    src: '/images/parts/hc-sr04.jpg',
    credit: {
      author: 'Suyash Dwivedi',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:HC_SR04_Ultrasonic_Module.jpg',
    },
  },
  mpu6050: {
    src: '/images/parts/mpu6050.jpg',
    credit: {
      author: 'Nevit Dilmen',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:GY-521_MPU-6050_Module_3_Axis_Gyroscope_%2B_Accelerometer_0487.jpg',
    },
  },
  ina219: {
    src: '/images/parts/ina219.jpg',
    credit: {
      author: 'oomlout',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Adafruit_INA219_high_side_DC_current_sensor_module.jpg',
    },
  },
  'lora-ra02': {
    src: '/images/parts/lora-ra02.png',
    credit: {
      author: 'VamosSandor',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ra-02.png',
    },
  },
  'nrf24l01-pa': {
    src: '/images/parts/nrf24l01-pa.jpg',
    credit: {
      author: 'Dmcole',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:NRF24l01-pa-lna-duck.jpg',
    },
  },
  rc522: {
    src: '/images/parts/rc522.jpg',
    credit: {
      author: 'Giacomo Alessandroni',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:RFID-RC522_photo.jpg',
    },
  },
  esp01: {
    src: '/images/parts/esp01.jpg',
    credit: {
      author: 'Make Magazin DE',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Esp8266.jpg',
    },
  },
  tp4056: {
    src: '/images/parts/tp4056.jpg',
    credit: {
      author: '-stk',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:TP4056_board_P1089957.jpg',
    },
  },
  '18650-2600': {
    src: '/images/parts/18650-2600.jpg',
    credit: {
      author: 'Lead holder',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:LiIon-18650-match.jpg',
    },
  },
  sg90: {
    src: '/images/parts/sg90.jpg',
    credit: {
      author: 'Suyash Dwivedi',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tower_Pro_SG90_micro_servo_motor.jpg',
    },
  },
  nema17: {
    src: '/images/parts/nema17.jpg',
    credit: {
      author: 'oomlout',
      license: 'CC BY-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nema_17_Stepper_Motor.jpg',
    },
  },
  '28byj48': {
    src: '/images/parts/28byj48.jpg',
    credit: {
      author: 'Kushagra Keshari',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:28BYJ-48_unipolar_stepper_motor_with_ULN2003_driver.jpg',
    },
  },
  a4988: {
    src: '/images/parts/a4988.jpg',
    credit: {
      author: 'Kushagra Keshari',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:A4988_stepper_motor_driver.jpg',
    },
  },
  drv8825: {
    src: '/images/parts/drv8825.jpg',
    credit: {
      author: 'Ogoorcs',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:DRV8825_stepper_motor_controller_carrier.jpg',
    },
  },
  tb6612fng: {
    src: '/images/parts/tb6612fng.jpg',
    credit: {
      author: 'Krishnav25',
      license: 'CC0',
      licenseUrl: 'http://creativecommons.org/publicdomain/zero/1.0/deed.en',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:TB6612FNG.jpg',
    },
  },
}
