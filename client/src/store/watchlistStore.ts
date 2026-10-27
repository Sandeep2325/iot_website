import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WatchItem {
  partId: string
  /** Alert when the lowest single-unit price drops to or below this, in INR. */
  targetPriceInr: number
  createdAt: string
}

interface WatchlistState {
  items: WatchItem[]
  add: (partId: string, targetPriceInr: number) => void
  setTarget: (partId: string, targetPriceInr: number) => void
  remove: (partId: string) => void
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set) => ({
      items: [],
      add: (partId, targetPriceInr) =>
        set((s) =>
          s.items.some((i) => i.partId === partId)
            ? s
            : { items: [...s.items, { partId, targetPriceInr, createdAt: new Date().toISOString() }] },
        ),
      setTarget: (partId, targetPriceInr) =>
        set((s) => ({ items: s.items.map((i) => (i.partId === partId ? { ...i, targetPriceInr } : i)) })),
      remove: (partId) => set((s) => ({ items: s.items.filter((i) => i.partId !== partId) })),
    }),
    { name: 'partscout-watchlist' },
  ),
)
