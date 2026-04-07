'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BackLink from '@/app/components/BackLink'

const tabs = [
  { href: '/labs/sim', label: 'Overview', exact: true },
  { href: '/labs/sim/game-of-life', label: 'Game of Life' },
  { href: '/labs/sim/boids', label: 'Boids' },
  { href: '/labs/sim/noise', label: 'Noise' },
]

export default function TabNav() {
  const pathname = usePathname()

  return (
    <div className="mb-10">
      <BackLink section="sim" />
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`text-xs font-mono px-3 py-1.5 rounded transition-colors ${
                active
                  ? 'bg-orange-400/15 text-orange-300 border border-orange-400/30'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
