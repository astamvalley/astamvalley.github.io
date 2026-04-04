'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const GRAVITY = 0.36
const BOUNCE = 0.24
const FRICTION = 0.76
const TEXT = `Gravity works on text too. These characters have mass — they fall, bounce, and pile up at the bottom. Drag left or right anywhere on the canvas to shake the container. Every glyph position was computed by pretext before physics took over.`

type Char = {
  char: string
  x: number
  y: number
  vx: number
  vy: number
  settled: boolean
}

export default function GravityPage() {
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
          chars.push({ char: ch, x, y, vx: 0, vy: 0, settled: false })
          x += cw
        }
      })
      return chars
    }

    let chars = buildChars()
    let animId: number

    // Drag shake state
    let isDragging = false
    let lastMouseX = 0
    let shakeVX = 0
    let prevShakeVX = 0

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      isDragging = true
      lastMouseX = e.clientX - rect.left
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      shakeVX = mx - lastMouseX
      lastMouseX = mx

      chars.forEach((c) => {
        c.vx += shakeVX * 0.35
        c.vy -= Math.abs(shakeVX) * 0.06
        c.settled = false
      })
    }

    const onMouseUp = () => {
      isDragging = false
      shakeVX = 0
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const floor = h - 20
      const wallL = PADDING - 6
      const wallR = w - PADDING + 6

      ctx.clearRect(0, 0, w, h)

      // Floor
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.45)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(wallL, floor + 6)
      ctx.lineTo(wallR, floor + 6)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.font = FONT

      chars.forEach((c) => {
        if (!c.settled) {
          c.vy += GRAVITY
          c.x += c.vx
          c.y += c.vy

          // Floor
          if (c.y >= floor) {
            c.y = floor
            c.vy *= -BOUNCE
            c.vx *= FRICTION
            if (Math.abs(c.vy) < 0.6) c.vy = 0
            if (Math.abs(c.vx) < 0.08) c.vx = 0
            if (c.vx === 0 && c.vy === 0) c.settled = true
          }

          // Walls
          if (c.x < wallL) { c.x = wallL; c.vx = Math.abs(c.vx) * 0.45 }
          if (c.x > wallR) { c.x = wallR; c.vx = -Math.abs(c.vx) * 0.45 }

          // Ceiling
          if (c.y < 2) { c.y = 2; c.vy = Math.abs(c.vy) * 0.3 }
        }

        const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy)
        if (speed > 2) {
          // In motion — slight orange tint
          const t = Math.min(1, speed / 14)
          const r = Math.round(228 + (251 - 228) * t)
          const g = Math.round(228 + (146 - 228) * t)
          const b = Math.round(231 + (60 - 231) * t)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.45 + t * 0.45})`
        } else {
          ctx.fillStyle = `rgba(228, 228, 231, ${c.settled ? 0.55 : 0.45})`
        }

        ctx.fillText(c.char, c.x, c.y)
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 cursor-grab active:cursor-grabbing select-none"
        style={{ height: 350 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            <code className="text-orange-300/80 font-mono">layoutWithLines()</code> + <code className="text-orange-300/80 font-mono">measureText()</code>로
            각 글자의 초기 위치를 계산한 뒤, 물리 엔진을 적용한다. 매 프레임마다 중력을 누적하고,
            바닥 충돌 시 반발 계수({BOUNCE})와 마찰({FRICTION})을 적용해 자연스럽게 쌓인다.
            캔버스를 좌우로 드래그하면 마우스 속도가 모든 글자에 힘으로 전달된다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 매 프레임: 중력 누적 + 충돌
c.vy += GRAVITY        // 중력 가속

if (c.y >= floor) {
  c.y = floor
  c.vy *= -BOUNCE      // 바닥 반발
  c.vx *= FRICTION     // 마찰
}

// 드래그 → 흔들기
const shakeVX = mouseX - prevMouseX
c.vx += shakeVX * 0.35
c.vy -= Math.abs(shakeVX) * 0.06  // 위로 살짝 튀어오름`}</pre>
        </div>
      </div>
    </div>
  )
}
