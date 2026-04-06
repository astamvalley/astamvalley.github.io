import Link from 'next/link'
import { notFound } from 'next/navigation'
import { bookmarks } from '../data'

export function generateStaticParams() {
  return bookmarks.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = bookmarks.find((b) => b.slug === slug)
  return { title: item ? `${item.name} — Docs` : 'Not Found' }
}

const pricingStyle: Record<string, string> = {
  free:     'text-emerald-600 border-emerald-900 bg-emerald-950/30',
  freemium: 'text-sky-600 border-sky-900 bg-sky-950/30',
  paid:     'text-zinc-500 border-zinc-700 bg-zinc-900/30',
}

export default async function DocDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = bookmarks.find((b) => b.slug === slug)
  if (!item) notFound()

  return (
    <div className="max-w-xl">
      <Link
        href="/docs"
        className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-12 mb-10"
      >
        ← 돌아가기
      </Link>

      {/* 상단 헤더 */}
      <header className="mb-10 pb-8 border-b border-zinc-800">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-mono text-2xl font-semibold text-zinc-50 mb-1">{item.name}</h1>
            <p className="text-[11px] font-mono text-zinc-600">{item.category}</p>
          </div>
          <span className={`text-[10px] font-mono border px-2 py-1 rounded-sm uppercase tracking-wide shrink-0 mt-1 ${pricingStyle[item.pricing.type]}`}>
            {item.pricing.label}
          </span>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed mb-6">{item.tagline}</p>

        {/* 링크 + 날짜 */}
        <div className="flex items-center gap-4">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-orange-400/80 hover:text-orange-300 border border-orange-900/50 hover:border-orange-700/60 px-3 py-1.5 rounded transition-colors"
          >
            {item.url} ↗
          </a>
          <span className="text-[11px] font-mono text-zinc-700">{item.updatedAt} 기준</span>
        </div>
      </header>

      {/* 플랫폼 + 가격 */}
      <div className="mb-10 p-4 rounded border border-zinc-800 bg-zinc-900/40 space-y-4">
        <div>
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">플랫폼</p>
          <div className="flex flex-wrap gap-1.5">
            {item.platforms.map((p) => (
              <span key={p} className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded-sm">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">가격</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{item.pricing.detail}</p>
        </div>
      </div>

      {/* 장단점 */}
      <div className="mb-10 grid grid-cols-2 gap-4">
        <div className="p-4 rounded border border-zinc-800 bg-zinc-900/20">
          <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest mb-3">장점</p>
          <ul className="space-y-2">
            {item.pros.map((pro) => (
              <li key={pro} className="text-xs text-zinc-400 leading-relaxed flex gap-2">
                <span className="text-emerald-700 shrink-0 mt-0.5">+</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 rounded border border-zinc-800 bg-zinc-900/20">
          <p className="text-[10px] font-mono text-red-900 uppercase tracking-widest mb-3">단점</p>
          <ul className="space-y-2">
            {item.cons.map((con) => (
              <li key={con} className="text-xs text-zinc-400 leading-relaxed flex gap-2">
                <span className="text-red-900 shrink-0 mt-0.5">−</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 본문 섹션들 */}
      <div className="space-y-10">
        {item.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
              {section.title}
            </h2>
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
            </div>
          </section>
        ))}
      </div>

      {/* Integrations */}
      {item.integrations && (item.integrations.mcp?.length || item.integrations.cli?.length) && (
        <div className="mt-12 pt-10 border-t border-zinc-800">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-5">Integrations</p>
          <div className="space-y-6">
            {item.integrations.mcp?.map((entry) => (
              <div key={entry.name} className="flex gap-4">
                <span className="text-[10px] font-mono text-violet-500 border border-violet-900 bg-violet-950/30 px-1.5 py-0.5 rounded-sm uppercase tracking-wide self-start shrink-0 mt-0.5">
                  MCP
                </span>
                <div>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-zinc-300 hover:text-orange-300 transition-colors"
                  >
                    {entry.name} ↗
                  </a>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-1">{entry.note}</p>
                </div>
              </div>
            ))}
            {item.integrations.cli?.map((entry) => (
              <div key={entry.name} className="flex gap-4">
                <span className="text-[10px] font-mono text-amber-600 border border-amber-900 bg-amber-950/30 px-1.5 py-0.5 rounded-sm uppercase tracking-wide self-start shrink-0 mt-0.5">
                  CLI
                </span>
                <div>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-zinc-300 hover:text-orange-300 transition-colors"
                  >
                    {entry.name} ↗
                  </a>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-1">{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
