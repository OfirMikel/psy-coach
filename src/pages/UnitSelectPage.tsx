import { NavBar } from '../components/NavBar'
import { UnitCard } from '../components/UnitCard'
import type { AnyMode, DailyStore, MappingFile, ModeProgress } from '../types'
import { isDailyMode, baseMode } from '../types'
import type { useDailyProgress } from '../hooks/useDailyProgress'

type DailyActions = ReturnType<typeof useDailyProgress>[1]

const MODE_LABELS: Record<AnyMode, string> = {
  en:         'לימוד אנגלית',
  he:         'לימוד עברית מעמיקה',
  'daily-en': 'לימוד יומי — אנגלית',
  'daily-he': 'לימוד יומי — עברית',
}

type Props = {
  mode: AnyMode
  data: MappingFile
  modeProgress: ModeProgress
  dailyStore?: DailyStore
  dailyActions?: DailyActions
  onSelectUnit: (unit: number) => void
  onBack: () => void
}

export function UnitSelectPage({
  mode, data, modeProgress, dailyStore, dailyActions, onSelectUnit, onBack,
}: Props) {
  const units = Array.from({ length: 10 }, (_, i) => i + 1)
  const isDaily = isDailyMode(mode)
  const bm = isDaily ? baseMode(mode) : null

  return (
    <div className="flex flex-col min-h-screen bg-bg-grey">
      <NavBar title={MODE_LABELS[mode]} onBack={onBack} />

      <div className="p-4 flex flex-col gap-3">
        <p className="text-sm font-medium text-text-grey-med">בחר יחידה</p>

        {units.map(unit => {
          const unitKey = `unit_${unit}`
          const pairs = data.mapping[unitKey] ?? []
          const unitProgress = modeProgress[unitKey] ?? {}

          const dailyInfo =
            isDaily && bm && dailyStore && dailyActions
              ? {
                  dayNumber: dailyActions.getDayNumber(bm, unit),
                  nextSessionCount: dailyActions.getNextSessionCount(bm, unit, pairs.length),
                  isDoneToday: dailyActions.isSessionDoneToday(bm, unit),
                }
              : undefined

          return (
            <UnitCard
              key={unit}
              unit={unit}
              pairs={pairs}
              progress={unitProgress}
              dailyInfo={dailyInfo}
              onClick={() => onSelectUnit(unit)}
            />
          )
        })}
      </div>
    </div>
  )
}
