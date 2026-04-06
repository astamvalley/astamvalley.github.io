'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const TEXT = `Opposite charges attract. Each glyph here carries a positive charge and your cursor carries negative. Move the cursor over the text and feel them pull toward you — orbiting, clustering, straining against the elastic force that keeps them tethered to their home positions. Click to release a repulsive pulse.`

const ATTRACT_RADIUS = 120
const ATTRACT_STRENGTH = 5.5
const REPEL_STRENGTH = 14
const SPRING = 0.09
const DAMPING = 0.80

type Char = {
  char: string
  restX: number
  restY: number
  x: number
  y: number
  vx: number
  vy: number
}

export default function MagneticPage() {
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
    let pulse = false
    let animId: number

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onLeave = () => { mouse = { x: -999, y: -999 } }
    const onClick = () => { pulse = true }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('click', onClick)

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.font = FONT

      // Field line glow around cursor
      if (mouse.x > 0) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, ATTRACT_RADIUS)
        grad.addColorStop(0, 'rgba(251,146,60,0.06)')
        grad.addColorStop(1, 'rgba(251,146,60,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, ATTRACT_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      chars.forEach((c) => {
        const dx = mouse.x - c.x
        const dy = mouse.y - c.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (pulse) {
          // Repulsive pulse from cursor
          if (dist < ATTRACT_RADIUS * 1.5 && dist > 1) {
            const force = REPEL_STRENGTH * (1 - dist / (ATTRACT_RADIUS * 1.5))
            c.vx -= (dx / dist) * force
            c.vy -= (dy / dist) * force
          }
        } else if (dist < ATTRACT_RADIUS && dist > 1) {
          // Attract toward cursor
          const force = ((ATTRACT_RADIUS - dist) / ATTRACT_RADIUS) * ATTRACT_STRENGTH
          c.vx += (dx / dist) * force * 0.08
          c.vy += (dy / dist) * force * 0.08
        }

        // Spring back to rest
        c.vx += (c.restX - c.x) * SPRING
        c.vy += (c.restY - c.y) * SPRING
        c.vx *= DAMPING
        c.vy *= DAMPING
        c.x += c.vx
        c.y += c.vy

        const displaced = Math.sqrt((c.x - c.restX) ** 2 + (c.y - c.restY) ** 2)
        const t = Math.min(1, displaced / 40)
        const r = Math.round(228 + (251 - 228) * t)
        const g = Math.round(228 + (146 - 228) * t)
        const b = Math.round(231 + (60 - 231) * t)
        ctx.fillStyle = `rgba(${r},${g},${b},${0.45 + t * 0.5})`
        ctx.fillText(c.char, c.x, c.y)
      })

      if (pulse) pulse = false
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <div>
      <p className="text-xs font-mono text-zinc-600 mb-3">커서를 가져가면 글자가 당겨집니다 — 클릭하면 펄스 방출</p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 cursor-none"
        style={{ height: 260 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            Scatter와 반대 방향의 힘이다. 각 글자는 커서를 향해 인력(引力)을 받고,
            스프링으로 원래 위치에 묶여 있어 당기다 돌아온다.
            클릭 시 반발 펄스가 발생해 근처 글자를 밀어낸다.
            변위에 비례해 글자 색이 orange-300으로 물든다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 인력: 커서 방향으로 가속
const force = ((RADIUS - dist) / RADIUS) * STRENGTH
c.vx += (dx / dist) * force * 0.08

// 클릭 시 반발 펄스
c.vx -= (dx / dist) * REPEL

// 스프링 복원
c.vx += (c.restX - c.x) * 0.09
c.vx *= 0.80  // 감쇠`}</pre>
        </div>
      </div>
    </div>
  )
}
