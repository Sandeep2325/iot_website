import type { Category, Vendor } from '../types'

export const vendors: Vendor[] = [
  { id: 'robu', name: 'Robu.in', region: 'IN', currency: 'INR', website: 'https://robu.in' },
  { id: 'robocraze', name: 'Robocraze', region: 'IN', currency: 'INR', website: 'https://robocraze.com' },
  { id: 'evelta', name: 'Evelta', region: 'IN', currency: 'INR', website: 'https://evelta.com' },
  { id: 'digikey', name: 'DigiKey', region: 'GLOBAL', currency: 'USD', website: 'https://www.digikey.in' },
  { id: 'mouser', name: 'Mouser', region: 'GLOBAL', currency: 'USD', website: 'https://www.mouser.in' },
  { id: 'lcsc', name: 'LCSC', region: 'GLOBAL', currency: 'USD', website: 'https://www.lcsc.com' },
]

export const categories: Category[] = [
  { id: 'microcontrollers', name: 'Microcontrollers & boards' },
  { id: 'sensors', name: 'Sensors' },
  { id: 'communication', name: 'Communication modules' },
  { id: 'power', name: 'Power' },
  { id: 'displays', name: 'Displays' },
  { id: 'motors', name: 'Motors & drivers' },
]
