import type { HomeVariant } from '../lib/homeVariant'
import { HomeDesk } from './home/HomeDesk'
import { HomeRuled } from './home/HomeRuled'
import { HomeThreads } from './home/HomeThreads'
import type { HomeProps } from './home/types'

/** Renders the selected home-page variant (TEMPORARY: see lib/homeVariant.ts). */
export function HomePage({ variant, animate, ...props }: HomeProps & { variant: HomeVariant; animate: boolean }) {
  switch (variant) {
    case 'ruled':
      return <HomeRuled {...props} />
    case 'threads':
      return <HomeThreads {...props} animate={animate} />
    default:
      return <HomeDesk {...props} />
  }
}
