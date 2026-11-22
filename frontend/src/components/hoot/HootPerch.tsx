import { AnimatePresence, motion } from 'motion/react'
import { useHoot } from '../../lib/hootContext'
import type { Theme } from '../TopBar'
import { HootFigure } from './HootFigure'

/** Narrow screens: a small Hoot in the flow of the page (caption read out, not shown). */
export function HootInline({ theme, animate }: { theme: Theme; animate: boolean }) {
  const { mood, caption } = useHoot()
  return (
    <div className="shrink-0">
      <HootFigure mood={mood} theme={theme} animate={animate} floor={0.6} onBand className="h-[104px] w-[104px]" />
      <span className="sr-only" aria-live="polite">
        {caption}
      </span>
    </div>
  )
}

/**
 * Hoot standing on top of whatever this is placed in (the home page's
 * contents card), with his caption in a speech bubble beside him.
 * Position the parent `relative`; Hoot sits on its top edge.
 */
export function HootPerch({ theme, animate }: { theme: Theme; animate: boolean }) {
  const { mood, caption } = useHoot()
  return (
    <div className="pointer-events-none absolute -top-[132px] right-4 flex items-end gap-2">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={caption}
          aria-live="polite"
          className="pointer-events-auto relative mb-16 max-w-[15rem] rounded-xl border border-edge bg-card px-3 py-2 text-sm leading-snug text-txt shadow-book-lift"
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {caption}
          {/* the bubble's tail, pointing at Hoot */}
          <span
            aria-hidden="true"
            className="absolute -right-[7px] bottom-4 h-3 w-3 rotate-45 border-r border-t border-edge bg-card"
          />
        </motion.p>
      </AnimatePresence>
      <HootFigure mood={mood} theme={theme} animate={animate} floor={0.7} onBand className="pointer-events-auto h-[140px] w-[140px]" />
    </div>
  )
}
