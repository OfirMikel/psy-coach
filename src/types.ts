export type Pair = { from: string; to: string }
export type DailyPair = Pair & { isNew: boolean }

export type MappingFile = {
  name: string
  description: string
  mapping: Record<string, Pair[]>
}

export type Mode = 'en' | 'he'
export type DailyMode = 'daily-en' | 'daily-he'
export type AnyMode = Mode | DailyMode

export function baseMode(m: DailyMode): Mode {
  return m === 'daily-en' ? 'en' : 'he'
}

export function isDailyMode(m: AnyMode): m is DailyMode {
  return m === 'daily-en' || m === 'daily-he'
}

export type NavState =
  | { view: 'home' }
  | { view: 'unitSelect'; mode: AnyMode }
  | { view: 'game'; mode: Mode; unit: number }
  | { view: 'dailyGame'; mode: DailyMode; unit: number }
  | { view: 'analytics' }

// ── Regular progress ──────────────────────────────────────────────────────────
export type UnitProgress  = Record<string, number>
export type ModeProgress  = Record<string, UnitProgress>
export type ProgressStore = Record<Mode, ModeProgress>

// ── Daily progress ────────────────────────────────────────────────────────────
export type DailyUnitState = {
  startDate: string                        // ISO date of Day 1 e.g. "2026-06-27"
  lastSessionDate: string                  // ISO date of last completed session
  dayReached: number                       // highest completed day (0 = none yet)
  assignments: Record<string, string[]>   // day number (string key) → array of `from` terms
}

export type DailyModeProgress = Record<string, DailyUnitState>  // unitKey → state
export type DailyStore = Record<Mode, DailyModeProgress>
