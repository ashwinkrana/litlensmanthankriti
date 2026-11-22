import { AnimatePresence, motion } from 'motion/react'
import { useHoot } from '../../lib/hootContext'
import type { Theme } from '../TopBar'
import { HootFigure } from './HootFigure'

type Bubble = 'left' | 'below' | 'none'

/**
 * Hoot plus his speech bubble, reading the shared Hoot state. Used on every
 * page: `bubble="left"` puts the caption beside him (wide layouts),
 * `"below"` under him (narrow or sticky columns), `"none"` keeps it for
 * screen readers only.
 */
export function HootSpeaker({
  theme,
  animate,
  size = 140,
  bubble = 'left',
  onBand = false,
  floor = 0.7,
  className = '',
}: {
  theme: Theme
  animate: boolean
  size?: number
  bubble?: Bubble
  onBand?: boolean
  floor?: number
  className?: string
}) {
  const { mood, caption } = useHoot()
  const figure = (
    <HootFigure
      mood={mood}
      theme={theme}
      animate={animate}
      floor={floor}
      onBand={onBand}
      className="pointer-events-auto shrink-0"
      style={{ width: size, height: size }}
    />
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
  const below = bubble === 'below'
  return (
    <div className={`flex ${below ? 'flex-col items-center' : 'items-end gap-2'} ${className}`}>
      {below && figure}
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={caption}
          aria-live="polite"
          className={`pointer-events-auto relative rounded-xl border border-edge bg-card px-3 py-2 text-sm leading-snug text-txt shadow-book-lift ${
            below ? '-mt-1 w-full max-w-[18rem] text-center' : 'mb-16 max-w-[15rem]'
          }`}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {caption}
          {/* the bubble's tail, pointing at Hoot */}
          <span
            aria-hidden="true"
            className={`absolute h-3 w-3 rotate-45 border-edge bg-card ${
              below ? '-top-[7px] left-1/2 -ml-1.5 border-l border-t' : '-right-[7px] bottom-4 border-r border-t'
            }`}
          />
        </motion.p>
      </AnimatePresence>
      {!below && figure}
    </div>
  )
}

/** Narrow home page: a small Hoot beside the volume number (caption read out, not shown). */
export function HootInline({ theme, animate }: { theme: Theme; animate: boolean }) {
  return <HootSpeaker theme={theme} animate={animate} size={104} bubble="none" onBand floor={0.6} className="shrink-0" />
}

/**
 * Wide home page: Hoot standing on top of the contents card, caption beside
 * him. The parent must be `relative`; Hoot sits on its top edge.
 */
export function HootPerch({ theme, animate }: { theme: Theme; animate: boolean }) {
  return (
    <HootSpeaker
      theme={theme}
      animate={animate}
      onBand
      className="pointer-events-none absolute -top-[132px] right-4"
    />
  )
}

/** Phones: Hoot's current line as a slim note (pair with a small HootSpeaker bubble="none"). */
export function HootNote({ className = '' }: { className?: string }) {
  const { caption } = useHoot()
  return <p className={`rounded-lg border border-edge bg-card px-3 py-2 text-sm text-txt ${className}`}>{caption}</p>
}
