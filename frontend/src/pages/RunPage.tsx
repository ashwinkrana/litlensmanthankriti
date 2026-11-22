import type { StageEvent } from '../api/types'
import { AgentTimeline } from '../components/AgentTimeline'
import { HootNote, HootSpeaker } from '../components/hoot/HootPerch'
import type { Theme } from '../components/TopBar'
import { Chip } from '../components/ui'

/**
 * The live run. On wide screens Hoot reads along in a column beside the
 * timeline (his mood follows the stage, his bubble carries its message);
 * on phones he sits by the heading with his line underneath.
 */
export function RunPage({
  topic,
  events,
  animate,
  wide,
  theme,
}: {
  topic: string
  events: StageEvent[]
  animate: boolean
  wide: boolean
  theme: Theme
}) {
  return (
    <main className={`mx-auto w-full px-5 py-8 ${wide ? 'grid max-w-6xl grid-cols-12 gap-8' : 'max-w-3xl'}`}>
      <div className={wide ? 'col-span-8' : ''}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-faint">
              building your review
            </p>
            <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-ink">{topic}</h1>
          </div>
          {wide ? (
            <Chip tone="sky" dot>
              live
            </Chip>
          ) : (
            <HootSpeaker animate={animate} theme={theme} size={88} bubble="none" floor={0.5} />
          )}
        </div>
        {!wide && <HootNote className="mt-3" />}
        <div className="mt-6">
          <AgentTimeline events={events} />
        </div>
      </div>

      {wide && (
        <aside className="col-span-4">
          <div className="sticky top-24 flex flex-col items-center">
            <HootSpeaker animate={animate} theme={theme} size={190} bubble="below" />
          </div>
        </aside>
      )}
    </main>
  )
}
