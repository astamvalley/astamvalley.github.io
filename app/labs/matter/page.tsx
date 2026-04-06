import Link from 'next/link'

const experiments = [
  {
    slug: 'letters',
    title: 'Letters',
    description: '알파벳이 위에서 쏟아져 내린다. 마우스를 따라 회전하는 와이퍼가 글자들을 튕겨낸다. Interactive Developer 영상을 보고 Matter.js로 재현.',
  },
  {
    slug: 'cloth',
    title: 'Cloth',
    description: '격자로 연결된 천이 마우스 위치에서 부는 바람에 흔들린다. 상단 세 지점이 고정핀으로 고정된다.',
  },
  {
    slug: 'wrecking-ball',
    title: 'Wrecking Ball',
    description: '체인에 매달린 공이 진자처럼 흔들리며 블록 탑을 무너뜨린다. 마우스로 공을 잡아 원하는 방향으로 던질 수 있다.',
  },
  {
    slug: 'domino',
    title: 'Domino',
    description: '22개 도미노가 연쇄적으로 쓰러진다. 캔버스를 클릭하면 시작된다. 리셋 버튼으로 다시 세울 수 있다.',
  },
  {
    slug: 'sandbox',
    title: 'Sandbox',
    description: '마우스 드래그로 벽을 그리고, 클릭으로 물리 도형을 소환한다. 직접 물리 세계를 설계한다.',
  },
  {
    slug: 'magnet',
    title: 'Magnet',
    description: '흩어진 공들이 마우스 위치에 이끌린다. 버튼으로 인력과 척력을 전환한다.',
  },
  {
    slug: 'softbody',
    title: 'Softbody',
    description: '스프링으로 연결된 파티클 링이 젤리처럼 움직인다. 바닥에 떨어지면 찌부러졌다 튕겨오른다.',
  },
  {
    slug: 'rope',
    title: 'Rope',
    description: '천장에 매달린 밧줄 끝의 공이 흔들린다. 마우스로 공을 잡아 던지면 주변 블록들을 날린다.',
  },
  {
    slug: 'stack',
    title: 'Stack',
    description: '2.2초마다 무작위 도형이 떨어져 탑을 쌓는다. 원, 박스, 삼각형, 육각형이 뒤섞인다.',
  },
]

export default function MatterPage() {
  return (
    <div>
      <header className="mb-8 sm:mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">matter</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          Matter.js 2D 물리 엔진 실험실. 중력, 충돌, 제약조건, 마우스 인터랙션을 Canvas 위에서 탐구한다.
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
