import { useState, useCallback } from 'react'
import type { Mode, ProgressStore } from '../types'

const LS_KEY = 'psycoach_progress'

function loadStore(): ProgressStore {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as ProgressStore
  } catch {}
  return { en: {}, he: {} }
}

export function useProgress(): [ProgressStore, (mode: Mode, unit: number, term: string) => void] {
  const [store, setStore] = useState<ProgressStore>(loadStore)

  const recordSeen = useCallback((mode: Mode, unit: number, term: string) => {
    setStore(prev => {
      const unitKey = `unit_${unit}`
      const prevUnit = prev[mode][unitKey] ?? {}
      const prevCount = prevUnit[term] ?? 0
      const next: ProgressStore = {
        ...prev,
        [mode]: {
          ...prev[mode],
          [unitKey]: {
            ...prevUnit,
            [term]: prevCount + 1,
          },
        },
      }
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  return [store, recordSeen]
}
