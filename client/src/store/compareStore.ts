import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_COMPARE = 4

interface CompareState {
  partIds: string[]
  /** Returns false when the list is already full. */
  add: (partId: string) => boolean
  remove: (partId: string) => void
  clear: () => void
}

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      partIds: [],
      add: (partId) => {
        const { partIds } = get()
        if (partIds.includes(partId)) return true
        if (partIds.length >= MAX_COMPARE) return false
        set({ partIds: [...partIds, partId] })
        return true
      },
      remove: (partId) => set((s) => ({ partIds: s.partIds.filter((id) => id !== partId) })),
      clear: () => set({ partIds: [] }),
    }),
    { name: 'partscout-compare' },
  ),
)
