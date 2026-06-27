import { useState, useCallback } from 'react'
import type { Pair, DailyPair, DailyStore, DailyUnitState, Mode } from '../types'

const LS_KEY = 'psycoach_daily'
const WORDS_PER_DAY = 7

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyStore(): DailyStore {
  return { en: {}, he: {} }
}

function loadStore(): DailyStore {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as DailyStore
  } catch {}
  return emptyStore()
}

function saveStore(store: DailyStore) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store))
  } catch {}
}

type DailyActions = {
  /** Build (or retrieve) today's deck. Writes new day assignments if needed. */
  getOrBuildTodaysDeck: (mode: Mode, unit: number, allPairs: Pair[]) => DailyPair[]
  /** Mark today's session complete for this mode+unit. */
  completeSession: (mode: Mode, unit: number) => void
  /** True if the user already finished a session today for this mode+unit. */
  isSessionDoneToday: (mode: Mode, unit: number) => boolean
  /** Current day number (dayReached + 1). Returns 1 if never started. */
  getDayNumber: (mode: Mode, unit: number) => number
  /** How many words will be in the upcoming session (cumulative). */
  getNextSessionCount: (mode: Mode, unit: number, totalPairs: number) => number
}

export function useDailyProgress(): [DailyStore, DailyActions] {
  const [store, setStore] = useState<DailyStore>(loadStore)

  // ── helpers ──────────────────────────────────────────────────────────────

  function getUnitState(mode: Mode, unit: number): DailyUnitState | undefined {
    return store[mode][`unit_${unit}`]
  }

  function patchStore(mode: Mode, unit: number, patch: Partial<DailyUnitState>): DailyStore {
    const unitKey = `unit_${unit}`
    const prev = store[mode][unitKey] ?? {
      startDate: todayISO(),
      lastSessionDate: '',
      dayReached: 0,
      assignments: {},
    }
    const next: DailyStore = {
      ...store,
      [mode]: {
        ...store[mode],
        [unitKey]: { ...prev, ...patch },
      },
    }
    saveStore(next)
    return next
  }

  // ── public actions ────────────────────────────────────────────────────────

  const getOrBuildTodaysDeck = useCallback(
    (mode: Mode, unit: number, allPairs: Pair[]): DailyPair[] => {
      const unitKey = `unit_${unit}`
      const today = todayISO()

      const existing = store[mode][unitKey]
      const currentState: DailyUnitState = existing ?? {
        startDate: today,
        lastSessionDate: '',
        dayReached: 0,
        assignments: {},
      }

      const dayNumber = currentState.dayReached + 1
      let assignments = { ...currentState.assignments }

      // Assign new words for today if not done yet
      if (!assignments[String(dayNumber)]) {
        const alreadyAssigned = new Set(Object.values(assignments).flat())
        const newTerms = allPairs
          .filter(p => !alreadyAssigned.has(p.from))
          .slice(0, WORDS_PER_DAY)
          .map(p => p.from)

        if (newTerms.length > 0) {
          assignments = { ...assignments, [String(dayNumber)]: newTerms }
        }

        // Persist updated assignments
        const next = patchStore(mode, unit, {
          startDate: currentState.startDate,
          lastSessionDate: currentState.lastSessionDate,
          dayReached: currentState.dayReached,
          assignments,
        })
        setStore(next)
      }

      // Collect all terms up to dayNumber in order, preserving original pair order
      const todayTerms = new Set(assignments[String(dayNumber)] ?? [])
      const allTerms = new Set(
        Object.entries(assignments)
          .filter(([d]) => parseInt(d) <= dayNumber)
          .flatMap(([, terms]) => terms)
      )

      return allPairs
        .filter(p => allTerms.has(p.from))
        .map(p => ({ ...p, isNew: todayTerms.has(p.from) }))
    },
    [store] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const completeSession = useCallback(
    (mode: Mode, unit: number) => {
      const existing = store[mode][`unit_${unit}`]
      const dayNumber = existing ? existing.dayReached + 1 : 1
      const next = patchStore(mode, unit, {
        lastSessionDate: todayISO(),
        dayReached: dayNumber,
      })
      setStore(next)
    },
    [store] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const isSessionDoneToday = useCallback(
    (mode: Mode, unit: number): boolean => {
      return getUnitState(mode, unit)?.lastSessionDate === todayISO()
    },
    [store]
  )

  const getDayNumber = useCallback(
    (mode: Mode, unit: number): number => {
      return (getUnitState(mode, unit)?.dayReached ?? 0) + 1
    },
    [store]
  )

  const getNextSessionCount = useCallback(
    (mode: Mode, unit: number, totalPairs: number): number => {
      const state = getUnitState(mode, unit)
      if (!state) return WORDS_PER_DAY
      const alreadyAssigned = Object.values(state.assignments).flat().length
      const newToday = Math.min(WORDS_PER_DAY, totalPairs - alreadyAssigned)
      return alreadyAssigned + Math.max(0, newToday)
    },
    [store]
  )

  return [
    store,
    { getOrBuildTodaysDeck, completeSession, isSessionDoneToday, getDayNumber, getNextSessionCount },
  ]
}
