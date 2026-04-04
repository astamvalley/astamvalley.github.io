'use client'

import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

const PARTICLE_COUNT = 14
const RING_RADIUS = 48
const PARTICLE_RADIUS = 9

function createBlob(cx: number, cy: number, world: Matter.Composite, Composite: typeof Matter.Composite, Bodies: typeof Matter.Bodies, Constraint: typeof Matter.Constraint) {
  const particles: Matter.Body[] = []

  // Ring particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2
    const x = cx + Math.cos(angle) * RING_RADIUS
    const y = cy + Math.sin(angle) * RING_RADIUS
    const p = Bodies.circle(x, y, PARTICLE_RADIUS, {
      restitution: 0.45,
      friction: 0.05,
      frictionAir: 0.008,
      label: 'blob',
    })
    particles.push(p)
  }

  // Center particle (invisible anchor)
  const center = Bodies.circle(cx, cy, 2, {
    collisionFilter: { mask: 0x0000 },
    frictionAir: 0.02,
    label: 'blob-center',
  })

  Composite.add(world, [...particles, center])

  // Connect ring neighbors
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const next = (i + 1) % PARTICLE_COUNT
    Composite.add(world, Constraint.create({
      bodyA: particles[i],
      bodyB: particles[next],
      stiffness: 0.35,
      damping: 0.02,
    }))
  }

  // Connect to center (volume spring)
  particles.forEach((p) => {
    Composite.add(world, Constraint.create({
      bodyA: center,
      bodyB: p,
      stiffness: 0.06,
      damping: 0.01,
    }))
  })

  // Cross-bracing (skip-1 connections)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const skip = (i + Math.floor(PARTICLE_COUNT / 3)) % PARTICLE_COUNT
    Composite.add(world, Constraint.create({
      bodyA: particles[i],
      bodyB: particles[skip],
      stiffness: 0.08,
      damping: 0.01,
    }))
  }

  return { particles, center }
}

export default function SoftbodyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    const { Engine, Runner, Bodies, Composite, Constraint, Mouse, MouseConstraint } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } })
    const world = engine.world

    // Floor & walls
    const wallOpts = { isStatic: true, friction: 0.3, restitution: 0.5 }
    Composite.add(world, [
      Bodies.rectangle(W / 2, H + 25, W * 2, 50, wallOpts),
      Bodies.rectangle(-25, H / 2, 50, H * 2, wallOpts),
      Bodies.rectangle(W + 25, H / 2, 50, H * 2, wallOpts),
    ])

    const blobs: Array<{ particles: Matter.Body[]; center: Matter.Body }> = []

    // Spawn 3 blobs
    const positions = [
      { x: W * 0.25, y: 80 },
      { x: W * 0.5,  y: 50 },
      { x: W * 0.75, y: 80 },
    ]
    positions.forEach(({ x, y }) => {
      blobs.push(createBlob(x, y, world, Composite, Bodies, Constraint))
    })

    // Mouse
    const mouse = Mouse.create(canvas)
    mouse.pixelRatio = dpr
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.04, damping: 0.1 },
    })
    Composite.add(world, mc)

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Floor
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(0, H - 20)
      ctx.lineTo(W, H - 20)
      ctx.stroke()
      ctx.setLineDash([])

      const blobColors = [
        { fill: 'rgba(251, 146, 60, 0.18)', stroke: 'rgba(251, 146, 60, 0.7)' },
        { fill: 'rgba(167, 139, 250, 0.18)', stroke: 'rgba(167, 139, 250, 0.7)' },
        { fill: 'rgba(52, 211, 153, 0.18)',  stroke: 'rgba(52, 211, 153, 0.7)' },
      ]

      blobs.forEach((blob, bi) => {
        const { particles } = blob
        const color = blobColors[bi % blobColors.length]

        // Draw blob outline (convex hull approximation = just connect ring in order)
        ctx.beginPath()
        particles.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.position.x, p.position.y)
          else ctx.lineTo(p.position.x, p.position.y)
        })
        ctx.closePath()
        ctx.fillStyle = color.fill
        ctx.fill()
        ctx.strokeStyle = color.stroke
        ctx.lineWidth = 2
        ctx.stroke()

        // Particles
        particles.forEach((p) => {
          ctx.fillStyle = color.stroke.replace('0.7', '0.8')
          ctx.beginPath()
          ctx.arc(p.position.x, p.position.y, PARTICLE_RADIUS - 3, 0, Math.PI * 2)
          ctx.fill()
        })
      })

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
      <p className="text-xs font-mono text-zinc-600 mb-3">마우스로 잡아서 던져보세요</p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-grab active:cursor-grabbing"
        style={{ height: 460 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            링 형태로 배치된 파티클을 <code className="text-orange-300/80 font-mono">Constraint</code>로 연결해 젤리 같은 소프트바디를 만든다.
            인접 파티클 연결(구조), 중심 연결(부피 유지), 대각 연결(강성 보강) 세 종류의 스프링이 조합된다.
            바닥에 떨어지면 찌부러졌다 튕겨오른다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 세 종류의 Constraint
// 1. 인접 링 연결 (구조)
Constraint.create({ bodyA: p[i], bodyB: p[i+1], stiffness: 0.35 })

// 2. 중심 연결 (부피 유지)
Constraint.create({ bodyA: center, bodyB: p[i], stiffness: 0.06 })

// 3. 대각 연결 (강성 보강)
Constraint.create({ bodyA: p[i], bodyB: p[i + N/3], stiffness: 0.08 })`}</pre>
        </div>
      </div>
    </div>
  )
}
