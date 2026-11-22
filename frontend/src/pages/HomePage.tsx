import type { HomeVariant } from '../lib/homeVariant'
import { HomeCards } from './home/HomeCards'
import { HomePreprint } from './home/HomePreprint'
import { HomeProceedings } from './home/HomeProceedings'
import { HomeThreads } from './home/HomeThreads'
import type { HomeProps } from './home/types'

/** Renders the selected home-page variant (TEMPORARY: see lib/homeVariant.ts). */
export function HomePage({ variant, animate, ...props }: HomeProps & { variant: HomeVariant; animate: boolean }) {
  switch (variant) {
    case 'proceedings':
      return <HomeProceedings {...props} animate={animate} />
    case 'preprint':
      return <HomePreprint {...props} animate={animate} />
    case 'cards':
      return <HomeCards {...props} animate={animate} />
    default:
      return <HomeThreads {...props} animate={animate} />
  }
}
