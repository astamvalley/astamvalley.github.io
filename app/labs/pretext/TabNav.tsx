'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BackLink from '@/app/components/BackLink'

const tabs = [
  { href: '/labs/pretext', label: 'Overview', exact: true },
  { href: '/labs/pretext/wave', label: 'Wave' },
  { href: '/labs/pretext/scatter', label: 'Scatter' },
  { href: '/labs/pretext/vortex', label: 'Vortex' },
  { href: '/labs/pretext/ripple', label: 'Ripple' },
  { href: '/labs/pretext/glitch', label: 'Glitch' },
  { href: '/labs/pretext/crater', label: 'Crater' },
  { href: '/labs/pretext/gravity', label: 'Gravity' },
  { href: '/labs/pretext/magnetic', label: 'Magnetic' },
  { href: '/labs/pretext/melt', label: 'Melt' },
  { href: '/labs/pretext/assemble', label: 'Assemble' },
]

export default function TabNav() {
  const pathname = usePathname()

  return (
    <div className="mb-10">
      <BackLink section="pretext" />
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
