import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useData } from './hooks/useData'
import { useProgress } from './hooks/useProgress'
import { useDailyProgress } from './hooks/useDailyProgress'
import { HomePage } from './pages/HomePage'
import { UnitSelectPage } from './pages/UnitSelectPage'
import { GamePage } from './pages/GamePage'
import { DailyGamePage } from './pages/DailyGamePage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import type { NavState, AnyMode, Mode, DailyMode } from './types'
import { isDailyMode, baseMode } from './types'

export default function App() {
  const [nav, setNav] = useState<NavState>({ view: 'home' })
  const { enData, heData, loading, error } = useData()
  const [store, recordSeen]       = useProgress()
  const [dailyStore, dailyActions] = useDailyProgress()

  const goHome       = () => setNav({ view: 'home' })
  const goUnitSelect = (mode: AnyMode) => setNav({ view: 'unitSelect', mode })
  const goGame       = (mode: Mode, unit: number) => setNav({ view: 'game', mode, unit })
  const goDailyGame  = (mode: DailyMode, unit: number) => setNav({ view: 'dailyGame', mode, unit })
  const goAnalytics  = () => setNav({ view: 'analytics' })

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-grey bg-bg-grey">
        טוען נתונים…
      </div>
    )
  }

  if (error || !enData || !heData) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-2 text-sm p-8 text-center text-text-grey bg-bg-grey">
        <AlertTriangle size={40} className="text-system-red" />
        <span>שגיאה בטעינת הנתונים</span>
        {error && <span className="text-xs opacity-60">{error}</span>}
      </div>
    )
  }

  if (nav.view === 'home') {
    return (
      <HomePage
        onSelectMode={(mode: AnyMode) => {
          if (isDailyMode(mode)) goUnitSelect(mode)
          else goUnitSelect(mode as Mode)
        }}
        onAnalytics={goAnalytics}
      />
    )
  }

  if (nav.view === 'unitSelect') {
    const isDaily = isDailyMode(nav.mode)
    const bm = isDaily ? baseMode(nav.mode as DailyMode) : nav.mode as Mode
    const data = bm === 'en' ? enData : heData

    return (
      <UnitSelectPage
        mode={nav.mode}
        data={data}
        modeProgress={store[bm]}
        dailyStore={isDaily ? dailyStore : undefined}
        dailyActions={isDaily ? dailyActions : undefined}
        onSelectUnit={unit => {
          if (isDaily) goDailyGame(nav.mode as DailyMode, unit)
          else goGame(bm, unit)
        }}
        onBack={goHome}
      />
    )
  }

  if (nav.view === 'game') {
    const data = nav.mode === 'en' ? enData : heData
    return (
      <GamePage
        mode={nav.mode}
        unit={nav.unit}
        data={data}
        store={store}
        recordSeen={recordSeen}
        onBack={() => goUnitSelect(nav.mode)}
        onHome={goHome}
      />
    )
  }

  if (nav.view === 'dailyGame') {
    const bm = baseMode(nav.mode)
    const data = bm === 'en' ? enData : heData
    return (
      <DailyGamePage
        mode={nav.mode}
        unit={nav.unit}
        data={data}
        store={store}
        recordSeen={recordSeen}
        dailyActions={dailyActions}
        onBack={() => goUnitSelect(nav.mode)}
        onHome={goHome}
        onFreePlay={() => goGame(bm, nav.unit)}
      />
    )
  }

  if (nav.view === 'analytics') {
    return (
      <AnalyticsPage
        enData={enData}
        heData={heData}
        store={store}
        onBack={goHome}
      />
    )
  }

  return null
}
