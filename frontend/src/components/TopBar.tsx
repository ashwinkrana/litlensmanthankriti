import { BookIcon, MoonIcon, MotionIcon, MotionOffIcon, SunIcon } from './icons'

export type Theme = 'light' | 'dark'

export function MotionToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      aria-label={on ? 'Turn animations off' : 'Turn animations on'}
      title={on ? 'Animations on' : 'Animations off'}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-edge bg-card px-3 text-mut transition hover:border-amb-line hover:text-amb"
    >
      {on ? <MotionIcon className="h-4 w-4 text-amb-dot" /> : <MotionOffIcon className="h-4 w-4" />}
      <span className="hidden text-xs font-semibold sm:inline">{on ? 'Motion on' : 'Motion off'}</span>
    </button>
  )
}

export function ThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme
  onChange: (t: Theme) => void
}) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={() => onChange(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-card text-mut transition hover:border-amb-line hover:text-amb"
    >
      {dark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  )
}

export function TopBar({
  theme,
  onThemeChange,
  motion,
  onMotionChange,
  onHome,
}: {
  theme: Theme
  onThemeChange: (t: Theme) => void
  motion: boolean
  onMotionChange: (on: boolean) => void
  onHome: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-edge2 bg-app/85 px-5 py-3 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <button onClick={onHome} className="group flex items-center gap-3" aria-label="LitLens home">
          <span className="flex items-center gap-2 rounded-lg border border-edge bg-card px-2.5 py-1.5 font-bold tracking-tight text-ink transition group-hover:border-amb-line">
            <BookIcon className="h-4 w-4 text-amb-dot" />
            <span className="text-sm">LitLens</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <MotionToggle on={motion} onChange={onMotionChange} />
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  )
}
