import Link from 'next/link'
import { bookmarks, categories } from './data'

const pricingLabel: Record<string, { label: string; className: string }> = {
  free:      { label: 'Free',      className: 'text-emerald-600 border-emerald-900' },
  freemium:  { label: 'Freemium', className: 'text-sky-600 border-sky-900' },
  paid:      { label: 'Paid',      className: 'text-zinc-500 border-zinc-700' },
}


export default function DocsPage() {
  return (
    <>
      <header className="py-10 sm:py-16 mb-4">
        <h1 className="text-xl sm:text-2xl font-mono font-semibold text-zinc-100 tracking-tight mb-3">Docs</h1>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          자주 쓰는 도구, 레퍼런스, 북마크 모음.
        </p>
      </header>

      {categories.map((category) => {
        const items = bookmarks.filter((b) => b.category === category)
        return (
          <section key={category} className="mb-16">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">
                {category}
              </span>
              <span className="text-[11px] font-mono text-zinc-700">{items.length}</span>
            </div>
            <div className="border-t border-zinc-800 mt-3">
              {items.map((item, i) => {
                const pricing = pricingLabel[item.pricing.type]
                return (
                  <Link key={item.slug} href={`/docs/${item.slug}`}>
                    <div className="group flex items-start gap-3 sm:gap-5 py-5 border-b border-zinc-800/60 hover:border-zinc-700 transition-colors">
                      <span className="font-mono text-xs text-zinc-700 pt-0.5 w-4 shrink-0 select-none">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-sm text-zinc-100 group-hover:text-orange-300 transition-colors">
                            {item.name}
                          </span>
                          <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${pricing.className}`}>
                            {pricing.label}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 leading-snug">{item.description}</p>
                      </div>
                      <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors text-sm pt-0.5 shrink-0">
                        →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}
