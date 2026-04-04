'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const MARBLE_R = 14
const REPEL_R = 52
const BURST_R = 90
const TEXT = `Click anywhere to embed a marble into the text. Each impact sends a shockwave through the surrounding characters — they are thrown outward and cannot fully return while the marble remains lodged in place. The text remembers the damage. Click multiple times to scatter several impacts across the surface and watch the deformation accumulate.`

type Marble = { x: number; y: number; age: number }
type Char = {
  char: string
  restX: number
  restY: number
  x: number
  y: number
  vx: number
  vy: number
  damage: number
}

function drawMarble(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, age: number) {
  const scale = Math.min(1, age / 8)
  const cr = r * scale
  if (cr < 0.5) return

  // Outer glow
  const glow = ctx.createRadialGradient(x, y, cr * 0.6, x, y, cr + 10)
  glow.addColorStop(0, 'rgba(251, 146, 60, 0.18)')
  glow.addColorStop(1, 'rgba(251, 146, 60, 0)')
  ctx.beginPath()
  ctx.arc(x, y, cr + 10, 0, Math.PI * 2)
  ctx.fillStyle = glow
  ctx.fill()

  // Main sphere
  const sphere = ctx.createRadialGradient(x - cr * 0.28, y - cr * 0.32, cr * 0.08, x + cr * 0.1, y + cr * 0.15, cr)
  sphere.addColorStop(0, 'rgba(255, 220, 180, 0.97)')
  sphere.addColorStop(0.25, 'rgba(251, 146, 60, 0.95)')
  sphere.addColorStop(0.65, 'rgba(170, 72, 14, 0.97)')
  sphere.addColorStop(1, 'rgba(60, 20, 4, 1)')
  ctx.beginPath()
  ctx.arc(x, y, cr, 0, Math.PI * 2)
  ctx.fillStyle = sphere
  ctx.fill()

  // Specular highlight
  const spec = ctx.createRadialGradient(x - cr * 0.3, y - cr * 0.35, 0, x - cr * 0.18, y - cr * 0.18, cr * 0.48)
  spec.addColorStop(0, 'rgba(255, 255, 255, 0.72)')
  spec.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)')
  spec.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.beginPath()
  ctx.arc(x, y, cr, 0, Math.PI * 2)
  ctx.fillStyle = spec
  ctx.fill()
}

export default function CraterPage() {
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
          chars.push({ char: ch, restX: x, restY: y, x, y, vx: 0, vy: 0, damage: 0 })
          x += cw
        }
      })
      return chars
    }

    let chars = buildChars()
    let marbles: Marble[] = []
    // Shockwave rings for visual impact flash
    let shockwaves: { x: number; y: number; frame: number }[] = []
    let animId: number
    let frame = 0

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      marbles.push({ x: mx, y: my, age: 0 })
      if (marbles.length > 7) marbles.shift()

      shockwaves.push({ x: mx, y: my, frame })

      // Burst: throw nearby characters outward
      chars.forEach((c) => {
        const dx = c.x - mx
        const dy = c.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < BURST_R && dist > 0.5) {
          const t = 1 - dist / BURST_R
          const force = t * t * 14
          const angle = Math.atan2(dy, dx)
          c.vx += Math.cos(angle) * force
          c.vy += Math.sin(angle) * force
          c.damage = Math.max(c.damage, t * 0.85)
        }
      })
    }

    canvas.addEventListener('click', onClick)

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.font = FONT

      marbles.forEach((m) => { m.age++ })

      // Shockwave rings
      shockwaves = shockwaves.filter((s) => frame - s.frame < 28)
      shockwaves.forEach((s) => {
        const age = frame - s.frame
        const r = age * 4.5
        const alpha = Math.max(0, 1 - age / 28) * 0.35
        ctx.beginPath()
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(251, 146, 60, ${alpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      // Characters
      chars.forEach((c) => {
        // Persistent marble repulsion
        marbles.forEach((m) => {
          const dx = c.x - m.x
          const dy = c.y - m.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < REPEL_R && dist > 0.5) {
            const t = 1 - dist / REPEL_R
            c.vx += (dx / dist) * t * t * 4.5
            c.vy += (dy / dist) * t * t * 4.5
          }
        })

        // Spring toward rest
        c.vx += (c.restX - c.x) * 0.075
        c.vy += (c.restY - c.y) * 0.075
        c.vx *= 0.83
        c.vy *= 0.83
        c.x += c.vx
        c.y += c.vy

        // Jitter for chars very close to a marble
        let jx = 0
        let jy = 0
        marbles.forEach((m) => {
          const dx = c.x - m.x
          const dy = c.y - m.y
          if (Math.sqrt(dx * dx + dy * dy) < MARBLE_R + 8) {
            jx = (Math.random() - 0.5) * 1.8
            jy = (Math.random() - 0.5) * 1.8
          }
        })

        const displaced = Math.sqrt((c.x - c.restX) ** 2 + (c.y - c.restY) ** 2)

        if (c.damage > 0.25) {
          const orangeness = c.damage
          const r = Math.round(228 + (251 - 228) * orangeness)
          const g = Math.round(228 + (146 - 228) * orangeness)
          const b = Math.round(231 + (60 - 231) * orangeness)
          const alpha = 0.35 + Math.min(0.55, displaced / 22)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        } else {
          ctx.fillStyle = `rgba(228, 228, 231, ${0.35 + Math.min(0.55, displaced / 22)})`
        }

        ctx.fillText(c.char, c.x + jx, c.y + jy)
      })

      // Marbles on top
      marbles.forEach((m) => drawMarble(ctx, m.x, m.y, MARBLE_R, m.age))

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
        style={{ height: 300 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            클릭 시 두 가지 효과가 동시에 발생한다. 첫째, 반경 {BURST_R}px 안의 글자들에게
            충격파 힘이 가해져 바깥으로 튀어나간다. 둘째, 구슬이 영구적으로 박혀 지속적인
            반발력을 가한다 — 글자들은 스프링으로 돌아오려 하지만 구슬이 가로막아
            크레이터 형태를 유지한다. 충격 반경 안에 있던 글자는 주황색으로 손상 표시가 남는다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 클릭 시: 충격파 burst + 손상 기록
const force = (1 - dist / BURST_R) ** 2 * 14
c.vx += Math.cos(angle) * force
c.damage = Math.max(c.damage, t * 0.85)  // 영구 손상

// 매 프레임: 구슬이 지속적으로 반발
const t = 1 - dist / REPEL_R
c.vx += (dx / dist) * t * t * 4.5  // 항상 밀어냄

// 스프링이 당기지만 구슬이 막아 크레이터 유지
c.vx += (c.restX - c.x) * 0.075`}</pre>
        </div>
      </div>
    </div>
  )
}
