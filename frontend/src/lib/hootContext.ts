import { createContext, useContext, useEffect } from 'react'
import type { StageEvent } from '../api/types'

/** Hoot's moods: wobnimo's ten states. */
export type HootMood =
  | 'idle'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'working'
  | 'error'
  | 'surprised'
  | 'celebrating'
  | 'sad'
  | 'sleeping'

export type HootLine = { mood: HootMood; caption: string }

export type HootApi = HootLine & {
  /** Show a mood for a short while (e.g. listening as the user types), then fall back. */
  react: (mood: HootMood, caption: string, ms?: number) => void
  /** A page's standing line while it is open (see useHootScene). */
  setScene: (line: HootLine | null) => void
}

export const HootContext = createContext<HootApi | null>(null)

export function useHoot(): HootApi {
  const ctx = useContext(HootContext)
  if (!ctx) throw new Error('useHoot must be used inside <HootProvider>')
  return ctx
}

/**
 * Let a page say what Hoot is doing while it is mounted (e.g. commenting on
 * the open results tab). Cleared when the page unmounts.
 */
export function useHootScene(mood: HootMood, caption: string): void {
  const { setScene } = useHoot()
  useEffect(() => {
    setScene({ mood, caption })
  }, [setScene, mood, caption])
  useEffect(() => () => setScene(null), [setScene])
}

// Each pipeline stage, acted out (DESIGN §4.2 stage names).
const STAGE_MOOD: Record<StageEvent['stage'], HootMood> = {
  planning: 'thinking',
  searching: 'working',
  ranking: 'thinking',
  extracting: 'working',
  synthesizing: 'speaking',
  verifying: 'thinking',
  indexing: 'working',
  done: 'celebrating',
  error: 'error',
}

/** Hoot's mood and caption for a running review, from its latest stage event. */
export function hootForRun(events: StageEvent[]): HootLine {
  const last = events[events.length - 1]
  if (!last) return { mood: 'thinking', caption: 'Getting ready…' }
  if (last.status === 'failed') return { mood: 'sad', caption: last.message || 'That step failed.' }
  return { mood: STAGE_MOOD[last.stage] ?? 'working', caption: last.message || 'Working on it…' }
}
