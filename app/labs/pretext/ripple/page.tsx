'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const RIPPLE_SPEED = 3.5
const RIPPLE_WIDTH = 22
const RIPPLE_FORCE = 7
const MAX_RADIUS = 500
const TEXT = `Click anywhere on the text to send a ripple through it. The disturbance expands outward at constant speed — each character is displaced as the wavefront arrives, then springs back once it passes. Multiple ripples can coexist and their displacements add together. The further the wave travels, the weaker it gets.`

type Ripple = { x: number; y: number; frame: number }
type Char = {
  char: string
  restX: number
  restY: number
  x: number
  y: number
  vx: number
  vy: number
}

export default function RipplePage() {
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
    let ripples: Ripple[] = []
    let animId: number
    let frame = 0

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, frame })
      if (ripples.length > 6) ripples.shift()
    }

    canvas.addEventListener('click', onClick)

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.font = FONT

      ripples = ripples.filter((r) => (frame - r.frame) * RIPPLE_SPEED < MAX_RADIUS + RIPPLE_WIDTH)

      // Draw faint ripple rings
      ripples.forEach((r) => {
        const age = frame - r.frame
        const radius = age * RIPPLE_SPEED
        const fade = Math.max(0, 1 - radius / MAX_RADIUS)
        ctx.beginPath()
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(251, 146, 60, ${fade * 0.12})`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      chars.forEach((c) => {
        ripples.forEach((r) => {
          const age = frame - r.frame
          const currentRadius = age * RIPPLE_SPEED
          const dx = c.restX - r.x
          const dy = c.restY - r.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const distFromRing = Math.abs(dist - currentRadius)

          if (distFromRing < RIPPLE_WIDTH && dist > 0) {
            const ringIntensity = 1 - distFromRing / RIPPLE_WIDTH
            const decayWithAge = Math.max(0, 1 - currentRadius / MAX_RADIUS)
            const force = ringIntensity * decayWithAge * RIPPLE_FORCE
            const angle = Math.atan2(dy, dx)
            c.vx += Math.cos(angle) * force
            c.vy += Math.sin(angle) * force
          }
        })

        // Spring back
        c.vx += (c.restX - c.x) * 0.1
        c.vy += (c.restY - c.y) * 0.1
        // Damping
        c.vx *= 0.82
        c.vy *= 0.82

        c.x += c.vx
        c.y += c.vy

        const displaced = Math.sqrt((c.x - c.restX) ** 2 + (c.y - c.restY) ** 2)
        const alpha = 0.38 + Math.min(0.62, displaced / 18)
        ctx.fillStyle = `rgba(228, 228, 231, ${alpha})`
        ctx.fillText(c.char, c.x, c.y)
      })

      frame++
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 cursor-crosshair"
        style={{ height: 290 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            클릭 지점에서 반경이 매 프레임 {RIPPLE_SPEED}px씩 커지는 파문을 생성한다.
            각 글자는 자신의 resting position과 현재 파문 반경의 거리가 가까울 때 방사 방향으로
            힘을 받는다. 파문이 멀어질수록 세기가 약해지고, 스프링 물리로 원래 자리로 돌아온다.
            최대 6개의 파문이 동시에 존재할 수 있다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 파문 반경 = 속도 × 경과 프레임
const currentRadius = age * RIPPLE_SPEED

// 글자와 파문 링의 거리 계산
const distFromRing = Math.abs(dist - currentRadius)

if (distFromRing < RIPPLE_WIDTH) {
  const force = (1 - distFromRing / RIPPLE_WIDTH)
             * (1 - currentRadius / MAX_RADIUS)  // 감쇠
  c.vx += Math.cos(angle) * force * RIPPLE_FORCE
}`}</pre>
        </div>
      </div>
    </div>
  )
}
