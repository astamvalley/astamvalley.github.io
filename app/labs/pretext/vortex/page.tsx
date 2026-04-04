'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const PULL_RADIUS = 130
const TEXT = `Black holes don't just consume matter — they warp spacetime around them. As you approach the event horizon, time slows to a crawl and space itself curves inward. Light cannot escape. Characters cannot escape. The closer you get, the faster they orbit, pulled into an eternal spiral of mathematical elegance. Move your cursor to create a singularity.`

type Char = {
  char: string
  restX: number
  restY: number
  x: number
  y: number
  vx: number
  vy: number
}

export default function VortexPage() {
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
    let inCanvas = false
    let animId: number

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onEnter = () => { inCanvas = true }
    const onLeave = () => { inCanvas = false; mouse = { x: -999, y: -999 } }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseenter', onEnter)
    canvas.addEventListener('mouseleave', onLeave)

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.font = FONT

      chars.forEach((c) => {
        if (inCanvas) {
          const dx = c.x - mouse.x
          const dy = c.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < PULL_RADIUS && dist > 1) {
            const t = 1 - dist / PULL_RADIUS
            // Tangential force (orbit)
            const angle = Math.atan2(dy, dx)
            c.vx += -Math.sin(angle) * t * 2.8
            c.vy += Math.cos(angle) * t * 2.8
            // Inward pull (gravity well)
            c.vx -= (dx / dist) * t * 1.2
            c.vy -= (dy / dist) * t * 1.2
          }
        }

        // Spring back to rest
        c.vx += (c.restX - c.x) * 0.055
        c.vy += (c.restY - c.y) * 0.055
        // Damping
        c.vx *= 0.86
        c.vy *= 0.86

        c.x += c.vx
        c.y += c.vy

        const dx = c.x - mouse.x
        const dy = c.y - mouse.y
        const distFromCursor = Math.sqrt(dx * dx + dy * dy)
        const inOrbit = inCanvas && distFromCursor < PULL_RADIUS

        if (inOrbit) {
          const hue = ((Math.atan2(c.y - mouse.y, c.x - mouse.x) * 180) / Math.PI + 360) % 360
          const intensity = 1 - distFromCursor / PULL_RADIUS
          ctx.fillStyle = `hsla(${hue}, 85%, 68%, ${0.55 + intensity * 0.45})`
        } else {
          const displaced = Math.sqrt((c.x - c.restX) ** 2 + (c.y - c.restY) ** 2)
          ctx.fillStyle = `rgba(228, 228, 231, ${0.38 + Math.min(0.55, displaced / 35)})`
        }

        ctx.fillText(c.char, c.x, c.y)
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseenter', onEnter)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 cursor-none"
        style={{ height: 310 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            커서 반경 {PULL_RADIUS}px 안에 든 글자들에게 두 가지 힘을 동시에 가한다.
            접선 방향 힘(원형 궤도)과 구심력(중심으로 당김). 두 힘이 합쳐지면 글자들이 안쪽으로
            나선을 그리며 빨려든다. 궤도 안 글자들은 커서 기준 각도에 따라 색상이 바뀐다.
            커서가 없으면 스프링 물리로 원래 자리로 돌아온다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 접선 방향 힘 → 원형 궤도
const angle = Math.atan2(dy, dx)
c.vx += -Math.sin(angle) * t * 2.8  // 접선 (궤도)
c.vx -= (dx / dist) * t * 1.2       // 구심 (중력)

// 각도로 색상 결정
const hue = (Math.atan2(...) * 180 / Math.PI + 360) % 360
ctx.fillStyle = \`hsla(\${hue}, 85%, 68%, ...)\``}</pre>
        </div>
      </div>
    </div>
  )
}
