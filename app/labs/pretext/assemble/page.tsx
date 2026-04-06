'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const TEXT = `Order emerges from chaos. Watch the letters gather themselves from the void — each one launched from a random position across the canvas, spiraling and converging toward its assigned place in the text. Once assembled, they rest for a moment before dissolving again. The cycle never ends.`

const ASSEMBLE_DURATION = 120  // frames to assemble
const HOLD_DURATION = 180       // frames to hold assembled state
const SCATTER_DURATION = 40     // frames to scatter
const SPRING = 0.10
const DAMPING = 0.78

type Char = {
  char: string
  restX: number
  restY: number
  x: number
  y: number
  vx: number
  vy: number
  scatterX: number
  scatterY: number
}

type Phase = 'assembling' | 'holding' | 'scattering'

export default function AssemblePage() {
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

    const randomScatter = (w: number, h: number) => ({
      x: Math.random() * w,
      y: Math.random() * h,
    })

    const buildChars = (): Char[] => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const { lines } = layoutWithLines(prepared, w - PADDING * 2, LINE_HEIGHT)
      const chars: Char[] = []
      lines.forEach((line, li) => {
        let x = PADDING
        const y = PADDING + LINE_HEIGHT + li * LINE_HEIGHT
        for (const ch of line.text) {
          const cw = ctx.measureText(ch).width
          const s = randomScatter(w, h)
          chars.push({
            char: ch,
            restX: x, restY: y,
            x: s.x, y: s.y,
            vx: 0, vy: 0,
            scatterX: s.x, scatterY: s.y,
          })
          x += cw
        }
      })
      return chars
    }

    let chars = buildChars()
    let phase: Phase = 'assembling'
    let phaseTimer = 0
    let animId: number

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.font = FONT

      phaseTimer++

      if (phase === 'assembling' && phaseTimer > ASSEMBLE_DURATION) {
        phase = 'holding'
        phaseTimer = 0
      } else if (phase === 'holding' && phaseTimer > HOLD_DURATION) {
        phase = 'scattering'
        phaseTimer = 0
        // Assign new scatter targets
        chars.forEach((c) => {
          c.scatterX = Math.random() * w
          c.scatterY = Math.random() * h
        })
      } else if (phase === 'scattering' && phaseTimer > SCATTER_DURATION) {
        phase = 'assembling'
        phaseTimer = 0
        // Teleport to scatter position and reassemble
        chars.forEach((c) => {
          c.x = c.scatterX
          c.y = c.scatterY
          c.vx = (Math.random() - 0.5) * 6
          c.vy = (Math.random() - 0.5) * 6
        })
      }

      chars.forEach((c, idx) => {
        let targetX = c.restX
        let targetY = c.restY

        if (phase === 'scattering') {
          targetX = c.scatterX
          targetY = c.scatterY
        }

        // Spring toward target
        c.vx += (targetX - c.x) * SPRING
        c.vy += (targetY - c.y) * SPRING
        c.vx *= DAMPING
        c.vy *= DAMPING
        c.x += c.vx
        c.y += c.vy

        const dx = c.x - c.restX
        const dy = c.y - c.restY
        const displaced = Math.sqrt(dx * dx + dy * dy)
        const t = Math.min(1, displaced / 80)

        let alpha: number
        if (phase === 'holding') {
          alpha = 0.75
        } else if (phase === 'scattering') {
          const progress = phaseTimer / SCATTER_DURATION
          alpha = 0.75 * (1 - progress * 0.6)
        } else {
          const progress = Math.min(1, phaseTimer / ASSEMBLE_DURATION)
          alpha = 0.15 + progress * 0.6 + (1 - t) * 0.2
        }

        const r = Math.round(228 - t * 30)
        const g = Math.round(228 - t * 60)
        const bv = Math.round(231 - t * 60)
        ctx.fillStyle = `rgba(${r},${g},${bv},${Math.max(0.05, Math.min(1, alpha))})`
        ctx.fillText(c.char, c.x, c.y)
      })

      // Phase label
      const label = phase === 'assembling' ? '↗ assembling' : phase === 'holding' ? '— assembled' : '↙ scattering'
      ctx.fillStyle = 'rgba(63,63,70,0.8)'
      ctx.font = '10px monospace'
      ctx.fillText(label, PADDING, canvas.offsetHeight - 10)
      ctx.font = FONT

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => { cancelAnimationFrame(animId) }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40"
        style={{ height: 300 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            세 페이즈를 반복한다: <em>assembling</em>(흩어진 위치에서 제자리로 스프링 수렴),
            <em> holding</em>(완성 상태 유지), <em>scattering</em>(새 랜덤 좌표로 이동 후 텔레포트).
            각 글자의 목표 좌표만 전환하면 되고, 실제 움직임은 스프링 물리가 자동으로 처리한다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 페이즈에 따라 목표 좌표 전환
const target = phase === 'scattering'
  ? { x: c.scatterX, y: c.scatterY }
  : { x: c.restX,    y: c.restY }

// 스프링 수렴 (매 프레임)
c.vx += (target.x - c.x) * 0.10
c.vy += (target.y - c.y) * 0.10
c.vx *= 0.78  // 감쇠
c.x  += c.vx`}</pre>
        </div>
      </div>
    </div>
  )
}
