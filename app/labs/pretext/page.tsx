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
  {
    slug: 'vortex',
    title: 'Vortex',
    description: '커서 근처 글자들이 블랙홀처럼 궤도를 돌며 색상이 바뀐다. 접선 힘 + 구심력으로 나선형 궤도를 생성.',
  },
  {
    slug: 'ripple',
    title: 'Ripple',
    description: '클릭하면 파문이 텍스트를 가로질러 퍼져나간다. 파문 링과의 거리로 힘을 계산하고 스프링으로 복원.',
  },
  {
    slug: 'glitch',
    title: 'Glitch',
    description: '주기적으로 크로마틱 어버레이션 글리치가 발생한다. lighter 합성 모드로 레드/시안 채널을 분리.',
  },
  {
    slug: 'flow',
    title: 'Flow',
    description: '드래그 가능한 블록 주변으로 텍스트가 실시간 리플로우된다. layoutNextLine()으로 줄마다 다른 너비를 적용.',
  },
  {
    slug: 'crater',
    title: 'Crater',
    description: '클릭하면 구슬이 박히며 충격파로 주변 글자를 날린다. 구슬은 영구 장애물로 남아 크레이터 형태를 유지한다.',
  },
  {
    slug: 'gravity',
    title: 'Gravity',
    description: '글자들이 중력으로 떨어져 바닥에 쌓인다. 캔버스를 좌우로 드래그하면 흔들린다. pretext로 초기 위치 계산 후 물리 적용.',
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
