import Link from 'next/link'

export default function BackLink({ section }: { section?: string }) {
  return (
    <div className="flex items-center gap-2 mt-10 mb-8">
      <Link
        href="/"
        className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        ← Home
      </Link>
      {section && (
        <>
          <span className="text-zinc-800 text-xs">/</span>
          <span className="text-xs font-mono text-zinc-400">{section}</span>
        </>
      )}
    </div>
  )
}
