import Link from 'next/link'

const experiments = [
  {
    slug: 'wave',
    title: 'Wave',
    description: '텍스트 라인이 사인 곡선으로 출렁인다. layoutWithLines()로 각 라인 위치를 계산하고 Canvas에 오프셋을 적용.',
  },
  {
    slug: 'scatter',
    title: 'Scatter',
    description: '마우스 근처 글자들이 흩어졌다 원래 자리로 돌아온다. 각 글자의 x 위치를 measureText()로 직접 계산.',
  },
  {
    slug: 'reflow',
    title: 'Reflow',
    description: '드래그로 텍스트 박스 너비를 조절하면 즉시 재배치된다. DOM reflow 없이 60fps로 동작하는 pretext의 핵심.',
  },
]

export default function PretextPage() {
  return (
    <div>
      <header className="mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">pretext</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          DOM reflow 없이 텍스트를 측정하고 배치하는 라이브러리.
          브라우저 폰트 엔진을 직접 사용해 60fps로 레이아웃을 실시간 재계산한다.
        </p>
        <a
          href="https://github.com/chenglou/pretext"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs font-mono text-zinc-600 hover:text-orange-300 transition-colors"
        >
          github.com/chenglou/pretext ↗
        </a>
      </header>

      <div className="border-t border-zinc-800">
        {experiments.map((exp, i) => (
          <Link key={exp.slug} href={`/labs/pretext/${exp.slug}`}>
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
