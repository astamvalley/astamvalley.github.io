const labs: { name: string; description: string; href?: string; wip?: boolean }[] = [
  {
    name: 'pretext',
    description: 'DOM reflow 없이 텍스트를 측정하고 배치. wave / scatter / magnetic / melt / assemble 등.',
    href: '/labs/pretext',
  },
  {
    name: 'matter',
    description: 'Matter.js 2D 물리 엔진 실험. 중력, 충돌, 제약조건, 마우스 인터랙션.',
    href: '/labs/matter',
  },
  {
    name: 'sim',
    description: '알고리즘 기반 시뮬레이션. Game of Life, Boids 군집, Perlin Noise 지형.',
    href: '/labs/sim',
  },
  {
    name: 'signature',
    description: '텍스트를 흘려 쓰는 서명 애니메이션. 잉크가 번지듯 획이 나타나고, 끝에 장식선이 이어진다.',
    href: '/labs/signature',
  },
]

const craft: { name: string; description: string; href?: string; wip?: boolean }[] = [
  {
    name: 'glass',
    description: 'Glassmorphism 파라미터 탐구. blur / opacity / saturation 슬라이더로 실시간 조절.',
    href: '/craft/glass',
  },
  {
    name: 'noise',
    description: 'SVG feTurbulence 필터 플레이그라운드. frequency · octave · blend mode 조합.',
    href: '/craft/noise',
  },
  {
    name: 'gradient',
    description: '애니메이션 그라디언트 메쉬. 4개 색상 피커와 속도 슬라이더로 편집.',
    href: '/craft/gradient',
  },
  {
    name: 'calligraphy',
    description: '붓 각도와 속도에 반응하는 캘리그래피 브러시. 이동 방향과 펜 각도 차이로 선 두께가 달라진다.',
    href: '/craft/calligraphy',
  },
]

const audio: { name: string; description: string; href?: string; wip?: boolean }[] = [
  {
    name: 'oscilloscope',
    description: '실시간 파형 + FFT 시각화. sine / square / sawtooth / triangle, 주파수 · 볼륨 조절.',
    href: '/audio/oscilloscope',
  },
  {
    name: 'synth',
    description: '2옥타브 폴리포닉 신디사이저. 마우스 · 키보드 연주, ADSR, 딜레이 이펙트.',
    href: '/audio/synth',
  },
  {
    name: 'sequencer',
    description: '4트랙 × 16스텝 비트 시퀀서. KICK / SNARE / HI-HAT / PERC, BPM 조절.',
    href: '/audio/sequencer',
  },
  {
    name: 'piano',
    description: 'Salamander Grand Piano 실제 샘플 기반. 피치 시프팅 + sustain 페달 + reverb.',
    href: '/audio/piano',
  },
]

const games: { name: string; description: string; href?: string; wip?: boolean }[] = [
  {
    name: 'suika',
    description: '수박게임 모티브. 같은 크기끼리 충돌하면 합쳐져 더 큰 원이 된다. Matter.js 물리 엔진 기반.',
    href: '/games/suika',
  },
  {
    name: 'falling sand',
    description: '모래, 물, 불, 연기, 나무. 캔버스 픽셀 시뮬레이션 — 라이브러리 없음.',
    href: '/games/sand',
  },
  {
    name: 'alkkagi',
    description: '한국 전통 알까기. 말을 튕겨 상대 말을 판 밖으로 밀어내라. Matter.js 물리 엔진 기반 2인 대전.',
    href: '/games/alkkagi',
  },
  {
    name: 'omok',
    description: '오목. 15×15 바둑판, 5개를 먼저 잇는 쪽이 승리. AI 대전 · 2인 대전 모드.',
    href: '/games/omok',
  },
]

function Section({
  id,
  title,
  items,
  empty,
}: {
  id: string
  title: string
  items: { name: string; description: string; href?: string; wip?: boolean }[]
  empty: string
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-8">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">{title}</span>
        {items.length > 0 && (
          <span className="text-[11px] font-mono text-zinc-700">{items.length}</span>
        )}
      </div>
      <div className="border-t border-zinc-800 mt-3">
        {items.length === 0 ? (
          <p className="py-8 text-xs font-mono text-zinc-700">{empty}</p>
        ) : (
          items.map((item, i) => {
            const inner = (
              <div className="group flex items-start gap-3 sm:gap-5 py-5 border-b border-zinc-800/60 hover:border-zinc-700 transition-colors cursor-pointer">
                <span className="font-mono text-xs text-zinc-700 pt-0.5 w-4 shrink-0 select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-zinc-100 group-hover:text-orange-300 transition-colors">
                      {item.name}
                    </span>
                    {item.wip && (
                      <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                        wip
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{item.description}</p>
                </div>
                <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors text-sm pt-0.5 shrink-0">→</span>
              </div>
            )
            return item.href ? (
              <a key={item.name} href={item.href}>{inner}</a>
            ) : (
              <div key={item.name}>{inner}</div>
            )
          })
        )}
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <header className="py-10 sm:py-16 mb-4">
        <h1 className="text-xl sm:text-2xl font-mono font-semibold text-zinc-100 mb-3 tracking-tight">
          Lab
        </h1>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          라이브러리 실험, 게임, 그리고 이것저것 만들어보는 공간.
        </p>
      </header>

      <Section
        id="labs"
        title="Labs"
        items={labs}
        empty="실험 준비 중 —"
      />
      <Section
        id="games"
        title="Games"
        items={games}
        empty="게임 준비 중 —"
      />
      <Section
        id="craft"
        title="Craft"
        items={craft}
        empty="준비 중 —"
      />
      <Section
        id="audio"
        title="Audio"
        items={audio}
        empty="준비 중 —"
      />
    </>
  )
}
