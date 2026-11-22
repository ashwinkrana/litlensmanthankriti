import { useState } from 'react'
import { motion } from 'motion/react'
import { PaperCards } from '../../components/home/PaperCards'
import { TopicComposer } from '../../components/home/TopicComposer'
import type { HomeProps } from './types'

const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const

/**
 * Variant "Cards": every paper is a collectible card. Category "team"
 * colours frame the front, the extraction is the stat table on the back,
 * the newest paper carries a gold flag. Card-stock ground, slab display.
 */
export function HomeCards({ demoTopics, onStart, busy, animate }: HomeProps & { animate: boolean }) {
  const [deck, setDeck] = useState(8)
  return (
    // overflow-x-clip: the fanned, rotated cards must not widen the page on phones.
    <main className="mx-auto w-full max-w-7xl overflow-x-clip px-5 pb-16 pt-10 md:px-8 md:pt-14">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
        <motion.section
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          <h1 className="text-balance text-5xl font-bold leading-[1.02] text-ink md:text-6xl">
            <span className="block">Real papers in.</span>
            <span className="block">A cited review out.</span>
          </h1>
          <p className="mt-5 max-w-[46ch] text-pretty text-base leading-relaxed text-mut md:text-lg">
            LitLens deals you the most relevant recent arXiv papers, pulls out their methods and results, and cites
            every claim.
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
          initial={{ opacity: 0, y: 24, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <PaperCards animate={animate} />
        </motion.div>
      </div>
    </main>
  )
}
