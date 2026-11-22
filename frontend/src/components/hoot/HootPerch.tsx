import { useHoot } from '../../lib/hootContext'
import type { Theme } from '../TopBar'
import { HootFigure } from './HootFigure'

type Bubble = 'left' | 'right' | 'below' | 'none'

/**
 * Hoot plus his speech bubble, reading the shared Hoot state. `bubble="left"`
 * puts his line beside him, `"below"` under him, `"none"` keeps it for screen
 * readers only (pair with HootNote on phones).
 */
export function HootSpeaker({
  animate,
  theme,
  size = 140,
  bubble = 'left',
  floor = 0.7,
  className = '',
}: {
  animate: boolean
  theme: Theme
  size?: number
  bubble?: Bubble
  floor?: number
  className?: string
}) {
  const { mood, caption } = useHoot()
  const figure = (
    <HootFigure mood={mood} animate={animate} theme={theme} floor={floor} className="pointer-events-auto shrink-0" style={{ width: size, height: size }} />
  )
  if (bubble === 'none') {
    return (
      <div className={className}>
        {figure}
        <span className="sr-only" aria-live="polite">
          {caption}
        </span>
      </div>
    )
  }
  if (bubble === 'right') {
    // Hoot stays centred where he is placed; the bubble floats off his right side.
    return (
      <div className={`relative w-fit ${className}`}>
        {figure}
        <p
          key={caption}
          aria-live="polite"
          className="animate-bubble-in pointer-events-auto absolute bottom-1/2 left-full ml-1 w-max max-w-[16rem] rounded-xl border border-edge bg-card px-3 py-2 text-left text-sm leading-snug text-txt shadow-book-lift"
        >
          {caption}
          <span aria-hidden="true" className="absolute -left-[7px] bottom-4 h-3 w-3 rotate-45 border-b border-l border-edge bg-card" />
        </p>
      </div>
    )
  }
  const below = bubble === 'below'
  return (
    <div className={`flex ${below ? 'flex-col items-center' : 'items-end gap-2'} ${className}`}>
      {below && figure}
      {/* key: a new line re-runs the bubble's entrance */}
      <p
        key={caption}
        aria-live="polite"
        className={`animate-bubble-in pointer-events-auto relative rounded-xl border border-edge bg-card px-3 py-2 text-left text-sm leading-snug text-txt shadow-book-lift ${
          below ? '-mt-1 w-full max-w-[18rem] text-center' : 'mb-16 max-w-[15rem]'
        }`}
      >
        {caption}
        {/* the bubble's tail, pointing at Hoot */}
        <span
          aria-hidden="true"
          className={`absolute h-3 w-3 rotate-45 border-edge bg-card ${
            below ? '-top-[7px] left-1/2 -ml-1.5 border-l border-t' : '-right-[7px] bottom-4 border-r border-t'
          }`}
        />
      </p>
      {!below && figure}
    </div>
  )
}

/** Phones: Hoot's current line as a slim note (pair with a small HootSpeaker bubble="none"). */
export function HootNote({ className = '' }: { className?: string }) {
  const { caption } = useHoot()
  return <p className={`rounded-lg border border-edge bg-card px-3 py-2 text-sm text-txt ${className}`}>{caption}</p>
}

/**
 * Wide screens: Hoot sitting on his branch, pinned to the right edge of the
 * page so the branch runs off-screen. His line sits to his left, by his head.
 * Place inside a `relative` full-width container.
 */
export function HootOnBranch({ animate, theme, size = 300, className = '' }: { animate: boolean; theme: Theme; size?: number; className?: string }) {
  const { mood, caption } = useHoot()
  return (
    <div className={`pointer-events-none absolute right-0 ${className}`} style={{ width: size, height: size }}>
      <HootFigure mood={mood} animate={animate} theme={theme} perched floor={0} className="h-full w-full" />
      <p
        key={caption}
        aria-live="polite"
        className="animate-bubble-in pointer-events-auto absolute top-[10%] w-max max-w-[15rem] rounded-xl border border-edge bg-card px-3 py-2 text-left text-sm leading-snug text-txt shadow-book-lift"
        style={{ right: 'calc(50% + 4.5rem)' }}
      >
        {caption}
        <span aria-hidden="true" className="absolute -right-[7px] top-4 h-3 w-3 rotate-45 border-r border-t border-edge bg-card" />
      </p>
    </div>
  )
}
