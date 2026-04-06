import Link from 'next/link'

const experiments = [
  {
    slug: 'oscilloscope',
    title: 'Waveform Oscilloscope',
    description:
      '오실레이터 노드가 생성하는 파형을 실시간으로 시각화한다. 사인, 사각, 톱니, 삼각 파형과 주파수·볼륨을 조작하며 Web Audio API의 기본 구조를 탐구한다.',
  },
  {
    slug: 'synth',
    title: 'Polyphonic Synthesizer',
    description:
      '2옥타브 건반에서 여러 음을 동시에 연주하는 폴리포닉 신시사이저. 파형 선택, 어택/릴리즈 엔벨로프, 딜레이 이펙트를 조합해 소리를 빚는다. 키보드 단축키 지원.',
  },
  {
    slug: 'sequencer',
    title: 'Beat Sequencer',
    description:
      '4트랙 × 16스텝 비트 시퀀서. KICK, SNARE, HI-HAT, PERC를 Web Audio API 합성음으로 재생한다. BPM 조절과 정밀 스케줄링(lookahead)으로 안정적인 리듬을 구현한다.',
  },
]

export default function AudioPage() {
  return (
    <div>
      <header className="mb-8 sm:mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">audio</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          Web Audio API 실험실. 브라우저 네이티브 오디오 엔진으로 신시사이저, 시각화, 시퀀서를 구현한다.
          파일 없이 오직 코드로 소리를 만든다.
        </p>
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs font-mono text-zinc-600 hover:text-orange-300 transition-colors"
        >
          MDN Web Audio API ↗
        </a>
      </header>

      <div className="border-t border-zinc-800">
        {experiments.map((exp, i) => (
          <Link key={exp.slug} href={`/audio/${exp.slug}`}>
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
              <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors text-sm pt-0.5 shrink-0">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
