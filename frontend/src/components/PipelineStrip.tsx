import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { BookIcon, ChatIcon, FlaskIcon, LayersIcon, PenIcon, SearchIcon, ShieldCheckIcon } from './icons'

type Step = { label: string; detail: string; icon: ReactNode }

function steps(deck: number): Step[] {
  const i = 'h-4 w-4'
  return [
    { label: 'Plan', detail: 'Up to 3 arXiv search queries', icon: <PenIcon className={i} /> },
    { label: 'Search', detail: 'Up to 25 candidate papers', icon: <SearchIcon className={i} /> },
    { label: 'Rank', detail: `Local embeddings keep the top ${deck}`, icon: <LayersIcon className={i} /> },
    { label: 'Extract', detail: 'Problem, method, datasets, metrics', icon: <FlaskIcon className={i} /> },
    { label: 'Write', detail: 'A cited review of 350–600 words', icon: <BookIcon className={i} /> },
    { label: 'Verify', detail: 'Every [n] checked against its paper', icon: <ShieldCheckIcon className={i} /> },
    { label: 'Ask', detail: 'Q&A over the full-text PDFs', icon: <ChatIcon className={i} /> },
  ]
}

/**
 * "How a review gets built": the real pipeline stages (DESIGN §3), shown on
 * the home page so the audience knows what they're about to watch.
 */
export function PipelineStrip({ deck }: { deck: number }) {
  const list = steps(deck)
  return (
    <section aria-labelledby="how-it-works" className="mt-12 text-left">
      <h2 id="how-it-works" className="text-center text-base font-bold tracking-tight text-ink">
        How a review gets built
      </h2>

      <div className="relative mt-5">
        {/* Connector + travelling pulse (wide screens only) */}
        <div aria-hidden="true" className="absolute left-[7%] right-[7%] top-5 hidden h-px bg-edge2 lg:block">
          <motion.div
            className="absolute top-[-1px] h-[3px] w-16 rounded-full bg-amb-dot/70"
            initial={{ left: '0%', opacity: 0 }}
            animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.5 }}
          />
        </div>

        <ol className="relative grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-7">
          {list.map((s, idx) => (
            <motion.li
              key={s.label}
              className="flex flex-col items-center text-center last:col-span-2 sm:last:col-span-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-card text-amb-dot shadow-book">
                {s.icon}
              </span>
              <span className="mt-2 text-sm font-bold text-ink">{s.label}</span>
              <span className="mt-0.5 max-w-[11rem] text-xs leading-snug text-mut">{s.detail}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
