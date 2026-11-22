import type { StageEvent } from '../api/types'
import { AgentTimeline } from '../components/AgentTimeline'
import { Chip } from '../components/ui'

export function RunPage({ topic, events }: { topic: string; events: StageEvent[] }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-faint">
            building your review
          </p>
          <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-ink">{topic}</h1>
        </div>
        <Chip tone="sky" dot>live</Chip>
      </div>
      <div className="mt-6">
        <AgentTimeline events={events} />
      </div>
    </main>
  )
}
