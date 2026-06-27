import { useState } from 'react'
import { Globe, BookOpenText, ChevronDown, ChevronUp } from 'lucide-react'
import { NavBar } from '../components/NavBar'
import { ProgressBar } from '../components/ProgressBar'
import type { MappingFile, Mode, ProgressStore } from '../types'

const MASTERY_THRESHOLD = 28

type Props = {
  enData: MappingFile
  heData: MappingFile
  store: ProgressStore
  onBack: () => void
}

type SectionProps = {
  mode: Mode
  label: string
  icon: React.ReactNode
  data: MappingFile
  store: ProgressStore
}

function ModeSection({ mode, label, icon, data, store }: SectionProps) {
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)
  const modeProgress = store[mode]
  const units = Array.from({ length: 10 }, (_, i) => `unit_${i + 1}`)

  const totalCards    = units.reduce((s, uk) => s + (data.mapping[uk]?.length ?? 0), 0)
  const totalSeen     = units.reduce((s, uk) => s + Object.keys(modeProgress[uk] ?? {}).length, 0)
  const totalMastered = units.reduce((s, uk) =>
    s + Object.values(modeProgress[uk] ?? {}).filter(n => n >= MASTERY_THRESHOLD).length, 0)

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="rounded-2xl p-4 flex flex-col gap-2 bg-bg-white border border-stroke-light">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-base text-text-dark">{label}</span>
        </div>
        <div className="flex justify-between text-sm text-text-grey">
          <span>{totalMastered} מיומנות מלאה</span>
          <span>{totalSeen} / {totalCards} נראו</span>
        </div>
        <ProgressBar count={totalSeen} max={totalCards} />
      </div>

      {/* Unit rows */}
      {units.map((unitKey, i) => {
        const unit = i + 1
        const pairs = data.mapping[unitKey] ?? []
        const unitProg = modeProgress[unitKey] ?? {}
        const seenCount = Object.keys(unitProg).length
        const masteredCount = Object.values(unitProg).filter(n => n >= MASTERY_THRESHOLD).length
        const isExpanded = expandedUnit === unitKey
        const seenPairs = pairs.filter(p => (unitProg[p.from] ?? 0) > 0)

        return (
          <div key={unitKey}>
            <button
              onClick={() => setExpandedUnit(isExpanded ? null : unitKey)}
              className={`w-full text-right rounded-2xl p-4 flex flex-col gap-2 bg-bg-white border transition-colors ${
                isExpanded ? 'border-blue-bright' : 'border-stroke-light'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp size={14} className="text-text-grey" /> : <ChevronDown size={14} className="text-text-grey" />}
                  <span className="text-xs text-text-grey">{seenCount}/{pairs.length}</span>
                  {masteredCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-system-green-light text-system-green">
                      {masteredCount} מיומן
                    </span>
                  )}
                </div>
                <span className="font-medium text-text-dark">יחידה {unit}</span>
              </div>
              <ProgressBar count={seenCount} max={pairs.length} />
            </button>

            {/* Expanded card list */}
            {isExpanded && (
              <div className="mt-1 rounded-2xl overflow-hidden border border-stroke-light bg-bg-white">
                {seenPairs.length === 0 ? (
                  <p className="p-4 text-center text-sm text-text-grey">
                    עדיין לא נצפו כרטיסיות ביחידה זו
                  </p>
                ) : (
                  seenPairs.map((pair, idx) => {
                    const count = unitProg[pair.from] ?? 0
                    return (
                      <div
                        key={pair.from}
                        className={`px-4 py-3 flex flex-col gap-2 ${idx < seenPairs.length - 1 ? 'border-b border-stroke-light' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-text-grey shrink-0">{count}/{MASTERY_THRESHOLD}</span>
                          <div className="flex flex-col items-end gap-0.5 flex-1">
                            <span
                              className="font-medium text-sm text-text-dark text-right"
                              style={{ direction: 'rtl', fontFamily: 'serif' }}
                            >
                              {pair.from}
                            </span>
                            <span
                              className="text-xs text-text-grey text-right line-clamp-2"
                              style={{ direction: mode === 'en' ? 'ltr' : 'rtl', maxWidth: '80%' }}
                            >
                              {pair.to}
                            </span>
                          </div>
                        </div>
                        <ProgressBar count={count} />
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AnalyticsPage({ enData, heData, store, onBack }: Props) {
  const allModes: Mode[] = ['en', 'he']
  const allData = { en: enData, he: heData }
  const allUnits = Array.from({ length: 10 }, (_, i) => `unit_${i + 1}`)

  const grandTotal    = allModes.reduce((s, m) => s + allUnits.reduce((ss, uk) => ss + (allData[m].mapping[uk]?.length ?? 0), 0), 0)
  const grandSeen     = allModes.reduce((s, m) => s + allUnits.reduce((ss, uk) => ss + Object.keys(store[m][uk] ?? {}).length, 0), 0)
  const grandMastered = allModes.reduce((s, m) => s + allUnits.reduce((ss, uk) =>
    ss + Object.values(store[m][uk] ?? {}).filter(n => n >= MASTERY_THRESHOLD).length, 0), 0)
  const grandPct = grandTotal > 0 ? Math.round((grandSeen / grandTotal) * 100) : 0

  return (
    <div className="flex flex-col min-h-screen bg-bg-grey">
      <NavBar title="התקדמות ונתונים" onBack={onBack} />

      <div className="flex flex-col gap-5 p-4 pb-8">
        {/* Overview */}
        <div className="rounded-2xl p-5 flex flex-col gap-4 bg-blue-bright">
          <span className="font-semibold text-base text-white">סיכום כללי</span>
          <div className="flex justify-between text-sm">
            {[
              { value: grandMastered, label: 'מיומן' },
              { value: grandSeen, label: 'נראו' },
              { value: grandTotal, label: 'סה"כ' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-white">{value}</span>
                <span className="text-white-70">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${grandPct}%` }}
            />
          </div>
        </div>

        {/* English section */}
        <ModeSection
          mode="en"
          label="לימוד אנגלית"
          icon={<Globe size={18} className="text-blue-bright" />}
          data={enData}
          store={store}
        />

        {/* Hebrew section */}
        <ModeSection
          mode="he"
          label="לימוד עברית מעמיקה"
          icon={<BookOpenText size={18} className="text-system-green" />}
          data={heData}
          store={store}
        />
      </div>
    </div>
  )
}
