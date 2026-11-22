import type { StageEvent } from '../api/types'
import { AgentTimeline } from '../components/AgentTimeline'
import { HootNote, HootSpeaker } from '../components/hoot/HootPerch'
import type { Theme } from '../components/TopBar'
import { Chip } from '../components/ui'

/**
 * The live run. Hoot reads along beside the timeline: his mood follows the
 * current stage and his bubble carries the stage's own message.
 */
export function RunPage({
  topic,
  events,
  theme,
  animate,
  wide,
}: {
  topic: string
  events: StageEvent[]
  theme: Theme
  animate: boolean
  wide: boolean
}) {
  return (
    <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-mut">Building your review</p>
            <h1 className="mt-1 text-balance text-2xl font-bold tracking-tight text-ink">{topic}</h1>
          </div>
          {wide ? (
            <Chip tone="sky" dot>
              live
            </Chip>
          ) : (
            <HootSpeaker theme={theme} animate={animate} size={92} bubble="none" floor={0.5} />
          )}
        </div>
        {!wide && <HootNote className="mt-3" />}
        <div className="mt-6">
          <AgentTimeline events={events} />
        </div>
      </div>

      {wide && (
        <aside className="lg:col-span-4">
          <div className="sticky top-24 flex flex-col items-center">
            <HootSpeaker theme={theme} animate={animate} size={190} bubble="below" />
          </div>
        </aside>
      )}
    </main>
  )
}

