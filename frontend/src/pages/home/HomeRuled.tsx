import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { BookIcon, ChatIcon, DownloadIcon, ShieldCheckIcon, TableIcon } from '../../components/icons'
import { PipelineStrip } from '../../components/PipelineStrip'
import { TopicComposer } from '../../components/home/TopicComposer'
import type { HomeProps } from './types'

const EASE = [0.16, 1, 0.3, 1] as const

// What a finished run gives you (all real outputs of the results page).
const OUTPUTS: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <BookIcon className="h-4 w-4" />, title: 'A cited review', body: 'Overview, themes, methods, gaps and conclusion, with numbered citations.' },
  { icon: <ShieldCheckIcon className="h-4 w-4" />, title: 'Checked citations', body: 'Every [n] is compared against the paper it points to.' },
  { icon: <TableIcon className="h-4 w-4" />, title: 'A comparison table', body: 'Problem, method, datasets, metrics and limitations for each paper.' },
  { icon: <ChatIcon className="h-4 w-4" />, title: 'Questions over the PDFs', body: 'Ask follow-ups; answers cite the page they came from.' },
  { icon: <DownloadIcon className="h-4 w-4" />, title: 'Exports', body: 'Markdown for notes, BibTeX for your reference manager.' },
]

/**
 * Variant "Ruled" (impeccable pass). The page is a sheet of ruled notebook
 * paper: content is set against the margin rule, the input is the work
 * area, and what you'll get sits beside it like notes in the margin.
 * Background: ReactBits Waves tuned as ruled lines.
 */
export function HomeRuled({ demoTopics, onStart, busy }: HomeProps) {
  const [deck, setDeck] = useState(8)
  return (
    <main className="w-full px-5 pb-16 pt-10 md:pt-14 lg:pl-[calc(6vw+2.5rem)] lg:pr-[6vw]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:mx-0 lg:grid-cols-12 lg:gap-14">
        <motion.section
          className="lg:col-span-7"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-ink md:text-[3.25rem]">
            From a research topic to a review you can cite.
          </h1>
          <p className="mt-4 max-w-[52ch] text-pretty text-base leading-relaxed text-mut">
            LitLens finds recent arXiv papers, keeps the most relevant, and drafts a structured review.
            Each citation is checked against its source before you see it.
          </p>
          <div className="mt-8">
            <TopicComposer
              deck={deck}
              onDeckChange={setDeck}
              onStart={onStart}
              busy={busy}
              demoTopics={demoTopics}
              align="left"
              chipsLabel="Or start from a demo topic"
            />
          </div>
        </motion.section>

        <motion.aside
          aria-labelledby="outputs"
          className="lg:col-span-5 lg:pt-3"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
        >
          <h2 id="outputs" className="text-base font-bold text-ink">
            What you get
          </h2>
          <ul className="mt-3 rounded-xl border border-edge bg-card/90 px-4 shadow-book backdrop-blur-sm">
            {OUTPUTS.map((o) => (
              <li key={o.title} className="flex gap-3 border-b border-dashed border-edge2 py-3.5 last:border-b-0">
                <span className="mt-0.5 text-amb-dot">{o.icon}</span>
                <span>
                  <span className="block text-sm font-bold text-ink">{o.title}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-mut">{o.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </motion.aside>
      </div>

      <div className="mx-auto max-w-6xl lg:mx-0">
        <PipelineStrip deck={deck} />
      </div>
    </main>
  )
}
