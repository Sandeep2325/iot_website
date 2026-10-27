import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Currency } from '@/types'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  currency: Currency
  theme: Theme
  /** Vendor ids to prefer; empty means all vendors. */
  preferredVendors: string[]
  setCurrency: (currency: Currency) => void
  setTheme: (theme: Theme) => void
  setPreferredVendors: (vendorIds: string[]) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      currency: 'INR',
      theme: 'system',
      preferredVendors: [],
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
      setPreferredVendors: (preferredVendors) => set({ preferredVendors }),
    }),
    { name: 'partscout-settings' },
  ),
)

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && darkQuery.matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Keeps the `.dark` class on <html> in sync with the stored theme and the OS preference. */
export function initTheme() {
  applyTheme(useSettings.getState().theme)
  useSettings.subscribe((state) => applyTheme(state.theme))
  darkQuery.addEventListener('change', () => applyTheme(useSettings.getState().theme))
}
