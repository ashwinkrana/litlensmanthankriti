import { LogoMark } from './LogoMark'

/**
 * Shown while a page's code is still downloading (React.lazy + Suspense).
 * Usually never seen: App prefetches the pages while you're on the home page.
 */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-mut">
      <LogoMark className="animate-float h-10 w-10" />
      <span className="flex items-center gap-2">
        {label}
        <span aria-hidden="true" className="flex gap-1">
          <span className="animate-ping-soft h-1.5 w-1.5 rounded-full bg-amb-dot" />
          <span className="animate-ping-soft h-1.5 w-1.5 rounded-full bg-amb-dot [animation-delay:0.2s]" />
          <span className="animate-ping-soft h-1.5 w-1.5 rounded-full bg-amb-dot [animation-delay:0.4s]" />
        </span>
      </span>
    </div>
  )
}
