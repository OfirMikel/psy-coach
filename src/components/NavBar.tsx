import { ChevronRight } from 'lucide-react'

type Props = {
  title: string
  onBack?: () => void
  right?: React.ReactNode
}

export function NavBar({ title, onBack, right }: Props) {
  return (
    <div className="flex items-center px-4 py-3 gap-3 bg-bg-white border-b border-stroke-light">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="חזרה"
          className="flex items-center justify-center rounded-full w-9 h-9 text-blue-bright"
        >
          <ChevronRight size={22} />
        </button>
      )}
      <span className="flex-1 font-semibold text-base text-text-dark">
        {title}
      </span>
      {right}
    </div>
  )
}
