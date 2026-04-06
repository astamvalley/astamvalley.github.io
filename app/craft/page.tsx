import Link from 'next/link'

const experiments = [
  {
    slug: 'glass',
    title: 'Glass',
    description: 'Glassmorphism 플레이그라운드. backdrop-filter의 blur, opacity, saturation을 실시간으로 조정하며 반투명 유리 효과를 탐구한다.',
  },
  {
    slug: 'noise',
    title: 'Noise',
    description: 'SVG feTurbulence 필터로 노이즈 텍스처를 생성한다. baseFrequency, octave, 타입을 조절해 유기적인 패턴을 만든다.',
  },
  {
    slug: 'gradient',
    title: 'Gradient',
    description: 'conic-gradient와 radial-gradient를 겹쳐 메시 그라디언트를 만든다. 색상 포인트와 애니메이션 속도를 실시간으로 제어한다.',
  },
]

export default function CraftPage() {
  return (
    <div>
      <header className="mb-8 sm:mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">craft</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          CSS 시각 효과 플레이그라운드. 슬라이더와 컨트롤로 파라미터를 조정하며 웹의 시각적 가능성을 실시간으로 탐구한다.
        </p>
      </header>

      <div className="border-t border-zinc-800">
        {experiments.map((exp, i) => (
          <Link key={exp.slug} href={`/craft/${exp.slug}`}>
            <div className="group flex items-start gap-3 sm:gap-5 py-5 border-b border-zinc-800/60 hover:border-zinc-700 transition-colors">
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
