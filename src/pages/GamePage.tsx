import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Shuffle, RotateCcw, Trophy, FlipHorizontal2 } from 'lucide-react'
import { Flashcard } from '../components/Flashcard'
import type { MappingFile, Mode, ProgressStore } from '../types'

type Props = {
  mode: Mode
  unit: number
  data: MappingFile
  store: ProgressStore
  recordSeen: (mode: Mode, unit: number, term: string) => void
  onBack: () => void
  onHome: () => void
}

const MODE_LABELS: Record<Mode, string> = {
  en: 'לימוד אנגלית',
  he: 'לימוד עברית',
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function GamePage({ mode, unit, data, store, recordSeen, onBack, onHome }: Props) {
  const unitKey = `unit_${unit}`
  const originalDeck = useMemo(() => data.mapping[unitKey] ?? [], [data, unitKey])

  const [deck, setDeck] = useState(originalDeck)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setDeck(originalDeck)
    setIndex(0)
    setFlipped(false)
    setIsShuffled(false)
    setFinished(false)
  }, [originalDeck])

  const currentCard = deck[index]
  const unitProgress = store[mode][unitKey] ?? {}
  const seenCount = currentCard ? (unitProgress[currentCard.from] ?? 0) : 0

  const advance = useCallback(() => {
    if (!currentCard) return
    recordSeen(mode, unit, currentCard.from)
    if (index + 1 >= deck.length) {
      setFinished(true)
    } else {
      setIndex(i => i + 1)
      setFlipped(false)
    }
  }, [currentCard, deck.length, index, mode, unit, recordSeen])

  const retreat = useCallback(() => {
    if (index === 0) return
    setIndex(i => i - 1)
    setFlipped(false)
  }, [index])

  const restart = () => {
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }

  const toggleShuffle = () => {
    setDeck(isShuffled ? originalDeck : shuffleArray(originalDeck))
    setIsShuffled(s => !s)
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') advance()
      if (e.key === 'ArrowLeft') retreat()
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped(f => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, retreat])

  const progressPct = deck.length > 0 ? Math.round(((index + 1) / deck.length) * 100) : 0

  if (finished) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-8 gap-6 text-center bg-bg-grey">
        <Trophy size={64} className="text-system-yellow" />
        <h2 className="text-xl font-bold m-0 text-text-dark">סיימת את יחידה {unit}!</h2>
        <p className="text-sm text-text-grey">עברת על {deck.length} כרטיסיות</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={restart}
            className="w-full py-3 rounded-xl font-medium text-sm bg-blue-bright text-white"
          >
            חזור על היחידה
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl font-medium text-sm bg-blue-light border border-stroke text-text-dark"
          >
            בחר יחידה אחרת
          </button>
          <button
            onClick={onHome}
            className="w-full py-3 rounded-xl font-medium text-sm text-text-grey"
          >
            דף הבית
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-grey">
      {/* Header */}
      <div className="flex items-center px-4 py-3 gap-2 bg-bg-white border-b border-stroke-light">
        <button
          onClick={onBack}
          className="text-blue-bright w-9 h-9 flex items-center justify-center"
        >
          <ChevronRight size={22} />
        </button>
        <div className="flex flex-col flex-1 text-right">
          <span className="text-xs text-text-grey">{MODE_LABELS[mode]} · יחידה {unit}</span>
          <span className="text-sm font-medium text-text-dark">{index + 1} / {deck.length}</span>
        </div>
        <button
          onClick={onHome}
          className="text-sm py-1 px-3 rounded-xl bg-blue-light text-text-dark"
        >
          יציאה
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-stroke-light">
        <div
          className="h-full bg-blue-bright transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* Seen count */}
        <div className="flex items-center justify-between text-xs text-text-grey">
          <span>יעד: 28</span>
          <span>נראתה {seenCount} פעמים</span>
        </div>

        {/* Card */}
        <Flashcard
          front={currentCard?.from ?? ''}
          back={currentCard?.to ?? ''}
          flipped={flipped}
          mode={mode}
          onClick={() => setFlipped(f => !f)}
        />

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={retreat}
            disabled={index === 0}
            className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 bg-blue-light border border-stroke text-text-dark disabled:opacity-30 transition-opacity"
          >
            <ChevronRight size={16} />
            הקודם
          </button>
          <button
            onClick={() => setFlipped(f => !f)}
            className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 bg-blue-light-2 border border-stroke text-text-dark"
          >
            <FlipHorizontal2 size={16} />
            הפוך
          </button>
          <button
            onClick={advance}
            className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 bg-blue-bright text-white"
          >
            הבא
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex gap-3">
          <button
            onClick={toggleShuffle}
            className={`flex-1 py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 border transition-colors ${
              isShuffled
                ? 'bg-system-green-light text-system-green border-system-green'
                : 'bg-blue-light text-text-grey border-stroke'
            }`}
          >
            <Shuffle size={14} />
            {isShuffled ? 'ערבוב פעיל' : 'ערבב'}
          </button>
          <button
            onClick={restart}
            className="flex-1 py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 bg-blue-light text-text-grey border border-stroke"
          >
            <RotateCcw size={14} />
            התחל מחדש
          </button>
        </div>
      </div>
    </div>
  )
}
