'use client'

import { useState, useId } from 'react'
import Slider from '@/app/components/Slider'

const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
]

const TINT_COLORS = [
  { label: 'none', value: 'transparent' },
  { label: 'amber', value: 'rgba(251,191,36,0.5)' },
  { label: 'violet', value: 'rgba(139,92,246,0.5)' },
  { label: 'teal', value: 'rgba(20,184,166,0.5)' },
  { label: 'rose', value: 'rgba(244,63,94,0.5)' },
]

export default function NoisePage() {
  const uid = useId()
  const filterId = `noise-${uid.replace(/:/g, '')}`

  const [freqX, setFreqX] = useState(0.065)
  const [freqY, setFreqY] = useState(0.065)
  const [octaves, setOctaves] = useState(4)
  const [noiseType, setNoiseType] = useState<'fractalNoise' | 'turbulence'>('fractalNoise')
  const [blendMode, setBlendMode] = useState('overlay')
  const [tintIndex, setTintIndex] = useState(0)

  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg">
  <filter id="noise">
    <feTurbulence
      type="${noiseType}"
      baseFrequency="${freqX} ${freqY}"
      numOctaves="${octaves}"
      stitchTiles="stitch"
    />
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect
    width="100%" height="100%"
    filter="url(#noise)"
    style="mix-blend-mode: ${blendMode}"
  />
</svg>`

  const tintColor = TINT_COLORS[tintIndex].value

  return (
    <div>
      <header className="mb-8 sm:mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">Noise</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
          SVG feTurbulence 필터로 노이즈 텍스처를 생성한다. baseFrequency와 octave를 조절해 다양한 유기적 패턴을 탐구한다.
        </p>
      </header>

      {/* Hidden SVG filter definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type={noiseType}
              baseFrequency={`${freqX} ${freqY}`}
              numOctaves={octaves}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" in="noise" />
          </filter>
        </defs>
      </svg>

      {/* Preview */}
      <div className="relative w-full rounded-xl overflow-hidden mb-8 border border-zinc-800" style={{ height: '300px' }}>
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950" />

        {/* Noise layer */}
        <div
          className="absolute inset-0"
          style={{
            filter: `url(#${filterId})`,
            mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
            opacity: 0.85,
          }}
        />

        {/* Tint overlay */}
        {tintColor !== 'transparent' && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: tintColor, mixBlendMode: 'color' }}
          />
        )}

        {/* Label */}
        <div className="absolute bottom-4 left-4">
          <span className="text-[10px] font-mono text-zinc-600">{noiseType} · {freqX}×{freqY} · {octaves} oct</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">parameters</p>
          <Slider
            label="base frequency x"
            value={freqX}
            min={0.001}
            max={0.9}
            step={0.001}
            onChange={setFreqX}
          />
          <Slider
            label="base frequency y"
            value={freqY}
            min={0.001}
            max={0.9}
            step={0.001}
            onChange={setFreqY}
          />
          <Slider
            label="num octaves"
            value={octaves}
            min={1}
            max={8}
            step={1}
            onChange={setOctaves}
          />

          {/* Type toggle */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-mono text-zinc-500">type</label>
              <span className="text-[11px] font-mono text-orange-400">{noiseType}</span>
            </div>
            <div className="flex gap-1">
              {(['fractalNoise', 'turbulence'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNoiseType(t)}
                  className={`text-[11px] font-mono px-3 py-1 rounded transition-colors ${
                    noiseType === t
                      ? 'bg-orange-400/15 text-orange-300 border border-orange-400/30'
                      : 'text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Blend mode */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-mono text-zinc-500">blend mode</label>
              <span className="text-[11px] font-mono text-orange-400">{blendMode}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {BLEND_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setBlendMode(m)}
                  className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                    blendMode === m
                      ? 'bg-orange-400/15 text-orange-300 border border-orange-400/30'
                      : 'text-zinc-600 hover:text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Tint */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-mono text-zinc-500">color tint</label>
              <span className="text-[11px] font-mono text-orange-400">{TINT_COLORS[tintIndex].label}</span>
            </div>
            <div className="flex gap-1">
              {TINT_COLORS.map((c, i) => (
                <button
                  key={c.label}
                  onClick={() => setTintIndex(i)}
                  className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                    tintIndex === i
                      ? 'bg-orange-400/15 text-orange-300 border border-orange-400/30'
                      : 'text-zinc-600 hover:text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">live svg</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">
            {svgCode}
          </pre>
        </div>
      </div>

      {/* Explanation */}
      <div className="border-t border-zinc-800 pt-8 space-y-6">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            <code className="text-orange-400/80 font-mono">feTurbulence</code>는 Perlin noise 알고리즘을 기반으로 난수 텍스처를 생성하는 SVG 필터 프리미티브다. <code className="text-orange-400/80 font-mono">baseFrequency</code>는 패턴의 세밀도, <code className="text-orange-400/80 font-mono">numOctaves</code>는 디테일 레이어 수를 결정한다. fractalNoise는 부드럽고 turbulence는 더 격렬한 패턴을 만든다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`<filter id="noise">
  /* type: fractalNoise | turbulence */
  /* baseFrequency: 낮을수록 거친 패턴, 높을수록 세밀한 패턴 */
  /* numOctaves: 높을수록 디테일이 풍부해지지만 느려짐 */
  <feTurbulence
    type="fractalNoise"
    baseFrequency="0.065 0.065"
    numOctaves="4"
    stitchTiles="stitch"
  />
  <feColorMatrix type="saturate" values="0"/>
</filter>

/* mix-blend-mode로 아래 레이어와 블렌딩 */
<rect filter="url(#noise)" style="mix-blend-mode: overlay"/>`}</pre>
        </div>
      </div>
    </div>
  )
}
