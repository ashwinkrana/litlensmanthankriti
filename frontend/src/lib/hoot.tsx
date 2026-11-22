import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HootContext, type HootLine, type HootMood } from './hootContext'

/**
 * Holds what Hoot is doing. `base` comes from the app's real state (the run's
 * stage, results ready, a failed run); a page can add a standing scene and
 * components add short reactions on top.
 */
export function HootProvider({ base, children }: { base: HootLine; children: ReactNode }) {
  const [reaction, setReaction] = useState<HootLine | null>(null)
  const [scene, setScene] = useState<HootLine | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const react = useCallback((mood: HootMood, caption: string, ms = 2500) => {
    if (timer.current) clearTimeout(timer.current)
    setReaction({ mood, caption })
    timer.current = setTimeout(() => setReaction(null), ms)
  }, [])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  // Priority: a short reaction, then a celebration, then the open page's scene, then the app state.
  const shown = reaction ?? (base.mood === 'celebrating' ? base : (scene ?? base))
  const value = useMemo(() => ({ ...shown, react, setScene }), [shown, react])
  return <HootContext.Provider value={value}>{children}</HootContext.Provider>
}

