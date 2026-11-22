import { lazy, Suspense, useState } from 'react'
import { motion } from 'motion/react'
import { SampleRun } from '../components/home/SampleRun'
import { TopicComposer } from '../components/home/TopicComposer'

const Threads = lazy(() => import('../components/backgrounds/reactbits/Threads'))

const SPRING = { type: 'spring', stiffness: 110, damping: 22 } as const
const VOLUMES = [4, 8, 12]

type HomeProps = {
  demoTopics: string[]
  onStart: (topic: string, deck: number) => void
  busy: boolean
  animate: boolean
}

/**
 * Home page ("Proceedings"): the page is a bound conference-proceedings volume.
 * A committed ultramarine series band carries the title; the volume number
 * IS the paper-count control; the topic input is the label pasted onto the
 * cover, overlapping the band; the live pipeline reads as the contents.
 * Threads run densest inside the band and fade over the cover stock.
 * Direction contract: .impeccable/surfaces/frontend-src-pages-homepage-tsx.md
 */
export function HomePage({ demoTopics, onStart, busy, animate }: HomeProps) {
  const [deck, setDeck] = useState(8)
  return (
    <main className="pb-16">
      <section className="relative overflow-hidden bg-band text-band-ink">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <Threads color="#ffffff" accentColor="#ffffff" lineCount={90} amplitude={1.5} speed={0.35} opacity={0.32} paused={!animate} />
          </Suspense>
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 pb-24 pt-12 md:px-8 md:pt-16 lg:grid-cols-12">
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
          >
            <h1 className="text-balance text-5xl font-extrabold leading-[0.98] tracking-tight md:text-6xl xl:text-7xl">
              Every claim, bound to its source.
            </h1>
            <p className="mt-5 max-w-[48ch] text-pretty text-lg leading-relaxed opacity-85">
              Give LitLens a research topic. It reads recent arXiv papers and writes a review with checked citations.
            </p>
          </motion.div>

          <motion.div
            className="lg:col-span-4 lg:justify-self-end"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.08 }}
          >
            <div role="radiogroup" aria-label="Number of papers" className="lg:text-right">
              <p className="font-mono text-xs opacity-80">Papers in this review</p>
              <p className="mt-1 font-display text-[7rem] font-extrabold leading-none tabular-nums md:text-[8.5rem]">
                {String(deck).padStart(2, '0')}
              </p>
              <div className="mt-3 inline-flex gap-1.5">
                {VOLUMES.map((v) => {
                  const on = v === deck
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={`${v} papers`}
                      onClick={() => setDeck(v)}
                      className={`rounded-lg px-3 py-1.5 font-mono text-sm font-semibold transition active:scale-[0.97] ${
                        on ? 'bg-band-ink text-band' : 'ring-1 ring-inset ring-band-ink/45 hover:ring-band-ink'
                      }`}
                    >
                      {String(v).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="relative mx-auto -mt-14 grid max-w-7xl grid-cols-1 gap-10 px-5 md:px-8 lg:grid-cols-12">
        <motion.div
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.14 }}
        >
          <TopicComposer
            deck={deck}
            onDeckChange={setDeck}
            onStart={onStart}
            busy={busy}
            demoTopics={demoTopics}
            align="left"
            hideDeck
          />
        </motion.div>
        <motion.div
          className="lg:col-span-5 lg:pt-20"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.2 }}
        >
          <SampleRun animate={animate} />
        </motion.div>
      </div>
    </main>
  )
}
