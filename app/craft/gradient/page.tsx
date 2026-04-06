'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-[11px] font-mono text-zinc-500">{label}</label>
        <span className="text-[11px] font-mono text-orange-400">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-0.5 bg-zinc-700 rounded appearance-none cursor-pointer accent-orange-400"
      />
    </div>
  )
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function buildGradient(colors: string[], hueShift: number): string {
  const [h0, s0, l0] = hexToHsl(colors[0])
  const [h1, s1, l1] = hexToHsl(colors[1])
  const [h2, s2, l2] = hexToHsl(colors[2])
  const [h3, s3, l3] = hexToHsl(colors[3])

  const sh = hueShift

  return [
    `radial-gradient(ellipse at 0% 0%, hsl(${(h0 + sh) % 360}, ${s0}%, ${l0}%) 0%, transparent 60%)`,
    `radial-gradient(ellipse at 100% 0%, hsl(${(h1 + sh) % 360}, ${s1}%, ${l1}%) 0%, transparent 60%)`,
    `radial-gradient(ellipse at 100% 100%, hsl(${(h2 + sh) % 360}, ${s2}%, ${l2}%) 0%, transparent 60%)`,
    `radial-gradient(ellipse at 0% 100%, hsl(${(h3 + sh) % 360}, ${s3}%, ${l3}%) 0%, transparent 60%)`,
    `conic-gradient(from 0deg at 50% 50%, hsl(${(h0 + sh) % 360}, ${s0}%, ${Math.max(l0 - 15, 5)}%) 0%, hsl(${(h2 + sh) % 360}, ${s2}%, ${Math.max(l2 - 15, 5)}%) 50%, hsl(${(h0 + sh) % 360}, ${s0}%, ${Math.max(l0 - 15, 5)}%) 100%)`,
  ].join(', ')
}

export default function GradientPage() {
  const [colors, setColors] = useState(['#7c3aed', '#ea580c', '#0891b2', '#16a34a'])
  const [speed, setSpeed] = useState(30)
  const [animated, setAnimated] = useState(true)
  const [hueShift, setHueShift] = useState(0)

  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const hueRef = useRef(0)

  const tick = useCallback((timestamp: number) => {
    const delta = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp
    hueRef.current = (hueRef.current + (speed / 100) * delta * 0.05) % 360
    setHueShift(Math.round(hueRef.current))
    rafRef.current = requestAnimationFrame(tick)
  }, [speed])

  useEffect(() => {
    if (animated) {
      lastTimeRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [animated, tick])

  const gradient = buildGradient(colors, hueShift)

  const [h0, s0, l0] = hexToHsl(colors[0])
  const [h1, s1, l1] = hexToHsl(colors[1])
  const [h2, s2, l2] = hexToHsl(colors[2])
  const [h3, s3, l3] = hexToHsl(colors[3])
  const sh = hueShift

  const cssCode = `background:
  radial-gradient(ellipse at 0% 0%,
    hsl(${(h0 + sh) % 360}, ${s0}%, ${l0}%) 0%,
    transparent 60%),
  radial-gradient(ellipse at 100% 0%,
    hsl(${(h1 + sh) % 360}, ${s1}%, ${l1}%) 0%,
    transparent 60%),
  radial-gradient(ellipse at 100% 100%,
    hsl(${(h2 + sh) % 360}, ${s2}%, ${l2}%) 0%,
    transparent 60%),
  radial-gradient(ellipse at 0% 100%,
    hsl(${(h3 + sh) % 360}, ${s3}%, ${l3}%) 0%,
    transparent 60%),
  conic-gradient(from 0deg at 50% 50%,
    hsl(${(h0 + sh) % 360}, ${s0}%, ${Math.max(l0 - 15, 5)}%) 0%,
    hsl(${(h2 + sh) % 360}, ${s2}%, ${Math.max(l2 - 15, 5)}%) 50%,
    hsl(${(h0 + sh) % 360}, ${s0}%, ${Math.max(l0 - 15, 5)}%) 100%);`

  return (
    <div>
      <a href="/" className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-12 mb-10">← Home</a>
      <header className="mb-8 sm:mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">Gradient</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
          conic-gradient와 radial-gradient를 겹쳐 메시 그라디언트를 만든다. 색상 포인트와 애니메이션 속도를 실시간으로 제어한다.
        </p>
      </header>

      {/* Preview */}
      <div
        className="w-full rounded-2xl mb-8 border border-zinc-800 relative overflow-hidden"
        style={{ height: '340px', background: gradient }}
      >
        {/* Subtle grain overlay for depth */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '200px 200px',
            mixBlendMode: 'overlay',
          }}
        />
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <span className="text-[10px] font-mono text-white/40">
            hue shift: {sh}°
          </span>
          {animated && (
            <span className="text-[10px] font-mono text-orange-300/60 animate-pulse">
              ● animating
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">color points</p>

          {[
            { label: 'top-left', idx: 0 },
            { label: 'top-right', idx: 1 },
            { label: 'bottom-right', idx: 2 },
            { label: 'bottom-left', idx: 3 },
          ].map(({ label, idx }) => (
            <div key={idx} className="flex items-center gap-3 mb-3">
              <label className="text-[11px] font-mono text-zinc-500 w-20 shrink-0">{label}</label>
              <div className="relative flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-md border border-zinc-700 cursor-pointer overflow-hidden"
                  style={{ backgroundColor: colors[idx] }}
                >
                  <input
                    type="color"
                    value={colors[idx]}
                    onChange={(e) => {
                      const next = [...colors]
                      next[idx] = e.target.value
                      setColors(next)
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-600">{colors[idx]}</span>
            </div>
          ))}

          <div className="mt-6">
            <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">animation</p>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setAnimated(!animated)}
                className={`text-[11px] font-mono px-3 py-1.5 rounded transition-colors border ${
                  animated
                    ? 'bg-orange-400/15 text-orange-300 border-orange-400/30'
                    : 'text-zinc-500 hover:text-zinc-300 border-zinc-800'
                }`}
              >
                {animated ? 'animated' : 'static'}
              </button>
            </div>
            {animated && (
              <Slider
                label="speed"
                value={speed}
                min={1}
                max={100}
                onChange={setSpeed}
              />
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">live css</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">
            {cssCode}
          </pre>
        </div>
      </div>

      {/* Explanation */}
      <div className="border-t border-zinc-800 pt-8 space-y-6">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            메시 그라디언트는 여러 <code className="text-orange-400/80 font-mono">radial-gradient</code>를 각 모서리에 배치하고 <code className="text-orange-400/80 font-mono">conic-gradient</code>를 기반 레이어로 깔아 만든다. CSS <code className="text-orange-400/80 font-mono">background</code> 속성에 쉼표로 여러 그라디언트를 나열하면 자동으로 위에서 아래로 겹쳐진다. 애니메이션은 requestAnimationFrame으로 hue 값을 매 프레임 조금씩 시프트하여 구현한다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`/* 여러 그라디언트를 background에 쌓기 */
background:
  radial-gradient(ellipse at 0% 0%, hsl(270, 80%, 50%) 0%, transparent 60%),
  radial-gradient(ellipse at 100% 0%, hsl(28, 90%, 50%) 0%, transparent 60%),
  radial-gradient(ellipse at 100% 100%, hsl(200, 85%, 45%) 0%, transparent 60%),
  radial-gradient(ellipse at 0% 100%, hsl(130, 70%, 35%) 0%, transparent 60%),
  conic-gradient(from 0deg at 50% 50%, hsl(270, 80%, 35%) 0%, hsl(200, 85%, 30%) 50%, ...);

/* hue 시프트로 애니메이션 */
function tick(timestamp) {
  hueRef.current = (hueRef.current + delta * 0.05) % 360
  setHueShift(hueRef.current)
  requestAnimationFrame(tick)
}`}</pre>
        </div>
      </div>
    </div>
  )
}
