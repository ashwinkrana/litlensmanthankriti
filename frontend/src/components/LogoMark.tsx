/**
 * The LitLens mark: a lens over lines of text (literature, read through a
 * lens), dark on the app's amber. Same drawing as public/favicon.svg.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#fbbf24" />
      <g fill="none" stroke="#0b0f17" strokeLinecap="round">
        {/* the lens and its handle */}
        <circle cx="13.5" cy="13.5" r="7.6" strokeWidth="2.6" />
        <path d="M19.2 19.2 25 25" strokeWidth="3.2" />
        {/* lines of text seen through the lens */}
        <path d="M9.6 11h7.8M9.6 13.8h6M9.6 16.6h7" strokeWidth="1.7" />
      </g>
    </svg>
  )
}
