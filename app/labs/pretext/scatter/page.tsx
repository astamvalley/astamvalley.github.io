'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const RADIUS = 80
const TEXT = `Move your cursor over the text to scatter the characters. Each glyph is tracked individually — its resting position computed by measuring cumulative character widths along each line. When the cursor comes close, it flies outward. When you move away, it eases back home.`

type Char = {
  char: string
  restX: number
  restY: number
  x: number
  y: number
  vx: number
  vy: number
}

export default function ScatterPage() {
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

    const buildChars = (): Char[] => {
      const w = canvas.offsetWidth
      const { lines } = layoutWithLines(prepared, w - PADDING * 2, LINE_HEIGHT)
      const chars: Char[] = []

      lines.forEach((line, li) => {
        let x = PADDING
        const y = PADDING + LINE_HEIGHT + li * LINE_HEIGHT
        for (const ch of line.text) {
          const cw = ctx.measureText(ch).width
          chars.push({ char: ch, restX: x, restY: y, x, y, vx: 0, vy: 0 })
          x += cw
        }
      })
      return chars
    }

    let chars = buildChars()
    let mouse = { x: -999, y: -999 }
    let animId: number

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onLeave = () => { mouse = { x: -999, y: -999 } }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.font = FONT

      chars.forEach((c) => {
        const dx = c.x - mouse.x
        const dy = c.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < RADIUS) {
          const force = (RADIUS - dist) / RADIUS
          const angle = Math.atan2(dy, dx)
          c.vx += Math.cos(angle) * force * 4
          c.vy += Math.sin(angle) * force * 4
        }

        // spring back to rest
        c.vx += (c.restX - c.x) * 0.12
        c.vy += (c.restY - c.y) * 0.12
        // damping
        c.vx *= 0.78
        c.vy *= 0.78

        c.x += c.vx
        c.y += c.vy

        const displaced = Math.abs(c.x - c.restX) + Math.abs(c.y - c.restY)
        const alpha = 0.4 + Math.min(0.6, displaced / 30)
        ctx.fillStyle = `rgba(228, 228, 231, ${alpha})`
        ctx.fillText(c.char, c.x, c.y)
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 cursor-none"
        style={{ height: 280 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            <code className="text-orange-300/80 font-mono">layoutWithLines()</code>로 라인을 구한 뒤,
            각 글자의 x 위치는 <code className="text-orange-300/80 font-mono">ctx.measureText()</code>로 누적 계산한다.
            마우스가 반경 {80}px 안에 들어오면 반발력을 적용하고, 스프링 물리로 원래 자리로 되돌아온다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 글자별 resting position 계산
lines.forEach((line, li) => {
  let x = PADDING
  for (const ch of line.text) {
    const cw = ctx.measureText(ch).width
    chars.push({ char: ch, restX: x, restY: baseY + li * 28, x, y, vx: 0, vy: 0 })
    x += cw
  }
})

// 매 프레임: 마우스 반발력 + 스프링
const force = (RADIUS - dist) / RADIUS
c.vx += Math.cos(angle) * force * 4
c.vx += (c.restX - c.x) * 0.12  // spring
c.vx *= 0.78                      // damping`}</pre>
        </div>
      </div>
    </div>
  )
}
