import Link from 'next/link'

const experiments = [
  {
    slug: 'letters',
    title: 'Letters',
    description: '알파벳 글자들이 중력에 따라 떨어지며 쌓인다. 마우스로 글자를 밀거나 잡을 수 있다. Interactive Developer 영상을 보고 Matter.js로 재현.',
  },
]

export default function MatterPage() {
  return (
    <div>
      <header className="mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">matter</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          Matter.js 2D 물리 엔진 실험실. 중력, 충돌, 마우스 인터랙션을 Canvas 위에서 탐구한다.
        </p>
        <a
          href="https://brm.io/matter-js/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs font-mono text-zinc-600 hover:text-orange-300 transition-colors"
        >
          brm.io/matter-js ↗
        </a>
      </header>

      <div className="border-t border-zinc-800">
        {experiments.map((exp, i) => (
          <Link key={exp.slug} href={`/labs/matter/${exp.slug}`}>
            <div className="group flex items-start gap-5 py-5 border-b border-zinc-800/60 hover:border-zinc-700 transition-colors">
              <span className="font-mono text-xs text-zinc-700 pt-0.5 w-4 shrink-0 select-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-zinc-100 group-hover:text-orange-300 transition-colors mb-1">
                  {exp.title}
                </p>
                <p className="text-sm text-zinc-500">{exp.description}</p>
              </div>
              <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors text-sm pt-0.5 shrink-0">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
