import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { createReview, getDemoTopics, getReview } from './api/client'
import { subscribeToJob } from './api/sse'
import type { ReviewResult, StageEvent } from './api/types'
import { PageLoader } from './components/PageLoader'
import { TopBar, type Theme } from './components/TopBar'
import { AppBackground } from './components/backgrounds/AppBackground'
import { HootAvatar } from './components/hoot/HootAvatar'
import { hideBootLoader } from './lib/boot'
import { HootProvider } from './lib/hoot'
import { hootForRun, type HootLine } from './lib/hootContext'
import { useMotionPref } from './lib/motionPref'
import { useMediaQuery } from './lib/useMediaQuery'
import { HomePage } from './pages/HomePage'

// The run and results pages (and the Markdown renderer the results need) load
// on demand, so the home page arrives in a smaller first download. They are
// prefetched while you're on the home page, so switching rarely waits.
const loadRunPage = () => import('./pages/RunPage')
const loadResultsPage = () => import('./pages/ResultsPage')
const RunPage = lazy(() => loadRunPage().then((m) => ({ default: m.RunPage })))
const ResultsPage = lazy(() => loadResultsPage().then((m) => ({ default: m.ResultsPage })))

function prefetchPages(): void {
  void loadRunPage()
  void loadResultsPage()
}

type Phase = 'home' | 'running' | 'results'

const FOOTER = 'LitLens · autonomous arXiv preprint extraction & citation-verified review builder'
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
  const wide = useMediaQuery('(min-width: 1024px)')

  const closeStream = useRef<(() => void) | null>(null)

  // First paint is in: fade out the boot loader, then fetch the other pages
  // in the background once the browser is idle.
  useEffect(() => {
    hideBootLoader()
    const idle = window.requestIdleCallback
    if (idle) {
      const id = idle(prefetchPages, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(prefetchPages, 1500)
    return () => clearTimeout(t)
  }, [])

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

  // What Hoot is doing, from the app's real state (pipeline stage, results, failure).
  const hoot: HootLine = runError
    ? { mood: 'error', caption: 'That run did not finish. Try again, or pick a demo topic.' }
    : phase === 'running'
      ? hootForRun(events)
      : phase === 'results'
        ? celebrate
          ? { mood: 'celebrating', caption: 'Your review is ready, and every citation is checked.' }
          : { mood: 'idle', caption: 'Ask me anything about these papers in the Ask tab.' }
        : { mood: 'idle', caption: 'Give me a research topic and I will find the papers.' }

  const start = useCallback(
    async (t: string, deck: number) => {
      setBusy(true)
      setRunError(null)
      setEvents([])
      setReview(null)
      setTopic(t)
      prefetchPages()
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
    <HootProvider base={hoot}>
      <AppBackground theme={theme} animate={motionOn} />

      <div className="relative z-10 flex min-h-screen flex-col">
      <TopBar theme={theme} onThemeChange={setTheme} motion={motionOn} onMotionChange={setMotionOn} onHome={goHome} />

      <div className="flex-1">
        {phase === 'home' && (
          <>
            {runError && (
              <div className="mx-auto mt-4 w-full max-w-3xl px-5">
                <p className="flex items-center gap-3 rounded-xl border-l-4 border-rose-line bg-rose-soft px-4 py-3 text-sm text-rose">
                  <HootAvatar mood="sad" size={36} />
                  <span>{runError}</span>
                </p>
              </div>
            )}
            <HomePage demoTopics={demoTopics} onStart={start} busy={busy} animate={motionOn} wide={wide} theme={theme} />
          </>
        )}

        <Suspense fallback={<PageLoader label={phase === 'results' ? 'Opening the review' : 'Starting the run'} />}>
          {phase === 'running' && <RunPage topic={topic} events={events} animate={motionOn} wide={wide} theme={theme} />}

          {phase === 'results' && review && <ResultsPage review={review} animate={motionOn} wide={wide} theme={theme} />}
        </Suspense>
      </div>

      <footer className="border-t border-edge2 px-5 py-4 text-center text-xs text-faint">
        {FOOTER} · job {jobId ? jobId.slice(0, 8) : '—'}
      </footer>
      </div>
    </HootProvider>
  )
}
