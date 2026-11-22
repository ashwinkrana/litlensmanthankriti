import { useState } from 'react'
import { motion } from 'motion/react'
import { SampleRun } from '../../components/home/SampleRun'
import { TopicComposer } from '../../components/home/TopicComposer'
import type { HomeProps } from './types'

/*
 * Variant "Threads" (taste-skill pass).
 * Design read: entry page of a research tool for faculty evaluators,
 * redesign-preserve, calm academic-tech language, existing Tailwind v4 +
 * Motion stack, Plus Jakarta Sans, single amber accent.
 * Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 5, VISUAL_DENSITY 3.
 * Split hero (anti-centre), no eyebrow, max four text elements, real
 * component as the visual (the live pipeline timeline), no em-dashes.
 * Deviation, on purpose: icons stay the project's own set (one family per
 * project beats switching libraries for one page).
 */
const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const

export function HomeThreads({ demoTopics, onStart, busy, animate }: HomeProps & { animate: boolean }) {
  const [deck, setDeck] = useState(8)
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-10 md:px-8 md:pt-14">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <motion.section
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tighter text-ink md:text-5xl 2xl:text-6xl">
            Literature reviews, built from <em className="not-italic text-amb-dot">real papers</em>.
          </h1>
          <p className="mt-5 max-w-[46ch] text-pretty text-base leading-relaxed text-mut md:text-lg">
            Type a topic. LitLens reads recent arXiv papers and writes a review where every claim cites its source.
          </p>
          <div className="mt-8 max-w-2xl">
            <TopicComposer
              deck={deck}
              onDeckChange={setDeck}
              onStart={onStart}
              busy={busy}
              demoTopics={demoTopics}
              align="left"
              chipsLabel={null}
            />
          </div>
        </motion.section>

        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <SampleRun animate={animate} />
        </motion.div>
      </div>
    </main>
  )
}
