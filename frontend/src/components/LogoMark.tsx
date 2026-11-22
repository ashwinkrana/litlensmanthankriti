/**
 * The LitLens mark: an owl's face in round spectacles (the "lens", and Hoot's
 * own glasses), dark on the app's amber. Just two lenses, a bridge and a beak
 * so it stays crisp at 16px. Same drawing as public/favicon.svg.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#fbbf24" />
      <g fill="none" stroke="#0b0f17" strokeWidth="2.3" strokeLinecap="round">
        <circle cx="10.2" cy="14.6" r="4.8" />
        <circle cx="21.8" cy="14.6" r="4.8" />
        {/* the bridge */}
        <path d="M15 13.9c.6-.9 1.4-.9 2 0" />
      </g>
      {/* the beak */}
      <path d="M14.3 20.2h3.4L16 23.6z" fill="#0b0f17" stroke="#0b0f17" strokeWidth="1" strokeLinejoin="round" />
      {/* a glint on each lens */}
      <path
        d="M7.9 12.9a2.8 2.8 0 0 1 1.9-1.3M19.5 12.9a2.8 2.8 0 0 1 1.9-1.3"
        fill="none"
        stroke="#fff7d6"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
