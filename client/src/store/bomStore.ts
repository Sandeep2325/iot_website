import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BomItem {
  partId: string
  quantity: number
}

interface BomState {
  items: BomItem[]
  /** Adds a part, or increases its quantity if it's already in the list. */
  add: (partId: string, quantity?: number) => void
  setQuantity: (partId: string, quantity: number) => void
  remove: (partId: string) => void
  replace: (items: BomItem[]) => void
  clear: () => void
}

const cleanQty = (q: number) => Math.max(1, Math.floor(q) || 1)

export const useBom = create<BomState>()(
  persist(
    (set) => ({
      items: [],
      add: (partId, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.partId === partId)
          if (existing) {
            return { items: s.items.map((i) => (i.partId === partId ? { ...i, quantity: cleanQty(i.quantity + quantity) } : i)) }
          }
          return { items: [...s.items, { partId, quantity: cleanQty(quantity) }] }
        }),
      setQuantity: (partId, quantity) =>
        set((s) => ({ items: s.items.map((i) => (i.partId === partId ? { ...i, quantity: cleanQty(quantity) } : i)) })),
      remove: (partId) => set((s) => ({ items: s.items.filter((i) => i.partId !== partId) })),
      replace: (items) => set({ items: items.map((i) => ({ ...i, quantity: cleanQty(i.quantity) })) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'partscout-bom' },
  ),
)
