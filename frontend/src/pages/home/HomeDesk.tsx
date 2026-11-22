import { useState } from 'react'
import { motion } from 'motion/react'
import { PipelineStrip } from '../../components/PipelineStrip'
import { TopicComposer } from '../../components/home/TopicComposer'
import type { HomeProps } from './types'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Variant "Desk": the current centred study-desk layout, refined.
 * Clearer promise in the headline, one-line subtext, the composer as the
 * focal object, then the pipeline. Background: interactive dot grid.
 */
export function HomeDesk({ demoTopics, onStart, busy }: HomeProps) {
  const [deck, setDeck] = useState(8)
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-12 text-center md:pt-16">
      <motion.div
        className="mx-auto max-w-3xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
          Turn a research topic into a{' '}
          <mark className="rounded-md bg-amb-soft px-1.5 text-amb ring-1 ring-inset ring-amb-line">cited</mark>{' '}
          literature review
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-mut">
          LitLens searches arXiv, reads the most relevant papers and writes a review where every claim
          points to its source.
        </p>

        <div className="mt-8">
          <TopicComposer deck={deck} onDeckChange={setDeck} onStart={onStart} busy={busy} demoTopics={demoTopics} />
        </div>
      </motion.div>

      <PipelineStrip deck={deck} />
    </main>
  )
}
