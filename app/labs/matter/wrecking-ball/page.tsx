'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

const LINK_COUNT = 10
const LINK_LEN = 28
const BALL_RADIUS = 28
const BOX_W = 30
const BOX_H = 30
const STACK_COLS = 6
const STACK_ROWS = 9

function buildScene(world: Matter.World, W: number, H: number, Matter: typeof import('matter-js')) {
  const { Bodies, Composite, Constraint } = Matter

  // Floor & side walls
  Composite.add(world, [
    Bodies.rectangle(W / 2, H + 25, W * 2, 50, { isStatic: true, friction: 0.8, label: 'floor' }),
    Bodies.rectangle(-25, H / 2, 50, H * 2, { isStatic: true, label: 'wall' }),
    Bodies.rectangle(W + 25, H / 2, 50, H * 2, { isStatic: true, label: 'wall' }),
  ])

  // Helper: create one wrecking ball assembly
  const makeWreckingBall = (anchorX: number) => {
    const anchorY = 12
    const anchor = Bodies.circle(anchorX, anchorY, 4, {
      isStatic: true,
      collisionFilter: { mask: 0x0000 },
      label: 'anchor',
    })
    Composite.add(world, anchor)

    const links: Matter.Body[] = []
    for (let i = 0; i < LINK_COUNT; i++) {
      const link = Bodies.rectangle(anchorX, anchorY + (i + 1) * LINK_LEN, 6, LINK_LEN - 4, {
        frictionAir: 0.008,
        density: 0.001,
        collisionFilter: { category: 0x0002, mask: 0x0000 },
        label: 'link',
      })
      links.push(link)
      Composite.add(world, link)
    }

    const ball = Bodies.circle(anchorX, anchorY + (LINK_COUNT + 1) * LINK_LEN + BALL_RADIUS, BALL_RADIUS, {
      restitution: 0.3,
      friction: 0.05,
      density: 0.02,
      collisionFilter: { category: 0x0001, mask: 0x0001 },
      label: 'ball',
    })
    Composite.add(world, ball)

    // Anchor → first link
    Composite.add(world, Constraint.create({
      bodyA: anchor,
      bodyB: links[0],
      pointB: { x: 0, y: -LINK_LEN / 2 },
      length: 2,
      stiffness: 0.9,
    }))
    for (let i = 0; i < LINK_COUNT - 1; i++) {
      Composite.add(world, Constraint.create({
        bodyA: links[i],
        bodyB: links[i + 1],
        pointA: { x: 0, y: LINK_LEN / 2 },
        pointB: { x: 0, y: -LINK_LEN / 2 },
        length: 2,
        stiffness: 0.85,
      }))
    }
    Composite.add(world, Constraint.create({
      bodyA: links[LINK_COUNT - 1],
      bodyB: ball,
      pointA: { x: 0, y: LINK_LEN / 2 },
      length: 4,
      stiffness: 0.9,
    }))

    return { anchor, links, ball }
  }

  // Two wrecking balls — left and right
  const left = makeWreckingBall(W * 0.22)
  const right = makeWreckingBall(W * 0.78)

  // Pull left ball slightly right, right ball slightly left for initial swing
  Matter.Body.setPosition(left.ball, {
    x: left.ball.position.x + 60,
    y: left.ball.position.y - 20,
  })
  Matter.Body.setPosition(right.ball, {
    x: right.ball.position.x - 60,
    y: right.ball.position.y - 20,
  })

  // Center block tower (wide pyramid-ish)
  const boxes: Matter.Body[] = []
  const stackX = W * 0.5
  const stackBaseY = H - 20 - BOX_H / 2

  for (let row = 0; row < STACK_ROWS; row++) {
    const cols = STACK_COLS - Math.floor(row * 0.3)
    const offset = row % 2 === 0 ? 0 : BOX_W * 0.5
    for (let col = 0; col < cols; col++) {
      const bx = stackX - ((cols - 1) / 2) * BOX_W + col * BOX_W + offset
      const by = stackBaseY - row * BOX_H
      const box = Bodies.rectangle(bx, by, BOX_W - 1, BOX_H - 1, {
        restitution: 0.1,
        friction: 0.6,
        collisionFilter: { category: 0x0001, mask: 0x0001 },
        label: 'box',
      })
      boxes.push(box)
      Composite.add(world, box)
    }
  }

  // Two smaller side piles
  const addPile = (cx: number, rows: number) => {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < 3; col++) {
        const bx = cx - BOX_W + col * BOX_W
        const by = stackBaseY - row * BOX_H
        const box = Bodies.rectangle(bx, by, BOX_W - 1, BOX_H - 1, {
          restitution: 0.15,
          friction: 0.6,
          collisionFilter: { category: 0x0001, mask: 0x0001 },
          label: 'box',
        })
        boxes.push(box)
        Composite.add(world, box)
      }
    }
  }
  addPile(W * 0.36, 5)
  addPile(W * 0.64, 5)

  return { left, right, boxes }
}

export default function WreckingBallPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [simKey, setSimKey] = useState(0)

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

    const MatterLib = Matter
    const { Engine, Runner, Composite, Mouse, MouseConstraint, Events } = MatterLib
    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } })
    const world = engine.world

    const { left, right, boxes } = buildScene(world, W, H, MatterLib)
    const balls = [left.ball, right.ball]
    const allLinks = [...left.links, ...right.links]
    const allAnchors = [left.anchor, right.anchor]

    const mouse = Mouse.create(canvas)
    mouse.pixelRatio = dpr
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.015, damping: 0.1 },
    })
    Composite.add(world, mc)

    const runner = Runner.create()
    Runner.run(runner, engine)

    // Particle system for impact effects
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }
    const particles: Particle[] = []

    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair
        const isBallHit = (b: Matter.Body) => b.label === 'ball' && b.speed > 4
        if (!isBallHit(bodyA) && !isBallHit(bodyB)) return
        const pos = bodyA.label === 'ball' ? bodyA.position : bodyB.position
        const speed = Math.max(bodyA.speed, bodyB.speed)
        const count = Math.floor(Math.min(20, speed * 1.5))
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const v = 1.5 + Math.random() * speed * 0.4
          particles.push({
            x: pos.x, y: pos.y,
            vx: Math.cos(angle) * v,
            vy: Math.sin(angle) * v - 2,
            life: 30 + Math.floor(Math.random() * 20),
            maxLife: 50,
          })
        }
      })
    })

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Floor line
      ctx.strokeStyle = 'rgba(63,63,70,0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(0, H - 20)
      ctx.lineTo(W, H - 20)
      ctx.stroke()
      ctx.setLineDash([])

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.life--
        if (p.life <= 0) { particles.splice(i, 1); continue }
        const alpha = (p.life / p.maxLife) * 0.8
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251,146,60,${alpha})`
        ctx.fill()
      }

      // Anchor dots
      allAnchors.forEach((anchor) => {
        ctx.fillStyle = 'rgba(251,146,60,0.9)'
        ctx.beginPath()
        ctx.arc(anchor.position.x, anchor.position.y, 5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Chain lines
      ;[
        [left.anchor, ...left.links, left.ball],
        [right.anchor, ...right.links, right.ball],
      ].forEach((chain) => {
        ctx.strokeStyle = 'rgba(161,161,170,0.5)'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        chain.forEach((b, i) => {
          if (i === 0) ctx.moveTo(b.position.x, b.position.y)
          else ctx.lineTo(b.position.x, b.position.y)
        })
        ctx.stroke()
      })

      // Balls
      balls.forEach((ball) => {
        const speed = ball.speed
        const t = Math.min(1, speed / 16)
        const r = Math.round(161 + (251 - 161) * t)
        const g = Math.round(161 + (146 - 161) * t)
        const bv = Math.round(170 + (60 - 170) * t)

        // Motion blur ring
        if (speed > 3) {
          ctx.beginPath()
          ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS + speed * 0.8, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${r},${g},${bv},${0.08 * t})`
          ctx.lineWidth = speed * 0.5
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${bv},0.92)`
        ctx.fill()
        ctx.strokeStyle = `rgba(${r},${g},${bv},0.4)`
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // Boxes
      boxes.forEach((box) => {
        const { x, y } = box.position
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(box.angle)
        ctx.fillStyle = 'rgba(228,228,231,0.11)'
        ctx.strokeStyle = 'rgba(228,228,231,0.4)'
        ctx.lineWidth = 1
        ctx.fillRect(-BOX_W / 2, -BOX_H / 2, BOX_W, BOX_H)
        ctx.strokeRect(-BOX_W / 2, -BOX_H / 2, BOX_W, BOX_H)
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
  }, [simKey])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-zinc-600">두 개의 철구가 흔들립니다 — 마우스로 잡아서 던지세요</p>
        <button
          onClick={() => setSimKey((k) => k + 1)}
          className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded transition-colors"
        >
          reset
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-grab active:cursor-grabbing"
        style={{ height: 520 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            두 개의 철구가 각각 독립적인 <code className="text-orange-300/80 font-mono">Constraint</code> 체인으로
            천장에 매달려 있다. 충돌 이벤트에서 속도가 임계값을 넘으면 파티클이 방출된다.
            중앙 타워(9단)와 양쪽 보조 더미까지 세 곳을 동시에 공략할 수 있다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 충돌 시 파티클 생성
Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    const speed = Math.max(bodyA.speed, bodyB.speed)
    if (speed < 4) return
    for (let i = 0; i < speed * 1.5; i++) {
      particles.push({
        x: impactPos.x, y: impactPos.y,
        vx: cos(angle) * v, vy: sin(angle) * v,
        life: 40,
      })
    }
  })
})`}</pre>
        </div>
      </div>
    </div>
  )
}
