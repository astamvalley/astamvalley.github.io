'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BackLink from '@/app/components/BackLink'

const tabs = [
  { href: '/labs/matter', label: 'Overview', exact: true },
  { href: '/labs/matter/letters', label: 'Letters' },
  { href: '/labs/matter/cloth', label: 'Cloth' },
  { href: '/labs/matter/wrecking-ball', label: 'Wrecking Ball' },
  { href: '/labs/matter/sandbox', label: 'Sandbox' },
  { href: '/labs/matter/magnet', label: 'Magnet' },
  { href: '/labs/matter/softbody', label: 'Softbody' },
  { href: '/labs/matter/stack', label: 'Stack' },
  { href: '/labs/matter/cradle', label: "Newton's Cradle" },
  { href: '/labs/matter/fracture', label: 'Fracture' },
  { href: '/labs/matter/pendulum', label: 'Pendulum Wave' },
  { href: '/labs/matter/marble', label: 'Marble Run' },
]

export default function TabNav() {
  const pathname = usePathname()

  return (
    <div className="mb-10">
      <BackLink section="matter" />
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
