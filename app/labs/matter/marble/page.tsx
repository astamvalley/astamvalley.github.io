'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

const MARBLE_RADIUS = 9
const SPAWN_INTERVAL = 40  // frames between marble spawns
const MAX_MARBLES = 40

export default function MarblePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } })
    const world = engine.world

    const rampOpts = { isStatic: true, friction: 0.3, restitution: 0.15, label: 'ramp' }

    // Build ramp track
    const ramps: Matter.Body[] = []

    const addRamp = (x: number, y: number, len: number, angleDeg: number) => {
      const r = Bodies.rectangle(x, y, len, 10, {
        ...rampOpts,
        angle: (angleDeg * Math.PI) / 180,
      })
      ramps.push(r)
      Composite.add(world, r)
    }

    // Floor
    Composite.add(world, Bodies.rectangle(W / 2, H + 25, W * 2, 50, { isStatic: true }))
    // Side walls
    Composite.add(world, [
      Bodies.rectangle(-20, H / 2, 40, H * 2, { isStatic: true }),
      Bodies.rectangle(W + 20, H / 2, 40, H * 2, { isStatic: true }),
    ])

    // Ramp layout (zigzag track)
    const margin = 30
    const rampLen = W * 0.55

    addRamp(W * 0.32, H * 0.18, rampLen, 8)     // R1: slight right slope
    addRamp(W * 0.68, H * 0.35, rampLen, -10)    // R2: left slope
    addRamp(W * 0.32, H * 0.52, rampLen, 7)      // R3
    addRamp(W * 0.68, H * 0.67, rampLen, -9)     // R4
    addRamp(W * 0.38, H * 0.82, rampLen * 0.8, 5) // R5: final chute

    // Bumpers
    const bumperOpts = { isStatic: true, restitution: 0.7, friction: 0.1, label: 'bumper' }
    Composite.add(world, [
      Bodies.circle(W * 0.5, H * 0.27, 12, bumperOpts),
      Bodies.circle(W * 0.35, H * 0.44, 12, bumperOpts),
      Bodies.circle(W * 0.65, H * 0.60, 12, bumperOpts),
      Bodies.circle(W * 0.45, H * 0.74, 12, bumperOpts),
    ])

    // Marble colors (hue cycle)
    const marbleColors = [
      '#fb923c', '#a78bfa', '#34d399', '#60a5fa', '#f472b6', '#fbbf24',
    ]

    const marbles: { body: Matter.Body; color: string }[] = []
    let spawnTimer = 0
    let colorIdx = 0

    const spawnMarble = () => {
      if (marbles.length >= MAX_MARBLES) {
        // Remove oldest
        const oldest = marbles.shift()!
        Composite.remove(world, oldest.body)
        setCount((n) => n - 1)
      }
      const spawnX = W * 0.12 + Math.random() * W * 0.15
      const marble = Bodies.circle(spawnX, H * 0.06, MARBLE_RADIUS, {
        restitution: 0.4,
        friction: 0.15,
        density: 0.02,
        label: 'marble',
      })
      const color = marbleColors[colorIdx % marbleColors.length]
      colorIdx++
      marbles.push({ body: marble, color })
      Composite.add(world, marble)
      setCount((n) => n + 1)
    }

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number
    let frame = 0

    const draw = () => {
      frame++
      if (frame % SPAWN_INTERVAL === 0) spawnMarble()

      ctx.clearRect(0, 0, W, H)

      // Draw ramps
      ramps.forEach((ramp) => {
        const verts = ramp.vertices
        ctx.beginPath()
        ctx.moveTo(verts[0].x, verts[0].y)
        verts.forEach((v) => ctx.lineTo(v.x, v.y))
        ctx.closePath()
        ctx.fillStyle = 'rgba(63,63,70,0.6)'
        ctx.strokeStyle = 'rgba(161,161,170,0.5)'
        ctx.lineWidth = 1.5
        ctx.fill()
        ctx.stroke()
      })

      // Draw bumpers
      Composite.allBodies(world).forEach((body) => {
        if (body.label !== 'bumper') return
        ctx.beginPath()
        ctx.arc(body.position.x, body.position.y, 12, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(251,146,60,0.15)'
        ctx.strokeStyle = 'rgba(251,146,60,0.6)'
        ctx.lineWidth = 1.5
        ctx.fill()
        ctx.stroke()
      })

      // Draw marbles
      marbles.forEach(({ body, color }) => {
        const { x, y } = body.position
        const speed = body.speed
        const t = Math.min(1, speed / 12)

        ctx.beginPath()
        ctx.arc(x, y, MARBLE_RADIUS, 0, Math.PI * 2)
        const grad = ctx.createRadialGradient(
          x - MARBLE_RADIUS * 0.3,
          y - MARBLE_RADIUS * 0.3,
          MARBLE_RADIUS * 0.1,
          x, y, MARBLE_RADIUS,
        )
        grad.addColorStop(0, color + 'ee')
        grad.addColorStop(1, color + '88')
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = color + '55'
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Floor line
      ctx.strokeStyle = 'rgba(63,63,70,0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(0, H - 20)
      ctx.lineTo(W, H - 20)
      ctx.stroke()
      ctx.setLineDash([])

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      Runner.stop(runner)
      Engine.clear(engine)
      Composite.clear(world, false)
    }
  }, [])

  return (
    <div>
      <p className="text-xs font-mono text-zinc-600 mb-3">구슬이 경사로를 따라 굴러내립니다 — <span className="text-zinc-500">구슬 {count}개</span></p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none"
        style={{ height: 520 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            5개의 경사 ramp와 4개의 탄성 bumper로 지그재그 트랙을 구성했다.
            매 {SPAWN_INTERVAL}프레임마다 새 구슬이 상단에서 떨어지고, 최대 {MAX_MARBLES}개를 유지한다.
            경사 각도와 마찰을 조합해 구슬이 자연스럽게 흘러내리면서도 좌우로 튀도록 설계했다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 경사로: 각도를 라디안으로 변환
Bodies.rectangle(x, y, length, 10, {
  isStatic: true,
  friction: 0.3,
  restitution: 0.15,
  angle: (angleDeg * Math.PI) / 180,
})

// 탄성 bumper
Bodies.circle(x, y, 12, {
  isStatic: true,
  restitution: 0.7,  // 높은 반발
  friction: 0.1,
})

// 주기적 구슬 생성
if (frame % SPAWN_INTERVAL === 0) spawnMarble()`}</pre>
        </div>
      </div>
    </div>
  )
}
