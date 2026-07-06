import { create } from 'zustand'

export type View = 'detail' | 'cities'

interface ViewState {
  view: View
  setView: (view: View) => void
  toggle: () => void
}

export const useViewStore = create<ViewState>((set, get) => ({
  view: 'detail',
  setView: (view) => set({ view }),
  toggle: () => {
    const next: View = get().view === 'detail' ? 'cities' : 'detail'
    set({ view: next })
  },
}))
