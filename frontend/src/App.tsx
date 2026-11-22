import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { createReview, getDemoTopics, getReview } from './api/client'
import { useMotionPref } from './lib/motionPref'
import { subscribeToJob } from './api/sse'
import type { ReviewResult, StageEvent } from './api/types'
import { TopBar, type Theme } from './components/TopBar'
import { MascotBuddy, type BuddyState } from './components/MascotBuddy'
import { AppBackground } from './components/backgrounds/AppBackground'
import { VariantSwitcher } from './components/VariantSwitcher'
import { useHomeVariant } from './lib/homeVariant'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { RunPage } from './pages/RunPage'

type Phase = 'home' | 'running' | 'results'

const FOOTER = 'LitLens Study Desk · autonomous arXiv preprint extraction & citation-verified review builder'
const THEME_KEY = 'litlens-theme'

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage blocked (private mode): fall through */
  }
  // No stored preference: respect the OS theme, defaulting to dark.
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('home')
  const [jobId, setJobId] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [events, setEvents] = useState<StageEvent[]>([])
  const [review, setReview] = useState<ReviewResult | null>(null)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [demoTopics, setDemoTopics] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const [motionOn, setMotionOn] = useMotionPref()
  const [variant, setVariant] = useHomeVariant() // TEMPORARY: home-page variants

  const closeStream = useRef<(() => void) | null>(null)

  // Apply theme class + persist.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.dataset.theme = theme
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* non-fatal */
    }
  }, [theme])

  useEffect(() => {
    let alive = true
    getDemoTopics()
      .then((d) => alive && setDemoTopics(d.topics))
      .catch(() => {
        /* non-fatal */
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    return () => {
      closeStream.current?.()
    }
  }, [])

  const goHome = useCallback(() => {
    closeStream.current?.()
    closeStream.current = null
    setRunError(null)
    setCelebrate(false)
    setPhase('home')
  }, [])

  const buddyStatus: BuddyState =
    runError ? 'error'
      : phase === 'running' ? 'working'
        : phase === 'results' ? (celebrate ? 'celebrating' : 'idle')
          : 'idle'

  const start = useCallback(
    async (t: string, deck: number) => {
      setBusy(true)
      setRunError(null)
      setEvents([])
      setReview(null)
      setTopic(t)
      try {
        const job = await createReview({ topic: t, max_papers: deck })
        setJobId(job.job_id)
        setPhase('running')

        closeStream.current = subscribeToJob(job.job_id, {
          onEvent: (e) => setEvents((prev) => [...prev, e]),
          onEnd: async () => {
            try {
              const result = await getReview(job.job_id)
              setReview(result)
              setPhase('results')
              setCelebrate(true)
              setTimeout(() => setCelebrate(false), 5000)
            } catch {
              setRunError('Could not load the finished review.')
              setPhase('home')
            }
          },
          onError: (message) => {
            setRunError(message)
            setPhase('home')
          },
        })
      } catch (e) {
        setRunError(e instanceof Error ? e.message : 'Failed to start the review.')
        setPhase('home')
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  return (
    <MotionConfig reducedMotion={motionOn ? 'never' : 'always'}>
      <AppBackground variant={variant} theme={theme} animate={motionOn} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <TopBar
          theme={theme}
          onThemeChange={setTheme}
          motion={motionOn}
          onMotionChange={setMotionOn}
          onHome={goHome}
          showBadge={variant === 'threads'}
        />

        <div className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {phase === 'home' && (
                <>
                  {runError && (
                    <div className="mx-auto mt-4 w-full max-w-3xl px-5">
                      <p className="rounded-xl border border-rose-line bg-rose-soft px-4 py-3 text-sm text-rose">
                        {runError}
                      </p>
                    </div>
                  )}
                  <HomePage
                    key={variant}
                    variant={variant}
                    animate={motionOn}
                    demoTopics={demoTopics}
                    onStart={start}
                    busy={busy}
                  />
                </>
              )}

              {phase === 'running' && <RunPage topic={topic} events={events} />}

              {phase === 'results' && review && <ResultsPage review={review} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="border-t border-edge2 px-5 py-4 text-center text-xs text-faint">
          {FOOTER} · job {jobId ? jobId.slice(0, 8) : '—'}
        </footer>

        <MascotBuddy status={buddyStatus} docked={phase !== 'home'} animate={motionOn} />
        <VariantSwitcher value={variant} onChange={setVariant} />
      </div>
    </MotionConfig>
  )
}
