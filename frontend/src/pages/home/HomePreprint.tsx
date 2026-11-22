import { useState } from 'react'
import { motion } from 'motion/react'
import { SampleRun } from '../../components/home/SampleRun'
import { TopicComposer } from '../../components/home/TopicComposer'
import type { HomeProps } from './types'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Variant "Preprint": the home page set as the first page of a LaTeX
 * preprint. Centred title, an indented run-in Abstract, a rule, then the
 * topic input beside "Figure 1" (the live pipeline). One accent only:
 * hyperref's citation green, which also colours every [n] in the app.
 */
export function HomePreprint({ demoTopics, onStart, busy, animate }: HomeProps & { animate: boolean }) {
  const [deck, setDeck] = useState(8)
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10 md:px-8 md:pt-14">
      <motion.header
        className="mx-auto max-w-4xl text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <h1 className="text-balance text-4xl font-semibold leading-[1.12] text-ink md:text-5xl">
          A literature review you can check, citation by citation
        </h1>
        <p className="mx-auto mt-6 max-w-[62ch] text-pretty text-left text-[1.08rem] leading-relaxed text-txt md:text-center">
          <span className="font-bold text-ink">Abstract. </span>
          Type a topic. LitLens reads recent arXiv papers and writes a review where every citation is checked against
          its source.
        </p>
      </motion.header>

      <hr className="mx-auto mt-8 max-w-4xl border-edge" />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <motion.section
          aria-label="Start a review"
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
        >
          <TopicComposer
            deck={deck}
            onDeckChange={setDeck}
            onStart={onStart}
            busy={busy}
            demoTopics={demoTopics}
            align="left"
          />
        </motion.section>
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18, ease: EASE }}
        >
          <SampleRun
            animate={animate}
            caption={
              <>
                <span className="font-bold text-ink">Figure 1.</span> A recorded LitLens run, replayed. Yours runs live.
              </>
            }
          />
        </motion.div>
      </div>
    </main>
  )
}
