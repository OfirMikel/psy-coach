import { Lock } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import type { Pair, UnitProgress } from '../types'

type DailyInfo = {
  dayNumber: number
  nextSessionCount: number
  isDoneToday: boolean
}

type Props = {
  unit: number
  pairs: Pair[]
  progress: UnitProgress
  dailyInfo?: DailyInfo
  onClick: () => void
}

export function UnitCard({ unit, pairs, progress, dailyInfo, onClick }: Props) {
  const total = pairs.length
  const seen = Object.keys(progress).length
  const masteryPct = total > 0 ? Math.round((seen / total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className="w-full text-right rounded-2xl p-4 flex flex-col gap-2 bg-bg-white border border-stroke shadow-card transition-all active:scale-95"
    >
      <div className="flex items-center justify-between">
        {dailyInfo ? (
          <>
            <div className="flex items-center gap-2">
              {dailyInfo.isDoneToday && (
                <Lock size={13} className="text-grey-disable" />
              )}
              <span className="text-sm text-text-grey">
                {dailyInfo.isDoneToday
                  ? 'הושלם היום'
                  : `${dailyInfo.nextSessionCount} מילים`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-system-yellow-light text-system-yellow font-medium"
              >
                יום {dailyInfo.dayNumber}
              </span>
              <span className="font-semibold text-text-dark">יחידה {unit}</span>
            </div>
          </>
        ) : (
          <>
            <span className="text-sm text-text-grey">{seen}/{total} נראו</span>
            <span className="font-semibold text-text-dark">יחידה {unit}</span>
          </>
        )}
      </div>
      <ProgressBar count={seen} max={total} />
      <span className="text-xs text-text-grey">{masteryPct}% הושלם</span>
    </button>
  )
}
