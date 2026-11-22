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
