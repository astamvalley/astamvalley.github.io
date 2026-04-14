'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Matter from 'matter-js'
import BackLink from '@/app/components/BackLink'

// ── Constants ─────────────────────────────────────────────────────────────────
const CW = 420
const CH = 420
const BX = 30, BY = 30, BW = 360, BH = 360   // board rect
const MR = 16                                   // marble radius
const MAX_DRAG = 100                            // px cap for power
const SETTLE_FRAMES = 60                        // min frames before stillness check

// ── Types ─────────────────────────────────────────────────────────────────────
type Player = 1 | 2
type Phase = 'select' | 'aim' | 'rolling' | 'over'
interface Marble { body: Matter.Body; player: Player }

// ── Initial layout ────────────────────────────────────────────────────────────
const ROW_XS = [90, 170, 250, 330]

function makeMarbles(engine: Matter.Engine): Marble[] {
  const defs: { player: Player; x: number; y: number }[] = [
    // P1 – bottom half (orange)
    ...ROW_XS.map(x => ({ player: 1 as Player, x, y: 290 })),
    ...ROW_XS.map(x => ({ player: 1 as Player, x, y: 342 })),
    // P2 – top half (blue)
    ...ROW_XS.map(x => ({ player: 2 as Player, x, y: 130 })),
    ...ROW_XS.map(x => ({ player: 2 as Player, x, y: 78 })),
  ]
  const marbles = defs.map(({ player, x, y }) => ({
    body: Matter.Bodies.circle(x, y, MR, {
      restitution: 0.88,
      friction: 0,
      frictionAir: 0.038,
      frictionStatic: 0,
    }),
    player,
  }))
  Matter.World.add(engine.world, marbles.map(m => m.body))
  return marbles
}

function isOut(body: Matter.Body) {
  const { x, y } = body.position
  return x < BX || x > BX + BW || y < BY || y > BY + BH
}

function allStill(marbles: Marble[]) {
  return marbles.every(({ body }) => body.speed < 0.2)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AlkkagiPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const marblesRef = useRef<Marble[]>([])

  // game state via refs (read inside rAF) + React state (for UI)
  const phaseRef = useRef<Phase>('select')
  const turnRef = useRef<Player>(1)
  const selectedRef = useRef<Marble | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const settleRef = useRef(0)

  const [turn, setTurn] = useState<Player>(1)
  const [counts, setCounts] = useState<Record<Player, number>>({ 1: 8, 2: 8 })
  const [phase, setPhase] = useState<Phase>('select')
  const [winner, setWinner] = useState<Player | null>(null)

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p) }
  const syncTurn = (t: Player) => { turnRef.current = t; setTurn(t) }

  // ── Main loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } })
    engineRef.current = engine
    marblesRef.current = makeMarbles(engine)

    let animId: number

    const frame = () => {
      const currentPhase = phaseRef.current

      // ── Physics ──────────────────────────────────────────────────────────
      if (currentPhase === 'rolling') {
        Matter.Engine.update(engine, 1000 / 60)

        // Evict out-of-bounds marbles
        const out = marblesRef.current.filter(m => isOut(m.body))
        if (out.length > 0) {
          const outSet = new Set(out.map(m => m.body))
          out.forEach(m => Matter.World.remove(engine.world, m.body))
          marblesRef.current = marblesRef.current.filter(m => !outSet.has(m.body))

          const c1 = marblesRef.current.filter(m => m.player === 1).length
          const c2 = marblesRef.current.filter(m => m.player === 2).length
          setCounts({ 1: c1, 2: c2 })

          if (c2 === 0) { syncPhase('over'); setWinner(1) }
          else if (c1 === 0) { syncPhase('over'); setWinner(2) }
        }

        // Transition to next turn once settled
        if (phaseRef.current === 'rolling') {
          settleRef.current++
          if (settleRef.current >= SETTLE_FRAMES && allStill(marblesRef.current)) {
            settleRef.current = 0
            syncTurn(turnRef.current === 1 ? 2 : 1)
            syncPhase('select')
          }
        }
      }

      // ── Draw ─────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, CW, CH)

      // Background
      ctx.fillStyle = '#18181b'
      ctx.fillRect(0, 0, CW, CH)

      // Board surface
      ctx.fillStyle = '#1c1917'
      ctx.fillRect(BX, BY, BW, BH)

      // Grid lines
      ctx.strokeStyle = '#292524'
      ctx.lineWidth = 1
      for (let i = 1; i < 6; i++) {
        const fx = BX + (BW / 6) * i
        const fy = BY + (BH / 6) * i
        ctx.beginPath(); ctx.moveTo(fx, BY); ctx.lineTo(fx, BY + BH); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(BX, fy); ctx.lineTo(BX + BW, fy); ctx.stroke()
      }

      // Center divider
      ctx.strokeStyle = '#44403c'
      ctx.lineWidth = 1.5
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      ctx.moveTo(BX, BY + BH / 2)
      ctx.lineTo(BX + BW, BY + BH / 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Board border
      ctx.strokeStyle = '#78716c'
      ctx.lineWidth = 2
      ctx.strokeRect(BX, BY, BW, BH)

      // Aim arrow
      const sel = selectedRef.current
      const mouse = mouseRef.current
      if (phaseRef.current === 'aim' && sel) {
        const { x, y } = sel.body.position
        const dx = x - mouse.x   // shoot = opposite of drag
        const dy = y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 4) {
          const power = Math.min(dist, MAX_DRAG) / MAX_DRAG
          const nx = dx / dist, ny = dy / dist
          const arrowLen = 24 + power * 80

          ctx.save()
          ctx.globalAlpha = 0.4 + power * 0.55

          // Dashed shaft
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 2.5
          ctx.setLineDash([6, 5])
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + nx * arrowLen, y + ny * arrowLen)
          ctx.stroke()
          ctx.setLineDash([])

          // Arrow head
          const ax = x + nx * arrowLen, ay = y + ny * arrowLen
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(ax - nx * 10 + (-ny) * 6, ay - ny * 10 + nx * 6)
          ctx.lineTo(ax - nx * 10 - (-ny) * 6, ay - ny * 10 - nx * 6)
          ctx.closePath()
          ctx.fillStyle = '#fbbf24'
          ctx.fill()
          ctx.restore()

          // Pull-back guide
          ctx.strokeStyle = 'rgba(251,191,36,0.12)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }
      }

      // Marbles
      marblesRef.current.forEach(({ body, player }) => {
        const { x, y } = body.position
        const isSel = sel?.body === body
        const [light, dark] = player === 1
          ? ['#fb923c', '#9a3412']
          : ['#60a5fa', '#1e40af']

        // Selection glow
        if (isSel) {
          ctx.beginPath()
          ctx.arc(x, y, MR + 7, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(251,191,36,0.18)'
          ctx.fill()
        }

        // Shadow
        ctx.beginPath()
        ctx.arc(x + 1.5, y + 2.5, MR, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fill()

        // Body
        const grad = ctx.createRadialGradient(x - MR * 0.3, y - MR * 0.3, 1, x, y, MR)
        grad.addColorStop(0, light)
        grad.addColorStop(1, dark)
        ctx.beginPath()
        ctx.arc(x, y, MR, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = dark
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Specular highlight
        ctx.beginPath()
        ctx.arc(x - MR * 0.28, y - MR * 0.32, MR * 0.32, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.28)'
        ctx.fill()
      })

      animId = requestAnimationFrame(frame)
    }

    animId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(animId)
      Matter.World.clear(engine.world, false)
      Matter.Engine.clear(engine)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restart ───────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    const engine = engineRef.current!
    Matter.World.clear(engine.world, false)
    marblesRef.current = makeMarbles(engine)
    selectedRef.current = null
    settleRef.current = 0
    setCounts({ 1: 8, 2: 8 })
    setWinner(null)
    syncTurn(1)
    syncPhase('select')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Input helpers ─────────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - r.left) * (CW / r.width),
      y: (e.clientY - r.top) * (CH / r.height),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (phaseRef.current !== 'select') return
    const { x, y } = getPos(e)
    const hit = marblesRef.current.find(({ body, player }) => {
      if (player !== turnRef.current) return false
      const dx = body.position.x - x, dy = body.position.y - y
      return dx * dx + dy * dy <= (MR + 8) ** 2
    })
    if (hit) {
      selectedRef.current = hit
      mouseRef.current = { x, y }
      syncPhase('aim')
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseRef.current = getPos(e)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (phaseRef.current !== 'aim' || !selectedRef.current) return
    const { x, y } = getPos(e)
    const bx = selectedRef.current.body.position.x
    const by = selectedRef.current.body.position.y
    const dx = bx - x, dy = by - y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 6) {
      const power = Math.min(dist, MAX_DRAG) / MAX_DRAG
      const nx = dx / dist, ny = dy / dist
      Matter.Body.setVelocity(selectedRef.current.body, {
        x: nx * power * 22,
        y: ny * power * 22,
      })
      selectedRef.current = null
      settleRef.current = 0
      syncPhase('rolling')
    } else {
      selectedRef.current = null
      syncPhase('select')
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  const pColor = (n: Player) => n === 1 ? 'text-orange-400' : 'text-blue-400'

  const statusMsg = () => {
    if (phase === 'over') return `P${winner} 승리`
    if (phase === 'rolling') return '...'
    return `P${turn} 말 선택`
  }

  return (
    <main className="max-w-[520px] mx-auto px-4 py-4">
      <BackLink section="games / alkkagi" />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <span className={`text-xs font-mono ${turn === 1 && phase !== 'over' ? 'text-orange-400' : 'text-zinc-600'}`}>
            P1 ×{counts[1]}
          </span>
          <span className={`text-xs font-mono ${turn === 2 && phase !== 'over' ? 'text-blue-400' : 'text-zinc-600'}`}>
            P2 ×{counts[2]}
          </span>
        </div>
        <span className={`text-xs font-mono ${phase === 'over' ? pColor(winner!) : pColor(turn)}`}>
          {statusMsg()}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="w-full rounded-lg border border-zinc-800 cursor-crosshair select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] font-mono text-zinc-700">
          클릭 후 드래그 → 놓으면 발사 · 판 밖으로 나간 말은 제거
        </p>
        {phase === 'over' && (
          <button
            onClick={restart}
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
          >
            다시 시작
          </button>
        )}
      </div>
    </main>
  )
}
