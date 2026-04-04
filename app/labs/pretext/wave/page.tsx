'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const TEXT = `Typography has always been about more than just letters on a page. It shapes how we read, how we feel, and how we understand. The spacing between lines, the weight of each stroke, the rhythm of a paragraph — all of these choices are deliberate. Pretext gives us the ability to control text layout at a fundamental level, bypassing the browser's layout engine to compute positions directly. This means we can animate text the way we animate anything else: frame by frame, at 60 frames per second, with full creative freedom.`

export default function WavePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    ctx.font = FONT
    const prepared = prepareWithSegments(TEXT, FONT)

    let animId: number
    let t = 0

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      const { lines } = layoutWithLines(prepared, w - PADDING * 2, LINE_HEIGHT)

      lines.forEach((line, i) => {
        const x = PADDING
        const baseY = PADDING + LINE_HEIGHT + i * LINE_HEIGHT
        const amp = 6
        const freq = 0.4
        const speed = 0.025
        const waveY = Math.sin(t * speed * 60 + i * freq) * amp

        const alpha = 0.45 + 0.55 * ((Math.sin(t * speed * 60 + i * freq) + 1) / 2)
        ctx.fillStyle = `rgba(228, 228, 231, ${alpha})`
        ctx.font = FONT
        ctx.fillText(line.text, x, baseY + waveY)
      })

      t++
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40"
        style={{ height: 320 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            <code className="text-orange-300/80 font-mono">layoutWithLines()</code>로 각 라인의 텍스트와 너비를 계산한 뒤,
            Canvas의 <code className="text-orange-300/80 font-mono">fillText()</code>로 사인 곡선 오프셋을 적용해 렌더링한다.
            DOM을 건드리지 않기 때문에 레이아웃 스래싱 없이 60fps를 유지한다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`const prepared = prepareWithSegments(text, '15px monospace')

// 매 프레임마다 호출 — 매우 빠름 (~0.09ms)
const { lines } = layoutWithLines(prepared, width, 28)

lines.forEach((line, i) => {
  const waveY = Math.sin(t + i * 0.4) * 6
  ctx.fillText(line.text, x, baseY + i * 28 + waveY)
})`}</pre>
        </div>
      </div>
    </div>
  )
}
