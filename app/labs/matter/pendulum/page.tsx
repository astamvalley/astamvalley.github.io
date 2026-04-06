'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

const COUNT = 15
const BASE_LENGTH = 80
const LENGTH_STEP = 14
const BALL_RADIUS = 7
const PIVOT_Y_RATIO = 0.18

export default function PendulumPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(true)

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

    const { Engine, Runner, Bodies, Composite, Constraint } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 1.5 } })
    const world = engine.world

    const pivotY = H * PIVOT_Y_RATIO
    const spacing = W / (COUNT + 1)

    const balls: Matter.Body[] = []
    const pivotXs: number[] = []

    for (let i = 0; i < COUNT; i++) {
      const px = spacing * (i + 1)
      const len = BASE_LENGTH + i * LENGTH_STEP
      pivotXs.push(px)

      // Start all balls at same angle (pulled to the right)
      const startAngle = -Math.PI / 5
      const bx = px + Math.sin(startAngle) * len
      const by = pivotY + Math.cos(startAngle) * len

      const ball = Bodies.circle(bx, by, BALL_RADIUS, {
        restitution: 0.0,
        friction: 0.0,
        frictionAir: 0.0005,
        density: 0.03,
        label: 'pendulum',
      })
      balls.push(ball)
      Composite.add(world, ball)

      Composite.add(world, Constraint.create({
        pointA: { x: px, y: pivotY },
        bodyB: ball,
        length: len,
        stiffness: 1,
        damping: 0.0,
      }))
    }

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number
    let t = 0

    const hue = (i: number) => {
      // Rainbow across pendulums
      const h = (i / COUNT) * 300 + 180
      return h
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Pivot bar
      ctx.strokeStyle = 'rgba(161,161,170,0.25)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(spacing * 0.5, pivotY)
      ctx.lineTo(spacing * (COUNT + 0.5), pivotY)
      ctx.stroke()

      balls.forEach((ball, i) => {
        const px = pivotXs[i]
        const len = BASE_LENGTH + i * LENGTH_STEP
        const h = hue(i)

        // Trail effect: render faint history
        const speed = ball.speed
        const alpha = 0.3 + Math.min(0.65, speed / 8)

        // String
        ctx.strokeStyle = `hsla(${h},50%,55%,0.25)`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px, pivotY)
        ctx.lineTo(ball.position.x, ball.position.y)
        ctx.stroke()

        // Pivot dot
        ctx.beginPath()
        ctx.arc(px, pivotY, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${h},60%,65%,0.5)`
        ctx.fill()

        // Ball
        ctx.beginPath()
        ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${h},70%,65%,${alpha})`
        ctx.fill()
        ctx.strokeStyle = `hsla(${h},70%,75%,0.5)`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      t++
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
      <p className="text-xs font-mono text-zinc-600 mb-3">길이가 다른 {COUNT}개의 진자 — 주기 차이가 파동 패턴을 만든다</p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none"
        style={{ height: 520 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            단진자의 주기는 <code className="text-orange-300/80 font-mono">T = 2π√(L/g)</code>로 길이에만 의존한다.
            {COUNT}개의 진자가 각기 다른 길이({BASE_LENGTH}px ~ {BASE_LENGTH + (COUNT - 1) * LENGTH_STEP}px)를 가지면
            출발은 같지만 각자 다른 속도로 진동한다. 파동, 수렴, 분산 패턴이 주기적으로 나타난다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 진자마다 다른 길이
const len = BASE_LENGTH + i * LENGTH_STEP

// 같은 시작 각도로 출발
const angle = -Math.PI / 5
const bx = pivotX + Math.sin(angle) * len
const by = pivotY + Math.cos(angle) * len

Constraint.create({
  pointA: { x: pivotX, y: pivotY },
  bodyB: ball,
  length: len,       // 주기를 결정하는 핵심 값
  stiffness: 1,
  damping: 0.0,      // 에너지 손실 없음
})`}</pre>
        </div>
      </div>
    </div>
  )
}
