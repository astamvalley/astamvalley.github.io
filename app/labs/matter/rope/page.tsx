'use client'

import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

const SEG_COUNT = 16
const SEG_LEN = 22
const BALL_RADIUS = 24

export default function RopePage() {
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
    const wallOpts = { isStatic: true, friction: 0.5, restitution: 0.4 }
    Composite.add(world, [
      Bodies.rectangle(W / 2, H + 25, W * 2, 50, wallOpts),
      Bodies.rectangle(-25, H / 2, 50, H * 2, wallOpts),
      Bodies.rectangle(W + 25, H / 2, 50, H * 2, wallOpts),
    ])

    // Scattered boxes to knock over
    const boxes: Matter.Body[] = []
    const boxPositions = [
      { x: W * 0.72, y: H - 20 - 16 },
      { x: W * 0.72 + 36, y: H - 20 - 16 },
      { x: W * 0.72 - 36, y: H - 20 - 16 },
      { x: W * 0.72, y: H - 20 - 48 },
      { x: W * 0.72 + 36, y: H - 20 - 48 },
      { x: W * 0.28, y: H - 20 - 16 },
      { x: W * 0.28 + 36, y: H - 20 - 16 },
      { x: W * 0.28, y: H - 20 - 48 },
    ]
    boxPositions.forEach(({ x, y }) => {
      const box = Bodies.rectangle(x, y, 30, 30, {
        restitution: 0.2, friction: 0.5, label: 'box',
      })
      boxes.push(box)
      Composite.add(world, box)
    })

    const pivotX = W / 2
    const pivotY = 8

    // Rope segments
    const segments: Matter.Body[] = []
    for (let i = 0; i < SEG_COUNT; i++) {
      const seg = Bodies.rectangle(pivotX, pivotY + (i + 1) * SEG_LEN, 5, SEG_LEN - 2, {
        frictionAir: 0.035,
        density: 0.0008,
        collisionFilter: { category: 0x0002, mask: 0x0000 },
        label: 'rope',
      })
      segments.push(seg)
      Composite.add(world, seg)
    }

    // Ball
    const ball = Bodies.circle(pivotX, pivotY + (SEG_COUNT + 1) * SEG_LEN + BALL_RADIUS, BALL_RADIUS, {
      restitution: 0.55,
      friction: 0.1,
      density: 0.014,
      collisionFilter: { category: 0x0001, mask: 0x0001 },
      label: 'ball',
    })
    Composite.add(world, ball)

    // Pivot constraint (fixed point in world)
    Composite.add(world, Constraint.create({
      pointA: { x: pivotX, y: pivotY },
      bodyB: segments[0],
      pointB: { x: 0, y: -SEG_LEN / 2 },
      stiffness: 1,
      length: 0,
    }))

    // Segment chain
    for (let i = 0; i < SEG_COUNT - 1; i++) {
      Composite.add(world, Constraint.create({
        bodyA: segments[i],
        bodyB: segments[i + 1],
        pointA: { x: 0, y: SEG_LEN / 2 },
        pointB: { x: 0, y: -SEG_LEN / 2 },
        stiffness: 0.7,
        damping: 0.02,
        length: 2,
      }))
    }

    // Last segment → ball
    Composite.add(world, Constraint.create({
      bodyA: segments[SEG_COUNT - 1],
      bodyB: ball,
      pointA: { x: 0, y: SEG_LEN / 2 },
      stiffness: 0.9,
      length: 4,
    }))

    // Mouse
    const mouse = Mouse.create(canvas)
    mouse.pixelRatio = dpr
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.025, damping: 0.1 },
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

      // Pivot dot
      ctx.fillStyle = 'rgba(251, 146, 60, 0.9)'
      ctx.beginPath()
      ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2)
      ctx.fill()

      // Rope
      ctx.strokeStyle = 'rgba(161, 161, 170, 0.5)'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(pivotX, pivotY)
      segments.forEach((seg) => {
        ctx.lineTo(seg.position.x, seg.position.y)
      })
      ctx.lineTo(ball.position.x, ball.position.y)
      ctx.stroke()
      ctx.lineCap = 'butt'

      // Ball
      const speed = ball.speed
      const t = Math.min(1, speed / 20)
      const r = Math.round(161 + (251 - 161) * t)
      const g = Math.round(161 + (146 - 161) * t)
      const bv = Math.round(170 + (60 - 170) * t)
      ctx.fillStyle = `rgba(${r},${g},${bv},0.9)`
      ctx.beginPath()
      ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      // Boxes
      boxes.forEach((box) => {
        const { x, y } = box.position
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(box.angle)
        ctx.fillStyle = 'rgba(228, 228, 231, 0.1)'
        ctx.strokeStyle = 'rgba(228, 228, 231, 0.4)'
        ctx.lineWidth = 1
        ctx.fillRect(-15, -15, 30, 30)
        ctx.strokeRect(-15, -15, 30, 30)
        ctx.restore()
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
      <p className="text-xs font-mono text-zinc-600 mb-3">공을 잡아서 휘두르세요</p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-grab active:cursor-grabbing"
        style={{ height: 500 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            천장에 고정된 pivot point에서 16개 세그먼트로 이루어진 밧줄이 늘어진다.
            끝의 공은 <code className="text-orange-300/80 font-mono">MouseConstraint</code>로 잡아 던질 수 있고, 주변 블록들을 날린다.
            세그먼트는 낮은 <code className="text-orange-300/80 font-mono">frictionAir</code>로 탄력 있게 흔들린다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 천장 고정점 (bodyA 없음 = 월드 좌표)
Constraint.create({
  pointA: { x: pivotX, y: 0 },   // 고정 위치
  bodyB: segments[0],
  pointB: { x: 0, y: -len/2 },   // 세그먼트 상단
  stiffness: 1,
  length: 0,
})`}</pre>
        </div>
      </div>
    </div>
  )
}
