'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const TEXT = `SYSTEM ERROR: memory corruption detected at sector 0x4A3F. Font metrics buffer overflow. Attempting recovery... failed. The text rendering pipeline has been compromised. Characters are being displaced from their correct positions. Reality is fragmenting at the typographic level. Please stand by while coherent output is reconstructed from corrupted glyph data.`

export default function GlitchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

    ctx.font = FONT
    const prepared = prepareWithSegments(TEXT, FONT)

    let animId: number
    let frame = 0
    let glitchEnd = 0
    let nextGlitch = 60 + Math.random() * 100
    let lineOffsets: number[] = []
    let channelSpread = 0

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      const { lines } = layoutWithLines(prepared, w - PADDING * 2, LINE_HEIGHT)

      // Trigger glitch burst
      if (frame >= nextGlitch) {
        glitchEnd = frame + 6 + Math.floor(Math.random() * 10)
        nextGlitch = frame + 70 + Math.random() * 130
        channelSpread = 2 + Math.random() * 4
        lineOffsets = lines.map(() =>
          Math.random() < 0.35 ? (Math.random() - 0.5) * 18 : 0
        )
      }

      const isGlitching = frame < glitchEnd
      const glitchT = isGlitching ? (glitchEnd - frame) / 10 : 0

      if (isGlitching) {
        const spread = channelSpread * glitchT

        lines.forEach((line, i) => {
          const baseX = PADDING + (lineOffsets[i] ?? 0)
          const y = PADDING + LINE_HEIGHT + i * LINE_HEIGHT

          // Red channel (left-shifted)
          ctx.globalCompositeOperation = 'lighter'
          ctx.fillStyle = `rgba(255, 20, 20, 0.75)`
          ctx.font = FONT
          ctx.fillText(line.text, baseX - spread, y)

          // Cyan channel (right-shifted)
          ctx.fillStyle = `rgba(20, 220, 255, 0.75)`
          ctx.fillText(line.text, baseX + spread, y)

          ctx.globalCompositeOperation = 'source-over'
        })

        // Horizontal scan-line artifact
        if (Math.random() < 0.6) {
          const scanY = PADDING + Math.random() * (h - PADDING * 2)
          const scanH = 1 + Math.floor(Math.random() * 3)
          ctx.fillStyle = `rgba(255, 255, 255, ${glitchT * 0.07})`
          ctx.fillRect(0, scanY, w, scanH)
        }

        // Block artifact
        if (Math.random() < 0.25) {
          const bx = PADDING + Math.random() * (w - PADDING * 2 - 60)
          const by = PADDING + Math.random() * (h - PADDING * 2 - 8)
          ctx.fillStyle = `rgba(251, 146, 60, ${glitchT * 0.15})`
          ctx.fillRect(bx, by, 30 + Math.random() * 60, 2 + Math.random() * 4)
        }
      } else {
        // Normal render — subtle per-frame alpha jitter
        lines.forEach((line, i) => {
          const alpha = 0.72 + Math.random() * 0.08
          ctx.fillStyle = `rgba(228, 228, 231, ${alpha})`
          ctx.font = FONT
          ctx.fillText(line.text, PADDING, PADDING + LINE_HEIGHT + i * LINE_HEIGHT)
        })
      }

      frame++
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40"
        style={{ height: 330 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            무작위 간격으로 글리치 버스트가 발생한다. 버스트 중에는{' '}
            <code className="text-orange-300/80 font-mono">lighter</code> 합성 모드로
            레드 채널을 왼쪽, 시안 채널을 오른쪽으로 분리해 크로마틱 어버레이션을 만든다.
            일부 라인에 랜덤 수평 오프셋이 적용되고, 스캔라인·블록 아티팩트가 겹친다.
            버스트 강도는 시간이 지날수록 감쇠한다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// lighter 모드 = 가산 혼합 → 겹치면 흰색
ctx.globalCompositeOperation = 'lighter'

ctx.fillStyle = 'rgba(255, 20, 20, 0.75)'
ctx.fillText(line.text, x - spread, y)   // 레드 채널

ctx.fillStyle = 'rgba(20, 220, 255, 0.75)'
ctx.fillText(line.text, x + spread, y)   // 시안 채널

ctx.globalCompositeOperation = 'source-over'`}</pre>
        </div>
      </div>
    </div>
  )
}
