'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/labs/pretext', label: 'Overview', exact: true },
  { href: '/labs/pretext/wave', label: 'Wave' },
  { href: '/labs/pretext/scatter', label: 'Scatter' },
  { href: '/labs/pretext/reflow', label: 'Reflow' },
  { href: '/labs/pretext/vortex', label: 'Vortex' },
  { href: '/labs/pretext/ripple', label: 'Ripple' },
  { href: '/labs/pretext/glitch', label: 'Glitch' },
  { href: '/labs/pretext/flow', label: 'Flow' },
  { href: '/labs/pretext/crater', label: 'Crater' },
  { href: '/labs/pretext/gravity', label: 'Gravity' },
]

export default function TabNav() {
  const pathname = usePathname()

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/"
          className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← Home
        </Link>
        <span className="text-zinc-800 text-xs">/</span>
        <span className="text-xs font-mono text-zinc-400">pretext</span>
      </div>
      <div className="flex gap-1">
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
