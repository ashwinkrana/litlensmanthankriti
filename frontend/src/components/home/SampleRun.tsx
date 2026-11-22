import { useEffect, useState, type ReactNode } from 'react'
import type { StageEvent } from '../../api/types'
import eventsMock from '../../mocks/events.json'
import { AgentTimeline } from '../AgentTimeline'

const RECORDED = eventsMock as StageEvent[]
const STEP_MS = 650 // time between replayed events
const HOLD_MS = 3200 // pause on the finished run before replaying

/**
 * The real AgentTimeline, replaying the recorded mock run (src/mocks/events.json)
 * on a loop. With animations off it shows the finished run, still.
 */
export function SampleRun({ animate, caption }: { animate: boolean; caption?: ReactNode }) {
  const [count, setCount] = useState(animate ? 1 : RECORDED.length)

  useEffect(() => {
    if (!animate) return
    const done = count >= RECORDED.length
    const t = setTimeout(() => setCount(done ? 1 : count + 1), done ? HOLD_MS : STEP_MS)
    return () => clearTimeout(t)
  }, [animate, count])

  const shown = animate ? count : RECORDED.length
  return (
    <figure>
      <div className="rounded-xl border border-edge bg-card p-4 shadow-book-lift">
        <AgentTimeline compact events={RECORDED.slice(0, shown)} />
      </div>
      <figcaption className="mt-2 text-xs text-mut">{caption ?? 'A recorded run, replayed. Yours runs live.'}</figcaption>
    </figure>
  )
}
