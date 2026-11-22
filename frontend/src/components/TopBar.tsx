import { LogoMark } from './LogoMark'
import { MoonIcon, MotionIcon, MotionOffIcon, SunIcon } from './icons'

export type Theme = 'light' | 'dark'

/** Pauses the background threads, Hoot and every other animation. */
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
      {/* three columns so the logo stays truly centred whatever the controls' width */}
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span aria-hidden="true" />

        <button
          type="button"
          onClick={onHome}
          className="group flex items-center gap-2.5 rounded-xl px-2 py-1 transition"
          aria-label="LitLens home"
        >
          <LogoMark className="h-8 w-8 transition group-hover:scale-105 group-active:scale-95" />
          <span className="text-lg font-extrabold tracking-tight text-ink">LitLens</span>
        </button>

        <div className="flex items-center justify-end gap-2">
          <MotionToggle on={motion} onChange={onMotionChange} />
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  )
}
