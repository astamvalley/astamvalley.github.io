'use client'

import { useState } from 'react'
import Slider from '@/app/components/Slider'

export default function GlassPage() {
  const [blur, setBlur] = useState(16)
  const [opacity, setOpacity] = useState(18)
  const [borderOpacity, setBorderOpacity] = useState(25)
  const [saturation, setSaturation] = useState(160)

  const bgAlpha = (opacity / 100).toFixed(2)
  const borderAlpha = (borderOpacity / 100).toFixed(2)

  const cssCode = `.glass-card {
  backdrop-filter: blur(${blur}px) saturate(${saturation}%);
  -webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);
  background-color: rgba(255, 255, 255, ${bgAlpha});
  border: 1px solid rgba(255, 255, 255, ${borderAlpha});
  border-radius: 16px;
}`

  return (
    <div>
      <header className="mb-8 sm:mb-12">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-3">Glass</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
          Glassmorphism 플레이그라운드. backdrop-filter 속성을 실시간으로 조정하며 반투명 유리 효과를 탐구한다.
        </p>
      </header>

      {/* Animated background + glass card */}
      <div
        className="relative w-full rounded-2xl overflow-hidden mb-8"
        style={{ height: '420px' }}
      >
        {/* Blob 1 — purple */}
        <div
          className="absolute rounded-full"
          style={{
            width: '380px',
            height: '380px',
            background: 'hsl(270, 80%, 55%)',
            filter: 'blur(80px)',
            opacity: 0.75,
            top: '-80px',
            left: '-60px',
            animation: 'blob1 9s ease-in-out infinite alternate',
          }}
        />
        {/* Blob 2 — orange */}
        <div
          className="absolute rounded-full"
          style={{
            width: '320px',
            height: '320px',
            background: 'hsl(28, 90%, 55%)',
            filter: 'blur(80px)',
            opacity: 0.7,
            bottom: '-60px',
            right: '-40px',
            animation: 'blob2 11s ease-in-out infinite alternate',
          }}
        />
        {/* Blob 3 — blue */}
        <div
          className="absolute rounded-full"
          style={{
            width: '280px',
            height: '280px',
            background: 'hsl(200, 85%, 55%)',
            filter: 'blur(80px)',
            opacity: 0.65,
            bottom: '-20px',
            left: '30%',
            animation: 'blob3 13s ease-in-out infinite alternate',
          }}
        />

        {/* Dark base so frosted effect reads clearly */}
        <div className="absolute inset-0 bg-[#0a0a0a]/40" />

        {/* Glass card */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div
            className="w-full max-w-sm rounded-2xl p-7"
            style={{
              backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
              WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
              backgroundColor: `rgba(255, 255, 255, ${bgAlpha})`,
              border: `1px solid rgba(255, 255, 255, ${borderAlpha})`,
            }}
          >
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">glass card</p>
            <h2 className="font-mono text-base font-semibold text-zinc-900 mb-2">
              Frosted Interface
            </h2>
            <p className="text-xs font-mono text-zinc-700 leading-relaxed mb-4">
              backdrop-filter blurs and desaturates everything behind this surface, creating the illusion of frosted glass.
            </p>
            <div className="flex gap-2">
              <div className="h-1 flex-1 rounded-full bg-zinc-900/20" />
              <div className="h-1 flex-[2] rounded-full bg-zinc-900/30" />
              <div className="h-1 flex-1 rounded-full bg-zinc-900/15" />
            </div>
          </div>
        </div>
      </div>

      {/* Blob keyframe animations */}
      <style>{`
        @keyframes blob1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(60px, 40px) scale(1.08); }
          100% { transform: translate(20px, 80px) scale(0.95); }
        }
        @keyframes blob2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(-50px, -30px) scale(1.1); }
          100% { transform: translate(-20px, 50px) scale(0.92); }
        }
        @keyframes blob3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(40px, -50px) scale(1.05); }
          100% { transform: translate(-30px, -20px) scale(1.1); }
        }
      `}</style>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">parameters</p>
          <Slider label="blur" value={blur} min={0} max={40} unit="px" onChange={setBlur} />
          <Slider label="opacity" value={opacity} min={0} max={100} unit="%" onChange={setOpacity} />
          <Slider label="border opacity" value={borderOpacity} min={0} max={100} unit="%" onChange={setBorderOpacity} />
          <Slider label="saturation" value={saturation} min={100} max={200} unit="%" onChange={setSaturation} />
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
            <code className="text-orange-400/80 font-mono">backdrop-filter</code>는 요소 뒤의 영역에 그래픽 효과를 적용하는 CSS 속성이다. <code className="text-orange-400/80 font-mono">blur()</code>로 배경을 흐리게 하고 <code className="text-orange-400/80 font-mono">saturate()</code>로 채도를 높이면, 배경이 비쳐 보이는 반투명 유리 효과가 만들어진다. 반드시 배경이 투명한 요소에 적용해야 효과가 보인다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`/* backdrop-filter: 요소 뒤 영역에 필터 적용 */
backdrop-filter: blur(16px) saturate(160%);

/* 배경은 반투명으로 — 완전 불투명하면 효과가 보이지 않음 */
background-color: rgba(255, 255, 255, 0.18);

/* 섬세한 테두리가 유리 질감을 완성 */
border: 1px solid rgba(255, 255, 255, 0.25);`}</pre>
        </div>
      </div>
    </div>
  )
}
