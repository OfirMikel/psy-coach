import type { Mode } from '../types'

type Props = {
  front: string
  back: string
  flipped: boolean
  mode: Mode
  isNew?: boolean
  onClick: () => void
}

export function Flashcard({ front, back, flipped, mode, isNew, onClick }: Props) {
  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1000px', minHeight: 240 }}
      onClick={onClick}
      role="button"
      aria-label="הפוך כרטיסייה"
    >
      <div
        className={`card-flip-inner relative w-full ${flipped ? 'flipped' : ''}`}
        style={{ minHeight: 240 }}
      >
        {/* Front */}
        <div className="card-face absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 bg-bg-white border border-stroke-light shadow-card">
          {isNew && (
            <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-system-yellow-light text-system-yellow">
              חדש
            </span>
          )}
          <p
            className="text-center leading-relaxed text-text-dark"
            style={{ direction: 'rtl', fontFamily: 'serif', fontSize: '2rem' }}
          >
            {front}
          </p>
          <p className="mt-4 text-sm text-text-grey">לחץ לגילוי</p>
        </div>

        {/* Back */}
        <div className="card-face card-face-back absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 bg-blue-bright shadow-card-md">
          {isNew && (
            <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
              חדש
            </span>
          )}
          <p
            className="text-center leading-relaxed text-white"
            style={{
              direction: mode === 'en' ? 'ltr' : 'rtl',
              fontFamily: mode === 'en' ? 'system-ui, sans-serif' : 'serif',
              fontSize: mode === 'en' ? '1.75rem' : '1.2rem',
              fontWeight: mode === 'en' ? 700 : 400,
            }}
          >
            {back}
          </p>
        </div>
      </div>
    </div>
  )
}
