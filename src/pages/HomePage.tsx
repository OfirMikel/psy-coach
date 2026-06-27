import { Globe, BookOpenText, BarChart3, CalendarDays } from 'lucide-react'
import type { AnyMode, Mode } from '../types'

type Props = {
  onSelectMode: (mode: AnyMode) => void
  onAnalytics: () => void
}

function ModeCard({
  onClick,
  icon,
  title,
  subtitle,
  iconBg,
}: {
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  iconBg: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-5 text-right flex items-start gap-4 bg-bg-white border border-stroke shadow-card active:scale-95 transition-transform"
    >
      <div className={`rounded-xl flex items-center justify-center shrink-0 w-13 h-13 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-base text-text-dark">{title}</span>
        <span className="text-sm leading-snug text-text-grey">{subtitle}</span>
      </div>
    </button>
  )
}

export function HomePage({ onSelectMode, onAnalytics }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-bg-grey">
      {/* Header */}
      <div className="px-4 pt-10 pb-6 text-right bg-bg-white border-b border-stroke-light">
        <h1 className="text-2xl font-bold m-0 text-text-dark">כרטיסיות לימוד</h1>
        <p className="mt-1 text-sm text-text-grey">תרגול אוצר מילים מהמילון Campus</p>
      </div>

      <div className="flex flex-col gap-5 p-4 flex-1">
        {/* Free practice section */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-text-grey-med">תרגול חופשי</p>

          <ModeCard
            onClick={() => onSelectMode('en' as Mode)}
            icon={<Globe size={26} className="text-blue-bright" />}
            iconBg="bg-blue-light-2"
            title="לימוד אנגלית"
            subtitle="תרגול תרגום מילים מעברית לאנגלית לפי יחידות"
          />

          <ModeCard
            onClick={() => onSelectMode('he' as Mode)}
            icon={<BookOpenText size={26} className="text-system-green" />}
            iconBg="bg-system-green-light"
            title="לימוד עברית מעמיקה"
            subtitle="הגדרות עבריות למילים עבריות — תרגול הבנת השפה"
          />
        </div>

        {/* Daily section */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-text-grey-med">לימוד יומי</p>
          <p className="text-xs text-text-grey -mt-1">
            7 מילים חדשות בכל יום, עם חזרה מצטברת על כל מה שלמדת
          </p>

          <ModeCard
            onClick={() => onSelectMode('daily-en')}
            icon={<CalendarDays size={26} className="text-system-orange" />}
            iconBg="bg-system-orange-light"
            title="לימוד יומי — אנגלית"
            subtitle="יום 1: 7 מילים · יום 2: 14 מילים · יום 3: 21 מילים…"
          />

          <ModeCard
            onClick={() => onSelectMode('daily-he')}
            icon={<CalendarDays size={26} className="text-system-orange" />}
            iconBg="bg-system-orange-light"
            title="לימוד יומי — עברית"
            subtitle="7 מילים חדשות ביום עם הגדרות עבריות"
          />
        </div>
      </div>

      {/* Analytics */}
      <div className="p-4 pb-8">
        <button
          onClick={onAnalytics}
          className="w-full rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium bg-blue-light border border-stroke text-text-dark"
        >
          <BarChart3 size={18} />
          <span>התקדמות ונתונים</span>
        </button>
      </div>
    </div>
  )
}
