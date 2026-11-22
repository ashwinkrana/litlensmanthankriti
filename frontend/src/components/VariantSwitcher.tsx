import { HOME_VARIANTS, type HomeVariant } from '../lib/homeVariant'

/** TEMPORARY: lets the team compare home-page variants. Remove once one is chosen. */
export function VariantSwitcher({ value, onChange }: { value: HomeVariant; onChange: (v: HomeVariant) => void }) {
  return (
    // On phones it sits above the owl badge (bottom-right) so they don't overlap.
    <div className="fixed bottom-24 left-4 z-40 md:bottom-6 md:left-6">
      <div
        role="radiogroup"
        aria-label="Home page variant (temporary)"
        className="flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto rounded-full border border-edge bg-card p-1 shadow-book-lift"
      >
        <span className="px-2 text-[11px] font-semibold text-faint">Variant</span>
        {HOME_VARIANTS.map((v) => {
          const active = v.key === value
          return (
            <button
              key={v.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                active ? 'bg-amb-soft text-amb ring-1 ring-inset ring-amb-line' : 'text-mut hover:text-ink'
              }`}
            >
              {v.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
