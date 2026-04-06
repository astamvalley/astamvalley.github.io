'use client'

import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

const COUNT = 5
const BALL_RADIUS = 22
const STRING_LENGTH = 180
const SPACING = BALL_RADIUS * 2 + 2

export default function CradlePage() {
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
    const engine = Engine.create({ gravity: { x: 0, y: 1.5 } })
    const world = engine.world

    const totalW = COUNT * SPACING
    const startX = W / 2 - totalW / 2 + BALL_RADIUS
    const pivotY = H / 2 - STRING_LENGTH

    const balls: Matter.Body[] = []
    const constraints: Matter.Constraint[] = []

    for (let i = 0; i < COUNT; i++) {
      const bx = startX + i * SPACING
      const by = pivotY + STRING_LENGTH

      const ball = Bodies.circle(bx, by, BALL_RADIUS, {
        restitution: 0.99,
        friction: 0.0,
        frictionAir: 0.001,
        density: 0.05,
        label: 'ball',
      })
      balls.push(ball)
      Composite.add(world, ball)

      const c = Constraint.create({
        pointA: { x: bx, y: pivotY },
        bodyB: ball,
        length: STRING_LENGTH,
        stiffness: 1,
        damping: 0.001,
      })
      constraints.push(c)
      Composite.add(world, c)
    }

    // Pull first ball to the left
    Matter.Body.setPosition(balls[0], {
      x: startX - STRING_LENGTH * 0.65,
      y: pivotY + STRING_LENGTH * 0.76,
    })
    Matter.Body.setVelocity(balls[0], { x: 0, y: 0 })

    // Mouse
    const mouse = Mouse.create(canvas)
    mouse.pixelRatio = dpr
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.02, damping: 0.1 },
    })
    Composite.add(world, mc)

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Crossbar
      const barX1 = startX - BALL_RADIUS - 20
      const barX2 = startX + (COUNT - 1) * SPACING + BALL_RADIUS + 20
      ctx.strokeStyle = 'rgba(161,161,170,0.4)'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(barX1, pivotY)
      ctx.lineTo(barX2, pivotY)
      ctx.stroke()

      // Left support
      ctx.strokeStyle = 'rgba(63,63,70,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(barX1, pivotY)
      ctx.lineTo(barX1, pivotY + STRING_LENGTH + BALL_RADIUS + 30)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(barX2, pivotY)
      ctx.lineTo(barX2, pivotY + STRING_LENGTH + BALL_RADIUS + 30)
      ctx.stroke()

      // Strings
      balls.forEach((ball, i) => {
        const px = startX + i * SPACING
        ctx.strokeStyle = 'rgba(161,161,170,0.5)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(px, pivotY)
        ctx.lineTo(ball.position.x, ball.position.y)
        ctx.stroke()
      })

      // Balls
      balls.forEach((ball) => {
        const speed = ball.speed
        const t = Math.min(1, speed / 10)
        const r = Math.round(200 + (251 - 200) * t)
        const g = Math.round(200 + (146 - 200) * t)
        const b = Math.round(210 + (60 - 210) * t)

        // Shadow
        ctx.beginPath()
        ctx.arc(ball.position.x + 3, ball.position.y + 3, BALL_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.2)'
        ctx.fill()

        // Ball
        ctx.beginPath()
        ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2)
        const grad = ctx.createRadialGradient(
          ball.position.x - BALL_RADIUS * 0.3,
          ball.position.y - BALL_RADIUS * 0.3,
          BALL_RADIUS * 0.1,
          ball.position.x,
          ball.position.y,
          BALL_RADIUS,
        )
        grad.addColorStop(0, `rgba(${r + 30},${g + 30},${b + 30},0.95)`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0.85)`)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`
        ctx.lineWidth = 1.5
        ctx.stroke()
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
      <p className="text-xs font-mono text-zinc-600 mb-3">공을 잡아 당겼다 놓으세요 — 운동량이 전달됩니다</p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-grab active:cursor-grabbing"
        style={{ height: 460 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            뉴턴의 요람. 5개의 강철 공이 실로 매달려 있고, 한쪽 끝 공의 운동량이 순간적으로 반대편 끝으로 전달된다.
            높은 <code className="text-orange-300/80 font-mono">restitution(0.99)</code>과 낮은 마찰로 에너지 손실을 최소화한다.
            마우스로 공을 잡아 원하는 높이까지 끌어올렸다 놓으면 실제 뉴턴의 요람처럼 반응한다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 각 공: 고정점에서 단진자 Constraint
Constraint.create({
  pointA: { x: pivotX, y: pivotY }, // 천장 고정점
  bodyB: ball,
  length: STRING_LENGTH,
  stiffness: 1,
  damping: 0.001,  // 에너지 손실 최소
})

// 공 물성
Bodies.circle(x, y, R, {
  restitution: 0.99,  // 거의 완전 탄성 충돌
  friction: 0.0,
  frictionAir: 0.001,
})`}</pre>
        </div>
      </div>
    </div>
  )
}
