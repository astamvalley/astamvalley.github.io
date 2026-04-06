import Link from 'next/link'

const experiments = [
  {
    slug: 'game-of-life',
    title: 'Game of Life',
    description: "Conway의 생명 게임. 80×60 격자 위에서 세포가 탄생하고 소멸한다. 캔버스를 클릭·드래그해 세포를 직접 그리고, 세대가 진화하는 것을 지켜본다.",
  },
  {
    slug: 'boids',
    title: 'Boids',
    description: '120마리 보이드가 군집 행동을 보인다. 분리, 정렬, 응집의 세 가지 규칙만으로 새 떼 같은 복잡한 움직임이 창발한다. 마우스 커서가 반발력을 만든다.',
  },
  {
    slug: 'noise',
    title: 'Noise',
    description: '층이 쌓인 사인파로 만든 퍼린 스타일 노이즈 지형. 시간이 흐르며 해수면이 출렁이고 지형이 흐른다. 슬라이더로 줌 레벨을 조정한다.',
  },
]

export default function SimPage() {
  return (
    <div>
      <header className="mb-8 sm:mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">sim</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          외부 라이브러리 없이 Canvas와 requestAnimationFrame만으로 구현한 시뮬레이션 실험실. 단순한 규칙에서 복잡한 행동이 창발하는 것을 탐구한다.
        </p>
      </header>

      <div className="border-t border-zinc-800">
        {experiments.map((exp, i) => (
          <Link key={exp.slug} href={`/labs/sim/${exp.slug}`}>
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
