import { Check } from 'lucide-react'

type Props = {
  count: number
  max?: number
  className?: string
}

export function ProgressBar({ count, max = 28, className = '' }: Props) {
  const pct = Math.min(100, Math.round((count / max) * 100))
  const mastered = pct >= 100

  const fillClass =
    pct < 36 ? 'bg-system-red' :
    pct < 72 ? 'bg-system-yellow' :
               'bg-system-green'

  const trackClass =
    pct < 36 ? 'bg-system-red-light-10' :
    pct < 72 ? 'bg-system-yellow-light' :
               'bg-system-green-light'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 rounded-full overflow-hidden h-1.5 ${trackClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {mastered && <Check size={12} className="text-system-green shrink-0" />}
    </div>
  )
}
