'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const TEXT = `Heat warps letters. Hover over a glyph to melt it — watch the characters lose their rigid form and drip toward the floor. Each letter remembers where it should be. Cool it down by pulling the cursor away and it slowly climbs back up, resolidifying into its proper place in the paragraph.`

type Char = {
  char: string
  restX: number
  restY: number
  x: number
  y: number
  drip: number  // accumulated drip offset
  heat: number  // 0..1
  vdrip: number
}

const MELT_RADIUS = 55
const MAX_DRIP = 80
const HEAT_RATE = 0.06
const COOL_RATE = 0.025
const RISE_SPRING = 0.07
const DAMPING = 0.82

export default function MeltPage() {
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
          chars.push({ char: ch, restX: x, restY: y, x, y, drip: 0, heat: 0, vdrip: 0 })
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
        const dx = c.restX - mouse.x
        const dy = c.restY - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        const isHot = dist < MELT_RADIUS
        if (isHot) {
          c.heat = Math.min(1, c.heat + HEAT_RATE * (1 - dist / MELT_RADIUS) * 2)
        } else {
          c.heat = Math.max(0, c.heat - COOL_RATE)
        }

        // Drip: accumulate downward when hot
        const gravity = c.heat * 1.4
        c.vdrip += gravity
        c.vdrip += (0 - c.drip) * RISE_SPRING * (1 - c.heat)  // spring back when cool
        c.vdrip *= DAMPING
        c.drip = Math.max(0, Math.min(MAX_DRIP * c.heat + c.drip * 0.1, c.drip + c.vdrip))
        if (c.heat < 0.01) {
          c.vdrip += (0 - c.drip) * 0.04
        }

        c.y = c.restY + c.drip

        // Color: white → red-orange as it heats
        const r = Math.round(228 + (239 - 228) * c.heat)
        const g = Math.round(228 + (68 - 228) * c.heat)
        const bv = Math.round(231 + (68 - 231) * c.heat)
        const alpha = 0.5 + c.heat * 0.4 - (c.drip / MAX_DRIP) * 0.2
        ctx.fillStyle = `rgba(${r},${g},${bv},${Math.max(0.1, alpha)})`

        // Slight vertical squish when dripping
        ctx.save()
        ctx.translate(c.x, c.y)
        if (c.heat > 0.1) {
          const scaleY = 1 + c.heat * 0.3
          ctx.scale(1, scaleY)
          ctx.translate(0, -c.drip * 0.1)
        }
        ctx.fillText(c.char, 0, 0)
        ctx.restore()
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
      <p className="text-xs font-mono text-zinc-600 mb-3">커서를 글자 위에 올리면 녹아내립니다</p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 cursor-none"
        style={{ height: 300 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            각 글자는 <code className="text-orange-300/80 font-mono">heat</code> 값(0~1)을 가진다.
            커서가 반경 {MELT_RADIUS}px 안에 들어오면 열이 오르고, drip 속도가 증가해 글자가 아래로 흘러내린다.
            커서가 떠나면 열이 식고 스프링 복원력이 글자를 제자리로 끌어올린다.
            <code className="text-orange-300/80 font-mono">ctx.scale(1, scaleY)</code>로 세로 늘어남 효과를 추가했다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 열 누적
c.heat = Math.min(1, c.heat + HEAT_RATE * proximity)

// drip 물리
c.vdrip += c.heat * 1.4          // 중력 (열에 비례)
c.vdrip += (0 - c.drip) * 0.07  // 냉각 시 스프링 복원
c.vdrip *= 0.82                  // 감쇠
c.drip += c.vdrip

// 세로 늘어남
ctx.scale(1, 1 + c.heat * 0.3)`}</pre>
        </div>
      </div>
    </div>
  )
}
